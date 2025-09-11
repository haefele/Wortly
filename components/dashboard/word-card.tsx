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
      return "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200";
    case "die":
      return "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200";
    case "das":
      return "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200";
    default:
      return "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200";
  }
};

export function WordCard({ word, onAddToLibrary, showAddButton = true }: WordCardProps) {
  return (
    <Card className="group relative hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-background to-muted/10 border-border/50">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* German word with article */}
          <div className="flex items-start gap-3">
            {word.article && (
              <Badge 
                variant="secondary" 
                className={`${getArticleColor(word.article)} font-semibold px-3 py-1 border shadow-sm`}
              >
                {word.article}
              </Badge>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                {word.word}
              </h3>
            </div>
          </div>
          
          {/* Word type */}
          <Badge 
            variant="outline" 
            className="w-fit bg-muted/50 border-muted-foreground/20 text-muted-foreground font-medium px-3 py-1"
          >
            {word.wordType}
          </Badge>
          
          {/* Translations */}
          <div className="space-y-2">
            {word.translations.en && (
              <div className="flex gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider min-w-[20px]">EN</span>
                <p className="text-sm text-foreground font-medium">
                  {word.translations.en}
                </p>
              </div>
            )}
            {word.translations.ru && (
              <div className="flex gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider min-w-[20px]">RU</span>
                <p className="text-sm text-foreground font-medium">
                  {word.translations.ru}
                </p>
              </div>
            )}
          </div>
          
          {/* Add to Library button */}
          {showAddButton && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full mt-4 bg-muted/50 hover:bg-primary/10 hover:text-primary border-border/50 transition-all duration-200 group-hover:border-primary/20"
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