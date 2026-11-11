/* ============================================================
   ENGLISH STARS - screens.js
   Obrazovky: profily, vyber postavy, lobby, karty, obchod,
   Co mi nejde, odmeny (Drop, Trophy Road, Pass), Pro tatu
   ------------------------------------------------------------
   1. NAVIGACE A SPOLECNE CASTI (hlavicka, spodni lista, tema)
   2. PROFILY A VYBER POSTAVY
   3. LOBBY (mise, Drop, Skola, karty, Tata vs Tom)
   4. KARTY TEMAT
   5. OBCHOD (postavicka, predmety, vzhledy, skutecne odmeny)
   6. CO MI NEJDE
   7. ODMENY: Drop, Trophy Road, Pass
   8. PRO TATU (PIN, nastaveni, udalosti, statistiky, zaloha)
   ============================================================ */
(function () {
  'use strict';
  const C = window.ES_CORE, U = window.ES_UI, A = window.ES_AUDIO, G = window.ES_GAMES, AV = window.ES_AVATAR;
  const { $, $$, esc, icon, fmt } = U;
  const root = () => $('#screen');
  function freshRoot() { return U.fresh($('#screen')); }

  /* ---------- 1. NAVIGACE ---------- */
  const S = {};
  let current = 'profiles';
  function go(name, arg) { current = name; A.stop(); freshRoot(); $$('.modal-wrap', $('#stage')).forEach(m => m.remove()); S[name](arg); window.scrollTo(0, 0); }
  function applyTheme(p) {
    const th = window.ES_THEMES[(p && p.look.items.bg) || 'bg-arena'] || window.ES_THEMES['bg-arena'];
    const r = document.documentElement.style;
    r.setProperty('--bg', th.bg); r.setProperty('--panel', th.panel); r.setProperty('--panel2', th.panel2); r.setProperty('--border', th.border);
    r.setProperty('--accent', th.accent); r.setProperty('--accent-text', th.accentText); r.setProperty('--cyan', th.cyan);
  }
  function avatarSmall(p, size) { return AV.renderAvatar(p.charId || 'kluk', p.look, { size: size || 44, shadow: false }); }
  function topBar(p, opts) {
    opts = opts || {};
    const tier = C.passTier(p), pts = p.season.points % C.CONFIG.PASS.POINTS_PER_TIER;
    const pct = Math.min(100, 100 * (tier * C.CONFIG.PASS.POINTS_PER_TIER + pts) / (C.CONFIG.PASS.TIERS * C.CONFIG.PASS.POINTS_PER_TIER));
    const claimable = C.passRewards(p).length + C.roadRewards(p).length;
    return `
    <header class="topbar">
      <button class="profile-btn" id="btn-profile" title="Přepnout hráče">
        <div class="avatar-ring">${avatarSmall(p, 46)}</div>
        <div class="pname"><div class="pn1">${esc(p.name)}</div><div class="pn2">${esc(C.rankOf(p.trophies))} · Lvl ${C.rankLevel(p.trophies)}</div></div>
      </button>
      <button class="season" id="btn-pass" title="Sezónní pass">
        <div class="season-row"><span>SEZÓNA ${esc(p.season.key)} · TIER ${tier} / ${C.CONFIG.PASS.TIERS}</span><span>zbývá ${C.daysLeftInMonth()} dní${claimable ? ` · <b class="claim">★ ${claimable} odměn!</b>` : ''}</span></div>
        ${U.bar(pct, 'var(--cyan)', 12)}
      </button>
      <div class="counters">
        <button class="pill" id="btn-road" title="Trophy Road">${icon('trophy', 22, '#FFC53D')}<span>${fmt(p.trophies)}</span></button>
        ${U.pill('coin', p.coins, '#FFA826', 'Coiny')}
        <button class="pill" id="btn-gems" title="Drahokamy">${icon('gem', 22, '#3DDC97')}<span>${fmt(p.gems)}</span></button>
      </div>
    </header>`;
  }
  function navBar(active) {
    const tabs = [['lobby', 'list', 'MISE'], ['train', 'bolt', 'TRÉNINK'], ['cards', 'cards', 'KARTY'], ['shop', 'shop', 'OBCHOD'], ['weak', 'brain', 'CO MI NEJDE']];
    return `<nav class="navbar">${tabs.map(([id, ic, label]) => `<button class="tab ${active === id ? 'active' : ''}" data-go="${id}">${icon(ic, 24)}<span>${label}</span></button>`).join('')}<div class="spacer"></div><button class="tab tab-small" data-go="parent">${icon('lock', 18)}<span>Pro tátu</span></button></nav>`;
  }
  function bindCommon(p) {
    const r = root();
    U.on(r, '[data-go]', 'click', (e, b) => go(b.dataset.go));
    const pb = $('#btn-profile', r); if (pb) pb.addEventListener('click', () => go('profiles'));
    const ps = $('#btn-pass', r); if (ps) ps.addEventListener('click', () => go('pass'));
    const rd = $('#btn-road', r); if (rd) rd.addEventListener('click', () => go('road'));
    const gm = $('#btn-gems', r); if (gm) gm.addEventListener('click', () => go('shop', 'rewards'));
  }

  /* ---------- 2. PROFILY A POSTAVA ---------- */
  S.profiles = function () {
    const sv = C.SAVE;
    root().innerHTML = `
    <div class="center-screen">
      <div class="logo">${icon('star', 44, '#FFC53D', 'fill="#FFC53D"')}<span>ENGLISH STARS</span></div>
      <div class="q-sub">Kdo hraje?</div>
      <div class="profiles">
        ${Object.values(sv.profiles).map(p => `<button class="profile-card panel" data-p="${p.id}">
          <div class="pc-avatar">${p.charId ? AV.renderAvatar(p.charId, p.look, { size: 150 }) : `<div class="pc-unknown">?</div>`}</div>
          <div class="pc-name">${esc(p.name)}</div>
          <div class="pc-sub">${icon('trophy', 18, '#FFC53D')} ${fmt(p.trophies)} · ${esc(C.rankOf(p.trophies))}</div>
        </button>`).join('')}
      </div>
      <div class="q-sub small">Táta vs Tom: týdenní duel o trofeje · tátova chyba = coin pro Toma</div>
    </div>`;
    U.on(root(), '.profile-card', 'click', (e, b) => {
      sv.activeProfile = b.dataset.p; C.save(true);
      const p = C.profile(); applyTheme(p);
      if (!p.charId) go('character'); else go('lobby');
    });
  };
  S.character = function () {
    const p = C.profile();
    const chars = AV.CHARACTERS;
    root().innerHTML = `
    <div class="charselect">
      <header class="topbar simple"><div class="logo small">${icon('star', 30, '#FFC53D', 'fill="#FFC53D"')}<span>ENGLISH STARS</span></div><span class="q-sub">Vyber si postavu, ${esc(p.name)}!</span><span class="chip">Postavu můžeš později změnit v obchodě</span></header>
      <div class="chars">${Object.keys(chars).map(id => `<div class="char-card panel">
        <div class="char-art">${AV.renderAvatar(id, { color: 0, items: {} }, { size: 180 })}</div>
        <div class="char-name">${esc(chars[id].name).toUpperCase()}</div>
        <div class="char-tag">${esc(chars[id].tagline)}</div>
        <button class="btn btn-accent" data-char="${id}">VYBRAT</button>
      </div>`).join('')}</div>
    </div>`;
    U.on(root(), '[data-char]', 'click', (e, b) => { p.charId = b.dataset.char; p.look.color = 0; C.save(true); A.sfx.win(); go('lobby'); });
  };

  /* ---------- 3. LOBBY ---------- */
  function missionRow(m, idx) {
    const info = C.GAME_INFO[m.game] || {};
    const pct = m.target ? Math.min(100, 100 * (m.progress || 0) / m.target) : 0;
    const prog = m.game === 'blitz' || m.game === 'exam' || m.game === 'memorize' ? (m.done ? 'hotovo' : '') : `${m.progress || 0} / ${m.target}`;
    return `<div class="mission-row ${m.done ? 'done' : ''} ${!m.main ? 'extra' : ''}">
      <div class="mr-icon">${icon(info.icon || 'list', 32)}</div>
      <div class="mr-body">
        <div class="mr-top"><span class="mr-title">${esc(m.title)}</span><span class="mr-prog">${prog}</span></div>
        <div class="mr-sub">${esc(m.sub || '')}</div>
        ${U.bar(m.done ? 100 : pct, m.done ? '#22C55E' : 'var(--accent)')}
      </div>
      <div class="mr-reward"><div>+${m.coins} ${icon('coin', 18, '#FFA826')}</div>${m.trophies ? `<div>+${m.trophies} ${icon('trophy', 18, '#FFC53D')}</div>` : `<div>${icon('trophy', 18, '#FFC53D')} za odpovědi</div>`}${m.bonusDrop ? `<div class="bonus-chip">${icon('chest', 16, '#FFC53D')} DROP</div>` : ''}</div>
      ${m.done ? `<div class="btn-done">${icon('check', 22)} SPLNĚNO</div>` : `<button class="btn btn-accent mr-play" data-m="${m.id}">${m.progress ? 'POKRAČOVAT' : 'HRÁT'}</button>`}
    </div>`;
  }
  function eventBanner(ev) {
    if (ev && ev.type === 'memorize') {
      const t = C.textById(ev.textId); const days = C.daysBetween(C.todayKey(), ev.date);
      const dateStr = new Date(ev.date + 'T12:00:00').toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'numeric' });
      return `<div class="event-banner">
        <div class="mr-icon purple">${icon('brain', 32, '#C9B8FF')}</div>
        <div class="mr-body">
          <div class="ev-label">ŠKOLA · NAZPAMĚŤ</div>
          <div class="ev-title">${esc(t ? t.title : ev.title || '')} · ${dateStr} · ${days === 0 ? 'dnes!' : days === 1 ? 'zítra!' : 'za ' + days + ' dny'}</div>
          <div class="ev-chips"><span class="chip gold">Bonusový Drop za zvládnutí</span>${ev.bestScore !== undefined ? `<span class="chip">Nejlepší pokus: ${ev.bestScore} %</span>` : ''}</div>
        </div>
        <button class="btn btn-cyan" id="ev-train" data-ev="${ev.id}">TRÉNOVAT</button>
      </div>`;
    }
    if (!ev) return `<div class="event-empty">${icon('calendar', 20, '#6B78A8')}<span>ŠKOLA: žádná písemka ani zkoušení v plánu. Táta ji zadá v <b>Pro tátu → Škola</b> – pak tu bude odpočet a 2× trofeje za dané téma.</span></div>`;
    const u = C.UNIT_BY_ID[ev.unitId]; const days = C.daysBetween(C.todayKey(), ev.date);
    const dateStr = new Date(ev.date + 'T12:00:00').toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'numeric' });
    return `<div class="event-banner">
      <div class="mr-icon purple">${icon('calendar', 32, '#C9B8FF')}</div>
      <div class="mr-body">
        <div class="ev-label">ŠKOLA · ${esc(ev.type === 'exam' ? 'ZKOUŠENÍ' : ev.type === 'memorize' ? 'NAZPAMĚŤ' : 'PÍSEMKA')}</div>
        <div class="ev-title">${esc(u ? u.title : '')}${ev.title ? ' · ' + esc(ev.title) : ''} · ${dateStr} · ${days === 0 ? 'dnes!' : days === 1 ? 'zítra' : 'za ' + days + ' dny'}</div>
        <div class="ev-chips"><span class="chip gold">2× trofeje za ${esc(u ? u.title : 'téma')}</span>${ev.bestScore !== undefined ? `<span class="chip">Zkouška nanečisto: ${ev.bestScore} %</span>` : ''}</div>
      </div>
      <button class="btn btn-cyan" id="ev-train">TRÉNOVAT</button>
    </div>`;
  }
  const SHORT = { 's-back-to-school': 'Hello!', 'u1-move-your-body': 'Sport', 'u2-lets-go-shopping': 'Shopping', 'u3-at-the-zoo': 'Zoo', 'p1-pets': 'Pets', 'u4-the-nature-trail': 'Nature', 'u5-the-frozen-lake': 'Frozen lake', 'u6-all-year-round': 'Year', 'p2-jobs': 'Jobs', 'u7-my-house': 'My house', 'u8-all-around-the-town': 'Town', 'u9-holiday-fun': 'Holiday', 'p3-time': 'Time', 'fest-harvest': 'Harvest', 'fest-carnival': 'Carnival' };
  function cardMini(p, u) {
    const unlocked = C.isUnitUnlocked(p, u.id); const lvl = C.unitPower(p, u.id); const pr = C.unitProgress(p, u.id);
    const ev = C.activeEvent(); const isEv = ev && ev.unitId === u.id;
    const cls = !unlocked ? 'locked' : lvl >= 5 ? 'gold' : isEv ? 'event' : '';
    const sub = !unlocked ? 'Zamčeno' : lvl >= 5 ? 'MAX' : `${pr.known} / ${pr.total}`;
    return `<button class="card-mini ${cls}" data-go="cards"><div class="cm-top"><span class="cm-title">${esc(SHORT[u.id] || u.title).toUpperCase()}</span><span class="cm-sub">${isEv && unlocked ? '2× EVENT' : sub}</span></div>${U.powerDots(unlocked ? lvl : 0)}<div class="cm-foot">${!unlocked ? icon('lock', 14) + ' zamčeno' : lvl >= 5 ? 'Zlatá karta' : 'Power ' + lvl + ' / 5'}</div></button>`;
  }
  function duelWidget(p) {
    const other = C.otherProfile();
    const mine = C.weeklyTrophies(p), theirs = C.weeklyTrophies(other);
    const max = Math.max(mine, theirs, 1);
    const lead = mine - theirs;
    return `<div class="duel panel">
      <div class="duel-head"><span>${icon('users', 24)} <b>TÁTA vs TOM</b></span><span class="q-sub">tento týden · končí v neděli</span></div>
      <div class="duel-row"><span class="dn">${esc(p.name.slice(0, 6))}</span>${U.bar(100 * mine / max, 'var(--accent)', 14)}<span class="dv">${mine}</span></div>
      <div class="duel-row"><span class="dn">${esc(other.name.slice(0, 6))}</span>${U.bar(100 * theirs / max, 'var(--cyan)', 14)}<span class="dv">${theirs}</span></div>
      <div class="q-sub">${lead > 0 ? `Vedeš o ${lead} trofejí.` : lead < 0 ? `Prohráváš o ${-lead} trofejí – zaber!` : 'Nerozhodně!'} ${p.role === 'kid' ? 'Tátova chyba = coin pro tebe.' : 'Tvoje chyba = coin pro Toma.'}</div>
    </div>`;
  }
  S.lobby = function () {
    const p = C.profile(); applyTheme(p);
    C.ensureSeason(p); const daily = C.ensureDaily(p); const ev = C.activeEvent();
    const mainDone = C.mainMissionsDone(p);
    const dropReady = C.dropAvailable(p);
    const units = C.UNITS.filter(u => !u.id.startsWith('fest') && !u.id.startsWith('p')).slice(0, 6);
    root().innerHTML = `
    <div class="screen-grid">
      ${topBar(p)}
      <main class="lobby">
        <section class="lobby-left">
          <div class="sec-head"><h1>DNEŠNÍ MISE</h1><span class="q-sub">${mainDone} / 3 splněno${daily.missions[3].done ? ' + výzva' : ''}</span>
            ${p.bonusDrops > 0 ? `<button class="drop-btn ready" id="btn-bonus-drop">${icon('chest', 24, '#1A1F3A')} BONUS DROP!</button>` : ''}
            ${dropReady ? `<button class="drop-btn ready" id="btn-drop">${icon('chest', 24, '#1A1F3A')} OTEVŘÍT DROP!</button>` : daily.dropOpened ? `<div class="drop-btn opened">${icon('chest', 22)} Drop otevřen · zítra další</div>` : `<div class="drop-btn">${icon('chest', 22, '#FFC53D')} Drop: splň ještě ${3 - mainDone} mise</div>`}
          </div>
          <div class="missions ${daily.missions.length > 4 ? 'compact' : ''}">${daily.missions.map(missionRow).join('')}</div>
          ${eventBanner(ev).replace('class="event-banner"', `class="event-banner ${daily.missions.length > 4 ? 'compact' : ''}"`)}
        </section>
        <aside class="lobby-right">
          <div class="sec-head small"><h2>MOJE KARTY</h2><button class="link" data-go="cards">Zobrazit vše →</button></div>
          <div class="cards-mini">${units.map(u => cardMini(p, u)).join('')}</div>
          ${duelWidget(p)}
        </aside>
      </main>
      ${navBar('lobby')}
    </div>`;
    bindCommon(p);
    U.on(root(), '.mr-play', 'click', (e, b) => { const m = daily.missions.find(x => x.id === b.dataset.m); startMission(m); });
    const evb = $('#ev-train', root()); if (evb) evb.addEventListener('click', () => {
      if (ev && ev.type === 'memorize') { const mm = daily.missions.find(x => x.id === 'mem-' + ev.id); if (mm) startMission(mm); return; }
      const m = daily.missions[0]; startMission(m.done ? Object.assign({}, m, { id: 'ev-extra', done: false, progress: 0, coins: 10, trophies: 0, title: 'Trénink na písemku' }) : m);
    });
    const db = $('#btn-drop', root()); if (db) db.addEventListener('click', () => go('drop'));
    const bdb = $('#btn-bonus-drop', root()); if (bdb) bdb.addEventListener('click', () => go('drop', 'bonus'));
    // upozorneni na vyzvednutelne odmeny
    const cl = C.passRewards(p).length + C.roadRewards(p).length; if (cl) U.toast(`${icon('star', 18, '#FFC53D')} Máš ${cl} odměn k vyzvednutí – ťukni na sezónu nebo trofeje nahoře.`);
  };
  function startMission(m) {
    current = 'mission'; A.stop();
    G.playMission(m, freshRoot(), () => go('lobby'));
  }

  /* ---------- 3b. TRENINK (vsechny minihry, volny vyber tematu) ---------- */
  const TRAIN_GAMES = ['listen', 'wordbuild', 'sentence', 'gap', 'blitz', 'spellwrite', 'spellsay', 'numwrite', 'numsay'];
  let trainUnit = null;
  S.train = function () {
    const p = C.profile();
    const units = C.unlockedUnits(p);
    if (!trainUnit || !units.find(u => u.id === trainUnit)) trainUnit = C.SAVE.settings.currentUnitId;
    const needsMic = g => g === 'spellsay' || g === 'numsay';
    const noUnit = g => ['spellsay', 'numwrite', 'numsay'].includes(g);
    root().innerHTML = `
    <div class="screen-grid">
      ${topBar(p)}
      <main class="train-screen">
        <div class="sec-head"><h1>TRÉNINK</h1><span class="q-sub">Vyber téma a minihru · volné procvičování: +5 coinů za dokončení, trofeje za správné odpovědi jako v misích</span></div>
        <div class="unit-chips">${units.map(u => `<button class="uchip ${u.id === trainUnit ? 'on' : ''}" data-unit="${u.id}">${esc(u.code)} · ${esc(SHORT[u.id] || u.title)}</button>`).join('')}<button class="uchip ${trainUnit === 'all' ? 'on' : ''}" data-unit="all">Všechna odemčená</button></div>
        <div class="train-grid">${TRAIN_GAMES.map(g => { const i = C.GAME_INFO[g]; return `<button class="train-card" data-game="${g}">
            <div class="mr-icon">${icon(i.icon, 32)}</div>
            <div class="tc-body"><div class="tc-title">${esc(i.name)}${needsMic(g) ? ' 🎤' : ''}</div><div class="tc-desc">${esc(i.desc)}</div></div>
          </button>`; }).join('')}</div>
      </main>
      ${navBar('train')}
    </div>`;
    bindCommon(p);
    U.on(root(), '[data-unit]', 'click', (e, b) => { trainUnit = b.dataset.unit; go('train'); });
    U.on(root(), '[data-game]', 'click', (e, b) => {
      const g = b.dataset.game; const unitIds = trainUnit === 'all' ? units.map(u => u.id) : [trainUnit];
      const u = C.UNIT_BY_ID[trainUnit];
      const isChallenge = ['spellwrite', 'spellsay', 'numwrite', 'numsay'].includes(g);
      startMission({ id: 'train-' + g, game: g, unitIds, title: C.GAME_INFO[g].name, sub: (trainUnit === 'all' ? 'všechna odemčená témata' : (u ? u.title : '')) + ' · trénink', target: isChallenge ? 8 : (g === 'blitz' ? 1 : 10), progress: 0, done: false, coins: 5, trophies: 0, main: false });
    });
  };

  /* ---------- 4. KARTY TEMAT ---------- */
  const UNIT_ICONS = { 's-back-to-school': '🏫', 'u1-move-your-body': '⚽', 'u2-lets-go-shopping': '🛒', 'u3-at-the-zoo': '🦁', 'p1-pets': '🐶', 'u4-the-nature-trail': '🌲', 'u5-the-frozen-lake': '⛸️', 'u6-all-year-round': '📅', 'p2-jobs': '👩‍🚒', 'u7-my-house': '🏠', 'u8-all-around-the-town': '🏙️', 'u9-holiday-fun': '🎢', 'p3-time': '⏰', 'fest-harvest': '🌾', 'fest-carnival': '🎭' };
  S.cards = function () {
    const p = C.profile(); const ev = C.activeEvent();
    root().innerHTML = `
    <div class="screen-grid">
      ${topBar(p)}
      <main class="cards-screen">
        <div class="sec-head"><h1>KARTY TÉMAT</h1><span class="q-sub">${C.unlockedUnits(p).length} / ${C.UNITS.length} odemčeno · Power = jak dobře umíš slovíčka · Boss přijde v další verzi</span></div>
        <div class="cards-grid">${C.UNITS.map(u => {
          const unlocked = C.isUnitUnlocked(p, u.id); const lvl = C.unitPower(p, u.id); const pr = C.unitProgress(p, u.id); const isEv = ev && ev.unitId === u.id;
          const cls = !unlocked ? 'locked' : lvl >= 5 ? 'gold' : isEv ? 'event' : '';
          const words = C.unitItems(u.id, ['word']).length, phr = C.unitItems(u.id, ['phrase']).length;
          return `<div class="card ${cls}">
            <div class="card-art">${UNIT_ICONS[u.id] || '📘'}${lvl >= 5 ? '<span class="badge gold">MAX</span>' : ''}${isEv && unlocked ? '<span class="badge purple">2× EVENT</span>' : ''}</div>
            <div class="card-body">
              <div class="card-title">${esc(u.title)}</div>
              <div class="q-sub tiny">${esc(u.code)} · str. ${esc(u.pages)} · ${words} slov · ${phr} frází</div>
              ${U.powerDots(unlocked ? lvl : 0)}
              <div class="card-row"><span>${pr.known} / ${pr.total} slov umím</span><span>${icon('trophy', 14, '#FFC53D')} ${unitTrophies(p, u.id)}</span></div>
              ${unlocked ? `<button class="btn btn-accent small" data-unit="${u.id}">PROCVIČIT</button>` : `<div class="btn-locked">${icon('lock', 16)} Odemkne se po ${esc(prevUnitTitle(u))}</div>`}
            </div>
          </div>`;
        }).join('')}</div>
      </main>
      ${navBar('cards')}
    </div>`;
    bindCommon(p);
    U.on(root(), '[data-unit]', 'click', async (e, b) => {
      const uid = b.dataset.unit; const u = C.UNIT_BY_ID[uid];
      const r = await U.modal(`<h3>${esc(u.title)}</h3><p>Vyber minihru:</p>`, [
        { id: 'listen', label: 'Poslechni a klikni' }, { id: 'wordbuild', label: 'Skládačka slova' }, { id: 'sentence', label: 'Skládačka věty' }, { id: 'gap', label: 'Doplň slovo' }, { id: 'blitz', label: 'Blitz 60 s', cls: 'btn-accent' }, { id: 'cancel', label: 'Zrušit', cls: 'btn-ghost' }]);
      if (r.id === 'cancel') return;
      startMission({ id: 'free-' + uid, game: r.id, unitIds: [uid], title: C.GAME_INFO[r.id].name, sub: u.title + ' · volné procvičování', target: 10, progress: 0, done: false, coins: 10, trophies: 0, main: false });
    });
  };
  function prevUnitTitle(u) { const i = C.UNITS.findIndex(x => x.id === u.id); return i > 0 ? C.UNITS[i - 1].title : ''; }
  function unitTrophies(p, uid) { let n = 0; C.unitItems(uid).forEach(i => { const r = p.srs[i.id]; if (r) n += r.ok; }); return n; }

  /* ---------- 5. OBCHOD ---------- */
  const SLOT_NAMES = { head: 'Hlava', face: 'Obličej', body: 'Oblečení', hand: 'Do ruky', back: 'Záda', bg: 'Vzhled hry' };
  S.shop = function (tab) {
    const p = C.profile(); tab = tab || 'items';
    const items = window.ES_ITEMS.filter(i => !i.retired);
    const slots = ['head', 'face', 'body', 'hand', 'back', 'bg'];
    const ch = AV.CHARACTERS[p.charId || 'kluk'];
    const itemCard = it => {
      const owned = p.owned.includes(it.id); const equipped = p.look.items[it.slot] === it.id; const rar = window.ES_RARITY[it.rarity];
      const can = it.how === 'shop' && !owned && p.coins >= it.price;
      const how = it.how === 'shop' ? `${it.price} ${icon('coin', 14, '#FFA826')}` : it.how === 'drop' ? 'z Dropu' : it.how === 'pass' ? `Pass tier ${it.tier}` : it.how === 'road' ? `${it.trophies} ${icon('trophy', 14, '#FFC53D')}` : 'výchozí';
      const preview = it.slot === 'bg' ? `<div class="item-bg" style="background:${it.color}"></div>` : AV.renderAvatar(p.charId || 'kluk', { color: p.look.color, items: Object.assign({}, p.look.items, { [it.slot]: it.id }) }, { size: 90, shadow: false });
      return `<div class="item-card ${it.rarity} ${equipped ? 'equipped' : ''} ${owned ? 'owned' : ''}">
        <div class="item-prev">${preview}</div>
        <div class="item-name">${esc(it.name)}</div>
        <div class="item-rar" style="color:${rar.color}">${rar.name}</div>
        ${equipped ? `<div class="btn-done small">${icon('check', 16)} nasazeno</div>` : owned ? `<button class="btn btn-ghost small" data-equip="${it.id}">Nasadit</button>` : it.how === 'shop' ? `<button class="btn ${can ? 'btn-accent' : 'btn-disabled'} small" data-buy="${it.id}" ${can ? '' : 'disabled'}>${how}</button>` : `<div class="item-how">${how}</div>`}
      </div>`;
    };
    root().innerHTML = `
    <div class="screen-grid">
      ${topBar(p)}
      <main class="shop">
        <aside class="shop-left panel">
          <div class="shop-avatar">${AV.renderAvatar(p.charId || 'kluk', p.look, { size: 220, showBg: true })}</div>
          <div class="char-name">${esc(ch.name).toUpperCase()}</div>
          <div class="skins">${ch.colors.map((c, i) => `<button class="skin ${p.look.color === i ? 'on' : ''}" data-skin="${i}" style="background:${c}" title="${esc(ch.colorNames[i])}">${C.skinOwned(p, i) ? '' : `<span>${C.skinPrice(i)}</span>`}</button>`).join('')}</div>
          <div class="q-sub tiny">Barvy postavy · 200 coinů</div>
          <div class="equipped-list">${slots.filter(s => s !== 'bg').map(s => `<div class="eq-row"><span>${SLOT_NAMES[s]}</span><span>${p.look.items[s] ? esc(window.ES_ITEMS_BY_ID[p.look.items[s]].name) + ` <button class="x-btn" data-unequip="${s}" title="Sundat">${icon('x', 14)}</button>` : '—'}</span></div>`).join('')}</div>
          <button class="btn btn-ghost small" id="change-char">${icon('swap', 18)} Změnit postavu</button>
        </aside>
        <section class="shop-right">
          <div class="shop-tabs"><button class="stab ${tab === 'items' ? 'on' : ''}" data-tab="items">Předměty</button><button class="stab ${tab === 'themes' ? 'on' : ''}" data-tab="themes">Vzhledy hry</button><button class="stab ${tab === 'rewards' ? 'on' : ''}" data-tab="rewards">${icon('gem', 18, '#3DDC97')} Skutečné odměny</button></div>
          <div class="shop-content">
            ${tab === 'items' ? slots.filter(s => s !== 'bg').map(s => `<h3 class="slot-head">${SLOT_NAMES[s]}</h3><div class="items-grid">${items.filter(i => i.slot === s).map(itemCard).join('')}</div>`).join('') : ''}
            ${tab === 'themes' ? `<div class="q-sub">Vzhled mění barvy celé hry i pozadí postavy.</div><div class="items-grid">${items.filter(i => i.slot === 'bg').map(itemCard).join('')}</div>` : ''}
            ${tab === 'rewards' ? rewardsTab(p) : ''}
          </div>
        </section>
      </main>
      ${navBar('shop')}
    </div>`;
    bindCommon(p);
    const r = root();
    U.on(r, '[data-tab]', 'click', (e, b) => go('shop', b.dataset.tab));
    U.on(r, '[data-buy]', 'click', (e, b) => { if (C.buyItem(p, b.dataset.buy)) { A.sfx.coin(); applyTheme(p); go('shop', tab); } else U.toast('Nemáš dost coinů.'); });
    U.on(r, '[data-equip]', 'click', (e, b) => { C.equipItem(p, b.dataset.equip); applyTheme(p); go('shop', tab); });
    U.on(r, '[data-unequip]', 'click', (e, b) => { C.unequipSlot(p, b.dataset.unequip); go('shop', tab); });
    U.on(r, '[data-skin]', 'click', (e, b) => { if (C.buySkin(p, +b.dataset.skin)) { A.sfx.coin(); go('shop', tab); } else U.toast('Nemáš dost coinů.'); });
    U.on(r, '[data-reward]', 'click', async (e, b) => {
      const rw = C.SAVE.settings.rewards.find(x => x.id === b.dataset.reward);
      const ok = await U.modal(`<h3>${esc(rw.name)}</h3><p>Vyměnit <b>${rw.gems} 💎</b>? Odměnu pak potvrdí táta v sekci Pro tátu.</p>`, [{ id: 'no', label: 'Zrušit' }, { id: 'yes', label: 'Vyměnit', cls: 'btn-accent' }]);
      if (ok.id === 'yes') { if (C.requestReward(p, rw.id)) { A.sfx.win(); U.toast('Hotovo! Řekni tátovi, ať to potvrdí.'); } go('shop', 'rewards'); }
    });
    $('#change-char', r).addEventListener('click', () => go('character'));
  };
  function rewardsTab(p) {
    const rate = C.SAVE.settings.gemRate;
    return `<div class="q-sub">Drahokamy 💎 padají z Dropů a sezónního passu. Vyměníš je za skutečné odměny – ${rate.gems} 💎 ≈ ${rate.minutes} minut elektroniky navíc.</div>
    <div class="rewards-grid">${C.SAVE.settings.rewards.map(r => `<div class="reward-card panel"><div class="reward-name">${esc(r.name)}</div><div class="reward-price">${icon('gem', 22, '#3DDC97')} ${r.gems}</div><button class="btn ${p.gems >= r.gems ? 'btn-accent' : 'btn-disabled'}" data-reward="${r.id}" ${p.gems >= r.gems ? '' : 'disabled'}>VYMĚNIT</button></div>`).join('')}</div>
    ${p.pending.filter(x => x.state === 'pending').length ? `<h3 class="slot-head">Čeká na potvrzení táty</h3><ul class="plain">${p.pending.filter(x => x.state === 'pending').map(x => `<li>${esc(x.name)} · ${x.gems} 💎 · ${x.date}</li>`).join('')}</ul>` : ''}`;
  }

  /* ---------- 6. CO MI NEJDE ---------- */
  S.weak = function () {
    const p = C.profile(); const weak = C.weakItems(p, 30);
    const acc = p.stats.totalAnswers ? Math.round(100 * p.stats.totalCorrect / p.stats.totalAnswers) : 0;
    root().innerHTML = `
    <div class="screen-grid">
      ${topBar(p)}
      <main class="weak-screen">
        <div class="sec-head"><h1>CO MI NEJDE</h1><span class="q-sub">Slovíčka a fráze, které pletu nejčastěji · celková úspěšnost ${acc} %</span>
          ${weak.length >= 3 ? `<button class="btn btn-accent" id="review-now">${icon('repeat', 22)} ZOPAKOVAT TEĎ (+${C.CONFIG.REWARD.reviewCoins} coinů)</button>` : ''}
        </div>
        ${weak.length ? `<div class="weak-list">${weak.map(w => `<div class="weak-row ${w.item.kind}">
            <div class="wr-emoji">${w.item.emoji || (w.item.kind === 'phrase' ? '💬' : '🔤')}</div>
            <div class="wr-body"><div class="wr-en">${esc(w.item.en)} <button class="btn-speak tiny" data-say="${esc(w.item.en)}">${icon('speaker', 18)}</button></div><div class="wr-cz">${esc(w.item.cz)}</div>${w.srs.conf.length ? `<div class="wr-conf">plete s: ${w.srs.conf.map(c => `<b>${esc(c.w)}</b> (${c.n}×)`).join(', ')}</div>` : ''}</div>
            <div class="wr-stats"><div>${w.srs.ok} ✓ · ${w.srs.bad} ✗</div>${U.powerDots(w.srs.box)}<div class="q-sub tiny">${esc(C.UNIT_BY_ID[w.item.unitId].title)}</div></div>
          </div>`).join('')}</div>` : `<div class="panel empty">${icon('star', 40, '#FFC53D')}<p>Zatím nic – buď je všechno v pohodě, nebo je potřeba odehrát víc misí, aby bylo z čeho vybírat.</p></div>`}
      </main>
      ${navBar('weak')}
    </div>`;
    bindCommon(p);
    U.on(root(), '[data-say]', 'click', (e, b) => A.speak(b.dataset.say));
    const rb = $('#review-now', root()); if (rb) rb.addEventListener('click', () => startMission({ id: 'review', game: 'review', unitIds: [], title: 'Zopakovat, co mi nejde', target: weak.length, progress: 0, done: false, coins: 0, trophies: 0, main: false }));
  };

  /* ---------- 7. ODMENY ---------- */
  S.drop = async function (mode) {
    const p = C.profile();
    const bonus = mode === 'bonus';
    if (bonus ? !(p.bonusDrops > 0) : !C.dropAvailable(p)) { go('lobby'); return; }
    // faze 1: bedna -> tuknuti -> zatreseni -> ukaze se RARITA; faze 2: tuknuti -> zatreseni -> ODMENA
    root().innerHTML = `<div class="center-screen drop-screen"><h1>${bonus ? 'BONUS DROP!' : 'DROP!'}</h1><div class="q-sub">${bonus ? 'Za rozhovor nazpaměť – ťukni na bednu' : 'Splnil jsi 3 mise – ťukni na bednu'}</div><button class="chest" id="chest">${icon('chest', 140, '#FFC53D')}</button><div class="drop-rar-big" id="rarlabel"></div></div>`;
    let phase = 0, reward = null;
    $('#chest', root()).addEventListener('click', async () => {
      const b = $('#chest', root()); if (b.disabled) return; b.disabled = true; b.classList.add('shake'); A.sfx.drop();
      await U.wait(900); b.classList.remove('shake');
      if (phase === 0) {
        phase = 1;
        reward = C.rollDrop(p);
        if (bonus) { p.bonusDrops = Math.max(0, (p.bonusDrops || 0) - 1); } else { p.daily.dropOpened = true; p.daily.dropReward = reward; }
        C.save(true);
        const rar = window.ES_RARITY[reward.rarity];
        b.style.filter = `drop-shadow(0 0 24px ${rar.color})`;
        $('#rarlabel', root()).innerHTML = `<span style="color:${rar.color}">${rar.name.toUpperCase()}</span><div class="q-sub">Ťukni znovu a otevři ji!</div>`;
        $('#rarlabel', root()).classList.add('show', reward.rarity);
        if (reward.rarity === 'legendary' || reward.rarity === 'epic') A.sfx.win();
        b.disabled = false; return;
      }
      const r = reward; const rar = window.ES_RARITY[r.rarity];
      const itemHtml = r.item ? `<div class="drop-item">${window.ES_ITEMS_BY_ID[r.item].slot === 'bg' ? `<div class="item-bg" style="background:${window.ES_ITEMS_BY_ID[r.item].color}"></div>` : AV.renderAvatar(p.charId || 'kluk', { color: p.look.color, items: Object.assign({}, p.look.items, { [window.ES_ITEMS_BY_ID[r.item].slot]: r.item }) }, { size: 110, shadow: false })}<span>${esc(window.ES_ITEMS_BY_ID[r.item].name)}</span></div>` : '';
      root().innerHTML = `<div class="center-screen drop-screen"><div class="panel drop-result ${r.rarity}"><div class="drop-rar" style="color:${rar.color}">${rar.name.toUpperCase()}</div>
        <div class="drop-items">${r.coins ? `<div class="drop-item">${icon('coin', 48, '#FFA826')}<span>+${r.coins} coinů</span></div>` : ''}${r.trophies ? `<div class="drop-item">${icon('trophy', 48, '#FFC53D')}<span>+${r.trophies} 🏆</span></div>` : ''}${r.passPoints ? `<div class="drop-item">${icon('star', 48, '#38BDF8')}<span>+${r.passPoints} bod passu</span></div>` : ''}${r.gems ? `<div class="drop-item">${icon('gem', 48, '#3DDC97')}<span>+${r.gems} 💎</span></div>` : ''}${itemHtml}</div>
        <button class="btn btn-accent big" data-go="lobby">PARÁDA!</button></div></div>`;
      if (r.item) C.equipItem(p, r.item);
      A.sfx.coin();
      U.on(root(), '[data-go]', 'click', (e, b2) => go(b2.dataset.go));
    });
  };
  S.road = function () {
    const p = C.profile(); const rewards = C.roadRewards(p);
    const steps = []; const maxT = Math.max(p.trophies + 300, 600);
    for (let t = C.CONFIG.ROAD_STEP; t <= maxT; t += C.CONFIG.ROAD_STEP) {
      const item = window.ES_ITEMS.find(i => i.how === 'road' && i.trophies === t);
      const claimed = p.road.claimed.includes(t); const reached = p.trophies >= t; const r = rewards.find(x => x.at === t);
      steps.push(`<div class="road-step ${claimed ? 'claimed' : reached ? 'ready' : ''}"><div class="rs-t">${t} ${icon('trophy', 16, '#FFC53D')}</div><div class="rs-r">${item ? esc(item.name) : (t % 200 === 0 ? '50 coinů + 1 💎' : '50 coinů')}</div>${r ? `<button class="btn btn-accent small" data-claim="${t}">VYZVEDNOUT</button>` : claimed ? `<div class="q-sub tiny">${icon('check', 14)} vyzvednuto</div>` : `<div class="q-sub tiny">${icon('lock', 14)}</div>`}</div>`);
    }
    root().innerHTML = `<div class="screen-grid">${topBar(p)}<main class="road-screen"><div class="sec-head"><h1>TROPHY ROAD</h1><span class="q-sub">Každých ${C.CONFIG.ROAD_STEP} trofejí odměna · máš ${fmt(p.trophies)} 🏆 · hodnost ${esc(C.rankOf(p.trophies))}</span><button class="btn btn-ghost" data-go="lobby">${icon('back', 20)} Zpět</button></div><div class="road">${steps.join('')}</div></main>${navBar('')}</div>`;
    bindCommon(p);
    U.on(root(), '[data-claim]', 'click', (e, b) => { const r = C.claimRoad(p, +b.dataset.claim); if (r) { A.sfx.coin(); U.toast('Odměna: ' + C.describeReward(r)); go('road'); } });
  };
  S.pass = function () {
    const p = C.profile(); const tier = C.passTier(p); const rewards = C.passRewards(p);
    const tiers = []; for (let t = 1; t <= C.CONFIG.PASS.TIERS; t++) {
      const r = C.passRewardFor(t); const claimed = p.season.claimed.includes(t); const can = rewards.find(x => x.tier === t);
      tiers.push(`<div class="pass-tier ${claimed ? 'claimed' : t <= tier ? 'ready' : ''} ${t % 5 === 0 ? 'big' : ''}"><div class="pt-n">${t}</div><div class="pt-r">${r.item ? esc(window.ES_ITEMS_BY_ID[r.item].name) : r.gems ? `${r.gems} 💎` : `${r.coins} coinů`}</div>${can ? `<button class="btn btn-accent small" data-claim="${t}">VZÍT</button>` : claimed ? icon('check', 16, '#22C55E') : icon('lock', 14, '#6B78A8')}</div>`);
    }
    root().innerHTML = `<div class="screen-grid">${topBar(p)}<main class="pass-screen"><div class="sec-head"><h1>SEZÓNNÍ PASS ${esc(p.season.key)}</h1><span class="q-sub">Každá splněná mise = 1 bod · ${C.CONFIG.PASS.POINTS_PER_TIER} body = 1 tier · body: ${p.season.points} · zbývá ${C.daysLeftInMonth()} dní</span><button class="btn btn-ghost" data-go="lobby">${icon('back', 20)} Zpět</button></div><div class="pass-grid">${tiers.join('')}</div></main>${navBar('')}</div>`;
    bindCommon(p);
    U.on(root(), '[data-claim]', 'click', (e, b) => { const r = C.claimPass(p, +b.dataset.claim); if (r) { A.sfx.coin(); U.toast('Odměna: ' + C.describeReward(r)); go('pass'); } });
  };

  /* ---------- 8. PRO TATU ---------- */
  let parentUnlocked = false;
  S.parent = async function (tab) {
    const p = C.profile(); const sv = C.SAVE;
    if (!parentUnlocked) {
      const pin = await U.prompt('<h3>Pro tátu</h3><p>Zadej PIN</p>', '', 'password');
      if (pin === null) { go('lobby'); return; }
      if (pin !== sv.settings.pin) { U.toast('Špatný PIN'); go('lobby'); return; }
      parentUnlocked = true; setTimeout(() => { parentUnlocked = false; }, 10 * 60 * 1000);
    }
    tab = tab || 'overview';
    const tom = sv.profiles.tom;
    const tabs = [['overview', 'Přehled'], ['school', 'Škola'], ['rewards', 'Odměny'], ['settings', 'Nastavení'], ['backup', 'Záloha']];
    let content = '';
    if (tab === 'overview') {
      const days = Object.keys(tom.stats.days).sort().slice(-14); const maxA = Math.max(1, ...days.map(d => tom.stats.days[d].answers));
      const weak = C.weakItems(tom, 10);
      const pend = tom.pending.filter(x => x.state === 'pending');
      content = `
      <div class="pgrid">
        <div class="panel pbox"><h3>Tom · posledních 14 dní</h3><div class="daychart">${days.map(d => { const s = tom.stats.days[d]; const h = Math.max(4, Math.round(100 * s.answers / maxA)); return `<div class="dc-col" title="${d}: ${s.answers} odpovědí, ${s.correct} správně, +${s.trophies} 🏆"><div class="dc-bar" style="height:${h}%"><div class="dc-ok" style="height:${s.answers ? 100 * s.correct / s.answers : 0}%"></div></div><div class="dc-l">${d.slice(8)}</div></div>`; }).join('') || '<p class="q-sub">Zatím žádná data.</p>'}</div>
          <div class="q-sub tiny">Výška = počet odpovědí, zelená část = správné. Celkem: ${tom.stats.totalAnswers} odpovědí, ${tom.stats.totalAnswers ? Math.round(100 * tom.stats.totalCorrect / tom.stats.totalAnswers) : 0} % úspěšnost, ${tom.stats.missions} misí, ${tom.stats.drops} Dropů.</div></div>
        <div class="panel pbox"><h3>Co Tomovi nejde</h3>${weak.length ? `<ul class="plain">${weak.map(w => `<li><b>${esc(w.item.en)}</b> – ${esc(w.item.cz)} <span class="q-sub tiny">(${w.srs.ok}✓/${w.srs.bad}✗${w.srs.conf.length ? ', plete s ' + esc(w.srs.conf[0].w) : ''})</span></li>`).join('')}</ul>` : '<p class="q-sub">Zatím nic.</p>'}<div class="q-sub tiny">Stejný seznam vidí Tom v záložce „Co mi nejde" a může ho hned zopakovat.</div></div>
        <div class="panel pbox"><h3>Čeká na potvrzení ${pend.length ? `<span class="badge purple">${pend.length}</span>` : ''}</h3>${pend.length ? pend.map(x => `<div class="pend-row"><span>${esc(x.name)} · ${x.gems} 💎 · ${x.date}</span><span><button class="btn btn-ok small" data-pend="${x.id}" data-ok="1">Splněno</button> <button class="btn btn-ghost small" data-pend="${x.id}" data-ok="0">Vrátit 💎</button></span></div>`).join('') : '<p class="q-sub">Nic nečeká.</p>'}
          <h3>Ručně</h3><div class="row gap"><button class="btn btn-ghost small" data-grant="gem">+1 💎 Tomovi</button><button class="btn btn-ghost small" data-grant="coins">+100 coinů</button><button class="btn btn-ghost small" data-grant="trophies">+20 🏆</button></div></div>
        <div class="panel pbox"><h3>Deník (posledních 25)</h3><ul class="plain log">${tom.log.slice(0, 25).map(l => `<li><span class="q-sub tiny">${l.t.slice(5, 16).replace('T', ' ')}</span> ${esc(l.text)}</li>`).join('') || '<li class="q-sub">Prázdné</li>'}</ul></div>
      </div>`;
    } else if (tab === 'school') {
      content = `
      <div class="pgrid">
        <div class="panel pbox"><h3>Aktuální téma ve škole</h3><p class="q-sub">První denní mise je vždy z tohoto tématu. Téma je automaticky odemčené.</p>
          <select class="inp" id="cur-unit">${C.UNITS.map(u => `<option value="${u.id}" ${sv.settings.currentUnitId === u.id ? 'selected' : ''}>${esc(u.code)} – ${esc(u.title)}</option>`).join('')}</select>
          <h3>Odemčená témata</h3><div class="unit-toggles">${C.UNITS.map(u => `<label class="tg"><input type="checkbox" data-unlock="${u.id}" ${sv.settings.unlockedUnits.includes(u.id) ? 'checked' : ''}> ${esc(u.code)} ${esc(u.title)}</label>`).join('')}</div>
          <p class="q-sub tiny">Nezaškrtnuté téma se odemkne samo, když má předchozí téma Power ≥ 2.</p></div>
        <div class="panel pbox"><h3>Nová událost (písemka / zkoušení)</h3>
          <div class="form"><label>Typ <select class="inp" id="ev-type"><option value="test">Písemka</option><option value="exam">Zkoušení</option></select></label>
          <label>Téma <select class="inp" id="ev-unit">${C.UNITS.map(u => `<option value="${u.id}" ${sv.settings.currentUnitId === u.id ? 'selected' : ''}>${esc(u.code)} – ${esc(u.title)}</option>`).join('')}</select></label>
          <label>Datum <input class="inp" type="date" id="ev-date" value="${C.addDays(C.todayKey(), 3)}"></label>
          <label>Poznámka <input class="inp" id="ev-title" placeholder="např. slovíčka lekce 4"></label>
          <button class="btn btn-accent" id="ev-add">${icon('plus', 20)} Přidat událost</button></div>
          <p class="q-sub tiny">Do data události: 2× trofeje za dané téma, třetí mise = Zkouška nanečisto (15 otázek, výsledek v %), banner v lobby.</p>
          <h3>Události</h3>${sv.settings.events.length ? sv.settings.events.map(e => `<div class="pend-row"><span>${e.done || e.date < C.todayKey() ? '✓ ' : ''}${esc(e.type === 'exam' ? 'Zkoušení' : e.type === 'memorize' ? 'Nazpaměť' : 'Písemka')} · ${esc(C.UNIT_BY_ID[e.unitId] ? C.UNIT_BY_ID[e.unitId].title : '')} · ${e.date}${e.title ? ' · ' + esc(e.title) : ''}${e.bestScore !== undefined ? ` · ${e.type === 'memorize' ? 'zvládnuto na' : 'nanečisto'} ${e.bestScore} %` : ''}</span><button class="btn btn-ghost small" data-ev-del="${e.id}">${icon('trash', 16)}</button></div>`).join('') : '<p class="q-sub">Žádné.</p>'}
        </div>
        <div class="panel pbox" style="grid-column: 1 / -1"><h3>Texty nazpaměť (rozhovory, básničky)</h3>
          <p class="q-sub">Zadáním vznikne úkol „Nazpaměť" s 5 částmi (poslech → doplň → seřaď → řekni → zpaměti) a bonusovým Dropem za ≥ 60 %.</p>
          ${C.allTexts().map(t => `<div class="pend-row"><span><b>${esc(t.title)}</b> · ${t.lines.length} replik · role: ${t.roles.map(esc).join(' / ')} (Tom = ${esc(t.roles[t.tomRole])})</span><span class="row gap"><input class="inp" type="date" id="txt-date-${t.id}" value="${C.addDays(C.todayKey(), 1)}" style="width:170px"><button class="btn btn-accent small" data-txt-assign="${t.id}">Zadat jako úkol</button>${(sv.settings.texts || []).find(x => x.id === t.id) ? `<button class="btn btn-ghost small" data-txt-del="${t.id}">${icon('trash', 16)}</button>` : ''}</span></div>`).join('')}
          <h3>Nový text</h3>
          <div class="form"><label>Název <input class="inp" id="nt-title" placeholder="např. Rozhovor u lékaře (Unit 3)"></label>
            <label>Téma <select class="inp" id="nt-unit">${C.UNITS.map(u => `<option value="${u.id}" ${sv.settings.currentUnitId === u.id ? 'selected' : ''}>${esc(u.code)} – ${esc(u.title)}</option>`).join('')}</select></label>
            <label>Role (dvě, oddělené čárkou; Tom říká druhou) <input class="inp" id="nt-roles" value="Prodavač, Zákazník"></label>
            <label>Repliky – každá na nový řádek: <code>Role: anglicky | česky</code> (jednorolový text: jen <code>anglicky | česky</code>)</label>
            <textarea class="inp code" id="nt-lines" style="height:120px;font-size:14px;font-family:inherit" placeholder="Prodavač: Hello. Can I help you? | Dobrý den. Můžu vám pomoct?&#10;Zákazník: Can I have an apple, please? | Můžu dostat jablko, prosím?"></textarea>
            <button class="btn btn-accent" id="nt-add">${icon('plus', 20)} Uložit text</button></div>
        </div>
      </div>`;
    } else if (tab === 'rewards') {
      content = `
      <div class="pgrid">
        <div class="panel pbox"><h3>Ceník skutečných odměn (za 💎)</h3>
          ${sv.settings.rewards.map(r => `<div class="pend-row"><span><b>${esc(r.name)}</b> · ${r.gems} 💎</span><span><button class="btn btn-ghost small" data-rw-edit="${r.id}">${icon('pencil', 16)}</button> <button class="btn btn-ghost small" data-rw-del="${r.id}">${icon('trash', 16)}</button></span></div>`).join('')}
          <div class="form"><label>Název <input class="inp" id="rw-name" placeholder="např. 30 minut elektroniky navíc"></label><label>Cena v 💎 <input class="inp" id="rw-gems" type="number" value="10" min="1"></label><button class="btn btn-accent" id="rw-add">${icon('plus', 20)} Přidat odměnu</button></div></div>
        <div class="panel pbox"><h3>Kurz drahokamů (jen informativní text pro Toma)</h3>
          <div class="form"><label>💎 <input class="inp" id="gr-gems" type="number" value="${sv.settings.gemRate.gems}" min="1"></label><label>= minut elektroniky <input class="inp" id="gr-min" type="number" value="${sv.settings.gemRate.minutes}" min="1"></label><button class="btn btn-ghost" id="gr-save">Uložit kurz</button></div>
          <h3>Jak drahokamy padají</h3><p class="q-sub">Drop po 3 misích: epický 15 % (1 💎), legendární 5 % (3 💎), pojistka: aspoň 1 epický za 7 dní. Sezónní pass: tier 5 a 10 = 1 💎, tier 15 a 20 = 2 💎, tier 30 = 3 💎 + Koruna. Trophy Road: každých 200 🏆 = 1 💎. Odhad: cca 2–4 💎 týdně při každodenním hraní.</p></div>
      </div>`;
    } else if (tab === 'settings') {
      content = `
      <div class="pgrid">
        <div class="panel pbox"><h3>Nastavení</h3>
          <label class="tg"><input type="checkbox" id="st-bonus" ${sv.settings.includeBonus !== false ? 'checked' : ''}> Zahrnout bonusová slova z učebnice (nejen školní sešit)</label>
          <label>Násobitel trofejí pro tátu (handicap) <input class="inp" id="st-mult" type="number" step="0.1" min="0.1" max="1" value="${sv.settings.dadMultiplier}"></label>
          <label>Jméno hráče Tom <input class="inp" id="st-name-tom" value="${esc(tom.name)}"></label>
          <label>Jméno hráče Táta <input class="inp" id="st-name-tata" value="${esc(sv.profiles.tata.name)}"></label>
          <button class="btn btn-accent" id="st-save">Uložit</button>
          <h3>PIN</h3><button class="btn btn-ghost" id="st-pin">Změnit PIN</button>
        </div>
        <div class="panel pbox"><h3>Pokročilé</h3>
          <p class="q-sub">Při aktualizaci hry (nová verze souborů) zůstává pokrok v tomto prohlížeči. Nikdy nemaž data prohlížeče bez zálohy.</p>
          <button class="btn btn-danger" id="st-reset-daily">Vygenerovat dnešní mise znovu (Tom)</button>
          <p class="q-sub tiny">Verze schématu uložené hry: ${sv.schemaVersion} · vytvořeno ${sv.createdAt.slice(0, 10)} · verze aplikace ${window.ES_VERSION || '?'}</p>
        </div>
      </div>`;
    } else if (tab === 'backup') {
      content = `
      <div class="pgrid">
        <div class="panel pbox"><h3>Záloha</h3><p class="q-sub">Stáhne soubor JSON s celým pokrokem obou hráčů. Poslední záloha: ${sv.settings.lastBackup || 'nikdy'}.</p>
          <button class="btn btn-accent" id="bk-export">${icon('download', 20)} Stáhnout zálohu</button>
          <h3>Obnovit ze zálohy</h3><p class="q-sub">Nahradí aktuální pokrok obsahem souboru.</p><input type="file" id="bk-file" accept="application/json,.json" class="inp">
        </div>
        <div class="panel pbox"><h3>Kód zálohy (pro kopírování)</h3><textarea class="inp code" id="bk-code" readonly>${esc(C.exportJSON())}</textarea><button class="btn btn-ghost small" id="bk-copy">Kopírovat</button></div>
      </div>`;
    }
    root().innerHTML = `<div class="screen-grid">${topBar(p)}<main class="parent"><div class="sec-head"><h1>${icon('lock', 28)} PRO TÁTU</h1><div class="shop-tabs">${tabs.map(([id, l]) => `<button class="stab ${tab === id ? 'on' : ''}" data-ptab="${id}">${l}</button>`).join('')}</div><button class="btn btn-ghost" data-go="lobby">${icon('back', 20)} Zpět</button></div>${content}</main>${navBar('')}</div>`;
    bindCommon(p);
    const r = root();
    U.on(r, '[data-ptab]', 'click', (e, b) => go('parent', b.dataset.ptab));
    U.on(r, '[data-pend]', 'click', (e, b) => { C.resolvePending(tom, b.dataset.pend, b.dataset.ok === '1'); go('parent', 'overview'); });
    U.on(r, '[data-grant]', 'click', (e, b) => { const k = b.dataset.grant; if (k === 'gem') C.addGems(tom, 1, 'od táty'); if (k === 'coins') C.addCoins(tom, 100); if (k === 'trophies') C.addTrophies(tom, 20); C.log(tom, 'manual', 'Táta ručně přidal: ' + k); C.save(true); U.toast('Přidáno.'); go('parent', 'overview'); });
    const cu = $('#cur-unit', r); if (cu) cu.addEventListener('change', () => { sv.settings.currentUnitId = cu.value; tom.daily = null; sv.profiles.tata.daily = null; C.save(true); U.toast('Aktuální téma změněno, mise přegenerovány.'); });
    U.on(r, '[data-unlock]', 'change', (e, b) => { const id = b.dataset.unlock; const arr = sv.settings.unlockedUnits; if (b.checked && !arr.includes(id)) arr.push(id); if (!b.checked) sv.settings.unlockedUnits = arr.filter(x => x !== id); C.save(true); });
    const ea = $('#ev-add', r); if (ea) ea.addEventListener('click', () => { const d = $('#ev-date', r).value; if (!d) { U.toast('Zadej datum'); return; } C.addEvent({ type: $('#ev-type', r).value, unitId: $('#ev-unit', r).value, date: d, title: $('#ev-title', r).value.trim() }); tom.daily = null; sv.profiles.tata.daily = null; C.save(true); go('parent', 'school'); });
    U.on(r, '[data-ev-del]', 'click', (e, b) => { C.removeEvent(b.dataset.evDel); tom.daily = null; sv.profiles.tata.daily = null; C.save(true); go('parent', 'school'); });
    U.on(r, '[data-txt-assign]', 'click', (e, b) => { const t = C.textById(b.dataset.txtAssign); const d = $('#txt-date-' + t.id, r).value; if (!d) { U.toast('Zadej datum'); return; } C.addEvent({ type: 'memorize', unitId: t.unitId, date: d, title: t.title, textId: t.id, dropClaimed: {} }); tom.daily = null; sv.profiles.tata.daily = null; C.save(true); U.toast('Úkol Nazpaměť zadán'); go('parent', 'school'); });
    U.on(r, '[data-txt-del]', 'click', (e, b) => { sv.settings.texts = (sv.settings.texts || []).filter(x => x.id !== b.dataset.txtDel); C.save(true); go('parent', 'school'); });
    const nta = $('#nt-add', r); if (nta) nta.addEventListener('click', () => {
      const title = $('#nt-title', r).value.trim(); const roles = $('#nt-roles', r).value.split(',').map(x => x.trim()).filter(Boolean);
      const raw = $('#nt-lines', r).value.split('\n').map(x => x.trim()).filter(Boolean);
      if (!title || !raw.length) { U.toast('Vyplň název a repliky'); return; }
      const lines = raw.map(line => { let role = null, rest = line; const m = line.match(/^([^:|]{1,30}):\s*(.+)$/); if (m && roles.map(x => x.toLowerCase()).includes(m[1].trim().toLowerCase())) { role = roles.map(x => x.toLowerCase()).indexOf(m[1].trim().toLowerCase()); rest = m[2]; } const parts = rest.split('|').map(x => x.trim()); return { r: role === null ? (roles.length > 1 ? 1 : 0) : role, en: parts[0], cz: parts[1] || '' }; });
      sv.settings.texts = sv.settings.texts || [];
      sv.settings.texts.push({ id: 'txt-custom-' + C.uid(), unitId: $('#nt-unit', r).value, title, roles: roles.length ? roles : ['Hlas'], tomRole: roles.length > 1 ? 1 : 0, lines });
      C.save(true); U.toast('Text uložen – teď ho zadej jako úkol'); go('parent', 'school');
    });
    const ra = $('#rw-add', r); if (ra) ra.addEventListener('click', () => { const n = $('#rw-name', r).value.trim(), g = parseInt($('#rw-gems', r).value, 10); if (!n || !g) return; sv.settings.rewards.push({ id: C.uid(), name: n, gems: g }); C.save(true); go('parent', 'rewards'); });
    U.on(r, '[data-rw-del]', 'click', (e, b) => { sv.settings.rewards = sv.settings.rewards.filter(x => x.id !== b.dataset.rwDel); C.save(true); go('parent', 'rewards'); });
    U.on(r, '[data-rw-edit]', 'click', async (e, b) => { const rw = sv.settings.rewards.find(x => x.id === b.dataset.rwEdit); const n = await U.prompt('<h3>Název odměny</h3>', rw.name); if (n === null) return; const g = await U.prompt('<h3>Cena v 💎</h3>', rw.gems, 'number'); if (g === null) return; rw.name = n.trim() || rw.name; rw.gems = parseInt(g, 10) || rw.gems; C.save(true); go('parent', 'rewards'); });
    const gs = $('#gr-save', r); if (gs) gs.addEventListener('click', () => { sv.settings.gemRate = { gems: parseInt($('#gr-gems', r).value, 10) || 10, minutes: parseInt($('#gr-min', r).value, 10) || 30 }; C.save(true); U.toast('Uloženo'); });
    const ss = $('#st-save', r); if (ss) ss.addEventListener('click', () => { sv.settings.includeBonus = $('#st-bonus', r).checked; sv.settings.dadMultiplier = parseFloat($('#st-mult', r).value) || 0.5; tom.name = $('#st-name-tom', r).value.trim() || tom.name; sv.profiles.tata.name = $('#st-name-tata', r).value.trim() || 'Táta'; C.save(true); C.buildContent(); U.toast('Uloženo'); go('parent', 'settings'); });
    const sp = $('#st-pin', r); if (sp) sp.addEventListener('click', async () => { const n = await U.prompt('<h3>Nový PIN</h3>', '', 'password'); if (n && n.length >= 4) { sv.settings.pin = n; C.save(true); U.toast('PIN změněn'); } });
    const rd = $('#st-reset-daily', r); if (rd) rd.addEventListener('click', () => { tom.daily = null; C.save(true); U.toast('Mise přegenerovány'); });
    const be = $('#bk-export', r); if (be) be.addEventListener('click', () => { const blob = new Blob([C.exportJSON()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `englishstars-zaloha-${C.todayKey()}.json`; a.click(); sv.settings.lastBackup = C.todayKey(); C.save(true); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
    const bf = $('#bk-file', r); if (bf) bf.addEventListener('change', async () => { const f = bf.files[0]; if (!f) return; const ok = await U.modal('<h3>Obnovit ze zálohy?</h3><p>Aktuální pokrok bude nahrazen.</p>', [{ id: 'no', label: 'Zrušit' }, { id: 'yes', label: 'Obnovit', cls: 'btn-danger' }]); if (ok.id !== 'yes') return; try { C.importJSON(await f.text()); C.buildContent(); U.toast('Obnoveno'); go('profiles'); } catch (e) { U.toast('Chyba: ' + e.message, 'bad'); } });
    const bc = $('#bk-copy', r); if (bc) bc.addEventListener('click', () => { const ta = $('#bk-code', r); ta.select(); try { document.execCommand('copy'); U.toast('Zkopírováno'); } catch (e) {} });
  };

  window.ES_SCREENS = { go, applyTheme, S };
})();
