"use client";

import FeatureComingSoon from "@/components/feature-coming-soon";
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
                <FeatureComingSoon />
            </main>
        </>
    );
};