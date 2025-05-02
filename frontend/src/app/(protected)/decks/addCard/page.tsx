"use client";

import { ArrowLeft, ImagePlus, Mic, MicOff, X, Image as ImageIcon, Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCards } from "@/hooks/api/use-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeck, useDecks } from "@/hooks/api/use-deck";
import { createCard } from "@/hooks/api/use-card";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function AddNotePage( ) {
  const { toast } = useToast();
  const params = useParams<{deckId: string}>();
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [answerImage, setAnswerImage] = useState<File | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<string | null>(null);
  const [answerImagePreview, setAnswerImagePreview] = useState<string | null>(null);
  const [questionAudio, setQuestionAudio] = useState<Blob | null>(null);
  const [answerAudio, setAnswerAudio] = useState<Blob | null>(null);
  const [questionAudioUrl, setQuestionAudioUrl] = useState<string | null>(null);
  const [answerAudioUrl, setAnswerAudioUrl] = useState<string | null>(null);
  const [activeMediaSection, setActiveMediaSection] = useState<"question" | "answer">("answer");
  
  const { mutate } = useCards(params.deckId);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSection, setRecordingSection] = useState<"question" | "answer" | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Audio preview states
  const [isPlayingQuestionAudio, setIsPlayingQuestionAudio] = useState(false);
  const [isPlayingAnswerAudio, setIsPlayingAnswerAudio] = useState(false);
  const questionAudioRef = useRef<HTMLAudioElement | null>(null);
  const answerAudioRef = useRef<HTMLAudioElement | null>(null);

  const questionInputRef = useRef<HTMLTextAreaElement>(null);
  const answerInputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);


  const {deck} = useDeck(params.deckId);
  const {decks} = useDecks();
  const [selectedDeck, setSelectedDeck] = useState(params.deckId);

  type Deck = {
    id: string;
    name: string;
    description: string;
  }

  // Function to convert data URI to a file blob
  const dataURItoBlob = (dataURI: string): Blob => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
  };

  // Handle paste events for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent, section: "question" | "answer") => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          if (!blob) continue;

          const reader = new FileReader();
          reader.onload = (event) => {
            const imageUrl = event.target?.result as string;
            
            if (section === "question") {
              // Create a File object from the blob with a meaningful name
              const file = new File([blob], `pasted-image-${Date.now()}.png`, { 
                type: blob.type 
              });
              setQuestionImage(file);
              setQuestionImagePreview(imageUrl);
            } else {
              const file = new File([blob], `pasted-image-${Date.now()}.png`, { 
                type: blob.type 
              });
              setAnswerImage(file);
              setAnswerImagePreview(imageUrl);
            }
          };
          reader.readAsDataURL(blob);
          break; // Only process the first image
        }
      }
    };

    // Create handler functions that we can reference for removal
    const questionPasteHandler = (e: ClipboardEvent) => handlePaste(e, "question");
    const answerPasteHandler = (e: ClipboardEvent) => handlePaste(e, "answer");

    // Add paste event listeners
    if (questionInputRef.current) {
      questionInputRef.current.addEventListener("paste", questionPasteHandler);
    }
    if (answerInputRef.current) {
      answerInputRef.current.addEventListener("paste", answerPasteHandler);
    }

    // Cleanup
    return () => {
      if (questionInputRef.current) {
        questionInputRef.current.removeEventListener("paste", questionPasteHandler);
      }
      if (answerInputRef.current) {
        answerInputRef.current.removeEventListener("paste", answerPasteHandler);
      }
    };
  }, []);

  // Setup audio player controls
  useEffect(() => {
    if (questionAudioUrl && questionAudioRef.current) {
      questionAudioRef.current.onplay = () => setIsPlayingQuestionAudio(true);
      questionAudioRef.current.onpause = () => setIsPlayingQuestionAudio(false);
      questionAudioRef.current.onended = () => setIsPlayingQuestionAudio(false);
    }
    
    if (answerAudioUrl && answerAudioRef.current) {
      answerAudioRef.current.onplay = () => setIsPlayingAnswerAudio(true);
      answerAudioRef.current.onpause = () => setIsPlayingAnswerAudio(false);
      answerAudioRef.current.onended = () => setIsPlayingAnswerAudio(false);
    }
  }, [questionAudioUrl, answerAudioUrl]);

  const toggleAudioPlayback = (section: "question" | "answer") => {
    if (section === "question" && questionAudioRef.current) {
      if (isPlayingQuestionAudio) {
        questionAudioRef.current.pause();
      } else {
        questionAudioRef.current.play();
      }
    } else if (section === "answer" && answerAudioRef.current) {
      if (isPlayingAnswerAudio) {
        answerAudioRef.current.pause();
      } else {
        answerAudioRef.current.play();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || !answer.trim()) {
      toast({
        title:"Missing fields",
        description: "Please fill out all fields",
        variant: "destructive",
      });
      return;
    }

    
    setIsSubmitting(true);
    
    try {
      // First create the card - follow API structure exactly
      const cardData = {
        deck_id: selectedDeck,
        front_content: question,
        back_content: answer,
        source: null, // Optional source field
        tags: [] // Optional tags array
      };


      const token = localStorage.getItem("token");
      
      // Make API call to create the card - add trailing slash to match backend
      const response = await fetch('http://localhost:8000/api/cards/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),

        },
        body: JSON.stringify(cardData),
        credentials: "include",
      });
      
      if (!response.ok) {
        toast({title:"Failed To Add Card", variant: "destructive"})
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create card');
      }
      
      const card = await response.json();
  
      
      // Now upload media files if they exist
      if (questionImage || answerImage || questionAudio || answerAudio) {
        const cardId = card.id;
        
        const uploadPromises = [];
        
        // Upload question image if exists
        if (questionImage) {
          uploadPromises.push(uploadMedia(cardId, questionImage, "front"));
        }
        
        // Upload answer image if exists
        if (answerImage) {
          uploadPromises.push(uploadMedia(cardId, answerImage, "back"));
        }
        
        // Upload question audio if exists
        if (questionAudio) {
          // Convert blob to file
          const audioFile = new File([questionAudio], `question-audio-${Date.now()}.webm`, {
            type: "audio/webm"
          });
          uploadPromises.push(uploadMedia(cardId, audioFile, "front"));
        }
        
        // Upload answer audio if exists
        if (answerAudio) {
          // Convert blob to file
          const audioFile = new File([answerAudio], `answer-audio-${Date.now()}.webm`, {
            type: "audio/webm"
          });
          uploadPromises.push(uploadMedia(cardId, audioFile, "back"));
        }
        
        // Wait for all media uploads to complete
        await Promise.all(uploadPromises);
      }
      mutate();
      
      toast({
        // title: "Success",
        title: "Card added successfully",
        variant: "default",
      });
     
      
      // Clear form fields after successful submission
      setQuestion("");
      setAnswer("");
      setQuestionImage(null);
      setQuestionImagePreview(null);
      setAnswerImage(null);
      setAnswerImagePreview(null);
      setQuestionAudio(null);
      setQuestionAudioUrl(null);
      setAnswerAudio(null);
      setAnswerAudioUrl(null);
      

      // After successful submission:
      // router.push(`/decks/${selectedDeck}`);
      
    } catch (error) {
      console.error('Error creating card:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to upload media
  const uploadMedia = async (cardId: string, file: File | Blob, side: "front" | "back") => {
    try {
      const formData = new FormData();
      formData.append("media_file", file);  // This matches your FastAPI parameter
      formData.append("side", side);        // Make sure this matches case of your enum
      
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:8000/api/cards/${cardId}/media`, {
        method: "POST",
        body: formData,
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          // Don't set Content-Type for FormData - the browser will set it with the proper boundary
        },
        credentials: "include",
      });
      
      
      
      if (!response.ok) {
        console.error(`Server response status: ${response.status}`);
        const responseText = await response.text();
        console.error(`Server response: ${responseText}`);
        try {
          const error = JSON.parse(responseText);
          throw new Error(error.detail || `Failed to upload ${side.toLowerCase()} media`);
        } catch (parseError) {
          throw new Error(`Failed to upload media: ${responseText}`);
        }
      }
      
      return response.json();

    } catch (error) {
      console.error(`Error uploading ${side.toLowerCase()} media:`, error);
      throw error;
    }
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      
      if (activeMediaSection === "question") {
        setQuestionImage(file);
        setQuestionImagePreview(imageUrl);
      } else {
        setAnswerImage(file);
        setAnswerImagePreview(imageUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerImageUpload = (section: "question" | "answer") => {
    setActiveMediaSection(section);
    imageInputRef.current?.click();
  };

  // Audio recording functions
  const startRecording = async (section: "question" | "answer") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (section === "question") {
          setQuestionAudio(audioBlob);
          setQuestionAudioUrl(audioUrl);
        } else {
          setAnswerAudio(audioBlob);
          setAnswerAudioUrl(audioUrl);
        }
        
        // Release tracks
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordingSection(null);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSection(section);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to access microphone. Please check your browser permissions.",
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleRecording = (section: "question" | "answer") => {
    if (isRecording && recordingSection === section) {
      stopRecording();
    } else if (isRecording) {
      // If recording in a different section, stop it first
      stopRecording();
      // Short delay to ensure previous recording is stopped
      setTimeout(() => startRecording(section), 300);
    } else {
      startRecording(section);
    }
  };

  const removeMedia = (type: "image" | "audio", section: "question" | "answer") => {
    if (type === "image") {
      if (section === "question") {
        setQuestionImage(null);
        setQuestionImagePreview(null);
      } else {
        setAnswerImage(null);
        setAnswerImagePreview(null);
      }
    } else {
      if (section === "question") {
        setQuestionAudio(null);
        setQuestionAudioUrl(null);
      } else {
        setAnswerAudio(null);
        setAnswerAudioUrl(null);
      }
    }
  };

  // Function to show image preview in toast
  const showImagePreview = (image: string, section: "question" | "answer") => {
    toast({
      title: `${section === "question" ? "Question" : "Answer"} Image`,
      description: (
        <div className="mt-2 flex flex-col items-center">
          <Image 
            src={image} 
            alt={`${section} image preview`} 
            width={250} 
            height={150} 
            className="rounded-md object-contain max-h-[200px] border border-border"
            onError={() => {
              toast({
                title: "Image Error",
                description: "Failed to load image preview",
                variant: "destructive",
              });
            }}
          />
        </div>
      ),
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      <Link href="/decks/cards" className="pt-3 px-12">
        <Button
          variant="outline"
          size="icon"
          className="text-secondary-foreground border mb-4 border-divider rounded-full hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col z-10">
        {/* Hidden file input */}
        <input 
          type="file" 
          ref={imageInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
        />
        
        {/* Hidden audio elements */}
        {questionAudioUrl && (
          <audio ref={questionAudioRef} className="hidden">
            <source src={questionAudioUrl} />
          </audio>
        )}
        
        {answerAudioUrl && (
          <audio ref={answerAudioRef} className="hidden">
            <source src={answerAudioUrl} />
          </audio>
        )}
        
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col space-y-8">
          <div className="flex items-center gap-3">
            <div className="text-secondary-foreground text-sm">Deck:</div>
            <Select value={selectedDeck} onValueChange={setSelectedDeck}>
              <SelectTrigger className="w-full bg-secondary border-2 border-divider text-secondary-foreground">
                <SelectValue placeholder="Select a deck" />
              </SelectTrigger>
              <SelectContent>
                {decks?.map((deck: Deck) => (
                  <SelectItem key={deck.id} value={deck.id.toString()}>
                    {deck.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-secondary-foreground">
                Question
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-secondary-foreground hover:bg-secondary hover:text-foreground"
                  onClick={() => toggleRecording("question")}
                >
                  {isRecording && recordingSection === "question" ? (
                    <MicOff className="h-4 w-4 text-red-500" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-secondary-foreground hover:bg-secondary hover:text-foreground"
                  onClick={() => triggerImageUpload("question")}
                  disabled={!!questionImage}
                >
                  <ImagePlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <textarea
                ref={questionInputRef}
                className="bg-background w-full text-lg min-h-[150px] p-3 border-border border-[1.5px] rounded-md placeholder:text-secondary-foreground resize-none"
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                // placeholder="Enter your question here. Paste images directly or use the Add image button."
              />
              
              {/* Media indicators */}
              <div className="absolute right-3 bottom-3 flex gap-2 z-10">
                {questionImagePreview && (
                  <button
                    type="button"
                    className="flex items-center p-1 bg-primary-green/10 text-primary-green rounded-md hover:bg-primary-green/20"
                    onClick={() => {
                      if (questionImagePreview) {
                        showImagePreview(questionImagePreview, "question");
                      }
                    }}
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs">Image</span>
                    <X 
                      className="h-3 w-3 ml-1 hover:text-red-500" 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMedia("image", "question");
                      }}
                    />
                  </button>
                )}
                
                {questionAudioUrl && (
                  <button
                    type="button"
                    className="flex items-center p-1 bg-primary-green/10 text-primary-green rounded-md hover:bg-primary-green/20"
                    onClick={() => toggleAudioPlayback("question")}
                  >
                    <Volume2 className="h-4 w-4 mr-1" />
                    <span className="text-xs">{isPlayingQuestionAudio ? "Playing" : "Audio"}</span>
                    <X 
                      className="h-3 w-3 ml-1 hover:text-red-500" 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMedia("audio", "question");
                      }}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-secondary-foreground">
                Answer
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-secondary-foreground hover:bg-secondary hover:text-foreground"
                  onClick={() => toggleRecording("answer")}
                >
                  {isRecording && recordingSection === "answer" ? (
                    <MicOff className="h-4 w-4 text-red-500" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-secondary-foreground hover:bg-secondary hover:text-foreground"
                  onClick={() => triggerImageUpload("answer")}
                  disabled={!!answerImage}
                >
                  <ImagePlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative flex-1">
              <textarea
                ref={answerInputRef}
                className="w-full min-h-[300px] p-3 bg-background border-border border-[1.5px] rounded-md text-lg resize-none"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  // Auto-resize textarea to fit content
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                // placeholder="Enter your answer here. Paste images directly or use the Add image button."
              />
              
              {/* Media indicators - Fixed positioning to prevent overflow */}
              <div className="absolute right-3 bottom-3 flex flex-col gap-2 max-w-[40%] z-10">
                {answerImagePreview && (
                  <button
                    type="button"
                    className="flex items-center p-1 bg-primary-green/10 text-primary-green rounded-md hover:bg-primary-green/20 w-fit ml-auto"
                    onClick={() => {
                      if (answerImagePreview) {
                        showImagePreview(answerImagePreview, "answer");
                      }
                    }}
                  >
                    <ImageIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="text-xs truncate">Image</span>
                    <X 
                      className="h-3 w-3 ml-1 hover:text-red-500 flex-shrink-0" 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMedia("image", "answer");
                      }}
                    />
                  </button>
                )}
                
                {answerAudioUrl && (
                  <button
                    type="button"
                    className="flex items-center p-1 bg-primary-green/10 text-primary-green rounded-md hover:bg-primary-green/20 w-fit ml-auto"
                    onClick={() => toggleAudioPlayback("answer")}
                  >
                    <Volume2 className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="text-xs truncate">{isPlayingAnswerAudio ? "Playing" : "Audio"}</span>
                    <X 
                      className="h-3 w-3 ml-1 hover:text-red-500 flex-shrink-0" 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMedia("audio", "answer");
                      }}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-12 mb-12 max-w-3xl w-full mx-auto">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-border hover:bg-muted"
            onClick={() =>   router.back()}
            disabled={isSubmitting}
          >
            Close
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary-green text-muted font-semibold hover:bg-primary-green/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
  