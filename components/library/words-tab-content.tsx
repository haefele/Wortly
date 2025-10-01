"use client";

import { useState } from "react";
import { usePaginatedQuery, useQuery } from "convex-helpers/react";
import { useMutation } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { WordSearch } from "@/components/dashboard/word-search";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { SearchingIndicator } from "@/components/dashboard/searching-indicator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { WORD_TYPES } from "@/lib/word-types";
import { ChevronDown, Filter, Loader2, Plus, Trash2, Search, X } from "lucide-react";
import { BulkAddWordsDialog } from "@/components/library/bulk-add-words-dialog";
import { useEffect, useRef } from "react";

interface WordsTabContentProps {
  boxId: Id<"wordBoxes">;
}

export function WordsTabContent({ boxId }: WordsTabContentProps) {
  const [bulkAddOpen, setBulkAddOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [wordTypeFilter, setWordTypeFilter] = useState<string | undefined>();

  const wordBoxResult = useQuery(api.wordBoxes.getWordBox, { boxId });
  const wordCount = wordBoxResult.data?.wordCount ?? 0;

  const getWordsResult = usePaginatedQuery(
    api.wordBoxes.getWords,
    {
      boxId,
      searchTerm,
      wordType: wordTypeFilter,
    },
    {
      initialNumItems: 25,
    }
  );

  const [removingWordIds, setRemovingWordIds] = useState<string[]>([]);
  const removeWord = useMutation(api.wordBoxes.removeWord);

  const handleRemove = async (wordId: Id<"words">) => {
    try {
      setRemovingWordIds(prev => [...prev, wordId]);
      await removeWord({ boxId, wordId });
      toast.success("Word removed from collection.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove word."));
    } finally {
      setRemovingWordIds(prev => prev.filter(id => id !== wordId));
    }
  };

  // focus shortcut for search '/'
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.target instanceof HTMLElement) && !e.target.closest('input, textarea')) {
        e.preventDefault();
        const input = searchWrapperRef.current?.querySelector('input');
        if (input) {
          (input as HTMLInputElement).focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="space-y-5">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-20 -mx-1 sm:mx-0">
        <Card variant="toolbar">
          {/* Left cluster: filters */}
          <div className="flex flex-wrap items-center gap-3 md:flex-1">
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Filter collection"
                className="pl-9 pr-8"
                maxLength={50}
                aria-label="Filter words in this collection"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="field" className="gap-1">
                  <Filter /> {wordTypeFilter ? wordTypeFilter : 'Type'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuRadioGroup
                  value={wordTypeFilter || 'all'}
                  onValueChange={value => setWordTypeFilter(value === 'all' ? undefined : value)}
                >
                  <DropdownMenuRadioItem value="all">All types</DropdownMenuRadioItem>
                  {WORD_TYPES.map(type => (
                    <DropdownMenuRadioItem key={type} value={type}>
                      {type}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Right cluster: add search & actions */}
          <div className="flex flex-wrap items-center gap-3 md:justify-end md:flex-1">
            <div ref={searchWrapperRef} className="w-full sm:w-72">
              <WordSearch
                wordBoxId={boxId}
                placeholder="Add words to this collection…"
                size="md"
              />
            </div>
            <Button
              variant="outline"
              size="field"
              onClick={() => setBulkAddOpen(true)}
            >
              <Plus /> Add many
            </Button>
          </div>
        </Card>
      </div>

      {/* Table & list card */}
      <Card>
        <CardHeader>
          <CardTitle>Words in this collection</CardTitle>
          <CardDescription>
            {searchTerm.trim().length > 0
              ? `Showing matches for "${searchTerm}".`
              : wordCount === 0
                ? "This collection has no words yet. Add your first word to get started."
                : "Manage words in this collection."}
          </CardDescription>
          <CardAction className="self-center flex items-center">
            <Badge
              key={wordCount}
              variant="secondary"
              className="animate-badge-pop"
            >
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-6">
          {searchTerm.trim().length > 0 && getWordsResult.status === "LoadingFirstPage" ? (
            <SearchingIndicator label="Searching words..." className="py-6" size="sm" />
          ) : getWordsResult.status === "LoadingFirstPage" ? (
            <SearchingIndicator label="Loading words..." className="py-6" size="sm" />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-3/12">German Word</TableHead>
                    <TableHead className="w-2/12">
                      <div className="flex items-center gap-2">
                        <span>Type</span>
                        {wordTypeFilter ? <>({wordTypeFilter})</> : null}
                      </div>
                    </TableHead>
                    <TableHead className="w-6/12">Translation</TableHead>
                    <TableHead className="w-1/12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getWordsResult.results.map(word => (
                    <TableRow key={word._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ArticleBadge article={word.article} size="sm" />
                          <span className="font-semibold">{word.word}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <WordTypeBadge wordType={word.wordType} size="sm" />
                      </TableCell>
                      <TableCell className="text-sm">{word.translations.en || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              disabled={removingWordIds.includes(word._id)}
                              onClick={() => handleRemove(word._id)}
                            >
                              {removingWordIds.includes(word._id) ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <Trash2 />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove word from collection.</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}

                  {getWordsResult.results.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
                          {searchTerm.trim().length > 0 && wordTypeFilter
                            ? `No matches found for "${searchTerm}" and type "${wordTypeFilter}".`
                            : searchTerm.trim().length > 0
                              ? `No matches found for "${searchTerm}".`
                              : wordTypeFilter
                                ? `No matches found for type "${wordTypeFilter}".`
                                : "This collection does not have any words yet."}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {getWordsResult.status === "CanLoadMore" && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => getWordsResult.loadMore(25)}
                disabled={getWordsResult.isLoading}
              >
                <ChevronDown />
                Load more words
              </Button>
            </div>
          )}
          {getWordsResult.status === "LoadingMore" && (
            <SearchingIndicator size="sm" className="py-2" label="Loading more words..." />
          )}
        </CardContent>
      </Card>

      <BulkAddWordsDialog boxId={boxId} open={bulkAddOpen} onOpenChange={setBulkAddOpen} />
    </div>
  );
}
