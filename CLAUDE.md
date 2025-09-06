# Project Overview

Wortly is a German language learning application built with:
- **Next.js 15** with App Router for the frontend ("use client" only, no server-side actions or HTTP actions)
- **Convex** for the backend (database, server functions, real-time updates)
- **Clerk** for authentication
- **shadcn/ui** components and Tailwind CSS for styling
- **TypeScript** for type safety
- **Vercel** for hosting the app

# Essential Commands

## Development
```bash
npm run dev                 # Start both frontend and backend in parallel
npm run dev:frontend        # Start Next.js dev server only
npm run dev:backend        # Start Convex dev server only
```

## Code Quality
```bash
npm run lint               # Run Next.js linting
npx prettier --write .     # Format code with Prettier
```

# Architecture

## Frontend Structure
- `/app` - Next.js App Router pages and layouts
  - `layout.tsx` - Root layout with a bunch of Providers
  - `page.tsx` - Main application page
- `/components` - React components
  - `/ui` - shadcn/ui components (button, card, sidebar, etc.)
- `/hooks` - Custom React hooks
- `/lib` - Utility functions

## Backend Structure (Convex)
- `/convex` - Convex backend code
  - `schema.ts` - Database schema definitions
  - `auth.config.ts` - Clerk authentication configuration
  - `_generated/` - Auto-generated Convex types and API

## Authentication Flow
1. Clerk handles user authentication and JWT generation
2. ConvexClientProvider passes Clerk token to Convex
3. Convex validates JWT using the configured issuer domain
4. Authentication state available in both frontend and backend

# Key Configuration Files
- `.env.local` - Environment variables (Convex deployment, Clerk keys)
- `tsconfig.json` - TypeScript configuration with "@/*" path alias
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - shadcn/ui component configuration

# File Naming Conventions

Following the modern Next.js and shadcn/ui patterns, this project uses:

- **kebab-case** for all component files (e.g., `app-sidebar.tsx`, `convex-client-provider.tsx`)
- **kebab-case** for utility files, hooks, and configuration files (e.g., `auth-config.ts`, `use-auth.ts`)
- **PascalCase** for component exports within the files
- This maintains consistency with shadcn/ui components and improves URL readability