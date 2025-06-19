import { MoreVertical } from "lucide-react";
import { Button } from "./button";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Delete } from "lucide-react";
import { use, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { deleteDeck, updateDeck } from "@/hooks/api/use-deck";
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

interface DeckListItemProps {
  title: string;
  description: string;
  newCount: number;
  dueCount: number;
  learnCount: number;
  id: string; // Add this prop
  OnDeckDelete: () => void;
  OnDeckEdit: () => void;
}

export function DeckListItem({
  title,
  description,
  newCount,
  dueCount,
  learnCount,
  id,
  OnDeckEdit,
  OnDeckDelete,
}: DeckListItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: title,
    description: description,
  });

  const handleDelete = async () => {
    try {
      await deleteDeck(id);
      toast({
        title: "Deck deleted successfully!",
        variant: "default",
      });
      setShowDeleteDialog(false);
      // You might want to refresh the deck list here
      if (OnDeckDelete) {
        OnDeckDelete();
      }
    } catch (error) {
      console.error("Failed to delete deck:", error);
      toast({
        title: "Failed to delete deck!",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    try {
      await updateDeck(id, {
        name: formData.name,
        description: formData.description,
      });
      toast({
        title: "Deck updated successfully!",
        variant: "default",
      });
      setShowEditDialog(false);
      if (OnDeckEdit) {
        OnDeckEdit();
      }
    } catch (error) {
      toast({
        title: "Failed to update deck!",
        variant: "destructive",
      });
      console.error("Failed to update deck:", error);
    }
  };

  return (
    <div className="relative">
      <Link
        href={`/decks/${id}/cards`}
        className="flex items-center justify-between px-6 py-3 rounded-lg border border-border hover:bg-secondary border-b-[3px] cursor-pointer transition-colors"
      >
        <div className="space-y-1">
          <h3 className="text-foreground font-medium">{title}</h3>
          <p className="text-secondary-foreground text-xs font-fragment-mono">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-24">
          <div className="flex gap-32 font-fragment-mono">
            <div className="flex flex-col items-center gap-1">
              <span className="text-primary-blue text-md">{newCount}</span>
              <span className="text-secondary-foreground text-xs">new</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-primary-orange text-md">{dueCount}</span>
              <span className="text-secondary-foreground text-xs">due</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-primary-green text-md">{learnCount}</span>
              <span className="text-secondary-foreground text-xs">
                learning
              </span>
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
        </div>
      </Link>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-secondary-foreground">
              This action cannot be undone. This will permanently delete the
              deck "{title}" and all its cards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-0 hover:bg-secondary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-transparent border-0 hover:bg-secondary text-red-500"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Deck</DialogTitle>
            <DialogDescription className="text-secondary-foreground">
              Make changes to your deck here
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-2">
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowEditDialog(false)} variant="ghost">
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              variant="ghost"
              className="text-primary-green hover:text-primary-green"
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
