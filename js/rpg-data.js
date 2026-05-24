/** Материалы, предметы, крафт, мастерства */

export const MATERIALS = {
  wood: { name: "Дерево", icon: "🪵" },
  scrap: { name: "Хлам", icon: "🔩" },
  fish: { name: "Рыба", icon: "🐟" },
  ore: { name: "Руда", icon: "⛏" },
  hide: { name: "Шкуры", icon: "🥩" },
  crystal: { name: "Кристалл", icon: "💎" },
  scale: { name: "Чешуя", icon: "🐠" },
};

export const ITEMS = {
  wooden_club: { name: "Дубина", icon: "🏏", slot: "weapon", dmg: 8, desc: "+8 урона" },
  iron_bat: { name: "Железный хуй", icon: "🍆", slot: "weapon", dmg: 28, crit: 0.03, desc: "+28 урона, +3% крит" },
  demon_stick: { name: "Адская палка", icon: "🔥", slot: "weapon", dmg: 65, crit: 0.06, desc: "Разъёб" },
  leather_pants: { name: "Кожаные штаны", icon: "👖", slot: "armor", heatRed: 0.15, hp: 0, desc: "-15% перегрев" },
  iron_plate: { name: "Бронежопа", icon: "🛡", slot: "armor", dmgRed: 0, dmg: 0, heatRed: 0.25, desc: "-25% жар" },
  fishing_rod: { name: "Удочка", icon: "🎣", slot: "tool", fishBonus: 0.35, desc: "+35% рыбалка" },
  pro_rod: { name: "Супер-удочка", icon: "🎏", slot: "tool", fishBonus: 0.7, desc: "+70% рыбалка" },
  lucky_charm: { name: "Талисман", icon: "🍀", slot: "trinket", coin: 0.12, desc: "+12% бабки" },
  oleg_tooth: { name: "Зуб олега", icon: "🦷", slot: "trinket", dmg: 15, desc: "+15 урона" },
};

export const RECIPES = [
  { id: "club", name: "Дубина", icon: "🏏", craftLv: 1, in: { wood: 4 }, out: "wooden_club" },
  { id: "rod", name: "Удочка", icon: "🎣", craftLv: 1, in: { wood: 3, scrap: 2 }, out: "fishing_rod" },
  { id: "pants", name: "Штаны", icon: "👖", craftLv: 2, in: { hide: 5, scrap: 3 }, out: "leather_pants" },
  { id: "iron_bat", name: "Жел. хуй", icon: "🍆", craftLv: 3, in: { ore: 8, wood: 4, scrap: 5 }, out: "iron_bat" },
  { id: "plate", name: "Бронежопа", icon: "🛡", craftLv: 4, in: { ore: 12, hide: 6 }, out: "iron_plate" },
  { id: "pro_rod", name: "Супер-удочка", icon: "🎏", craftLv: 3, in: { wood: 5, crystal: 2, fish: 10 }, out: "pro_rod" },
  { id: "charm", name: "Талисман", icon: "🍀", craftLv: 2, in: { crystal: 3, scale: 5 }, out: "lucky_charm" },
  { id: "tooth_neck", name: "Ожерелье", icon: "🦷", craftLv: 5, in: { crystal: 5, hide: 10, ore: 8 }, out: "oleg_tooth" },
  { id: "demon", name: "Адская палка", icon: "🔥", craftLv: 6, in: { crystal: 8, ore: 15, scale: 12 }, out: "demon_stick" },
];

export const MASTERIES = [
  { id: "combat", name: "Ебашка", icon: "👊", desc: "+2% урона за ур." },
  { id: "fishing", name: "Рыбалка", icon: "🎣", desc: "Лучше ловишь, реже пусто" },
  { id: "craft", name: "Крафт", icon: "🔨", desc: "Открывает рецепты" },
  { id: "endurance", name: "Вынос", icon: "🫁", desc: "-3% жар за ур." },
  { id: "scavenge", name: "Мусорщик", icon: "🗑", desc: "Больше хлама" },
];

export const ZONE_ACTIVITIES = {
  yard: { fight: true, gather: "wood", gatherName: "Рубить дерево" },
  pod: { fight: true, gather: "scrap", gatherName: "Искать хлам" },
  beach: { fight: true, fish: true },
  office: { fight: true, craft: true },
  banya: { fight: true, rest: true, restName: "Париться (сброс жара)" },
  space: { fight: true, gather: "crystal", gatherName: "Копать кристаллы" },
  hell: { fight: true, gather: "ore", gatherName: "Ковать в аду" },
};

export function masteryXpNeed(lv) {
  return Math.floor(50 * Math.pow(1.35, lv - 1));
}

export function masteryLevel(xp) {
  let lv = 1, need = masteryXpNeed(1), rem = xp;
  while (rem >= need && lv < 99) {
    rem -= need;
    lv++;
    need = masteryXpNeed(lv);
  }
  return { lv, rem, need };
}
