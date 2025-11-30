import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GearItem, RaceItem } from "@/lib/types";
import { findSimilarItems } from "@/lib/utils/fuzzy-match";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  duplicateItem?: GearItem | RaceItem;
  similarItems?: (GearItem | RaceItem)[];
}

/**
 * Step 2: Check for exact match on unique identifiers
 */
export async function checkExactGearMatch(
  brand: string,
  productName: string,
  msrp: number,
  mpn?: string
): Promise<ValidationResult> {
  try {
    const gearRef = collection(db, "gear");

    // If MPN/SKU is provided, check it first (primary unique identifier)
    if (mpn && mpn.trim()) {
      const mpnQuery = query(gearRef, where("mpn", "==", mpn.trim()));
      const mpnSnapshot = await getDocs(mpnQuery);

      if (!mpnSnapshot.empty) {
        return {
          isValid: false,
          error: "This item already exists (matching MPN/SKU). Please review this item instead.",
          duplicateItem: {
            ...mpnSnapshot.docs[0].data(),
            productId: mpnSnapshot.docs[0].id,
            createdAt: mpnSnapshot.docs[0].data().createdAt?.toDate() || new Date(),
            updatedAt: mpnSnapshot.docs[0].data().updatedAt?.toDate() || new Date(),
          } as GearItem,
        };
      }
    }

    // Check composite key: Brand + ProductName + MSRP
    const compositeQuery = query(
      gearRef,
      where("brand", "==", brand),
      where("productName", "==", productName),
      where("msrp", "==", msrp)
    );
    const compositeSnapshot = await getDocs(compositeQuery);

    if (!compositeSnapshot.empty) {
      return {
        isValid: false,
        error: "This item already exists (matching Brand + Product Name + Price). Please review this item instead.",
        duplicateItem: {
          ...compositeSnapshot.docs[0].data(),
          productId: compositeSnapshot.docs[0].id,
          createdAt: compositeSnapshot.docs[0].data().createdAt?.toDate() || new Date(),
          updatedAt: compositeSnapshot.docs[0].data().updatedAt?.toDate() || new Date(),
        } as GearItem,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error checking gear match:", error);
    return {
      isValid: false,
      error: "Failed to validate item. Please try again.",
    };
  }
}

/**
 * Step 2: Check for exact race match on composite key
 */
export async function checkExactRaceMatch(
  raceName: string,
  distance: string,
  city: string,
  state: string
): Promise<ValidationResult> {
  try {
    const racesRef = collection(db, "races");

    // Composite key: Race Name + Distance + Location
    const compositeQuery = query(
      racesRef,
      where("raceName", "==", raceName),
      where("distance", "==", distance)
    );
    const compositeSnapshot = await getDocs(compositeQuery);

    // Check location match in results (Firestore doesn't support nested where clauses)
    const exactMatch = compositeSnapshot.docs.find((doc) => {
      const data = doc.data();
      return (
        data.location?.city?.toLowerCase() === city.toLowerCase() &&
        data.location?.state?.toLowerCase() === state.toLowerCase()
      );
    });

    if (exactMatch) {
      return {
        isValid: false,
        error: "This race already exists (matching Name + Distance + Location). Please review this race instead.",
        duplicateItem: {
          ...exactMatch.data(),
          raceId: exactMatch.id,
          raceDate: exactMatch.data().raceDate?.toDate() || new Date(),
          createdAt: exactMatch.data().createdAt?.toDate() || new Date(),
          updatedAt: exactMatch.data().updatedAt?.toDate() || new Date(),
        } as RaceItem,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error checking race match:", error);
    return {
      isValid: false,
      error: "Failed to validate race. Please try again.",
    };
  }
}

/**
 * Step 3: Check for fuzzy/similar matches
 */
export async function checkSimilarGear(
  brand: string,
  productName: string,
  subCategory: string
): Promise<ValidationResult> {
  try {
    const gearRef = collection(db, "gear");
    const similarQuery = query(
      gearRef,
      where("brand", "==", brand),
      where("subCategory", "==", subCategory)
    );
    const snapshot = await getDocs(similarQuery);

    const items = snapshot.docs.map((doc) => ({
      ...doc.data(),
      productId: doc.id,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as GearItem[];

    const similarItems = findSimilarItems(productName, items, 85);

    if (similarItems.length > 0) {
      return {
        isValid: true, // Not blocking, just warning
        similarItems,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error checking similar gear:", error);
    return { isValid: true }; // Don't block on fuzzy match errors
  }
}

/**
 * Step 3: Check for fuzzy/similar race matches
 */
export async function checkSimilarRace(
  raceName: string,
  city: string,
  state: string
): Promise<ValidationResult> {
  try {
    const racesRef = collection(db, "races");
    const snapshot = await getDocs(racesRef);

    const items = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          ...data,
          raceId: doc.id,
          raceDate: data.raceDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as RaceItem;
      })
      .filter((item) => {
        // Only check races in the same location
        return (
          item.location?.city?.toLowerCase() === city.toLowerCase() &&
          item.location?.state?.toLowerCase() === state.toLowerCase()
        );
      });

    const similarItems = findSimilarItems(raceName, items, 85);

    if (similarItems.length > 0) {
      return {
        isValid: true, // Not blocking, just warning
        similarItems,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error checking similar races:", error);
    return { isValid: true }; // Don't block on fuzzy match errors
  }
}
