import {
  WEAPONS, CREW, ELEMENT_UPGRADES, RELICS, RESEARCH, SKILLS,
  ARTIFACTS, CONSUMABLES, CHALLENGES, TALENTS, ACHIEVEMENTS, ZONES,
  ELEMENTS, MUTATORS, ENEMY_TYPES, cost, fmt,
} from "./data.js";

export class UI {
  constructor(game) {
    this.g = game;
    this.tab = "weapon";
    this.$ = (id) => document.getElementById(id);
    this.cache();
    this.bind();
  }

  cache() {
    const ids = [
      "coins", "prestige", "souls", "essence", "zone-label",
      "rage-fill", "rage-val", "over-fill", "over-val", "heat-fill", "heat-val",
      "kill-streak", "streak-mult", "mutator-text", "artifact-slots", "buff-list",
      "consumables", "enemy-badge", "enemy-name", "phase-dots", "boss-hp-block",
      "boss-timer", "enemy-hp-text", "enemy-hp-fill", "shield-wrap", "shield-fill",
      "weak-left", "weak-right", "parry-prompt", "oleg-char", "click-target",
      "combo-fill", "combo-mult", "combo-count", "skills-dock",
      "dpc-display", "dps-display", "crit-display", "element-display",
      "player-level", "xp-fill", "xp-current", "xp-max", "shop-content",
      "event-ticker", "challenge-bar", "map-strip", "modal-overlay", "modal-body", "toasts",
    ];
    this.el = {};
    ids.forEach((id) => { this.el[id] = this.$(id); });
  }

  bind() {
    this.el["click-target"].addEventListener("click", (e) => {
      if (e.target.closest(".weak-spot")) return;
      const r = this.g.click();
      this.fx(e, r);
    });

    ["weak-left", "weak-right"].forEach((id) => {
      this.el[id].addEventListener("click", (e) => {
        e.stopPropagation();
        const side = id.includes("left") ? "left" : "right";
        const r = this.g.weakClick(side);
        this.fx(e, r);
      });
    });

    this.el["parry-prompt"].addEventListener("click", () => {
      if (this.g.parry()) this.toast("ПАРРИ! Контрудар!");
    });

    document.querySelectorAll(".shop-tabs .tab").forEach((t) => {
      t.addEventListener("click", () => {
        document.querySelectorAll(".shop-tabs .tab").forEach((x) => x.classList.remove("active"));
        t.classList.add("active");
        this.tab = t.dataset.tab;
        this.renderShop();
      });
    });

    this.$("btn-achievements").onclick = () => this.modalAchievements();
    this.$("btn-settings").onclick = () => this.modalSettings();
    this.$("btn-challenges").onclick = () => this.modalChallenges();
    this.$("btn-map").onclick = () => this.modalMap();
    this.$("modal-close").onclick = () => this.el["modal-overlay"].classList.add("hidden");
    this.el["modal-overlay"].onclick = (e) => {
      if (e.target === this.el["modal-overlay"]) this.el["modal-overlay"].classList.add("hidden");
    };
  }

  fx(e, { dmg, crit, weak }) {
    const ch = this.el["oleg-char"];
    ch.classList.remove("hit", "crit-hit");
    void ch.offsetWidth;
    ch.classList.add(crit ? "crit-hit" : "hit");

    const x = e.clientX ?? window.innerWidth / 2;
    const y = e.clientY ?? window.innerHeight / 2;
    this.float(x, y, dmg, crit, weak);
    if (this.g.state.settings.fx) this.burst(x, y, crit || weak);
    if (this.g.state.settings.sound) this.snd(crit ? "crit" : "hit");
  }

  float(x, y, dmg, crit, weak) {
    const d = document.createElement("div");
    d.className = "float-dmg" + (crit ? " crit" : weak ? " weak" : "");
    if (this.g.overdrive >= 100) d.classList.add("over");
    d.textContent = (weak ? "СЛАБОЕ! " : crit ? "КРИТ! " : "") + fmt(dmg);
    d.style.left = x + "px";
    d.style.top = y + "px";
    document.getElementById("fx-layer").appendChild(d);
    setTimeout(() => d.remove(), 750);
  }

  burst(x, y, big) {
    const layer = document.getElementById("fx-layer");
    const n = big ? 10 : 5;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.textContent = ["✦", "●", "▲", "■"][i % 4];
      p.style.cssText = `position:fixed;left:${x}px;top:${y}px;color:var(--lime);font-size:${8 + Math.random() * 12}px;pointer-events:none;animation:floatUp .5s ease-out forwards;transform:translate(${(Math.random()-.5)*80}px,${(Math.random()-.5)*50}px)`;
      layer.appendChild(p);
      setTimeout(() => p.remove(), 500);
    }
  }

  toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    this.el.toasts.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  snd(type) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      const f = { hit: 160, crit: 320, buy: 480, skill: 260, level: 520 };
      o.frequency.value = f[type] || 200;
      o.type = type === "crit" ? "square" : "triangle";
      g.gain.setValueAtTime(0.07, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      o.start(); o.stop(ctx.currentTime + 0.12);
    } catch { /* */ }
  }

  renderShop() {
    const g = this.g;
    const s = g.state;
    let html = "";

    const row = (ico, name, desc, costTxt, lv, max, cat, id, locked) => `
      <div class="upgrade-row ${locked ? "locked" : ""} ${max ? "maxed" : ""}" data-cat="${cat}" data-id="${id}">
        <div class="ico">${ico}</div>
        <div><h4>${name}</h4><p>${desc}</p><span class="lv">ур. ${lv}${max ? `/${max}` : ""}</span></div>
        <div class="cost">${costTxt}</div>
      </div>`;

    if (this.tab === "weapon") {
      html = WEAPONS.map((w) => {
        const l = g.lv(s.weapons, w.id);
        const mx = w.max && l >= w.max;
        return row(w.icon, w.name, w.desc, mx ? "MAX" : fmt(cost(w, l)) + "₽", l, w.max, "weapon", w.id, s.coins < cost(w, l) && !mx);
      }).join("");
    } else if (this.tab === "crew") {
      html = CREW.map((c) => {
        const l = g.lv(s.crew, c.id);
        return row(c.icon, c.name, c.desc + ` · DPS ${fmt(c.dps(l))}`, fmt(cost(c, l)) + "₽", l, null, "crew", c.id, s.coins < cost(c, l));
      }).join("");
    } else if (this.tab === "elements") {
      html = ELEMENT_UPGRADES.map((e) => {
        const l = g.lv(s.elements, e.id);
        const mx = e.max && l >= e.max;
        return row(e.icon, e.name, e.desc, mx ? "MAX" : fmt(cost(e, l)) + "₽", l, e.max, "elements", e.id, s.coins < cost(e, l) && !mx);
      }).join("");
    } else if (this.tab === "relics") {
      html = RELICS.map((r) => {
        const l = g.lv(s.relics, r.id);
        const mx = r.max && l >= r.max;
        return row(r.icon, r.name, r.desc, mx ? "MAX" : fmt(cost(r, l)) + "₽", l, r.max, "relics", r.id, s.coins < cost(r, l) && !mx);
      }).join("");
    } else if (this.tab === "research") {
      html = RESEARCH.map((r) => {
        const l = g.lv(s.research, r.id);
        const p = r.costEss(l);
        return row(r.icon, r.name, r.desc, fmt(p) + " ⚗", l, null, "research", r.id, s.essence < p);
      }).join("");
    } else if (this.tab === "prestige") {
      const gain = g.prestigeGain();
      html = `
        <p class="muted" style="margin-bottom:8px">Сброс прогресса → <strong>${gain}</strong> ★ и души. +6% урон за ★.</p>
        <button class="btn-big" id="do-prestige" ${g.canPrestige() ? "" : "disabled"}>ПРЕСТИЖ (+${gain})</button>
        <div class="talent-grid" id="talent-grid"></div>`;
    }

    this.el["shop-content"].innerHTML = html;

    this.el["shop-content"].querySelectorAll(".upgrade-row[data-id]").forEach((el) => {
      el.onclick = () => {
        const { cat, id } = el.dataset;
        const ok = cat === "research" ? g.buyResearch(id) : g.buy(cat, id);
        if (ok) { this.renderShop(); this.snd("buy"); }
      };
    });

    const pb = document.getElementById("do-prestige");
    if (pb) pb.onclick = () => { if (g.doPrestige()) { this.toast("Престиж!"); this.renderShop(); } };

    const tg = document.getElementById("talent-grid");
    if (tg) {
      tg.innerHTML = TALENTS.map((t) => {
        const owned = s.talents.includes(t.id);
        return `<div class="talent ${owned ? "owned" : s.souls < t.cost ? "locked" : ""}" data-t="${t.id}">${t.name}<br><small>${t.cost}👻</small></div>`;
      }).join("");
      tg.querySelectorAll(".talent:not(.owned)").forEach((el) => {
        el.onclick = () => { if (g.buyTalent(el.dataset.t)) { this.renderShop(); this.toast("Талант!"); } };
      });
    }
  }

  renderSkills() {
    this.el["skills-dock"].innerHTML = SKILLS.map((sk) => {
      const cd = this.g.state.skillCd[sk.id] || 0;
      const on = this.g.state.buffs[sk.id] || this.g.state.buffs[sk.id === "slap" ? "slap" : sk.id];
      return `<button class="skill-btn ${on ? "active" : ""}" data-sk="${sk.id}" title="${sk.name}: ${sk.desc}" ${cd > 0 ? "disabled" : ""}>
        ${sk.icon}${cd > 0 ? `<span class="cd">${Math.ceil(cd)}</span>` : ""}
      </button>`;
    }).join("");

    this.el["skills-dock"].querySelectorAll(".skill-btn").forEach((b) => {
      b.onclick = () => {
        if (this.g.useSkill(b.dataset.sk)) {
          this.toast(SKILLS.find((x) => x.id === b.dataset.sk).name);
          this.snd("skill");
          this.renderSkills();
        }
      };
    });
  }

  renderArtifacts() {
    this.el["artifact-slots"].innerHTML = this.g.state.artifacts.map((id, i) => {
      const a = id ? ARTIFACTS.find((x) => x.id === id) : null;
      return `<div class="art-slot ${a ? "filled" : ""}" data-slot="${i}" title="${a?.name || "Пусто"}">${a?.icon || "+"}${a ? `<span class="rarity">${a.rarity}</span>` : ""}</div>`;
    }).join("");
  }

  renderConsumables() {
    const inv = this.g.state.inventory;
    const keys = Object.keys(CONSUMABLES);
    if (!keys.some((k) => inv[k])) {
      this.el.consumables.innerHTML = '<span class="muted">Пусто — бей Олега!</span>';
      return;
    }
    this.el.consumables.innerHTML = keys.filter((k) => inv[k]).map((k) => {
      const c = CONSUMABLES[k];
      return `<div class="consumable" data-c="${k}" title="${c.desc}">${c.icon}<span class="count">${inv[k]}</span></div>`;
    }).join("");
    this.el.consumables.querySelectorAll(".consumable").forEach((el) => {
      el.onclick = () => {
        if (this.g.useConsumable(el.dataset.c)) {
          this.toast(CONSUMABLES[el.dataset.c].name);
          this.renderConsumables();
        }
      };
    });
  }

  renderBuffs() {
    const b = this.g.state.buffs;
    const ev = this.g.state.event;
    const items = [];
    for (const [k, v] of Object.entries(b)) {
      if (v > 0) items.push(`<li><span>${k}</span><span>${Math.ceil(v)}с</span></li>`);
    }
    if (ev) items.push(`<li><span>${ev.msg || ev.id}</span><span>${Math.ceil(this.g.state.eventT)}с</span></li>`);
    if (this.g.overdrive >= 100) items.push(`<li><span>ОВЕРДРАЙВ</span><span>x2.5</span></li>`);
    if (this.g.rage >= 100) items.push(`<li><span>БЕРСЕРК</span><span>активен</span></li>`);
    this.el["buff-list"].innerHTML = items.length ? items.join("") : '<li class="muted">—</li>';
  }

  renderMap() {
    this.el["map-strip"].innerHTML = ZONES.map((z, i) => {
      const cls = i === this.g.state.zoneIdx ? "current" : this.g.state.unlockedZones.includes(i) ? "done" : "";
      return `<div class="map-node ${cls}">${z.name}</div>`;
    }).join("");
  }

  update() {
    const g = this.g;
    const s = g.state;
    const z = g.zone();

    this.el.coins.textContent = fmt(s.coins);
    this.el.prestige.textContent = fmt(s.prestigePts);
    this.el.souls.textContent = fmt(s.souls);
    this.el.essence.textContent = fmt(s.essence);
    this.el["zone-label"].textContent = `${z.name} · Волна ${s.wave}`;

    this.el["rage-fill"].style.width = g.rage + "%";
    this.el["rage-val"].textContent = Math.floor(g.rage) + "%";
    this.el["over-fill"].style.width = g.overdrive + "%";
    this.el["over-val"].textContent = Math.floor(g.overdrive) + "%";
    this.el["heat-fill"].style.width = g.heat + "%";
    this.el["heat-val"].textContent = Math.floor(g.heat) + "%";

    this.el["kill-streak"].textContent = g.killStreak;
    this.el["streak-mult"].textContent = g.streakMult().toFixed(2);
    this.el["mutator-text"].textContent = s.mutator ? `${s.mutator.name}: ${s.mutator.desc}` : "—";

    const et = s.enemyType;
    const badge = this.el["enemy-badge"];
    badge.textContent = ENEMY_TYPES[et]?.tag || "ОБЫЧНЫЙ";
    badge.className = "enemy-badge " + (et === "boss" ? "boss" : et === "elite" ? "elite" : et === "mini" ? "mini" : "");

    const names = ["Олег", "Олег-младший", "Олег из соседнего подъезда", "Олег-гигант"];
    this.el["enemy-name"].textContent = et === "boss" ? "МЕГА-ОЛЕГ" : et === "mini" ? "МИНИ-ОЛЕГ" : names[s.wave % names.length];

    const hpPct = (s.enemyHp / s.enemyMaxHp) * 100;
    this.el["enemy-hp-fill"].style.width = hpPct + "%";
    this.el["enemy-hp-text"].textContent = `${fmt(s.enemyHp)} / ${fmt(s.enemyMaxHp)}`;

    if (s.enemyShield > 0) {
      this.el["shield-wrap"].classList.remove("hidden");
      this.el["shield-fill"].style.width = (s.enemyShield / (s.enemyMaxHp * 0.25)) * 100 + "%";
    } else this.el["shield-wrap"].classList.add("hidden");

    if (et === "boss" && s.bossTimer > 0) {
      this.el["boss-hp-block"].classList.remove("hidden");
      this.el["boss-timer"].textContent = Math.ceil(s.bossTimer);
    } else this.el["boss-hp-block"].classList.add("hidden");

    if (et === "boss") {
      this.el["phase-dots"].innerHTML = [1, 2, 3].map((p) =>
        `<span class="phase-dot ${p < s.bossPhase ? "done" : p === s.bossPhase ? "active" : ""}"></span>`
      ).join("");
    } else this.el["phase-dots"].innerHTML = "";

    const showWeak = g.weakSpot && g.weakT > 0;
    this.el["weak-left"].classList.toggle("hidden", !showWeak || g.weakSpot !== "left");
    this.el["weak-right"].classList.toggle("hidden", !showWeak || g.weakSpot !== "right");

    this.el["parry-prompt"].classList.toggle("hidden", !g.parryActive);

    this.el["combo-fill"].style.width = Math.min(100, g.combo / 1.2) + "%";
    this.el["combo-mult"].textContent = "x" + g.comboMult().toFixed(2);
    this.el["combo-count"].textContent = g.combo;

    this.el["dpc-display"].textContent = fmt(g.clickDamage());
    this.el["dps-display"].textContent = fmt(g.autoDps());
    this.el["crit-display"].textContent = (g.critChance() * 100).toFixed(1) + "%";
    const el = ELEMENTS[s.enemyElement];
    this.el["element-display"].textContent = el?.name || "—";
    this.el["element-display"].style.color = el?.color || "";

    this.el["player-level"].textContent = s.level;
    const need = g.xpNeed();
    this.el["xp-fill"].style.width = (s.xp / need) * 100 + "%";
    this.el["xp-current"].textContent = fmt(s.xp);
    this.el["xp-max"].textContent = fmt(need);

    const ch = CHALLENGES.find((c) => c.id === s.challenge);
    this.el["challenge-bar"].textContent = ch ? `🎯 ${ch.text} (+${ch.reward}₽)` : "";

    if (s.event?.msg) this.el["event-ticker"].textContent = s.event.msg;

    this.renderSkills();
    this.renderArtifacts();
    this.renderConsumables();
    this.renderBuffs();
    this.renderMap();
  }

  init() {
    this.renderShop();
    this.update();
  }

  modal(html) {
    this.el["modal-body"].innerHTML = html;
    this.el["modal-overlay"].classList.remove("hidden");
  }

  modalAchievements() {
    const s = this.g.state;
    this.modal(`<h2>Достижения</h2>` + ACHIEVEMENTS.map((a) => {
      const ok = s.achievements.includes(a.id) || a.ok(s);
      return `<div class="upgrade-row ${ok ? "" : "locked"}"><div class="ico">${a.icon}</div><div><h4>${a.name}</h4><p>${a.desc}</p></div></div>`;
    }).join(""));
  }

  modalChallenges() {
    this.modal(`<h2>Челленджи</h2><p class="muted">Меняются после выполнения. Текущий — внизу экрана.</p>` +
      CHALLENGES.map((c) => `<div class="upgrade-row"><div class="ico">🎯</div><div><h4>${c.text}</h4><p>+${c.reward}₽</p></div></div>`).join(""));
  }

  modalMap() {
    this.modal(`<h2>Карта зон</h2>` + ZONES.map((z, i) =>
      `<div class="upgrade-row ${this.g.state.unlockedZones.includes(i) ? "" : "locked"}"><div class="ico">📍</div><div><h4>${z.name}</h4><p>Открытие: волна ${z.unlock}</p></div></div>`
    ).join(""));
  }

  modalSettings() {
    const st = this.g.state.settings;
    this.modal(`
      <h2>Настройки</h2>
      <div class="setting-row" style="display:flex;justify-content:space-between;padding:8px 0">
        <label>Звук</label><input type="checkbox" id="st-snd" ${st.sound ? "checked" : ""}/>
      </div>
      <div class="setting-row" style="display:flex;justify-content:space-between;padding:8px 0">
        <label>Эффекты</label><input type="checkbox" id="st-fx" ${st.fx ? "checked" : ""}/>
      </div>
      <button class="btn-big" id="st-export">Экспорт сейва</button>
      <button class="btn-big" id="st-reset" style="margin-top:8px;background:var(--red);color:#fff">Сброс</button>
    `);
    this.$("st-snd").onchange = (e) => { st.sound = e.target.checked; };
    this.$("st-fx").onchange = (e) => { st.fx = e.target.checked; };
    this.$("st-export").onclick = () => import("./save.js").then(({ exportSave }) => {
      navigator.clipboard?.writeText(exportSave(this.g.state));
      this.toast("Скопировано");
    });
    this.$("st-reset").onclick = () => {
      if (confirm("Сбросить всё?")) import("./save.js").then(({ resetSave }) => {
        Object.assign(this.g.state, resetSave());
        this.g.spawnEnemy();
        this.el["modal-overlay"].classList.add("hidden");
        this.update();
      });
    };
  }
}
