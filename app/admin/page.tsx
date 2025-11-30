"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GearSubCategory, RaceDistance } from "@/lib/types";
import { Loader2, AlertTriangle } from "lucide-react";
import { getBrandsForCategory } from "@/lib/constants/brands";
import {
  checkExactGearMatch,
  checkExactRaceMatch,
  checkSimilarGear,
  checkSimilarRace,
} from "@/lib/validation/item-validation";
import Link from "next/link";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [gearFormData, setGearFormData] = useState({
    productName: "",
    brand: "",
    subCategory: "bikes" as GearSubCategory,
    msrp: "",
    mpn: "", // Optional MPN/SKU
  });

  const [raceFormData, setRaceFormData] = useState({
    raceName: "",
    raceDate: "",
    city: "",
    state: "",
    distance: "olympic" as RaceDistance,
    msrp: "",
  });

  const [submittingGear, setSubmittingGear] = useState(false);
  const [submittingRace, setSubmittingRace] = useState(false);
  const [gearValidationWarning, setGearValidationWarning] = useState<string | null>(null);
  const [gearSimilarItems, setGearSimilarItems] = useState<any[]>([]);
  const [raceValidationWarning, setRaceValidationWarning] = useState<string | null>(null);
  const [raceSimilarItems, setRaceSimilarItems] = useState<any[]>([]);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);

  const availableBrands = getBrandsForCategory(gearFormData.subCategory);

  const handleGearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to add gear items");
      return;
    }

    setSubmittingGear(true);
    setGearValidationWarning(null);
    setGearSimilarItems([]);

    try {
      // Step 1: Validation - Brand must be selected (enforced by form)
      if (!gearFormData.brand) {
        alert("Please select a brand from the dropdown");
        setSubmittingGear(false);
        return;
      }

      // Step 2: Exact match check
      const exactMatch = await checkExactGearMatch(
        gearFormData.brand,
        gearFormData.productName,
        parseFloat(gearFormData.msrp),
        gearFormData.mpn
      );

      if (!exactMatch.isValid && exactMatch.duplicateItem) {
        alert(exactMatch.error || "This item already exists");
        setGearValidationWarning(exactMatch.error || null);
        setSubmittingGear(false);
        return;
      }

      // Step 3: Fuzzy match check
      if (!confirmDuplicate) {
        const similarCheck = await checkSimilarGear(
          gearFormData.brand,
          gearFormData.productName,
          gearFormData.subCategory
        );

        if (similarCheck.similarItems && similarCheck.similarItems.length > 0) {
          setGearValidationWarning(
            `Similar items found. Are you sure this is a new item?`
          );
          setGearSimilarItems(similarCheck.similarItems);
          setConfirmDuplicate(true);
          setSubmittingGear(false);
          return;
        }
      }

      // All validation passed, add to database with "pending" status
      const productId = `${gearFormData.brand.toLowerCase()}-${gearFormData.productName.toLowerCase().replace(/\s+/g, "-")}`;

      await addDoc(collection(db, "gear"), {
        productId,
        productName: gearFormData.productName,
        brand: gearFormData.brand,
        subCategory: gearFormData.subCategory,
        msrp: parseFloat(gearFormData.msrp),
        mpn: gearFormData.mpn || null,
        averageRating: 0,
        totalReviewsCount: 0,
        specs: {},
        status: "pending", // Items start as pending for moderation
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.uid,
      });

      alert("Gear item submitted successfully! It will be visible after moderation approval.");
      setGearFormData({
        productName: "",
        brand: "",
        subCategory: "bikes",
        msrp: "",
        mpn: "",
      });
      setConfirmDuplicate(false);
      setGearValidationWarning(null);
      setGearSimilarItems([]);
    } catch (error) {
      console.error("Error adding gear:", error);
      alert("Failed to add gear item. Please try again.");
    } finally {
      setSubmittingGear(false);
    }
  };

  const handleRaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to add races");
      return;
    }

    setSubmittingRace(true);
    setRaceValidationWarning(null);
    setRaceSimilarItems([]);

    try {
      // Step 2: Exact match check
      const exactMatch = await checkExactRaceMatch(
        raceFormData.raceName,
        raceFormData.distance,
        raceFormData.city,
        raceFormData.state
      );

      if (!exactMatch.isValid && exactMatch.duplicateItem) {
        alert(exactMatch.error || "This race already exists");
        setRaceValidationWarning(exactMatch.error || null);
        setSubmittingRace(false);
        return;
      }

      // Step 3: Fuzzy match check
      if (!confirmDuplicate) {
        const similarCheck = await checkSimilarRace(
          raceFormData.raceName,
          raceFormData.city,
          raceFormData.state
        );

        if (similarCheck.similarItems && similarCheck.similarItems.length > 0) {
          setRaceValidationWarning(
            `Similar races found in this location. Are you sure this is a new race?`
          );
          setRaceSimilarItems(similarCheck.similarItems);
          setConfirmDuplicate(true);
          setSubmittingRace(false);
          return;
        }
      }

      // All validation passed, add to database with "pending" status
      const raceId = `${raceFormData.raceName.toLowerCase().replace(/\s+/g, "-")}-${raceFormData.city.toLowerCase()}`;

      await addDoc(collection(db, "races"), {
        raceId,
        raceName: raceFormData.raceName,
        raceDate: new Date(raceFormData.raceDate),
        location: {
          city: raceFormData.city,
          state: raceFormData.state,
        },
        distance: raceFormData.distance,
        msrp: parseFloat(raceFormData.msrp),
        avgCourseRating: 0,
        avgCostRating: 0,
        avgVolunteersRating: 0,
        avgSpectatorRating: 0,
        averageRating: 0,
        totalReviewsCount: 0,
        status: "pending", // Items start as pending for moderation
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.uid,
      });

      alert("Race submitted successfully! It will be visible after moderation approval.");
      setRaceFormData({
        raceName: "",
        raceDate: "",
        city: "",
        state: "",
        distance: "olympic",
        msrp: "",
      });
      setConfirmDuplicate(false);
      setRaceValidationWarning(null);
      setRaceSimilarItems([]);
    } catch (error) {
      console.error("Error adding race:", error);
      alert("Failed to add race. Please try again.");
    } finally {
      setSubmittingRace(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Add New Items</h1>
          <p className="text-muted-foreground">
            {user
              ? "Add new gear and races to the database"
              : "Sign in to add new gear and races"}
          </p>
        </div>

        {!user && !authLoading && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Please <a href="/auth" className="text-primary underline">sign in</a> to add new items.
              </p>
            </CardContent>
          </Card>
        )}

        {authLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {user && !authLoading && (

        <Tabs defaultValue="gear">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gear">Add Gear</TabsTrigger>
            <TabsTrigger value="race">Add Race</TabsTrigger>
          </TabsList>

          <TabsContent value="gear">
            <Card>
              <CardHeader>
                <CardTitle>Add New Gear Item</CardTitle>
                <CardDescription>
                  Add bikes, running shoes, and other triathlon gear
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGearSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product Name *</label>
                    <Input
                      placeholder="e.g., P-Series Ultegra"
                      value={gearFormData.productName}
                      onChange={(e) =>
                        setGearFormData({ ...gearFormData, productName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">MPN/SKU (Optional but Recommended)</label>
                    <Input
                      placeholder="e.g., PSERIES-ULTEGRA-2024"
                      value={gearFormData.mpn}
                      onChange={(e) =>
                        setGearFormData({ ...gearFormData, mpn: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Manufacturer Part Number or SKU - helps prevent duplicates
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select
                      value={gearFormData.subCategory}
                      onChange={(e) => {
                        const newCategory = e.target.value as GearSubCategory;
                        setGearFormData({
                          ...gearFormData,
                          subCategory: newCategory,
                          brand: "", // Reset brand when category changes
                        });
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="bikes">Bikes</option>
                      <option value="running-shoes">Running Shoes</option>
                      <option value="nutrition">Nutrition</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand *</label>
                    <select
                      value={gearFormData.brand}
                      onChange={(e) =>
                        setGearFormData({ ...gearFormData, brand: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="">Select a brand...</option>
                      {availableBrands.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Select category first to see available brands
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price (MSRP) *</label>
                    <Input
                      type="number"
                      placeholder="e.g., 4500"
                      value={gearFormData.msrp}
                      onChange={(e) =>
                        setGearFormData({ ...gearFormData, msrp: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Validation Warnings */}
                  {gearValidationWarning && (
                    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                              Similar Items Found
                            </h4>
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                              {gearValidationWarning}
                            </p>
                            {gearSimilarItems.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {gearSimilarItems.map((item) => (
                                  <div
                                    key={item.productId}
                                    className="p-2 bg-background rounded border"
                                  >
                                    <Link
                                      href={`/gear/${item.productId}`}
                                      className="text-sm font-medium text-primary hover:underline"
                                    >
                                      {item.brand} {item.productName}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">
                                      ${item.msrp} - {item.totalReviewsCount} reviews
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {confirmDuplicate && (
                              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mt-2">
                                Click "Add Gear Item" again to confirm this is a new product.
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button type="submit" className="w-full" disabled={submittingGear}>
                    {submittingGear ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Gear Item"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="race">
            <Card>
              <CardHeader>
                <CardTitle>Add New Race</CardTitle>
                <CardDescription>Add triathlon races and events</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRaceSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Race Name</label>
                    <Input
                      placeholder="e.g., IRONMAN California"
                      value={raceFormData.raceName}
                      onChange={(e) =>
                        setRaceFormData({ ...raceFormData, raceName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">City</label>
                      <Input
                        placeholder="e.g., Sacramento"
                        value={raceFormData.city}
                        onChange={(e) =>
                          setRaceFormData({ ...raceFormData, city: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">State</label>
                      <Input
                        placeholder="e.g., CA"
                        value={raceFormData.state}
                        onChange={(e) =>
                          setRaceFormData({ ...raceFormData, state: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Race Date</label>
                    <Input
                      type="date"
                      value={raceFormData.raceDate}
                      onChange={(e) =>
                        setRaceFormData({ ...raceFormData, raceDate: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Distance</label>
                    <select
                      value={raceFormData.distance}
                      onChange={(e) =>
                        setRaceFormData({
                          ...raceFormData,
                          distance: e.target.value as RaceDistance,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="sprint">Sprint</option>
                      <option value="olympic">Olympic</option>
                      <option value="half">Half Ironman (70.3)</option>
                      <option value="full">Full Ironman (140.6)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Registration Cost *</label>
                    <Input
                      type="number"
                      placeholder="e.g., 850"
                      value={raceFormData.msrp}
                      onChange={(e) =>
                        setRaceFormData({ ...raceFormData, msrp: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Validation Warnings */}
                  {raceValidationWarning && (
                    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                              Similar Races Found
                            </h4>
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                              {raceValidationWarning}
                            </p>
                            {raceSimilarItems.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {raceSimilarItems.map((item) => (
                                  <div
                                    key={item.raceId}
                                    className="p-2 bg-background rounded border"
                                  >
                                    <Link
                                      href={`/races/${item.raceId}`}
                                      className="text-sm font-medium text-primary hover:underline"
                                    >
                                      {item.raceName}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">
                                      {item.location.city}, {item.location.state} - {item.distance} - ${item.msrp}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {confirmDuplicate && (
                              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mt-2">
                                Click "Add Race" again to confirm this is a new race.
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button type="submit" className="w-full" disabled={submittingRace}>
                    {submittingRace ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Race"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </main>
    </>
  );
}
