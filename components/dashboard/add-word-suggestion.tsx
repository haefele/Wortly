"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

interface AddWordSuggestionProps {
  searchTerm: string;
}

export function AddWordSuggestion({ searchTerm }: AddWordSuggestionProps) {
  const [addingWord, setAddingWord] = useState<boolean>(false);
  const addNewWord = useAction(api.functions.words.addNewWord);

  const handleAddNewWord = async () => {
    if (!searchTerm.trim() || addingWord === true) return;

    setAddingWord(true);

    await addNewWord({ word: searchTerm.trim() });
    setAddingWord(false);
  };

  return (
    <div className="text-center py-8 space-y-6">
      {/* Icon */}
      <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
        {addingWord ? (
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        ) : (
          <Sparkles className="w-8 h-8 text-muted-foreground" />
        )}
      </div>

      {/* Main content */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          {addingWord ? `Adding "${searchTerm}"...` : `No words found for "${searchTerm}"`}
        </h3>
        <p className="text-sm text-muted-foreground">
          {addingWord 
            ? "Our AI is analyzing this word to provide comprehensive data."
            : "This word might not be in our database yet."
          }
        </p>
      </div>

      {/* Action/Progress section */}
      {addingWord ? (
        <div className="space-y-3 max-w-sm mx-auto">
          <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span>Processing with AI...</span>
          </div>
        </div>
      ) : (
        <Button
          onClick={handleAddNewWord}
          variant="gradient"
          className="transition-all duration-300 hover:scale-105"
          size="lg"
        >
          <Sparkles className="w-5 h-5" />
          Add "{searchTerm}" to database
        </Button>
      )}

      {/* Footer text */}
      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
        {addingWord 
          ? "This usually takes 10-20 seconds."
          : "We'll analyze this word with AI to provide translations, grammar info, and example sentences."
        }
      </p>
    </div>
  );
}
