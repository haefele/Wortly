"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArticleBadge } from "@/components/ui/article-badge";
import { WordTypeBadge } from "@/components/ui/word-type-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AddWordToBoxDialogProps {
  boxId: Id<"wordBoxes">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingWordIds: Set<Id<"words">>;
}

export function AddWordToBoxDialog({
  boxId,
  open,
  onOpenChange,
  existingWordIds,
}: AddWordToBoxDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [pendingWordId, setPendingWordId] = useState<Id<"words"> | null>(null);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<Id<"words">>>(new Set());

  const searchResults = useQuery(
    api.functions.words.searchWord,
    searchTerm.trim().length > 0 ? { term: searchTerm } : "skip"
  );

  const addWord = useMutation(api.functions.wordBoxes.addWord);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setMutationError(null);
      setPendingWordId(null);
      setRecentlyAddedIds(new Set());
    }
  }, [open]);

  const handleAdd = async (wordId: Id<"words">) => {
    setPendingWordId(wordId);
    setMutationError(null);

    try {
      await addWord({ boxId, wordId });
      setRecentlyAddedIds(prev => {
        const next = new Set(prev);
        next.add(wordId);
        return next;
      });
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Failed to add word");
    } finally {
      setPendingWordId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add words to collection</DialogTitle>
          <DialogDescription>
            Search your vocabulary database and add words instantly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            autoFocus
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Search German words..."
          />
          <div className="max-h-[320px] overflow-y-auto border rounded-lg">
            {!searchTerm.trim() && (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                Start typing to explore words you can add.
              </div>
            )}
            {searchTerm.trim().length > 0 && searchResults === undefined && (
              <div className="space-y-2 px-6 py-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            )}
            {Array.isArray(searchResults?.results) && searchResults.results.length > 0 && (
              <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>Word</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>English</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.results.map((word: Doc<"words">) => {
                    const alreadyInBox =
                      existingWordIds.has(word._id) || recentlyAddedIds.has(word._id);
                    return (
                      <TableRow key={word._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ArticleBadge article={word.article} size="sm" />
                            <span className="font-medium">{word.word}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <WordTypeBadge wordType={word.wordType} size="sm" />
                        </TableCell>
                        <TableCell>{word.translations.en ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={alreadyInBox ? "outline" : "gradient"}
                            size="sm"
                            disabled={alreadyInBox || pendingWordId === word._id}
                            onClick={() => handleAdd(word._id)}
                          >
                            {alreadyInBox
                              ? "In collection"
                              : pendingWordId === word._id
                                ? "Adding"
                                : "Add"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            {searchResults?.results &&
              searchResults.results.length === 0 &&
              searchTerm.trim().length > 0 && (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No matches found. Try a different word.
                </div>
              )}
          </div>
          {mutationError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {mutationError}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
