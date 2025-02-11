"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizProgress } from "@/components/ui/quiz-progress";
import { ExitDialog } from "@/components/ui/exit-dialog";
import { AnswerButton } from "@/components/ui/answer-button";
import { Confetti } from "@/components/ui/confetti";

const quizData = {
  questions: [
    {
      id: 1,
      question: "What is biology?",
      answers: [
        "The study of life",
        "The study of rocks",
        "The study of space",
        "The study of numbers",
      ],
      correctAnswer: 0,
    },
    {
      id: 1,
      question: "What is biology?",
      answers: [
        "The study of life",
        "The study of rocks",
        "The study of space",
        "The study of numbers",
      ],
      correctAnswer: 0,
    },
    {
      id: 1,
      question: "What is biology?",
      answers: [
        "The study of life",
        "The study of rocks",
        "The study of space",
        "The study of numbers",
      ],
      correctAnswer: 0,
    },
    // Add more questions...
  ],
};

const colors = ["#74B218", "#48C0F8", "#D38633"];

export default function QuizPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [diamonds, setDiamonds] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [quizResults, setQuizResults] = useState({ attempted: 0, correct: 0 });
  const [showCorrectAnimation, setShowCorrectAnimation] = useState(false);

  const currentColor = colors[currentQuestion % colors.length];
  const question = quizData.questions[currentQuestion];
  const { triggerConfetti } = Confetti();

  const handleAnswerSelect = (index: number) => {
    if (!isAnswerRevealed) {
      setSelectedAnswer(index);
    }
  };

  const handleCheck = () => {
    if (selectedAnswer === null) return;

    setIsAnswerRevealed(true);
    const isCorrect = selectedAnswer === question.correctAnswer;
    setQuizResults((prev) => ({
      attempted: prev.attempted + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));

    if (isCorrect) {
      setDiamonds((prev) => prev + 1);
      setShowCorrectAnimation(true);
      triggerConfetti();
    }

    setTimeout(() => {
      if (currentQuestion < quizData.questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer(null);
        setIsAnswerRevealed(false);
        setShowCorrectAnimation(false);
      } else {
        router.push(
          `/quiz/results?attempted=${quizResults.attempted}&correct=${quizResults.correct}`
        );
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 flex flex-col">
      <div className="flex items-center gap-4 justify-between mb-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowExitDialog(true)}
        >
          <X className="h-6 w-6" />
        </Button>
        <QuizProgress
          currentQuestion={currentQuestion + 1}
          totalQuestions={quizData.questions.length}
          diamonds={diamonds}
          color={currentColor}
        />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl space-y-12"
          >
            <motion.h1
              className="text-2xl md:text-2xl text-foreground font-bold"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              {question.question}
            </motion.h1>

            <div className="space-y-4">
              {question.answers.map((answer, index) => (
                <AnswerButton
                  key={index}
                  answer={answer}
                  number={index + 1}
                  isSelected={selectedAnswer === index}
                  isCorrect={
                    isAnswerRevealed && index === question.correctAnswer
                  }
                  isRevealed={isAnswerRevealed}
                  onClick={() => handleAnswerSelect(index)}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="w-full flex justify-between">
        <Button
          onClick={handleCheck}
          disabled={selectedAnswer === null}
          style={{ backgroundColor: currentColor }}
          className="text-background font-semibold px-4 py-2 text-md h-auto  shadow-lg hover:shadow-xl transition-all"
        >
          {isAnswerRevealed ? "Next Question" : "Check Answer"}
        </Button>
        <Button
          onClick={handleCheck}
          disabled={selectedAnswer === null}
          style={{ backgroundColor: currentColor }}
          className="text-background font-semibold px-4 py-2 text-md h-auto  shadow-lg hover:shadow-xl transition-all"
        >
          {isAnswerRevealed ? "Next Question" : "Check Answer"}
        </Button>
      </div>

      <AnimatePresence>
        {showCorrectAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-green text-background p-8 rounded-full shadow-2xl"
          >
            <CheckCircle className="w-16 h-16" />
            <span className="text-2xl font-bold ml-2">+1</span>
          </motion.div>
        )}
      </AnimatePresence>

      <ExitDialog
        isOpen={showExitDialog}
        onConfirm={() =>
          router.push(
            `/quiz/results?attempted=${quizResults.attempted}&correct=${quizResults.correct}`
          )
        }
        onCancel={() => setShowExitDialog(false)}
      />
    </div>
  );
}
