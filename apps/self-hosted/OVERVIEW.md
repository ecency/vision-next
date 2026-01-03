# Self-Hosted Blog Application - Overview

## What is it?

`apps/self-hosted` is a lightweight, standalone blog application that leverages the Hive blockchain as a content backend. It's designed to be a simplified, self-hosted alternative to the main Ecency Vision app, focused specifically on displaying blog content from a single Hive user account.

**Key Characteristics:**
- **Minimal footprint**: ~2,500 lines of code across 38 files
- **Client-side only**: Pure SPA with no server-side rendering
- **Configuration-driven**: Runtime-configurable via JSON
- **Monorepo package consumer**: Reuses `@ecency/sdk`, `@ecency/renderer`, and `@ecency/wallets`

## Architecture & Technology Stack

### Build System: Rsbuild (Modern Alternative)

The app uses **Rsbuild** instead of Next.js, which is a significant architectural decision:

**Rsbuild Benefits:**
- Rspack-powered (Rust-based, extremely fast)
- Much simpler than Next.js for SPAs
- Smaller bundle size
- Faster build times
- No SSR complexity

**vs Main App (Next.js 15):**
- Main app: ~30MB+ production bundle, SSR/SSG complexity
- Self-hosted: Lightweight client bundle, instant deployment

### Core Technologies

```json
{
  "Build Tool": "Rsbuild 1.5.6 + Rspack",
  "Framework": "React 19.1.1",
  "Routing": "TanStack Router 1.132 (file-based)",
  "State Management": "TanStack Query 5.90 (server state only)",
  "Styling": "Tailwind CSS 4.1 (new v4 API)",
  "Code Quality": "Biome 2.2.3 (replaces ESLint + Prettier)",
  "Animation": "Framer Motion 11.18"
}
```

### Directory Structure

```
apps/self-hosted/
├── config.template.json       # Configuration template
├── config.json                # Runtime config (gitignored)
├── src/
│   ├── index.tsx              # Entry point
│   ├── routes/                # TanStack Router routes
│   │   ├── __root.tsx         # Root layout with providers
│   │   ├── index.tsx          # Home page
│   │   ├── blog/route.tsx     # Blog list page
│   │   └── $category.$author.$permlink.tsx  # Post detail
│   ├── core/
│   │   ├── configuration-loader.ts  # Config management system
│   │   └── index.ts
│   ├── features/
│   │   ├── blog/              # Blog feature module
│   │   │   ├── components/    # Post items, lists, discussion
│   │   │   └── layout/        # Blog layout, sidebar, navigation
│   │   ├── floating-menu/     # Config editor UI
│   │   └── shared/            # Shared components (UserAvatar)
│   ├── consts/
│   │   └── react-query.ts     # QueryClient config
│   └── styles/
```

## Configuration System

### InstanceConfigManager

The app features a sophisticated configuration management system:

**Features:**
- Type-safe config access via TypeScript
- Conditional rendering components
- Runtime configuration mutations
- React hooks for reactive config values

**Example Usage:**
```tsx
// Get config value
const username = InstanceConfigManager.getConfigValue(
  ({ configuration }) => configuration.instanceConfiguration.username
);

// Conditional rendering
<InstanceConfigManager.Conditional
  condition={({ configuration }) => configuration.features.comments.enabled}
>
  <Comments />
</InstanceConfigManager.Conditional>
```

### Configuration Schema

The `config.json` supports:
- **General Settings**: Theme, language, timezone, custom styles
- **Instance Metadata**: Title, description, logo, favicon
- **Layout Options**: List/grid view, sidebar placement, search toggle
- **Feature Flags**: Communities, likes, wallet, comments, text-to-speech

## What's Currently Implemented

### ✅ Core Features

1. **Blog Post Listing**
   - Infinite scroll pagination
   - Filter support (blog, posts, comments, replies)
   - List and grid view modes
   - Animated entry transitions

2. **Post Detail Page**
   - Full post rendering via `@ecency/renderer`
   - Author information
   - Post metadata (date, votes, comments count)
   - Raw content view mode (`?raw`)

3. **Discussion/Comments**
   - Nested comment threads
   - Comment metadata display
   - Conditional visibility based on config

4. **Sidebar**
   - User avatar
   - Profile information (name, about, location, website)
   - Follower/following stats
   - Sticky positioning on desktop

5. **Navigation**
   - Filter tabs (configurable)
   - Responsive mobile/desktop layouts

6. **Floating Config Editor**
   - Live configuration editing
   - JSON schema-based form
   - Persistent settings

7. **Responsive Design**
   - Mobile-first approach
   - Tailwind breakpoints
   - Medium-inspired typography

### 🔗 Workspace Integration

Successfully consumes monorepo packages:
- `@ecency/sdk` - Hive blockchain queries
- `@ecency/renderer` - Markdown/HTML rendering
- `@ecency/wallets` - (imported but not actively used)

### 🎨 Design Language

Follows Medium's visual design:
- Helvetica Neue typography
- Subtle color palette (rgba-based)
- Generous whitespace
- Clean, minimal UI

## What's Missing

### Critical Missing Features

#### 1. **No Authentication/Write Operations**
- Cannot vote on posts
- Cannot write comments
- Cannot create posts
- Wallet features incomplete

**Impact**: Read-only blog viewer

#### 2. **No SEO/Meta Tags**
- Missing dynamic meta tags for posts
- No OpenGraph/Twitter card support
- No sitemap generation
- Poor social sharing experience

**Impact**: Low discoverability, bad social previews

#### 3. **No RSS Feed**
- No RSS/Atom feed generation
- Missing a key blog feature

**Impact**: Cannot follow via RSS readers

#### 4. **Limited Error Handling**
- Basic error states only
- No error boundaries
- No retry mechanisms
- No offline support

#### 5. **No Analytics**
- No built-in analytics
- No custom event tracking
- Cannot measure engagement

#### 6. **No Search Functionality**
- Config has search toggle, but not implemented
- Cannot search within blog content

#### 7. **Incomplete Sidebar Features**
- Config references followers/following/hive info sections
- Only basic profile info implemented

#### 8. **No Image Optimization**
- Direct image URLs (no lazy loading, responsive images, or CDN optimization)

#### 9. **No Internationalization**
- Hardcoded English strings
- No i18n framework integrated

#### 10. **No PWA Support**
- Not installable as mobile app
- No service worker
- No offline caching

### Build/Deployment Gaps

1. **No CI/CD Configuration**
   - No GitHub Actions workflow
   - No automated testing
   - No deployment scripts

2. **No Docker Support**
   - No Dockerfile
   - No docker-compose.yml

3. **No Environment Variables**
   - Config hardcoded in JSON
   - No `.env` support

4. **No Tests**
   - Zero test files
   - No testing framework configured

## Is This a Good Approach?

### ✅ Strengths

1. **Excellent Technology Choices**
   - Rsbuild is perfect for SPAs
   - TanStack Router is modern and type-safe
   - Tailwind v4 is cutting-edge
   - React 19 is latest stable
   - Biome is faster than ESLint+Prettier

2. **Smart Reuse Strategy**
   - Leverages existing SDK work
   - Avoids reimplementing Hive logic
   - Shares renderer with main app

3. **Configuration-Driven Design**
   - Flexible without code changes
   - Good for white-label deployments
   - Runtime customization

4. **Minimal Complexity**
   - No SSR overhead
   - Simple deployment (static files)
   - Easy to understand codebase

5. **Clean Architecture**
   - Feature-based organization
   - Clear separation of concerns
   - Follows monorepo patterns

### ⚠️ Weaknesses

1. **Read-Only Limitation**
   - Cannot replace full Ecency experience
   - Limited user engagement
   - Requires main app for interactions

2. **SEO Disadvantages**
   - Client-side rendering hurts SEO
   - No static page generation
   - Slow initial content load

3. **Missing Blog Essentials**
   - No RSS (dealbreaker for many)
   - No search
   - No related posts
   - No tags/categories UI

4. **Configuration Complexity**
   - JSON editing is error-prone
   - No validation UI
   - Easy to misconfigure

5. **Production Readiness**
   - No monitoring
   - No error tracking
   - No performance metrics

### 🎯 Good Approach For:

- Personal blogs from Hive users
- Lightweight portfolio sites
- Embedded blog widgets
- Quick blog deployment
- Learning Hive integration

### ❌ Poor Approach For:

- Full social platform replacement
- SEO-critical content
- Multi-author blogs
- E-commerce integration
- High-traffic production sites needing SSR

## Recommendations

### Immediate Priorities (Must-Have)

1. **Add SEO Support**
   ```bash
   pnpm add react-helmet-async
   ```
   - Dynamic meta tags per post
   - OpenGraph/Twitter cards
   - Structured data (JSON-LD)

2. **Implement RSS Feed**
   - Static XML generation on build
   - Or dynamic via API route

3. **Add Error Boundaries**
   ```bash
   pnpm add react-error-boundary
   ```

4. **Environment Variables**
   - Replace hardcoded config.json
   - Support build-time configuration

5. **Testing Framework**
   ```bash
   pnpm add -D vitest @testing-library/react
   ```

### Short-Term Improvements

6. **Image Optimization**
   - Use Cloudflare Images or similar CDN
   - Add lazy loading
   - Responsive image support

7. **Search Implementation**
   - Client-side search with Fuse.js
   - Or integrate Algolia/Meilisearch

8. **PWA Support**
   ```bash
   pnpm add -D @rsbuild/plugin-pwa
   ```

9. **Analytics Integration**
   - Add Plausible or Simple Analytics
   - Privacy-friendly, lightweight

10. **Docker Deployment**
    - Create Dockerfile with nginx
    - Add docker-compose example

### Long-Term Enhancements

11. **Authentication System**
    - Integrate HiveAuth/Keychain
    - Enable voting/commenting
    - Reuse `@ecency/wallets`

12. **Static Site Generation (Optional)**
    - Prerender posts at build time
    - Hybrid: static pages + dynamic updates
    - Consider Astro integration

13. **Internationalization**
    ```bash
    pnpm add react-i18next i18next
    ```

14. **Admin Dashboard**
    - Visual config editor
    - Theme customization UI
    - Analytics dashboard

15. **Multi-User Support**
    - Support multiple Hive accounts
    - Author pages
    - Guest posting

## Comparison: Self-Hosted vs Main App

| Feature | Self-Hosted | Main App (apps/web) |
|---------|-------------|---------------------|
| **Build Tool** | Rsbuild | Next.js 15 |
| **Bundle Size** | ~500KB (est.) | 8MB+ cache limit |
| **Routing** | TanStack Router | Next.js App Router |
| **Rendering** | CSR only | SSR + SSG |
| **State** | React Query only | Zustand + React Query |
| **Lines of Code** | 2,500 | ~100,000+ |
| **Features** | Blog viewing | Full social platform |
| **Deployment** | Static hosting | Node.js server required |
| **Use Case** | Personal blogs | Production platform |

## Conclusion

The self-hosted app is a **well-architected, modern SPA** that makes excellent technology choices for its intended use case. The decision to use Rsbuild, TanStack Router, and a configuration-driven approach is sound.

**However**, it's currently more of a **proof-of-concept** than a production-ready blog platform. Critical features like SEO, RSS, authentication, and testing are missing.

**Verdict**: ⭐⭐⭐⭐ (4/5)
- **Technology/Architecture**: Excellent (5/5)
- **Feature Completeness**: Fair (2/5)
- **Production Readiness**: Poor (2/5)
- **Code Quality**: Very Good (4/5)
- **Reusability**: Excellent (5/5)

**Next Steps**: Focus on the immediate priorities listed above to make this production-ready. The foundation is solid, it just needs essential blog features and deployment infrastructure.

## Questions to Consider

1. **Target Audience**: Who is this for? Hive bloggers? Non-technical users?
2. **Deployment Strategy**: Self-hosted servers? Vercel/Netlify? IPFS?
3. **Monetization**: Free? Paid hosting service? Pro features?
4. **Maintenance**: Who maintains this long-term?
5. **Differentiation**: What makes this better than Ghost, WordPress, or Medium?

The app has potential to be a lightweight Hive blog solution, but needs clarity on its strategic direction and investment in essential features.
