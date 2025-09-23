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
import { IconOrb } from "@/components/ui/icon-orb";

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
                    <Plus />
                    New Collection
                </Button>
            </PageHeader>

            <main className="flex-1 p-4 md:p-6 ">
                {wordBoxes && wordBoxes.length === 0 && (
                    <Card variant="spotlight">
                        <CardContent className="p-12 text-center flex flex-col items-center gap-6">
                            <IconOrb size="lg" icon={FolderOpen} />
                            <div className="space-y-2">
                                <h3 className="text-2xl font-semibold text-foreground">Create your first Collection!</h3>
                                <p className="max-w-md text-sm text-muted-foreground">
                                    Group related vocabulary, track progress with clarity, and bring structure to your learning journey.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                                <Button size="lg" variant="gradient" onClick={() => setNewWordBoxDialogIsOpen(true)}>
                                    <Plus />
                                    New Collection
                                </Button>
                                <Button variant="ghost" size="lg" asChild>
                                    <Link href="/">
                                        Discover words
                                        <ArrowRight />
                                    </Link>
                                </Button>
                            </div>
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
                                <Card variant="clickable">
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
                                        <span className="text-muted-foreground flex items-center text-xs transition-transform duration-200 group-hover/card:translate-x-1">
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
