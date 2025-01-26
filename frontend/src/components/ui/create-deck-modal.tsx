"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateDeckModal() {
  return (
    <Dialog>
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
            {/* <label htmlFor="name" className="text-sm font-medium leading-none">
              Deck Name
            </label> */}
            <input
              id="name"
              placeholder="Deck name"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid gap-2">
            {/* <label
              htmlFor="description"
              className="text-sm font-medium leading-none"
            >
              Description
            </label> */}
            <textarea
              id="description"
              placeholder="Add a description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <DialogTrigger asChild>
            <Button variant="outline" className="border-border">
              Cancel
            </Button>
          </DialogTrigger>
          <Button className="bg-primary-green hover:bg-primary-green/90 text-muted font-semibold">
            Create Deck
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
