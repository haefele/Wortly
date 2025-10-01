# GitHub Copilot Instructions

- Use the repository overview, tech stack, and workflows documented in `README.md` as the source of truth.
- Never run `npm run dev`; assume the developer already has the dev server running with live reload.
- Don't debounce Convex queries—data volumes are small and responses are quick.
- Avoid adding loading spinners to Convex queries or mutations.
- Let TypeScript infer return types in Convex functions; don't add explicit return type annotations.
- Present user-facing errors with `toast.error`.
- When placing icons inside a `Button`, never set `className="w-4 h-4"`; the button component handles sizing.
