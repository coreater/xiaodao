'use strict';

const Combat = {

  start(enemyId) {
    const e = DATA.enemies[enemyId];
    Game.s.inBattle    = true;
    Game.s.battleEnemy = enemyId;
    Game.s.enemyHp     = e.hp;
    UI.log(`⚔ 遭遇【${e.name}】！`, 'combat');
    UI.battlePanel(Game.s);
    UI.renderGeneric(Game.s);
    setTimeout(() => this._round(), 800);
  },

  _round() {
    if (!Game.s.inBattle) return;
    const s = Game.s;
    const e = DATA.enemies[s.battleEnemy];

    // 玩家攻击
    const pDmg = Math.max(1, Calc.atk(s) - e.def);
    s.enemyHp -= pDmg;
    UI.log(`你造成 ${pDmg} 伤害`, 'combat');

    if (s.enemyHp <= 0) { this._end(true, e); return; }

    // 敌人反击
    const eDmg = Math.max(1, e.atk - Calc.def(s));
    s.hp -= eDmg;
    UI.log(`受到 ${eDmg} 伤害`, 'dmg');

    if (s.hp <= 0) { this._end(false, e); return; }

    UI.battlePanel(s);
    UI.topBar(s);
    setTimeout(() => this._round(), 800);
  },

  _end(win, e) {
    const s = Game.s;
    s.inBattle    = false;
    s.battleEnemy = null;
    document.getElementById('battle-area').style.display = 'none';

    if (win) {
      const st = e.stone[0] + Math.floor(Math.random() * (e.stone[1] - e.stone[0] + 1));
      s.stone += st;
      UI.log(`✓ 击败【${e.name}】，获得灵石 +${st}`, 'reward');
      e.drop.forEach(d => {
        if (Math.random() < d.rate) {
          s.bag[d.item] = (s.bag[d.item] || 0) + 1;
          UI.log(`获得物品【${DATA.items[d.item].name}】`, 'reward');
        }
      });
    } else {
      s.hp = Math.max(1, Math.floor(Calc.maxHp(s) * 0.2));
      UI.log(`✗ 被击败，逃回洞府。气血剩余 ${s.hp}`, 'warn');
      Game.switchTab('cultivate');
    }

    UI.refresh(s);
    Game.save();
  }
};
