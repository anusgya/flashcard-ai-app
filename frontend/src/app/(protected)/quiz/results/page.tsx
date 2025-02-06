"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuizResultsPage() {
  const searchParams = useSearchParams();
  const attempted = Number.parseInt(searchParams.get("attempted") || "0");
  const correct = Number.parseInt(searchParams.get("correct") || "0");
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8 text-center"
      >
        <div className="flex justify-center">
          <motion.div
            initial={{ rotate: -30 }}
            animate={{ rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            <Trophy className="w-16 h-16 text-primary-orange" />
          </motion.div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Quiz Complete!</h1>
          <p className="text-secondary-foreground font-fragment-mono">
            Here's how you did:
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-3xl font-bold text-foreground">{attempted}</p>
            <p className="text-sm text-secondary-foreground font-fragment-mono">
              Attempted
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-foreground">{correct}</p>
            <p className="text-sm text-secondary-foreground font-fragment-mono">
              Correct
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-foreground">{accuracy}%</p>
            <p className="text-sm text-secondary-foreground font-fragment-mono">
              Accuracy
            </p>
          </div>
        </div>

        <div className="pt-8">
          <Button
            className="bg-primary-green text-background font-fragment-mono"
            onClick={() => (window.location.href = "/quiz")}
          >
            Back to Quizzes
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
