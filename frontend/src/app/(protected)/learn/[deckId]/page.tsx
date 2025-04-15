"use client";
import { Flashcard } from "@/components/ui/flashcard";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useCards } from "@/hooks/api/use-card";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Define card interfaces based on the CardDetailPage component
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
  examples?: string;
}

export default function LearnPage() {
  const params = useParams<{deckId: string}>();
  const { cards, isLoading, isError, mutate } = useCards(params.deckId);
  const router = useRouter();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isDeckCompleted, setIsDeckCompleted] = useState(false);

  const handleAnswer = (difficulty: "again" | "hard" | "good" | "perfect") => {
    console.log("Difficulty:", difficulty);
    
    if (cards && currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setIsDeckCompleted(true);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading cards...</div>;
  }

  if (isError) {
    return <div className="flex justify-center items-center h-screen">Error loading cards.</div>;
  }

  if (!cards || cards.length === 0) {
    return <div className="flex justify-center items-center h-screen">No cards found in this deck.</div>;
  }

  if (isDeckCompleted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h2 className="text-2xl font-semibold text-foreground">All cards studied!</h2>
        <p className="text-secondary-foreground">You've completed this study session.</p>
        <Button 
          variant="outline"
          onClick={() => router.push(`/learn`)}
          className="mt-4 border-[1.5px]"
        >
          Return to Decks
        </Button>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex] as Card;
  
  // Get front and back media
  const frontMedia = currentCard.media?.filter(m => m.side.toLowerCase() === "front") || [];
  const backMedia = currentCard.media?.filter(m => m.side.toLowerCase() === "back") || [];
  
  // Get the first image and audio for front and back
  const frontImage = frontMedia.find(m => m.media_type.toLowerCase() === 'image');
  const frontAudio = frontMedia.find(m => m.media_type.toLowerCase() === 'audio');
  const backImage = backMedia.find(m => m.media_type.toLowerCase() === 'image');
  const backAudio = backMedia.find(m => m.media_type.toLowerCase() === 'audio');
  
  // Create URLs with proper path formatting
  const formatMediaUrl = (media?: CardMedia) => {
    if (!media) return undefined;
    return `http://localhost:8000/${media.file_path.replace(/\\/g, '/')}`;
  };

  // Map the API card data structure to the format expected by the Flashcard component
  const flashcardProps = {
    question: currentCard.front_content,
    answer: currentCard.back_content,
    mnemonics: currentCard.mnemonics,
    examples: [],
    frontImageUrl: formatMediaUrl(frontImage),
    frontAudioUrl: formatMediaUrl(frontAudio),
    backImageUrl: formatMediaUrl(backImage),
    backAudioUrl: formatMediaUrl(backAudio),
    onAnswer: handleAnswer
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex gap-4 font-fragment-mono">
        {/* <span className="text-primary-blue">Card {currentCardIndex + 1} of {cards.length}</span> */}
      </div>
      
      <Flashcard {...flashcardProps} />
    </div>
  );
}