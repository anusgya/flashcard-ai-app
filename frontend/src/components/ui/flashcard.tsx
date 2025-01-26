"use client";

import { useState } from "react";
import { ArrowLeft, Pencil, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FlashcardProps {
  question: string;
  answer: string;
  mnemonics?: string;
  examples?: string[];
  imageUrl?: string;
  audioUrl?: string;
  onEdit?: () => void;
  onAnswer?: (difficulty: "again" | "hard" | "good" | "perfect") => void;
}

export function Flashcard({
  question,
  answer,
  mnemonics,
  examples,
  imageUrl,
  audioUrl,
  onEdit,
  onAnswer,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const router = useRouter();
  const audioRef = useState<HTMLAudioElement | null>(null);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAudioPlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navigation */}
      <Button
        variant="ghost"
        className="p-2 hover:bg-transparent absolute top-4 left-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      {/* Card stack container */}
      <div className="flex-1 flex justify-center px-4 py-2 mt-16">
        <div className="relative w-full max-w-3xl">
          {/* Main card with flip effect */}
          <div className="h-[600px] [perspective:1000px]">
            <div
              className={`relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] ${
                isFlipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              {/* Front of card */}
              <div
                className="absolute inset-0 [backface-visibility:hidden]"
                onClick={handleFlip}
              >
                <div className="p-8 rounded-lg border border-border bg-muted h-full flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.();
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 flex items-center justify-center text-center text-lg">
                    {question}
                  </div>
                  {audioUrl && (
                    <div className="absolute bottom-4 right-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAudioPlay();
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Back of card */}
              <div
                className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]"
                onClick={(e) => e.stopPropagation()} // Prevent flip when clicking the back content
              >
                <div className="p-4 rounded-lg border flex flex-col gap-4 border-border bg-muted h-full">
                  {/* <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.();
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button> */}
                  <div className="">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-secondary-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.();
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={"ghost"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFlip();
                      }}
                      className="text-secondary-foreground bg-background hover:text-foreground"
                    >
                      Show Question
                    </Button>
                  </div>

                  <Tabs defaultValue="answer" className="h-full">
                    <div onClick={(e) => e.stopPropagation()}>
                      {" "}
                      <TabsList className="grid w-full grid-cols-4 text-secondary-foreground border border-divider">
                        <TabsTrigger value="answer">Answer</TabsTrigger>
                        {mnemonics && (
                          <TabsTrigger value="mnemonics">Mnemonics</TabsTrigger>
                        )}
                        {examples && examples.length > 0 && (
                          <TabsTrigger value="examples">Examples</TabsTrigger>
                        )}
                        {imageUrl && (
                          <TabsTrigger value="media">Media</TabsTrigger>
                        )}
                      </TabsList>
                    </div>

                    <TabsContent
                      value="answer"
                      className="h-[calc(100%-50px)] overflow-auto"
                      onClick={(e) => e.stopPropagation()} // Prevent flip when clicking content
                    >
                      <div className="p-4 text-lg">{answer}</div>
                    </TabsContent>

                    {mnemonics && (
                      <TabsContent
                        value="mnemonics"
                        className="h-[calc(100%-50px)] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 space-y-4">
                          <h3 className="text-lg font-semibold">
                            Mnemonic Device
                          </h3>
                          <div>{mnemonics}</div>
                        </div>
                      </TabsContent>
                    )}

                    {examples && examples.length > 0 && (
                      <TabsContent
                        value="examples"
                        className="h-[calc(100%-50px)] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 space-y-4">
                          <h3 className="text-lg font-semibold">Examples</h3>
                          {examples.map((example, index) => (
                            <div
                              key={index}
                              className="p-4 bg-secondary rounded-lg"
                            >
                              {example}
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    )}

                    {imageUrl && (
                      <TabsContent
                        value="media"
                        className="h-[calc(100%-50px)] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 space-y-4">
                          <div className="aspect-video relative rounded-lg overflow-hidden">
                            <img
                              src={imageUrl}
                              alt="Card media"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>

                  {audioUrl && (
                    <audio ref={audioRef} src={audioUrl} className="hidden" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="p-8 flex flex-col items-center gap-4">
        {!isFlipped ? (
          <Button
            className="bg-primary-blue border-primary-blue-secondary font-semibold text-muted hover:bg-primary-blue/90"
            onClick={handleFlip}
          >
            Show Answer
          </Button>
        ) : (
          <>
            <div className="flex gap-4 text-sm text-secondary-foreground">
              <span>&lt;10m</span>
              <span>4d</span>
              <span>1.3mo</span>
              <span>3.1mo</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="hover:bg-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAnswer?.("again");
                }}
              >
                Again
              </Button>
              <Button
                variant="outline"
                className="hover:bg-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAnswer?.("hard");
                }}
              >
                Hard
              </Button>
              <Button
                variant="outline"
                className="hover:bg-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAnswer?.("good");
                }}
              >
                Good
              </Button>
              <Button
                variant="outline"
                className="hover:bg-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAnswer?.("perfect");
                }}
              >
                Perfect
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
