/** Постепенное открытие механик */

export const UNLOCKS = [
  {
    id: "counter",
    dock: null,
    check: (s) => s.level >= 2,
    title: "Олег бесится!",
    text: "Полоска «Злость» — когда заполнится, жми ОТБИТЬ или получишь по морде.",
  },
  {
    id: "heavy",
    dock: null,
    check: (s) => s.level >= 4,
    title: "Мощный удар!",
    text: "Кнопка 💥 — хуём с размаху. x3 урона, но жрёт выносливость.",
  },
  {
    id: "shop",
    dock: "shop",
    label: "Удары",
    icon: "🍆",
    check: (s) => s.clicks >= 8,
    title: "Магазин открыт!",
    text: "Вкладка «Удары» — трать бабки на силу удара. Чем чаще бьёшь, тем больше капает.",
  },
  {
    id: "combo",
    dock: null,
    check: (s) => s.clicks >= 12,
    title: "Комбо",
    text: "Жми без пауз — полоска комбо растёт и множит урон. Не останавливайся!",
  },
  {
    id: "weak",
    dock: null,
    check: (s) => s.clicks >= 20,
    title: "Слабое место x3",
    text: "Жёлтые круги по бокам — жми туда, когда появятся. Тройной урон в жопу.",
  },
  {
    id: "crew",
    dock: "crew",
    label: "Братва",
    icon: "🧔",
    check: (s) => s.coins >= 150,
    title: "Братва!",
    text: "Нанимай пацанов — они бьют олега сами, пока ты занят другим.",
  },
  {
    id: "map",
    dock: "map",
    label: "Мир",
    icon: "🗺",
    check: (s) => s.level >= 3,
    title: "Карта мира",
    text: "7 локаций — разные бонусы, ресурсы и активности. Жми зону, чтобы поехать.",
  },
  {
    id: "activities",
    dock: null,
    check: (s) => s.level >= 4,
    title: "Активности",
    text: "На карте кнопки: рубить, рыбачить, париться. Между боями собирай ресурсы.",
  },
  {
    id: "craft",
    dock: "craft",
    label: "Крафт",
    icon: "🔨",
    check: (s) => matTotal(s) >= 4,
    title: "Крафт!",
    text: "Из материалов — оружие и броня. Сначала дубина: 4 дерева на Дворе.",
  },
  {
    id: "gear",
    dock: "gear",
    label: "Шмот",
    icon: "🛡",
    check: (s) => Object.keys(s.items || {}).some((k) => s.items[k] > 0),
    title: "Экипировка",
    text: "Надевай скрафченное — реальный бонус к урону, криту и рыбалке.",
  },
  {
    id: "skills",
    dock: null,
    check: (s) => s.level >= 5,
    title: "Супер-удары",
    text: "Под ареной — скиллы. Жми, когда не на перезарядке. Разъёб гарантирован.",
  },
  {
    id: "prestige",
    dock: "more",
    label: "Ещё",
    icon: "⭐",
    check: (s) => s.wave >= 5,
    title: "Престиж",
    text: "В «Ещё» — престиж. Сброс прогресса, но навсегда +сила. Для тех, кто въехал.",
  },
];

export const OBJECTIVES = [
  { id: "o1", text: "Жми по жопе 8 раз", check: (s) => s.clicks >= 8, coins: 30 },
  { id: "o2", text: "Купи первый апгрейд", check: (s) => weaponLv(s) >= 1, coins: 80 },
  { id: "o3", text: "Убей 5 олегов", check: (s) => s.clicks >= 30, coins: 100 },
  { id: "o4", text: "Достигни 3 уровня", check: (s) => s.level >= 3, coins: 150 },
  { id: "o5", text: "Собери 4 ресурса", check: (s) => matTotal(s) >= 4, coins: 120 },
  { id: "o6", text: "Скрафти предмет", check: (s) => Object.keys(s.items || {}).length > 0, coins: 200 },
  { id: "o7", text: "Надень экипировку", check: (s) => Object.values(s.equip || {}).some(Boolean), coins: 150 },
  { id: "o8", text: "Дойди до волны 5", check: (s) => s.wave >= 5, coins: 300 },
  { id: "o9", text: "Убей босса", check: (s) => s.bossKills >= 1, coins: 400 },
  { id: "o10", text: "Посети 3 локации", check: (s) => (s.visitedZones || []).length >= 3, coins: 250 },
];

function weaponLv(s) {
  return Object.values(s.weapons || {}).reduce((a, b) => a + b, 0);
}

function matTotal(s) {
  return Object.values(s.materials || {}).reduce((a, b) => a + b, 0);
}

export function currentObjective(state) {
  for (const o of OBJECTIVES) {
    if ((state.objectivesDone || []).includes(o.id)) continue;
    return o;
  }
  return null;
}

export function tryCompleteObjective(state) {
  const o = currentObjective(state);
  if (!o || !o.check(state)) return null;
  if (!state.objectivesDone) state.objectivesDone = [];
  state.objectivesDone.push(o.id);
  state.coins += o.coins;
  return o;
}

export function hasUnlock(state, id) {
  return (state.unlocks || []).includes(id);
}

export function isDockOpen(state, dockId) {
  if (dockId === "shop") return hasUnlock(state, "shop");
  if (dockId === "crew") return hasUnlock(state, "crew");
  if (dockId === "map") return hasUnlock(state, "map");
  if (dockId === "craft") return hasUnlock(state, "craft");
  if (dockId === "gear") return hasUnlock(state, "gear");
  if (dockId === "more") return hasUnlock(state, "prestige");
  return false;
}

export function grantVeteranUnlocks(state) {
  if (!state.unlocks) state.unlocks = [];
  if (state.clicks >= 50 || state.level >= 5) {
    for (const u of UNLOCKS) {
      if (!state.unlocks.includes(u.id)) state.unlocks.push(u.id);
    }
  }
}
