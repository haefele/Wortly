"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

interface AddWordSuggestionProps {
  searchTerm: string;
  onSuggestionSelected?: (suggestion: string) => void;
  onWordAddedToLibrary?: (word: Doc<"words">) => void;
}

type ComponentState = 
  | { type: 'notFound' }
  | { type: 'loading' }
  | { type: 'suggestions'; suggestions: string[] };

export function AddWordSuggestion({ searchTerm, onWordAddedToLibrary, onSuggestionSelected }: AddWordSuggestionProps) {
  const [state, setState] = useState<ComponentState>({ type: 'notFound' });
  const addNewWord = useAction(api.functions.words.addNewWord);

  const handleAddNewWord = async () => {
    if (!searchTerm.trim() || state.type === 'loading') return;

    setState({ type: 'loading' });

    const result = await addNewWord({ word: searchTerm.trim() });
    
    if (result.success) {
      onWordAddedToLibrary?.(result.word);
      setState({ type: 'notFound' });
    } else {
      setState({ type: 'suggestions', suggestions: result.suggestions });
    }
  };

  switch (state.type) {
    case 'loading':
      return (
        <div className="text-center md:py-8 space-y-6">
          <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Adding &ldquo;{searchTerm}&rdquo;...
            </h3>
            <p className="text-sm text-muted-foreground">
              Our AI is analyzing this word to provide comprehensive data.
            </p>
          </div>
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
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            This usually takes 10-20 seconds.
          </p>
        </div>
      );

    case 'suggestions':
      return (
        <div className="text-center md:py-8 space-y-6">
          <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              &ldquo;{searchTerm}&rdquo; is not a valid German word
            </h3>
            {state.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Did you mean one of these words?
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {state.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onSuggestionSelected?.(suggestion);
                      }}
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );

    case 'notFound':
    default:
      return (
        <div className="text-center md:py-8 space-y-6">
          <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              &ldquo;{searchTerm}&rdquo; not found
            </h3>
            <p className="text-sm text-muted-foreground">
              This exact word might not be in our database yet.
            </p>
          </div>
          <Button
            onClick={handleAddNewWord}
            variant="gradient"
            className="transition-all duration-300 hover:scale-105"
            size="lg"
          >
            <Sparkles className="w-5 h-5" />
            Add &ldquo;{searchTerm}&rdquo; to database
          </Button>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            We&apos;ll analyze this word with AI to provide translations, grammar info, and example sentences.
          </p>
        </div>
      );
  }
}
