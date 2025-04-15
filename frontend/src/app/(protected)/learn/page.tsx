"use client"
import { DeckCard } from "@/components/ui/deck-card";
import { useDecks } from "@/hooks/api/use-deck";

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


export default function LearnPage() {
  const { decks } = useDecks();
  return (
    <div className="py-16 px-12 space-y-14">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Choose a deck
        </h1>
        <p className="text-secondary-foreground font-fragment-mono text-sm">
          Select a deck to start learning
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks?.map((deck:Deck) => (
          <DeckCard
            key={deck.id}
            id={deck.id}
            title={deck.name}
            progress={70}
            cardsCount={deck.card_count||0}
          />
        ))}
      </div>
    </div>
  );
}
