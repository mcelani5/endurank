import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-2">
          Endu<span className="text-blue-600">rank</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Let's personalize your experience
        </p>
      </div>
      <OnboardingFlow />
    </main>
  );
}
