'use strict';

const Calc = {
  realm(s)  { return DATA.realms[s.realmIndex]; },
  maxHp(s)  { return s.baseHp  + this.realm(s).hpBonus; },
  atk(s)    { return s.baseAtk + this.realm(s).atkBonus; },
  def(s)    { return s.baseDef + this.realm(s).defBonus; },

  // 打坐单次气泡经验 = 境界基础 × (1 + 洞府增幅)
  meditationExp(s) {
    const base  = this.realm(s).baseExp;
    const bonus = DATA.buildings.cultivationRoom.levels[s.buildings.cultivationRoom].bonus;
    return Math.ceil(base * (1 + bonus));
  },

  gourdExp(s) { return DATA.gourd.expPerStone; },

  // 总修炼速度（每分钟）
  totalSpeedPerMin(s) {
    const medSpd = (this.meditationExp(s) / DATA.meditation.tickRate) * 60;
    const grdSpd = s.gourdStones > 0 ? (this.gourdExp(s) / DATA.gourd.tickRate) * 60 : 0;
    return Math.floor(medSpd + grdSpd);
  },

  // 距离突破剩余秒数
  timeToBreakthrough(s) {
    const r = this.realm(s);
    if (s.xiu >= r.maxXiu) return 0;
    const spd = this.totalSpeedPerMin(s) / 60;
    return spd <= 0 ? 999999 : Math.ceil((r.maxXiu - s.xiu) / spd);
  },

  // 是否可以突破
  canBreak(s) {
    const r = this.realm(s);
    if (s.xiu < r.maxXiu) return { ok: false, reason: '修为不足' };
    if (s.realmIndex >= DATA.realms.length - 1) return { ok: false, reason: '已是最高境界' };
    const next = DATA.realms[s.realmIndex + 1];
    if (next.needItem && (s.bag[next.needItem] || 0) <= 0)
      return { ok: false, reason: `需【${DATA.items[next.needItem].name}】` };
    return { ok: true };
  }
};