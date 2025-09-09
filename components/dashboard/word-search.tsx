"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { WordCard } from "./word-card";
import { Search } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

interface WordSearchProps {
  onAddToLibrary?: (word: Doc<"words">) => void;
}

export function WordSearch({ onAddToLibrary }: WordSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const searchResults = useQuery(
    api.functions.words.searchWord,
    searchTerm.trim().length > 0 ? { term: searchTerm } : "skip"
  );

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search German words..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-lg"
        />
      </div>

      {/* Search Results */}
      {searchTerm.trim().length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results</h3>
          {searchResults === undefined ? (
            <div className="text-center text-muted-foreground py-8">
              Searching...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No words found for "{searchTerm}"</p>
              <p className="text-sm mt-1">Try searching for a different German word</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((word: Doc<"words">) => (
                <WordCard
                  key={word._id}
                  word={word}
                  onAddToLibrary={onAddToLibrary}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}