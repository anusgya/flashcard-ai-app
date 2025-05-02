"use client"

import { ArrowLeft, Plus, Filter, ArrowUpDown, Search, BookCheck, ChevronDown } from "lucide-react"
import Link from "next/link"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardListItem } from "@/components/ui/card-list-item"
import { useCards } from "@/hooks/api/use-card"
import { useParams } from "next/navigation"
import { useDeck } from "@/hooks/api/use-deck"
import { motion } from "framer-motion"
import { UploadModal } from "@/components/ui/upload-modal"
import { ImportModal } from "@/components/ui/import-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Define types for the data structures
interface Card {
  id: string
  front_content: string
  back_content: string
  created_at: string
  updated_at: string
  card_state: string
  difficulty_level: string
  success_rate: number
  times_reviewed: number
  last_reviewed: string | null
  // Add other card properties as needed
  [key: string]: any // For any additional properties
}

interface Deck {
  id: string
  name: string
  description: string
  // Add other deck properties as needed
}

// Define sort options
type SortOption = {
  label: string;
  value: string;
  compareFn: (a: Card, b: Card) => number;
};

export default function CardsPage() {
  const params = useParams<{ deckId: string }>()
  const deckId = params.deckId

  const { deck } = useDeck(deckId)
  const { cards, isLoading, isError, mutate } = useCards(deckId)
  // Add search state
  const [searchQuery, setSearchQuery] = useState("")
  // Add sort state
  const [sortOption, setSortOption] = useState<string>("created-desc")

  // Define sort options
  const sortOptions: SortOption[] = [
    {
      label: "Newest First",
      value: "created-desc",
      compareFn: (a: Card, b: Card) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
    },
    {
      label: "Oldest First",
      value: "created-asc",
      compareFn: (a: Card, b: Card) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      }
    },
    {
      label: "Front Content (A-Z)",
      value: "front-asc",
      compareFn: (a: Card, b: Card) => {
        const frontA = a.front_content || "";
        const frontB = b.front_content || "";
        return frontA.localeCompare(frontB);
      }
    },
    {
      label: "Front Content (Z-A)",
      value: "front-desc",
      compareFn: (a: Card, b: Card) => {
        const frontA = a.front_content || "";
        const frontB = b.front_content || "";
        return frontB.localeCompare(frontA);
      }
    },
    {
      label: "Card State",
      value: "card-state",
      compareFn: (a: Card, b: Card) => {
        const stateA = a.card_state || "";
        const stateB = b.card_state || "";
        return stateA.localeCompare(stateB);
      }
    },
    {
      label: "Difficulty (Easiest First)",
      value: "difficulty-asc",
      compareFn: (a: Card, b: Card) => {
        const difficultyA = a.difficulty_level || "";
        const difficultyB = b.difficulty_level || "";
        return difficultyA.localeCompare(difficultyB);
      }
    },
    {
      label: "Success Rate (High to Low)",
      value: "success-desc",
      compareFn: (a: Card, b: Card) => {
        const rateA = a.success_rate || 0;
        const rateB = b.success_rate || 0;
        return rateB - rateA;
      }
    },
    {
      label: "Most Reviewed",
      value: "times-reviewed-desc",
      compareFn: (a: Card, b: Card) => {
        const reviewedA = a.times_reviewed || 0;
        const reviewedB = b.times_reviewed || 0;
        return reviewedB - reviewedA;
      }
    },
    {
      label: "Recently Reviewed",
      value: "last-reviewed-desc",
      compareFn: (a: Card, b: Card) => {
        const dateA = a.last_reviewed ? new Date(a.last_reviewed).getTime() : 0;
        const dateB = b.last_reviewed ? new Date(b.last_reviewed).getTime() : 0;
        return dateB - dateA;
      }
    }
  ];

  // Filter cards based on search query
  const filteredCards = cards?.filter((card: Card) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      card.front_content?.toLowerCase().includes(query) ||
      card.back_content?.toLowerCase().includes(query)
    );
  });

  // Sort the filtered cards
  const sortedCards = filteredCards ? [...filteredCards].sort(
    sortOptions.find(option => option.value === sortOption)?.compareFn ||
    sortOptions[0].compareFn
  ) : [];

  console.log("Cards data:", cards);
  console.log("Filtered cards:", filteredCards);
  console.log("Sorted cards:", sortedCards);
  console.log("Search query:", searchQuery);
  console.log("Sort option:", sortOption);

  return (
    <motion.div className="py-3 px-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Link href="/decks">
          <Button
            variant="outline"
            size="icon"
            className="text-secondary-foreground border mb-4 border-divider rounded-full hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </motion.div>

      <motion.div
        className="flex justify-between items-end gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{deck?.name}</h1>
          <p className="text-secondary-foreground font-fragment-mono text-sm">{deck?.description}</p>
        </div>
        <div className="relative w-80 border-0 bg-secondary rounded-lg">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-foreground" />
          <Input
            className="py-[5px] pl-10 placeholder:text-secondary-foreground border border-border"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </motion.div>

      <div className="space-y-8 mt-14">
        {/* Action Buttons */}
        <motion.div
          className="flex justify-between gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex gap-2">
            <Link href="/decks/addCard" as={`/decks/addCard`}>
              <Button className="bg-primary-green hover:border-0 text-muted font-semibold hover:bg-primary-green/90">
                <Plus className="h-4 w-4 " />
                Add Note
              </Button>
            </Link>
            <UploadModal deckId={deckId} onUploadComplete={() => mutate()} />
            <ImportModal onImportComplete={() => mutate()} />
          </div>
          <div className="flex gap-2">
            {/* Sort Dropdown - Moved next to Learn Now */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="text-secondary-foreground border-b-1 bg-secondary border-divider hover:text-foreground"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {sortOptions.find(option => option.value === sortOption)?.label || "Sort"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSortOption(option.value)}
                    className={sortOption === option.value ? "bg-secondary font-medium" : ""}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link href={`/learn/${deckId}`}>
              <Button className="bg-primary-orange hover:border-0 text-muted font-semibold border-primary-orange-secondary">
                <BookCheck className="h-4 w-4" />
                Learn Now
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Cards List */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {isLoading ? (
            // Add loading state here if needed
            <div className="text-center py-8">Loading cards...</div>
          ) : isError ? (
            // Add error state here if needed
            <div className="text-center py-8 text-red-500">Failed to load cards</div>
          ) : sortedCards && sortedCards.length > 0 ? (
            sortedCards.map((card: Card, index: number) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
              >
                <CardListItem 
                  key={card.id}
                  deck_id={deckId}
                  front_content={card.front_content}
                  back_content={card.back_content}
                  id={card.id}
                  onCardDelete={() => mutate()}
                  onCardEdit={() => mutate()}
                />
              </motion.div>
            ))
          ) : (
            <motion.div
              className="text-secondary-foreground text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {cards && cards.length > 0 
                ? `No cards found matching "${searchQuery}"`
                : "No cards found in this deck. Add your first card to get started!"}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}