"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Navbar } from "@/components/layout/navbar";
import { RaceCard } from "@/components/products/race-card";
import { useAuth } from "@/lib/auth-context";
import { getCostSensitivityFactor, calculateEndurank, calculateNormalizedPrice } from "@/lib/endurank";
import { ChevronRight, Home, Loader2, SlidersHorizontal, X } from "lucide-react";
import type { RaceItem, RaceDistance } from "@/lib/types";

// Region definitions (matching query-parser)
const REGIONS: Record<string, string[]> = {
  'West Coast': ['CA', 'OR', 'WA'],
  'Southwest': ['AZ', 'NM', 'NV', 'UT', 'CO'],
  'Midwest': ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'],
  'Southeast': ['AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'],
  'Northeast': ['CT', 'DE', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'],
  'Mountain West': ['ID', 'MT', 'WY'],
};

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'Washington DC' },
];

export default function RacesPage() {
  const { user } = useAuth();
  const [races, setRaces] = useState<RaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [distanceFilter, setDistanceFilter] = useState<"all" | RaceDistance>("all");
  const [costFilter, setCostFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [qualifierOnly, setQualifierOnly] = useState(false);
  const [endurankSort, setEndurankSort] = useState<"all" | "high" | "medium" | "low">("all");
  const [showFilters, setShowFilters] = useState(false);

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

  const categoryMaxPrice = races.length > 0
    ? Math.max(...races.map(race => race.msrp))
    : 1000;

  // Calculate Endurank for each race
  const racesWithEndurank = useMemo(() => {
    return races.map(race => {
      const normalizedPrice = calculateNormalizedPrice(race.msrp, categoryMaxPrice);
      const endurank = calculateEndurank({
        averageRating: race.averageRating,
        costSensitivity: userCostSensitivity,
        normalizedPrice,
      });
      return { ...race, endurank };
    });
  }, [races, categoryMaxPrice, userCostSensitivity]);

  // Apply all filters
  const filteredRaces = useMemo(() => {
    let filtered = racesWithEndurank;

    // Distance filter
    if (distanceFilter !== "all") {
      filtered = filtered.filter(race => race.distance === distanceFilter);
    }

    // Cost filter
    if (costFilter !== "all") {
      filtered = filtered.filter(race => {
        switch (costFilter) {
          case "under100": return race.msrp < 100;
          case "100-200": return race.msrp >= 100 && race.msrp < 200;
          case "200-300": return race.msrp >= 200 && race.msrp < 300;
          case "over300": return race.msrp >= 300;
          default: return true;
        }
      });
    }

    // Region filter
    if (regionFilter !== "all") {
      const states = REGIONS[regionFilter];
      if (states) {
        filtered = filtered.filter(race => states.includes(race.location.state));
      }
    }

    // State filter
    if (stateFilter !== "all") {
      filtered = filtered.filter(race => race.location.state === stateFilter);
    }

    // Qualifier filter
    if (qualifierOnly) {
      filtered = filtered.filter(race => race.isQualifier === true);
    }

    // Endurank filter/sort
    if (endurankSort !== "all") {
      filtered = filtered.filter(race => {
        switch (endurankSort) {
          case "high": return race.endurank >= 8.5;
          case "medium": return race.endurank >= 7.0 && race.endurank < 8.5;
          case "low": return race.endurank >= 5.5 && race.endurank < 7.0;
          default: return true;
        }
      });
      // Sort by Endurank descending
      filtered = [...filtered].sort((a, b) => b.endurank - a.endurank);
    }

    return filtered;
  }, [racesWithEndurank, distanceFilter, costFilter, regionFilter, stateFilter, qualifierOnly, endurankSort]);

  // Count active filters
  const activeFilterCount = [
    distanceFilter !== "all",
    costFilter !== "all",
    regionFilter !== "all",
    stateFilter !== "all",
    qualifierOnly,
    endurankSort !== "all",
  ].filter(Boolean).length;

  // Reset all filters
  const resetFilters = () => {
    setDistanceFilter("all");
    setCostFilter("all");
    setRegionFilter("all");
    setStateFilter("all");
    setQualifierOnly(false);
    setEndurankSort("all");
  };

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

          {/* Header with Filter Toggle */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-light text-white mb-2">Endurance Sports Races</h1>
              <p className="text-gray-400">
                Find your next race with personalized Endurank recommendations
              </p>
              {!loading && (
                <p className="text-gray-500 text-sm mt-2">
                  {filteredRaces.length} {filteredRaces.length === 1 ? 'race' : 'races'} found
                </p>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a] rounded-lg transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-white">Filters</h2>
                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Distance Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Distance</label>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "All Distances" },
                      { value: "sprint", label: "Sprint" },
                      { value: "olympic", label: "Olympic" },
                      { value: "half", label: "Half (70.3)" },
                      { value: "full", label: "Full (140.6)" },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setDistanceFilter(option.value as any)}
                        className={`w-full px-3 py-2 rounded text-sm text-left transition-colors ${
                          distanceFilter === option.value
                            ? "bg-blue-600 text-white"
                            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#3a3a3a]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cost Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Registration Cost</label>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "All Prices" },
                      { value: "under100", label: "Under $100" },
                      { value: "100-200", label: "$100 - $200" },
                      { value: "200-300", label: "$200 - $300" },
                      { value: "over300", label: "Over $300" },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setCostFilter(option.value)}
                        className={`w-full px-3 py-2 rounded text-sm text-left transition-colors ${
                          costFilter === option.value
                            ? "bg-blue-600 text-white"
                            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#3a3a3a]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Region Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Region</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setRegionFilter("all")}
                      className={`w-full px-3 py-2 rounded text-sm text-left transition-colors ${
                        regionFilter === "all"
                          ? "bg-blue-600 text-white"
                          : "bg-[#1a1a1a] text-gray-300 hover:bg-[#3a3a3a]"
                      }`}
                    >
                      All Regions
                    </button>
                    {Object.keys(REGIONS).map(region => (
                      <button
                        key={region}
                        onClick={() => setRegionFilter(region)}
                        className={`w-full px-3 py-2 rounded text-sm text-left transition-colors ${
                          regionFilter === region
                            ? "bg-blue-600 text-white"
                            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#3a3a3a]"
                        }`}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </div>

                {/* State Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">State</label>
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] text-gray-300 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All States</option>
                    {US_STATES.map(state => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Endurank Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Endurank Score</label>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "All Scores" },
                      { value: "high", label: "High (8.5+)" },
                      { value: "medium", label: "Medium (7.0 - 8.5)" },
                      { value: "low", label: "Good (5.5 - 7.0)" },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setEndurankSort(option.value as any)}
                        className={`w-full px-3 py-2 rounded text-sm text-left transition-colors ${
                          endurankSort === option.value
                            ? "bg-blue-600 text-white"
                            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#3a3a3a]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Qualifier Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Special Attributes</label>
                  <button
                    onClick={() => setQualifierOnly(!qualifierOnly)}
                    className={`w-full px-3 py-2 rounded text-sm text-left transition-colors ${
                      qualifierOnly
                        ? "bg-blue-600 text-white"
                        : "bg-[#1a1a1a] text-gray-300 hover:bg-[#3a3a3a]"
                    }`}
                  >
                    World Championship Qualifiers Only
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {activeFilterCount > 0 && !showFilters && (
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-sm text-gray-400">Active filters:</span>
              {distanceFilter !== "all" && (
                <span className="px-3 py-1 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 rounded-full text-sm flex items-center gap-2">
                  Distance: {distanceFilter === "half" ? "Half (70.3)" : distanceFilter === "full" ? "Full (140.6)" : distanceFilter.charAt(0).toUpperCase() + distanceFilter.slice(1)}
                  <button onClick={() => setDistanceFilter("all")} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {costFilter !== "all" && (
                <span className="px-3 py-1 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 rounded-full text-sm flex items-center gap-2">
                  Cost: {costFilter === "under100" ? "Under $100" : costFilter === "100-200" ? "$100-$200" : costFilter === "200-300" ? "$200-$300" : "Over $300"}
                  <button onClick={() => setCostFilter("all")} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {regionFilter !== "all" && (
                <span className="px-3 py-1 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 rounded-full text-sm flex items-center gap-2">
                  Region: {regionFilter}
                  <button onClick={() => setRegionFilter("all")} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {stateFilter !== "all" && (
                <span className="px-3 py-1 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 rounded-full text-sm flex items-center gap-2">
                  State: {US_STATES.find(s => s.code === stateFilter)?.name || stateFilter}
                  <button onClick={() => setStateFilter("all")} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {qualifierOnly && (
                <span className="px-3 py-1 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 rounded-full text-sm flex items-center gap-2">
                  WC Qualifiers Only
                  <button onClick={() => setQualifierOnly(false)} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {endurankSort !== "all" && (
                <span className="px-3 py-1 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 rounded-full text-sm flex items-center gap-2">
                  Endurank: {endurankSort === "high" ? "High (8.5+)" : endurankSort === "medium" ? "Medium (7.0-8.5)" : "Good (5.5-7.0)"}
                  <button onClick={() => setEndurankSort("all")} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                onClick={resetFilters}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-gray-400">Loading races...</p>
              </div>
            </div>
          ) : filteredRaces.length === 0 ? (
            <div className="text-center py-12 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg">
              <p className="text-gray-400 mb-2">No races found matching your filters</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Clear all filters
                </button>
              )}
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
