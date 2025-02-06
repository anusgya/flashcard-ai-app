"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface QuizCardProps {
  title: string;
  cardsCount: number;
  color: "blue" | "green" | "orange";
}

export function QuizCard({ title, cardsCount, color }: QuizCardProps) {
  const getColorClass = (color: string) => {
    switch (color) {
      case "blue":
        return "primary-blue";
      case "green":
        return "primary-green";
      case "orange":
        return "primary-orange";
      default:
        return "primary-green";
    }
  };

  const colorClass = getColorClass(color);

  return (
    <Link href="/quiz/1">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`px-6 py-4 rounded-lg border border-border shadow-lg hover:shadow-xl transition-all cursor-pointer `}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <Sparkles className={`w-6 h-6 text-${colorClass}`} />
          </div>
          <div className="text-sm font-medium text-secondary-foreground font-fragment-mono">
            {cardsCount} cards
          </div>
          {/* <motion.div
            className="w-full bg-muted rounded-full h-2.5"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <div
              className={`bg-${colorClass} h-2.5 rounded-full`}
              style={{ width: `${Math.random() * 100}%` }}
            ></div>
          </motion.div> */}
        </div>
      </motion.div>
    </Link>
  );
}
