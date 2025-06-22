"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "next/navigation";
import { usePublicDecks } from "@/hooks/api/use-deck";
import { useCards } from "@/hooks/api/use-card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { DiscussionThread } from "@/components/ui/discussion-thread";
import { Badge } from "@/components/ui/badge";
import {
  createComment,
  deleteComment,
  updateComment,
  useComments,
} from "@/hooks/api/use-comments";

interface CardData {
  id: string;
  front_content: string;
  back_content: string;
}

export default function CollaborativeDeckPage() {
  const params = useParams<{ deckId: string }>();
  const deckId = params.deckId;
  const [searchQuery, setSearchQuery] = useState("");

  const { publicDecks, isLoading: areDecksLoading } = usePublicDecks();
  const deck = publicDecks?.find((d: any) => d.id === deckId);

  const { cards, isLoading: areCardsLoading } = useCards(deckId);
  const {
    comments,
    isLoading: areCommentsLoading,
    mutate: mutateComments,
  } = useComments(deckId);

  const handleAddComment = async (content: string, parentId?: string) => {
    if (!deckId) return;

    try {
      await createComment(deckId, content, parentId);
      mutateComments();
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    try {
      await updateComment(commentId, content);
      mutateComments();
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      mutateComments();
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const cardCountColor = React.useMemo(() => {
    const colors = [
      "text-primary-green",
      "text-primary-orange",
      "text-primary-blue",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const filteredCards = cards?.filter(
    (card: CardData) =>
      card.front_content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.back_content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (areDecksLoading || areCardsLoading) {
    return (
      <div className="py-16 px-12">
        <Skeleton className="h-10 w-10 mb-4 rounded-full" />
        <div className="flex justify-between items-end gap-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-80" />
        </div>
        <div className="space-y-3 mt-8">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="py-3 px-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link href="/collaborative">
          <Button
            variant="outline"
            size="icon"
            className="text-secondary-foreground border mb-4 border-divider rounded-full hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </motion.div>

      <motion.div
        className="flex justify-between items-end gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{deck?.name}</h1>
          <p className="text-secondary-foreground font-fragment-mono text-sm">
            {deck?.description}
          </p>
        </div>
        <div className="relative w-80 border-0 bg-secondary rounded-lg">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-foreground" />
          <Input
            className="py-[5px] pl-10 placeholder:text-secondary-foreground border border-border"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </motion.div>

      <div className="flex items-center gap-2 mt-6">
        <Avatar className="h-6 w-6">
          <AvatarImage src={deck?.creator_avatar} />
          <AvatarFallback>
            {deck?.creator_username?.charAt(0) || "A"}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-secondary-foreground">
          Created by {deck?.creator_username}
        </span>
        <Separator orientation="vertical" className="h-4 bg-border " />
        <span className={`text-sm ${cardCountColor}`}>
          {cards?.length || 0} Cards
        </span>
      </div>

      <Tabs defaultValue="cards" className="mt-8">
        <TabsList className="">
          <TabsTrigger value="cards">Cards ({cards?.length || 0})</TabsTrigger>
          <TabsTrigger value="discussion">
            Discussion
            <Badge className="ml-2 bg-red-500 text-white rounded-full  hover:bg-red-500/90">
              {comments?.length || 0}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <Separator className="bg-divider my-6" />

        <TabsContent value="cards" className="mt-6">
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            {filteredCards && filteredCards.length > 0 ? (
              filteredCards.map((card: CardData, index: number) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                >
                  <Card key={card.id} className="p-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="prose dark:prose-invert max-w-none">
                        <p className=" mb-2 text-sm font-fragment-mono text-secondary-foreground">
                          Front
                        </p>
                        {card.front_content}
                      </div>

                      <div className="prose dark:prose-invert max-w-none">
                        <p className="mb-2 text-sm font-fragment-mono text-secondary-foreground">
                          Back
                        </p>
                        {card.back_content}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <motion.div
                className="text-secondary-foreground text-center py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {cards && cards.length > 0
                  ? `No cards found matching "${searchQuery}"`
                  : "No cards found in this deck."}
              </motion.div>
            )}
          </motion.div>
        </TabsContent>
        <TabsContent value="discussion">
          <DiscussionThread
            comments={comments || []}
            onAddComment={handleAddComment}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
            creatorId={deck?.user_id}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
