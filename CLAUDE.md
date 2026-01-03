# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ecency Vision is a Next.js 15-based web client for the Hive blockchain, organized as a pnpm monorepo workspace. The codebase consists of a main Next.js application (`apps/web`) and three publishable packages (`@ecency/sdk`, `@ecency/wallets`, `@ecency/renderer`).

## Common Commands

### Development

```bash
# Install dependencies (run from workspace root)
pnpm install

# Start main app dev server
pnpm dev
# or: pnpm --filter @ecency/web dev

# Start package dev servers (watch mode)
pnpm dev:sdk
pnpm dev:wallets
pnpm dev:renderer
```

### Building

```bash
# Build main app
pnpm build
# or: pnpm --filter @ecency/web build

# Build all packages
pnpm build:packages
# or: pnpm -F @ecency/sdk,@ecency/wallets,@ecency/renderer build

# Build production server
pnpm start
```

### Testing & Linting

```bash
# Run tests (main app uses Jest, packages use Vitest)
pnpm test

# Lint all packages
pnpm lint

# Type check
pnpm typecheck
```

### Running Single Tests

```bash
# For main app (Jest)
pnpm --filter @ecency/web test -- path/to/test.spec.tsx

# For packages (Vitest)
pnpm --filter @ecency/sdk test -- path/to/test.spec.ts
```

### Publishing Packages

```bash
# Build before publishing
pnpm build:packages

# Publish individual packages
pnpm publish:sdk
pnpm publish:wallets
pnpm publish:renderer
```

## Monorepo Architecture

### Workspace Structure

- **apps/web** - Main Next.js application (`@ecency/web`)
- **packages/sdk** - Core Hive SDK with React Query integration (`@ecency/sdk`)
- **packages/wallets** - Multi-chain wallet management (`@ecency/wallets`)
- **packages/renderer** - Post rendering components (`@ecency/renderer`)

All packages use `workspace:*` protocol for local dependencies. The main app transpiles workspace packages during build (configured in `next.config.js`).

### Package Build Strategy

Packages use **dual builds** (tsup) to optimize for different environments:
- **Browser build**: ESM with TypeScript declarations
- **Node build**: ESM + CJS for SSR compatibility

Exports are platform-specific via package.json `exports` field.

### Package Architecture & Boundaries

The monorepo follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         @ecency/web (Next.js App)       │
│   - UI Components & Pages               │
│   - App-specific queries/mutations      │
│   - Feature modules                     │
└─────────────────┬───────────────────────┘
                  │ imports
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌──────────────────┐
│ @ecency/      │   │ @ecency/renderer │
│ wallets       │   │ - Post rendering │
│ - Multi-chain │   │ - Markdown       │
│   wallets     │   └──────────────────┘
│ - Assets      │
└───────┬───────┘
        │ imports
        ▼
┌───────────────┐
│ @ecency/sdk   │
│ - Hive API    │
│ - Core types  │
└───────────────┘
```

#### @ecency/sdk - Core Hive SDK

**Purpose**: Pure Hive blockchain functionality

**Scope**:
- ✅ Hive blockchain queries (posts, comments, accounts, communities)
- ✅ Hive notifications
- ✅ Core Hive types and interfaces
- ✅ React Query integration for Hive APIs
- ✅ Lightweight utilities (no heavy dependencies)

**Dependencies**: NONE (except peer deps: @hiveio/dhive, hivesigner, @tanstack/react-query)

**Bundle Size**: ~91KB

**Why separate**: This package is published to npm for use by other Hive applications. It must remain focused and lightweight.

#### @ecency/wallets - Multi-chain Wallet Management

**Purpose**: Asset and wallet management across multiple blockchains

**Scope**:
- ✅ Hive assets (HIVE, HBD, Hive Power)
- ✅ Hive Engine tokens
- ✅ SPK Network (SPK, LARYNX)
- ✅ Points system
- ✅ External blockchains (BTC, ETH, SOL, TON, TRON, APT, BNB)
- ✅ Wallet operations (balances, transactions, delegations)
- ✅ Multi-chain key management

**Dependencies**:
- @ecency/sdk (for Hive core functionality)
- @okxweb3 packages (for external blockchain support)
- Heavy crypto libraries

**Bundle Size**: ~131KB

**Why separate**: Wallet functionality requires heavy external dependencies. Users who only need Hive SDK shouldn't be forced to download BTC/ETH/SOL libraries.

#### @ecency/renderer - Content Rendering

**Purpose**: Post and markdown rendering

**Scope**:
- ✅ Markdown to HTML conversion
- ✅ Content sanitization
- ✅ Post formatting

**Dependencies**: Minimal

**Why separate**: Can be reused by other applications that need to render Hive content.

#### @ecency/web - Main Application

**Purpose**: Full-featured Hive web client

**Scope**:
- ✅ All UI components and pages
- ✅ App-specific business logic
- ✅ Feature modules
- ✅ App-specific query wrappers (using both SDK and wallets)
- ✅ State management (Zustand + React Query)

**Dependencies**: All workspace packages + app-specific libraries

### Important Package Guidelines

**❌ DO NOT**:
- Move wallet/asset queries from `@ecency/wallets` to `@ecency/sdk`
  - Reason: Would bloat SDK with multi-chain dependencies
- Add heavy dependencies to `@ecency/sdk`
  - Reason: SDK must remain lightweight for external consumers
- Create circular dependencies between packages
  - Reason: Breaks build order and package independence
- Add app-specific logic to packages
  - Reason: Packages should be reusable

**✅ DO**:
- Keep `@ecency/sdk` focused on Hive blockchain only
- Put all wallet/asset functionality in `@ecency/wallets`
- Use packages in the web app by importing from both as needed
- Add new Hive blockchain features to `@ecency/sdk`
- Add new wallet/asset features to `@ecency/wallets`
- Rebuild packages after changes: `pnpm build:packages`

**Query Organization**:
```typescript
// In @ecency/sdk - Hive blockchain queries
export function getPostQueryOptions(author: string, permlink: string) { ... }
export function getAccountQueryOptions(username: string) { ... }

// In @ecency/wallets - Asset/wallet queries
export function getHiveEngineTokensBalancesQueryOptions(username: string) { ... }
export function getSpkWalletQueryOptions(username?: string) { ... }

// In @ecency/web - App-specific wrappers
import { getPostQueryOptions } from "@ecency/sdk";
import { getSpkWalletQueryOptions } from "@ecency/wallets";

export const getPostQuery = (author: string, permlink: string) => {
  return EcencyQueriesManager.generateClientServerQuery(
    getPostQueryOptions(author, permlink)
  );
};
```

### When to Rebuild Packages

After modifying files in `packages/sdk` or `packages/wallets`:

```bash
# Rebuild all packages
pnpm build:packages

# Or rebuild individual packages
pnpm --filter @ecency/sdk build
pnpm --filter @ecency/wallets build
```

The web app will not see package changes until they are rebuilt.

## Main Application Architecture

### Technology Stack

- **Next.js 15.4** with App Router
- **State Management**: Zustand (global state) + @tanstack/react-query (server state)
- **Styling**: TailwindCSS + SCSS modules
- **Editor**: TipTap
- **Forms**: react-hook-form + yup
- **Blockchain**: @hiveio/dhive, hivesigner, hive-auth-client
- **Monitoring**: Sentry

### Directory Structure

```
apps/web/src/
├── app/                    # Next.js App Router pages & layouts
│   ├── (dynamicPages)/     # Dynamic routes (profiles, entries)
│   ├── (staticPages)/      # Static pages
│   └── api/                # API routes
├── api/                    # API layer
│   ├── queries/            # React Query queries (70+ files)
│   ├── mutations/          # React Query mutations (35+ files)
│   ├── bridge.ts           # Main API bridge
│   ├── hive.ts            # Hive blockchain API
│   ├── private-api.ts      # Ecency private API
│   └── operations.ts       # Blockchain operations
├── core/                   # Core infrastructure
│   ├── global-store/       # Zustand global state
│   │   ├── modules/        # State modules (auth, UI, users, etc.)
│   │   └── initialization/ # Client/server initialization
│   ├── react-query/        # React Query configuration
│   └── caches/             # Caching utilities
├── features/               # Feature modules (29 features)
│   ├── shared/             # 77 shared components
│   ├── ui/                 # UI component library (31 components)
│   └── [feature-name]/     # Domain-specific features
├── entities/              # Domain entities/types
├── enums/                 # TypeScript enums
├── utils/                 # Utility functions (79+ files)
├── config/                # Feature flag configuration system
├── routes.ts              # Route definitions
└── middleware.ts          # Next.js middleware
```

### State Management Pattern

**Global State (Zustand)**:
- Located in `src/core/global-store/modules/`
- Separate client/server initialization to support SSR
- Modules: authentication, global, ui, users, notifications, signing-key, config

**Server State (React Query)**:
- 70+ query files in `src/api/queries/`
- 35+ mutation files in `src/api/mutations/`
- Centralized query identifiers enum (100+ keys)
- Separate QueryClient instances for client/server

### Path Aliases

- `@/*` → `src/*`
- `@ui/*` → `src/features/ui/*`

These are configured in:
- `apps/web/tsconfig.json` (TypeScript)
- `apps/web/jest.config.ts` (Jest)
- `apps/web/next.config.js` (Webpack)

### Routing Architecture

The app uses Next.js App Router with complex URL rewrites for legacy compatibility:

- Profile pages: `/:author(@.+)/:section`
- Entry pages: `/:category/:author/:permlink`
- Community pages: `/:filter/:community(hive-\d+)`
- Feed pages: `/:filter(hot|created|...)/:tag`

Rewrites are defined in `next.config.js`. Route constants live in `src/routes.ts`.

### Feature Flag System

The `EcencyConfigManager` (`src/config/`) provides:
- Feature flag configuration
- Conditional rendering components
- Environment-based configuration
- Template-based config structure

### API Layer Organization

**API Files**:
- `bridge.ts` - Main API bridge with complex routing logic
- `hive.ts` - Hive blockchain API
- `hive-engine.ts` - Hive Engine token API
- `private-api.ts` - Ecency private API
- `operations.ts` - Blockchain operations (largest file, 49KB)

**Query/Mutation Pattern**:
- Queries return query options for `@tanstack/react-query`
- Mutations use mutation hooks
- All organized by domain/feature

### Authentication

Multi-method authentication support:
- **HiveSigner** - OAuth integration
- **Hive Auth** - Protocol-based authentication
- **Keychain** - Browser extension integration
- Private key management (posting, active, memo keys)

## Testing

### Main App (Jest)

- Test environment: jsdom
- Test location: `src/specs/`
- Test pattern: `*.spec.tsx` co-located with components
- Setup file: `src/specs/setup-any-spec.ts`
- Mocked modules: i18next, @ecency/sdk, @ecency/renderer

### Packages (Vitest)

- Each package has its own Vitest configuration
- Test files co-located with source code

## Important Implementation Notes

### Component Development

- Follow feature-based organization in `src/features/`
- Shared components go in `features/shared/`
- UI primitives go in `features/ui/`
- Avoid unnecessary re-renders (performance-critical app)
- Create tests for new components

### State Management

- Use Zustand for client-side global state
- Use React Query for server state (API data)
- Check `src/core/global-store/modules/` for existing state modules
- Query identifiers defined in centralized enum

### Styling

- TailwindCSS is primary styling method
- Dark mode via `class` strategy
- SCSS modules for component-specific styles
- Custom theme in `tailwind.config.ts`

### Code Quality

- TypeScript strict mode enabled
- All new code should include proper types
- ESLint and type checking ignored during builds (check before commit)
- Run `pnpm lint` and `pnpm test` before creating PRs

### Internationalization

- All new strings must be added to `en-US.json` only
- Use i18next for translations
- Translation system in `src/features/i18n/`

### Pull Requests

- Branch from `develop` (not `master`)
- Include tests with changes
- Update tests if modifying existing code
- Mark PR as WIP if not ready
- Include description, screenshots/videos, and link to issues
- Ensure linting and tests pass before requesting review

## Environment Configuration

Copy `.env.template` to `.env` and configure:

```bash
NEXT_PUBLIC_HS_CLIENT_ID      # HiveSigner client ID
NEXT_PUBLIC_HS_CLIENT_SECRET  # HiveSigner secret
NEXT_PUBLIC_APP_BASE          # App base URL
NEXT_PUBLIC_APP_NAME          # App name
NEXT_PUBLIC_APP_TITLE         # App title
NEXT_PUBLIC_APP_DESCRIPTION   # App description
```

See README.md for detailed environment variable documentation.

## Package Manager

This project uses **pnpm@10.18.1**. The `packageManager` field in `package.json` ensures the correct version is used. Always run commands from the workspace root unless specifically targeting a package.

## Production Build

The production build:
- Generates UUID-based build IDs
- Enables production browser source maps
- Includes PWA support (8MB cache limit)
- Integrates Sentry for error tracking
- Transpiles workspace packages
- Uses sass-embedded for fast SCSS compilation

## Key Files for Understanding

1. `package.json` - Workspace scripts and configuration
2. `apps/web/next.config.js` - Next.js configuration, rewrites, Sentry
3. `apps/web/src/app/layout.tsx` - Root layout and providers
4. `apps/web/src/core/global-store/index.ts` - Global state setup
5. `apps/web/src/core/react-query/index.ts` - React Query setup
6. `apps/web/src/routes.ts` - Route constants
7. `apps/web/src/middleware.ts` - Request middleware
8. `apps/web/tailwind.config.ts` - Design system
