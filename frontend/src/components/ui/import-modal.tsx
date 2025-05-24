"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { importCardsFromCSV } from "@/hooks/api/use-deck";

interface ImportModalProps {
  deckId: string;
  onImportComplete: () => void;
}

export function ImportModal({ deckId, onImportComplete }: ImportModalProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [open, setOpen] = React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setIsLoading(true);
    
    try {
      await importCardsFromCSV(deckId, file);
      toast({
        title: "Import successful",
        description: "Cards have been imported from your CSV file.",
      });
      
      // Close the dialog and reset the state
      setOpen(false);
      setFile(null);
      setIsLoading(false);
      
      // Trigger the callback to refresh the deck
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error("Import failed:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "There was an error importing your cards.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary-orange hover:bg-primary-orange/90 border-b-[2.5px] border-primary-orange-secondary text-muted hover:border-0">
          <Download className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-muted border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-inter">Import Deck</DialogTitle>
          <DialogDescription className="text-secondary-foreground font-fragment-mono text-sm">
            Import a deck from CSV format
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-12 py-4">
          <div className="flex flex-col gap-4">
            <Label htmlFor="file" className="text-md font-medium leading-none">
              Select CSV File
            </Label>
            <div className="flex flex-col items-center gap-2">
              <input
                type="file"
                id="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="border-2 border-border  py-6  w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
              <span className="text-sm text-secondary-foreground">
                {file ? file.name : "No file chosen"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <DialogTrigger asChild>
            <Button variant="outline" className="border-border">
              Cancel
            </Button>
          </DialogTrigger>
          <Button
            className="bg-primary-orange hover:bg-primary-orange/90 text-muted border-primary-orange-secondary font-semibold"
            disabled={!file || isLoading}
            onClick={handleImport}
          >
            {isLoading ? "Importing..." : "Import Deck"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}