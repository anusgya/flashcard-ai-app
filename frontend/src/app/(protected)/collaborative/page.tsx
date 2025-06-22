"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { Search } from "lucide-react";
import { usePublicDecks } from "@/hooks/api/use-deck";
import useMe from "@/hooks/api/use-me";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface Deck {
  id: string;
  name: string;
  description: string;
  user_id: string;
  creator_username: string;
  creator_avatar: string;
  total_cards: number;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  learning_cards: null | any;
  source_type: string;
}

export default function CollaborativePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { publicDecks, isLoading, isError } = usePublicDecks();
  const { user: currentUser } = useMe();

  const filteredDecks: Deck[] | undefined = publicDecks?.filter(
    (deck: Deck) =>
      deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Changed: This now includes all public decks, including the user's own.
  const allPublicDecks: Deck[] | undefined = filteredDecks;

  // Changed: Renamed for clarity. Logic remains the same.
  const myPublicDecks: Deck[] | undefined = filteredDecks?.filter(
    (deck: Deck) => deck.user_id === currentUser?.id
  );

  const getCardCountColor = (count: number) => {
    if (count <= 100) return "text-primary-blue";
    if (count <= 500) return "text-primary-orange";
    return "text-primary-green";
  };

  const renderDecks = (decks: Deck[]) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <Skeleton className="h-40 w-full" />
            </motion.div>
          ))}
        </div>
      );
    }

    if (!decks || decks.length === 0) {
      return (
        <motion.div
          className="text-center text-secondary-foreground py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          No decks found.
        </motion.div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((deck: Deck, index) => (
          <motion.div
            key={deck.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
          >
            <Card className="p-4 flex flex-col justify-between h-full rounded-lg">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{deck.name}</h3>
                    <p className="text-sm text-secondary-foreground font-fragment-mono">
                      {deck.description}
                    </p>
                  </div>
                  <span
                    className={`text-sm px-2 py-1 rounded ${getCardCountColor(
                      deck.total_cards
                    )}`}
                  >
                    {deck.total_cards} Cards
                  </span>
                </div>
              </div>
              <div>
                <Separator className="mt-2 mb-4" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={deck.creator_avatar} />
                      <AvatarFallback>
                        {deck.creator_username?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-secondary-foreground ">
                      {deck.creator_username || "Anonymous"}
                    </p>
                  </div>
                  <Link href={`/collaborative/${deck.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      className="min-h-screen bg-background py-16 px-12 space-y-14"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex justify-between items-end"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Collaborative Learning</h1>
          <p className="text-secondary-foreground font-fragment-mono text-sm">
            Study and learn together with your peers
          </p>
        </div>
        <div className="relative w-80 border-0 bg-secondary rounded-lg">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-foreground" />
          <Input
            className="py-[5px] pl-10 placeholder:text-secondary-foreground border border-border"
            placeholder="Search shared decks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs defaultValue="all-public-decks">
          <TabsList>
            <TabsTrigger value="all-public-decks">All public decks</TabsTrigger>
            <TabsTrigger value="my-public-decks">My public decks</TabsTrigger>
          </TabsList>
          <Separator className="my-6 bg-divider" />
          <TabsContent value="all-public-decks" className="space-y-4">
            {isError && (
              <div className="text-center text-destructive py-20">
                Failed to load decks.
              </div>
            )}
            {!isError && allPublicDecks && renderDecks(allPublicDecks)}
          </TabsContent>

          <TabsContent value="my-public-decks" className="space-y-4">
            {isError && (
              <div className="text-center text-destructive py-20">
                Failed to load decks.
              </div>
            )}
            {!isError && myPublicDecks && renderDecks(myPublicDecks)}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
