"use client";

import { useState } from "react";
import Link from "next/link";
import { Library, Plus, FolderOpen, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { NewWordBoxDialog } from "@/components/library/new-wordbox-dialog";

export default function LibraryPage() {
    const [newWordBoxDialogIsOpen, setNewWordBoxDialogIsOpen] = useState(false);
    const wordBoxes = useQuery(api.functions.wordBoxes.getMyWordBoxes, {});

    return (
        <>
            <PageHeader 
                title="Word Library"
                description="Your personal collection of saved words"
                icon={Library}
            >
                <Button onClick={() => setNewWordBoxDialogIsOpen(true)}>
                    <Plus className="w-4 h-4" />
                    New Collection
                </Button>
            </PageHeader>

            <main className="flex-1 p-4 md:p-6 ">
                {wordBoxes && wordBoxes.length === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <div className="flex items-center justify-center mb-2">
                                <FolderOpen className="w-5 h-5 mr-2" />
                                <span>No collections yet</span>
                            </div>
                            <Button onClick={() => setNewWordBoxDialogIsOpen(true)}>
                                <Plus className="w-4 h-4" /> Create your first collection
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {wordBoxes && wordBoxes.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {wordBoxes.map((box) => (
                            <Link
                                key={box._id}
                                href={`/library/${box._id}`}
                            >
                                <Card className="group overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
                                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden>
                                        <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                                    </div>
                                    <CardHeader className="flex items-center gap-2">
                                        <Library className="h-5 w-5 text-primary" />
                                        <CardTitle>{box.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-muted-foreground text-sm line-clamp-2">
                                            {
                                                box.description && box.description.trim().length > 0
                                                    ? box.description
                                                    : "Organize and review your saved words."
                                            }
                                            </div>
                                    </CardContent>
                                    <CardFooter className="justify-between">
                                        <Badge variant="secondary">{box.wordCount} word{box.wordCount === 1 ? "" : "s"}</Badge>
                                        <span className="text-muted-foreground flex items-center text-xs transition-transform duration-200 group-hover:translate-x-1">
                                            Open
                                            <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                        </span>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <NewWordBoxDialog
                open={newWordBoxDialogIsOpen}
                onOpenChange={setNewWordBoxDialogIsOpen}
            />
        </>
    );
}