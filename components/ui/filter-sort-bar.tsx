"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Filter, ArrowUpDown, ChevronDown } from "lucide-react";

export type SortOption = "endurank-desc" | "endurank-asc" | "rating-desc" | "price-asc" | "price-desc";
export type PriceFilter = "all" | "budget" | "mid" | "premium";

interface FilterSortBarProps {
  // Sort
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;

  // Price Filter
  priceFilter: PriceFilter;
  onPriceFilterChange: (filter: PriceFilter) => void;

  // Category Filter (optional, for gear pages)
  categories?: string[];
  selectedCategories?: string[];
  onCategoriesChange?: (categories: string[]) => void;

  // Optional count display
  itemCount?: number;
}

export function FilterSortBar({
  sortBy,
  onSortChange,
  priceFilter,
  onPriceFilterChange,
  categories,
  selectedCategories = [],
  onCategoriesChange,
  itemCount,
}: FilterSortBarProps) {
  const sortLabels: Record<SortOption, string> = {
    "endurank-desc": "Endurank: High to Low",
    "endurank-asc": "Endurank: Low to High",
    "rating-desc": "Rating: High to Low",
    "price-asc": "Price: Low to High",
    "price-desc": "Price: High to Low",
  };

  const priceLabels: Record<PriceFilter, string> = {
    all: "All Prices",
    budget: "$",
    mid: "$$",
    premium: "$$$",
  };

  const handleCategoryToggle = (category: string) => {
    if (!onCategoriesChange) return;

    const newSelected = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];

    onCategoriesChange(newSelected);
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-3">
        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" className="gap-2 font-semibold">
              <Filter className="h-4 w-4" />
              Filter
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filter by Price</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={priceFilter} onValueChange={(value) => onPriceFilterChange(value as PriceFilter)}>
              <DropdownMenuRadioItem value="all">
                All Prices
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="budget">
                $ (Budget)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="mid">
                $$ (Mid-range)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="premium">
                $$$ (Premium)
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>

            {categories && categories.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ")}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" className="gap-2 font-semibold">
              <ArrowUpDown className="h-4 w-4" />
              Sort
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
              <DropdownMenuRadioItem value="endurank-desc">
                Endurank: High to Low
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="endurank-asc">
                Endurank: Low to High
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="rating-desc">
                Rating: High to Low
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="price-asc">
                Price: Low to High
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="price-desc">
                Price: High to Low
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Active Filters Display */}
        <div className="flex items-center gap-2">
          {priceFilter !== "all" && (
            <span className="px-2 py-1 bg-background rounded-md text-sm font-medium border">
              {priceLabels[priceFilter]}
            </span>
          )}
          {selectedCategories.length > 0 && (
            <span className="px-2 py-1 bg-background rounded-md text-sm font-medium border">
              {selectedCategories.length} {selectedCategories.length === 1 ? "category" : "categories"}
            </span>
          )}
        </div>
      </div>

      {/* Item Count */}
      {itemCount !== undefined && (
        <div className="text-sm text-muted-foreground font-medium">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </div>
      )}
    </div>
  );
}
