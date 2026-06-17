# Objective

Add an iOS-friendly hard refresh action to the Warehouse page header.

# Implementation Plan

- [x] Add a reload handler in `WarehousePage`.
- [x] Make the visible "Ombor" title tappable without changing layout.
- [ ] Run targeted frontend verification.

# Walkthrough / Architecture

The Warehouse page is a single-page route, but iOS standalone/PWA mode does not provide the normal browser refresh affordance. The header title will trigger a full document navigation with a timestamp query parameter so the page reloads from the app shell instead of only resetting React state.
