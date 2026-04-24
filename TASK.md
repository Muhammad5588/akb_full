# Objective
`AdminLayout` ichidan `flight-schedule-admin` sahifasiga kira olmaslik muammosini routing darajasida tuzatish.

Maqsad palitra:
- `#3b82f6`
- `#38bdf8`
- `#60a5fa`
- `#dbeafe`
- `#bfdbfe`

## Implementation Plan
- [x] `App.tsx`da `flight-schedule-admin` sahifasining route type'ini qo'shish
- [x] `getPathForPage` va `resolvePageFromPath` mappingini qo'shish
- [x] Role allowed ro'yxatlariga kerakli sahifani qo'shish
- [x] AdminLayout render branchida sahifani real komponentga ulash
- [x] Syntax/problemlarni tekshirish

## Walkthrough / Architecture
Muammo sababi: `AdminLayout`da menyu elementi mavjud bo'lsa ham, `App.tsx` route registrida `flight-schedule-admin` yo'q edi.
Shu sabab `checkAccess` fallback/default sahifaga qaytarib yuborayotgan edi.

Yechim:
1. `Page` union type'ga `flight-schedule-admin` qo'shildi.
2. URL mapping (`getPathForPage`/`resolvePageFromPath`) qo'shildi.
3. Kerakli rollarning allowed ro'yxatiga sahifa qo'shildi.
4. AdminLayout ichida ushbu page uchun real render (`<FlightScheduleAdminPage />`) qo'shildi.
