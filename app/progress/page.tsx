"use client";

import FeatureComingSoon from "@/components/feature-coming-soon";
import { PageContainer } from "@/components/page-container";
import { TrendingUp } from "lucide-react";

export default function ProgressPage() {
  return (
    <PageContainer
      title="Progress"
      description="Track your learning achievements"
      icon={TrendingUp}
    >
      <FeatureComingSoon />
    </PageContainer>
  );
}
