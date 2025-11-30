"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Navbar } from "@/components/layout/navbar";
import { RaceCard } from "@/components/products/race-card";
import { useAuth } from "@/lib/auth-context";
import { getCostSensitivityFactor } from "@/lib/endurank";
import { ChevronRight, Home, Loader2 } from "lucide-react";
import type { RaceItem, RaceDistance } from "@/lib/types";

export default function RacesPage() {
  const { user } = useAuth();
  const [races, setRaces] = useState<RaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | RaceDistance>("all");

  const userCostSensitivity = user
    ? getCostSensitivityFactor(user.costSensitivity)
    : 0.5;

  useEffect(() => {
    async function fetchRaces() {
      try {
        setLoading(true);
        const racesRef = collection(db, "races");
        const racesQuery = query(
          racesRef,
          where("status", "==", "live"),
          orderBy("raceDate", "asc")
        );

        const snapshot = await getDocs(racesQuery);
        const racesData = snapshot.docs.map(doc => ({
          ...doc.data(),
          raceId: doc.id,
          raceDate: doc.data().raceDate?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as RaceItem[];

        setRaces(racesData);
      } catch (error) {
        console.error("Error fetching races:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRaces();
  }, []);

  const filteredRaces = filter === "all"
    ? races
    : races.filter(race => race.distance === filter);

  const categoryMaxPrice = races.length > 0
    ? Math.max(...races.map(race => race.msrp))
    : 1000;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/" className="flex items-center gap-1 hover:text-white transition-colors">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white font-medium">Races</span>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-light text-white mb-4">Endurance Sports Races</h1>
            <p className="text-gray-400">
              Find your next race with personalized Endurank recommendations
            </p>
            {!loading && (
              <p className="text-gray-500 text-sm mt-2">
                {filteredRaces.length} {filteredRaces.length === 1 ? 'race' : 'races'} found
              </p>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2.5 rounded-full text-sm transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a]"
              }`}
            >
              All Distances
            </button>
            <button
              onClick={() => setFilter("sprint")}
              className={`px-4 py-2.5 rounded-full text-sm transition-colors ${
                filter === "sprint"
                  ? "bg-blue-600 text-white"
                  : "bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a]"
              }`}
            >
              Sprint
            </button>
            <button
              onClick={() => setFilter("olympic")}
              className={`px-4 py-2.5 rounded-full text-sm transition-colors ${
                filter === "olympic"
                  ? "bg-blue-600 text-white"
                  : "bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a]"
              }`}
            >
              Olympic
            </button>
            <button
              onClick={() => setFilter("half")}
              className={`px-4 py-2.5 rounded-full text-sm transition-colors ${
                filter === "half"
                  ? "bg-blue-600 text-white"
                  : "bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a]"
              }`}
            >
              Half (70.3)
            </button>
            <button
              onClick={() => setFilter("full")}
              className={`px-4 py-2.5 rounded-full text-sm transition-colors ${
                filter === "full"
                  ? "bg-blue-600 text-white"
                  : "bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a]"
              }`}
            >
              Full (140.6)
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-gray-400">Loading races...</p>
              </div>
            </div>
          ) : filteredRaces.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No races found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRaces.map((race) => (
                <RaceCard
                  key={race.raceId}
                  item={race}
                  userCostSensitivity={userCostSensitivity}
                  categoryMaxPrice={categoryMaxPrice}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
