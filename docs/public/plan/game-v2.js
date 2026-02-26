/**
 * 数学飞机大战 V2.5 - 全面优化版
 * 优化: 难度曲线、生命系统、UI交互、游戏体验
 */

// ==================== 游戏配置 ====================
const CONFIG = {
  width: window.innerWidth,
  height: window.innerHeight,
  planeY: window.innerHeight - 200, // 调整飞机位置，避开键盘
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

// ==================== 背景星空系统 (Starfield) ====================
const Starfield = {
  stars: [],
  speed: 1,
  
  init() {
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: Math.random() * CONFIG.width,
        y: Math.random() * CONFIG.height,
        size: Math.random() * 2,
        speed: 0.5 + Math.random() * 1.5,
        brightness: Math.random()
      });
    }
  },
  
  update() {
    const warpSpeed = GameState.isFever ? 5 : 1;
    this.stars.forEach(star => {
      star.y += star.speed * warpSpeed;
      if (star.y > CONFIG.height) {
        star.y = 0;
        star.x = Math.random() * CONFIG.width;
      }
    });
  },
  
  draw(ctx) {
    ctx.save();
    this.stars.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      if (GameState.isFever) {
        // 拉伸效果
        ctx.fillRect(star.x, star.y, star.size, star.size * 5);
      } else {
        ctx.fillRect(star.x, star.y, star.size, star.size);
      }
    });
    ctx.restore();
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
  ultCharge: 0, // 新增：终极技能充能 (0-100)
  ultReady: false,
  allowedShots: 0, // 新增：合成模式允许的射击次数
  remainingShots: 0, // 新增：剩余射击次数
  solutionSet: [], // 新增：保证合成成功的数字集
  currentAnswer: '',
  correctAnswer: 0,
  currentOp: '+', // 新增：当前题目运算符
  powerupActive: null, // 新增：当前激活的数学奖励
  isGameOver: false,
  isPaused: true,
  isShopOpen: false,
  isInputFocused: false, // 新增：输入焦点状态
  planeX: CONFIG.width / 2,
  targetPlaneX: CONFIG.width / 2, // 新增：拖动目标位置
  planeType: 'balanced',
  planeBody: null, // 新增：物理感应器
  bullets: [],
  blocks: [],
  initialBlockCount: 0, // 新增：用于计算进度
  particles: [],
  damageNumbers: [],
  floatingTexts: [], // 新增：飘字效果
  upgradeLevel: 0,
  fireInterval: null,
  autoAim: false, // 默认关闭自动瞄准，让玩家手动操作
  submitTimer: null,
  soundEnabled: true,
  isFever: false,
  isPenetrate: false,
  shakeFrames: 0,
  currentSum: 0, 
  modeRule: '', // 新增：模式规则描述
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
      wrongCount: 0, // 新增：连续错误计数，用于提示
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
      case 'powerup':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
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
  isDragging = false; // 关闭商店或打开时都停止拖动
  
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
  // Overlay controlled in render loop
  showFloatingText(GameState.planeX, CONFIG.planeY - 50, 'SHIELD UP!', '#00ff88');
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
    this.y = 150; // Boss位置下移
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
    
    // 发射物理弹幕
    const count = 5 + Math.floor(this.level / 2);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI / (count - 1)) * i;
      const vx = Math.cos(angle + Math.PI/4) * 3;
      const vy = Math.sin(angle + Math.PI/4) * 3;
      this.fireProjectile(this.x, this.y, vx, vy);
    }

    const egg = document.getElementById('easter-egg');
    if (egg) {
      egg.innerHTML = `<div style="font-size:18px">Boss大招!</div><div style="font-size:26px;color:#ff00ff">${a} ${op} ${b} = ?</div><div style="font-size:12px">答对可清除所有子弹!</div>`;
      egg.style.color = '#ff00ff';
      egg.classList.add('show');
      setTimeout(() => {
        egg.classList.remove('show');
        egg.style.color = '#ffd700';
      }, 4000);
    }
  }

  fireProjectile(x, y, vx, vy) {
    const projectile = Bodies.circle(x, y, 10, {
      isStatic: false,
      label: 'boss_bullet',
      render: { fillStyle: '#ff00ff' }
    });
    Body.setVelocity(projectile, { x: vx, y: vy });
    GameState.blocks.push(projectile); // 借用blocks数组来管理，或者新建一个
    Composite.add(engine.world, projectile);
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

// ==================== 题目生成 - 多模式支持 ====================
function generateQuestion() {
  const level = GameState.level;
  const mode = GameState.planeType;
  let a, b, op, answer;
  
  if (GameState.isBossLevel) {
    updateModeUI('BOSS战');
    document.getElementById('question').textContent = '摧毁核心!';
    document.getElementById('answer-display').textContent = '⚔️';
    return;
  }

  // 1. 均衡型 (Balanced): 经典算术狙击
  if (mode === 'balanced') {
    updateModeUI('狙击模式');
    ({ a, b, op, answer } = getMathProblem(level));
    GameState.correctAnswer = answer;
    GameState.currentOp = op;
    
    const powerupNames = { '+': '连发', '-': '穿透', '×': '强力', '÷': '冻结' };
    const powerupColors = { '+': '#ff4444', '-': '#4488ff', '×': '#ffd700', '÷': '#00ffff' };
    
    document.getElementById('question').innerHTML = `
      <div style="font-size: 10px; color: ${powerupColors[op]}">奖励: ${powerupNames[op]}</div>
      ${a} ${op} ${b} = ?
    `;
    document.getElementById('answer-display').textContent = '';
    document.getElementById('keypad').classList.remove('hidden');
    document.getElementById('fire-container').style.display = 'none';
  } 
  // 2. 速度型 (Speed): 冲撞赛车 (物理接触正确答案，禁用射击)
  else if (mode === 'speed') {
    updateModeUI('冲撞模式');
    answer = Math.floor(Math.random() * 10) + 5; 
    GameState.correctAnswer = answer;
    
    document.getElementById('question').textContent = '直接去撞击结果为：';
    document.getElementById('answer-display').textContent = answer;
    document.getElementById('keypad').classList.add('hidden');
    document.getElementById('fire-container').style.display = 'none';
    
    // 禁用射击
    if (GameState.fireInterval) {
      clearInterval(GameState.fireInterval);
      GameState.fireInterval = null;
    }
    
    assignExpressionsToBlocks(answer);
  }
  // 3. 火力型 (Power): 数字合成模式 (手动开火，在限次内凑够目标)
  else {
    updateModeUI('合成模式');
    
    // 根据关卡动态计算目标和步数
    const difficulty = Math.min(5, Math.floor((level - 1) / 2));
    const shotOptions = [2, 3, 3, 4, 4, 5];
    const maxShots = shotOptions[difficulty] || 3;
    
    // 生成合成方案
    let target = 0;
    let components = [];
    for (let i = 0; i < maxShots; i++) {
      const val = Math.floor(Math.random() * 9) + 1;
      components.push(val);
      target += val;
    }
    
    GameState.correctAnswer = target;
    GameState.solutionSet = components;
    GameState.allowedShots = maxShots;
    GameState.remainingShots = maxShots;
    GameState.currentSum = 0;
    
    document.getElementById('question').innerHTML = `
      目标: <span style="color:#ffd700;font-size:24px">${target}</span> 
      可用次数: <span style="color:#ff4444;font-size:24px">${maxShots}</span>
    `;
    document.getElementById('answer-display').textContent = `当前: 0`;
    document.getElementById('keypad').classList.add('hidden');
    document.getElementById('fire-container').style.display = 'block';
    
    assignNumbersToBlocks();
  }
}

function updateModeUI(text) {
  const el = document.getElementById('mode-text');
  if (el) el.textContent = text;
}

function updateSynthesisUI() {
  const qEl = document.getElementById('question');
  const dEl = document.getElementById('answer-display');
  if (qEl) {
    qEl.innerHTML = `
      目标: <span style="color:#ffd700;font-size:24px">${GameState.correctAnswer}</span> 
      可用次数: <span style="color:#ff4444;font-size:24px">${GameState.remainingShots}</span>
    `;
  }
  if (dEl) {
    dEl.textContent = `当前: ${GameState.currentSum}`;
  }
}

function getMathProblem(level) {
  let a, b, op, answer;
  if (level <= 3) {
    op = Math.random() > 0.4 ? '+' : '-';
    if (op === '+') { a = Math.floor(Math.random() * 8) + 1; b = Math.floor(Math.random() * 8) + 1; answer = a + b; }
    else { a = Math.floor(Math.random() * 10) + 3; b = Math.floor(Math.random() * (a - 1)) + 1; answer = a - b; }
  } else {
    const ops = ['+', '-', '×'];
    op = ops[Math.floor(Math.random() * ops.length)];
    a = Math.floor(Math.random() * 10) + 2;
    b = Math.floor(Math.random() * 10) + 2;
    if (op === '+') answer = a + b;
    else if (op === '-') { a = a + b; answer = a - b; }
    else answer = a * b;
  }
  return { a, b, op, answer };
}

function assignExpressionsToBlocks(target) {
  let correctCount = 0;
  GameState.blocks.forEach((block, index) => {
    if (block.label === 'boss' || block.label === 'boss_bullet') return;
    
    // 强制至少每 3 个方块出一个正确答案，或者 40% 几率
    const isCorrect = (index % 3 === 0) || Math.random() > 0.6; 
    if (isCorrect) {
      correctCount++;
      block.mathValue = target;
      // 生成结果为 target 的题目 (混合加减)
      if (Math.random() > 0.5) {
        const a = Math.floor(Math.random() * (target - 1)) + 1;
        block.mathText = `${a}+${target - a}`;
      } else {
        const b = Math.floor(Math.random() * 5) + 1;
        block.mathText = `${target + b}-${b}`;
      }
    } else {
      let wrong;
      do { wrong = Math.floor(Math.random() * 20) + 2; } while (wrong === target);
      block.mathValue = wrong;
      const a = Math.floor(Math.random() * (wrong - 1)) + 1;
      block.mathText = `${a}+${wrong - a}`;
    }
  });
  
  // 兜底：如果一个正确的都没有，随机选一个改为正确的
  if (correctCount === 0 && GameState.blocks.length > 0) {
    const lucky = GameState.blocks[Math.floor(Math.random() * GameState.blocks.length)];
    lucky.mathValue = target;
    lucky.mathText = `${target-1}+1`;
  }
}

function assignNumbersToBlocks() {
  const components = [...GameState.solutionSet];
  
  GameState.blocks.forEach((block, index) => {
    if (block.label === 'boss' || block.label === 'boss_bullet') return;
    
    let val;
    // 如果还有预设的方案数字没分配，优先分配方案数字
    if (components.length > 0) {
      val = components.pop();
    } else {
      // 否则分配干扰项
      val = Math.floor(Math.random() * 9) + 1;
    }
    
    block.mathValue = val;
    block.mathText = val.toString();
  });
  
  // 洗牌分配：确保正确答案不是聚在一起的 (可选增强)
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
  GameState.initialBlockCount = count;

  if (level <= 4) {
    // 1-4关：静态方块，增加间距
    const size = 42;
    const spacingX = 60; // 水平间距
    const spacingY = 80; // 垂直间距加大
    const cols = 4;
    const rows = Math.ceil(count / cols);
    const gridWidth = (cols - 1) * spacingX;
    const startX = (CONFIG.width - gridWidth) / 2;
    const startY = 180;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const offsetX = (row % 2 === 0) ? 0 : spacingX / 2; // 交错排列
      createSingleBlock(startX + col * spacingX + offsetX, startY + row * spacingY, true, size, 1);
    }
  } else if (level <= 8) {
    // 5-8关：间距与交错
    const size = 40;
    const spacingX = 65;
    const spacingY = 90;
    const cols = 4;
    const rows = Math.ceil(count / cols);
    const gridWidth = (cols - 1) * spacingX;
    const startX = (CONFIG.width - gridWidth) / 2;
    const startY = 180;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const offsetX = (row % 2 === 0) ? 0 : spacingX / 3;
      const hp = Math.random() > 0.7 ? 2 : 1;
      const block = createSingleBlock(startX + col * spacingX + offsetX, startY + row * spacingY, false, size, hp);
      if (level >= 7) {
        block.movePattern = 'horizontal';
        block.movePhase = i * 0.3;
        block.originalX = startX + col * spacingX + offsetX;
      }
    }
  } else if (level <= 12) {
    // 9-12关
    const size = 38;
    const spacingX = 60;
    const spacingY = 100;
    const cols = 5;
    const rows = Math.ceil(count / cols);
    const gridWidth = (cols - 1) * spacingX;
    const startX = (CONFIG.width - gridWidth) / 2;
    const startY = 180;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const offsetX = (row % 2 === 0) ? 0 : 20;
      const hp = Math.random() > 0.6 ? 2 : 1;
      const block = createSingleBlock(startX + col * spacingX + offsetX, startY + row * spacingY, false, size, hp);
      block.movePattern = 'sine';
      block.movePhase = i * 0.4;
      block.originalX = startX + col * spacingX + offsetX;
      block.originalY = startY + row * spacingY;
    }
  } else {
    // 13+关：混乱模式
    for (let i = 0; i < count; i++) {
      const x = 60 + Math.random() * (CONFIG.width - 120);
      const y = 180 + Math.random() * (CONFIG.height / 4);
      const hp = Math.random() > 0.5 ? 2 : 1;
      const block = createSingleBlock(x, y, false, 36, hp);
      
      const patterns = ['sine', 'circle'];
      block.movePattern = patterns[Math.floor(Math.random() * patterns.length)];
      block.movePhase = Math.random() * Math.PI * 2;
      block.originalX = x;
      block.originalY = y;
    }
  }
  
  // 重要：确保生成题目逻辑在最后执行，以便分配方块属性
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
    mathValue: undefined, // 新增
    mathText: '',       // 新增
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
  
  if (GameState.isFever) {
    document.body.classList.add('fever-glow');
  } else {
    document.body.classList.remove('fever-glow');
  }

  if (GameState.isFever && !wasFever) {
    Juice.triggerShake(10);
    Juice.triggerFlash(0.3);
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
  
  // 触发大震动和强闪光
  Juice.triggerShake(20);
  Juice.triggerFlash(0.8);

  const clearRadius = (count * 0.4) * Math.min(CONFIG.width, CONFIG.height) / 100 + 150;
  const centerX = CONFIG.width / 2;
  const centerY = CONFIG.height / 2;
  
  // 在中心产生大量烟雾和火花
  createParticles(centerX, centerY, '#ffaa00', 'explosion', 30);
  createParticles(centerX, centerY, '#ffffff', 'smoke', 20);

  GameState.blocks.forEach(block => {
    const dx = block.position.x - centerX;
    const dy = block.position.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < clearRadius) {
      createParticles(block.position.x, block.position.y, '#ffd700', 'explosion', 10);
      awardCoins(block, true);
      Composite.remove(engine.world, block);
    }
  });
  
  GameState.blocks = GameState.blocks.filter(block => {
    const dx = block.position.x - centerX;
    const dy = block.position.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist >= clearRadius;
  });
  
  setTimeout(() => flash?.classList.remove('show'), 500);
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

  // 清除现有的定时器（无论是自动还是之前的爆发）
  if (GameState.fireInterval) {
    clearInterval(GameState.fireInterval);
    GameState.fireInterval = null;
  }

  const upgrade = GameState.upgradeLevel;
  let bulletCount = (GameState.planeType === 'balanced') ? count : 1;
  
  const speed = GameState.isFever ? CONFIG.bulletSpeed * 1.5 : CONFIG.bulletSpeed;
  const interval = GameState.isFever ? 40 : 80;
  
  if (GameState.planeType === 'power' || GameState.powerupActive === '×') {
    bulletCount = Math.ceil(bulletCount * 1.5);
  }

  const firePattern = () => {
    const penetrate = GameState.isPenetrate || GameState.powerupActive === '-';
    
    // 如果是加法奖励，增加散射
    const bonusUpgrade = GameState.powerupActive === '+' ? 1 : 0;
    const finalUpgrade = Math.min(3, upgrade + bonusUpgrade);

    switch(finalUpgrade) {
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
      // 射击结束，清除数学奖励
      GameState.powerupActive = null;
      
      // 重要：如果是速度或火力模式，恢复自动开火
      if (GameState.planeType !== 'balanced') {
        fireContinuous();
      }
      return;
    }
    firePattern();
    fired++;
  }, interval);
}

function applyMathPowerup(op) {
  GameState.powerupActive = op;
  
  const powerupColors = { '+': '#ff4444', '-': '#4488ff', '×': '#ffd700', '÷': '#00ffff' };
  const powerupNames = { '+': 'Rapid Fire!', '-': 'Piercing!', '×': 'Double Power!', '÷': 'Freeze!' };
  
  showFloatingText(GameState.planeX, CONFIG.planeY - 40, powerupNames[op], powerupColors[op]);
  playSound('powerup');
  
  if (op === '÷') {
    activateFreeze();
    // 冻结不需要持续到射击结束，所以这里可以立即清除或者保留
  }
  
  Juice.triggerFlash(0.2);
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

// ==================== 视觉特效系统 (Juice System) ====================
const Juice = {
  shake: 0,
  maxShake: 10,
  flash: 0,
  chromatic: 0,
  
  triggerShake(intensity) {
    this.shake = Math.min(this.maxShake, this.shake + intensity);
  },
  
  triggerFlash(opacity = 0.3) {
    this.flash = opacity;
  },
  
  update() {
    if (this.shake > 0) this.shake *= 0.9;
    if (this.flash > 0) this.flash *= 0.9;
    if (GameState.isFever) {
      this.chromatic = Math.min(5, this.chromatic + 0.5);
    } else {
      this.chromatic *= 0.8;
    }
  }
};

// ==================== 粒子系统增强 ====================
function createParticles(x, y, color, type = 'pixel', count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
    const speed = (type === 'explosion' ? 5 : 2) + Math.random() * 5;
    
    GameState.particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 30 + Math.random() * 30,
      maxLife: 60,
      color: color,
      size: type === 'spark' ? 2 : 4 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      type: type, // 'pixel', 'spark', 'smoke', 'explosion'
      gravity: type === 'smoke' ? -0.05 : 0.15
    });
  }
}

function updateParticles() {
  GameState.particles = GameState.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.life--;
    p.rotation += p.rotSpeed;
    
    if (p.type === 'smoke') {
      p.size += 0.1;
      p.vx *= 0.98;
    }
    
    return p.life > 0;
  });
}

function drawParticles(ctx) {
  GameState.particles.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    
    if (p.type === 'spark') {
      ctx.fillRect(-p.size, -p.size/4, p.size * 2, p.size/2);
    } else if (p.type === 'smoke') {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      // 给像素碎片加个深色边框更有像素感
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-p.size/2, -p.size/2, p.size, p.size);
    }
    
    ctx.restore();
  });
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
    const isPlaneA = (bodyA.label === 'plane');
    const isPlaneB = (bodyB.label === 'plane');
    const isBossA = (bodyA.label === 'boss');
    const isBossB = (bodyB.label === 'boss');

    // 1. 处理飞机与方块的直接碰撞 (主要用于冲撞模式)
    if ((isPlaneA && isBlockB) || (isPlaneB && isBlockA)) {
      const block = isBlockA ? bodyA : bodyB;
      const mode = GameState.planeType;

      if (mode === 'speed' && block.mathValue !== undefined) {
        if (block.mathValue === GameState.correctAnswer) {
          // 正确：冲撞成功
          GameState.coins += 10; // 冲撞模式奖励更多
          updateHUD();
          createParticles(block.position.x, block.position.y, '#ffd700', 'explosion', 20);
          Juice.triggerShake(10);
          Juice.triggerFlash(0.2);
          playSound('correct');
          
          // 冲击波
          applyShockwave(block.position.x, block.position.y, 200, 0.08);
          
          Composite.remove(engine.world, block);
          GameState.blocks = GameState.blocks.filter(b => b !== block);
          
          // 选下一个目标
          const remaining = GameState.blocks.filter(b => b.label === 'block');
          if (remaining.length > 0) {
            GameState.correctAnswer = remaining[Math.floor(Math.random() * remaining.length)].mathValue;
            document.getElementById('answer-display').textContent = GameState.correctAnswer;
          }
        } else {
          // 错误：撞错受损
          handleLifeLost(block);
        }
      } else {
        // 其他模式撞到方块直接扣血 (除非有护盾)
        handleLifeLost(block);
      }
    }

    // 2. 处理子弹与方块碰撞 (原有逻辑)
    if ((isAttackA && isBlockB) || (isAttackB && isBlockA)) {
      const bullet = isAttackA ? bodyA : bodyB;
      const block = isBlockA ? bodyA : bodyB;

      // 处理多模式逻辑
      const mode = GameState.planeType;
      
      // 1. 猎手模式逻辑 (Speed)
      if (mode === 'speed' && block.mathValue !== undefined) {
        if (block.mathValue === GameState.correctAnswer) {
          // 正确目标
          awardCoins(block);
          createParticles(block.position.x, block.position.y, '#ffd700', 'explosion', 15);
          Juice.triggerShake(5);
          Composite.remove(engine.world, block);
          GameState.blocks = GameState.blocks.filter(b => b !== block);
          playSound('correct');
          updateCombo(true);
          
          // 击落正确的，立即生成下一个目标？或者等这一波清完
          if (GameState.blocks.length > 0) {
            // 重新随机一个当前存在的数字作为目标，增加流畅度
            const remaining = GameState.blocks.filter(b => b.label === 'block');
            if (remaining.length > 0) {
              const next = remaining[Math.floor(Math.random() * remaining.length)];
              GameState.correctAnswer = next.mathValue;
              document.getElementById('answer-display').textContent = GameState.correctAnswer;
            }
          }
        } else {
          // 错误目标：惩罚
          createParticles(block.position.x, block.position.y, '#ff4444', 'spark', 10);
          playSound('wrong');
          Juice.triggerShake(8);
          updateCombo(false);
          // 弹开子弹，但不销毁方块
        }
      } 
      // 2. 合成模式逻辑 (Power)
      else if (mode === 'power' && block.mathValue !== undefined) {
        GameState.currentSum += block.mathValue;
        createParticles(block.position.x, block.position.y, block.render.fillStyle, 'pixel', 8);
        awardCoins(block);
        
        // 采集也带一点冲击力
        applyShockwave(block.position.x, block.position.y, 100, 0.03);
        
        Composite.remove(engine.world, block);
        GameState.blocks = GameState.blocks.filter(b => b !== block);
        
        // 更新 UI
        updateSynthesisUI();
        
        if (GameState.currentSum === GameState.correctAnswer) {
          // 刚好达到目标：成功！
          playSound('correct');
          showFloatingText(block.position.x, block.position.y, 'PERFECT SYNTHESIS!', '#ffd700');
          triggerNuke(30); 
          GameState.currentSum = 0; 
          setTimeout(generateQuestion, 800);
        } else if (GameState.currentSum > GameState.correctAnswer || (GameState.remainingShots === 0 && GameState.currentSum !== GameState.correctAnswer)) {
          // 爆了 或者 次数用完且没凑够：失败
          playSound('wrong');
          const msg = GameState.currentSum > GameState.correctAnswer ? 'TOO MUCH!' : 'OUT OF SHOTS!';
          showFloatingText(GameState.planeX, CONFIG.planeY - 50, msg, '#ff4444');
          Juice.triggerShake(15);
          Juice.triggerFlash(0.3);
          
          GameState.lives--;
          updateHUD();
          GameState.currentSum = 0;
          GameState.remainingShots = GameState.allowedShots; // 重置次数
          
          setTimeout(() => {
            updateSynthesisUI();
            if (GameState.blocks.length < 3) createBlocks(); // 如果方块快没了，补一波
          }, 800);
          
          if (GameState.lives <= 0) gameOver(false);
        }
      }
      // 3. 狙击模式 (Balanced - 原有逻辑)
      else {
        if (bullet.isPenetrate && bullet.penetrateCount > 0) {
          bullet.penetrateCount--;
        } else {
          Composite.remove(engine.world, bullet);
          GameState.bullets = GameState.bullets.filter(b => b !== bullet);
        }

        const damage = bullet.damage || 1;
        block.hp -= damage;
        createParticles(block.position.x, block.position.y, block.render.fillStyle, 'pixel', 5);

        if (block.hp <= 0) {
          awardCoins(block);
          createParticles(block.position.x, block.position.y, '#ffd700', 'explosion', 12);
          Juice.triggerShake(3);
          
          // 产生物理冲击波，震开周围方块
          applyShockwave(block.position.x, block.position.y, 150, 0.05);
          
          Composite.remove(engine.world, block);
          GameState.blocks = GameState.blocks.filter(b => b !== block);
        } else {
          playSound('hit');
        }
      }
      
      // 通用：如果是攻击，则销毁子弹
      if (mode !== 'power' || (isAttackA && isBlockB) || (isAttackB && isBlockA)) {
         if (!bullet.isPenetrate || bullet.penetrateCount <= 0) {
            Composite.remove(engine.world, bullet);
            GameState.bullets = GameState.bullets.filter(b => b !== bullet);
         }
      }
    }
    
    if ((isAttackA && isBossB) || (isAttackB && isBossA)) {
      const bullet = isAttackA ? bodyA : bodyB;
      Composite.remove(engine.world, bullet);
      GameState.bullets = GameState.bullets.filter(b => b !== bullet);
      
      if (GameState.boss) {
        GameState.boss.takeDamage(bullet.damage || 1);
        Juice.triggerShake(2);
        createParticles(bullet.position.x, bullet.position.y, '#ff0000', 'spark', 8);
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

// ==================== 终极技能 (Ultimate) ====================
function updateUltimate() {
  const container = document.getElementById('ult-container');
  const btn = document.getElementById('ult-btn');
  
  if (GameState.ultCharge >= 100 && !GameState.ultReady) {
    GameState.ultReady = true;
    container.classList.add('charging');
    btn.classList.add('ready');
    playSound('powerup');
    showFloatingText(CONFIG.width / 2, CONFIG.height / 2, 'ULTIMATE READY!', '#00ffff');
  } else if (GameState.ultCharge < 100) {
    GameState.ultReady = false;
    container.classList.remove('charging');
    btn.classList.remove('ready');
  }
}

function activateUltimate() {
  if (!GameState.ultReady) return;
  
  GameState.ultCharge = 0;
  updateUltimate();
  
  // 终极技能效果：全屏激光
  playSound('nuke');
  Juice.triggerShake(25);
  Juice.triggerFlash(0.9);
  
  // 视觉效果：巨大光束
  const beam = document.createElement('div');
  beam.style.position = 'absolute';
  beam.style.bottom = '0';
  beam.style.left = '50%';
  beam.style.transform = 'translateX(-50%)';
  beam.style.width = '10px';
  beam.style.height = '100%';
  beam.style.background = '#00ffff';
  beam.style.boxShadow = '0 0 50px #00ffff, 0 0 100px #fff';
  beam.style.transition = 'all 0.5s';
  beam.style.zIndex = '100';
  document.body.appendChild(beam);
  
  setTimeout(() => {
    beam.style.width = CONFIG.width + 'px';
    beam.style.opacity = '0';
  }, 50);
  
  setTimeout(() => beam.remove(), 600);
  
  // 清除所有敌人
  GameState.blocks.forEach(block => {
    createParticles(block.position.x, block.position.y, '#00ffff', 'explosion', 20);
    awardCoins(block, true);
    Composite.remove(engine.world, block);
  });
  GameState.blocks = [];
  
  // 对Boss造成巨大伤害
  if (GameState.boss) {
    GameState.boss.takeDamage(50);
  }
}

// 导出全局函数
window.activateUltimate = activateUltimate;

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
    
    // 增加终极技能充能
    if (GameState.ultCharge < 100) {
      GameState.ultCharge = Math.min(100, GameState.ultCharge + 10);
      updateUltimate();
    }
    
    // 应用数学奖励
    applyMathPowerup(GameState.currentOp);
    
    // 清除Boss弹幕
    GameState.blocks.forEach(block => {
      if (block.label === 'boss_bullet') {
        createParticles(block.position.x, block.position.y, '#ff00ff', 'spark', 5);
        Composite.remove(engine.world, block);
      }
    });
    GameState.blocks = GameState.blocks.filter(b => b.label !== 'boss_bullet');

    fireBullets(userAnswer);
    
    // 核心修复：立即清空输入，防止下题直接判定
    GameState.currentAnswer = '';
    const display = document.getElementById('answer-display');
    if (display) display.textContent = '';

    setTimeout(() => {
      if (!GameState.isGameOver) generateQuestion();
    }, 300);
    
    GameState.wrongCount = 0;
    document.getElementById('math-panel')?.classList.add('correct');
    setTimeout(() => document.getElementById('math-panel')?.classList.remove('correct'), 500);
    
  } else {
    playSound('wrong');
    GameState.stats.wrongAnswers++;
    GameState.wrongCount++;
    updateCombo(false);
    
    const mathPanel = document.getElementById('math-panel');
    if (mathPanel) {
      mathPanel.classList.add('wrong');
      setTimeout(() => mathPanel.classList.remove('wrong'), 400);
    }

    const display = document.getElementById('answer-display');
    if (display) {
      display.style.color = '#ff4444';
      
      // 连续错两次显示提示
      if (GameState.wrongCount >= 2) {
        display.textContent = `答: ${GameState.correctAnswer}`;
        setTimeout(() => {
          GameState.currentAnswer = '';
          display.textContent = '';
          display.style.color = '#ffd700';
        }, 1200);
      } else {
        setTimeout(() => {
          display.style.color = '#ffd700';
          GameState.currentAnswer = '';
          display.textContent = '';
        }, 400);
      }
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
  const progressEl = document.getElementById('progress-bar');
  
  if (levelEl) levelEl.textContent = GameState.level;
  if (livesEl) livesEl.textContent = '❤️'.repeat(GameState.lives) || '💔';
  if (coinsEl) coinsEl.textContent = GameState.coins;
  
  // 更新进度条
  if (progressEl && GameState.initialBlockCount > 0) {
    const remaining = GameState.blocks.length;
    const percent = Math.max(0, Math.min(100, (1 - remaining / GameState.initialBlockCount) * 100));
    progressEl.style.width = percent + '%';
  }
}

// ==================== 统一扣血逻辑 ====================
function handleLifeLost(block) {
  // 有护盾时抵挡
  if (GameState.skills.shield.active && GameState.skills.shield.hits > 0) {
    GameState.skills.shield.hits--;
    createParticles(block.position.x, block.position.y, '#00ff88', 'spark', 15);
    showFloatingText(block.position.x, block.position.y - 40, '🛡️ BLOCKED!', '#00ff88');
    playSound('hit');
    Juice.triggerShake(5);
    
    if (GameState.skills.shield.hits <= 0) {
      GameState.skills.shield.active = false;
      playSound('lifeLost'); 
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
  createParticles(block.position.x, block.position.y, '#ff4444', 'explosion', 20);
  showFloatingText(CONFIG.width/2, CONFIG.height/2, '❤️ -1', '#ff4444');
  playSound('lifeLost');
  
  // 屏幕震动与闪烁
  Juice.triggerShake(15);
  Juice.triggerFlash(0.5);
  
  Composite.remove(engine.world, block);
  GameState.blocks = GameState.blocks.filter(b => b !== block);
  
  if (GameState.lives <= 0) {
    gameOver(false);
  }
}

// ==================== 游戏状态检查 - 优化生命系统 ====================
function checkGameState() {
  // 检查方块掉落
  GameState.blocks.forEach(block => {
    if (block.position.y > CONFIG.height - 60) {
      handleLifeLost(block);
    }
  });

  // 过关检查
  if (!GameState.isBossLevel && GameState.blocks.length === 0 && !GameState.isGameOver) {
    // 合成模式特殊逻辑：如果没凑够数字且方块没了，补货
    if (GameState.planeType === 'power' && GameState.currentSum < GameState.correctAnswer) {
      createBlocks();
    } else {
      levelComplete();
    }
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
  
  // 计算各运算正确率 (假设我们在 stats 中记录了这些)
  const accuracy = Math.round((GameState.stats.correctAnswers / (GameState.stats.correctAnswers + GameState.stats.wrongAnswers) * 100) || 0);
  
  overlay.innerHTML = `
    <h1>${isWin ? '🎉 胜利!' : '💥 游戏结束'}</h1>
    <div class="subtitle">到达关卡: ${GameState.level} | 最高连击: ${GameState.maxCombo}</div>
    
    <div class="features" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; border: 1px solid #444;">
      <h3 style="color: #ffd700; margin-bottom: 10px;">📊 数学报告</h3>
      <p>答对题数: <span style="color: #00ff88;">${GameState.stats.correctAnswers}</span> | 正确率: <span style="color: ${accuracy > 80 ? '#00ff88' : '#ff6b6b'};">${accuracy}%</span></p>
      <p>总击杀: <span>${GameState.totalKills}</span> | 累积金币: <span>${GameState.coins}</span></p>
      <div style="font-size: 11px; color: #888; margin-top: 8px;">
        提示: 勤加练习加减乘除，解锁更多强力子弹！
      </div>
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
  
  // 更新护盾位置 (DOM元素)
  const shield = document.querySelector('.shield-overlay');
  if (shield) {
    if (GameState.skills.shield.active) {
      shield.style.display = 'block';
      shield.style.left = (GameState.planeX - 45) + 'px'; // 90px width / 2
      shield.style.top = (CONFIG.planeY - 45) + 'px';
      
      // 护盾快破时闪烁
      if (GameState.skills.shield.hits === 1) {
        shield.style.opacity = (Date.now() % 200 < 100) ? '0.3' : '1';
      } else {
        shield.style.opacity = '1';
      }
    } else {
      shield.style.display = 'none';
    }
  }

  // 屏幕震动 (Juice System)
  if (Juice.shake > 0) {
    const sx = (Math.random() - 0.5) * Juice.shake;
    const sy = (Math.random() - 0.5) * Juice.shake;
    ctx.translate(sx, sy);
  }
  
  // 清空画布
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  
  // 绘制星空背景
  Starfield.draw(ctx);
  
  // 网格背景
  ctx.strokeStyle = 'rgba(255,255,255,0.015)';
  ctx.lineWidth = 1;
  for (let i = 0; i < CONFIG.width; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, CONFIG.height);
    ctx.stroke();
  }

  // 绘制粒子 (新系统)
  drawParticles(ctx);

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

  // 猎手模式目标指引
  if (GameState.planeType === 'speed' && !GameState.isBossLevel) {
    const target = GameState.blocks.find(b => b.mathValue === GameState.correctAnswer);
    if (target) {
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(GameState.planeX, CONFIG.planeY - 40);
      ctx.lineTo(target.position.x, target.position.y + 20);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  
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
  
  // 色差效果 (Fever Mode)
  if (Juice.chromatic > 0) {
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255,0,0,0.1)';
    ctx.fillRect(Juice.chromatic, 0, CONFIG.width, CONFIG.height);
    ctx.fillStyle = 'rgba(0,0,255,0.1)';
    ctx.fillRect(-Juice.chromatic, 0, CONFIG.width, CONFIG.height);
    ctx.globalCompositeOperation = 'source-over';
  }

  // 闪屏效果
  if (Juice.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Juice.flash})`;
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  }

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
  
  // 飞机倾斜动画 (基于移动速度)
  const xDiff = GameState.targetPlaneX - GameState.planeX;
  const bankAngle = Math.max(-0.4, Math.min(0.4, xDiff * 0.01));
  ctx.rotate(bankAngle);

  // 速度型特殊视觉：冲撞光环
  if (GameState.planeType === 'speed') {
    ctx.save();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -15, 35 + Math.sin(Date.now()/100)*5, 0, Math.PI, true);
    ctx.stroke();
    
    // 头部尖刺感
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(-10, -25);
    ctx.lineTo(0, -45);
    ctx.lineTo(10, -25);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = c.wing;
  ctx.fillRect(-28, 0, 56, 18);
  
  ctx.fillStyle = c.body;
  ctx.fillRect(-12, -25, 24, 50);
  
  ctx.fillStyle = CONFIG.colors.planeWindow;
  ctx.fillRect(-8, -18, 16, 14);
  
  // Engine fire (Flickering)
  const flameHeight = 8 + Math.random() * 8 + (GameState.isFever ? 10 : 0);
  const flameGradient = ctx.createLinearGradient(0, 22, 0, 22 + flameHeight);
  flameGradient.addColorStop(0, '#ffff00');
  flameGradient.addColorStop(0.5, '#ff6600');
  flameGradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = flameGradient;
  ctx.beginPath();
  ctx.moveTo(-8, 22);
  ctx.lineTo(8, 22);
  ctx.lineTo(0, 22 + flameHeight);
  ctx.fill();

  if (GameState.isFever) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff4400';
    ctx.fillRect(-6, 22, 12, flameHeight * 0.7);
    ctx.shadowBlur = 0;
  }
  
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
  
  // 深度效果：越靠近顶部的方块越小、越淡
  const depthScale = Math.max(0.7, Math.min(1.0, 0.6 + (y / CONFIG.height) * 0.5));
  const size = 38 * depthScale;
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(block.angle);
  ctx.globalAlpha = depthScale;
  
  if (block.isGold) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffd700';
  }
  
  // 绘制主体
  ctx.fillStyle = block.render.fillStyle;
  
  // 猎手模式高亮正确答案
  if (GameState.planeType === 'speed' && block.mathValue === GameState.correctAnswer) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ff88';
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
  }
  
  ctx.fillRect(-size/2, -size/2, size, size);
  ctx.strokeRect(-size/2, -size/2, size, size);
  ctx.shadowBlur = 0;

  // 绘制题目/数字 (核心改动)
  if (block.mathText) {
    ctx.rotate(-block.angle); // 让文字保持水平
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000';
    ctx.fillText(block.mathText, 0, 0);
    ctx.shadowBlur = 0;
  }

  // HP 条
  if (block.hp < block.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-size/2, -size/2 - 10, size, 4);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(-size/2, -size/2 - 10, size * (block.hp / block.maxHp), 4);
  }

  if (block.isGold && !block.mathText) {
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('★', 0, 6);
  }
  
  ctx.restore();
}

// ==================== 游戏循环 ====================
function gameLoop() {
  if (!GameState.isPaused && !GameState.isGameOver) {
    Engine.update(engine, 1000 / 60);
    checkGameState();
    updateParticles();
    Juice.update();
    Starfield.update();
  }
  render();
  requestAnimationFrame(gameLoop);
}

// ==================== 控制系统 (拖动移动) ====================
let isDragging = false;

function handlePointerStart(e) {
  if (GameState.isGameOver || GameState.isPaused || GameState.isShopOpen) return;
  
  // 检查是否点击了 UI 元素 (包括新的 Fire 按钮)
  const target = e.target;
  if (target.closest('#hud') || target.closest('#ult-container') || target.closest('#keypad') || target.closest('#fire-container')) {
    return;
  }

  isDragging = true;
  updateTargetX(e);
}

// ==================== 物理冲击波 (Shockwave) ====================
function applyShockwave(x, y, radius, strength) {
  GameState.blocks.forEach(block => {
    const dx = block.position.x - x;
    const dy = block.position.y - y;
    const distSq = dx * dx + dy * dy;
    
    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq);
      const force = (1 - dist / radius) * strength;
      Body.applyForce(block, block.position, {
        x: (dx / dist) * force,
        y: (dy / dist) * force
      });
    }
  });
}

function manualFire(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (GameState.isGameOver || GameState.isPaused) return;
  
  // 合成模式限次逻辑
  if (GameState.planeType === 'power' && !GameState.isBossLevel) {
    if (GameState.remainingShots <= 0) {
      showFloatingText(GameState.planeX, CONFIG.planeY - 40, '次数耗尽!', '#ff4444');
      return;
    }
    GameState.remainingShots--;
    updateSynthesisUI();
  }

  // 发射子弹
  fireBullets(1);
  
  // 给按钮一个小反馈
  const btn = document.getElementById('fire-btn');
  if (btn) {
    btn.style.transform = 'scale(0.8)';
    setTimeout(() => btn.style.transform = '', 100);
  }
}

// 导出全局函数
window.manualFire = manualFire;

function handlePointerMove(e) {
  if (!isDragging) return;
  updateTargetX(e);
}

function handlePointerEnd() {
  isDragging = false;
}

function updateTargetX(e) {
  const x = e.touches ? e.touches[0].clientX : e.clientX;
  GameState.targetPlaneX = x;
}

// 绑定事件
window.addEventListener('mousedown', handlePointerStart);
window.addEventListener('mousemove', handlePointerMove);
window.addEventListener('mouseup', handlePointerEnd);
window.addEventListener('touchstart', handlePointerStart, { passive: false });
window.addEventListener('touchmove', handlePointerMove, { passive: false });
window.addEventListener('touchend', handlePointerEnd);

// 飞机移动与开火控制
setInterval(() => {
  if (GameState.isGameOver || GameState.isPaused) return;
  
  // 1. 移动逻辑
  if (GameState.autoAim && GameState.blocks.length > 0) {
    let targetBlock = GameState.blocks.reduce((lowest, block) => 
      block.position.y > lowest.position.y ? block : lowest, GameState.blocks[0]);
    const diff = targetBlock.position.x - GameState.planeX;
    GameState.planeX += diff * 0.15;
  } else {
    // 拖动平滑跟随
    const lerpFactor = GameState.planeType === 'speed' ? 0.3 : 0.15;
    const diff = GameState.targetPlaneX - GameState.planeX;
    GameState.planeX += diff * lerpFactor;
  }
  
  GameState.planeX = Math.max(40, Math.min(CONFIG.width - 40, GameState.planeX));
  if (GameState.planeBody) {
    Body.setPosition(GameState.planeBody, { x: GameState.planeX, y: CONFIG.planeY - 10 });
  }

  // 2. 开火逻辑 (仅限非狙击模式且非BOSS战)
  if (!GameState.isBossLevel) {
    if (GameState.planeType === 'power') {
      // 21点模式：手动射击，逻辑在 handlePointerStart 中
      if (GameState.fireInterval) {
        clearInterval(GameState.fireInterval);
        GameState.fireInterval = null;
      }
    } else if (GameState.planeType === 'speed') {
      // 冲撞模式：完全禁用射击
      if (GameState.fireInterval) {
        clearInterval(GameState.fireInterval);
        GameState.fireInterval = null;
      }
    }
  }
}, 16);

function fireContinuous() {
  if (GameState.fireInterval) return;
  
  const interval = 250; // 采集模式射速，给走位留空间
  
  GameState.fireInterval = setInterval(() => {
    if (GameState.isPaused || GameState.isGameOver || GameState.planeType !== 'power' || GameState.isBossLevel) {
      clearInterval(GameState.fireInterval);
      GameState.fireInterval = null;
      return;
    }
    
    const penetrate = GameState.powerupActive === '-';
    let bCount = (GameState.powerupActive === '×') ? 2 : 1;
    const bSpeed = GameState.isFever ? CONFIG.bulletSpeed * 1.5 : CONFIG.bulletSpeed;

    for(let i=0; i<bCount; i++) {
        createBullet(GameState.planeX + (i*14 - (bCount-1)*7), CONFIG.planeY - 20, 0, -bSpeed, penetrate);
    }
    playSound('shoot');
  }, interval);
}

// 防止页面滚动
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// 窗口大小调整
window.addEventListener('resize', () => {
  CONFIG.width = window.innerWidth;
  CONFIG.height = window.innerHeight;
  CONFIG.planeY = window.innerHeight - 200; // 统一为 200
  canvas.width = CONFIG.width;
  canvas.height = CONFIG.height;
});

// ==================== 游戏控制 ====================
function startGame() {
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.style.display = 'none';
  
  GameState.isPaused = false;
  isDragging = false; // 重置拖动状态
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  loadAchievements();
  resetGame();
  Starfield.init(); // 初始化星空
  generateQuestion(); // 初始生成题目
  gameLoop();
}

function resetGame() {
  GameState.level = 1;
  GameState.attempts = 0;
  GameState.lives = 5;
  GameState.combo = 0;
  GameState.maxCombo = 0;
  GameState.coins = 0;
  GameState.ultCharge = 0;
  GameState.ultReady = false;
  updateUltimate();
  GameState.upgradeLevel = 0;
  GameState.currentAnswer = '';
  GameState.isGameOver = false;
  GameState.isPaused = false;
  GameState.isShopOpen = false;
  GameState.planeX = CONFIG.width / 2;
  GameState.targetPlaneX = CONFIG.width / 2; // 重置拖动目标
  
  // 创建飞机物理感应器
  if (GameState.planeBody) Composite.remove(engine.world, GameState.planeBody);
  GameState.planeBody = Bodies.rectangle(GameState.planeX, CONFIG.planeY - 10, 40, 40, {
    isSensor: true,
    isStatic: true,
    label: 'plane'
  });
  Composite.add(engine.world, GameState.planeBody);

  GameState.bullets = [];
  GameState.blocks = [];
  GameState.particles = [];
  GameState.damageNumbers = [];
  GameState.floatingTexts = [];
  GameState.boss = null;
  GameState.isBossLevel = false;
  GameState.currentSum = 0; // 重置累加值
  
  if (GameState.fireInterval) {
    clearInterval(GameState.fireInterval);
    GameState.fireInterval = null;
  }

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
