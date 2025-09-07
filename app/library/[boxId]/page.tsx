"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageHeader } from "@/components/page-header";
import { Package, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { usePaginatedQuery } from "convex/react";

interface WordBoxDetailPageProps {
    params: {
        boxId: Id<"wordBoxes">;
    };
}

export default function WordBoxDetailPage({ params }: WordBoxDetailPageProps) {
    const wordBox = useQuery(api.words.getWordBox, { boxId: params.boxId });
    const { results: wordsResult, status, loadMore } = usePaginatedQuery(
        api.words.getWordBoxWords,
        { boxId: params.boxId },
        { initialNumItems: 10 }
    );

    if (wordBox === undefined || status === "LoadingFirstPage") {
        return (
            <>
                <PageHeader 
                    title="Loading..."
                    description="Loading word box details..."
                    icon={Package}
                />
                <main className="flex-1 p-4 md:p-6">
                    <div className="mb-6">
                        <Skeleton className="h-9 w-20" />
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <TableHead key={i}>
                                                <Skeleton className="h-4 w-16" />
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 4 }).map((_, j) => (
                                                <TableCell key={j}>
                                                    <Skeleton className="h-4 w-20" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </main>
            </>
        );
    }

    if (wordBox === null) {
        return (
            <>
                <PageHeader 
                    title="Word Box Not Found"
                    description="The requested word box could not be found"
                    icon={Package}
                />
                <main className="flex-1 p-4 md:p-6">
                    <div className="text-center py-12">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Word box not found</h3>
                        <p className="text-muted-foreground mb-4">
                            The word box you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
                        </p>
                        <Link href="/library">
                            <Button>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Library
                            </Button>
                        </Link>
                    </div>
                </main>
            </>
        );
    }

    const words = wordsResult || [];
    const hasMoreWords = status === "CanLoadMore";
    const isLoadingMore = status === "LoadingMore";

    return (
        <>
            <PageHeader 
                title={wordBox.name}
                description={`${wordBox.wordCount} ${wordBox.wordCount === 1 ? 'word' : 'words'} in this collection`}
                icon={Package}
            />
            <main className="flex-1 p-4 md:p-6">
                <div className="mb-6">
                    <Link href="/library">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Library
                        </Button>
                    </Link>
                </div>

                {words.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No words yet</h3>
                        <p className="text-muted-foreground">
                            This word box is empty. Start adding words to see them here!
                        </p>
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>German Word</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>English</TableHead>
                                        <TableHead>Russian</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {words.map((word: {
                                        _id: Id<"words">;
                                        word: string;
                                        article?: string;
                                        wordType: string;
                                        translations: {
                                            en?: string;
                                            ru?: string;
                                        };
                                    }) => (
                                        <TableRow key={word._id}>
                                            <TableCell className="font-medium">
                                                {word.article && (
                                                    <span className="text-muted-foreground mr-1">
                                                        {word.article}
                                                    </span>
                                                )}
                                                {word.word}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {word.wordType}
                                            </TableCell>
                                            <TableCell>
                                                {word.translations.en || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {word.translations.ru || '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {(hasMoreWords || isLoadingMore) && (
                    <div className="flex justify-center mt-6">
                        <Button 
                            onClick={() => loadMore(10)} 
                            disabled={isLoadingMore}
                            variant="outline"
                        >
                            {isLoadingMore ? (
                                <>Loading...</>
                            ) : (
                                <>
                                    <ChevronRight className="mr-2 h-4 w-4" />
                                    Load More Words
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </main>
        </>
    );
}