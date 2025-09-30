"use client";

import { FormEvent, useState } from "react";
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
  Plus,
  ListFilter,
  Quote,
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditWordBoxDialog } from "@/components/library/edit-wordbox-dialog";
import { DeleteWordBoxDialog } from "@/components/library/delete-wordbox-dialog";
import { BulkAddWordsDialog } from "@/components/library/bulk-add-words-dialog";
import { WordSearch } from "@/components/dashboard/word-search";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { WORD_TYPES } from "@/lib/word-types";

export default function LibraryBoxDetailPage() {
  const router = useRouter();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false);

  const params = useParams<{ boxId: Id<"wordBoxes"> }>();
  const wordBoxResult = useQuery(api.wordBoxes.getWordBox, { boxId: params.boxId });

  const [searchTerm, setSearchTerm] = useState("");
  const [wordTypeFilter, setWordTypeFilter] = useState<string | undefined>();
  const getWordsResult = usePaginatedQuery(
    api.wordBoxes.getWords,
    wordBoxResult.data
      ? {
          boxId: params.boxId,
          searchTerm: searchTerm,
          wordType: wordTypeFilter,
        }
      : "skip",
    {
      initialNumItems: 25,
    }
  );

  const [sentenceSearchTerm, setSentenceSearchTerm] = useState("");
  const getSentencesResult = usePaginatedQuery(
    api.wordBoxes.getSentences,
    wordBoxResult.data
      ? {
          boxId: params.boxId,
          searchTerm: sentenceSearchTerm,
        }
      : "skip",
    {
      initialNumItems: 25,
    }
  );

  const removeSentence = useMutation(api.wordBoxes.removeSentence);
  const addSentence = useMutation(api.wordBoxes.addSentence);
  const [addingSentence, setAddingSentence] = useState(false);
  const [newSentence, setNewSentence] = useState("");
  const [removingSentenceIds, setRemovingSentenceIds] = useState<Array<Id<"wordBoxSentences">>>([]);

  const handleAddSentence = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedSentence = newSentence.trim();

    if (trimmedSentence.length === 0) {
      toast.error("Please enter a sentence before adding it.");
      return;
    }

    try {
      setAddingSentence(true);
      await addSentence({
        boxId: params.boxId,
        sentence: trimmedSentence,
      });
      setNewSentence("");
      toast.success("Sentence added to collection.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add sentence."));
    } finally {
      setAddingSentence(false);
    }
  };

  const handleRemoveSentence = async (sentenceId: Id<"wordBoxSentences">) => {
    try {
      setRemovingSentenceIds(prev => [...prev, sentenceId]);
      await removeSentence({ sentenceId });
      toast.success("Sentence removed from collection.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove sentence."));
    } finally {
      setRemovingSentenceIds(prev => prev.filter(id => id !== sentenceId));
    }
  };

  const [removingWordIds, setRemovingWordIds] = useState<string[]>([]);
  const removeWord = useMutation(api.wordBoxes.removeWord);
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
            : "View and manage words and sentences in this collection"
        }
        icon={Library}
        headerActions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onSelect={() => {
                  setEditDialogOpen(true);
                }}
              >
                <Edit /> Edit collection
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setBulkAddDialogOpen(true);
                }}
              >
                <Plus /> Add many words
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

        <Tabs defaultValue="words" className="mt-8">
          <TabsList>
            <TabsTrigger value="words">Words</TabsTrigger>
            <TabsTrigger value="sentences">Sentences</TabsTrigger>
          </TabsList>
          <TabsContent value="words">
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
                      placeholder="Search words"
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
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-3/12">German Word</TableHead>
                          <TableHead className="w-2/12">
                            <div className="flex items-center gap-2">
                              <span>Type</span>
                              {wordTypeFilter ? <>({wordTypeFilter})</> : null}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="Filter by type">
                                    <ListFilter />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                  <DropdownMenuRadioGroup
                                    value={wordTypeFilter || "all"}
                                    onValueChange={value =>
                                      setWordTypeFilter(value === "all" ? undefined : value)
                                    }
                                  >
                                    <DropdownMenuRadioItem value="all">
                                      All types
                                    </DropdownMenuRadioItem>
                                    {WORD_TYPES.map(type => (
                                      <DropdownMenuRadioItem key={type} value={type}>
                                        {type}
                                      </DropdownMenuRadioItem>
                                    ))}
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableHead>
                          <TableHead className="w-6/12">Translation</TableHead>
                          <TableHead className="w-1/12"></TableHead>
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
                            <TableCell className="text-sm">{word.translations.en || "-"}</TableCell>
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

                        {getWordsResult.results.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4}>
                              <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
                                {searchTerm.trim().length > 0 && wordTypeFilter
                                  ? `No matches found for "${searchTerm}" and type "${wordTypeFilter}".`
                                  : searchTerm.trim().length > 0
                                    ? `No matches found for "${searchTerm}".`
                                    : wordTypeFilter
                                      ? `No matches found for type "${wordTypeFilter}".`
                                      : "This collection does not have any words yet."}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
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
          </TabsContent>
          <TabsContent value="sentences">
            <Card>
              <CardHeader>
                <CardTitle>Sentences in this collection</CardTitle>
                <CardDescription>
                  {sentenceSearchTerm.trim().length > 0
                    ? `Showing matches for "${sentenceSearchTerm}".`
                    : !wordBoxResult.data.sentenceCount
                      ? "This collection has no sentences yet. Add your first sentence to get started."
                      : `Manage ${wordBoxResult.data.sentenceCount} sentence${wordBoxResult.data.sentenceCount === 1 ? "" : "s"} in this collection.`}
                </CardDescription>
                <CardAction>
                  <div className="relative md:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={sentenceSearchTerm}
                      onChange={event => setSentenceSearchTerm(event.target.value)}
                      placeholder="Search sentences"
                      className="pl-9"
                      maxLength={200}
                    />
                  </div>
                </CardAction>
              </CardHeader>

              <CardContent className="space-y-6">
                <form
                  onSubmit={handleAddSentence}
                  className="space-y-3 rounded-lg border border-dashed bg-muted/20 p-4"
                >
                  <div className="flex flex-col gap-3">
                    <Textarea
                      value={newSentence}
                      onChange={event => setNewSentence(event.target.value)}
                      placeholder="Type your German sentence"
                      className="min-h-24"
                      maxLength={280}
                      disabled={addingSentence}
                      required
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button type="submit" disabled={addingSentence}>
                        {addingSentence ? <Loader2 className="animate-spin" /> : <Plus />}
                        {addingSentence ? "Adding" : "Add sentence"}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sentences help you capture custom phrases or examples tailored to your learning.
                  </p>
                </form>

                {sentenceSearchTerm.trim().length > 0 &&
                getSentencesResult.status === "LoadingFirstPage" ? (
                  <SearchingIndicator label="Searching sentences..." className="py-6" size="sm" />
                ) : getSentencesResult.status === "LoadingFirstPage" ? (
                  <SearchingIndicator label="Loading sentences..." className="py-6" size="sm" />
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10/12">Sentence</TableHead>
                          <TableHead className="w-2/12 text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getSentencesResult.results.map(sentence => (
                          <TableRow key={sentence._id}>
                            <TableCell>
                              <div className="flex items-start gap-3">
                                <Quote className="mt-1 h-4 w-4 text-muted-foreground" />
                                <p className="max-w-2xl whitespace-pre-wrap text-sm leading-relaxed">
                                  {sentence.sentence}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Remove sentence"
                                    onClick={() => handleRemoveSentence(sentence._id)}
                                    disabled={removingSentenceIds.includes(sentence._id)}
                                  >
                                    {removingSentenceIds.includes(sentence._id) ? (
                                      <Loader2 className="animate-spin" />
                                    ) : (
                                      <Trash2 />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remove sentence from collection.</TooltipContent>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}

                        {getSentencesResult.results.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2}>
                              <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
                                {sentenceSearchTerm.trim().length > 0
                                  ? `No matches found for "${sentenceSearchTerm}".`
                                  : "This collection does not have any sentences yet."}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {getSentencesResult.status === "CanLoadMore" && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => getSentencesResult.loadMore(25)}
                      disabled={getSentencesResult.isLoading}
                    >
                      <ChevronDown />
                      Load more sentences
                    </Button>
                  </div>
                )}
                {getSentencesResult.status === "LoadingMore" && (
                  <SearchingIndicator
                    size="sm"
                    className="py-2"
                    label="Loading more sentences..."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>

      <EditWordBoxDialog
        boxId={params.boxId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <BulkAddWordsDialog
        boxId={params.boxId}
        open={bulkAddDialogOpen}
        onOpenChange={setBulkAddDialogOpen}
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
