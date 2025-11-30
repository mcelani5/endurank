"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { useAuth } from "@/lib/auth-context";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to home if already logged in
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center">Loading...</div>
      </main>
    );
  }

  // Don't show auth form if user is logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">
          Endu<span className="text-blue-600">rank</span>
        </h1>
        <p className="text-muted-foreground">
          Your personalized endurance sports companion
        </p>
      </div>
      <AuthForm />
    </main>
  );
}
