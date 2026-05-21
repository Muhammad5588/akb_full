# TASK: Warehouse MarkTakenModal photo upload fix

## Objective
Replace the unreliable `<input capture="environment">` camera input in `MarkTakenModal` with the proven `MultiPhotoUpload` component (used in `AddCargoForm`) that uses `getUserMedia` API and supports both camera and gallery selection reliably — especially inside Telegram WebView.

## Implementation Plan
- [x] Add optional `compressGallery` prop + image compression to `MultiPhotoUpload` so gallery photos are also resized before upload.
- [x] Refactor `MarkTakenModal` to use `MultiPhotoUpload` instead of raw `<input type="file">` elements.
- [x] Ensure `react-hook-form` integration works correctly via `Controller`.
- [x] Verify no TypeScript or lint errors (`npm run lint` + `npm run build`).

## Walkthrough
`MultiPhotoUpload` already handles `getUserMedia` stream lifecycle, warm-start (`fastMode`), preview grid, lightbox, and gallery selection. We extended it with gallery image compression (same canvas-based resize used in `MarkTakenModal`) behind an optional prop. Then we dropped the inline camera/gallery markup from `MarkTakenModal` and render `<MultiPhotoUpload>` inside a `Controller`, wiring `value`/`onChange` to the form's `photos` field.

### Files changed
- `src/components/MultiPhotoUpload.tsx` — added `compressGallery` prop, `isCompressing` state, canvas-based `compressImageFile` helper, wired compression into `handleGallerySelect`, and added a spinner in the label.
- `src/components/warehouse/MarkTakenModal.tsx` — replaced all raw file-input logic with `<MultiPhotoUpload>` via `react-hook-form` `Controller`, removed unused `compressImage`, `previews`, and `useId` state.
