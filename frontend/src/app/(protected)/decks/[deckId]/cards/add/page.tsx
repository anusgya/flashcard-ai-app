"use client";

import { ArrowLeft, FileAudio2, ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddNotePage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [selectedDeck, setSelectedDeck] = useState("1");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    // After successful submission:
    router.back();
  };

  return (
    <div className="min-h-screen  bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      <Link href="/decks/1/cards" className="pt-3 px-12">
        <Button
          variant="outline"
          size="icon"
          className="text-secondary-foreground border mb-4 border-divider rounded-full hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col z-10">
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col space-y-8">
          <div className="flex items-center gap-3">
            <div className="text-secondary-foreground text-sm"> Deck:</div>
            <Select value={selectedDeck} onValueChange={setSelectedDeck}>
              <SelectTrigger className="w-full bg-secondary border-2 border-divider text-secondary-foreground">
                <SelectValue placeholder="Select a deck" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">JavaScript Basics</SelectItem>
                <SelectItem value="2">React Fundamentals</SelectItem>
                <SelectItem value="3">CSS Tricks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary-foreground">
              Question
            </label>
            <Textarea
              className="bg-background text-lg h-[50px] border-border border-[1.5px] placeholder:text-secondary-foreground resize-none overflow-hidden"
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                e.target.style.height = "50px";
                e.target.style.height = `${Math.max(
                  50,
                  e.target.scrollHeight
                )}px`;
              }}
            />
          </div>

          <div className="flex-1 flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-secondary-foreground">
                Answer
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-secondary-foreground hover:text-foreground flex gap-2"
                >
                  <FileAudio2 className="h-5 w-5" />
                  <span className="text-sm">Add audio</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-secondary-foreground hover:text-foreground flex gap-2"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-sm">Add image</span>
                </Button>
              </div>
            </div>
            <Textarea
              className="flex-1 min-h-[300px] bg-background border-border border-[1.5px] text-lg resize-none"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-12 mb-12 max-w-3xl w-full mx-auto">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-border hover:bg-muted"
            onClick={() => router.back()}
          >
            Close
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary-green text-muted font-semibold hover:bg-primary-green/90"
          >
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
