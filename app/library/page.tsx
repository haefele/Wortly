"use client";

import { Library, Package } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function LibraryPage() {
    const wordBoxes = useQuery(api.words.getUserWordBoxes);

    return (
        <>
            <PageHeader 
                title="Word Library"
                description="Your personal collection of saved words"
                icon={Library}
            />
            <main className="flex-1 p-4 md:p-6">
                {wordBoxes === undefined ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-4 w-16" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : wordBoxes.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No boxes yet</h3>
                        <p className="text-muted-foreground">
                            Start adding words to create your first box!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {wordBoxes.map((box) => (
                            <Link key={box._id} href={`/library/${box._id}`}>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Package className="h-5 w-5" />
                                            {box.name}
                                        </CardTitle>
                                        <CardDescription>
                                            Word collection
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            {box.wordCount} {box.wordCount === 1 ? 'word' : 'words'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}