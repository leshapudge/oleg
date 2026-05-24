export const SAVE_KEY = "oleg_simulator_save_v3";

export const ZONES = [
  { id: "yard", name: "Двор", hp: 1, coins: 1, unlock: 1 },
  { id: "pod", name: "Подъезд", hp: 1.35, coins: 1.12, unlock: 3 },
  { id: "beach", name: "Пляж", hp: 1.8, coins: 1.25, unlock: 6 },
  { id: "office", name: "Офис", hp: 2.4, coins: 1.4, unlock: 10 },
  { id: "banya", name: "Баня", hp: 3.2, coins: 1.6, unlock: 15 },
  { id: "space", name: "Космос", hp: 4.5, coins: 1.9, unlock: 22 },
  { id: "hell", name: "Ад Олега", hp: 7, coins: 2.5, unlock: 30 },
];

export const ENEMY_TYPES = {
  normal: { tag: "ОБЫЧНЫЙ", hp: 1, coins: 1, xp: 1 },
  elite: { tag: "ЭЛИТА", hp: 2.8, coins: 2.2, xp: 1.6 },
  mini: { tag: "МИНИ-БОСС", hp: 5, coins: 3.5, xp: 2.2 },
  boss: { tag: "БОСС", hp: 12, coins: 6, xp: 4 },
};

export const ELEMENTS = {
  none: { name: "—", color: "#888", weak: null },
  fire: { name: "Огонь", color: "#ff6", weak: "ice" },
  ice: { name: "Лёд", color: "#3cf", weak: "fire" },
  shock: { name: "Шок", color: "#f4f", weak: "fire" },
};

export const MUTATORS = [
  { id: "fast_regen", name: "Реген", desc: "Олег быстро лечится" },
  { id: "armored", name: "Броня", desc: "+50% HP, есть щит" },
  { id: "greedy", name: "Жадный", desc: "x2 монеты, +30% HP" },
  { id: "furious", name: "Ярость", desc: "Олег контратакует чаще" },
  { id: "lucky", name: "Удача", desc: "x2 шанс лута" },
  { id: "thin", name: "Хрупкий", desc: "-30% HP, x2 XP" },
];

export const WEAPONS = [
  { id: "base", name: "Базовый", icon: "⚔", desc: "+урон за клик", base: 12, mult: 1.14, fx: (l) => l * 3 + 2 },
  { id: "weight", name: "Утяжелитель", icon: "⬛", desc: "+% ко всему урону", base: 45, mult: 1.16, fx: (l) => 1 + l * 0.06 },
  { id: "speed", name: "Темп", icon: "💨", desc: "окно комбо +% ", base: 70, mult: 1.18, fx: (l) => 1800 + l * 350 },
  { id: "crit", name: "Прицел", icon: "◎", desc: "шанс крита", base: 100, mult: 1.2, fx: (l) => 0.04 + l * 0.018, max: 45 },
  { id: "critd", name: "Разнос", icon: "✦", desc: "множ. крита", base: 180, mult: 1.22, fx: (l) => 2 + l * 0.3 },
  { id: "chain", name: "Цепь", icon: "⛓", desc: "шанс двойного удара", base: 400, mult: 1.28, fx: (l) => l * 0.025, max: 30 },
  { id: "pierce", name: "Пробой", icon: "▶", desc: "игнор % щита", base: 600, mult: 1.3, fx: (l) => l * 0.05, max: 20 },
];

export const CREW = [
  { id: "bro", name: "Братан", icon: "🧔", desc: "слабый DPS", base: 20, mult: 1.11, dps: (l) => l * 0.8 },
  { id: "gop", name: "Гопник", icon: "🧢", desc: "средний DPS", base: 120, mult: 1.13, dps: (l) => l * 3.5 },
  { id: "it", name: "Айтишник", icon: "💻", desc: "DPS + снижает жар", base: 600, mult: 1.15, dps: (l) => l * 14, heatRed: (l) => l * 0.02 },
  { id: "babka", name: "Бабка", icon: "👵", desc: "DPS + монеты", base: 3500, mult: 1.17, dps: (l) => l * 55, coin: (l) => 1 + l * 0.025 },
  { id: "ufo", name: "НЛО", icon: "🛸", desc: "космический DPS", base: 25000, mult: 1.2, dps: (l) => l * 280 },
];

export const ELEMENT_UPGRADES = [
  { id: "fire", name: "Огонь", icon: "🔥", desc: "урон огнём", base: 200, mult: 1.25, fx: (l) => 1 + l * 0.12, max: 25 },
  { id: "ice", name: "Лёд", icon: "❄", desc: "замедляет регen", base: 200, mult: 1.25, fx: (l) => l * 0.04, max: 25 },
  { id: "shock", name: "Шок", icon: "⚡", desc: "шанс стана", base: 200, mult: 1.25, fx: (l) => l * 0.02, max: 20 },
  { id: "sync", name: "Синергия", icon: "☯", desc: "бонус vs слабость", base: 800, mult: 1.4, fx: (l) => 1 + l * 0.15, max: 15 },
];

export const RELICS = [
  { id: "ring", name: "Кольцо", icon: "💍", desc: "x урон", base: 800, mult: 2.1, fx: (l) => 1 + l * 0.11, max: 20 },
  { id: "boots", name: "Ботинки", icon: "👢", desc: "x DPS", base: 2000, mult: 2.3, fx: (l) => 1 + l * 0.09, max: 15 },
  { id: "bag", name: "Мешок", icon: "💰", desc: "x монеты", base: 4000, mult: 2.5, fx: (l) => 1 + l * 0.13, max: 15 },
  { id: "brain", name: "Мозг", icon: "🧠", desc: "x XP + essence", base: 8000, mult: 2.8, fx: (l) => 1 + l * 0.1, max: 12 },
];

export const RESEARCH = [
  { id: "r_dmg", name: "Баллистика", icon: "📐", desc: "+3% урон/ур", base: 5, costEss: (l) => 3 + l * 2, fx: (l) => 1 + l * 0.03 },
  { id: "r_rage", name: "Берсерк", icon: "🩸", desc: "ярость +5%/ур", base: 8, costEss: (l) => 4 + l * 2, fx: (l) => 1 + l * 0.05 },
  { id: "r_loot", name: "Мародёр", icon: "🎒", desc: "+лут", base: 10, costEss: (l) => 5 + l * 3, fx: (l) => 1 + l * 0.08 },
  { id: "r_heat", name: "Охлаждение", icon: "🧊", desc: "-жар", base: 12, costEss: (l) => 6 + l * 3, fx: (l) => 1 - l * 0.04 },
  { id: "r_over", name: "Турбо", icon: "🚀", desc: "овerdrive быстрее", base: 15, costEss: (l) => 8 + l * 4, fx: (l) => 1 + l * 0.1 },
];

export const SKILLS = [
  { id: "slap", name: "Шлёпок", icon: "👋", cd: 12, dur: 6, desc: "x8 урон" },
  { id: "frenzy", name: "Шквал", icon: "🌪", cd: 25, dur: 7, desc: "авто-клики" },
  { id: "gold", name: "Дождь ₽", icon: "🪙", cd: 40, dur: 10, desc: "x4 монеты" },
  { id: "freeze", name: "Стуз", icon: "🧊", cd: 50, dur: 10, desc: "стоп регen" },
  { id: "nuke", name: "Ядерный", icon: "☢", cd: 90, dur: 0, desc: "30% HP босса" },
  { id: "rage", name: "Берсерк", icon: "🔥", cd: 35, dur: 8, desc: "100% ярость" },
];

export const ARTIFACTS = [
  { id: "a1", name: "Камень силы", icon: "🪨", rarity: "common", dmg: 1.05 },
  { id: "a2", name: "Перстень", icon: "💎", rarity: "rare", dmg: 1.12, crit: 0.03 },
  { id: "a3", name: "Череп", icon: "💀", rarity: "epic", dmg: 1.2, coin: 1.15 },
  { id: "a4", name: "Радужный хвост", icon: "🌈", rarity: "legend", dmg: 1.35, all: 1.1 },
];

export const CONSUMABLES = {
  bomb: { name: "Бомба", icon: "💣", desc: "15% HP", effect: "bomb" },
  oil: { name: "Масло", icon: "🛢", desc: "x2 урон 8с", effect: "oil" },
  coin: { name: "Магнит", icon: "🧲", desc: "x3 монеты 10с", effect: "magnet" },
  heal: { name: "Сброс жара", icon: "❄", desc: "жар = 0", effect: "cool" },
};

export const CHALLENGES = [
  { id: "c_combo", text: "Комбо 30+", check: (g) => g.combo >= 30, reward: 50 },
  { id: "c_parry", text: "Сделай парри", check: (g) => g.state.parryDone, reward: 80 },
  { id: "c_weak", text: "Попади в x3", check: (g) => g.state.weakHits >= 3, reward: 60 },
  { id: "c_boss", text: "Фаза 2 босса", check: (g) => g.state.bossPhase >= 2, reward: 120 },
];

export const TALENTS = [
  { id: "t1", name: "+12% урон", cost: 1, fx: "dmg", v: 0.12 },
  { id: "t2", name: "+15% ₽", cost: 1, fx: "coin", v: 0.15 },
  { id: "t3", name: "Старт 800₽", cost: 2, fx: "start", v: 800 },
  { id: "t4", name: "+комбо", cost: 2, fx: "combo", v: 400 },
  { id: "t5", name: "+престиж", cost: 3, fx: "prestige", v: 0.25 },
  { id: "t6", name: "+DPS", cost: 2, fx: "dps", v: 0.08 },
  { id: "t7", name: "Авто-лут", cost: 3, fx: "autoloot", v: 1 },
  { id: "t8", name: "x2 essence", cost: 4, fx: "essence", v: 2 },
];

export const ACHIEVEMENTS = [
  { id: "hit1", name: "Первый", desc: "1 удар", icon: "👊", ok: (s) => s.clicks >= 1 },
  { id: "c100", name: "Разогрев", desc: "100 кликов", icon: "💪", ok: (s) => s.clicks >= 100 },
  { id: "c1k", name: "Мотор", desc: "1K кликов", icon: "⚙", ok: (s) => s.clicks >= 1000 },
  { id: "w10", name: "Турист", desc: "Волна 10", icon: "🗺", ok: (s) => s.wave >= 10 },
  { id: "w30", name: "Вeteran", desc: "Волна 30", icon: "🎖", ok: (s) => s.wave >= 30 },
  { id: "boss1", name: "Охотник", desc: "1 босс", icon: "💀", ok: (s) => s.bossKills >= 1 },
  { id: "pre1", name: "Новая жизнь", desc: "1 престиж", icon: "⭐", ok: (s) => s.prestigeCount >= 1 },
  { id: "combo50", name: "Комбо-зверь", desc: "Комбо 50", icon: "🔥", ok: (s) => s.maxCombo >= 50 },
  { id: "rage", name: "Берсerk", desc: "100% ярость", icon: "🩸", ok: (s) => s.rageMaxed >= 1 },
  { id: "art", name: "Коллектор", desc: "3 артефакта", icon: "💎", ok: (s) => (s.artifacts || []).filter(Boolean).length >= 3 },
];

export const EVENTS = [
  { id: "gold", msg: "ЗОЛОТАЯ ЛИХОРАДКА — x2 ₽!", coin: 2, dur: 25 },
  { id: "dmg", msg: "АДРЕНАЛИН — +60% урон!", dmg: 1.6, dur: 20 },
  { id: "crit", msg: "ТОЧНЫЙ ЧАС — +25% крит!", crit: 0.25, dur: 18 },
  { id: "loot", msg: "СУЕТА — x3 лут!", loot: 3, dur: 22 },
  { id: "slow", msg: "ЗАМЕДЛЕНИЕ — легче комбо!", combo: 1.5, dur: 15 },
];

export function cost(item, lv) {
  return Math.floor(item.base * Math.pow(item.mult, lv));
}

export function fmt(n) {
  if (n < 1000) return Math.floor(n).toString();
  if (n < 1e6) return (n / 1e3).toFixed(1) + "K";
  if (n < 1e9) return (n / 1e6).toFixed(2) + "M";
  if (n < 1e12) return (n / 1e9).toFixed(2) + "B";
  return (n / 1e12).toFixed(2) + "T";
}

export function defaultState() {
  return {
    coins: 0,
    souls: 0,
    essence: 0,
    prestigePts: 0,
    prestigeCount: 0,
    wave: 1,
    zoneIdx: 0,
    killsInWave: 0,
    level: 1,
    xp: 0,
    weapons: {},
    crew: {},
    elements: {},
    relics: {},
    research: {},
    talents: [],
    artifacts: [null, null, null],
    inventory: {},
    clicks: 0,
    damage: 0,
    coinsEarned: 0,
    crits: 0,
    bossKills: 0,
    maxCombo: 0,
    rageMaxed: 0,
    weakHits: 0,
    parryDone: false,
    achievements: [],
    settings: { sound: true, fx: true, save: 30 },
    enemyHp: 80,
    enemyMaxHp: 80,
    enemyShield: 0,
    enemyType: "normal",
    enemyElement: "none",
    bossTimer: 0,
    bossPhase: 1,
    mutator: null,
    skillCd: {},
    buffs: {},
    event: null,
    eventT: 0,
    challenge: null,
    challengeProg: {},
    unlockedZones: [0],
    lastSave: Date.now(),
  };
}

export function migrateState(raw) {
  const d = defaultState();
  if (!raw) return d;
  // v2 → v3 rough map
  if (raw.weaponLevels) {
    raw.weapons = raw.weaponLevels;
    delete raw.weaponLevels;
  }
  if (raw.helperLevels) {
    raw.crew = raw.helperLevels;
    delete raw.helperLevels;
  }
  if (raw.relicLevels) {
    raw.relics = raw.relicLevels;
    delete raw.relicLevels;
  }
  if (raw.prestigePoints != null) raw.prestigePts = raw.prestigePoints;
  if (raw.playerLevel != null) raw.level = raw.playerLevel;
  if (raw.totalClicks != null) raw.clicks = raw.totalClicks;
  return { ...d, ...raw, settings: { sound: true, fx: true, save: 30, ...raw.settings } };
}
