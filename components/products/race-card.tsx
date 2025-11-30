import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Star, MapPin, Calendar } from "lucide-react";
import { RaceItem } from "@/lib/types";
import { calculateEndurank, calculateNormalizedPrice } from "@/lib/endurank";
import { getPriceTier, getPriceTierDisplay, getEndurankColor } from "@/lib/utils/price-tier";

interface RaceCardProps {
  item: RaceItem;
  userCostSensitivity?: number;
  categoryMaxPrice?: number;
}

export function RaceCard({ item, userCostSensitivity = 0.5, categoryMaxPrice = 1000 }: RaceCardProps) {
  const normalizedPrice = calculateNormalizedPrice(item.msrp, categoryMaxPrice);
  const endurank = calculateEndurank({
    averageRating: item.averageRating,
    costSensitivity: userCostSensitivity,
    normalizedPrice,
  });

  const priceTier = getPriceTier(item.msrp, "race");
  const priceTierDisplay = getPriceTierDisplay(priceTier);
  const endurankColor = getEndurankColor(endurank);

  const distanceLabels = {
    sprint: "Sprint",
    olympic: "Olympic",
    half: "Half",
    full: "Full",
  };

  return (
    <Link href={`/races/${item.raceId}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden">
        {/* Prominent Image */}
        <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900 flex items-center justify-center">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.raceName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl">🏁</span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Race Name & Location */}
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{item.raceName}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              <span>{item.location.city}, {item.location.state}</span>
            </div>
          </div>

          {/* Distance & Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-muted rounded-md font-medium">
              {distanceLabels[item.distance]}
            </span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(item.raceDate).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Snapshot Score */}
          <div className="flex items-center justify-between">
            {/* Endurank - Large, Personalized Color */}
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${endurankColor}`}>
                {endurank.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">Endurank</span>
            </div>

            {/* Average Rating - Small, Grey Star */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-muted-foreground" />
              <span className="text-sm">{item.averageRating.toFixed(1)}</span>
            </div>
          </div>

          {/* Price Tier */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              {item.totalReviewsCount} reviews
            </span>
            <span className="text-lg font-semibold text-foreground">
              {priceTierDisplay}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
