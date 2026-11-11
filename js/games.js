/* ============================================================
   ENGLISH STARS - games.js
   Minihry: generatory uloh, obrazovky uloh, prubeh mise
   ------------------------------------------------------------
   1. POMOCNE (distraktory, tokenizace, text uloh)
   2. GENERATORY ULOH (listen, gap, sentence, wordbuild, quick)
   3. OBRAZOVKY ULOH (kazda vraci Promise s vysledkem)
      3a listen  3b gap  3c sentence  3d wordbuild
      3e spellwrite  3f spellsay  3g numwrite  3h numsay
   4. PRUBEH MISE (hlavicka, zpetna vazba, odmeny, vysledek)
   5. SPECIALNI REZIMY (Blitz, Zkouska nanecisto, Vyzva dne, Opakovani)
   ============================================================ */
(function () {
  'use strict';
  const C = window.ES_CORE, U = window.ES_UI, A = window.ES_AUDIO;
  const { $, $$, esc, icon } = U;

  /* ---------- 1. POMOCNE ---------- */
  function firstSentence(text) {
    // "Has it got big ears? Yes, it has. / No, it hasn't." -> "Has it got big ears?"
    const t = text.split(' / ')[0];
    const m = t.match(/^[^.?!]+[.?!]?/); return (m ? m[0] : t).trim();
  }
  function tokens(sentence) { return sentence.trim().split(/\s+/); }
  function distractors(item, n, pool, kind) {
    let cands = pool.filter(i => i.id !== item.id && i.kind === (kind || item.kind) && i.cz !== item.cz && i.en !== item.en);
    const samePos = cands.filter(i => i.pos && i.pos === item.pos);
    if (samePos.length >= n) cands = samePos;
    let out = C.shuffle(cands).slice(0, n);
    if (out.length < n) { // doplneni z celeho obsahu
      const more = C.shuffle(C.ITEMS.filter(i => i.id !== item.id && i.kind === (kind || item.kind) && !out.includes(i) && i.cz !== item.cz)).slice(0, n - out.length);
      out = out.concat(more);
    }
    return out;
  }
  function cleanWord(en) { return en.replace(/[?.!…]/g, '').trim(); }
  function exampleWithWord(item) {
    const w = cleanWord(item.en).toLowerCase();
    for (const ex of (item.examples || [])) {
      const re = new RegExp('(^|[^a-zA-Z])(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')([^a-zA-Z]|$)', 'i');
      if (re.test(ex.en)) return { ex, re };
    }
    return null;
  }
  function letterPool(word, extra) {
    const letters = word.toLowerCase().replace(/[^a-z]/g, '').split('');
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const add = [];
    while (add.length < (extra || 2)) { const ch = alphabet[Math.floor(Math.random() * 26)]; if (!letters.includes(ch) && !add.includes(ch)) add.push(ch); }
    return C.shuffle(letters.concat(add));
  }

  /* ---------- 2. GENERATORY ---------- */
  function qListen(item, pool) {
    const opts = C.shuffle([item].concat(distractors(item, 3, pool)));
    return { type: 'listen', item, options: opts, answer: opts.indexOf(item) };
  }
  function qGap(item, pool) {
    const found = exampleWithWord(item);
    if (!found) return null;
    const blanked = found.ex.en.replace(found.re, (m, a, b, c) => a + '_____' + c);
    const opts = C.shuffle([item].concat(distractors(item, 2, pool, 'word')));
    return { type: 'gap', item, sentence: blanked, cz: found.ex.cz, full: found.ex.en, options: opts, answer: opts.indexOf(item) };
  }
  function qSentence(item) {
    let en, cz;
    if (item.kind === 'phrase') { en = firstSentence(item.en); cz = firstSentence(item.cz); }
    else if (item.examples && item.examples.length) { en = firstSentence(item.examples[0].en); cz = firstSentence(item.examples[0].cz); }
    if (!en) return null;
    const toks = tokens(en); if (toks.length < 3 || toks.length > 9) return null;
    return { type: 'sentence', item, en, cz, tokens: toks, shuffled: C.shuffle(toks.map((t, i) => ({ t, i }))) };
  }
  function qWordbuild(item) {
    const target = cleanWord(item.en); if (target.replace(/[^a-zA-Z]/g, '').length < 2 || target.length > 16) return null;
    return { type: 'wordbuild', item, target, pool: letterPool(target, target.length > 6 ? 3 : 2) };
  }
  // Rychla uloha pro Blitz: nahodny smer
  function qQuick(item, pool) {
    const modes = item.kind === 'word' ? (item.emoji ? ['en-cz', 'cz-en', 'emoji-en', 'listen-cz'] : ['en-cz', 'cz-en', 'listen-cz']) : ['en-cz', 'cz-en'];
    const mode = C.pick(modes);
    const dis = distractors(item, 3, pool);
    const opts = C.shuffle([item].concat(dis));
    return { type: 'quick', mode, item, options: opts, answer: opts.indexOf(item) };
  }
  function questionFor(game, item, pool) {
    switch (game) {
      case 'listen': return qListen(item, pool);
      case 'gap': return qGap(item, pool) || qListen(item, pool);
      case 'sentence': return qSentence(item) || qGap(item, pool) || qListen(item, pool);
      case 'wordbuild': return qWordbuild(item) || qListen(item, pool);
      default: return qListen(item, pool);
    }
  }

  /* ---------- 3. OBRAZOVKY ULOH ---------- */
  // Spolecne: body = kontejner otazky, foot = kontejner zpetne vazby. Vraci Promise<{correct, confusedWith, answerText}>
  function speakBtn(label, text, cls) { return `<button class="btn-speak ${cls || ''}" data-say="${esc(text)}">${icon('speaker', 28)}<span>${esc(label || 'Přehrát znovu')}</span></button>`; }
  function tileHtml(it, idx, showCz) {
    if (it.kind === 'word' && it.emoji) return `<button class="tile" data-i="${idx}"><div class="tile-emoji">${it.emoji}</div><div class="tile-cz">${esc(it.cz.split(' (')[0])}</div></button>`;
    return `<button class="tile tile-text" data-i="${idx}"><div class="tile-txt">${esc(it.cz)}</div></button>`;
  }
  function bindSpeak(root) { U.on(root, '[data-say]', 'click', (e, b) => { A.speak(b.dataset.say); }); }

  /* 3a Poslechni a klikni */
  function renderListen(q, body, foot, ctx) {
    return new Promise(resolve => {
      body.innerHTML = `
      <div class="q-split">
        <div class="q-left panel">
          <div class="q-hint">${q.item.kind === 'phrase' ? 'CO SLYŠÍŠ? VYBER VÝZNAM.' : 'CO SLYŠÍŠ? ŤUKNI NA OBRÁZEK.'}</div>
          <button class="big-speaker" data-say="${esc(q.item.en)}" aria-label="Přehrát">${icon('speaker', 84, 'var(--accent-text)')}</button>
          <div class="q-sub">Ťukni pro přehrání</div>
        </div>
        <div class="q-right"><div class="tiles ${q.item.kind === 'phrase' ? 'tiles-text' : ''}">${q.options.map((o, i) => tileHtml(o, i)).join('')}</div></div>
      </div>`;
      bindSpeak(body);
      setTimeout(() => A.speak(q.item.en), 350);
      let done = false;
      U.on(body, '.tile', 'click', (e, t) => {
        if (done) return; done = true;
        const i = +t.dataset.i; const ok = i === q.answer;
        $$('.tile', body).forEach((el, j) => { el.disabled = true; if (j === q.answer) el.classList.add('right'); else if (j === i) el.classList.add('wrong'); });
        resolve({ correct: ok, confusedWith: ok ? null : q.options[i].en, answerText: q.item.en + ' = ' + q.item.cz });
      });
    });
  }
  /* 3b Dopln slovo */
  function renderGap(q, body, foot) {
    return new Promise(resolve => {
      body.innerHTML = `
      <div class="q-col">
        <div class="q-hint">DOPLŇ SLOVO DO VĚTY</div>
        <div class="panel gap-sentence">${esc(q.sentence).replace('_____', '<span class="blank">_____</span>')}</div>
        <div class="q-cz">${esc(q.cz)}</div>
        <div class="opts3">${q.options.map((o, i) => `<button class="opt" data-i="${i}">${esc(o.en)}</button>`).join('')}</div>
      </div>`;
      let done = false;
      U.on(body, '.opt', 'click', (e, t) => {
        if (done) return; done = true;
        const i = +t.dataset.i; const ok = i === q.answer;
        $$('.opt', body).forEach((el, j) => { el.disabled = true; if (j === q.answer) el.classList.add('right'); else if (j === i) el.classList.add('wrong'); });
        $('.blank', body).textContent = q.item.en; $('.blank', body).classList.add(ok ? 'ok' : 'bad');
        A.speak(q.full);
        resolve({ correct: ok, confusedWith: ok ? null : q.options[i].en, answerText: q.full });
      });
    });
  }
  /* 3c Skladacka vety (+ napoveda / vubec nevim = pocita se jako chyba) */
  function renderSentence(q, body, foot) {
    return new Promise(resolve => {
      const placed = []; let hinted = false, done = false;
      const render = () => {
        body.innerHTML = `
        <div class="q-col">
          <div class="q-hint">SEŘAĎ SLOVA DO VĚTY</div>
          <div class="q-cz big">${esc(q.cz)}</div>
          <div class="panel answer-row">${placed.length ? placed.map(p => `<button class="tok placed" data-p="${p.i}">${esc(p.t)}</button>`).join('') : '<span class="placeholder">Ťukej na slova ve správném pořadí</span>'}</div>
          <div class="tok-row">${q.shuffled.map(p => `<button class="tok ${placed.find(x => x.i === p.i) ? 'used' : ''}" data-i="${p.i}" ${placed.find(x => x.i === p.i) ? 'disabled' : ''}>${esc(p.t)}</button>`).join('')}</div>
          <div class="row-center gap"><button class="btn btn-ghost" id="undo">${icon('back', 20)} Smazat poslední</button><button class="btn btn-ghost" id="hint">${icon('info', 20)} Nápověda (1 slovo)</button><button class="btn btn-ghost" id="giveup">Vůbec nevím</button></div>
        </div>`;
      };
      const placeNext = () => { const k = placed.length; if (k >= q.tokens.length) return; const tok = q.shuffled.find(p => p.i === k); placed.push(tok); };
      const check = () => {
        if (done || placed.length !== q.tokens.length) return;
        done = true;
        const got = placed.map(p => p.t).join(' ');
        const ok = got === q.en && !hinted;
        $('.answer-row', body).classList.add(ok ? 'right' : 'wrong');
        A.speak(q.en);
        resolve({ correct: ok, confusedWith: ok ? null : (hinted ? '(s nápovědou)' : got), answerText: q.en });
      };
      render();
      body.addEventListener('click', e => {
        if (done) return;
        const tok = e.target.closest('.tok:not(.placed):not(.used)');
        if (tok) { placed.push(q.shuffled.find(p => p.i === +tok.dataset.i)); A.sfx.tick(); render(); check(); return; }
        if (e.target.closest('.tok.placed') || e.target.closest('#undo')) { placed.pop(); render(); return; }
        if (e.target.closest('#hint')) { hinted = true; placeNext(); render(); check(); return; }
        if (e.target.closest('#giveup')) { hinted = true; while (placed.length < q.tokens.length) placeNext(); render(); check(); return; }
      });
    });
  }
  /* 3d Skladacka slova - jen VELKA pismena (I vs l), napoveda po pismenu, vubec nevim */
  function renderWordbuild(q, body, foot) {
    return new Promise(resolve => {
      const target = q.target; const chars = target.split('');
      const slots = chars.map(ch => /[a-zA-Z]/.test(ch) ? null : ch); // pevne znaky (mezera, apostrof) predvyplnene
      const answerLetters = chars.filter(ch => /[a-zA-Z]/.test(ch)).map(ch => ch.toUpperCase());
      const pool = q.pool.map(ch => ch.toUpperCase());
      const used = []; let hinted = false, done = false;
      const freeCount = slots.filter(s => s === null).length;
      const render = () => {
        body.innerHTML = `
        <div class="q-col">
          <div class="q-hint">SLOŽ SLOVO</div>
          <div class="wb-meaning">${q.item.emoji ? `<span class="wb-emoji">${q.item.emoji}</span>` : ''}<span class="wb-cz">${esc(q.item.cz)}</span></div>
          <div class="slots">${slots.map(s => s === null ? '<div class="slot"></div>' : s === ' ' ? '<div class="slot gapslot"></div>' : `<div class="slot fixed">${esc(s)}</div>`).join('')}</div>
          <div class="letters">${pool.map((ch, i) => `<button class="letter ${used.includes(i) ? 'used' : ''}" data-i="${i}" ${used.includes(i) ? 'disabled' : ''}>${ch}</button>`).join('')}</div>
          <div class="row-center gap"><button class="btn btn-ghost" id="undo">${icon('back', 20)} Smazat poslední</button><button class="btn btn-ghost" id="hint">${icon('info', 20)} Nápověda (1 písmeno)</button><button class="btn btn-ghost" id="giveup">Vůbec nevím</button></div>
        </div>`;
        const fill = used.map(i => pool[i]); let k = 0;
        $$('.slot', body).forEach((el, i) => { if (slots[i] === null) { el.textContent = fill[k] !== undefined ? fill[k] : ''; k++; } });
      };
      const hintOne = () => { // doplni dalsi spravne pismeno
        const k = used.length; if (k >= freeCount) return;
        const want = answerLetters[k];
        let idx = pool.findIndex((ch, i) => ch === want && !used.includes(i));
        if (idx < 0) { pool.push(want); idx = pool.length - 1; }
        used.push(idx);
      };
      const check = () => {
        if (done || used.length !== freeCount) return;
        done = true;
        const fill = used.map(i => pool[i]); let k = 0;
        const got = slots.map(s => s === null ? fill[k++] : s).join('');
        const ok = got.toLowerCase() === target.toLowerCase() && !hinted;
        $('.slots', body).classList.add(ok ? 'right' : 'wrong');
        if (!ok) { let j = 0; $$('.slot', body).forEach((el, i) => { if (slots[i] === null) { el.textContent = answerLetters[j++]; } }); }
        A.speak(target);
        resolve({ correct: ok, confusedWith: ok ? null : (hinted ? '(s nápovědou)' : got), answerText: target + ' = ' + q.item.cz });
      };
      render();
      body.addEventListener('click', e => {
        if (done) return;
        const l = e.target.closest('.letter:not(.used)');
        if (l) { used.push(+l.dataset.i); A.sfx.tick(); render(); check(); return; }
        if (e.target.closest('#undo') || e.target.closest('.slot')) { used.pop(); render(); return; }
        if (e.target.closest('#hint')) { hinted = true; hintOne(); render(); check(); return; }
        if (e.target.closest('#giveup')) { hinted = true; while (used.length < freeCount) hintOne(); render(); check(); return; }
      });
    });
  }
  /* 3e Pis, co slysis (pismena) */
  const KEY_ROWS = ['ABCDEFGHI', 'JKLMNOPQR', 'STUVWXYZ']; // abecedni poradi - procvicuje abecedu
  function keyboardHtml(kind) {
    if (kind === 'digits') return `<div class="kbd kbd-digits">${'1234567890'.split('').map(k => `<button class="key" data-k="${k}">${k}</button>`).join('')}<button class="key key-wide" data-k="back">${icon('back', 24)}</button></div>`;
    return `<div class="kbd">${KEY_ROWS.map(r => `<div class="krow">${r.split('').map(k => `<button class="key" data-k="${k}">${k}</button>`).join('')}</div>`).join('')}<div class="krow"><button class="key key-wide" data-k="back">${icon('back', 24)} Smazat</button></div></div>`;
  }
  function renderSpellWrite(q, body, foot) {
    // q: {letters:'CARROT', word:item|null}
    return new Promise(resolve => {
      const letters = q.letters.toUpperCase(); let typed = '';
      let playing = false, cancel = false;
      const play = async () => { if (playing) return; playing = true; cancel = false; $('#play', body).classList.add('on'); await A.spell(letters, { gap: 650, rate: 0.7, cancelled: () => cancel }); $('#play', body) && $('#play', body).classList.remove('on'); playing = false; };
      const renderBoxes = () => { $('.boxes', body).innerHTML = letters.split('').map((_, i) => `<div class="box ${typed[i] ? 'filled' : ''}">${typed[i] || ''}</div>`).join(''); };
      body.innerHTML = `
      <div class="q-col">
        <div class="q-hint">${q.word ? 'POSLOUCHEJ HLÁSKOVÁNÍ A PIŠ PÍSMENA' : 'POSLOUCHEJ A PIŠ PÍSMENA, KTERÁ SLYŠÍŠ'}</div>
        <div class="row-center gap"><button class="btn btn-accent" id="play">${icon('speaker', 26)} Přehrát</button><span class="q-sub">${letters.length} ${letters.length === 1 ? 'písmeno' : letters.length < 5 ? 'písmena' : 'písmen'}</span></div>
        <div class="boxes"></div>
        ${keyboardHtml('letters')}
        <div class="row-center"><button class="btn btn-accent big" id="done" disabled>HOTOVO ${icon('check', 24)}</button></div>
      </div>`;
      renderBoxes();
      $('#play', body).addEventListener('click', play);
      setTimeout(play, 400);
      let done = false;
      U.on(body, '.key', 'click', (e, k) => {
        if (done) return; const v = k.dataset.k;
        if (v === 'back') typed = typed.slice(0, -1); else if (typed.length < letters.length) typed += v;
        A.sfx.tick(); renderBoxes(); $('#done', body).disabled = typed.length !== letters.length;
      });
      $('#done', body).addEventListener('click', () => {
        if (done || typed.length !== letters.length) return; done = true; cancel = true; A.stop();
        const ok = typed === letters;
        $$('.box', body).forEach((el, i) => { el.classList.add(typed[i] === letters[i] ? 'ok' : 'bad'); if (typed[i] !== letters[i]) el.innerHTML = `<s>${typed[i]}</s>${letters[i]}`; });
        const reveal = q.word ? `${q.word.emoji ? q.word.emoji + ' ' : ''}${q.word.en} = ${q.word.cz}` : letters.split('').join(' ');
        if (q.word) A.speak(q.word.en);
        resolve({ correct: ok, confusedWith: ok ? null : typed, answerText: reveal });
      });
    });
  }
  /* 3f Rekni pismena (mikrofon) */
  function micPanel(expectedLabel) {
    const avail = A.recognitionAvailable();
    return `<div class="mic-panel">
      <button class="btn-mic ${avail ? '' : 'off'}" id="mic" ${avail ? '' : 'disabled'}>${icon('mic', 60, avail ? 'var(--accent-text)' : '#6B78A8')}</button>
      <div class="mic-status" id="micstatus">${avail ? 'Ťukni na mikrofon a řekni to anglicky' : 'Mikrofon není k dispozici (potřebuje internet a Chrome)'}</div>
      ${avail ? '' : `<div class="self-check"><div class="q-sub">Poslechni si vzor a zhodnoť se sám:</div><div class="row-center gap"><button class="btn btn-ok" id="selfok">${icon('check', 22)} Řekl jsem to správně</button><button class="btn btn-ghost" id="selfbad">Nepovedlo se</button></div></div>`}
    </div>`;
  }
  function renderSaySomething(q, body, foot, spec) {
    // spec: {hint, display(html), model(text to speak), check(alts)->{match,best}, answerText}
    return new Promise(resolve => {
      body.innerHTML = `
      <div class="q-col">
        <div class="q-hint">${spec.hint}</div>
        <div class="say-display">${spec.display}</div>
        <div class="row-center gap">${spec.speakCue ? `<button class="btn btn-ghost" id="cue">${icon('speaker', 24)} Přehrát otázku</button>` : ''}<button class="btn btn-ghost" id="model">${icon('speaker', 24)} ${spec.speakCue ? 'Přehrát moji repliku' : 'Přehrát vzor'}</button></div>
        ${micPanel()}
      </div>`;
      let done = false, attempts = 0;
      $('#model', body).addEventListener('click', () => spec.speakModel());
      const cueBtn = $('#cue', body); if (cueBtn) cueBtn.addEventListener('click', () => spec.speakCue());
      const finish = (ok, best) => { if (done) return; done = true; resolve({ correct: ok, confusedWith: ok ? null : best, answerText: spec.answerText, selfRated: !A.recognitionAvailable() }); };
      const mic = $('#mic', body);
      if (mic && !mic.disabled) mic.addEventListener('click', async () => {
        if (done) return; A.stop();
        mic.classList.add('listening'); $('#micstatus', body).textContent = 'Poslouchám… mluv teď';
        const res = await A.listenOnce({ timeout: 6000 });
        mic.classList.remove('listening');
        if (!res.ok) {
          const hard = ['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'unsupported', 'init', 'start'].includes(res.error);
          $('#micstatus', body).textContent = hard ? 'Mikrofon teď nefunguje – poslechni si vzor a zhodnoť se sám.' : 'Nic jsem nezachytil, zkus to znovu.';
          attempts++;
          if ((hard || attempts >= 3) && !$('.self-check', body)) {
            $('.mic-panel', body).insertAdjacentHTML('beforeend', `<div class="self-check"><div class="row-center gap"><button class="btn btn-ok" id="selfok">${icon('check', 22)} Řekl jsem to správně</button><button class="btn btn-ghost" id="selfbad">Nepovedlo se</button></div></div>`);
            $('#selfok', body).addEventListener('click', () => finish(true, null)); $('#selfbad', body).addEventListener('click', () => finish(false, '(nepovedlo se)'));
            spec.speakModel();
          }
          return;
        }
        const m = spec.check(res.alts);
        if (m.match) { $('#micstatus', body).innerHTML = `Slyšel jsem: <b>${esc(m.best)}</b> – správně!`; finish(true, null); }
        else { attempts++; $('#micstatus', body).innerHTML = `Slyšel jsem: <b>${esc(m.best || res.alts[0] || '?')}</b>. ${attempts < 2 ? 'Zkus to ještě jednou.' : ''}`; if (attempts >= 2) finish(false, m.best || res.alts[0]); }
      });
      const so = $('#selfok', body), sb = $('#selfbad', body);
      if (so) so.addEventListener('click', () => finish(true, null));
      if (sb) sb.addEventListener('click', () => finish(false, '(nepovedlo se)'));
      setTimeout(() => { if (!A.recognitionAvailable()) spec.speakModel(); }, 300);
    });
  }
  function renderSpellSay(q, body, foot) {
    const letters = q.letters.toUpperCase();
    return renderSaySomething(q, body, foot, {
      hint: letters.length === 1 ? 'ŘEKNI TOHLE PÍSMENO ANGLICKY' : 'ŘEKNI TATO PÍSMENA ANGLICKY (POPOŘADĚ)',
      display: `<div class="say-letters">${letters.split('').map(l => `<span class="say-letter">${l}</span>`).join('')}</div>`,
      speakModel: () => A.spell(letters, { gap: 500, rate: 0.75 }),
      check: alts => A.matchLetters(alts, letters),
      answerText: letters.split('').join(' ')
    });
  }
  /* 3g Pis cisla */
  function renderNumWrite(q, body, foot) {
    return new Promise(resolve => {
      const n = q.n; const words = q.ordinal ? (A.ORDINALS[n] || A.numberWords(n)) : A.numberWords(n);
      const target = String(n); let typed = '';
      const say = () => A.speak(q.ordinal ? 'the ' + words : words, { rate: 0.8 });
      body.innerHTML = `
      <div class="q-col">
        <div class="q-hint">${q.ordinal ? 'POSLOUCHEJ A NAPIŠ POŘADÍ (ČÍSLEM)' : 'POSLOUCHEJ A NAPIŠ ČÍSLO'}</div>
        <div class="row-center gap"><button class="btn btn-accent" id="play">${icon('speaker', 26)} Přehrát</button></div>
        <div class="num-display" id="numdisp">&nbsp;</div>
        ${keyboardHtml('digits')}
        <div class="row-center"><button class="btn btn-accent big" id="done" disabled>HOTOVO ${icon('check', 24)}</button></div>
      </div>`;
      $('#play', body).addEventListener('click', say); setTimeout(say, 400);
      let done = false;
      U.on(body, '.key', 'click', (e, k) => {
        if (done) return; const v = k.dataset.k;
        if (v === 'back') typed = typed.slice(0, -1); else if (typed.length < 3) typed += v;
        $('#numdisp', body).textContent = typed || ' '; $('#done', body).disabled = !typed.length; A.sfx.tick();
      });
      $('#done', body).addEventListener('click', () => {
        if (done || !typed) return; done = true;
        const ok = typed === target;
        $('#numdisp', body).classList.add(ok ? 'ok' : 'bad'); if (!ok) $('#numdisp', body).innerHTML = `<s>${typed}</s> ${target}`;
        resolve({ correct: ok, confusedWith: ok ? null : typed, answerText: `${target}${q.ordinal ? A.ordinalSuffix(n) : ''} = ${words}` });
      });
    });
  }
  /* 3h Rekni cisla */
  function renderNumSay(q, body, foot) {
    const n = q.n; const words = q.ordinal ? (A.ORDINALS[n] || A.numberWords(n)) : A.numberWords(n);
    return renderSaySomething(q, body, foot, {
      hint: q.ordinal ? 'ŘEKNI POŘADÍ ANGLICKY (first, second…)' : 'ŘEKNI TOHLE ČÍSLO ANGLICKY',
      display: `<div class="say-number">${n}${q.ordinal ? `<sup>${A.ordinalSuffix(n)}</sup>` : ''}</div>`,
      speakModel: () => A.speak(q.ordinal ? 'the ' + words : words, { rate: 0.8 }),
      check: alts => q.ordinal ? A.matchPhrase(alts, words) : A.matchNumber(alts, n),
      answerText: `${n}${q.ordinal ? A.ordinalSuffix(n) : ''} = ${words}`
    });
  }
  function renderSay(q, body, foot) { return renderSaySomething(q, body, foot, q.spec); }
  const RENDER = { listen: renderListen, gap: renderGap, sentence: renderSentence, wordbuild: renderWordbuild, spellwrite: renderSpellWrite, spellsay: renderSpellSay, numwrite: renderNumWrite, numsay: renderNumSay, say: renderSay };

  /* ---------- 4. PRUBEH MISE ---------- */
  function missionShell(title, sub, total) {
    return `
    <div class="mission">
      <header class="mhead">
        <button class="round-btn" id="mback" aria-label="Zpět">${icon('back', 26)}</button>
        <div class="mtitle"><div class="mt1">${esc(title)}</div><div class="mt2">${esc(sub || '')}</div></div>
        <div class="mprog"><div class="mprog-label" id="mprog-label">OTÁZKA 1 / ${total}</div><div id="mprog-segs">${U.segments(total, 0)}</div></div>
        <div class="mearn"><div class="pill" id="earn-t">${icon('trophy', 22, '#FFC53D')}<span>+0</span></div><div class="pill" id="earn-c">${icon('coin', 22, '#FFA826')}<span>+0</span></div></div>
      </header>
      <main class="mbody" id="qbody"></main>
      <footer class="mfoot" id="qfoot"></footer>
    </div>`;
  }
  function setProgress(root, idx, total, results) {
    $('#mprog-label', root).textContent = `OTÁZKA ${Math.min(idx + 1, total)} / ${total}`;
    $('#mprog-segs', root).innerHTML = `<div class="segs">${Array.from({ length: total }, (_, i) => `<div class="seg ${results[i] === true ? 'ok' : results[i] === false ? 'bad' : i === idx ? 'cur' : ''}"></div>`).join('')}</div>`;
  }
  function showFeedback(foot, res, mult, trophiesGained) {
    foot.innerHTML = res.correct
      ? `<div class="fb ok">${icon('check', 30, '#22C55E')}<div class="fb-txt">Správně! <b>${esc(res.answerText || '')}</b></div><div class="fb-earn">+${trophiesGained} ${icon('trophy', 18, '#FFC53D')}${mult > 1 ? ` <span class="x2">×${mult}</span>` : ''}</div><button class="btn btn-accent big" id="next">DALŠÍ ${icon('next', 24)}</button></div>`
      : `<div class="fb bad">${icon('x', 30, '#FB7185')}<div class="fb-txt">Správně je: <b>${esc(res.answerText || '')}</b></div><button class="btn-speak small" data-say="${esc((res.answerText || '').split(' = ')[0])}">${icon('speaker', 22)}</button><button class="btn btn-accent big" id="next">DALŠÍ ${icon('next', 24)}</button></div>`;
    bindSpeak(foot);
    return new Promise(resolve => {
      $('#next', foot).addEventListener('click', () => resolve());
      if (res.correct) setTimeout(resolve, 1800);
    });
  }
  // Hlavni smycka pro mise typu "N otazek"
  async function runQuestionMission(opts) {
    // opts: {title, sub, questions:[{game,item,q}] | builder(i)->q, total, perCorrect, p, root, onProgress, eventUnitId, record:true}
    const p = opts.p, root = opts.root, total = opts.total;
    root.innerHTML = missionShell(opts.title, opts.sub, total);
    let body = $('#qbody', root), foot = $('#qfoot', root);
    let aborted = false;
    $('#mback', root).addEventListener('click', async () => {
      const r = await U.modal('<h3>Ukončit misi?</h3><p>Dosavadní odpovědi se počítají, ale mise nebude splněná.</p>', [{ id: 'no', label: 'Pokračovat' }, { id: 'yes', label: 'Ukončit', cls: 'btn-danger' }]);
      if (r.id === 'yes') { aborted = true; A.stop(); C.save(true); (opts.onAbort || (() => window.ES_SCREENS.go('lobby')))(); }
    });
    const results = [], details = []; let earnedT = 0, earnedC = 0, correct = 0;
    for (let i = 0; i < total && !aborted; i++) {
      body = U.fresh(body); foot = U.fresh(foot);
      setProgress(root, i, total, results);
      const q = opts.builder(i); if (!q) break;
      window.__esq = q; // ladici hacek (posledni otazka)
      const res = await RENDER[q.type](q, body, foot, { p });
      if (aborted) break;
      results[i] = res.correct;
      details.push({ item: q.item || null, label: res.answerText || (q.letters ? q.letters.split('').join(' ') : q.n !== undefined ? String(q.n) : ''), correct: res.correct, got: res.confusedWith || null, type: q.type });
      const mult = q.item ? C.eventMultiplierFor(q.item.unitId) : 1;
      let gained = 0;
      if (res.correct) { gained = C.addTrophies(p, (opts.perCorrect || 1) * mult); earnedT += gained; A.sfx.ok(); correct++; }
      else { A.sfx.bad(); U.vibrate(80); if (p.role === 'dad') C.dadMistakeBonus(); }
      if (q.item && opts.record !== false) C.recordAnswer(p, q.item.id, res.correct, res.confusedWith);
      else if (!q.item) { const d = p.stats.days[C.todayKey()] || (p.stats.days[C.todayKey()] = { answers: 0, correct: 0, trophies: 0, coins: 0 }); d.answers++; if (res.correct) d.correct++; p.stats.totalAnswers++; if (res.correct) p.stats.totalCorrect++; }
      $('#earn-t span', root).textContent = '+' + earnedT; $('#earn-c span', root).textContent = '+' + earnedC;
      if (opts.onProgress) opts.onProgress(i + 1, res.correct);
      C.save();
      await showFeedback(foot, res, mult, gained);
    }
    A.stop();
    return { aborted, correct, total: results.length, earnedT, earnedC, details };
  }
  // Vysledkova obrazovka: souhrn + v cem byly chyby + co vsechno bylo procvicovano
  function resultScreen(root, data) {
    // data: {title, correct, total, earnedT, coins, extra(html), details:[{item,label,correct,got}], onBack}
    const pct = data.total ? Math.round(100 * data.correct / data.total) : 0;
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;
    const details = data.details || [];
    const bad = details.filter(d => !d.correct);
    const row = (d) => {
      const en = d.item ? d.item.en : d.label.split(' = ')[0];
      const cz = d.item ? d.item.cz : (d.label.includes(' = ') ? d.label.split(' = ')[1] : '');
      return `<div class="rr ${d.correct ? 'ok' : 'bad'}">
        <span class="rr-mark">${icon(d.correct ? 'check' : 'x', 18, d.correct ? '#22C55E' : '#FB7185')}</span>
        ${d.item && d.item.emoji ? `<span class="rr-emoji">${d.item.emoji}</span>` : ''}
        <span class="rr-en">${esc(en)}</span><span class="rr-cz">${esc(cz)}</span>
        ${!d.correct && d.got ? `<span class="rr-got">tvoje odpověď: <b>${esc(d.got)}</b></span>` : ''}
        <button class="btn-speak tiny" data-say="${esc(en)}">${icon('speaker', 16)}</button>
      </div>`;
    };
    root.innerHTML = `
    <div class="result">
      <div class="result-top panel">
        <div class="result-stars">${[0, 1, 2].map(i => icon('star', 44, i < stars ? '#FFC53D' : '#344178', i < stars ? 'fill="#FFC53D"' : '')).join('')}</div>
        <div class="result-txt"><h2>${esc(data.title)}</h2><div class="result-pct">${data.total ? `${data.correct} / ${data.total} správně · ${pct} %` : ''}${data.extra ? ' · ' : ''}${data.extra || ''}</div></div>
        <div class="result-earn">${data.earnedT ? `<div class="pill big">${icon('trophy', 26, '#FFC53D')}<span>+${data.earnedT}</span></div>` : ''}${data.coins ? `<div class="pill big">${icon('coin', 26, '#FFA826')}<span>+${data.coins}</span></div>` : ''}</div>
      </div>
      <div class="result-lists">
        ${details.length ? (bad.length ? `<h3 class="rl-head bad">${icon('x', 20, '#FB7185')} KDE BYLY CHYBY (${bad.length})</h3><div class="rl">${bad.map(row).join('')}</div>` : `<h3 class="rl-head ok">${icon('check', 20, '#22C55E')} BEZ CHYBY – PARÁDA!</h3>`) : ''}
        ${details.length ? `<h3 class="rl-head">CO JSME PROCVIČILI (${details.length})</h3><div class="rl">${details.map(row).join('')}</div>` : ''}
      </div>
      <div class="result-foot">${data.bonusBtn ? `<button class="btn btn-accent big drop-btn-big" id="res-bonus">${icon('chest', 26)} ${esc(data.bonusBtn)}</button>` : ''}<button class="btn ${data.bonusBtn ? 'btn-ghost' : 'btn-accent'} big" id="res-back">${icon('home', 24)} ZPĚT DO LOBBY</button></div>
    </div>`;
    $('#res-back', root).addEventListener('click', data.onBack);
    if (data.bonusBtn) $('#res-bonus', root).addEventListener('click', data.onBonus);
    bindSpeak(root);
    if (stars >= 2) A.sfx.win();
  }

  /* ---------- 5. SPECIALNI REZIMY ---------- */
  // Hlavni vstup: spusti misi (objekt z ensureDaily nebo ad hoc) a po skonceni zavola onDone
  async function playMission(mission, root, onDone) {
    const p = C.profile();
    const game = mission.game;
    if (game === 'blitz') return playBlitz(mission, root, onDone);
    if (game === 'exam') return playExam(mission, root, onDone);
    if (['spellwrite', 'spellsay', 'numwrite', 'numsay'].includes(game)) return playChallenge(mission, root, onDone);
    if (game === 'review') return playReview(mission, root, onDone);
    if (game === 'memorize') return playMemorize(mission, root, onDone);
    // bezna mise: N otazek jednoho typu
    const kinds = game === 'sentence' ? ['phrase', 'word'] : game === 'wordbuild' ? ['word'] : ['word', 'phrase'];
    const pool = mission.unitIds.flatMap(u => C.unitItems(u));
    const items = C.pickItems(p, { unitIds: mission.unitIds, n: mission.target, kinds, phraseShare: game === 'sentence' ? 0.7 : game === 'listen' ? 0.35 : game === 'gap' ? 0 : 0 });
    if (!items.length) { U.toast('V tomto tématu zatím nejsou slovíčka.'); onDone(false); return; }
    const total = Math.min(mission.target, items.length);
    const r = await runQuestionMission({ p, root, title: mission.title, sub: mission.sub, total, builder: i => questionFor(game, items[i], pool), perCorrect: 1, onProgress: n => { mission.progress = Math.max(mission.progress || 0, n); } });
    if (r.aborted) { onDone(false); return; }
    let coins = 0; if (!mission.done) { coins = mission.coins; C.completeMission(p, mission); }
    resultScreen(root, { title: 'Mise splněna!', correct: r.correct, total: r.total, earnedT: r.earnedT + (mission.trophies || 0), coins, details: r.details, onBack: () => onDone(true) });
  }
  // Blitz 60 s
  async function playBlitz(mission, root, onDone) {
    const p = C.profile();
    const pool = mission.unitIds.flatMap(u => C.unitItems(u)).filter(i => i.kind === 'word' || i.en.length < 40);
    if (pool.length < 4) { U.toast('Málo slovíček pro Blitz.'); onDone(false); return; }
    const seq = C.shuffle(pool);
    let idx = 0, score = 0, streak = 0, best = 0, earnedT = 0, timeLeft = C.CONFIG.BLITZ_SECONDS, running = true, answered = 0, resolveCurrent = null, userQuit = false; const details = [];
    root.innerHTML = `
    <div class="mission blitz">
      <header class="mhead">
        <button class="round-btn" id="mback" aria-label="Zpět">${icon('back', 26)}</button>
        <div class="mtitle"><div class="mt1">BLITZ 60 SEKUND</div><div class="mt2">Odpovídej co nejrychleji</div></div>
        <div class="blitz-timer"><div class="timer-bar"><div class="timer-in" id="timer-in"></div></div><div class="timer-num" id="timer-num">${timeLeft}</div></div>
        <div class="mearn"><div class="pill" id="earn-t">${icon('trophy', 22, '#FFC53D')}<span>+0</span></div><div class="pill" id="streak">${icon('fire', 22, '#FB7185')}<span>0</span></div></div>
      </header>
      <main class="mbody" id="qbody"></main>
      <footer class="mfoot" id="qfoot"><div class="q-sub">Správně: +1 trofej · série 5 = bonus</div></footer>
    </div>`;
    let body = $('#qbody', root);
    $('#mback', root).addEventListener('click', () => { running = false; userQuit = true; if (resolveCurrent) resolveCurrent(); });
    const timer = setInterval(() => {
      if (!running) { clearInterval(timer); return; }
      timeLeft--; $('#timer-num', root).textContent = timeLeft; $('#timer-in', root).style.width = (100 * timeLeft / C.CONFIG.BLITZ_SECONDS) + '%';
      if (timeLeft <= 10) A.sfx.tick();
      if (timeLeft <= 0) { running = false; clearInterval(timer); if (resolveCurrent) resolveCurrent(); }
    }, 1000);
    const ask = () => new Promise(resolve => {
      resolveCurrent = resolve; body = U.fresh(body);
      const item = seq[idx % seq.length]; idx++;
      const q = qQuick(item, pool); window.__esq = q;
      const prompt = q.mode === 'en-cz' ? `<div class="quick-prompt">${esc(item.en)}</div>` : q.mode === 'cz-en' ? `<div class="quick-prompt">${esc(item.cz)}</div>` : q.mode === 'emoji-en' ? `<div class="quick-prompt emoji">${item.emoji}</div>` : `<button class="big-speaker small" data-say="${esc(item.en)}">${icon('speaker', 56, 'var(--accent-text)')}</button>`;
      const optText = o => q.mode === 'en-cz' || q.mode === 'listen-cz' ? o.cz : o.en;
      body.innerHTML = `<div class="quick">${prompt}<div class="quick-opts">${q.options.map((o, i) => `<button class="opt quick-opt" data-i="${i}">${esc(optText(o))}</button>`).join('')}</div></div>`;
      bindSpeak(body); if (q.mode === 'listen-cz') A.speak(item.en, { rate: 1 });
      let done = false;
      U.on(body, '.quick-opt', 'click', async (e, t) => {
        if (done || !running) return; done = true; const i = +t.dataset.i; const ok = i === q.answer;
        $$('.quick-opt', body).forEach((el, j) => { el.disabled = true; if (j === q.answer) el.classList.add('right'); else if (j === i) el.classList.add('wrong'); });
        C.recordAnswer(p, item.id, ok, ok ? null : optText(q.options[i])); answered++;
        details.push({ item, label: item.en + ' = ' + item.cz, correct: ok, got: ok ? null : optText(q.options[i]), type: 'quick' });
        if (ok) { score++; streak++; best = Math.max(best, streak); const mult = C.eventMultiplierFor(item.unitId); let g = C.addTrophies(p, 1 * mult); if (streak % 5 === 0) g += C.addTrophies(p, 3); earnedT += g; A.sfx.ok(); }
        else { streak = 0; A.sfx.bad(); if (p.role === 'dad') C.dadMistakeBonus(); }
        $('#earn-t span', root).textContent = '+' + earnedT; $('#streak span', root).textContent = streak;
        await U.wait(ok ? 350 : 1100); resolve();
      });
    });
    while (running) { await ask(); }
    A.stop();
    const aborted = timeLeft > 0;
    if (aborted) { C.save(); onDone(false); return; }
    let coins = 0; if (!mission.done) { coins = mission.coins; mission.progress = 1; C.completeMission(p, mission); }
    const stats = p.stats; stats.blitzBest = Math.max(stats.blitzBest || 0, score); C.save();
    resultScreen(root, { title: `Blitz: ${score} správně!`, correct: score, total: answered, earnedT, coins, details, extra: `Nejdelší série: ${best} · Rekord: ${stats.blitzBest}`, onBack: () => onDone(true) });
  }
  // Zkouska nanecisto (udalost Skola)
  async function playExam(mission, root, onDone) {
    const p = C.profile();
    const pool = mission.unitIds.flatMap(u => C.unitItems(u));
    const items = C.pickItems(p, { unitIds: mission.unitIds, n: C.CONFIG.EXAM_QUESTIONS, phraseShare: 0.4 });
    const games = ['listen', 'gap', 'wordbuild', 'sentence'];
    const r = await runQuestionMission({ p, root, title: mission.title, sub: mission.sub, total: Math.min(items.length, C.CONFIG.EXAM_QUESTIONS), builder: i => questionFor(games[i % games.length], items[i], pool), perCorrect: 1 });
    if (r.aborted) { onDone(false); return; }
    const pct = Math.round(100 * r.correct / Math.max(1, r.total));
    const ev = C.activeEvent(); let bonus = 0;
    if (ev) { if (pct > (ev.bestScore || 0)) { if (ev.bestScore !== undefined) bonus = C.addCoins(p, 20); ev.bestScore = pct; } ev.lastScore = pct; ev.attempts = (ev.attempts || 0) + 1; }
    let coins = 0; if (!mission.done) { coins = mission.coins; mission.progress = 1; C.completeMission(p, mission); }
    C.save();
    resultScreen(root, { title: `Zkouška nanečisto: ${pct} %`, correct: r.correct, total: r.total, earnedT: r.earnedT + (mission.trophies || 0), coins: coins + bonus, details: r.details, extra: bonus ? 'Zlepšení! Bonus +20 coinů' : (ev && ev.bestScore ? `Nejlepší výsledek: ${ev.bestScore} %` : ''), onBack: () => onDone(true) });
  }
  // Vyzva dne: hlaskovani / cisla
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function randomLetters(n) { let s = ''; while (s.length < n) { const ch = ALPHA[Math.floor(Math.random() * 26)]; if (!s.includes(ch)) s += ch; } return s; }
  async function playChallenge(mission, root, onDone) {
    const p = C.profile(); const game = mission.game; const total = mission.target || 8;
    const words = C.shuffle(mission.unitIds.flatMap(u => C.unitItems(u, ['word'])).filter(w => /^[A-Za-z]{3,9}$/.test(w.en)));
    const builder = i => {
      if (game === 'spellwrite') { if (i % 2 === 1 && words.length) { const w = words[(i >> 1) % words.length]; return { type: 'spellwrite', letters: w.en.toUpperCase(), word: w, item: w }; } return { type: 'spellwrite', letters: randomLetters(3 + Math.min(3, Math.floor(i / 2))) }; }
      if (game === 'spellsay') { return { type: 'spellsay', letters: i < 4 ? randomLetters(1) : randomLetters(2 + (i >= 6 ? 1 : 0)) }; }
      if (game === 'numwrite' || game === 'numsay') {
        const ordinal = i >= 6; let n;
        if (ordinal) n = 1 + Math.floor(Math.random() * 31); else if (i < 3) n = 1 + Math.floor(Math.random() * 20); else if (i < 5) n = (2 + Math.floor(Math.random() * 8)) * 10; else n = 21 + Math.floor(Math.random() * 79);
        return { type: game, n, ordinal };
      }
      return null;
    };
    const r = await runQuestionMission({ p, root, title: mission.title, sub: C.GAME_INFO[game].desc, total, builder, perCorrect: C.CONFIG.REWARD.spellTrophy, onProgress: n => { mission.progress = Math.max(mission.progress || 0, n); } });
    if (r.aborted) { onDone(false); return; }
    let coins = 0; if (!mission.done) { coins = mission.coins; C.completeMission(p, mission); }
    resultScreen(root, { title: 'Výzva splněna!', correct: r.correct, total: r.total, earnedT: r.earnedT + (mission.trophies || 0), coins, details: r.details, onBack: () => onDone(true) });
  }
  // Opakovani slabych polozek ("Co mi nejde")
  async function playReview(mission, root, onDone) {
    const p = C.profile();
    const weak = C.weakItems(p, 10).map(w => w.item);
    if (weak.length < 3) { U.toast('Zatím není co opakovat – paráda!'); onDone(false); return; }
    const pool = C.ITEMS;
    const games = ['listen', 'gap', 'wordbuild', 'listen', 'sentence'];
    const r = await runQuestionMission({ p, root, title: 'Zopakovat, co mi nejde', sub: `${weak.length} slabých položek`, total: weak.length, builder: i => questionFor(weak[i].kind === 'phrase' ? (i % 2 ? 'sentence' : 'listen') : games[i % games.length], weak[i], pool), perCorrect: 1 });
    if (r.aborted) { onDone(false); return; }
    const coins = C.addCoins(p, C.CONFIG.REWARD.reviewCoins); C.log(p, 'review', `Opakování slabin: ${r.correct}/${r.total}`); C.save();
    resultScreen(root, { title: 'Opakování hotovo', correct: r.correct, total: r.total, earnedT: r.earnedT, coins, details: r.details, onBack: () => onDone(true) });
  }

  // Nazpamet: rozhovor/text -> 1) poslech a cteni, 2) dopln slovo, 3) serad slova, 4) rekni svou repliku (s textem), 5) cely rozhovor zpameti
  async function playMemorize(mission, root, onDone) {
    const p = C.profile();
    const text = C.textById(mission.textId);
    if (!text) { U.toast('Text k naučení nebyl nalezen.'); onDone(false); return; }
    const ev = (C.SAVE.settings.events || []).find(e => e.id === mission.eventId);
    const pitchFor = r => (r === text.tomRole ? 1.15 : 0.85);
    const sayLine = (l) => A.speak(l.en, { rate: 0.85, pitch: pitchFor(l.r) });
    // --- faze 1: poslech a cteni ---
    root.innerHTML = `
    <div class="mission">
      <header class="mhead">
        <button class="round-btn" id="mback" aria-label="Zpět">${icon('back', 26)}</button>
        <div class="mtitle"><div class="mt1">NAZPAMĚŤ · 1/5</div><div class="mt2">${esc(text.title)}</div></div>
        <div class="mprog"><div class="mprog-label">POSLOUCHEJ A ČTI · ťukni na bublinu, přehraje se</div></div>
        <div class="mearn"><button class="btn btn-ghost small" id="playall">${icon('speaker', 20)} Přehrát celé</button></div>
      </header>
      <main class="mbody dialog-body">
        <div class="dialog">${text.lines.map((l, i) => `<button class="bubble ${l.r === text.tomRole ? 'me' : 'other'}" data-i="${i}"><div class="bub-role">${esc(text.roles[l.r])}${l.r === text.tomRole ? ' (ty)' : ''}</div><div class="bub-en">${esc(l.en)}</div><div class="bub-cz">${esc(l.cz)}</div></button>`).join('')}</div>
        ${text.grammar ? `<div class="grammar-box"><b>Grammar:</b> ${text.grammar.map(esc).join(' · ')}</div>` : ''}
      </main>
      <footer class="mfoot"><div class="fb neutral"><div class="fb-txt">Tvoje repliky jsou žluté. Až to umíš přečíst, pokračuj.</div><button class="btn btn-accent big" id="go2">POKRAČOVAT ${icon('next', 24)}</button></div></footer>
    </div>`;
    let aborted = false;
    $('#mback', root).addEventListener('click', () => { aborted = true; A.stop(); onDone(false); });
    U.on(root, '.bubble', 'click', (e, b) => { const l = text.lines[+b.dataset.i]; sayLine(l); });
    $('#playall', root).addEventListener('click', async () => { for (const l of text.lines) { if (aborted) return; $$('.bubble', root).forEach(b => b.classList.remove('talking')); const el = $(`.bubble[data-i="${text.lines.indexOf(l)}"]`, root); if (el) el.classList.add('talking'); await sayLine(l); await U.wait(250); } $$('.bubble', root).forEach(b => b.classList.remove('talking')); });
    await new Promise(res => { $('#go2', root).addEventListener('click', res); });
    if (aborted) return;
    // --- faze 2-5: otazky ---
    const words = Array.from(new Set(text.lines.flatMap(l => tokens(l.en)).map(w => w.replace(/[^A-Za-z']/g, '')).filter(w => w.length >= 3)));
    const pseudo = (l) => ({ id: null, kind: 'line', en: l.en, cz: l.cz, unitId: ev ? ev.unitId : text.unitId, emoji: l.r === text.tomRole ? '🟡' : '🗣️' });
    const gapQ = (l) => {
      const toks = tokens(l.en); const cand = toks.map((t, i) => ({ t, i, w: t.replace(/[^A-Za-z']/g, '') })).filter(x => x.w.length >= 3);
      const pickT = cand[Math.floor(Math.random() * cand.length)] || { t: toks[0], i: 0, w: toks[0] };
      const blanked = toks.map((t, i) => i === pickT.i ? t.replace(pickT.w, '_____') : t).join(' ');
      const dis = C.shuffle(words.filter(w => w.toLowerCase() !== pickT.w.toLowerCase())).slice(0, 2);
      const opts = C.shuffle([pickT.w].concat(dis)).map(w => ({ en: w }));
      return { type: 'gap', item: Object.assign(pseudo(l), { en: pickT.w }), sentence: blanked, cz: l.cz, full: l.en, options: opts, answer: opts.findIndex(o => o.en === pickT.w) };
    };
    const sentQ = (l) => { const toks = tokens(l.en); return { type: 'sentence', item: pseudo(l), en: l.en, cz: l.cz, tokens: toks, shuffled: C.shuffle(toks.map((t, i) => ({ t, i }))) }; };
    const sayQ = (idx, hidden) => {
      const l = text.lines[idx]; const cue = idx > 0 ? text.lines[idx - 1] : null;
      return { type: 'say', item: pseudo(l), spec: {
        hint: hidden ? 'ŘEKNI SVOJI REPLIKU ZPAMĚTI' : 'PŘEČTI / ŘEKNI SVOJI REPLIKU NAHLAS',
        display: `<div class="dialog small">${cue ? `<div class="bubble other"><div class="bub-role">${esc(text.roles[cue.r])}</div><div class="bub-en">${esc(cue.en)}</div></div>` : ''}<div class="bubble me"><div class="bub-role">${esc(text.roles[l.r])} (ty)</div><div class="bub-en">${hidden ? '<span class="hidden-line">? ? ?</span>' : esc(l.en)}</div><div class="bub-cz">${esc(l.cz)}</div></div></div>`,
        speakModel: () => A.speak(l.en, { rate: 0.85, pitch: 1.15 }),
        speakCue: cue ? () => A.speak(cue.en, { rate: 0.9, pitch: 0.85 }) : null,
        check: alts => { const m = A.matchPhrase(alts, l.en); return { match: m.score >= 0.6, best: m.best }; },
        answerText: l.en
      } };
    };
    const myIdx = text.lines.map((l, i) => l.r === text.tomRole ? i : -1).filter(i => i >= 0);
    const plan = [];
    text.lines.forEach(l => plan.push({ stage: 2, q: () => gapQ(l) }));
    text.lines.filter(l => tokens(l.en).length >= 3).forEach(l => plan.push({ stage: 3, q: () => sentQ(l) }));
    myIdx.forEach(i => plan.push({ stage: 4, q: () => sayQ(i, false) }));
    myIdx.forEach(i => plan.push({ stage: 5, q: () => sayQ(i, true) }));
    const stageNames = { 2: 'DOPLŇ SLOVO', 3: 'SEŘAĎ SLOVA', 4: 'ŘEKNI SVOJI REPLIKU', 5: 'CELÝ ROZHOVOR ZPAMĚTI' };
    let lastStage = 0;
    const r = await runQuestionMission({ p, root, title: 'NAZPAMĚŤ', sub: text.title, total: plan.length, record: false, perCorrect: 1,
      builder: i => { const step = plan[i]; const q = step.q(); if (step.stage !== lastStage) { lastStage = step.stage; U.toast(`${icon('star', 18, '#FFC53D')} Část ${step.stage}/5: ${stageNames[step.stage]}`); } if (q.spec && q.spec.speakCue) setTimeout(q.spec.speakCue, 300); return q; },
      onProgress: () => {}, onAbort: () => onDone(false) });
    if (r.aborted) return;
    const pct = Math.round(100 * r.correct / Math.max(1, r.total));
    let coins = 0, bonusBtn = null;
    const firstTime = !mission.done;
    if (firstTime) { coins = mission.coins; C.completeMission(p, mission); }
    if (ev) { ev.bestScore = Math.max(ev.bestScore || 0, pct); ev.attempts = (ev.attempts || 0) + 1; ev.dropClaimed = ev.dropClaimed || {}; }
    if (mission.bonusDrop && ev && !ev.dropClaimed[p.id] && pct >= 60) { ev.dropClaimed[p.id] = true; mission.bonusDrop = false; C.grantBonusDrop(p, text.title); bonusBtn = 'OTEVŘÍT BONUS DROP'; }
    C.save(true);
    resultScreen(root, { title: pct >= 60 ? `Rozhovor zvládnut na ${pct} %!` : `Rozhovor: ${pct} % – ještě jednou?`, correct: r.correct, total: r.total, earnedT: r.earnedT + (firstTime ? mission.trophies : 0), coins, details: r.details, extra: pct < 60 && mission.bonusDrop ? 'Bonusový Drop dostaneš od 60 % správně' : (ev && ev.bestScore ? `Nejlepší výsledek: ${ev.bestScore} %` : ''), bonusBtn, onBonus: () => window.ES_SCREENS.go('drop', 'bonus'), onBack: () => onDone(true) });
  }

  window.ES_GAMES = { playMission, questionFor, RENDER, resultScreen, playMemorize };
})();
