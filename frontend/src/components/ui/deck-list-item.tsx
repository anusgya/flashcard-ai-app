import { MoreVertical } from "lucide-react";
import { Button } from "./button";
import Link from "next/link";

interface DeckListItemProps {
  title: string;
  description: string;
  newCount: number;
  dueCount: number;
  learnCount: number;
}

export function DeckListItem({
  title,
  description,
  newCount,
  dueCount,
  learnCount,
}: DeckListItemProps) {
  return (
    <Link
      href="/decks/1/cards"
      className="flex items-center justify-between px-6 py-3 rounded-lg border border-border hover:bg-secondary border-b-[3px] cursor-pointer transition-colors"
    >
      {/* <div className="flex items-center justify-between px-6 py-3 rounded-lg border border-border  hover:bg-secondary border-b-[3px] cursor-pointer transition-colors"> */}
      <div className="space-y-1">
        <h3 className="text-foreground font-medium">{title}</h3>
        <p className="text-secondary-foreground text-xs font-fragment-mono">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-24">
        <div className="flex gap-32 font-fragment-mono">
          <div className="flex flex-col items-center gap-1">
            <span className="text-primary-blue text-md">{newCount}</span>
            <span className="text-secondary-foreground text-xs">new</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-primary-orange text-md">{dueCount}</span>
            <span className="text-secondary-foreground text-xs">due</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-primary-green text-md">{learnCount}</span>
            <span className="text-secondary-foreground text-xs">learn</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-secondary-foreground hover:text-foreground"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
      {/* </div> */}
    </Link>
  );
}
