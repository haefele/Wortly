"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Library,
  Trash2,
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Search,
  Loader2,
  ChevronDown,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { usePaginatedQuery, useQuery } from "convex-helpers/react";
import { api } from "@/convex/_generated/api";
import { PageContainer } from "@/components/page-container";
import {
  Card,
  CardAction,
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
import { getErrorMessage } from "@/lib/utils";
import { SearchingIndicator } from "@/components/dashboard/searching-indicator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function LibraryBoxDetailPage() {
  const router = useRouter();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const params = useParams<{ boxId: Id<"wordBoxes"> }>();
  const wordBoxResult = useQuery(api.functions.wordBoxes.getWordBox, { boxId: params.boxId });

  const [searchTerm, setSearchTerm] = useState("");
  const getWordsResult = usePaginatedQuery(
    api.functions.wordBoxes.getWords,
    wordBoxResult.data
      ? {
          boxId: params.boxId,
          searchTerm: searchTerm,
        }
      : "skip",
    {
      initialNumItems: 25,
    }
  );

  const [removingWordIds, setRemovingWordIds] = useState<string[]>([]);
  const removeWord = useMutation(api.functions.wordBoxes.removeWord);
  const handleRemove = async (wordId: Id<"words">) => {
    try {
      setRemovingWordIds(prev => [...prev, wordId]);
      await removeWord({ boxId: params.boxId, wordId });
      toast.success("Word removed from collection.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove word."));
    } finally {
      setRemovingWordIds(prev => {
        const updated = [...prev];
        updated.splice(updated.indexOf(wordId), 1);
        return updated;
      });
    }
  };

  if (wordBoxResult.isPending) {
    return (
      <PageContainer icon={Library} isLoading={true}>
        <div />
      </PageContainer>
    );
  }

  if (!wordBoxResult.data) {
    return (
      <PageContainer
        title="Collection"
        description="This collection could not be located."
        icon={Library}
      >
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Collection not found</CardTitle>
            <CardDescription>
              This collection may have been deleted or you may not have access to it.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/library")}>
              <ArrowLeft />
              Back to Word Library
            </Button>
          </CardFooter>
        </Card>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer
        title={wordBoxResult.data.name}
        description={
          wordBoxResult.data.description?.trim().length
            ? wordBoxResult.data.description
            : "View and manage words in this collection"
        }
        icon={Library}
        headerActions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal />
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
        }
      >
        <WordSearch wordBoxId={params.boxId} />

        <Card>
          <CardHeader>
            <CardTitle>Words in this collection</CardTitle>
            <CardDescription>
              {searchTerm.trim().length > 0
                ? `Showing matches for "${searchTerm}".`
                : wordBoxResult.data.wordCount === 0
                  ? "This collection has no words yet. Add your first word to get started."
                  : `Manage ${wordBoxResult.data.wordCount} word${wordBoxResult.data.wordCount === 1 ? "" : "s"} in this collection.`}
            </CardDescription>
            <CardAction>
              <div className="relative md:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Search by word or translation"
                  className="pl-9"
                  maxLength={50}
                />
              </div>
            </CardAction>
          </CardHeader>

          <CardContent className="space-y-6">
            {searchTerm.trim().length > 0 && getWordsResult.status === "LoadingFirstPage" ? (
              <SearchingIndicator label="Searching words..." className="py-6" size="sm" />
            ) : getWordsResult.status === "LoadingFirstPage" ? (
              <SearchingIndicator label="Loading words..." className="py-6" size="sm" />
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
                      <TableHead>German Word</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Translation</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getWordsResult.results.map(word => (
                      <TableRow key={word._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ArticleBadge article={word.article} size="sm" />
                            <span className="font-semibold">{word.word}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <WordTypeBadge wordType={word.wordType} size="sm" />
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="max-w-[16rem] truncate">
                            {word.translations.en || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                disabled={removingWordIds.includes(word._id)}
                                onClick={() => handleRemove(word._id)}
                              >
                                {removingWordIds.includes(word._id) ? (
                                  <Loader2 className="animate-spin" />
                                ) : (
                                  <Trash2 />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove word from collection.</TooltipContent>
                          </Tooltip>
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
                  size="sm"
                  onClick={() => getWordsResult.loadMore(25)}
                  disabled={getWordsResult.isLoading}
                >
                  <ChevronDown />
                  Load more words
                </Button>
              </div>
            )}
            {getWordsResult.status === "LoadingMore" && (
              <SearchingIndicator size="sm" className="py-2" label="Loading more words..." />
            )}
          </CardContent>
        </Card>
      </PageContainer>

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
