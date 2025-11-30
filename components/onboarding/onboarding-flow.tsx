"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CostSensitivity, RaceDistance, SkillLevel } from "@/lib/types";
import { upsertUser } from "@/lib/db-utils";
import { useAuth } from "@/lib/auth-context";

type OnboardingData = {
  costSensitivity: CostSensitivity;
  preferredDistance: RaceDistance;
  skillLevel: SkillLevel;
};

export function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const [loading, setLoading] = useState(false);
  const { user, firebaseUser } = useAuth();
  const router = useRouter();

  const handleComplete = async () => {
    if (!firebaseUser || !data.costSensitivity || !data.preferredDistance || !data.skillLevel) {
      return;
    }

    setLoading(true);
    try {
      await upsertUser({
        uid: firebaseUser.uid,
        costSensitivity: data.costSensitivity,
        preferredDistance: data.preferredDistance,
        skillLevel: data.skillLevel,
      });
      router.push("/");
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded ${
                s <= step ? "bg-blue-600" : "bg-gray-200"
              } ${s !== 1 ? "ml-2" : ""}`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Step {step} of 3
        </p>
      </div>

      {/* Step 1: Skill Level */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>What's your experience level?</CardTitle>
            <CardDescription>
              We'll tailor recommendations to your skill level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => {
                setData({ ...data, skillLevel: "beginner" });
                setStep(2);
              }}
              className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold mb-1">Beginner</h3>
              <p className="text-sm text-muted-foreground">
                New to triathlon or completed a few races
              </p>
            </button>
            <button
              onClick={() => {
                setData({ ...data, skillLevel: "intermediate" });
                setStep(2);
              }}
              className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold mb-1">Intermediate</h3>
              <p className="text-sm text-muted-foreground">
                Regular racer with solid experience
              </p>
            </button>
            <button
              onClick={() => {
                setData({ ...data, skillLevel: "advanced" });
                setStep(2);
              }}
              className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold mb-1">Advanced</h3>
              <p className="text-sm text-muted-foreground">
                Competitive athlete or age-group podium finisher
              </p>
            </button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Race Distance */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>What's your primary race distance?</CardTitle>
            <CardDescription>
              Help us recommend the most relevant gear and races
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => {
                setData({ ...data, preferredDistance: "sprint" });
                setStep(3);
              }}
              className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold mb-1">Sprint</h3>
              <p className="text-sm text-muted-foreground">
                750m swim / 20km bike / 5km run
              </p>
            </button>
            <button
              onClick={() => {
                setData({ ...data, preferredDistance: "olympic" });
                setStep(3);
              }}
              className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold mb-1">Olympic</h3>
              <p className="text-sm text-muted-foreground">
                1.5km swim / 40km bike / 10km run
              </p>
            </button>
            <button
              onClick={() => {
                setData({ ...data, preferredDistance: "half" });
                setStep(3);
              }}
              className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold mb-1">Half Ironman (70.3)</h3>
              <p className="text-sm text-muted-foreground">
                1.9km swim / 90km bike / 21km run
              </p>
            </button>
            <button
              onClick={() => {
                setData({ ...data, preferredDistance: "full" });
                setStep(3);
              }}
              className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold mb-1">Full Ironman (140.6)</h3>
              <p className="text-sm text-muted-foreground">
                3.8km swim / 180km bike / 42km run
              </p>
            </button>
            <Button variant="outline" onClick={() => setStep(1)} className="mt-4">
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Budget/Cost Sensitivity */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>What's your budget priority?</CardTitle>
            <CardDescription>
              We'll personalize recommendations based on your cost sensitivity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => {
                setData({ ...data, costSensitivity: "economy" });
              }}
              className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                data.costSensitivity === "economy"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-blue-600 hover:bg-blue-50"
              }`}
            >
              <h3 className="font-semibold mb-1">Economy</h3>
              <p className="text-sm text-muted-foreground">
                Best value for money - prioritize budget-friendly options
              </p>
            </button>
            <button
              onClick={() => {
                setData({ ...data, costSensitivity: "mid-range" });
              }}
              className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                data.costSensitivity === "mid-range"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-blue-600 hover:bg-blue-50"
              }`}
            >
              <h3 className="font-semibold mb-1">Mid-Range</h3>
              <p className="text-sm text-muted-foreground">
                Balanced approach - good quality at reasonable prices
              </p>
            </button>
            <button
              onClick={() => {
                setData({ ...data, costSensitivity: "performance" });
              }}
              className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                data.costSensitivity === "performance"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-blue-600 hover:bg-blue-50"
              }`}
            >
              <h3 className="font-semibold mb-1">Performance</h3>
              <p className="text-sm text-muted-foreground">
                Best quality - prioritize top-tier gear regardless of cost
              </p>
            </button>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!data.costSensitivity || loading}
                className="flex-1"
              >
                {loading ? "Saving..." : "Complete Setup"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
