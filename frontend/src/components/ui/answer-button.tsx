"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnswerButtonProps {
  answer: string;
  number: number;
  isSelected: boolean;
  isCorrect?: boolean;
  isRevealed: boolean;
  onClick: () => void;
}

export function AnswerButton({
  answer,
  number,
  isSelected,
  isCorrect,
  isRevealed,
  onClick,
}: AnswerButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "w-full px-4 py-2 rounded-lg border-2 text-left font-fragment-mono",
        "hover:border-primary-green/50 transition-colors",
        "disabled:cursor-not-allowed flex items-center space-x-4",
        isSelected && !isRevealed && "border-primary-blue bg-primary-blue/10",
        isRevealed && isCorrect && "border-primary-green bg-primary-green/20",
        isRevealed &&
          !isCorrect &&
          isSelected &&
          "border-primary-orange bg-primary-orange/20",
        !isSelected && !isRevealed && "border-border bg-secondary"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={isRevealed}
    >
      <span className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-secondary-foreground font-bold">
        {number}
      </span>
      <span className="text-lg">{answer}</span>
    </motion.button>
  );
}
