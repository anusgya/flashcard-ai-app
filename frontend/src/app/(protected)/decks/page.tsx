import { Plus, Upload, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeckListItem } from "@/components/ui/deck-list-item";

export default function DecksPage() {
  // Sample data - in a real app, this would come from your database
  const decks = Array(4).fill({
    title: "JS Basics",
    description: "basic knowledge on js",
    newCount: 43,
    dueCount: 43,
    learnCount: 60,
  });

  return (
    <div className="py-16 px-12 space-y-14">
      {/* Header */}
      <div className="flex justify-between items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">All decks</h1>
          <p className="text-secondary-foreground font-fragment-mono text-sm">
            All your card collections are here
          </p>
        </div>
        <div className="relative w-80 border-0 bg-secondary">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-foreground" />
          <Input
            className="py-[5px] pl-10 placeholder:text-secondary-foreground "
            placeholder="Search"
          />
        </div>
      </div>

      <div className="space-y-8">
        {/* Action Buttons */}
        <div className="flex gap-2 ">
          <Button className="bg-primary-green text-muted font-semibold hover:bg-primary-green/90">
            <Plus className="h-4 w-4" />
            Create
          </Button>
          <Button className="bg-primary-blue text-muted font-semibold border-primary-blue-secondary hover:bg-primary-blue/90">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          <Button className="bg-primary-orange text-muted font-semibold border-primary-orange-secondary hover:bg-primary-orange/90">
            <Download className=" h-4 w-4" />
            Import
          </Button>
        </div>

        {/* <div className="h-[1px] w-full bg-muted-foreground"></div> */}
        {/* Decks List */}
        <div className="space-y-4">
          {decks.map((deck, index) => (
            <DeckListItem key={index} {...deck} />
          ))}
        </div>
      </div>
    </div>
  );
}
