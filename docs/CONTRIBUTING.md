# Contributing

## Code Conventions

### File Naming
- **Components** (`components/`): PascalCase -- `CharacterSearch.tsx`, `AchievementDetailsModal.tsx`
- **UI primitives** (`components/ui/`): kebab-case -- `alert-dialog.tsx` (shadcn convention)
- **Library files** (`lib/`): kebab-case -- `tsrg-matrix.ts`, `api-client.ts`
- **Hooks** (`hooks/`): kebab-case -- `use-toast.ts`
- **Tests** (`tests/`): kebab-case with `.test.ts` -- `security.test.ts`

### TypeScript
- Strict mode is enabled.
- Types live in `lib/types/index.ts`. Add new types there rather than inline.
- Use explicit types for function parameters and return values at module boundaries. Inferred types are fine internally.

### Styling
- Tailwind CSS with a custom compass theme (gold, blue, earth, silver palettes).
- Use the `compass-card` utility class for card styling.
- Component-level styles go in className props, not separate CSS files.

### State Management
- No external state library. React `useState` and `useEffect` for local state.
- Props for data flow between components. No context providers for feature data.
- LocalStorage for persistence. Supabase for shared/server state.

## Pull Request Process

1. Create a feature branch from `main`.
2. Write or update tests for any logic changes.
3. Run `npm test` and `npm run build` before opening a PR.
4. Keep PRs focused on a single change.

## Adding a New Feature

1. If it involves new data types, add them to `lib/types/index.ts`.
2. If it needs API data, add or extend a route in `app/api/`.
3. Create components in `components/` using PascalCase.
4. Write tests in `tests/` for any business logic.
5. Update the QA dashboard with relevant manual test cases.
