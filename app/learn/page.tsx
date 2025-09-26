"use client";

import FeatureComingSoon from "@/components/feature-coming-soon";
import { PageContainer } from "@/components/page-container";
import { GraduationCap } from "lucide-react";

export default function LearnPage() {
  return (
    <PageContainer
      title="Learn"
      description="Start your German learning journey"
      icon={GraduationCap}
    >
      <FeatureComingSoon />
    </PageContainer>
  );
}
