# Dashboard Page (`/`)

**Purpose**: Word Search & Discovery Hub

## Todo List
- [x] Create Badge UI component (`components/ui/badge.tsx`) - check shadcn/ui if they have one like that
- [x] Create word card component (`components/dashboard/word-card.tsx`)
- [x] Create search component (`components/dashboard/word-search.tsx`)
- [x] Add `getRecentWords` Convex query
- [x] Create recent words component (`components/dashboard/recent-words.tsx`)
- [x] Update main dashboard page (`app/page.tsx`)
- [x] Ensure mobile responsiveness

### Features
- **Search Interface**: Large, prominent search bar for discovering German words
- **Search Results**: Display matching words as interactive cards showing:
  - German word with article (der/die/das)
  - Word type (Substantiv, Verb, Adjektiv, etc.)
  - English and Russian translations
  - "Add to Library" button for each word
- **Recent Activity**: Show recently added words from database

## Implementation Plan

### 1. **Create Search Component** (`components/dashboard/word-search.tsx`)
   - Large, prominent search input
   - Real-time search using the existing `searchWord` query

### 2. **Create Word Card Component** (`components/dashboard/word-card.tsx`)
   - Display word with article color coding (der=blue, die=red, das=green)
   - Show word type badge (Substantiv, Verb, etc.)
   - Display translations (EN/RU)
   - Compact, scannable design

### 3. **Create Recent Words Component** (`components/dashboard/recent-words.tsx`)
   - Display recent activity section
   - Use the word cards to show recently added words
   - Grid layout for multiple word cards

### 4. **Add Convex Functions**
   - `getRecentWords` query - fetch recently added words across all users

### 5. **Update Main Dashboard Page** (`app/page.tsx`)
   - Replace FeatureComingSoon with actual components
   - Responsive design for mobile/desktop
