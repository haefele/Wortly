---
applyTo: "app/**/*,components/**/*,hooks/**/*,contexts/**/*,lib/**/*"
---

# Frontend Guidelines for Wortly

## Application Structure
- Pages are implemented with the Next.js App Router. Keep route-specific logic under `app/<route>` and extract reusable UI into `components/`.
- Wrap full-page experiences in `PageContainer` to inherit the sidebar-aware header, description slot, and action area.
- Client components must start with `"use client"` and rely on `convex-helpers/react` hooks (`useQuery`, `usePaginatedQuery`) for data access. Pass `"skip"` to these hooks when inputs are incomplete instead of branching inside the hook.
- Use `Id`/`Doc` types from `@/convex/_generated/dataModel` to type parameters and results rather than string literals.

## Data Fetching & Mutations
- Queries normally expose `isPending`, `isSuccess`, and `status`; mirror existing patterns when rendering loading skeletons or empty states.
- Mutations and actions grab current user data through `useMutation`/`useAction` from `convex/react`. Wrap calls in `try/catch` blocks and surface outcomes with `toast.success` / `toast.error` using `getErrorMessage` for friendly messaging.
- Paginated tables (words, sentences, practice sessions) use `usePaginatedQuery` with `initialNumItems`. When adding new pagination, return controls that call `.loadMore(pageSize)` and respect `status === "CanLoadMore"`.

## UI System & Styling
- Treat shadcn/ui as the source of reusable components. Before implementing a new pattern, check https://ui.shadcn.com/docs/components and add it locally with `pnpm dlx shadcn@latest add <component>` if it exists.
- Reuse primitives from `components/ui` (Button, Card, Tabs, Tooltip, Sidebar, etc.). Avoid inlining new Tailwind atoms when an existing component/variant fits.
- Buttons automatically size inner icons; never add manual `w-4 h-4` classes on icons. Use the provided `variant`/`size` options (`field`, `gradient`, `icon`, etc.).
- Prefer the supplied badges (`ArticleBadge`, `WordTypeBadge`, `Badge`) for metadata pills and keep animations (like `animate-badge-pop`) intact to reinforce the design language.
- `IconOrb`, `SearchingIndicator`, and similar UX embellishments already exist—reuse them for new states instead of introducing bespoke loaders.

## State & Navigation
- For modals, use the `Dialog` component suite with controlled `open` + `onOpenChange` props. Reset local state inside `useEffect` when the dialog closes (see `BulkAddWordsDialog`).
- Route navigation uses the App Router’s `useRouter`, `useParams`, and `<Link>` components.
- Admin-only surfaces rely on `useAdminAccess`; reuse it when gating new admin routes.

## Error & Edge Handling
- Guard user input on the client before calling Convex mutations (trim strings, enforce max lengths to match server validation).
- Show empty-state cards when datasets are empty (see `LibraryPage` for patterns). Favor positive guidance and call-to-action buttons.
- When displaying toasts for warnings vs. hard errors, align with existing semantics (`toast.warning` for recoverable mistakes like wrong quiz answers).

## Utilities
- Use `cn` from `@/lib/utils` to merge class names and `getErrorMessage` to unwrap `ConvexError` messages.
- Word-type constants live in `@/lib/word-types`; import them instead of redefining literal unions.
- Shared context (e.g., authenticated user) should go through providers in `contexts/` such as `UserProvider` / `useWortlyUser`.

Following these conventions keeps new frontend features cohesive with Wortly’s existing UX and data flow.
