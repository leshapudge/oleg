import { loadSave, saveGame } from "./save.js";
import { Game } from "./game.js";
import { UI } from "./ui.js";
import { ACHIEVEMENTS } from "./data.js";
import { MATERIALS } from "./rpg-data.js";

const state = loadSave();
const game = new Game(state);
const ui = new UI(game);

if (!state.enemyMaxHp || state.enemyHp <= 0) game.spawnEnemy();

function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (state.achievements.includes(a.id)) continue;
    if (a.ok(state)) {
      state.achievements.push(a.id);
      state.coins += 50 * state.achievements.length;
      ui.toast(`🏆 ${a.name} — ${a.desc}`);
    }
  }
}

game.on((ev, data) => {
  switch (ev) {
    case "level":
      ui.toast(`Уровень ${data}! Ты становишься опаснее.`);
      if (state.settings.sound) ui.snd("crit");
      break;
    case "wave":
      ui.toast(`Волна ${data}. Новый олег, новые проблемы.`);
      break;
    case "kill":
      if (state.settings.sound) ui.snd("hit");
      checkAchievements();
      break;
    case "spawn":
      ui.update();
      break;
    case "event":
      ui.toast(data.msg);
      break;
    case "bossFail":
      ui.toast("Босс съебался! В следующий раз долби быстрее.");
      break;
    case "phase":
      ui.toast(`Босс бесится — фаза ${data}!`);
      break;
    case "zoneClear":
      ui.toast(`Новая локация: ${data.icon} ${data.name}! ${data.bonus}`);
      break;
    case "zoneBossSoon":
      ui.toast("Босс локации на подходе — готовь жопу!");
      break;
    case "travel":
      ui.toast(`Локация: ${data.icon} ${data.name}`);
      break;
    case "craft":
      ui.toast(`Скрафтил: ${data.name}!`);
      ui.renderMaterials();
      break;
    case "fish":
      ui.toast(data > 0 ? `Поймал рыбу: +${data}` : "Пусто... но опыт есть");
      break;
    case "gather":
      ui.toast(`+${data.amount} ${MATERIALS[data.mat]?.name || data.mat}`);
      break;
    case "rest":
      ui.toast("Пропарился — жар сброс!");
      break;
    case "material":
      break;
    case "prestige":
      ui.toast(`Престиж +${data}★. Начинаем заново, но мощнее.`);
      break;
  }
  if (ev !== "tick" && ev !== "hit") ui.update();
});

ui.init();
checkAchievements();

let last = performance.now();
function loop(now) {
  game.tick(Math.min(now - last, 50));
  last = now;
  if (Math.floor(now / 150) % 2 === 0) ui.update();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

setInterval(() => saveGame(state), (state.settings?.save || 30) * 1000);
window.addEventListener("beforeunload", () => saveGame(state));
