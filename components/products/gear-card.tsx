import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { GearItem } from "@/lib/types";
import { calculateEndurank, calculateNormalizedPrice } from "@/lib/endurank";
import { getPriceTier, getPriceTierDisplay, getEndurankColor } from "@/lib/utils/price-tier";

interface GearCardProps {
  item: GearItem;
  userCostSensitivity?: number;
  categoryMaxPrice?: number;
}

export function GearCard({ item, userCostSensitivity = 0.5, categoryMaxPrice = 10000 }: GearCardProps) {
  // Calculate Endurank for this item
  const normalizedPrice = calculateNormalizedPrice(item.msrp, categoryMaxPrice);
  const endurank = calculateEndurank({
    averageRating: item.averageRating,
    costSensitivity: userCostSensitivity,
    normalizedPrice,
  });

  const priceTier = getPriceTier(item.msrp, "gear");
  const priceTierDisplay = getPriceTierDisplay(priceTier);
  const endurankColor = getEndurankColor(endurank);

  return (
    <Link href={`/gear/${item.productId}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden">
        {/* Prominent Image */}
        <div className="aspect-square bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl">
              {item.subCategory === "bikes" ? "🚴" : item.subCategory === "running-shoes" ? "👟" : "🥤"}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Product Name & Brand */}
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{item.productName}</h3>
            <p className="text-sm text-muted-foreground">{item.brand}</p>
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
