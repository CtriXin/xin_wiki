export const SAVE_KEY = 'zombie-kid-save-v3';

export const CONFIG = {
  classes: {
    warrior: { hp: 150, dmg: 15, range: 76, color: '#e74c3c', skillCd: 240, skillName: '冲锋斩', atkInterval: 22 },
    archer: { hp: 80, dmg: 9, range: 240, color: '#27ae60', skillCd: 170, skillName: '穿透箭', atkInterval: 12 },
    mage: { hp: 60, dmg: 30, range: 200, color: '#3498db', skillCd: 300, skillName: '冰环', atkInterval: 34 },
    assassin: { hp: 90, dmg: 22, range: 64, color: '#9b59b6', skillCd: 220, skillName: '影袭', atkInterval: 16 },
    miner: { hp: 120, dmg: 13, range: 90, color: '#d4a373', skillCd: 200, skillName: '震地采掘', atkInterval: 20 }
  },
  rarities: [
    { name: '黑铁', color: '#7f8c8d', bonus: 1.0 },
    { name: '青铜', color: '#a97142', bonus: 1.15 },
    { name: '白银', color: '#c0c0c0', bonus: 1.32 },
    { name: '黄金', color: '#ffd700', bonus: 1.5 },
    { name: '铂金', color: '#89cff0', bonus: 1.8 },
    { name: '钻石', color: '#00bfff', bonus: 2.2 },
    { name: '星耀', color: '#00e5ff', bonus: 2.8 },
    { name: '王者', color: '#ff5722', bonus: 3.5 },
    { name: '传说', color: '#ff9800', bonus: 4.4 },
    { name: '史诗', color: '#9400d3', bonus: 5.6 },
    { name: '神器', color: '#e74c3c', bonus: 7.0 }
  ],
  layers: [
    { name: '草地图', top: '#6ab04c', bottom: '#2f3640', enemy: '#2e7d32', hpMul: 1.0, speedMul: 1.0, spawnMul: 1.0 },
    { name: '洞穴图', top: '#485460', bottom: '#1e272e', enemy: '#bdc3c7', hpMul: 1.25, speedMul: 1.15, spawnMul: 1.12 },
    { name: '熔岩图', top: '#6d214f', bottom: '#b33939', enemy: '#ff5252', hpMul: 1.55, speedMul: 1.3, spawnMul: 1.25 },
    { name: '冰原图', top: '#74b9ff', bottom: '#0984e3', enemy: '#dfe6e9', hpMul: 1.95, speedMul: 0.9, spawnMul: 1.35 }
  ],
  miningMaps: [
    { name: '林地矿井', top: '#7fbf5b', bottom: '#426c3e', oreBonus: 1, gemBonus: 1, coreBonus: 1, tile: '#6b8f5a' },
    { name: '水晶洞窟', top: '#6ec5ff', bottom: '#315a86', oreBonus: 1.1, gemBonus: 1.35, coreBonus: 1.1, tile: '#78a9d5' },
    { name: '熔岩矿脉', top: '#c96a43', bottom: '#6b2f28', oreBonus: 1.22, gemBonus: 1.05, coreBonus: 1.35, tile: '#9c5a3f' }
  ],
  classGears: {
    warrior: [
      { type: 'warrior_train', icon: '🗡️', name: '训练短剑', baseMul: 0.85, bonus: {} },
      { type: 'warrior_break', icon: '🪓', name: '破甲战斧', baseMul: 1.02, bonus: { armored: 1.45, evolved: 1.35 } },
      { type: 'warrior_lance', icon: '🔱', name: '守卫长枪', baseMul: 1.1, bonus: { swarm: 1.3 } },
      { type: 'warrior_ultimate', icon: '⚔️', name: '战神巨剑', baseMul: 1.75, bonus: { armored: 1.6, evolved: 1.7 }, ultimate: true, cooldownFrames: 180, needCombo: 3, allowedKinds: ['armored', 'evolved'] }
    ],
    archer: [
      { type: 'archer_train', icon: '🏹', name: '木弓', baseMul: 0.82, bonus: {} },
      { type: 'archer_pierce', icon: '🎯', name: '穿甲弩', baseMul: 1.0, bonus: { armored: 1.45, evolved: 1.35 } },
      { type: 'archer_swift', icon: '🪶', name: '猎风连弓', baseMul: 1.08, bonus: { swift: 1.5, swarm: 1.2 } },
      { type: 'archer_ultimate', icon: '🌠', name: '天穹神弓', baseMul: 1.7, bonus: { swarm: 1.7, evolved: 1.45 }, ultimate: true, cooldownFrames: 200, needCombo: 2, allowedKinds: ['swarm', 'evolved'] }
    ],
    mage: [
      { type: 'mage_train', icon: '🪄', name: '学徒法球', baseMul: 0.84, bonus: {} },
      { type: 'mage_storm', icon: '⚡', name: '雷霆法典', baseMul: 1.02, bonus: { swarm: 1.45, swift: 1.25 } },
      { type: 'mage_frostfire', icon: '❄️', name: '冰焰法杖', baseMul: 1.14, bonus: { armored: 1.35, evolved: 1.35 } },
      { type: 'mage_ultimate', icon: '🔱', name: '禁术之眼', baseMul: 1.8, bonus: { evolved: 1.7, armored: 1.5 }, ultimate: true, cooldownFrames: 220, needCombo: 2, allowedKinds: ['armored', 'evolved'] }
    ],
    assassin: [
      { type: 'assassin_train', icon: '🔪', name: '练习匕首', baseMul: 0.86, bonus: {} },
      { type: 'assassin_toxic', icon: '☠️', name: '毒牙双刃', baseMul: 1.05, bonus: { normal: 1.35, swift: 1.2 } },
      { type: 'assassin_shadow', icon: '🥷', name: '影遁苦无', baseMul: 1.1, bonus: { swift: 1.5, swarm: 1.2 } },
      { type: 'assassin_ultimate', icon: '☄️', name: '终焉镰刀', baseMul: 1.78, bonus: { evolved: 1.75, armored: 1.5 }, ultimate: true, cooldownFrames: 185, needCombo: 3, allowedKinds: ['evolved', 'armored'] }
    ],
    miner: [
      { type: 'miner_train', icon: '⛏️', name: '木镐', baseMul: 0.88, bonus: { armored: 1.15 } },
      { type: 'miner_iron', icon: '🪓', name: '铁镐', baseMul: 1.06, bonus: { armored: 1.35, evolved: 1.2 } },
      { type: 'miner_gold', icon: '🛠️', name: '金纹钻头', baseMul: 1.16, bonus: { swarm: 1.3, armored: 1.25 } },
      { type: 'miner_ultimate', icon: '💥', name: '地心爆破镐', baseMul: 1.7, bonus: { armored: 1.55, evolved: 1.45 }, ultimate: true, cooldownFrames: 170, needCombo: 2, allowedKinds: ['armored', 'evolved'] }
    ]
  },
  skillGrowth: {
    warrior: ['冲锋斩', '震地裂斩', '战神旋风'],
    archer: ['穿透箭', '三连追射', '万箭齐发'],
    mage: ['冰环', '火雨', '陨星风暴'],
    assassin: ['影袭', '影分连斩', '死亡印记'],
    miner: ['震地采掘', '爆裂矿震', '地心熔采']
  },
  refImages: {
    dungeon: './ref/微信图片_20260214223244_644_214.jpg',
    build: './ref/微信图片_20260214223245_645_214.jpg',
    castle: './ref/微信图片_20260214223246_646_214.jpg',
    battle: './ref/微信图片_20260214223247_647_214.jpg',
    grid: './ref/微信图片_20260214223247_648_214.jpg',
    forest: './ref/微信图片_20260214223248_649_214.jpg',
    baseSide: './ref/微信图片_20260214223249_650_214.jpg',
    homeFight: './ref/微信图片_20260214223250_651_214.jpg',
    evolution: './ref/微信图片_20260214223251_652_214.jpg',
    stats: './ref/微信图片_20260214223252_653_214.jpg',
    tower: './ref/微信图片_20260214223253_654_214.jpg',
    weapons: './ref/微信图片_20260214223254_655_214.jpg',
    actions: './ref/微信图片_20260214223255_656_214.jpg'
  }
};
