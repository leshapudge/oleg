import {
  WEAPONS, CREW, RELICS, SKILLS, OLEG_SKINS, ENEMY_TYPES,
  ZONES, SIMPLE_TIPS, cost, fmt,
} from "./data.js";
import {
  MATERIALS, ITEMS, RECIPES, MASTERIES, masteryLevel,
} from "./rpg-data.js";
import {
  UNLOCKS, currentObjective, hasUnlock, isDockOpen,
} from "./tutorial.js";
import { buildOlegSvg, playHitAnim } from "./sprites.js";

const HIT_WORDS = ["БАХ!", "ПЛЮХ!", "ХРЯСЬ!", "ЕБАШ!", "В ЖОПУ!", "ОЙ-ой!"];
const CRIT_WORDS = ["ПИЗДЕЦ!", "РАЗЪЁБ!", "НАХУЙ!", "КРИТ!"];
const WEAK_WORDS = ["В ЯБЛОЧКО!", "x3!", "ПОПАЛ!"];

const DOCK = [
  { id: "shop", unlock: "shop", label: "Удары", icon: "🍆" },
  { id: "crew", unlock: "crew", label: "Братва", icon: "🧔" },
  { id: "map", unlock: "map", label: "Мир", icon: "🗺" },
  { id: "craft", unlock: "craft", label: "Крафт", icon: "🔨" },
  { id: "gear", unlock: "gear", label: "Шмот", icon: "🛡" },
  { id: "more", unlock: "prestige", label: "Ещё", icon: "⭐" },
];

const PANEL_TITLES = {
  shop: "Удары — качай силу",
  crew: "Братва — авто-DPS",
  map: "Мир — локации",
  craft: "Крафт — делай шмот",
  gear: "Экипировка",
  more: "Престиж и реликвии",
  idle: "Прогресс",
};

const SLOTS = [
  { id: "weapon", label: "Оружие", icon: "⚔" },
  { id: "armor", label: "Броня", icon: "🛡" },
  { id: "tool", label: "Инструмент", icon: "🔧" },
  { id: "trinket", label: "Талисман", icon: "🍀" },
];

export class UI {
  constructor(game) {
    this.g = game;
    this.panel = "idle";
    this._skin = null;
    this._unlockQueue = [];
    this.$ = (id) => document.getElementById(id);
    this.cache();
    this.bind();
  }

  cache() {
    const ids = [
      "coins", "place-line", "dock", "panel-title", "panel-content",
      "objective-text", "objective-reward", "objective", "stage",
      "enemy-badge", "enemy-name", "enemy-quote", "enemy-level", "enemy-atk-display",
      "enemy-hp-text", "enemy-hp-fill", "boss-warn", "boss-timer",
      "weak-left", "weak-right", "parry-prompt", "oleg-char", "heavy-strike",
      "click-target", "combo-fill", "combo-mult",
      "heat-fill", "stamina-fill", "oleg-rage-fill", "oleg-rage-wrap",
      "dpc-display", "dps-display", "equip-mini",
      "skills-wrap", "skills-dock", "player-level", "xp-fill",
      "event-ticker", "modal-overlay", "modal-body", "toasts",
      "unlock-toast", "unlock-ico", "unlock-title", "unlock-text",
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
      if (this.g.parry()) this.toast("ОТБИТЬ! В жопу ему!");
    };
    const heavy = this.$("heavy-strike");
    if (heavy) heavy.onclick = (e) => {
      const r = this.g.heavyStrike();
      if (r) this.fx(e, r);
      else if (this.g.heavyCd > 0) this.toast(`Кд ${Math.ceil(this.g.heavyCd)}с`);
      else this.toast("Мало сил!");
    };
    this.$("btn-help").onclick = () => this.showHelp();
    this.$("modal-close").onclick = () => this.el["modal-overlay"].classList.add("hidden");
    this.el["modal-overlay"].onclick = (e) => {
      if (e.target === this.el["modal-overlay"]) this.el["modal-overlay"].classList.add("hidden");
    };
    this.$("unlock-ok").onclick = () => this.dismissUnlock();
  }

  autoFloat(dmg) {
    const rect = this.el["oleg-char"]?.getBoundingClientRect();
    if (!rect) return;
    const x = rect.left + rect.width * (0.3 + Math.random() * 0.4);
    const y = rect.top + rect.height * 0.35;
    const d = document.createElement("div");
    d.className = "float-dmg auto";
    d.textContent = `🧔 ${fmt(dmg)}`;
    d.style.left = x + "px";
    d.style.top = y + "px";
    document.getElementById("fx-layer").appendChild(d);
    setTimeout(() => d.remove(), 600);
  }

  fx(e, { dmg, crit, weak, tired }) {
    playHitAnim(this.el["oleg-char"], crit);
    const x = e.clientX ?? innerWidth / 2;
    const y = e.clientY ?? innerHeight / 2;
    const words = weak ? WEAK_WORDS : crit ? CRIT_WORDS : tired ? ["Слабак...", "Устал..."] : HIT_WORDS;
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
    for (let i = 0; i < 3; i++) {
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
    setTimeout(() => t.remove(), 2800);
  }

  snd(type) {
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.connect(gn); gn.connect(ctx.destination);
      o.frequency.value = type === "crit" ? 320 : 160;
      gn.gain.value = 0.05;
      o.start(); o.stop(ctx.currentTime + 0.08);
    } catch { /* */ }
  }

  showUnlock(u) {
    this._unlockQueue.push(u);
    if (this._unlockQueue.length === 1) this.presentUnlock(u);
  }

  presentUnlock(u) {
    this.el["unlock-ico"].textContent = u.icon || "🎉";
    this.el["unlock-title"].textContent = u.title;
    this.el["unlock-text"].textContent = u.text;
    this.el["unlock-toast"].classList.remove("hidden");
    if (u.dock) {
      this.panel = u.dock;
      this.renderDock();
      this.renderPanel();
    }
  }

  dismissUnlock() {
    this.el["unlock-toast"].classList.add("hidden");
    this._unlockQueue.shift();
    if (this._unlockQueue.length) this.presentUnlock(this._unlockQueue[0]);
  }

  renderDock() {
    const s = this.g.state;
    this.el.dock.innerHTML = DOCK.map((d) => {
      const open = isDockOpen(s, d.id);
      const active = this.panel === d.id;
      return `<button type="button" class="dock-btn ${open ? "" : "locked"} ${active ? "active" : ""}" data-dock="${d.id}" ${open ? "" : "disabled"}>
        <span class="d-ico">${d.icon}</span>
        <span>${d.label}</span>
      </button>`;
    }).join("");

    this.el.dock.querySelectorAll(".dock-btn:not(.locked)").forEach((btn) => {
      btn.onclick = () => {
        this.panel = btn.dataset.dock;
        this.renderDock();
        this.renderPanel();
      };
    });
  }

  renderObjective() {
    const obj = currentObjective(this.g.state);
    if (!obj) {
      this.el["objective-text"].textContent = "Все цели выполнены — ебашь дальше!";
      this.el["objective-reward"].textContent = "";
      return;
    }
    this.el["objective-text"].textContent = obj.text;
    this.el["objective-reward"].textContent = obj.check(this.g.state) ? "✓ Готово!" : `+${obj.coins}₽`;
    this.el.objective.classList.toggle("done", obj.check(this.g.state));
  }

  applySkin() {
    const id = this.g.state.enemySkin;
    if (this._skin === id) return;
    this._skin = id;
    const skin = OLEG_SKINS.find((s) => s.id === id) || OLEG_SKINS[0];
    this.el["oleg-char"].innerHTML = buildOlegSvg(skin.id);
    this.el["enemy-name"].textContent = skin.name;
    this.el["enemy-quote"].textContent = skin.quote;
  }

  renderEquipMini() {
    const eq = this.g.state.equip;
    this.el["equip-mini"].innerHTML = SLOTS.map(({ id, label, icon }) => {
      const itemId = eq[id];
      const it = itemId ? ITEMS[itemId] : null;
      return `<span class="eq-mini ${it ? "on" : ""}" title="${label}">${it ? it.icon : icon}</span>`;
    }).join("");
  }

  renderSkills() {
    const show = hasUnlock(this.g.state, "skills");
    this.el["skills-wrap"].classList.toggle("hidden", !show);
    if (!show) return;

    this.el["skills-dock"].innerHTML = SKILLS.map((sk) => {
      const cd = this.g.state.skillCd[sk.id] || 0;
      return `<button type="button" class="skill" data-sk="${sk.id}" title="${sk.desc}" ${cd > 0 ? "disabled" : ""}>
        <span class="sk-ico">${sk.icon}</span>
        <span class="sk-name">${sk.name}</span>
        ${cd > 0 ? `<span class="sk-cd">${Math.ceil(cd)}</span>` : ""}
      </button>`;
    }).join("");

    this.el["skills-dock"].querySelectorAll(".skill").forEach((b) => {
      b.onclick = () => {
        if (this.g.useSkill(b.dataset.sk)) {
          this.toast(SKILLS.find((x) => x.id === b.dataset.sk).name + "!");
          this.renderSkills();
        }
      };
    });
  }

  row(ico, name, desc, price, locked, cat, id, extra = "") {
    return `<div class="shop-item ${locked ? "locked" : ""}" data-cat="${cat}" data-id="${id}">
      <span class="si-ico">${ico}</span>
      <div><b>${name}</b><small>${desc}</small>${extra}</div>
      <span class="si-price">${price}</span>
    </div>`;
  }

  recipeCost(r) {
    return Object.entries(r.in).map(([k, n]) => `${MATERIALS[k]?.icon || k}${n}`).join(" ");
  }

  renderPanelShop() {
    const s = this.g.state;
    return WEAPONS.map((w) => {
      const l = this.g.lv(s.weapons, w.id);
      const mx = w.max && l >= w.max;
      return this.row(w.icon, w.name, w.desc, mx ? "MAX" : fmt(cost(w, l)) + "₽", !mx && s.coins < cost(w, l), "weapon", w.id);
    }).join("");
  }

  renderPanelCrew() {
    const s = this.g.state;
    return CREW.map((c) => {
      const l = this.g.lv(s.crew, c.id);
      return this.row(c.icon, c.name, c.desc, fmt(cost(c, l)) + "₽", s.coins < cost(c, l), "crew", c.id);
    }).join("");
  }

  renderPanelMap() {
    const s = this.g.state;
    const z = this.g.zone();
    const showAct = hasUnlock(s, "activities");
    const act = this.g.zoneActivities();
    const cd = s.activityCd || 0;

    let html = `<div class="world-map">${ZONES.map((zone, i) => {
      const can = this.g.canTravel(i);
      const cls = i === s.zoneIdx ? "current" : can ? "done" : "locked";
      return `<button type="button" class="map-node ${cls}" data-zone="${i}">
        <span class="mn-ico">${zone.icon}</span>
        <span class="mn-name">${zone.name}</span>
      </button>`;
    }).join("")}</div>`;

    html += `<div class="zone-info"><b>${z.icon} ${z.name}</b> — ${z.desc}<br>
      Бонусы: урон x${this.g.zoneBonus("dmg").toFixed(2)}, бабки x${this.g.zoneBonus("coin").toFixed(2)}</div>`;

    html += `<div class="section-title">Ресурсы</div>`;
    html += `<div class="materials-grid">${Object.entries(MATERIALS).map(([k, m]) => {
      const n = s.materials[k] || 0;
      return `<span class="mat-chip ${n ? "" : "zero"}">${m.icon} ${n}</span>`;
    }).join("")}</div>`;

    if (showAct) {
      html += `<div class="section-title">Дела в зоне</div><div class="activity-bar">`;
      const btns = [];
      if (act.gather) btns.push({ id: "gather", label: act.gatherName || "Собрать", icon: MATERIALS[act.gather]?.icon || "📦" });
      if (act.fish) btns.push({ id: "fish", label: "Рыбачить", icon: "🎣" });
      if (act.rest) btns.push({ id: "rest", label: act.restName || "Отдых", icon: "🧖" });
      html += btns.map((b) =>
        `<button type="button" class="act-btn" data-act="${b.id}" ${cd > 0 ? "disabled" : ""}>
          ${b.icon} ${b.label}${cd > 0 ? ` (${Math.ceil(cd)}с)` : ""}
        </button>`
      ).join("");
      html += `</div>`;
    }

    return html;
  }

  renderPanelCraft() {
    const s = this.g.state;
    const craftLv = this.g.masteryLv("craft");
    let html = `<p class="shop-note">Крафт ур. <b>${craftLv}</b>. Собирай ресурсы на карте.</p>`;
    html += RECIPES.map((r) => {
      const out = ITEMS[r.out];
      const ok = this.g.canCraft(r.id);
      const needLv = craftLv < r.craftLv;
      return this.row(r.icon, r.name, out?.desc || "", this.recipeCost(r), !ok, "craft", r.id,
        needLv ? `<br><small class="warn">Нужен крафт ур. ${r.craftLv}</small>` : "");
    }).join("");
    return html;
  }

  renderPanelGear() {
    const s = this.g.state;
    let html = `<div class="section-title">Надето</div>`;
    html += SLOTS.map(({ id, label }) => {
      const itemId = s.equip[id];
      const it = itemId ? ITEMS[itemId] : null;
      return `<div class="gear-slot">
        <b>${label}:</b> ${it ? `${it.icon} ${it.name}` : "пусто"}
        ${it ? `<br><small>${it.desc}</small><br><button type="button" class="btn-mini" data-unequip="${id}">Снять</button>` : ""}
      </div>`;
    }).join("");

    const owned = Object.entries(s.items).filter(([, n]) => n > 0);
    html += `<div class="section-title">Рюкзак</div>`;
    if (!owned.length) html += `<p class="shop-note">Пусто — скрафти на вкладке «Крафт».</p>`;
    html += owned.map(([id, n]) => {
      const it = ITEMS[id];
      if (!it) return "";
      return this.row(it.icon, `${it.name} x${n}`, it.desc, "Надеть", false, "equip", id);
    }).join("");

    html += `<div class="section-title">Мастерства</div>`;
    html += MASTERIES.map((m) => {
      const prog = masteryLevel(s.masteries[m.id] || 0);
      const pct = Math.floor((prog.rem / prog.need) * 100);
      return `<div class="mastery-row">
        ${m.icon} <b>${m.name}</b> ур.${prog.lv}
        <small>${m.desc}</small>
        <div class="meter-track"><div class="meter-fill meter-combo" style="width:${pct}%"></div></div>
      </div>`;
    }).join("");
    return html;
  }

  renderPanelMore() {
    const s = this.g.state;
    let html = `<p class="shop-note">Реликвии — пассивные множители.</p>`;
    html += RELICS.slice(0, 4).map((r) => {
      const l = this.g.lv(s.relics, r.id);
      return this.row(r.icon, r.name, r.desc, fmt(cost(r, l)) + "₽", s.coins < cost(r, l), "relics", r.id);
    }).join("");
    const gain = this.g.prestigeGain();
    html += `<button type="button" class="btn-big" id="do-prestige" ${this.g.canPrestige() ? "" : "disabled"}>
      Престиж (+${gain}★) — вечный бонус
    </button>`;
    return html;
  }

  renderPanelIdle() {
    const s = this.g.state;
  const clicksLeft = Math.max(0, 8 - s.clicks);
    if (!hasUnlock(s, "shop")) {
      return `<div class="panel-empty">
        <span class="pe-ico">👊</span>
        <p><b>Жми по жопе!</b></p>
        <p>Ещё ${clicksLeft} ударов — откроется магазин.</p>
      </div>`;
    }
    return `<div class="panel-empty">
      <span class="pe-ico">👈</span>
      <p>Выбери раздел слева.<br>Начни с «Удары» — качай силу.</p>
    </div>`;
  }

  renderPanel() {
    const s = this.g.state;
    let html = "";

    if (this.panel === "shop" && isDockOpen(s, "shop")) html = this.renderPanelShop();
    else if (this.panel === "crew" && isDockOpen(s, "crew")) html = this.renderPanelCrew();
    else if (this.panel === "map" && isDockOpen(s, "map")) html = this.renderPanelMap();
    else if (this.panel === "craft" && isDockOpen(s, "craft")) html = this.renderPanelCraft();
    else if (this.panel === "gear" && isDockOpen(s, "gear")) html = this.renderPanelGear();
    else if (this.panel === "more" && isDockOpen(s, "more")) html = this.renderPanelMore();
    else html = this.renderPanelIdle();

    this.el["panel-title"].textContent = PANEL_TITLES[this.panel] || PANEL_TITLES.idle;
    this.el["panel-content"].innerHTML = html;
    this.bindPanelEvents();
  }

  bindPanelEvents() {
    const root = this.el["panel-content"];

    root.querySelectorAll(".shop-item").forEach((el) => {
      el.onclick = () => {
        if (el.classList.contains("locked")) return;
        const { cat, id } = el.dataset;
        if (cat === "craft" && this.g.craft(id)) {
          this.toast(`Скрафтил: ${RECIPES.find((x) => x.id === id)?.name}!`);
          this.renderPanel();
          this.renderEquipMini();
        } else if (cat === "equip" && this.g.equipItem(id)) {
          this.toast(`Надел: ${ITEMS[id]?.name}`);
          this.renderPanel();
          this.renderEquipMini();
        } else if (this.g.buy(cat, id)) {
          this.toast("Куплено!");
          this.renderPanel();
          this.snd("buy");
        }
      };
    });

    root.querySelectorAll("[data-unequip]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        if (this.g.unequip(btn.dataset.unequip)) {
          this.renderPanel();
          this.renderEquipMini();
        }
      };
     });

    root.querySelectorAll(".map-node").forEach((btn) => {
      btn.onclick = () => {
        const idx = +btn.dataset.zone;
        if (this.g.travelTo(idx)) {
          this.toast(`${ZONES[idx].icon} ${ZONES[idx].name}`);
          this.renderPanel();
          this.updateCombat();
        }
      };
    });

    root.querySelectorAll(".act-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.act;
        if (id === "fish" && this.g.fish()) this.renderPanel();
        else if (id === "gather" && this.g.gather()) this.renderPanel();
        else if (id === "rest" && this.g.rest()) this.updateCombat();
      };
    });

    const pb = root.querySelector("#do-prestige");
    if (pb) pb.onclick = () => {
      if (this.g.doPrestige()) this.toast("Престиж! Мощнее навсегда.");
    };
  }

  showHelp() {
    this.el["modal-body"].innerHTML = `
      <h2>Арена Олегов</h2>
      <ol class="help-list">
        <li><b>Хуём в жопу</b> — основной удар. Жрёт «Силы» — не спамь.</li>
        <li><b>Братва</b> — бьёт сама (авто-DPS), ты тактически долбишь.</li>
        <li><b>Олег качается</b> — его ур. растёт с твоим. HP подстраивается.</li>
        <li><b>Злость олега</b> — заполнится → жми ОТБИТЬ или получишь.</li>
        <li><b>Мощный хуй</b> — x3 урон, перезарядка.</li>
        <li><b>x3 круги</b> — слабое место, тройной урон.</li>
      </ol>
      <p class="help-note">Не спеши — игра сама откроет механики.</p>
    `;
    this.el["modal-overlay"].classList.remove("hidden");
  }

  updateCombat() {
    const g = this.g;
    const s = g.state;
    const z = g.zone();
    const et = ENEMY_TYPES[s.enemyType];

    this.el.coins.textContent = fmt(s.coins);
    this.el["place-line"].textContent = `${z.name} · волна ${s.wave}`;
    this.el["enemy-badge"].textContent = et?.tag || "Олег";
    this.el["enemy-badge"].className = "enemy-type type-" + s.enemyType;
    this.el["enemy-level"].textContent = `ур. ${s.enemyLevel || 1}`;
    this.el["enemy-atk-display"].textContent = s.enemyAtk || 1;

    this.applySkin();
    this.el.stage.className = "stage " + z.bg;

    const hp = (s.enemyHp / s.enemyMaxHp) * 100;
    this.el["enemy-hp-fill"].style.width = hp + "%";
    this.el["enemy-hp-text"].textContent = `${fmt(s.enemyHp)} / ${fmt(s.enemyMaxHp)}`;

    if (s.enemyType === "boss" && s.bossTimer > 0) {
      this.el["boss-warn"].classList.remove("hidden");
      this.el["boss-timer"].textContent = Math.ceil(s.bossTimer);
    } else this.el["boss-warn"].classList.add("hidden");

    const showWeak = hasUnlock(s, "weak") && g.weakSpot && g.weakT > 0;
    this.el["weak-left"].classList.toggle("hidden", !showWeak || g.weakSpot !== "left");
    this.el["weak-right"].classList.toggle("hidden", !showWeak || g.weakSpot !== "right");
    this.el["parry-prompt"].classList.toggle("hidden", !g.parryActive);

    const comboPct = hasUnlock(s, "combo") ? Math.min(100, g.combo) : 0;
    this.el["combo-fill"].style.width = comboPct + "%";
    this.el["combo-mult"].textContent = "x" + g.comboMult().toFixed(1);
    this.el["heat-fill"].style.width = g.heat + "%";
    this.el["stamina-fill"].style.width = g.stamina + "%";

    const showRage = hasUnlock(s, "counter");
    this.el["oleg-rage-wrap"].classList.toggle("hidden", !showRage);
    if (showRage) this.el["oleg-rage-fill"].style.width = g.olegRage + "%";

    const showHeavy = hasUnlock(s, "heavy");
    const hb = this.el["heavy-strike"];
    if (hb) {
      hb.classList.toggle("hidden", !showHeavy);
      hb.disabled = g.heavyCd > 0 || g.stamina < 22;
      hb.textContent = g.heavyCd > 0 ? `💥 ${Math.ceil(g.heavyCd)}с` : "💥 Мощный хуй";
    }

    this.el["dpc-display"].textContent = fmt(g.clickDamage());
    this.el["dps-display"].textContent = fmt(g.autoDps());

    this.el["player-level"].textContent = s.level;
    this.el["xp-fill"].style.width = (s.xp / g.xpNeed()) * 100 + "%";

    this.renderEquipMini();
    this.renderSkills();
    this.renderObjective();
  }

  update(full = false) {
    this.updateCombat();
    if (full) {
      this.renderDock();
      this.renderPanel();
    }
  }

  init() {
    if (hasUnlock(this.g.state, "shop")) this.panel = "shop";
    this.renderDock();
    this.renderPanel();
    this.updateCombat();
    setInterval(() => {
      if (!this.g.state.event?.msg) {
        this.el["event-ticker"].textContent = SIMPLE_TIPS[Math.floor(Math.random() * SIMPLE_TIPS.length)];
      }
    }, 14000);
  }
}
