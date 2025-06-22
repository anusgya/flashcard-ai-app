"use client";

import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Award, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function QuizResultsPage() {
  const searchParams = useSearchParams();
  const attempted = Number.parseInt(searchParams.get("attempted") || "0");
  const correct = Number.parseInt(searchParams.get("correct") || "0");
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  const [showConfetti, setShowConfetti] = useState(false);
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

    // Show confetti after a short delay
    const timer = setTimeout(() => setShowConfetti(true), 500);
    return () => clearTimeout(timer);
  }, [accuracy]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background animated elements */}
      {showConfetti && (
        <>
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                top: -20,
                left: `${Math.random() * 100}%`,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                top: `${Math.random() * 100 + 100}%`,
                rotate: Math.random() * 360,
                opacity: 0,
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                delay: Math.random() * 0.5,
              }}
            >
              <div
                className={`text-${
                  [
                    "yellow-400",
                    "green-400",
                    "blue-400",
                    "purple-400",
                    "pink-400",
                  ][Math.floor(Math.random() * 5)]
                } text-2xl`}
              >
                {["✨", "🎉", "🏆", "⭐", "🌟"][Math.floor(Math.random() * 5)]}
              </div>
            </motion.div>
          ))}
        </>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8 text-center bg-muted p-8 rounded-2xl border border-border shadow-xl"
      >
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{
              scale: 1,
              rotate: 0,
              y: [0, -10, 0],
            }}
            transition={{
              type: "spring",
              bounce: 0.5,
              y: {
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              },
            }}
            className="relative"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl"
            />
            <div className="text-7xl">🏆</div>
          </motion.div>
        </div>

        <motion.div
          className="space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-4xl font-bold text-foreground">Quiz Complete!</h1>
          <p className="text-secondary-foreground font-fragment-mono ">
            {message}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-3 gap-4 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            className="space-y-2 bg-card/80 p-4 rounded-xl border-2 border-divider"
            whileHover={{ scale: 1.05 }}
          >
            {/* <Target className="w-6 h-6 text-gray-400 mx-auto mb-2" /> */}
            <motion.p
              className="text-3xl font-bold text-primary-orange"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {attempted}
            </motion.p>
            <p className="text-sm text-foreground  font-fragment-mono">
              Attempted
            </p>
          </motion.div>

          <motion.div
            className="space-y-2 bg-card/80 p-4 rounded-xl border-2 border-divider"
            whileHover={{ scale: 1.05 }}
          >
            {/* <Award className="w-6 h-6 text-green-400 mx-auto mb-2" /> */}
            <motion.p
              className="text-3xl font-bold text-primary-green"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {correct}
            </motion.p>
            <p className="text-sm text-foreground font-fragment-mono">
              Correct
            </p>
          </motion.div>

          <motion.div
            className="space-y-2  p-4 rounded-xl border-2 border-divider"
            whileHover={{ scale: 1.05 }}
          >
            {/* <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" /> */}
            <motion.div className="relative h-10 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={accuracy}
                  className="text-3xl font-bold text-primary-blue absolute"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3, delay: 1.2 }}
                >
                  {accuracy}%
                </motion.p>
              </AnimatePresence>
            </motion.div>
            <p className="text-sm text-foreground font-fragment-mono">
              Accuracy
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          className="pt-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <Button
            className="bg-primary-green font-semibold  hover:border-0 text-muted  px-6 py-6 rounded-xl flex items-center gap-2 mx-auto group transition-all duration-300 shadow-lg shadow-primary-green/20"
            onClick={() => (window.location.href = "/quiz")}
          >
            <ArrowLeft className="w-5 h-5 " />
            <span>Back to Quizzes</span>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
