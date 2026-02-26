import { CONFIG } from './config.js';
import { imageReady } from './assets.js';
import { loadSave, saveProgress } from './save.js';

const CUSTOM_SPRITE_KEY = 'zombie-custom-sprites-v1';

export class ZombieGame {
  constructor (canvas, ui, sketchHint, images) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.sketchHint = sketchHint;
    this.images = images;

    const save = loadSave();
    this.enemyId = 1;
    const classInventories = Object.fromEntries(
      Object.entries(CONFIG.classGears).map(([className, list]) => [
        className,
        list.map((gear, idx) => ({ ...gear, rarity: 0, killsOnItem: 0, cooldown: 0, unlocked: idx === 0 }))
      ])
    );
    this.game = {
      gems: 0,
      kills: 0,
      wave: 0,
      layer: 1,
      unlockedLayer: save.bestLayer || 1,
      currentClass: 'warrior',
      equippedSlot: 0,
      classInventories,
      materials: {
        scrap: 0,
        core: 0
      },
      enemies: [],
      oreNodes: [],
      projectiles: [],
      rainZones: [],
      drops: [],
      particles: [],
      debris: [],
      base: { x: 90, y: 0, hp: 1000, maxHp: 1000 },
      waveInProgress: false,
      waitingForPlayerStart: true,
      waveSpawnTarget: 0,
      waveSpawned: 0,
      spawnInterval: 1600,
      lastSpawnAt: 0,
      nextWaveAt: performance.now() + 2600,
      actionPose: '站',
      evolvedEnemyUnlocked: false,
      combo: 0,
      comboTimer: 0,
      waveStartBaseHp: 1000,
      activeEvent: null,
      eventTimer: 0,
      buffState: {
        fury: 0,
        shield: 0
      },
      quest: {
        type: 'none',
        target: 1,
        progress: 0,
        reward: 0,
        done: false,
        text: '准备中'
      },
      tactic: {
        id: 'none',
        name: '无',
        timer: 0,
        dropBonus: 0
      },
      pendingTactics: null,
      pendingTacticDeadline: 0,
      craftHistory: {},
      visualStyle: 'line',
      paused: false,
      spawnMode: 'auto',
      learning: {
        enabled: false,
        targetAnswer: 8,
        level: 1,
        correct: 0,
        wrong: 0,
        streak: 0,
        activeEnemyId: null,
        practice: { question: '2+3', answer: '5' }
      },
      mining: {
        level: 1,
        depth: 1,
        xp: 0,
        stamina: 110,
        maxStamina: 110,
        biomeIndex: 0,
        nextNodeId: 1,
        lastSpawnAt: 0,
        quest: {
          type: 'mine_any',
          target: 4,
          progress: 0,
          reward: { gems: 24, scrap: 4, core: 0 }
        },
        backpack: {
          stone: 0,
          copper: 0,
          crystal: 0,
          myth: 0,
          ingot: 0
        },
        autoSmelt: false,
        smeltPolicy: 'rare',
        autoSmeltTimer: 0,
        panelCollapsed: false,
        activeOreId: null,
        minedOnFloor: 0,
        stair: null
      },
      world: {
        minX: 40,
        maxX: canvas.width - 40,
        minY: 50,
        maxY: canvas.height - 80
      },
      baseFlash: 0
    };

    this.player = {
      x: 0,
      y: 0,
      facing: 1,
      animFrame: 0,
      attacking: false,
      attackCooldown: 0,
      skillCooldown: 0,
      chargeCooldown: 0,
      moveSpeed: 3.2,
      targetX: null,
      targetY: null,
      aimX: 0,
      aimY: 0,
      pendingMeleeType: null,
      pendingMeleeTargetId: null,
      dash: {
        active: false,
        targetId: null,
        tx: 0,
        ty: 0
      },
      tauntTimer: 0,
      mineCooldown: 0,
      hp: 150,
      maxHp: 150
    };

    this.loop = this.loop.bind(this);
    this.handlePointer = this.handlePointer.bind(this);
    this.customSprites = {
      hero: null,
      enemy: null,
      base: null,
      projectile: null,
      dropGem: null,
      dropHeal: null,
      dropFury: null,
      bgStamp: null
    };
    this.loadCustomSprites();

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('pointerdown', this.handlePointer);

    this.regenTimer = setInterval(() => {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
      this.game.base.hp = Math.min(this.game.base.maxHp, this.game.base.hp + 0.45);
      this.game.mining.stamina = Math.min(this.game.mining.maxStamina, this.game.mining.stamina + 1.2);
    }, 1000);

    this.refreshSketchHint();
    this.updateUI();
  }

  resize () {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.game.world.minX = 36;
    this.game.world.maxX = this.canvas.width - 36;
    this.game.world.minY = 54;
    this.game.world.maxY = this.canvas.height - 170;
    this.game.base.x = this.canvas.width * 0.5 - 36;
    this.game.base.y = this.canvas.height * 0.5 - 24;
    if (this.player.x <= 0) this.player.x = this.game.base.x + 20;
    this.player.x = this.clamp(this.player.x, this.game.world.minX, this.game.world.maxX);
    if (this.player.y <= 0) this.player.y = this.game.base.y + 74;
    this.player.y = this.clamp(this.player.y, this.game.world.minY, this.game.world.maxY);
    this.game.oreNodes.forEach((n) => {
      n.x = this.clamp(n.x, this.game.world.minX + 28, this.game.world.maxX - 28);
      n.y = this.clamp(n.y, this.game.world.minY + 18, this.game.world.maxY - 14);
    });
    this.player.aimX = this.player.x;
    this.player.aimY = this.player.y;
  }

  clamp (v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  toggleVisualStyle () {
    const styles = ['line', 'block', 'toon', 'neo'];
    const idx = styles.indexOf(this.game.visualStyle);
    const next = styles[(idx + 1) % styles.length];
    const names = {
      line: '线稿模式',
      block: '方块模式',
      toon: '立体模式',
      neo: '电影模式'
    };
    this.game.visualStyle = next;
    this.showWaveInfo(`画风：${names[next]}`);
    return this.game.visualStyle;
  }

  togglePause () {
    this.game.paused = !this.game.paused;
    this.showWaveInfo(this.game.paused ? '已暂停' : '继续战斗');
    return this.game.paused;
  }

  getBaseRect () {
    return {
      x: this.game.base.x,
      y: this.game.base.y,
      w: 72,
      h: 54
    };
  }

  loadCustomSprites () {
    try {
      const raw = JSON.parse(localStorage.getItem(CUSTOM_SPRITE_KEY) || '{}');
      ['hero', 'enemy', 'base', 'projectile', 'dropGem', 'dropHeal', 'dropFury', 'bgStamp'].forEach(key => {
        if (raw[key]) {
          const img = new Image();
          img.src = raw[key];
          this.customSprites[key] = img;
        }
      });
    } catch (_) {}
  }

  setCustomSprite (target, dataUrl) {
    if (!['hero', 'enemy', 'base', 'projectile', 'dropGem', 'dropHeal', 'dropFury', 'bgStamp'].includes(target)) return false;
    const img = new Image();
    img.src = dataUrl;
    this.customSprites[target] = img;
    const prev = JSON.parse(localStorage.getItem(CUSTOM_SPRITE_KEY) || '{}');
    prev[target] = dataUrl;
    localStorage.setItem(CUSTOM_SPRITE_KEY, JSON.stringify(prev));
    this.showWaveInfo(`${target} 画稿已应用`);
    return true;
  }

  clearCustomSprite (target) {
    if (!this.customSprites[target]) {
      this.showWaveInfo(`${target} 当前未自定义`);
      return false;
    }
    this.customSprites[target] = null;
    const prev = JSON.parse(localStorage.getItem(CUSTOM_SPRITE_KEY) || '{}');
    delete prev[target];
    localStorage.setItem(CUSTOM_SPRITE_KEY, JSON.stringify(prev));
    this.showWaveInfo(`${target} 已恢复默认`);
    return true;
  }

  clearAllCustomSprites () {
    Object.keys(this.customSprites).forEach((key) => {
      this.customSprites[key] = null;
    });
    localStorage.removeItem(CUSTOM_SPRITE_KEY);
    this.showWaveInfo('已恢复全部默认画稿');
    return true;
  }

  hasCustomDraft () {
    return Boolean(
      imageReady(this.customSprites.hero) ||
      imageReady(this.customSprites.projectile) ||
      imageReady(this.customSprites.enemy)
    );
  }

  shouldAutoOpenForge () {
    if (this.game.wave <= 1) return true;
    if (this.game.wave % 4 === 0) return true;
    if (this.game.base.hp < this.game.base.maxHp * 0.62) return true;
    const canSynthesize = this.game.materials.core >= 3;
    const canRepair = this.game.gems >= 120 && this.game.materials.scrap >= 12 && this.game.base.hp < this.game.base.maxHp * 0.94;
    return canSynthesize || canRepair;
  }

  setSpawnMode (mode) {
    if (!['auto', 'top', 'side'].includes(mode)) return;
    this.game.spawnMode = mode;
    this.showWaveInfo(`刷怪模式：${mode === 'auto' ? '自动' : (mode === 'top' ? '上到下' : '全屏左右')}`);
  }

  toggleLearningChallenge () {
    this.game.learning.enabled = !this.game.learning.enabled;
    if (this.game.learning.enabled) {
      this.rollLearningTarget(true);
      this.game.learning.practice = this.createLearningPracticeQuestion();
    }
    this.showWaveInfo(this.game.learning.enabled ? `学习闯关开启：目标=${this.game.learning.targetAnswer}` : '学习闯关关闭');
    this.updateUI();
    return this.game.learning.enabled;
  }

  isLearningChallenge () {
    return this.game.learning.enabled;
  }

  getLearningTarget () {
    return this.game.learning.targetAnswer;
  }

  calcLearningLevel () {
    const st = this.game.learning;
    const total = st.correct + st.wrong;
    const accuracy = total > 0 ? (st.correct / total) : 0;
    let lv = 1;
    if (st.correct >= 8 && accuracy >= 0.68) lv = 2;
    if (st.correct >= 20 && accuracy >= 0.75) lv = 3;
    st.level = lv;
    return lv;
  }

  rollLearningTarget (silent = false) {
    const lv = this.calcLearningLevel();
    const range = lv === 1 ? { min: 2, max: 12 } : (lv === 2 ? { min: 2, max: 30 } : { min: 3, max: 81 });
    this.game.learning.targetAnswer = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
    if (!silent) this.showWaveInfo(`学习目标已切换：${this.game.learning.targetAnswer}`);
    this.updateUI();
    return this.game.learning.targetAnswer;
  }

  createLearningPracticeQuestion () {
    const lv = this.calcLearningLevel();
    const r = Math.random();
    if (lv === 1) {
      if (r < 0.45) {
        const a = 1 + Math.floor(Math.random() * 9);
        const b = 1 + Math.floor(Math.random() * 9);
        return { question: `${a}+${b}`, answer: String(a + b) };
      }
      if (r < 0.78) {
        const a = 2 + Math.floor(Math.random() * 14);
        const b = 1 + Math.floor(Math.random() * (a - 1));
        return { question: `${a}-${b}`, answer: String(a - b) };
      }
      const a = 1 + Math.floor(Math.random() * 9);
      const b = 1 + Math.floor(Math.random() * 9);
      return { question: `${a}×${b}`, answer: String(a * b) };
    }

    if (lv === 2) {
      if (r < 0.32) {
        const a = 2 + Math.floor(Math.random() * 18);
        const b = 2 + Math.floor(Math.random() * 18);
        return { question: `${a}+${b}`, answer: String(a + b) };
      }
      if (r < 0.58) {
        const b = 2 + Math.floor(Math.random() * 9);
        const c = 2 + Math.floor(Math.random() * 9);
        const a = b * c;
        return { question: `${a}÷${b}`, answer: String(c) };
      }
      if (r < 0.82) {
        const a = 2 + Math.floor(Math.random() * 12);
        const b = 2 + Math.floor(Math.random() * 12);
        return { question: `${a}×${b}`, answer: String(a * b) };
      }
      const a = 1 + Math.floor(Math.random() * 40);
      const b = 1 + Math.floor(Math.random() * 40);
      const ans = a > b ? '>' : (a < b ? '<' : '=');
      return { question: `${a} ? ${b}`, answer: ans };
    }

    if (r < 0.3) {
      const a = 12 + Math.floor(Math.random() * 50);
      const b = 5 + Math.floor(Math.random() * 40);
      return { question: `${a}+${b}`, answer: String(a + b) };
    }
    if (r < 0.56) {
      const b = 3 + Math.floor(Math.random() * 9);
      const c = 3 + Math.floor(Math.random() * 9);
      const a = b * c;
      return { question: `${a}÷${b}`, answer: String(c) };
    }
    if (r < 0.82) {
      const a = 4 + Math.floor(Math.random() * 11);
      const b = 4 + Math.floor(Math.random() * 11);
      return { question: `${a}×${b}`, answer: String(a * b) };
    }
    const a = 10 + Math.floor(Math.random() * 60);
    const b = 10 + Math.floor(Math.random() * 60);
    const ans = a > b ? '>' : (a < b ? '<' : '=');
    return { question: `${a} ? ${b}`, answer: ans };
  }

  getLearningActiveEnemy () {
    const id = this.game.learning.activeEnemyId;
    if (!id) return null;
    const enemy = this.game.enemies.find(e => e.id === id && !e.dead);
    if (!enemy) this.game.learning.activeEnemyId = null;
    return enemy || null;
  }

  submitLearningCombatAnswer (input) {
    const enemy = this.getLearningActiveEnemy();
    if (!enemy || !enemy.math) {
      this.showWaveInfo('未锁定战斗题，先点击目标怪');
      return false;
    }
    const expected = String(enemy.math.answer).trim();
    const normalized = String(input || '').trim().replace(/\s+/g, '');
    if (!normalized) {
      this.showWaveInfo('请输入战斗题答案');
      return false;
    }
    const ok = normalized === expected;
    if (ok) {
      this.game.learning.correct += 1;
      this.game.learning.streak += 1;
      this.damageEnemy(enemy, Math.max(120, enemy.maxHp * 3), '#55efc4');
      this.createFloatingText(enemy.x, enemy.y - 78, '答对命中', '#55efc4', 13);
      this.game.learning.activeEnemyId = null;
      if (this.game.learning.streak % 3 === 0) this.rollLearningTarget(true);
      this.showWaveInfo('战斗答题成功');
    } else {
      this.game.learning.wrong += 1;
      this.game.learning.streak = 0;
      this.player.hp = Math.max(0, this.player.hp - 10);
      this.createFloatingText(enemy.x, enemy.y - 78, `答错 -10HP (${expected})`, '#ff7675', 12);
      this.showWaveInfo(`战斗题错误：正确是 ${expected}`);
      if (this.player.hp <= 0) this.gameOver();
    }
    this.calcLearningLevel();
    this.updateUI();
    return ok;
  }

  submitLearningPracticeAnswer (input) {
    if (!this.game.learning.enabled) {
      this.showWaveInfo('请先开启学习模式');
      return false;
    }
    const activeEnemy = this.getLearningActiveEnemy();
    if (activeEnemy) return this.submitLearningCombatAnswer(input);
    const raw = String(input || '').trim();
    if (!raw) {
      this.showWaveInfo('请输入答案');
      return false;
    }
    const expected = String(this.game.learning.practice.answer).trim();
    const normalized = raw.replace(/\s+/g, '');
    const ok = normalized === expected;
    if (ok) {
      this.game.learning.correct += 1;
      this.game.learning.streak += 1;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15);
      this.game.base.hp = Math.min(this.game.base.maxHp, this.game.base.hp + 28);
      if (this.isMiningMode()) {
        this.game.mining.stamina = Math.min(this.game.mining.maxStamina, this.game.mining.stamina + 20);
      }
      this.game.gems += 10;
      this.createFloatingText(this.player.x, this.player.y - 84, '答题补给 +HP +基地 +💎', '#55efc4', 12);
      if (this.game.learning.streak >= 3) this.rollLearningTarget(true);
      this.showWaveInfo('答对了，已获得补给');
    } else {
      this.game.learning.wrong += 1;
      this.game.learning.streak = 0;
      this.player.hp = Math.max(1, this.player.hp - 6);
      this.showWaveInfo(`答错了，正确答案：${expected}`);
      this.createFloatingText(this.player.x, this.player.y - 84, `错误 -6HP (${expected})`, '#ff7675', 12);
    }
    this.calcLearningLevel();
    this.game.learning.practice = this.createLearningPracticeQuestion();
    this.updateUI();
    return ok;
  }

  getAttackInterval () {
    const cls = CONFIG.classes[this.game.currentClass];
    let interval = cls.atkInterval || 24;
    if (this.game.buffState.fury > 0) interval -= 6;
    if (this.game.activeEvent === 'heroic') interval -= 4;
    return Math.max(10, interval);
  }

  getDamageBoost () {
    let boost = 1;
    boost += Math.min(0.35, this.game.combo * 0.015);
    if (this.game.buffState.fury > 0) boost += 0.25;
    if (this.game.activeEvent === 'heroic') boost += 0.2;
    if (this.game.tactic.id === 'berserk') boost += 0.2;
    return boost;
  }

  isMiningMode () {
    return this.game.currentClass === 'miner';
  }

  getMiningBiome () {
    const list = CONFIG.miningMaps || [];
    if (!list.length) return null;
    const idx = this.clamp(this.game.mining.biomeIndex || 0, 0, list.length - 1);
    return list[idx];
  }

  cycleMiningMap () {
    const list = CONFIG.miningMaps || [];
    if (!list.length) return null;
    this.game.mining.biomeIndex = (this.game.mining.biomeIndex + 1) % list.length;
    this.setupMiningFloor();
    const biome = this.getMiningBiome();
    this.showWaveInfo(`矿区切换：${biome?.name || '-'}`);
    this.updateUI();
    return biome;
  }

  toggleMinePanel () {
    this.game.mining.panelCollapsed = !this.game.mining.panelCollapsed;
    this.updateUI();
    return this.game.mining.panelCollapsed;
  }

  setupMiningFloor () {
    this.game.oreNodes.length = 0;
    this.game.mining.stair = null;
    this.game.mining.activeOreId = null;
    this.game.mining.minedOnFloor = 0;
    const depth = this.game.mining.depth;
    const cols = Math.max(5, Math.floor((this.game.world.maxX - this.game.world.minX) / 86));
    const rows = Math.max(4, Math.floor((this.game.world.maxY - this.game.world.minY) / 82));
    const pool = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = this.game.world.minX + 48 + c * ((this.game.world.maxX - this.game.world.minX - 96) / Math.max(1, cols - 1));
        const y = this.game.world.minY + 64 + r * ((this.game.world.maxY - this.game.world.minY - 120) / Math.max(1, rows - 1));
        if (Math.hypot(x - (this.game.base.x + 36), y - (this.game.base.y + 24)) < 120) continue;
        pool.push({ x, y });
      }
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const targetCount = Math.min(pool.length, 12 + Math.floor(depth * 0.8));
    for (let i = 0; i < targetCount; i++) {
      const p = pool[i];
      this.spawnOreNode(p.x, p.y);
    }
  }

  descendMiningFloor () {
    this.game.mining.depth = Math.min(50, this.game.mining.depth + 1);
    this.game.mining.quest = this.buildMiningQuest();
    this.setupMiningFloor();
    this.showWaveInfo(`进入矿洞第 ${this.game.mining.depth} 层`);
    this.updateUI();
  }

  buildMiningQuest () {
    const depth = this.game.mining.depth;
    const roll = Math.random();
    if (roll < 0.45) {
      return {
        type: 'mine_any',
        target: 4 + Math.floor(depth * 0.6),
        progress: 0,
        reward: { gems: 18 + depth * 5, scrap: 4 + depth, core: depth >= 3 ? 1 : 0 }
      };
    }
    if (roll < 0.75) {
      return {
        type: 'mine_crystal',
        target: 2 + Math.floor(depth / 2),
        progress: 0,
        reward: { gems: 24 + depth * 6, scrap: 3 + depth, core: 1 + Math.floor(depth / 4) }
      };
    }
    return {
      type: 'mine_core',
      target: 1 + Math.floor(depth / 3),
      progress: 0,
      reward: { gems: 30 + depth * 8, scrap: 5 + depth, core: 2 + Math.floor(depth / 5) }
    };
  }

  getMiningQuestText () {
    const q = this.game.mining.quest;
    if (!q) return '-';
    const label = q.type === 'mine_any' ? '采集矿石'
      : (q.type === 'mine_crystal' ? '采晶矿' : '采核心矿');
    return `${label} ${q.progress}/${q.target}`;
  }

  onMinedNode (nodeType) {
    const q = this.game.mining.quest;
    if (!q) return;
    if (q.type === 'mine_any') q.progress += 1;
    if (q.type === 'mine_crystal' && (nodeType === 'crystal' || nodeType === 'myth')) q.progress += 1;
    if (q.type === 'mine_core' && (nodeType === 'myth' || nodeType === 'crystal')) q.progress += 1;
    if (q.progress >= q.target) {
      this.game.gems += q.reward.gems;
      this.game.materials.scrap += q.reward.scrap;
      this.game.materials.core += q.reward.core;
      this.createFloatingText(
        this.player.x - 20,
        this.player.y - 90,
        `矿工任务完成 +💎${q.reward.gems}`,
        '#ffeaa7',
        13
      );
      this.game.mining.depth = Math.min(20, this.game.mining.depth + 1);
      this.game.mining.quest = this.buildMiningQuest();
      this.showWaveInfo(`矿洞下潜到第 ${this.game.mining.depth} 层`);
    }
  }

  smeltOre (batch = false, opts = {}) {
    const silent = Boolean(opts.silent);
    if (!this.isMiningMode()) {
      if (!silent) this.showWaveInfo('切换到矿工后才能熔炼');
      return false;
    }
    const bag = this.game.mining.backpack;
    const policy = this.game.mining.smeltPolicy;
    const order = policy === 'rare'
      ? ['myth', 'crystal', 'copper', 'stone']
      : ['stone', 'copper', 'crystal', 'myth'];

    const consume = (type) => {
      if (bag[type] <= 0) return false;
      bag[type] -= 1;
      if (type === 'myth') {
        bag.ingot += 2;
        this.game.materials.core += 2;
        this.game.gems += 16;
      } else if (type === 'crystal') {
        bag.ingot += 1;
        this.game.materials.core += 1;
        this.game.gems += 10;
      } else if (type === 'copper') {
        bag.ingot += 1;
        this.game.materials.scrap += 5;
        this.game.gems += 4;
      } else {
        this.game.materials.scrap += 3;
        this.game.gems += 2;
      }
      return true;
    };

    const tryOne = () => {
      for (const type of order) {
        if (consume(type)) return true;
      }
      return false;
    };

    let count = 0;
    if (batch) {
      while (tryOne() && count < 60) count++;
    } else if (tryOne()) {
      count = 1;
    }
    if (!count) {
      if (!silent) this.showWaveInfo('背包里没有可熔炼矿石');
      return false;
    }
    if (!silent) this.showWaveInfo(`熔炼完成 x${count}`);
    this.updateUI();
    return true;
  }

  toggleAutoSmelt () {
    this.game.mining.autoSmelt = !this.game.mining.autoSmelt;
    this.showWaveInfo(this.game.mining.autoSmelt ? '自动熔炼：开启' : '自动熔炼：关闭');
    this.updateUI();
    return this.game.mining.autoSmelt;
  }

  cycleSmeltPolicy () {
    this.game.mining.smeltPolicy = this.game.mining.smeltPolicy === 'rare' ? 'base' : 'rare';
    this.showWaveInfo(this.game.mining.smeltPolicy === 'rare' ? '熔炼策略：稀有优先' : '熔炼策略：基础优先');
    this.updateUI();
    return this.game.mining.smeltPolicy;
  }

  rollOreType () {
    const depth = this.game.mining.depth;
    const bias = Math.min(0.35, depth * 0.01);
    const r = Math.random();
    if (r < 0.52 - bias * 0.7) return { type: 'stone', hp: 24, color: '#95a5a6', reward: { scrap: 2, gems: 4, core: 0 }, xp: 8 };
    if (r < 0.8 - bias * 0.4) return { type: 'copper', hp: 32, color: '#c97a40', reward: { scrap: 4, gems: 7, core: 0 }, xp: 12 };
    if (r < 0.95 - bias * 0.2) return { type: 'crystal', hp: 40, color: '#74b9ff', reward: { scrap: 2, gems: 16, core: 1 }, xp: 18 };
    return { type: 'myth', hp: 52, color: '#9b59b6', reward: { scrap: 5, gems: 24, core: 2 }, xp: 28 };
  }

  spawnOreNode (fx = null, fy = null) {
    const ore = this.rollOreType();
    const depthMul = 1 + Math.min(1.8, this.game.mining.depth * 0.08);
    const x = fx ?? (this.game.world.minX + 26 + Math.random() * (this.game.world.maxX - this.game.world.minX - 52));
    const y = fy ?? (this.game.world.minY + 44 + Math.random() * (this.game.world.maxY - this.game.world.minY - 80));
    const tooCloseBase = Math.hypot(x - (this.game.base.x + 36), y - (this.game.base.y + 30)) < 110;
    if (tooCloseBase) return;
    this.game.oreNodes.push({
      id: this.game.mining.nextNodeId++,
      x,
      y,
      hp: ore.hp * depthMul,
      maxHp: ore.hp * depthMul,
      baseHp: ore.hp,
      type: ore.type,
      color: ore.color,
      reward: ore.reward,
      xp: ore.xp,
      pulse: Math.random() * Math.PI * 2
    });
  }

  updateMiningField (ts = performance.now()) {
    if (!this.isMiningMode()) {
      if (this.game.oreNodes.length) this.game.oreNodes.length = 0;
      this.game.mining.stair = null;
      this.game.mining.activeOreId = null;
      return;
    }
    if (!this.game.oreNodes.length && !this.game.mining.stair) {
      this.setupMiningFloor();
    }
    this.game.oreNodes = this.game.oreNodes.filter((n) => n.hp > 0);
    this.game.oreNodes.forEach((n) => { n.pulse += 0.03; });
    const threshold = Math.max(4, 8 - Math.floor(this.game.mining.depth / 6));
    if (!this.game.mining.stair && this.game.mining.minedOnFloor >= threshold) {
      this.game.mining.stair = {
        x: this.game.world.minX + 70 + Math.random() * (this.game.world.maxX - this.game.world.minX - 140),
        y: this.game.world.minY + 80 + Math.random() * (this.game.world.maxY - this.game.world.minY - 160)
      };
      this.showWaveInfo('发现楼梯，点击可下到下一层');
    }
  }

  pickOreTarget (px, py) {
    let hit = null;
    let score = Infinity;
    for (const n of this.game.oreNodes) {
      const d = Math.hypot(px - n.x, py - (n.y - 12));
      if (d < 40 && d < score) {
        hit = n;
        score = d;
      }
    }
    return hit;
  }

  pickStairTarget (px, py) {
    const s = this.game.mining.stair;
    if (!s) return null;
    const d = Math.hypot(px - s.x, py - s.y);
    return d < 44 ? s : null;
  }

  gainMiningXp (xp) {
    this.game.mining.xp += xp;
    const need = this.game.mining.level * 80;
    if (this.game.mining.xp >= need) {
      this.game.mining.xp -= need;
      this.game.mining.level += 1;
      this.game.mining.maxStamina = Math.min(220, this.game.mining.maxStamina + 16);
      this.game.mining.stamina = this.game.mining.maxStamina;
      this.game.materials.scrap += 4;
      this.game.gems += 20;
      this.showWaveInfo(`采矿升级 Lv.${this.game.mining.level}`);
    }
  }

  mineOreNode (node, source = 'tap') {
    if (!node) return false;
    const dist = Math.hypot(node.x - this.player.x, node.y - this.player.y);
    if (dist > 78 && source === 'tap') {
      this.player.targetX = this.clamp(node.x, this.game.world.minX, this.game.world.maxX);
      this.player.targetY = this.clamp(node.y + 24, this.game.world.minY, this.game.world.maxY);
      return false;
    }
    const staminaCost = source === 'skill' ? 0 : 6;
    if (this.game.mining.stamina < staminaCost) {
      this.showWaveInfo('体力不足，稍等恢复');
      return false;
    }
    this.game.mining.stamina -= staminaCost;
    const item = this.getEquippedItem();
    const mul = item ? (item.baseMul || 1) * CONFIG.rarities[item.rarity].bonus : 1;
    const lvlMul = 1 + this.game.mining.level * 0.08;
    const dmg = (source === 'skill' ? 30 : 18) * mul * lvlMul;
    node.hp -= dmg;
    this.createParticles(node.x, node.y - 10, node.color, 6);
    this.createFloatingText(node.x - 8, node.y - 34, `-${Math.floor(dmg)}`, '#ffeaa7', 12);
    if (node.hp <= 0) {
      const biome = this.getMiningBiome() || { oreBonus: 1, gemBonus: 1, coreBonus: 1 };
      const gainScrap = Math.max(1, Math.floor(node.reward.scrap * biome.oreBonus));
      const gainGems = Math.max(1, Math.floor(node.reward.gems * biome.gemBonus));
      const gainCore = Math.floor(node.reward.core * biome.coreBonus);
      const bag = this.game.mining.backpack;
      if (node.type === 'stone') bag.stone += Math.max(1, Math.floor(gainScrap * 0.5));
      if (node.type === 'copper') bag.copper += Math.max(1, Math.floor(gainScrap * 0.65));
      if (node.type === 'crystal') bag.crystal += Math.max(1, Math.floor(gainCore + gainGems / 12));
      if (node.type === 'myth') bag.myth += Math.max(1, gainCore);
      // 挖矿即时收益保留少量，主体转入背包熔炼，形成循环玩法。
      this.game.materials.scrap += Math.max(1, Math.floor(gainScrap * 0.35));
      this.game.gems += Math.max(1, Math.floor(gainGems * 0.25));
      this.game.materials.core += Math.max(0, Math.floor(gainCore * 0.25));
      this.gainMiningXp(node.xp);
      this.createFloatingText(
        node.x - 20,
        node.y - 54,
        `入包:${node.type} + 即时💎${Math.max(1, Math.floor(gainGems * 0.25))}`,
        '#55efc4',
        12
      );
      this.onMinedNode(node.type);
      this.game.mining.minedOnFloor += 1;
      node.hp = 0;
      this.game.oreNodes = this.game.oreNodes.filter((n) => n.id !== node.id);
    }
    return true;
  }

  updateTimers () {
    if (this.game.comboTimer > 0) this.game.comboTimer--;
    else if (this.game.combo > 0) this.game.combo = 0;

    if (this.game.eventTimer > 0) {
      this.game.eventTimer--;
      if (this.game.eventTimer === 0) {
        this.game.activeEvent = null;
        this.showWaveInfo('战场事件结束');
      }
    }

    if (this.game.buffState.fury > 0) this.game.buffState.fury--;
    if (this.game.buffState.shield > 0) this.game.buffState.shield--;
    if (this.game.tactic.timer > 0) {
      this.game.tactic.timer--;
      if (this.game.tactic.timer <= 0) {
        this.game.tactic = { id: 'none', name: '无', timer: 0, dropBonus: 0 };
      }
    }
    Object.values(this.game.classInventories).forEach((inv) => {
      inv.forEach((it) => {
        if (it.cooldown > 0) it.cooldown--;
      });
    });
  }

  getTacticChoices () {
    const pool = [
      { id: 'berserk', name: '狂战姿态', desc: '12秒内伤害提高，适合清怪。' },
      { id: 'fortify', name: '防线加固', desc: '基地立即修复并获得短护盾。' },
      { id: 'salvage', name: '战场搜刮', desc: '立刻获得资源补给。' },
      { id: 'lootstorm', name: '掉落风暴', desc: '12秒内掉落率提高。' }
    ];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
  }

  applyTactic (id) {
    if (id === 'berserk') {
      this.game.tactic = { id, name: '狂战姿态', timer: 720, dropBonus: 0 };
      this.showWaveInfo('战术生效：狂战姿态');
    } else if (id === 'fortify') {
      this.game.base.hp = Math.min(this.game.base.maxHp, this.game.base.hp + 220);
      this.game.buffState.shield = Math.max(this.game.buffState.shield, 720);
      this.game.tactic = { id, name: '防线加固', timer: 420, dropBonus: 0 };
      this.showWaveInfo('战术生效：防线加固');
    } else if (id === 'salvage') {
      this.game.gems += 90;
      this.game.materials.scrap += 11;
      this.game.materials.core += 1;
      this.game.tactic = { id, name: '战场搜刮', timer: 300, dropBonus: 0 };
      this.showWaveInfo('战术生效：战场搜刮');
    } else if (id === 'lootstorm') {
      this.game.tactic = { id, name: '掉落风暴', timer: 720, dropBonus: 0.18 };
      this.showWaveInfo('战术生效：掉落风暴');
    } else {
      return false;
    }
    this.game.pendingTactics = null;
    this.game.pendingTacticDeadline = 0;
    this.updateUI();
    return true;
  }

  switchClass (className) {
    this.game.currentClass = className;
    const speedMap = { warrior: 3.1, archer: 3.2, mage: 2.6, assassin: 4.3, miner: 2.9 };
    this.player.moveSpeed = speedMap[className] || 3.2;
    this.equipItem(0);
    this.player.targetX = null;
    this.player.targetY = null;
    if (className === 'miner') {
      this.game.enemies.length = 0;
      this.game.projectiles.length = 0;
      this.game.rainZones.length = 0;
      this.game.waveInProgress = false;
      this.game.waitingForPlayerStart = true;
      if (!this.game.mining.quest) this.game.mining.quest = this.buildMiningQuest();
      this.showWaveInfo('矿工已上场：点击矿点可采矿');
      this.updateMiningField(performance.now());
    } else {
      this.game.oreNodes.length = 0;
      this.game.mining.activeOreId = null;
      this.game.mining.stair = null;
      if (!this.game.waveInProgress && typeof this.onPreparation === 'function') {
        this.onPreparation({ nextWave: this.game.wave + 1 });
      }
    }
    this.refreshSketchHint();
  }

  getCurrentInventory () {
    return this.game.classInventories[this.game.currentClass] || [];
  }

  getEquippedItem () {
    const inv = this.getCurrentInventory();
    const equipped = inv[this.game.equippedSlot];
    if (equipped && equipped.unlocked) return equipped;
    const firstUnlocked = inv.find(i => i.unlocked);
    return firstUnlocked || inv[0] || null;
  }

  getSkillStage () {
    return Math.min(3, 1 + Math.floor(Math.max(0, this.game.wave - 1) / 4));
  }

  getSkillName () {
    const cls = this.game.currentClass;
    const stage = this.getSkillStage();
    return CONFIG.skillGrowth[cls][stage - 1];
  }

  getSkillPowerTier () {
    const stage = this.getSkillStage();
    const item = this.getEquippedItem();
    const rarityTier = item ? Math.floor((item.rarity || 0) / 3) : 0;
    return Math.min(5, Math.max(1, stage + rarityTier));
  }

  equipItem (slot) {
    const idx = this.clamp(slot, 0, 3);
    const inv = this.getCurrentInventory();
    if (!inv[idx]?.unlocked) {
      this.showWaveInfo('该武器未铸造，先去装备台解锁');
      return false;
    }
    this.game.equippedSlot = idx;
    this.updateSlotBorders();
    return true;
  }

  updateSlotBorders () {
    document.querySelectorAll('.inv-slot').forEach(el => el.classList.remove('equipped'));
    const target = document.querySelector(`[data-slot="${this.game.equippedSlot}"]`);
    if (target) target.classList.add('equipped');
    const inv = this.getCurrentInventory();
    inv.forEach((item, idx) => {
      const slotEl = document.querySelector(`[data-slot="${idx}"] span`);
      if (slotEl) slotEl.textContent = item.unlocked ? item.icon : '🔒';
      const border = document.querySelector(`[data-slot="${idx}"] .rarity-border`);
      if (border) border.style.borderColor = item.unlocked ? CONFIG.rarities[item.rarity].color : '#576574';
      const wrap = document.querySelector(`[data-slot="${idx}"]`);
      if (wrap) {
        const cd = item.ultimate && item.cooldown > 0 ? ` / 限制CD ${Math.ceil(item.cooldown / 60)}s` : '';
        wrap.title = item.unlocked ? `${item.name}${cd}` : `未铸造：${item.name}`;
        wrap.style.opacity = item.unlocked ? '1' : '0.6';
      }
    });
  }

  getDamageMultiplier () {
    const item = this.getEquippedItem();
    if (!item) return 1;
    return CONFIG.rarities[item.rarity].bonus;
  }

  getWeaponMultiplier (enemy) {
    const item = this.getEquippedItem();
    if (!item) return 1;
    let factor = item.baseMul || 1;
    if (enemy?.kind && item.bonus?.[enemy.kind]) factor *= item.bonus[enemy.kind];
    if (enemy?.evolved && item.bonus?.evolved) factor *= item.bonus.evolved;
    return factor;
  }

  validateWeaponUse (enemy, opts = {}) {
    const item = this.getEquippedItem();
    if (!item || !item.unlocked) return { ok: false, msg: '当前武器未解锁' };
    if (!item || !item.ultimate) return { ok: true };
    if ((item.cooldown || 0) > 0) return { ok: false, msg: `【${item.name}】冷却中` };
    if ((item.needCombo || 0) > this.game.combo) return { ok: false, msg: `【${item.name}】需要连击${item.needCombo}+` };
    if (!opts.isSkill && enemy && item.allowedKinds?.length) {
      const kind = enemy.evolved ? 'evolved' : enemy.kind;
      if (!item.allowedKinds.includes(kind)) return { ok: false, msg: `【${item.name}】只克制特定怪` };
    }
    return { ok: true };
  }

  consumeWeaponLimit () {
    const item = this.getEquippedItem();
    if (!item || !item.ultimate) return;
    item.cooldown = item.cooldownFrames || 180;
  }

  updatePlayer () {
    this.updateTimers();
    const cfg = CONFIG.classes[this.game.currentClass];
    this.player.maxHp = cfg.hp;
    if (this.player.hp > this.player.maxHp) this.player.hp = this.player.maxHp;
    const isMelee = this.game.currentClass === 'warrior' || this.game.currentClass === 'assassin' || this.game.currentClass === 'miner';

    if (this.player.dash.active) {
      const target = this.game.enemies.find(e => e.id === this.player.dash.targetId && !e.dead);
      const tx = target ? this.clamp(target.x - (target.x >= this.player.x ? 24 : -24), this.game.world.minX, this.game.world.maxX) : this.player.dash.tx;
      const ty = target ? this.clamp(target.y + 8, this.game.world.minY, this.game.world.maxY) : this.player.dash.ty;
      const dx = tx - this.player.x;
      const dy = ty - this.player.y;
      const len = Math.hypot(dx, dy);
      const dashSpeed = 14;
      if (len <= dashSpeed) {
        this.player.x = tx;
        this.player.y = ty;
        if (target && !target.dead) {
          const ok = this.normalAttack(target);
          if (ok) {
            this.damageEnemy(target, Math.max(12, CONFIG.classes.warrior.dmg * 0.85 * this.getDamageMultiplier()), '#f6b93b');
            this.player.attackCooldown = Math.max(8, Math.floor(this.getAttackInterval() * 0.5));
            this.player.chargeCooldown = 30;
          }
        }
        this.player.dash.active = false;
        this.player.dash.targetId = null;
      } else {
        this.player.x += (dx / len) * dashSpeed;
        this.player.y += (dy / len) * dashSpeed;
        this.player.facing = dx >= 0 ? 1 : -1;
        if ((this.player.animFrame % 2) === 0) this.createParticles(this.player.x, this.player.y - 20, '#f6b93b', 1);
      }
      this.player.x = this.clamp(this.player.x, this.game.world.minX, this.game.world.maxX);
      this.player.y = this.clamp(this.player.y, this.game.world.minY, this.game.world.maxY);
    }

    if (!this.player.dash.active && (this.player.targetX !== null || this.player.targetY !== null)) {
      const tx = this.player.targetX === null ? this.player.x : this.player.targetX;
      const ty = this.player.targetY === null ? this.player.y : this.player.targetY;
      const dxMove = tx - this.player.x;
      const dyMove = ty - this.player.y;
      const len = Math.hypot(dxMove, dyMove);
      if (len <= this.player.moveSpeed) {
        this.player.x = tx;
        this.player.y = ty;
        this.player.targetX = null;
        this.player.targetY = null;
      } else if (len > 0) {
        this.player.x += (dxMove / len) * this.player.moveSpeed;
        this.player.y += (dyMove / len) * this.player.moveSpeed;
        this.player.facing = dxMove > 0 ? 1 : -1;
      }
      this.player.x = this.clamp(this.player.x, this.game.world.minX, this.game.world.maxX);
      this.player.y = this.clamp(this.player.y, this.game.world.minY, this.game.world.maxY);
    }

    // 近战“过远先走近再冲锋/背刺”
    if (!this.player.dash.active && isMelee && this.player.pendingMeleeTargetId) {
      const target = this.game.enemies.find(e => e.id === this.player.pendingMeleeTargetId && !e.dead);
      if (!target) {
        this.player.pendingMeleeTargetId = null;
        this.player.pendingMeleeType = null;
      } else {
        const d = Math.hypot(target.x - this.player.x, target.y - this.player.y);
        const need = this.player.pendingMeleeType === 'warrior' ? 220 : 260;
        if (d <= need && this.player.attackCooldown <= 0) {
          this.performClassTapAttack(target);
          this.player.pendingMeleeTargetId = null;
          this.player.pendingMeleeType = null;
        }
      }
    }

    let nearest = null;
    let minDist = Infinity;
    for (const e of this.game.enemies) {
      if (e.dead) continue;
      const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (dist < minDist && dist <= cfg.range) {
        minDist = dist;
        nearest = e;
      }
    }

    // 默认关闭自动攻击，保持手动点击击杀手感。

    if (this.isMiningMode() && this.game.mining.activeOreId) {
      const ore = this.game.oreNodes.find(n => n.id === this.game.mining.activeOreId);
      if (!ore) {
        this.game.mining.activeOreId = null;
      } else {
        const reach = 78;
        const d = Math.hypot(ore.x - this.player.x, ore.y - this.player.y);
        if (d > reach) {
          this.player.targetX = this.clamp(ore.x, this.game.world.minX, this.game.world.maxX);
          this.player.targetY = this.clamp(ore.y + 20, this.game.world.minY, this.game.world.maxY);
        } else if (this.player.mineCooldown <= 0) {
          const hit = this.mineOreNode(ore, 'tap');
          if (hit) {
            const baseCd = Math.max(9, 20 - Math.floor(this.game.mining.level / 2));
            this.player.mineCooldown = baseCd;
            this.player.attacking = true;
            setTimeout(() => { this.player.attacking = false; }, 90);
          }
          if (!this.game.oreNodes.find(n => n.id === this.game.mining.activeOreId)) {
            this.game.mining.activeOreId = null;
          }
        }
      }
    }

    if (this.player.attackCooldown > 0) this.player.attackCooldown--;
    if (this.player.skillCooldown > 0) this.player.skillCooldown--;
    if (this.player.chargeCooldown > 0) this.player.chargeCooldown--;
    if (this.player.tauntTimer > 0) this.player.tauntTimer--;
    if (this.player.mineCooldown > 0) this.player.mineCooldown--;
    this.player.animFrame++;
    this.updateActionPose();
  }

  performClassTapAttack (target) {
    const cls = this.game.currentClass;
    const check = this.validateWeaponUse(target);
    if (!check.ok) {
      this.showWaveInfo(check.msg);
      return;
    }
    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    const dist = Math.hypot(dx, dy);
    this.player.facing = dx >= 0 ? 1 : -1;

    if (cls === 'warrior') {
      // 战士：冲锋有0.5s独立CD，且不能跨过远距离。
      const chargeRange = 220;
      if (dist > chargeRange) {
        this.player.targetX = this.clamp(target.x - this.player.facing * 36, this.game.world.minX, this.game.world.maxX);
        this.player.targetY = this.clamp(target.y + 18, this.game.world.minY, this.game.world.maxY);
        this.player.pendingMeleeType = 'warrior';
        this.player.pendingMeleeTargetId = target.id;
        return;
      }
      if (this.player.chargeCooldown <= 0) {
        // 和刺客区分：战士是可见冲锋过程，不是瞬移。
        this.player.dash.active = true;
        this.player.dash.targetId = target.id;
        this.player.dash.tx = this.clamp(target.x - this.player.facing * 26, this.game.world.minX, this.game.world.maxX);
        this.player.dash.ty = this.clamp(target.y + 8, this.game.world.minY, this.game.world.maxY);
      } else {
        this.showWaveInfo(`战士冲锋冷却 ${Math.ceil(this.player.chargeCooldown / 60)}s`);
      }
      return;
    }

    if (cls === 'assassin') {
      // 刺客：有距离限制，达成后瞬移到怪后背。
      const blinkRange = 260;
      if (dist <= blinkRange) {
        const side = dx >= 0 ? 1 : -1;
        this.player.x = this.clamp(target.x + side * 26, this.game.world.minX, this.game.world.maxX);
        this.player.y = this.clamp(target.y + 8, this.game.world.minY, this.game.world.maxY);
        this.player.facing = side < 0 ? 1 : -1;
        const ok = this.normalAttack(target);
        if (ok) {
          this.damageEnemy(target, Math.max(8, CONFIG.classes.assassin.dmg * 0.65 * this.getDamageMultiplier()), '#e056fd');
          this.player.attackCooldown = Math.max(7, Math.floor(this.getAttackInterval() * 0.45));
        }
      } else {
        this.player.targetX = this.clamp(target.x, this.game.world.minX, this.game.world.maxX);
        this.player.targetY = this.clamp(target.y + 12, this.game.world.minY, this.game.world.maxY);
        this.player.pendingMeleeType = 'assassin';
        this.player.pendingMeleeTargetId = target.id;
      }
      return;
    }

    if (cls === 'miner') {
      // 矿工：近距重击，兼顾打怪与采矿节奏。
      if (dist > 130) {
        this.player.targetX = this.clamp(target.x - this.player.facing * 26, this.game.world.minX, this.game.world.maxX);
        this.player.targetY = this.clamp(target.y + 14, this.game.world.minY, this.game.world.maxY);
        return;
      }
      const ok = this.normalAttack(target);
      if (ok) {
        this.damageEnemy(target, Math.max(9, CONFIG.classes.miner.dmg * 0.72 * this.getDamageMultiplier()), '#e0b47a');
        this.player.attackCooldown = Math.max(10, Math.floor(this.getAttackInterval() * 0.6));
      }
      return;
    }

    if (cls === 'archer') {
      // 弓手：不位移，快攻低伤。
      const ok = this.normalAttack(target);
      if (ok) this.player.attackCooldown = Math.max(6, Math.floor(this.getAttackInterval() * 0.45));
      return;
    }

    if (cls === 'mage') {
      // 法师：固定位置施法，高伤慢速。
      const ok = this.normalAttack(target);
      if (ok) this.player.attackCooldown = Math.max(16, Math.floor(this.getAttackInterval() * 0.9));
    }
  }

  updateActionPose () {
    const f = this.player.animFrame % 90;
    if (this.player.attacking) {
      this.game.actionPose = '挥';
      return;
    }
    if (f < 20) this.game.actionPose = '站';
    else if (f < 40) this.game.actionPose = '走';
    else if (f < 55) this.game.actionPose = '跑';
    else if (f < 70) this.game.actionPose = '跳';
    else this.game.actionPose = '上劈';
  }

  damageEnemy (enemy, amount, color) {
    if (enemy.dead) return;
    enemy.hp -= amount;
    enemy.hitFlash = 4;
    this.createParticles(enemy.x, enemy.y - 20, color, 4);
    if (enemy.hp <= 0) {
      enemy.dead = true;
      this.killEnemy(enemy);
    }
  }

  normalAttack (target) {
    const cls = CONFIG.classes[this.game.currentClass];
    const item = this.getEquippedItem();
    const weaponCheck = this.validateWeaponUse(target);
    if (!weaponCheck.ok) {
      this.showWaveInfo(weaponCheck.msg);
      return false;
    }
    const rarity = CONFIG.rarities[item.rarity];
    let dmg = cls.dmg * rarity.bonus * this.getDamageBoost() * this.getWeaponMultiplier(target);

    if (this.game.currentClass === 'assassin' && Math.random() < 0.3) {
      dmg *= 1.9;
      this.createFloatingText(target.x, target.y - 30, '暴击!', '#ff7675', 20);
    }

    if (cls.range >= 120) {
      const dx = target.x - this.player.x;
      const dy = (target.y - 20) - (this.player.y - 30);
      const len = Math.hypot(dx, dy) || 1;
      const spd = 10;
      this.game.projectiles.push({
        x: this.player.x + (dx / len) * 18,
        y: this.player.y - 30,
        vx: (dx / len) * spd,
        vy: (dy / len) * spd,
        dmg,
        color: rarity.color,
        pierce: 1,
        hitIds: {}
      });
    } else {
      this.damageEnemy(target, dmg, rarity.color);
    }

    this.player.attacking = true;
    setTimeout(() => {
      this.player.attacking = false;
    }, 120);
    if (item.ultimate) this.consumeWeaponLimit();
    return true;
  }

  castSkill (targetX, targetY = this.player.y - 24) {
    const cls = CONFIG.classes[this.game.currentClass];
    const item = this.getEquippedItem();
    const weaponCheck = this.validateWeaponUse(null, { isSkill: true });
    if (!weaponCheck.ok) {
      this.showWaveInfo(weaponCheck.msg);
      return false;
    }
    const rarity = CONFIG.rarities[item.rarity];
    const dmg = cls.dmg * this.getDamageMultiplier() * this.getDamageBoost();
    const dir = targetX >= this.player.x ? 1 : -1;
    const power = this.getSkillPowerTier();
    this.player.facing = dir;
    this.player.skillCooldown = Math.max(90, cls.skillCd - (this.game.buffState.fury > 0 ? 40 : 0));

    if (this.game.currentClass === 'warrior') {
      const tauntSec = [3, 5, 7, 10, 10][power - 1];
      this.player.tauntTimer = Math.max(this.player.tauntTimer, tauntSec * 60);
      this.createParticles(this.player.x, this.player.y - 16, '#f6b93b', 20);
      this.showWaveInfo(`嘲讽开启 ${tauntSec}s`);
    } else if (this.game.currentClass === 'archer') {
      const radius = [90, 120, 150, 180, 210][power - 1];
      const duration = [120, 170, 220, 280, 340][power - 1];
      const dot = dmg * (0.14 + power * 0.03);
      this.game.rainZones.push({ x: targetX, y: targetY, r: radius, life: duration, tick: 0, dot, color: '#ffd54f' });
      this.createParticles(targetX, targetY - 20, '#ffd54f', 20);
      this.showWaveInfo(`万箭齐发：范围流血 ${Math.ceil(duration / 60)}s`);
    } else if (this.game.currentClass === 'mage') {
      const radius = [110, 145, 180, 220, 260][power - 1];
      const freeze = [90, 130, 180, 240, 300][power - 1];
      for (const e of this.game.enemies) {
        if (e.dead) continue;
        if (Math.hypot(e.x - targetX, e.y - targetY) < radius) {
          e.frozen = Math.max(e.frozen, freeze);
          this.damageEnemy(e, dmg * (0.8 + power * 0.12), '#74b9ff');
        }
      }
      this.createParticles(targetX, targetY - 20, '#74b9ff', 28);
      this.showWaveInfo(`冰冻领域：${Math.ceil(freeze / 60)}s`);
    } else if (this.game.currentClass === 'assassin') {
      const gridRange = [2, 4, 6, 8, 10][power - 1];
      const radius = gridRange * 32;
      for (const e of this.game.enemies) {
        if (e.dead) continue;
        if (Math.hypot(e.x - targetX, e.y - targetY) < radius) {
          e.blinded = Math.max(e.blinded || 0, 130 + power * 40);
          this.damageEnemy(e, dmg * (0.6 + power * 0.08), '#e056fd');
        }
      }
      this.createParticles(targetX, targetY - 20, '#e056fd', 24);
      this.showWaveInfo(`致盲范围：${gridRange}格`);
    } else if (this.game.currentClass === 'miner') {
      const radius = [85, 110, 145, 180, 220][power - 1];
      const oreStrike = [1, 1, 2, 2, 3][power - 1];
      for (const e of this.game.enemies) {
        if (e.dead) continue;
        if (Math.hypot(e.x - targetX, e.y - targetY) < radius) {
          this.damageEnemy(e, dmg * (0.75 + power * 0.12), '#e0b47a');
        }
      }
      let left = oreStrike;
      const sorted = [...this.game.oreNodes].sort((a, b) =>
        Math.hypot(a.x - targetX, a.y - targetY) - Math.hypot(b.x - targetX, b.y - targetY)
      );
      for (const ore of sorted) {
        if (left <= 0) break;
        if (Math.hypot(ore.x - targetX, ore.y - targetY) <= radius + 26) {
          this.mineOreNode(ore, 'skill');
          left--;
        }
      }
      this.createParticles(targetX, targetY - 18, '#f6c47a', 26);
      this.showWaveInfo(`矿震爆发：范围采掘 x${oreStrike}`);
    }

    if (item.ultimate) this.consumeWeaponLimit();
    this.createFloatingText(this.player.x, this.player.y - 80, this.getSkillName(), rarity.color, 16);
    this.refreshSketchHint();
    return true;
  }

  getWaveConfig () {
    const layerCfg = CONFIG.layers[this.game.layer - 1];
    const safeWave = Math.max(1, this.game.wave);
    const beginner = safeWave <= 2;
    const count = beginner ? (2 + safeWave) : (4 + safeWave * 2);
    const hp = (22 + safeWave * 6) * layerCfg.hpMul;
    const speed = Math.min(2.5, (beginner ? (0.28 + safeWave * 0.03) : (0.45 + safeWave * 0.04)) * layerCfg.speedMul);
    const interval = Math.max(460, (beginner ? 2050 : (1650 - safeWave * 45)) / layerCfg.spawnMul);
    return { count, hp, speed, interval };
  }

  rollWaveEvent () {
    this.game.activeEvent = null;
    this.game.eventTimer = 0;
    if (Math.random() > 0.38) return;

    const pool = ['heroic', 'bloodmoon', 'freezewind'];
    const eventName = pool[Math.floor(Math.random() * pool.length)];
    this.game.activeEvent = eventName;
    this.game.eventTimer = 900;

    const textMap = {
      heroic: '英勇时刻：攻速与伤害提升',
      bloodmoon: '血月降临：怪物更强，但掉落更多',
      freezewind: '寒风来袭：敌人移动变慢'
    };
    this.showWaveInfo(textMap[eventName]);
  }

  setupWaveQuest () {
    const baseReward = 35 + this.game.wave * 8;
    const canEvolved = this.game.wave >= 6;
    const r = Math.random();

    if (canEvolved && r < 0.35) {
      this.game.quest = {
        type: 'evolved',
        target: 2,
        progress: 0,
        reward: baseReward + 20,
        done: false,
        text: '击败进化敌人 2 只'
      };
      return;
    }

    if (r < 0.7) {
      this.game.quest = {
        type: 'combo',
        target: Math.min(12, 5 + Math.floor(this.game.wave / 2)),
        progress: 0,
        reward: baseReward,
        done: false,
        text: '达成连击目标'
      };
      return;
    }

    this.game.quest = {
      type: 'defense',
      target: 1,
      progress: 0,
      reward: baseReward + 10,
      done: false,
      text: '本波基地不掉血'
    };
  }

  completeQuestIfReady () {
    const q = this.game.quest;
    if (q.done) return;
    if (q.progress < q.target) return;

    q.done = true;
    this.game.gems += q.reward;
    this.createFloatingText(this.player.x, this.player.y - 95, `任务完成 +💎${q.reward}`, '#ffeaa7', 14);
  }

  createMathProblem () {
    if (this.game.learning.enabled) {
      const target = this.game.learning.targetAnswer;
      const lv = this.game.learning.level || this.calcLearningLevel();
      const preferTarget = Math.random() < 0.5;
      const makeFromValue = (val) => {
        const t = Math.random();
        if (t < 0.34) {
          const a = Math.max(1, Math.floor(Math.random() * Math.max(1, val - 1)));
          const b = val - a;
          return { question: `${a}+${b}`, answer: String(val), value: val };
        }
        if (t < 0.68) {
          const a = val + (1 + Math.floor(Math.random() * (lv >= 2 ? 20 : 9)));
          const b = a - val;
          return { question: `${a}-${b}`, answer: String(val), value: val };
        }
        const maxFactor = lv >= 3 ? 12 : 9;
        const factors = [];
        for (let i = 1; i <= maxFactor; i++) {
          if (val % i === 0 && val / i <= maxFactor) factors.push([i, val / i]);
        }
        if (factors.length) {
          const pair = factors[Math.floor(Math.random() * factors.length)];
          return { question: `${pair[0]}×${pair[1]}`, answer: String(val), value: val };
        }
        return { question: `${val}+0`, answer: String(val), value: val };
      };
      if (preferTarget) {
        return makeFromValue(target);
      }
      const range = lv === 1 ? { min: 2, max: 14 } : (lv === 2 ? { min: 2, max: 32 } : { min: 3, max: 81 });
      let val = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
      if (val === target) val = Math.min(range.max, val + 1);
      return makeFromValue(val);
    }

    const r = Math.random();
    if (r < 0.35) {
      const a = 1 + Math.floor(Math.random() * 20);
      const b = 1 + Math.floor(Math.random() * 20);
      return { question: `${a}+${b}`, answer: String(a + b), value: a + b };
    }
    if (r < 0.68) {
      const a = 2 + Math.floor(Math.random() * 20);
      const b = 1 + Math.floor(Math.random() * (a - 1));
      return { question: `${a}-${b}`, answer: String(a - b), value: a - b };
    }
    if (r < 0.88) {
      const a = 1 + Math.floor(Math.random() * 9);
      const b = 1 + Math.floor(Math.random() * 9);
      return { question: `${a}×${b}`, answer: String(a * b), value: a * b };
    }
    const a = 1 + Math.floor(Math.random() * 30);
    const b = 1 + Math.floor(Math.random() * 30);
    const ans = a > b ? '>' : (a < b ? '<' : '=');
    return { question: `${a}?${b}`, answer: ans, value: null };
  }

  getAnswerTarget () {
    if (!this.game.enemies.length) return null;
    let best = null;
    let score = Infinity;
    const baseRect = this.getBaseRect();
    const bx = baseRect.x + baseRect.w * 0.5;
    const by = baseRect.y + baseRect.h * 0.45;
    for (const e of this.game.enemies) {
      if (e.dead) continue;
      const dBase = Math.hypot(e.x - bx, e.y - by);
      const dPlayer = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      const s = dBase * 0.75 + dPlayer * 0.25;
      if (s < score) {
        score = s;
        best = e;
      }
    }
    return best;
  }

  submitMathAnswer (input) {
    const target = this.getAnswerTarget();
    if (!target) {
      this.showWaveInfo('当前没有可答题目标');
      return false;
    }
    if (!input) {
      this.showWaveInfo('请输入答案');
      return false;
    }
    const answer = String(input).replace(/\s+/g, '');
    if (answer === target.math.answer) {
      this.damageEnemy(target, Math.max(target.maxHp * 0.8, 26), '#55efc4');
      this.createFloatingText(target.x, target.y - 76, '答对！', '#55efc4', 15);
      target.math = this.createMathProblem();
      return true;
    }
    this.player.hp = Math.max(0, this.player.hp - 8);
    this.createFloatingText(target.x, target.y - 76, `错误，正确:${target.math.answer}`, '#ff7675', 12);
    if (this.player.hp <= 0) this.gameOver();
    return false;
  }

  startWave () {
    this.game.wave += 1;
    this.game.layer = Math.min(CONFIG.layers.length, Math.floor((this.game.wave - 1) / 5) + 1);
    this.game.unlockedLayer = Math.max(this.game.unlockedLayer, this.game.layer);
    const cfg = this.getWaveConfig();
    this.game.waveSpawnTarget = cfg.count;
    this.game.waveSpawned = 0;
    this.game.spawnInterval = cfg.interval;
    this.game.lastSpawnAt = 0;
    this.game.waveInProgress = true;
    if (this.game.learning.enabled) {
      this.rollLearningTarget(true);
      this.game.learning.practice = this.createLearningPracticeQuestion();
    }
    this.game.waveStartBaseHp = this.game.base.hp;
    this.setupWaveQuest();
    this.rollWaveEvent();
    this.showWaveInfo(`第 ${this.game.wave} 波 · ${CONFIG.layers[this.game.layer - 1].name}`);
    if (this.game.currentClass === 'miner') {
      for (let i = 0; i < 2; i++) this.spawnOreNode();
    }
    if (this.game.wave === 1 || this.game.wave === 5 || this.game.wave === 9) {
      const stage = this.getSkillStage();
      this.createFloatingText(this.canvas.width * 0.5 - 60, 130, `技能成长到 T${stage}`, '#ffe66d', 18);
    }
    if (typeof this.onWaveStart === 'function') this.onWaveStart(this.game.wave);
    saveProgress(this.game);
    this.refreshSketchHint();
    this.updateUI();
  }

  beginNextWave () {
    if (this.isMiningMode()) {
      this.showWaveInfo('矿工模式无怪物波次，专注采矿');
      return false;
    }
    if (this.game.waveInProgress) return false;
    if (!this.game.waitingForPlayerStart) return false;
    if (this.game.pendingTactics?.length) {
      this.applyTactic(this.game.pendingTactics[0].id);
    }
    this.game.waitingForPlayerStart = false;
    this.startWave();
    return true;
  }

  spawnEnemy () {
    const cfg = this.getWaveConfig();
    const layerCfg = CONFIG.layers[this.game.layer - 1];
    const evolved = this.game.wave >= 6 && Math.random() < Math.min(0.32, this.game.wave * 0.03);
    if (evolved) this.game.evolvedEnemyUnlocked = true;
    const eventHpMul = this.game.activeEvent === 'bloodmoon' ? 1.25 : 1;
    const eventSpeedMul = this.game.activeEvent === 'bloodmoon' ? 1.18 : (this.game.activeEvent === 'freezewind' ? 0.82 : 1);

    const mode = this.game.spawnMode === 'auto' ? (Math.random() < 0.5 ? 'top' : 'side') : this.game.spawnMode;
    const fromLeft = Math.random() < 0.5;
    let x;
    let y;
    if (mode === 'top') {
      x = this.game.world.minX + Math.random() * (this.game.world.maxX - this.game.world.minX);
      y = -30 - Math.random() * 30;
    } else {
      x = fromLeft ? -30 - Math.random() * 25 : this.canvas.width + 30 + Math.random() * 25;
      y = this.game.world.minY + Math.random() * (this.game.world.maxY - this.game.world.minY);
    }

    let kind = 'normal';
    if (evolved) kind = 'evolved';
    else {
      const roll = Math.random();
      if (roll < 0.18) kind = 'armored';
      else if (roll < 0.38) kind = 'swift';
      else if (roll < 0.56) kind = 'swarm';
    }
    let hpMul = 1;
    let speedMul = 1;
    let color = evolved ? '#111' : layerCfg.enemy;
    let mobStyle = evolved ? 'enderman' : 'zombie';
    if (kind === 'armored') {
      hpMul = 1.55;
      speedMul = 0.78;
      color = '#6c5ce7';
      mobStyle = 'skeleton';
    } else if (kind === 'swift') {
      hpMul = 0.78;
      speedMul = 1.42;
      color = '#16a085';
      mobStyle = 'spider';
    } else if (kind === 'swarm') {
      hpMul = 0.7;
      speedMul = 1.15;
      color = '#f39c12';
      mobStyle = 'slime';
    }
    this.game.enemies.push({
      id: this.enemyId++,
      x,
      y,
      hp: cfg.hp * (evolved ? 1.8 : 1) * hpMul * eventHpMul,
      maxHp: cfg.hp * (evolved ? 1.8 : 1) * hpMul * eventHpMul,
      speed: cfg.speed * (0.9 + Math.random() * 0.25) * (evolved ? 1.12 : 1) * speedMul * eventSpeedMul,
      frozen: 0,
      color,
      dead: false,
      evolved,
      kind,
      fromLeft,
      spawnMode: mode,
      mobStyle,
      hitFlash: 0,
      math: this.createMathProblem()
    });
    const spawned = this.game.enemies[this.game.enemies.length - 1];
    const eliteChance = Math.min(0.18, 0.03 + this.game.wave * 0.006);
    if (!spawned.evolved && Math.random() < eliteChance) {
      spawned.elite = true;
      spawned.hp *= 1.7;
      spawned.maxHp *= 1.7;
      spawned.speed *= 1.08;
      spawned.color = '#f1c40f';
    }
  }

  updateWaveSpawner (ts) {
    if (this.isMiningMode()) {
      this.game.waveInProgress = false;
      this.game.waitingForPlayerStart = true;
      this.game.pendingTactics = null;
      return;
    }

    if (!this.game.waveInProgress) {
      if (this.game.waitingForPlayerStart) return;
      if (this.game.enemies.length === 0 && ts > this.game.nextWaveAt) this.startWave();
      return;
    }

    if (this.game.waveSpawned < this.game.waveSpawnTarget && ts - this.game.lastSpawnAt >= this.game.spawnInterval) {
      this.spawnEnemy();
      this.game.waveSpawned += 1;
      this.game.lastSpawnAt = ts;
    }

    if (this.game.waveSpawned >= this.game.waveSpawnTarget && this.game.enemies.length === 0) {
      if (this.game.quest.type === 'defense' && this.game.base.hp >= this.game.waveStartBaseHp) {
        this.game.quest.progress = 1;
        this.completeQuestIfReady();
      }
      this.game.waveInProgress = false;
      this.game.nextWaveAt = ts + 7000;
      this.game.waitingForPlayerStart = true;
      this.game.pendingTactics = this.getTacticChoices();
      this.game.pendingTacticDeadline = ts + 5200;
      if (typeof this.onPreparation === 'function') {
        this.onPreparation({ nextWave: this.game.wave + 1 });
      }
      if (typeof this.onWaveCleared === 'function') {
        this.onWaveCleared({
          choices: this.game.pendingTactics,
          deadline: this.game.pendingTacticDeadline
        });
      }
      // 每波清场有概率获得短时增益。
      if (Math.random() < 0.35) {
        if (Math.random() < 0.5) {
          this.game.buffState.fury = 900;
          this.showWaveInfo('获得增益：狂怒(15秒)');
        } else {
          this.game.buffState.shield = 900;
          this.showWaveInfo('获得增益：护盾(15秒)');
        }
      }
      if (this.game.wave % 5 === 0 && this.game.layer < CONFIG.layers.length) {
        this.showWaveInfo('地牢入口开启！');
      } else {
        this.showWaveInfo('清场成功！');
      }
    }

    if (!this.game.waveInProgress && this.game.pendingTactics && ts >= this.game.pendingTacticDeadline) {
      this.applyTactic(this.game.pendingTactics[0].id);
    }
  }

  updateEnemies () {
    const baseRect = this.getBaseRect();
    const baseCenter = baseRect.x + baseRect.w * 0.5;
    const baseY = baseRect.y + baseRect.h * 0.55;
    this.game.enemies = this.game.enemies.filter(e => !e.dead).filter(e => {
      if (e.hitFlash > 0) e.hitFlash--;
      if (e.frozen > 0) {
        e.frozen--;
      }
      else {
        if (e.blinded > 0) e.blinded--;
        const taunted = this.player.tauntTimer > 0;
        const targetX = taunted ? this.player.x : baseCenter;
        const targetY = taunted ? (this.player.y - 10) : baseY;
        const dx = targetX - e.x;
        const dy = targetY - e.y;
        const len = Math.hypot(dx, dy) || 1;
        const blindMul = e.blinded > 0 ? 0.35 : 1;
        const jitterX = e.blinded > 0 ? (Math.random() - 0.5) * 1.9 : 0;
        const jitterY = e.blinded > 0 ? (Math.random() - 0.5) * 1.4 : 0;
        e.x += (dx / len) * e.speed * blindMul + jitterX;
        e.y += (dy / len) * e.speed * blindMul + jitterY;
      }

      if (Math.hypot(e.x - baseCenter, e.y - baseY) < 40) {
        if (this.player.tauntTimer > 0) return true;
        const shieldMul = this.game.buffState.shield > 0 ? 0.45 : 1;
        const dmg = (e.evolved ? 10 : 6) * shieldMul;
        this.game.base.hp -= dmg;
        this.game.baseFlash = 8;
        this.createParticles(e.x, e.y - 20, '#e74c3c', 3);
        this.createFloatingText(baseRect.x + 24, baseRect.y - 58, `-${Math.floor(dmg)}HP`, '#ff7675', 13);
        e.dead = true;
        if (this.game.base.hp <= 0) this.gameOver();
        return false;
      }

      return e.x > -120 && e.x < this.canvas.width + 120 && e.y > -120 && e.y < this.canvas.height + 120 && e.hp > 0;
    });
  }

  killEnemy (enemy) {
    if (enemy._counted) return;
    enemy._counted = true;
    this.game.kills += 1;
    this.createEnemyDebris(enemy);
    this.game.combo = this.game.comboTimer > 0 ? this.game.combo + 1 : 1;
    this.game.comboTimer = 180;

    const comboBonus = Math.floor(this.game.combo / 5);
    const streakBonus = this.game.combo >= 10 ? 8 : (this.game.combo >= 6 ? 4 : 0);
    const eventBonusMul = this.game.activeEvent === 'bloodmoon' ? 1.45 : 1;
    const eliteBonus = enemy.elite ? 22 : 0;
    const gain = Math.floor((10 + this.game.layer * 4 + Math.floor(this.game.wave / 3) + (enemy.evolved ? 12 : 0) + comboBonus + eliteBonus + streakBonus) * eventBonusMul);
    this.game.gems += gain;
    this.game.materials.scrap += enemy.evolved ? 2 : 1;
    if (enemy.elite) this.game.materials.scrap += 2;
    if (enemy.evolved || enemy.elite || Math.random() < 0.12) this.game.materials.core += 1;
    this.createParticles(enemy.x, enemy.y - 20, '#2ecc71', 8);
    this.createDrop(enemy.x, enemy.y - 20, enemy.evolved ? 0.08 : (enemy.elite ? 0.12 : 0));
    this.createFloatingText(enemy.x, enemy.y - 30, `+💎${gain}`, '#00d2d3');
    if (this.game.combo >= 3) {
      this.createFloatingText(enemy.x, enemy.y - 48, `${this.game.combo}连击`, '#fdcb6e', 13);
    }
    if (enemy.elite) {
      this.createFloatingText(enemy.x, enemy.y - 66, '精英击破', '#ffd32a', 13);
    }

    if (this.game.quest.type === 'evolved' && enemy.evolved) this.game.quest.progress += 1;
    if (this.game.quest.type === 'combo') this.game.quest.progress = Math.max(this.game.quest.progress, this.game.combo);
    this.completeQuestIfReady();

    this.checkUpgrade();
    this.updateUI();
  }

  checkUpgrade () {
    const slot = this.game.equippedSlot;
    const inv = this.getCurrentInventory();
    const item = inv[slot];
    if (!item) return;
    item.killsOnItem += 1;
    let need = (item.rarity + 1) * 5;

    while (item.killsOnItem >= need && item.rarity < CONFIG.rarities.length - 1) {
      item.killsOnItem -= need;
      const oldName = CONFIG.rarities[item.rarity].name;
      item.rarity += 1;
      const next = CONFIG.rarities[item.rarity];
      const border = document.querySelector(`[data-slot="${slot}"] .rarity-border`);
      if (border) border.style.borderColor = next.color;

      const toast = this.ui.upgradeToast;
      this.ui.upgradeName.textContent = `${oldName} → ${next.name}`;
      toast.style.display = 'block';
      toast.style.color = next.color;
      toast.style.borderColor = next.color;
      setTimeout(() => {
        toast.style.display = 'none';
      }, 1800);

      need = (item.rarity + 1) * 5;
    }
  }

  updateProjectiles () {
    this.game.projectiles = this.game.projectiles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;

      for (const e of this.game.enemies) {
        if (e.dead || p.hitIds[e.id]) continue;
        if (Math.hypot(p.x - e.x, p.y - (e.y - 20)) < 24) {
          p.hitIds[e.id] = true;
          this.damageEnemy(e, p.dmg, p.color);
          p.pierce -= 1;
          if (this.game.currentClass === 'mage') e.frozen = Math.max(e.frozen, 45);
          if (p.pierce <= 0) return false;
        }
      }

      return p.x > -40 && p.x < this.canvas.width + 40;
    });
  }

  updateRainZones () {
    this.game.rainZones = this.game.rainZones.filter((z) => {
      z.life--;
      z.tick = (z.tick || 0) + 1;
      if (z.tick % 15 === 0) {
        for (const e of this.game.enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - z.x, e.y - z.y) <= z.r) {
            this.damageEnemy(e, z.dot, '#ffd54f');
          }
        }
      }
      return z.life > 0;
    });
  }

  createDrop (x, y, chanceBonus = 0) {
    const roll = Math.random();
    if (roll > 0.28 + chanceBonus + (this.game.tactic.dropBonus || 0)) return;
    let type = 'gem';
    if (roll < 0.06) type = 'heal';
    else if (roll < 0.1) type = 'core';
    else if (roll < 0.16) type = 'scrap';
    else if (roll > 0.22 && roll < 0.27) type = 'fury';

    this.game.drops.push({
      x,
      y: y - 10,
      vy: -0.6,
      life: 600,
      type
    });
  }

  updateDrops () {
    this.game.drops = this.game.drops.filter(d => {
      d.y += d.vy;
      d.vy = Math.min(0.8, d.vy + 0.02);
      d.life--;
      if (d.life <= 0) return false;

      const dist = Math.hypot(d.x - this.player.x, d.y - this.player.y);
      if (dist < 34) {
        if (d.type === 'gem') {
          this.game.gems += 24;
          this.createFloatingText(d.x, d.y - 12, '+💎24', '#00d2d3', 12);
        } else if (d.type === 'scrap') {
          this.game.materials.scrap += 2;
          this.createFloatingText(d.x, d.y - 12, '+🧩2', '#a3d977', 12);
        } else if (d.type === 'core') {
          this.game.materials.core += 1;
          this.createFloatingText(d.x, d.y - 12, '+🔷1', '#74b9ff', 12);
        } else if (d.type === 'heal') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
          this.createFloatingText(d.x, d.y - 12, '+20HP', '#55efc4', 12);
        } else if (d.type === 'fury') {
          this.game.buffState.fury = Math.max(this.game.buffState.fury, 480);
          this.createFloatingText(d.x, d.y - 12, '狂怒+8s', '#fdcb6e', 12);
        }
        return false;
      }
      return true;
    });
  }

  createParticles (x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.game.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4.2,
        vy: (Math.random() - 0.5) * 3.6,
        life: 24 + Math.floor(Math.random() * 12),
        color
      });
    }
  }

  updateParticles () {
    this.game.particles = this.game.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.life--;
      return p.life > 0;
    });
  }

  createEnemyDebris (enemy) {
    const sprite = this.getMinecraftSpriteData(enemy.mobStyle || 'zombie');
    const paletteValues = Object.values(sprite.palette || {});
    for (let i = 0; i < 14; i++) {
      const color = paletteValues[Math.floor(Math.random() * paletteValues.length)] || enemy.color || '#ffffff';
      this.game.debris.push({
        x: enemy.x + (Math.random() - 0.5) * 10,
        y: enemy.y - 30 + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 3.8,
        vy: -1.2 - Math.random() * 2.2,
        life: 26 + Math.floor(Math.random() * 18),
        size: 2 + Math.floor(Math.random() * 3),
        color
      });
    }
  }

  updateDebris () {
    this.game.debris = this.game.debris.filter((d) => {
      d.x += d.vx;
      d.y += d.vy;
      d.vy += 0.11;
      d.vx *= 0.98;
      d.life--;
      return d.life > 0 && d.y < this.canvas.height + 30;
    });
  }

  drawDebris () {
    const ctx = this.ctx;
    for (const d of this.game.debris) {
      ctx.globalAlpha = Math.max(0, d.life / 42);
      ctx.fillStyle = d.color;
      ctx.fillRect(d.x, d.y, d.size, d.size);
    }
    ctx.globalAlpha = 1;
  }

  draw () {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawDoodleLayer();
    this.drawMineFieldLayer();
    this.drawRainZones();
    this.drawBase();
    this.drawThreatWarning();
    if (this.player.targetX !== null || this.player.targetY !== null) {
      const tx = this.player.targetX === null ? this.player.x : this.player.targetX;
      const ty = this.player.targetY === null ? this.player.y : this.player.targetY;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(tx, ty + 6, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    this.drawStickman(this.player.x, this.player.y, this.game.currentClass, this.player.facing);
    this.drawOreNodes();
    this.drawMiningStair();
    for (const e of this.game.enemies) this.drawEnemy(e);
    this.drawDebris();
    for (const p of this.game.projectiles) this.drawProjectile(p);
    this.drawDrops();
    this.drawParticles();
    this.drawHealthBars();
  }

  drawMineFieldLayer () {
    if (!this.isMiningMode()) return;
    const ctx = this.ctx;
    const y = this.canvas.height * 0.66;
    const biome = this.getMiningBiome();
    const g = ctx.createLinearGradient(0, y, 0, this.canvas.height);
    g.addColorStop(0, biome ? `${biome.tile}33` : 'rgba(127, 103, 72, 0.08)');
    g.addColorStop(1, biome ? `${biome.tile}66` : 'rgba(73, 54, 37, 0.2)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, this.canvas.width, this.canvas.height - y);
  }

  drawOreNodes () {
    if (!this.isMiningMode()) return;
    const ctx = this.ctx;
    for (const n of this.game.oreNodes) {
      const hpPct = Math.max(0, n.hp / n.maxHp);
      const wobble = Math.sin(n.pulse || 0) * 1.5;
      ctx.save();
      ctx.translate(n.x, n.y + wobble);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 8, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (this.game.visualStyle === 'block') {
        ctx.fillStyle = '#2f2f2f';
        ctx.fillRect(-20, -24, 40, 30);
        ctx.fillStyle = n.color;
        ctx.fillRect(-16, -20, 32, 24);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(-13, -18, 8, 6);
      } else {
        ctx.fillStyle = '#2f2f2f';
        ctx.beginPath();
        ctx.moveTo(-18, 6);
        ctx.lineTo(-20, -12);
        ctx.lineTo(-7, -24);
        ctx.lineTo(10, -20);
        ctx.lineTo(20, -8);
        ctx.lineTo(17, 7);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.moveTo(-14, 5);
        ctx.lineTo(-16, -10);
        ctx.lineTo(-6, -20);
        ctx.lineTo(8, -17);
        ctx.lineTo(16, -8);
        ctx.lineTo(14, 5);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-18, -31, 36, 4);
      ctx.fillStyle = '#55efc4';
      ctx.fillRect(-18, -31, 36 * hpPct, 4);
      if (this.game.mining.activeOreId === n.id) {
        ctx.strokeStyle = '#ffe66d';
        ctx.lineWidth = 2;
        ctx.strokeRect(-22, -28, 44, 40);
      }
      ctx.restore();
    }
  }

  drawMiningStair () {
    if (!this.isMiningMode() || !this.game.mining.stair) return;
    const ctx = this.ctx;
    const s = this.game.mining.stair;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 10, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4d3b2e';
    ctx.fillRect(s.x - 18, s.y - 16, 36, 22);
    ctx.fillStyle = '#1f1f1f';
    ctx.fillRect(s.x - 12, s.y - 14, 24, 18);
    ctx.strokeStyle = '#d2b48c';
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x - 18, s.y - 16, 36, 22);
    ctx.fillStyle = '#ffeaa7';
    ctx.font = '12px monospace';
    ctx.fillText('下一层', s.x - 18, s.y - 22);
    ctx.restore();
  }

  drawRainZones () {
    const ctx = this.ctx;
    for (const z of this.game.rainZones) {
      const pulse = Math.sin((z.life || 0) * 0.2) * 2;
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#ffe66d';
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawThreatWarning () {
    const ctx = this.ctx;
    const base = this.getBaseRect();
    const cx = base.x + base.w * 0.5;
    const cy = base.y + base.h * 0.5;
    let nearest = Infinity;
    for (const e of this.game.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - cx, e.y - cy);
      if (d < nearest) nearest = d;
    }
    if (!Number.isFinite(nearest)) return;
    if (nearest < 160) {
      const alpha = Math.max(0.08, 0.34 - nearest / 700);
      ctx.save();
      ctx.strokeStyle = `rgba(255,70,70,${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 58 + Math.sin(this.player.animFrame * 0.2) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawDoodleLayer () {
    const ctx = this.ctx;
    const cfg = CONFIG.layers[this.game.layer - 1];
    const biome = this.getMiningBiome();
    const style = this.game.visualStyle;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    if (this.isMiningMode() && biome) {
      gradient.addColorStop(0, biome.top);
      gradient.addColorStop(1, biome.bottom);
    } else {
      gradient.addColorStop(0, cfg.top);
      gradient.addColorStop(1, cfg.bottom);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.isMiningMode() && biome) {
      const tile = biome.tile || '#6b8f5a';
      ctx.save();
      ctx.globalAlpha = 0.14;
      for (let x = 0; x < this.canvas.width + 32; x += 32) {
        for (let y = Math.floor(this.canvas.height * 0.6); y < this.canvas.height + 32; y += 24) {
          ctx.fillStyle = tile;
          ctx.fillRect(x + ((y / 24) % 2 === 0 ? 0 : 12), y, 20, 14);
        }
      }
      ctx.restore();
    }

    if (style === 'toon' || style === 'neo') {
      const sun = ctx.createRadialGradient(
        this.canvas.width * 0.25, this.canvas.height * 0.2, 30,
        this.canvas.width * 0.25, this.canvas.height * 0.2, this.canvas.height * 0.9
      );
      sun.addColorStop(0, style === 'neo' ? 'rgba(255,210,140,0.16)' : 'rgba(255,240,170,0.18)');
      sun.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      const groundY = this.canvas.height * 0.62;
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, this.canvas.height);
      groundGrad.addColorStop(0, style === 'neo' ? 'rgba(30,35,40,0.05)' : 'rgba(35,55,25,0.06)');
      groundGrad.addColorStop(1, style === 'neo' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.22)');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, this.canvas.width, this.canvas.height - groundY);
    }

    // 程序生成像素背景，替代线稿底图。
    const tile = this.isMiningMode()
      ? (biome?.tile || '#6b8f5a')
      : (this.game.layer === 1 ? '#6fa95f'
        : (this.game.layer === 2 ? '#6f7682'
          : (this.game.layer === 3 ? '#8b5b4e' : '#7aa0c4')));
    ctx.save();
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 20; i++) {
      const x = (i * 91 + this.game.wave * 13) % (this.canvas.width + 60) - 30;
      const h = 38 + (i % 5) * 12;
      ctx.fillStyle = tile;
      ctx.fillRect(x, this.canvas.height * 0.58 - h, 44, h);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(x, this.canvas.height * 0.58 - h, 6, h);
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = this.isMiningMode() ? 0.28 : 0.2;
    for (let i = 0; i < 13; i++) {
      const x = (i * 170 + this.game.wave * 7) % (this.canvas.width + 120) - 40;
      const topY = 46 + (i % 3) * 28;
      const size = 12 + (i % 4) * 4;
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(x, topY, size * 3, size);
      ctx.fillRect(x + size, topY - size * 0.7, size * 2, size * 0.7);
    }
    ctx.restore();

    if (imageReady(this.customSprites.bgStamp)) {
      ctx.save();
      ctx.globalAlpha = style === 'neo' ? 0.2 : 0.14;
      const stampW = 220;
      const stampH = 140;
      ctx.drawImage(this.customSprites.bgStamp, this.canvas.width - stampW - 16, this.canvas.height - stampH - 180, stampW, stampH);
      ctx.restore();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const x = (i * 170 + (this.game.wave * 13) % 100) % this.canvas.width;
      const y = 80 + (i % 3) * 40;
      ctx.beginPath();
      ctx.arc(x, y, 10 + (i % 2) * 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (style === 'neo') {
      const vignette = ctx.createRadialGradient(
        this.canvas.width * 0.5, this.canvas.height * 0.5, this.canvas.height * 0.2,
        this.canvas.width * 0.5, this.canvas.height * 0.5, this.canvas.height * 0.85
      );
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  drawBase () {
    const ctx = this.ctx;
    const base = this.getBaseRect();
    const x = base.x;
    const y = base.y;
    const w = base.w;
    const h = base.h;
    const hpPct = Math.max(0, this.game.base.hp / this.game.base.maxHp);

    if (this.game.visualStyle === 'block') {
      // 方块房子：加亮面/暗面和像素轮廓，和方块角色统一风格。
      ctx.fillStyle = 'rgba(0,0,0,0.24)';
      ctx.fillRect(x - 10, y + h + 4, w + 20, 6);

      ctx.fillStyle = '#3d2f2b';
      ctx.fillRect(x - 3, y - 30, w + 6, 8);
      ctx.fillStyle = '#6a4e45';
      ctx.fillRect(x - 10, y - 22, w + 20, 18);
      ctx.fillStyle = '#8f6b5d';
      ctx.fillRect(x - 8, y - 20, w + 16, 14);

      ctx.fillStyle = '#7a5d52';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#9b786b';
      ctx.fillRect(x + 3, y + 2, w - 9, h - 4);
      ctx.fillStyle = '#624941';
      ctx.fillRect(x + w - 8, y + 2, 6, h - 4);

      ctx.fillStyle = '#4e342e';
      ctx.fillRect(x + w * 0.36, y + h * 0.42, 20, 27);
      ctx.fillStyle = '#6f4d42';
      ctx.fillRect(x + w * 0.39, y + h * 0.45, 14, 24);
      ctx.strokeStyle = 'rgba(255,255,255,0.24)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + w * 0.39, y + h * 0.45, 14, 24);
    } else if (this.game.visualStyle === 'toon' || this.game.visualStyle === 'neo') {
      const dark = this.game.visualStyle === 'neo';
      ctx.fillStyle = 'rgba(0,0,0,0.24)';
      ctx.beginPath();
      ctx.ellipse(x + w * 0.5, y + h + 8, 50, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = dark ? '#5f4a45' : '#8a6d63';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = dark ? '#7c5f58' : '#ab8779';
      ctx.fillRect(x + 4, y + 3, w - 10, h - 5);
      ctx.fillStyle = dark ? '#46332f' : '#6a4a42';
      ctx.fillRect(x + w - 8, y + 2, 6, h - 4);

      ctx.fillStyle = dark ? '#4c3a36' : '#6e4f44';
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x + w * 0.5, y - 34);
      ctx.lineTo(x + w + 10, y);
      ctx.fill();
      ctx.fillStyle = dark ? '#6b4d45' : '#8a6558';
      ctx.beginPath();
      ctx.moveTo(x - 2, y);
      ctx.lineTo(x + w * 0.5, y - 28);
      ctx.lineTo(x + w + 2, y);
      ctx.fill();

      ctx.fillStyle = '#4e342e';
      ctx.fillRect(x + w * 0.36, y + h * 0.42, 20, 27);
      ctx.fillStyle = '#7f5a4d';
      ctx.fillRect(x + w * 0.39, y + h * 0.45, 14, 24);
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 1.3;
      ctx.strokeRect(x + w * 0.39, y + h * 0.45, 14, 24);
    } else {
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#5d4037';
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x + w * 0.5, y - 34);
      ctx.lineTo(x + w + 10, y);
      ctx.fill();
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(x + w * 0.36, y + h * 0.46, 20, 25);
    }

    if (imageReady(this.customSprites.base)) {
      ctx.drawImage(this.customSprites.base, x - 16, y - 32, 106, 84);
    }

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x, y - 44, w, 7);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x, y - 44, w * hpPct, 7);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(x, y - 44, w, 7);

    if (this.game.baseFlash > 0) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(x - 24, y - 58, 132, 110);
      ctx.restore();
      this.game.baseFlash--;
    }
  }

  drawStickman (x, y, type, facing) {
    if (this.game.visualStyle === 'block') {
      this.drawBlockHero(x, y, type, facing);
      return;
    }
    const ctx = this.ctx;
    const item = this.getEquippedItem() || { icon: '🗡️' };
    const premium = this.game.visualStyle === 'toon' || this.game.visualStyle === 'neo';
    const bounce = Math.sin(this.player.animFrame * 0.15) * 2.5;
    const attackOffset = this.player.attacking ? facing * 13 : 0;
    const weaponX = x + facing * 21 + attackOffset;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 5, 14, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (imageReady(this.customSprites.hero)) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      if (facing < 0) {
        ctx.translate(x, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(this.customSprites.hero, -24, y - 64, 48, 64);
      } else {
        ctx.drawImage(this.customSprites.hero, x - 24, y - 64, 48, 64);
      }
      ctx.restore();
    } else {
      // 外描边，避免人物颜色和背景混在一起。
      ctx.strokeStyle = premium ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.85)';
      ctx.lineWidth = premium ? 5.8 : 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x, y - 44 + bounce, 8.5, 0, Math.PI * 2);
      ctx.moveTo(x, y - 36 + bounce);
      ctx.lineTo(x, y - 16 + bounce);
      ctx.moveTo(x, y - 30 + bounce);
      ctx.lineTo(weaponX, y - 26 + bounce);
      ctx.moveTo(x, y - 30 + bounce);
      ctx.lineTo(x - facing * 12, y - 20 + bounce);
      ctx.moveTo(x, y - 16 + bounce);
      ctx.lineTo(x - 9, y + bounce);
      ctx.moveTo(x, y - 16 + bounce);
      ctx.lineTo(x + 9, y + bounce);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = premium ? 3.8 : 3.2;
      ctx.beginPath();
      ctx.arc(x, y - 44 + bounce, 8.5, 0, Math.PI * 2);
      ctx.moveTo(x, y - 36 + bounce);
      ctx.lineTo(x, y - 16 + bounce);
      ctx.moveTo(x, y - 30 + bounce);
      ctx.lineTo(weaponX, y - 26 + bounce);
      ctx.moveTo(x, y - 30 + bounce);
      ctx.lineTo(x - facing * 12, y - 20 + bounce);
      ctx.moveTo(x, y - 16 + bounce);
      ctx.lineTo(x - 9, y + bounce);
      ctx.moveTo(x, y - 16 + bounce);
      ctx.lineTo(x + 9, y + bounce);
      ctx.stroke();

      if (premium) {
        const bodyGrad = ctx.createLinearGradient(x - 16, y - 56, x + 16, y - 8);
        bodyGrad.addColorStop(0, '#e8f6ff');
        bodyGrad.addColorStop(1, CONFIG.classes[type].color);
        ctx.strokeStyle = bodyGrad;
      } else {
        ctx.strokeStyle = CONFIG.classes[type].color;
      }
      ctx.lineWidth = premium ? 2.8 : 2.1;
      ctx.beginPath();
      ctx.arc(x, y - 44 + bounce, 8.5, 0, Math.PI * 2);
      ctx.moveTo(x, y - 36 + bounce);
      ctx.lineTo(x, y - 16 + bounce);
      ctx.moveTo(x, y - 30 + bounce);
      ctx.lineTo(weaponX, y - 26 + bounce);
      ctx.moveTo(x, y - 30 + bounce);
      ctx.lineTo(x - facing * 12, y - 20 + bounce);
      ctx.moveTo(x, y - 16 + bounce);
      ctx.lineTo(x - 9, y + bounce);
      ctx.moveTo(x, y - 16 + bounce);
      ctx.lineTo(x + 9, y + bounce);
      ctx.stroke();

      if (premium) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x + 2, y - 50 + bounce);
        ctx.lineTo(x + 4, y - 38 + bounce);
        ctx.stroke();
      }
    }

    this.drawWeapon(item.icon, weaponX, y - 20 + bounce, facing);
  }

  drawWeapon (icon, x, y, facing) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '17px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 5;
    // 按朝向镜像武器，让手持方向更自然。
    if (facing < 0) {
      ctx.translate(x, 0);
      ctx.scale(-1, 1);
      ctx.fillText(icon, 0, y);
    } else {
      ctx.fillText(icon, x, y);
    }
    ctx.restore();

    // 移除额外白线，避免出现“人物旁固定白条”。
  }

  drawBlockHero (x, y, type, facing) {
    const ctx = this.ctx;
    const c = CONFIG.classes[type].color;
    const item = this.getEquippedItem() || { icon: '🗡️' };
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    ctx.fillRect(x - 14, y + 2, 28, 4);
    ctx.fillStyle = '#111';
    ctx.fillRect(x - 8, y - 52, 16, 16);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 7, y - 51, 14, 14);
    ctx.fillStyle = c;
    ctx.fillRect(x - 6, y - 50, 12, 12);
    if (type === 'miner') {
      ctx.fillStyle = '#f4d03f';
      ctx.fillRect(x - 8, y - 54, 16, 5);
      ctx.fillStyle = '#4b4b4b';
      ctx.fillRect(x - 3, y - 54, 6, 3);
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 5, y - 34, 10, 18);
    ctx.fillStyle = c;
    ctx.fillRect(x - 4, y - 33, 8, 16);
    if (type === 'miner') {
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(x - 8, y - 32, 3, 12);
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 12, y - 31, 7, 4);
    ctx.fillRect(x + 5, y - 31, 7, 4);
    ctx.fillRect(x - 6, y - 16, 4, 14);
    ctx.fillRect(x + 2, y - 16, 4, 14);
    this.drawWeapon(item.icon, x + facing * 18, y - 26, facing);
    ctx.restore();
  }

  drawEnemy (e) {
    if (imageReady(this.customSprites.enemy)) {
      const ctxCustom = this.ctx;
      ctxCustom.save();
      ctxCustom.shadowColor = 'rgba(0,0,0,0.7)';
      ctxCustom.shadowBlur = 7;
      ctxCustom.shadowOffsetY = 2;
      ctxCustom.drawImage(this.customSprites.enemy, e.x - 19, e.y - 52, 38, 52);
      ctxCustom.restore();
    } else {
      this.drawMinecraftEnemy(e);
    }
    return;

    const ctx = this.ctx;
    const premium = this.game.visualStyle === 'toon' || this.game.visualStyle === 'neo';
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + 6, e.evolved ? 14 : 11, e.evolved ? 5 : 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (imageReady(this.customSprites.enemy)) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 7;
      ctx.shadowOffsetY = 2;
      ctx.drawImage(this.customSprites.enemy, e.x - 19, e.y - 52, 38, 52);
      ctx.restore();
    } else {
      ctx.strokeStyle = premium ? 'rgba(0,0,0,0.93)' : 'rgba(0,0,0,0.85)';
      ctx.fillStyle = '#d63031';
      ctx.lineWidth = premium ? (e.evolved ? 6 : 5) : (e.evolved ? 5 : 4);
      ctx.beginPath();
      ctx.arc(e.x, e.y - 40, e.evolved ? 12 : 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.x, e.y - 30);
      ctx.lineTo(e.x, e.y - (e.evolved ? 4 : 10));
      ctx.moveTo(e.x, e.y - 24);
      ctx.lineTo(e.x - (e.evolved ? 24 : 18), e.y - 16);
      ctx.moveTo(e.x, e.y - 24);
      ctx.lineTo(e.x + (e.evolved ? 24 : 18), e.y - 16);
      ctx.moveTo(e.x, e.y - (e.evolved ? 4 : 10));
      ctx.lineTo(e.x - (e.evolved ? 12 : 8), e.y + (e.evolved ? 10 : 4));
      ctx.moveTo(e.x, e.y - (e.evolved ? 4 : 10));
      ctx.lineTo(e.x + (e.evolved ? 12 : 8), e.y + (e.evolved ? 10 : 4));
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = premium ? (e.evolved ? 3.8 : 3.2) : (e.evolved ? 3.2 : 2.6);
      ctx.beginPath();
      ctx.arc(e.x, e.y - 40, e.evolved ? 12 : 10, 0, Math.PI * 2);
      ctx.moveTo(e.x, e.y - 30);
      ctx.lineTo(e.x, e.y - (e.evolved ? 4 : 10));
      ctx.moveTo(e.x, e.y - 24);
      ctx.lineTo(e.x - (e.evolved ? 24 : 18), e.y - 16);
      ctx.moveTo(e.x, e.y - 24);
      ctx.lineTo(e.x + (e.evolved ? 24 : 18), e.y - 16);
      ctx.moveTo(e.x, e.y - (e.evolved ? 4 : 10));
      ctx.lineTo(e.x - (e.evolved ? 12 : 8), e.y + (e.evolved ? 10 : 4));
      ctx.moveTo(e.x, e.y - (e.evolved ? 4 : 10));
      ctx.lineTo(e.x + (e.evolved ? 12 : 8), e.y + (e.evolved ? 10 : 4));
      ctx.stroke();

      if (premium) {
        const eGrad = ctx.createLinearGradient(e.x - 18, e.y - 54, e.x + 14, e.y - 6);
        eGrad.addColorStop(0, '#ffc1c1');
        eGrad.addColorStop(1, e.color);
        ctx.strokeStyle = eGrad;
      } else {
        ctx.strokeStyle = e.color;
      }
      ctx.lineWidth = premium ? (e.evolved ? 2.8 : 2.4) : (e.evolved ? 2.2 : 1.8);
      ctx.beginPath();
      ctx.arc(e.x, e.y - 40, e.evolved ? 12 : 10, 0, Math.PI * 2);
      ctx.moveTo(e.x, e.y - 30);
      ctx.lineTo(e.x, e.y - (e.evolved ? 4 : 10));
      ctx.moveTo(e.x, e.y - 24);
      ctx.lineTo(e.x - (e.evolved ? 24 : 18), e.y - 16);
      ctx.moveTo(e.x, e.y - 24);
      ctx.lineTo(e.x + (e.evolved ? 24 : 18), e.y - 16);
      ctx.moveTo(e.x, e.y - (e.evolved ? 4 : 10));
      ctx.lineTo(e.x - (e.evolved ? 12 : 8), e.y + (e.evolved ? 10 : 4));
      ctx.moveTo(e.x, e.y - (e.evolved ? 4 : 10));
      ctx.lineTo(e.x + (e.evolved ? 12 : 8), e.y + (e.evolved ? 10 : 4));
      ctx.stroke();

      if (premium) {
        ctx.strokeStyle = 'rgba(255,255,255,0.42)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(e.x + 3, e.y - 49);
        ctx.lineTo(e.x + 5, e.y - 41);
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#ff3b30';
    ctx.beginPath();
    ctx.arc(e.x - 3, e.y - 42, 2, 0, Math.PI * 2);
    ctx.arc(e.x + 3, e.y - 42, 2, 0, Math.PI * 2);
    ctx.fill();

    if (e.frozen > 0) {
      ctx.strokeStyle = '#74b9ff';
      ctx.strokeRect(e.x - 14, e.y - 56, 28, 34);
    }

    const hpPct = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(e.x - 15, e.y - 60, 30, 4);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(e.x - 15, e.y - 60, 30 * hpPct, 4);
    if (e.math) {
      const kindMark = e.kind === 'armored' || e.kind === 'evolved'
        ? '🛡'
        : (e.kind === 'swift' ? '⚡' : (e.kind === 'swarm' ? '群' : ''));
      ctx.fillStyle = '#fefefe';
      ctx.font = '12px monospace';
      ctx.fillText(`${kindMark}${e.math.question}`, e.x - 24, e.y - 68);
    }
  }

  drawBlockEnemy (e) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.24)';
    ctx.fillRect(e.x - 12, e.y + 2, 24, 4);
    const color = e.evolved ? '#2d3436' : e.color;
    ctx.fillStyle = '#111';
    ctx.fillRect(e.x - 8, e.y - 50, 16, 16);
    ctx.fillStyle = '#fff';
    ctx.fillRect(e.x - 7, e.y - 49, 14, 14);
    ctx.fillStyle = color;
    ctx.fillRect(e.x - 6, e.y - 48, 12, 12);
    ctx.fillStyle = '#fff';
    ctx.fillRect(e.x - 5, e.y - 34, 10, 18);
    ctx.fillStyle = color;
    ctx.fillRect(e.x - 4, e.y - 33, 8, 16);
    // 手臂
    ctx.fillStyle = '#fff';
    ctx.fillRect(e.x - 12, e.y - 31, 7, 4);
    ctx.fillRect(e.x + 5, e.y - 31, 7, 4);
    ctx.fillStyle = color;
    ctx.fillRect(e.x - 11, e.y - 30, 5, 2);
    ctx.fillRect(e.x + 6, e.y - 30, 5, 2);
    // 双腿（修复“没有腿”）
    ctx.fillStyle = '#fff';
    ctx.fillRect(e.x - 6, e.y - 16, 4, 14);
    ctx.fillRect(e.x + 2, e.y - 16, 4, 14);
    ctx.fillStyle = color;
    ctx.fillRect(e.x - 5, e.y - 15, 2, 12);
    ctx.fillRect(e.x + 3, e.y - 15, 2, 12);
    // 脚底块
    ctx.fillStyle = '#1f1f1f';
    ctx.fillRect(e.x - 7, e.y - 2, 5, 2);
    ctx.fillRect(e.x + 2, e.y - 2, 5, 2);
    ctx.fillStyle = '#ff2d55';
    ctx.fillRect(e.x - 4, e.y - 46, 3, 3);
    ctx.fillRect(e.x + 1, e.y - 46, 3, 3);
    if (e.math) {
      const kindMark = e.kind === 'armored' || e.kind === 'evolved'
        ? '🛡'
        : (e.kind === 'swift' ? '⚡' : (e.kind === 'swarm' ? '群' : ''));
      ctx.fillStyle = '#fefefe';
      ctx.font = '12px monospace';
      ctx.fillText(`${kindMark}${e.math.question}`, e.x - 24, e.y - 68);
    }
    const hpPct = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(e.x - 15, e.y - 60, 30, 4);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(e.x - 15, e.y - 60, 30 * hpPct, 4);
    ctx.restore();
  }

  drawMinecraftEnemy (e) {
    const ctx = this.ctx;
    const hpPct = Math.max(0, e.hp / e.maxHp);
    const mob = e.mobStyle || 'zombie';
    const scale = e.evolved ? 2.4 : 2;
    const sprite = this.getMinecraftSpriteData(mob);
    const w = 16 * scale;
    const h = 16 * scale;
    const x = e.x - w * 0.5;
    const y = e.y - h - 8;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgba(0,0,0,0.24)';
    ctx.fillRect(e.x - 14, e.y + 2, 28, 4);
    this.drawPixelSprite(x, y, scale, sprite.pixels, sprite.palette);
    if (e.hitFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.18 + e.hitFlash * 0.08})`;
      ctx.fillRect(x, y, w, h);
    }
    if (e.frozen > 0) {
      ctx.strokeStyle = '#74b9ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    }
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(e.x - 16, y - 10, 32, 4);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(e.x - 16, y - 10, 32 * hpPct, 4);
    if (e.math) {
      const kindMark = e.kind === 'armored' || e.kind === 'evolved'
        ? '🛡'
        : (e.kind === 'swift' ? '⚡' : (e.kind === 'swarm' ? '群' : ''));
      ctx.fillStyle = '#fefefe';
      ctx.font = '12px monospace';
      ctx.fillText(`${kindMark}${e.math.question}`, e.x - 24, y - 18);
    }
    if (e.elite) {
      ctx.fillStyle = '#ffd32a';
      ctx.font = '14px monospace';
      ctx.fillText('★', e.x - 4, y - 30);
    }
    ctx.restore();
  }

  drawPixelSprite (x, y, scale, pixels, palette) {
    const ctx = this.ctx;
    for (let r = 0; r < pixels.length; r++) {
      const row = pixels[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.') continue;
        const color = palette[ch];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
      }
    }
  }

  getMinecraftSpriteData (mob) {
    const defs = {
      slime: {
        palette: { a: '#7fd37f', b: '#5fae5f', c: '#203020', d: '#3f7f3f' },
        pixels: [
          '................',
          '....aaaaaaaa....',
          '...abbbbbbbba...',
          '..abbbbbbbbbba..',
          '..abbbbbbbbbba..',
          '..abbbbbbbbbba..',
          '..abbbccbbccba..',
          '..abbbbbbbbbba..',
          '..abbbbddbbbba..',
          '..abbbbbbbbbba..',
          '..abbbbbbbbbba..',
          '..abbbbbbbbbba..',
          '..abbbbbbbbbba..',
          '...abbbbbbbba...',
          '....aaaaaaaa....',
          '................'
        ]
      },
      skeleton: {
        palette: { a: '#ecf0f1', b: '#d5dde2', c: '#2d3436', d: '#9aa6ad' },
        pixels: [
          '.....aaaaaa.....',
          '....abbbbbba....',
          '....abccccba....',
          '....abbbbbba....',
          '.....adddda.....',
          '......abb......',
          '......abb......',
          '....aaabbbbaa...',
          '...abbbbbbbbba..',
          '......abb......',
          '......abb......',
          '......abb......',
          '.....abbbba.....',
          '.....ab..ba.....',
          '.....ab..ba.....',
          '.....aa..aa.....'
        ]
      },
      spider: {
        palette: { a: '#0f0f0f', b: '#2a2a2a', c: '#ff5c6c', d: '#3a3a3a' },
        pixels: [
          '................',
          '..aa..aaaa..aa..',
          '.aa.aaaaaaaa.aa.',
          '.aabbbbbbbbbb.a.',
          'aaabbbbbbbbbbbaa',
          '.abbbccbbccbbba.',
          '.abbbbbbbbbbbba.',
          'aaabbbbbbbbbbaaa',
          '.abbbbbbbbbbbba.',
          '.aabbbbbbbbbbaa.',
          '..aa..aaaa..aa..',
          '.aa..........aa.',
          'aa............aa',
          '................',
          '................',
          '................'
        ]
      },
      enderman: {
        palette: { a: '#111111', b: '#212121', c: '#d980fa', d: '#6c5ce7' },
        pixels: [
          '......aaaa......',
          '.....abbbba.....',
          '.....abccba.....',
          '.....abddba.....',
          '......abba......',
          '......abba......',
          '......abba......',
          '.....aabbaa.....',
          '....aabbbbaa....',
          '....aabbbbaa....',
          '.....abbbba.....',
          '.....abbbba.....',
          '.....ab..ba.....',
          '.....ab..ba.....',
          '.....ab..ba.....',
          '....aa....aa....'
        ]
      },
      zombie: {
        palette: { a: '#5ea869', b: '#4f6d9a', c: '#2d3436', d: '#5b3f8c', e: '#78c58a' },
        pixels: [
          '.....aaaaaa.....',
          '....aeeeeeea....',
          '....aeccceea....',
          '....aeeeeeea....',
          '.....aaaaaa.....',
          '......bbbb......',
          '......bbbb......',
          '....aaabbbbaa...',
          '...aeeeebbbbea..',
          '......bbbb......',
          '......bbbb......',
          '......dddd......',
          '......dddd......',
          '.....dd..dd.....',
          '.....dd..dd.....',
          '.....dd..dd.....'
        ]
      }
    };
    return defs[mob] || defs.zombie;
  }

  drawProjectile (p) {
    const ctx = this.ctx;
    if (imageReady(this.customSprites.projectile)) {
      ctx.drawImage(this.customSprites.projectile, p.x - 9, p.y - 9, 18, 18);
      return;
    }
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(p.x - p.vx * 1.8, p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawDrops () {
    const ctx = this.ctx;
    for (const d of this.game.drops) {
      let icon = '💎';
      if (d.type === 'heal') icon = '❤️';
      if (d.type === 'fury') icon = '🔥';
      if (d.type === 'scrap') icon = '🧩';
      if (d.type === 'core') icon = '🔷';
      if (d.type === 'gem' && imageReady(this.customSprites.dropGem)) {
        ctx.drawImage(this.customSprites.dropGem, d.x - 10, d.y - 12, 20, 20);
        continue;
      }
      if (d.type === 'heal' && imageReady(this.customSprites.dropHeal)) {
        ctx.drawImage(this.customSprites.dropHeal, d.x - 10, d.y - 12, 20, 20);
        continue;
      }
      if (d.type === 'fury' && imageReady(this.customSprites.dropFury)) {
        ctx.drawImage(this.customSprites.dropFury, d.x - 10, d.y - 12, 20, 20);
        continue;
      }
      ctx.font = '16px Arial';
      ctx.fillText(icon, d.x - 8, d.y - 4);
    }
  }

  drawParticles () {
    const ctx = this.ctx;
    for (const p of this.game.particles) {
      ctx.globalAlpha = p.life / 35;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
  }

  drawHealthBars () {
    const ctx = this.ctx;
    const cfg = CONFIG.classes[this.game.currentClass];
    const hpPct = Math.max(0, this.player.hp / this.player.maxHp);
    const skillPct = this.player.skillCooldown / cfg.skillCd;

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(this.player.x - 22, this.player.y - 72, 44, 6);
    ctx.fillStyle = cfg.color;
    ctx.fillRect(this.player.x - 22, this.player.y - 72, 44 * hpPct, 6);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(this.player.x - 22, this.player.y - 82, 44, 4);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(this.player.x - 22, this.player.y - 82, 44 * (1 - skillPct), 4);
  }

  showWaveInfo (text) {
    this.ui.waveInfo.textContent = text;
    this.ui.waveInfo.style.opacity = 1;
    setTimeout(() => {
      this.ui.waveInfo.style.opacity = 0;
    }, 2200);
  }

  createFloatingText (x, y, text, color, size = 16) {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;left:${x}px;top:${y}px;color:${color};font-size:${size}px;font-weight:bold;pointer-events:none;text-shadow:2px 2px 0 #000;transition:all 1s;z-index:50;`;
    el.textContent = text;
    document.body.appendChild(el);

    setTimeout(() => {
      el.style.transform = 'translateY(-40px)';
      el.style.opacity = 0;
    }, 40);
    setTimeout(() => {
      el.remove();
    }, 1000);
  }

  refreshSketchHint () {
    const cls = this.game.currentClass;
    const layerName = CONFIG.layers[this.game.layer - 1].name.replace('图', '');
    const gear = this.getEquippedItem() || { rarity: 0, name: '无装备', icon: '❔', cooldown: 0, ultimate: false };
    const rarityName = CONFIG.rarities[gear.rarity].name;
    const stage = this.getSkillStage();
    const skillName = this.getSkillName();
    const cooldownText = this.player.skillCooldown > 0 ? `${Math.ceil(this.player.skillCooldown / 60)}s` : '就绪';
    const classExtra = this.game.currentClass === 'warrior'
      ? `嘲讽:${Math.ceil(this.player.tauntTimer / 60)}s`
      : (this.game.currentClass === 'assassin'
          ? '致盲技:2/4/6/8/10格'
          : (this.game.currentClass === 'mage'
              ? '范围冰冻'
              : (this.game.currentClass === 'miner'
                  ? `采矿Lv${this.game.mining.level} 体力:${Math.floor(this.game.mining.stamina)}/${this.game.mining.maxStamina}`
                  : '范围持续流血')));
    const modeText = this.game.spawnMode === 'auto' ? '自动' : (this.game.spawnMode === 'top' ? '下落' : '横向');
    const nextWaveText = this.game.waveInProgress
      ? '本波进行中'
      : `下波:${Math.max(0, Math.ceil((this.game.nextWaveAt - performance.now()) / 1000))}s`;
    const kindLabel = {
      normal: '普通',
      swift: '迅捷',
      armored: '装甲',
      swarm: '群体',
      evolved: '进化'
    };
    const bonusKeys = Object.keys(gear.bonus || {});
    const bonusText = bonusKeys.length ? `克制:${bonusKeys.map(k => kindLabel[k] || k).join('/')}` : '通用';
    const gearLimit = gear.ultimate ? ` · 限制CD:${Math.ceil((gear.cooldown || 0) / 60)}s` : '';
    const tacticText = this.game.tactic.id === 'none'
      ? '战术:无'
      : `战术:${this.game.tactic.name} ${Math.ceil(this.game.tactic.timer / 60)}s`;
    const mineMapText = this.getMiningBiome()?.name || '-';
    const mineText = this.isMiningMode()
      ? `矿区:${mineMapText} · 矿层:${this.game.mining.depth} · 任务:${this.getMiningQuestText()}`
      : `刷怪轨迹:${modeText} · ${nextWaveText}`;
    const learningTotal = this.game.learning.correct + this.game.learning.wrong;
    const learningText = this.game.learning.enabled
      ? `学习:目标${this.game.learning.targetAnswer} 连对${this.game.learning.streak} 正确${this.game.learning.correct}/${learningTotal}`
      : '学习:关闭';
    this.sketchHint.innerHTML = `层:${layerName} · ${cls}<br>装备:${gear.icon}${gear.name}(${rarityName})${gearLimit}<br>${bonusText} · 技能T${stage}:${skillName}(${cooldownText})<br>${classExtra} · ${tacticText}<br>${mineText}<br>${learningText}`;
  }

  updateGearGuide () {
    if (!this.ui.gearGuideText) return;
    if (this.isMiningMode()) {
      this.ui.gearGuideText.textContent = '矿工模式：点击矿石采集资源，切换矿区获取不同掉落加成。';
      return;
    }
    const alive = this.game.enemies.filter(e => !e.dead);
    if (!alive.length) {
      this.ui.gearGuideText.textContent = '等待刷怪：通用武器开局即可。';
      return;
    }
    const weights = { normal: 0, swift: 0, armored: 0, swarm: 0, evolved: 0 };
    alive.forEach((e) => {
      const key = e.evolved ? 'evolved' : (e.kind || 'normal');
      weights[key] = (weights[key] || 0) + 1;
    });
    const dominant = Object.entries(weights).sort((a, b) => b[1] - a[1])[0][0];
    const inv = this.getCurrentInventory();
    let best = null;
    let bestScore = -1;
    inv.forEach((it) => {
      const score = (it.baseMul || 1) * (it.bonus?.[dominant] || (dominant === 'evolved' ? (it.bonus?.evolved || 1) : 1));
      if (score > bestScore) {
        best = it;
        bestScore = score;
      }
    });
    const enemyText = `怪型: 装甲${weights.armored} 迅捷${weights.swift} 群体${weights.swarm} 进化${weights.evolved}`;
    if (!best) {
      this.ui.gearGuideText.textContent = enemyText;
      return;
    }
    const suffix = best.unlocked ? '可直接使用' : '未铸造，去装备台解锁';
    this.ui.gearGuideText.textContent = `${enemyText} | 推荐 ${best.icon}${best.name}（${suffix}）`;
  }

  updateUI () {
    const stats = loadSave();
    this.ui.gems.textContent = this.game.gems;
    this.ui.scrap.textContent = this.game.materials.scrap;
    this.ui.core.textContent = this.game.materials.core;
    this.ui.kills.textContent = this.game.kills;
    this.ui.wave.textContent = this.game.wave || 1;
    this.ui.layer.textContent = `${this.game.layer} (${CONFIG.layers[this.game.layer - 1].name})`;
    this.ui.baseHp.textContent = Math.max(0, Math.floor(this.game.base.hp));
    this.ui.combo.textContent = this.game.combo;
    const buffTexts = [];
    if (this.game.buffState.fury > 0) buffTexts.push(`狂怒${Math.ceil(this.game.buffState.fury / 60)}s`);
    if (this.game.buffState.shield > 0) buffTexts.push(`护盾${Math.ceil(this.game.buffState.shield / 60)}s`);
    if (this.game.tactic.id !== 'none') buffTexts.push(`${this.game.tactic.name}${Math.ceil(this.game.tactic.timer / 60)}s`);
    this.ui.buff.textContent = buffTexts.length ? buffTexts.join(' / ') : '无';
    this.ui.quest.textContent = this.game.quest.done
      ? `${this.game.quest.text}（完成）`
      : `${this.game.quest.text} ${this.game.quest.progress}/${this.game.quest.target}`;
    this.ui.forgeGems.textContent = this.game.gems;
    this.ui.forgeScrap.textContent = this.game.materials.scrap;
    this.ui.forgeCore.textContent = this.game.materials.core;
    if (this.ui.mineLevel) this.ui.mineLevel.textContent = String(this.game.mining.level);
    if (this.ui.mineDepth) this.ui.mineDepth.textContent = String(this.game.mining.depth);
    const staminaNow = Math.floor(this.game.mining.stamina);
    const staminaMax = Math.max(1, this.game.mining.maxStamina);
    const staminaPct = this.clamp((staminaNow / staminaMax) * 100, 0, 100);
    if (this.ui.mineStamina) this.ui.mineStamina.textContent = `${staminaNow}/${staminaMax}`;
    if (this.ui.mineStaminaBar) {
      this.ui.mineStaminaBar.style.width = `${staminaPct}%`;
      this.ui.mineStaminaBar.style.background = staminaPct <= 25
        ? 'linear-gradient(90deg, #e74c3c, #f39c12)'
        : 'linear-gradient(90deg, #2ecc71, #f1c40f)';
    }
    if (this.ui.mineStaminaHudText) this.ui.mineStaminaHudText.textContent = `矿工体力 ${staminaNow}/${staminaMax}`;
    if (this.ui.mineStaminaHudBar) {
      this.ui.mineStaminaHudBar.style.width = `${staminaPct}%`;
      this.ui.mineStaminaHudBar.style.background = staminaPct <= 25
        ? 'linear-gradient(90deg, #e74c3c, #f39c12)'
        : 'linear-gradient(90deg, #27ae60, #f1c40f)';
    }
    if (this.ui.mineNodes) this.ui.mineNodes.textContent = String(this.game.oreNodes.length);
    if (this.ui.mineMap) this.ui.mineMap.textContent = this.getMiningBiome()?.name || '-';
    if (this.ui.mineQuest) this.ui.mineQuest.textContent = this.getMiningQuestText();
    if (this.ui.bagStone) this.ui.bagStone.textContent = String(this.game.mining.backpack.stone);
    if (this.ui.bagCopper) this.ui.bagCopper.textContent = String(this.game.mining.backpack.copper);
    if (this.ui.bagCrystal) this.ui.bagCrystal.textContent = String(this.game.mining.backpack.crystal);
    if (this.ui.bagMyth) this.ui.bagMyth.textContent = String(this.game.mining.backpack.myth);
    if (this.ui.bagIngot) this.ui.bagIngot.textContent = String(this.game.mining.backpack.ingot);
    if (this.ui.autoSmeltState) this.ui.autoSmeltState.textContent = this.game.mining.autoSmelt ? '开' : '关';
    if (this.ui.smeltPolicy) this.ui.smeltPolicy.textContent = this.game.mining.smeltPolicy === 'rare' ? '稀有优先' : '基础优先';
    if (this.ui.learningPanel) this.ui.learningPanel.classList.toggle('hidden', !this.game.learning.enabled);
    if (this.ui.learningTarget) this.ui.learningTarget.textContent = String(this.game.learning.targetAnswer);
    if (this.ui.learningLevel) this.ui.learningLevel.textContent = String(this.game.learning.level);
    if (this.ui.learningStreak) this.ui.learningStreak.textContent = String(this.game.learning.streak);
    const learningTotal = this.game.learning.correct + this.game.learning.wrong;
    const learningAcc = learningTotal > 0 ? Math.round((this.game.learning.correct / learningTotal) * 100) : 0;
    if (this.ui.learningAccuracy) this.ui.learningAccuracy.textContent = `${learningAcc}%`;
    const activeEnemy = this.getLearningActiveEnemy();
    const learningQuestionText = activeEnemy?.math?.question
      ? `战斗题：${activeEnemy.math.question}`
      : `训练题：${this.game.learning.practice?.question || '-'}`;
    if (this.ui.learningQuestion) this.ui.learningQuestion.textContent = learningQuestionText;
    const minePanel = document.getElementById('minePanel');
    const minePanelToggle = document.getElementById('minePanelToggle');
    const mineControls = document.getElementById('mineControls');
    const mineBagPanel = document.getElementById('mineBagPanel');
    if (minePanel) minePanel.style.display = this.isMiningMode() ? 'block' : 'none';
    if (minePanel) minePanel.classList.toggle('collapsed', this.game.mining.panelCollapsed);
    if (minePanelToggle) {
      minePanelToggle.style.display = this.isMiningMode() ? 'block' : 'none';
      minePanelToggle.textContent = this.game.mining.panelCollapsed ? '▶' : '⛏';
    }
    if (mineControls) mineControls.style.display = this.isMiningMode() ? 'flex' : 'none';
    if (!this.isMiningMode()) mineBagPanel?.classList.add('hidden');
    if (this.ui.mineStaminaHud) this.ui.mineStaminaHud.style.display = this.isMiningMode() ? 'block' : 'none';
    if (this.ui.skillBtn) {
      const stage = this.getSkillStage();
      const sName = this.getSkillName();
      const compact = document.body.classList.contains('compact-ui');
      if (compact) {
        this.ui.skillBtn.textContent = this.player.skillCooldown > 0 ? '⏳' : '✨';
        this.ui.skillBtn.title = this.game.learning.enabled
          ? '学习中禁用技能'
          : `${sName} T${stage}${this.player.skillCooldown > 0 ? `，剩余${Math.ceil(this.player.skillCooldown / 60)}s` : '，可释放'}`;
      } else {
        this.ui.skillBtn.textContent = this.game.learning.enabled
          ? '学习中禁用'
          : (this.player.skillCooldown > 0
          ? `${sName} T${stage} ${Math.ceil(this.player.skillCooldown / 60)}s`
          : `${sName} T${stage}`);
      }
    }
    this.ui.bestLayer.textContent = stats.bestLayer || 1;
    this.ui.bestKills.textContent = stats.bestKills || 0;
    this.refreshSketchHint();
    this.updateGearGuide();
  }

  pickTapTarget (px, py) {
    let best = null;
    let bestScore = Infinity;

    for (const enemy of this.game.enemies) {
      if (enemy.dead) continue;
      const ex = enemy.x;
      const ey = enemy.y - 22;
      const dx = ex - px;
      const dy = ey - py;
      const dist = Math.hypot(dx, dy);

      // 提高容错：先按点击附近(约120px)吸附，再按离玩家最近兜底。
      if (dist <= 120) {
        if (dist < bestScore) {
          best = enemy;
          bestScore = dist;
        }
        continue;
      }

      const fromPlayer = Math.abs(enemy.x - this.player.x);
      const fallbackScore = dist * 0.7 + fromPlayer * 0.3;
      if (!best && dist <= 230 && fallbackScore < bestScore) {
        best = enemy;
        bestScore = fallbackScore;
      }
    }

    return best;
  }

  useSkill () {
    if (this.game.learning.enabled) {
      this.showWaveInfo('学习闯关中禁用技能');
      return false;
    }
    if (this.player.skillCooldown > 0) return false;
    this.castSkill(
      this.player.aimX || (this.player.x + this.player.facing * 80),
      this.player.aimY || (this.player.y - 20)
    );
    return true;
  }

  forgeUpgradeCurrent (opts = {}) {
    const item = this.getEquippedItem();
    if (!item || item.rarity >= CONFIG.rarities.length - 1) {
      this.showWaveInfo('当前装备已到最高稀有度');
      return false;
    }
    const gemsCost = 100 + item.rarity * 40;
    const scrapCost = 8 + item.rarity * 2;
    if (!opts.skipCost && (this.game.gems < gemsCost || this.game.materials.scrap < scrapCost)) {
      this.showWaveInfo(`资源不足：需要💎${gemsCost} + 🧩${scrapCost}`);
      return false;
    }
    if (!opts.skipCost) {
      this.game.gems -= gemsCost;
      this.game.materials.scrap -= scrapCost;
    }
    item.rarity += 1;
    this.showWaveInfo(`强化成功：${CONFIG.rarities[item.rarity].name}`);
    this.updateSlotBorders();
    this.updateUI();
    return true;
  }

  forgeUnlockNextGear (opts = {}) {
    const inv = this.getCurrentInventory();
    const next = inv.find(item => !item.unlocked);
    if (!next) {
      this.showWaveInfo('当前职业武器已全部铸造');
      return false;
    }
    const unlockedCount = inv.filter(i => i.unlocked).length;
    const gemsCost = 120 + unlockedCount * 110;
    const scrapCost = 10 + unlockedCount * 5;
    const coreCost = unlockedCount >= 2 ? 1 : 0;
    if (!opts.skipCost && (this.game.gems < gemsCost || this.game.materials.scrap < scrapCost || this.game.materials.core < coreCost)) {
      this.showWaveInfo(`铸造不足：需💎${gemsCost} 🧩${scrapCost}${coreCost ? ` 🔷${coreCost}` : ''}`);
      return false;
    }
    if (!opts.skipCost) {
      this.game.gems -= gemsCost;
      this.game.materials.scrap -= scrapCost;
      this.game.materials.core -= coreCost;
    }
    next.unlocked = true;
    this.showWaveInfo(`铸造完成：${next.name}`);
    this.updateSlotBorders();
    this.updateUI();
    return true;
  }

  forgeCustomSilver (opts = {}) {
    if (!this.hasCustomDraft()) {
      this.showWaveInfo('先在自定义工坊上传画稿再锻造银武');
      return false;
    }
    const item = this.getEquippedItem();
    if (!item) return false;
    if (item.rarity >= 2) {
      this.showWaveInfo('当前武器已是银级或更高');
      return false;
    }
    const cost = { gems: 160, scrap: 14, core: 1 };
    if (!opts.skipCost && (this.game.gems < cost.gems || this.game.materials.scrap < cost.scrap || this.game.materials.core < cost.core)) {
      this.showWaveInfo(`银武锻造不足：需💎${cost.gems} 🧩${cost.scrap} 🔷${cost.core}`);
      return false;
    }
    if (!opts.skipCost) {
      this.game.gems -= cost.gems;
      this.game.materials.scrap -= cost.scrap;
      this.game.materials.core -= cost.core;
    }
    item.rarity = 2;
    this.showWaveInfo(`银武完成：${item.name}`);
    this.updateSlotBorders();
    this.updateUI();
    return true;
  }

  forgeSynthesize (opts = {}) {
    if (!opts.skipCost && this.game.materials.core < 3) {
      this.showWaveInfo('核心不足：需要3个🔷');
      return false;
    }
    const upgradable = this.getCurrentInventory()
      .map((item, idx) => ({ item, idx }))
      .filter(x => x.item.unlocked && x.item.rarity < CONFIG.rarities.length - 1);
    if (upgradable.length === 0) {
      this.showWaveInfo('全部装备已满级');
      return false;
    }
    if (!opts.skipCost) this.game.materials.core -= 3;
    const chosen = upgradable[Math.floor(Math.random() * upgradable.length)];
    chosen.item.rarity += 1;
    this.showWaveInfo(`核心合成成功：槽位${chosen.idx + 1}升到${CONFIG.rarities[chosen.item.rarity].name}`);
    this.updateSlotBorders();
    this.updateUI();
    return true;
  }

  forgeRepairBase (opts = {}) {
    if (!opts.skipCost && (this.game.gems < 120 || this.game.materials.scrap < 12)) {
      this.showWaveInfo('修复失败：需要💎120 + 🧩12');
      return false;
    }
    if (!opts.skipCost) {
      this.game.gems -= 120;
      this.game.materials.scrap -= 12;
    }
    this.game.base.hp = Math.min(this.game.base.maxHp, this.game.base.hp + 220);
    this.showWaveInfo('基地修复 +220');
    this.updateUI();
    return true;
  }

  setMinePanelCollapsed (collapsed) {
    this.game.mining.panelCollapsed = !!collapsed;
    this.updateUI();
    return this.game.mining.panelCollapsed;
  }

  getCraftRecipeProfile (count) {
    const ratioKey = `s${count.scrap}g${count.gem}c${count.core}`;
    const base = {
      ratioKey,
      recipeName: '杂糅试炼',
      primary: 'bonus',
      secondary: ['upgrade', 'repair'],
      stable: false,
      baseFail: 0.3,
      baseExplode: 0.11,
      bookText: '手册：优先凑齐稳定配方，成功率更高。'
    };
    const map = {
      s2g1c1: {
        recipeName: '锻压强化',
        primary: 'upgrade',
        secondary: ['unlock', 'repair'],
        stable: true,
        baseFail: 0.18,
        baseExplode: 0.06,
        bookText: '手册：🧩x2 + 💎x1 + 🔷x1，主结果为强化。'
      },
      s1g2c1: {
        recipeName: '晶核锻铸',
        primary: 'unlock',
        secondary: ['upgrade', 'bonus'],
        stable: true,
        baseFail: 0.2,
        baseExplode: 0.07,
        bookText: '手册：🧩x1 + 💎x2 + 🔷x1，主结果为铸造。'
      },
      s1g1c2: {
        recipeName: '核心跃迁',
        primary: 'synthesize',
        secondary: ['upgrade', 'unlock'],
        stable: true,
        baseFail: 0.22,
        baseExplode: 0.1,
        bookText: '手册：🧩x1 + 💎x1 + 🔷x2，主结果为熔铸。'
      },
      s3g1c0: {
        recipeName: '战备修复',
        primary: 'repair',
        secondary: ['upgrade', 'bonus'],
        stable: true,
        baseFail: 0.17,
        baseExplode: 0.03,
        bookText: '手册：🧩x3 + 💎x1，主结果为修房子。'
      },
      s2g2c0: {
        recipeName: '资源回流',
        primary: 'bonus',
        secondary: ['upgrade', 'repair'],
        stable: true,
        baseFail: 0.14,
        baseExplode: 0.02,
        bookText: '手册：🧩x2 + 💎x2，主结果为资源回流。'
      }
    };
    return { ...base, ...(map[ratioKey] || {}) };
  }

  calcCraftRates (profile, count, repeat) {
    const masteryCut = Math.min(0.12, Math.max(0, repeat - 1) * 0.02);
    const coreRisk = count.core * 0.015;
    const unstableRisk = profile.stable ? 0 : 0.05;
    const failRate = this.clamp(profile.baseFail + unstableRisk - masteryCut, 0.07, 0.58);
    const explodeRate = this.clamp(profile.baseExplode + coreRisk + (repeat >= 5 ? 0.02 : 0), 0.01, 0.36);
    const successRate = this.clamp(1 - failRate, 0, 1);
    return { failRate, explodeRate, successRate };
  }

  getCraftRecipeInsight (cells) {
    if (!Array.isArray(cells) || cells.length !== 4) {
      return {
        recipeName: '未识别',
        successRateText: '-',
        explodeRateText: '-',
        outcomeHint: '先放入材料',
        ruleBookText: '手册：先放入材料'
      };
    }
    const count = {
      scrap: cells.filter(x => x === 'scrap').length,
      gem: cells.filter(x => x === 'gem').length,
      core: cells.filter(x => x === 'core').length
    };
    const total = count.scrap + count.gem + count.core;
    if (total <= 0) {
      return {
        recipeName: '未识别',
        successRateText: '-',
        explodeRateText: '-',
        outcomeHint: '先放入材料',
        ruleBookText: '手册：先放入材料'
      };
    }
    const profile = this.getCraftRecipeProfile(count);
    const ratioKey = profile.ratioKey;
    const repeat = (this.game.craftHistory[ratioKey] || 0) + 1;
    const rates = this.calcCraftRates(profile, count, repeat);
    const hasEnough = this.game.materials.scrap >= count.scrap &&
      this.game.gems >= count.gem &&
      this.game.materials.core >= count.core;
    const outcomeText = {
      unlock: '铸造下一把武器',
      upgrade: '强化当前装备',
      synthesize: '核心熔铸提升',
      repair: '房屋修复',
      bonus: '资源回流包'
    };
    const outcomeHint = `${outcomeText[profile.primary]}（主） / ${profile.secondary.map(x => outcomeText[x]).join(' / ')}`;
    return {
      recipeName: profile.recipeName,
      successRateText: `${Math.round(rates.successRate * 100)}%`,
      explodeRateText: `${Math.round(rates.explodeRate * 100)}%`,
      outcomeHint: hasEnough ? outcomeHint : '材料不足，当前无法合成',
      ruleBookText: profile.bookText
    };
  }

  forgeCraftGrid (cells) {
    if (!Array.isArray(cells) || cells.length !== 4) {
      return { ok: false, showResult: false, closeForgePanel: false, title: '合成结果', lines: [] };
    }

    const key = cells.join(',');
    const count = {
      scrap: cells.filter(x => x === 'scrap').length,
      gem: cells.filter(x => x === 'gem').length,
      core: cells.filter(x => x === 'core').length
    };
    const total = count.scrap + count.gem + count.core;
    const spentLine = `消耗：🧩${count.scrap}  💎${count.gem}  🔷${count.core}`;
    const baseResult = { ok: false, showResult: true, closeForgePanel: true, title: '合成结果', lines: [] };

    if (total <= 0) {
      this.showWaveInfo('请先放入材料');
      return { ...baseResult, showResult: false, closeForgePanel: false };
    }
    if (this.game.materials.scrap < count.scrap || this.game.gems < count.gem || this.game.materials.core < count.core) {
      this.showWaveInfo('材料不足，无法按此配方合成');
      return { ...baseResult, showResult: false, closeForgePanel: false };
    }

    this.game.materials.scrap -= count.scrap;
    this.game.gems -= count.gem;
    this.game.materials.core -= count.core;

    const profile = this.getCraftRecipeProfile(count);
    const ratioKey = profile.ratioKey;
    this.game.craftHistory[ratioKey] = (this.game.craftHistory[ratioKey] || 0) + 1;
    const repeat = this.game.craftHistory[ratioKey];

    const isSecretSilverRecipe = (
      (key === 'core,gem,gem,core' || key === 'gem,core,core,gem') &&
      this.hasCustomDraft()
    );
    if (isSecretSilverRecipe) {
      const okSilver = this.forgeCustomSilver({ skipCost: true });
      if (!okSilver) {
        this.game.materials.scrap += count.scrap;
        this.game.gems += count.gem;
        this.game.materials.core += count.core;
        return { ...baseResult, showResult: false, closeForgePanel: false };
      }
      this.createFloatingText(this.player.x, this.player.y - 88, '隐藏配方触发', '#ffeaa7', 14);
      this.updateUI();
      return {
        ...baseResult,
        ok: true,
        title: '隐藏合成成功',
        lines: [spentLine, '触发自定义银武锻造：当前装备直升银级', '提示：同配方可在不同职业上重复触发。']
      };
    }

    const rates = this.calcCraftRates(profile, count, repeat);
    const failRate = rates.failRate;
    const explodeRate = rates.explodeRate;

    if (Math.random() < failRate) {
      const exploded = Math.random() < explodeRate;
      if (exploded) {
        const loss = {
          scrap: Math.min(this.game.materials.scrap, Math.max(1, Math.floor(count.scrap * 0.5 + Math.random() * 2))),
          gem: Math.min(this.game.gems, Math.floor(count.gem * 0.5 + Math.random() * 2)),
          core: Math.min(this.game.materials.core, (count.core > 0 && Math.random() < 0.55) ? 1 : 0)
        };
        this.game.materials.scrap -= loss.scrap;
        this.game.gems -= loss.gem;
        this.game.materials.core -= loss.core;
        const baseDamage = 20 + count.core * 22 + count.gem * 8;
        this.game.base.hp = Math.max(0, this.game.base.hp - baseDamage);
        this.game.baseFlash = 1;
        this.showWaveInfo('合成爆炸！基地受损');
        this.updateUI();
        return {
          ...baseResult,
          title: '合成爆炸',
          lines: [
            spentLine,
            `失败率：${Math.round(failRate * 100)}% · 爆炸率：${Math.round(explodeRate * 100)}%`,
            `爆炸损失：🧩-${loss.scrap}  💎-${loss.gem}  🔷-${loss.core}`,
            `基地受损：-${Math.round(baseDamage)} HP`
          ]
        };
      }

      let refundScrap = 0;
      let refundGem = 0;
      if (Math.random() < 0.5 && count.scrap > 0) refundScrap = 1;
      if (Math.random() < 0.3 && count.gem > 0) refundGem = 1;
      this.game.materials.scrap += refundScrap;
      this.game.gems += refundGem;
      this.showWaveInfo(`合成失败（失败率${Math.round(failRate * 100)}%）`);
      this.updateUI();
      return {
        ...baseResult,
        title: '合成失败',
        lines: [
          spentLine,
          `失败率：${Math.round(failRate * 100)}%`,
          `返还：🧩+${refundScrap}  💎+${refundGem}`,
          '建议：加入更多核心/钻石可降低失败率。'
        ]
      };
    }

    const recipeName = profile.recipeName;
    const outcomeText = {
      unlock: '铸造下一把武器',
      upgrade: '强化当前装备',
      synthesize: '核心熔铸提升',
      repair: '房屋修复',
      bonus: '资源回流包'
    };
    const ordered = Math.random() < 0.72
      ? [profile.primary, ...profile.secondary]
      : [profile.secondary[0], profile.primary, profile.secondary[1]];
    let finalOutcome = 'bonus';
    let ok = false;

    for (const outcome of ordered) {
      if (outcome === 'unlock') ok = this.forgeUnlockNextGear({ skipCost: true });
      else if (outcome === 'upgrade') ok = this.forgeUpgradeCurrent({ skipCost: true });
      else if (outcome === 'synthesize') ok = this.forgeSynthesize({ skipCost: true });
      else if (outcome === 'repair') ok = this.forgeRepairBase({ skipCost: true });
      else if (outcome === 'bonus') {
        this.game.gems += 26 + count.gem * 10;
        this.game.materials.scrap += 2 + count.scrap;
        if (count.core > 0 && Math.random() < 0.6) this.game.materials.core += 1;
        this.showWaveInfo('合成结果：资源回流包');
        ok = true;
      }
      if (ok) {
        finalOutcome = outcome;
        break;
      }
    }

    if (!ok) {
      this.game.materials.scrap += count.scrap;
      this.game.gems += count.gem;
      this.game.materials.core += count.core;
      this.updateUI();
      return {
        ...baseResult,
        title: '合成未生效',
        lines: [spentLine, '当前状态无法执行本配方，材料已原路返还。']
      };
    }

    if (repeat >= 3) this.createFloatingText(this.player.x, this.player.y - 86, '熟练度提高', '#ffe66d', 13);
    this.updateUI();
    return {
      ...baseResult,
      ok: true,
      title: '合成成功',
      lines: [
        spentLine,
        `配方类型：${recipeName}`,
        `主配方目标：${outcomeText[profile.primary]}，本次结果：${outcomeText[finalOutcome] || '未知结果'}`,
        repeat >= 3 ? `同配方熟练度：${repeat}次（已提升稳定性）` : `同配方尝试：${repeat}次`
      ]
    };
  }

  handlePointer (e) {
    const rect = this.canvas.getBoundingClientRect();
    const px = (e.clientX || (e.touches && e.touches[0].clientX) || 0) - rect.left;
    const py = (e.clientY || (e.touches && e.touches[0].clientY) || 0) - rect.top;
    const tapTarget = this.pickTapTarget(px, py);
    const oreTarget = this.pickOreTarget(px, py);
    const stairTarget = this.pickStairTarget(px, py);
    this.player.aimX = px;
    this.player.aimY = py;

    if (this.game.currentClass === 'miner') {
      if (stairTarget) {
        const ds = Math.hypot(this.player.x - stairTarget.x, this.player.y - (stairTarget.y + 8));
        if (ds <= 78) this.descendMiningFloor();
        else {
          this.player.targetX = this.clamp(stairTarget.x, this.game.world.minX, this.game.world.maxX);
          this.player.targetY = this.clamp(stairTarget.y + 20, this.game.world.minY, this.game.world.maxY);
        }
        return;
      }
      if (oreTarget) {
        this.game.mining.activeOreId = oreTarget.id;
        this.player.targetX = this.clamp(oreTarget.x, this.game.world.minX, this.game.world.maxX);
        this.player.targetY = this.clamp(oreTarget.y + 20, this.game.world.minY, this.game.world.maxY);
        return;
      }
    }

    if (this.game.learning.enabled) {
      if (tapTarget) {
        const targetVal = this.game.learning.targetAnswer;
        const thisVal = Number(tapTarget.math.value);
        if (thisVal === targetVal) {
          this.game.learning.activeEnemyId = tapTarget.id;
          this.createFloatingText(tapTarget.x, tapTarget.y - 74, '已锁定，输入答案攻击', '#74b9ff', 12);
          this.showWaveInfo(`战斗题：${tapTarget.math.question}`);
        } else {
          this.player.hp = Math.max(0, this.player.hp - 6);
          this.createFloatingText(tapTarget.x, tapTarget.y - 74, `非目标答案 -6HP`, '#ff7675', 12);
          this.showWaveInfo(`本关只可击杀答案 = ${targetVal} 的怪`);
          if (this.player.hp <= 0) this.gameOver();
        }
        this.updateUI();
        return;
      }
      return;
    }

    if (tapTarget) {
      if (this.player.attackCooldown <= 0) {
        this.performClassTapAttack(tapTarget);
      } else if (this.game.currentClass === 'warrior' || this.game.currentClass === 'assassin') {
        const side = tapTarget.x >= this.player.x ? 1 : -1;
        this.player.targetX = this.clamp(tapTarget.x - side * 34, this.game.world.minX, this.game.world.maxX);
        this.player.targetY = this.clamp(tapTarget.y + 14, this.game.world.minY, this.game.world.maxY);
      } else {
        // 远程职业也允许点击目标时进行走位，而不是被锁在原地。
        this.player.targetX = this.clamp(tapTarget.x - 36, this.game.world.minX, this.game.world.maxX);
        this.player.targetY = this.clamp(tapTarget.y + 18, this.game.world.minY, this.game.world.maxY);
      }
      return;
    }

    // 点击空地：移动到目标位置，扩大有效操作区域。
    this.player.targetX = this.clamp(px, this.game.world.minX, this.game.world.maxX);
    this.player.targetY = this.clamp(py, this.game.world.minY, this.game.world.maxY);
    this.player.facing = this.player.targetX >= this.player.x ? 1 : -1;
  }

  gameOver () {
    saveProgress(this.game);
    alert(`基地被攻破！\n存活波次: ${this.game.wave}\n地牢层数: ${this.game.layer}\n总击杀: ${this.game.kills}\n获得钻石: ${this.game.gems}`);
    location.reload();
  }

  loop (ts) {
    if (!this.game.paused) {
      this.updateWaveSpawner(ts || performance.now());
      this.updatePlayer();
      this.updateMiningField(ts || performance.now());
      if (!this.isMiningMode()) {
        this.updateEnemies();
        this.updateProjectiles();
        this.updateRainZones();
      } else {
        this.game.enemies.length = 0;
        this.game.projectiles.length = 0;
        this.game.rainZones.length = 0;
        if (this.game.mining.autoSmelt) {
          this.game.mining.autoSmeltTimer++;
          if (this.game.mining.autoSmeltTimer >= 45) {
            this.game.mining.autoSmeltTimer = 0;
            this.smeltOre(false, { silent: true });
          }
        }
      }
      this.updateDrops();
      this.updateParticles();
      this.updateDebris();
    }
    this.draw();
    this.updateUI();
    requestAnimationFrame(this.loop);
  }

  start () {
    this.updateSlotBorders();
    this.game.mining.quest = this.buildMiningQuest();
    if (this.isMiningMode()) {
      this.setupMiningFloor();
    }
    this.updateUI();
    if (!this.isMiningMode() && typeof this.onPreparation === 'function') {
      this.onPreparation({ nextWave: 1 });
    }
    this.loop(performance.now());
  }
}
