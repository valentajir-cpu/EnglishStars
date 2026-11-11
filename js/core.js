/* ============================================================
   ENGLISH STARS - core.js
   Stav hry, ukladani, obsah, opakovani (Leitner), ekonomika, mise
   ------------------------------------------------------------
   1. KONFIGURACE (cisla ekonomiky na jednom miste)
   2. POMOCNE FUNKCE (datum, nahoda, id)
   3. ULOZENA HRA - schema, migrace, load/save, export/import
   4. OBSAH - slovicka a fraze z data/vocab.js, odemykani unitu
   5. OPAKOVANI (Leitner) - vyber polozek, zaznam odpovedi, slabiny
   6. EKONOMIKA - trofeje, coiny, drahokamy, Trophy Road, sezona (pass), Drop, duel
   7. DENNI MISE A UDALOSTI SKOLA
   8. PREDMETY - nakup, nasazeni, tema
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. KONFIGURACE ---------- */
  const CONFIG = {
    SCHEMA_VERSION: 1,
    STORAGE_KEY: 'englishstars.save.v1',
    QUESTIONS_PER_MISSION: 10,
    BLITZ_SECONDS: 60,
    EXAM_QUESTIONS: 15,
    REWARD: { correctTrophy: 1, spellTrophy: 2, eventMult: 2, missionCoins: 40, missionTrophies: 10, blitzCoins: 30, challengeCoins: 30, challengeTrophies: 15, reviewCoins: 15, reviewTrophies: 5, examCoins: 50, examTrophies: 20 },
    SRS_INTERVALS: [0, 1, 2, 4, 8, 16], // dny podle krabicky 0..5
    ROAD_STEP: 50, // trofeji na odmenu Trophy Road
    PASS: { TIERS: 30, POINTS_PER_TIER: 3 },
    DROP: { common: 0.5, rare: 0.3, epic: 0.15, legendary: 0.05, PITY_DAYS: 7 },
    DEFAULT_PIN: '1234',
    DEFAULT_GEM_RATE: { gems: 10, minutes: 30 },
    DAD_MULTIPLIER: 0.5,
    DEFAULT_UNLOCKED: ['s-back-to-school', 'u1-move-your-body', 'u2-lets-go-shopping'],
    DEFAULT_CURRENT_UNIT: 'u2-lets-go-shopping',
    RANKS: [[0, 'Nováček'], [100, 'Průzkumník'], [300, 'Bojovník'], [600, 'Šampion'], [1000, 'Mistr'], [1500, 'Legenda'], [2500, 'Hvězda']],
  };

  /* ---------- 2. POMOCNE ---------- */
  function todayKey(d) { return (d || new Date()).toLocaleDateString('sv-SE'); } // YYYY-MM-DD lokalne
  function addDays(key, n) { const d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + n); return todayKey(d); }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }
  function monthKey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function weekKey(d) { // ISO tyden
    d = d ? new Date(d) : new Date(); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return t.getUTCFullYear() + '-W' + String(Math.ceil((((t - y0) / 86400000) + 1) / 7)).padStart(2, '0');
  }
  function daysLeftInMonth() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate(); }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function seededRandom(seed) { let a = hash(seed); return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(arr, rnd) { rnd = rnd || Math.random; const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function pick(arr, rnd) { rnd = rnd || Math.random; return arr[Math.floor(rnd() * arr.length)]; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- 3. ULOZENA HRA ---------- */
  function newProfile(id, name, role) {
    return {
      id, name, role, charId: role === 'kid' ? null : 'kluk', look: { color: 0, items: { bg: 'bg-arena' } }, owned: ['bg-arena'],
      trophies: 0, coins: 0, gems: 0, gemsSpent: 0,
      srs: {}, daily: null, season: { key: monthKey(), points: 0, claimed: [] }, road: { claimed: [] },
      weekly: { key: weekKey(), trophies: 0 }, pity: { lastEpic: todayKey() },
      stats: { days: {}, totalAnswers: 0, totalCorrect: 0, missions: 0, drops: 0 }, log: [], pending: [], created: todayKey()
    };
  }
  function newSave() {
    return {
      schemaVersion: CONFIG.SCHEMA_VERSION, createdAt: new Date().toISOString(), updatedAt: null,
      settings: {
        pin: CONFIG.DEFAULT_PIN, includeBonus: true, currentUnitId: CONFIG.DEFAULT_CURRENT_UNIT, unlockedUnits: CONFIG.DEFAULT_UNLOCKED.slice(),
        gemRate: Object.assign({}, CONFIG.DEFAULT_GEM_RATE), dadMultiplier: CONFIG.DAD_MULTIPLIER,
        rewards: [{ id: 'r1', name: '30 minut elektroniky navíc', gems: 10 }, { id: 'r2', name: 'Výběr večeře', gems: 15 }, { id: 'r3', name: 'Hodina elektroniky navíc', gems: 20 }],
        events: [], lastBackup: null
      },
      profiles: { tom: newProfile('tom', 'TomiiikMan', 'kid'), tata: newProfile('tata', 'Táta', 'dad') },
      activeProfile: null
    };
  }
  // Migrace: kazda funkce prevede save z verze N na N+1. Nikdy nemazat neznama data.
  const MIGRATIONS = {
    // 1: (s) => { ...; s.schemaVersion = 2; return s; }
  };
  function migrate(s) {
    let guard = 0;
    while (s.schemaVersion < CONFIG.SCHEMA_VERSION && guard++ < 50) {
      const fn = MIGRATIONS[s.schemaVersion];
      if (!fn) { s.schemaVersion++; continue; }
      s = fn(s);
    }
    // doplneni chybejicich klicu (bez prepisu existujicich)
    const base = newSave();
    s.settings = Object.assign({}, base.settings, s.settings || {});
    for (const pid of Object.keys(base.profiles)) {
      if (!s.profiles[pid]) s.profiles[pid] = base.profiles[pid];
      else {
        const bp = base.profiles[pid], p = s.profiles[pid];
        for (const k of Object.keys(bp)) if (p[k] === undefined) p[k] = bp[k];
        if (!p.look.items) p.look.items = { bg: 'bg-arena' };
      }
    }
    return s;
  }
  let SAVE = null;
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(CONFIG.STORAGE_KEY); } catch (e) {}
    if (raw) {
      try { SAVE = migrate(JSON.parse(raw)); } catch (e) { console.error('Poskozena ulozena hra, zakladam novou. Zaloha v klici .broken', e); try { localStorage.setItem(CONFIG.STORAGE_KEY + '.broken.' + Date.now(), raw); } catch (e2) {} SAVE = newSave(); }
    } else SAVE = newSave();
    return SAVE;
  }
  let saveTimer = null;
  function save(immediate) {
    if (!SAVE) return;
    SAVE.updatedAt = new Date().toISOString();
    const doIt = () => { try { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(SAVE)); } catch (e) { console.error('Ulozeni selhalo', e); } };
    if (immediate) { clearTimeout(saveTimer); doIt(); return; }
    clearTimeout(saveTimer); saveTimer = setTimeout(doIt, 150);
  }
  function exportJSON() { return JSON.stringify(SAVE, null, 1); }
  function importJSON(text) {
    const s = JSON.parse(text);
    if (!s || !s.profiles || !s.settings) throw new Error('Soubor neobsahuje uloženou hru English Stars.');
    SAVE = migrate(s); save(true); return SAVE;
  }
  function profile() { return SAVE.profiles[SAVE.activeProfile]; }
  function otherProfile() { return SAVE.profiles[SAVE.activeProfile === 'tom' ? 'tata' : 'tom']; }
  function log(p, type, text, extra) {
    p.log.unshift(Object.assign({ t: new Date().toISOString(), type, text }, extra || {}));
    if (p.log.length > 300) p.log.length = 300;
  }

  /* ---------- 4. OBSAH ---------- */
  let UNITS = [], ITEMS = [], ITEM_BY_ID = {}, UNIT_BY_ID = {};
  function buildContent() {
    const V = window.ES_VOCAB; UNITS = []; ITEMS = []; ITEM_BY_ID = {}; UNIT_BY_ID = {};
    const inclBonus = SAVE.settings.includeBonus !== false;
    V.units.forEach((u, idx) => {
      const unit = { id: u.id, code: u.code, title: u.title, pages: u.pages, order: idx, schoolUnit: u.schoolUnit, words: [], phrases: [] };
      u.words.forEach(w => {
        if (!w.core && !inclBonus) return;
        const it = Object.assign({ kind: 'word', unitId: u.id, unitCode: u.code }, w);
        unit.words.push(it); ITEMS.push(it); ITEM_BY_ID[it.id] = it;
      });
      u.phrases.forEach(p => {
        const it = Object.assign({ kind: 'phrase', unitId: u.id, unitCode: u.code, core: p.core !== false }, p);
        unit.phrases.push(it); ITEMS.push(it); ITEM_BY_ID[it.id] = it;
      });
      UNITS.push(unit); UNIT_BY_ID[unit.id] = unit;
    });
  }
  function unitItems(unitId, kinds) { const u = UNIT_BY_ID[unitId]; if (!u) return []; let arr = []; if (!kinds || kinds.includes('word')) arr = arr.concat(u.words); if (!kinds || kinds.includes('phrase')) arr = arr.concat(u.phrases); return arr; }
  function unitPower(p, unitId) { // 0..5 podle prumeru krabicek jadrovych slov
    const core = unitItems(unitId).filter(i => i.core);
    if (!core.length) return 0;
    let sum = 0; core.forEach(i => { sum += (p.srs[i.id] ? p.srs[i.id].box : 0); });
    const avg = sum / core.length;
    return avg >= 4.5 ? 5 : avg >= 3.5 ? 4 : avg >= 2.5 ? 3 : avg >= 1.5 ? 2 : avg >= 0.5 ? 1 : 0;
  }
  function unitProgress(p, unitId) { const core = unitItems(unitId).filter(i => i.core); const known = core.filter(i => p.srs[i.id] && p.srs[i.id].box >= 3).length; return { known, total: core.length }; }
  function isUnitUnlocked(p, unitId) {
    const s = SAVE.settings;
    if (s.unlockedUnits.includes(unitId) || s.currentUnitId === unitId) return true;
    const idx = UNITS.findIndex(u => u.id === unitId); if (idx <= 0) return true;
    return unitPower(p, UNITS[idx - 1].id) >= 2;
  }
  function unlockedUnits(p) { return UNITS.filter(u => isUnitUnlocked(p, u.id)); }
  function activeEvent() { const t = todayKey(); return (SAVE.settings.events || []).filter(e => !e.done && e.date >= t).sort((a, b) => a.date < b.date ? -1 : 1)[0] || null; }
  function eventMultiplierFor(unitId) { const e = activeEvent(); return (e && e.unitId === unitId) ? CONFIG.REWARD.eventMult : 1; }

  /* ---------- 5. OPAKOVANI (LEITNER) ---------- */
  function srsOf(p, id) { return p.srs[id] || (p.srs[id] = { box: 0, due: todayKey(), seen: 0, ok: 0, bad: 0, last: null, conf: [] }); }
  function isDue(p, it, today) { const r = p.srs[it.id]; if (!r) return true; return r.due <= (today || todayKey()); }
  // Vyber polozek pro misi: nejdriv splatne (nejslabsi prvni), pak nove, pak nahodne doplneni
  function pickItems(p, opts) {
    const today = todayKey(); const rnd = opts.rnd || Math.random;
    let pool = [];
    (opts.unitIds || UNITS.map(u => u.id)).forEach(uid => { pool = pool.concat(unitItems(uid, opts.kinds)); });
    if (opts.filter) pool = pool.filter(opts.filter);
    const n = opts.n || CONFIG.QUESTIONS_PER_MISSION;
    const due = pool.filter(i => p.srs[i.id] && p.srs[i.id].seen > 0 && isDue(p, i, today));
    const fresh = pool.filter(i => !p.srs[i.id] || p.srs[i.id].seen === 0);
    const rest = pool.filter(i => !due.includes(i) && !fresh.includes(i));
    const weak = (a, b) => (p.srs[a.id].box - p.srs[b.id].box) || (p.srs[a.id].due < p.srs[b.id].due ? -1 : 1);
    let chosen = shuffle(due, rnd).sort(weak).slice(0, n);
    if (chosen.length < n) chosen = chosen.concat(shuffle(fresh, rnd).slice(0, n - chosen.length));
    if (chosen.length < n) chosen = chosen.concat(shuffle(rest, rnd).slice(0, n - chosen.length));
    // pomer slova/fraze: pokud je zadan phraseShare, dorovnat
    if (opts.phraseShare && chosen.length) {
      const wantPhr = Math.round(n * opts.phraseShare);
      const phr = chosen.filter(i => i.kind === 'phrase'), wrd = chosen.filter(i => i.kind === 'word');
      if (phr.length < wantPhr) {
        const extra = shuffle(pool.filter(i => i.kind === 'phrase' && !chosen.includes(i)), rnd).slice(0, wantPhr - phr.length);
        chosen = wrd.slice(0, n - phr.length - extra.length).concat(phr, extra);
      }
    }
    return shuffle(chosen, rnd);
  }
  // Zaznam odpovedi; confusedWith = s cim to spletl (text)
  function recordAnswer(p, itemId, correct, confusedWith) {
    const r = srsOf(p, itemId); const today = todayKey();
    r.seen++; r.last = today;
    if (correct) { r.ok++; r.box = clamp(r.box + 1, 0, 5); r.due = addDays(today, CONFIG.SRS_INTERVALS[r.box]); }
    else {
      r.bad++; r.box = clamp(r.box - 1, 0, 5); r.due = today;
      if (confusedWith) { const c = r.conf.find(x => x.w === confusedWith); if (c) c.n++; else r.conf.push({ w: confusedWith, n: 1 }); r.conf.sort((a, b) => b.n - a.n); if (r.conf.length > 3) r.conf.length = 3; }
    }
    const d = p.stats.days[today] || (p.stats.days[today] = { answers: 0, correct: 0, trophies: 0, coins: 0 });
    d.answers++; if (correct) d.correct++;
    p.stats.totalAnswers++; if (correct) p.stats.totalCorrect++;
  }
  // "Co mi nejde": polozky s nizkou krabickou a chybami
  function weakItems(p, limit) {
    const arr = [];
    ITEMS.forEach(it => {
      const r = p.srs[it.id]; if (!r || r.seen < 1) return;
      const errRate = r.bad / Math.max(1, r.seen);
      // slabe = aspon jedna chyba a jeste neni v krabicce 2+, nebo dlouhodobe vysoka chybovost
      if ((r.bad >= 1 && r.box <= 1) || (r.seen >= 3 && errRate >= 0.4)) arr.push({ item: it, srs: r, score: r.bad * 2 + (5 - r.box) + errRate * 3 + (r.last === todayKey() ? 1 : 0) });
    });
    arr.sort((a, b) => b.score - a.score);
    return limit ? arr.slice(0, limit) : arr;
  }

  /* ---------- 6. EKONOMIKA ---------- */
  function rankOf(trophies) { let r = CONFIG.RANKS[0][1]; CONFIG.RANKS.forEach(([t, n]) => { if (trophies >= t) r = n; }); return r; }
  function rankLevel(trophies) { let l = 0; CONFIG.RANKS.forEach(([t], i) => { if (trophies >= t) l = i + 1; }); return l; }
  function addTrophies(p, n, why) {
    if (n <= 0) return 0;
    if (p.role === 'dad') n = Math.max(1, Math.round(n * (SAVE.settings.dadMultiplier || 1)));
    p.trophies += n;
    const wk = weekKey(); if (p.weekly.key !== wk) p.weekly = { key: wk, trophies: 0 }; p.weekly.trophies += n;
    const d = p.stats.days[todayKey()] || (p.stats.days[todayKey()] = { answers: 0, correct: 0, trophies: 0, coins: 0 }); d.trophies += n;
    return n;
  }
  function addCoins(p, n, why) { if (n <= 0) return 0; p.coins += n; const d = p.stats.days[todayKey()] || (p.stats.days[todayKey()] = { answers: 0, correct: 0, trophies: 0, coins: 0 }); d.coins += n; return n; }
  function addGems(p, n, why) { if (n <= 0) return 0; p.gems += n; log(p, 'gem', `+${n} 💎 ${why || ''}`); return n; }
  // Trophy Road: kazdych ROAD_STEP trofeji odmena; vraci nevyzvednute odmeny
  function roadRewards(p) {
    const res = [];
    for (let t = CONFIG.ROAD_STEP; t <= p.trophies; t += CONFIG.ROAD_STEP) {
      if (p.road.claimed.includes(t)) continue;
      const item = window.ES_ITEMS.find(i => i.how === 'road' && i.trophies === t);
      res.push({ at: t, coins: item ? 0 : 50, gems: (t % 200 === 0 && !item) ? 1 : 0, item: item ? item.id : null });
    }
    return res;
  }
  function claimRoad(p, at) {
    const r = roadRewards(p).find(x => x.at === at); if (!r) return null;
    p.road.claimed.push(at); addCoins(p, r.coins); if (r.gems) addGems(p, r.gems, 'Trophy Road'); if (r.item) grantItem(p, r.item, 'Trophy Road');
    log(p, 'road', `Trophy Road ${at} 🏆: ${describeReward(r)}`); save(); return r;
  }
  // Sezona = kalendarni mesic; body passu za mise
  function ensureSeason(p) { const mk = monthKey(); if (p.season.key !== mk) { log(p, 'season', `Nová sezóna ${mk}`); p.season = { key: mk, points: 0, claimed: [] }; } }
  function addPassPoints(p, n) { ensureSeason(p); p.season.points += n; }
  function passTier(p) { ensureSeason(p); return Math.min(CONFIG.PASS.TIERS, Math.floor(p.season.points / CONFIG.PASS.POINTS_PER_TIER)); }
  function passRewardFor(tier) {
    const item = window.ES_ITEMS.find(i => i.how === 'pass' && i.tier === tier);
    if (tier === 30) return { coins: 0, gems: 3, item: item ? item.id : null };
    if (item) return { coins: 0, gems: 0, item: item.id };
    if (tier % 5 === 0) return { coins: 0, gems: tier >= 15 ? 2 : 1, item: null };
    return { coins: 40, gems: 0, item: null };
  }
  function passRewards(p) { const t = passTier(p); const res = []; for (let i = 1; i <= t; i++) if (!p.season.claimed.includes(i)) res.push(Object.assign({ tier: i }, passRewardFor(i))); return res; }
  function claimPass(p, tier) {
    const r = passRewards(p).find(x => x.tier === tier); if (!r) return null;
    p.season.claimed.push(tier); addCoins(p, r.coins); if (r.gems) addGems(p, r.gems, `Pass tier ${tier}`); if (r.item) grantItem(p, r.item, 'Pass');
    log(p, 'pass', `Pass tier ${tier}: ${describeReward(r)}`); save(); return r;
  }
  function describeReward(r) { const parts = []; if (r.coins) parts.push(`${r.coins} coinů`); if (r.gems) parts.push(`${r.gems} 💎`); if (r.trophies) parts.push(`${r.trophies} 🏆`); if (r.passPoints) parts.push(`${r.passPoints} bod passu`); if (r.item) parts.push(window.ES_ITEMS_BY_ID[r.item] ? window.ES_ITEMS_BY_ID[r.item].name : r.item); return parts.join(' + ') || 'nic'; }
  // Drop po splneni 3 dennich misi
  function rollDrop(p) {
    const today = todayKey();
    let rarity;
    const pityDue = !p.pity.lastEpic || daysBetween(p.pity.lastEpic, today) >= CONFIG.DROP.PITY_DAYS;
    const r = Math.random();
    if (r < CONFIG.DROP.legendary) rarity = 'legendary'; else if (r < CONFIG.DROP.legendary + CONFIG.DROP.epic) rarity = 'epic'; else if (r < CONFIG.DROP.legendary + CONFIG.DROP.epic + CONFIG.DROP.rare) rarity = 'rare'; else rarity = 'common';
    if (pityDue && (rarity === 'common' || rarity === 'rare')) rarity = 'epic';
    // pestrost: dve bezne za sebou -> napodruhe sance na vzacnou
    if (rarity === 'common' && p.pity.lastRarity === 'common' && Math.random() < 0.5) rarity = 'rare';
    const unowned = (rar, how) => window.ES_ITEMS.filter(i => i.rarity === rar && (how ? i.how === how : true) && !p.owned.includes(i.id) && !i.retired);
    const reward = { rarity, coins: 0, gems: 0, item: null, trophies: 0, passPoints: 0 };
    if (rarity === 'common') {
      const variant = (p.pity.commonSeq || 0) % 3; p.pity.commonSeq = (p.pity.commonSeq || 0) + 1;
      if (variant === 0) reward.coins = 60 + Math.floor(Math.random() * 7) * 10;
      else if (variant === 1) { reward.coins = 40; reward.trophies = 15; }
      else { reward.coins = 40; reward.passPoints = 1; }
    }
    else if (rarity === 'rare') { const c = unowned('rare', 'shop'); if (c.length) reward.item = pick(c).id; else reward.coins = 200; }
    else if (rarity === 'epic') { reward.gems = 1; const c = unowned('epic', 'drop'); if (c.length) reward.item = pick(c).id; else reward.gems = 2; p.pity.lastEpic = today; }
    else { reward.gems = 3; const c = unowned('legendary', 'drop'); if (c.length) reward.item = pick(c).id; else reward.gems = 5; p.pity.lastEpic = today; }
    addCoins(p, reward.coins); if (reward.gems) addGems(p, reward.gems, 'Drop'); if (reward.item) grantItem(p, reward.item, 'Drop');
    if (reward.trophies) addTrophies(p, reward.trophies); if (reward.passPoints) addPassPoints(p, reward.passPoints);
    p.pity.lastRarity = rarity;
    p.stats.drops++; log(p, 'drop', `Drop (${window.ES_RARITY[rarity].name}): ${describeReward(reward)}`); save();
    return reward;
  }
  // Duel Tata vs Tom - tydenni trofeje
  function weeklyTrophies(p) { const wk = weekKey(); if (p.weekly.key !== wk) p.weekly = { key: wk, trophies: 0 }; return p.weekly.trophies; }
  function dadMistakeBonus() { // Tatova chyba = coin pro Toma
    const tom = SAVE.profiles.tom; addCoins(tom, 1); log(tom, 'duel', '+1 coin: táta udělal chybu 😄');
  }
  // Skutecne odmeny za drahokamy
  function requestReward(p, rewardId) {
    const r = SAVE.settings.rewards.find(x => x.id === rewardId); if (!r || p.gems < r.gems) return false;
    p.gems -= r.gems; p.gemsSpent += r.gems;
    p.pending.push({ id: uid(), rewardId: r.id, name: r.name, gems: r.gems, date: todayKey(), state: 'pending' });
    log(p, 'reward', `Vyměnil ${r.gems} 💎 za: ${r.name} (čeká na tátu)`); save(); return true;
  }
  function resolvePending(p, pendingId, approve) {
    const x = p.pending.find(q => q.id === pendingId); if (!x) return;
    x.state = approve ? 'done' : 'refunded'; if (!approve) { p.gems += x.gems; p.gemsSpent -= x.gems; }
    log(p, 'reward', (approve ? 'Táta potvrdil: ' : 'Vráceno 💎: ') + x.name); save();
  }

  /* ---------- 6b. TEXTY NAZPAMET A AUTOMATICKE UDALOSTI ---------- */
  function allTexts() { return (window.ES_TEXTS || []).concat(SAVE.settings.texts || []); }
  function textById(id) { return allTexts().find(t => t.id === id) || null; }
  // Vestavene texty s autoEvent zalozi udalost "Nazpamet" (jen jednou, dokud neuplynulo datum)
  function ensureAutoEvents() {
    const today = todayKey(); let changed = false;
    SAVE.settings.autoEventsDone = SAVE.settings.autoEventsDone || [];
    (window.ES_TEXTS || []).forEach(t => {
      if (!t.autoEvent || !t.autoEvent.due) return;
      if (SAVE.settings.autoEventsDone.includes(t.id) || t.autoEvent.due < today) return;
      SAVE.settings.events.push({ id: uid(), type: 'memorize', unitId: t.unitId, date: t.autoEvent.due, title: t.title, textId: t.id, done: false, dropClaimed: {} });
      SAVE.settings.autoEventsDone.push(t.id); changed = true;
    });
    if (changed) { Object.values(SAVE.profiles).forEach(pr => { pr.daily = null; }); save(true); }
  }
  function memorizeEvents() { const t = todayKey(); return (SAVE.settings.events || []).filter(e => e.type === 'memorize' && !e.done && e.date >= t && textById(e.textId)); }

  /* ---------- 7. DENNI MISE ---------- */
  const GAME_INFO = {
    listen: { name: 'Poslechni a klikni', icon: 'ear', desc: 'Slyšíš slovo nebo větu, ťukni na správný obrázek.' },
    wordbuild: { name: 'Skládačka slova', icon: 'tiles', desc: 'Slož slovo z písmen.' },
    sentence: { name: 'Skládačka věty', icon: 'tiles', desc: 'Seřaď slova do správné věty.' },
    gap: { name: 'Doplň slovo', icon: 'gap', desc: 'Do věty chybí slovo – vyber správné.' },
    blitz: { name: 'Blitz 60 sekund', icon: 'bolt', desc: 'Kolik stihneš za minutu?' },
    spellwrite: { name: 'Piš, co slyšíš', icon: 'abc', desc: 'Hlas říká písmena, ty je piš.' },
    spellsay: { name: 'Řekni písmena', icon: 'mic', desc: 'Vidíš písmena, řekni je anglicky do mikrofonu.' },
    numwrite: { name: 'Piš čísla', icon: '123', desc: 'Hlas řekne číslo, ty ho napiš.' },
    numsay: { name: 'Řekni čísla', icon: 'mic', desc: 'Vidíš číslo, řekni ho anglicky.' },
    review: { name: 'Zopakovat, co mi nejde', icon: 'repeat', desc: 'Jen slabá slovíčka a fráze.' },
    exam: { name: 'Zkouška nanečisto', icon: 'exam', desc: 'Test z aktuálního tématu – výsledek v procentech.' },
    sayit: { name: 'Řekni to!', icon: 'mic', desc: 'Řekni slovo nebo větu nahlas.' },
    memorize: { name: 'Nazpaměť', icon: 'brain', desc: 'Rozhovor nebo text: poslouchej, doplňuj, skládej a nakonec řekni zpaměti.' },
  };
  const REVIEW_GAMES = ['wordbuild', 'sentence', 'gap', 'listen'];
  const CHALLENGE_GAMES = ['spellwrite', 'spellsay', 'numwrite', 'numsay'];
  function syncMemorizeMissions(p) {
    const evs = memorizeEvents();
    const ids = evs.map(e => 'mem-' + e.id);
    p.daily.missions = p.daily.missions.filter(m => m.game !== 'memorize' || ids.includes(m.id));
    evs.forEach(e => {
      if (p.daily.missions.find(m => m.id === 'mem-' + e.id)) return;
      const t = textById(e.textId);
      p.daily.missions.push({ id: 'mem-' + e.id, game: 'memorize', eventId: e.id, textId: e.textId, unitIds: [e.unitId], title: 'Nazpaměť: ' + (t ? t.title : ''), sub: `Do ${new Date(e.date + 'T12:00:00').toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'numeric' })} · poslech → doplň → seřaď → řekni zpaměti`, target: 1, progress: 0, done: false, coins: 50, trophies: 20, main: false, bonusDrop: !(e.dropClaimed && e.dropClaimed[p.id]) });
    });
  }
  function ensureDaily(p) {
    const today = todayKey();
    if (p.daily && p.daily.date === today) { syncMemorizeMissions(p); return p.daily; }
    const rnd = seededRandom(today + ':' + p.id);
    const ev = activeEvent();
    const curUnit = (ev && ev.unitId) || SAVE.settings.currentUnitId;
    const unlocked = unlockedUnits(p).map(u => u.id);
    const dayIdx = Math.floor(new Date(today + 'T12:00:00').getTime() / 86400000);
    const reviewGame = REVIEW_GAMES[dayIdx % REVIEW_GAMES.length];
    const challengeGame = CHALLENGE_GAMES[dayIdx % CHALLENGE_GAMES.length];
    const unitTitle = UNIT_BY_ID[curUnit] ? UNIT_BY_ID[curUnit].title : '';
    const missions = [
      { id: 'm1', game: 'listen', unitIds: [curUnit], title: GAME_INFO.listen.name, sub: `${unitTitle} · 10 otázek`, target: CONFIG.QUESTIONS_PER_MISSION, progress: 0, done: false, coins: CONFIG.REWARD.missionCoins, trophies: CONFIG.REWARD.missionTrophies, main: true },
      { id: 'm2', game: reviewGame, unitIds: unlocked, title: GAME_INFO[reviewGame].name, sub: 'Opakování · všechna odemčená témata', target: CONFIG.QUESTIONS_PER_MISSION, progress: 0, done: false, coins: CONFIG.REWARD.missionCoins, trophies: CONFIG.REWARD.missionTrophies, main: true },
      { id: 'm3', game: ev ? 'exam' : 'blitz', unitIds: ev ? [curUnit] : unlocked, title: ev ? GAME_INFO.exam.name : GAME_INFO.blitz.name, sub: ev ? `${unitTitle} · 15 otázek` : 'Rychlá kola · co nejvíc správně', target: 1, progress: 0, done: false, coins: ev ? CONFIG.REWARD.examCoins : CONFIG.REWARD.blitzCoins, trophies: ev ? CONFIG.REWARD.examTrophies : 0, main: true },
      { id: 'm4', game: challengeGame, unitIds: unlocked, title: 'Výzva dne: ' + GAME_INFO[challengeGame].name, sub: GAME_INFO[challengeGame].desc, target: 8, progress: 0, done: false, coins: CONFIG.REWARD.challengeCoins, trophies: CONFIG.REWARD.challengeTrophies, main: false },
    ];
    p.daily = { date: today, missions, dropOpened: false, dropReward: null };
    syncMemorizeMissions(p);
    save();
    return p.daily;
  }
  // Bonusovy Drop (napr. za rozhovor nazpamet) - pocitadlo nevyzvednutych
  function grantBonusDrop(p, why) { p.bonusDrops = (p.bonusDrops || 0) + 1; log(p, 'drop', 'Bonusový Drop: ' + (why || '')); save(); }
  function mainMissionsDone(p) { return p.daily.missions.filter(m => m.main && m.done).length; }
  function completeMission(p, mission) {
    if (mission.done) return;
    mission.done = true; p.stats.missions++;
    addCoins(p, mission.coins); if (mission.trophies) addTrophies(p, mission.trophies);
    addPassPoints(p, 1);
    log(p, 'mission', `Mise ${mission.title}: +${mission.coins} coinů${mission.trophies ? ', +' + mission.trophies + ' 🏆' : ''}`);
    save();
  }
  function dropAvailable(p) { return p.daily && mainMissionsDone(p) >= 3 && !p.daily.dropOpened; }
  // Udalosti Skola
  function addEvent(ev) { ev.id = uid(); ev.done = false; SAVE.settings.events.push(ev); save(); return ev; }
  function removeEvent(id) { SAVE.settings.events = SAVE.settings.events.filter(e => e.id !== id); save(); }

  /* ---------- 8. PREDMETY ---------- */
  function grantItem(p, itemId, why) { if (!p.owned.includes(itemId)) { p.owned.push(itemId); log(p, 'item', `Nový předmět: ${window.ES_ITEMS_BY_ID[itemId] ? window.ES_ITEMS_BY_ID[itemId].name : itemId} (${why || ''})`); } }
  function buyItem(p, itemId) {
    const it = window.ES_ITEMS_BY_ID[itemId]; if (!it || it.how !== 'shop' || p.owned.includes(itemId) || p.coins < it.price) return false;
    p.coins -= it.price; grantItem(p, itemId, 'obchod'); equipItem(p, itemId); save(); return true;
  }
  function equipItem(p, itemId) { const it = window.ES_ITEMS_BY_ID[itemId]; if (!it || !p.owned.includes(itemId)) return; p.look.items[it.slot] = itemId; save(); }
  function unequipSlot(p, slot) { if (slot === 'bg') return; delete p.look.items[slot]; save(); }
  function skinPrice(ci) { return ci === 0 ? 0 : 200; }
  function skinOwned(p, ci) { return ci === 0 || p.owned.includes(`skin-${p.charId}-${ci}`); }
  function buySkin(p, ci) { const id = `skin-${p.charId}-${ci}`; if (skinOwned(p, ci)) { p.look.color = ci; save(); return true; } if (p.coins < skinPrice(ci)) return false; p.coins -= skinPrice(ci); p.owned.push(id); p.look.color = ci; log(p, 'item', 'Nová barva postavy'); save(); return true; }

  window.ES_CORE = {
    CONFIG, GAME_INFO, todayKey, addDays, daysBetween, monthKey, weekKey, daysLeftInMonth, seededRandom, shuffle, pick, uid, clamp,
    load, save, exportJSON, importJSON, get SAVE() { return SAVE; }, profile, otherProfile, log,
    buildContent, get UNITS() { return UNITS; }, get ITEMS() { return ITEMS; }, get ITEM_BY_ID() { return ITEM_BY_ID; }, get UNIT_BY_ID() { return UNIT_BY_ID; },
    unitItems, unitPower, unitProgress, isUnitUnlocked, unlockedUnits, activeEvent, eventMultiplierFor,
    srsOf, isDue, pickItems, recordAnswer, weakItems,
    rankOf, rankLevel, addTrophies, addCoins, addGems, roadRewards, claimRoad, ensureSeason, addPassPoints, passTier, passRewardFor, passRewards, claimPass, describeReward, rollDrop, weeklyTrophies, dadMistakeBonus, requestReward, resolvePending,
    ensureDaily, mainMissionsDone, completeMission, dropAvailable, addEvent, removeEvent, allTexts, textById, ensureAutoEvents, memorizeEvents, grantBonusDrop,
    grantItem, buyItem, equipItem, unequipSlot, skinPrice, skinOwned, buySkin
  };
})();
