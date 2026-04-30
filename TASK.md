# Objective

Apply the backend POS cashier-log update in the frontend by supporting the new `payment_provider`, `date_from`, and `date_to` query filters and exposing them in the POS dashboard without breaking the existing shared cashier log flow.

# Implementation Plan

- [x] Update POS API types to include cashier-log providers, summary totals, and the `payment_provider` request parameter.
- [x] Add POS dashboard state and query-key wiring for the cashier-log provider filter.
- [x] Add compact provider filter controls and summary display to the cashier-log panel.
- [x] Add date/time range controls for `date_from` and `date_to`.
- [x] Wire date/time filters into the cashier-log query key and API request.
- [x] Run lint/build verification and fix any TypeScript issues.

# Verification

- `node_modules\.bin\eslint.cmd src\api\pos.ts src\pages\POSDashboard.tsx` passed.
- `npm.cmd run build` passed when run outside the sandbox after `esbuild` hit `spawn EPERM` inside the sandbox.
- `npm.cmd run lint` still fails on pre-existing unrelated files: `generated_districts.ts`, `src\components\CargoListPage.tsx`, and shadcn-style UI wrapper fast-refresh rules.

# Walkthrough/Architecture

`POSDashboard` reads cashier logs through `getCashierLog()` from `src/api/pos.ts`. The backend now accepts `payment_provider` (`cash`, `card`, `click`, `payme`, `wallet`) plus `date_from` and `date_to` ISO datetime bounds, and returns provider-level `summary`. The frontend should keep this as API state in TanStack Query by including the selected provider and date range in the query key, pass them as query parameters, and render filter controls beside the existing recent-payments log. The list remains shared across cashiers, while the filters narrow rows by provider and time range when selected.
