# Objective
`DeliveryRequestPage` ichidagi yangi qo'shilgan matnlarning i18n tarjimalarini tekshirish va yetishmayotgan kalitlarni `uz/ru` locale'lariga qo'shish.

## Implementation Plan
- [x] `deliveryRequest.headerTitleShort` kaliti mavjudligini tekshirish
- [x] `AddressConfirmation` ichidagi hardcoded matnlarni i18n kalitlariga o'tkazish
- [x] `uz.json` va `ru.json` ichiga yangi kalitlarni qo'shish
- [x] Type/syntax xatolarini tekshirish

## Walkthrough / Architecture
`deliveryRequest.headerTitleShort` allaqachon locale fayllarda mavjud.
Qo'shimcha ravishda `AddressConfirmation` ichidagi matnlar hardcoded bo'lgani uchun ular `deliveryRequest.addressConfirmation.*` kalitlariga o'tkaziladi va ikki tilda to'ldiriladi.
