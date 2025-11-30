"use client";

import Link from "next/link";
import { RaceItem } from "@/lib/types";
import { calculateEndurank } from "@/lib/endurank";
import { Star, MapPin, Calendar } from "lucide-react";

interface RaceListItemProps {
  item: RaceItem;
  userCostSensitivity: number;
  categoryMaxPrice: number;
}

export function RaceListItem({
  item,
  userCostSensitivity,
  categoryMaxPrice,
}: RaceListItemProps) {
  const normalizedPrice = item.msrp / categoryMaxPrice;
  const endurank = calculateEndurank({
    averageRating: item.averageRating,
    costSensitivity: userCostSensitivity,
    normalizedPrice,
  });

  const distanceLabels = {
    sprint: "Sprint",
    olympic: "Olympic",
    half: "Half IRONMAN",
    full: "Full IRONMAN",
  };

  return (
    <Link href={`/races/${item.raceId}`}>
      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
        <div className="flex items-center gap-6">
          {/* Race Image Placeholder */}
          <div className="flex-shrink-0 w-24 h-24 bg-muted rounded-md flex items-center justify-center">
            <span className="text-2xl">🏁</span>
          </div>

          {/* Race Info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-grow">
                <h3 className="font-semibold text-lg truncate">
                  {item.raceName}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{item.location.city}, {item.location.state}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{item.raceDate.toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {distanceLabels[item.distance]}
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
