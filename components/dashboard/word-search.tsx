"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { WordCard } from "./word-card";
import { AddWordSuggestion } from "./add-word-suggestion";
import { Search } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

interface WordSearchProps {
  onAddToLibrary?: (word: Doc<"words">) => void;
}

export function WordSearch({ onAddToLibrary }: WordSearchProps) {
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
            className="pl-12 h-14 text-lg rounded-xl"
          />
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isDropdownOpen && (
        <div className="absolute left-0 right-0 z-50 border rounded-xl bg-background shadow-2xl mt-4 max-h-[70vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-4">
            {searchResults === undefined ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="flex items-center justify-center space-x-2">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <span>Searching...</span>
                </div>
              </div>
            ) : searchResults.length === 0 ? (
              <AddWordSuggestion 
                searchTerm={searchTerm}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <h3 className="text-lg font-semibold">Search Results</h3>
                  <span className="text-sm text-muted-foreground">{searchResults.length} word{searchResults.length !== 1 ? 's' : ''} found</span>
                </div>
                <div className="grid gap-3">
                  {searchResults.map((word: Doc<"words">) => (
                    <WordCard
                      key={word._id}
                      word={word}
                      onAddToLibrary={onAddToLibrary}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}