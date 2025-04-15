"use client";

import * as React from "react";
import { Upload, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function UploadModal({onUploadComplete }: {onUploadComplete: () => void}) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-primary-blue border-b-[2.5px] font-semibold border-primary-blue-secondary hover:border-0 text-muted ">
          <Upload className="h-4 w-4" />
          Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-muted border-divider px-10 py-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-inter">Upload PDF</DialogTitle>
          <DialogDescription className="text-secondary-foreground font-fragment-mono text-sm">
            Upload a PDF file to automatically generate flashcards
          </DialogDescription>
        </DialogHeader>
        <div
          className={`mt-4 p-8 border-2 border-dashed rounded-lg transition-colors ${
            isDragging
              ? "border-primary-blue bg-primary-blue/10"
              : "border-secondary-foreground"
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
              className="border-divider"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <DialogTrigger asChild>
            <Button variant="outline" className="border-divider">
              Cancel
            </Button>
          </DialogTrigger>
          <Button
            className="bg-primary-blue  text-muted border-primary-blue-secondary font-semibold"
            disabled={!file}
          >
            Upload PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
