"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GearItem, RaceItem } from "@/lib/types";
import { Loader2, Check, X, AlertCircle } from "lucide-react";

export default function ModeratePage() {
  const { user, loading: authLoading } = useAuth();
  const [pendingGear, setPendingGear] = useState<GearItem[]>([]);
  const [pendingRaces, setPendingRaces] = useState<RaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPendingItems();
    }
  }, [user]);

  async function fetchPendingItems() {
    setLoading(true);
    try {
      // Fetch pending gear
      const gearRef = collection(db, "gear");
      const gearQuery = query(gearRef, where("status", "==", "pending"));
      const gearSnapshot = await getDocs(gearQuery);
      const gearData = gearSnapshot.docs.map(doc => ({
        ...doc.data(),
        productId: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as GearItem[];
      setPendingGear(gearData);

      // Fetch pending races
      const racesRef = collection(db, "races");
      const racesQuery = query(racesRef, where("status", "==", "pending"));
      const racesSnapshot = await getDocs(racesQuery);
      const racesData = racesSnapshot.docs.map(doc => ({
        ...doc.data(),
        raceId: doc.id,
        raceDate: doc.data().raceDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as RaceItem[];
      setPendingRaces(racesData);
    } catch (error) {
      console.error("Error fetching pending items:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveGear(productId: string) {
    setProcessing(productId);
    try {
      const gearDoc = doc(db, "gear", productId);
      await updateDoc(gearDoc, {
        status: "live",
        updatedAt: new Date(),
      });
      setPendingGear(prev => prev.filter(item => item.productId !== productId));
      alert("Item approved and now live!");
    } catch (error) {
      console.error("Error approving gear:", error);
      alert("Failed to approve item");
    } finally {
      setProcessing(null);
    }
  }

  async function handleRejectGear(productId: string) {
    setProcessing(productId);
    try {
      const gearDoc = doc(db, "gear", productId);
      await updateDoc(gearDoc, {
        status: "rejected",
        updatedAt: new Date(),
      });
      setPendingGear(prev => prev.filter(item => item.productId !== productId));
      alert("Item rejected");
    } catch (error) {
      console.error("Error rejecting gear:", error);
      alert("Failed to reject item");
    } finally {
      setProcessing(null);
    }
  }

  async function handleApproveRace(raceId: string) {
    setProcessing(raceId);
    try {
      const raceDoc = doc(db, "races", raceId);
      await updateDoc(raceDoc, {
        status: "live",
        updatedAt: new Date(),
      });
      setPendingRaces(prev => prev.filter(item => item.raceId !== raceId));
      alert("Race approved and now live!");
    } catch (error) {
      console.error("Error approving race:", error);
      alert("Failed to approve race");
    } finally {
      setProcessing(null);
    }
  }

  async function handleRejectRace(raceId: string) {
    setProcessing(raceId);
    try {
      const raceDoc = doc(db, "races", raceId);
      await updateDoc(raceDoc, {
        status: "rejected",
        updatedAt: new Date(),
      });
      setPendingRaces(prev => prev.filter(item => item.raceId !== raceId));
      alert("Race rejected");
    } catch (error) {
      console.error("Error rejecting race:", error);
      alert("Failed to reject race");
    } finally {
      setProcessing(null);
    }
  }

  if (!user && !authLoading) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Please <a href="/auth" className="text-primary underline">sign in</a> to access the moderation panel.
              </p>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Content Moderation</h1>
          <p className="text-muted-foreground">
            Review and approve pending items before they go live
          </p>
        </div>

        {loading || authLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="gear">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gear">
                Pending Gear ({pendingGear.length})
              </TabsTrigger>
              <TabsTrigger value="races">
                Pending Races ({pendingRaces.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gear" className="mt-6">
              {pendingGear.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No pending gear items to review
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingGear.map((item) => (
                    <Card key={item.productId}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{item.productName}</CardTitle>
                            <CardDescription>
                              {item.brand} • {item.subCategory.replace("-", " ")}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleApproveGear(item.productId)}
                              disabled={processing === item.productId}
                            >
                              {processing === item.productId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleRejectGear(item.productId)}
                              disabled={processing === item.productId}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <dt className="font-medium text-muted-foreground">Price</dt>
                            <dd className="font-semibold">${item.msrp}</dd>
                          </div>
                          {item.mpn && (
                            <div>
                              <dt className="font-medium text-muted-foreground">MPN/SKU</dt>
                              <dd className="font-mono text-xs">{item.mpn}</dd>
                            </div>
                          )}
                          <div>
                            <dt className="font-medium text-muted-foreground">Submitted</dt>
                            <dd>{item.createdAt.toLocaleDateString()}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-muted-foreground">Submitted by</dt>
                            <dd className="text-xs">{item.createdBy || "Unknown"}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="races" className="mt-6">
              {pendingRaces.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No pending races to review
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingRaces.map((item) => (
                    <Card key={item.raceId}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{item.raceName}</CardTitle>
                            <CardDescription>
                              {item.location.city}, {item.location.state} • {item.distance}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleApproveRace(item.raceId)}
                              disabled={processing === item.raceId}
                            >
                              {processing === item.raceId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleRejectRace(item.raceId)}
                              disabled={processing === item.raceId}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <dt className="font-medium text-muted-foreground">Registration Cost</dt>
                            <dd className="font-semibold">${item.msrp}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-muted-foreground">Race Date</dt>
                            <dd>{item.raceDate.toLocaleDateString()}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-muted-foreground">Submitted</dt>
                            <dd>{item.createdAt.toLocaleDateString()}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-muted-foreground">Submitted by</dt>
                            <dd className="text-xs">{item.createdBy || "Unknown"}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </>
  );
}
