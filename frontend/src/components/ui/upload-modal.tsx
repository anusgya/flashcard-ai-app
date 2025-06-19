"use client";

import * as React from "react";
import { Upload, FileUp, Loader2, Youtube } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateCards } from "@/hooks/api/use-card";
import { uploadFileFetch } from "@/hooks/api/useFileUpload";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UploadModal({
  deckId,
  onUploadComplete,
}: {
  deckId: string;
  onUploadComplete: () => void;
}) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [topic, setTopic] = React.useState("");
  const [numCards, setNumCards] = React.useState(10);
  const [activeTab, setActiveTab] = React.useState("pdf");
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

  const validateYoutubeUrl = (url: string) => {
    // Basic YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const handleGenerateCards = async () => {
    if (activeTab === "pdf" && !file) {
      toast({
        title: "Missing information",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "youtube" && !youtubeUrl) {
      toast({
        title: "Missing information",
        description: "Please enter a YouTube video URL.",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "youtube" && !validateYoutubeUrl(youtubeUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube video URL.",
        variant: "destructive",
      });
      return;
    }

    if (!deckId) {
      toast({
        title: "Missing information",
        description: "Deck information is missing.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let sourceText = "";

      if (activeTab === "pdf" && file) {
        // Upload the file using uploadFileFetch
        const uploadResponse = await uploadFileFetch(file);

        // Check if the response is an object that contains the fileUrl
        if (uploadResponse && uploadResponse.fileUrl) {
          sourceText = uploadResponse.fileUrl;
        } else {
          // Handle case where there's no fileUrl in response
          console.error("Invalid upload response:", uploadResponse);
          throw new Error("No file URL returned from upload");
        }
      } else if (activeTab === "youtube") {
        // Use the YouTube URL directly
        sourceText = youtubeUrl;
      }

      // Generate cards
      const generationResponse = await generateCards({
        deck_id: deckId,
        source_text: sourceText,
        source_type: activeTab === "pdf" ? "pdf" : "youtube", // Add source_type to API call
        num_flashcards: numCards,
        topic: topic || undefined,
      });

      console.log("generationResponse", generationResponse);

      // Check if generation was successful
      if (!generationResponse || generationResponse.error) {
        throw new Error(
          generationResponse?.error ||
            "Card generation failed with no specific error"
        );
      }

      toast({
        title: "Cards generated successfully",
        description: `${numCards} cards have been added to your deck.`,
      });

      // Close modal and reset
      setIsOpen(false);
      onUploadComplete();
      setFile(null);
      setYoutubeUrl("");
      setTopic("");
      setNumCards(10);
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
      setYoutubeUrl("");
      setTopic("");
      setNumCards(10);
      setIsLoading(false);
      setActiveTab("pdf");
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
          <DialogTitle className="text-lg font-inter">
            Generate Flashcards
          </DialogTitle>
          <DialogDescription className="text-secondary-foreground font-fragment-mono text-sm">
            Upload a PDF or provide a YouTube link to automatically generate
            flashcards
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="pdf">PDF Upload</TabsTrigger>
            <TabsTrigger value="youtube">YouTube Link</TabsTrigger>
          </TabsList>

          <TabsContent value="pdf">
            <div
              className={`p-8 border-2 border-dashed rounded-lg transition-colors ${
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
                  className="border-border border-b-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="youtube">
            <div className="p-8 border-2 border-dashed rounded-lg border-border">
              <div className="flex flex-col items-center justify-center gap-4">
                <Youtube className="h-10 w-10 text-secondary-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Enter YouTube video URL</p>
                  <p className="text-xs text-secondary-foreground mt-1">
                    We'll extract content from the video to create flashcards
                  </p>
                </div>
                <div className="w-full">
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="border-border border-b-1"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic (Optional)</Label>
            <Input
              id="topic"
              placeholder="E.g. History"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="border-border"
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
              onChange={(e) => setNumCards(Number.parseInt(e.target.value))}
              className="border-border"
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
            disabled={
              (activeTab === "pdf" && !file) ||
              (activeTab === "youtube" && !youtubeUrl) ||
              isLoading
            }
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
