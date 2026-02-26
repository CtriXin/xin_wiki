# 项目：火柴人装备大师 - 地牢守卫 (Stickman Gear Master)

## 项目概述

基于儿童手绘设计（火柴人职业、装备稀有度、基地建设、地牢层数）的 2D 防守游戏。
核心循环：职业切换 → 击杀升级装备稀有度 → 守卫基地 → 解锁新地牢层。

## 技术栈

- 单文件 HTML5 + Canvas API
- ES6 模块化（开发时）→ 内联打包（发布时）
- 本地存储 (localStorage) 存档
- 响应式设计 (移动端/桌面端)

## 设计文档映射（对应手绘图）

### 图1：职业系统 (src/systems/class.js)

- 战士(Warrior): 近战, 高血量(150), 防御姿态
- 弓箭手(Archer): 远程(200px), 穿透箭
- 法师(Mage): 远程(150px), AOE冰冻, 低血量(60)
- 刺客(Assassin): 近战, 高速(5px/f), 30%暴击率
- 实现：底部固定栏切换，改变玩家实体属性

### 图2+图7：装备稀有度 (src/systems/gear.js)

稀有度等级（10级）：0.黑铁(#7f8c8d) 1.青铜 2.白银 3.黄金(#ffd700) 4.铂金5.钻石(#00bfff) 6.星耀 7.王者 8.传说 9.史诗(#9400d3) 10.神器(#e74c3c)

机制：

- 每击杀 (rarity+1)\*5 个敌人自动升级当前装备
- 升级时播放特效，改变边框颜色（参考图4背包高亮）
- 伤害倍率：1.0 → 1.5 → 2.2 → 3.5 → 5.0...

### 图3+图8：基地与地牢层 (src/systems/base.js)

- 基地有血条(1000HP)，敌人接触造成伤害
- 每5波清理后解锁"下一层"（背景色变深，敌人加强）
- 地牢层数影响：敌人血量倍数、移动速度、生成频率

### 图4+图6：背包系统 (src/ui/inventory.js)

- 4个快捷装备槽（对应4职业推荐装备）
- 点击切换当前装备（影响攻击特效和伤害）
- 装备图标使用 Emoji + CSS边框颜色表示稀有度

### 图5：战斗特效 (src/vfx/particles.js)

- 火柴人简笔画风格（线段动画）
- 血迹粒子（红色#d32f2f，短暂停留）
- 升级光效（金色粒子爆发）
- 暴击文字（浮动"+暴击!"）

## 代码架构

src/
├── core/
│ ├── game.js # 游戏主循环，状态管理
│ ├── config.js # 职业/稀有度/波次配置
│ └── save.js # localStorage 存档读取
├── entities/
│ ├── player.js # 火柴人玩家，渲染+AI
│ ├── enemy.js # 僵尸敌人，寻路逻辑
│ └── projectile.js # 箭矢/魔法弹
├── systems/
│ ├── class.js # 职业切换逻辑
│ ├── gear.js # 装备升级计算
│ ├── wave.js # 波次生成器
│ └── base.js # 基地血量管理
├── ui/
│ ├── inventory.js # 背包DOM交互
│ ├── classbar.js # 职业切换按钮
│ └── hud.js # 血条/资源显示
└── vfx/
├── particles.js # 粒子系统
└── renderer.js # Canvas绘制辅助

## 核心机制详细设计

### 1. 自动战斗+手动技能

- 玩家自动攻击范围内敌人（根据职业决定射程）
- 点击屏幕：朝点击方向冲刺并释放技能（战士冲锋/法师冰环）
- 冷却时间显示在角色头顶

### 2. 装备成长曲线

每波敌人数量 = 5 + wave*2
敌人血量 = base_hp * (1.2 ^ wave)
玩家伤害 = base_dmg \* rarity_multiplier

升级条件：累计击杀数达到阈值自动升级当前装备

- 黑铁→黄金：击杀5个
- 黄金→钻石：击杀10个
- 钻石→史诗：击杀15个
- 史诗→神器：击杀20个

### 3. 地牢层解锁

第1层（草地）：基础僵尸，慢速
第2层（洞穴）：骷髅，中速，偶尔冲锋
第3层（熔岩）：火焰僵尸，快速，灼烧伤害
第4层（冰原）：冰霜巨人，极慢，高血量

每层背景色渐变，敌人颜色主题变化。

## CLI Git 工作流

初始化：
git init stickman-gear-master
git checkout -b main
git checkout -b develop

功能分支（按优先级）：

1. feature/core-loop # 基础游戏循环+绘制
2. feature/class-system # 4职业切换
3. feature/gear-rarity # 装备升级系统
4. feature/base-defense # 基地血条+游戏结束
5. feature/wave-system # 波次生成器
6. feature/particles # 特效系统
7. feature/save-load # 存档功能
8. feature/dungeon-layer # 多层地牢

提交规范：
feat: 添加法师AOE冰冻特效
fix: 修复弓箭手射程计算错误  
balance: 调整第3波敌人血量
assets: 添加新稀有度边框资源

## 开发阶段（MVP路线）

### 当前实现进度（2026-02-14）

- 已完成单文件可运行版本（Canvas 主循环 + 角色/敌人/基地渲染）
- 已完成 4 职业自动攻击 + 点击施法技能（冲锋/穿透箭/冰环/影袭）
- 已完成 10 级装备稀有度与每槽击杀升级逻辑
- 已完成波次系统与地牢层系统（每 5 波升层，层数影响敌人参数与背景）
- 已完成基地防守、游戏结束与本地存档（最高层数/击杀）
- 已完成代码结构拆分：`index.html + styles.css + src/*.js`
- 已接入原画素材（`ref/`）作为地图草图背景、基地草图卡片、动作/武器灵感提示
- 新增进化敌人（受“进化草图”启发）：高血量、高伤害、特殊外观
- 已完成战斗改为“手动点击优先”：
  - 点怪攻击，点地移动
  - 战士/刺客支持全屏二维移动
  - 战士冲锋 CD 0.5s，超距会先走位再冲锋
  - 刺客超距会先走位，再触发背刺
- 已完成波次节奏优化：波间准备时间显著拉长，并在提示区显示倒计时
- 已完成布局防遮挡优化：
  - 基地置于屏幕中部
  - 职业栏在底部，选择后可收起/展开
  - 左右信息区（resources/sketchHint）改为点击穿透，仅展示
- 已完成“每波开始弹出装备台”流程（短暂显示后自动收起）
- 已完成“孩子手绘自定义”扩展：
  - 可替换人物、怪物、房子、弹道
  - 新增可替换掉落图标（钻石/治疗/狂怒）与背景印记
- 已完成“职业武器库”雏形：
  - 每个职业 4 把武器（通用弱武器 + 对应克制武器 + 最强限制武器）
  - 最强武器加入限制（冷却/连击门槛/目标类型）
  - 技能改为 3 阶成长（随波次阶段解锁）
- 待完成：音效占位（Tone.js）与更细化的逐帧动作贴图

### Week 1: 核心验证

- [x] 实现火柴人绘制函数（线段+Emoji武器）
- [x] 基础移动和朝向
- [x] 单个敌人AI（朝基地移动）
- [x] 伤害计算与击杀

### Week 2: 职业与装备

- [x] 实现4职业属性差异
- [x] 底部切换栏UI
- [x] 装备稀有度数据结构
- [x] 击杀升级逻辑

### Week 3: 波次与基地

- [x] 波次配置文件
- [x] 敌人生成器（随时间生成）
- [x] 基地血条+受击特效
- [x] 游戏结束与重新开始

### Week 4: polish

- [x] 粒子特效（血迹、升级光）
- [x] 伤害数字浮动显示
- [x] 存档系统（保存最高层数）
- [ ] 音效占位（Tone.js）

## 关键代码片段预览

// 职业配置 (config.js)
export const CLASSES = {
warrior: {
hp: 150, damage: 15, range: 60, speed: 2,
color: '#e74c3c', icon: '🛡️',
skill: 'charge' // 冲锋击退
},
archer: {
hp: 80, damage: 12, range: 200, speed: 3,
color: '#27ae60', icon: '🏹',
skill: 'pierce' // 穿透射击
},
mage: {
hp: 60, damage: 25, range: 150, speed: 2,
color: '#9b59b6', icon: '🔮', aoe: true,
skill: 'freeze' // 冰冻环
},
assassin: {
hp: 90, damage: 30, range: 50, speed: 5,
color: '#34495e', icon: '🗡️', crit: 0.3,
skill: 'blink' // 瞬移背后
}
};

// 装备升级 (gear.js)
export function checkUpgrade(kills, currentRarity) {
const thresholds = [5, 15, 30, 50]; // 累积击杀阈值
if (currentRarity &lt; thresholds.length &&
kills &gt;= thresholds[currentRarity]) {
return currentRarity + 1; // 升级
}
return currentRarity;
}

## 美术风格指南

- 火柴人：线段绘制，2px线宽，圆角线帽
- 敌人：绿色(#2e7d32)僵尸，红色眼睛
- 特效：低透明度粒子，短暂存活(30帧)
- UI：Minecraft风格棕色调，金色高亮

## 性能目标

- 同屏敌人&lt;50个
- 粒子&lt;100个
- 60FPS on mobile
- 单文件&lt;100KB (gzip)

## 扩展预留

- 多人联机 (WebRTC)
- 自定义地图编辑器（类似图8手绘）
- 装备合成公式（3合1进阶）
- 成就系统（通关无伤/极速击杀）
