"use client";

import Link from "next/link";
import { GearItem } from "@/lib/types";
import { calculateEndurank } from "@/lib/endurank";
import { Star } from "lucide-react";

interface GearListItemProps {
  item: GearItem;
  userCostSensitivity: number;
  categoryMaxPrice: number;
}

export function GearListItem({
  item,
  userCostSensitivity,
  categoryMaxPrice,
}: GearListItemProps) {
  const normalizedPrice = item.msrp / categoryMaxPrice;
  const endurank = calculateEndurank({
    averageRating: item.averageRating,
    costSensitivity: userCostSensitivity,
    normalizedPrice,
  });

  return (
    <Link href={`/gear/${item.productId}`}>
      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
        <div className="flex items-center gap-6">
          {/* Product Image Placeholder */}
          <div className="flex-shrink-0 w-24 h-24 bg-muted rounded-md flex items-center justify-center">
            <span className="text-xs text-muted-foreground">
              {item.subCategory === "bikes" ? "🚴" : item.subCategory === "running-shoes" ? "👟" : "🥤"}
            </span>
          </div>

          {/* Product Info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-grow">
                <h3 className="font-semibold text-lg truncate">
                  {item.productName}
                </h3>
                <p className="text-sm text-muted-foreground">{item.brand}</p>
                <p className="text-xs text-muted-foreground capitalize mt-1">
                  {item.subCategory.replace("-", " ")}
                </p>
              </div>

              {/* Endurank Score */}
              <div className="flex-shrink-0 text-right">
                <div className="text-2xl font-bold text-primary">
                  {endurank.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Endurank</div>
              </div>
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">
                  {item.averageRating.toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {item.totalReviewsCount} reviews
              </span>
              <span className="text-sm font-semibold ml-auto">
                ${item.msrp.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
