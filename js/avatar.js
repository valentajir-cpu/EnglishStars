/* ============================================================
   ENGLISH STARS - avatar.js
   Postavy (SVG) + predmety (vrstvy) + vykresleni avatara
   ------------------------------------------------------------
   1. POSTAVY (4 zakladni postavy, barevne varianty, kotvy slotu)
   2. KRESLENI PREDMETU (podle slotu a kotev postavy)
   3. VYKRESLENI AVATARA (postava + nasazene predmety)
   ============================================================ */
(function () {
  'use strict';
  const OUT = '#1A1F3A'; // obrys

  /* ---------- 1. POSTAVY ---------- */
  // Kazda postava: name, colors (varianty skinu), anchors (kotvy pro predmety), draw(colorIndex) -> SVG retezec
  const CHARACTERS = {
    kluk: {
      name: 'Kluk',
      tagline: 'Klasika. Sedne mu každá čepice i dres.',
      colors: ['#38BDF8', '#22C55E', '#F472B6'],
      colorNames: ['modré tričko', 'zelené tričko', 'růžové tričko'],
      anchors: { headCx: 100, headTop: 30, headW: 84, eyesY: 78, chestX: 100, chestY: 150, handL: [52, 188], handR: [148, 188], shoulderY: 118 },
      draw(ci) {
        const shirt = this.colors[ci] || this.colors[0];
        return `
<rect x="72" y="176" width="24" height="52" rx="10" fill="#2B4C9B"/>
<rect x="104" y="176" width="24" height="52" rx="10" fill="#2B4C9B"/>
<rect x="62" y="220" width="40" height="18" rx="9" fill="${OUT}"/>
<rect x="98" y="220" width="40" height="18" rx="9" fill="${OUT}"/>
<rect x="40" y="122" width="26" height="32" rx="12" fill="${shirt}"/>
<rect x="134" y="122" width="26" height="32" rx="12" fill="${shirt}"/>
<rect x="42" y="150" width="20" height="38" rx="10" fill="#F5C9A6"/>
<rect x="138" y="150" width="20" height="38" rx="10" fill="#F5C9A6"/>
<rect x="58" y="116" width="84" height="72" rx="18" fill="${shirt}"/>
<polygon points="100,136 104,146 115,146 106,152 109,163 100,156 91,163 94,152 85,146 96,146" fill="#FFFFFF" stroke="none"/>
<rect x="90" y="100" width="20" height="22" fill="#F5C9A6" stroke="none"/>
<circle cx="100" cy="72" r="42" fill="#F5C9A6"/>
<path d="M58 70 A42 42 0 0 1 142 70 L142 62 Q120 50 104 60 Q92 48 78 58 Q66 60 58 70 Z" fill="#6B3E26"/>
<circle cx="86" cy="78" r="4.5" fill="${OUT}" stroke="none"/>
<circle cx="114" cy="78" r="4.5" fill="${OUT}" stroke="none"/>
<circle cx="76" cy="90" r="5" fill="#F4A6A6" stroke="none"/>
<circle cx="124" cy="90" r="5" fill="#F4A6A6" stroke="none"/>
<path d="M88 94 Q100 104 112 94" stroke-width="4"/>`;
      }
    },
    dracek: {
      name: 'Dráček',
      tagline: 'Při správné odpovědi chrlí oheň.',
      colors: ['#4ADE80', '#60A5FA', '#F87171'],
      colorNames: ['zelený', 'modrý', 'červený'],
      anchors: { headCx: 100, headTop: 46, headW: 92, eyesY: 85, chestX: 100, chestY: 182, handL: [54, 172], handR: [146, 172], shoulderY: 130 },
      draw(ci) {
        const c = this.colors[ci] || this.colors[0];
        const light = { '#4ADE80': '#86EFAC', '#60A5FA': '#BFDBFE', '#F87171': '#FECACA' }[c] || '#86EFAC';
        const belly = { '#4ADE80': '#D9F99D', '#60A5FA': '#E0F2FE', '#F87171': '#FEF3C7' }[c] || '#D9F99D';
        return `
<path d="M64 128 Q18 96 28 152 Q46 138 66 150 Z" fill="${light}"/>
<path d="M136 128 Q182 96 172 152 Q154 138 134 150 Z" fill="${light}"/>
<path d="M122 214 C152 226 178 210 166 178 C170 200 150 208 126 198 Z" fill="${c}"/>
<ellipse cx="78" cy="228" rx="20" ry="11" fill="${c}"/>
<ellipse cx="122" cy="228" rx="20" ry="11" fill="${c}"/>
<ellipse cx="100" cy="176" rx="50" ry="56" fill="${c}"/>
<ellipse cx="100" cy="186" rx="30" ry="38" fill="${belly}"/>
<ellipse cx="54" cy="172" rx="12" ry="17" fill="${c}"/>
<ellipse cx="146" cy="172" rx="12" ry="17" fill="${c}"/>
<polygon points="70,60 78,28 92,56" fill="#FDE68A"/>
<polygon points="108,56 122,28 130,60" fill="#FDE68A"/>
<circle cx="100" cy="92" r="46" fill="${c}"/>
<ellipse cx="100" cy="110" rx="24" ry="14" fill="${light}"/>
<circle cx="92" cy="108" r="3" fill="${OUT}" stroke="none"/>
<circle cx="108" cy="108" r="3" fill="${OUT}" stroke="none"/>
<circle cx="83" cy="84" r="10" fill="#FFFFFF"/>
<circle cx="117" cy="84" r="10" fill="#FFFFFF"/>
<circle cx="85" cy="85" r="4.5" fill="${OUT}" stroke="none"/>
<circle cx="115" cy="85" r="4.5" fill="${OUT}" stroke="none"/>`;
      }
    },
    robot: {
      name: 'Robot',
      tagline: 'Svítí a pípá. Miluje nové součástky.',
      colors: ['#94A3B8', '#FBBF24', '#A78BFA'],
      colorNames: ['stříbrný', 'zlatý', 'fialový'],
      anchors: { headCx: 100, headTop: 46, headW: 88, eyesY: 75, chestX: 100, chestY: 155, handL: [39, 188], handR: [161, 188], shoulderY: 124 },
      draw(ci) {
        const c = this.colors[ci] || this.colors[0];
        const body = { '#94A3B8': '#CBD5E1', '#FBBF24': '#FDE68A', '#A78BFA': '#DDD6FE' }[c] || '#CBD5E1';
        const dark = { '#94A3B8': '#64748B', '#FBBF24': '#D97706', '#A78BFA': '#7C3AED' }[c] || '#64748B';
        return `
<line x1="100" y1="30" x2="100" y2="46"/>
<circle cx="100" cy="24" r="8" fill="#FB7185"/>
<rect x="44" y="68" width="12" height="22" rx="4" fill="${dark}"/>
<rect x="144" y="68" width="12" height="22" rx="4" fill="${dark}"/>
<rect x="56" y="46" width="88" height="70" rx="16" fill="${c}"/>
<rect x="66" y="58" width="68" height="34" rx="10" fill="${OUT}"/>
<rect x="76" y="68" width="18" height="14" rx="5" fill="#38BDF8" stroke="none"/>
<rect x="106" y="68" width="18" height="14" rx="5" fill="#38BDF8" stroke="none"/>
<rect x="84" y="100" width="32" height="7" rx="3.5" fill="#475569"/>
<rect x="88" y="114" width="24" height="12" fill="${dark}"/>
<rect x="28" y="128" width="22" height="56" rx="10" fill="${c}"/>
<rect x="150" y="128" width="22" height="56" rx="10" fill="${c}"/>
<circle cx="39" cy="188" r="11" fill="${dark}"/>
<circle cx="161" cy="188" r="11" fill="${dark}"/>
<rect x="52" y="122" width="96" height="78" rx="14" fill="${body}"/>
<rect x="72" y="136" width="56" height="38" rx="8" fill="${OUT}"/>
<circle cx="88" cy="155" r="7" fill="#FFC53D" stroke="none"/>
<rect x="102" y="146" width="16" height="5" rx="2.5" fill="#38BDF8" stroke="none"/>
<rect x="102" y="157" width="16" height="5" rx="2.5" fill="#FB7185" stroke="none"/>
<rect x="68" y="198" width="24" height="30" rx="8" fill="${c}"/>
<rect x="108" y="198" width="24" height="30" rx="8" fill="${c}"/>
<rect x="58" y="224" width="40" height="16" rx="8" fill="#475569"/>
<rect x="102" y="224" width="40" height="16" rx="8" fill="#475569"/>`;
      }
    },
    sportovec: {
      name: 'Sportovec',
      tagline: 'Běžec. Čím víc trofejí, tím rychlejší.',
      colors: ['#FFC53D', '#38BDF8', '#F87171'],
      colorNames: ['žlutý dres', 'modrý dres', 'červený dres'],
      anchors: { headCx: 100, headTop: 32, headW: 80, eyesY: 80, chestX: 100, chestY: 148, handL: [51, 178], handR: [149, 178], shoulderY: 116 },
      draw(ci) {
        const c = this.colors[ci] || this.colors[0];
        return `
<path d="M18 150h16M12 166h24M18 182h16" stroke="#AAB6DF" stroke-width="4"/>
<rect x="72" y="194" width="22" height="32" rx="10" fill="#F5C9A6"/>
<rect x="106" y="194" width="22" height="32" rx="10" fill="#F5C9A6"/>
<rect x="60" y="220" width="42" height="18" rx="9" fill="#FB7185"/>
<rect x="98" y="220" width="42" height="18" rx="9" fill="#FB7185"/>
<rect x="68" y="228" width="26" height="4" rx="2" fill="#FFFFFF" stroke="none"/>
<rect x="106" y="228" width="26" height="4" rx="2" fill="#FFFFFF" stroke="none"/>
<rect x="66" y="170" width="68" height="32" rx="10" fill="${OUT}"/>
<rect x="40" y="118" width="22" height="60" rx="11" fill="#F5C9A6"/>
<rect x="138" y="118" width="22" height="60" rx="11" fill="#F5C9A6"/>
<rect x="62" y="114" width="76" height="68" rx="16" fill="${c}"/>
<rect x="97" y="134" width="9" height="32" fill="${OUT}" stroke="none"/>
<polygon points="88,146 106,134 106,143 92,153" fill="${OUT}" stroke="none"/>
<rect x="90" y="100" width="20" height="20" fill="#F5C9A6" stroke="none"/>
<circle cx="100" cy="72" r="40" fill="#F5C9A6"/>
<path d="M60 70 A40 40 0 0 1 140 70 L140 62 Q118 46 100 54 Q82 44 60 64 Z" fill="#E8B04B"/>
<rect x="58" y="58" width="84" height="13" rx="6.5" fill="#FB7185"/>
<circle cx="86" cy="80" r="4.5" fill="${OUT}" stroke="none"/>
<circle cx="114" cy="80" r="4.5" fill="${OUT}" stroke="none"/>
<circle cx="76" cy="92" r="5" fill="#F4A6A6" stroke="none"/>
<circle cx="124" cy="92" r="5" fill="#F4A6A6" stroke="none"/>
<path d="M88 96 Q100 106 112 96" stroke-width="4"/>`;
      }
    }
  };

  /* ---------- 2. KRESLENI PREDMETU ---------- */
  // Kazdy kreslic dostane kotvy postavy (a) a barvu predmetu; vraci SVG retezec.
  function darker(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (n >> 16) - 50), g = Math.max(0, ((n >> 8) & 255) - 50), b = Math.max(0, (n & 255) - 50);
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }
  const DRAW = {
    cap(a, color) {
      const hw = a.headW / 2 + 2, cx = a.headCx, top = a.headTop;
      return `<path d="M${cx - hw} ${top + 18} A ${hw} ${hw * 0.62} 0 0 1 ${cx + hw} ${top + 18} L ${cx + hw} ${top + 24} H ${cx - hw} Z" fill="${color}"/>
<rect x="${cx - hw - 4}" y="${top + 19}" width="${2 * hw + 42}" height="9" rx="4.5" fill="${darker(color)}"/>
<circle cx="${cx}" cy="${top + 18 - hw * 0.62}" r="4" fill="${OUT}"/>`;
    },
    helmet(a, color) {
      const hw = a.headW / 2 + 5, cx = a.headCx, top = a.headTop;
      return `<path d="M${cx - hw} ${a.eyesY - 14} A ${hw} ${hw * 0.9} 0 0 1 ${cx + hw} ${a.eyesY - 14} L ${cx + hw} ${a.eyesY - 8} H ${cx - hw} Z" fill="${color}"/>
<rect x="${cx - 6}" y="${top - 6}" width="12" height="${a.eyesY - 8 - top}" rx="4" fill="#FFFFFF" stroke="none"/>`;
    },
    crown(a, color) {
      const w = a.headW * 0.8, cx = a.headCx, base = a.headTop + 14, h = 34;
      const l = cx - w / 2, r = cx + w / 2;
      return `<polygon points="${l},${base} ${l},${base - h * 0.7} ${l + w * 0.25},${base - h * 0.35} ${cx},${base - h} ${r - w * 0.25},${base - h * 0.35} ${r},${base - h * 0.7} ${r},${base}" fill="${color}"/>
<circle cx="${l + w * 0.25}" cy="${base - 10}" r="3.5" fill="#FB7185" stroke="none"/><circle cx="${cx}" cy="${base - 12}" r="3.5" fill="#38BDF8" stroke="none"/><circle cx="${r - w * 0.25}" cy="${base - 10}" r="3.5" fill="#22C55E" stroke="none"/>`;
    },
    headphones(a, color) {
      const hw = a.headW / 2 + 4, cx = a.headCx, top = a.headTop;
      return `<path d="M${cx - hw} ${a.eyesY} V ${a.eyesY - 10} A ${hw} ${hw} 0 0 1 ${cx + hw} ${a.eyesY - 10} V ${a.eyesY}" fill="none" stroke-width="7"/>
<rect x="${cx - hw - 8}" y="${a.eyesY - 12}" width="14" height="26" rx="5" fill="${color}"/>
<rect x="${cx + hw - 6}" y="${a.eyesY - 12}" width="14" height="26" rx="5" fill="${color}"/>`;
    },
    partyhat(a, color) {
      const cx = a.headCx, top = a.headTop;
      return `<polygon points="${cx - 20},${top + 14} ${cx + 20},${top + 14} ${cx},${top - 34}" fill="${color}"/>
<circle cx="${cx}" cy="${top - 34}" r="6" fill="#FFFFFF"/>
<circle cx="${cx - 6}" cy="${top}" r="2.5" fill="#FFFFFF" stroke="none"/><circle cx="${cx + 7}" cy="${top - 10}" r="2.5" fill="#FFFFFF" stroke="none"/>`;
    },
    wizard(a, color) {
      const cx = a.headCx, top = a.headTop, hw = a.headW / 2 + 10;
      return `<ellipse cx="${cx}" cy="${top + 14}" rx="${hw}" ry="9" fill="${darker(color)}"/>
<polygon points="${cx - 26},${top + 14} ${cx + 26},${top + 14} ${cx + 6},${top - 46}" fill="${color}"/>
<polygon points="${cx - 4},${top - 14} ${cx + 2},${top - 4} ${cx + 10},${top - 12} ${cx + 4},${top - 16} ${cx + 2},${top - 24} ${cx - 2},${top - 16}" fill="#FFC53D" stroke="none"/>`;
    },
    glasses(a, color) {
      const r = a.headW * 0.17, cx = a.headCx, dx = a.headW * 0.2, y = a.eyesY, hw = a.headW / 2;
      return `<circle cx="${cx - dx}" cy="${y}" r="${r}" fill="${color}" fill-opacity="0.25" stroke-width="4"/>
<circle cx="${cx + dx}" cy="${y}" r="${r}" fill="${color}" fill-opacity="0.25" stroke-width="4"/>
<path d="M${cx - dx + r} ${y} H ${cx + dx - r} M${cx - dx - r} ${y - 2} H ${cx - hw - 2} M${cx + dx + r} ${y - 2} H ${cx + hw + 2}" stroke-width="4"/>`;
    },
    sunglasses(a, color) {
      const r = a.headW * 0.18, cx = a.headCx, dx = a.headW * 0.2, y = a.eyesY, hw = a.headW / 2;
      return `<circle cx="${cx - dx}" cy="${y}" r="${r}" fill="${color}" stroke-width="4"/>
<circle cx="${cx + dx}" cy="${y}" r="${r}" fill="${color}" stroke-width="4"/>
<path d="M${cx - dx + r} ${y} H ${cx + dx - r} M${cx - dx - r} ${y - 2} H ${cx - hw - 2} M${cx + dx + r} ${y - 2} H ${cx + hw + 2}" stroke-width="4"/>
<path d="M${cx - dx - 6} ${y - 6} q 4 -4 8 -2" stroke="#FFFFFF" stroke-width="2.5"/>`;
    },
    mask(a, color) {
      const cx = a.headCx, hw = a.headW * 0.58, y = a.eyesY;
      return `<rect x="${cx - hw}" y="${y - 13}" width="${2 * hw}" height="26" rx="12" fill="${color}"/>
<ellipse cx="${cx - a.headW * 0.2}" cy="${y}" rx="9" ry="6" fill="#FFFFFF"/><ellipse cx="${cx + a.headW * 0.2}" cy="${y}" rx="9" ry="6" fill="#FFFFFF"/>`;
    },
    jersey(a, color) {
      const cx = a.chestX, y = a.chestY;
      return `<rect x="${cx - 30}" y="${y - 24}" width="60" height="46" rx="12" fill="${color}"/>
<text x="${cx}" y="${y + 12}" text-anchor="middle" font-family="Lilita One, Arial Black, sans-serif" font-size="30" fill="#FFFFFF" stroke="${OUT}" stroke-width="1.5">7</text>`;
    },
    hoodie(a, color) {
      const cx = a.chestX, y = a.chestY;
      return `<rect x="${cx - 34}" y="${y - 30}" width="68" height="58" rx="14" fill="${color}"/>
<path d="M${cx - 10} ${y - 30} v 14 M${cx + 10} ${y - 30} v 14" stroke="#FFFFFF" stroke-width="3"/>
<rect x="${cx - 18}" y="${y + 6}" width="36" height="14" rx="6" fill="${darker(color)}"/>`;
    },
    medal(a, color) {
      const cx = a.chestX, y = a.chestY - 2;
      return `<polygon points="${cx - 7},${y - 26} ${cx + 7},${y - 26} ${cx + 3},${y - 8} ${cx - 3},${y - 8}" fill="#FB7185"/>
<circle cx="${cx}" cy="${y}" r="11" fill="${color}"/><polygon points="${cx},${y - 6} ${cx + 2},${y - 2} ${cx + 6},${y - 2} ${cx + 3},${y + 1} ${cx + 4},${y + 6} ${cx},${y + 3} ${cx - 4},${y + 6} ${cx - 3},${y + 1} ${cx - 6},${y - 2} ${cx - 2},${y - 2}" fill="#FFFFFF" stroke="none"/>`;
    },
    cape(a, color) { // vrstva 'back' - kresli se pred postavou
      const cx = a.chestX, y = a.shoulderY;
      return `<path d="M${cx - 44} ${y} Q ${cx - 60} ${y + 60} ${cx - 50} ${y + 112} L ${cx + 50} ${y + 112} Q ${cx + 60} ${y + 60} ${cx + 44} ${y} Z" fill="${color}"/>`;
    },
    trophy(a, color) {
      const [x, y] = a.handR;
      return `<g transform="translate(${x - 12} ${y - 34})"><path d="M4 2h16v8a8 8 0 0 1-16 0z" fill="${color}"/><path d="M4 4H0v3a4 4 0 0 0 4 4M20 4h4v3a4 4 0 0 1-4 4" fill="none" stroke-width="3"/><rect x="9" y="17" width="6" height="8" fill="${color}"/><rect x="4" y="25" width="16" height="6" rx="2" fill="${darker(color)}"/></g>`;
    },
    flag(a, color) {
      const [x, y] = a.handL;
      return `<line x1="${x}" y1="${y + 6}" x2="${x}" y2="${y - 56}" stroke-width="4"/><polygon points="${x},${y - 56} ${x + 36},${y - 46} ${x},${y - 36}" fill="${color}"/>`;
    },
    sword(a, color) {
      const [x, y] = a.handR;
      return `<g transform="translate(${x} ${y}) rotate(-30)"><rect x="-4" y="-70" width="8" height="60" rx="2" fill="${color}"/><rect x="-14" y="-12" width="28" height="6" rx="3" fill="#FFC53D"/><rect x="-4" y="-6" width="8" height="14" rx="3" fill="#7C3AED"/></g>`;
    },
    wings(a, color) {
      const cx = a.chestX, y = a.shoulderY + 6;
      return `<path d="M${cx - 40} ${y + 10} Q ${cx - 110} ${y - 40} ${cx - 92} ${y + 50} Q ${cx - 70} ${y + 30} ${cx - 44} ${y + 46} Z" fill="${color}"/>
<path d="M${cx + 40} ${y + 10} Q ${cx + 110} ${y - 40} ${cx + 92} ${y + 50} Q ${cx + 70} ${y + 30} ${cx + 44} ${y + 46} Z" fill="${color}"/>`;
    }
  };

  /* ---------- 3. VYKRESLENI AVATARA ---------- */
  // charId: 'kluk'|'dracek'|'robot'|'sportovec'; look: {color:0..2, items:{head,face,body,hand,back}} (id predmetu nebo null)
  // items catalog je v items.js (window.ES_ITEMS); predmety se kresli podle item.draw a item.color
  function renderAvatar(charId, look, opts) {
    opts = opts || {};
    const ch = CHARACTERS[charId] || CHARACTERS.sportovec;
    const a = ch.anchors;
    const items = (look && look.items) || {};
    const byId = (window.ES_ITEMS_BY_ID || {});
    const layer = (slot) => {
      const id = items[slot]; if (!id) return '';
      const it = byId[id]; if (!it || !DRAW[it.draw]) return '';
      return DRAW[it.draw](a, it.color);
    };
    const size = opts.size || 200;
    const bgId = items.bg; const bg = bgId && byId[bgId];
    const bgRect = (opts.showBg && bg) ? `<rect x="0" y="0" width="200" height="250" rx="24" fill="${bg.color}"/>` : '';
    const shadow = opts.shadow === false ? '' : `<ellipse cx="100" cy="246" rx="52" ry="7" fill="#000" fill-opacity="0.25" stroke="none"/>`;
    return `<svg viewBox="0 0 200 250" width="${size}" height="${size * 1.25}" fill="none" stroke="${OUT}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="${ch.name}">
${bgRect}${shadow}${layer('back')}${ch.draw((look && look.color) || 0)}${layer('body')}${layer('face')}${layer('head')}${layer('hand')}
</svg>`;
  }

  window.ES_AVATAR = { CHARACTERS, DRAW, renderAvatar };
})();
