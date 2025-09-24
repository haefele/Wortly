"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Library, Plus, Trash2, ArrowLeft, MoreHorizontal, Edit } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditWordBoxDialog } from "@/components/library/edit-wordbox-dialog";

export default function LibraryBoxDetailPage() {
  const params = useParams<{ boxId: Id<"wordBoxes"> }>();
  const router = useRouter();

  const wordBoxResult = useQuery(api.functions.wordBoxes.getWordBox, { boxId: params.boxId });
  const deleteWordBox = useMutation(api.functions.wordBoxes.deleteWordBox);

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setGlobalError(null);

    try {
      await deleteWordBox({ boxId: params.boxId });
      router.push("/library");
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Failed to delete collection");
      setIsDeleting(false);
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
        <main className="flex-1 p-4 md:p-6">
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Collection not found</CardTitle>
              <CardDescription>
                This collection may have been deleted or you may not have access to it.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="ghost" onClick={() => router.push("/library")}>
                <ArrowLeft className="h-4 w-4" />
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
          <Button variant="default">
            <Plus />
            Add words
          </Button>
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
        {globalError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {globalError}
          </div>
        )}
      </main>

      <EditWordBoxDialog
        boxId={params.boxId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this collection?</DialogTitle>
            <DialogDescription>
              This will remove the collection and all of its assignments. The words themselves
              remain available in your library.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting" : "Delete now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
