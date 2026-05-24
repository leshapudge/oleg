import {
  WAVES,
  ENEMY_TYPES,
  WEAPON_UPGRADES,
  HELPERS,
  RELICS,
  TALENTS,
  upgradeCost,
} from "./data.js";

export class GameEngine {
  constructor(state) {
    this.state = state;
    this.combo = 0;
    this.comboTimer = 0;
    this.lastTick = performance.now();
    this.onEnemyDeath = null;
    this.onAchievement = null;
    this.listeners = new Set();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(event, data) {
    this.listeners.forEach((fn) => fn(event, data));
  }

  getWaveData() {
    const idx = Math.min(this.state.wave - 1, WAVES.length - 1);
    const loop = Math.floor((this.state.wave - 1) / WAVES.length);
    const base = WAVES[idx];
    const loopMult = 1 + loop * 0.5;
    return { ...base, loopMult };
  }

  getUpgradeLevel(map, id) {
    return map[id] || 0;
  }

  getComboWindow() {
    const lubeLv = this.getUpgradeLevel(this.state.weaponLevels, "lube");
    const lube = WEAPON_UPGRADES.find((u) => u.id === "lube");
    let window = lube ? lube.effect(lubeLv) : 2000;
    if (this.hasTalent("t_combo")) window += 500;
    return window;
  }

  getComboMult() {
    return 1 + Math.min(this.combo, 100) * 0.02;
  }

  hasTalent(id) {
    return this.state.talents.includes(id);
  }

  getTalentMult(type) {
    let m = 1;
    for (const t of TALENTS) {
      if (this.state.talents.includes(t.id) && t.effect === type) m += t.value;
    }
    return m;
  }

  getPrestigeMult() {
    return 1 + this.state.prestigePoints * 0.05 + this.state.prestigeCount * 0.02;
  }

  getRelicMult(type) {
    let m = 1;
    for (const r of RELICS) {
      const lv = this.getUpgradeLevel(this.state.relicLevels, r.id);
      if (lv === 0) continue;
      if (type === "damage" && r.id === "ring") m *= r.mult(lv);
      if (type === "auto" && r.id === "boots") m *= r.mult(lv);
      if (type === "coins" && r.id === "amulet") m *= r.mult(lv);
      if (type === "xp" && r.id === "crown") m *= r.mult(lv);
    }
    return m;
  }

  getBaseClickDamage() {
    const sizeLv = this.getUpgradeLevel(this.state.weaponLevels, "size");
    const size = WEAPON_UPGRADES.find((u) => u.id === "size");
    let dmg = size ? size.effect(sizeLv) : 1;

    const hardLv = this.getUpgradeLevel(this.state.weaponLevels, "hardness");
    const hard = WEAPON_UPGRADES.find((u) => u.id === "hardness");
    const hardMult = hard ? hard.effect(hardLv) : 1;

    dmg *= hardMult;
    dmg *= this.getComboMult();
    dmg *= this.getPrestigeMult();
    dmg *= this.getRelicMult("damage");
    dmg *= this.getTalentMult("damage");

    if (this.state.buffs.mega_slap) dmg *= 10;
    if (this.state.event === "free_damage") dmg *= 1.5;
    if (this.state.event === "lucky_crit" && Math.random() < 0.3) dmg *= 2;

    return Math.max(1, Math.floor(dmg));
  }

  getCritChance() {
    const lv = this.getUpgradeLevel(this.state.weaponLevels, "crit_chance");
    const u = WEAPON_UPGRADES.find((x) => x.id === "crit_chance");
    const max = u?.max ?? 99;
    return Math.min(max / 100, u ? u.effect(lv) : 0.05);
  }

  getCritMult() {
    const lv = this.getUpgradeLevel(this.state.weaponLevels, "crit_mult");
    const u = WEAPON_UPGRADES.find((x) => x.id === "crit_mult");
    return u ? u.effect(lv) : 2;
  }

  getDoubleTapChance() {
    const lv = this.getUpgradeLevel(this.state.weaponLevels, "double_tap");
    const u = WEAPON_UPGRADES.find((x) => x.id === "double_tap");
    const max = u?.max ?? 99;
    return Math.min(max / 100, u ? u.effect(lv) : 0);
  }

  getAutoDps() {
    let dps = 0;
    let coinMult = 1;
    for (const h of HELPERS) {
      const lv = this.getUpgradeLevel(this.state.helperLevels, h.id);
      if (lv > 0) {
        dps += h.dps(lv);
        if (h.coinBonus) coinMult *= h.coinBonus(lv);
      }
    }
    dps *= this.getPrestigeMult();
    dps *= this.getRelicMult("damage");
    dps *= this.getRelicMult("auto");
    dps *= this.getTalentMult("auto");

    const hardLv = this.getUpgradeLevel(this.state.weaponLevels, "hardness");
    const hard = WEAPON_UPGRADES.find((u) => u.id === "hardness");
    dps *= hard ? hard.effect(hardLv) : 1;

    if (this.state.buffs.mega_slap) dps *= 10;

    this._helperCoinMult = coinMult;
    return dps;
  }

  rollDamage(isClick = true) {
    let dmg = isClick ? this.getBaseClickDamage() : this.getAutoDps();
    let crit = false;
    if (Math.random() < this.getCritChance()) {
      crit = true;
      dmg = Math.floor(dmg * this.getCritMult());
      this.state.totalCrits++;
    }
    if (isClick && Math.random() < this.getDoubleTapChance()) {
      dmg *= 2;
    }
    return { dmg: Math.max(1, Math.floor(dmg)), crit };
  }

  spawnEnemy() {
    const wave = this.getWaveData();
    const loopMult = wave.loopMult;
    let type = "normal";

    if (this.state.killsOnWave > 0 && this.state.killsOnWave % 10 === 0) {
      type = "boss";
      this.state.bossTimer = 30;
    } else if (this.state.killsOnWave > 0 && this.state.killsOnWave % 5 === 0) {
      type = "elite";
    }

    const et = ENEMY_TYPES[type];
    const baseHp = 50 * Math.pow(1.12, this.state.wave) * wave.hpMult * loopMult;
    const hp = Math.floor(baseHp * et.hpMult);

    this.state.enemyType = type;
    this.state.enemyMaxHp = hp;
    this.state.enemyHp = hp;
    this.emit("enemySpawn", { type, hp });
  }

  dealDamage(amount, source = "click") {
    this.state.enemyHp = Math.max(0, this.state.enemyHp - amount);
    this.state.totalDamage += amount;

    if (this.state.enemyHp <= 0) {
      this.killEnemy();
    }
    this.emit("damage", { amount, source });
  }

  killEnemy() {
    const et = ENEMY_TYPES[this.state.enemyType];
    const wave = this.getWaveData();
    let coins = 10 * this.state.wave * et.coinMult * wave.coinMult;

    coins *= this.getRelicMult("coins");
    coins *= this._helperCoinMult || 1;
    coins *= this.getTalentMult("coins");
    if (this.state.buffs.gold_rain) coins *= 5;
    if (this.state.event === "double_coins") coins *= 2;

    coins = Math.floor(coins);
    this.state.coins += coins;
    this.state.totalCoinsEarned += coins;

    const xp = Math.floor(15 * this.state.wave * et.xpMult * this.getRelicMult("xp"));
    this.gainXp(xp);

    if (this.state.enemyType === "boss") {
      this.state.bossKills++;
      this.state.bossTimer = 0;
    }

    this.state.killsOnWave++;
    if (this.state.killsOnWave >= 15) {
      this.state.wave++;
      this.state.killsOnWave = 0;
      this.emit("waveUp", this.state.wave);
    }

    this.onEnemyDeath?.(coins);
    this.spawnEnemy();
    this.emit("kill", { coins, xp });
  }

  gainXp(amount) {
    this.state.playerXp += amount;
    const need = this.xpForLevel(this.state.playerLevel);
    while (this.state.playerXp >= need) {
      this.state.playerXp -= need;
      this.state.playerLevel++;
      this.emit("levelUp", this.state.playerLevel);
    }
  }

  xpForLevel(lv) {
    return Math.floor(100 * Math.pow(1.15, lv - 1));
  }

  click() {
    this.state.totalClicks++;
    this.combo++;
    this.comboTimer = this.getComboWindow();
    if (this.combo > this.state.maxCombo) this.state.maxCombo = this.combo;

    const { dmg, crit } = this.rollDamage(true);
    this.dealDamage(dmg, "click");
    return { dmg, crit };
  }

  buyUpgrade(category, id) {
    let list, map;
    if (category === "weapon") {
      list = WEAPON_UPGRADES;
      map = this.state.weaponLevels;
    } else if (category === "helpers") {
      list = HELPERS;
      map = this.state.helperLevels;
    } else if (category === "relics") {
      list = RELICS;
      map = this.state.relicLevels;
    } else return false;

    const item = list.find((x) => x.id === id);
    if (!item) return false;

    const lv = map[id] || 0;
    if (item.max && lv >= item.max) return false;

    const cost = upgradeCost(item, lv);
    if (this.state.coins < cost) return false;

    this.state.coins -= cost;
    map[id] = lv + 1;
    this.emit("buy", { category, id, level: lv + 1 });
    return true;
  }

  buyTalent(id) {
    const t = TALENTS.find((x) => x.id === id);
    if (!t || this.state.talents.includes(id)) return false;
    if (this.state.souls < t.cost) return false;
    this.state.souls -= t.cost;
    this.state.talents.push(id);
    if (t.effect === "startCoins") this.state.coins += t.value;
    this.emit("talent", id);
    return true;
  }

  canPrestige() {
    return this.state.wave >= 5 || this.state.playerLevel >= 15;
  }

  prestigeGain() {
    const base = Math.floor(Math.sqrt(this.state.wave * this.state.playerLevel) / 2);
    let gain = Math.max(1, base);
    gain = Math.floor(gain * this.getTalentMult("prestigeGain"));
    return gain;
  }

  doPrestige() {
    if (!this.canPrestige()) return false;
    const gain = this.prestigeGain();
    this.state.prestigePoints += gain;
    this.state.prestigeCount++;
    this.state.souls += Math.floor(gain / 2);

    const keep = {
      prestigePoints: this.state.prestigePoints,
      prestigeCount: this.state.prestigeCount,
      souls: this.state.souls,
      talents: this.state.talents,
      achievements: this.state.achievements,
      settings: this.state.settings,
      totalClicks: this.state.totalClicks,
      totalDamage: this.state.totalDamage,
      totalCoinsEarned: this.state.totalCoinsEarned,
      totalCrits: this.state.totalCrits,
      bossKills: this.state.bossKills,
      maxCombo: this.state.maxCombo,
    };

    const fresh = {
      ...this.state,
      coins: this.hasTalent("t_start") ? 500 : 0,
      wave: 1,
      killsOnWave: 0,
      playerLevel: 1,
      playerXp: 0,
      weaponLevels: {},
      helperLevels: {},
      relicLevels: {},
      skillCooldowns: {},
      buffs: {},
      ...keep,
    };

    Object.assign(this.state, fresh);
    this.combo = 0;
    this.spawnEnemy();
    this.emit("prestige", gain);
    return true;
  }

  activateSkill(skillId) {
    const cd = this.state.skillCooldowns[skillId] || 0;
    if (cd > 0) return false;

    const SKILLS = [
      { id: "mega_slap", cd: 15, duration: 5 },
      { id: "frenzy", cd: 30, duration: 8 },
      { id: "gold_rain", cd: 45, duration: 10 },
      { id: "freeze", cd: 60, duration: 12 },
    ];
    const skill = SKILLS.find((s) => s.id === skillId);
    if (!skill) return false;

    this.state.skillCooldowns[skillId] = skill.cd;
    this.state.buffs[skillId] = skill.duration;
    this.emit("skill", skillId);
    return true;
  }

  tick(dt) {
    const sec = dt / 1000;

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.emit("comboReset");
      }
    }

    const dps = this.getAutoDps();
    if (dps > 0) {
      const autoDmg = dps * sec;
      if (autoDmg >= 1) this.dealDamage(Math.floor(autoDmg), "auto");
    }

    if (this.state.buffs.frenzy) {
      const frenzyClicks = 5 * sec;
      for (let i = 0; i < frenzyClicks; i++) {
        const { dmg } = this.rollDamage(true);
        if (dmg > 0) this.dealDamage(dmg, "frenzy");
      }
    }

    for (const key of Object.keys(this.state.buffs)) {
      if (key === "freeze") continue;
      this.state.buffs[key] -= sec;
      if (this.state.buffs[key] <= 0) delete this.state.buffs[key];
    }
    if (this.state.buffs.freeze) {
      this.state.buffs.freeze -= sec;
      if (this.state.buffs.freeze <= 0) delete this.state.buffs.freeze;
    }

    for (const key of Object.keys(this.state.skillCooldowns)) {
      if (this.state.skillCooldowns[key] > 0) {
        this.state.skillCooldowns[key] -= sec;
        if (this.state.skillCooldowns[key] < 0) this.state.skillCooldowns[key] = 0;
      }
    }

    if (this.state.enemyType === "boss" && this.state.bossTimer > 0) {
      this.state.bossTimer -= sec;
      if (this.state.bossTimer <= 0) {
        this.state.enemyHp = this.state.enemyMaxHp;
        this.spawnEnemy();
        this.emit("bossFail");
      }
    }

    if (!this.state.enemyRegenBlocked) {
      this.state.enemyRegenBlocked = false;
    }
    if (!this.state.buffs.freeze && this.state.enemyHp < this.state.enemyMaxHp) {
      const regen = this.state.enemyMaxHp * 0.002 * sec;
      this.state.enemyHp = Math.min(this.state.enemyMaxHp, this.state.enemyHp + regen);
    }

    if (this.state.eventEnd > 0) {
      this.state.eventEnd -= sec;
      if (this.state.eventEnd <= 0) {
        this.state.event = null;
        this.emit("eventEnd");
      }
    }

    this.emit("tick");
  }

  maybeRandomEvent() {
    if (this.state.event || Math.random() > 0.0003) return;
    const events = ["double_coins", "free_damage", "lucky_crit"];
    this.state.event = events[Math.floor(Math.random() * events.length)];
    this.state.eventEnd = 30;
    this.emit("eventStart", this.state.event);
  }
}
