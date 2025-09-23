"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Library, Plus, Trash2, Filter, ArrowLeft, MoreHorizontal, Edit } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArticleBadge } from "@/components/ui/article-badge";
import { WordTypeBadge } from "@/components/ui/word-type-badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddWordToBoxDialog } from "@/components/library/add-word-to-box-dialog";
import { EditWordBoxDialog } from "@/components/library/edit-wordbox-dialog";

type WordWithDetails = Doc<"words"> & { addedAt: number };
const PAGE_SIZE = 20;

export default function LibraryBoxDetailPage() {
    const params = useParams();
    const router = useRouter();
    const paramId = typeof params?.boxId === "string" ? params.boxId : undefined;
    const boxId = paramId as Id<"wordBoxes"> | undefined;

    const wordBox = useQuery(
        api.functions.wordBoxes.getWordBox,
        boxId ? { boxId } : "skip",
    );

    const { results: allWords, status, loadMore } = usePaginatedQuery(
        api.functions.wordBoxes.getWords,
        boxId ? { boxId } : "skip",
        { initialNumItems: PAGE_SIZE },
    );

    const deleteWordBox = useMutation(api.functions.wordBoxes.deleteWordBox);
    const removeWord = useMutation(api.functions.wordBoxes.removeWord);

    const [searchTerm, setSearchTerm] = useState("");
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    const trimmedSearch = searchTerm.trim();
    const searchResults = useQuery(
        api.functions.wordBoxes.searchWords,
        boxId && trimmedSearch.length > 0 ? { boxId, term: trimmedSearch } : "skip",
    );

    const baseWords = useMemo(() => ((allWords as WordWithDetails[]) ?? []), [allWords]);
    const searchWords = useMemo(() => (Array.isArray(searchResults) ? searchResults : []), [searchResults]);
    const isSearching = trimmedSearch.length > 0;
    const isSearchLoading = isSearching && searchResults === undefined;

    const wordsForDisplay = isSearching ? searchWords : baseWords;

    const existingWordIds = useMemo(() => {
        const ids = new Set(baseWords.map((word) => word._id));
        if (searchWords.length > 0) {
            for (const word of searchWords) {
                ids.add(word._id);
            }
        }
        return ids;
    }, [baseWords, searchWords]);

    const handleDelete = async () => {
        if (!boxId) return;
        setIsDeleting(true);
        setGlobalError(null);

        try {
            await deleteWordBox({ boxId });
            router.push("/library");
        }
        catch (error) {
            setGlobalError(error instanceof Error ? error.message : "Failed to delete collection");
            setIsDeleting(false);
        }
    };

    const handleRemoveWord = async (wordId: Id<"words">) => {
        if (!boxId) return;
        setGlobalError(null);

        try {
            await removeWord({ boxId, wordId });
        }
        catch (error) {
            setGlobalError(error instanceof Error ? error.message : "Failed to remove word");
        }
    };

    if (wordBox === null) {
        return (
            <>
                <PageHeader
                    title="Word Collection"
                    description="This collection could not be located"
                    icon={Library}
                />
                <main className="flex-1 p-4 md:p-6">
                    <Card className="max-w-xl mx-auto">
                        <CardHeader>
                            <CardTitle>Collection not found</CardTitle>
                            <CardDescription>
                                This collection may have been deleted or you may not have access to it.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button variant="ghost" onClick={() => router.push("/library")}>
                                <ArrowLeft className="h-4 w-4" />
                                Back to Library
                            </Button>
                        </CardFooter>
                    </Card>
                </main>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title={wordBox ? wordBox.name : "Word Collection"}
                description={wordBox && wordBox.description?.trim().length ? wordBox.description : "View and manage words in this collection"}
                icon={Library}
            >
                <div className="flex items-center gap-2">
                    <Button onClick={() => setAddDialogOpen(true)} disabled={!wordBox} variant="default">
                        <Plus />
                        Add words
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreHorizontal />
                                <span className="sr-only">Collection actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                                disabled={!wordBox}
                                onSelect={() => {
                                    setEditDialogOpen(true);
                                }}
                            >
                                <Edit /> Edit collection
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive"
                                disabled={!wordBox}
                                onSelect={() => {
                                    setDeleteDialogOpen(true);
                                }}
                            >
                                <Trash2 className="text-destructive" /> Delete collection
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </PageHeader>

            <main className="flex-1 p-4 md:p-6 space-y-6">
                {globalError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {globalError}
                    </div>
                )}

                <WordsSection
                    words={wordsForDisplay}
                    status={status}
                    onLoadMore={() => loadMore(PAGE_SIZE)}
                    onRemove={handleRemoveWord}
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    isSearching={isSearching}
                    isSearchLoading={isSearchLoading}
                />
            </main>

            {boxId && (
                <>
                    <AddWordToBoxDialog
                        boxId={boxId}
                        open={addDialogOpen}
                        onOpenChange={setAddDialogOpen}
                        existingWordIds={existingWordIds}
                    />

                    <EditWordBoxDialog
                        boxId={boxId}
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                    />

                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete this collection?</DialogTitle>
                                <DialogDescription>
                                    This will remove the collection and all of its assignments. The words themselves remain available in your library.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                                    {isDeleting ? "Deleting" : "Delete now"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </>
    );
}

interface WordsSectionProps {
    words: WordWithDetails[];
    status: "LoadingFirstPage" | "LoadingMore" | "CanLoadMore" | "Exhausted";
    onLoadMore: () => void;
    onRemove: (wordId: Id<"words">) => void;
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    isSearching: boolean;
    isSearchLoading: boolean;
}

function WordsSection({ words, status, onLoadMore, onRemove, searchTerm, onSearchTermChange, isSearching, isSearchLoading }: WordsSectionProps) {
    const isLoading = isSearching ? isSearchLoading : status === "LoadingFirstPage";
    const showLoadMore = !isSearching && (status === "CanLoadMore" || status === "LoadingMore");
    const loadMoreDisabled = status === "LoadingMore";
    const loadMoreLabel = status === "LoadingMore" ? "Loading" : "Load more";

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Words in this collection</CardTitle>
                    <CardDescription>Review, search, and curate the words that belong here.</CardDescription>
                </div>
                <div className="w-full sm:w-auto">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchTerm}
                            onChange={(event) => onSearchTermChange(event.target.value)}
                            placeholder="Filter words"
                            className="pl-9"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Skeleton key={index} className="h-12 w-full" />
                        ))}
                    </div>
                )}

                {!isLoading && words.length === 0 && (
                    <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-6 py-12 text-center">
                        <div className="mx-auto max-w-sm space-y-3">
                            <Filter className="mx-auto h-8 w-8 text-muted-foreground" />
                            <h3 className="text-lg font-semibold">
                                {isSearching ? "No matching words" : "No words yet"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {isSearching
                                    ? "Try a different search term or reset the filter to see all words."
                                    : "Add new words or adjust your search filters to see them listed here."}
                            </p>
                        </div>
                    </div>
                )}

                {words.length > 0 && (
                    <Table containerClassName="max-h-[60vh]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[35%]">Word</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>English</TableHead>
                                <TableHead>Russian</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {words.map((word) => (
                                <TableRow key={word._id}>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <ArticleBadge article={word.article} size="sm" />
                                                <span className="font-semibold text-sm">{word.word}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">Added {new Date(word.addedAt).toLocaleDateString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <WordTypeBadge wordType={word.wordType} size="sm" />
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {word.translations.en ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {word.translations.ru ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => onRemove(word._id)}>
                                            Remove
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
            {showLoadMore && (
                <CardFooter>
                    <Button
                        variant="outline"
                        className="ml-auto"
                        onClick={onLoadMore}
                        disabled={loadMoreDisabled}
                    >
                        {loadMoreLabel}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
