"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Controller } from "react-hook-form";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

interface EditWordBoxDialogProps {
  boxId: Id<"wordBoxes">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWordBoxDialog({ boxId, open, onOpenChange }: EditWordBoxDialogProps) {
  const updateBox = useMutation(api.wordBoxes.updateWordBox);
  const boxResult = useQuery(api.wordBoxes.getWordBox, { boxId });

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open && boxResult.isSuccess && boxResult.data) {
      form.reset({
        name: boxResult.data.name ?? "",
        description: boxResult.data.description ?? "",
      });
    }
  }, [open, boxResult.isSuccess, boxResult.data, form]);

  const onSubmit = async (data: FormSchemaType) => {
    try {
      await updateBox({
        boxId,
        name: data.name.trim(),
        description: data.description?.trim(),
      });
      onOpenChange(false);
      toast.success("Collection updated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit collection</DialogTitle>
          <DialogDescription>
            Update the name and description to keep things organized.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Name</FieldLabel>
                <Input
                  placeholder="Collection name"
                  disabled={form.formState.isSubmitting}
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  placeholder="Describe this collection"
                  className="min-h-12"
                  disabled={form.formState.isSubmitting}
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Spinner /> Saving...
                </>
              ) : (
                <>
                  <Save /> Save changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
