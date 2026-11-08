#!/usr/bin/env python3
"""Lug'atda (shared/i18n/dict/en.ts, ru.ts) tarjimasi yo'q o'zbekcha matnlarni topadi.
Ishlatish:  python3 scripts/i18n-missing.py [--admin]
Admin sahifalari (app/admin, features/admin) sukut bo'yicha o'tkazib yuboriladi."""
import os, re, sys, json
UZ = re.compile(r"[oOgG][‘’ʻʼ']|\b(?:ta|va|bilan|uchun|yoki|qoldi|kun|soat|daqiqa|ball|oy|yil|marta|savol|urinish|natija|bor)\b", re.I)
lit = re.compile(r"""(?P<q>["'`])(?P<s>(?:\\.|(?!(?P=q))[^\n\\]){2,400}?)(?P=q)""")
jsx = re.compile(r">([^<>{}]{2,400})<")
norm = lambda s: re.sub(r"\s+", " ", re.sub(r"[’ʻʼ`´']", "‘", s)).strip()
def keys(path):
    s = open(path, encoding="utf-8").read()
    return {norm(json.loads(m.group(1))) for m in re.finditer(r'^\s*("(?:[^"\\]|\\.)*"):', s, re.M)}
have = keys("shared/i18n/dict/en.ts") & keys("shared/i18n/dict/ru.ts")
skip_admin = "--admin" not in sys.argv
missing = {}
for base in ("app", "features", "shared"):
    for root, _, files in os.walk(base):
        r = root.replace("\\", "/")
        if skip_admin and "admin" in r: continue
        for f in files:
            if not f.endswith(".tsx"): continue
            s = open(os.path.join(root, f), encoding="utf-8").read().replace("\r", "")
            for rx in (jsx, lit):
                for m in rx.finditer(s):
                    t = norm(m.group(1) if rx is jsx else m.group("s"))
                    if "${" in t or "className" in t or t.startswith(("http", "/", "@")): continue
                    if re.search(r"[{};=<>`]", t) or not UZ.search(t) or t in have: continue
                    missing.setdefault(t, os.path.join(root, f))
for t, p in sorted(missing.items()): print(f"{p}: {t}")
print(f"\n{len(missing)} ta matn tarjimasiz", file=sys.stderr)
