import {
  WEAPON_UPGRADES,
  HELPERS,
  RELICS,
  SKILLS,
  ACHIEVEMENTS,
  TALENTS,
  TIPS,
  upgradeCost,
  formatNum,
} from "./data.js";

export class UIManager {
  constructor(game) {
    this.game = game;
    this.activeTab = "weapon";
    this.$ = (id) => document.getElementById(id);
    this.bindElements();
    this.bindEvents();
  }

  bindElements() {
    this.els = {
      coins: this.$("coins"),
      prestige: this.$("prestige"),
      souls: this.$("souls"),
      playerLevel: this.$("player-level"),
      xpFill: this.$("xp-fill"),
      xpCurrent: this.$("xp-current"),
      xpMax: this.$("xp-max"),
      waveNum: this.$("wave-num"),
      waveName: this.$("wave-name"),
      bossTimerWrap: this.$("boss-timer-wrap"),
      bossTimer: this.$("boss-timer"),
      statList: this.$("stat-list"),
      comboFill: this.$("combo-fill"),
      comboMult: this.$("combo-mult"),
      comboCount: this.$("combo-count"),
      enemyTag: this.$("enemy-tag"),
      enemyName: this.$("enemy-name"),
      enemyHpText: this.$("enemy-hp-text"),
      enemyHpFill: this.$("enemy-hp-fill"),
      clickTarget: this.$("click-target"),
      ollegSprite: this.$("olleg-sprite"),
      skillsBar: this.$("skills-bar"),
      dpcDisplay: this.$("dpc-display"),
      dpsDisplay: this.$("dps-display"),
      critDisplay: this.$("crit-display"),
      shopContent: this.$("shop-content"),
      footerTip: this.$("footer-tip"),
      eventBanner: this.$("event-banner"),
      btnPrestigeQuick: this.$("btn-prestige-quick"),
      modalOverlay: this.$("modal-overlay"),
      modalBody: this.$("modal-body"),
      toasts: this.$("toasts"),
    };
  }

  bindEvents() {
    this.els.clickTarget.addEventListener("click", (e) => {
      const result = this.game.click();
      this.onClickVisual(e, result);
    });

    document.querySelectorAll(".shop-tabs .tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".shop-tabs .tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this.activeTab = tab.dataset.tab;
        this.renderShop();
      });
    });

    this.$("btn-stats").addEventListener("click", () => this.showStatsModal());
    this.$("btn-achievements").addEventListener("click", () => this.showAchievementsModal());
    this.$("btn-settings").addEventListener("click", () => this.showSettingsModal());
    this.$("modal-close").addEventListener("click", () => this.closeModal());
    this.els.modalOverlay.addEventListener("click", (e) => {
      if (e.target === this.els.modalOverlay) this.closeModal();
    });

    this.els.btnPrestigeQuick.addEventListener("click", () => {
      this.activeTab = "prestige";
      document.querySelector('[data-tab="prestige"]')?.click();
    });
  }

  onClickVisual(e, { dmg, crit }) {
    const sprite = this.els.ollegSprite;
    sprite.classList.remove("hit");
    void sprite.offsetWidth;
    sprite.classList.add("hit");

    this.spawnFloatDamage(e.clientX, e.clientY, dmg, crit);
    if (this.game.state.settings.particles) this.spawnParticles(e.clientX, e.clientY);
  }

  spawnFloatDamage(x, y, dmg, crit) {
    const el = document.createElement("div");
    el.className = "float-dmg" + (crit ? " crit" : "");
    el.textContent = (crit ? "КРИТ! " : "") + formatNum(dmg);
    el.style.left = x + "px";
    el.style.top = y + "px";
    if (!crit) el.style.color = "#ff6b9d";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  spawnParticles(x, y) {
    const container = document.getElementById("particles");
    const emojis = ["💥", "✨", "🍑", "⭐", "💢"];
    for (let i = 0; i < 5; i++) {
      const p = document.createElement("span");
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      p.style.cssText = `
        position:fixed;left:${x}px;top:${y}px;font-size:${12 + Math.random() * 16}px;
        pointer-events:none;z-index:1001;
        animation: floatUp 0.6s ease-out forwards;
        transform: translate(${(Math.random() - 0.5) * 60}px, ${(Math.random() - 0.5) * 40}px);
      `;
      container.appendChild(p);
      setTimeout(() => p.remove(), 600);
    }
  }

  toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    this.els.toasts.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  openModal(html) {
    this.els.modalBody.innerHTML = html;
    this.els.modalOverlay.classList.remove("hidden");
  }

  closeModal() {
    this.els.modalOverlay.classList.add("hidden");
  }

  showStatsModal() {
    const s = this.game.state;
    this.openModal(`
      <h2>📊 Статистика</h2>
      <ul class="stat-list">
        <li><span>Всего кликов</span><span>${formatNum(s.totalClicks)}</span></li>
        <li><span>Урон нанесён</span><span>${formatNum(s.totalDamage)}</span></li>
        <li><span>Монет заработано</span><span>${formatNum(s.totalCoinsEarned)}</span></li>
        <li><span>Критов</span><span>${formatNum(s.totalCrits)}</span></li>
        <li><span>Боссов убито</span><span>${s.bossKills}</span></li>
        <li><span>Макс. комбо</span><span>${s.maxCombo}</span></li>
        <li><span>Престижей</span><span>${s.prestigeCount}</span></li>
      </ul>
    `);
  }

  showAchievementsModal() {
    const s = this.game.state;
    const html = ACHIEVEMENTS.map((a) => {
      const unlocked = s.achievements.includes(a.id) || a.check(s);
      return `
        <div class="achievement ${unlocked ? "unlocked" : "locked"}">
          <span class="icon">${a.icon}</span>
          <div>
            <strong>${a.name}</strong>
            <p style="font-size:0.75rem;color:var(--muted)">${a.desc}</p>
          </div>
        </div>`;
    }).join("");
    this.openModal(`<h2>🏆 Достижения</h2><div class="achievement-grid">${html}</div>`);
  }

  showSettingsModal() {
    const s = this.game.state.settings;
    this.openModal(`
      <h2>⚙️ Настройки</h2>
      <div class="setting-row">
        <label>Звук</label>
        <input type="checkbox" id="set-sound" ${s.sound ? "checked" : ""} />
      </div>
      <div class="setting-row">
        <label>Частицы</label>
        <input type="checkbox" id="set-particles" ${s.particles ? "checked" : ""} />
      </div>
      <div class="setting-row">
        <label>Экспорт сейва</label>
        <button class="btn-icon" id="btn-export">📋</button>
      </div>
      <div class="setting-row">
        <label>Импорт сейва</label>
        <input type="text" id="import-input" placeholder="вставь код..." style="flex:1;padding:6px;border-radius:6px;border:1px solid var(--border);background:var(--bg);color:var(--text)" />
        <button class="btn-icon" id="btn-import">✓</button>
      </div>
      <div class="setting-row">
        <label style="color:var(--red)">Сброс прогресса</label>
        <button class="btn-icon" id="btn-reset">🗑</button>
      </div>
    `);

    this.$("set-sound").onchange = (e) => { s.sound = e.target.checked; };
    this.$("set-particles").onchange = (e) => { s.particles = e.target.checked; };
    this.$("btn-export").onclick = () => {
      import("./save.js").then(({ exportSave }) => {
        navigator.clipboard?.writeText(exportSave(this.game.state));
        this.toast("Сейв скопирован в буфер!");
      });
    };
    this.$("btn-import").onclick = () => {
      const code = this.$("import-input").value.trim();
      if (!code) return;
      import("./save.js").then(({ importSave }) => {
        try {
          Object.assign(this.game.state, importSave(code));
          this.game.spawnEnemy();
          this.closeModal();
          this.toast("Сейв загружен!");
          this.update();
        } catch {
          this.toast("Неверный код сейва");
        }
      });
    };
    this.$("btn-reset").onclick = () => {
      if (confirm("Точно сбросить ВСЁ?")) {
        import("./save.js").then(({ resetSave }) => {
          Object.assign(this.game.state, resetSave());
          this.game.combo = 0;
          this.game.spawnEnemy();
          this.closeModal();
          this.update();
          this.toast("Прогресс сброшен");
        });
      }
    };
  }

  renderShop() {
    const g = this.game;
    const tab = this.activeTab;
    let html = "";

    if (tab === "weapon" || tab === "helpers" || tab === "relics") {
      const lists = { weapon: WEAPON_UPGRADES, helpers: HELPERS, relics: RELICS };
      const maps = {
        weapon: g.state.weaponLevels,
        helpers: g.state.helperLevels,
        relics: g.state.relicLevels,
      };
      const cats = { weapon: "weapon", helpers: "helpers", relics: "relics" };

      html = lists[tab].map((item) => {
        const lv = maps[tab][item.id] || 0;
        const maxed = item.max && lv >= item.max;
        const cost = upgradeCost(item, lv);
        const canBuy = g.state.coins >= cost && !maxed;
        let effectText = "";
        if (tab === "weapon" && item.id === "size") effectText = `Урон: ${item.effect(lv)} → ${item.effect(lv + 1)}`;
        if (tab === "helpers") effectText = `DPS: ${formatNum(item.dps(lv))} → ${formatNum(item.dps(lv + 1))}`;
        if (tab === "relics") effectText = `x${item.mult(lv).toFixed(2)} → x${item.mult(lv + 1).toFixed(2)}`;

        return `
          <div class="upgrade-item ${maxed ? "maxed" : canBuy ? "" : "locked"}" data-cat="${cats[tab]}" data-id="${item.id}">
            <div class="upgrade-icon">${item.icon}</div>
            <div class="upgrade-info">
              <h4>${item.name} <span class="upgrade-level">ур. ${lv}${item.max ? `/${item.max}` : ""}</span></h4>
              <p>${item.desc}</p>
              ${effectText ? `<p style="color:var(--green);font-size:0.65rem">${effectText}</p>` : ""}
            </div>
            <div class="upgrade-meta">
              <div class="upgrade-cost">${maxed ? "MAX" : "🪙 " + formatNum(cost)}</div>
            </div>
          </div>`;
      }).join("");
    } else if (tab === "skills") {
      html = `<p style="font-size:0.8rem;color:var(--muted);margin-bottom:10px">Активные навыки — кнопки под Олегом. Прокачка через достижения.</p>`;
      html += SKILLS.map((s) => `
        <div class="upgrade-item">
          <div class="upgrade-icon">${s.icon}</div>
          <div class="upgrade-info">
            <h4>${s.name}</h4>
            <p>${s.desc} · КД ${s.cd}с</p>
          </div>
        </div>`).join("");
    } else if (tab === "prestige") {
      const gain = g.prestigeGain();
      const can = g.canPrestige();
      html = `
        <div class="prestige-box">
          <h3>⭐ Престиж</h3>
          <p>Сбрось прогресс и получи <strong>${gain}</strong> очков престижа (+${Math.floor(gain / 2)} душ).</p>
          <p>Каждое очко: +5% урон навсегда. Нужна волна 5+ или уровень 15+.</p>
          <button class="btn-prestige" id="do-prestige" ${can ? "" : "disabled"}>ПРЕСТИЖНУТЬ (+${gain})</button>
          <h4 style="margin-top:20px">Древо талантов (души: ${g.state.souls})</h4>
          <div class="talent-tree" id="talent-tree"></div>
        </div>`;
    }

    this.els.shopContent.innerHTML = html;

    this.els.shopContent.querySelectorAll(".upgrade-item[data-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const cat = el.dataset.cat;
        const id = el.dataset.id;
        if (g.buyUpgrade(cat, id)) {
          this.renderShop();
          this.update();
          if (g.state.settings.sound) this.playSound("buy");
        }
      });
    });

    const prestigeBtn = document.getElementById("do-prestige");
    if (prestigeBtn) {
      prestigeBtn.onclick = () => {
        if (g.doPrestige()) {
          this.toast(`Престиж! +${g.prestigeGain()} очков`);
          this.renderShop();
          this.update();
        }
      };
      this.renderTalents();
    }
  }

  renderTalents() {
    const tree = document.getElementById("talent-tree");
    if (!tree) return;
    tree.innerHTML = TALENTS.map((t) => {
      const owned = this.game.state.talents.includes(t.id);
      const can = this.game.state.souls >= t.cost && !owned;
      return `
        <div class="talent ${owned ? "owned" : ""} ${can ? "" : "locked"}" data-talent="${t.id}" title="${t.name} — ${t.cost}👻">
          ${t.name}<br><small>${t.cost}👻</small>
        </div>`;
    }).join("");

    tree.querySelectorAll(".talent:not(.owned)").forEach((el) => {
      el.addEventListener("click", () => {
        if (this.game.buyTalent(el.dataset.talent)) {
          this.renderShop();
          this.update();
          this.toast("Талант куплен!");
        }
      });
    });
  }

  renderSkills() {
    const g = this.game;
    this.els.skillsBar.innerHTML = SKILLS.map((s) => {
      const cd = g.state.skillCooldowns[s.id] || 0;
      const active = g.state.buffs[s.id];
      return `
        <button class="skill-btn" data-skill="${s.id}" title="${s.name}: ${s.desc}" ${cd > 0 ? "disabled" : ""}>
          ${s.icon}
          ${cd > 0 ? `<span class="cd-overlay">${Math.ceil(cd)}</span>` : ""}
          ${active ? '<span style="position:absolute;bottom:2px;right:2px;font-size:0.5rem">ON</span>' : ""}
        </button>`;
    }).join("");

    this.els.skillsBar.querySelectorAll(".skill-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (g.activateSkill(btn.dataset.skill)) {
          this.toast(`Навык: ${SKILLS.find((x) => x.id === btn.dataset.skill).name}`);
          this.renderSkills();
          if (g.state.settings.sound) this.playSound("skill");
        }
      });
    });
  }

  playSound(type) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const freqs = { hit: 180, buy: 440, skill: 330, level: 550 };
      osc.frequency.value = freqs[type] || 200;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch { /* ignore */ }
  }

  update() {
    const g = this.game;
    const s = g.state;

    this.els.coins.textContent = formatNum(s.coins);
    this.els.prestige.textContent = formatNum(s.prestigePoints);
    this.els.souls.textContent = formatNum(s.souls);

    this.els.playerLevel.textContent = s.playerLevel;
    const xpNeed = g.xpForLevel(s.playerLevel);
    this.els.xpCurrent.textContent = formatNum(s.playerXp);
    this.els.xpMax.textContent = formatNum(xpNeed);
    this.els.xpFill.style.width = (s.playerXp / xpNeed) * 100 + "%";

    const wave = g.getWaveData();
    this.els.waveNum.textContent = s.wave;
    this.els.waveName.textContent = wave.name;

    if (s.enemyType === "boss" && s.bossTimer > 0) {
      this.els.bossTimerWrap.classList.remove("hidden");
      this.els.bossTimer.textContent = Math.ceil(s.bossTimer);
    } else {
      this.els.bossTimerWrap.classList.add("hidden");
    }

    const et = { normal: "", elite: "elite", boss: "boss" }[s.enemyType];
    this.els.enemyTag.textContent = s.enemyType === "boss" ? "БОСС" : s.enemyType === "elite" ? "Элитный" : "Обычный";
    this.els.enemyTag.className = "tag " + et;

    const names = ["Олег", "Олег-старший", "Мега-Олег", "Олег-босс", "Теневой Олег"];
  this.els.enemyName.textContent =
      s.enemyType === "boss" ? "👑 БОСС ОЛЕГ" : s.enemyType === "elite" ? "⚡ Элитный Олег" : names[s.wave % names.length];

    const hpPct = (s.enemyHp / s.enemyMaxHp) * 100;
    this.els.enemyHpFill.style.width = hpPct + "%";
    this.els.enemyHpText.textContent = `${formatNum(s.enemyHp)} / ${formatNum(s.enemyMaxHp)}`;

    this.els.dpcDisplay.textContent = formatNum(g.getBaseClickDamage());
    this.els.dpsDisplay.textContent = formatNum(g.getAutoDps());
    this.els.critDisplay.textContent = (g.getCritChance() * 100).toFixed(1) + "%";

    const comboPct = Math.min(100, (g.combo / 50) * 100);
    this.els.comboFill.style.width = comboPct + "%";
    this.els.comboMult.textContent = g.getComboMult().toFixed(2);
    this.els.comboCount.textContent = g.combo;

    this.els.statList.innerHTML = `
      <li><span>Урон/клик</span><span>${formatNum(g.getBaseClickDamage())}</span></li>
      <li><span>Авто-DPS</span><span>${formatNum(g.getAutoDps())}</span></li>
      <li><span>Множ. престижа</span><span>x${g.getPrestigeMult().toFixed(2)}</span></li>
      <li><span>Комбо</span><span>x${g.getComboMult().toFixed(2)}</span></li>
    `;

    if (g.canPrestige()) {
      this.els.btnPrestigeQuick.classList.remove("hidden");
    } else {
      this.els.btnPrestigeQuick.classList.add("hidden");
    }

    if (s.event) {
      const labels = {
        double_coins: "🪙 x2 монеты 30с!",
        free_damage: "💪 +50% урон 30с!",
        lucky_crit: "🎯 +30% крит 30с!",
      };
      this.els.eventBanner.textContent = labels[s.event] || s.event;
      this.els.eventBanner.classList.remove("hidden");
    } else {
      this.els.eventBanner.classList.add("hidden");
    }

    this.renderSkills();
  }

  init() {
    this.renderShop();
    this.update();
    setInterval(() => {
      this.els.footerTip.textContent = "Совет: " + TIPS[Math.floor(Math.random() * TIPS.length)];
    }, 12000);
  }
}
