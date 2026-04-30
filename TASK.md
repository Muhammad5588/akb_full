# Objective

Zayafka yuborishdan oldin foydalanuvchi yetkazib berish manzilini majburiy tekshirishi/tahrirlashini ta'minlash. Yangi matnlar `uz` va `ru` locale JSON fayllariga qo'shiladi.

# Implementation Plan

- [x] Delivery request UI oqimini aniqlash (`DeliveryRequestModal` yoki `DeliveryRequestPage`)
- [x] Mavjud profil/manzil tahrirlash imkoniyatini topish
- [x] Zayafka submitdan oldin manzil tasdiqlash gate qo'shish
- [x] Kerakli `uz.json` va `ru.json` translation keylarini qo'shish
- [x] Build/lint bilan tekshirish

# Verification

- `npm.cmd run build` sandbox tashqarisida muvaffaqiyatli yakunlandi.
- `npx.cmd eslint src\components\pages\DeliveryRequestPage.tsx src\components\profile\EditProfileModal.tsx` muvaffaqiyatli o'tdi.
- `npm.cmd run lint` mavjud pre-existing lint xatolari sabab to'xtadi: `generated_districts.ts`, `CargoListPage.tsx`, va UI wrapper fast-refresh qoidalari.
- `uz.json` va `ru.json` JSON parse tekshiruvidan o'tdi.

# Walkthrough/Architecture

Delivery request komponenti user profilidagi manzilni ko'rsatadi. Submit tugmasi manzil tasdiqlanmaguncha bloklanadi, user esa edit action orqali profil manzilini yangilaydi. Confirmation holati vaqtinchalik frontend session state orqali saqlanadi, shunda user bir sessiyada qayta-qayta majburlanmaydi.
