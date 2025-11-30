import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Review } from "@/lib/types";

interface ReviewListProps {
  reviews: Review[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  const getTierVariant = (tier: string) => {
    if (tier === "expert") return "gold";
    if (tier === "contributor") return "silver";
    return "bronze";
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No reviews yet. Be the first to review!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.reviewId}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="font-medium">User #{review.userId.slice(0, 8)}</span>
                <Badge variant={getTierVariant(review.userTier)}>
                  {review.userTier}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{review.rating}</span>
              </div>
            </div>
            <h3 className="font-semibold text-lg">{review.title}</h3>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{review.text}</p>
            {review.raceSubRatings && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>Course: {review.raceSubRatings.course}/5</div>
                <div>Value: {review.raceSubRatings.cost}/5</div>
                <div>Volunteers: {review.raceSubRatings.volunteers}/5</div>
                <div>Spectators: {review.raceSubRatings.spectators}/5</div>
              </div>
            )}
            <div className="mt-2 text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
