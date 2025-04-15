"use client"

import {
  ArrowLeft,
  Plus,
  Filter,
  ArrowUpDown,
  Search,
  BookCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardListItem } from "@/components/ui/card-list-item";
import { useCards } from "@/hooks/api/use-card";
import { useParams } from "next/navigation";
import { useDeck } from "@/hooks/api/use-deck";



export default function CardsPage() {
// const deckId = resolvedParams?.deckId;
  // Fetch deck data using the useDeck hook
  // Replace this with your actual logi

  const params = useParams<{deckId:string}>()
  
  const {cards, isLoading, isError, mutate} = useCards(params.deckId);
  console.log("these are the cards ", cards)
  const {deck} = useDeck(params.deckId)

  return (
    <div className="py-3 px-12">
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
          <h1 className="text-xl font-bold text-foreground">{deck?.name}</h1>
          <p className="text-secondary-foreground font-fragment-mono text-sm">
            {deck?.description}
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
        <div className="flex justify-between gap-2">
          <div className="flex gap-2">
            <Link
              href="/decks/addCard"
              as={`/decks/addCard`}
            >
              <Button className="bg-primary-green hover:border-0 text-muted font-semibold hover:bg-primary-green/90">
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
          <div>
            <Link href="/learn/1">
              <Button className="bg-primary-orange hover:border-0 text-muted font-semibold border-primary-orange-secondary">
                <BookCheck className="h-4 w-4" />
                Study Now
              </Button>
            </Link>
          </div>
        </div>
        {/* Cards List */}
        <div className="space-y-4">
          {cards?.map((card:any) => (
            <CardListItem key={card.id} {...card} onCardDelete={()=>mutate()} onCardEdit={()=>mutate()} />
          ))}
        </div>
      </div>
    </div>
  );
}
