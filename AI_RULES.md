# AI Development Rules for Eorzean Compass

This document outlines the technical stack and development rules for any AI assistant working on the Eorzean Compass application. Adhering to these guidelines ensures code consistency, maintainability, and adherence to the project's architecture.

## Tech Stack Overview

The application is built on a modern, serverless-friendly stack. Key technologies include:

*   **Framework**: [Next.js 14+](https://nextjs.org/) using the App Router for file-based routing and server components.
*   **Language**: [TypeScript](https://www.typescriptlang.org/) for static typing and improved code quality.
*   **UI Components**: [shadcn/ui](https://ui.shadcn.com/), a collection of accessible and composable components built on Radix UI primitives.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) for all styling, following a utility-first approach with a custom theme defined in `tailwind.config.ts`.
*   **State Management**: React Hooks (`useState`, `useEffect`, `useMemo`, `useContext`) for local and shared component state.
*   **Forms**: [React Hook Form](https://react-hook-form.com/) for building forms and [Zod](https://zod.dev/) for schema validation.
*   **Icons**: [Lucide React](https://lucide.dev/) for all iconography.
*   **Testing**: [Cypress](https://www.cypress.io/) for end-to-end testing.
*   **Deployment**: Hosted on [Netlify](https://www.netlify.com/).

## Library Usage and Coding Rules

Follow these rules strictly when adding or modifying features.

### 1. UI and Component Development

*   **Primary Component Library**: **ALWAYS** use components from `shadcn/ui` (located in `@/components/ui`) for all standard UI elements (buttons, cards, dialogs, etc.).
*   **Custom Components**: If a `shadcn/ui` component is not suitable, create a new, single-purpose component inside the `@/components` directory. Do **NOT** modify the base `shadcn/ui` components directly.
*   **Styling**: Use **ONLY** Tailwind CSS utility classes for styling. Refer to `tailwind.config.ts` for the project's custom theme colors (`compass`, `gold`, `earth`, `silver`). Do not write custom CSS files.
*   **Class Merging**: **ALWAYS** use the `cn` utility function from `@/lib/utils.ts` when conditionally applying or merging Tailwind classes.

### 2. State Management

*   **Component State**: Use `useState` and `useReducer` for state that is local to a single component.
*   **Shared State**: For state that needs to be shared across a few components, use React Context. Do not introduce a global state management library (like Zustand or Redux) without explicit instruction.
*   **Server State**: Data fetched from APIs should be managed within components using `useEffect` and `useState`. Caching is handled by custom logic in `lib/storage.ts`.

### 3. Forms

*   **Form Logic**: **ALL** forms must be implemented using `react-hook-form`.
*   **Validation**: **ALL** form validation schemas must be defined using `zod`.

### 4. Icons

*   **Icon Source**: **ALL** icons must be imported from the `lucide-react` library. Do not add other icon libraries or use inline SVGs.

### 5. Data Fetching

*   **Client-Side**: Use the native `fetch` API within React Hooks (`useEffect`) to call the application's internal API routes (e.g., `/api/character`).
*   **Server-Side (API Routes)**: Use the native `fetch` API within Next.js API routes to communicate with external services (Tomestone.gg, FFXIVCollect).

### 6. Utilities and Business Logic

*   **File Structure**: Place all reusable, non-UI helper functions and business logic inside the `lib/` directory.
*   **TSR-G & Recommendations**: Any changes to the difficulty scoring or recommendation engine must be made within `lib/tsrg-matrix.ts` and `lib/recommendations.ts` respectively.
*   **Type Definitions**: All shared TypeScript types must be defined in `lib/types/index.ts`.