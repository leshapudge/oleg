import {
  ZONES, ENEMY_TYPES, pickOlegSkin, OLEG_SKINS, ELEMENTS, MUTATORS, WEAPONS, CREW,
  ELEMENT_UPGRADES, RELICS, RESEARCH, SKILLS, ARTIFACTS,
  CONSUMABLES, CHALLENGES, TALENTS, EVENTS, cost, defaultState,
} from "./data.js";
import {
  ITEMS, RECIPES, ZONE_ACTIVITIES, masteryLevel,
} from "./rpg-data.js";
import { UNLOCKS, tryCompleteObjective, grantVeteranUnlocks } from "./tutorial.js";

export class Game {
  constructor(state) {
    this.state = state;
    this.combo = 0;
    this.comboT = 0;
    this.rage = 0;
    this.overdrive = 0;
    this.heat = 0;
    this.killStreak = 0;
    this.streakT = 0;
    this.weakSpot = null;
    this.weakT = 0;
    this.parryActive = false;
    this.parryT = 0;
    this.parryWindow = 0;
    this.listeners = new Set();
    this._crewCoin = 1;
    this._eventTick = 0;
    this._weakSide = "left";
    this.stamina = 100;
    this.olegRage = 0;
    this.heavyCd = 0;
    this._counterPending = false;
    this._autoPool = 0;
    this.pickChallenge();
    this.pickMutator();
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(ev, data) { this.listeners.forEach((f) => f(ev, data)); }

  checkProgress() {
    grantVeteranUnlocks(this.state);
    for (const u of UNLOCKS) {
      if ((this.state.unlocks || []).includes(u.id)) continue;
      if (u.check(this.state, this)) {
        if (!this.state.unlocks) this.state.unlocks = [];
        this.state.unlocks.push(u.id);
        if (u.id === "crew" && !this.lv(this.state.crew, "bro")) {
          this.state.crew.bro = 1;
        }
        this.emit("unlock", u);
      }
    }
    const obj = tryCompleteObjective(this.state);
    if (obj) this.emit("objective", obj);
  }

  lv(map, id) { return map[id] || 0; }

  zone() {
    const z = ZONES[Math.min(this.state.zoneIdx, ZONES.length - 1)];
    const loop = Math.floor(this.state.wave / ZONES.length);
    return { ...z, loopMult: 1 + loop * 0.45 };
  }

  zoneBonus(type) {
    const idx = this.state.zoneIdx;
    if (idx >= 6) return type === "all" ? 2 : 1;
    if (type === "coin" && idx >= 1) return 1 + idx * 0.05;
    if (type === "xp" && idx >= 3) return 1 + idx * 0.05;
    if (type === "dmg" && idx >= 4) return 1 + idx * 0.04;
    if (type === "dps" && idx >= 5) return 1 + idx * 0.05;
    return 1;
  }

  hasTalent(id) { return this.state.talents.includes(id); }

  talentMult(type) {
    let m = 1;
    for (const t of TALENTS) {
      if (!this.state.talents.includes(t.id)) continue;
      if (t.fx === type) m += t.v;
    }
    return m;
  }

  researchMult(id) {
    const r = RESEARCH.find((x) => x.id === id);
    if (!r) return 1;
    return r.fx(this.lv(this.state.research, id));
  }

  relicMult(kind) {
    let m = 1;
    for (const r of RELICS) {
      const l = this.lv(this.state.relics, r.id);
      if (!l) continue;
      if (kind === "dmg" && r.id === "ring") m *= r.fx(l);
      if (kind === "dps" && r.id === "boots") m *= r.fx(l);
      if (kind === "coin" && r.id === "bag") m *= r.fx(l);
      if (kind === "xp" && r.id === "brain") m *= r.fx(l);
    }
    return m;
  }

  artifactMult() {
    let dmg = 1, coin = 1, crit = 0;
    for (const id of this.state.artifacts) {
      if (!id) continue;
      const a = ARTIFACTS.find((x) => x.id === id);
      if (!a) continue;
      if (a.dmg) dmg *= a.dmg;
      if (a.coin) coin *= a.coin;
      if (a.crit) crit += a.crit;
      if (a.all) { dmg *= a.all; coin *= a.all; }
    }
    return { dmg, coin, crit };
  }

  prestigeMult() {
    return 1 + this.state.prestigePts * 0.06 + this.state.prestigeCount * 0.025;
  }

  comboWindow() {
    const w = WEAPONS.find((x) => x.id === "speed");
    let ms = w ? w.fx(this.lv(this.state.weapons, "speed")) : 1800;
    if (this.hasTalent("t4")) ms += 400;
    if (this.state.event?.combo) ms *= this.state.event.combo;
    return ms;
  }

  comboMult() {
    const base = 1 + Math.min(this.combo, 120) * 0.018;
    const rageBonus = this.rage >= 100 ? 1.5 : 1 + this.rage / 200;
    return base * rageBonus;
  }

  streakMult() {
    return 1 + Math.min(this.killStreak, 50) * 0.04;
  }

  clickDamage() {
    const baseW = WEAPONS.find((x) => x.id === "base");
    let dmg = baseW ? baseW.fx(this.lv(this.state.weapons, "base")) : 2;

    const weight = WEAPONS.find((x) => x.id === "weight");
    dmg *= weight ? weight.fx(this.lv(this.state.weapons, "weight")) : 1;

    const eq = this.equipStats();
    dmg += eq.dmg;
    dmg *= this.masteryCombatMult();

    dmg *= this.comboMult();
    dmg *= this.prestigeMult();
    dmg *= this.relicMult("dmg");
    dmg *= this.researchMult("r_dmg");
    dmg *= this.talentMult("dmg");
    dmg *= this.artifactMult().dmg;
    dmg *= this.zoneBonus("dmg");

    if (this.overdrive >= 100) dmg *= 2.5;
    if (this.state.buffs.slap) dmg *= 8;
    if (this.state.buffs.oil) dmg *= 2;
    if (this.state.event?.dmg) dmg *= this.state.event.dmg;

    dmg *= this.getElementBonus();

    return Math.max(1, Math.floor(dmg));
  }

  getElementBonus() {
    const el = this.state.enemyElement;
    if (el === "none") return 1;
    let bonus = 1;
    const fire = this.lv(this.state.elements, "fire");
    const ice = this.lv(this.state.elements, "ice");
    const shock = this.lv(this.state.elements, "shock");
    const sync = ELEMENT_UPGRADES.find((x) => x.id === "sync");
    const syncM = sync ? sync.fx(this.lv(this.state.elements, "sync")) : 1;

    if (el === "ice" && fire) bonus += fire * 0.08;
    if (el === "fire" && ice) bonus += ice * 0.08;
    if (el === "shock" && fire) bonus += shock * 0.06;

    const weak = ELEMENTS[el]?.weak;
    if (weak === "fire" && fire > 0) bonus *= syncM;
    if (weak === "ice" && ice > 0) bonus *= syncM;

    return bonus;
  }

  critChance() {
    const c = WEAPONS.find((x) => x.id === "crit");
    let ch = c ? c.fx(this.lv(this.state.weapons, "crit")) : 0.05;
    ch += this.artifactMult().crit;
    ch += this.equipStats().crit;
    if (this.state.event?.crit) ch += this.state.event.crit;
    return Math.min(0.75, ch);
  }

  critMult() {
    const c = WEAPONS.find((x) => x.id === "critd");
    return c ? c.fx(this.lv(this.state.weapons, "critd")) : 2;
  }

  doubleChance() {
    const c = WEAPONS.find((x) => x.id === "chain");
    return c ? Math.min(0.6, c.fx(this.lv(this.state.weapons, "chain"))) : 0;
  }

  autoDps() {
    let dps = 0;
    this._crewCoin = 1;
    for (const c of CREW) {
      const l = this.lv(this.state.crew, c.id);
      if (!l) continue;
      dps += c.dps(l);
      if (c.coin) this._crewCoin *= c.coin(l);
    }
    if (dps <= 0) return 0;

    const eq = this.equipStats();
    dps += eq.dmg * 0.4;

    const weight = WEAPONS.find((x) => x.id === "weight");
    dps *= weight ? weight.fx(this.lv(this.state.weapons, "weight")) : 1;
    dps *= this.masteryCombatMult();
    dps *= this.zoneBonus("dmg");
    dps *= this.prestigeMult();
    dps *= this.relicMult("dmg");
    dps *= this.relicMult("dps");
    dps *= this.researchMult("r_dmg");
    dps *= this.talentMult("dps");
    dps *= this.artifactMult().dmg;
    if (this.state.buffs.slap) dps *= 8;
    if (this.state.event?.dmg) dps *= this.state.event.dmg;
    return Math.max(0, dps);
  }

  rollHit(isClick = true) {
    let dmg = isClick ? this.clickDamage() : this.autoDps();
    let crit = false;
    let weak = false;

    if (Math.random() < this.critChance()) {
      crit = true;
      dmg = Math.floor(dmg * this.critMult());
      this.state.crits++;
    }
    if (isClick && Math.random() < this.doubleChance()) dmg *= 2;

    return { dmg: Math.max(1, Math.floor(dmg)), crit, weak };
  }

  pickMutator() {
    this.state.mutator = MUTATORS[Math.floor(Math.random() * MUTATORS.length)];
  }

  pickChallenge() {
    const c = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
    this.state.challenge = c.id;
    this.state.challengeProg = { weakHits: 0, parry: false };
    this.state.weakHits = 0;
    this.state.parryDone = false;
  }

  playerPower() {
    return Math.max(5, this.clickDamage() + this.autoDps() * 2.2);
  }

  calcBaseEnemyLevel() {
    const s = this.state;
    let lv = Math.floor(s.level * 0.6);
    lv += Math.floor(s.wave / 3);
    lv += Math.floor(s.zoneIdx * 0.4);
    lv += Math.floor(s.prestigePts * 0.8);
    return Math.max(1, lv);
  }

  computeEnemyHp(type, enemyLv) {
    const et = ENEMY_TYPES[type];
    const z = this.zone();
    const power = this.playerPower();
    const ttk = { normal: 10, elite: 14, mini: 18, boss: 25 }[type] || 10;
    let hp = power * ttk * et.hp * 0.22 * z.hp;
    hp *= 1 + (enemyLv - 1) * 0.05;
    hp *= z.loopMult;
    if (this.state.mutator?.id === "armored") hp *= 1.25;
    if (this.state.mutator?.id === "greedy") hp *= 1.2;
    if (this.state.mutator?.id === "thin") hp *= 0.75;
    const cap = power * ttk * et.hp * 0.9;
    hp = Math.min(hp, cap);
    return Math.max(20, Math.floor(hp));
  }

  spawnEnemy() {
    const z = this.zone();
    let type = "normal";
    const k = this.state.killsInWave;

    if (k > 0 && k % 12 === 0 && this.state.wave >= 3) { type = "boss"; this.state.bossTimer = 35; this.state.bossPhase = 1; }
    else if (this.state.zoneBossPending) { type = "boss"; this.state.bossTimer = 40; this.state.bossPhase = 1; this.state.zoneBossPending = false; }
    else if (k > 0 && k % 7 === 0) type = "mini";
    else if (k > 0 && k % 4 === 0) type = "elite";

    const typeLv = { normal: 0, elite: 2, mini: 5, boss: 11 };
    this.state.enemyLevel = this.calcBaseEnemyLevel() + typeLv[type];
    this.state.enemyAtk = Math.floor(2 + this.state.enemyLevel * 1.15);

    const et = ENEMY_TYPES[type];
    const els = ["fire", "ice", "shock"];
    this.state.enemyElement = type === "normal" ? "none" : els[Math.floor(Math.random() * els.length)];
    this.state.enemyType = type;
    const skin = pickOlegSkin(type, this.state.zoneIdx);
    this.state.enemySkin = skin.id;

    this.state.enemyMaxHp = this.computeEnemyHp(type, this.state.enemyLevel);
    this.state.enemyHp = this.state.enemyMaxHp;
    this.state.enemyShield = this.state.mutator?.id === "armored" ? Math.floor(this.state.enemyMaxHp * 0.25) : 0;

    this.olegRage = 0;
    this.spawnWeakSpot();
    this.emit("spawn", { type, level: this.state.enemyLevel });
  }

  spawnWeakSpot() {
    this.weakSpot = this._weakSide;
    this._weakSide = this._weakSide === "left" ? "right" : "left";
    this.weakT = 2500 + Math.random() * 1500;
  }

  dealDamage(amount, src = "click", opts = {}) {
    let dmg = Math.max(0, Math.floor(amount));
    if (dmg <= 0) return 0;

    if (opts.weak) dmg = Math.floor(dmg * 3);

    const pierce = WEAPONS.find((x) => x.id === "pierce");
    const piercePct = pierce ? pierce.fx(this.lv(this.state.weapons, "pierce")) : 0;

    if (this.state.enemyShield > 0) {
      let toShield = Math.floor(dmg * (1 - piercePct) * 0.65);
      let toHp = dmg - toShield;
      if (toShield > this.state.enemyShield) {
        toHp += toShield - this.state.enemyShield;
        toShield = this.state.enemyShield;
      }
      this.state.enemyShield = Math.max(0, this.state.enemyShield - toShield);
      dmg = Math.max(1, toHp);
    }

    this.state.enemyHp = Math.max(0, this.state.enemyHp - dmg);
    this.state.damage += dmg;

    if (this.state.enemyHp <= 0) this.killEnemy();
    if (src === "auto" && dmg >= 1) this.emit("autoHit", dmg);
    this.emit("hit", { dmg, src, ...opts });
    return dmg;
  }

  fixBrokenEnemy() {
    const power = this.playerPower();
    const maxOk = Math.max(800, power * 80);
    const s = this.state;
    if (!Number.isFinite(s.enemyMaxHp) || s.enemyMaxHp > maxOk || s.enemyHp <= 0 || s.enemyHp > s.enemyMaxHp) {
      this.spawnEnemy();
      return true;
    }
    return false;
  }

  killEnemy() {
    const et = ENEMY_TYPES[this.state.enemyType];
    const z = this.zone();
    let coins = 12 * this.state.wave * et.coins * z.coins;
    coins *= 1 + this.state.enemyLevel * 0.045;

    coins *= this.relicMult("coin");
    coins *= this._crewCoin;
    coins *= this.talentMult("coin");
    coins *= this.artifactMult().coin;
    coins *= this.streakMult();
    if (this.state.buffs.gold) coins *= 4;
    if (this.state.buffs.magnet) coins *= 3;
    if (this.state.event?.coin) coins *= this.state.event.coin;
    if (this.state.mutator?.id === "greedy") coins *= 2;

    coins *= this.zoneBonus("coin");
    coins *= 1 + this.equipStats().coin;
    if (this.state.zoneIdx >= 6) coins *= 2;
    coins = Math.floor(coins);
    this.state.coins += coins;
    this.state.coinsEarned += coins;

    let xp = Math.floor(12 * this.state.wave * et.xp * this.relicMult("xp"));
    xp = Math.floor(xp * this.zoneBonus("xp") * (1 + this.state.enemyLevel * 0.035));
    this.gainXp(xp);
    this.gainMastery("combat", Math.max(2, Math.floor(xp / 4)));

    let ess = Math.floor(1 + this.state.wave / 5);
    if (et.tag === "БОСС") ess *= 3;
    ess = Math.floor(ess * this.talentMult("essence"));
    this.state.essence += ess;

    if (this.state.enemyType === "boss") {
      this.state.bossKills++;
      this.tryDropArtifact();
    }

    this.killStreak++;
    this.streakT = 8000;

    this.state.killsInWave++;
    if (this.state.killsInWave >= 14) {
      this.state.wave++;
      this.state.killsInWave = 0;
      this.pickMutator();
      this.emit("wave", this.state.wave);
    }

    this.dropMaterials();
    this.tryLoot();
    this.checkChallenge();
    this.checkProgress();
    this.spawnEnemy();
    this.emit("kill", { coins, ess });
  }

  dropMaterials() {
    const z = ZONES[this.state.zoneIdx];
    const scav = this.masteryLv("scavenge");
    if (Math.random() < 0.14 + scav * 0.012) {
      this.addMaterial("hide", 1 + (Math.random() < 0.25 ? 1 : 0));
    }
    if (z.id === "beach" && Math.random() < 0.1 + scav * 0.01) this.addMaterial("scale", 1);
    if (z.id === "pod" && Math.random() < 0.16 + scav * 0.015) this.addMaterial("scrap", 1);
    if (z.id === "yard" && Math.random() < 0.12) this.addMaterial("wood", 1);
    if (z.id === "space" && Math.random() < 0.07) this.addMaterial("crystal", 1);
    if (z.id === "hell" && Math.random() < 0.08) this.addMaterial("ore", 1);
  }

  tryLoot() {
    let chance = 0.08 * this.researchMult("r_loot");
    if (this.state.mutator?.id === "lucky") chance *= 2;
    if (this.state.event?.loot) chance *= this.state.event.loot;
    if (this.hasTalent("t7")) chance += 0.05;
    if (Math.random() > chance) return;

    const keys = Object.keys(CONSUMABLES);
    const key = keys[Math.floor(Math.random() * keys.length)];
    this.state.inventory[key] = (this.state.inventory[key] || 0) + 1;
    this.emit("loot", key);
  }

  tryDropArtifact() {
    if (Math.random() > 0.35) return;
    const empty = this.state.artifacts.findIndex((a) => !a);
    if (empty < 0) return;
    const pool = ARTIFACTS.filter((a) => !this.state.artifacts.includes(a.id));
    if (!pool.length) return;
    const art = pool[Math.floor(Math.random() * pool.length)];
    this.state.artifacts[empty] = art.id;
    this.emit("artifact", art);
  }

  gainXp(n) {
    this.state.xp += n;
    while (this.state.xp >= this.xpNeed()) {
      this.state.xp -= this.xpNeed();
      this.state.level++;
      this.emit("level", this.state.level);
      this.checkProgress();
    }
  }

  xpNeed() { return Math.floor(90 * Math.pow(1.14, this.state.level - 1)); }

  click(side = null) {
    this.state.clicks++;
    const stamCost = 10;
    const tired = this.stamina < stamCost;
    if (!tired) this.stamina -= stamCost;

    this.combo++;
    this.comboT = this.comboWindow();
    if (this.combo > this.state.maxCombo) this.state.maxCombo = this.combo;

    const heatRed = this.equipStats().heatRed + (this.masteryLv("endurance") - 1) * 0.03;
    const heatGain = (3.5 - (this.lv(this.state.crew, "it") * 0.12)) * Math.max(0.35, 1 - heatRed);
    this.heat = Math.min(100, this.heat + Math.max(1, heatGain));
    const overGain = (8 + this.combo * 0.05) * this.researchMult("r_over");
    this.overdrive = Math.min(100, this.overdrive + overGain);
    this.rage = Math.min(100, this.rage + 3 * this.researchMult("r_rage"));

    if (this.rage >= 100) this.state.rageMaxed = (this.state.rageMaxed || 0) + 1;

    const isWeak = side && this.weakSpot === side && this.weakT > 0;
    if (isWeak) {
      this.state.weakHits++;
      this.weakT = 0;
      this.spawnWeakSpot();
      this.olegRage = Math.max(0, this.olegRage - 15);
    }

    let { dmg, crit } = this.rollHit(true);
    if (tired) dmg = Math.floor(dmg * 0.55);
    if (this.heat >= 100) dmg = Math.floor(dmg * 0.5);

    dmg = this.dealDamage(dmg, "click", { crit, weak: isWeak, tired });
    this.checkProgress();
    return { dmg, crit, weak: isWeak, tired };
  }

  heavyStrike() {
    if (this.heavyCd > 0 || this.stamina < 22) return null;
    this.stamina -= 22;
    this.heavyCd = 2.8;
    this.state.clicks++;
    this.combo += 2;
    this.comboT = this.comboWindow();

    let dmg = Math.floor(this.clickDamage() * 2.8);
    if (Math.random() < this.critChance() + 0.1) {
      dmg = Math.floor(dmg * this.critMult());
    }
    dmg = this.dealDamage(dmg, "heavy", { crit: true });
    this.olegRage = Math.max(0, this.olegRage - 20);
    this.checkProgress();
    return { dmg, crit: true };
  }

  enemyCounter() {
    this.combo = Math.floor(this.combo * 0.45);
    this.heat = Math.min(100, this.heat + 18 + this.state.enemyLevel * 0.3);
    this.stamina = Math.max(0, this.stamina - 15);
    this.emit("counterHit");
  }

  weakClick(side) { return this.click(side); }

  parry() {
    if (!this.parryActive) return false;
    const wasCounter = this._counterPending;
    this.parryActive = false;
    this._counterPending = false;
    this.state.parryDone = true;
    this.rage = Math.min(100, this.rage + 25);
    this.overdrive = Math.min(100, this.overdrive + 30);
    const dmg = Math.floor(this.state.enemyMaxHp * (wasCounter ? 0.12 : 0.08));
    this.dealDamage(dmg, "parry", { crit: true });
    this.olegRage = 0;
    this.emit("parry");
    return true;
  }

  useSkill(id) {
    const s = SKILLS.find((x) => x.id === id);
    if (!s || (this.state.skillCd[id] || 0) > 0) return false;
    this.state.skillCd[id] = s.cd;
    if (id === "nuke") {
      const dmg = Math.floor(this.state.enemyMaxHp * 0.3);
      this.dealDamage(dmg, "nuke", { crit: true });
    } else if (id === "rage") {
      this.rage = 100;
    } else if (s.dur > 0) {
      this.state.buffs[id] = s.dur;
    }
    this.emit("skill", id);
    return true;
  }

  useConsumable(key) {
    const n = this.state.inventory[key] || 0;
    if (!n) return false;
    const c = CONSUMABLES[key];
    this.state.inventory[key] = n - 1;

    if (c.effect === "bomb") this.dealDamage(Math.floor(this.state.enemyMaxHp * 0.15), "bomb");
    if (c.effect === "oil") this.state.buffs.oil = 8;
    if (c.effect === "magnet") this.state.buffs.magnet = 10;
    if (c.effect === "cool") this.heat = 0;
    this.emit("use", key);
    return true;
  }

  buy(cat, id) {
    const maps = { weapon: ["weapons", WEAPONS], crew: ["crew", CREW], elements: ["elements", ELEMENT_UPGRADES], relics: ["relics", RELICS] };
    const m = maps[cat];
    if (!m) return false;
    const [mapKey, list] = m;
    const item = list.find((x) => x.id === id);
    if (!item) return false;
    const l = this.lv(this.state[mapKey], id);
    if (item.max && l >= item.max) return false;
    const price = cost(item, l);
    if (this.state.coins < price) return false;
    this.state.coins -= price;
    this.state[mapKey][id] = l + 1;
    this.emit("buy", { cat, id });
    this.checkProgress();
    return true;
  }

  buyResearch(id) {
    const r = RESEARCH.find((x) => x.id === id);
    if (!r) return false;
    const l = this.lv(this.state.research, id);
    const price = r.costEss(l);
    if (this.state.essence < price) return false;
    this.state.essence -= price;
    this.state.research[id] = l + 1;
    this.emit("research", id);
    return true;
  }

  buyTalent(id) {
    const t = TALENTS.find((x) => x.id === id);
    if (!t || this.state.talents.includes(id) || this.state.souls < t.cost) return false;
    this.state.souls -= t.cost;
    this.state.talents.push(id);
    if (t.fx === "start") this.state.coins += t.v;
    return true;
  }

  canPrestige() { return this.state.wave >= 6 || this.state.level >= 12; }

  prestigeGain() {
    return Math.max(1, Math.floor(Math.sqrt(this.state.wave * this.state.level) / 1.8 * this.talentMult("prestige")));
  }

  doPrestige() {
    if (!this.canPrestige()) return false;
    const g = this.prestigeGain();
    this.state.prestigePts += g;
    this.state.prestigeCount++;
    this.state.souls += Math.floor(g / 2);

    const keep = {
      prestigePts: this.state.prestigePts, prestigeCount: this.state.prestigeCount,
      souls: this.state.souls, talents: this.state.talents, achievements: this.state.achievements,
      research: this.state.research, artifacts: this.state.artifacts,
      materials: this.state.materials, items: this.state.items,
      equip: this.state.equip, masteries: this.state.masteries,
      unlocks: this.state.unlocks, objectivesDone: this.state.objectivesDone,
      visitedZones: this.state.visitedZones,
      clicks: this.state.clicks, damage: this.state.damage, coinsEarned: this.state.coinsEarned,
      crits: this.state.crits, bossKills: this.state.bossKills, maxCombo: this.state.maxCombo,
      rageMaxed: this.state.rageMaxed, settings: this.state.settings, unlockedZones: this.state.unlockedZones,
    };

    Object.assign(this.state, {
      ...defaultState(), ...keep,
      coins: this.hasTalent("t3") ? 800 : 0,
    });
    this.combo = 0; this.rage = 0; this.overdrive = 0; this.heat = 0;
    this.stamina = 100; this.olegRage = 0; this.heavyCd = 0; this._autoPool = 0;
    this.killStreak = 0;
    this.spawnEnemy();
    this.emit("prestige", g);
    return true;
  }

  checkChallenge() {
    const c = CHALLENGES.find((x) => x.id === this.state.challenge);
    if (!c || !c.check(this)) return;
    this.state.coins += c.reward;
    this.emit("challenge", c);
    this.pickChallenge();
  }

  tick(dt) {
    const sec = dt / 1000;

    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) { this.combo = 0; this.emit("comboReset"); }
    }

    if (this.streakT > 0) {
      this.streakT -= dt;
      if (this.streakT <= 0) this.killStreak = 0;
    }

    if (this.weakT > 0) {
      this.weakT -= dt;
      if (this.weakT <= 0) this.spawnWeakSpot();
    }

    this.heat = Math.max(0, this.heat - sec * (8 + this.lv(this.state.research, "r_heat") * 3));
    if (this.overdrive > 0 && this.overdrive < 100) this.overdrive = Math.max(0, this.overdrive - sec * 5);
    if (this.rage > 0 && this.rage < 100) this.rage = Math.max(0, this.rage - sec * 3);

    this.stamina = Math.min(100, this.stamina + sec * 16);
    if (this.heavyCd > 0) this.heavyCd = Math.max(0, this.heavyCd - sec);

    const dps = this.autoDps();
    if (dps > 0) {
      this._autoPool += dps * sec;
      if (this._autoPool >= 1) {
        const dmg = Math.floor(this._autoPool);
        this._autoPool -= dmg;
        this.dealDamage(dmg, "auto");
      }
    }

    if (this.state.buffs.frenzy) {
      for (let i = 0; i < 6 * sec; i++) {
        const { dmg } = this.rollHit(true);
        this.dealDamage(dmg, "frenzy");
      }
    }

    for (const k of Object.keys(this.state.buffs)) {
      if (k === "freeze") continue;
      this.state.buffs[k] -= sec;
      if (this.state.buffs[k] <= 0) delete this.state.buffs[k];
    }
    if (this.state.buffs.freeze) {
      this.state.buffs.freeze -= sec;
      if (this.state.buffs.freeze <= 0) delete this.state.buffs.freeze;
    }

    for (const k of Object.keys(this.state.skillCd)) {
      this.state.skillCd[k] = Math.max(0, this.state.skillCd[k] - sec);
    }

    if (this.state.enemyType === "boss" && this.state.bossTimer > 0) {
      this.state.bossTimer -= sec;
      if (this.state.bossTimer <= 0) {
        this.spawnEnemy();
        this.emit("bossFail");
      }
      // boss phase transitions
      const pct = this.state.enemyHp / this.state.enemyMaxHp;
      if (pct < 0.66 && this.state.bossPhase === 1) { this.state.bossPhase = 2; this.emit("phase", 2); }
      if (pct < 0.33 && this.state.bossPhase === 2) { this.state.bossPhase = 3; this.emit("phase", 3); }
    }

    if (this.state.enemyType === "boss" && this.state.bossPhase >= 2) {
      this.parryT -= dt;
      if (!this.parryActive && this.parryT <= 0) {
        if (Math.random() < 0.003 * this.state.bossPhase) {
          this.parryActive = true;
          this.parryWindow = 1200;
          this._counterPending = true;
          this.emit("parryReady");
        } else {
          this.parryT = 2000;
        }
      }
    }

    if (this.state.enemyHp > 0 && !this.parryActive) {
      const rageRate = 3.5 + this.state.enemyLevel * 0.55;
      const typeMult = this.state.enemyType === "boss" ? 0.5 : this.state.enemyType === "elite" ? 1.2 : 1;
      this.olegRage = Math.min(100, this.olegRage + sec * rageRate * typeMult);
      if (this.olegRage >= 100) {
        this.olegRage = 0;
        this.parryActive = true;
        this.parryWindow = 1400;
        this._counterPending = true;
        this.emit("counterReady");
      }
    }

    if (this.parryActive) {
      this.parryWindow -= dt;
      if (this.parryWindow <= 0) {
        const wasCounter = this._counterPending;
        this.parryActive = false;
        this._counterPending = false;
        if (wasCounter) this.enemyCounter();
      }
    }

    // regen
    if (!this.state.buffs.freeze && this.state.enemyHp < this.state.enemyMaxHp) {
      let reg = this.state.enemyMaxHp * 0.0015 * sec;
      if (this.state.mutator?.id === "fast_regen") reg *= 2.5;
      const iceLv = this.lv(this.state.elements, "ice");
      reg *= Math.max(0.2, 1 - iceLv * 0.04);
      this.state.enemyHp = Math.min(this.state.enemyMaxHp, this.state.enemyHp + reg);
    }

    // shock stun skip regen handled by freeze-like debuff - simplified

    if (this.state.eventT > 0) {
      this.state.eventT -= sec;
      if (this.state.eventT <= 0) { this.state.event = null; this.emit("eventEnd"); }
    }

    if (this.state.activityCd > 0) {
      this.state.activityCd = Math.max(0, this.state.activityCd - sec);
    }

    this._eventTick += dt;
    if (this._eventTick > 45000 && !this.state.event) {
      this._eventTick = 0;
      this.triggerEvent();
    }

    this.emit("tick");
  }

  getEquipped(slot) {
    const id = this.state.equip[slot];
    return id ? ITEMS[id] : null;
  }

  equipStats() {
    let dmg = 0, crit = 0, coin = 0, fishBonus = 0, heatRed = 0;
    for (const slot of Object.keys(this.state.equip)) {
      const it = this.getEquipped(slot);
      if (!it) continue;
      if (it.dmg) dmg += it.dmg;
      if (it.crit) crit += it.crit;
      if (it.coin) coin += it.coin;
      if (it.fishBonus) fishBonus += it.fishBonus;
      if (it.heatRed) heatRed += it.heatRed;
    }
    return { dmg, crit, coin, fishBonus, heatRed };
  }

  masteryLv(id) {
    return masteryLevel(this.state.masteries[id] || 0).lv;
  }

  masteryCombatMult() {
    return 1 + (this.masteryLv("combat") - 1) * 0.02;
  }

  canTravel(idx) {
    const z = ZONES[idx];
    if (!z) return false;
    return this.state.level >= (z.unlockLv || 1);
  }

  travelTo(idx) {
    if (!this.canTravel(idx) || idx === this.state.zoneIdx) return false;
    this.state.zoneIdx = idx;
    if (!this.state.visitedZones) this.state.visitedZones = [0];
    if (!this.state.visitedZones.includes(idx)) this.state.visitedZones.push(idx);
    this.emit("travel", ZONES[idx]);
    this.checkProgress();
    this.spawnEnemy();
    return true;
  }

  addMaterial(key, n) {
    this.state.materials[key] = (this.state.materials[key] || 0) + n;
    this.emit("material", { key, n });
  }

  addItem(itemId, n = 1) {
    this.state.items[itemId] = (this.state.items[itemId] || 0) + n;
  }

  gainMastery(id, xp) {
    this.state.masteries[id] = (this.state.masteries[id] || 0) + xp;
    this.emit("mastery", id);
  }

  canCraft(recipeId) {
    const r = RECIPES.find((x) => x.id === recipeId);
    if (!r) return false;
    if (this.masteryLv("craft") < r.craftLv) return false;
    for (const [k, n] of Object.entries(r.in)) {
      if ((this.state.materials[k] || 0) < n) return false;
    }
    return true;
  }

  craft(recipeId) {
    if (!this.canCraft(recipeId)) return false;
    const r = RECIPES.find((x) => x.id === recipeId);
    for (const [k, n] of Object.entries(r.in)) this.state.materials[k] -= n;
    this.addItem(r.out, 1);
    this.gainMastery("craft", 15 + r.craftLv * 5);
    this.emit("craft", r);
    this.checkProgress();
    return true;
  }

  equipItem(itemId) {
    const it = ITEMS[itemId];
    if (!it || !(this.state.items[itemId] > 0)) return false;
    const old = this.state.equip[it.slot];
    if (old) this.addItem(old, 1);
    this.state.equip[it.slot] = itemId;
    this.state.items[itemId]--;
    if (this.state.items[itemId] <= 0) delete this.state.items[itemId];
    this.emit("equip", itemId);
    this.checkProgress();
    return true;
  }

  unequip(slot) {
    const id = this.state.equip[slot];
    if (!id) return false;
    this.addItem(id, 1);
    this.state.equip[slot] = null;
    this.emit("unequip", slot);
    return true;
  }

  fish() {
    const zone = ZONES[this.state.zoneIdx];
    if (!ZONE_ACTIVITIES[zone.id]?.fish || this.state.activityCd > 0) return false;

    const fishLv = this.masteryLv("fishing");
    const eq = this.equipStats();
    const chance = 0.5 + fishLv * 0.025 + eq.fishBonus;
    let caught = 0;

    if (Math.random() < chance) {
      caught = 1 + Math.floor(Math.random() * (1 + fishLv / 3));
      this.addMaterial("fish", caught);
      this.gainMastery("fishing", 8 + caught * 2);
    } else {
      this.gainMastery("fishing", 3);
    }
    this.state.activityCd = 2;
    this.emit("fish", caught);
    return true;
  }

  gather() {
    const zone = ZONES[this.state.zoneIdx];
    const act = ZONE_ACTIVITIES[zone.id];
    if (!act?.gather || this.state.activityCd > 0) return false;

    const scav = this.masteryLv("scavenge");
    const amount = 1 + Math.floor(Math.random() * (2 + scav / 4));
    this.addMaterial(act.gather, amount);
    this.gainMastery("scavenge", 6 + amount);
    if (act.gather === "wood") this.gainMastery("craft", 2);
    this.state.activityCd = 1.8;
    this.emit("gather", { mat: act.gather, amount });
    this.checkProgress();
    return true;
  }

  rest() {
    const zone = ZONES[this.state.zoneIdx];
    if (!ZONE_ACTIVITIES[zone.id]?.rest || this.state.activityCd > 0) return false;
    this.heat = 0;
    this.rage = Math.min(100, this.rage + 15);
    this.gainMastery("endurance", 10);
    this.state.activityCd = 3;
    this.emit("rest");
    return true;
  }

  zoneActivities() {
    return ZONE_ACTIVITIES[ZONES[this.state.zoneIdx].id] || {};
  }

  triggerEvent() {
    const e = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    this.state.event = { ...e };
    this.state.eventT = e.dur;
    this.emit("event", e);
  }
}
