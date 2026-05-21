# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

**AKB Cargo** is a Telegram Mini App for cargo and shipping management. Users primarily interact with it inside Telegram, where the app validates Telegram `initData` on every request. The app also supports standalone browser access for admin and back-office workflows.

The frontend is a React 19 single-page application built with Vite 7 and TypeScript 5.9. It is deployed to Vercel as a static build with SPA routing fallback.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript 5.9 (SPA) |
| Build Tool | Vite 7 with `@vitejs/plugin-react-swc` |
| Styling | Tailwind CSS 4 + Radix UI primitives + shadcn/ui (New York style, neutral base) |
| State (Server) | TanStack Query (React Query) |
| State (Client UI) | Zustand |
| State (Forms) | React Hook Form + Zod |
| HTTP | Axios |
| Routing | Custom history-based (`window.history` + state) — **not** React Router |
| i18n | i18next (Uzbek `uz` default, Russian `ru`) |
| Charts | Recharts |
| Animations | Framer Motion |
| Toasts | Sonner |
| Icons | Lucide React |
| Mobile Dev | Eruda (commented out in main.tsx), Telegram WebApp SDK |
| Offline | IndexedDB via `idb` library |
| QR Scanning | html5-qrcode |
| PWA | Service worker + manifest.json |

## Build and Development Commands

```bash
npm run dev        # Start Vite dev server (host: true, port 5173)
npm run build      # TypeScript compile + Vite production build
npm run lint       # ESLint check (flat config, lints **/*.{ts,tsx})
npm run preview    # Preview production build locally
```

No test suite is configured. There are no test runners (Vitest, Jest, Playwright, Cypress) and no CI/CD pipelines.

## Project Structure

```
src/
├── api/
│   ├── client.ts              # Axios instances: apiClient (JSON) + apiClientFormData (multipart)
│   ├── hooks/                 # TanStack Query wrappers (e.g. useAdminClients.ts)
│   └── services/              # Domain API services (~20 files: auth, cargo, admin*, stats, warehouse, etc.)
├── components/
│   ├── ui/                    # shadcn/Radix primitives (button, dialog, form, sheet, etc.)
│   ├── admin/                 # Admin-specific components
│   ├── expectedCargo/         # Fast-entry cargo workflow components
│   ├── warehouse/             # Warehouse operation components
│   ├── manager/               # Manager client-search components
│   ├── profile/               # User profile components
│   ├── carousel/              # Media gallery components
│   ├── modals/                # Reusable modals (calculator, payment, etc.)
│   ├── statistics/            # Chart/stat components
│   ├── delivery/              # Delivery request components
│   ├── wallet/                # Wallet modal components
│   ├── navigation/            # Nav bars and layout
│   └── ...feature components  # AddCargoForm, CargoListPage, FlightsPage, etc.
├── pages/
│   ├── admin/                 # Admin pages (accounts, roles, audit, carousel, warehouse, etc.)
│   ├── Dashboard.tsx          # Heavy user home with tabs and carousel
│   ├── POSDashboard.tsx       # Cashier/accountant POS interface
│   ├── UserHome.tsx           # Thin wrapper around Dashboard
│   ├── UserPage.tsx           # User profile page
│   ├── UserReportsPage.tsx    # User reports
│   └── UserHistoryPage.tsx    # User cargo history
├── hooks/                     # Custom React hooks (useProfile, useConfirm, useToast, etc.)
├── store/                     # Zustand stores (warehouse, manager, expectedCargo, warehouseQueue)
├── schemas/                   # Zod schemas (clientSchemas, warehouseSchemas)
├── lib/                       # Utilities: cn(), format, telegram, validation, aviaCodes
├── utils/                     # IndexedDB wrappers, audio, webauthn, number formatting
├── i18n/                      # i18next config + uz/ru locale JSON files
├── config/
│   └── config.ts              # Reads required VITE_* env vars
├── constants/                 # district_uz_lang.json, district_ru_lang.json
├── main.tsx                   # Entry point: React root, QueryClient, ThemeProvider, SW registration
└── App.tsx                    # Root component: custom routing, auth, role gating, page renderer
```

Path alias `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

## Architecture

### Entry & Auth Flow

1. `src/main.tsx` → renders `<App />` inside `QueryClientProvider` and `ThemeProvider`
2. `TelegramWebAppGuard` wraps the app — validates Telegram context, attempts auto-login with `initData`
3. `App.tsx` checks token validity (`/auth/me`), loads user role, and resolves the initial route
4. Session token stored in `sessionStorage`; admin token in `localStorage`; both cleared on 401/403 responses

### Dual Authentication System

The app maintains **two separate auth systems**:

- **User auth** (`sessionStorage`, `access_token`): Used by Telegram Mini App users. Sent as `Authorization: Bearer <token>`.
- **Admin auth** (`localStorage`, `access_token` + `admin_role`): Used by back-office staff. Sent as `X-Admin-Authorization: Bearer <token>`.

These headers are **mutually exclusive** — `src/api/client.ts` request interceptors send only one of them. Sending both causes the user-auth middleware to intercept the admin JWT and reject it with 401. Admin token validity is proven on every API call; JWT is decoded client-side via `getAdminJwtClaims()` for `home_page`, `permissions`, and `role_name`.

### Custom Routing

The app does **not** use React Router. `App.tsx` maintains a `currentPage: Page` state (~25 page string literals):

- `resolvePageFromPath(rawPath)` — maps URL path to page type
- `checkAccess(targetPage, role)` — validates role-based permissions
- `applyRoute(routeInfo, role, method)` — syncs state + `window.history.pushState/replaceState` + URL
- `popstate` listener handles browser back/forward
- `getPathForPage(page)` and `getDefaultPageForRole(role)` handle URL generation and defaults

The backend JWT's `home_page` claim is authoritative and may differ from the static `ROLE_CONFIG` default.

### API Layer (`src/api/`)

All HTTP goes through `src/api/client.ts` (two Axios instances: `apiClient` and `apiClientFormData`). Interceptors:

- Attach `X-Telegram-Init-Data` from `window.Telegram.WebApp`
- Attach mutually exclusive auth header (`X-Admin-Authorization` or `Authorization`)
- Attach `Accept-Language` from i18next
- On 401 (except silent endpoints like `/admin/auth/refresh` and GET `/flight-schedule`): clear all tokens and dispatch `auth:logout` event
- Uzbekized error messages for auth/infra HTTP codes; business-logic errors (400, 409, 422) use backend's `detail` field

Domain services live in `src/api/services/`:
- `auth.ts`, `cargo.ts`, `client.ts`, `flight.ts`, `flightSchedule.ts`
- `adminAuth.ts`, `adminClients.ts`, `adminManagement.ts`, `adminCarousel.ts`
- `stats.ts`, `warehouse.ts`, `expectedCargo.ts`, `paymentService.ts`, `partnerService.ts`, `walletService.ts`, `deliveryService.ts`, `passportService.ts`, `reportService.ts`, `notificationService.ts`, `import.ts`, `carousel.ts`

### State Management

- **TanStack Query** — server/API state, caching, background refetch. Default `staleTime: 5min`, `retry: 1`.
- **Zustand** — client UI state (warehouse filters, manager search, expected-cargo queue)
- **React Hook Form + Zod** — form state and validation

### User Roles & Access Control

Static `ROLE_CONFIG` in `App.tsx` defines 8 roles:

| Role | Default Page | Allowed Pages |
|------|-------------|---------------|
| `user` | `user-home` | home, profile, history, reports |
| `worker` | `flights` | flights, cargo-list, cargo-add, passkey, expected-cargo, partners |
| `accountant` | `pos-dashboard` | pos-dashboard, admin-profile, passkey |
| `admin` | `admin-accounts` | full access except manager-page |
| `super-admin` | `admin-accounts` | full access including manager-page |
| `manager` | `manager-page` | manager-page, admin-carousel, admin-profile, passkey, flight-schedule-admin |
| `warehouse_worker` | `warehouse-page` | warehouse, expected-cargo, admin-profile, passkey, partners |
| `warehouse` | `warehouse-page` | warehouse, expected-cargo, admin-profile, passkey, partners |

Admin pages live in `src/pages/admin/` and `src/components/admin/`. The `AdminLayout` shell is only rendered for roles whose allowed list includes `admin-accounts`.

### Internationalization

i18next with Uzbek (`uz`) and Russian (`ru`) locales in `src/i18n/`. Default and fallback language is `uz`. Language drives the `Accept-Language` header on every API request.

### Offline Support

IndexedDB via the `idb` library caches:
- **Failed cargo uploads** (`src/utils/offlineStorage.ts`) — auto-cleans entries older than 30 days
- **Warehouse pending queue** (`src/utils/warehouseOfflineStorage.ts`) — photos and transactions for mark-taken operations

A minimal service worker (`public/sw.js`) is registered in production only. It caches same-origin navigation requests (app shell) with a network-first strategy, skipping `/api/*` and cross-origin requests.

### Environment Variables

`src/config/config.ts` reads these required env vars at build time:

- `VITE_API_BASE_URL`
- `VITE_API_INIT_DATA_URL`
- `VITE_API_LOGIN_URL`
- `VITE_API_REGISTER_URL`

## Code Style Guidelines

1. **Self-Documenting Code**:
   - Write clear, readable, and modular code (SOLID principles).
   - Variables and function names must be highly descriptive. The logic should explain itself.
   - Use inline comments ONLY to explain _WHY_ a specific technical decision was made, never _WHAT_ the code is doing.

2. **Strict Typing**:
   - TypeScript strict mode is enabled (`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`).
   - Never use `any`. Always define proper `interfaces` and `types`.

3. **Linting**:
   - ESLint 9 flat config (`eslint.config.js`).
   - Extends: `@eslint/js/recommended`, `typescript-eslint/recommended`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`.
   - Targets `**/*.{ts,tsx}`; ignores `dist/`.
   - No Prettier, Husky, or lint-staged is configured.

4. **Defensive Programming & Error Handling**:
   - Anticipate edge cases. Always handle `null` or `undefined` gracefully (optional chaining `?.` or explicit checks).
   - Never use bare `catch` blocks; catch specific errors and handle them properly.

## Security Considerations

- **PRIVACY AND SECURITY IS IMPORTANT!**
- Telegram `initData` is attached to every request via `X-Telegram-Init-Data` header.
- User tokens live in `sessionStorage` (cleared when tab closes); admin tokens live in `localStorage`.
- On 401/403, all tokens are cleared and an `auth:logout` event is dispatched.
- The `.env` file contains sensitive values and is gitignored.

## Deployment

The app is deployed to **Vercel** (`vercel.json`):

```json
{
  "version": 2,
  "builds": [{ "src": "package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } }],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

- Build output directory: `dist`
- SPA fallback: all non-file routes serve `index.html`

## Scripts & Tooling

- **`generate_constants.cjs`** — Node script that reads `src/constants/district_uz_lang.json` and `district_ru_lang.json`, generates `generated_districts.ts`, and injects region/district data into `src/i18n/locales/uz.json` and `ru.json`.
- **`generated_districts.ts`** — Auto-generated file. Note: it currently contains a duplicated `export const DISTRICTS` block which causes TypeScript errors and needs regeneration/fixing.

## Task Planning & Execution (TASK.md)

Whenever given a new feature request or complex task, you MUST manage the workflow using a file named `TASK.md` in the root directory.

Before writing or modifying any source code:
1. Create or overwrite `TASK.md`.
2. Write a clear **Objective**.
3. Draft a strict **Implementation Plan** using markdown checkboxes (`- [ ] Step 1`).
4. Write a brief **Walkthrough/Architecture** section.

As you complete each step, update `TASK.md` (checking off boxes). If the plan changes, update the document. This file serves as shared "living memory" and progress tracker.
