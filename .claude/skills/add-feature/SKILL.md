---
name: add-feature
description: Add a new feature to the Ecency web app following established patterns
argument-hint: [feature-name]
disable-model-invocation: true
---

# Add Feature

Guide for adding a new feature to the Ecency Vision web app.

## Step 1: Create Feature Directory

```
apps/web/src/features/<feature-name>/
├── components/          # React components
│   ├── <feature>.tsx
│   └── index.ts
├── api/                 # Feature-specific API calls (if needed)
├── hooks/               # Custom hooks
├── types/               # TypeScript types
└── index.ts             # Public exports
```

Shared components go in `features/shared/`, UI primitives in `features/ui/`.

## Step 2: Feature Flag (if feature should be toggleable)

Add a flag in `apps/web/src/config/config.ts` under `visionFeatures`:

```typescript
visionFeatures: {
  // ... existing flags
  <featureName>: {
    enabled: true  // or false for gradual rollout
  }
}
```

Gate UI rendering with the config manager:

```typescript
import { EcencyConfigManager } from "@/config";

// Conditional rendering
<EcencyConfigManager.Conditional
  condition={({ visionFeatures }) => visionFeatures.<featureName>.enabled}
>
  <MyFeatureComponent />
</EcencyConfigManager.Conditional>
```

## Step 3: API Integration

**If the feature needs blockchain data (queries/mutations):**

Follow `/add-sdk-mutation` or `/add-query` skills to add SDK-level support first.

**If the feature needs Ecency private API:**

Add the API call in `apps/web/src/api/private-api.ts` and create a query in `apps/web/src/api/queries/`.

## Step 4: State Management

| State type | Where | When |
|---|---|---|
| Server data (API responses) | React Query via SDK query options | Always for async data |
| Global UI state (modals, settings) | Zustand in `core/global-store/modules/` | Shared across routes |
| Local component state | `useState`/`useReducer` | Component-specific |

## Step 5: Internationalization

Add strings to `apps/web/src/features/i18n/locales/en-US.json` only:

```json
{
  "<feature-name>": {
    "title": "Feature Title",
    "description": "Feature description",
    "button-label": "Click me"
  }
}
```

Use in components:
```typescript
import { useTranslation } from "react-i18next";

const { t } = useTranslation();
// t("<feature-name>.title")
```

## Step 6: Routing (if feature has its own page)

**Static page**: `apps/web/src/app/(staticPages)/<route>/page.tsx`
**Dynamic page**: `apps/web/src/app/(dynamicPages)/<route>/page.tsx`

Add route constant to `apps/web/src/routes.ts`.

## Step 7: Styling

- Use **TailwindCSS** as the primary styling method
- Support dark mode with `dark:` variants
- SCSS modules only for complex component-specific styles
- Custom theme tokens in `apps/web/tailwind.config.ts`

## Step 8: Testing

Create test files in `apps/web/src/specs/features/<feature-name>/`:

```typescript
import { renderWithQueryClient } from "@/specs/test-utils";
import { screen, fireEvent } from "@testing-library/react";

describe("<FeatureName>", () => {
  test("renders correctly", () => {
    renderWithQueryClient(<MyComponent />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
```

Run tests: `pnpm --filter @ecency/web test`

## Step 9: Integration Points

Common integration patterns:

- **Editor toolbar button**: Add to `apps/web/src/app/publish/_editor-extensions/`
- **Profile section**: Add to `apps/web/src/app/(dynamicPages)/profile/[username]/_components/`
- **Sidebar widget**: Add to relevant layout component
- **Navigation item**: Update layout navigation components

## Checklist

- [ ] Feature directory created with proper structure
- [ ] Feature flag added (if toggleable)
- [ ] SDK queries/mutations added (if blockchain data needed)
- [ ] i18n strings in en-US.json
- [ ] Dark mode support
- [ ] Tests written
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
