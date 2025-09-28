"use client";

import { useAdminAccess } from "@/hooks/use-admin-access";
import { PageContainer } from "@/components/page-container";
import { Shield } from "lucide-react";
import FeatureComingSoon from "@/components/feature-coming-soon";

export default function AdminPage() {
  const { hasAccess } = useAdminAccess();
  if (!hasAccess) {
    return null;
  }

  return (
    <PageContainer
      title="Admin Dashboard"
      description="Admin panel for managing the application and admin actions"
      icon={Shield}
    >
      <FeatureComingSoon />
    </PageContainer>
  );
}
