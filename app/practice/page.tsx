"use client";

import { PageHeader } from "@/components/page-header";
import { BookOpen } from "lucide-react";

export default function PracticePage() {
    return (
        <>
            <PageHeader 
                title="Practice"
                description="Reinforce your German vocabulary"
                icon={BookOpen}
            />
            <main className="flex-1 p-4 md:p-6">
                <div>Practice Page - Coming Soon</div>
            </main>
        </>
    );
}