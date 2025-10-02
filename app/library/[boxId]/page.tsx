"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Library, Trash2, ArrowLeft, MoreHorizontal, Edit, Plus } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex-helpers/react";
import { api } from "@/convex/_generated/api";
import { PageContainer } from "@/components/page-container";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WordsTabContent } from "@/components/library/words-tab-content";
import { SentencesTabContent } from "@/components/library/sentences-tab-content";

export default function LibraryBoxDetailPage() {
  const router = useRouter();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const params = useParams<{ boxId: Id<"wordBoxes"> }>();
  const wordBoxResult = useQuery(api.wordBoxes.getWordBox, { boxId: params.boxId });

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
        <Tabs defaultValue="words">
          <TabsList>
            <TabsTrigger value="words">Words</TabsTrigger>
            <TabsTrigger value="sentences">Sentences</TabsTrigger>
          </TabsList>
          <TabsContent value="words" className="mt-4" forceMount>
            <WordsTabContent boxId={params.boxId} />
          </TabsContent>
          <TabsContent value="sentences" className="mt-4" forceMount>
            <SentencesTabContent boxId={params.boxId} />
          </TabsContent>
        </Tabs>
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
