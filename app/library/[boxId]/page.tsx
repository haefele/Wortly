"use client";

import { useParams } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";
import { Library } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import FeatureComingSoon from "@/components/feature-coming-soon";

export default function LibraryBoxDetailPage() {
    const params = useParams();
    const boxId = params?.boxId as Id<"wordBoxes">;

    return (
        <>
            <PageHeader 
                title="Word Collection"
                description="View and manage words in this collection"
                icon={Library}
            />
            <main className="flex-1 p-4 md:p-6">
                <FeatureComingSoon />
            </main>
        </>
    );
}


