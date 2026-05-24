/** SVG-олеги — чистая отрисовка, без белых прямоугольников */

const SKIN_PALETTE = {
  yard:   { skin: "#e8b896", hair: "#5c4033", shirt: "#4a7c59", pants: "#2d4a35", scale: 1 },
  gop:    { skin: "#ddb896", hair: "#1a1a1a", shirt: "#111122", pants: "#0a0a14", scale: 1, stripe: true },
  fat:    { skin: "#e0a880", hair: "#3d2914", shirt: "#8b3333", pants: "#4a2020", scale: 1.2, fat: true },
  it:     { skin: "#f5d0b5", hair: "#2c2c2c", shirt: "#2563eb", pants: "#1e3a5f", scale: 0.95, glasses: true },
  drunk:  { skin: "#ffccaa", hair: "#6b4423", shirt: "#6b4226", pants: "#3d2817", scale: 1.05, drunk: true },
  beach:  { skin: "#c68642", hair: "#ffd700", shirt: "#ff6b35", pants: "#00838f", scale: 1, tan: true },
  office: { skin: "#e8c4a0", hair: "#333", shirt: "#374151", pants: "#1f2937", scale: 1.08, tie: true },
  alien:  { skin: "#7cfc00", hair: "#00ff00", shirt: "#2d5016", pants: "#1a3009", scale: 1.1, alien: true },
  elite:  { skin: "#d4a574", hair: "#222", shirt: "#444", pants: "#333", scale: 1.15, muscle: true },
  mini:   { skin: "#f0c8a0", hair: "#8b4513", shirt: "#996633", pants: "#664422", scale: 0.68 },
  boss:   { skin: "#c9956c", hair: "#1a0a0a", shirt: "#1a0505", pants: "#0d0202", scale: 1.45, crown: true },
  hell:   { skin: "#cc4444", hair: "#330000", shirt: "#660000", pants: "#330000", scale: 1.35, horns: true },
};

function defs(id) {
  return `
  <defs>
    <linearGradient id="assGrad-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff9a76"/>
      <stop offset="45%" stop-color="#e8531e"/>
      <stop offset="100%" stop-color="#a83212"/>
    </linearGradient>
    <linearGradient id="skinGrad-${id}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="var(--sk-top)"/>
      <stop offset="100%" stop-color="var(--sk-bot)"/>
    </linearGradient>
    <filter id="shadow-${id}">
      <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.45"/>
    </filter>
  </defs>`;
}

function extras(p, id) {
  let s = "";
  if (p.stripe) s += `<line x1="88" y1="108" x2="88" y2="148" stroke="#fff" stroke-width="3" opacity=".5"/>
    <line x1="98" y1="108" x2="98" y2="148" stroke="#fff" stroke-width="3" opacity=".5"/>`;
  if (p.glasses) s += `<rect x="78" y="52" width="18" height="10" rx="2" fill="none" stroke="#111" stroke-width="2"/>
    <rect x="104" y="52" width="18" height="10" rx="2" fill="none" stroke="#111" stroke-width="2"/>
    <line x1="96" y1="57" x2="104" y2="57" stroke="#111" stroke-width="2"/>`;
  if (p.tie) s += `<polygon points="100,108 94,145 100,155 106,145" fill="#cc0000"/>`;
  if (p.crown) s += `<polygon points="100,18 85,38 90,28 100,32 110,28 115,38" fill="#ffd700" stroke="#b8860b" stroke-width="1.5"/>`;
  if (p.horns) s += `<path d="M82 32 L75 10 L90 28 Z M118 32 L125 10 L110 28 Z" fill="#cc0000" stroke="#880000"/>`;
  if (p.alien) s += `<line x1="100" y1="22" x2="100" y2="8" stroke="#0f0" stroke-width="2"/>
    <circle cx="100" cy="6" r="4" fill="#0f0"/>`;
  if (p.drunk) s += `<ellipse cx="130" cy="95" rx="8" ry="12" fill="#8B4513" stroke="#000" stroke-width="1"/>
    <rect x="126" y="82" width="8" height="6" fill="#ccc"/>`;
  if (p.tan) s += `<ellipse cx="100" cy="58" rx="28" ry="8" fill="none" stroke="#ff6b35" stroke-width="2" opacity=".6"/>`;
  if (p.muscle) s += `<ellipse cx="72" cy="120" rx="12" ry="18" fill="${p.shirt}"/><ellipse cx="128" cy="120" rx="12" ry="18" fill="${p.shirt}"/>`;
  if (p.fat) s += `<ellipse cx="100" cy="130" rx="38" ry="22" fill="${p.shirt}" opacity=".3"/>`;
  return s;
}

export function buildOlegSvg(skinId) {
  const p = SKIN_PALETTE[skinId] || SKIN_PALETTE.yard;
  const id = skinId.replace(/\W/g, "");
  const assRx = p.fat ? 52 : (p.scale < 0.8 ? 28 : 42);
  const assRy = p.fat ? 38 : (p.scale < 0.8 ? 22 : 32);
  const assY = p.fat ? 195 : 188;
  const headR = p.fat ? 30 : (p.scale < 0.8 ? 22 : 26);

  return `
<svg class="oleg-svg" viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg"
     style="--sk-top:${p.skin};--sk-bot:${shade(p.skin,-20)};--scale:${p.scale}">
  ${defs(id)}
  <g class="oleg-body" filter="url(#shadow-${id})" transform="translate(100,${130}) scale(${p.scale}) translate(-100,-130)">
    <!-- ноги -->
    <rect x="82" y="168" width="14" height="45" rx="5" fill="${p.pants}" stroke="#000" stroke-width="2"/>
    <rect x="104" y="168" width="14" height="45" rx="5" fill="${p.pants}" stroke="#000" stroke-width="2"/>
    <!-- торс -->
    <rect x="72" y="108" width="56" height="62" rx="8" fill="${p.shirt}" stroke="#000" stroke-width="2.5"/>
    <!-- руки -->
    <rect x="58" y="112" width="14" height="40" rx="6" fill="${p.skin}" stroke="#000" stroke-width="2"/>
    <rect x="128" y="112" width="14" height="40" rx="6" fill="${p.skin}" stroke="#000" stroke-width="2"/>
    <!-- голова -->
    <circle cx="100" cy="72" r="${headR}" fill="url(#skinGrad-${id})" stroke="#000" stroke-width="2.5"/>
  <circle cx="88" cy="68" r="4" fill="#111"/>
    <circle cx="112" cy="68" r="4" fill="#111"/>
    <path d="M88 82 Q100 90 112 82" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round"/>
    <!-- волосы -->
    <ellipse cx="100" cy="52" rx="${headR - 2}" ry="12" fill="${p.hair}"/>
    <!-- ЖОПА — главная цель -->
    <g class="ass-group" id="hit-ass">
      <ellipse cx="100" cy="${assY}" rx="${assRx}" ry="${assRy}" fill="url(#assGrad-${id})" stroke="#000" stroke-width="2.5"/>
      <ellipse cx="100" cy="${assY - 4}" rx="${assRx * 0.55}" ry="${assRy * 0.35}" fill="rgba(255,255,255,0.12)"/>
    </g>
    <!-- удар-ripple -->
    <circle class="hit-ripple" cx="100" cy="${assY}" r="20" fill="none" stroke="#ff4444" stroke-width="3" opacity="0"/>
    ${extras(p, id)}
  </g>
</svg>`;
}

function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + pct));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + pct));
  const b = Math.max(0, Math.min(255, (n & 0xff) + pct));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function playHitAnim(container, crit) {
  const svg = container.querySelector(".oleg-svg");
  if (!svg) return;
  svg.classList.remove("hit", "crit-hit");
  void svg.offsetWidth;
  svg.classList.add(crit ? "crit-hit" : "hit");
  const ripple = svg.querySelector(".hit-ripple");
  if (ripple) {
    ripple.style.animation = "none";
    void ripple.offsetWidth;
    ripple.style.animation = crit ? "rippleCrit .35s ease-out" : "rippleHit .3s ease-out";
  }
}
