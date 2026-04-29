# Objective

Flights page headerida `partners:manage` huquqiga ega worker va super-admin foydalanuvchilar uchun "Partnerlar" boshqaruv tugmasini ko'rsatish va bosilganda `/admin/partners` sahifasiga o'tishini ta'minlash.

# Implementation Plan

- [x] `FlightsPage.tsx` permission va header actionlarini ko'rib chiqish
- [x] Worker route whitelistiga `admin-partners` sahifasini qo'shish
- [x] `FlightsPage`ga partner boshqaruv permission checki va navigation tugmasini qo'shish
- [x] Build/lint orqali tekshirish

# Verification

- `npm.cmd run build` muvaffaqiyatli yakunlandi.
- `npm.cmd run lint` mavjud pre-existing lint xatolari sabab to'xtadi: `generated_districts.ts`, `CargoListPage.tsx`, va UI wrapper fast-refresh qoidalari. Yangi o'zgargan fayllarda lint xatosi chiqmadi.

# Walkthrough/Architecture

`App.tsx` custom routing orqali sahifa almashadi. `FlightsPage` faqat callback orqali sahifa o'zgartira oladi, shuning uchun App undan `onNavigate` propini o'tkazadi. Tugma JWT claimlardan `isSuperAdmin` yoki `partners:manage` permission borligini tekshiradi va `onNavigate('admin-partners')` chaqiradi. Worker roli uchun static route whitelist ham shu sahifaga ruxsat berishi kerak.
