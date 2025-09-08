"use client";

import FeatureComingSoon from "@/components/feature-coming-soon";
import { PageHeader } from "@/components/page-header";
import { TrendingUp } from "lucide-react";

export default function ProgressPage() {
    return (
        <>
            <PageHeader 
                title="Progress"
                description="Track your learning achievements"
                icon={TrendingUp}
            />
            <main className="flex-1 p-4 md:p-6">
                <FeatureComingSoon />
            </main>
        </>
    );
}