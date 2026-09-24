# STEPLY frontend — API qatlami qayta tashkil etildi (2026-09-24)

`lib/api` endi 12 ta modulga bo'lingan (har biri alohida fayl), turlar ham modul bo'yicha
ajratilgan. Kirish nuqtasi: `import { readingApi } from '@/lib/api'`, turlar: `@/lib/api/types`.

- `lib/api/routes.ts` — barcha backend prefikslari bitta joyda (yo'l o'zgarsa faqat shu fayl).
- `lib/api/modules/*.ts` — auth, profile, public, mock-exams, mock-center, reading, listening,
  writing, speaking, practice, billing, admin (+ system: health).
- `lib/api/client.ts`, `upload.ts`, `download.ts` — bir xil auth (cookie, 401 -> refresh) va xato formati.
- Eski `endpoints.ts`, `listening-audio.ts`, `types.ts` o'chirildi; ishlatilmagan `lib/cefr-api`,
  `lib/cefr-types`, `lib/types/mock.ts`, `lib/api/auth.ts` olib tashlandi (kompilyatsiyani buzar edi).
- Bir xil vazifalar birlashtirildi: `resource.ts` (createAdminCrud / createTestTakingApi / createPaperExamApi),
  `apiUpload` + `buildForm` (barcha fayl yuklashlar), `withSessionRetry` (401→refresh: fetch/XHR/download),
  `apiErrorFrom`, `UpdateOf<T>`. Metod nomlari birxillashdi: `adminList/adminGet/create/update/remove`
  (speaking: listTests→adminList, createTest→create, removeTest→remove; reading/listening: getAdmin→adminGet).
- Yo'llar (URL) o'zgarmagan: eski va yangi qatlam bir xil so'rovlar yuboradi (tekshirilgan).

⚠️ Quyidagi eski yozuv (2026-09-18) endpoints.ts haqida `/mock-test`, `/reading-test` deydi, lekin
zipdagi haqiqiy fayl `/mock-exams`, `/reading-tests`, `/admin/...` ishlatgan. Backend bilan oxirgi
marta tekshirilgan yo'llar `routes.ts` da; nomuvofiqlik chiqsa faqat shu faylni tuzating.

---

# CEFR → EXAMS migration checkpoint

## 2026-09-18 — API URL path alignment (this pass)

Backend (`steply-backend-fixed`, tekshirilgan, 163 endpoint) bilan
solishtirib, quyidagilar tuzatildi:

1. **`lib/api/endpoints.ts` (asosiy client, 30 faylda ishlatiladi) — to'liq
   qayta yozildi.** Ilgari bu yerda backendda umuman mavjud bo'lmagan yo'llar
   bor edi: `/mock-exams/admin/...`, `/cefr/all/reading/...`,
   `/speaking/tests` va h.k. Endi HAMMASI haqiqiy backend prefikslariga mos:
   `/mock-test/...`, `/admin/mock-test/...`, `/reading-test/...`,
   `/listening-test/...`, `/writing-test/...`, `/speaking-test/...`.
   Shuningdek, ilgari `mockCenterApi` va `adminApi` ichida noto'g'ri
   yo'llarga ishora qiluvchi funksiyalar bor edi (masalan check-in, finalize,
   scoreSkill — `/center/` segmenti tushirib qoldirilgan edi); bularning
   barchasi ham tuzatildi. Backendda bor-u frontendda umuman chaqirilmagan
   `/billing/*` va `/practice/tests` uchun ham `billingApi`/`practiceApi`
   qo'shildi.
2. **`lib/api/client.ts`** — backend endi har bir xatolikda barqaror `code`
   va (422 uchun) `fields` beradi (`app/core/errors.py`); `ApiRequestError`
   shularni to'g'ri o'qiydigan qilindi (orqaga mos, chunki mavjud kod faqat
   `.message`dan foydalanadi).
3. **`lib/cefr-api/*` oroli (`app/cefr-migrated`, faqat o'z-o'zidan
   ishlatiladi, asosiy navigatsiyada yo'q)** — bu yerdagi API yo'llarining
   aksariyati (reading/listening/writing/mock) allaqachon backendga TO'G'RI
   mos edi, lekin loyiha umuman kompilyatsiya bo'lmas edi:
   - Yetishmayotgan `./axios` adapteri yaratildi (`lib/cefr-api/axios.ts`) —
     mavjud, backend bilan moslashtirilgan `lib/api/client.ts` ustiga
     yupqa qatlam sifatida.
   - Noto'g'ri tur importlari (`../types/reading` va h.k.) haqiqiy
     `../cefr-types/...`ga tuzatildi.
   - `lib/cefr-types/listening.ts`dagi ikki marta e'lon qilingan
     `ListeningExamUpdate` interfeysi (kompilyatsiya xatosi) birlashtirildi.
   - Yetishmayotgan `@/lib/types/mock.ts` yaratildi (`lib/cefr-api/mock.ts`
     shuni kutgan edi).
   - Yetishmayotgan `@/lib/api/auth.ts` (`authService.getMe()`) — mavjud
     `authApi.me()`ni o'raydigan moslashtiruvchi sifatida yaratildi.
   - `reading.ts`dagi backendda mavjud bo'lmagan `/{test_id}/my-result`
     endpointi (hech qayerda chaqirilmaydi) izoh bilan belgilab qo'yildi.

## ⚠️ Hali qolgan, API yo'llariga aloqasi YO'Q ishlar

`app/cefr-migrated` va `components/cefr-exam` hali quyidagi **UI
komponentlari yo'qligi** sababli kompilyatsiya bo'lmaydi (bular API
so'rovlari bilan bog'liq emas, shuning uchun shu safar qo'shilmadi):
`components/ui/avatar.tsx`, `components/ui/badge.tsx`,
`components/ui/card.tsx`, `components/ui/input.tsx`,
`components/UnlockModal.tsx`, `components/highlight-text.tsx`.

## Resume point
UI komponentlarini qo'shish (yoki loyihadagi boshqa shadcn/ui
o'rnatishidan import qilish), so'ng `npm install && npx tsc --noEmit`
orqali to'liq tekshirish.
