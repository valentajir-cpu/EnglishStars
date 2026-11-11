/* ============================================================
   ENGLISH STARS - audio.js
   Hlas (TTS), hlaskovani, cisla, rozpoznavani reci, zvuky
   ------------------------------------------------------------
   1. TTS - mluveni anglicky (Web Speech API)
   2. HLASKOVANI A CISLA (pomale cteni po pismenech, cisla slovy)
   3. ROZPOZNAVANI RECI (mikrofon) + tolerantni porovnani
   4. ZVUKOVE EFEKTY (WebAudio pipnuti)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. TTS ---------- */
  const synth = window.speechSynthesis;
  let voice = null;
  function pickVoice() {
    if (!synth) return;
    const voices = synth.getVoices();
    if (!voices.length) return;
    const prefer = ['en-GB', 'en_GB', 'en-US', 'en_US', 'en'];
    for (const p of prefer) {
      const v = voices.find(v => (v.lang || '').replace('_', '-').toLowerCase().startsWith(p.replace('_', '-').toLowerCase()) && !/eSpeak/i.test(v.name)) ||
                voices.find(v => (v.lang || '').replace('_', '-').toLowerCase().startsWith(p.replace('_', '-').toLowerCase()));
      if (v) { voice = v; return; }
    }
    voice = voices[0];
  }
  if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }

  function speak(text, opts) {
    opts = opts || {};
    return new Promise(resolve => {
      if (!synth) { resolve(false); return; }
      try { synth.cancel(); } catch (e) {}
      const u = new SpeechSynthesisUtterance(text);
      u.lang = (voice && voice.lang) || 'en-GB';
      if (voice) u.voice = voice;
      u.rate = opts.rate || 0.85;
      u.pitch = opts.pitch || 1.0;
      u.volume = 1;
      u.onend = () => resolve(true);
      u.onerror = () => resolve(false);
      synth.speak(u);
      // pojistka: nektere Androidy nevyvolaji onend
      setTimeout(() => resolve(true), Math.min(15000, 1500 + text.length * 90));
    });
  }
  function stop() { if (synth) try { synth.cancel(); } catch (e) {} }

  /* ---------- 2. HLASKOVANI A CISLA ---------- */
  // Nazvy pismen - TTS nekdy cte samotne pismeno divne, proto foneticka napoveda pro problematicka
  const LETTER_SAY = { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E', F: 'F', G: 'G', H: 'H', I: 'I', J: 'J', K: 'K', L: 'L', M: 'M', N: 'N', O: 'O', P: 'P', Q: 'Q', R: 'R', S: 'S', T: 'T', U: 'U', V: 'V', W: 'W', X: 'X', Y: 'Y', Z: 'Z' };
  async function spell(letters, opts) {
    opts = opts || {};
    const arr = String(letters).toUpperCase().split('').filter(ch => /[A-Z0-9]/.test(ch));
    for (let i = 0; i < arr.length; i++) {
      if (opts.cancelled && opts.cancelled()) return;
      if (opts.onLetter) opts.onLetter(i, arr[i]);
      const ch = arr[i];
      await speak(/[0-9]/.test(ch) ? ch : (LETTER_SAY[ch] + '.'), { rate: opts.rate || 0.75 });
      await wait(opts.gap || 550);
    }
  }
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function numberWords(n) {
    n = Math.round(n);
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
    if (n === 100) return 'one hundred';
    if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + numberWords(n % 100) : '');
    return String(n);
  }
  const ORDINALS = { 1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth', 11: 'eleventh', 12: 'twelfth', 13: 'thirteenth', 14: 'fourteenth', 15: 'fifteenth', 16: 'sixteenth', 17: 'seventeenth', 18: 'eighteenth', 19: 'nineteenth', 20: 'twentieth', 21: 'twenty-first', 22: 'twenty-second', 23: 'twenty-third', 24: 'twenty-fourth', 25: 'twenty-fifth', 26: 'twenty-sixth', 27: 'twenty-seventh', 28: 'twenty-eighth', 29: 'twenty-ninth', 30: 'thirtieth', 31: 'thirty-first' };
  function ordinalSuffix(n) { const r = n % 100; if (r >= 11 && r <= 13) return 'th'; return ({ 1: 'st', 2: 'nd', 3: 'rd' })[n % 10] || 'th'; }

  /* ---------- 3. ROZPOZNAVANI RECI ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function recognitionAvailable() { return !!SR && navigator.onLine !== false; }
  // Spusti jedno rozpoznani; vraci Promise<{ok:true, alts:[string]} | {ok:false, error}>
  function listenOnce(opts) {
    opts = opts || {};
    return new Promise(resolve => {
      if (!SR) { resolve({ ok: false, error: 'unsupported' }); return; }
      let r;
      try { r = new SR(); } catch (e) { resolve({ ok: false, error: 'init' }); return; }
      r.lang = opts.lang || 'en-GB';
      r.interimResults = false;
      r.maxAlternatives = 6;
      r.continuous = false;
      let done = false;
      const finish = (res) => { if (done) return; done = true; try { r.stop(); } catch (e) {} resolve(res); };
      r.onresult = (ev) => {
        const alts = [];
        for (let i = 0; i < ev.results.length; i++) for (let j = 0; j < ev.results[i].length; j++) alts.push(ev.results[i][j].transcript);
        finish({ ok: true, alts });
      };
      r.onerror = (ev) => finish({ ok: false, error: ev.error || 'error' });
      r.onend = () => finish({ ok: false, error: 'nomatch' });
      try { r.start(); } catch (e) { finish({ ok: false, error: 'start' }); }
      setTimeout(() => finish({ ok: false, error: 'timeout' }), opts.timeout || 7000);
    });
  }
  // Tolerantni mapovani prepisu na pismena
  const LETTER_ALIASES = {
    A: ['a', 'ay', 'hey', 'eh', 'eigh', 'aye'], B: ['b', 'be', 'bee', 'bea'], C: ['c', 'see', 'sea', 'si', 'cee'], D: ['d', 'de', 'dee', 'di'],
    E: ['e', 'ee', 'eee', 'he', 'ii'], F: ['f', 'ef', 'eff', 'if'], G: ['g', 'gee', 'je', 'ji', 'dzi'], H: ['h', 'aitch', 'age', 'each', 'ache', 'etch', 'hatch'],
    I: ['i', 'eye', 'ai', 'aye', 'hi'], J: ['j', 'jay', 'jai', 'jey'], K: ['k', 'kay', 'okay', 'ok', 'cay', 'kei'], L: ['l', 'el', 'ell', 'elle'],
    M: ['m', 'em', 'am', 'mm'], N: ['n', 'en', 'an', 'nn'], O: ['o', 'oh', 'ou', 'owe', 'zero'], P: ['p', 'pee', 'pea', 'pi'], Q: ['q', 'queue', 'cue', 'kju', 'kew'],
    R: ['r', 'are', 'ar', 'our', 'arr'], S: ['s', 'es', 'ess', 'yes'], T: ['t', 'tea', 'tee', 'ti'], U: ['u', 'you', 'yu', 'ju'], V: ['v', 'vee', 'we', 'vi'],
    W: ['w', 'double u', 'double you', 'doubleu', 'dabl ju', 'dablju'], X: ['x', 'ex', 'eggs', 'ax', 'iks'], Y: ['y', 'why', 'wye', 'wy', 'wai'], Z: ['z', 'zed', 'zee', 'zet']
  };
  const WORD_TO_LETTER = {};
  Object.keys(LETTER_ALIASES).forEach(L => LETTER_ALIASES[L].forEach(a => { WORD_TO_LETTER[a] = L; }));
  // Prevede prepis na posloupnost pismen (nejlepsi odhad)
  function transcriptToLetters(t) {
    const s = t.toLowerCase().replace(/[.,!?]/g, ' ').replace(/-/g, ' ').trim();
    if (!s) return '';
    const tokens = s.split(/\s+/);
    let out = '';
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const two = tokens[i + 1] ? tok + ' ' + tokens[i + 1] : null;
      if (two && WORD_TO_LETTER[two]) { out += WORD_TO_LETTER[two]; i++; continue; }
      if (WORD_TO_LETTER[tok]) { out += WORD_TO_LETTER[tok]; continue; }
      if (/^[a-z]+$/.test(tok) && tok.length <= 6) { out += tok.toUpperCase(); continue; } // "bcd" -> BCD
      if (/^[a-z]$/.test(tok)) { out += tok.toUpperCase(); continue; }
    }
    return out;
  }
  // Porovna alternativy prepisu s ocekavanymi pismeny; vraci {match:bool, best:string}
  function matchLetters(alts, expected) {
    const exp = expected.toUpperCase().replace(/[^A-Z]/g, '');
    let best = '';
    for (const t of alts) {
      const got = transcriptToLetters(t);
      if (got === exp) return { match: true, best: got };
      if (exp.length === 1 && got.length && got[0] === exp) return { match: true, best: got };
      if (!best) best = got || t;
    }
    return { match: false, best };
  }
  // Cisla: prepis -> cislo
  const NUM_WORDS = {};
  ONES.forEach((w, i) => { NUM_WORDS[w] = i; });
  TENS.forEach((w, i) => { if (w) NUM_WORDS[w] = i * 10; });
  NUM_WORDS.hundred = 100; NUM_WORDS['a hundred'] = 100;
  function transcriptToNumbers(t) {
    const s = t.toLowerCase().replace(/[.,!?]/g, ' ').replace(/-/g, ' ').trim();
    const nums = [];
    const digits = s.match(/\d+/g);
    if (digits) digits.forEach(d => nums.push(parseInt(d, 10)));
    const tokens = s.split(/\s+/);
    let acc = 0, has = false;
    for (const tok of tokens) {
      if (NUM_WORDS[tok] !== undefined) {
        const v = NUM_WORDS[tok];
        if (v === 100) { acc = (acc || 1) * 100; has = true; }
        else if (v >= 20 && acc % 100 === 0 && has) { acc += v; }
        else if (v >= 20) { acc += v; has = true; }
        else { acc += v; has = true; }
      } else if (tok === 'and') { continue; }
      else if (has) { nums.push(acc); acc = 0; has = false; }
    }
    if (has) nums.push(acc);
    return nums;
  }
  function matchNumber(alts, expected) {
    for (const t of alts) {
      const nums = transcriptToNumbers(t);
      if (nums.includes(expected)) return { match: true, best: t };
    }
    return { match: false, best: alts[0] || '' };
  }
  // Volne porovnani slova/fraze (pro "Rekni to!")
  function normalizeText(s) { return s.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function matchPhrase(alts, expected) {
    const exp = normalizeText(expected);
    const expWords = exp.split(' ');
    let bestScore = 0, best = alts[0] || '';
    for (const t of alts) {
      const got = normalizeText(t);
      if (got === exp) return { match: true, score: 1, best: t };
      const gw = got.split(' ');
      let hit = 0; expWords.forEach(w => { if (gw.includes(w)) hit++; });
      const score = hit / Math.max(1, expWords.length);
      if (score > bestScore) { bestScore = score; best = t; }
    }
    return { match: bestScore >= 0.75, score: bestScore, best };
  }

  /* ---------- 4. ZVUKY ---------- */
  let ctx = null;
  function beep(freq, dur, type, vol) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.value = vol || 0.08;
      o.connect(g); g.connect(ctx.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.stop(ctx.currentTime + dur);
    } catch (e) {}
  }
  const sfx = {
    ok() { beep(660, 0.12); setTimeout(() => beep(880, 0.18), 90); },
    bad() { beep(220, 0.25, 'sawtooth', 0.05); },
    coin() { beep(1200, 0.08, 'square', 0.04); setTimeout(() => beep(1600, 0.1, 'square', 0.04), 70); },
    win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.2), i * 110)); },
    tick() { beep(900, 0.04, 'square', 0.03); },
    drop() { [392, 494, 587, 784, 988].forEach((f, i) => setTimeout(() => beep(f, 0.25), i * 120)); }
  };
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  window.ES_AUDIO = { speak, stop, spell, numberWords, ORDINALS, ordinalSuffix, recognitionAvailable, listenOnce, matchLetters, matchNumber, matchPhrase, transcriptToLetters, transcriptToNumbers, sfx, wait, hasTTS: !!synth };
})();
