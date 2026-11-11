/* ============================================================
   ENGLISH STARS - common.js
   Sdilene UI pomucky: ikony, DOM, formatovani, skalovani na tablet
   ------------------------------------------------------------
   1. DOM A FORMATOVANI
   2. IKONY (inline SVG, bez emoji v UI prvcich)
   3. SPOLECNE KOMPONENTY (pocitadla, progress bar, hlaska)
   4. SKALOVANI PLOCHY 1280x800 NA OBRAZOVKU
   ============================================================ */
(function () {
  'use strict';
  /* ---------- 1. DOM ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
  function fmt(n) { return Number(n || 0).toLocaleString('cs-CZ'); }
  function on(root, selector, event, handler) {
    root.addEventListener(event, e => { const t = e.target.closest(selector); if (t && root.contains(t)) handler(e, t); });
  }
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  // Vymeni element za prazdny klon -> zahodi vsechny posluchace udalosti (ochrana proti hromadeni)
  function fresh(el) { const n = el.cloneNode(false); n.innerHTML = ''; el.replaceWith(n); return n; }
  function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  /* ---------- 2. IKONY ---------- */
  const PATHS = {
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/>',
    coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>',
    gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/>',
    chest: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M3 12h18M12 12v4M7 8V6a5 5 0 0 1 10 0v2"/>',
    ear: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    tiles: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><path d="M14 17h7M17.5 13.5v7"/>',
    gap: '<path d="M4 7h6M14 7h6M4 12h16M4 17h10"/><rect x="10" y="4" width="4" height="6" rx="1"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
    abc: '<path d="M3 17l3-10 3 10M4.5 13h3"/><path d="M12 7h3a2.5 2.5 0 0 1 0 5h-3zM12 12h3.5a2.5 2.5 0 0 1 0 5H12z"/><path d="M19 7v10"/>',
    '123': '<path d="M4 8l2-1v10M10 8a2 2 0 1 1 3.5 1.5L10 17h4M17 7h4l-2.5 4a2.2 2.2 0 1 1-1.5 4"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    repeat: '<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
    exam: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    check: '<path d="M5 12l4 4L19 6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    next: '<path d="M9 5l7 7-7 7"/>',
    list: '<path d="M4 6h3M4 12h3M4 18h3M10 6h10M10 12h10M10 18h10"/>',
    cards: '<rect x="4" y="3" width="12" height="16" rx="2"/><path d="M8 7h4M20 7v12a2 2 0 0 1-2 2H9"/>',
    sword: '<path d="M3 3l12 12M13 17l4-4M15 15l5 5M18 18l2-2"/>',
    shop: '<path d="M6 7h12l1 13H5L6 7z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="3"/><path d="M15.5 14a5.5 5.5 0 0 1 6 6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v4"/>',
    star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/>',
    speaker: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6"/>',
    warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
    heart: '<path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    home: '<path d="M3 11l9-8 9 8M5 10v11h14V10M10 21v-6h4v6"/>',
    brain: '<path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 1 5.5A3 3 0 0 0 9 21h1V3zM15 3a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-1 5.5A3 3 0 0 1 15 21h-1V3z"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
    upload: '<path d="M12 15V3M7 8l5-5 5 5M4 20h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    fire: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-3-1-6-4-8 0 4-4 6-4 11a7 7 0 0 0 7 8z"/>',
    pencil: '<path d="M3 21l4-1L19 8l-3-3L4 17z"/><path d="M14 7l3 3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  };
  function icon(name, size, color, extra) {
    const p = PATHS[name] || PATHS.info;
    return `<svg class="ic" width="${size || 22}" height="${size || 22}" viewBox="0 0 24 24" fill="none" stroke="${color || 'currentColor'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra || ''}>${p}</svg>`;
  }

  /* ---------- 3. KOMPONENTY ---------- */
  function pill(iconName, value, color, title) { return `<div class="pill" title="${esc(title || '')}">${icon(iconName, 22, color)}<span>${fmt(value)}</span></div>`; }
  function bar(pct, color, h) { return `<div class="bar" style="height:${h || 10}px"><div class="bar-in" style="width:${Math.max(0, Math.min(100, pct))}%;background:${color || 'var(--accent)'}"></div></div>`; }
  function segments(total, done, cls) {
    let s = '<div class="segs">'; for (let i = 0; i < total; i++) s += `<div class="seg ${i < done ? (cls || 'ok') : ''}"></div>`; return s + '</div>';
  }
  function powerDots(level) { let s = '<div class="power">'; for (let i = 0; i < 5; i++) s += `<div class="pdot ${i < level ? 'on' : ''}"></div>`; return s + '</div>'; }
  let toastTimer = null;
  function toast(msg, kind) {
    let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; $('#stage').appendChild(t); }
    t.className = 'show ' + (kind || ''); t.innerHTML = msg;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.className = ''; }, 2600);
  }
  // Jednoduchy modal; vraci Promise s hodnotou tlacitka
  function modal(html, buttons) {
    return new Promise(resolve => {
      const wrap = document.createElement('div'); wrap.className = 'modal-wrap';
      wrap.innerHTML = `<div class="modal">${html}<div class="modal-btns">${(buttons || [{ id: 'ok', label: 'OK', cls: 'btn-accent' }]).map(b => `<button class="btn ${b.cls || ''}" data-id="${b.id}">${b.label}</button>`).join('')}</div></div>`;
      $('#stage').appendChild(wrap);
      wrap.addEventListener('click', e => { const b = e.target.closest('button[data-id]'); if (!b) return; const val = { id: b.dataset.id, wrap }; wrap.remove(); resolve(val); });
    });
  }
  function prompt(html, defaultVal, type) {
    return new Promise(resolve => {
      const wrap = document.createElement('div'); wrap.className = 'modal-wrap';
      wrap.innerHTML = `<div class="modal">${html}<input class="inp" type="${type || 'text'}" value="${esc(defaultVal || '')}"><div class="modal-btns"><button class="btn" data-id="cancel">Zrušit</button><button class="btn btn-accent" data-id="ok">OK</button></div></div>`;
      $('#stage').appendChild(wrap);
      const inp = $('input', wrap); setTimeout(() => inp.focus(), 50);
      wrap.addEventListener('click', e => { const b = e.target.closest('button[data-id]'); if (!b) return; const v = b.dataset.id === 'ok' ? inp.value : null; wrap.remove(); resolve(v); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { const v = inp.value; wrap.remove(); resolve(v); } });
    });
  }

  /* ---------- 4. SKALOVANI ---------- */
  const STAGE_W = 1280, STAGE_H = 800;
  function fitStage() {
    const st = $('#stage'); if (!st) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const scale = Math.min(vw / STAGE_W, vh / STAGE_H);
    st.style.transform = `translate(${Math.round((vw - STAGE_W * scale) / 2)}px, ${Math.round((vh - STAGE_H * scale) / 2)}px) scale(${scale})`;
    document.body.classList.toggle('portrait', vh > vw);
  }
  window.addEventListener('resize', fitStage);
  window.addEventListener('orientationchange', () => setTimeout(fitStage, 200));

  window.ES_UI = { $, $$, esc, fmt, on, wait, fresh, vibrate, icon, pill, bar, segments, powerDots, toast, modal, prompt, fitStage, STAGE_W, STAGE_H };
})();
