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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Collection name"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this collection"
                      className="min-h-12"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
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
                <Save />
                {form.formState.isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
