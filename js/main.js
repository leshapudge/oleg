import { loadSave, saveGame } from "./save.js";
import { GameEngine } from "./game.js";
import { UIManager } from "./ui.js";
import { ACHIEVEMENTS } from "./data.js";

const state = loadSave();
const game = new GameEngine(state);
const ui = new UIManager(game);

if (!state.enemyMaxHp || state.enemyHp <= 0) {
  game.spawnEnemy();
} else {
  game.emit("enemySpawn", { type: state.enemyType, hp: state.enemyMaxHp });
}

game.onEnemyDeath = (coins) => {
  if (state.settings.sound) ui.playSound("hit");
};

game.subscribe((event, data) => {
  if (event === "levelUp") {
    ui.toast(`Уровень ${data}! 🎉`);
    if (state.settings.sound) ui.playSound("level");
  }
  if (event === "waveUp") {
    ui.toast(`Новая волна: ${data}! 🌊`);
  }
  if (event === "bossFail") {
    ui.toast("Босс ушёл! Успей в следующий раз.");
  }
  if (event === "eventStart") {
    const labels = {
      double_coins: "Событие: двойные монеты!",
      free_damage: "Событие: усиление урона!",
      lucky_crit: "Событие: удачный крит!",
    };
    ui.toast(labels[data] || "Случайное событие!");
  }
  if (event === "kill") checkAchievements();
  ui.update();
});

function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (state.achievements.includes(a.id)) continue;
    if (a.check(state)) {
      state.achievements.push(a.id);
      ui.toast(`🏆 ${a.name}: ${a.desc}`);
      state.coins += 100 * state.achievements.length;
    }
  }
}

ui.init();
checkAchievements();

let last = performance.now();
function loop(now) {
  const dt = Math.min(now - last, 100);
  last = now;
  game.tick(dt);
  game.maybeRandomEvent();
  if (now % 500 < 20) ui.update();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

setInterval(() => saveGame(state), (state.settings.saveInterval || 30) * 1000);
window.addEventListener("beforeunload", () => saveGame(state));

console.log("%c🍑 Олег Симулятор загружен!", "font-size:16px;font-weight:bold;color:#ff6b9d");
