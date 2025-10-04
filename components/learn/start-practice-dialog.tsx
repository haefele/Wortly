"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, ChevronDown, ListChecks, Loader2, Play } from "lucide-react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getErrorMessage } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface StartPracticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartPracticeDialog({ open, onOpenChange }: StartPracticeDialogProps) {
  const router = useRouter();
  const wordBoxesResult = useQuery(api.wordBoxes.getMyWordBoxes, {});
  const startMultipleChoice = useMutation(api.practiceSessions.startMultipleChoice);

  const [selectedWordBoxId, setSelectedWordBoxId] = useState<Id<"wordBoxes"> | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const firstWordBoxId = wordBoxesResult.isSuccess ? wordBoxesResult.data[0]?._id : undefined;

  useEffect(() => {
    if (firstWordBoxId && !selectedWordBoxId) {
      setSelectedWordBoxId(firstWordBoxId);
    }
  }, [firstWordBoxId, selectedWordBoxId]);

  const wordBoxLabel =
    wordBoxesResult.isSuccess && selectedWordBoxId
      ? (wordBoxesResult.data.find(box => box._id === selectedWordBoxId)?.name ??
        "Select collection")
      : "Select collection";

  const handleStartMultipleChoice = async () => {
    if (!selectedWordBoxId) {
      toast.error("Select a collection to practice.");
      return;
    }

    try {
      setIsStarting(true);
      const sessionId = await startMultipleChoice({ wordBoxId: selectedWordBoxId });
      toast.success("Practice session started.");
      onOpenChange(false);
      router.push(`/learn/${sessionId}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to start practice session."));
    } finally {
      setIsStarting(false);
    }
  };

  const noCollections = wordBoxesResult.isSuccess && wordBoxesResult.data.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        if (!value) {
          setIsStarting(false);
        }
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a practice session</DialogTitle>
          <DialogDescription>
            Choose a collection and practice mode to begin reinforcing your vocabulary.
          </DialogDescription>
        </DialogHeader>

        {wordBoxesResult.isPending && (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        )}

        {noCollections && (
          <Card variant="spotlight" className="bg-muted/40">
            <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
              <p>You need at least one collection with words before starting practice.</p>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  router.push("/library");
                }}
              >
                <ArrowRight /> Manage collections
              </Button>
            </CardContent>
          </Card>
        )}

        {wordBoxesResult.isSuccess && wordBoxesResult.data.length > 0 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Collection</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-between" size="field">
                    {wordBoxLabel}
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                  <DropdownMenuLabel>Choose collection</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={selectedWordBoxId ?? ""}
                    onValueChange={value =>
                      setSelectedWordBoxId(value ? (value as Id<"wordBoxes">) : null)
                    }
                  >
                    {wordBoxesResult.data.map(box => (
                      <DropdownMenuRadioItem key={box._id} value={box._id}>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">{box.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {box.wordCount} word{box.wordCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Card className="border-dashed border-primary/40">
              <CardHeader className="space-y-3">
                <Badge variant="secondary" className="self-start">
                  <ListChecks /> Recommended
                </Badge>
                <CardTitle>Multiple choice quiz</CardTitle>
                <CardDescription>
                  Answer quick-fire prompts by picking the correct translation. Ideal for rapid
                  recall and spaced repetition.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={handleStartMultipleChoice} disabled={isStarting}>
                  {isStarting ? (
                    <>
                      <Loader2 className="animate-spin" /> Starting…
                    </>
                  ) : (
                    <>
                      <Play /> Start multiple choice
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isStarting}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
