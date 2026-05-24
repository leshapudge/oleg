import {
  WEAPONS, CREW, RELICS, SKILLS, OLEG_SKINS, ENEMY_TYPES,
  ZONES, SIMPLE_TIPS, cost, fmt,
} from "./data.js";
import { buildOlegSvg, playHitAnim } from "./sprites.js";

const HIT_WORDS = ["БАХ!", "ПЛЮХ!", "ХРЯСЬ!", "ЕБАШ!", "В ЖОПУ!", "ОЙ-ой!"];
const CRIT_WORDS = ["ПИЗДЕЦ!", "РАЗЪЁБ!", "НАХУЙ!", "КРИТ, БЛЯ!"];
const WEAK_WORDS = ["В ЯБЛОЧКО!", "ТРИПЛ!", "ПОПАЛ!"];

export class UI {
  constructor(game) {
    this.g = game;
    this.tab = "weapon";
    this.$ = (id) => document.getElementById(id);
    this.cache();
    this.bind();
    this.tipIdx = 0;
  }

  cache() {
    const ids = [
      "coins", "place-line", "zone-map", "zone-desc", "zone-fill", "zone-progress-text",
      "zone-boss-warn", "stage",
      "enemy-badge", "enemy-name", "enemy-quote",
      "enemy-hp-text", "enemy-hp-fill", "boss-warn", "boss-timer",
      "weak-left", "weak-right", "parry-prompt", "oleg-char",
      "click-target", "combo-fill", "combo-mult", "combo-count",
      "dpc-display", "dps-display", "skills-dock", "player-level", "xp-fill",
      "shop-content", "event-ticker", "modal-overlay", "modal-body", "toasts",
    ];
    this.el = {};
    ids.forEach((id) => { this.el[id] = this.$(id); });
  }

  bind() {
    this.el["click-target"].onclick = (e) => {
      if (e.target.closest(".spot")) return;
      this.fx(e, this.g.click());
    };
    this.el["weak-left"].onclick = (e) => { e.stopPropagation(); this.fx(e, this.g.weakClick("left")); };
    this.el["weak-right"].onclick = (e) => { e.stopPropagation(); this.fx(e, this.g.weakClick("right")); };
    this.el["parry-prompt"].onclick = () => {
      if (this.g.parry()) this.toast("ОТБИЛ! Получи, сука!");
    };
    document.querySelectorAll(".tabs .tab").forEach((t) => {
      t.onclick = () => {
        document.querySelectorAll(".tabs .tab").forEach((x) => x.classList.remove("active"));
        t.classList.add("active");
        this.tab = t.dataset.tab;
        this.renderShop();
      };
    });
    this.$("btn-help").onclick = () => this.showHelp();
    this.$("modal-close").onclick = () => this.el["modal-overlay"].classList.add("hidden");
    this.el["modal-overlay"].onclick = (e) => {
      if (e.target === this.el["modal-overlay"]) this.el["modal-overlay"].classList.add("hidden");
    };
  }

  fx(e, { dmg, crit, weak }) {
    playHitAnim(this.el["oleg-char"], crit);
    const x = e.clientX ?? innerWidth / 2;
    const y = e.clientY ?? innerHeight / 2;
    const words = weak ? WEAK_WORDS : crit ? CRIT_WORDS : HIT_WORDS;
    const word = words[Math.floor(Math.random() * words.length)];
    this.float(x, y, `${word} ${fmt(dmg)}`, crit, weak);
    if (this.g.state.settings.fx) this.burst(x, y);
    if (this.g.state.settings.sound) this.snd(crit ? "crit" : "hit");
  }

  float(x, y, text, crit, weak) {
    const d = document.createElement("div");
    d.className = "float-dmg" + (crit ? " crit" : weak ? " weak" : "");
    d.textContent = text;
    d.style.left = x + "px";
    d.style.top = y + "px";
    document.getElementById("fx-layer").appendChild(d);
    setTimeout(() => d.remove(), 700);
  }

  burst(x, y) {
    for (let i = 0; i < 4; i++) {
      const p = document.createElement("span");
      p.textContent = "💥";
      p.style.cssText = `position:fixed;left:${x}px;top:${y}px;font-size:14px;pointer-events:none;animation:floatUp .5s forwards`;
      document.getElementById("fx-layer").appendChild(p);
      setTimeout(() => p.remove(), 500);
    }
  }

  toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    this.el.toasts.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  snd(type) {
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = type === "crit" ? 300 : 150;
      g.gain.value = 0.06;
      o.start(); o.stop(ctx.currentTime + 0.1);
    } catch { /* */ }
  }

  applySkin() {
    const skin = OLEG_SKINS.find((s) => s.id === this.g.state.enemySkin) || OLEG_SKINS[0];
    this.el["oleg-char"].innerHTML = buildOlegSvg(skin.id);
    this.el["enemy-name"].textContent = skin.name;
    this.el["enemy-quote"].textContent = skin.quote;
  }

  renderZoneMap() {
    const s = this.g.state;
    const z = this.g.zone();
    this.el["zone-map"].innerHTML = ZONES.map((zone, i) => {
      const cls = i === s.zoneIdx ? "current" : s.unlockedZones.includes(i) ? "done" : "locked";
      return `<div class="map-node ${cls}" title="${zone.desc} · ${zone.bonus}">
        <span class="mn-ico">${zone.icon}</span>
        <span class="mn-name">${zone.name}</span>
      </div>`;
    }).join("");

    this.el["zone-desc"].textContent = `${z.icon} ${z.name} — ${z.desc} (${z.bonus})`;
    const pct = Math.min(100, (s.zoneKills / z.kills) * 100);
    this.el["zone-fill"].style.width = pct + "%";
    this.el["zone-progress-text"].textContent = `${s.zoneKills} / ${z.kills} олегов`;
    this.el.stage.className = "stage " + z.bg;
    this.el["zone-boss-warn"].classList.toggle("hidden", !s.zoneBossPending);
  }

  renderShop() {
    const s = this.g.state;
    let html = "";

    const row = (ico, name, desc, price, locked, cat, id) => `
      <div class="shop-item ${locked ? "locked" : ""}" data-cat="${cat}" data-id="${id}">
        <span class="si-ico">${ico}</span>
        <div><b>${name}</b><br><small>${desc}</small></div>
        <span class="si-price">${price}</span>
      </div>`;

    if (this.tab === "weapon") {
      html = WEAPONS.map((w) => {
        const l = this.g.lv(s.weapons, w.id);
        const mx = w.max && l >= w.max;
        return row(w.icon, w.name, w.desc, mx ? "MAX" : fmt(cost(w, l)) + "₽", !mx && s.coins < cost(w, l), "weapon", w.id);
      }).join("");
    } else if (this.tab === "crew") {
      html = CREW.map((c) => {
        const l = this.g.lv(s.crew, c.id);
        return row(c.icon, c.name, c.desc, fmt(cost(c, l)) + "₽", s.coins < cost(c, l), "crew", c.id);
      }).join("");
    } else {
      html = `<p class="shop-note">Престиж и прочее — для тех, кто уже въехал.</p>`;
      html += RELICS.slice(0, 3).map((r) => {
        const l = this.g.lv(s.relics, r.id);
        return row(r.icon, r.name, r.desc, fmt(cost(r, l)) + "₽", s.coins < cost(r, l), "relics", r.id);
      }).join("");
      const gain = this.g.prestigeGain();
      html += `<button class="btn-big" id="do-prestige" ${this.g.canPrestige() ? "" : "disabled"}>Престиж (+${gain}★) — сброс, но навсегда сильнее</button>`;
    }

    this.el["shop-content"].innerHTML = html;
    this.el["shop-content"].querySelectorAll(".shop-item").forEach((el) => {
      el.onclick = () => {
        if (el.classList.contains("locked")) return;
        if (this.g.buy(el.dataset.cat, el.dataset.id)) {
          this.renderShop();
          this.toast("Куплено! Ебашь дальше.");
          this.snd("buy");
        }
      };
    });
    const pb = document.getElementById("do-prestige");
    if (pb) pb.onclick = () => {
      if (this.g.doPrestige()) this.toast("Престиж! Начинаем заново, но мощнее.");
    };
  }

  renderSkills() {
    this.el["skills-dock"].innerHTML = SKILLS.map((sk) => {
      const cd = this.g.state.skillCd[sk.id] || 0;
      return `<button class="skill" data-sk="${sk.id}" title="${sk.desc}" ${cd > 0 ? "disabled" : ""}>
        <span class="sk-ico">${sk.icon}</span>
        <span class="sk-name">${sk.name}</span>
        ${cd > 0 ? `<span class="sk-cd">${Math.ceil(cd)}</span>` : ""}
      </button>`;
    }).join("");
    this.el["skills-dock"].querySelectorAll(".skill").forEach((b) => {
      b.onclick = () => {
        if (this.g.useSkill(b.dataset.sk)) {
          this.toast(SKILLS.find((x) => x.id === b.dataset.sk).name + " — пошла жара!");
          this.renderSkills();
        }
      };
    });
  }

  showHelp() {
    this.el["modal-body"].innerHTML = `
      <h2>Как играть (коротко)</h2>
      <ol class="help-list">
        <li><b>Жми по жопе</b> — главное. Бабки капают.</li>
        <li><b>Жёлтые круги «x3»</b> — жми туда, урон x3.</li>
        <li><b>Вкладка «Хуй»</b> — качай удар сильнее.</li>
        <li><b>«Братва»</b> — нанимаешь, они бьют сами.</li>
        <li><b>Кнопки снизу</b> — скиллы. Жми когда не серые.</li>
        <li><b>Карта сверху</b> — локации. Убей N олегов → босс → новая зона.</li>
        <li>Разные олеги выглядят по-разному. Босс — самый жирный.</li>
      </ol>
      <p class="help-note">Не парься с цифрами. Кликай и покупай.</p>
    `;
    this.el["modal-overlay"].classList.remove("hidden");
  }

  update() {
    const g = this.g;
    const s = g.state;
    const z = g.zone();
    const et = ENEMY_TYPES[s.enemyType];

    this.el.coins.textContent = fmt(s.coins);
    this.el["place-line"].textContent = `${z.name} · волна ${s.wave}`;
    this.el["enemy-badge"].textContent = et?.tag || "Олег";
    this.el["enemy-badge"].className = "enemy-type type-" + s.enemyType;

    this.applySkin();
    this.renderZoneMap();

    const hp = (s.enemyHp / s.enemyMaxHp) * 100;
    this.el["enemy-hp-fill"].style.width = hp + "%";
    this.el["enemy-hp-text"].textContent = `${fmt(s.enemyHp)} / ${fmt(s.enemyMaxHp)}`;

    if (s.enemyType === "boss" && s.bossTimer > 0) {
      this.el["boss-warn"].classList.remove("hidden");
      this.el["boss-timer"].textContent = Math.ceil(s.bossTimer);
    } else this.el["boss-warn"].classList.add("hidden");

    const showW = g.weakSpot && g.weakT > 0;
    this.el["weak-left"].classList.toggle("hidden", !showW || g.weakSpot !== "left");
    this.el["weak-right"].classList.toggle("hidden", !showW || g.weakSpot !== "right");
    this.el["parry-prompt"].classList.toggle("hidden", !g.parryActive);

    this.el["combo-fill"].style.width = Math.min(100, g.combo) + "%";
    this.el["combo-mult"].textContent = "x" + g.comboMult().toFixed(1);
    this.el["combo-count"].textContent = g.combo;
    this.el["dpc-display"].textContent = fmt(g.clickDamage());
    this.el["dps-display"].textContent = fmt(g.autoDps());

    this.el["player-level"].textContent = s.level;
    this.el["xp-fill"].style.width = (s.xp / g.xpNeed()) * 100 + "%";

    if (s.event?.msg) this.el["event-ticker"].textContent = s.event.msg;

    this.renderSkills();
  }

  init() {
    this.renderShop();
    this.update();
    setInterval(() => {
      if (!this.g.state.event?.msg) {
        this.el["event-ticker"].textContent = SIMPLE_TIPS[Math.floor(Math.random() * SIMPLE_TIPS.length)];
      }
    }, 12000);
  }
}
