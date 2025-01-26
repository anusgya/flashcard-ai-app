"use client";

import Link from "next/link";
interface DeckCardProps {
  title: string;
  progress: number;
  cardsCount: number;
}

const progressColors = [
  { bg: "bg-primary-blue", bgSecondary: "bg-primary-blue-secondary" },
  { bg: "bg-primary-orange", bgSecondary: "bg-primary-orange-secondary" },
  { bg: "bg-primary-green", bgSecondary: "bg-primary-green-secondary" },
];

export function DeckCard({ title, progress, cardsCount }: DeckCardProps) {
  const randomColorPair =
    progressColors[Math.floor(Math.random() * progressColors.length)];

  return (
    <Link href="/learn/1">
      <div className="px-6 py-4 rounded-lg border border-border border-b-[3px] hover:bg-secondary transition-colors cursor-pointer">
        <div className="space-y-2">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-medium text-card-foreground">
              {title}
            </h3>
            <div className="text-sm text-secondary-foreground font-fragment-mono ">
              {cardsCount} cards mastered
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`flex-1 h-2 rounded-full ${randomColorPair.bgSecondary} overflow-hidden`}
            >
              <div
                className={`h-full ${randomColorPair.bg} rounded-full transition-all duration-500`}
                style={{ width: `${progress}%` }}
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
