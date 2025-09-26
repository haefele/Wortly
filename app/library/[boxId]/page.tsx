"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Library, Trash2, ArrowLeft, MoreHorizontal, Edit, Search } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { usePaginatedQuery, useQuery } from "convex-helpers/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditWordBoxDialog } from "@/components/library/edit-wordbox-dialog";
import { DeleteWordBoxDialog } from "@/components/library/delete-wordbox-dialog";
import { WordSearch } from "@/components/dashboard/word-search";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArticleBadge } from "@/components/ui/article-badge";
import { WordTypeBadge } from "@/components/ui/word-type-badge";
import { toast } from "sonner";
import { SearchingIndicator } from "@/components/dashboard/searching-indicator";

export default function LibraryBoxDetailPage() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();

  const params = useParams<{ boxId: Id<"wordBoxes"> }>();
  const wordBoxResult = useQuery(api.functions.wordBoxes.getWordBox, { boxId: params.boxId });

  const [searchTerm, setSearchTerm] = useState("");
  const getWordsResult = usePaginatedQuery(
    api.functions.wordBoxes.getWords,
    {
      boxId: params.boxId,
      searchTerm: searchTerm,
    },
    {
      initialNumItems: 25,
    }
  );

  const addedAtFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }),
    []
  );

  const removeWord = useMutation(api.functions.wordBoxes.removeWord);
  const handleRemove = async (wordId: Id<"words">) => {
    try {
      await removeWord({ boxId: params.boxId, wordId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove word.");
    }
  };

  if (wordBoxResult.isPending) {
    return <PageHeader icon={Library} isLoading={true} />;
  }

  if (!wordBoxResult.data) {
    return (
      <>
        <PageHeader
          title="Word Collection"
          description="This collection could not be located"
          icon={Library}
        />
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Collection not found</CardTitle>
              <CardDescription>
                This collection may have been deleted or you may not have access to it.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="ghost" onClick={() => router.push("/library")}>
                <ArrowLeft />
                Back to Library
              </Button>
            </CardFooter>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={wordBoxResult.data.name}
        description={
          wordBoxResult.data.description?.trim().length
            ? wordBoxResult.data.description
            : "View and manage words in this collection"
        }
        icon={Library}
      >
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal />
                <span className="sr-only">Collection actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onSelect={() => {
                  setEditDialogOpen(true);
                }}
              >
                <Edit /> Edit collection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 />
                Delete collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageHeader>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <WordSearch wordBoxId={params.boxId} />

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle>Words in this collection</CardTitle>
              <CardDescription>
                {searchTerm.trim().length > 0
                  ? `Showing matches for "${searchTerm}".`
                  : wordBoxResult.data.wordCount === 0
                    ? "This collection has no words yet. Add your first word to get started."
                    : `Manage ${wordBoxResult.data.wordCount} word${wordBoxResult.data.wordCount === 1 ? "" : "s"} in this collection.`}
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <div className="relative md:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Search by word or translation"
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {searchTerm.trim().length > 0 && getWordsResult.isLoading ? (
              <SearchingIndicator label="Searching words..." className="py-6" size="sm" />
            ) : getWordsResult.results && getWordsResult.results.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
                {searchTerm.trim().length > 0
                  ? `No matches found for "${searchTerm}".`
                  : "This collection does not have any words yet."}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Word</TableHead>
                      <TableHead>Translations</TableHead>
                      <TableHead className="hidden text-right text-sm text-muted-foreground sm:table-cell">
                        Added
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getWordsResult.results.map(word => (
                      <TableRow key={word._id}>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <ArticleBadge article={word.article} size="sm" />
                              <span className="font-medium">{word.word}</span>
                            </div>
                            <WordTypeBadge wordType={word.wordType} size="sm" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>{word.translations.en ?? "-"}</span>
                            {word.translations.ru && (
                              <span className="text-muted-foreground">{word.translations.ru}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-right text-sm text-muted-foreground sm:table-cell">
                          {addedAtFormatter.format(new Date(word.addedAt))}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleRemove(word._id)}
                          >
                            <Trash2 />
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {getWordsResult.status === "CanLoadMore" && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => getWordsResult.loadMore(25)}
                  disabled={getWordsResult.isLoading}
                >
                  Load more
                </Button>
              </div>
            )}
            {getWordsResult.status === "LoadingMore" && (
              <SearchingIndicator label="Loading more words..." />
            )}
          </CardContent>
        </Card>
      </main>

      <EditWordBoxDialog
        boxId={params.boxId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <DeleteWordBoxDialog
        boxId={params.boxId}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDeleted={() => router.push("/library")}
      />
    </>
  );
}
