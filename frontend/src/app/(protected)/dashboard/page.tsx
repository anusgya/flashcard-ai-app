"use client";

import { motion } from "framer-motion";
import { ActionCard } from "@/components/ui/action-card";
import { DeckCard } from "@/components/ui/deck-card";
import ActivityHeatmap from "@/components/activity-heatmap";
import Link from "next/link";
import { useRecentDecks } from "@/hooks/api/use-deck"; // Import the hook
import useMe from "@/hooks/api/use-me";
import { useCards } from "@/hooks/api/use-card";

interface DeckCardProps {
  id: string;
  name: string;
  learning_cards: number;
  total_cards: number;
}

export interface me {
  username: string; // min length 3, max length 50
  email: string;
  id: string; // UUID format from backend
  created_at: string; // ISO date string
  last_login: string | null; // Optional ISO date string
  total_points: number; // Default 0, must be >= 0
  settings: Record<string, any> | null; // validated as email on the backend
}

// Complete user interface with all properties from the response

export default function Dashboard() {
  // Use the hook to fetch recent decks
  const { recentDecks, isLoading, isError } = useRecentDecks();
  console.log("recent deck", recentDecks);
  const { user, isLoading: userLoading, isError: userError } = useMe();

  console.log("user", user);

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  // Child animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.div
      className="py-16 px-12 space-y-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="flex justify-between gap-6 items-start"
        variants={itemVariants}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome, {user?.username}.
          </h1>
          <p className="text-secondary-foreground font-fragment-mono text-sm">
            Ready to begin your journey?
          </p>
        </div>
        <motion.div
          className="flex flex-col items-end gap-2 text-foreground"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="text-2xl gap-2 flex font-semibold">
            <motion.span
              initial={{ rotate: -10 }}
              animate={{ rotate: 10 }}
              transition={{ duration: 0.5, repeat: 1, repeatType: "reverse" }}
            >
              🔥
            </motion.span>
            <span>7</span>
          </div>

          <span className="text-secondary-foreground text-sm font-fragment-mono">
            Daily Streaks
          </span>
        </motion.div>
      </motion.div>

      {/* Action Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={itemVariants}
      >
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Link href={"/decks/addCard"}>
            <ActionCard
              icon={
                <span className="w-10 h-10 flex items-center p-2 bg-primary-green justify-center rounded-[10px] bg-primary-green/20 text-primary-green text-2xl">
                  📌
                </span>
              }
              title="Create a new card"
              description="Add a new note"
              color="bg-primary-green/20"
            />
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Link href={"./learn"}>
            <ActionCard
              icon={
                <span className="w-10 h-10 flex items-center p-2 bg-primary-blue rounded-[10px] justify-center bg-primary-orange/20 text-primary-orange text-2xl">
                  ✍️
                </span>
              }
              title="Learn and review"
              description="Space out your knowledge"
              color="bg-primary-orange/20"
            />
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Link href={"./quiz"}>
            <ActionCard
              icon={
                <span className="w-10 h-10 flex p-2 rounded-[10px] bg-primary-orange items-center justify-center bg-primary-blue/20 text-primary-blue text-2xl">
                  🧠
                </span>
              }
              title="Play Quiz"
              description="Test your knowledge"
              color="bg-primary-blue/20"
            />
          </Link>
        </motion.div>
      </motion.div>

      {/* Recent Decks */}
      <motion.div className="space-y-4" variants={itemVariants}>
        <h2 className="text-lg font-semibold text-foreground">
          Recently Learned Decks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            // Loading state with animations
            Array(3)
              .fill(0)
              .map((_, index) => (
                <motion.div
                  key={index}
                  className="h-32 rounded-lg bg-muted"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                >
                  <div className="h-full w-full animate-pulse"></div>
                </motion.div>
              ))
          ) : isError ? (
            // Error state with animation
            <motion.div
              className="col-span-3 text-center py-8 text-destructive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              Failed to load recent decks
            </motion.div>
          ) : recentDecks && recentDecks.length > 0 ? (
            // Display up to 3 recent decks with staggered animations
            recentDecks
              .slice(0, 3)
              .map((deck: DeckCardProps, index: number) => (
                <motion.div
                  key={deck.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                >
                  <DeckCard
                    id={deck.id}
                    title={deck.name}
                    learningCount={deck.learning_cards || 0}
                    totalCount={deck.total_cards || 0}
                  />
                </motion.div>
              ))
          ) : (
            // No decks available with animation
            <motion.div
              className="col-span-3 text-center py-8 text-secondary-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              No recent decks found. Create a new deck to get started!
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Activity Heatmap */}
      <motion.div className="space-y-4" variants={itemVariants}>
        {/* <h2 className="text-lg font-semibold text-foreground">Activity Heatmap</h2> */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <ActivityHeatmap />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
