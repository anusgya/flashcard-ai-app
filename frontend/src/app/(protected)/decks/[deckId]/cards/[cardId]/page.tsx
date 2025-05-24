"use client";

import { ArrowLeft, MoreVertical, X, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  useCardLLMResponses,
  generateMnemonic,
  generateExplanation,
  generateExamples,
  updateLLMResponse,
  deleteLLMResponse,
  ResponseType,
} from "@/hooks/api/useLLMResponses";

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

interface LLMResponse {
  id: string;
  card_id: string;
  response_type: ResponseType;
  content: string;
  is_pinned: boolean;
  generated_at: string;
}

// Reusable InfoBox component
const InfoBox = ({
  title,
  children,
  onClose,
  onDelete,
}: {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  onDelete?: () => void;
}) => (
  <div className="bg-background rounded-lg border border-divider">
    <div className="p-4 border-b border-divider flex items-center justify-between">
      <h2 className="text-lg font-semibold text-secondary-foreground">
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-secondary-foreground hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
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
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export default function CardDetailPage() {
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingType, setGeneratingType] = useState<ResponseType | null>(
    null
  );
  const params = useParams<{ deckId: string; cardId: string }>();

  // Fetch LLM responses
  const {
    responses: llmResponses,
    isLoading: loadingResponses,
    isError: responseError,
    mutate: mutateResponses,
  } = useCardLLMResponses(params.cardId);

  // Group responses by type
  const mnemonics =
    llmResponses?.filter((r: LLMResponse) => r.response_type === "mnemonic") ||
    [];
  const explanations =
    llmResponses?.filter(
      (r: LLMResponse) => r.response_type === "explanation"
    ) || [];
  const examples =
    llmResponses?.filter((r: LLMResponse) => r.response_type === "example") ||
    [];

  // Get the most recent ones
  const latestMnemonic = mnemonics[0];
  const latestExplanation = explanations[0];
  const latestExample = examples[0];

  // Show the latest
  const displayedMnemonic = latestMnemonic;
  const displayedExplanation = latestExplanation;
  const displayedExample = latestExample;

  // Fetch card data
  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const response = await fetch(
          `http://localhost:8000/api/cards/${params.cardId}`,
          {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch card: ${response.status}`);
        }

        const data = await response.json();
        setCard(data);
      } catch (error) {
        console.error("Error fetching card:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load card"
        );
      } finally {
        setLoading(false);
      }
    };

    if (params.cardId) {
      fetchCard();
    }
  }, [params.cardId]);

  // Handle generating new responses
  const handleGenerateMnemonic = async () => {
    if (!card) return;

    try {
      setGeneratingType("mnemonic");
      await generateMnemonic(params.cardId, "");
      await mutateResponses();
    } catch (error) {
      console.error("Error generating mnemonic:", error);
    } finally {
      setGeneratingType(null);
    }
  };

  const handleGenerateExplanation = async () => {
    if (!card) return;

    try {
      setGeneratingType("explanation");
      await generateExplanation(params.cardId, "basic");
      await mutateResponses();
    } catch (error) {
      console.error("Error generating explanation:", error);
    } finally {
      setGeneratingType(null);
    }
  };

  const handleGenerateExamples = async () => {
    if (!card) return;

    try {
      setGeneratingType("example");
      await generateExamples(params.cardId, 1);
      await mutateResponses();
    } catch (error) {
      console.error("Error generating examples:", error);
    } finally {
      setGeneratingType(null);
    }
  };

  // Handle pinning/unpinning responses
  const handleTogglePin = async (response: LLMResponse) => {
    try {
      await updateLLMResponse(response.id, !response.is_pinned);
      await mutateResponses();
    } catch (error) {
      console.error("Error updating response:", error);
    }
  };

  // Handle deleting responses
  const handleDeleteResponse = async (responseId: string) => {
    try {
      await deleteLLMResponse(responseId);
      await mutateResponses();
    } catch (error) {
      console.error("Error deleting response:", error);
    }
  };

  // Get front and back media
  const frontMedia = card?.media?.filter(
    (m) => m.side.toLowerCase() === "front"
  );
  const backMedia = card?.media?.filter((m) => m.side.toLowerCase() === "back");

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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="relative rounded-full border-2 border-purple-500/70 px-6 py-2 text-sm font-medium shadow-sm shadow-orange-500/20 text-primary-foreground"
                      disabled={!!generatingType}
                    >
                      {generatingType ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4 text-primary-foreground" />
                          <span className="font-semibold">Ask AI</span>
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={handleGenerateMnemonic}
                      disabled={!!generatingType}
                    >
                      Generate Mnemonic
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={handleGenerateExamples}
                      disabled={!!generatingType}
                    >
                      Provide Example
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={handleGenerateExplanation}
                      disabled={!!generatingType}
                    >
                      Explain Like I'm 5
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Front media */}
            {frontMedia && frontMedia.length > 0 && (
              <div className="mt-4">
                {frontMedia.map((media) => (
                  <div key={media.id} className="mb-4">
                    {media.media_type.toLowerCase() === "image" && (
                      <div className="border border-divider rounded-md overflow-hidden">
                        <Image
                          src={`http://localhost:8000/${media.file_path.replace(
                            /\\/g,
                            "/"
                          )}`}
                          alt="Question media"
                          width={500}
                          height={300}
                          className="object-contain w-full"
                        />
                      </div>
                    )}
                    {media.media_type.toLowerCase() === "audio" && (
                      <audio controls className="w-full mt-2">
                        <source
                          src={`http://localhost:8000/${media.file_path.replace(
                            /\\/g,
                            "/"
                          )}`}
                        />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="w-full h-px bg-divider my-6"></div>
            {/* Answer section */}
            <div className="mt-8">
              <div className="text-foreground leading-relaxed">
                {card.back_content}
              </div>

              {/* Back media */}
              {backMedia && backMedia.length > 0 && (
                <div className="mt-4">
                  {backMedia.map((media) => (
                    <div key={media.id} className="mb-4">
                      {media.media_type.toLowerCase() === "image" && (
                        <div className="border border-divider rounded-md overflow-hidden">
                          <Image
                            src={`http://localhost:8000/${media.file_path.replace(
                              /\\/g,
                              "/"
                            )}`}
                            alt="Answer media"
                            width={500}
                            height={300}
                            className="object-contain w-full"
                          />
                        </div>
                      )}
                      {media.media_type.toLowerCase() === "audio" && (
                        <audio controls className="w-full mt-2">
                          <source
                            src={`http://localhost:8000/${media.file_path.replace(
                              /\\/g,
                              "/"
                            )}`}
                          />
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
            {loadingResponses ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary-green" />
              </div>
            ) : (
              <>
                {displayedMnemonic && (
                  <InfoBox
                    title="Mnemonic device"
                    onDelete={() => handleDeleteResponse(displayedMnemonic.id)}
                  >
                    <div className="space-y-1 whitespace-pre-wrap">
                      {displayedMnemonic.content}
                    </div>
                  </InfoBox>
                )}

                {displayedExample && (
                  <InfoBox
                    title="Example"
                    onDelete={() => handleDeleteResponse(displayedExample.id)}
                  >
                    <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {displayedExample.content}
                    </div>
                  </InfoBox>
                )}

                {displayedExplanation && (
                  <InfoBox
                    title="Explanation"
                    onDelete={() =>
                      handleDeleteResponse(displayedExplanation.id)
                    }
                  >
                    <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {displayedExplanation.content}
                    </div>
                  </InfoBox>
                )}

                {!displayedMnemonic &&
                  !displayedExample &&
                  !displayedExplanation && (
                    <div className="flex flex-col items-center mt-48 justify-center h-32 text-secondary-foreground">
                      <p>No AI-generated content yet.</p>
                      <p className="mt-2">
                        Use the "Ask AI" button to generate content.
                      </p>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
