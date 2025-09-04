"use client";

import { PageHeader } from "@/components/page-header";

export default function LearnPage() {
    return (
        <>
            <PageHeader 
                title="Learn"
                description="Start your German learning journey"
            />
            <main className="flex-1 p-4 md:p-6">
                <div>Learn Page - Protected Content</div>
            </main>
        </>
    );
};