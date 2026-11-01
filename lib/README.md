# lib/ tuzilmasi

```
lib/
├─ api/                      Backend bilan aloqa (faqat transport + endpointlar + turlar)
│  ├─ client.ts config.ts routes.ts resource.ts upload.ts download.ts use-api.ts legacy.ts index.ts
│  ├─ modules/
│  │  ├─ auth, profile, public, billing, apply, analysis, admin      umumiy platforma
│  │  ├─ practice/   catalog, reading, listening, writing, speaking  practice + test banki (admin CRUD)
│  │  └─ exam/       exams (MK-ID / examx), mock-exams, mock-center  rasmiy imtihon
│  └─ types/         modullar bilan bir xil bo'linish (practice/, exam/)
├─ practice/                 Practice rejimi UI mantiqi
│  ├─ access.ts              premium qulf yordamchilari (`is_locked`, obuna havolasi)
│  ├─ api/                   reading / listening / writing adapterlari (test sahifalari uchun)
│  └─ result-storage.ts
├─ exam/                     Imtihon (mock / examx) UI mantiqi
│  ├─ lock.ts                bo'lim topshirilgach qayta kirishni yopish + deadline (localStorage)
│  ├─ skill.ts theme.ts use-countdown.ts mock-labels.ts
│  ├─ api/mock.ts            MK-ID mock adapteri
│  └─ types/                 imtihon komponentlari uchun view-model (reading, listening)
├─ admin/                    json-templates, question-types
├─ auth/  speaking/          o'zgarishsiz
└─ brand.ts format.ts media.ts utils.ts
```

Qoida: `lib/api` hech qachon `lib/practice` yoki `lib/exam` dan import qilmaydi.

## Premium practice qulfi
- `GET /practice/tests?skill=…` har bir testga `access` (`free|premium`) va `is_locked` qo'shadi.
- `SkillPractice` (`skill="reading"` …) qulflangan testni "Premium" belgisi va "Obunani ochish" tugmasi bilan ko'rsatadi.
- Asl himoya serverda: qulflangan testni ochish/boshlash 403 qaytaradi (`ensure_practice_access`).
