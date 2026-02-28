'use strict';

const UI = {

  refresh(s) {
    this.topBar(s);
    if (s.tab === 'cultivate') this.renderCultivate(s);
    else this.renderGeneric(s);
  },

  topBar(s) {
    const mhp = Calc.maxHp(s);
    document.getElementById('ui-realm').textContent    = Calc.realm(s).name;
    document.getElementById('ui-hp-text').textContent  = `${s.hp}/${mhp}`;
    document.getElementById('ui-xiu-text').textContent = `${s.xiu}/${Calc.realm(s).maxXiu}`;
    document.getElementById('ui-stone').textContent    = s.stone;
    document.getElementById('ui-hp-bar').style.width   = `${(s.hp / mhp) * 100}%`;
    document.getElementById('ui-xiu-bar').style.width  = `${Math.min((s.xiu / Calc.realm(s).maxXiu) * 100, 100)}%`;
  },

  formatTime(sec) {
    if (sec === 0)       return '00:00:00';
    if (sec > 3599999)   return '999小时+';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  },

  // ── 修炼界面 ──────────────────────────────────────────
  renderCultivate(s) {
    document.getElementById('cultivate-view').style.display = 'flex';
    document.getElementById('generic-view').style.display   = 'none';

    // 顶部速度 & 倒计时
    document.getElementById('c-speed').textContent = `${Calc.totalSpeedPerMin(s)} / 分钟`;
    document.getElementById('c-time').textContent  = this.formatTime(Calc.timeToBreakthrough(s));

    // 中部小人 & 经验条
    const r = Calc.realm(s);
    document.getElementById('c-realm-name').textContent = r.name;
    document.getElementById('c-exp-fill').style.width   = `${Math.min((s.xiu / r.maxXiu) * 100, 100)}%`;
    document.getElementById('c-exp-text').textContent   = `${s.xiu} / ${r.maxXiu}`;

    // 突破按钮
    const cb   = Calc.canBreak(s);
    const bBtn = document.getElementById('c-break-btn');
    bBtn.disabled    = !cb.ok;
    bBtn.textContent = `尝试突破${cb.ok ? '' : ' (' + cb.reason + ')'}`;

    // 吸收按钮
    document.getElementById('c-collect-btn').disabled = s.bubbles.length === 0;

    // 聚灵阵
    const arrayLv    = s.buildings.cultivationRoom;
    const arrayBonus = DATA.buildings.cultivationRoom.levels[arrayLv].bonus * 100;
    document.getElementById('c-array-text').innerHTML = `打坐吸收率: +${arrayBonus}%<br>基础灵气: ${r.baseExp}/次`;

    // 葫芦
    const gPct = (s.gourdStones / DATA.gourd.maxCapacity) * 100;
    document.getElementById('c-gourd-fill').style.width = `${gPct}%`;
    document.getElementById('c-gourd-text').textContent = `储能: ${s.gourdStones}/${DATA.gourd.maxCapacity} 灵石`;

    const cBtn = document.getElementById('c-charge-btn');
    const spc  = DATA.gourd.maxCapacity - s.gourdStones;
    const amt  = Math.min(10, spc, s.stone);
    cBtn.disabled    = amt <= 0;
    cBtn.textContent = amt > 0 ? `注入灵石 (${amt})` : (spc <= 0 ? '已充满' : '灵石不足');

    this.renderBubbles(s);
  },

  renderBubbles(s) {
    const area = document.getElementById('bubble-area');
    area.innerHTML = '';
    s.bubbles.forEach(b => {
      const d = document.createElement('div');
      d.className = `bubble ${b.type}`;
      d.innerHTML = `<span class="bubble-val">${b.exp}</span><span class="bubble-label">修为</span>`;
      d.onclick = () => Game.collectBubble(b.id);
      const ang = Math.random() * Math.PI * 2;
      const rad = 80 + Math.random() * 60;
      d.style.transform = `translate(${Math.cos(ang) * rad}px, ${Math.sin(ang) * rad}px)`;
      area.appendChild(d);
    });
  },

  // ── 通用界面 (探索/洞府/背包) ──────────────────────────
  renderGeneric(s) {
    document.getElementById('cultivate-view').style.display = 'none';
    document.getElementById('generic-view').style.display   = 'flex';

    const el = document.getElementById('action-area');
    el.innerHTML = '';

    if (s.inBattle) {
      el.innerHTML = '<span style="color:var(--text-dim);font-size:13px">⚔ 战斗进行中...</span>';
      return;
    }

    if (s.tab === 'explore') {
      DATA.areas.forEach(a => {
        const lk = s.realmIndex < a.minRealm;
        const b  = this._btn(a.name, lk ? '' : 'red', () => Game.explore(a.id), lk ? `需${DATA.realms[a.minRealm].name}` : '进入探索');
        b.disabled = lk;
        el.appendChild(b);
      });
    } else if (s.tab === 'cave') {
      Object.entries(DATA.buildings).forEach(([id, bd]) => {
        const lv   = s.buildings[id];
        const isMx = lv >= bd.levels.length - 1;
        const nx   = bd.levels[lv + 1];
        const can  = nx && s.stone >= nx.cost;
        const b    = this._btn(
          `${bd.name}（${lv}级${isMx ? '/满' : ''}）`,
          isMx ? '' : 'jade',
          () => Game.upgradeBuilding(id),
          isMx ? '已达上限' : `升级花费：${nx.cost}灵石`
        );
        b.disabled = isMx || !can;
        el.appendChild(b);
      });
    } else if (s.tab === 'bag') {
      el.appendChild(this._btn('📋 查看背包', '', () => this.showBag(s)));
    }

    // 属性面板
    document.getElementById('attr-grid').innerHTML = `
      <div class="attr-row"><span class="attr-name">气血上限</span><span class="attr-val" style="color:var(--red-light)">${Calc.maxHp(s)}</span></div>
      <div class="attr-row"><span class="attr-name">攻击力</span><span class="attr-val">${Calc.atk(s)}</span></div>
      <div class="attr-row"><span class="attr-name">防御力</span><span class="attr-val">${Calc.def(s)}</span></div>
    `;
  },

  // ── 战斗面板 ──────────────────────────────────────────
  battlePanel(s) {
    const show = s.inBattle;
    document.getElementById('battle-area').style.display = show ? 'block' : 'none';
    if (!show || !s.battleEnemy) return;
    const e   = DATA.enemies[s.battleEnemy];
    const mhp = Calc.maxHp(s);
    document.getElementById('b-ename').textContent     = e.name;
    document.getElementById('b-ehp').style.width       = `${Math.max(0, (s.enemyHp / e.hp) * 100)}%`;
    document.getElementById('b-ehp-text').textContent  = `${Math.max(0, s.enemyHp)}/${e.hp}`;
    document.getElementById('b-php').style.width       = `${(s.hp / mhp) * 100}%`;
    document.getElementById('b-php-text').textContent  = `${s.hp}/${mhp}`;
  },

  // ── 工具方法 ──────────────────────────────────────────
  _btn(txt, stl, cb, sub) {
    const b = document.createElement('button');
    b.className = 'btn' + (stl ? ' ' + stl : '');
    b.innerHTML = txt + (sub ? `<span class="btn-sub">${sub}</span>` : '');
    b.onclick   = cb;
    return b;
  },

  scene(t, d) {
    document.getElementById('scene-title').textContent = t;
    document.getElementById('scene-desc').textContent  = d;
  },

  log(txt, typ = 'sys') {
    const el = document.getElementById('log-area');
    const d  = document.createElement('div');
    d.className  = `log ${typ}`;
    d.textContent = txt;
    el.appendChild(d);
    while (el.children.length > 100) el.removeChild(el.firstChild);
    el.scrollTop = el.scrollHeight;
  },

  setTab(id) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const t = document.getElementById('nav-' + id);
    if (t) t.classList.add('active');
  },

  showModal(t, h, c = '关闭') {
    document.getElementById('modal-title').textContent = t;
    document.getElementById('modal-body').innerHTML    = h;
    document.getElementById('modal-close').textContent = c;
    document.getElementById('modal-overlay').classList.add('show');
  },

  closeModal() { document.getElementById('modal-overlay').classList.remove('show'); },

  showBag(s) {
    const ent = Object.entries(s.bag).filter(([, n]) => n > 0);
    if (!ent.length) {
      this.showModal('背包', '<p style="text-align:center;color:var(--text-dim);padding:20px">背包空空如也</p>');
      return;
    }
    const rows = ent.map(([id, n]) =>
      `<div class="item-row"><span class="item-name">${DATA.items[id] ? DATA.items[id].name : id}</span><span class="item-count">×${n}</span></div>`
    ).join('');
    this.showModal('背包', rows);
  }
};
