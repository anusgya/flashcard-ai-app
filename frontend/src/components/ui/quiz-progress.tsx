"use client"

import { motion } from "framer-motion"
import { Diamond } from "lucide-react"

interface QuizProgressProps {
  currentQuestion: number
  totalQuestions: number
  diamonds: number
  color: string
}

export function QuizProgress({ currentQuestion, totalQuestions, diamonds, color }: QuizProgressProps) {
  const progress = (currentQuestion / totalQuestions) * 100

  return (
    <div className="flex items-center gap-4 w-full">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="flex items-center gap-2 text-foreground">
        <div className="text-xl">💎</div>
        <span className="font-fragment-mono">{diamonds}</span>
      </div>
    </div>
  )
}

