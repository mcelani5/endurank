"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Navbar } from "@/components/layout/navbar";
import { GearCard } from "@/components/products/gear-card";
import { RaceCard } from "@/components/products/race-card";
import { useAuth } from "@/lib/auth-context";
import { getCostSensitivityFactor } from "@/lib/endurank";
import type { GearItem, RaceItem } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowUp, Check } from "lucide-react";
import { Card } from "@/components/ui/card";

function SearchPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams.get("q") || "";
  const [followUpQuery, setFollowUpQuery] = useState("");

  const [gearResults, setGearResults] = useState<GearItem[]>([]);
  const [raceResults, setRaceResults] = useState<RaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userCostSensitivity = user
    ? getCostSensitivityFactor(user.costSensitivity)
    : 0.5;

  useEffect(() => {
    async function performSearch() {
      if (!searchQuery.trim()) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Search gear items (only live items)
        const gearRef = collection(db, "gear");
        const gearQuery = query(gearRef, where("status", "==", "live"));
        const gearSnapshot = await getDocs(gearQuery);

        const searchLower = searchQuery.toLowerCase();
        const gearMatches = gearSnapshot.docs
          .map(doc => ({
            ...doc.data(),
            productId: doc.id,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          } as GearItem))
          .filter(item =>
            item.productName.toLowerCase().includes(searchLower) ||
            item.brand.toLowerCase().includes(searchLower) ||
            item.subCategory.toLowerCase().includes(searchLower)
          );

        setGearResults(gearMatches);

        // Search race items (only live items)
        const racesRef = collection(db, "races");
        const racesQuery = query(racesRef, where("status", "==", "live"));
        const racesSnapshot = await getDocs(racesQuery);

        const raceMatches = racesSnapshot.docs
          .map(doc => ({
            ...doc.data(),
            raceId: doc.id,
            raceDate: doc.data().raceDate?.toDate() || new Date(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          } as RaceItem))
          .filter(item => {
            const nameMatch = item.raceName.toLowerCase().includes(searchLower);
            const cityMatch = item.location.city?.toLowerCase().includes(searchLower);
            const stateMatch = item.location.state?.toLowerCase().includes(searchLower);
            const regionMatch = item.location.region?.toLowerCase().includes(searchLower);
            const distanceMatch = item.distance.toLowerCase().includes(searchLower);
            const organizerMatch = item.organizerSeries?.toLowerCase().includes(searchLower);

            return nameMatch || cityMatch || stateMatch || regionMatch || distanceMatch || organizerMatch;
          })
          .sort((a, b) => {
            // Sort by relevance: exact name matches first, then by date
            const aNameExact = a.raceName.toLowerCase() === searchLower;
            const bNameExact = b.raceName.toLowerCase() === searchLower;

            if (aNameExact && !bNameExact) return -1;
            if (!aNameExact && bNameExact) return 1;

            // Then by upcoming date
            return a.raceDate.getTime() - b.raceDate.getTime();
          });

        setRaceResults(raceMatches);
      } catch (err) {
        console.error("Search error:", err);
        setError("An error occurred while searching. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [searchQuery]);

  const handleFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (followUpQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(followUpQuery)}`);
      setFollowUpQuery("");
    }
  };

  const totalResults = gearResults.length + raceResults.length;
  const gearMaxPrice = gearResults.length > 0
    ? Math.max(...gearResults.map(item => item.msrp))
    : 1;
  const raceMaxPrice = raceResults.length > 0
    ? Math.max(...raceResults.map(item => item.msrp))
    : 1;

  // Generate a simple answer based on results
  const generateAnswer = () => {
    if (totalResults === 0) {
      return `I couldn't find any results for "${searchQuery}" in our database. Try searching for:\n\n• Race locations (e.g., "California", "Boulder", "New York")\n• Race distances ("sprint", "olympic", "half", "full")\n• Race series ("IRONMAN", "USA Triathlon")\n• Gear brands or product names`;
    }

    let answer = "";

    if (raceResults.length > 0) {
      answer += `I found ${raceResults.length} race${raceResults.length === 1 ? '' : 's'} matching "${searchQuery}".\n\n`;

      const topRace = raceResults[0];
      const raceDate = new Date(topRace.raceDate);
      const formattedDate = raceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      answer += `**Top Result:** ${topRace.raceName}\n`;
      answer += `• Location: ${topRace.location.city}, ${topRace.location.state}\n`;
      answer += `• Date: ${formattedDate}\n`;
      answer += `• Distance: ${topRace.distance.charAt(0).toUpperCase() + topRace.distance.slice(1)}\n`;
      answer += `• Registration: $${topRace.msrp.toLocaleString()}\n`;

      if (topRace.organizerSeries) {
        answer += `• Organizer: ${topRace.organizerSeries}\n`;
      }

      if (topRace.course?.swimDistance && topRace.course?.bikeDistance && topRace.course?.runDistance) {
        answer += `• Course: ${(topRace.course.swimDistance / 1000).toFixed(1)}km swim, ${(topRace.course.bikeDistance / 1000).toFixed(1)}km bike, ${(topRace.course.runDistance / 1000).toFixed(1)}km run\n`;
      }

      if (topRace.isQualifier) {
        answer += `• Qualifier for ${topRace.qualifierFor}\n`;
      }

      // Group results by distance
      const byDistance = {
        sprint: raceResults.filter(r => r.distance === 'sprint').length,
        olympic: raceResults.filter(r => r.distance === 'olympic').length,
        half: raceResults.filter(r => r.distance === 'half').length,
        full: raceResults.filter(r => r.distance === 'full').length,
      };

      answer += `\n**Results by Distance:**\n`;
      if (byDistance.sprint > 0) answer += `• Sprint: ${byDistance.sprint}\n`;
      if (byDistance.olympic > 0) answer += `• Olympic: ${byDistance.olympic}\n`;
      if (byDistance.half > 0) answer += `• Half (70.3): ${byDistance.half}\n`;
      if (byDistance.full > 0) answer += `• Full (140.6): ${byDistance.full}\n`;
    }

    if (gearResults.length > 0) {
      if (raceResults.length > 0) answer += "\n\n";
      answer += `I found ${gearResults.length} gear ${gearResults.length === 1 ? 'item' : 'items'} matching your search. `;
      const topGear = gearResults[0];
      answer += `The top result is the ${topGear.productName} by ${topGear.brand}, priced at $${topGear.msrp.toLocaleString()}.`;
    }

    return answer;
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {/* Question Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">
              {searchQuery}
            </h1>
            {!loading && !error && totalResults > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Check className="h-4 w-4 text-green-500" />
                <span>Search completed</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-gray-400">Searching...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
            </div>
          ) : (
            <>
              {/* Tabs Navigation */}
              <Tabs defaultValue="answer" className="w-full">
                <TabsList className="bg-transparent border-b border-[#2a2a2a] rounded-none w-full justify-start h-auto p-0 mb-6">
                  <TabsTrigger
                    value="answer"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-4 py-3"
                  >
                    Answer
                  </TabsTrigger>
                  <TabsTrigger
                    value="gear"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-4 py-3"
                  >
                    Gear ({gearResults.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="races"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-4 py-3"
                  >
                    Races ({raceResults.length})
                  </TabsTrigger>
                </TabsList>

                {/* Answer Tab */}
                <TabsContent value="answer" className="mt-0">
                  {/* AI Answer Section */}
                  <Card className="bg-[#2a2a2a] border-[#3a3a3a] p-6 mb-8">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                        {generateAnswer()}
                      </p>
                    </div>
                  </Card>

                  {/* Top Results */}
                  {gearResults.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold text-white mb-4">Top Gear Results</h2>
                      <div className="grid md:grid-cols-2 gap-4">
                        {gearResults.slice(0, 4).map((item) => (
                          <GearCard
                            key={item.productId}
                            item={item}
                            userCostSensitivity={userCostSensitivity}
                            categoryMaxPrice={gearMaxPrice}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {raceResults.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold text-white mb-4">Top Race Results</h2>
                      <div className="grid md:grid-cols-2 gap-4">
                        {raceResults.slice(0, 4).map((item) => (
                          <RaceCard
                            key={item.raceId}
                            item={item}
                            userCostSensitivity={userCostSensitivity}
                            categoryMaxPrice={raceMaxPrice}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Gear Tab */}
                <TabsContent value="gear" className="mt-0">
                  {gearResults.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {gearResults.map((item) => (
                        <GearCard
                          key={item.productId}
                          item={item}
                          userCostSensitivity={userCostSensitivity}
                          categoryMaxPrice={gearMaxPrice}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No gear found</p>
                    </div>
                  )}
                </TabsContent>

                {/* Races Tab */}
                <TabsContent value="races" className="mt-0">
                  {raceResults.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {raceResults.map((item) => (
                        <RaceCard
                          key={item.raceId}
                          item={item}
                          userCostSensitivity={userCostSensitivity}
                          categoryMaxPrice={raceMaxPrice}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No races found</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Follow-up Input */}
              <div className="mt-8 sticky bottom-4">
                <form onSubmit={handleFollowUp}>
                  <div className="relative bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl hover:border-[#4a4a4a] transition-colors shadow-lg">
                    <input
                      type="text"
                      value={followUpQuery}
                      onChange={(e) => setFollowUpQuery(e.target.value)}
                      placeholder="Ask a follow-up question..."
                      className="w-full px-6 py-4 pr-14 bg-transparent text-white placeholder-gray-500 focus:outline-none rounded-xl"
                    />
                    <button
                      type="submit"
                      disabled={!followUpQuery.trim()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
                    >
                      <ArrowUp className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <main className="min-h-screen bg-[#1a1a1a]">
          <div className="container mx-auto px-4 py-6 max-w-5xl">
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-gray-400">Loading...</p>
              </div>
            </div>
          </div>
        </main>
      </>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
