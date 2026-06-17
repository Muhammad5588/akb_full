# Objective

Add Redis-controlled Eruda debugging for the warehouse page and make warehouse offline queue data recoverable from the browser console.

# Implementation Plan

- [x] Add backend Redis endpoints for warehouse Eruda status/toggle.
- [x] Add frontend Eruda controller in the global entry path.
- [x] Expose warehouse IndexedDB queue debug helpers when Eruda is enabled.
- [x] Wire the frontend controller from `src/main.tsx`.
- [x] Run backend and frontend verification.

# Walkthrough / Architecture

The frontend should not permanently ship an always-on mobile console. `src/main.tsx` will start a lightweight controller that checks a protected backend endpoint for the `warehouse` Eruda flag. The backend stores this flag in Redis with an optional TTL so Eruda can be enabled temporarily during production debugging. When enabled on `/warehouse` or `/admin/warehouse`, Eruda is dynamically imported and initialized. The same controller exposes `window.akbWarehouseDebug` helpers so IndexedDB queue data from `warehouse-offline-db` can be inspected even if the floating offline manager button is not visible.
