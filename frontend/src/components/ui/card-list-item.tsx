import { MoreVertical, Pencil, Delete, Image as ImageIcon, Volume2 } from "lucide-react";
import { Button } from "./button";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
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
import { deleteCard, useCards } from "@/hooks/api/use-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// The interface now directly matches the card properties from the API
interface CardListItemProps {
  id: string;
  deck_id: string;
  front_content: string;
  back_content: string;
  card_state?: string;
  difficulty_level?: string;
  created_at?: string;
  updated_at?: string;
  last_reviewed?: string | null;
  media?: any[];
  source?: string | null;
  success_rate?: number;
  times_reviewed?: number;
  onCardDelete?: () => void;
  onCardEdit?: () => void;
}

export function CardListItem(props: CardListItemProps) {
  const { id, deck_id, front_content, back_content, media, onCardDelete, onCardEdit } = props;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    front_content: front_content,
    back_content: back_content,
  });

  // Find front image and audio if they exist
  const frontImage = media?.find(item => item.side === "front" && item.media_type === "image");
  const frontAudio = media?.find(item => item.side === "front" && item.media_type === "audio");
  const backImage = media?.find(item => item.side === "back" && item.media_type === "image");
  const backAudio = media?.find(item => item.side === "back" && item.media_type === "audio");

  const handleDelete = async () => {
    try {
      await deleteCard(id);
      toast({
        title: 'Card deleted successfully!',
        variant: 'default',
      });
      setShowDeleteDialog(false);
      // You might want to refresh the deck list here
      if(onCardDelete){
        onCardDelete();
      }

    } catch (error) {
      console.error('Failed to delete card:', error);
      toast({
        title: 'Failed to delete card!',
        variant: 'destructive',
      })
    }
  };

  const handleEdit = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/cards/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          front_content: formData.front_content,
          back_content: formData.back_content,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error('Failed to update card');
      }

      toast({
        title: 'Card updated successfully!',
        variant: 'default',
      });
      setShowEditDialog(false);
      
      if (onCardEdit) {
        onCardEdit();
      }
    } catch (error) {
      console.error('Failed to update card:', error);
      toast({
        title: 'Failed to update card!',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="relative">
      <Link
        href={`/decks/${deck_id}/cards/${id}`}
        className="flex items-center justify-between px-6 py-3 rounded-lg border border-border hover:bg-secondary  cursor-pointer transition-colors"
      >
        <div className="flex items-start gap-3">
          {frontImage && (
            <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0 border border-border">
              <Image 
                src={`http://localhost:8000/${frontImage.file_path.replace(/\\/g, '/')}`}
                alt="Card image"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-foreground font-medium">
                {front_content}
              </h3>
              {frontAudio && (
                <Volume2 className="h-4 w-4 text-primary-blue" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-secondary-foreground text-xs">{back_content}</p>
              {backAudio && (
                <Volume2 className="h-3 w-3 text-primary-blue" />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="text-purple-300 border-b-3 rounded-full hover:text-primary-blue/90 text-xs"
                onClick={(e) => e.preventDefault()}
              >
                Ask AI
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer">
                Generate Mnemonics
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Generate Example
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Explain Like I'm 5
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
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
              This action cannot be undone. This will permanently delete this card.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-0 hover:bg-secondary">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-transparent border-0 hover:bg-secondary text-red-500">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
            <DialogDescription className="text-secondary-foreground">
              Make changes to your card here
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-secondary-foreground">Question</label>
              <textarea
                value={formData.front_content}
                onChange={(e) => setFormData(prev => ({ ...prev, front_content: e.target.value }))}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-secondary-foreground">Answer</label>
              <textarea
                value={formData.back_content}
                onChange={(e) => setFormData(prev => ({ ...prev, back_content: e.target.value }))}
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