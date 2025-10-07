"use client";

import { useEffect, useRef, useState } from "react";
import { cva } from "class-variance-authority";
import { useQuery } from "convex-helpers/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SearchingIndicator } from "@/components/dashboard/searching-indicator";
import { ArticleBadge } from "@/components/ui/article-badge";
import { WordTypeBadge } from "@/components/ui/word-type-badge";
import { AddWordSuggestion } from "./add-word-suggestion";
import { Check, Plus, Search } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";

interface WordSearchProps {
  className?: string;
  wordBoxId?: Id<"wordBoxes">;
  placeholder?: string;
  size?: "md" | "lg";
}

const inputGroupVariants = cva("w-full", {
  variants: {
    size: {
      md: "",
      lg: "h-14 rounded-xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const inputTextVariants = cva("", {
  variants: {
    size: {
      md: "text-base",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const dropdownVariants = cva(
  "absolute left-1/2 z-50 border rounded-xl bg-background shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 min-w-full min-w-[400px] max-w-[600px] -translate-x-1/2",
  {
    variants: {
      size: {
        md: "mt-3",
        lg: "mt-4",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export function WordSearch({
  className,
  wordBoxId,
  placeholder,
  size = "md",
}: WordSearchProps = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const searchResult = useQuery(
    api.words.searchWord,
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
  const addWordToBox = useMutation(api.wordBoxes.addWord);
  const handleAddWord = async (wordId: Id<"words">) => {
    if (!wordBoxId) {
      return;
    }

    setAddingWordIds(prev => [...prev, wordId]);
    try {
      await addWordToBox({ boxId: wordBoxId, wordId });
      toast.success("Word added to collection.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add word."));
    } finally {
      setAddingWordIds(prev => {
        const updated = [...prev];
        updated.splice(updated.indexOf(wordId), 1);
        return updated;
      });
    }
  };

  return (
    <div className={cn("relative", className)} ref={searchContainerRef}>
      <InputGroup className={inputGroupVariants({ size })}>
        <InputGroupAddon>
          <Search
            className={cn(
              "text-muted-foreground",
              size === "lg" ? "size-5" : "size-4"
            )}
          />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          placeholder={placeholder ?? "Search German words..."}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onFocus={() => setIsDropdownOpen(searchTerm.trim().length > 0)}
          maxLength={50}
          className={inputTextVariants({ size })}
          aria-label="Search German words"
        />
      </InputGroup>

      {/* Search Results Dropdown */}
      {isDropdownOpen && (
        <div className={dropdownVariants({ size: size })}>
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
              <>
                <Table containerClassName="max-h-[30vh] overflow-y-auto">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
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
                                  variant="ghost"
                                  disabled={addingWordIds.includes(word._id)}
                                  onClick={() => handleAddWord(word._id)}
                                >
                                  {addingWordIds.includes(word._id) ? <Spinner /> : <Plus />}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {!searchResult.data.hasExactMatch && (
                  <div className="border-t">
                    <AddWordSuggestion
                      searchTerm={searchTerm}
                      onWordAddedToLibrary={w => setSearchTerm(w.word)}
                      onSuggestionSelected={s => setSearchTerm(s)}
                    />
                  </div>
                )}
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
