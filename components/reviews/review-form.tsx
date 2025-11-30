"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

interface ReviewFormProps {
  itemId: string;
  itemType: "gear" | "race";
  onSubmit?: () => void;
}

export function ReviewForm({ itemId, itemType, onSubmit }: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  // Race-specific sub-ratings
  const [courseRating, setCourseRating] = useState(0);
  const [costRating, setCostRating] = useState(0);
  const [volunteersRating, setVolunteersRating] = useState(0);
  const [spectatorRating, setSpectatorRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;

    setLoading(true);
    try {
      // TODO: Implement actual review submission to Firestore
      console.log("Submitting review:", {
        itemId,
        itemType,
        userId: user.uid,
        userTier: user.tier,
        rating,
        title,
        text,
        ...(itemType === "race" && {
          raceSubRatings: {
            course: courseRating,
            cost: costRating,
            volunteers: volunteersRating,
            spectators: spectatorRating,
          },
        }),
      });

      // Reset form
      setRating(0);
      setTitle("");
      setText("");
      setCourseRating(0);
      setCostRating(0);
      setVolunteersRating(0);
      setSpectatorRating(0);

      if (onSubmit) onSubmit();
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please sign in to leave a review
          </p>
        </CardContent>
      </Card>
    );
  }

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label?: string }) => (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${
                star <= (hoverRating || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>Share your experience with the community</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <StarRating value={rating} onChange={setRating} label="Overall Rating" />

          {itemType === "race" && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <StarRating value={courseRating} onChange={setCourseRating} label="Course" />
              <StarRating value={costRating} onChange={setCostRating} label="Value" />
              <StarRating value={volunteersRating} onChange={setVolunteersRating} label="Volunteers" />
              <StarRating value={spectatorRating} onChange={setSpectatorRating} label="Spectators" />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Review Title
            </label>
            <Input
              id="title"
              placeholder="Sum up your experience"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="text" className="text-sm font-medium">
              Your Review
            </label>
            <textarea
              id="text"
              placeholder="Tell us more about your experience..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Button type="submit" disabled={loading || rating === 0}>
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
