"use client";

import { Navbar } from "@/components/layout/navbar";
import { GearCard } from "@/components/products/gear-card";
import { useAuth } from "@/lib/auth-context";
import { getCostSensitivityFactor } from "@/lib/endurank";

// Mock wishlist items - in production, fetch from user's wishlist
const mockWishlistItems = [
  {
    productId: "2",
    productName: "Hoka Clifton 9",
    brand: "Hoka",
    subCategory: "running-shoes" as const,
    msrp: 145,
    averageRating: 4.5,
    totalReviewsCount: 89,
    specs: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const userCostSensitivity = user ? getCostSensitivityFactor(user.costSensitivity) : 0.5;
  const categoryMaxPrice = 10000;

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">Loading...</div>
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold mb-4">Sign in to view your wishlist</h1>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Wishlist</h1>
          <p className="text-muted-foreground">
            {mockWishlistItems.length} items saved
          </p>
        </div>

        {mockWishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
            <p className="text-sm text-muted-foreground">
              Browse gear and races to add items to your wishlist
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockWishlistItems.map((item) => (
              <GearCard
                key={item.productId}
                item={item}
                userCostSensitivity={userCostSensitivity}
                categoryMaxPrice={categoryMaxPrice}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
