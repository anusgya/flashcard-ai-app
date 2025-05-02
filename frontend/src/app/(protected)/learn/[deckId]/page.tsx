"use client";
import { Flashcard } from "@/components/ui/flashcard";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useCard } from "@/hooks/api/use-card";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  createStudySession,
  useNextCard,
  createStudyRecord,
  updateStudySession,
} from "@/hooks/api/useStudy";
import { UUID } from "crypto";
import { ResponseQuality, ConfidenceLevel } from "@/enums";

interface CardMedia {
  id: string;
  card_id: string;
  media_type: string;
  file_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  side: string;
}

interface Card {
  id: string;
  deck_id: string;
  front_content: string;
  back_content: string;
  card_state: string;
  difficulty_level: string;
  created_at: string;
  updated_at: string;
  last_reviewed: string | null;
  media: CardMedia[];
  source: string | null;
  success_rate: number;
  times_reviewed: number;
  mnemonics?: string;
  examples?: string[];
}

interface StudySession {
  id: UUID;
  // ... other fields
}

// Map difficulty strings to ResponseQuality enum
const difficultyMap: { [key: string]: ResponseQuality } = {
  again: ResponseQuality.AGAIN,
  hard: ResponseQuality.HARD,
  good: ResponseQuality.GOOD,
  perfect: ResponseQuality.PERFECT,
};

export default function LearnPage() {
  const params = useParams<{ deckId: string }>();
  const deckId = params.deckId as UUID;
  const router = useRouter();

  const [sessionId, setSessionId] = useState<UUID | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeckCompleted, setIsDeckCompleted] = useState(false); // Added state for deck completion
  const cardStartTimeRef = useRef<number | null>(null);

  // 1. Create Study Session on mount
  useEffect(() => {
    const startSession = async () => {
      if (!deckId) return;
      setIsSessionLoading(true);
      setSessionError(null);
      try {
        const session = await createStudySession({ deck_id: deckId });
        setSessionId(session.id);
      } catch (error) {
        console.error("Failed to create study session:", error);
        setSessionError("Could not start study session.");
      } finally {
        setIsSessionLoading(false);
      }
    };
    startSession();

    // Optional: Cleanup function to end session if user navigates away
    return () => {
      if (sessionId) {
        // updateStudySession(sessionId, { end_time: new Date().toISOString() })
        //   .catch(err => console.error("Failed to update session end time:", err));
      }
    };
  }, [deckId]);

  // 2. Fetch Next Card
  const {
    nextCard,
    isLoading: isLoadingNextCard,
    isError: isErrorNextCard,
    error: errorNextCard,
    mutate: fetchNextCard,
  } = useNextCard(sessionId ? deckId : null);

  // Check for deck completion - when nextCard is null but loading is complete
  useEffect(() => {
    if (!isLoadingNextCard && nextCard === null) {
      setIsDeckCompleted(true);
    }
  }, [nextCard, isLoadingNextCard]);

  // 3. Fetch Full Card Details when nextCard is available
  const {
    card: currentCardDetails,
    isLoading: isLoadingCardDetails,
    isError: isErrorCardDetails,
  } = useCard(nextCard?.card_id || '');

  // Start timer when a new card is loaded and ready
  useEffect(() => {
    if (currentCardDetails && !isLoadingCardDetails && !isSubmitting) {
      cardStartTimeRef.current = Date.now();
    }
  }, [currentCardDetails, isLoadingCardDetails, isSubmitting]);

  // 4. Handle Answer Submission
  const handleAnswer = async (difficulty: "again" | "hard" | "good" | "perfect") => {
    if (!sessionId || !nextCard || !cardStartTimeRef.current || isSubmitting) return;

    setIsSubmitting(true);
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - cardStartTimeRef.current) / 1000);

    try {
      await createStudyRecord({
        session_id: sessionId,
        card_id: nextCard.card_id,
        response_quality: difficultyMap[difficulty],
        time_taken: timeTaken,
        confidence_level: ConfidenceLevel.MEDIUM
      });

      // Try to fetch the next card
      await fetchNextCard();
      
      // We don't need to check result here since the useEffect will
      // detect if nextCard becomes null after fetching

      cardStartTimeRef.current = null; // Reset timer ref for the next card

    } catch (error) {
      console.error("Failed to create study record:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Loading and Error States ---
  if (isSessionLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Creating study session...</div>;
  }

  if (sessionError) {
    return <div className="flex flex-col items-center justify-center h-screen text-red-500">{sessionError} <Button onClick={() => router.back()} className="mt-4">Go Back</Button></div>;
  }

  // Show loading for the *next* card fetch FIRST
  if (isLoadingNextCard) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading next card...</div>;
  }

  // THEN, check for completion *after* next card loading is done
  // Using isDeckCompleted state which is set when nextCard is null
  if (isDeckCompleted || !nextCard) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h2 className="text-2xl font-semibold text-foreground">🎉 All cards studied!</h2>
        <p className="text-secondary-foreground">You've completed this study session.</p>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4 border-[1.5px]"
        >
          Return to decks
        </Button>
      </div>
    );
  }

  // --- If we have a nextCard, proceed to load its details ---

  // Now handle loading for the specific card's details
  if (isLoadingCardDetails) {
     return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading card details...</div>;
  }

  // Handle error loading card details OR if details are unexpectedly null/undefined
   if (isErrorCardDetails || !currentCardDetails) {
     console.error("Error loading card details or card details are null/undefined", { isError: isErrorCardDetails, details: currentCardDetails });
     return <div className="flex justify-center items-center h-screen text-red-500">Error loading card details. Please try again or return to decks.</div>;
   }

  // --- Prepare Flashcard Props (only if card details are valid and loaded) ---
  const currentCard = currentCardDetails as Card;

  const frontMedia = currentCard.media?.filter(m => m.side.toLowerCase() === "front") || [];
  const backMedia = currentCard.media?.filter(m => m.side.toLowerCase() === "back") || [];

  const frontImage = frontMedia.find(m => m.media_type.toLowerCase() === 'image');
  const frontAudio = frontMedia.find(m => m.media_type.toLowerCase() === 'audio');
  const backImage = backMedia.find(m => m.media_type.toLowerCase() === 'image');
  const backAudio = backMedia.find(m => m.media_type.toLowerCase() === 'audio');

  const formatMediaUrl = (media?: CardMedia) => {
    if (!media) return undefined;
    // Ensure correct base URL and path formatting
    return `http://localhost:8000/${media.file_path.replace(/\\/g, '/')}`;
  };

  const flashcardProps = {
    question: currentCard.front_content,
    answer: currentCard.back_content,
    mnemonics: currentCard.mnemonics,
    examples: currentCard.examples,
    frontImageUrl: formatMediaUrl(frontImage),
    frontAudioUrl: formatMediaUrl(frontAudio),
    backImageUrl: formatMediaUrl(backImage),
    backAudioUrl: formatMediaUrl(backAudio),
    onAnswer: handleAnswer,
    isSubmitting: isSubmitting,
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Render Flashcard with loading overlay during submission */}
      <div className="relative flex-1">
        {isSubmitting && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary-green" />
          </div>
        )}
        <Flashcard {...flashcardProps} />
      </div>
    </div>
  );
}