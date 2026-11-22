# O‘zgarishlar: xabarnomalar, AI kreditlar, referal (frontend)

Backend bilan mos: `steply-backend-main` (migratsiyalar 0032–0034, `/notifications/inbox`, `/admin/notifications/*`, `/admin/credits/*`, `/admin/referral/users/*`).

## 1. Referal kodi oqimi (tuzatildi)
- `shared/lib/referral.ts`: `?ref=KOD` har sahifada saqlanadi (30 kun, localStorage).
  Ro‘yxatdan o‘tish muvaffaqiyatli bo‘lsa o‘chiriladi.
- `shared/providers/referral-capture.tsx` (`app/layout.tsx` da ulangan): sahifa o‘zgarganda kodni oladi.
- Google va Telegram login (`features/auth/lib/*`): verify so‘roviga `referral_code` qo‘shiladi.
  Oldin bu maydon yuborilmasdi, shuning uchun referal faqat SMS yo‘lida yozilardi.
- SMS ro‘yxatdan o‘tish (`app/(auth)/register`): havoladan kod bo‘lmasa, saqlangan kod olinadi.

## 2. Foydalanuvchi bildirishnomalari
- Topbar (desktop) va mobil yuqori o‘ng burchakda qo‘ng‘iroqcha: o‘qilmaganlar soni, so‘nggi 6 ta, “hammasini o‘qildi”.
  Har 60 soniyada va oyna fokusga kelganda yangilanadi.
- Sahifa: `/dashboard/notifications` (filtr: barchasi / o‘qilmagan, sahifalash, o‘qilgan belgisi).
- Sidebar: “Bildirishnomalar” bandi (Hisob bo‘limida).
- Havola: faqat ichki yo‘l (`/...`) yoki `https://` ochiladi (`isSafeLink`).

## 3. Admin: xabarnomalar (`/admin/notifications/*`, nav “Xabarnomalar”)
- `/admin/notifications` — Yuborish: kanal (in_app, SMS, Telegram, Email), shablon yoki bir martalik matn,
  o‘zgaruvchilar, user ID lar yoki to‘g‘ridan-to‘g‘ri manzillar, turi (tranzaksion / reklama), email hisob, havola.
  Har yuborishda `idempotency_key` (crypto.randomUUID) — ikki marta bosilsa ham bitta to‘plam.
- `/admin/notifications/templates` — shablonlar: yaratish, tahrirlash (kod va kanal o‘zgarmaydi), ko‘rib chiqish.
- `/admin/notifications/rules` — hodisa × kanal matritsasi (`user_registered`, `order_paid`, `referral_rewarded`),
  va Email hisoblar: Gmail ulash (OAuth), default qilish, sinov xati, o‘chirish/yoqish.
  Gmail callback'dan keyin `?gmail=connected|error|cancelled|no_refresh_token` natijasi ko‘rsatiladi.
- `/admin/notifications/messages` — navbat: filtr (kanal, holat, turi), qayta yuborish, bekor qilish, navbatni darhol yuborish.

## 4. Admin: AI kreditlar (`/admin/credits`, nav “Moliya”)
- Tarif bo‘yicha: tarifning hozirgi faol obunachilariga kredit qo‘shish yoki ayirish (izoh majburiy).
- Foydalanuvchi bo‘yicha: UUID bo‘yicha balans va kreditlar tarixi, qo‘shish/ayirish.

## 5. Admin: referal (`/admin/referral`)
- Holat “Bekor qilingan” (`voided`), jadvalda “Bekor qilish” (sabab bilan).
- “Foydalanuvchi bo‘yicha” paneli: kod, taklif qilganlar, kreditlar, bonus kredit qo‘shish/ayirish, kodni yangilash.

## 6. API qatlami
- `shared/api/modules/notifications.ts`: `notificationsInboxApi`, `adminNotificationsApi`.
- `shared/api/modules/credits.ts`: `adminCreditsApi`.
- `shared/api/modules/referral.ts`: `adminReferralApi` ga `userDetail`, `adjustCredits`, `resetCode`, `voidReferral` qo‘shildi.
- `shared/api/modules/auth.ts`: `googleVerify(idToken, referralCode?)`, `telegramVerify(idToken, referralCode?)`.
- Turlar: `shared/api/types/notifications.ts`, `credits.ts`, `referral.ts` (yangilangan).

## Sozlamalar va eslatmalar
- Backend `FRONTEND_URL` Gmail callback'dan keyin `/admin/notifications` ga qaytaradi — frontend domeni shu bo‘lishi kerak.
- `crypto.randomUUID()` faqat HTTPS yoki localhost’da ishlaydi.
- Backendda foydalanuvchi o‘zi bildirishnoma sozlamalarini boshqaradigan API yo‘q (faqat email’dagi “bekor qilish” havolasi).
- Mobil qo‘ng‘iroqcha yuqori o‘ng burchakda sarlavha ustiga chiqishi mumkin; joyini sinab ko‘ring.

## Tekshiruv
- Sintaksis: barcha yangi/o‘zgargan fayllar TypeScript parser’dan o‘tdi.
- Importlar: loyiha ichidagi modul nomlari tekshirildi.
- To‘liq build (`next build`) va UI tekshiruvi hali bajarilmagan (node_modules yo‘q).

## 7. Obuna boshqaruvi va ro‘yxatdan o‘tish usuli
- `/admin/subscriptions` (nav “Moliya” → “Obuna boshqaruvi”): obunalar ro‘yxati (faol / muddati tugagan / barchasi, tarif, user ID),
  bitta obunani boshqarish: N kunga uzaytirish, tarifni o‘zgartirish, tugash sanasini o‘rnatish, faollashtirish/o‘chirish.
  Har bir amal izoh bilan (majburiy) saqlanadi.
- `/admin/users`: “Ro‘yxat usuli” ustuni va filtri (Telefon SMS, Telegram bot, Google, Telegram, Noma’lum).
- `shared/lib/registration-labels.ts`: qiymatlar va nomlar.
- Backend: `users.registration_method` (migratsiya 0035), `/admin/subscriptions/*`.
  Eski akkauntlar uchun qiymat taxminiy (identities bo‘yicha), qolganlari “Noma’lum”.
