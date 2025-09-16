"use client";

import { useState } from "react";
import type { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface NewWordBoxDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: (box: Doc<"wordBoxes">) => void;
}

export function NewWordBoxDialog({ open, onOpenChange, onCreated }: NewWordBoxDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const createWordBox = useMutation(api.functions.wordBoxes.createWordBox);
    const router = useRouter();
    
    const submit = async () => {
        const trimmed = name.trim();
        if (trimmed.length === 0) return;

        const created = await createWordBox({ name: trimmed, description: description.trim() });
        setName("");
        setDescription("");
        onOpenChange(false);

        if (onCreated) {
            onCreated(created);
        }
        else {
            router.push(`/library/${created._id}`);
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
                <div>
                    <Input
                        autoFocus
                        placeholder="Collection name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                                await submit();
                            }
                        }}
                    />
                    <Input
                        className="mt-3"
                        placeholder="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                                await submit();
                            }
                        }}
                    />
                </div>
                <DialogFooter>
                    <Button onClick={submit}>Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


