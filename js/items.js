/* ============================================================
   ENGLISH STARS - items.js
   Katalog predmetu pro postavicku + vzhledy (temata) aplikace
   ------------------------------------------------------------
   1. PRAVIDLA KATALOGU (ID se nikdy nemeni ani nerecykluje!)
   2. PREDMETY (slot: head | face | body | hand | back | bg)
   3. TEMATA APLIKACE (bg predmety meni barvy cele hry)
   ============================================================ */
(function () {
  'use strict';
  /* ---------- 1. PRAVIDLA ----------
     - id je stabilni textovy klic; novy predmet = nove id; zruseny predmet se oznaci retired:true (vlastnici ho maji dal)
     - rarity: common | rare | epic | legendary
     - how: 'shop' (za coiny, price), 'drop' (jen z Dropu), 'pass' (sezonni pass, tier), 'road' (Trophy Road, trophies), 'start' (vychozi)
  ---------------------------------- */
  const ITEMS = [
    // hlava
    { id: 'head-cap-red', slot: 'head', draw: 'cap', color: '#FB7185', name: 'Kšiltovka červená', rarity: 'common', how: 'shop', price: 120 },
    { id: 'head-cap-blue', slot: 'head', draw: 'cap', color: '#38BDF8', name: 'Kšiltovka modrá', rarity: 'common', how: 'shop', price: 120 },
    { id: 'head-cap-green', slot: 'head', draw: 'cap', color: '#22C55E', name: 'Kšiltovka zelená', rarity: 'common', how: 'shop', price: 120 },
    { id: 'head-partyhat', slot: 'head', draw: 'partyhat', color: '#F472B6', name: 'Párty čepička', rarity: 'common', how: 'shop', price: 150 },
    { id: 'head-helmet', slot: 'head', draw: 'helmet', color: '#F59E0B', name: 'Helma', rarity: 'rare', how: 'shop', price: 400 },
    { id: 'head-headphones', slot: 'head', draw: 'headphones', color: '#7C5CE6', name: 'Sluchátka', rarity: 'rare', how: 'shop', price: 450 },
    { id: 'head-wizard', slot: 'head', draw: 'wizard', color: '#4C1D95', name: 'Kouzelnický klobouk', rarity: 'epic', how: 'drop' },
    { id: 'head-crown', slot: 'head', draw: 'crown', color: '#FFC53D', name: 'Koruna', rarity: 'legendary', how: 'pass', tier: 30 },
    // oblicej
    { id: 'face-glasses', slot: 'face', draw: 'glasses', color: '#38BDF8', name: 'Brýle', rarity: 'common', how: 'shop', price: 150 },
    { id: 'face-sunglasses', slot: 'face', draw: 'sunglasses', color: '#1A1F3A', name: 'Sluneční brýle', rarity: 'rare', how: 'shop', price: 300 },
    { id: 'face-mask', slot: 'face', draw: 'mask', color: '#DC2626', name: 'Hrdinská maska', rarity: 'epic', how: 'drop' },
    // telo
    { id: 'body-hoodie', slot: 'body', draw: 'hoodie', color: '#475569', name: 'Mikina', rarity: 'common', how: 'shop', price: 200 },
    { id: 'body-jersey7', slot: 'body', draw: 'jersey', color: '#22C55E', name: 'Dres č. 7', rarity: 'rare', how: 'shop', price: 400 },
    { id: 'body-medal', slot: 'body', draw: 'medal', color: '#FFC53D', name: 'Zlatá medaile', rarity: 'rare', how: 'road', trophies: 300 },
    // ruka
    { id: 'hand-flag', slot: 'hand', draw: 'flag', color: '#38BDF8', name: 'Vlajka', rarity: 'common', how: 'shop', price: 150 },
    { id: 'hand-trophy', slot: 'hand', draw: 'trophy', color: '#FFC53D', name: 'Pohár', rarity: 'rare', how: 'road', trophies: 150 },
    { id: 'hand-sword', slot: 'hand', draw: 'sword', color: '#CBD5E1', name: 'Meč', rarity: 'legendary', how: 'drop' },
    // zada
    { id: 'back-cape', slot: 'back', draw: 'cape', color: '#DC2626', name: 'Plášť', rarity: 'epic', how: 'drop' },
    { id: 'back-wings', slot: 'back', draw: 'wings', color: '#A78BFA', name: 'Křídla', rarity: 'legendary', how: 'pass', tier: 25 },
    // pozadi = vzhled cele aplikace (viz THEMES)
    { id: 'bg-arena', slot: 'bg', draw: null, color: '#163A4A', name: 'Aréna', rarity: 'common', how: 'start' },
    { id: 'bg-neon', slot: 'bg', draw: null, color: '#3A1F4A', name: 'Neon', rarity: 'common', how: 'shop', price: 300 },
    { id: 'bg-lava', slot: 'bg', draw: null, color: '#4A1F1F', name: 'Láva', rarity: 'rare', how: 'shop', price: 300 },
    { id: 'bg-ice', slot: 'bg', draw: null, color: '#1F3A4A', name: 'Led', rarity: 'rare', how: 'shop', price: 300 },
    { id: 'bg-jungle', slot: 'bg', draw: null, color: '#1F3A2A', name: 'Džungle', rarity: 'rare', how: 'shop', price: 300 },
    { id: 'bg-space', slot: 'bg', draw: null, color: '#0B1026', name: 'Vesmír', rarity: 'epic', how: 'shop', price: 600 },
  ];

  /* ---------- 3. TEMATA (CSS promenne) ---------- */
  const THEMES = {
    'bg-arena': { bg: '#121833', panel: '#1C2446', panel2: '#26305A', border: '#344178', accent: '#FFC53D', accentText: '#1A1F3A', cyan: '#38BDF8' },
    'bg-neon': { bg: '#160F2A', panel: '#231846', panel2: '#2F2160', border: '#4A3A8A', accent: '#F472B6', accentText: '#1A1F3A', cyan: '#22D3EE' },
    'bg-lava': { bg: '#1A0F0F', panel: '#2A1616', panel2: '#3A1F1F', border: '#5A2E2E', accent: '#FB923C', accentText: '#1A1F3A', cyan: '#FBBF24' },
    'bg-ice': { bg: '#0F1A26', panel: '#16283A', panel2: '#1F3A4A', border: '#2E5A6B', accent: '#67E8F9', accentText: '#0B2E3A', cyan: '#A5F3FC' },
    'bg-jungle': { bg: '#0F1A12', panel: '#16281C', panel2: '#1F3A2A', border: '#2E5A3A', accent: '#A3E635', accentText: '#0B2E17', cyan: '#4ADE80' },
    'bg-space': { bg: '#05070F', panel: '#0B1026', panel2: '#141A3A', border: '#2A3366', accent: '#C084FC', accentText: '#1A1F3A', cyan: '#60A5FA' },
  };

  const RARITY = {
    common: { name: 'běžná', color: '#AAB6DF' },
    rare: { name: 'vzácná', color: '#38BDF8' },
    epic: { name: 'epická', color: '#C9B8FF' },
    legendary: { name: 'legendární', color: '#FFC53D' },
  };

  const byId = {};
  ITEMS.forEach(it => { byId[it.id] = it; });
  window.ES_ITEMS = ITEMS;
  window.ES_ITEMS_BY_ID = byId;
  window.ES_THEMES = THEMES;
  window.ES_RARITY = RARITY;
})();
