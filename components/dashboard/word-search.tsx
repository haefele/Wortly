"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArticleBadge } from "@/components/ui/article-badge";
import { WordTypeBadge } from "@/components/ui/word-type-badge";
import { AddWordSuggestion } from "./add-word-suggestion";
import { Search } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

export function WordSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const searchResults = useQuery(api.functions.words.searchWord,
    searchTerm.trim().length > 0 ? { term: searchTerm } : "skip"
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show/hide dropdown based on search term
  useEffect(() => {
    setIsDropdownOpen(searchTerm.trim().length > 0);
  }, [searchTerm]);

  return (
    <div className="relative max-w-2xl mx-auto" ref={searchContainerRef}>
      {/* Hero Search Section */}
      <div>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Discover German Words</h1>
          <p className="text-muted-foreground">Search and explore the German language</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Search German words..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsDropdownOpen(searchTerm.trim().length > 0)}
            className="pl-12 h-14 text-lg rounded-xl"
          />
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isDropdownOpen && (
        <div className="absolute left-0 right-0 z-50 border rounded-xl bg-background shadow-2xl mt-4 max-h-[70vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
          {searchResults === undefined ? (
            <div className="text-center text-muted-foreground py-12">
              <div className="flex items-center justify-center space-x-2">
                <Skeleton className="w-4 h-4 rounded-full" />
                <span>Searching...</span>
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4">
              <AddWordSuggestion 
                searchTerm={searchTerm}
                onWordAddedToLibrary={(w) => setSearchTerm(w.word)}
                onSuggestionSelected={(s) => setSearchTerm(s)}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">
                    <div className="flex items-center justify-between">
                      <span>German Word</span>
                      <span className="text-xs font-normal text-muted-foreground ml-2">
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Translation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((word: Doc<"words">) => (
                  <TableRow key={word._id} className="hover:bg-muted/50">
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
                      {word.translations.en || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}