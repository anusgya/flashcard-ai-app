"use client";

import * as React from "react";
import { Upload, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { generateCards } from "@/hooks/api/use-card";
import { uploadFileFetch } from "@/hooks/api/useFileUpload";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UploadModal({ 
  deckId, 
  onUploadComplete 
}: { 
  deckId: string;
  onUploadComplete: () => void;
}) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [topic, setTopic] = React.useState("");
  const [numCards, setNumCards] = React.useState(10);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else if (selectedFile) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleGenerateCards = async () => {
    if (!file || !deckId) {
      toast({
        title: "Missing information",
        description: !file ? "Please select a file to upload." : "Deck information is missing.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
  
    try {
      // Upload the file using uploadFileFetch
      const uploadResponse = await uploadFileFetch(file);
      
      // The issue is likely here - the response structure is different than expected
      // Instead of checking uploadResponse.ok, we should check if fileUrl exists
      
      // Check if the response is an object that already contains the fileUrl
      if (uploadResponse && uploadResponse.fileUrl) {
        const { fileUrl } = uploadResponse;
        
        // Generate cards
        const generationResponse = await generateCards({
          deck_id: deckId,
          source_text: fileUrl,
          num_flashcards: numCards,
          topic: topic || undefined,
        });

        console.log("generationResponse", generationResponse);
    
        // Check if generation was successful
        if (!generationResponse || generationResponse.error) {
          throw new Error(generationResponse?.error || "Card generation failed with no specific error");
        }
    
        toast({
          title: "Cards generated successfully",
          description: `${numCards} cards have been added to your deck.`,
        });
    
        // Close modal and reset
        setIsOpen(false);
        onUploadComplete();
        setFile(null);
        setTopic("");
        setNumCards(10);
      } else {
        // Handle case where there's no fileUrl in response
        console.error("Invalid upload response:", uploadResponse);
        throw new Error("No file URL returned from upload");
      }
    } catch (error: any) {
      console.error("Error generating cards:", error);
      
      let errorDescription = "There was an error generating your flashcards.";
      
      if (error?.message) {
        errorDescription = error.message;
      }
      
      toast({
        title: "Generation failed",
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  // Reset state when modal closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setFile(null);
      setTopic("");
      setNumCards(10);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary-blue border-b-[2.5px] font-semibold border-primary-blue-secondary hover:border-0 text-muted">
          <Upload className="h-4 w-4 mr-2" />
          Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-muted border-border px-10 py-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-inter">Upload PDF</DialogTitle>
          <DialogDescription className="text-secondary-foreground font-fragment-mono text-sm">
            Upload a PDF file to automatically generate flashcards
          </DialogDescription>
        </DialogHeader>
        <div
          className={`mt-4 p-8 border-2 border-dashed rounded-lg transition-colors ${
            isDragging
              ? "border-secondary-foreground bg-primary-blue/10"
              : "border-border"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <FileUp className="h-10 w-10 text-secondary-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">
                {file ? file.name : "Drag and drop your PDF here"}
              </p>
              <p className="text-xs text-secondary-foreground mt-1">
                or click to browse
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="border-border border-b-1 "
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
          </div>
        </div>
        
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic (Optional)</Label>
            <Input 
              id="topic" 
              placeholder="E.g. History" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="border-divider"
            />
            <p className="text-xs text-secondary-foreground">
              Specify a topic to focus the generated flashcards
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="numCards">Number of Cards</Label>
            <Input 
              id="numCards" 
              type="number" 
              min={1} 
              max={50} 
              value={numCards}
              onChange={(e) => setNumCards(parseInt(e.target.value))}
              className="border-divider"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <DialogClose ref={closeButtonRef} asChild>
            <Button variant="outline" className="border-divider">
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="bg-primary-blue text-muted border-primary-blue-secondary font-semibold"
            disabled={!file || isLoading}
            onClick={handleGenerateCards}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Cards"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}