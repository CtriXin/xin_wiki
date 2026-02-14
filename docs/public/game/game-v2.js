/**
 * 数学飞机大战 V2.5 - 全面优化版
 * 优化: 难度曲线、生命系统、UI交互、游戏体验
 */

// ==================== 游戏配置 ====================
const CONFIG = {
  width: window.innerWidth,
  height: window.innerHeight,
  planeY: window.innerHeight - 180,
  bulletSpeed: 10,
  gravity: 0.03, // 降低重力，方块下落更慢
  colors: {
    plane: '#ff4444',
    planeWindow: '#ffd700',
    bullet: '#ffd700',
    blockRed: '#ff6b6b',
    blockBlue: '#4ecdc4',
    blockGold: '#ffe66d'
  }
};

// ==================== 游戏状态 ====================
const GameState = {
  level: 1,
  attempts: 0,
  lives: 5, // 增加初始生命
  maxLives: 5,
  combo: 0,
  coins: 0,
  maxCombo: 0,
  totalKills: 0,
  currentAnswer: '',
  correctAnswer: 0,
  isGameOver: false,
  isPaused: true,
  isShopOpen: false,
  isInputFocused: false, // 新增：输入焦点状态
  planeX: CONFIG.width / 2,
  planeType: 'balanced',
  bullets: [],
  blocks: [],
  particles: [],
  damageNumbers: [],
  floatingTexts: [], // 新增：飘字效果
  upgradeLevel: 0,
  fireInterval: null,
  autoAim: true, // 默认开启自动瞄准，降低难度
  submitTimer: null,
  soundEnabled: true,
  isFever: false,
  isPenetrate: false,
  shakeFrames: 0,
  // 技能状态
  skills: {
    freeze: { active: false, duration: 0 },
    shield: { active: false, hits: 0 },
    bomb: { count: 0 },
    slowMotion: { active: false, duration: 0 } // 新增：子弹时间
  },
  // Boss状态
  boss: null,
  isBossLevel: false,
  // 统计
  stats: {
    startTime: null,
    correctAnswers: 0,
    wrongAnswers: 0,
    bossKilled: 0,
    blocksLost: 0 // 新增：漏掉的方块数
  },
  // 难度控制
  difficulty: {
    blockFallSpeed: 1, // 基础下落速度倍率
    spawnRate: 1,
    blockHP: 1
  }
};

// ==================== 成就系统 ====================
const Achievements = {
  firstBlood: { id: 'firstBlood', name: '初战告捷', desc: '消灭第一个方块', icon: '🎯', unlocked: false },
  combo5: { id: 'combo5', name: '连击大师', desc: '达成5连击', icon: '🔥', unlocked: false },
  combo10: { id: 'combo10', name: '狂暴模式', desc: '达成10连击', icon: '💀', unlocked: false },
  rich: { id: 'rich', name: '小富翁', desc: '累积100金币', icon: '💰', unlocked: false },
  bossSlayer: { id: 'bossSlayer', name: 'Boss杀手', desc: '击败第一个Boss', icon: '👑', unlocked: false },
  survivor: { id: 'survivor', name: '生存专家', desc: '通过第10关', icon: '⭐', unlocked: false },
  mathWizard: { id: 'mathWizard', name: '数学巫师', desc: '答对50题', icon: '🧙', unlocked: false },
  perfect: { id: 'perfect', name: '完美通关', desc: '不损失生命通过第5关', icon: '💎', unlocked: false }
};

// ==================== 商店商品 ====================
const ShopItems = [
  { id: 'freeze', name: '时间冻结', desc: '暂停所有方块3秒', icon: '❄️', price: 30, type: 'instant' },
  { id: 'bomb', name: '全屏炸弹', desc: '消灭所有方块', icon: '💣', price: 50, type: 'item' },
  { id: 'shield', name: '能量护盾', desc: '抵挡2次伤害', icon: '🛡️', price: 40, type: 'buff' },
  { id: 'heal', name: '生命恢复', desc: '恢复2点生命', icon: '❤️', price: 50, type: 'instant' },
  { id: 'slow', name: '子弹时间', desc: '5秒内时间变慢', icon: '⏱️', price: 35, type: 'instant' },
  { id: 'penetrate', name: '穿透弹夹', desc: '下轮子弹全穿透', icon: '🔫', price: 25, type: 'buff' }
];

// ==================== Matter.js 初始化 ====================
const Engine = Matter.Engine,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Events = Matter.Events,
  Body = Matter.Body;

const engine = Engine.create();
engine.gravity.y = CONFIG.gravity; // 使用降低的重力

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.width;
canvas.height = CONFIG.height;

// ==================== 音频系统 ====================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (!GameState.soundEnabled) return;
  
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    switch(type) {
      case 'shoot':
        osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
        break;
      case 'hit':
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
        break;
      case 'correct':
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.connect(g);
          g.connect(audioCtx.destination);
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.08, audioCtx.currentTime + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.08 + 0.15);
          o.start(audioCtx.currentTime + i * 0.08);
          o.stop(audioCtx.currentTime + i * 0.08 + 0.15);
        });
        break;
      case 'wrong':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
        break;
      case 'nuke':
        [329.63, 493.88, 659.25, 880].forEach((freq, i) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.connect(g);
          g.connect(audioCtx.destination);
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.12, audioCtx.currentTime + i * 0.06);
          g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.06 + 0.3);
          o.start(audioCtx.currentTime + i * 0.06);
          o.stop(audioCtx.currentTime + i * 0.06 + 0.3);
        });
        break;
      case 'coin':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
        break;
      case 'lifeLost':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
        break;
      case 'bossWarning':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(250, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
        break;
    }
  } catch(e) {
    console.log('Audio error:', e);
  }
}

// ==================== 成就系统 ====================
function unlockAchievement(achievementId) {
  const ach = Achievements[achievementId];
  if (ach && !ach.unlocked) {
    ach.unlocked = true;
    showAchievementPopup(ach);
    saveAchievements();
  }
}

function showAchievementPopup(achievement) {
  const popup = document.getElementById('achievement-popup');
  if (!popup) return;
  popup.querySelector('.achievement-icon').textContent = achievement.icon;
  popup.querySelector('.achievement-name').textContent = achievement.name;
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 3000);
}

function saveAchievements() {
  const unlocked = Object.values(Achievements)
    .filter(a => a.unlocked)
    .map(a => a.id);
  localStorage.setItem('math-plane-achievements', JSON.stringify(unlocked));
}

function loadAchievements() {
  const saved = localStorage.getItem('math-plane-achievements');
  if (saved) {
    const unlocked = JSON.parse(saved);
    unlocked.forEach(id => {
      if (Achievements[id]) Achievements[id].unlocked = true;
    });
  }
}

// ==================== 商店系统 ====================
function toggleShop() {
  if (GameState.isGameOver) return;
  
  GameState.isShopOpen = !GameState.isShopOpen;
  GameState.isPaused = GameState.isShopOpen;
  
  const panel = document.getElementById('shop-panel');
  if (GameState.isShopOpen) {
    renderShop();
    panel.classList.add('show');
  } else {
    panel.classList.remove('show');
  }
}

function renderShop() {
  const coinsEl = document.querySelector('.shop-coins');
  if (coinsEl) coinsEl.innerHTML = `<span class="coin-icon">🪙</span> ${GameState.coins}`;
  
  const list = document.getElementById('shop-list');
  if (!list) return;
  
  list.innerHTML = '';
  
  ShopItems.forEach(item => {
    const canAfford = GameState.coins >= item.price;
    const div = document.createElement('div');
    div.className = `shop-item ${canAfford ? '' : 'disabled'}`;
    div.innerHTML = `
      <span class="shop-item-icon">${item.icon}</span>
      <div class="shop-item-info">
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-desc">${item.desc}</div>
      </div>
      <span class="shop-item-price">🪙 ${item.price}</span>
    `;
    if (canAfford) {
      div.onclick = () => buyItem(item);
    }
    list.appendChild(div);
  });
}

function buyItem(item) {
  if (GameState.coins < item.price) return;
  
  GameState.coins -= item.price;
  updateHUD();
  
  switch(item.id) {
    case 'freeze':
      activateFreeze();
      break;
    case 'bomb':
      GameState.skills.bomb.count++;
      showFloatingText(CONFIG.width/2, CONFIG.height/2, '+1 💣', '#ff6b6b');
      break;
    case 'shield':
      activateShield();
      break;
    case 'heal':
      if (GameState.lives < GameState.maxLives) {
        GameState.lives = Math.min(GameState.lives + 2, GameState.maxLives);
        updateHUD();
        showFloatingText(CONFIG.width/2, 100, '+❤️❤️', '#ff4444');
      } else {
        GameState.coins += item.price;
        showFloatingText(CONFIG.width/2, CONFIG.height/2, '生命已满!', '#888');
      }
      break;
    case 'slow':
      activateSlowMotion();
      break;
    case 'penetrate':
      GameState.isPenetrate = true;
      setTimeout(() => GameState.isPenetrate = false, 10000);
      break;
  }
  
  renderShop();
  playSound('correct');
}

function activateFreeze() {
  GameState.skills.freeze.active = true;
  GameState.skills.freeze.duration = 180;
  document.querySelector('.freeze-overlay')?.classList.add('show');
  
  GameState.blocks.forEach(block => {
    block.velocityBeforeFreeze = { ...block.velocity };
    Body.setVelocity(block, { x: 0, y: 0 });
    Body.setAngularVelocity(block, 0);
  });
  
  setTimeout(() => {
    GameState.skills.freeze.active = false;
    document.querySelector('.freeze-overlay')?.classList.remove('show');
    GameState.blocks.forEach(block => {
      if (block.velocityBeforeFreeze) {
        Body.setVelocity(block, block.velocityBeforeFreeze);
      }
    });
  }, 3000);
}

function activateShield() {
  GameState.skills.shield.active = true;
  GameState.skills.shield.hits = 2;
  document.querySelector('.shield-overlay')?.classList.add('show');
}

function activateSlowMotion() {
  GameState.skills.slowMotion.active = true;
  GameState.skills.slowMotion.duration = 300; // 5 seconds
  engine.timing.timeScale = 0.3; // 时间变慢到30%
  
  // 视觉提示
  document.body.style.filter = 'hue-rotate(180deg)';
  
  setTimeout(() => {
    GameState.skills.slowMotion.active = false;
    engine.timing.timeScale = 1;
    document.body.style.filter = '';
  }, 5000);
}

function useBomb() {
  if (GameState.skills.bomb.count <= 0) return;
  GameState.skills.bomb.count--;
  
  GameState.blocks.forEach(block => {
    createParticles(block.position.x, block.position.y, '#ff6b6b', 15);
    awardCoins(block, true);
    Composite.remove(engine.world, block);
  });
  GameState.blocks = [];
  
  triggerNukeEffect();
  playSound('nuke');
}

// ==================== 飘字效果 ====================
function showFloatingText(x, y, text, color) {
  GameState.floatingTexts.push({
    x, y, text, color,
    life: 60,
    vy: -2
  });
}

// ==================== Boss系统 ====================
class Boss {
  constructor(level) {
    this.level = level;
    this.maxHp = level * 8;
    this.hp = this.maxHp;
    this.x = CONFIG.width / 2;
    this.y = 100;
    this.width = 100;
    this.height = 70;
    this.phase = 0;
    this.attackTimer = 0;
    this.flash = 0;
    
    this.body = Bodies.rectangle(this.x, this.y, this.width, this.height, {
      isStatic: true,
      label: 'boss',
      isSensor: true,
      render: { fillStyle: '#ff0000' }
    });
    
    Composite.add(engine.world, this.body);
  }
  
  update() {
    this.phase += 0.015;
    this.x = CONFIG.width / 2 + Math.sin(this.phase) * 120;
    Body.setPosition(this.body, { x: this.x, y: this.y });
    
    this.attackTimer++;
    if (this.attackTimer >= 360) {
      this.attack();
      this.attackTimer = 0;
    }
  }
  
  attack() {
    const a = Math.floor(Math.random() * 15) + 5;
    const b = Math.floor(Math.random() * 15) + 5;
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let answer;
    switch(op) {
      case '+': answer = a + b; break;
      case '-': answer = a - b; break;
      case '×': answer = a * b; break;
    }
    
    const egg = document.getElementById('easter-egg');
    if (egg) {
      egg.innerHTML = `<div style="font-size:18px">Boss攻击!</div><div style="font-size:26px;color:#ff00ff">${a} ${op} ${b} = ?</div><div style="font-size:12px">快算出答案!</div>`;
      egg.style.color = '#ff00ff';
      egg.classList.add('show');
      setTimeout(() => {
        egg.classList.remove('show');
        egg.style.color = '#ffd700';
      }, 4000);
    }
  }
  
  takeDamage(damage = 1) {
    this.hp -= damage;
    createDamageNumber(this.x, this.y - 40, damage);
    this.flash = 10;
    
    if (this.hp <= 0) {
      this.die();
    }
    updateBossHUD();
  }
  
  die() {
    createParticles(this.x, this.y, '#ffd700', 60);
    
    GameState.coins += 50 + this.level * 10;
    GameState.stats.bossKilled++;
    unlockAchievement('bossSlayer');
    
    Composite.remove(engine.world, this.body);
    GameState.boss = null;
    GameState.isBossLevel = false;
    
    document.getElementById('boss-hud')?.classList.remove('show');
    
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        showFloatingText(
          CONFIG.width / 2 + (Math.random() - 0.5) * 200,
          CONFIG.height / 2 + (Math.random() - 0.5) * 100,
          '+🪙', '#ffd700'
        );
      }, i * 80);
    }
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    if (this.flash > 0) {
      ctx.globalAlpha = 0.4;
      this.flash--;
    }
    
    // Boss body
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    
    // Eyes
    const eyeOffset = Math.sin(this.phase * 2) * 4;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(-25 + eyeOffset, -5, 12, 0, Math.PI * 2);
    ctx.arc(25 + eyeOffset, -5, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-25 + eyeOffset, -5, 4, 0, Math.PI * 2);
    ctx.arc(25 + eyeOffset, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Horns
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(-40, -35);
    ctx.lineTo(-50, -70);
    ctx.lineTo(-25, -35);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(40, -35);
    ctx.lineTo(50, -70);
    ctx.lineTo(25, -35);
    ctx.fill();
    
    // HP bar
    const hpPercent = this.hp / this.maxHp;
    ctx.fillStyle = '#000';
    ctx.fillRect(-50, -60, 100, 8);
    ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(-48, -58, 96 * hpPercent, 4);
    
    ctx.restore();
  }
}

function updateBossHUD() {
  if (!GameState.boss) return;
  
  const hpPercent = (GameState.boss.hp / GameState.boss.maxHp) * 100;
  const fill = document.querySelector('.boss-hp-fill');
  const name = document.querySelector('.boss-name');
  if (fill) fill.style.width = hpPercent + '%';
  if (name) name.textContent = `年兽 Boss Lv.${GameState.level}`;
  
  const hud = document.getElementById('boss-hud');
  if (hud) hud.classList.add('show');
}

// ==================== 题目生成 - 优化难度曲线 ====================
function generateQuestion() {
  const level = GameState.level;
  let a, b, op, answer;
  
  if (GameState.isBossLevel) {
    const el = document.getElementById('question');
    const display = document.getElementById('answer-display');
    if (el) el.textContent = '击败 Boss!';
    if (display) display.textContent = '💥';
    GameState.currentAnswer = '';
    return;
  }

  // 优化难度曲线，前期更简单
  if (level <= 3) {
    // 1-3关：简单加减，10以内
    op = Math.random() > 0.4 ? '+' : '-';
    if (op === '+') {
      a = Math.floor(Math.random() * 8) + 1;
      b = Math.floor(Math.random() * 8) + 1;
      answer = a + b;
    } else {
      a = Math.floor(Math.random() * 10) + 3;
      b = Math.floor(Math.random() * (a - 1)) + 1;
      answer = a - b;
    }
  } else if (level <= 6) {
    // 4-6关：加减混合，20以内
    op = Math.random() > 0.4 ? '+' : '-';
    if (op === '+') {
      a = Math.floor(Math.random() * 15) + 3;
      b = Math.floor(Math.random() * 12) + 2;
      answer = a + b;
    } else {
      a = Math.floor(Math.random() * 18) + 5;
      b = Math.floor(Math.random() * (a - 2)) + 1;
      answer = a - b;
    }
  } else if (level <= 10) {
    // 7-10关：引入乘法，加减加大
    const type = Math.random();
    if (type < 0.4) {
      op = '+';
      a = Math.floor(Math.random() * 30) + 10;
      b = Math.floor(Math.random() * 30) + 5;
      answer = a + b;
    } else if (type < 0.7) {
      op = '-';
      a = Math.floor(Math.random() * 40) + 20;
      b = Math.floor(Math.random() * (a - 5)) + 3;
      answer = a - b;
    } else {
      op = '×';
      a = Math.floor(Math.random() * 7) + 2;
      b = Math.floor(Math.random() * 7) + 2;
      answer = a * b;
    }
  } else if (level <= 15) {
    // 11-15关：全面运算
    const type = Math.random();
    if (type < 0.3) {
      op = '+';
      a = Math.floor(Math.random() * 50) + 20;
      b = Math.floor(Math.random() * 40) + 10;
      answer = a + b;
    } else if (type < 0.55) {
      op = '-';
      a = Math.floor(Math.random() * 60) + 30;
      b = Math.floor(Math.random() * (a - 10)) + 5;
      answer = a - b;
    } else if (type < 0.8) {
      op = '×';
      a = Math.floor(Math.random() * 9) + 2;
      b = Math.floor(Math.random() * 9) + 2;
      answer = a * b;
    } else {
      op = '÷';
      b = Math.floor(Math.random() * 7) + 2;
      answer = Math.floor(Math.random() * 8) + 2;
      a = b * answer;
    }
  } else {
    // 16+关：高难度
    const type = Math.random();
    if (type < 0.25) {
      op = '+';
      a = Math.floor(Math.random() * 80) + 20;
      b = Math.floor(Math.random() * 60) + 20;
      answer = a + b;
    } else if (type < 0.5) {
      op = '-';
      a = Math.floor(Math.random() * 90) + 30;
      b = Math.floor(Math.random() * (a - 15)) + 10;
      answer = a - b;
    } else if (type < 0.75) {
      op = '×';
      a = Math.floor(Math.random() * 11) + 2;
      b = Math.floor(Math.random() * 11) + 2;
      answer = a * b;
    } else {
      op = '÷';
      b = Math.floor(Math.random() * 8) + 2;
      answer = Math.floor(Math.random() * 10) + 2;
      a = b * answer;
    }
  }

  GameState.correctAnswer = answer;
  const questionEl = document.getElementById('question');
  const displayEl = document.getElementById('answer-display');
  if (questionEl) questionEl.textContent = `${a} ${op} ${b} = ?`;
  if (displayEl) displayEl.textContent = '';
  GameState.currentAnswer = '';
}

// ==================== 方块系统 - 优化难度 ====================
function createBlocks() {
  Composite.clear(engine.world);
  GameState.blocks = [];
  GameState.bullets = [];
  
  if (GameState.level % 5 === 0) {
    GameState.isBossLevel = true;
    GameState.boss = new Boss(GameState.level);
    
    const hud = document.getElementById('boss-hud');
    if (hud) hud.classList.add('show');
    updateBossHUD();
    
    const warning = document.getElementById('boss-warning');
    if (warning) {
      warning.classList.add('show');
      playSound('bossWarning');
      setTimeout(() => warning.classList.remove('show'), 2000);
    }
    
    generateQuestion();
    return;
  }
  
  GameState.isBossLevel = false;
  document.getElementById('boss-hud')?.classList.remove('show');

  const level = GameState.level;
  // 减少方块数量，降低难度
  const count = Math.min(2 + Math.floor(level * 1.5), 15);

  if (level <= 4) {
    // 1-4关：静态方块，简单
    const size = 42;
    const cols = 4;
    const rows = Math.ceil(count / cols);
    const gridWidth = cols * size;
    const startX = (CONFIG.width - gridWidth) / 2 + size / 2;
    const startY = 60;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      createSingleBlock(startX + col * size, startY + row * size, true, size, 1);
    }
  } else if (level <= 8) {
    // 5-8关：轻微移动，HP增加
    const size = 40;
    const spacing = 48;
    const cols = 4;
    const rows = Math.ceil(count / cols);
    const gridWidth = cols * spacing;
    const startX = (CONFIG.width - gridWidth) / 2 + spacing / 2;
    const startY = 50;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const hp = Math.random() > 0.7 ? 2 : 1;
      const block = createSingleBlock(startX + col * spacing, startY + row * spacing, false, size, hp);
      if (level >= 7) {
        block.movePattern = 'horizontal';
        block.movePhase = i * 0.3;
        block.originalX = startX + col * spacing;
      }
    }
  } else if (level <= 12) {
    // 9-12关：更多移动
    const size = 38;
    const spacing = 45;
    const cols = 5;
    const rows = Math.ceil(count / cols);
    const gridWidth = cols * spacing;
    const startX = (CONFIG.width - gridWidth) / 2 + spacing / 2;
    const startY = 45;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const hp = Math.random() > 0.6 ? 2 : 1;
      const block = createSingleBlock(startX + col * spacing, startY + row * spacing, false, size, hp);
      block.movePattern = 'sine';
      block.movePhase = i * 0.4;
      block.originalX = startX + col * spacing;
      block.originalY = startY + row * spacing;
    }
  } else {
    // 13+关：混乱模式
    for (let i = 0; i < count; i++) {
      const x = 60 + Math.random() * (CONFIG.width - 120);
      const y = 40 + Math.random() * (CONFIG.height / 4);
      const hp = Math.random() > 0.5 ? 2 : 1;
      const block = createSingleBlock(x, y, false, 36, hp);
      
      const patterns = ['sine', 'circle'];
      block.movePattern = patterns[Math.floor(Math.random() * patterns.length)];
      block.movePhase = Math.random() * Math.PI * 2;
      block.originalX = x;
      block.originalY = y;
    }
  }
  
  generateQuestion();
}

function createSingleBlock(x, y, isStatic, size, hp = 1) {
  const isGold = Math.random() < 0.08;
  const finalHp = isGold ? 3 : hp;
  
  const block = Bodies.rectangle(x, y, size, size, {
    isStatic: isStatic,
    restitution: 0.2,
    friction: 0.1,
    frictionAir: isStatic ? 1 : 0.02, // 非静态方块空气阻力
    label: 'block',
    hp: finalHp,
    maxHp: finalHp,
    isGold: isGold,
    render: {
      fillStyle: isGold ? '#ffd700' : (Math.random() > 0.5 ? '#ff6b6b' : '#4ecdc4')
    }
  });

  GameState.blocks.push(block);
  Composite.add(engine.world, block);
  return block;
}

function updateBlocks() {
  // 子弹时间效果
  if (GameState.skills.slowMotion.active) {
    GameState.skills.slowMotion.duration--;
    if (GameState.skills.slowMotion.duration <= 0) {
      GameState.skills.slowMotion.active = false;
      engine.timing.timeScale = 1;
      document.body.style.filter = '';
    }
  }
  
  if (GameState.skills.freeze.active) return;
  
  const time = Date.now() / 1000;
  
  GameState.blocks.forEach(block => {
    if (!block.movePattern) return;
    
    // 根据关卡调整移动幅度
    const moveScale = Math.min(1 + GameState.level * 0.05, 2);
    
    switch(block.movePattern) {
      case 'horizontal':
        Body.setPosition(block, {
          x: block.originalX + Math.sin(time * 0.8 + block.movePhase) * 20 * moveScale,
          y: block.position.y
        });
        break;
      case 'sine':
        Body.setPosition(block, {
          x: block.originalX + Math.sin(time * 1.5 + block.movePhase) * 25 * moveScale,
          y: block.position.y + 0.3
        });
        break;
      case 'circle':
        const radius = 20 * moveScale;
        Body.setPosition(block, {
          x: block.originalX + Math.cos(time + block.movePhase) * radius,
          y: block.originalY + Math.sin(time + block.movePhase) * radius
        });
        break;
    }
  });
  
  if (GameState.boss) {
    GameState.boss.update();
  }
}

// ==================== 狂暴模式 ====================
function updateFeverMode() {
  const wasFever = GameState.isFever;
  GameState.isFever = GameState.combo >= 3;
  GameState.isPenetrate = GameState.combo >= 5 || GameState.isPenetrate;
  
  if (GameState.isFever && !wasFever) {
    GameState.shakeFrames = 30;
    const indicator = document.getElementById('fever-indicator');
    if (indicator) {
      indicator.classList.add('show');
      setTimeout(() => indicator.classList.remove('show'), 1000);
    }
  }
  
  if (GameState.combo >= 5) unlockAchievement('combo5');
  if (GameState.combo >= 10) unlockAchievement('combo10');
  if (GameState.combo > GameState.maxCombo) {
    GameState.maxCombo = GameState.combo;
  }
}

function triggerNuke(count) {
  const flash = document.getElementById('nuke-flash');
  if (flash) flash.classList.add('show');
  playSound('nuke');
  
  const clearRadius = (count * 0.25) * Math.min(CONFIG.width, CONFIG.height) / 100;
  const centerX = CONFIG.width / 2;
  const centerY = CONFIG.height / 2;
  
  GameState.blocks.forEach(block => {
    const dx = block.position.x - centerX;
    const dy = block.position.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < clearRadius + 100) {
      createParticles(block.position.x, block.position.y, '#ffd700', 20);
      awardCoins(block, true);
      Composite.remove(engine.world, block);
    }
  });
  
  GameState.blocks = GameState.blocks.filter(block => {
    const dx = block.position.x - centerX;
    const dy = block.position.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist >= clearRadius + 100;
  });
  
  setTimeout(() => flash?.classList.remove('show'), 300);
}

function triggerNukeEffect() {
  const flash = document.getElementById('nuke-flash');
  if (flash) {
    flash.classList.add('show');
    setTimeout(() => flash.classList.remove('show'), 500);
  }
}

// ==================== 发射系统 ====================
function fireBullets(count) {
  updateFeverMode();
  
  if (count >= 20) {
    triggerNuke(count);
  }
  
  playSound('shoot');

  if (GameState.fireInterval) {
    clearInterval(GameState.fireInterval);
  }

  const upgrade = GameState.upgradeLevel;
  let bulletCount = count;
  
  const speed = GameState.isFever ? CONFIG.bulletSpeed * 1.5 : CONFIG.bulletSpeed;
  const interval = GameState.isFever ? 25 : 50;
  
  if (GameState.planeType === 'power') {
    bulletCount = Math.ceil(count * 1.5);
  }

  const firePattern = () => {
    const penetrate = GameState.isPenetrate;
    
    switch(upgrade) {
      case 1:
        createBullet(GameState.planeX - 10, CONFIG.planeY - 20, 0, -speed, penetrate);
        createBullet(GameState.planeX + 10, CONFIG.planeY - 20, 0, -speed, penetrate);
        break;
      case 2:
        createBullet(GameState.planeX - 15, CONFIG.planeY - 20, -0.5, -speed, penetrate);
        createBullet(GameState.planeX, CONFIG.planeY - 20, 0, -speed, penetrate);
        createBullet(GameState.planeX + 15, CONFIG.planeY - 20, 0.5, -speed, penetrate);
        break;
      case 3:
        createBullet(GameState.planeX - 20, CONFIG.planeY - 20, -1, -speed, penetrate);
        createBullet(GameState.planeX - 7, CONFIG.planeY - 20, -0.3, -speed, penetrate);
        createBullet(GameState.planeX + 7, CONFIG.planeY - 20, 0.3, -speed, penetrate);
        createBullet(GameState.planeX + 20, CONFIG.planeY - 20, 1, -speed, penetrate);
        break;
      default:
        createBullet(GameState.planeX, CONFIG.planeY - 20, 0, -speed, penetrate);
    }
  };

  firePattern();

  let fired = 0;
  GameState.fireInterval = setInterval(() => {
    if (fired >= bulletCount || GameState.isGameOver) {
      clearInterval(GameState.fireInterval);
      GameState.fireInterval = null;
      return;
    }
    firePattern();
    fired++;
  }, interval);
}

function createBullet(x, y, vx, vy, isPenetrate = false) {
  const bulletColor = GameState.isFever ? '#ff6600' : CONFIG.colors.bullet;
  const size = GameState.planeType === 'power' ? 8 : 5;
  
  const bullet = Bodies.circle(x, y, size, {
    isStatic: false,
    frictionAir: 0,
    restitution: 0,
    label: 'bullet',
    isPenetrate: isPenetrate,
    penetrateCount: isPenetrate ? 2 : 0,
    render: { fillStyle: bulletColor },
    damage: GameState.planeType === 'power' ? 2 : 1
  });
  
  bullet.collisionFilter = {
    group: -1,
    category: 0x0002,
    mask: 0x0001
  };

  Body.setVelocity(bullet, { x: vx, y: vy });
  GameState.bullets.push(bullet);
  Composite.add(engine.world, bullet);
}

// ==================== 粒子与特效 ====================
function createParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
    const speed = 3 + Math.random() * 4;
    GameState.particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 40,
      color: color,
      size: 4 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2
    });
  }
}

function createDamageNumber(x, y, damage) {
  GameState.damageNumbers.push({
    x: x,
    y: y,
    text: damage,
    life: 60,
    vy: -1
  });
}

function awardCoins(block, fromBomb = false) {
  const coins = block.isGold ? 5 : 1;
  GameState.coins += coins;
  GameState.totalKills++;
  
  if (GameState.totalKills === 1) unlockAchievement('firstBlood');
  if (GameState.coins >= 100) unlockAchievement('rich');
  
  if (!fromBomb) {
    showFloatingText(block.position.x, block.position.y - 20, `+${coins}🪙`, '#ffd700');
    playSound('coin');
  }
}

// ==================== 碰撞检测 ====================
Events.on(engine, 'collisionStart', (event) => {
  event.pairs.forEach(pair => {
    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;

    const isAttackA = (bodyA.label === 'bullet');
    const isAttackB = (bodyB.label === 'bullet');
    const isBlockA = (bodyA.label === 'block');
    const isBlockB = (bodyB.label === 'block');
    const isBossA = (bodyA.label === 'boss');
    const isBossB = (bodyB.label === 'boss');

    if ((isAttackA && isBlockB) || (isAttackB && isBlockA)) {
      const bullet = isAttackA ? bodyA : bodyB;
      const block = isBlockA ? bodyA : bodyB;

      if (bullet.isPenetrate && bullet.penetrateCount > 0) {
        bullet.penetrateCount--;
      } else {
        Composite.remove(engine.world, bullet);
        GameState.bullets = GameState.bullets.filter(b => b !== bullet);
      }

      const damage = bullet.damage || 1;
      block.hp -= damage;
      createParticles(block.position.x, block.position.y, block.render.fillStyle, 5);

      if (block.hp <= 0) {
        awardCoins(block);
        createParticles(block.position.x, block.position.y, '#ffd700', 15);
        Composite.remove(engine.world, block);
        GameState.blocks = GameState.blocks.filter(b => b !== block);
      } else {
        playSound('hit');
      }
    }
    
    if ((isAttackA && isBossB) || (isAttackB && isBossA)) {
      const bullet = isAttackA ? bodyA : bodyB;
      Composite.remove(engine.world, bullet);
      GameState.bullets = GameState.bullets.filter(b => b !== bullet);
      
      if (GameState.boss) {
        GameState.boss.takeDamage(bullet.damage || 1);
      }
    }
  });
});

// ==================== 输入处理 - 优化UI交互 ====================
document.querySelectorAll('.key').forEach(key => {
  key.addEventListener('click', (e) => {
    if (GameState.isGameOver || GameState.isShopOpen) return;

    const num = e.target.dataset.num;
    const action = e.target.dataset.action;

    if (num !== undefined) {
      if (GameState.currentAnswer.length < 2) {
        GameState.currentAnswer += num;
        const display = document.getElementById('answer-display');
        if (display) display.textContent = GameState.currentAnswer;

        // 输入时隐藏题目，减少视觉干扰
        const questionEl = document.getElementById('question');
        if (questionEl) questionEl.style.opacity = '0.3';

        clearTimeout(GameState.submitTimer);
        
        if (GameState.currentAnswer.length >= 2) {
          // 输入完2位后立即提交
          GameState.submitTimer = setTimeout(() => {
            if (GameState.currentAnswer.length > 0) {
              checkAnswer();
              // 恢复题目显示
              if (questionEl) questionEl.style.opacity = '1';
            }
          }, 300);
        } else {
          // 只输入1位，等待更长时间
          GameState.submitTimer = setTimeout(() => {
            if (GameState.currentAnswer.length > 0) {
              checkAnswer();
              if (questionEl) questionEl.style.opacity = '1';
            }
          }, 1500);
        }
      }
    } else if (action === 'clear') {
      GameState.currentAnswer = '';
      const display = document.getElementById('answer-display');
      if (display) display.textContent = '';
      clearTimeout(GameState.submitTimer);
      
      // 恢复题目显示
      const questionEl = document.getElementById('question');
      if (questionEl) questionEl.style.opacity = '1';
    }
  });
});

function checkAnswer() {
  const userAnswer = parseInt(GameState.currentAnswer);
  if (isNaN(userAnswer)) return;

  GameState.attempts++;
  GameState.stats.correctAnswers++;
  updateHUD();

  // 恢复题目显示
  const questionEl = document.getElementById('question');
  if (questionEl) questionEl.style.opacity = '1';

  if (userAnswer === GameState.correctAnswer) {
    playSound('correct');
    updateCombo(true);
    fireBullets(userAnswer);
    
    setTimeout(() => {
      if (!GameState.isGameOver) generateQuestion();
    }, 300);
  } else {
    playSound('wrong');
    GameState.stats.wrongAnswers++;
    updateCombo(false);
    
    const display = document.getElementById('answer-display');
    if (display) {
      display.style.color = '#ff4444';
      setTimeout(() => {
        display.style.color = '#ffd700';
        GameState.currentAnswer = '';
        display.textContent = '';
      }, 400);
    }
  }
  
  if (GameState.stats.correctAnswers >= 50) unlockAchievement('mathWizard');
}

function updateCombo(isCorrect) {
  const comboEl = document.getElementById('combo');
  
  if (isCorrect) {
    GameState.combo++;
    
    let newUpgrade = 0;
    let text = '';
    if (GameState.combo >= 10) {
      newUpgrade = 3;
      text = 'MAX!';
    } else if (GameState.combo >= 5) {
      newUpgrade = 2;
      text = '三连!';
    } else if (GameState.combo >= 3) {
      newUpgrade = 1;
      text = '双发!';
    }

    if (newUpgrade > GameState.upgradeLevel) {
      GameState.upgradeLevel = newUpgrade;
      const comboText = document.getElementById('combo-text');
      if (comboText) comboText.textContent = text;
    }

    const comboCount = document.getElementById('combo-count');
    if (comboCount) comboCount.textContent = GameState.combo;
    if (comboEl) comboEl.style.color = '#ff6b6b';
  } else {
    GameState.combo = 0;
    GameState.upgradeLevel = 0;
    const comboText = document.getElementById('combo-text');
    const comboCount = document.getElementById('combo-count');
    if (comboText) comboText.textContent = '';
    if (comboCount) comboCount.textContent = '0';
    if (comboEl) comboEl.style.color = '#666';
  }
}

// ==================== HUD更新 ====================
function updateHUD() {
  const levelEl = document.getElementById('level');
  const livesEl = document.getElementById('lives');
  const coinsEl = document.getElementById('coins');
  
  if (levelEl) levelEl.textContent = GameState.level;
  if (livesEl) livesEl.textContent = '❤️'.repeat(GameState.lives) || '💔';
  if (coinsEl) coinsEl.textContent = GameState.coins;
}

// ==================== 游戏状态检查 - 优化生命系统 ====================
function checkGameState() {
  // 检查方块掉落
  GameState.blocks.forEach(block => {
    if (block.position.y > CONFIG.height - 60) {
      // 有护盾时抵挡
      if (GameState.skills.shield.active && GameState.skills.shield.hits > 0) {
        GameState.skills.shield.hits--;
        createParticles(block.position.x, CONFIG.height - 60, '#00ff88', 10);
        showFloatingText(block.position.x, CONFIG.height - 100, '🛡️ 护盾!', '#00ff88');
        
        if (GameState.skills.shield.hits <= 0) {
          GameState.skills.shield.active = false;
          document.querySelector('.shield-overlay')?.classList.remove('show');
        }
        
        Composite.remove(engine.world, block);
        GameState.blocks = GameState.blocks.filter(b => b !== block);
        return;
      }
      
      // 扣除生命
      GameState.lives--;
      GameState.stats.blocksLost++;
      updateHUD();
      
      // 视觉效果
      createParticles(block.position.x, CONFIG.height - 60, '#ff4444', 15);
      showFloatingText(CONFIG.width/2, CONFIG.height/2, '❤️ -1', '#ff4444');
      playSound('lifeLost');
      
      // 屏幕震动
      GameState.shakeFrames = 20;
      
      Composite.remove(engine.world, block);
      GameState.blocks = GameState.blocks.filter(b => b !== block);
      
      // 生命为0时游戏结束
      if (GameState.lives <= 0) {
        gameOver(false);
      }
    }
  });

  // 过关检查
  if (!GameState.isBossLevel && GameState.blocks.length === 0 && !GameState.isGameOver) {
    levelComplete();
  } else if (GameState.isBossLevel && !GameState.boss && !GameState.isGameOver) {
    levelComplete();
  }

  // 清理子弹
  GameState.bullets = GameState.bullets.filter(bullet => {
    if (bullet.position.y < -50) {
      Composite.remove(engine.world, bullet);
      return false;
    }
    return true;
  });
  
  updateBlocks();
}

function levelComplete() {
  if (GameState.isPaused) return;
  
  // 检查完美通关
  if (GameState.level === 5 && GameState.stats.blocksLost === 0) {
    unlockAchievement('perfect');
  }
  
  GameState.isPaused = true;
  if (GameState.fireInterval) {
    clearInterval(GameState.fireInterval);
    GameState.fireInterval = null;
  }

  const egg = document.getElementById('easter-egg');
  if (egg) {
    egg.innerHTML = `<div>第 ${GameState.level} 关</div><div style="color:#00ff00;font-size:32px">通关!</div>`;
    egg.classList.add('show');
  }

  setTimeout(() => {
    GameState.level++;
    if (GameState.level > 10) unlockAchievement('survivor');
    
    GameState.attempts = 0;
    GameState.combo = 0;
    GameState.upgradeLevel = 0;
    const comboText = document.getElementById('combo-text');
    if (comboText) comboText.textContent = '';
    
    updateHUD();
    createBlocks();
    GameState.isPaused = false;

    setTimeout(() => egg?.classList.remove('show'), 1000);
  }, 1500);
}

function gameOver(isWin) {
  GameState.isGameOver = true;
  if (GameState.fireInterval) {
    clearInterval(GameState.fireInterval);
  }
  
  const overlay = document.getElementById('overlay');
  if (!overlay) return;
  
  const unlockedAchievements = Object.values(Achievements).filter(a => a.unlocked);
  
  overlay.innerHTML = `
    <h1>${isWin ? '🎉 胜利!' : '💥 游戏结束'}</h1>
    <div class="subtitle">到达关卡: ${GameState.level} | 最高连击: ${GameState.maxCombo}</div>
    <div class="features">
      <p>总击杀: <span>${GameState.totalKills}</span> | 金币: <span>${GameState.coins}</span></p>
      <p>正确率: <span>${Math.round((GameState.stats.correctAnswers / (GameState.stats.correctAnswers + GameState.stats.wrongAnswers) * 100) || 0)}%</span></p>
    </div>
    <div class="achievements-showcase">
      ${Object.values(Achievements).map(a => 
        `<span class="achievement-badge ${a.unlocked ? 'unlocked' : ''}" title="${a.name}: ${a.desc}">${a.icon}</span>`
      ).join('')}
    </div>
    <button class="btn" onclick="resetGame()">再玩一次</button>
  `;
  overlay.style.display = 'flex';
}

// ==================== 渲染系统 ====================
function render() {
  ctx.save();
  
  // 屏幕震动
  if (GameState.shakeFrames > 0) {
    const shakeX = (Math.random() - 0.5) * (GameState.shakeFrames > 10 ? 6 : 3);
    const shakeY = (Math.random() - 0.5) * (GameState.shakeFrames > 10 ? 6 : 3);
    ctx.translate(shakeX, shakeY);
    GameState.shakeFrames--;
  } else if (GameState.combo >= 3) {
    const shakeX = (Math.random() - 0.5) * 1.5;
    const shakeY = (Math.random() - 0.5) * 1.5;
    ctx.translate(shakeX, shakeY);
  }
  
  // 清空画布
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  
  // 网格背景
  ctx.strokeStyle = 'rgba(255,255,255,0.015)';
  ctx.lineWidth = 1;
  for (let i = 0; i < CONFIG.width; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, CONFIG.height);
    ctx.stroke();
  }

  // 绘制飞机
  drawPlane(GameState.planeX, CONFIG.planeY);
  
  // 绘制Boss
  if (GameState.boss) {
    GameState.boss.draw(ctx);
  }
  
  // 绘制方块
  GameState.blocks.forEach(block => drawBlock(block));
  
  // 绘制子弹
  GameState.bullets.forEach(bullet => {
    ctx.fillStyle = bullet.render.fillStyle;
    ctx.shadowBlur = bullet.isPenetrate ? 15 : 0;
    ctx.shadowColor = '#ffaa00';
    ctx.beginPath();
    ctx.arc(bullet.position.x, bullet.position.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = 'rgba(255,215,0,0.3)';
    ctx.fillRect(bullet.position.x - 2, bullet.position.y + 5, 4, 12);
  });
  
  // 绘制粒子
  GameState.particles = GameState.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.life--;
    p.rotation += p.rotSpeed;
    
    if (p.life > 0) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 40;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
      return true;
    }
    return false;
  });
  
  // 绘制伤害数字
  ctx.font = 'bold 16px Courier New';
  GameState.damageNumbers = GameState.damageNumbers.filter(d => {
    d.y += d.vy;
    d.life--;
    if (d.life > 0) {
      ctx.fillStyle = `rgba(255,68,68,${d.life/60})`;
      ctx.fillText(d.text, d.x, d.y);
      return true;
    }
    return false;
  });
  
  // 绘制飘字
  ctx.font = 'bold 18px Courier New';
  GameState.floatingTexts = GameState.floatingTexts.filter(t => {
    t.y += t.vy;
    t.life--;
    if (t.life > 0) {
      ctx.fillStyle = t.color;
      ctx.globalAlpha = t.life / 60;
      ctx.fillText(t.text, t.x, t.y);
      ctx.globalAlpha = 1;
      return true;
    }
    return false;
  });
  
  ctx.restore();
}

function drawPlane(x, y) {
  ctx.save();
  ctx.translate(x, y);
  
  const colors = {
    balanced: { body: '#ff4444', wing: '#cc3333' },
    speed: { body: '#4488ff', wing: '#3366cc' },
    power: { body: '#ff8800', wing: '#cc6600' }
  };
  const c = colors[GameState.planeType];
  
  ctx.fillStyle = c.wing;
  ctx.fillRect(-28, 0, 56, 18);
  
  ctx.fillStyle = c.body;
  ctx.fillRect(-12, -25, 24, 50);
  
  ctx.fillStyle = CONFIG.colors.planeWindow;
  ctx.fillRect(-8, -18, 16, 14);
  
  if (GameState.combo >= 3) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff6600';
  }
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(-8, 22, 16, 8);
  ctx.shadowBlur = 0;
  
  if (GameState.upgradeLevel >= 1) {
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-22, -30, 6, 12);
    ctx.fillRect(16, -30, 6, 12);
  }
  if (GameState.upgradeLevel >= 2) {
    ctx.fillRect(-6, -32, 4, 10);
    ctx.fillRect(2, -32, 4, 10);
  }
  
  ctx.restore();
}

function drawBlock(block) {
  const x = block.position.x;
  const y = block.position.y;
  const size = 36;
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(block.angle);
  
  if (block.isGold) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffd700';
  }
  
  ctx.fillStyle = block.render.fillStyle;
  ctx.fillRect(-size/2, -size/2, size, size);
  ctx.shadowBlur = 0;
  
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(-size/2, -size/2, size, size);

  if (block.hp < block.maxHp) {
    ctx.fillStyle = '#000';
    ctx.fillRect(-size/2, -size/2 - 10, size, 5);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(-size/2, -size/2 - 10, size * (block.hp / block.maxHp), 5);
  }

  if (block.isGold) {
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('★', 0, 5);
  }
  
  ctx.restore();
}

// ==================== 游戏循环 ====================
function gameLoop() {
  if (!GameState.isPaused && !GameState.isGameOver) {
    Engine.update(engine, 1000 / 60);
    checkGameState();
  }
  render();
  requestAnimationFrame(gameLoop);
}

// ==================== 控制 ====================
let moveLeft = false;
let moveRight = false;

// 触摸控制
document.getElementById('touch-left')?.addEventListener('touchstart', (e) => {
  e.preventDefault();
  moveLeft = true;
  document.querySelectorAll('.touch-hint').forEach(h => h.style.opacity = '0');
});
document.getElementById('touch-left')?.addEventListener('touchend', (e) => {
  e.preventDefault();
  moveLeft = false;
});
document.getElementById('touch-right')?.addEventListener('touchstart', (e) => {
  e.preventDefault();
  moveRight = true;
  document.querySelectorAll('.touch-hint').forEach(h => h.style.opacity = '0');
});
document.getElementById('touch-right')?.addEventListener('touchend', (e) => {
  e.preventDefault();
  moveRight = false;
});

// 鼠标控制（测试用）
document.getElementById('touch-left')?.addEventListener('mousedown', () => moveLeft = true);
document.getElementById('touch-left')?.addEventListener('mouseup', () => moveLeft = false);
document.getElementById('touch-right')?.addEventListener('mousedown', () => moveRight = true);
document.getElementById('touch-right')?.addEventListener('mouseup', () => moveRight = false);

// 自动/手动瞄准切换
function toggleAimMode() {
  GameState.autoAim = !GameState.autoAim;
  const modeText = GameState.autoAim ? '自动' : '手动';
  const modeEl = document.getElementById('aim-mode');
  if (modeEl) modeEl.textContent = modeText;
  
  const toggleBtn = document.getElementById('aim-toggle');
  if (toggleBtn) toggleBtn.style.background = GameState.autoAim ? 'rgba(0,255,0,0.4)' : 'rgba(255,215,0,0.3)';
}

// 音效开关
function toggleSound() {
  GameState.soundEnabled = !GameState.soundEnabled;
  const icon = document.getElementById('sound-icon');
  const text = document.getElementById('sound-text');
  const btn = document.getElementById('sound-toggle');
  
  if (GameState.soundEnabled) {
    if (icon) icon.textContent = '🔊';
    if (text) text.textContent = '开启';
    if (btn) btn.style.background = 'rgba(0,255,255,0.2)';
  } else {
    if (icon) icon.textContent = '🔇';
    if (text) text.textContent = '关闭';
    if (btn) btn.style.background = 'rgba(100,100,100,0.3)';
  }
}

// 飞机移动
setInterval(() => {
  if (GameState.isGameOver || GameState.isPaused) return;
  
  const speed = GameState.planeType === 'speed' ? 14 : GameState.planeType === 'power' ? 7 : 10;
  
  if (GameState.autoAim && GameState.blocks.length > 0) {
    let targetBlock = GameState.blocks.reduce((lowest, block) => 
      block.position.y > lowest.position.y ? block : lowest, GameState.blocks[0]);
    
    const diff = targetBlock.position.x - GameState.planeX;
    GameState.planeX += diff * 0.15;
  } else {
    if (moveLeft && GameState.planeX > 40) GameState.planeX -= speed;
    if (moveRight && GameState.planeX < CONFIG.width - 40) GameState.planeX += speed;
  }
  
  GameState.planeX = Math.max(40, Math.min(CONFIG.width - 40, GameState.planeX));
}, 16);

// 防止页面滚动
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// 窗口大小调整
window.addEventListener('resize', () => {
  CONFIG.width = window.innerWidth;
  CONFIG.height = window.innerHeight;
  CONFIG.planeY = window.innerHeight - 180;
  canvas.width = CONFIG.width;
  canvas.height = CONFIG.height;
});

// ==================== 游戏控制 ====================
function startGame() {
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.style.display = 'none';
  
  GameState.isPaused = false;
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  loadAchievements();
  resetGame();
  gameLoop();
}

function resetGame() {
  GameState.level = 1;
  GameState.attempts = 0;
  GameState.lives = 5;
  GameState.combo = 0;
  GameState.maxCombo = 0;
  GameState.coins = 0;
  GameState.upgradeLevel = 0;
  GameState.currentAnswer = '';
  GameState.isGameOver = false;
  GameState.isPaused = false;
  GameState.isShopOpen = false;
  GameState.planeX = CONFIG.width / 2;
  GameState.bullets = [];
  GameState.blocks = [];
  GameState.particles = [];
  GameState.damageNumbers = [];
  GameState.floatingTexts = [];
  GameState.boss = null;
  GameState.isBossLevel = false;
  GameState.stats = {
    startTime: Date.now(),
    correctAnswers: 0,
    wrongAnswers: 0,
    bossKilled: 0,
    blocksLost: 0
  };
  GameState.skills = { 
    freeze: { active: false }, 
    shield: { active: false, hits: 0 }, 
    bomb: { count: 0 },
    slowMotion: { active: false, duration: 0 }
  };
  
  document.getElementById('shop-panel')?.classList.remove('show');
  const comboText = document.getElementById('combo-text');
  if (comboText) comboText.textContent = '';
  document.getElementById('nuke-flash')?.classList.remove('show');
  document.querySelector('.freeze-overlay')?.classList.remove('show');
  document.querySelector('.shield-overlay')?.classList.remove('show');
  document.getElementById('boss-hud')?.classList.remove('show');
  
  // 恢复题目透明度
  const questionEl = document.getElementById('question');
  if (questionEl) questionEl.style.opacity = '1';
  
  Composite.clear(engine.world);
  createBlocks();
  updateHUD();
}

// 导出全局函数
window.startGame = startGame;
window.resetGame = resetGame;
window.toggleAimMode = toggleAimMode;
window.toggleSound = toggleSound;
window.toggleShop = toggleShop;
