"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { RaceCard } from "@/components/products/race-card";
import { useAuth } from "@/lib/auth-context";
import { getCostSensitivityFactor } from "@/lib/endurank";
import { ChevronRight, Home } from "lucide-react";

// Mock data for demonstration
const mockRaces = [
  {
    raceId: "1",
    raceName: "IRONMAN California",
    raceDate: new Date("2025-05-10"),
    location: { city: "Sacramento", state: "CA" },
    distance: "full" as const,
    msrp: 850,
    avgCourseRating: 4.5,
    avgCostRating: 3.8,
    avgVolunteersRating: 4.9,
    avgSpectatorRating: 4.7,
    averageRating: 4.5,
    totalReviewsCount: 67,
    status: "live" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    raceId: "2",
    raceName: "Boulder Sunset Triathlon",
    raceDate: new Date("2025-07-15"),
    location: { city: "Boulder", state: "CO" },
    distance: "olympic" as const,
    msrp: 175,
    avgCourseRating: 4.8,
    avgCostRating: 4.2,
    avgVolunteersRating: 4.6,
    avgSpectatorRating: 4.4,
    averageRating: 4.6,
    totalReviewsCount: 142,
    status: "live" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    raceId: "3",
    raceName: "Austin Sprint Tri",
    raceDate: new Date("2025-06-20"),
    location: { city: "Austin", state: "TX" },
    distance: "sprint" as const,
    msrp: 95,
    avgCourseRating: 4.3,
    avgCostRating: 4.5,
    avgVolunteersRating: 4.7,
    avgSpectatorRating: 4.2,
    averageRating: 4.4,
    totalReviewsCount: 89,
    status: "live" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function RacesPage() {
  const { user } = useAuth();
  const categoryMaxPrice = Math.max(...mockRaces.map(race => race.msrp));
  const userCostSensitivity = user
    ? getCostSensitivityFactor(user.costSensitivity)
    : 0.5;

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
          </div>

          {/* Product Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRaces.map((race) => (
              <RaceCard
                key={race.raceId}
                item={race}
                userCostSensitivity={userCostSensitivity}
                categoryMaxPrice={categoryMaxPrice}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
