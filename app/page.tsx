"use client";

import { PageHeader } from "@/components/page-header";
import { Home } from "lucide-react";
import FeatureComingSoon from "@/components/feature-coming-soon";

export default function DashboardPage() {
  return (
    <>
      <PageHeader 
        title="Dashboard"
        description="Search and explore German words"
        icon={Home}
      />
      <main className="flex-1 p-4 md:p-6">
        <FeatureComingSoon />
      </main>
    </>
  );
}