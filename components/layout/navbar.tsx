"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

export function Navbar() {
  const { user, logout, loading } = useAuth();

  const getTierVariant = (tier: string) => {
    if (tier === "expert") return "gold";
    if (tier === "contributor") return "silver";
    return "bronze";
  };

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-[#2a2a2a]">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-white">
            Endu<span className="text-white/80">rank</span>
          </Link>
          <div className="hidden md:flex gap-6">
            <Link
              href="/gear"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Gear
            </Link>
            <Link
              href="/races"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Races
            </Link>
            {user?.isAdmin && (
              <>
                <Link
                  href="/admin"
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Add Item
                </Link>
                <Link
                  href="/admin/moderate"
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Moderate
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-10 w-20 bg-white/20 animate-pulse rounded" />
          ) : user ? (
            <>
              <Link href="/wishlist">
                <Button variant="ghost" size="icon" className="text-white hover:bg-[#2a2a2a]">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white/90 hidden sm:inline">
                  {user.email}
                </span>
                <Badge variant={getTierVariant(user.tier)}>
                  {user.tier}
                </Badge>
              </div>
              <Button
                variant="ghost"
                onClick={logout}
                className="border border-[#3a3a3a] text-white hover:bg-[#2a2a2a] hover:text-white hover:border-[#4a4a4a]"
              >
                Sign out
              </Button>
            </>
          ) : (
            <Link href="/auth">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
