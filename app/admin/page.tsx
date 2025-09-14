"use client";

import { useAdminAccess } from "@/hooks/use-admin-access";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Database, Settings } from "lucide-react";
import FeatureComingSoon from "@/components/feature-coming-soon";

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
            <FeatureComingSoon />
        </main>
    </>
  );
}
