"use client";

import { QuizCard } from "@/components/quiz-card";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
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



export default function QuizPage() {
  const { decks } = useDecks();

  return (
    <div className="min-h-screen bg-background py-16 px-12 space-y-14">
      <div className="flex flex-col items-start gap-2">
        <h1 className="text-2xl font-bold  text-foreground ">
          {/* <Zap className="w-10 h-10 mr-4 text-primary-orange" /> */}
          Choose Your Quiz Adventure
        </h1>
        <p className="text-secondary-foreground font-fragment-mono text-sm text-center">
          let's see if you can connect the dots
        </p>
      </div>
      <motion.div
        className="gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.2,
            },
          },
        }}
        initial="hidden"
        animate="show"
      >
        {decks?.map((deck:Deck) => (
          <motion.div
            key={deck.id}
            variants={{
              hidden: { opacity: 0, y: 50 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <QuizCard
              deck_id={deck.id}
              title={deck.name}
              cardsCount={deck.card_count||0}
            
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
