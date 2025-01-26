import { MoreVertical } from "lucide-react";
import { Button } from "./button";
import Link from "next/link";

interface CardListItemProps {
  number: number;
  question: string;
  answer: string;
}

export function CardListItem({ number, question, answer }: CardListItemProps) {
  return (
    <Link
      href="/decks/1/cards/1"
      className="flex items-center justify-between px-6 py-3 rounded-lg border border-border hover:bg-secondary border-b-[3px] cursor-pointer transition-colors"
    >
      <div className="space-y-1">
        <h3 className="text-foreground font-medium">
          {number}. {question}
        </h3>
        <p className="text-secondary-foreground text-xs ">{answer}</p>
      </div>
      <div className="flex items-center gap-6">
        <Button
          variant="outline"
          className="text-primary-blue border-b-1 rounded-full hover:text-primary-blue/90 text-xs"
        >
          get cheat code
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-secondary-foreground hover:text-foreground"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </Link>
  );
}
