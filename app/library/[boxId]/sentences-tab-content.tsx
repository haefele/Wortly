"use client";

import { FormEvent, useState } from "react";
import { usePaginatedQuery, useQuery } from "convex-helpers/react";
import { useMutation } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SearchingIndicator } from "@/components/searching-indicator";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { ChevronDown, Plus, Search, Trash2 } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

interface SentencesTabContentProps {
  boxId: Id<"wordBoxes">;
}

export function SentencesTabContent({ boxId }: SentencesTabContentProps) {
  const wordBoxResult = useQuery(api.wordBoxes.getWordBox, { boxId });
  const sentenceCount = wordBoxResult.data?.sentenceCount ?? 0;

  const [sentenceSearchTerm, setSentenceSearchTerm] = useState("");
  const [newSentence, setNewSentence] = useState("");
  const [addingSentence, setAddingSentence] = useState(false);
  const [removingSentenceIds, setRemovingSentenceIds] = useState<Array<Id<"wordBoxSentences">>>([]);

  const getSentencesResult = usePaginatedQuery(
    api.wordBoxes.getSentences,
    {
      boxId,
      searchTerm: sentenceSearchTerm,
    },
    {
      initialNumItems: 25,
    }
  );

  const addSentence = useMutation(api.wordBoxes.addSentence);
  const removeSentence = useMutation(api.wordBoxes.removeSentence);

  const handleAddSentence = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedSentence = newSentence.trim();

    if (trimmedSentence.length === 0) {
      toast.error("Please enter a sentence before adding it.");
      return;
    }

    try {
      setAddingSentence(true);
      await addSentence({ boxId, sentence: trimmedSentence });
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

  const trimmedSentenceSearchTerm = sentenceSearchTerm.trim();
  const sentencesEmptyTitle =
    trimmedSentenceSearchTerm.length > 0 ? "No matching sentences" : "Add your first sentence";
  const sentencesEmptyDescription =
    trimmedSentenceSearchTerm.length > 0
      ? `No matches found for "${trimmedSentenceSearchTerm}".`
      : "This collection does not have any sentences yet.";

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-20 -mx-1 sm:mx-0">
        <Card variant="toolbar">
          <div className="flex flex-wrap items-center gap-3 md:flex-1">
            <InputGroup className="w-full sm:w-56">
              <InputGroupAddon>
                <Search className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                value={sentenceSearchTerm}
                onChange={event => setSentenceSearchTerm(event.target.value)}
                placeholder="Filter sentences"
                maxLength={200}
                aria-label="Filter sentences in this collection"
              />
            </InputGroup>
          </div>

          <form onSubmit={handleAddSentence} className="flex w-full md:flex-1">
            <InputGroup className="w-full md:flex-1">
              <InputGroupInput
                value={newSentence}
                onChange={event => setNewSentence(event.target.value)}
                placeholder="Add a German sentence"
                maxLength={280}
                disabled={addingSentence}
                aria-label="Add a German sentence"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton type="submit" disabled={addingSentence}>
                  {addingSentence ? <Spinner className="size-4" /> : <Plus />}
                  <span className="sr-only">Add sentence</span>
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sentences in this collection</CardTitle>
          <CardDescription>
            {sentenceSearchTerm.trim().length > 0
              ? `Showing matches for "${sentenceSearchTerm}".`
              : !sentenceCount
                ? "This collection has no sentences yet. Add your first sentence to get started."
                : "Manage sentences in this collection."}
          </CardDescription>
          <CardAction className="self-center">
            <Badge key={sentenceCount} variant="secondary" className="animate-badge-pop">
              {sentenceCount} {sentenceCount === 1 ? "sentence" : "sentences"}
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-6">
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
                        <span>{sentence.sentence}</span>
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
                                <Spinner className="size-4" />
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
                      <TableCell colSpan={2} className="p-0">
                        <Empty className="border border-dashed bg-muted/30 py-12">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <Search className="text-muted-foreground" />
                            </EmptyMedia>
                            <EmptyTitle>{sentencesEmptyTitle}</EmptyTitle>
                            <EmptyDescription>{sentencesEmptyDescription}</EmptyDescription>
                          </EmptyHeader>
                        </Empty>
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
            <SearchingIndicator size="sm" className="py-2" label="Loading more sentences..." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
