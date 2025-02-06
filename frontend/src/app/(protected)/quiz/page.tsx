"use client";

import { QuizCard } from "@/components/quiz-card";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const decks = [
  { id: 1, title: "JS Basics", cardsCount: 40, color: "orange" },
  { id: 2, title: "React Fundamentals", cardsCount: 35, color: "blue" },
  { id: 3, title: "TypeScript Essentials", cardsCount: 50, color: "green" },
  { id: 4, title: "Node.js Mastery", cardsCount: 45, color: "blue" },
  { id: 5, title: "CSS Tricks", cardsCount: 30, color: "orange" },
  { id: 6, title: "Web Security", cardsCount: 25, color: "green" },
];

export default function QuizPage() {
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
        {decks.map((deck) => (
          <motion.div
            key={deck.id}
            variants={{
              hidden: { opacity: 0, y: 50 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <QuizCard
              title={deck.title}
              cardsCount={deck.cardsCount}
              color={deck.color as "blue" | "green" | "orange"}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
