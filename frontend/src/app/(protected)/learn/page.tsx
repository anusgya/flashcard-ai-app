import { DeckCard } from "@/components/ui/deck-card";

const decks = [
  { id: 1, title: "JS Basics", progress: 75, cardsCount: 40 },
  { id: 2, title: "React Fundamentals", progress: 45, cardsCount: 35 },
  { id: 3, title: "TypeScript Essentials", progress: 90, cardsCount: 50 },
  { id: 4, title: "Node.js Mastery", progress: 60, cardsCount: 45 },
  { id: 5, title: "CSS Tricks", progress: 80, cardsCount: 30 },
  { id: 6, title: "Web Security", progress: 55, cardsCount: 25 },
];

export default function LearnPage() {
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
        {decks.map((deck) => (
          <DeckCard
            key={deck.id}
            title={deck.title}
            progress={deck.progress}
            cardsCount={deck.cardsCount}
          />
        ))}
      </div>
    </div>
  );
}
