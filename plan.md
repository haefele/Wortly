# Progress Page Dashboard - Implementation Plan

## Architecture Overview

- Create new Convex query functions in `convex/progressStats.ts` for all statistics
- All queries run server-side in the database for optimal performance
- Practice session stats limited to last 30 days
- Group by `session.type` first, then by specific type details (e.g., `multipleChoice.type`)
- Future-proof design supports new practice session types and question types

---

## Dashboard Cards Implementation Plan

### **1. Current Streak Card** 🔥

**Description:** Display user's current learning streak with visual emphasis

**Convex Query:** Use existing `users.getUserStreak()`
- Returns: `{ streak: number, needsPracticeToday: boolean }`

**Display:**
- Large streak number with fire icon
- "X days in a row" or "Practice today to keep your streak!"
- Call-to-action button if practice is needed

---

### **2. Overall Statistics Summary Card** 📈

**Description:** High-level overview of user's complete learning journey

**New Convex Query:** `progressStats.getOverallStats()`

```typescript
Returns: {
  totalWordBoxes: number
  totalWords: number
  totalSentences: number
  totalPracticeSessions: number
  totalQuestionsAnswered: number
  memberSince: number // timestamp
}
```

**Implementation:**
- Count all word boxes for user
- Sum `wordCount` from all boxes
- Sum `sentenceCount` from all boxes
- Count all completed practice sessions (all time)
- Sum questions from all sessions (all time)
- Get user's creation date from users table

**Display:**
- Grid of 4-6 stat cards showing the totals
- Each stat with icon and label
- "Member since" showing formatted date

---

### **3. Recent Practice Performance Chart** 📊

**Description:** Line chart showing accuracy over recent practice sessions

**New Convex Query:** `progressStats.getRecentPerformance()`

```typescript
Returns: {
  sessions: Array<{
    sessionId: Id<"practiceSessions">
    createdAt: number
    accuracy: number // 0-100
    sessionType: string // e.g., "multiple_choice"
    questionType?: string // e.g., "german_word_choose_translation"
  }>
}
```

**Implementation:**
- Fetch practice sessions from last 30 days
- For each session, calculate accuracy percentage: `(correctCount / totalQuestions) * 100`
- Order by `createdAt` ascending
- Limit to last 14 sessions for chart readability

**Display:**
- Line or area chart with shadcn/recharts
- X-axis: Session date (formatted nicely)
- Y-axis: Accuracy percentage (0-100%)
- Color coded zones: >80% green, 50-80% yellow, <50% red
- Tooltips showing exact accuracy and date

---

### **4. Practice Session Breakdown Card** 🎯

**Description:** Performance statistics grouped by practice type

**New Convex Query:** `progressStats.getSessionBreakdown()`

```typescript
Returns: {
  byType: Array<{
    practiceSessionType: string // e.g., "multiple_choice"
    multipleChoiceType: string? // e.g., "german_word_choose_translation"
    totalSessions: number
    averageAccuracy: number
    bestScore: number
  }>
}
```

**Implementation:**
- Fetch all practice sessions from last 30 days
- Group by `session.type` (currently only "multiple_choice", but future-proof)
- Within each type, group by specific question type (e.g., `multipleChoice.type`)
- For each group, calculate:
  - Total session count
  - Average accuracy across all sessions
  - Best score achieved
- Handle both completed and in-progress sessions appropriately

**Display:**
- Card with sections for each session type
- Within each section: breakdown by question type with stats
- Show stats in a table or grid format
- Visual indicators for performance levels (badges or color coding)
- Question type labels translated to human-readable text

---

### **5. Weekly Practice Activity Chart** 📅

**Description:** Bar chart showing practice frequency over last 30 days

**New Convex Query:** `progressStats.getWeeklyActivity()`

```typescript
Returns: {
  dailyActivity: Array<{
    date: string // YYYY-MM-DD
    sessionCount: number
    totalQuestions: number
    averageAccuracy: number
  }>
}
```

**Implementation:**
- Fetch all practice sessions from last 30 days
- Group by day (use Berlin timezone via `lib/dates.ts`)
- For each day, calculate:
  - Count of sessions completed
  - Total questions answered
  - Average accuracy across sessions that day
- Fill in missing days with zero values for continuous chart
- Sort by date ascending

**Display:**
- Bar chart showing last 30 days (or configurable period)
- X-axis: Date (formatted as "Mon 15", "Tue 16", etc.)
- Y-axis: Number of sessions
- Bar color intensity based on average accuracy
- Tooltip shows: sessions count, questions answered, accuracy

---

### **6. Average Session Score Card** 🎓

**Description:** Current average performance across recent sessions (last 30 days)

**New Convex Query:** `progressStats.getAverageScore()`

```typescript
Returns: {
  averageAccuracy: number // 0-100
  totalSessions: number // last 30 days
  trend: "up" | "down" | "stable" // compared to previous 30 days
  trendPercentage: number
}
```

**Implementation:**
- Fetch all completed sessions from last 30 days
- Calculate average accuracy across all sessions
- Fetch sessions from previous 30-day period (days 31-60 ago)
- Calculate average for previous period
- Determine trend and percentage change

**Display:**
- Large percentage number with grade indicator
- Grade based on score: Perfect (100%), Excellent (≥90%), Good (≥75%), Keep Going (≥50%), Needs Work (<50%)
- Trend arrow (↑/↓/→) with percentage change
- "Based on last 30 days" subtitle
- Comparison text: "X% better/worse than previous month"

---

### **7. Word Collection Overview Card** 📚

**Description:** Statistics about word boxes and collections

**New Convex Query:** `progressStats.getCollectionStats()`

```typescript
Returns: {
  totalCollections: number
  totalWords: number
  totalSentences: number
  largestCollection: {
    name: string
    wordCount: number
  } | null
  recentlyUpdated: Array<{
    name: string
    wordCount: number
    lastUpdated: number
  }>
}
```

**Implementation:**
- Fetch all user's word boxes
- Aggregate counts across all boxes
- Find largest collection by word count
- Identify most recently updated boxes (check recent wordBoxAssignments)
- Limit recently updated to top 3

**Display:**
- Key stats in grid layout:
  - Total collections
  - Total words
  - Total sentences
- Highlight largest collection with special styling
- List 3 most recently updated collections with timestamps

---

### **8. Recent Activity Feed Card** 🕐

**Description:** Timeline of recent learning activities

**New Convex Query:** `progressStats.getRecentActivity()`

```typescript
Returns: {
  activities: Array<{
    type: "session_completed" | "word_added" | "sentence_added" | "collection_created"
    timestamp: number
    details: {
      // For session_completed:
      collectionName?: string
      accuracy?: number
      questionCount?: number
      // For word_added:
      word?: string
      boxName?: string
      // For sentence_added:
      sentence?: string
      boxName?: string
      // For collection_created:
      collectionName?: string
    }
  }>
}
```

**Implementation:**
- Fetch last 10 practice sessions from last 30 days with their associated word box names
- Fetch recent word additions (via wordBoxAssignments with addedAt timestamps)
- Fetch recent sentence additions (via wordBoxSentences)
- Fetch recent word box creations
- Merge all activities and sort by timestamp descending
- Limit to 10 most recent activities

**Display:**
- Vertical timeline with icons for each activity type
- Relative timestamps using date-fns ("2 hours ago", "3 days ago")
- Activity-specific messages:
  - "Completed practice on [Collection] - X% accuracy"
  - "Added '[word]' to [Collection]"
  - "Added '[start of sentence]' to [Collection]"
  - "Created new collection: [Name]"
- Scrollable if more than 5-6 items

---

### **9. Learning Velocity Chart** 🚀

**Description:** Cumulative words added over time

**New Convex Query:** `progressStats.getLearningVelocity()`

```typescript
Returns: {
  dataPoints: Array<{
    date: string // week or month identifier
    cumulativeWords: number
    wordsAddedInPeriod: number
  }>
}
```

**Implementation:**
- Fetch all wordBoxAssignments with `addedAt` timestamps for user
- Group by week or month (depending on total data span)
- Calculate cumulative total over time
- Calculate words added in each period
- Show last 12 weeks or 6 months
- Include a data point at the start (0 words) for context

**Display:**
- Area chart showing growth over time
- X-axis: Time periods (weeks/months)
- Y-axis: Total word count
- Gradient fill under line to show growth
- Shows learning acceleration visually
- Tooltip shows: period, total words, words added that period

---

### **10. Best Performance Streak Card** 🏆

**Description:** Longest streak of high-performance sessions

**New Convex Query:** `progressStats.getPerformanceStreaks()`

```typescript
Returns: {
  currentHighPerformanceStreak: number // consecutive sessions >80% in last 30 days
  bestHighPerformanceStreak: number // best streak in last 30 days
  perfectScoreSessions: number // 100% accuracy in last 30 days
}
```

**Implementation:**
- Fetch all sessions from last 30 days ordered by date
- Calculate consecutive sessions above 80% accuracy threshold
- Track current streak (if last session was >80%, count backwards)
- Track best streak within the 30-day window
- Count sessions with 100% accuracy

**Display:**
- Current high-performance streak with fire or trophy icon
- Progress toward personal best (if current < best)
- Personal best record displayed prominently
- Perfect score count with special trophy icon
- Motivational messages based on streaks

---

### **11. Article Mastery Card** 🎯

**Description:** German-specific accuracy for articles (der, die, das) - a notoriously difficult aspect of German

**New Convex Query:** `progressStats.getArticleMastery()`

```typescript
Returns: {
  byArticle: Array<{
    article: "der" | "die" | "das"
    totalQuestions: number // last 30 days
    correctAnswers: number
    accuracy: number // 0-100
  }>
  overallAccuracy: number
  mostConfusedWords: Array<{
    word: string
    correctArticle: string
    incorrectArticle: string
    occurrences: number
  }>
}
```

**Implementation:**
- Fetch all practice sessions from last 30 days with type `german_substantive_choose_article`
- For each question, track which article was correct and if user got it right
- Group by article type (der, die, das)
- Identify common confusion patterns by word (e.g., confusing "der" with "die")
- Calculate accuracy per article and overall

**Display:**
- Three progress bars or circular gauges, one for each article
- Color-coded by accuracy (green >80%, yellow 50-80%, red <50%)
- Show "Most confused pairs" section below
- Special badge if user masters all three above 90%
- Empty state if no article questions have been practiced yet

**Why it's useful:** Articles are one of the hardest parts of German. This gives targeted feedback on which articles need more practice.

---

### **12. Most Practiced Collections Card** 📚

**Description:** Which word boxes the user practices most frequently

**New Convex Query:** `progressStats.getMostPracticedCollections()`

```typescript
Returns: {
  wordBoxes: Array<{
    boxId: Id<"wordBoxes">
    boxName: string
    sessionCount: number // last 30 days
    totalQuestions: number
    averageAccuracy: number
    lastPracticedAt: number
  }>
  unpracticedWordBoxes: number // collections never practiced
}
```

**Implementation:**
- Fetch all practice sessions from last 30 days
- Group by word box (via session's associated wordBoxId)
- Count sessions per collection
- Calculate average accuracy per collection
- Get last practiced timestamp for each
- Count total collections and identify unpracticed ones

**Display:**
- Top 5 most practiced collections with session counts
- Visual bars showing relative practice frequency
- Show average accuracy for each collection
- Alert/badge if there are unpracticed collections
- Link to practice those collections
- Empty state if no practice sessions exist yet

**Why it's useful:** Helps users see if they're neglecting certain collections and balance their practice.

---

## Implementation Structure

### New File: `convex/progressStats.ts`

Contains all new query functions:
- `getOverallStats()` - Overall statistics summary
- `getRecentPerformance()` - Recent session accuracy data
- `getSessionBreakdown()` - Performance by session and question type
- `getWeeklyActivity()` - Daily practice activity
- `getAverageScore()` - Average score with trend
- `getCollectionStats()` - Word collection statistics
- `getRecentActivity()` - Activity feed data
- `getLearningVelocity()` - Words added over time
- `getPerformanceStreaks()` - Performance streak data
- `getArticleMastery()` - Article (der/die/das) accuracy breakdown
- `getMostPracticedCollections()` - Most frequently practiced word boxes

All queries should:
- Use proper authentication via `getCurrentUser()`
- Utilize database indexes for performance
- Return pre-calculated statistics (minimize frontend computation)
- Handle edge cases (no data, incomplete sessions, etc.)

---

### Page Component Structure

```
app/progress/
├── page.tsx (main page with layout)
├── streak-card.tsx
├── overall-stats-card.tsx
├── performance-chart-card.tsx
├── session-breakdown-card.tsx
├── weekly-activity-card.tsx
├── average-score-card.tsx
├── collection-stats-card.tsx
├── recent-activity-card.tsx
├── learning-velocity-card.tsx
├── performance-streak-card.tsx
├── article-mastery-card.tsx
└── most-practiced-collections-card.tsx
```

Each card component should:
- Be a client component ("use client")
- Use appropriate Convex query hooks
- Handle loading states
- Handle empty states (no data)
- Follow existing design patterns from the app
- Use shadcn/ui components (Card, CardHeader, CardTitle, CardContent)

---

### Recommended Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Hero Row                                                   │
│  ┌──────────────────┐  ┌──────────────────────────────┐     │
│  │  Streak Card     │  │  Overall Stats Card          │     │
│  └──────────────────┘  └──────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Stats Row                                                  │
│  ┌─────────┐  ┌──────────────┐  ┌───────────────────┐       │
│  │ Average │  │ Performance  │  │ Collection Stats  │       │
│  │ Score   │  │ Streak       │  │                   │       │
│  └─────────┘  └──────────────┘  └───────────────────┘       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Charts Row                                                 │
│  ┌───────────────────────────┐  ┌──────────────────────┐    │
│  │ Recent Performance Chart  │  │ Weekly Activity      │    │
│  │                           │  │ Chart                │    │
│  └───────────────────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Analysis Row                                               │
│  ┌───────────────────────────┐  ┌──────────────────────┐    │
│  │ Session Breakdown Card    │  │ Learning Velocity    │    │
│  │                           │  │ Chart                │    │
│  └───────────────────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  German-Specific Row                                        │
│  ┌───────────────────────────┐  ┌──────────────────────┐    │
│  │ Article Mastery Card      │  │ Most Practiced       │    │
│  │ (der/die/das)             │  │ Collections Card     │    │
│  └───────────────────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Activity Row                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Recent Activity Feed Card                               ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

Responsive behavior:
- Desktop (≥1024px): Multi-column grid layout as shown above
- Tablet (768-1023px): 2-column layout
- Mobile (<768px): Single column, full width cards

---

## Technical Considerations

### Database Queries
- All queries use indexes for optimal performance (existing, or create new ones as needed)
- Date filtering uses Berlin timezone (via `lib/dates.ts` utilities)
- 30-day window calculated from current date at query time using `subtractDays()`
- Queries return pre-calculated stats (no heavy computation on frontend)
- Pagination SHOULD NOT BE NEEDED! Avoid returning paginated-data from queries, and don't use pagiation inside of the queries! The convex queries run INSIDE the database, so this is optimal!

### Future-Proofing
- Grouping by `practiceSession.type` and `multipleChoice.type` supports new practice modes beyond "multiple_choice"
- Question type handling supports additional types beyond current three
- Extensible activity feed supports new activity types
- Chart components can handle varying data ranges

### Error Handling
- Empty states for users with no data
- Loading states with skeletons while queries run
- Graceful degradation if specific stats unavailable
- Clear messaging for "no data in last 30 days" scenarios

### Performance
- Use Convex's reactive queries for real-time updates
- Optimize chart data (e.g., limit data points for readability)

### UI/UX
- Consistent card styling using shadcn/ui Card components
- Smooth animations for data updates
- Interactive tooltips on charts
- Color-coded performance indicators (reuse getScoreGradeMeta from constants.ts)
- Responsive grid layout with Tailwind CSS
- Loading skeletons match final card layouts
- Empty states with helpful messages and calls-to-action

---

## Future Enhancements

- Filter by date range (7 days, 30 days, 90 days, all time)
- Filter by specific word box
- Export statistics as PDF or CSV
- Share achievements on social media
- Detailed session analysis (drill into specific sessions)
- Comparison with previous time periods
- Goals and milestones system
- Personalized insights and recommendations
- Weekly/monthly email summaries

---

## Notes

- This plan focuses on the last 30 days for practice session statistics to keep data relevant and focused on recent learning
- All-time stats are still available for overall journey metrics (total words, total sessions, etc.)
- The grouping strategy (session type → question type) ensures the dashboard will work seamlessly when new practice modes are added
- All queries run in Convex backend for optimal performance and to minimize client-side computation
- The design follows the existing Wortly UI patterns (shadcn/ui, modern aesthetics, clean layouts)
