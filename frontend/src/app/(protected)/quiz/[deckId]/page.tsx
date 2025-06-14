"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  QuizSessionUpdate,
  StartQuizResponse,
} from "@/hooks/api/useQuiz";
import { QuizDifficulty } from "@/enums";
import { UUID } from "crypto";
import { useParams } from "next/navigation";

const colors: string[] = ["#74B218", "#48C0F8", "#D38633"];

interface QuizResults {
  attempted: number;
  correct: number;
}

export default function QuizPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ deckId: string }>();
  const deckId = params.deckId;
  const difficulty =
    (searchParams.get("difficulty") as QuizDifficulty) || QuizDifficulty.MEDIUM;

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
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [totalTimeTaken, setTotalTimeTaken] = useState<number>(0);
  const [questionsList, setQuestionsList] = useState<
    QuizQuestionResponse[] | null
  >(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  const {
    session,
    isLoading: isSessionLoading,
    mutate: mutateSession,
  } = useQuizSession(sessionId as UUID | null);

  const { questions, isLoading: areQuestionsLoading } = useSessionQuestions(
    sessionId as UUID | null
  );

  // When questions data loads from SWR, update our local state
  useEffect(() => {
    if (questions && !questionsList) {
      setQuestionsList(questions);
    }
  }, [questions, questionsList]);

  // Determine overall loading state
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

  // Initialize the quiz session
  useEffect(() => {
    const initQuiz = async (): Promise<void> => {
      if (!deckId) {
        router.push("/decks"); // Redirect if no deck ID
        return;
      }

      try {
        const result: StartQuizResponse = await startQuiz(
          deckId as UUID,
          difficulty,
          10
        );

        console.log("Questions received from backend:", result.questions);

        // Set session ID and questions list
        setSessionId(result.session.id as string);
        setQuestionsList(result.questions);
        setStartTime(new Date());
        setQuestionStartTime(new Date());
      } catch (error) {
        console.error("Failed to start quiz session:", error);
        router.push("/decks");
      } finally {
        // Set initial loading to false when done
        setIsInitialLoading(false);
      }
    };

    if (!sessionId && deckId) {
      initQuiz();
    } else {
      // If we already have a sessionId, we're not in initial loading
      setIsInitialLoading(false);
    }
  }, [deckId, difficulty, router, sessionId]);

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

    // Calculate time taken for this question
    const now = new Date();
    const timeTakenInSeconds: number = Math.round(
      (now.getTime() - questionStartTime.getTime()) / 1000
    );

    // Determine if answer is correct
    const userAnswer: string = currentQuestion.options[selectedAnswer];
    const isCorrect: boolean = userAnswer === currentQuestion.correct_answer;

    try {
      // Submit the answer to the backend
      const answerData: QuizAnswerCreate = {
        session_id: sessionId as UUID,
        question_id: currentQuestion.id as UUID,
        user_answer: userAnswer,
        time_taken: timeTakenInSeconds,
      };

      await submitQuizAnswer(answerData);

      // Update quiz results
      setQuizResults((prev) => ({
        attempted: prev.attempted + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
      }));

      // Add to total time
      setTotalTimeTaken((prev) => prev + timeTakenInSeconds);

      if (isCorrect) {
        setDiamonds((prev) => prev + 1);
        setShowCorrectAnimation(true);
        triggerConfetti();
      }

      // Also update the session data to keep in sync
      mutateSession();
    } catch (error) {
      console.error("Failed to submit answer:", error);
    }
  };

  // Handler for continuing to next question or completing quiz
  const handleContinue = useCallback((): void => {
    if (!questionsList) return;

    if (currentQuestionIndex < questionsList.length - 1) {
      // Move to next question
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      setShowCorrectAnimation(false);
      setQuestionStartTime(new Date()); // Reset timer for next question
    } else {
      // Quiz is complete - update session and redirect to results
      completeQuiz();
    }
  }, [currentQuestionIndex, questionsList]);

  // Effect to handle continuing after a delay when the answer is revealed
  useEffect(() => {
    if (isAnswerRevealed) {
      const timer = setTimeout(() => {
        handleContinue();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAnswerRevealed, handleContinue]);

  // Complete the quiz and redirect to results
  const completeQuiz = useCallback(async (): Promise<void> => {
    if (!sessionId || !startTime || !questionsList) return;

    try {
      // Calculate final stats
      const totalQuestions: number = questionsList.length;

      // Important: Use the current question index + 1 for the attempted count
      // This ensures we count the current question that was just answered
      const attemptedCount = currentQuestionIndex + 1;

      const accuracy: number =
        attemptedCount > 0 ? quizResults.correct / attemptedCount : 0;

      // Update the session with final results
      const sessionUpdateData: Partial<QuizSessionUpdate> = {
        end_time: new Date().toISOString(),
        correct_answers: quizResults.correct,
        total_questions: totalQuestions,
        accuracy,
        time_taken: totalTimeTaken,
        points_earned: quizResults.correct * 10, // Simple scoring
      };

      await updateQuizSession(sessionId as UUID, sessionUpdateData);

      // Redirect to results page - using the calculated attempted count
      router.push(
        `/quiz/results?sessionId=${sessionId}&attempted=${attemptedCount}&correct=${quizResults.correct}`
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
  ]);

  // Handle exit - this combines early exit and normal completion
  const handleExit = async (): Promise<void> => {
    if (sessionId && questionsList) {
      try {
        // Important: Complete the quiz properly to save progress
        // For exit, we need to make sure all required fields are included
        const totalQuestions: number = questionsList.length;

        // Use the current question index + 1 for attempted count if an answer was revealed
        // Otherwise use the quizResults.attempted value
        const attemptedCount = isAnswerRevealed
          ? currentQuestionIndex + 1
          : quizResults.attempted;

        const accuracy: number =
          attemptedCount > 0 ? quizResults.correct / attemptedCount : 0;

        // Update the session with final results
        const sessionUpdateData: Partial<QuizSessionUpdate> = {
          end_time: new Date().toISOString(),
          correct_answers: quizResults.correct,
          total_questions: totalQuestions,
          accuracy,
          time_taken: totalTimeTaken,
          points_earned: quizResults.correct * 10, // Simple scoring
        };

        await updateQuizSession(sessionId as UUID, sessionUpdateData);

        // Redirect to results page with the calculated attempted count
        router.push(
          `/quiz/results?sessionId=${sessionId}&attempted=${attemptedCount}&correct=${quizResults.correct}`
        );
      } catch (error) {
        console.error("Error completing quiz on exit:", error);
        // If there's an error, still redirect to avoid users getting stuck
        if (quizResults.attempted > 0) {
          // Use the same logic for attempted count here too
          const attemptedCount = isAnswerRevealed
            ? currentQuestionIndex + 1
            : quizResults.attempted;

          router.push(
            `/quiz/results?sessionId=${sessionId}&attempted=${attemptedCount}&correct=${quizResults.correct}`
          );
        } else {
          router.push("/decks");
        }
      }
    } else {
      router.push("/decks");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">Preparing your quiz...</h2>

          {/* Flashcard-style loading animation */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            {/* <div className="absolute inset-0 bg-primary-blue rounded-xl shadow-lg transform rotate-3 animate-pulse"></div>
            <div className="absolute inset-0 bg-primary-orange rounded-xl shadow-lg transform -rotate-3 animate-pulse" style={{animationDelay: "0.2s"}}></div>
            <div className="absolute inset-0 bg-primary-green rounded-xl shadow-lg transform rotate-1 animate-pulse" style={{animationDelay: "0.4s"}}></div>
             */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary-green border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>

          <p className="text-secondary-foreground">
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
              className="text-2xl md:text-2xl text-foreground font-bold"
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
          className="font-semibold border-b- px-4 py-2 text-md h-auto  hover:shadow-xl transition-all"
        >
          Exit Quiz
        </Button>
        <Button
          onClick={isAnswerRevealed ? handleContinue : handleCheck}
          disabled={selectedAnswer === null && !isAnswerRevealed}
          style={{ backgroundColor: currentColor, borderColor: currentColor }}
          className="text-background font-semibold px-4 py-2 text-md h-auto shadow-lg hover:shadow-xl transition-all"
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
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed top-1/2 left-1/2 transform  p-8 rounded-full shadow-2xl"
          >
            <CheckCircle className="w-16 h-16" />
            <span className="text-2xl font-bold ml-2">+1</span>
          </motion.div>
        )}
      </AnimatePresence>

      <ExitDialog
        isOpen={showExitDialog}
        onConfirm={handleExit}
        onCancel={() => setShowExitDialog(false)}
      />
    </div>
  );
}
