"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WordCard } from "./word-card";
import { Search, Plus } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

interface WordSearchProps {
  onAddToLibrary?: (word: Doc<"words">) => void;
}

export function WordSearch({ onAddToLibrary }: WordSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddingWord, setIsAddingWord] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const searchResults = useQuery(api.functions.words.searchWord,
    searchTerm.trim().length > 0 ? { term: searchTerm } : "skip"
  );  
  const addNewWord = useMutation(api.functions.words.addNewWord);

  const handleAddNewWord = async () => {
    if (!searchTerm.trim() || isAddingWord) return;
    
    setIsAddingWord(true);
    const result = await addNewWord({ word: searchTerm.trim() });
    if (result) {
      setTimeout(() => {
        setIsAddingWord(false);
      }, 10_000);
    }
  };

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
              <div className="text-center py-8 space-y-8">
                <div className="text-muted-foreground">
                  <p className="text-lg">No words found for "{searchTerm}"</p>
                  <p className="text-sm mt-1 opacity-75">This word might not be in our database yet.</p>
                </div>
                <Button 
                  onClick={handleAddNewWord}
                  disabled={isAddingWord}
                >
                  {isAddingWord ? (
                    <>
                      <Skeleton className="w-4 h-4 rounded-full" />
                      Adding word...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add "{searchTerm}" to database
                    </>
                  )}
                </Button>
                {isAddingWord && (
                  <p className="text-xs text-muted-foreground">
                    This may take up to 10 seconds while we analyze the word with AI
                  </p>
                )}
              </div>
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