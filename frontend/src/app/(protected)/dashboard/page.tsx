import { BookOpen, PenSquare, Brain } from "lucide-react";
import { ActionCard } from "@/components/ui/action-card";
import { DeckCard } from "@/components/ui/deck-card";

export default function Dashboard() {
  return (
    <div className="py-16 px-12 space-y-6">
      {/* Header */}
      <div className="flex justify-between gap-6 items-start">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back, Alex!
          </h1>
          <p className="text-secondary-foreground font-fragment-mono text-sm">
            Ready to continue your journey?
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-foreground">
          <div className="text-2xl gap-2 flex font-semibold">
            <span>🔥</span>
            <span>7</span>
          </div>

          <span className="text-secondary-foreground text-sm font-fragment-mono">
            Daily Streaks
          </span>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 py-8 lg:grid-cols-3 gap-4">
        <ActionCard
          icon={
            <span className="w-10 h-10 flex items-center p-2 bg-primary-green justify-center rounded-[10px] bg-primary-green/20 text-primary-green text-2xl">
              📌
            </span>
          }
          title="Create a new deck"
          description="Start a new collection"
          color="bg-primary-green/20"
        />
        <ActionCard
          icon={
            <span className="w-10 h-10 flex items-center p-2 bg-primary-blue rounded-[10px] justify-center  bg-primary-orange/20 text-primary-orange text-2xl">
              ✍️
            </span>
          }
          title="Add a new note"
          description="Start a new collection"
          color="bg-primary-orange/20"
        />
        <ActionCard
          icon={
            <span className="w-10 h-10 flex p-2 rounded-[10px] bg-primary-orange items-center justify-center bg-primary-blue/20 text-primary-blue text-2xl">
              🧠
            </span>
          }
          title="Learn and test"
          description="Start a new collection"
          color="bg-primary-blue/20"
        />
      </div>

      {/* Recent Decks */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Decks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DeckCard title="JS Basics" progress={45} cardsCount={42} />
          <DeckCard title="Biology" progress={75} cardsCount={10} />
          <DeckCard title="Biology" progress={75} cardsCount={10} />
        </div>
      </div>
    </div>
  );
}
