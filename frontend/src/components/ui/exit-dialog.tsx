"use client";

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

interface ExitDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExitDialog({ isOpen, onConfirm, onCancel }: ExitDialogProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End Quiz?</AlertDialogTitle>
          <AlertDialogDescription className="text-secondary-foreground">
            Are you sure you want to end this quiz? Your progress will be saved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Continue Quiz
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-primary-green text-muted hover:border-b-0"
            onClick={onConfirm}
          >
            End Quiz
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
