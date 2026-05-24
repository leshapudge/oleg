import { loadSave, saveGame } from "./save.js";
import { Game } from "./game.js";
import { UI } from "./ui.js";
import { ACHIEVEMENTS } from "./data.js";
import { MATERIALS } from "./rpg-data.js";
import { grantVeteranUnlocks } from "./tutorial.js";

const state = loadSave();
grantVeteranUnlocks(state);
const game = new Game(state);
const ui = new UI(game);

if (!state.enemyMaxHp || state.enemyHp <= 0) game.spawnEnemy();
game.fixBrokenEnemy();
game.checkProgress();

function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (state.achievements.includes(a.id)) continue;
    if (a.ok(state)) {
      state.achievements.push(a.id);
      state.coins += 50 * state.achievements.length;
      ui.toast(`🏆 ${a.name}`);
    }
  }
}

game.on((ev, data) => {
  switch (ev) {
    case "level":
      ui.toast(`Уровень ${data}!`);
      if (state.settings.sound) ui.snd("crit");
      break;
    case "wave":
      ui.toast(`Волна ${data}`);
      break;
    case "kill":
      if (state.settings.sound) ui.snd("hit");
      checkAchievements();
      break;
    case "spawn":
      ui.update(true);
      break;
    case "event":
      ui.toast(data.msg);
      break;
    case "bossFail":
      ui.toast("Босс съебался!");
      break;
    case "phase":
      ui.toast(`Босс — фаза ${data}`);
      break;
    case "travel":
      ui.toast(`${data.icon} ${data.name}`);
      break;
    case "craft":
      ui.toast(`Скрафтил: ${data.name}!`);
      break;
    case "fish":
      ui.toast(data > 0 ? `Рыба +${data}` : "Пусто...");
      break;
    case "gather":
      ui.toast(`+${data.amount} ${MATERIALS[data.mat]?.name || data.mat}`);
      break;
    case "rest":
      ui.toast("Жар сброшен!");
      break;
    case "unlock":
      ui.showUnlock(data);
      if (state.settings.sound) ui.snd("crit");
      break;
    case "objective":
      ui.toast(`✓ ${data.text} (+${data.coins}₽)`);
      if (state.settings.sound) ui.snd("crit");
      break;
    case "autoHit":
      if (state.settings.fx) ui.autoFloat(data);
      ui.updateCombat();
      break;
    case "counterReady":
    case "parryReady":
      break;
    case "counterHit":
      ui.toast("Олег ответил! Комбо слетело, жар вырос.");
      break;
    case "prestige":
      ui.toast(`Престиж +${data}★`);
      break;
  }
  if (ev === "unlock" || ev === "objective" || ev === "buy" || ev === "craft" || ev === "equip" || ev === "travel") {
    ui.update(true);
  } else if (ev !== "tick" && ev !== "hit" && ev !== "material") {
    ui.updateCombat();
  }
});

ui.init();
checkAchievements();

let last = performance.now();
let panelTick = 0;
function loop(now) {
  game.tick(Math.min(now - last, 50));
  last = now;
  ui.updateCombat();
  panelTick++;
  if (panelTick % 20 === 0 && ui.panel === "map" && game.state.activityCd > 0) {
    ui.renderPanel();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

setInterval(() => saveGame(state), (state.settings?.save || 30) * 1000);
window.addEventListener("beforeunload", () => saveGame(state));
