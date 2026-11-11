/* ============================================================
   ENGLISH STARS - app.js
   Start aplikace: nacteni ulozene hry, obsahu, prvni obrazovka
   ------------------------------------------------------------
   1. VERZE APLIKACE
   2. START
   3. GLOBALNI OSETRENI CHYB
   ============================================================ */
(function () {
  'use strict';
  /* ---------- 1. VERZE ---------- */
  window.ES_VERSION = '1.2.0';

  /* ---------- 2. START ---------- */
  function start() {
    const C = window.ES_CORE, U = window.ES_UI, SC = window.ES_SCREENS;
    if (!window.ES_VOCAB) { document.body.innerHTML = '<p style="color:#fff;padding:40px;font-family:sans-serif">Chybí soubor data/vocab.js – zkontroluj, že je složka data vedle index.html.</p>'; return; }
    C.load();
    C.buildContent();
    C.ensureAutoEvents();
    U.fitStage();
    // odemknout zvuk/TTS prvnim dotykem (Android)
    const unlock = () => { try { window.ES_AUDIO.speak(' ', { rate: 2 }); } catch (e) {} document.removeEventListener('pointerdown', unlock); };
    document.addEventListener('pointerdown', unlock);
    const sv = C.SAVE;
    if (sv.activeProfile && sv.profiles[sv.activeProfile]) {
      const p = sv.profiles[sv.activeProfile]; SC.applyTheme(p);
      SC.go(p.charId ? 'lobby' : 'character');
    } else SC.go('profiles');
    // automaticka pripominka zalohy jednou za 14 dni
    const lb = sv.settings.lastBackup;
    if (sv.activeProfile && (!lb || C.daysBetween(lb, C.todayKey()) > 14) && Object.keys(sv.profiles.tom.srs).length > 30) {
      setTimeout(() => U.toast('Tip pro tátu: už dlouho nebyla záloha pokroku (Pro tátu → Záloha).'), 4000);
    }
  }
  document.addEventListener('DOMContentLoaded', start);

  /* ---------- 3. CHYBY ---------- */
  window.addEventListener('error', e => {
    try { const t = document.getElementById('errbar'); if (t) { t.textContent = 'Chyba: ' + (e.message || e.error); t.style.display = 'block'; } } catch (x) {}
  });
})();
