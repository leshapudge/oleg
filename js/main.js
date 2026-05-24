import { loadSave, saveGame } from "./save.js";
import { Game } from "./game.js";
import { UI } from "./ui.js";
import { ACHIEVEMENTS } from "./data.js";

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
      ui.toast(`🏆 ${a.name}`);
    }
  }
}

game.on((ev, data) => {
  switch (ev) {
    case "level":
      ui.toast(`УРОВЕНЬ ${data}!`);
      if (state.settings.sound) ui.snd("level");
      break;
    case "wave":
      ui.toast(`Волна ${data}!`);
      break;
    case "kill":
      if (state.settings.sound) ui.snd("hit");
      checkAchievements();
      break;
    case "event":
      ui.toast(data.msg);
      break;
    case "loot":
      ui.toast(`Лут: ${data}`);
      break;
    case "artifact":
      ui.toast(`Артефакт: ${data.name}!`);
      break;
    case "bossFail":
      ui.toast("Босс сбежал!");
      break;
    case "phase":
      ui.toast(`Фаза босса ${data}!`);
      break;
    case "challenge":
      ui.toast(`Челлендж: +${data.reward}₽`);
      break;
    case "prestige":
      ui.toast(`Престиж +${data} ★`);
      break;
  }
  if (ev !== "tick" && ev !== "hit") ui.update();
});

ui.init();
checkAchievements();

let last = performance.now();
function loop(now) {
  const dt = Math.min(now - last, 50);
  last = now;
  game.tick(dt);
  if (Math.floor(now / 100) % 2 === 0) ui.update();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

setInterval(() => saveGame(state), (state.settings?.save || 30) * 1000);
window.addEventListener("beforeunload", () => saveGame(state));

console.log("%c ОЛЕГБОЙ v3 ", "background:#b8ff3c;color:#102010;font-weight:bold;padding:4px 8px");
