"use client";

import { PageContainer } from "@/components/page-container";
import { TrendingUp } from "lucide-react";
import { StreakCard } from "./streak-card";
import { OverallStatsCard } from "./overall-stats-card";
import { AverageScoreCard } from "./average-score-card";
import { PerformanceStreakCard } from "./performance-streak-card";
import { CollectionStatsCard } from "./collection-stats-card";
import { PerformanceChartCard } from "./performance-chart-card";
import { WeeklyActivityCard } from "./weekly-activity-card";
import { SessionBreakdownCard } from "./session-breakdown-card";
import { LearningVelocityCard } from "./learning-velocity-card";
import { ArticleMasteryCard } from "./article-mastery-card";
import { MostPracticedCollectionsCard } from "./most-practiced-collections-card";
import { RecentActivityCard } from "./recent-activity-card";

export default function ProgressPage() {
  return (
    <PageContainer
      title="Progress"
      description="Track your learning achievements"
      icon={TrendingUp}
    >
      <div className="grid gap-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <StreakCard />
          <OverallStatsCard className="lg:col-span-2" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <AverageScoreCard />
          <PerformanceStreakCard />
          <CollectionStatsCard />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <PerformanceChartCard className="lg:col-span-2" />
          <WeeklyActivityCard />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <SessionBreakdownCard className="lg:col-span-2" />
          <LearningVelocityCard />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ArticleMasteryCard />
          <MostPracticedCollectionsCard />
        </div>

        <RecentActivityCard />
      </div>
    </PageContainer>
  );
}
