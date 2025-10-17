"use client";

import { useQuery } from "convex-helpers/react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { formatNumber, formatPercent } from "./utils";

type ArticleMasteryCardProps = {
  className?: string;
};

const articleColors: Record<string, string> = {
  der: "bg-sky-500",
  die: "bg-pink-500",
  das: "bg-amber-500",
};

export function ArticleMasteryCard({ className }: ArticleMasteryCardProps) {
  const result = useQuery(api.progressStats.getArticleMastery, {});
  const data = result.data;
  const sortedArticles =
    data?.byArticle
      ? [...data.byArticle].sort((a, b) => a.article.localeCompare(b.article))
      : [];

  if (result.isPending) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (result.isError || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Article mastery</CardTitle>
          <CardDescription>Track how well you know der, die, das.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            We couldn&apos;t load your article accuracy yet. Try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Article mastery</CardTitle>
          <CardDescription>Accuracy for der, die, das in the last 30 days.</CardDescription>
        </div>
        <Badge variant={data.overallAccuracy >= 90 ? "default" : "secondary"}>
          Overall {formatPercent(data.overallAccuracy, 1)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedArticles.length === 0 ? (
          <div className="border-border/60 rounded-md border p-6 text-center text-sm text-muted-foreground">
            Practice noun articles to see where you stand.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedArticles.map(article => (
              <div key={article.article} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="flex items-center gap-2 uppercase">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white ${articleColors[article.article] ?? "bg-primary"}`}
                    >
                      {article.article}
                    </span>
                    {formatPercent(article.accuracy, 1)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatNumber(article.correctAnswers)} / {formatNumber(article.totalQuestions)} correct
                  </span>
                </div>
                <Progress value={article.accuracy} />
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Most confused words</h4>
          {data.mostConfusedWords.length === 0 ? (
            <p className="text-muted-foreground text-sm">No common mistakes detected yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.mostConfusedWords.map(entry => (
                <li
                  key={`${entry.word}-${entry.correctArticle}-${entry.incorrectArticle}`}
                  className="border-border/60 rounded-md border px-3 py-2"
                >
                  <div className="font-medium">
                    {entry.word} — correct: {entry.correctArticle}, often answered: {entry.incorrectArticle}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {formatNumber(entry.occurrences)} time{entry.occurrences === 1 ? "" : "s"} incorrect
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
