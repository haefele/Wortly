"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getErrorMessage } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { PRACTICE_SESSION_TYPES, type PracticeSessionType } from "@/app/learn/constants";

interface StartPracticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogStep = "select-type" | "configure";

export function StartPracticeDialog({ open, onOpenChange }: StartPracticeDialogProps) {
  const router = useRouter();

  const [step, setStep] = useState<DialogStep>("select-type");
  const [selectedType, setSelectedType] = useState<PracticeSessionType | null>(null);

  const wordBoxesResult = useQuery(api.wordBoxes.getMyWordBoxes, {});
  const startMultipleChoice = useMutation(api.practiceSessions.startMultipleChoice);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("select-type");
      setSelectedType(null);
    }
  }, [open]);

  const handleTypeSelect = (type: PracticeSessionType) => {
    setSelectedType(type);
    setStep("configure");
  };

  const handleBack = () => {
    setStep("select-type");
    setSelectedType(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {step === "select-type" && (
          <>
            <DialogHeader>
              <DialogTitle>Start a practice session</DialogTitle>
              <DialogDescription>
                Pick the type of session you want to run and fine-tune the details before diving in.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              {PRACTICE_SESSION_TYPES.map(type => (
                <Item
                  key={type.id}
                  variant="outline"
                  className="cursor-pointer hover:border-primary hover:bg-accent/50"
                  onClick={() => handleTypeSelect(type.id)}
                >
                  <ItemMedia variant="icon" className="my-auto">
                    <type.icon />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{type.label}</ItemTitle>
                    <ItemDescription>{type.description}</ItemDescription>
                  </ItemContent>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Item>
              ))}
            </div>
          </>
        )}

        {step === "configure" && selectedType === "multiple_choice" && (
          <MultipleChoiceConfig
            wordBoxesResult={wordBoxesResult}
            onBack={handleBack}
            onStart={async wordBoxId => {
              try {
                const sessionId = await startMultipleChoice({ wordBoxId });
                onOpenChange(false);
                router.push(`/learn/${sessionId}`);
              } catch (error) {
                toast.error(getErrorMessage(error, "Failed to start practice session"));
              }
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface MultipleChoiceConfigProps {
  wordBoxesResult: ReturnType<typeof useQuery<typeof api.wordBoxes.getMyWordBoxes>>;
  onBack: () => void;
  onStart: (wordBoxId: Id<"wordBoxes">) => Promise<void>;
}

function MultipleChoiceConfig({ wordBoxesResult, onBack, onStart }: MultipleChoiceConfigProps) {
  const [selectedWordBoxId, setSelectedWordBoxId] = useState<Id<"wordBoxes"> | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const wordBoxes = wordBoxesResult.data ?? [];
  const selectedWordBox = wordBoxes.find(box => box._id === selectedWordBoxId);

  const canStart = selectedWordBox && selectedWordBox.wordCount >= 4;
  const validationMessage =
    selectedWordBox && selectedWordBox.wordCount < 4
      ? "This collection needs at least 4 words to start a practice session"
      : null;

  const handleStart = async () => {
    if (!selectedWordBoxId || !canStart) return;

    try {
      setIsStarting(true);
      await onStart(selectedWordBoxId);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Configure multiple choice</DialogTitle>
        <DialogDescription>
          Choose a collection to practice. You&apos;ll be tested on the words in that collection.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Collection</label>
          <Select
            value={selectedWordBoxId ?? undefined}
            onValueChange={value => setSelectedWordBoxId(value as Id<"wordBoxes">)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a collection" />
            </SelectTrigger>
            <SelectContent>
              {wordBoxes.map(box => (
                <SelectItem key={box._id} value={box._id}>
                  <div className="flex items-center gap-2">
                    <span>{box.name}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {box.wordCount} {box.wordCount === 1 ? "word" : "words"}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationMessage && (
            <p className="text-sm text-muted-foreground">{validationMessage}</p>
          )}
        </div>
      </div>

      <DialogFooter className="flex-row justify-between">
        <Button variant="ghost" onClick={onBack} disabled={isStarting}>
          <ArrowLeft />
          Back
        </Button>
        <Button onClick={handleStart} disabled={!canStart || isStarting}>
          {isStarting ? <Spinner className="size-4" /> : <Play />}
          Start session
        </Button>
      </DialogFooter>
    </>
  );
}
