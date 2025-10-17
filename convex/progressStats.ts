import { query, QueryCtx } from "./_generated/server";
import { getCurrentUser } from "./users";
import { Doc, Id } from "./_generated/dataModel";
import { getStartOfDay, subtractDays } from "./lib/dates";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const RECENT_WINDOW_DAYS = 30;
const PERFORMANCE_THRESHOLD = 80;
const TREND_DELTA_THRESHOLD = 0.5;

type PracticeSessionDoc = Doc<"practiceSessions">;
type WordBoxDoc = Doc<"wordBoxes">;
type WordAssignmentDoc = Doc<"wordBoxAssignments">;
type SentenceDoc = Doc<"wordBoxSentences">;

interface PracticeSessionMetrics {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  accuracy: number;
}

function getThirtyDayWindowBounds(now: number) {
  const todayStart = getStartOfDay(now);
  const currentWindowStart = subtractDays(todayStart, RECENT_WINDOW_DAYS - 1);
  const previousWindowEnd = subtractDays(currentWindowStart, 1);
  const previousWindowStart = subtractDays(previousWindowEnd, RECENT_WINDOW_DAYS - 1);

  return {
    todayStart,
    currentWindowStart,
    previousWindowStart,
    previousWindowEnd,
  };
}

function getRecentWindowStart(now: number) {
  return subtractDays(getStartOfDay(now), RECENT_WINDOW_DAYS - 1);
}

function calculateSessionMetrics(session: PracticeSessionDoc): PracticeSessionMetrics {
  const questions = session.multipleChoice.questions ?? [];

  const totalQuestions = questions.length;
  let answeredQuestions = 0;
  let correctAnswers = 0;

  for (const question of questions) {
    if (question.selectedAnswerIndex !== undefined) {
      answeredQuestions += 1;
      if (question.selectedAnswerIndex === question.correctAnswerIndex) {
        correctAnswers += 1;
      }
    }
  }

  const accuracy = totalQuestions === 0 ? 0 : (correctAnswers / totalQuestions) * 100;

  return {
    totalQuestions,
    answeredQuestions,
    correctAnswers,
    accuracy,
  };
}

function toDateKey(timestamp: number) {
  const dayStart = getStartOfDay(timestamp);
  return new Date(dayStart).toISOString().slice(0, 10);
}

async function getUserWordBoxes(ctx: QueryCtx, userId: Id<"users">) {
  return await ctx.db
    .query("wordBoxes")
    .withIndex("by_userId", q => q.eq("userId", userId))
    .collect();
}

async function getUserPracticeSessions(ctx: QueryCtx, userId: Id<"users">) {
  return await ctx.db
    .query("practiceSessions")
    .withIndex("by_userId_and_createdAt", q => q.eq("userId", userId))
    .order("desc")
    .collect();
}

async function getAssignmentsForBoxes(ctx: QueryCtx, boxIds: Id<"wordBoxes">[]) {
  const assignments: WordAssignmentDoc[] = [];

  for (const boxId of boxIds) {
    const boxAssignments = await ctx.db
      .query("wordBoxAssignments")
      .withIndex("by_boxId", q => q.eq("boxId", boxId))
      .collect();
    assignments.push(...boxAssignments);
  }

  return assignments;
}

async function getSentencesForBoxes(ctx: QueryCtx, boxIds: Id<"wordBoxes">[]) {
  const sentences: SentenceDoc[] = [];

  for (const boxId of boxIds) {
    const boxSentences = await ctx.db
      .query("wordBoxSentences")
      .withIndex("by_boxId_addedAt", q => q.eq("boxId", boxId))
      .collect();
    sentences.push(...boxSentences);
  }

  return sentences;
}

async function getWord(ctx: QueryCtx, wordId: Id<"words">) {
  const word = await ctx.db.get(wordId);
  return word ?? null;
}

export const getOverallStats = query({
  args: {},
  handler: async ctx => {
    const user = await getCurrentUser(ctx);

    const wordBoxes = await getUserWordBoxes(ctx, user._id);
    const practiceSessions = await getUserPracticeSessions(ctx, user._id);

    const totalWordBoxes = wordBoxes.length;
    const totalWords = wordBoxes.reduce((sum, box) => sum + box.wordCount, 0);
    const totalSentences = wordBoxes.reduce((sum, box) => sum + (box.sentenceCount ?? 0), 0);
    const totalPracticeSessions = practiceSessions.length;
    const totalQuestionsAnswered = practiceSessions.reduce((sum, session) => {
      const metrics = calculateSessionMetrics(session);
      return sum + metrics.answeredQuestions;
    }, 0);

    return {
      totalWordBoxes,
      totalWords,
      totalSentences,
      totalPracticeSessions,
      totalQuestionsAnswered,
      memberSince: user._creationTime,
    };
  },
});

export const getRecentPerformance = query({
  args: {},
  handler: async ctx => {
    const user = await getCurrentUser(ctx);

    const sessions = await getUserPracticeSessions(ctx, user._id);
    const now = Date.now();
    const windowStart = getRecentWindowStart(now);

    const recent = sessions
      .filter(session => session.createdAt >= windowStart)
      .map(session => {
        const metrics = calculateSessionMetrics(session);

        return {
          sessionId: session._id,
          createdAt: session.createdAt,
          accuracy: metrics.accuracy,
          sessionType: session.type,
          questionType: session.multipleChoice.type,
        };
      })
      .filter(item => item.createdAt !== undefined)
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-14);

    return {
      sessions: recent,
    };
  },
});

export const getSessionBreakdown = query({
  args: {},
  handler: async ctx => {
    const user = await getCurrentUser(ctx);
    const sessions = await getUserPracticeSessions(ctx, user._id);
    const now = Date.now();
    const windowStart = getRecentWindowStart(now);

    const grouping = new Map<
      string,
      {
        practiceSessionType: string;
        multipleChoiceType?: string;
        totalSessions: number;
        totalAccuracy: number;
        bestScore: number;
      }
    >();

    for (const session of sessions) {
      if (session.createdAt < windowStart) {
        continue;
      }

      const metrics = calculateSessionMetrics(session);
      if (metrics.totalQuestions === 0) {
        continue;
      }

      const groupKey = `${session.type}:${session.multipleChoice.type ?? "unknown"}`;
      const existing = grouping.get(groupKey);

      if (!existing) {
        grouping.set(groupKey, {
          practiceSessionType: session.type,
          multipleChoiceType: session.multipleChoice.type,
          totalSessions: 1,
          totalAccuracy: metrics.accuracy,
          bestScore: metrics.accuracy,
        });
      } else {
        existing.totalSessions += 1;
        existing.totalAccuracy += metrics.accuracy;
        existing.bestScore = Math.max(existing.bestScore, metrics.accuracy);
      }
    }

    const byType = Array.from(grouping.values()).map(group => ({
      practiceSessionType: group.practiceSessionType,
      multipleChoiceType: group.multipleChoiceType,
      totalSessions: group.totalSessions,
      averageAccuracy: group.totalSessions === 0 ? 0 : group.totalAccuracy / group.totalSessions,
      bestScore: group.bestScore,
    }));

    byType.sort((a, b) => b.totalSessions - a.totalSessions);

    return { byType };
  },
});

export const getWeeklyActivity = query({
  args: {},
  handler: async ctx => {
    const user = await getCurrentUser(ctx);
    const sessions = await getUserPracticeSessions(ctx, user._id);
    const now = Date.now();
    const windowStart = getRecentWindowStart(now);

    const activityMap = new Map<
      string,
      { date: string; sessionCount: number; totalQuestions: number; totalAccuracy: number }
    >();

    for (const session of sessions) {
      if (session.createdAt < windowStart) {
        continue;
      }

      const metrics = calculateSessionMetrics(session);
      const dateKey = toDateKey(session.createdAt);

      const existing = activityMap.get(dateKey);
      if (!existing) {
        activityMap.set(dateKey, {
          date: dateKey,
          sessionCount: 1,
          totalQuestions: metrics.answeredQuestions,
          totalAccuracy: metrics.accuracy,
        });
      } else {
        existing.sessionCount += 1;
        existing.totalQuestions += metrics.answeredQuestions;
        existing.totalAccuracy += metrics.accuracy;
      }
    }

    const todayStart = getStartOfDay(now);
    const start = subtractDays(todayStart, RECENT_WINDOW_DAYS - 1);

    const dailyActivity = [];
    for (let day = start; day <= todayStart; day += MILLISECONDS_PER_DAY) {
      const dateKey = toDateKey(day);
      const entry = activityMap.get(dateKey);
      if (!entry) {
        dailyActivity.push({
          date: dateKey,
          sessionCount: 0,
          totalQuestions: 0,
          averageAccuracy: 0,
        });
      } else {
        const averageAccuracy =
          entry.sessionCount === 0 ? 0 : entry.totalAccuracy / entry.sessionCount;
        dailyActivity.push({
          date: dateKey,
          sessionCount: entry.sessionCount,
          totalQuestions: entry.totalQuestions,
          averageAccuracy,
        });
      }
    }

    return { dailyActivity };
  },
});

export const getAverageScore = query({
  args: {},
  handler: async ctx => {
    const user = await getCurrentUser(ctx);

    const sessions = await getUserPracticeSessions(ctx, user._id);
    const { currentWindowStart, previousWindowStart, previousWindowEnd } = getThirtyDayWindowBounds(
      Date.now()
    );

    let currentTotalAccuracy = 0;
    let currentCount = 0;
    let previousTotalAccuracy = 0;
    let previousCount = 0;

    for (const session of sessions) {
      const metrics = calculateSessionMetrics(session);
      if (metrics.totalQuestions === 0) {
        continue;
      }

      if (session.createdAt >= currentWindowStart) {
        currentTotalAccuracy += metrics.accuracy;
        currentCount += 1;
      } else if (
        session.createdAt >= previousWindowStart &&
        session.createdAt <= previousWindowEnd
      ) {
        previousTotalAccuracy += metrics.accuracy;
        previousCount += 1;
      }
    }

    const currentAverageAccuracy = currentCount === 0 ? 0 : currentTotalAccuracy / currentCount;
    const previousAverageAccuracy = previousCount === 0 ? 0 : previousTotalAccuracy / previousCount;

    let trend: "up" | "down" | "stable" = "stable";
    let trendPercentage = 0;

    if (previousAverageAccuracy === 0) {
      trend =
        currentAverageAccuracy === 0
          ? "stable"
          : ("up" as const);
      trendPercentage = currentAverageAccuracy === 0 ? 0 : 100;
    } else {
      const delta = currentAverageAccuracy - previousAverageAccuracy;
      const percentageChange = (delta / previousAverageAccuracy) * 100;

      if (Math.abs(delta) <= TREND_DELTA_THRESHOLD) {
        trend = "stable";
        trendPercentage = 0;
      } else if (delta > 0) {
        trend = "up";
        trendPercentage = percentageChange;
      } else if (delta < 0) {
        trend = "down";
        trendPercentage = Math.abs(percentageChange);
      }
    }

    return {
      averageAccuracy: currentAverageAccuracy,
      totalSessions: currentCount,
      trend,
      trendPercentage,
    };
  },
});

export const getCollectionStats = query({
  args: {},
  handler: async ctx => {
    const user = await getCurrentUser(ctx);

    const wordBoxes = await getUserWordBoxes(ctx, user._id);
    const boxIds = wordBoxes.map(box => box._id);

    const assignments = await getAssignmentsForBoxes(ctx, boxIds);

    const totalCollections = wordBoxes.length;
    const totalWords = wordBoxes.reduce((sum, box) => sum + box.wordCount, 0);
    const totalSentences = wordBoxes.reduce((sum, box) => sum + (box.sentenceCount ?? 0), 0);

    let largestCollection: { name: string; wordCount: number } | null = null;
    for (const box of wordBoxes) {
      if (!largestCollection || box.wordCount > largestCollection.wordCount) {
        largestCollection = {
          name: box.name,
          wordCount: box.wordCount,
        };
      }
    }

    const boxLastUpdated = new Map<Id<"wordBoxes">, number>();
    for (const assignment of assignments) {
      const key = assignment.boxId;
      const existing = boxLastUpdated.get(key);
      if (!existing || assignment.addedAt > existing) {
        boxLastUpdated.set(key, assignment.addedAt);
      }
    }

    const recentlyUpdated = wordBoxes
      .map(box => {
        const lastUpdated = boxLastUpdated.get(box._id) ?? box._creationTime;
        return {
          name: box.name,
          wordCount: box.wordCount,
          lastUpdated,
        };
      })
      .sort((a, b) => b.lastUpdated - a.lastUpdated)
      .slice(0, 3);

    return {
      totalCollections,
      totalWords,
      totalSentences,
      largestCollection,
      recentlyUpdated,
    };
  },
});

export const getRecentActivity = query({
  args: {},
  handler: async ctx => {
    const user = await getCurrentUser(ctx);

    const wordBoxes = await getUserWordBoxes(ctx, user._id);
    const boxIdToBox = new Map<Id<"wordBoxes">, WordBoxDoc>();
    for (const box of wordBoxes) {
      boxIdToBox.set(box._id, box);
    }

    const boxIds = wordBoxes.map(box => box._id);
    const assignments = await getAssignmentsForBoxes(ctx, boxIds);
    const sentences = await getSentencesForBoxes(ctx, boxIds);
    const practiceSessions = await getUserPracticeSessions(ctx, user._id);

    const now = Date.now();
    const windowStart = getRecentWindowStart(now);
    const activities: Array<{
      type:
        | "session_completed"
        | "word_added"
        | "sentence_added"
        | "collection_created";
      timestamp: number;
      details: Record<string, unknown>;
    }> = [];

    for (const session of practiceSessions) {
      if (session.createdAt < windowStart) {
        continue;
      }

      const metrics = calculateSessionMetrics(session);
      const wordBoxName = session.multipleChoice.wordBoxName;

      activities.push({
        type: "session_completed",
        timestamp: session.completedAt ?? session.createdAt,
        details: {
          collectionName: wordBoxName,
          accuracy: metrics.accuracy,
          questionCount: metrics.totalQuestions,
        },
      });
    }

    for (const assignment of assignments) {
      if (assignment.addedAt < windowStart) {
        continue;
      }

      const word = assignment.wordId ? await getWord(ctx, assignment.wordId) : null;
      const box = boxIdToBox.get(assignment.boxId);

      activities.push({
        type: "word_added",
        timestamp: assignment.addedAt,
        details: {
          word: word?.word,
          boxName: box?.name,
        },
      });
    }

    for (const sentence of sentences) {
      if (sentence.addedAt < windowStart) {
        continue;
      }

      const box = boxIdToBox.get(sentence.boxId);

      activities.push({
        type: "sentence_added",
        timestamp: sentence.addedAt,
        details: {
          sentence: sentence.sentence,
          boxName: box?.name,
        },
      });
    }

    for (const box of wordBoxes) {
      if (box._creationTime < windowStart) {
        continue;
      }

      activities.push({
        type: "collection_created",
        timestamp: box._creationTime,
        details: {
          collectionName: box.name,
        },
      });
    }

    activities.sort((a, b) => b.timestamp - a.timestamp);

    return {
      activities: activities.slice(0, 10),
    };
  },
});

export const getLearningVelocity = query({
  args: {},
  handler: async ctx => {
    const user = await getCurrentUser(ctx);

    const wordBoxes = await getUserWordBoxes(ctx, user._id);
    const assignments = await getAssignmentsForBoxes(
      ctx,
      wordBoxes.map(box => box._id)
    );

    const sortedAssignments = assignments
      .filter(assignment => assignment.addedAt !== undefined && assignment.addedAt !== null)
      .sort((a, b) => a.addedAt - b.addedAt);

    if (sortedAssignments.length === 0) {
      return { dataPoints: [] };
    }

    const pointsMap = new Map<string, { date: string; wordsAddedInPeriod: number }>();
    const startDate = getStartOfDay(sortedAssignments[0].addedAt);
    const now = getStartOfDay(Date.now());

    function periodKey(timestamp: number) {
      const dayStart = getStartOfDay(timestamp);
      const weekIndex = Math.floor((dayStart - startDate) / (7 * MILLISECONDS_PER_DAY));
      const periodStart = startDate + weekIndex * 7 * MILLISECONDS_PER_DAY;
      return new Date(periodStart).toISOString().slice(0, 10);
    }

    for (const assignment of sortedAssignments) {
      const key = periodKey(assignment.addedAt);
      const entry = pointsMap.get(key);
      if (entry) {
        entry.wordsAddedInPeriod += 1;
      } else {
        pointsMap.set(key, { date: key, wordsAddedInPeriod: 1 });
      }
    }

    const sortedKeys = Array.from(pointsMap.keys()).sort();
    const dataPoints = [];
    let cumulativeWords = 0;

    for (const key of sortedKeys) {
      const entry = pointsMap.get(key)!;
      cumulativeWords += entry.wordsAddedInPeriod;
      dataPoints.push({
        date: key,
        cumulativeWords,
        wordsAddedInPeriod: entry.wordsAddedInPeriod,
      });
    }

    return { dataPoints };
  },
});

export const getPerformanceStreaks = query({
  args: {},
  handler: async ctx => {
    const user = await getCurrentUser(ctx);
    const sessions = await getUserPracticeSessions(ctx, user._id);
    const now = Date.now();
    const windowStart = getRecentWindowStart(now);

    const filteredSessions = sessions
      .filter(session => session.createdAt >= windowStart)
      .sort((a, b) => a.createdAt - b.createdAt);

    let currentHighPerformanceStreak = 0;
    let bestHighPerformanceStreak = 0;
    let tempStreak = 0;
    let perfectScoreSessions = 0;

    for (const session of filteredSessions) {
      const metrics = calculateSessionMetrics(session);
      if (metrics.totalQuestions === 0) {
        continue;
      }

      if (metrics.accuracy === 100) {
        perfectScoreSessions += 1;
      }

      if (metrics.accuracy >= PERFORMANCE_THRESHOLD) {
        tempStreak += 1;
        bestHighPerformanceStreak = Math.max(bestHighPerformanceStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    if (filteredSessions.length > 0) {
      const lastSession = filteredSessions[filteredSessions.length - 1];
      const lastMetrics = calculateSessionMetrics(lastSession);
      if (lastMetrics.accuracy >= PERFORMANCE_THRESHOLD) {
        let streak = 0;
        for (let i = filteredSessions.length - 1; i >= 0; i -= 1) {
          const metrics = calculateSessionMetrics(filteredSessions[i]);
          if (metrics.accuracy >= PERFORMANCE_THRESHOLD) {
            streak += 1;
          } else {
            break;
          }
        }
        currentHighPerformanceStreak = streak;
      }
    }

    return {
      currentHighPerformanceStreak,
      bestHighPerformanceStreak,
      perfectScoreSessions,
    };
  },
});

export const getArticleMastery = query({
  args: {},
  handler: async ctx => {
    const user = await getCurrentUser(ctx);
    const sessions = await getUserPracticeSessions(ctx, user._id);
    const now = Date.now();
    const windowStart = getRecentWindowStart(now);

    const articleStats = new Map<
      string,
      { article: string; totalQuestions: number; correctAnswers: number }
    >();
    const confusionMap = new Map<
      string,
      { word: string; correctArticle: string; incorrectArticle: string; occurrences: number }
    >();

    for (const session of sessions) {
      if (
        session.createdAt < windowStart ||
        session.multipleChoice.type !== "german_substantive_choose_article"
      ) {
        continue;
      }

      for (const question of session.multipleChoice.questions) {
        if (question.correctAnswerIndex === undefined) {
          continue;
        }

        const correctArticle = question.answers[question.correctAnswerIndex]?.text;
        if (!correctArticle) {
          continue;
        }

        const stats = articleStats.get(correctArticle) ?? {
          article: correctArticle,
          totalQuestions: 0,
          correctAnswers: 0,
        };
        stats.totalQuestions += 1;

        if (question.selectedAnswerIndex === question.correctAnswerIndex) {
          stats.correctAnswers += 1;
        } else if (question.selectedAnswerIndex !== undefined) {
          const selectedArticle = question.answers[question.selectedAnswerIndex]?.text;
          if (selectedArticle) {
            const word = question.wordId ? await getWord(ctx, question.wordId) : null;
            const key = `${question.wordId ?? question.question}-${correctArticle}-${selectedArticle}`;
            const confusion =
              confusionMap.get(key) ?? {
                word: word?.word ?? question.question,
                correctArticle,
                incorrectArticle: selectedArticle,
                occurrences: 0,
              };
            confusion.occurrences += 1;
            confusionMap.set(key, confusion);
          }
        }

        articleStats.set(correctArticle, stats);
      }
    }

    const byArticle = Array.from(articleStats.values()).map(stat => ({
      ...stat,
      accuracy: stat.totalQuestions === 0 ? 0 : (stat.correctAnswers / stat.totalQuestions) * 100,
    }));

    if (byArticle.length === 0) {
      return {
        byArticle: [],
        overallAccuracy: 0,
        mostConfusedWords: [],
      };
    }

    const totalCorrect = byArticle.reduce((sum, stat) => sum + stat.correctAnswers, 0);
    const totalQuestions = byArticle.reduce((sum, stat) => sum + stat.totalQuestions, 0);

    const mostConfusedWords = Array.from(confusionMap.values())
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 5);

    return {
      byArticle,
      overallAccuracy: totalQuestions === 0 ? 0 : (totalCorrect / totalQuestions) * 100,
      mostConfusedWords,
    };
  },
});

export const getMostPracticedCollections = query({
  args: {},
  handler: async ctx => {
    const user = await getCurrentUser(ctx);
    const sessions = await getUserPracticeSessions(ctx, user._id);
    const wordBoxes = await getUserWordBoxes(ctx, user._id);
    const now = Date.now();
    const windowStart = getRecentWindowStart(now);

    const boxMap = new Map<Id<"wordBoxes">, WordBoxDoc>();
    for (const box of wordBoxes) {
      boxMap.set(box._id, box);
    }

    const boxStats = new Map<
      string,
      {
        boxId: Id<"wordBoxes">;
        sessionCount: number;
        totalQuestions: number;
        totalAccuracy: number;
        lastPracticedAt: number;
      }
    >();

    for (const session of sessions) {
      if (session.createdAt < windowStart) {
        continue;
      }

      const boxId = session.multipleChoice.wordBoxId;
      if (!boxId) {
        continue;
      }

      const metrics = calculateSessionMetrics(session);
      const key = boxId;
      const stats =
        boxStats.get(key) ?? {
          boxId,
          sessionCount: 0,
          totalQuestions: 0,
          totalAccuracy: 0,
          lastPracticedAt: 0,
        };

      stats.sessionCount += 1;
      stats.totalQuestions += metrics.totalQuestions;
      stats.totalAccuracy += metrics.accuracy;
      stats.lastPracticedAt = Math.max(stats.lastPracticedAt, session.createdAt);

      boxStats.set(key, stats);
    }

    const allBoxStats = Array.from(boxStats.values())
      .map(stats => {
        const box = boxMap.get(stats.boxId);
        return {
          boxId: stats.boxId,
          boxName: box?.name ?? "Unknown",
          sessionCount: stats.sessionCount,
          totalQuestions: stats.totalQuestions,
          averageAccuracy:
            stats.sessionCount === 0 ? 0 : stats.totalAccuracy / stats.sessionCount,
          lastPracticedAt: stats.lastPracticedAt,
        };
      });

    const practicedBoxIds = new Set(allBoxStats.map(stats => stats.boxId));
    const unpracticedWordBoxes = wordBoxes.filter(box => !practicedBoxIds.has(box._id)).length;

    const wordBoxesStats = allBoxStats
      .sort((a, b) => b.sessionCount - a.sessionCount || b.lastPracticedAt - a.lastPracticedAt)
      .slice(0, 5);

    return {
      wordBoxes: wordBoxesStats,
      unpracticedWordBoxes,
    };
  },
});
