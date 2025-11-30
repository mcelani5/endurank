"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { GearCard } from "@/components/products/gear-card";
import { useAuth } from "@/lib/auth-context";
import { getCostSensitivityFactor } from "@/lib/endurank";
import { ChevronRight, Home } from "lucide-react";

// Mock data for demonstration - in production, this would come from Firestore
const mockGearItems = [
  {
    productId: "1",
    productName: "Cervélo P-Series Ultegra",
    brand: "Cervélo",
    subCategory: "bikes" as const,
    msrp: 4500,
    averageRating: 4.7,
    totalReviewsCount: 23,
    specs: {},
    status: "live" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    productId: "2",
    productName: "Hoka Clifton 9",
    brand: "Hoka",
    subCategory: "running-shoes" as const,
    msrp: 145,
    averageRating: 4.5,
    totalReviewsCount: 89,
    specs: {},
    status: "live" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    productId: "3",
    productName: "Canyon Speedmax CF 8",
    brand: "Canyon",
    subCategory: "bikes" as const,
    msrp: 3200,
    averageRating: 4.8,
    totalReviewsCount: 15,
    specs: {},
    status: "live" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    productId: "4",
    productName: "Nike ZoomX Vaporfly",
    brand: "Nike",
    subCategory: "running-shoes" as const,
    msrp: 260,
    averageRating: 4.6,
    totalReviewsCount: 134,
    specs: {},
    status: "live" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function GearPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "bikes" | "running-shoes" | "nutrition">("all");

  const filteredItems = filter === "all"
    ? mockGearItems
    : mockGearItems.filter(item => item.subCategory === filter);

  const categoryMaxPrice = Math.max(...mockGearItems.map(item => item.msrp));
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
            <span className="text-white font-medium">Gear</span>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-light text-white mb-4">Endurance Sports Gear</h1>
            <p className="text-gray-400">
              Discover the best gear with personalized Endurank recommendations
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2.5 rounded-full text-sm transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a]"
              }`}
            >
              All Gear
            </button>
            <button
              onClick={() => setFilter("bikes")}
              className={`px-4 py-2.5 rounded-full text-sm transition-colors ${
                filter === "bikes"
                  ? "bg-blue-600 text-white"
                  : "bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a]"
              }`}
            >
              Bikes
            </button>
            <button
              onClick={() => setFilter("running-shoes")}
              className={`px-4 py-2.5 rounded-full text-sm transition-colors ${
                filter === "running-shoes"
                  ? "bg-blue-600 text-white"
                  : "bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a]"
              }`}
            >
              Running Shoes
            </button>
            <button
              onClick={() => setFilter("nutrition")}
              className={`px-4 py-2.5 rounded-full text-sm transition-colors ${
                filter === "nutrition"
                  ? "bg-blue-600 text-white"
                  : "bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:bg-[#3a3a3a]"
              }`}
            >
              Nutrition
            </button>
          </div>

          {/* Product Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <GearCard
                key={item.productId}
                item={item}
                userCostSensitivity={userCostSensitivity}
                categoryMaxPrice={categoryMaxPrice}
              />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No gear items found</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
