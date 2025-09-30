"use client";

import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Doc } from "@/convex/_generated/dataModel";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

interface NewWordBoxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (box: Doc<"wordBoxes">) => void;
}

export function NewWordBoxDialog({ open, onOpenChange, onCreated }: NewWordBoxDialogProps) {
  const createWordBox = useMutation(api.wordBoxes.createWordBox);
  const router = useRouter();

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: FormSchemaType) => {
    try {
      const created = await createWordBox({
        name: data.name.trim(),
        description: data.description?.trim(),
      });

      form.reset();
      onOpenChange(false);
      toast.success("Collection created successfully.");

      if (onCreated) {
        onCreated(created);
      } else {
        router.push(`/library/${created._id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create collection.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
          <DialogDescription>
            Create a new word collection to organize your words.
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
                      autoFocus
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
                <Plus />
                {form.formState.isSubmitting ? "Creating..." : "Create collection"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
