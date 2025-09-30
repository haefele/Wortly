"use client";

import { useState } from "react";
import { usePaginatedQuery, useQuery } from "convex-helpers/react";
import { useMutation } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { WordSearch } from "@/components/dashboard/word-search";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { ChevronDown, ListFilter, Loader2, Search, Trash2 } from "lucide-react";

interface WordsTabContentProps {
  boxId: Id<"wordBoxes">;
}

export function WordsTabContent({ boxId }: WordsTabContentProps) {
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

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold">Add words to this collection</h2>
        <p className="text-muted-foreground">
          Search your vocabulary database and add words instantly.
        </p>
      </div>

      <WordSearch wordBoxId={boxId} showCaption={false} />

      <Card>
        <CardHeader>
          <CardTitle>Words in this collection</CardTitle>
          <CardDescription>
            {searchTerm.trim().length > 0
              ? `Showing matches for "${searchTerm}".`
              : wordCount === 0
                ? "This collection has no words yet. Add your first word to get started."
                : `Manage ${wordCount} word${wordCount === 1 ? "" : "s"} in this collection.`}
          </CardDescription>
          <CardAction>
            <div className="relative md:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Search words"
                className="pl-9"
                maxLength={50}
              />
            </div>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Filter by type">
                              <ListFilter />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuRadioGroup
                              value={wordTypeFilter || "all"}
                              onValueChange={value =>
                                setWordTypeFilter(value === "all" ? undefined : value)
                              }
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
    </div>
  );
}
