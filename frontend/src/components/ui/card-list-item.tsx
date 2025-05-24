import { MoreVertical, Pencil, Delete, Image as ImageIcon, Volume2, X, ImagePlus, Mic, MicOff, ArrowLeft } from "lucide-react";
import { Button } from "./button";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteCard, useCards } from "@/hooks/api/use-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";

// The interface now directly matches the card properties from the API
interface CardListItemProps {
  id: string;
  deck_id: string;
  front_content: string;
  back_content: string;
  card_state?: string;
  difficulty_level?: string;
  created_at?: string;
  updated_at?: string;
  last_reviewed?: string | null;
  media?: any[];
  source?: string | null;
  success_rate?: number;
  times_reviewed?: number;
  onCardDelete?: () => void;
  onCardEdit?: () => void;
}

export function CardListItem(props: CardListItemProps) {
  const { id, deck_id, front_content, back_content, media, onCardDelete, onCardEdit } = props;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    front_content: front_content,
    back_content: back_content,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Media states
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [answerImage, setAnswerImage] = useState<File | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<string | null>(null);
  const [answerImagePreview, setAnswerImagePreview] = useState<string | null>(null);
  const [questionAudio, setQuestionAudio] = useState<Blob | null>(null);
  const [answerAudio, setAnswerAudio] = useState<Blob | null>(null);
  const [questionAudioUrl, setQuestionAudioUrl] = useState<string | null>(null);
  const [answerAudioUrl, setAnswerAudioUrl] = useState<string | null>(null);
  const [activeMediaSection, setActiveMediaSection] = useState<"question" | "answer">("question");

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
  
  // Refs for input elements
  const questionInputRef = useRef<HTMLTextAreaElement>(null);
  const answerInputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Find existing media if they exist
  const frontImage = media?.find(item => item.side === "front" && item.media_type === "image");
  const frontAudio = media?.find(item => item.side === "front" && item.media_type === "audio");
  const backImage = media?.find(item => item.side === "back" && item.media_type === "image");
  const backAudio = media?.find(item => item.side === "back" && item.media_type === "audio");

  // Initialize media previews from existing media when dialog opens
  useEffect(() => {
    if (showEditDialog) {
      if (frontImage) {
        setQuestionImagePreview(`http://localhost:8000/${frontImage.file_path.replace(/\\/g, '/')}`);
      }
      if (backImage) {
        setAnswerImagePreview(`http://localhost:8000/${backImage.file_path.replace(/\\/g, '/')}`);
      }
      if (frontAudio) {
        setQuestionAudioUrl(`http://localhost:8000/${frontAudio.file_path.replace(/\\/g, '/')}`);
      }
      if (backAudio) {
        setAnswerAudioUrl(`http://localhost:8000/${backAudio.file_path.replace(/\\/g, '/')}`);
      }
    } else {
      // Reset state when closing dialog
      resetFormState();
    }
  }, [showEditDialog, frontImage, backImage, frontAudio, backAudio]);

  // Reset all form state
  const resetFormState = () => {
    setFormData({
      front_content: front_content,
      back_content: back_content,
    });
    setQuestionImage(null);
    setAnswerImage(null);
    // Don't reset previews for existing media
    setQuestionAudio(null);
    setAnswerAudio(null);
    setIsRecording(false);
    setRecordingSection(null);
  };

  // Handle paste events for images
  useEffect(() => {
    if (!showEditDialog) return;
    
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
  }, [showEditDialog]);

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

  const handleDelete = async () => {
    try {
      await deleteCard(id);
      toast({
        title: 'Card deleted successfully!',
        variant: 'default',
      });
      setShowDeleteDialog(false);
      // You might want to refresh the deck list here
      if(onCardDelete){
        onCardDelete();
      }

    } catch (error) {
      console.error('Failed to delete card:', error);
      toast({
        title: 'Failed to delete card!',
        variant: 'destructive',
      })
    }
  };

  const handleEdit = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      
      // 1. First update the card text content
      const response = await fetch(`http://localhost:8000/api/cards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          front_content: formData.front_content,
          back_content: formData.back_content,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error('Failed to update card');
      }
      
      // 2. Handle media uploads if they exist
      const uploadPromises = [];
      
      // Handle question image
      if (questionImage) {
        if (frontImage) {
          // Update existing image
          uploadPromises.push(updateMedia(id, frontImage.id, questionImage, "front", "image"));
        } else {
          // Create new image
          uploadPromises.push(uploadMedia(id, questionImage, "front", "image"));
        }
      } else if (questionImagePreview === null && frontImage) {
        // If preview is null but frontImage exists, it means user removed the image
        uploadPromises.push(deleteMedia(id, frontImage.id));
      }
      
      // Handle answer image
      if (answerImage) {
        if (backImage) {
          // Update existing image
          uploadPromises.push(updateMedia(id, backImage.id, answerImage, "back", "image"));
        } else {
          // Create new image
          uploadPromises.push(uploadMedia(id, answerImage, "back", "image"));
        }
      } else if (answerImagePreview === null && backImage) {
        // If preview is null but backImage exists, it means user removed the image
        uploadPromises.push(deleteMedia(id, backImage.id));
      }
      
      // Handle question audio
      if (questionAudio) {
        // Convert blob to file
        const audioFile = new File([questionAudio], `question-audio-${Date.now()}.webm`, {
          type: "audio/webm"
        });
        
        if (frontAudio) {
          // Update existing audio
          uploadPromises.push(updateMedia(id, frontAudio.id, audioFile, "front", "audio"));
        } else {
          // Create new audio
          uploadPromises.push(uploadMedia(id, audioFile, "front", "audio"));
        }
      } else if (questionAudioUrl === null && frontAudio) {
        // If URL is null but frontAudio exists, it means user removed the audio
        uploadPromises.push(deleteMedia(id, frontAudio.id));
      }
      
      // Handle answer audio
      if (answerAudio) {
        // Convert blob to file
        const audioFile = new File([answerAudio], `answer-audio-${Date.now()}.webm`, {
          type: "audio/webm"
        });
        
        if (backAudio) {
          // Update existing audio
          uploadPromises.push(updateMedia(id, backAudio.id, audioFile, "back", "audio"));
        } else {
          // Create new audio
          uploadPromises.push(uploadMedia(id, audioFile, "back", "audio"));
        }
      } else if (answerAudioUrl === null && backAudio) {
        // If URL is null but backAudio exists, it means user removed the audio
        uploadPromises.push(deleteMedia(id, backAudio.id));
      }
      
      // Wait for all media uploads to complete
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      toast({
        title: 'Card updated successfully!',
        variant: 'default',
      });
      
      setShowEditDialog(false);
      
      if (onCardEdit) {
        onCardEdit();
      }
    } catch (error) {
      console.error('Failed to update card:', error);
      toast({
        title: 'Failed to update card!',
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to upload new media
  const uploadMedia = async (cardId: string, file: File | Blob, side: "front" | "back", mediaType: "image" | "audio") => {
    try {
      const formData = new FormData();
      formData.append("media_file", file);
      formData.append("side", side);
      formData.append("media_type", mediaType);
      
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:8000/api/cards/${cardId}/media`, {
        method: "POST",
        body: formData,
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        try {
          const error = JSON.parse(responseText);
          throw new Error(error.detail || `Failed to upload ${side} media`);
        } catch (parseError) {
          throw new Error(`Failed to upload media: ${responseText}`);
        }
      }
      
      return response.json();
    } catch (error) {
      console.error(`Error uploading ${side} media:`, error);
      throw error;
    }
  };

  // Helper function to update existing media
  const updateMedia = async (cardId: string, mediaId: string, file: File | Blob, side: "front" | "back", mediaType: "image" | "audio") => {
    try {
      const formData = new FormData();
      formData.append("media_file", file);
      formData.append("side", side);
      formData.append("media_type", mediaType);
      
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:8000/api/cards/${cardId}/media/${mediaId}`, {
        method: "PUT",
        body: formData,
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        try {
          const error = JSON.parse(responseText);
          throw new Error(error.detail || `Failed to update ${side} media`);
        } catch (parseError) {
          throw new Error(`Failed to update media: ${responseText}`);
        }
      }
      
      return response.json();
    } catch (error) {
      console.error(`Error updating ${side} media:`, error);
      throw error;
    }
  };

  // Helper function to delete media
  const deleteMedia = async (cardId: string, mediaId: string) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:8000/api/cards/${cardId}/media/${mediaId}`, {
        method: "DELETE",
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        try {
          const error = JSON.parse(responseText);
          throw new Error(error.detail || `Failed to delete media`);
        } catch (parseError) {
          throw new Error(`Failed to delete media: ${responseText}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting media:`, error);
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
    <div className="relative">
      <Link
        href={`/decks/${deck_id}/cards/${id}`}
        className="flex items-center justify-between px-6 py-3 rounded-lg border border-border hover:bg-secondary cursor-pointer transition-colors"
      >
        <div className="flex items-start gap-3">
          {frontImage && (
            <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0 border border-border">
              <Image 
                src={`http://localhost:8000/${frontImage.file_path.replace(/\\/g, '/')}`}
                alt="Card image"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-foreground font-medium">
                {front_content}
              </h3>
              {frontAudio && (
                <Volume2 className="h-4 w-4 text-primary-blue" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-secondary-foreground text-xs">{back_content}</p>
              {backAudio && (
                <Volume2 className="h-3 w-3 text-primary-blue" />
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
          <Button
            variant="ghost"
            size="icon"
            className="text-secondary-foreground hover:text-foreground"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowEditDialog(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-secondary-foreground hover:text-foreground hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            <Delete className="h-4 w-4" />
          </Button>
        </div>
      </Link>

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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-secondary-foreground"> 
              This action cannot be undone. This will permanently delete this card.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-0 hover:bg-secondary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-transparent border-0 hover:bg-secondary text-red-500">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
            <DialogDescription className="text-secondary-foreground">
              Make changes to your card here
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
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
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <textarea
                  ref={questionInputRef}
                  className="bg-background w-full text-lg min-h-[100px] p-3 border-border border-[1.5px] rounded-md placeholder:text-secondary-foreground resize-none"
                  value={formData.front_content}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, front_content: e.target.value }));
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
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
            
            <div className="space-y-2">
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
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <textarea
                  ref={answerInputRef}
                  className="bg-background w-full text-lg min-h-[150px] p-3 border-border border-[1.5px] rounded-md placeholder:text-secondary-foreground resize-none"
                  value={formData.back_content}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, back_content: e.target.value }));
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
                
                {/* Media indicators */}
                <div className="absolute right-3 bottom-3 flex gap-2 z-10">
                  {answerImagePreview && (
                    <button
                      type="button"
                      className="flex items-center p-1 bg-primary-green/10 text-primary-green rounded-md hover:bg-primary-green/20"
                      onClick={() => {
                        if (answerImagePreview) {
                          showImagePreview(answerImagePreview, "answer");
                        }
                      }}
                    >
                      <ImageIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs">Image</span>
                      <X 
                        className="h-3 w-3 ml-1 hover:text-red-500" 
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
                      className="flex items-center p-1 bg-primary-green/10 text-primary-green rounded-md hover:bg-primary-green/20"
                      onClick={() => toggleAudioPlayback("answer")}
                    >
                      <Volume2 className="h-4 w-4 mr-1" />
                      <span className="text-xs">{isPlayingAnswerAudio ? "Playing" : "Audio"}</span>
                      <X 
                        className="h-3 w-3 ml-1 hover:text-red-500" 
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
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isSubmitting}
              className="border-border hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleEdit}
              disabled={isSubmitting}
              className="bg-primary-green text-muted font-semibold hover:bg-primary-green/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}