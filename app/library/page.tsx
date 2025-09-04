"use client";

import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function LibraryPage() {
    return (
        <>
            <PageHeader 
                title="Word Library"
                description="Your personal collection of saved words"
                actions={
                    <>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Word
                        </Button>
                    </>
                }
            />
            <main className="flex-1 p-4 md:p-6">
                <div className="text-muted-foreground">
                    Your saved words will appear here. Start building your personal word library!
                </div>
            </main>
        </>
    );
}