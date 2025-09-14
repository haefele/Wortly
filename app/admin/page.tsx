"use client";

import { useAdminAccess } from "@/hooks/use-admin-access";
import { PageHeader } from "@/components/page-header";
import { Shield } from "lucide-react";
import { BulkWordAdder } from "@/components/bulk-word-adder";

export default function AdminPage() {
  const { isLoading, isAdmin } = useAdminAccess();
  if (isLoading || !isAdmin) {
    return null;
  }

  return (
    <>
        <PageHeader 
            title="Admin Dashboard"
            description="Admin panel for managing the application and admin actions"
            icon={Shield}
        />
        <main className="flex-1 p-4 md:p-6">
            <div className="flex justify-center">
                <BulkWordAdder />
            </div>
        </main>
    </>
  );
}
