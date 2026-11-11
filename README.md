# English Stars

Hravé procvičování angličtiny pro Toma (učebnice Give Me Five! 2) s odměnami ve stylu Brawl Stars.
Jeden web bez serveru – běží v prohlížeči, pokrok se ukládá do prohlížeče tabletu.

## Struktura

| Cesta | Co je uvnitř |
|---|---|
| `index.html` | vstupní stránka (načítá data a skripty) |
| `css/style.css` | vzhled „Aréna" (tablet 1280×800, škáluje se) |
| `js/core.js` | uložená hra (verze schématu + migrace), obsah, Leitner, ekonomika, denní mise |
| `js/games.js` | minihry: poslech, skládačky, doplň slovo, hláskování, čísla, Blitz, zkouška nanečisto |
| `js/screens.js` | obrazovky: profily, postava, lobby, karty, obchod, Co mi nejde, Drop, Trophy Road, Pass, Pro tátu |
| `js/avatar.js` | 4 postavy a předměty (SVG vrstvy) |
| `js/items.js` | katalog předmětů a vzhledů (ID se nikdy nemění!) |
| `js/audio.js` | hlas (TTS), hláskování, čísla slovy, rozpoznávání řeči, zvuky |
| `js/common.js` | ikony, DOM pomůcky, škálování |
| `data/vocab.json` | slovní zásoba (zdroj pravdy – upravuj tady) |
| `data/vocab.js` | totéž jako JS pro načtení ve hře – generuje `data/build_vocab_js.py` |
| `data/vocab-summary.md` | čitelný přehled slovíček a frází |

## Úprava slovíček

1. Uprav `data/vocab.json` (nebo `data/merge_vocab.py` a přegeneruj).
2. Spusť `python data/build_vocab_js.py` → vznikne nový `data/vocab.js`.
3. Pushni na GitHub – tablet si při dalším otevření stáhne novou verzi.

Pravidla, aby se neztratil pokrok: **ID slov (`u2-carrot`) a předmětů (`head-cap-red`) se nikdy nemění ani nerecyklují.**
Zrušený předmět dostane `retired: true`. Uložená hra má `schemaVersion`; změny struktury se dělají přes `MIGRATIONS` v `js/core.js`.

## Nasazení na GitHub Pages (krok za krokem)

1. Na GitHubu vytvoř repozitář, např. `english-stars` (Public). Nezaškrtávej „Add a README".
2. V této složce (`D:\Tom\EnglishStars`) spusť:
   ```
   git init
   git add .
   git commit -m "English Stars v1"
   git branch -M main
   git remote add origin https://github.com/<tvoje-jmeno>/english-stars.git
   git push -u origin main
   ```
3. Na GitHubu: **Settings → Pages** → v části *Build and deployment* nastav **Source: Deploy from a branch**, **Branch: `main`**, složka **`/ (root)`** → Save.
   (Tady to obvykle padá: musí být větev `main` a složka `/ (root)`, ne `/docs`.)
4. Za 1–2 minuty bude hra na `https://<tvoje-jmeno>.github.io/english-stars/`. Adresa je napsaná nahoře na stránce Settings → Pages.
5. Na tabletu otevři adresu v Chromu → menu ⋮ → **Přidat na plochu** (nebo „Nainstalovat aplikaci"). Spouští se pak celoobrazovkově.
6. Aktualizace: změň soubory → `git add . && git commit -m "..." && git push`. Pokrok na tabletu zůstává (je uložený v prohlížeči, ne v souborech).

Soubor `.nojekyll` říká GitHubu, aby stránku jen servíroval, nic negeneroval.

## Zálohy

Pro tátu → Záloha → *Stáhnout zálohu* (JSON s pokrokem obou hráčů). Obnova tamtéž. Doporučeno 1× za 14 dní – hra sama připomene.

## Výchozí hodnoty

PIN do sekce Pro tátu: **1234** (změň v Pro tátu → Nastavení). Hráči: TomiiikMan, Táta.
