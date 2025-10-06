# GitHub Copilot Instructions

## General
- Treat `README.md` as the authoritative overview of the product, architecture, and workflows.
- Use the existing pnpm scripts (`pnpm lint`, `pnpm type-check`, `pnpm build`, etc.) when automation is required; never introduce npm/yarn equivalents.
- Never run `npm run dev`; assume the developer has the combined Next.js/Convex dev servers running already.
- Keep edits consistent with the existing ESLint/Prettier setup; do not add new formatters.

## Frontend (Next.js 15 App Router)
- All shared UI should come from shadcn/ui. Before inventing a new component, browse https://ui.shadcn.com/docs/components and, if it exists, scaffold it locally with `pnpm dlx shadcn@latest add <component>`.
- Pages live under `app/`; wrap new top-level screens in `PageContainer` so headers, sidebar triggers, and actions stay consistent.
- Client components must begin with `"use client"` and rely on `convex-helpers` hooks (`useQuery`, `usePaginatedQuery`) plus `"skip"` to disable queries until inputs are ready.
- Use the design system in `components/ui` (Buttons, Cards, Tabs, Sidebar, etc.) instead of creating bespoke variants; keep icon sizing automatic (the `Button` component already handles SVG sizing—never set `className="w-4 h-4"` on icons inside buttons).
- Route navigation and dialog state is handled with React state plus Next.js hooks (`useRouter`, `useParams`); prefer controlled `Dialog` components with `onOpenChange`.
- Present user-facing error states with `toast.error` (and success with `toast.success`/`toast.warning`) sourced from `sonner`.

## Convex & Data Access
- Follow the repository-specific Convex guidance in `.github/instructions/convex.instructions.md`; let TypeScript infer handler return types.
- Never debounce Convex queries or mutations; the dataset is small and real-time updates are expected.
- Avoid adding extra loading spinners—use existing skeleton or indicator components where needed.
- Always reuse helpers from `convex/users.ts` (`getCurrentUser`, `throwIfUnauthenticated`) for auth-aware functions.
- Prefer optimistic UI only when it mirrors current patterns; otherwise rely on Convex reactivity for state refreshes.
