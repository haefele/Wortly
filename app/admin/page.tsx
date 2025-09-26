"use client";

import { useAdminAccess } from "@/hooks/use-admin-access";
import { PageContainer } from "@/components/page-container";
import { Shield } from "lucide-react";
import { BulkWordAdder } from "@/components/admin/bulk-word-adder";

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
      <div className="flex justify-center">
        <BulkWordAdder />
      </div>
    </PageContainer>
  );
}
