import { DeckCard } from "@/components/ui/deck-card";

const decks = [
  {
    id: 1,
    title: "JS Basics",
    progress: 75,
    cardsCount: 40,
  },
  {
    id: 2,
    title: "React Fundamentals",
    progress: 45,
    cardsCount: 35,
  },
  {
    id: 3,
    title: "TypeScript Essentials",
    progress: 90,
    cardsCount: 50,
  },
  {
    id: 3,
    title: "TypeScript Essentials",
    progress: 90,
    cardsCount: 50,
  },
  {
    id: 3,
    title: "TypeScript Essentials",
    progress: 90,
    cardsCount: 50,
  },
  {
    id: 3,
    title: "TypeScript Essentials",
    progress: 90,
    cardsCount: 50,
  },
];

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-background px-12 py-8 flex flex-col ">
      <div className="w-full  mx-auto pt-16 pb-8">
        <h1 className="text-2xl font-medium text-center text-secondary-foreground mb-12 font-fragment-mono ">
          Choose a deck
          <br></br>to start learning
        </h1>

        <div className="gap-4 grid grid-cols-3 ">
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
    </div>
  );
}
