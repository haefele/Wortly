"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { Loader2, Upload } from "lucide-react";

interface BulkAddWordsDialogProps {
  boxId: Id<"wordBoxes">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkAddWordsDialog({ boxId, open, onOpenChange }: BulkAddWordsDialogProps) {
  
  const [wordsInput, setWordsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);  
  useEffect(() => {
    if (!open) {
      setWordsInput("");
      setIsSubmitting(false);
    }
  }, [open]);
  
  const createBulkAddOperation = useMutation(
    api.functions.bulkAddOperations.createBulkAddOperation
  );
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const words = wordsInput
      .split("\n")
      .map(word => word.trim())
      .filter(word => word.length > 0);

    if (words.length === 0) {
      toast.error("Please enter at least one word.");
      return;
    }

    if (words.length > 1000) {
      toast.error("You can add up to 1000 words at once.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createBulkAddOperation({ boxId, words });
      toast.success(`Started adding ${words.length} word${words.length === 1 ? "" : "s"}. This might take a few minutes.`);
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add words."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add many words</DialogTitle>
          <DialogDescription>
            Enter one word per line. We&apos;ll analyze each word and add it to this collection.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={wordsInput}
            onChange={event => setWordsInput(event.target.value)}
            className="min-h-48"
            disabled={isSubmitting}
            maxLength={100000}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Upload />}
              {isSubmitting ? "Adding..." : "Add words"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


