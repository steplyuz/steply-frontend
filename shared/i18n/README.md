# Tillar: o‘zbek (lotin amaldagi / yangi / kirill), English, Русский

- Manba matnlar **amaldagi o‘zbek lotin** alifbosida yoziladi (`o‘`, `g‘`, `sh`, `ch`). `ö/ğ/ş/ç` yozmang.
- `shared/providers/alphabet-provider.tsx` — holat (`old | new | cyrl | en | ru`), `useAlphabet()`, `<Uz>`.
  `LanguageDomSync` `<Uz>` ga o‘ralmagan matn va `placeholder/title/aria-label/alt` larni ham o‘tkazadi.
  Matnni o‘tkazmaslik: elementga `data-no-i18n` qo‘ying (test matni, foydalanuvchi kontenti).
- `shared/lib/uz-alphabet.ts` — lotin→yangi, lotin→kirill, kirill/yangi→eski konvertorlari.
- `shared/i18n/dict/en.ts`, `ru.ts` — kalit: manba matn; qiymat: tarjima. Raqamli andoza: `"# kun qoldi": "# days left"`.
- Yangi matn qo‘shgach: `python3 scripts/i18n-missing.py` — tarjimasizlarni ko‘rsatadi.
- Tarjima topilmasa, matn o‘zbekcha (amaldagi lotin) qoladi.
- Til almashtirgich: `shared/ui/language-switch.tsx` (`<LanguageSwitch />`) — public header, kabinet topbar/sidebar, kirish sahifalari va Sozlamalarda bitta komponent.
- Saqlash: brauzerda (`steply:uz-alphabet`, 5 variant) + backendda `profile.language` (`uz | ru | en`; alifbo varianti faqat brauzerda). Kirgan foydalanuvchida brauzerda tanlov bo‘lmasa — backend tili olinadi, bo‘lsa — backendga yoziladi.
- API so‘rovlari `Accept-Language` (`uz | ru | en`) bilan ketadi (`shared/api/client.ts`).
- JSX da `{n} ta savol` kabi jumla React tomonidan bir nechta matn tuguniga bo‘linadi; en/ru da qo‘shni tugunlar birlashtirilib tarjima qilinadi. Kalit: `"# ta savol"`. Sana/vaqt: `"Hafta boshi: #"`.
- Metadata sarlavhalari (`title`) manba matnda faqat amaldagi lotinda yoziladi (`Kirish`, `Kiriş` emas).

