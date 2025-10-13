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
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  MULTIPLE_CHOICE_VARIANTS,
  PRACTICE_SESSION_TYPES,
  type MultipleChoiceVariant,
  type PracticeSessionType,
} from "@/app/learn/constants";
import { Controller } from "react-hook-form";

interface StartPracticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogStep = "select-type" | "configure";

export function StartPracticeDialog({ open, onOpenChange }: StartPracticeDialogProps) {
  const [step, setStep] = useState<DialogStep>("select-type");
  const [selectedType, setSelectedType] = useState<PracticeSessionType | null>(null);

  const wordBoxesResult = useQuery(api.wordBoxes.getMyWordBoxes, {});

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
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface MultipleChoiceConfigProps {
  wordBoxesResult: ReturnType<typeof useQuery<typeof api.wordBoxes.getMyWordBoxes>>;
  onBack: () => void;
  onOpenChange: (open: boolean) => void;
}

function MultipleChoiceConfig({
  wordBoxesResult,
  onBack,
  onOpenChange,
}: MultipleChoiceConfigProps) {
  const router = useRouter();
  const wordBoxes = wordBoxesResult.data ?? [];
  const startMultipleChoice = useMutation(api.practiceSessions.startMultipleChoice);

  const multipleChoiceFormSchema = z
    .object({
      wordBoxId: z.string().min(1, "Please select a collection"),
      questionCount: z.string().min(1, "Please select number of questions"),
      type: z.enum(["german_word_choose_translation", "translation_choose_german_word"]),
    })
    .refine(
      data => {
        const selectedBox = wordBoxes.find(box => box._id === data.wordBoxId);
        return selectedBox && selectedBox.wordCount >= 1;
      },
      {
        message: "This collection needs at least 1 word to start a practice session",
        path: ["wordBoxId"],
      }
    );

  const form = useForm<z.infer<typeof multipleChoiceFormSchema>>({
    resolver: zodResolver(multipleChoiceFormSchema),
    defaultValues: {
      wordBoxId: "",
      questionCount: "10",
      type: "german_word_choose_translation",
    },
  });

  const onSubmit = async (data: z.infer<typeof multipleChoiceFormSchema>) => {
    try {
      const sessionId = await startMultipleChoice({
        wordBoxId: data.wordBoxId as Id<"wordBoxes">,
        questionCount: parseInt(data.questionCount, 10),
        type: data.type as MultipleChoiceVariant,
      });
      onOpenChange(false);
      router.push(`/learn/${sessionId}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to start practice session"));
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

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="type"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Question direction</FieldLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Select question direction" />
                </SelectTrigger>
                <SelectContent position="item-aligned">
                  {MULTIPLE_CHOICE_VARIANTS.map(variant => (
                    <SelectItem key={variant.id} value={variant.id}>
                      <div className="flex flex-col gap-1 text-left">
                        <span className="font-medium">{variant.label}</span>
                        <span className="text-xs text-muted-foreground">{variant.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="wordBoxId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Collection</FieldLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent position="item-aligned">
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="questionCount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Number of questions</FieldLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Select number of questions" />
                </SelectTrigger>
                <SelectContent position="item-aligned">
                  <SelectItem value="5">5 questions</SelectItem>
                  <SelectItem value="10">10 questions</SelectItem>
                  <SelectItem value="20">20 questions</SelectItem>
                  <SelectItem value="50">50 questions</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
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
            {form.formState.isSubmitting ? <Spinner /> : <Play />}
            Start session
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
