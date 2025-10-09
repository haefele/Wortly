"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Play } from "lucide-react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getErrorMessage } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

            <div className="grid grid-cols-1 gap-3">
              {PRACTICE_SESSION_TYPES.map(type => (
                <Card key={type.id} variant="clickable" onClick={() => handleTypeSelect(type.id)}>
                  <CardHeader className="flex items-center gap-3">
                    <type.icon className="h-5 w-5 text-primary" />
                    <CardTitle>{type.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{type.description}</CardDescription>
                  </CardContent>
                </Card>
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
  const wordBoxes = wordBoxesResult.data ?? [];

  const multipleChoiceFormSchema = z
    .object({
      wordBoxId: z.string().min(1, "Please select a collection"),
    })
    .refine(
      data => {
        const selectedBox = wordBoxes.find(box => box._id === data.wordBoxId);
        return selectedBox && selectedBox.wordCount >= 4;
      },
      {
        message: "This collection needs at least 4 words to start a practice session",
        path: ["wordBoxId"],
      }
    );

  const form = useForm<z.infer<typeof multipleChoiceFormSchema>>({
    resolver: zodResolver(multipleChoiceFormSchema),
    defaultValues: {
      wordBoxId: "",
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Configure multiple choice</DialogTitle>
        <DialogDescription>
          Choose a collection to practice. You&apos;ll be tested on the words in that collection.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(data => onStart(data.wordBoxId as Id<"wordBoxes">))}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="wordBoxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Collection</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                  </FormControl>
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
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className="justify-between sm:justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              disabled={form.formState.isSubmitting}
              type="button"
            >
              <ArrowLeft />
              Back
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Spinner className="size-4" /> : <Play />}
              Start session
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
