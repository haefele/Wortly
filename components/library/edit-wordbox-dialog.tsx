"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface EditWordBoxDialogProps {
    boxId: Id<"wordBoxes">;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditWordBoxDialog({
    boxId,
    open,
    onOpenChange
}: EditWordBoxDialogProps) {
    
    const updateBox = useMutation(api.functions.wordBoxes.updateWordBox);
    const box = useQuery(api.functions.wordBoxes.getWordBox, { boxId });

    const [name, setName] = useState(box?.name ?? "");
    const [description, setDescription] = useState(box?.description ?? "");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!open || !box)
            return;

        setName(box.name ?? "");
        setDescription(box.description ?? "");
    }, [open, box]);
    
   
    const handleSave = async () => {
        const trimmedName = name.trim();
        const trimmedDescription = description.trim();

        if (trimmedName.length === 0) {
            toast.error("Name is required.");
            return;
        }

        setIsSaving(true);

        try {
            await updateBox({ boxId, name: trimmedName, description: trimmedDescription });
            onOpenChange(false);
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save changes.");
        }
        finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit collection</DialogTitle>
                    <DialogDescription>Update the name and description to keep things organized.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <fieldset className="space-y-2">
                        <label className="block font-medium text-foreground">Name</label>
                        <Input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            disabled={isSaving}
                            placeholder="Collection name"
                        />
                    </fieldset>
                    <fieldset className="space-y-2">
                        <label className="block font-medium text-foreground">Description</label>
                        <Textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            disabled={isSaving}
                            placeholder="Describe this collection"
                            className="min-h-36"
                        />
                    </fieldset>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
