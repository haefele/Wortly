"use client";

import { Library } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import FeatureComingSoon from "@/components/feature-coming-soon";

export default function LibraryPage() {
    return (
        <>
            <PageHeader 
                title="Word Library"
                description="Your personal collection of saved words"
                icon={Library}
            />
            <main className="flex-1 p-4 md:p-6">
                <FeatureComingSoon />
            </main>
        </>
    );
}