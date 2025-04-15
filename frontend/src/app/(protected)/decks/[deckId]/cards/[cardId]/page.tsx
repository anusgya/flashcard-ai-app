"use client";

import { ArrowLeft, MoreVertical, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";

interface PageProps {
  params: {
    deckId: string;
    cardId: string;
  };
}

interface CardData {
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
}

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

// Reusable InfoBox component
const InfoBox = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}) => (
  <div className="bg-background rounded-lg border border-divider">
    <div className="p-4 border-b border-divider flex items-center justify-between">
      <h2 className="text-lg font-semibold text-secondary-foreground">
        {title}
      </h2>
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-secondary-foreground hover:text-foreground -mr-2"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export default function CardDetailPage() {
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams<{deckId:string, cardId:string}>()

  // Fetch card data
  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        const response = await fetch(`http://localhost:8000/api/cards/${params.cardId}`, {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch card: ${response.status}`);
        }
        
        const data = await response.json();
        setCard(data);
      } catch (error) {
        console.error("Error fetching card:", error);
        setError(error instanceof Error ? error.message : "Failed to load card");
      } finally {
        setLoading(false);
      }
    };
    
    if (params.cardId) {
      fetchCard();
    }
  }, [params.cardId]);

  // Get front and back media
  const frontMedia = card?.media?.filter(m => m.side.toLowerCase() === "front");
  const backMedia = card?.media?.filter(m => m.side.toLowerCase() === "back");

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-green" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Link href={`/decks/${params.deckId}/cards`}>
          <Button>Back to Cards</Button>
        </Link>
      </div>
    );
  }

  // Card not found
  if (!card) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <p className="text-secondary-foreground mb-4">Card not found</p>
        <Link href={`/decks/${params.deckId}/cards`}>
          <Button>Back to Cards</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen pt-3 px-12">
      <div className="mb-8">
        <Link href={`/decks/${params.deckId}/cards`}>
          <Button
            variant="outline"
            size="icon"
            className="text-secondary-foreground border border-divider rounded-full hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="bg-muted rounded-lg border border-divider h-[calc(100vh-7rem)]">
        <div className="grid grid-cols-2 divide-x divide-divider h-full">
          {/* Left Side - Card Content */}
          <div className="p-8 space-y-6 h-full overflow-auto">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl font-semibold text-foreground font-inter flex-1 min-w-0 break-words">
                {card.front_content}
              </h1>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  className="text-purple-300 border-b-3 rounded-full hover:text-primary-blue/90 text-xs"
                >
                  get cheat code
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-secondary-foreground hover:text-foreground flex-shrink-0"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Front media */}
            {frontMedia && frontMedia.length > 0 && (
              <div className="mt-4">
                {frontMedia.map((media) => (
                  <div key={media.id} className="mb-4">
                    {media.media_type.toLowerCase() === 'image' && (
                      <div className="border border-divider rounded-md overflow-hidden">
                        <Image 
                          src={`http://localhost:8000/${media.file_path.replace(/\\/g, '/')}`}
                          alt="Question media"
                          width={500}
                          height={300}
                          className="object-contain w-full"
                        />
                      </div>
                    )}
                    {media.media_type.toLowerCase() === 'audio' && (
                      <audio controls className="w-full mt-2">
                        <source src={`http://localhost:8000/${media.file_path.replace(/\\/g, '/')}`} />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Answer section */}
            <div className="mt-8">
              {/* <h2 className="text-lg font-semibold text-foreground mb-4">Answer:</h2> */}
              <div className="text-foreground leading-relaxed">
                {card.back_content}
              </div>
              
              {/* Back media */}
              {backMedia && backMedia.length > 0 && (
                <div className="mt-4">
                  {backMedia.map((media) => (
                    <div key={media.id} className="mb-4">
                      {media.media_type.toLowerCase() === 'image' && (
                        <div className="border border-divider rounded-md overflow-hidden">
                          <Image 
                            src={`http://localhost:8000/${media.file_path.replace(/\\/g, '/')}`}
                            alt="Answer media"
                            width={500}
                            height={300}
                            className="object-contain w-full"
                          />
                        </div>
                      )}
                      {media.media_type.toLowerCase() === 'audio' && (
                        <audio controls className="w-full mt-2">
                          <source src={`http://localhost:8000/${media.file_path.replace(/\\/g, '/')}`} />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - AI Generated Content */}
          <div className="p-8 space-y-6 h-full overflow-auto">
            <InfoBox title="Mnemonic device" onClose={() => {}}>
              <div className="space-y-1">
                {/* This would be AI-generated content */}
                <p>
                  <span className="">B</span>ig
                </p>
                <p>
                  <span className="">I</span>deas
                </p>
                <p>
                  <span className="">O</span>f
                </p>
                <p>
                  <span className="">L</span>ife
                </p>
                <p>
                  <span className="">O</span>rganized
                </p>
                <p>
                  <span className="">G</span>enetically
                </p>
                <p>
                  <span className="">Y</span>early
                </p>
              </div>
            </InfoBox>

            <InfoBox title="Example">
              <p className="text-foreground leading-relaxed">
                {/* This would be AI-generated content */}
                Cell Theory – Example: The human body is made up of trillions of
                cells, such as muscle cells and nerve cells. Each cell performs specific
                functions while working together to maintain the organism.
              </p>
            </InfoBox>
            
            <InfoBox title="Additional Notes">
              <p className="text-foreground leading-relaxed">
                {/* This would be AI-generated content */}
                Key concepts to remember:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>The question focuses on the definition of biology</li>
                  <li>Biology studies living organisms and their interactions</li>
                  <li>Important branches include ecology, genetics, and physiology</li>
                </ul>
              </p>
            </InfoBox>
          </div>
        </div>
      </div>
    </div>
  );
}