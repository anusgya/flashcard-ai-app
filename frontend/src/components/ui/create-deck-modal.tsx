"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDeck } from "@/hooks/api/use-deck";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export function CreateDeckModal({onDeckCreated}: {onDeckCreated: () => void}) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    source_type: 'manual',// default value
  });

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      await createDeck(formData);
      toast({
        title: 'Deck created successfully!',
        variant: 'default',
      });
      setOpen(false);
      setFormData({ name: '', description: '', source_type: 'manual' });
      if (onDeckCreated) {
        onDeckCreated();
      }
      // You might want to trigger a refresh of the decks list here
    } catch (error) {
      toast({
        title: 'Failed to create deck',
        variant: 'destructive', 
      })
      console.error('Failed to create deck:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary-green font-semibold hover:bg-primary-green/90 hover:border-0 text-muted">
          <Plus className="h-4 w-4" />
          Create
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-divider">
        <DialogHeader>
          <DialogTitle className="text-lg font-inter">
            Create New Deck
          </DialogTitle>
          <DialogDescription className="text-secondary-foreground font-fragment-mono text-sm">
            Add a new deck to your collection
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <input
              id="name"
              placeholder="Deck name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid gap-2">
            <textarea
              id="description"
              placeholder="Add a description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            className="border-border"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            className="bg-primary-green hover:bg-primary-green/90 text-muted font-semibold"
            onClick={handleSubmit}
            disabled={isLoading || !formData.name.trim()}
          >
            {isLoading ? 'Creating...' : 'Create Deck'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
