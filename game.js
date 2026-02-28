'use strict';

function newState() {
  return {
    ver: 4,
    realmIndex: 0, baseHp: 100, baseAtk: 10, baseDef: 3,
    hp: 100, xiu: 0, stone: 100,
    bag: {}, buildings: { cultivationRoom: 0 },
    tab: 'cultivate',
    inBattle: false, battleEnemy: null, enemyHp: 0,
    bubbles: [], gourdStones: 0,
    lastTick: Date.now()
  };
}

const Game = {
  s: null,
  _loopTimer:   null,
  _tickCounter: 0,

  // ── 初始化 ────────────────────────────────────────────
  init() {
    this.s = this._load() || newState();
    this.s.inBattle = false;
    this.calcOfflineProgress();
    UI.refresh(this.s);
    UI.setTab(this.s.tab);
    this._updateScene();
    UI.log('═══════════════════════════', 'sys');
    UI.log('    问道 · 境界系统 2.0    ', 'realm');
    UI.log('═══════════════════════════', 'sys');
    if (this._loopTimer) clearInterval(this._loopTimer);
    this._loopTimer = setInterval(() => this.tick(), 1000);
  },

  // ── 主循环 (每秒) ─────────────────────────────────────
  tick() {
    if (this.s.inBattle) return;
    this._tickCounter++;
    let upd = false;

    if (this._tickCounter % DATA.meditation.tickRate === 0) {
      this._genBubble('gold', Calc.meditationExp(this.s));
      upd = true;
    }
    if (this._tickCounter % DATA.gourd.tickRate === 0 && this.s.gourdStones > 0) {
      this.s.gourdStones -= DATA.gourd.stoneCost;
      this._genBubble('blue', Calc.gourdExp(this.s));
      upd = true;
    }

    this.s.lastTick = Date.now();
    if (upd && this.s.tab === 'cultivate') UI.renderCultivate(this.s);
  },

  // ── 气泡生成 ──────────────────────────────────────────
  _genBubble(type, exp) {
    const same = this.s.bubbles.filter(b => b.type === type);
    if (this.s.bubbles.length >= DATA.meditation.maxBubbles) {
      if (same.length > 0) { same[0].exp += exp; }
      else { this.s.bubbles.shift(); this.s.bubbles.push({ id: Date.now() + Math.random(), type, exp }); }
    } else {
      this.s.bubbles.push({ id: Date.now() + Math.random(), type, exp });
    }
  },

  // ── 气泡收集 ──────────────────────────────────────────
  collectBubble(id) {
    const idx = this.s.bubbles.findIndex(b => b.id === id);
    if (idx === -1) return;
    const b = this.s.bubbles[idx];
    this.s.xiu += b.exp;
    this.s.bubbles.splice(idx, 1);
    UI.log(`吸收气泡，获得修为 +${b.exp}`, b.type === 'gold' ? 'reward' : 'event');
    if (this.s.xiu >= Calc.realm(this.s).maxXiu && Calc.canBreak(this.s).ok)
      UI.log('✦ 修为已圆满，可尝试突破！', 'realm');
    UI.topBar(this.s);
    if (this.s.tab === 'cultivate') UI.renderCultivate(this.s);
    this.save();
  },

  collectAllBubbles() {
    if (this.s.bubbles.length === 0) return;
    let tot = 0;
    this.s.bubbles.forEach(b => tot += b.exp);
    this.s.xiu    += tot;
    this.s.bubbles = [];
    UI.log(`吸收所有气泡，共获得修为 +${tot}`, 'reward');
    UI.topBar(this.s);
    if (this.s.tab === 'cultivate') UI.renderCultivate(this.s);
    this.save();
  },

  // ── 葫芦充能 ──────────────────────────────────────────
  chargeGourd() {
    const spc = DATA.gourd.maxCapacity - this.s.gourdStones;
    const amt = Math.min(10, spc, this.s.stone);
    if (amt <= 0) return;
    this.s.stone      -= amt;
    this.s.gourdStones += amt;
    UI.log(`向化灵葫芦投入 ${amt} 灵石`, 'sys');
    UI.topBar(this.s);
    if (this.s.tab === 'cultivate') UI.renderCultivate(this.s);
    this.save();
  },

  // ── 深度闭关 ──────────────────────────────────────────
  seclude() {
    if (this.s.stone < DATA.seclude.cost) {
      UI.log(`灵石不足，闭关需要 ${DATA.seclude.cost} 灵石`, 'warn');
      return;
    }
    this.s.stone -= DATA.seclude.cost;
    const gain    = DATA.seclude.hoursReward * 60 * Calc.totalSpeedPerMin(this.s);
    this.s.xiu   += gain;
    UI.log(`消耗 ${DATA.seclude.cost} 灵石进行深度闭关...`, 'sys');
    UI.log(`闭关结束！获得相当于 ${DATA.seclude.hoursReward} 小时的修为：+${gain}`, 'reward');
    if (this.s.xiu >= Calc.realm(this.s).maxXiu && Calc.canBreak(this.s).ok)
      UI.log('✦ 修为已圆满，可尝试突破！', 'realm');
    UI.topBar(this.s);
    if (this.s.tab === 'cultivate') UI.renderCultivate(this.s);
    this.save();
  },

  // ── 离线收益 ──────────────────────────────────────────
  calcOfflineProgress() {
    const now = Date.now();
    const off = Math.floor((now - this.s.lastTick) / 1000);
    if (off < 10) return;
    const mT = Math.floor(off / DATA.meditation.tickRate);
    if (mT > 0) this._genBubble('gold', mT * Calc.meditationExp(this.s));
    const gT = Math.min(Math.floor(off / DATA.gourd.tickRate), this.s.gourdStones);
    if (gT > 0) { this.s.gourdStones -= gT * DATA.gourd.stoneCost; this._genBubble('blue', gT * Calc.gourdExp(this.s)); }
    this.s.lastTick = now;
    UI.log(`离线 ${UI.formatTime(off)}，凝聚了巨大的修为气泡。`, 'sys');
  },

  // ── 突破 ──────────────────────────────────────────────
  tryBreakthrough() {
    const chk = Calc.canBreak(this.s);
    if (!chk.ok) { UI.log(`突破失败：${chk.reason}`, 'warn'); return; }
    const nx = DATA.realms[this.s.realmIndex + 1];
    if (nx.needItem) { this.s.bag[nx.needItem]--; UI.log(`消耗【${DATA.items[nx.needItem].name}】×1`, 'sys'); }
    this.s.xiu = 0; this.s.realmIndex++; this.s.hp = Calc.maxHp(this.s);
    document.getElementById('modal-box').classList.add('glow');
    setTimeout(() => document.getElementById('modal-box').classList.remove('glow'), 1200);
    UI.log('══════════════════════════', 'realm');
    UI.log(`  ✦ 恭喜突破！晋升【${nx.name}】！  `, 'realm');
    UI.log('══════════════════════════', 'realm');
    UI.refresh(this.s);
    this.save();
  },

  // ── 探索 ──────────────────────────────────────────────
  explore(id) {
    if (this.s.inBattle) return;
    const a = DATA.areas.find(x => x.id === id);
    if (!a) return;
    if (this.s.realmIndex < a.minRealm) { UI.log(`修为不足，无法进入【${a.name}】`, 'warn'); return; }
    UI.scene(a.name, a.desc);
    Combat.start(a.enemies[Math.floor(Math.random() * a.enemies.length)]);
  },

  // ── 建筑升级 ──────────────────────────────────────────
  upgradeBuilding(id) {
    const bd = DATA.buildings[id];
    const lv = this.s.buildings[id];
    const nx = bd.levels[lv + 1];
    if (!nx || this.s.stone < nx.cost) return;
    this.s.stone -= nx.cost;
    this.s.buildings[id]++;
    UI.log(`【${bd.name}】升级！${nx.desc}`, 'reward');
    UI.refresh(this.s);
    this.save();
  },

  // ── Tab 切换 ──────────────────────────────────────────
  switchTab(id) {
    if (this.s.inBattle) { UI.log('战斗中无法切换界面', 'warn'); return; }
    this.s.tab = id;
    UI.setTab(id);
    this._updateScene();
    UI.refresh(this.s);
  },

  _updateScene() {
    const map = {
      cultivate: { t:'洞府·修炼室', d:'你盘坐于蒲团之上，天地灵气化作气泡浮现。' },
      explore:   { t:'洞府·门口',   d:'踏出洞府，选择一处区域进行历练。' },
      cave:      { t:'洞府·管理',   d:'升级洞府
