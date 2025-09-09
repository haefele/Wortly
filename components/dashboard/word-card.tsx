"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

interface WordCardProps {
  word: Doc<"words">;
  onAddToLibrary?: (word: Doc<"words">) => void;
  showAddButton?: boolean;
}

const getArticleColor = (article?: string) => {
  switch (article) {
    case "der":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "die":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "das":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
};

export function WordCard({ word, onAddToLibrary, showAddButton = true }: WordCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* German word with article */}
          <div className="flex items-center gap-2">
            {word.article && (
              <Badge 
                variant="secondary" 
                className={getArticleColor(word.article)}
              >
                {word.article}
              </Badge>
            )}
            <h3 className="font-semibold text-lg">{word.word}</h3>
          </div>
          
          {/* Word type */}
          <Badge variant="outline" className="w-fit">
            {word.wordType}
          </Badge>
          
          {/* Translations */}
          <div className="space-y-1">
            {word.translations.en && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">EN:</span> {word.translations.en}
              </p>
            )}
            {word.translations.ru && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">RU:</span> {word.translations.ru}
              </p>
            )}
          </div>
          
          {/* Add to Library button */}
          {showAddButton && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onAddToLibrary?.(word)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Library
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}