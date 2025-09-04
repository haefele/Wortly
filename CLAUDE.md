# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LearnLang (Wortly) is a German language learning application built with:
- **Next.js 15** with App Router for the frontend
- **Convex** for the backend (database, server functions, real-time updates)
- **Clerk** for authentication
- **Tailwind CSS** with shadcn/ui components for styling
- **TypeScript** for type safety

## Essential Commands

### Development
```bash
npm run dev                 # Start both frontend and backend in parallel
npm run dev:frontend        # Start Next.js dev server only
npm run dev:backend        # Start Convex dev server only
```

### Build and Production
```bash
npm run build              # Build Next.js application
```

### Code Quality
```bash
npm run lint               # Run Next.js linting
npx prettier --write .     # Format code with Prettier
```

## Architecture

### Frontend Structure
- `/app` - Next.js App Router pages and layouts
  - `layout.tsx` - Root layout with ClerkProvider, ConvexClientProvider, and SidebarProvider
  - `page.tsx` - Main application page
- `/components` - React components
  - `/ui` - shadcn/ui components (button, card, sidebar, etc.)
  - `convex-client-provider.tsx` - Convex client setup with Clerk authentication
  - `app-sidebar.tsx` - Application sidebar navigation
- `/hooks` - Custom React hooks
- `/lib` - Utility functions

### Backend Structure (Convex)
- `/convex` - Convex backend code
  - `schema.ts` - Database schema definitions
    - `words` table: German words with translations, types, and examples
    - `wordLibrary` table: User-specific word collections
  - `auth.config.ts` - Clerk authentication configuration
  - `words.ts` - Server functions for word operations
  - `_generated/` - Auto-generated Convex types and API

### Authentication Flow
1. Clerk handles user authentication and JWT generation
2. ConvexClientProvider passes Clerk token to Convex
3. Convex validates JWT using the configured issuer domain
4. Authentication state available in both frontend and backend

### Database Schema
- **words**: Core word data
  - `word`: string (indexed)
  - `translations`: { en?: string, ru?: string }
  - `wordType`: string (noun, verb, etc.)
  - `exampleSentences`: string[]
  - Search index on `word` field

- **wordLibrary**: User word collections
  - `userId`: string (Clerk user ID, indexed)
  - `wordId`: reference to words table

## Key Configuration Files
- `.env.local` - Environment variables (Convex deployment, Clerk keys)
- `tsconfig.json` - TypeScript configuration with "@/*" path alias
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - shadcn/ui component configuration

## File Naming Conventions

Following the modern Next.js and shadcn/ui patterns, this project uses:

- **kebab-case** for all component files (e.g., `app-sidebar.tsx`, `convex-client-provider.tsx`)
- **kebab-case** for utility files, hooks, and configuration files (e.g., `auth-config.ts`, `use-auth.ts`)
- **PascalCase** for component exports within the files
- This maintains consistency with shadcn/ui components and improves URL readability

## Development Notes
- The app uses React 19 and Next.js 15 (latest versions)
- Convex functions run in a serverless environment
- Real-time updates are handled automatically by Convex subscriptions
- UI components are from shadcn/ui and should follow their patterns