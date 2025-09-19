# Agent Guidelines for SurrealDB Next.js Authentication

## Commands
- **Dev server**: `npm run dev` (with turbopack)
- **Build**: `npm run build` (with turbopack)
- **Start**: `npm run start`
- **Lint**: `npm run lint` (Biome)
- **Format**: `npm run format` (Biome)
- **No test framework configured**

## Code Style
- **TypeScript**: Strict mode enabled, ES2017 target
- **Imports**: Type imports first, then regular imports
- **Path aliases**: Use `@/*` for `src/` directory
- **Indentation**: 2 spaces (Biome formatter)
- **Naming**: Descriptive variable names, camelCase
- **Components**: "use client" directive for client components
- **Props**: Use `Readonly<>` for prop types
- **Performance**: Use `useCallback` and `useMemo` appropriately
- **Error handling**: Try/catch with empty blocks for non-critical errors
- **Comments**: JSDoc for exported functions only
- **Formatting**: Template literals for dynamic strings
- **Interfaces**: Define interfaces for complex state/props