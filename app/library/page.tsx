"use client";

import { useState } from "react";
import Link from "next/link";
import { Library, Plus, FolderOpen, ArrowRight } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex-helpers/react";
import { api } from "@/convex/_generated/api";
import { NewWordBoxDialog } from "@/components/library/new-wordbox-dialog";
import { IconOrb } from "@/components/ui/icon-orb";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function LibraryPage() {
  const [newWordBoxDialogIsOpen, setNewWordBoxDialogIsOpen] = useState(false);
  const wordBoxesResult = useQuery(api.wordBoxes.getMyWordBoxes, {});

  return (
    <>
      <PageContainer
        title="Word Library"
        description="Your personal collection of saved words"
        icon={Library}
        headerActions={
          <Button onClick={() => setNewWordBoxDialogIsOpen(true)}>
            <Plus />
            New Collection
          </Button>
        }
      >
        {wordBoxesResult.isSuccess && wordBoxesResult.data.length === 0 && (
          <Card variant="spotlight">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="default">
                  <IconOrb size="lg" icon={FolderOpen} />
                </EmptyMedia>
                <EmptyTitle>Create your first collection</EmptyTitle>
                <EmptyDescription>
                  Group related vocabulary, track progress with clarity, and bring structure to your
                  learning journey.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                  <Button
                    size="lg"
                    variant="gradient"
                    onClick={() => setNewWordBoxDialogIsOpen(true)}
                  >
                    <Plus />
                    New Collection
                  </Button>
                  <Button variant="ghost" size="lg" asChild>
                    <Link href="/">
                      Discover words
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          </Card>
        )}

        {wordBoxesResult.isSuccess && wordBoxesResult.data.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wordBoxesResult.data.map(box => {
              const wordCount = box.wordCount;
              const sentenceCount = box.sentenceCount ?? 0;

              return (
                <Link key={box._id} href={`/library/${box._id}`}>
                  <Card variant="clickable">
                    <CardHeader className="flex items-center gap-2">
                      <Library className="h-5 w-5 text-primary" />
                      <CardTitle>{box.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-muted-foreground text-sm line-clamp-1">
                        {box.description && box.description.trim().length > 0
                          ? box.description
                          : "Organize and review your saved words."}
                      </div>
                    </CardContent>
                    <CardFooter className="justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {wordCount} word{wordCount === 1 ? "" : "s"}
                        </Badge>
                        <Badge variant="secondary">
                          {sentenceCount} sentence{sentenceCount === 1 ? "" : "s"}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground flex items-center text-xs transition-transform duration-200 group-hover/card:translate-x-1">
                        Open
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </PageContainer>

      <NewWordBoxDialog open={newWordBoxDialogIsOpen} onOpenChange={setNewWordBoxDialogIsOpen} />
    </>
  );
}
