"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArticleBadge } from "@/components/ui/article-badge";
import { WordTypeBadge } from "@/components/ui/word-type-badge";
import { Plus } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

interface WordCardProps {
  word: Doc<"words">;
  onAddToLibrary?: (word: Doc<"words">) => void;
  showAddButton?: boolean;
}


export function WordCard({ word, onAddToLibrary, showAddButton = true }: WordCardProps) {
  return (
    <Card className="group relative hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-background to-muted/10 border-border/50">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* German word with article */}
          <div className="flex items-start gap-3">
            <ArticleBadge article={word.article} size="sm" />
            <div className="flex-1">
              <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                {word.word}
              </h3>
            </div>
          </div>
          
          {/* Word type */}
          <WordTypeBadge wordType={word.wordType} size="sm" />
          
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