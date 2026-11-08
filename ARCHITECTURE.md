# Steply frontend: arxitektura

Import alias: `@/*` → loyiha ildizi (masalan `@/features/practice/lib/access`, `@/shared/ui/button`).

```
app/                     Next.js route'lar (yo'llarni Next belgilaydi, shuning uchun joyida)
│  (auth) (dashboard) admin teacher-expert about contact result ...
│  globals.css           Yagona yashil dizayn tizimi (tokenlar, .ds-card, .ds-input ...)
│
features/                Sohalar: har biri o'z komponent, lib (hook/helper) va API adapterlari bilan
│  auth/        components/ (auth-shared, telegram-script)   lib/ (google-login, telegram-login, script-loader)
│  dashboard/   components/ (ai-reminder, plan-calendar, promo-banner, study-path-wizard)
│               layout/     (sidebar, topbar, bottom-nav, dashboard-nav, user-badges)
│  practice/    components/ (practice-hub, practice-config, skill-practice)   lib/ (access, api/*, result-storage)
│  speaking/    components/ (speaking-*)                                      lib/ (examiner, export, instructions, weakness, access)
│  exam/        components/ (exam-shell, exam-ui, dialogs, preflight, camera-feed ...)
│               cefr/       (reading | listening | writing | speaking imtihon ekranlari)
│               lib/        (lock, skill, theme, use-countdown, api/mock, types/*)
│  analysis/    analysis-shared.tsx
│  mock-exams/  components/ (mock-registration-panel)
│  onboarding/  components/
│  marketing/   components/ (landing: hero, skills, process ...)
│  admin/       components/  layout/ (admin-topbar, role-sidebar, admin-page-shell)  lib/
│
shared/                  Sohaga bog'liq bo'lmagan umumiy qatlam
   api/         Backend bilan aloqa: client, config, routes, use-api, modules/*, types/*
   providers/   auth-context, alphabet-provider
   ui/          button, avatar, circle, dashboard-kit (Card, StatCard, Gauge, btn...), select, date-picker,
                language-switch, highlight-text, icons/, island/
   layout/      public sayt header va footer
   lib/         brand (yashil tokenlar), format, media, utils, uz-alphabet, mock-labels
   i18n/        dict/ (en, ru) + README
```

## Qoidalar
1. `shared/` hech qachon `features/` dan import qilmaydi.
2. `shared/api` hech qachon `features/*` dan import qilmaydi.
3. Feature boshqa feature'ga faqat quyidagi yo'nalishda tayanadi: `practice → exam → speaking`. Teskari yo'nalish va aylana bog'lanish taqiqlanadi.
4. Ikki feature ishlatadigan narsa `shared/` ga ko'chiriladi (masalan `auth-context`, `mock-labels`).
5. `app/` dagi sahifalar yupqa bo'ladi: ma'lumot olish va feature komponentlarini yig'ish.

## Dizayn
Foydalanuvchi qismi: `shared/lib/brand.ts` va `app/globals.css` (yashil palitra). Admin va teacher-expert `.admin-theme` ichida neytral rangda qoladi.
Yangi karta: `Card` / `StatCard` (`@/shared/ui/dashboard-kit`) yoki `.ds-card`. Tugma: `Button` (`@/shared/ui/button`) yoki `btn.*`.

## Tillar (i18n)
`shared/i18n/README.md`. Tarjimasiz matnlarni topish: `python3 scripts/i18n-missing.py`.
