"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface DeckCardProps {
  id: string;
  title: string;
  learningCount: number;
  totalCount: number;
}

const progressColors = [
  { bg: "bg-primary-blue", bgSecondary: "bg-primary-blue/20" },
  { bg: "bg-primary-orange", bgSecondary: "bg-primary-orange/20" },
  { bg: "bg-primary-green", bgSecondary: "bg-primary-green/20" },
];

export function DeckCard({
  id,
  title,
  learningCount,
  totalCount,
}: DeckCardProps) {
  const randomColorPair =
    progressColors[Math.floor(Math.random() * progressColors.length)];

  // Calculate progress percentage
  const progress =
    totalCount > 0 ? Math.round((learningCount / totalCount) * 100) : 0;

  return (
    <Link href={`/learn/${id}`}>
      <div className="p-6 rounded-lg border border-border hover:border-primary-green/50 transition-colors cursor-pointers hover:bg-secondary">
        <div className="space-y-2">
          <div className="space-y-1">
            <h3 className="text-md font-medium text-foreground">{title}</h3>
            <p className="text-sm text-secondary-foreground font-fragment-mono">
              {learningCount}/{totalCount} cards learning
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={`h-full ${randomColorPair.bg} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
            <div className="text-sm text-secondary-foreground min-w-[45px] text-right">
              {progress}%
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
