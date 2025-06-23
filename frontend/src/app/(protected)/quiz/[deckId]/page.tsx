"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizProgress } from "@/components/ui/quiz-progress";
import { ExitDialog } from "@/components/ui/exit-dialog";
import { AnswerButton } from "@/components/ui/answer-button";
import { Confetti } from "@/components/ui/confetti";
import {
  useQuizSession,
  useSessionQuestions,
  submitQuizAnswer,
  updateQuizSession,
  startQuiz,
  QuizQuestionResponse,
  QuizAnswerCreate,
  QuizAnswerResponse,
  QuizSessionUpdate,
  StartQuizResponse,
} from "@/hooks/api/useQuiz";
import { QuizDifficulty } from "@/enums";
import { UUID } from "crypto";
import { useParams } from "next/navigation";
import { QuizSettings } from "./quiz-settings";

const colors: string[] = ["#74B218", "#48C0F8", "#D38633"];

interface QuizResults {
  attempted: number;
  correct: number;
}

export default function QuizPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams<{ deckId: string }>();
  const deckId = params.deckId;

  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [diamonds, setDiamonds] = useState<number>(0);
  const [showExitDialog, setShowExitDialog] = useState<boolean>(false);
  const [quizResults, setQuizResults] = useState<QuizResults>({
    attempted: 0,
    correct: 0,
  });
  const [showCorrectAnimation, setShowCorrectAnimation] =
    useState<boolean>(false);
  const [pointsForCorrectAnswer, setPointsForCorrectAnswer] =
    useState<number>(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [totalTimeTaken, setTotalTimeTaken] = useState<number>(0);
  const [questionsList, setQuestionsList] = useState<
    QuizQuestionResponse[] | null
  >(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const {
    session,
    isLoading: isSessionLoading,
    mutate: mutateSession,
  } = useQuizSession(sessionId as UUID | null);

  const { questions, isLoading: areQuestionsLoading } = useSessionQuestions(
    sessionId as UUID | null
  );

  useEffect(() => {
    if (questions && !questionsList) {
      setQuestionsList(questions);
    }
  }, [questions, questionsList]);

  const isLoading: boolean =
    isInitialLoading ||
    isSessionLoading ||
    (areQuestionsLoading && !questionsList);

  const currentColor: string = colors[currentQuestionIndex % colors.length];
  const currentQuestion: QuizQuestionResponse | null =
    questionsList && questionsList.length > 0
      ? questionsList[currentQuestionIndex]
      : null;

  const { triggerConfetti } = Confetti();

  const handleStartQuiz = useCallback(
    async (difficulty: QuizDifficulty, numQuestions: number) => {
      const controller = new AbortController();
      const signal = controller.signal;

      if (!deckId) {
        router.push("/decks");
        return;
      }

      setIsInitialLoading(true);

      try {
        const result: StartQuizResponse = await startQuiz(
          deckId as UUID,
          difficulty,
          numQuestions,
          { signal }
        );

        setSessionId(result.session.id as string);
        setQuestionsList(result.questions);
        setStartTime(new Date());
        setQuestionStartTime(new Date());
        setQuizStarted(true);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Failed to start quiz session:", error);
          // You might want to show a toast notification here
          router.push("/decks");
        }
      } finally {
        if (!signal.aborted) {
          setIsInitialLoading(false);
        }
      }
    },
    [deckId, router]
  );

  const handleAnswerSelect = (index: number): void => {
    if (!isAnswerRevealed) {
      setSelectedAnswer(index);
    }
  };

  const handleCheck = async (): Promise<void> => {
    if (
      selectedAnswer === null ||
      !currentQuestion ||
      !sessionId ||
      !questionStartTime
    )
      return;

    setIsAnswerRevealed(true);

    const now = new Date();
    const timeTakenInSeconds: number = Math.round(
      (now.getTime() - questionStartTime.getTime()) / 1000
    );

    const userAnswer: string = currentQuestion.options[selectedAnswer];

    try {
      const answerData: QuizAnswerCreate = {
        session_id: sessionId as UUID,
        question_id: currentQuestion.id as UUID,
        user_answer: userAnswer,
        time_taken: timeTakenInSeconds,
      };

      const answerResponse: QuizAnswerResponse = await submitQuizAnswer(
        answerData
      );

      setQuizResults((prev) => ({
        attempted: prev.attempted + 1,
        correct: prev.correct + (answerResponse.is_correct ? 1 : 0),
      }));

      setTotalTimeTaken((prev) => prev + timeTakenInSeconds);

      if (answerResponse.is_correct) {
        setPointsForCorrectAnswer(answerResponse.points_earned);
        setDiamonds((prev) => prev + answerResponse.points_earned);
        setShowCorrectAnimation(true);
        // triggerConfetti();
      }

      mutateSession();
    } catch (error) {
      console.error("Failed to submit answer:", error);
    }
  };

  const handleContinue = useCallback((): void => {
    if (!questionsList) return;

    if (currentQuestionIndex < questionsList.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      setShowCorrectAnimation(false);
      setQuestionStartTime(new Date());
    } else {
      completeQuiz();
    }
  }, [currentQuestionIndex, questionsList]);

  useEffect(() => {
    if (isAnswerRevealed) {
      const timer = setTimeout(() => {
        handleContinue();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAnswerRevealed, handleContinue]);

  const completeQuiz = useCallback(async (): Promise<void> => {
    if (!sessionId || !startTime || !questionsList || isCompleted) return;

    setIsCompleted(true);
    try {
      const attemptedCount = currentQuestionIndex + 1;
      const accuracy: number =
        attemptedCount > 0 ? quizResults.correct / attemptedCount : 0;

      const sessionUpdateData: Partial<QuizSessionUpdate> = {
        end_time: new Date().toISOString(),
        correct_answers: quizResults.correct,
        total_questions: attemptedCount,
        accuracy,
        time_taken: totalTimeTaken,
        points_earned: quizResults.correct * 10,
      };

      await updateQuizSession(sessionId as UUID, sessionUpdateData);

      router.push(
        `/quiz/results?sessionId=${sessionId}&deckId=${deckId}&attempted=${attemptedCount}&correct=${quizResults.correct}&points=${diamonds}`
      );
    } catch (error) {
      console.error("Failed to complete quiz:", error);
    }
  }, [
    sessionId,
    startTime,
    questionsList,
    quizResults,
    totalTimeTaken,
    router,
    currentQuestionIndex,
    isCompleted,
    deckId,
    diamonds,
  ]);

  const handleExit = useCallback(
    async (isUnloading: boolean = false): Promise<void> => {
      if (isCompleted) return;
      setIsCompleted(true);

      if (sessionId && questionsList) {
        try {
          const attemptedCount = isAnswerRevealed
            ? currentQuestionIndex + 1
            : quizResults.attempted;

          const accuracy: number =
            attemptedCount > 0 ? quizResults.correct / attemptedCount : 0;

          const sessionUpdateData: Partial<QuizSessionUpdate> = {
            end_time: new Date().toISOString(),
            correct_answers: quizResults.correct,
            total_questions: attemptedCount,
            accuracy,
            time_taken: totalTimeTaken,
            points_earned: quizResults.correct * 10,
          };

          await updateQuizSession(sessionId as UUID, sessionUpdateData, {
            keepalive: isUnloading,
          });

          if (!isUnloading) {
            router.push(
              `/quiz/results?sessionId=${sessionId}&deckId=${deckId}&attempted=${attemptedCount}&correct=${quizResults.correct}&points=${diamonds}`
            );
          }
        } catch (error) {
          console.error("Error completing quiz on exit:", error);
          if (!isUnloading) {
            if (quizResults.attempted > 0) {
              const attemptedCount = isAnswerRevealed
                ? currentQuestionIndex + 1
                : quizResults.attempted;
              router.push(
                `/quiz/results?sessionId=${sessionId}&deckId=${deckId}&attempted=${attemptedCount}&correct=${quizResults.correct}&points=${diamonds}`
              );
            } else {
              router.push("/decks");
            }
          }
        }
      } else if (!isUnloading) {
        router.push("/decks");
      }
    },
    [
      isCompleted,
      sessionId,
      questionsList,
      quizResults,
      totalTimeTaken,
      router,
      isAnswerRevealed,
      currentQuestionIndex,
      deckId,
      diamonds,
    ]
  );

  useEffect(() => {
    const handleUnload = () => {
      if (!isCompleted) {
        handleExit(true);
      }
    };

    window.addEventListener("pagehide", handleUnload);

    return () => {
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [isCompleted, handleExit]);

  if (!quizStarted) {
    return (
      <QuizSettings
        onStartQuiz={handleStartQuiz}
        isLoading={isInitialLoading}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">Preparing your quiz...</h2>
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary-green border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-secondary-foreground font-fragment-mono">
            Loading questions with AI-powered options
          </p>
        </div>
      </div>
    );
  }

  if (!currentQuestion || !questionsList || questionsList.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            No questions available for this deck
          </h2>
          <p className="text-secondary-foreground mb-6">
            Try another deck or add more cards to this deck.
          </p>
          <Button onClick={() => router.push("/quiz")}>
            Return to Quiz Selection
          </Button>
        </div>
      </div>
    );
  }

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
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={questionsList.length}
          diamonds={diamonds}
          color={currentColor}
        />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl space-y-12"
          >
            <motion.h1
              className=" font-fragment-mono text-xl text-foreground font-bold"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              {currentQuestion.question_text}
            </motion.h1>

            <div className="space-y-4">
              {currentQuestion.options.map((answer: string, index: number) => (
                <AnswerButton
                  key={index}
                  answer={answer}
                  number={index + 1}
                  isSelected={selectedAnswer === index}
                  isCorrect={
                    isAnswerRevealed &&
                    answer === currentQuestion.correct_answer
                  }
                  isRevealed={isAnswerRevealed}
                  onClick={() => handleAnswerSelect(index)}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full flex justify-between mt-8">
        <Button
          onClick={() => setShowExitDialog(true)}
          variant="outline"
          className="font-semibold border-b- px-4 py-2 font-fragment-mono h-auto  hover:shadow-xl transition-all"
        >
          Exit Quiz
        </Button>
        <Button
          onClick={isAnswerRevealed ? handleContinue : handleCheck}
          disabled={selectedAnswer === null && !isAnswerRevealed}
          style={{ backgroundColor: currentColor, borderColor: currentColor }}
          className="text-background font-semibold px-4 py-2 font-fragment-mono h-auto shadow-lg transition-all"
        >
          {isAnswerRevealed
            ? currentQuestionIndex < questionsList.length - 1
              ? "Next Question"
              : "Finish Quiz"
            : "Check Answer"}
        </Button>
      </div>

      <AnimatePresence>
        {showCorrectAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <span className="text-6xl te font-fragment-mono font-bold">
                +{pointsForCorrectAnswer}
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ExitDialog
        isOpen={showExitDialog}
        onConfirm={() => handleExit(false)}
        onCancel={() => setShowExitDialog(false)}
      />
    </div>
  );
}
