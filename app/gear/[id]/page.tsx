"use client";

import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";
import { useAuth } from "@/lib/auth-context";
import { Heart, Star } from "lucide-react";
import { calculateEndurank, getCostSensitivityFactor, calculateNormalizedPrice } from "@/lib/endurank";

// Mock data - in production, fetch from Firestore
const mockGearItem = {
  productId: "1",
  productName: "Cervélo P-Series Ultegra",
  brand: "Cervélo",
  subCategory: "bikes" as const,
  msrp: 4500,
  averageRating: 4.7,
  totalReviewsCount: 23,
  specs: {
    "Frame Material": "Carbon",
    "Groupset": "Shimano Ultegra",
    "Weight": "8.2 kg",
    "Wheel Size": "700c",
  },
  status: "live" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockReviews = [
  {
    reviewId: "1",
    itemId: "1",
    itemType: "gear" as const,
    userId: "user123",
    userTier: "expert" as const,
    rating: 5,
    title: "Perfect for my first Ironman",
    text: "This bike is incredibly fast and comfortable. The Ultegra groupset shifts smoothly and the aerodynamic design really helped me improve my bike split.",
    createdAt: new Date("2024-10-15"),
    updatedAt: new Date("2024-10-15"),
  },
  {
    reviewId: "2",
    itemId: "1",
    itemType: "gear" as const,
    userId: "user456",
    userTier: "contributor" as const,
    rating: 4,
    title: "Great bike, but pricey",
    text: "The performance is excellent, but it's definitely an investment. If you're serious about triathlon, it's worth it.",
    createdAt: new Date("2024-11-01"),
    updatedAt: new Date("2024-11-01"),
  },
];

export default function GearDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const userCostSensitivity = user ? getCostSensitivityFactor(user.costSensitivity) : 0.5;
  const categoryMaxPrice = 10000;

  const endurank = calculateEndurank({
    averageRating: mockGearItem.averageRating,
    costSensitivity: userCostSensitivity,
    normalizedPrice: calculateNormalizedPrice(mockGearItem.msrp, categoryMaxPrice),
  });

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Product Header */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2">
            <Badge variant="outline" className="mb-4">
              {mockGearItem.subCategory}
            </Badge>
            <h1 className="text-4xl font-bold mb-2">{mockGearItem.productName}</h1>
            <p className="text-xl text-muted-foreground mb-4">{mockGearItem.brand}</p>

            {/* Endurank & Rating */}
            <div className="flex items-center gap-6 mb-6">
              <div>
                <div className="text-5xl font-bold text-blue-600">{endurank}</div>
                <div className="text-sm text-muted-foreground">Endurank</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="flex items-center gap-2">
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-semibold">
                    {mockGearItem.averageRating.toFixed(1)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {mockGearItem.totalReviewsCount} reviews
                </div>
              </div>
            </div>

            {/* Price & Actions */}
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">
                ${mockGearItem.msrp.toLocaleString()}
              </div>
              <Button size="lg">
                <Heart className="mr-2 h-5 w-5" />
                Add to Wishlist
              </Button>
            </div>
          </div>

          {/* Specs */}
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Specifications</h3>
            <dl className="space-y-3">
              {Object.entries(mockGearItem.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Reviews Section */}
        <Tabs defaultValue="user-reviews" className="mt-12">
          <TabsList>
            <TabsTrigger value="user-reviews">User Reviews</TabsTrigger>
            <TabsTrigger value="imported">Community Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="user-reviews" className="space-y-6">
            <ReviewForm itemId={mockGearItem.productId} itemType="gear" />
            <ReviewList reviews={mockReviews} />
          </TabsContent>

          <TabsContent value="imported">
            <div className="text-center py-12 text-muted-foreground">
              Imported reviews coming soon
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
