# READ-THIS-FIRST.md

---

**📚 IMPORTANT: How to Read This Documentation**

These documents describe **architectural patterns and development conventions** - they are **NOT project requirements or feature specifications**.

**Throughout these documents:**
- **Code examples** use domains like "posts", "users", "assets", "events", "team", etc. → These are **illustrative examples only**
- **Focus on the PATTERNS** (file structure, data flow, error handling, authentication, API design, testing, etc.)
- **Do NOT focus on the specific domains** (posts, users, etc.) - these are just examples to demonstrate the patterns
- **Implement YOUR OWN domains** based on your application's actual requirements

**For AI agents:** When reading these documents, extract the architectural patterns, conventions, and best practices. Do NOT treat the example domains (posts, users, assets, etc.) as requirements to build. These domains are used extensively to demonstrate patterns - apply these patterns to whatever domains your project actually needs.

---

## Table of Contents

1. Complete Folder Structure
2. Core Setup & Configuration
3. Development Workflow
4. Testing Infrastructure
5. Architecture: Feature-Based Layer
6. Architecture: Domain-Driven Layer
7. Architecture: App Router Layer

### Sections 8-10 can be found in READ-THIS-FIRST-2.md

## Overview

**Purpose**: Scaffolding guide for Claude Code to initialize new Next.js 15+ TypeScript projects using UEV Architecture Patterns.

**Target**: Claude Code AI assistant (directive, not explanatory)

**Context**: This document describes architectural patterns extracted utilized by United Effects Ventures R&D. Projects will naturally diverge and evolve - these are starting patterns, not rigid requirements.

---

## What Claude Code Should Do

This document is for the AI assistant, most likely Claude Code - references to "you" are specific to the LLM Claude Code currently reading this.

You are reading this because the user has asked you to or has explicitly run an initialization script like /init.

Do the following in response:

1. **Read this document and READ-THIS-FIRST-2.md completely** - Understand all architectural patterns, conventions, and structure from all sections
2. **Create a Documentation/** directory and add the below documents which you should populate with data based on your understanding of this document.
   - **FEATURES.md** (Section 5 - feature architecture patterns, PageLoader, client components)
   - **DOMAINS.md** (Section 6 - domain-driven design patterns, file structure, API patterns)
   - **AUTH.md** (Section 9 - authentication patterns, middleware, route protection, reference implementation)
   - **DB.md** (Section 8 - database patterns, connection management, reference implementation)
   - **SECTIONS.md** (Section 15 - reusable section component patterns and conventions)
   - **DESIGN.md** (Section 12 - styling system if using Tailwind, otherwise basic design patterns)
   - **MCP.md** (Section 20) - If integrating Model Context Protocol
   - **LOCAL-BUILD.md** (Section 18) - Local production testing patterns
   - **PROGRESS.md** - Session history tracking (if applicable)
3. **Create CLAUDE.md** - Project-specific instructions derived from this document, adapted to reference implementations, and make references to the /Documetnation/*.md files as needed so you aren't being redundant.
5. **Now interview the user** - Ask what they want to build or if they have a document they'd like to point you to with an overview. You could also suggest that they run the `project-kickoff` script (`node scripts/project-kickoff.js`) which will interactively create a package.json with essential project info. Ask questions until you have more context on their goals so you can apply the patterns of this document to them.
6. **Clarify stack choices** - Specify what stack this approach suggests for auth, database, styling (e.g., tailwind), etc., and get an ok from the user. Make adjustments if they want something different.
7. **Revise Claude.md and Build** - Make adjustments to the Documentation/*.md files and Claude.md - then scaffold the project following these patterns based on what you know.

### Here are some helpful todos to make sure you cover as you scaffold the project

- [ ] **Create base folder structure** (Section 1 - adapt based on project needs)
- [ ] **Initialize package manager** (yarn init or npm init based on user choice)
- [ ] **Install Next.js** with App Router and TypeScript
- [ ] **Install core dependencies** based on stack choices
- [ ] **Configure TypeScript** (Section 2 - tsconfig.json with strict mode, path aliases)
- [ ] **Configure Next.js** (Section 2 - next.config.js/mjs with appropriate settings)
- [ ] **Set up testing** (Section 4 - vitest.config.mts, setup files, test structure)
- [ ] **Configure ESLint** (Section 13 - pragmatic rules with targeted overrides)
- [ ] **Set up styling** (Section 12 - if Tailwind: globals.css with @theme, PostCSS config)
- [ ] **Create .env.example** (Section 2 - document all required environment variables)
- [ ] **Set up git workflow scripts** (Section 3 - commit.sh, push.sh with validation)
- [ ] **Wire scripts in package.json** (Section 2 & 3 - dev, build, test, lint, type-check, commit, push)
- [ ] **Create App Router structure** (Section 7 - layouts, middleware, basic routes)
- [ ] **Create first domain** (Section 6 - example domain showing full pattern)
- [ ] **Create first feature** (Section 5 - example feature consuming domain API)
- [ ] **Generate README.md** - Project-specific setup, architecture overview, and commands
- [ ] **Yarn Commit** - Use the yarn commit script for the first commit if approved by user
- [ ] **Validate everything** - Run dev server, tests, lint, type-check to ensure all systems work

---

## Important Notes

1. **Stack Specificity**: This guide is for **Next.js 15+ with TypeScript** projects only. Not applicable to other stacks, though it can be used as an architectural guide for other stacks.

2. **Reference Implementations**: This guide uses specific technologies as reference implementations:
   - **Auth**: Clerk (swappable - NextAuth.js, Auth0, Supabase Auth, custom JWT all viable)
   - **Database**: MongoDB + Mongoose (swappable - PostgreSQL + Prisma, Supabase, Drizzle, raw SQL all viable)
   - **Styling**: Tailwind CSS v4 (optional - any styling solution works)
   - **API**: OpenAPI-first with REST (adaptable - GraphQL, tRPC viable alternatives)

3. **Pattern Extraction**: When this guide shows Clerk auth patterns, extract the *architectural approach* (middleware, route protection, role-based access) and apply to your chosen solution.

4. **Project Divergence**: Projects naturally evolve beyond these patterns. This is expected and encouraged.

---

## Technology Stack

**Required (🟢 Essential):**
- Next.js 15+ (App Router)
- TypeScript (strict mode)
- React 19+
- Node.js 24.4.1+ (use nvm)
- Yarn 4+ package manager

**Recommended (🟡 Standard patterns):**
- Vitest + React Testing Library (testing)
- ESLint (code quality)
- MongoDB/Firestore via Mongoose (database, swappable)
- Clerk (authentication, swappable)
- Tailwind CSS v4 (styling, optional)

**Optional (🔵 Project-specific):**
- Model Context Protocol (MCP) integration
- Docker + Google Cloud Run (deployment)
- OpenAPI + Swagger (API documentation)
- LRU cache (API response caching)

---

## Architecture Philosophy

### What's Fixed
- **Layer separation**: App Router → Features → Domains → Database
- **Domain/Feature organization**: Clear boundaries, isolated concerns
- **TypeScript strict mode**: Type safety throughout
- **Testing approach**: TDD with unit + integration tests
- **Convention over configuration**: Standardized patterns

### What's Flexible
- Auth provider (Clerk, NextAuth, Auth0, custom)
- Database (MongoDB, PostgreSQL, Supabase, etc.)
- Styling approach (Tailwind, CSS Modules, styled-components, etc.)
- API patterns (REST, GraphQL, tRPC)
- Deployment target (Cloud Run, Vercel, AWS, self-hosted)

---

# 1. Complete Folder Structure

```
project-root/
├── .yarn/                          # Yarn 4 configuration
│   ├── releases/
│   └── plugins/
├── Documentation/                  # Project documentation (created during init)
│   ├── FEATURES.md                 # Feature architecture patterns
│   ├── DOMAINS.md                  # Domain-driven design patterns
│   ├── AUTH.md                     # Authentication implementation
│   ├── DB.md                       # Database patterns
│   ├── SECTIONS.md                 # Reusable section patterns
│   ├── DESIGN.md                   # Styling system
│   ├── MCP.md                      # Model Context Protocol integration
│   ├── LOCAL-BUILD.md              # Local production testing
│   └── PROGRESS.md                 # Session history tracking
├── mcp-server/                     # Optional: Custom MCP server
│   ├── index.js
│   ├── tools/
│   └── schemas/
├── public/                         # Static assets
│   ├── images/
│   └── favicon.ico
├── scripts/                        # Build and utility scripts
│   ├── build-standalone.sh         # Local production build helper
│   ├── compile-section-registry.ts # Section loader generator
│   ├── generate-section-loader.ts  # Section loader generator (legacy)
│   ├── commit.sh                   # Git commit with validation
│   └── push.sh                     # Git push with checks
└── src/
    ├── app/                        # Next.js App Router (thin wrappers only)
    │   ├── (public)/               # Optional: Public route group
    │   │   └── [feature]/          # Feature routes (e.g., about/, contact/)
    │   │       └── page.tsx
    │   ├── [feature]/              # Feature routes (e.g., admin/, dashboard/)
    │   │   └── page.tsx
    │   ├── api/                    # API routes (thin callers to domains)
    │   │   ├── health/
    │   │   │   └── route.ts        # Health check endpoint
    │   │   ├── [domain]/           # Domain API routes
    │   │   │   ├── route.ts        # GET, POST
    │   │   │   └── [id]/
    │   │   │       └── route.ts    # GET, PATCH, DELETE
    │   │   └── docs/               # Optional: OpenAPI docs endpoint
    │   │       └── route.ts
    │   ├── layout.tsx              # Root layout
    │   ├── globals.css             # Global styles (Tailwind imports)
    │   ├── providers.tsx           # Optional: Client providers wrapper
    │   └── error.tsx               # Global error boundary
    ├── domains/                    # Business logic layer (UI-agnostic)
    │   └── [domain]/               # Your domain directories
    │       ├── api.ts              # HTTP handlers (export functions for App Router)
    │       ├── logic.ts            # Business logic (validation, orchestration)
    │       ├── dal.ts              # Data access layer (database queries)
    │       ├── models.ts           # Database schemas + TypeScript types
    │       ├── schema.ts           # OpenAPI schemas (request/response DTOs)
    │       ├── __tests__/          # Domain tests
    │       │   ├── logic.test.ts
    │       │   └── dal.test.ts
    │       └── index.ts            # Public exports
    ├── features/                   # UI/presentation layer
    │   └── [feature]/              # Your feature directories
    │       ├── components/         # React components (server + client)
    │       │   └── FeaturePage.tsx
    │       ├── hooks/              # Client-side hooks (use client)
    │       │   └── useFeature.ts
    │       ├── controllers/        # Server-side data fetching
    │       │   └── controller.ts
    │       ├── utils/              # Feature-specific utilities
    │       │   └── helpers.ts
    │       ├── __tests__/          # Feature tests
    │       │   ├── components.test.tsx
    │       │   └── hooks.test.ts
    │       └── index.ts            # Public exports
    ├── shared/                     # ONLY if used by 2+ features/domains
    │   ├── components/             # Shared UI components
    │   │   └── PageLoader.tsx      # Loading state component (required pattern)
    │   ├── hooks/                  # Shared hooks
    │   ├── controllers/            # Shared data controllers
    │   ├── schemas/                # Shared OpenAPI schemas
    │   │   └── api.ts              # CommonObjectMeta, JsonPatchDocument, Error
    │   ├── types/                  # Shared TypeScript types
    │   │   └── common.ts           # JsonPatchOp, ListOptions, PaginationInfo
    │   ├── utils/                  # Shared utilities
    │   │   ├── odata.ts            # OData query parameter extraction and parsing
    │   │   └── site-metadata.ts    # Site metadata generation for root layout
    │   ├── sections/               # Reusable page sections (see SECTIONS.md)
    │   └── __tests__/              # Shared component tests
    ├── lib/                        # External library configs & utilities
    │   ├── auth/                   # Auth utilities (route wrappers, middleware)
    │   │   └── index.ts            # withAuth, withRole, withPublic patterns
    │   ├── api/                    # API utilities
    │   │   └── cache-wrapper.ts    # Optional: LRU cache for responses
    │   ├── db.ts                   # Database connection
    │   ├── errors/                 # Error handling
    │   │   └── index.ts            # Error handler utilities
    │   ├── responses/              # Response utilities
    │   │   └── say.ts              # Consistent response helpers
    │   ├── openapi/                # OpenAPI configuration
    │   │   └── spec.ts             # Central OpenAPI spec aggregator
    │   └── __tests__/              # Library utility tests
    ├── types/                      # Global TypeScript types
    │   └── index.ts
    ├── instrumentation.ts          # Optional: Next.js instrumentation hooks
    └── middleware.ts               # Next.js middleware (auth, headers, etc.)

# Root-level config files
├── CLAUDE.md                       # Project-specific Claude Code instructions
├── .mcp.json                       # Optional: MCP server configuration
├── .env.example                    # Environment variable template
├── .env.local                      # Development environment (gitignored)
├── .env.production.local           # Local production testing (gitignored)
├── .gitignore
├── .eslintrc.json                  # ESLint configuration
├── package.json                    # Package manifest with scripts
├── yarn.lock                       # Yarn lockfile
├── .yarnrc.yml                     # Yarn 4 configuration
├── tsconfig.json                   # TypeScript configuration
├── next.config.mjs                 # Next.js configuration
├── vitest.config.mts               # Vitest configuration (.mts for ESM)
├── postcss.config.mjs              # PostCSS for Tailwind (if using)
├── commit.sh                       # Git commit script (chmod +x)
├── push.sh                         # Git push script (chmod +x)
├── Dockerfile                      # Optional: Multi-stage Docker build
├── docker-compose.yml              # Optional: Local database
└── README.md                       # Project documentation
```

---

# 2. Core Setup & Configuration

## 2.1 Package.json

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:standalone": "./scripts/build-standalone.sh",
    "clean": "rm -rf .next",
    "start": "node .next/standalone/server.js",
    "start:local": "dotenv -e .env.production.local -- node .next/standalone/server.js",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "commit": "./scripts/commit.sh",
    "push": "./scripts/push.sh"
  },
  "dependencies": {
    "next": "^15.4.7",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "mongoose": "^8.16.5",
    "@clerk/nextjs": "^6.27.1",
    "@hapi/boom": "^10.0.1",
    "lru-cache": "^11.1.0",
    "fast-json-patch": "^3.1.1",
    "uuid": "^11.1.0"
  },
  "devDependencies": {
    "@types/node": "^24.1.0",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "typescript": "^5.8.3",
    "@vitejs/plugin-react": "^4.7.0",
    "@vitest/ui": "^3.2.4",
    "vitest": "^3.2.4",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.6.4",
    "eslint": "^9.32.0",
    "eslint-config-next": "^15.4.4",
    "tailwindcss": "^4.1.11",
    "@tailwindcss/postcss": "^4.1.11",
    "postcss": "^8.5.6",
    "dotenv-cli": "^10.0.0"
  },
  "packageManager": "yarn@4.9.4"
}
```

## 2.2 TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "isolatedModules": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 2.3 Next.js Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['storage.googleapis.com', 'localhost'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    instrumentationHook: true,
  },
}

module.exports = nextConfig
```

## 2.4 Environment Variables

```bash
# .env.example
# Node Environment
NODE_ENV=development

# Database
MONGODB_URI=mongodb://admin:password@localhost:27017/myapp?authSource=admin

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Application URLs
NEXT_PUBLIC_POST_HOST=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 2.5 Node Version Management

```bash
# .nvmrc
24.4.1
```

**Usage:**
```bash
nvm use
```

---

# 3. Development Workflow

## 3.1 Git Workflow Scripts

### Commit Script (commit.sh)

```bash
#!/bin/bash
# Runs tests, lint, and type-check before committing

set -e

if [ -z "$1" ]; then
  echo "Error: Commit message required"
  echo "Usage: ./commit.sh \"your commit message\""
  exit 1
fi

echo "Running tests..."
yarn test --run

echo "Running lint..."
yarn lint

echo "Running type-check..."
yarn type-check

echo "All checks passed! Committing..."
git add .
git commit -m "$1"

echo "✅ Committed successfully"
```

### Push Script (push.sh)

```bash
#!/bin/bash
# Prevents direct pushes to main, runs checks

set -e

BRANCH=$(git branch --show-current)

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "❌ Cannot push directly to $BRANCH"
  echo "Create a feature branch instead:"
  echo "  git checkout -b feature/your-feature"
  exit 1
fi

echo "Running final checks before push..."
yarn test --run
yarn lint
yarn type-check

echo "Pushing to origin/$BRANCH..."
git push -u origin "$BRANCH"

echo "✅ Pushed successfully"
```

**Make executable:**
```bash
chmod +x scripts/commit.sh scripts/push.sh
```

## 3.2 Package Management Rules

**CRITICAL**: Always use `yarn`, NEVER use `npm`.

```bash
# ✅ Correct
yarn add package-name
yarn remove package-name
yarn install

# ❌ Wrong
npm install package-name
npm uninstall package-name
npm install
```

## 3.3 Custom Scripts

### Standalone Build Script (build-standalone.sh)

```bash
#!/bin/bash
# Builds Next.js standalone output and copies static files

set -e

echo "Building Next.js with standalone output..."
yarn build

echo "Copying public directory to standalone..."
cp -r public .next/standalone/

echo "Copying static files to standalone..."
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/

echo "✅ Standalone build complete!"
echo "Run with: yarn start:local"
```

## 3.4 Development Commands

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Test production build locally
yarn clean && yarn build:standalone && yarn start:local

# Run tests
yarn test              # Run once
yarn test:watch        # Watch mode
yarn test:coverage     # With coverage

# Code quality
yarn lint              # ESLint
yarn type-check        # TypeScript

# Git workflow
yarn commit "message"  # Commit with validation
yarn push             # Push with validation
```

---

# 4. Testing Infrastructure

## 4.1 Vitest Configuration

```typescript
// vitest.config.mts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/lib/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/lib/test/',
        '**/*.config.*',
        '**/__tests__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

## 4.2 Vitest Setup File

```typescript
// src/lib/test/setup.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_POST_HOST = 'http://localhost:3000'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))
```

## 4.3 Test Directory Structure

```
src/
├── domains/
│   └── [domain]/
│       └── __tests__/
│           ├── logic.test.ts
│           └── dal.test.ts
└── features/
    └── [feature]/
        └── __tests__/
            ├── FeaturePage.test.tsx
            └── hooks.test.ts
```

**DO NOT** create `src/app/__tests__/` - tests belong in their respective domains or features.

## 4.4 Testing Library Setup

**Testing approach:**
- **Unit tests**: Domain logic, DAL functions, hooks
- **Integration tests**: API routes, full feature flows
- **Component tests**: React components with user interactions

**Example test** (using "posts" domain as illustration - not a requirement to build):
```typescript
// src/domains/[domain]/logic.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { DomainLogic } from './logic'

describe('DomainLogic', () => {
  beforeEach(async () => {
    // Setup test database
  })

  it('should create a record', async () => {
    const record = await DomainLogic.create({
      name: 'Test Record',
      data: 'Test data',
      userId: 'user123'
    })

    expect(record.name).toBe('Test Record')
    expect(record.id).toBeTruthy()
  })
})
```

## 4.5 TDD Approach & Puppeteer Validation

**Workflow:**

1. **Large features**: Write failing tests → Build to pass → Refactor
2. **Small changes**: Build → Write tests immediately after
3. **All features**: Validate with Puppeteer after implementation

**Puppeteer validation** (via MCP plugin):
```typescript
// After building feature, validate with Puppeteer
// 1. Navigate to page
await puppeteer_navigate({ url: 'http://localhost:3000/your-feature' })

// 2. Take screenshot
await puppeteer_screenshot({ name: 'feature-page' })

// 3. Test interactions
await puppeteer_click({ selector: 'button[aria-label="Submit"]' })
await puppeteer_fill({ selector: 'input[name="email"]', value: 'test@example.com' })

// 4. Verify elements
await puppeteer_evaluate({
  script: 'document.querySelector("h1").textContent'
})
```

---

# 5. Architecture: Feature-Based Layer

Features contain **UI and presentation logic**. They orchestrate domains but never contain business logic.

## 5.1 Feature Directory Structure

```
src/features/[feature]/
├── components/          # React components
│   ├── FeaturePage.tsx  # Main component (server component)
│   ├── ClientComponent.tsx   # Client component
│   └── Section.tsx
├── hooks/               # Client-side hooks (must use 'use client')
│   ├── useFeature.ts
│   └── useFeatureAction.ts
├── controllers/         # Server-side data fetching
│   └── controller.ts
├── utils/               # Feature-specific utilities
│   └── helpers.ts
├── __tests__/           # Feature tests
│   ├── FeaturePage.test.tsx
│   └── hooks.test.ts
└── index.ts             # Public exports
```

## 5.2 Feature Subdirectories

**components/**: React components (server or client)
- Server components by default
- Client components marked with `'use client'`
- No direct domain imports allowed

**hooks/**: Client-side React hooks
- Always `'use client'`
- Call APIs via fetch, never import domain logic
- Handle loading states, errors, local state

**controllers/**: Server-side data fetching
- Fetch from domain APIs (internal fetch)
- Transform data for UI consumption
- Handle errors, return consistent shapes

**utils/**: Feature-specific utilities
- Formatters, validators, helpers
- Only used within this feature

**models/**: Feature-specific types
- UI state types, form types
- Distinct from domain types

## 5.3 Feature Exports (index.ts)

```typescript
// src/features/[feature]/index.ts
export { FeaturePage } from './components/FeaturePage'
export { useFeature } from './hooks/useFeature'
export { controller } from './controllers/controller'
```

## 5.4 Feature-to-Domain Communication

**✅ CORRECT - Features use APIs:**
```typescript
// src/features/[feature]/hooks/useFeature.ts
// Example: "posts" is a domain, not a requirement
'use client'

export function useFeature() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchItems() {
      const response = await fetch('/api/[domain]')
      const data = await response.json()
      setItems(data)
      setLoading(false)
    }
    fetchItems()
  }, [])

  return { items, loading }
}
```

**❌ FORBIDDEN - Direct domain imports:**
```typescript
// ❌ NEVER DO THIS
import { DomainLogic } from '@/domains/[domain]/logic'
```

## 5.5 Client Components with Hooks Pattern

**Server Component (default):**
```typescript
// src/features/[feature]/components/FeaturePage.tsx
import { controller } from '../controllers/controller'
import { ClientComponent } from './ClientComponent'

export async function FeaturePage() {
  const data = await controller.getData()

  return (
    <div>
      <ClientComponent data={data} />
    </div>
  )
}
```

**Client Component:**
```typescript
// src/features/[feature]/components/ClientComponent.tsx
'use client'

import { useFeature } from '../hooks/useFeature'

export function ClientComponent({ data }) {
  const { handleAction, loading } = useFeature()

  return (
    <section>
      <h1>{data.title}</h1>
      <button onClick={handleAction} disabled={loading}>
        Submit
      </button>
    </section>
  )
}
```

## 5.6 PageLoader Pattern (Prevent FOUC)

**REQUIRED pattern for all pages:**

```typescript
// src/features/[feature]/components/FeaturePage.tsx
'use client'

import { useState, useEffect } from 'react'
import { PageLoader } from '@/shared/components/PageLoader'
import { useFeaturePage } from '../hooks/useFeaturePage'

export function FeaturePage() {
  const [isLoading, setIsLoading] = useState(true)
  const { data, loading: dataLoading } = useFeaturePage()

  useEffect(() => {
    if (!dataLoading) {
      setIsLoading(false)
    }
  }, [dataLoading])

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div>
      {/* Page content */}
    </div>
  )
}
```

**PageLoader component:**
```typescript
// src/shared/components/PageLoader.tsx
export function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )
}
```

---

# 6. Architecture: Domain-Driven Layer

Domains contain **business logic and data access**. They are UI-agnostic and testable in isolation.

**Note**: The following examples use "posts" as an illustrative domain with fields like `title`, `slug`, `content`, `authorId`, and `published`. This is NOT a requirement to build a posts system - it's simply demonstrating the domain architecture pattern. Replace with your actual domain entities.

## 6.1 Domain Directory Structure

```
src/domains/[domain]/
├── api.ts               # HTTP handlers (exported for App Router)
├── logic.ts             # Business logic (validation, orchestration)
├── dal.ts               # Data access layer (database queries)
├── models.ts            # Database schemas + TypeScript types
├── schema.ts            # OpenAPI schemas (request/response DTOs)
├── __tests__/           # Domain tests
│   ├── logic.test.ts
│   ├── dal.test.ts
│   └── api.test.ts
└── index.ts             # Public exports
```

## 6.2 Domain File Architecture

### api.ts - HTTP Handlers

See the complete API handler specification in SPEC-api-handlers.md for comprehensive documentation. This subsection provides a quick reference for the essential patterns.

#### Export Pattern

**Export default object with method properties:**

```typescript
// src/domains/[domain]/api.ts
import { NextRequest } from 'next/server';
import logic from './logic';
import { say } from '@/lib/responses/say';
import { handleError } from '@/lib/errors/handler';
import { getAuthContext } from '@/lib/auth';

export default {
  async list(req: NextRequest) {
    try {
      const result = await logic.list(params);
      return say.ok(result.data, 'RESOURCES', result.count);
    } catch (error) {
      return handleError(error, req);
    }
  },

  async get(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;  // Next.js 15 - must await
      const result = await logic.get(id);
      return say.ok(result, 'RESOURCE');
    } catch (error) {
      return handleError(error, req);
    }
  },

  async create(req: NextRequest) {
    try {
      const auth = await getAuthContext();
      const data = await req.json();
      const userId = auth.userId || 'system';

      const result = await logic.create(data, userId);
      return say.created(result, 'RESOURCE');
    } catch (error) {
      return handleError(error, req);
    }
  },

  async patch(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const auth = await getAuthContext();
      const patches = await req.json();
      const { id } = await params;
      const userId = auth.userId || 'system';

      const result = await logic.patch(id, patches, userId);
      return say.ok(result, 'RESOURCE');
    } catch (error) {
      return handleError(error, req);
    }
  },

  async delete(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      await logic.delete(id);
      return say.noContent();
    } catch (error) {
      return handleError(error, req);
    }
  }
};
```

**Usage in App Router:**
```typescript
// src/app/api/[domain]/route.ts
import api from '@/domains/[domain]/api';

export const GET = api.list;
export const POST = api.create;
```

#### Key Patterns

1. **Response pattern**: Use `say` object methods (`say.ok()`, `say.created()`, `say.noContent()`)
2. **Error handling**: Catch all errors with `handleError(error, req)`
3. **Auth context**: Extract with `getAuthContext()` for create/update operations
4. **Next.js 15 params**: Dynamic routes use `Promise<{ id: string }>` - must await
5. **Boom errors**: Throw in logic layer, catch in API layer

**See SPEC-api-handlers.md for:**
- Complete CRUD handler examples
- OData query parameter handling
- Single-record domain patterns
- Request body parsing patterns
- Validation patterns
- Custom endpoint patterns
- Testing patterns

### logic.ts - Business Logic

```typescript
// src/domains/posts/logic.ts
import { PostsDal } from './dal'
import { Post } from './models'

export const PostsLogic = {
  async getAll(): Promise<Post[]> {
    return PostsDal.getAll()
  },

  async create(data: CreatePostDto): Promise<Post> {
    // Validation
    if (!data.title || data.title.length < 3) {
      throw new Error('Title must be at least 3 characters')
    }

    // Generate slug
    const slug = data.title.toLowerCase().replace(/\s+/g, '-')

    // Create post
    return PostsDal.create({ ...data, slug })
  },

  async getBySlug(slug: string): Promise<Post | null> {
    return PostsDal.getBySlug(slug)
  },
}
```

### dal.ts - Data Access Layer

```typescript
// src/domains/posts/dal.ts
import { PostModel, Post } from './models'
import connectDB from '@/lib/db'

export const PostsDal = {
  async getAll(): Promise<Post[]> {
    await connectDB()
    return PostModel.find({ published: true }).sort({ createdAt: -1 })
  },

  async create(data: CreatePostData): Promise<Post> {
    await connectDB()
    const post = new PostModel(data)
    return post.save()
  },

  async getBySlug(slug: string): Promise<Post | null> {
    await connectDB()
    return PostModel.findOne({ slug })
  },

  async getById(id: string): Promise<Post | null> {
    await connectDB()
    return PostModel.findOne({ id })
  },
}
```

### models.ts - Mongoose Schemas

```typescript
// src/domains/posts/models.ts
import mongoose, { Schema, Document } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  authorId: string
  published: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PostDocument extends Omit<Post, 'id'>, Document {
  _id: string
}

const PostSchema = new Schema<PostDocument>({
  _id: { type: String, default: uuidv4 },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  authorId: { type: String, required: true },
  published: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      ret.id = ret._id
      delete ret._id
      delete ret.__v
      return ret
    },
  },
})

export const PostModel = mongoose.models.Post || mongoose.model<PostDocument>('Post', PostSchema)
```

### schema.ts - OpenAPI Schemas

```typescript
// src/domains/posts/schema.ts
import { commonSchemas } from '@/shared/schemas/api'

export const postSchemas = {
  Post: {
    allOf: [
      { $ref: '#/components/schemas/CommonObjectMeta' },
      {
        type: 'object',
        properties: {
          title: { type: 'string' },
          slug: { type: 'string' },
          content: { type: 'string' },
          authorId: { type: 'string' },
          published: { type: 'boolean' },
        },
        required: ['title', 'slug', 'content', 'authorId'],
      },
    ],
  },
  CreatePostRequest: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 3 },
      content: { type: 'string' },
      published: { type: 'boolean', default: false },
    },
    required: ['title', 'content'],
  },
}

export const postPaths = {
  '/api/posts': {
    get: {
      tags: ['Posts'],
      summary: 'List all posts',
      responses: {
        200: {
          description: 'List of posts',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Post' },
              },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    post: {
      tags: ['Posts'],
      summary: 'Create a post',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreatePostRequest' },
          },
        },
      },
      responses: {
        201: {
          description: 'Post created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Post' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },
}
```

## 6.3 Domain Exports (index.ts)

Domains support two export patterns: **default exports** (most common) and **named exports** (alternative). Both are valid - choose one pattern per domain and be consistent.

### Pattern 1: Default Exports (Recommended)

**Most common pattern in this codebase for single-responsibility modules:**

```typescript
// src/domains/[domain]/api.ts
export default {
  async list(req: NextRequest) { /* ... */ },
  async get(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { /* ... */ },
  async create(req: NextRequest) { /* ... */ }
};

// src/domains/[domain]/index.ts
export { default as api } from './api';
export { default as logic } from './logic';
export { default as dal } from './dal';
export * from './models';  // Types and models use named exports
export { domainSchemas, domainPaths } from './schema';

// Usage - Direct import
import api from '@/domains/[domain]/api';

// Usage - Via index
import { api, logic } from '@/domains/[domain]';
```

✅ **Use default exports for:** `api.ts`, `logic.ts`, `dal.ts` (single-responsibility modules)

### Pattern 2: Named Exports (Alternative)

**Less common, useful for domains with multiple independent objects:**

```typescript
// src/domains/[domain]/api.ts
export const domainApi = {
  async list(req: NextRequest) { /* ... */ },
  async get(req: NextRequest, id: string) { /* ... */ }
};

// src/domains/[domain]/index.ts
export { domainApi } from './api';
export { DomainLogic } from './logic';
export { DomainDAL } from './dal';
export * from './models';

// Usage - Must use named imports
import { domainApi, DomainLogic } from '@/domains/[domain]';
```

✅ **Use named exports for:** Domains with multiple service classes, utility modules, middleware collections

### Types and Models (Always Named)

**Regardless of module export pattern, types and models ALWAYS use named exports:**

```typescript
// src/domains/[domain]/models.ts
export interface IPost {
  id: string;
  title: string;
}

export interface PostDocument extends Document {
  title: string;
}

export const PostModel = models.Post || model<PostDocument>('Post', postSchema);

// Import types
import type { IPost, PostDocument } from '@/domains/[domain]';
import { PostModel } from '@/domains/[domain]';
```

### Real-World Examples

**Posts Domain (Default Exports):**
```typescript
// posts/index.ts
export { default as api } from './api';
export { default as logic } from './logic';
export * from './models';
```

**Integrations Domain (Hybrid - Named Services + Default Core):**
```typescript
// integrations/index.ts
export { default as api } from './api';
export { default as logic } from './logic';
export { IntegrationDAL, EventQueueDAL } from './dal';  // Class exports
export { IntegrationService } from './service';
export { withIntegrationTrigger } from './middleware';
export * from './models';
```

**See SPEC-exports.md for:**
- Complete comparison of default vs named exports
- Migration guide between patterns
- Consistency recommendations
- Index file best practices

## 6.4 Single-Record Pattern

For app-wide configuration domains (e.g., site settings):

```typescript
// src/domains/site/dal.ts
export const SiteDal = {
  async get(): Promise<SiteConfig | null> {
    await connectDB()
    return SiteConfigModel.findOne({}) // Empty filter - only one document
  },

  async update(data: Partial<SiteConfig>): Promise<SiteConfig> {
    await connectDB()
    return SiteConfigModel.findOneAndUpdate(
      {},  // Empty filter
      { $set: data },
      { new: true, upsert: true }
    )
  },
}
```

## 6.5 Multi-Record Pattern with Pagination

```typescript
// src/domains/posts/logic.ts
export const PostsLogic = {
  async list(options: ListOptions): Promise<PaginatedResponse<Post>> {
    const { skip = 0, top = 20, filter, orderby, search } = options

    const posts = await PostsDal.list({ skip, top, filter, orderby, search })
    const total = await PostsDal.count({ filter, search })

    return {
      data: posts,
      pagination: {
        total,
        skip,
        top,
        hasMore: skip + posts.length < total,
      },
    }
  },
}
```

## 6.6 Data Access Layer Patterns

**Pattern: Connection per operation**
```typescript
export const PostsDal = {
  async getAll(): Promise<Post[]> {
    await connectDB()  // Establish connection (cached)
    return PostModel.find()
  },
}
```

**Pattern: Error handling**
```typescript
export const PostsDal = {
  async getById(id: string): Promise<Post> {
    await connectDB()
    const post = await PostModel.findOne({ id })
    if (!post) {
      throw Boom.notFound('Post not found')
    }
    return post
  },
}
```

---

# 7. Architecture: App Router Layer

App Router pages are **thin wrappers** (<5 lines) that import features or wire domain APIs.

## 7.1 App Router as Thin Wrapper

**✅ CORRECT - Page imports feature:**
```typescript
// src/app/page.tsx
import { HomePage } from '@/features/home'

export default function Page() {
  return <HomePage />
}
```

**❌ WRONG - Logic in page:**
```typescript
// src/app/page.tsx
export default async function Page() {
  // ❌ Business logic doesn't belong here
  const db = await connectDB()
  const posts = await db.collection('posts').find().toArray()
  return <div>{/* ... */}</div>
}
```

## 7.2 Route Groups

**Public routes** (no auth):
```
src/app/(public)/
├── page.tsx              # Home
├── about/
│   └── page.tsx
├── blog/
│   └── [slug]/
│       └── page.tsx
└── layout.tsx            # Public layout
```

**Protected routes** (require auth):
```
src/app/(protected)/
├── dashboard/
│   └── page.tsx
├── settings/
│   └── page.tsx
└── layout.tsx            # Auth wrapper layout
```

**Protected layout:**
```typescript
// src/app/(protected)/layout.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return <>{children}</>
}
```

## 7.3 API Route Structure

**API routes MUST import domain API handlers:**

```typescript
// Example using "posts" domain - replace with your domain
// src/app/api/[domain]/route.ts
import { domainApi } from '@/domains/[domain]/api'

export const GET = domainApi.list
export const POST = domainApi.create
```

**Dynamic routes:**
```typescript
// src/app/api/[domain]/[id]/route.ts
import { domainApi } from '@/domains/[domain]/api'

export const GET = domainApi.getById
export const PATCH = domainApi.update
export const DELETE = domainApi.delete
```

**Next.js 15 params format:**
```typescript
// src/app/api/[domain]/[id]/route.ts
import { NextRequest } from 'next/server'

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // Await params Promise
  // ... use id
}

export const GET = withAuth(handler)
```

## 7.4 Dynamic Routes and Catch-All

**Dynamic segment:**
```
src/app/[feature]/[slug]/page.tsx
```

```typescript
export default async function DetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // ... fetch data by slug
}
```

**Catch-all route:**
```
src/app/docs/[...slug]/page.tsx
```

```typescript
export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const path = slug.join('/')
  // ... fetch doc by path
}
```

## 7.5 Layout and Metadata

**Site-wide metadata utilities:**

```typescript
// src/shared/utils/site-metadata.ts
import { Metadata, Viewport } from 'next'
import siteLogic from '@/domains/site/logic'

/**
 * Generates site-wide metadata from the site domain configuration.
 * Falls back to environment variables if database is unavailable.
 * Used by the root layout for default metadata across all pages.
 */
export async function generateSiteMetadata(): Promise<Metadata> {
  try {
    const metadata = await siteLogic.getMetadata()
    const { themeColor: _themeColor, ...cleanMetadata } = metadata as any
    return cleanMetadata
  } catch {
    return {}  // Fallback to empty if site domain unavailable
  }
}

/**
 * Generates site-wide viewport configuration from the site domain.
 */
export async function generateSiteViewport(): Promise<Viewport> {
  try {
    const metadata = await siteLogic.getMetadata() as any
    return {
      ...(metadata?.themeColor && { themeColor: metadata.themeColor }),
      width: 'device-width',
      initialScale: 1,
    }
  } catch {
    return {
      width: 'device-width',
      initialScale: 1,
    }
  }
}
```

**Root layout with dynamic metadata:**

```typescript
// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { generateSiteMetadata, generateSiteViewport } from '@/shared/utils/site-metadata'
import './globals.css'

// Generate metadata from site domain (or use static metadata)
export const metadata = await generateSiteMetadata()
export const viewport = await generateSiteViewport()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

**Dynamic metadata:**

**Note**: This example uses a "blog" feature with "posts" API to demonstrate metadata generation - not a requirement to build a blog system.

```typescript
// src/app/blog/[slug]/page.tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await fetch(`/api/posts/${slug}`).then(r => r.json())

  return {
    title: post.title,
    description: post.excerpt,
  }
}
```

---

## Sections 8-10 can be found in READ-THIS-FIRST-2.md