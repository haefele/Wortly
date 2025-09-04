"use client";

import { Library } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function LibraryPage() {
    return (
        <>
            <PageHeader 
                title="Word Library"
                description="Your personal collection of saved words"
                icon={Library}
            />
            <main className="flex-1 p-4 md:p-6">
                <div className="text-muted-foreground">
                    Your saved words will appear here. Start building your personal word library!
                </div>
            </main>
        </>
    );
}