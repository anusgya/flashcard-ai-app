"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuizDifficulty } from "@/enums";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface QuizSettingsProps {
  onStartQuiz: (difficulty: QuizDifficulty, numQuestions: number) => void;
  isLoading: boolean;
}

export function QuizSettings({ onStartQuiz, isLoading }: QuizSettingsProps) {
  const [difficulty, setDifficulty] = useState<QuizDifficulty>(
    QuizDifficulty.MEDIUM
  );
  const [numQuestions, setNumQuestions] = useState<number>(10);

  const handleStart = () => {
    onStartQuiz(difficulty, numQuestions);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 flex items-center justify-center relative overflow-hidden">
      {/* Animated floating glare circles background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute rounded-full blur-3xl"
          style={{
            width: 320,
            height: 320,
            background: "rgba(116, 178, 24, 0.18)",
            top: "10%",
            left: "10%",
          }}
          initial={{ x: 0, y: 0, scale: 1 }}
          animate={{
            x: [0, 40, -40, 0],
            y: [0, -30, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        />
        <motion.div
          aria-hidden
          className="absolute rounded-full blur-2xl"
          style={{
            width: 220,
            height: 220,
            background: "rgba(75, 115, 16, 0.15)",
            top: "60%",
            left: "60%",
          }}
          initial={{ x: 0, y: 0, scale: 1 }}
          animate={{
            x: [0, -30, 30, 0],
            y: [0, 20, -20, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        />
        <motion.div
          aria-hidden
          className="absolute rounded-full blur-2xl"
          style={{
            width: 180,
            height: 180,
            background: "rgba(91, 140, 19, 0.13)",
            top: "30%",
            left: "70%",
          }}
          initial={{ x: 0, y: 0, scale: 1 }}
          animate={{
            x: [0, 20, -20, 0],
            y: [0, 15, -15, 0],
            scale: [1, 1.06, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold">Quiz Setup</h1>
          <p className="text-secondary-foreground mt-2 font-fragment-mono">
            Customize your AI-powered quiz
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={difficulty}
              onValueChange={(value) => setDifficulty(value as QuizDifficulty)}
            >
              <SelectTrigger id="difficulty">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={QuizDifficulty.EASY}>Easy</SelectItem>
                <SelectItem value={QuizDifficulty.MEDIUM}>Medium</SelectItem>
                <SelectItem value={QuizDifficulty.HARD}>Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numQuestions">Number of Questions</Label>
            <Input
              id="numQuestions"
              type="number"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              min="1"
              max="50"
            />
          </div>
        </div>

        <Button
          onClick={handleStart}
          disabled={isLoading}
          className="w-full bg-primary-green hover:border-0 font-semibold text-muted"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Starting Quiz...
            </>
          ) : (
            "Start Quiz"
          )}
        </Button>
      </motion.div>
    </div>
  );
}
