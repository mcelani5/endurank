"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Search, Bike, Award, Flame, Globe, Mic, Paperclip, Sparkles, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_PROMPTS = [
  {
    icon: Bike,
    label: "Gear",
    questions: [
      "What's the best triathlon bike for beginners under $3000?",
      "Compare Hoka Clifton 9 vs Nike Vaporfly for marathon training",
      "Best running shoes for long-distance triathlons"
    ]
  },
  {
    icon: Award,
    label: "Races",
    questions: [
      "Find beginner-friendly sprint triathlons in California",
      "What are the hardest Ironman courses in the US?",
      "Compare IRONMAN California vs IRONMAN Arizona"
    ]
  },
  {
    icon: Flame,
    label: "Nutrition",
    questions: [
      "Best energy gels for long-distance running",
      "How to fuel during an Olympic distance triathlon",
      "Compare Maurten vs GU energy products"
    ]
  },
  {
    icon: Sparkles,
    label: "Training",
    questions: [
      "Create a 12-week training plan for Olympic distance",
      "How to improve my swim technique for triathlon",
      "Best strength training exercises for triathletes"
    ]
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const categoryChipsRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    router.push(`/search?q=${encodeURIComponent(question)}`);
  };

  const handleCategoryClick = (categoryLabel: string) => {
    // Toggle if clicking the same category
    if (selectedCategory === categoryLabel && showSuggestions) {
      setShowSuggestions(false);
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryLabel);
      setShowSuggestions(true);
    }
  };

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        categoryChipsRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !categoryChipsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedCategory(null);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  // Filter categories based on selection
  const filteredCategories = selectedCategory
    ? CATEGORY_PROMPTS.filter(cat => cat.label === selectedCategory)
    : CATEGORY_PROMPTS;

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a1a] px-4">
        {/* Logo */}
        <h1 className="text-6xl md:text-7xl font-light text-white mb-20 text-center tracking-tight">
          Endu<span className="text-gray-400">rank</span>
        </h1>

        {/* Main Search Box */}
        <div className="w-full max-w-3xl mb-8 relative">
          <form onSubmit={handleSearch}>
            <div className="relative bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl hover:border-[#4a4a4a] transition-colors">
              <div className="flex items-center px-4 py-4">
                {/* Left Icons */}
                <div className="flex items-center gap-3 mr-3">
                  <button
                    type="submit"
                    className="p-2 hover:bg-[#3a3a3a] rounded-lg transition-colors"
                    disabled={!searchQuery.trim()}
                  >
                    <Search className="h-5 w-5 text-gray-400" />
                  </button>
                  <button
                    type="button"
                    className="p-2 hover:bg-[#3a3a3a] rounded-lg transition-colors"
                  >
                    <Sparkles className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                {/* Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask anything about triathlon gear, races, or training..."
                  className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-base"
                />

                {/* Right Icons */}
                <div className="flex items-center gap-2 ml-3">
                  <button
                    type="button"
                    className="p-2 hover:bg-[#3a3a3a] rounded-lg transition-colors"
                  >
                    <Globe className="h-5 w-5 text-gray-400" />
                  </button>
                  <button
                    type="button"
                    className="p-2 hover:bg-[#3a3a3a] rounded-lg transition-colors"
                  >
                    <Paperclip className="h-5 w-5 text-gray-400" />
                  </button>
                  <button
                    type="button"
                    className="p-2 hover:bg-[#3a3a3a] rounded-lg transition-colors"
                  >
                    <Mic className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Suggested Questions Dropdown */}
            {showSuggestions && (
              <div ref={dropdownRef} className="absolute top-full mt-2 w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl shadow-2xl max-h-[500px] overflow-y-auto z-50">
                {filteredCategories.map((category, catIdx) => {
                  const Icon = category.icon;
                  return (
                    <div key={catIdx} className="p-4 border-b border-[#3a3a3a] last:border-b-0">
                      {/* Category Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-300">{category.label}</span>
                      </div>

                      {/* Questions */}
                      <div className="space-y-2">
                        {category.questions.map((question, qIdx) => (
                          <button
                            key={qIdx}
                            onClick={() => handleSuggestedQuestion(question)}
                            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#3a3a3a] transition-colors group flex items-start gap-2"
                          >
                            <Search className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-300 group-hover:text-white">
                              {question}
                            </span>
                            <ArrowUpRight className="h-4 w-4 text-gray-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </form>
        </div>

        {/* Category Chips */}
        <div ref={categoryChipsRef} className="flex flex-wrap gap-3 justify-center max-w-3xl">
          {CATEGORY_PROMPTS.map((category, idx) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.label;
            return (
              <button
                key={idx}
                onClick={() => handleCategoryClick(category.label)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-full text-sm transition-colors ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-[#2a2a2a] hover:bg-[#3a3a3a] border-[#3a3a3a] text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {category.label}
              </button>
            );
          })}
        </div>
      </main>
    </>
  );
}
