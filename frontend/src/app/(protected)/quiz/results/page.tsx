"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Award, RotateCw, Target, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function QuizResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const deckId = searchParams.get("deckId");
  const attempted = Number.parseInt(searchParams.get("attempted") || "0");
  const correct = Number.parseInt(searchParams.get("correct") || "0");
  const points = Number.parseInt(searchParams.get("points") || "0");
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  const [showParticles, setShowParticles] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Determine message based on accuracy
    if (accuracy >= 90) {
      setMessage("Outstanding! You're a quiz master!");
    } else if (accuracy >= 70) {
      setMessage("Great job! Almost perfect!");
    } else if (accuracy >= 50) {
      setMessage("Good effort! Keep practicing!");
    } else {
      setMessage("Nice try! You'll do better next time!");
    }

    // Show particles after a short delay
    const timer = setTimeout(() => setShowParticles(true), 800);
    return () => clearTimeout(timer);
  }, [accuracy]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated floating glare circles background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute rounded-full blur-3xl"
          style={{
            width: 320,
            height: 320,
            background: "rgba(255, 165, 64, 0.18)",
            top: "10%",
            left: "10%",
          }}
          initial={{ x: 0, y: 0, scale: 1 }}
          animate={{
            x: [0, 40, -40, 0],
            y: [0, -30, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        />
        <motion.div
          aria-hidden
          className="absolute rounded-full blur-2xl"
          style={{
            width: 220,
            height: 220,
            background: "rgba(255, 140, 0, 0.15)",
            top: "60%",
            left: "60%",
          }}
          initial={{ x: 0, y: 0, scale: 1 }}
          animate={{
            x: [0, -30, 30, 0],
            y: [0, 20, -20, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        />
        <motion.div
          aria-hidden
          className="absolute rounded-full blur-2xl"
          style={{
            width: 180,
            height: 180,
            background: "rgba(255, 200, 100, 0.13)",
            top: "30%",
            left: "70%",
          }}
          initial={{ x: 0, y: 0, scale: 1 }}
          animate={{
            x: [0, 20, -20, 0],
            y: [0, 15, -15, 0],
            scale: [1, 1.06, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        />
      </div>
      {/* Subtle floating particles */}
      {showParticles && (
        <>
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary-green/60 rounded-full opacity-60"
              initial={{
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 20,
                scale: 0,
              }}
              animate={{
                y: -20,
                scale: [0, 1, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: Math.random() * 4 + 3,
                delay: Math.random() * 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}

      {/* Background blur elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary-green/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-muted/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full space-y-8 relative"
      >
        {/* Main Card */}
        <div className="bg-muted/80 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl shadow-slate-900/10 dark:shadow-none">
          {/* Header */}
          <div className="text-center space-y-6 mb-8">
            {/* Animated Trophy Emoji */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1.1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
              className="flex justify-center items-center mb-2"
            >
              <span className="text-[64px] md:text-[80px] drop-shadow-lg">
                🎊
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <h1 className="text-3xl font-bold text-foreground">
                Quiz Complete!
              </h1>
              <p className="text-secondary-foreground font-medium font-fragment-mono">
                {message}
              </p>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 gap-4 mb-8"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-card/80 rounded-2xl p-4 border border-divider"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className=" bg-muted rounded-lg">
                  <Target className="w-4 h-4 text-primary-green" />
                </div>
                <span className="text-sm font-medium text-secondary-foreground">
                  Attempted
                </span>
              </div>
              <motion.p
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="text-2xl font-bold text-foreground"
              >
                {attempted}
              </motion.p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-card/80 rounded-2xl p-4 border border-divider"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className=" ">
                  <Award className="w-4 h-4 text-muted text-primary-orange" />
                </div>
                <span className="text-sm font-medium text-secondary-foreground">
                  Correct
                </span>
              </div>
              <motion.p
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                className="text-2xl font-bold text-foreground"
              >
                {correct}
              </motion.p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-card/80 rounded-2xl p-4 border border-divider"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-muted rounded-lg">
                  <Zap className="w-4 h-4 text-primary-orange" />
                </div>
                <span className="text-sm font-medium text-secondary-foreground">
                  Accuracy
                </span>
              </div>
              <motion.div className="relative">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={accuracy}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ delay: 1.2 }}
                    className="text-2xl font-bold text-foreground"
                  >
                    {accuracy}%
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-card/80 rounded-2xl p-4 border border-divider"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-muted rounded-lg">
                  <Trophy className="w-4 h-4 text-primary-blue" />
                </div>
                <span className="text-sm font-medium text-secondary-foreground">
                  Points Earned
                </span>
              </div>
              <motion.p
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 }}
                className="text-2xl font-bold text-foreground"
              >
                {points}
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6 }}
            className="flex flex-col gap-3"
          >
            <Button
              onClick={() => (window.location.href = `/quiz/${deckId}`)}
              disabled={!deckId}
              variant="outline"
              className="w-full h-10 rounded-md bg-primary-green  border-primary-green-secondary text-muted font-semibold transition-all duration-200"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Retry Quiz
            </Button>
            <Button
              variant={"outline"}
              onClick={() => router.push("/quiz")}
              className="w-full h-10 rounded-md   font-semibold"
            >
              Exit
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
