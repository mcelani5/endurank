import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  User,
  GearItem,
  RaceItem,
  Review,
  UserTier,
  TIER_THRESHOLDS,
} from "./types";

// Collection names
export const COLLECTIONS = {
  USERS: "users",
  GEAR: "gear",
  RACES: "races",
  REVIEWS: "reviews",
  IMPORTED_REVIEWS: "importedReviews",
};

/**
 * Determine user tier based on review count
 */
export function getUserTier(reviewCount: number): UserTier {
  if (reviewCount >= TIER_THRESHOLDS.expert.min) return "expert";
  if (reviewCount >= TIER_THRESHOLDS.contributor.min) return "contributor";
  return "beginner";
}

/**
 * Create or update user document
 */
export async function upsertUser(user: Partial<User> & { uid: string }) {
  const userRef = doc(db, COLLECTIONS.USERS, user.uid);
  const now = new Date();

  const userData = {
    ...user,
    tier: getUserTier(user.reviewCount || 0),
    updatedAt: now,
  };

  await setDoc(userRef, userData, { merge: true });
  return userData;
}

/**
 * Get user by ID
 */
export async function getUser(uid: string): Promise<User | null> {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return null;

  const data = userSnap.data();
  return {
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as User;
}

/**
 * Get gear item by ID
 */
export async function getGearItem(productId: string): Promise<GearItem | null> {
  const gearRef = doc(db, COLLECTIONS.GEAR, productId);
  const gearSnap = await getDoc(gearRef);

  if (!gearSnap.exists()) return null;

  const data = gearSnap.data();
  return {
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as GearItem;
}

/**
 * Get race item by ID
 */
export async function getRaceItem(raceId: string): Promise<RaceItem | null> {
  const raceRef = doc(db, COLLECTIONS.RACES, raceId);
  const raceSnap = await getDoc(raceRef);

  if (!raceSnap.exists()) return null;

  const data = raceSnap.data();
  return {
    ...data,
    raceDate: data.raceDate?.toDate(),
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as RaceItem;
}

/**
 * Get reviews for a specific item
 */
export async function getReviewsForItem(
  itemId: string,
  itemType: "gear" | "race"
): Promise<Review[]> {
  const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
  const q = query(
    reviewsRef,
    where("itemId", "==", itemId),
    where("itemType", "==", itemType),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Review;
  });
}

/**
 * Add a review and update user's review count
 */
export async function addReview(review: Omit<Review, "reviewId">) {
  const reviewRef = doc(collection(db, COLLECTIONS.REVIEWS));
  const reviewData = {
    ...review,
    reviewId: reviewRef.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(reviewRef, reviewData);

  // Update user's review count and tier
  const userRef = doc(db, COLLECTIONS.USERS, review.userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const currentCount = userSnap.data().reviewCount || 0;
    const newCount = currentCount + 1;
    const newTier = getUserTier(newCount);

    await updateDoc(userRef, {
      reviewCount: newCount,
      tier: newTier,
      updatedAt: new Date(),
    });
  }

  return reviewData;
}
