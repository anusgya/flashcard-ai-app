"use client";

import { Plus, Upload, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeckListItem } from "@/components/ui/deck-list-item";
import { CreateDeckModal } from "@/components/ui/create-deck-modal";
import { UploadModal } from "@/components/ui/upload-modal";
import { ImportModal } from "@/components/ui/import-modal";
import { useDecks } from "@/hooks/api/use-deck";
import { Skeleton } from "@/components/ui/skeleton";



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

export default function DecksPage() {
  const { decks, isLoading, isError, mutate } = useDecks();

  return (
    <div className="py-16 px-12 space-y-14">
      {/* Header */}
      <div className="flex justify-between items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">All decks</h1>
          <p className="text-secondary-foreground font-fragment-mono text-sm">
            All your card collections are here
          </p>
        </div>
        <div className="relative w-80 border-0 bg-secondary">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-foreground" />
          <Input
            className="py-[5px] pl-10 placeholder:text-secondary-foreground "
            placeholder="Search"
          />
        </div>
      </div>

      <div className="space-y-8">
        {/* Action Buttons */}
        <div className="flex gap-2 ">
        <CreateDeckModal onDeckCreated={() => mutate()} />
        <UploadModal onUploadComplete={() => mutate()} />
        <ImportModal onImportComplete={() => mutate()} />
        </div>

        {/* Decks List */}
        <div className="space-y-4">
          {isLoading ? (
            // Show loading skeletons while fetching data
            Array(3).fill(0).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-lg" />
            ))
          ) : isError ? (
            // Show error message if fetch failed
            <div className="text-red-500">
              Failed to load decks. Please try again later.
            </div>
          ) : decks && decks.length > 0 ? (
            // Show actual decks if available
            decks.map((deck: Deck, index: number) => (
              <DeckListItem 
                key={deck.id || index} 
                title={deck.name} 
                description={deck.description}
                newCount={0}
                dueCount={0}
                learnCount={0}
                id={deck.id}
                OnDeckEdit={() => mutate()}
                OnDeckDelete={() => mutate()}
              />
            ))
          ) : (
            // Show message if no decks available
            <div className="text-secondary-foreground text-center py-20">
              No decks found. Create your first deck to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
