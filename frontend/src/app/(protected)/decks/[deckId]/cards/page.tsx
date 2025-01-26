import { ArrowLeft, Plus, Filter, ArrowUpDown, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardListItem } from "@/components/ui/card-list-item";

interface PageProps {
  params: {
    deckId: string;
  };
}

export default function CardsPage({ params }: PageProps) {
  const cards = [
    {
      number: 1,
      question: "What is biology?",
      answer: "Biology is this and biology is that and i love biology hehe ...",
    },
    {
      number: 2,
      question: "What is chemistry?",
      answer: "Biology is this and biology is that and i love biology hehe ...",
    },
    {
      number: 3,
      question: "What is mathematics?",
      answer: "Biology is this and biology is that and i love biology hehe ...",
    },
    {
      number: 4,
      question: "hehehehe?",
      answer: "Biology is this and biology is that and i love biology hehe ...",
    },
  ];

  return (
    <div className="py-3 px-12 ">
      <Link href="/decks">
        <Button
          variant="outline"
          size="icon"
          className="text-secondary-foreground border mb-4 border-divider rounded-full hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>
      <div className="flex justify-between items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">Biology</h1>
          <p className="text-secondary-foreground font-fragment-mono text-sm">
            Anatomy maybe
          </p>
        </div>
        <div className="relative w-80 border-0 bg-secondary rounded-lg">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-foreground" />
          <Input
            className="py-[5px] pl-10 placeholder:text-secondary-foreground border border-divider"
            placeholder="Search"
          />
        </div>
      </div>

      <div className="space-y-8 mt-14">
        {" "}
        {/* Added consistent spacing */}
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            href="/decks/[deckId]/cards/add"
            as={`/decks/${params.deckId}/cards/add`}
          >
            <Button className="bg-primary-green text-muted font-semibold hover:bg-primary-green/90">
              <Plus className="h-4 w-4 " />
              Add Note
            </Button>
          </Link>
          <Button
            variant="outline"
            className="text-secondary-foreground border-b-1 bg-secondary border-divider hover:text-foreground "
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button
            variant="outline"
            className="text-secondary-foreground border-b-1 bg-secondary border-divider hover:text-foreground"
          >
            <ArrowUpDown className="h-4 w-4 " />
            Sort
          </Button>
        </div>
        {/* Cards List */}
        <div className="space-y-4">
          {cards.map((card) => (
            <CardListItem key={card.number} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}
