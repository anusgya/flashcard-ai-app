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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function ImportModal() {
  const [importType, setImportType] = React.useState<"csv" | "anki">("csv");
  const [file, setFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-primary-orange hover:bg-primary-orange/90 border-b-[2.5px] border-primary-orange-secondary text-muted hover:border-0">
          <Download className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-muted border-divider">
        <DialogHeader>
          <DialogTitle className="text-lg font-inter">Import Deck</DialogTitle>
          <DialogDescription className="text-secondary-foreground font-fragment-mono text-sm">
            Import a deck from CSV or Anki format
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-12 py-4">
          <RadioGroup
            defaultValue="csv"
            onValueChange={(value) => setImportType(value as "csv" | "anki")}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="csv" id="csv" className="peer sr-only" />
              <Label
                htmlFor="csv"
                className="flex flex-col items-center justify-between rounded-md border-[2px] border-divider bg-background px-4 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary-blue [&:has([data-state=checked])]:border-primary-blue"
              >
                <span className="text-sm font-semibold">CSV</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="anki" id="anki" className="peer sr-only" />
              <Label
                htmlFor="anki"
                className="flex flex-col items-center justify-between rounded-md border-[2px] border-divider bg-background  px-4 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary-blue [&:has([data-state=checked])]:border-primary-blue"
              >
                <span className="text-sm font-semibold">Anki</span>
              </Label>
            </div>
          </RadioGroup>
          <div className="flex flex-col gap-4">
            <Label htmlFor="file" className="text-md  font-medium leading-none">
              Select File
            </Label>
            <div className="flex flex-col items-center gap-2">
              <input
                type="file"
                id="file"
                ref={fileInputRef}
                accept={importType === "csv" ? ".csv" : ".apkg"}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="border-secondary-foreground py-6 border w-full "
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
            disabled={!file}
          >
            Import Deck
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
