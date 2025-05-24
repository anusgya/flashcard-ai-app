"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Pencil, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import Image from "next/image";

export interface FlashcardProps {
  question: string;
  answer: string;
  mnemonic?: string;
  example?: string[];
  eli5?: string;
  frontImageUrl?: string;
  frontAudioUrl?: string;
  backImageUrl?: string;
  backAudioUrl?: string;
  onEdit?: () => void;
  onAnswer?: (difficulty: "again" | "hard" | "good" | "perfect") => void;
}

export function Flashcard(props: FlashcardProps) {
  // Destructure props here
  const {
    question,
    answer,
    mnemonic,
    example,
    eli5, // Add this line to destructure the explanation prop
    frontImageUrl,
    frontAudioUrl,
    backImageUrl,
    backAudioUrl,
    onEdit,
    onAnswer,
  } = props;

  const [isFlipped, setIsFlipped] = useState(false);
  const [isFrontAudioPlaying, setIsFrontAudioPlaying] = useState(false);
  const [isBackAudioPlaying, setIsBackAudioPlaying] = useState(false);
  const router = useRouter();
  const frontAudioRef = useRef<HTMLAudioElement | null>(null);
  const backAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    
    // Pause any playing audio when flipping the card
    if (frontAudioRef.current && isFrontAudioPlaying) {
      frontAudioRef.current.pause();
      setIsFrontAudioPlaying(false);
    }
    
    if (backAudioRef.current && isBackAudioPlaying) {
      backAudioRef.current.pause();
      setIsBackAudioPlaying(false);
    }
  };

  const handleFrontAudioPlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip
    
    if (frontAudioRef.current) {
      if (isFrontAudioPlaying) {
        frontAudioRef.current.pause();
      } else {
        frontAudioRef.current.play();
      }
      setIsFrontAudioPlaying(!isFrontAudioPlaying);
    }
  };

  const handleBackAudioPlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip
    
    if (backAudioRef.current) {
      if (isBackAudioPlaying) {
        backAudioRef.current.pause();
      } else {
        backAudioRef.current.play();
      }
      setIsBackAudioPlaying(!isBackAudioPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-background py-3 px-12">
      {/* Top navigation */}
     
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="text-secondary-foreground border mb-4 border-divider rounded-full hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>


      {/* Card stack container */}
      <div className="flex-1 flex justify-center px-4 py-2 mt-16">
        <div className="relative w-full max-w-4xl">
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
                  
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-lg gap-6 overflow-y-auto">
                    {question}
                    
                    {/* Front image */}
                    {frontImageUrl && (
                      <div className="mt-4 w-full max-w-md mx-auto">
                        <div className="border border-divider rounded-md overflow-hidden">
                          <Image 
                            src={frontImageUrl}
                            alt="Question image"
                            width={500}
                            height={300}
                            className="object-contain w-full max-h-[400px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Front audio control */}
                  {frontAudioUrl && (
                    <div className="absolute bottom-4 right-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleFrontAudioPlay}
                      >
                        {isFrontAudioPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <audio 
                        ref={frontAudioRef} 
                        src={frontAudioUrl} 
                        onEnded={() => setIsFrontAudioPlaying(false)}
                        className="hidden" 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Back of card */}
              <div
                className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 rounded-lg border flex flex-col gap-2 border-border bg-muted h-full overflow-hidden">
                  <div className="flex justify-between items-center">
                    <div></div>
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
                  <div className="">
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
                    {/* <Button
                      variant={"ghost"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFlip();
                      }}
                      className="text-secondary-foreground bg-background hover:text-foreground"
                    >
                      Show Question
                    </Button> */}
                  </div>

                  <Tabs defaultValue="answer" className="h-full overflow-hidden flex flex-col">
                    <div onClick={(e) => e.stopPropagation()}>
                      <TabsList className="grid w-full grid-cols-5 text-secondary-foreground border border-divider">
                        <TabsTrigger value="answer">Answer</TabsTrigger>
                        {eli5 && (
                          <TabsTrigger value="eli5">Eli5</TabsTrigger>
                        )}
                        {mnemonic && (
                          <TabsTrigger value="mnemonic">Mnemonic</TabsTrigger>
                        )}
                        {example && example.length > 0 && (
                          <TabsTrigger value="example">Example</TabsTrigger>
                        )}
                        {(backImageUrl || backAudioUrl) && (
                          <TabsTrigger value="media">Media</TabsTrigger>
                        )}
                      </TabsList>
                    </div>

                    <TabsContent
                      value="answer"
                      className="h-[calc(100%-50px)] overflow-auto"
                      onClick={(e) => e.stopPropagation()} // Prevent flip when clicking content
                    >
                      <div className="p-4 text-lg whitespace-pre-wrap">{answer}</div>
                    </TabsContent>

                    {eli5 && (
                      <TabsContent
                        value="eli5"
                        className="h-[calc(100%-50px)] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 space-y-4">
                          <div className="whitespace-pre-wrap text-lg">{eli5}</div>
                        </div>
                      </TabsContent>
                    )}

                    {mnemonic && (
                      <TabsContent
                        value="mnemonic"
                        className="h-[calc(100%-50px)] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 space-y-4">
                          <div className="whitespace-pre-wrap text-lg">{mnemonic}</div>
                        </div>
                      </TabsContent>
                    )}

                    {example && example.length > 0 && (
                      <TabsContent
                        value="example"
                        className="h-[calc(100%-50px)] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 space-y-4 text-lg">
                          {/* <h3 className="text-lg font-semibold">example</h3> */}
                          {example.map((example, index) => (
                            <div
                              key={index}
                              className="whitespace-pre-wrap"
                            >
                              {example}
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    )}

                    {(backImageUrl || backAudioUrl) && (
                      <TabsContent
                        value="media"
                        className="h-[calc(100%-50px)] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 space-y-4">
                          {backImageUrl && (
                            <div className="rounded-lg overflow-hidden">
                              <Image
                                src={backImageUrl}
                                alt="Card media"
                                width={500}
                                height={300}
                                className="object-contain w-full max-h-[400px]"
                              />
                            </div>
                          )}
                          
                          {backAudioUrl && (
                            <div className="mt-4 flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={handleBackAudioPlay}
                              >
                                {isBackAudioPlaying ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                              <span className="text-sm text-secondary-foreground">
                                Audio Recording
                              </span>
                              <audio 
                                ref={backAudioRef} 
                                src={backAudioUrl} 
                                onEnded={() => setIsBackAudioPlaying(false)}
                                className="hidden" 
                              />
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
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
            {/* <div className="flex gap-4 text-sm text-secondary-foreground">
              <span>&lt;10m</span>
              <span>4d</span>
              <span>1.3mo</span>
              <span>3.1mo</span>
            </div> */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="hover:bg-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAnswer?.("again");
                  setIsFlipped(false);
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
                  setIsFlipped(false);
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
                  setIsFlipped(false);
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
                  setIsFlipped(false);
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