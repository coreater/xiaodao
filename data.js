'use strict';

const DATA = {
  realms: [
    { id:'qiLian1', name:'炼气一层', maxXiu:100,  hpBonus:0,   atkBonus:0,  defBonus:0,  baseExp:2 },
    { id:'qiLian2', name:'炼气二层', maxXiu:250,  hpBonus:20,  atkBonus:2,  defBonus:1,  baseExp:4 },
    { id:'qiLian3', name:'炼气三层', maxXiu:500,  hpBonus:45,  atkBonus:5,  defBonus:2,  baseExp:7 },
    { id:'qiLian4', name:'炼气四层', maxXiu:900,  hpBonus:80,  atkBonus:9,  defBonus:4,  baseExp:12 },
    { id:'qiLian5', name:'炼气五层', maxXiu:1500, hpBonus:130, atkBonus:14, defBonus:6,  baseExp:18 },
    { id:'zhuJi1',  name:'筑基初期', maxXiu:5000, hpBonus:300, atkBonus:35, defBonus:15, baseExp:40, needItem:'zhujiDan' }
  ],

  areas: [
    { id:'forest', name:'青云山外围', desc:'山脚树林，野兽出没。',   minRealm:0, enemies:['wolf','boar'] },
    { id:'cave',   name:'幽冥洞窟',   desc:'山腰古洞，妖兽凶猛。', minRealm:3, enemies:['batMonster','caveSpider'] }
  ],

  enemies: {
    wolf:       { name:'野狼',     hp:35,  atk:7,  def:1,  stone:[5,10],  drop:[] },
    boar:       { name:'山猪',     hp:55,  atk:9,  def:3,  stone:[8,15],  drop:[] },
    batMonster: { name:'蝙蝠妖',   hp:120, atk:24, def:8,  stone:[20,35], drop:[] },
    caveSpider: { name:'洞窟蜘蛛', hp:150, atk:22, def:12, stone:[25,40], drop:[{ item:'zhujiDan', rate:0.1 }] }
  },

  items: {
    zhujiDan: { name:'筑基丹', type:'consumable', desc:'突破筑基期的必要丹药。' }
  },

  buildings: {
    cultivationRoom: {
      name: '洞府聚灵阵',
      desc: '提升打坐修为吸收率',
      levels: [
        { cost:0,   bonus:0,   desc:'无增幅' },
        { cost:50,  bonus:0.5, desc:'吸收率 +50%' },
        { cost:200, bonus:1.0, desc:'吸收率 +100%' },
        { cost:800, bonus:2.0, desc:'吸收率 +200%' }
      ]
    }
  },

  gourd: {
    tickRate:    3,    // 每N秒产出一次蓝色气泡
    stoneCost:   1,    // 每次消耗灵石数
    expPerStone: 5,    // 每灵石转化修为
    maxCapacity: 100   // 葫芦最大储能
  },

  meditation: {
    tickRate:   3,   // 每N秒产出一次金色气泡
    maxBubbles: 10   // 屏幕最多气泡数
  },

  seclude: {
    cost:        50,  // 消耗灵石
    hoursReward: 2    // 等效小时数
  }
};
