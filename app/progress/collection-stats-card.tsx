"use client";

import { useQuery } from "convex-helpers/react";
import type { FunctionReturnType } from "convex/server";
import { Archive, Clock, Library } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatRelativeTime } from "./utils";
import { Item, ItemContent, ItemTitle, ItemDescription } from "@/components/ui/item";

type CollectionStats = FunctionReturnType<typeof api.progressStats.getCollectionStats>;

type CollectionStatsCardProps = {
  className?: string;
};

export function CollectionStatsCard({ className }: CollectionStatsCardProps) {
  const result = useQuery(api.progressStats.getCollectionStats, {});

  if (result.isPending) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (result.isError || !result.data) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Library className="h-5 w-5 text-primary" />
              Collection overview
            </CardTitle>
            <CardDescription>Statistics about your word boxes.</CardDescription>
          </div>
          <Badge variant="secondary" className="font-medium">
            Snapshot
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            We couldn&apos;t load your collection statistics. Please refresh the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  const data: CollectionStats = result.data;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Library className="h-5 w-5 text-primary" />
            Collection overview
          </CardTitle>
          <CardDescription>How your collections are growing.</CardDescription>
        </div>
        <Badge variant="secondary" className="font-medium">
          Snapshot
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Archive className="h-4 w-4 text-primary" />
            Largest collection
          </h4>
          {data.largestCollection ? (
            <Item variant="outline" size="sm">
              <ItemContent>
                <div className="flex items-center justify-between">
                  <ItemTitle>{data.largestCollection.name}</ItemTitle>
                  <span className="text-muted-foreground text-sm">
                    {formatNumber(data.largestCollection.wordCount)} words
                  </span>
                </div>
              </ItemContent>
            </Item>
          ) : (
            <p className="text-muted-foreground text-sm">
              Create your first collection to get started.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Recently updated
          </h4>
          {data.recentlyUpdated.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Add or edit words to see recent updates here.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.recentlyUpdated.map(box => (
                <Item
                  key={`${box.name}-${box.lastUpdated}`}
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <li>
                    <ItemContent>
                      <ItemTitle>{box.name}</ItemTitle>
                      <ItemDescription>
                        Updated {formatRelativeTime(box.lastUpdated)}
                      </ItemDescription>
                    </ItemContent>
                    <ItemContent className="flex-none text-right">
                      <span className="text-muted-foreground text-sm">
                        {formatNumber(box.wordCount)} words
                      </span>
                    </ItemContent>
                  </li>
                </Item>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
