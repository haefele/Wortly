"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteWordBoxDialogProps {
  boxId: Id<"wordBoxes">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteWordBoxDialog({
  boxId,
  open,
  onOpenChange,
  onDeleted,
}: DeleteWordBoxDialogProps) {
  const deleteWordBox = useMutation(api.functions.wordBoxes.deleteWordBox);

  const handleDelete = async () => {
    try {
      await deleteWordBox({ boxId });
      onOpenChange(false);
      toast.success("Collection deleted successfully.");
      onDeleted?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete collection.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this collection?</DialogTitle>
          <DialogDescription>
            This will remove the collection and all of its assignments. The words themselves remain
            available in your library.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
