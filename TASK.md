# Objective
`FlightSchedulePage` dizaynini AKB vizual uslubiga moslash: oq/ko'k ranglar, yumshoq cardlar, kuchli ierarxiya va yanada premium calendar ko'rinishi.

## Implementation Plan
- [ ] Sahifaning umumiy rang palitrasini AKB ko'k/oq uslubiga o'tkazish
- [ ] Header, calendar panel va sidebar cardlarni qayta stilizatsiya qilish
- [ ] Flight cardlar, CTA va upcoming bloklarni AKB surfaces bilan yangilash
- [ ] Type/syntax xatolarini tekshirish

## Walkthrough / Architecture
Sahifa mavjud data-flow va calendar logic'ni saqlab qoladi; faqat visual layer yangilanadi. Asosiy e'tibor `BackgroundGlow`, month navigation, selected-day detail card va `FlightCard` komponentlaridagi AKB-style surface, border va accent ranglariga beriladi.
