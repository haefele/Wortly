"use client";

import { PageHeader } from "@/components/page-header";
import { GraduationCap } from "lucide-react";

export default function LearnPage() {
    return (
        <>
            <PageHeader 
                title="Learn"
                description="Start your German learning journey"
                icon={GraduationCap}
            />
            <main className="flex-1 p-4 md:p-6">
                <div>Learn Page - Protected Content</div>
            </main>
        </>
    );
};