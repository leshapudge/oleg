import {
  WEAPONS, CREW, RELICS, SKILLS, OLEG_SKINS, ENEMY_TYPES,
  ZONES, SIMPLE_TIPS, cost, fmt,
} from "./data.js";
import {
  MATERIALS, ITEMS, RECIPES, MASTERIES, masteryLevel,
} from "./rpg-data.js";
import { buildOlegSvg, playHitAnim } from "./sprites.js";

const HIT_WORDS = ["БАХ!", "ПЛЮХ!", "ХРЯСЬ!", "ЕБАШ!", "В ЖОПУ!", "ОЙ-ой!"];
const CRIT_WORDS = ["ПИЗДЕЦ!", "РАЗЪЁБ!", "НАХУЙ!", "КРИТ, БЛЯ!"];
const WEAK_WORDS = ["В ЯБЛОЧКО!", "ТРИПЛ!", "ПОПАЛ!"];
const SLOTS = [
  { id: "weapon", label: "Оружие" },
  { id: "armor", label: "Броня" },
  { id: "tool", label: "Инструмент" },
  { id: "trinket", label: "Талисман" },
];

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
      "coins", "place-line", "zone-map", "zone-desc", "zone-progress-text",
      "materials-strip", "equip-strip", "activity-bar", "stage",
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
      const can = this.g.canTravel(i);
      const cls = i === s.zoneIdx ? "current" : can ? "done" : "locked";
      return `<button type="button" class="map-node ${cls}" data-zone="${i}" title="${zone.desc}">
        <span class="mn-ico">${zone.icon}</span>
        <span class="mn-name">${zone.name}</span>
      </button>`;
    }).join("");

    this.el["zone-map"].querySelectorAll(".map-node").forEach((btn) => {
      btn.onclick = () => {
        const idx = +btn.dataset.zone;
        if (this.g.travelTo(idx)) this.update(); else if (!this.g.canTravel(idx)) {
          this.toast(`Нужен ур. ${ZONES[idx].unlockLv}`);
        }
      };
    });

    this.el["zone-desc"].textContent = `${z.icon} ${z.name} — ${z.desc}`;
    this.el["zone-progress-text"].textContent = `Урон x${this.g.zoneBonus("dmg").toFixed(2)} · бабки x${this.g.zoneBonus("coin").toFixed(2)}`;
    this.el.stage.className = "stage " + z.bg;
  }

  renderMaterials() {
    const mats = this.g.state.materials;
    this.el["materials-strip"].innerHTML = Object.entries(MATERIALS).map(([k, m]) => {
      const n = mats[k] || 0;
      return `<span class="mat-chip" title="${m.name}">${m.icon} ${n}</span>`;
    }).join("");
  }

  renderEquipStrip() {
    const eq = this.g.state.equip;
    this.el["equip-strip"].innerHTML = SLOTS.map(({ id, label }) => {
      const itemId = eq[id];
      const it = itemId ? ITEMS[itemId] : null;
      return `<span class="eq-slot" title="${label}">
        <small>${label}</small>
        ${it ? `${it.icon} ${it.name}` : "—"}
      </span>`;
    }).join("");
  }

  renderActivities() {
    const act = this.g.zoneActivities();
    const cd = this.g.state.activityCd || 0;
    const btns = [];

    if (act.gather) {
      btns.push({ id: "gather", label: act.gatherName || "Собрать", icon: MATERIALS[act.gather]?.icon || "📦" });
    }
    if (act.fish) btns.push({ id: "fish", label: "Рыбачить", icon: "🎣" });
    if (act.rest) btns.push({ id: "rest", label: act.restName || "Отдых", icon: "🧖" });
    if (act.craft) btns.push({ id: "craft-tab", label: "Крафт", icon: "🔨" });

    this.el["activity-bar"].innerHTML = btns.map((b) =>
      `<button type="button" class="act-btn" data-act="${b.id}" ${cd > 0 && b.id !== "craft-tab" ? "disabled" : ""}>
        ${b.icon} ${b.label}${cd > 0 && b.id !== "craft-tab" ? ` (${Math.ceil(cd)}с)` : ""}
      </button>`
    ).join("");

    this.el["activity-bar"].querySelectorAll(".act-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.act;
        if (id === "craft-tab") {
          document.querySelector('.tab[data-tab="craft"]')?.click();
          return;
        }
        if (id === "fish") {
          if (this.g.fish()) this.update();
        } else if (id === "gather") {
          if (this.g.gather()) this.update();
        } else if (id === "rest") {
          if (this.g.rest()) this.update();
        }
      };
    });
  }

  recipeCost(r) {
    return Object.entries(r.in).map(([k, n]) => `${MATERIALS[k]?.icon || k}${n}`).join(" ");
  }

  renderShop() {
    const s = this.g.state;
    let html = "";

    const row = (ico, name, desc, price, locked, cat, id, extra = "") => `
      <div class="shop-item ${locked ? "locked" : ""}" data-cat="${cat}" data-id="${id}">
        <span class="si-ico">${ico}</span>
        <div><b>${name}</b><br><small>${desc}</small>${extra}</div>
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
    } else if (this.tab === "craft") {
      const craftLv = this.g.masteryLv("craft");
      html = `<p class="shop-note">Крафт ур. ${craftLv}. Убивай, собирай, рыбачь — качай мастерство.</p>`;
      html += RECIPES.map((r) => {
        const out = ITEMS[r.out];
        const ok = this.g.canCraft(r.id);
        const needLv = craftLv < r.craftLv;
        return row(
          r.icon, r.name, out?.desc || "",
          this.recipeCost(r),
          !ok,
          "craft", r.id,
          needLv ? `<br><small class="warn">Нужен крафт ур. ${r.craftLv}</small>` : ""
        );
      }).join("");
    } else if (this.tab === "gear") {
      html = `<p class="shop-note">Надето:</p>`;
      html += SLOTS.map(({ id, label }) => {
        const itemId = s.equip[id];
        const it = itemId ? ITEMS[itemId] : null;
        return `<div class="gear-slot">
          <b>${label}:</b> ${it ? `${it.icon} ${it.name} — ${it.desc}` : "пусто"}
          ${it ? `<button type="button" class="btn-mini" data-unequip="${id}">Снять</button>` : ""}
        </div>`;
      }).join("");

      const owned = Object.entries(s.items).filter(([, n]) => n > 0);
      html += `<p class="shop-note">Рюкзак:</p>`;
      if (!owned.length) html += `<p class="shop-note">Пусто — крафти на вкладке «Крафт».</p>`;
      html += owned.map(([id, n]) => {
        const it = ITEMS[id];
        if (!it) return "";
        return row(it.icon, `${it.name} x${n}`, it.desc, "Надеть", false, "equip", id);
      }).join("");

      html += `<p class="shop-note">Мастерства:</p>`;
      html += MASTERIES.map((m) => {
        const prog = masteryLevel(s.masteries[m.id] || 0);
        const pct = Math.floor((prog.rem / prog.need) * 100);
        return `<div class="mastery-row">
          <span>${m.icon} <b>${m.name}</b> ур.${prog.lv}</span>
          <small>${m.desc}</small>
          <div class="xp-bar"><div class="xp-fill" style="width:${pct}%"></div></div>
        </div>`;
      }).join("");
    } else {
      html = `<p class="shop-note">Престиж и реликвии.</p>`;
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
        const cat = el.dataset.cat;
        const id = el.dataset.id;
        if (cat === "craft") {
          if (this.g.craft(id)) {
            this.toast(`Скрафтил: ${RECIPES.find((x) => x.id === id)?.name}!`);
            this.renderShop();
            this.renderMaterials();
          }
        } else if (cat === "equip") {
          if (this.g.equipItem(id)) {
            this.toast(`Надел: ${ITEMS[id]?.name}`);
            this.renderShop();
            this.renderEquipStrip();
          }
        } else if (this.g.buy(cat, id)) {
          this.renderShop();
          this.toast("Куплено! Ебашь дальше.");
          this.snd("buy");
        }
      };
    });
    this.el["shop-content"].querySelectorAll("[data-unequip]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        if (this.g.unequip(btn.dataset.unequip)) {
          this.toast("Снял.");
          this.renderShop();
          this.renderEquipStrip();
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
      <h2>Как играть</h2>
      <ol class="help-list">
        <li><b>Жми по жопе</b> — бабки и опыт ебашки.</li>
        <li><b>Карта сверху</b> — жми локацию, ходи куда хочешь.</li>
        <li><b>Кнопки активностей</b> — руби дерево, рыбачь, парься.</li>
        <li><b>Крафт</b> — собирай ресурсы, делай оружие и броню.</li>
        <li><b>Шмот</b> — надеваешь, качаешь мастерства.</li>
        <li><b>Хуй / Братва</b> — классические апгрейды за бабки.</li>
      </ol>
      <p class="help-note">Сначала собери дерево → дубина → ебашь сильнее.</p>
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
    this.renderMaterials();
    this.renderEquipStrip();
    this.renderActivities();

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
