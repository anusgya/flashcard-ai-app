"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DeckListItem } from "@/components/ui/deck-list-item";
import { CreateDeckModal } from "@/components/ui/create-deck-modal";
import { UploadModal } from "@/components/ui/upload-modal";
import { ImportModal } from "@/components/ui/import-modal";
import { useDecks } from "@/hooks/api/use-deck";
import { useDueCards, updateCardStates } from "@/hooks/api/useStudy"; // Import updateCardStates function
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useCards } from "@/hooks/api/use-card";
import { Filter } from "lucide-react";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define types for the deck data
interface Deck {
  id: string;
  name: string;
  description: string;
  card_count?: number;
  is_public?: boolean;
  source_type?: string;
  created_at?: string;
  updated_at?: string;
}

// Define interface for card counts
interface DeckCardCounts {
  [deckId: string]: {
    newCount: number;
    dueCount: number;
    learnCount: number;
    isLoading: boolean;
  };
}

// Define sort options
type SortOption = {
  label: string;
  value: string;
  compareFn: (a: Deck, b: Deck) => number;
};

export default function DecksPage() {
  const { decks, isLoading, isError, mutate } = useDecks();
  console.log("decks", decks);
  // State to track card counts for all decks
  const [deckCardCounts, setDeckCardCounts] = useState<DeckCardCounts>({});
  const [isUpdatingCardStates, setIsUpdatingCardStates] = useState(false);
  // Add search state
  const [searchQuery, setSearchQuery] = useState("");
  // Add sort state - changed default from "name-asc" to "created-desc"
  const [sortOption, setSortOption] = useState<string>("created-desc");

  // Define sort options
  const sortOptions: SortOption[] = [
    {
      label: "Name (A-Z)",
      value: "name-asc",
      compareFn: (a: Deck, b: Deck) => a.name.localeCompare(b.name),
    },
    {
      label: "Name (Z-A)",
      value: "name-desc",
      compareFn: (a: Deck, b: Deck) => b.name.localeCompare(a.name),
    },
    {
      label: "Newest First",
      value: "created-desc",
      compareFn: (a: Deck, b: Deck) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      },
    },
    {
      label: "Oldest First",
      value: "created-asc",
      compareFn: (a: Deck, b: Deck) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      label: "Last Updated",
      value: "updated-desc",
      compareFn: (a: Deck, b: Deck) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA;
      },
    },
    {
      label: "Card Count (High to Low)",
      value: "cards-desc",
      compareFn: (a: Deck, b: Deck) => {
        const countA = a.card_count || 0;
        const countB = b.card_count || 0;
        return countB - countA;
      },
    },
    {
      label: "Card Count (Low to High)",
      value: "cards-asc",
      compareFn: (a: Deck, b: Deck) => {
        const countA = a.card_count || 0;
        const countB = b.card_count || 0;
        return countA - countB;
      },
    },
  ];

  // Update all card states when the page loads
  useEffect(() => {
    async function updateAllDeckCardStates() {
      if (!decks || decks.length === 0) return;

      setIsUpdatingCardStates(true);
      try {
        // Update all card states (no specific deck ID)
        await updateCardStates();

        // Log for debugging
        console.log("Successfully updated all card states");
      } catch (error) {
        console.error("Failed to update card states:", error);
      } finally {
        setIsUpdatingCardStates(false);
      }
    }

    updateAllDeckCardStates();
  }, [decks]); // Run when decks change

  // Load card counts for each deck when the decks list changes
  useEffect(() => {
    if (decks && decks.length > 0) {
      // Initialize counts with loading state
      const initialCounts: DeckCardCounts = {};
      decks.forEach((deck: Deck) => {
        initialCounts[deck.id] = {
          newCount: 0,
          dueCount: 0,
          learnCount: 0,
          isLoading: true,
        };
      });
      setDeckCardCounts(initialCounts);
    }
  }, [decks]);

  // Filter decks based on search query
  const filteredDecks = decks?.filter((deck: Deck) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      deck.name.toLowerCase().includes(query) ||
      (deck.description && deck.description.toLowerCase().includes(query))
    );
  });

  // Sort the filtered decks
  const sortedDecks = filteredDecks
    ? [...filteredDecks].sort(
        sortOptions.find((option) => option.value === sortOption)?.compareFn ||
          sortOptions[0].compareFn
      )
    : [];

  return (
    <motion.div
      className="py-16 px-12 space-y-14"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="flex justify-between items-end gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">All decks</h1>
          <p className="text-secondary-foreground font-fragment-mono text-sm">
            All your card collections are here
          </p>
        </div>
        <div className="relative w-80 border-0 bg-secondary">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-foreground" />
          <Input
            className="py-[5px] pl-10 placeholder:text-secondary-foreground border-border"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </motion.div>

      <div className="space-y-8">
        {/* Action Buttons */}
        <motion.div
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div>
            <CreateDeckModal onDeckCreated={() => mutate()} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="text-secondary-foreground border-b-1 bg-secondary border-divider hover:text-foreground"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {sortOptions.find((option) => option.value === sortOption)
                  ?.label || "Sort"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortOption(option.value)}
                  className={
                    sortOption === option.value
                      ? "bg-secondary font-medium"
                      : ""
                  }
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        {/* Decks List */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {isLoading || isUpdatingCardStates ? (
            // Show loading skeletons with animations
            Array(3)
              .fill(0)
              .map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                >
                  <Skeleton className="h-24 w-full rounded-lg" />
                </motion.div>
              ))
          ) : isError ? (
            // Show error message with animation
            <motion.div
              className="text-red-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              Failed to load decks. Please try again later.
            </motion.div>
          ) : sortedDecks && sortedDecks.length > 0 ? (
            // Show filtered decks with staggered animations
            sortedDecks.map((deck: Deck, index: number) => (
              <DeckCardCountFetcher
                key={deck.id}
                deck={deck}
                index={index}
                deckCardCounts={deckCardCounts}
                setDeckCardCounts={setDeckCardCounts}
                onDeckEdit={() => mutate()}
                onDeckDelete={() => mutate()}
              />
            ))
          ) : (
            // Show empty state or no results message
            <motion.div
              className="text-secondary-foreground text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {decks && decks.length > 0
                ? `No decks found matching "${searchQuery}"`
                : "No decks found. Create your first deck to get started!"}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

// Component to fetch card counts for each deck
function DeckCardCountFetcher({
  deck,
  index,
  deckCardCounts,
  setDeckCardCounts,
  onDeckEdit,
  onDeckDelete,
}: {
  deck: Deck;
  index: number;
  deckCardCounts: DeckCardCounts;
  setDeckCardCounts: React.Dispatch<React.SetStateAction<DeckCardCounts>>;
  onDeckEdit: () => void;
  onDeckDelete: () => void;
}) {
  // Handle TypeScript UUID type issues with type assertion
  const {
    dueCards,
    isLoading,
    isError,
    mutate: refreshDueCards,
  } = useDueCards(deck.id as any);

  // Update card counts when dueCards data changes
  useEffect(() => {
    if (!isLoading && dueCards) {
      setDeckCardCounts((prev) => ({
        ...prev,
        [deck.id]: {
          newCount: dueCards.new_cards || 0,
          // Due now includes both learning and review cards that are currently due
          dueCount: dueCards.due_now || 0,
          learnCount: dueCards.learning_cards || 0,
          isLoading: false,
        },
      }));
    }
  }, [deck.id, dueCards, isLoading, setDeckCardCounts]);

  // Function to update a specific deck's card states
  const updateDeckCardStates = async () => {
    try {
      // Update card states for this specific deck
      await updateCardStates(deck.id as any);
      // Refresh the due cards data
      refreshDueCards();
    } catch (error) {
      console.error(`Failed to update card states for deck ${deck.id}:`, error);
    }
  };

  // Update card states for this deck on component mount
  useEffect(() => {
    updateDeckCardStates();

    // Set up an interval to update states every 5 minutes (300000ms)
    // This is especially useful for cards that become due during a long session
    const intervalId = setInterval(updateDeckCardStates, 300000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [deck.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
    >
      <DeckListItem
        title={deck.name}
        description={deck.description}
        newCount={deckCardCounts[deck.id]?.newCount || 0}
        dueCount={deckCardCounts[deck.id]?.dueCount || 0}
        learnCount={deckCardCounts[deck.id]?.learnCount || 0}
        id={deck.id}
        OnDeckEdit={onDeckEdit}
        OnDeckDelete={onDeckDelete}
        is_public={deck.is_public || false}
      />
    </motion.div>
  );
}
