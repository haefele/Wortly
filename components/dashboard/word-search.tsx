"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex-helpers/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { SearchingIndicator } from "@/components/dashboard/searching-indicator";
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
import { AddWordSuggestion } from "./add-word-suggestion";
import { Check, Loader2, Plus, Search } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ConvexError } from "convex/values";

interface WordSearchProps {
  className?: string;
  wordBoxId?: Id<"wordBoxes">;
}

export function WordSearch({ className, wordBoxId }: WordSearchProps = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const searchResult = useQuery(
    api.functions.words.searchWord,
    searchTerm.trim().length > 0
      ? {
          term: searchTerm,
          wordBoxId: wordBoxId,
        }
      : "skip"
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  useEffect(() => {
    setIsDropdownOpen(searchTerm.trim().length > 0);
  }, [searchTerm]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [addingWordIds, setAddingWordIds] = useState<string[]>([]);
  const addWordToBox = useMutation(api.functions.wordBoxes.addWord);
  const handleAddWord = async (wordId: Id<"words">) => {
    if (!wordBoxId) {
      return;
    }

    setAddingWordIds(prev => [...prev, wordId]);
    try {
      await addWordToBox({ boxId: wordBoxId, wordId });
      toast.success("Word added to collection.");
    } catch (error) {
      toast.error(error instanceof ConvexError ? error.data : "Failed to add word.");
    } finally {
      setAddingWordIds(prev => {
        const updated = [...prev];
        updated.splice(updated.indexOf(wordId), 1);
        return updated;
      });
    }
  };

  return (
    <div className={cn("relative", className ?? "max-w-2xl mx-auto")} ref={searchContainerRef}>
      <div>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {wordBoxId ? "Add words to this collection" : "Discover German Words"}
          </h1>
          <p className="text-muted-foreground">
            {wordBoxId
              ? "Search your vocabulary database and add words instantly."
              : "Search and explore the German language"}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder={wordBoxId ? "Search words to add..." : "Search German words..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setIsDropdownOpen(searchTerm.trim().length > 0)}
            className="pl-12 h-14 text-lg rounded-xl"
          />
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isDropdownOpen && (
        <div className="absolute left-0 right-0 z-50 border rounded-xl bg-background shadow-2xl mt-4 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          {searchResult.isPending ? (
            <SearchingIndicator className="py-12" />
          ) : searchResult.isSuccess && searchResult.data.results.length === 0 ? (
            <div className="p-4">
              <AddWordSuggestion
                searchTerm={searchTerm}
                onWordAddedToLibrary={w => setSearchTerm(w.word)}
                onSuggestionSelected={s => setSearchTerm(s)}
              />
            </div>
          ) : (
            searchResult.isSuccess && (
              <div>
                <Table containerClassName="max-h-[30vh] overflow-y-auto">
                  <TableHeader className="[&_tr]:border-b-0 [&_th]:shadow-[inset_0_-1px_0_0_theme(colors.border)]">
                    <TableRow className="sticky top-0 z-10 bg-background hover:bg-background">
                      <TableHead className="pl-4">
                        <div className="flex items-center justify-between">
                          <span>German Word</span>
                          <span className="text-xs font-normal text-muted-foreground ml-2">
                            {searchResult.data.results.length} result
                            {searchResult.data.results.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Translation</TableHead>
                      {wordBoxId && <TableHead></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResult.data.results.map(word => (
                      <TableRow key={word._id} className="hover:bg-muted/50">
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-2">
                            <ArticleBadge article={word.article} size="sm" />
                            <span className="font-semibold">{word.word}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <WordTypeBadge wordType={word.wordType} size="sm" />
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="max-w-[16rem] truncate">
                            {word.translations.en || "-"}
                          </div>
                        </TableCell>
                        {wordBoxId && (
                          <TableCell className="p-0 w-10">
                            <div className="flex justify-center">
                              {word.isInBox ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Check className="text-emerald-500" />
                                  </TooltipTrigger>
                                  <TooltipContent sideOffset={6}>
                                    Word is already in this collection.
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Button
                                  size="icon"
                                  variant="outline"
                                  disabled={addingWordIds.includes(word._id)}
                                  onClick={() => handleAddWord(word._id)}
                                >
                                  {addingWordIds.includes(word._id) ? (
                                    <Loader2 className="animate-spin" />
                                  ) : (
                                    <Plus />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Show AddWordSuggestion if there are results but no exact match */}
                {!searchResult.data.hasExactMatch && (
                  <div className="border-t p-4">
                    <AddWordSuggestion
                      searchTerm={searchTerm}
                      onWordAddedToLibrary={w => setSearchTerm(w.word)}
                      onSuggestionSelected={s => setSearchTerm(s)}
                    />
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
