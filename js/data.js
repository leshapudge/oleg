/** Игровые константы и таблицы контента */

export const SAVE_KEY = "oleg_simulator_save_v2";

export const WAVES = [
  { name: "Двор Олега", hpMult: 1, coinMult: 1 },
  { name: "Подъезд", hpMult: 1.4, coinMult: 1.15 },
  { name: "Пляж", hpMult: 1.9, coinMult: 1.3 },
  { name: "Офис", hpMult: 2.6, coinMult: 1.5 },
  { name: "Баня", hpMult: 3.5, coinMult: 1.75 },
  { name: "Космос", hpMult: 5, coinMult: 2.2 },
  { name: "Ад Олега", hpMult: 8, coinMult: 3 },
];

export const ENEMY_TYPES = {
  normal: { tag: "Обычный", hpMult: 1, coinMult: 1, xpMult: 1 },
  elite: { tag: "Элитный", hpMult: 2.5, coinMult: 2, xpMult: 1.5 },
  boss: { tag: "БОСС", hpMult: 8, coinMult: 5, xpMult: 3 },
};

export const WEAPON_UPGRADES = [
  { id: "size", name: "Размер", icon: "📏", desc: "+базовый урон за клик", baseCost: 15, costMult: 1.15, effect: (lv) => lv * 2 + 1 },
  { id: "hardness", name: "Твёрдость", icon: "💎", desc: "+% урона от всех источников", baseCost: 50, costMult: 1.18, effect: (lv) => 1 + lv * 0.05 },
  { id: "lube", name: "Смазка", icon: "🧴", desc: "+скорость комбо (дольше не сбрасывается)", baseCost: 80, costMult: 1.2, effect: (lv) => 2000 + lv * 400 },
  { id: "crit_chance", name: "Точность", icon: "🎯", desc: "+шанс критического удара", baseCost: 120, costMult: 1.22, effect: (lv) => 0.05 + lv * 0.02, max: 40 },
  { id: "crit_mult", name: "Мощь крита", icon: "💥", desc: "+множитель крита", baseCost: 200, costMult: 1.25, effect: (lv) => 2 + lv * 0.25 },
  { id: "double_tap", name: "Двойной удар", icon: "⚡", desc: "шанс ударить дважды", baseCost: 500, costMult: 1.3, effect: (lv) => lv * 0.03, max: 25 },
];

export const HELPERS = [
  { id: "vasya", name: "Вася", icon: "🧔", desc: "слабый авто-удар/сек", baseCost: 25, costMult: 1.12, dps: (lv) => lv * 0.5 },
  { id: "petya", name: "Петя", icon: "👦", desc: "средний DPS", baseCost: 150, costMult: 1.14, dps: (lv) => lv * 2 },
  { id: "kollega", name: "Коллега", icon: "👔", desc: "сильный DPS", baseCost: 800, costMult: 1.16, dps: (lv) => lv * 8 },
  { id: "babushka", name: "Бабушка", icon: "👵", desc: "огромный DPS + бонус монет", baseCost: 5000, costMult: 1.18, dps: (lv) => lv * 35, coinBonus: (lv) => 1 + lv * 0.02 },
  { id: "drone", name: "Дрон-хуятор", icon: "🛸", desc: "космический DPS", baseCost: 50000, costMult: 1.2, dps: (lv) => lv * 200 },
];

export const RELICS = [
  { id: "ring", name: "Кольцо силы", icon: "💍", desc: "глобальный x урон", baseCost: 1000, costMult: 2, mult: (lv) => 1 + lv * 0.1, max: 20 },
  { id: "boots", name: "Сапоги скорости", icon: "👢", desc: "x скорость авто-DPS", baseCost: 2500, costMult: 2.2, mult: (lv) => 1 + lv * 0.08, max: 15 },
  { id: "amulet", name: "Амулет Олега", icon: "📿", desc: "x монеты с убийств", baseCost: 5000, costMult: 2.5, mult: (lv) => 1 + lv * 0.12, max: 15 },
  { id: "crown", name: "Корона тапа", icon: "👑", desc: "x XP", baseCost: 10000, costMult: 3, mult: (lv) => 1 + lv * 0.1, max: 10 },
];

export const SKILLS = [
  { id: "mega_slap", name: "Мега-шлёп", icon: "👋", cd: 15, desc: "x10 урон на 5 сек", duration: 5, mult: 10 },
  { id: "frenzy", name: "Ярость", icon: "🔥", cd: 30, desc: "авто-клики 8 сек", duration: 8, autoCps: 5 },
  { id: "gold_rain", name: "Золотой дождь", icon: "🪙", cd: 45, desc: "x5 монет 10 сек", duration: 10, coinMult: 5 },
  { id: "freeze", name: "Стузняк", icon: "❄️", cd: 60, desc: "Олег не регенит HP 12 сек", duration: 12 },
];

export const ACHIEVEMENTS = [
  { id: "first_hit", name: "Первый удар", desc: "Ударь Олега", icon: "👊", check: (s) => s.totalClicks >= 1 },
  { id: "clicks_100", name: "Разогрев", desc: "100 кликов", icon: "💪", check: (s) => s.totalClicks >= 100 },
  { id: "clicks_1k", name: "Машина", desc: "1000 кликов", icon: "🤖", check: (s) => s.totalClicks >= 1000 },
  { id: "clicks_10k", name: "Легенда", desc: "10000 кликов", icon: "🏅", check: (s) => s.totalClicks >= 10000 },
  { id: "wave_5", name: "Турист", desc: "Достигни волны 5", icon: "🌊", check: (s) => s.wave >= 5 },
  { id: "wave_10", name: "Покоритель", desc: "Волна 10", icon: "🚀", check: (s) => s.wave >= 10 },
  { id: "boss_kill", name: "Убийца боссов", desc: "Убей босса", icon: "💀", check: (s) => s.bossKills >= 1 },
  { id: "boss_10", name: "Охотник", desc: "10 боссов", icon: "🗡", check: (s) => s.bossKills >= 10 },
  { id: "prestige_1", name: "Перерождение", desc: "1 престиж", icon: "⭐", check: (s) => s.prestigeCount >= 1 },
  { id: "combo_50", name: "Комбо-мастер", desc: "Комбо x50", icon: "🔥", check: (s) => s.maxCombo >= 50 },
  { id: "coins_1m", name: "Миллионер", desc: "1M монет заработано", icon: "💰", check: (s) => s.totalCoinsEarned >= 1e6 },
  { id: "crit_100", name: "Критоман", desc: "100 критов", icon: "💥", check: (s) => s.totalCrits >= 100 },
];

export const TALENTS = [
  { id: "t_dmg", name: "+10% урон", cost: 1, effect: "damage", value: 0.1 },
  { id: "t_coins", name: "+15% монеты", cost: 1, effect: "coins", value: 0.15 },
  { id: "t_combo", name: "+комбо окно", cost: 2, effect: "comboWindow", value: 500 },
  { id: "t_start", name: "Старт: 500🪙", cost: 2, effect: "startCoins", value: 500 },
  { id: "t_prestige", name: "+20% престиж", cost: 3, effect: "prestigeGain", value: 0.2 },
  { id: "t_auto", name: "+5% авто-DPS", cost: 2, effect: "autoDps", value: 0.05 },
];

export const TIPS = [
  "Держи комбо — множитель урона растёт!",
  "Боссы дают x5 монет — не пропускай таймер!",
  "Престиж сбрасывает прогресс, но даёт постоянные бонусы.",
  "Элитные Олеги появляются каждые 5 убийств.",
  "Навыки на кулдауне — жми в бою с боссом!",
  "Реликвии дорогие, но дают глобальный множитель.",
  "Двойной удар срабатывает случайно — качай Точность.",
];

export function upgradeCost(item, level) {
  return Math.floor(item.baseCost * Math.pow(item.costMult, level));
}

export function formatNum(n) {
  if (n < 1000) return Math.floor(n).toString();
  if (n < 1e6) return (n / 1000).toFixed(1) + "K";
  if (n < 1e9) return (n / 1e6).toFixed(2) + "M";
  if (n < 1e12) return (n / 1e9).toFixed(2) + "B";
  return (n / 1e12).toFixed(2) + "T";
}

export function defaultState() {
  return {
    coins: 0,
    souls: 0,
    prestigePoints: 0,
    prestigeCount: 0,
    wave: 1,
    killsOnWave: 0,
    playerLevel: 1,
    playerXp: 0,
    weaponLevels: {},
    helperLevels: {},
    relicLevels: {},
    talents: [],
    totalClicks: 0,
    totalDamage: 0,
    totalCoinsEarned: 0,
    totalCrits: 0,
    bossKills: 0,
    maxCombo: 0,
    achievements: [],
    settings: { sound: true, particles: true, saveInterval: 30 },
    lastSave: Date.now(),
    enemyHp: 100,
    enemyMaxHp: 100,
    enemyType: "normal",
    bossTimer: 0,
    skillCooldowns: {},
    buffs: {},
    event: null,
    eventEnd: 0,
  };
}
