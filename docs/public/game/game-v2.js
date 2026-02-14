/**
 * 数学飞机大战 V2 - 狂暴进化版
 * 包含：Boss战、商店、技能、成就、飞机进化系统
 */

// ==================== 游戏配置 ====================
const CONFIG = {
  width: window.innerWidth,
  height: window.innerHeight,
  planeY: window.innerHeight - 200,
  bulletSpeed: 8,
  gravity: 0.05,
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
  lives: 3,
  combo: 0,
  coins: 0,
  maxCombo: 0,
  totalKills: 0,
  currentAnswer: '',
  correctAnswer: 0,
  isGameOver: false,
  isPaused: true,
  isShopOpen: false,
  planeX: CONFIG.width / 2,
  planeType: 'balanced', // balanced, speed, power
  bullets: [],
  blocks: [],
  particles: [],
  damageNumbers: [],
  upgradeLevel: 0,
  fireInterval: null,
  autoAim: false,
  submitTimer: null,
  soundEnabled: true,
  isFever: false,
  isPenetrate: false,
  shakeFrames: 0,
  // 技能状态
  skills: {
    freeze: { active: false, duration: 0 },
    shield: { active: false, hits: 0 },
    bomb: { count: 0 }
  },
  // Boss状态
  boss: null,
  isBossLevel: false,
  // 统计
  stats: {
    startTime: null,
    correctAnswers: 0,
    wrongAnswers: 0,
    bossKilled: 0
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
  mathWizard: { id: 'mathWizard', name: '数学巫师', desc: '答对50题', icon: '🧙', unlocked: false }
};

// ==================== 商店商品 ====================
const ShopItems = [
  { id: 'freeze', name: '时间冻结', desc: '暂停所有方块3秒', icon: '❄️', price: 30, type: 'instant' },
  { id: 'bomb', name: '全屏炸弹', desc: '消灭所有方块', icon: '💣', price: 50, type: 'item' },
  { id: 'shield', name: '能量护盾', desc: '抵挡1次伤害', icon: '🛡️', price: 40, type: 'buff' },
  { id: 'heal', name: '生命恢复', desc: '恢复1点生命', icon: '❤️', price: 60, type: 'instant' },
  { id: 'penetrate', name: '穿透弹夹', desc: '下轮子弹全穿透', icon: '🔫', price: 25, type: 'buff' }
];

// ==================== Matter.js 初始化 ====================
const Engine = Matter.Engine,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Events = Matter.Events,
  Body = Matter.Body;

const engine = Engine.create();
engine.gravity.y = CONFIG.gravity;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.width;
canvas.height = CONFIG.height;

// ==================== 音频系统 ====================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (!GameState.soundEnabled) return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  switch(type) {
    case 'shoot':
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
      break;
    case 'hit':
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
      break;
    case 'correct':
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.1, audioCtx.currentTime + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.1 + 0.2);
        o.start(audioCtx.currentTime + i * 0.1);
        o.stop(audioCtx.currentTime + i * 0.1 + 0.2);
      });
      break;
    case 'wrong':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
      break;
    case 'nuke':
      [329.63, 493.88, 659.25].forEach((freq, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.15, audioCtx.currentTime + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.08 + 0.4);
        o.start(audioCtx.currentTime + i * 0.08);
        o.stop(audioCtx.currentTime + i * 0.08 + 0.4);
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
    case 'bossWarning':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(300, audioCtx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
      break;
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
  coinsEl.innerHTML = `<span class="coin-icon">🪙</span> ${GameState.coins}`;
  
  const list = document.getElementById('shop-list');
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
      break;
    case 'shield':
      activateShield();
      break;
    case 'heal':
      if (GameState.lives < 5) {
        GameState.lives++;
        updateHUD();
      } else {
        GameState.coins += item.price; //  refund
      }
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
  GameState.skills.freeze.duration = 180; // 3 seconds at 60fps
  document.querySelector('.freeze-overlay').classList.add('show');
  
  // Freeze all blocks
  GameState.blocks.forEach(block => {
    block.velocityBeforeFreeze = { ...block.velocity };
    Body.setVelocity(block, { x: 0, y: 0 });
    Body.setAngularVelocity(block, 0);
  });
  
  setTimeout(() => {
    GameState.skills.freeze.active = false;
    document.querySelector('.freeze-overlay').classList.remove('show');
    // Restore velocities
    GameState.blocks.forEach(block => {
      if (block.velocityBeforeFreeze) {
        Body.setVelocity(block, block.velocityBeforeFreeze);
      }
    });
  }, 3000);
}

function activateShield() {
  GameState.skills.shield.active = true;
  GameState.skills.shield.hits = 1;
  document.querySelector('.shield-overlay').classList.add('show');
}

function useBomb() {
  if (GameState.skills.bomb.count <= 0) return;
  GameState.skills.bomb.count--;
  
  // Destroy all blocks
  GameState.blocks.forEach(block => {
    createParticles(block.position.x, block.position.y, '#ff6b6b', 15);
    Composite.remove(engine.world, block);
  });
  GameState.blocks = [];
  
  triggerNukeEffect();
  playSound('nuke');
}

// ==================== Boss系统 ====================
class Boss {
  constructor(level) {
    this.level = level;
    this.maxHp = level * 10;
    this.hp = this.maxHp;
    this.x = CONFIG.width / 2;
    this.y = 120;
    this.width = 120;
    this.height = 80;
    this.phase = 0;
    this.attackTimer = 0;
    this.moveDirection = 1;
    this.speed = 2 + level * 0.3;
    
    // Create boss body
    this.body = Bodies.rectangle(this.x, this.y, this.width, this.height, {
      isStatic: true,
      label: 'boss',
      isSensor: true,
      render: { fillStyle: '#ff0000' }
    });
    
    Composite.add(engine.world, this.body);
  }
  
  update() {
    // Sine wave movement
    this.phase += 0.02;
    this.x = CONFIG.width / 2 + Math.sin(this.phase) * 150;
    Body.setPosition(this.body, { x: this.x, y: this.y });
    
    // Attack every 5 seconds
    this.attackTimer++;
    if (this.attackTimer >= 300) { // 5 seconds at 60fps
      this.attack();
      this.attackTimer = 0;
    }
  }
  
  attack() {
    // Spawn a math missile
    const question = generateBossQuestion();
    createMathMissile(this.x, this.y + 50, question);
  }
  
  takeDamage(damage = 1) {
    this.hp -= damage;
    createDamageNumber(this.x, this.y - 50, damage);
    
    // Flash effect
    this.flash = 10;
    
    if (this.hp <= 0) {
      this.die();
    }
    updateBossHUD();
  }
  
  die() {
    // Explosion effect
    createParticles(this.x, this.y, '#ffd700', 50);
    
    // Reward
    GameState.coins += 50;
    GameState.stats.bossKilled++;
    unlockAchievement('bossSlayer');
    
    Composite.remove(engine.world, this.body);
    GameState.boss = null;
    GameState.isBossLevel = false;
    
    // Hide boss HUD
    document.getElementById('boss-hud').classList.remove('show');
    
    // Spawn victory coins
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        createCoinFloat(
          CONFIG.width / 2 + (Math.random() - 0.5) * 200,
          CONFIG.height / 2 + (Math.random() - 0.5) * 100
        );
      }, i * 100);
    }
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Flash when hit
    if (this.flash > 0) {
      ctx.globalAlpha = 0.5;
      this.flash--;
    }
    
    // Boss body (年兽)
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    
    // Eyes
    const eyeOffset = Math.sin(this.phase * 2) * 5;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(-30 + eyeOffset, -10, 15, 0, Math.PI * 2);
    ctx.arc(30 + eyeOffset, -10, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-30 + eyeOffset, -10, 5, 0, Math.PI * 2);
    ctx.arc(30 + eyeOffset, -10, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Horns
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(-50, -40);
    ctx.lineTo(-60, -80);
    ctx.lineTo(-30, -40);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(50, -40);
    ctx.lineTo(60, -80);
    ctx.lineTo(30, -40);
    ctx.fill();
    
    // HP bar above boss
    const hpPercent = this.hp / this.maxHp;
    ctx.fillStyle = '#000';
    ctx.fillRect(-60, -70, 120, 10);
    ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(-58, -68, 116 * hpPercent, 6);
    
    ctx.restore();
  }
}

function generateBossQuestion() {
  // Harder questions for boss
  const a = Math.floor(Math.random() * 20) + 10;
  const b = Math.floor(Math.random() * 20) + 5;
  return { text: `${a} + ${b} = ?`, answer: a + b };
}

function createMathMissile(x, y, question) {
  // Visual representation of boss attack
  const missile = Bodies.circle(x, y, 15, {
    isStatic: false,
    label: 'missile',
    question: question,
    render: { fillStyle: '#ff00ff' }
  });
  
  Body.setVelocity(missile, { x: 0, y: 3 });
  Composite.add(engine.world, missile);
  
  // Show question popup
  showBossQuestion(question);
}

function showBossQuestion(question) {
  const egg = document.getElementById('easter-egg');
  egg.innerHTML = `<div style="font-size:20px">Boss攻击!</div><div style="font-size:28px;color:#ff00ff">${question.text}</div>`;
  egg.style.color = '#ff00ff';
  egg.classList.add('show');
  
  setTimeout(() => {
    egg.classList.remove('show');
    egg.style.color = '#ffd700';
  }, 3000);
}

function updateBossHUD() {
  if (!GameState.boss) return;
  
  const hpPercent = (GameState.boss.hp / GameState.boss.maxHp) * 100;
  document.querySelector('.boss-hp-fill').style.width = hpPercent + '%';
  document.querySelector('.boss-name').textContent = `年兽 Boss (Lv.${GameState.level})`;
}

// ==================== 题目生成 ====================
function generateQuestion() {
  const level = GameState.level;
  let a, b, op, answer;
  
  // Boss level - no regular questions
  if (GameState.isBossLevel) {
    document.getElementById('question').textContent = '击败 Boss!';
    document.getElementById('answer-display').textContent = '💥';
    GameState.currentAnswer = '';
    return;
  }

  if (level <= 5) {
    op = Math.random() > 0.5 ? '+' : '-';
    if (op === '+') {
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a + b;
    } else {
      a = Math.floor(Math.random() * 15) + 5;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
    }
  } else if (level <= 15) {
    const type = Math.random();
    if (type < 0.4) {
      op = '+';
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 50) + 10;
      answer = a + b;
    } else if (type < 0.7) {
      op = '-';
      a = Math.floor(Math.random() * 80) + 20;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
    } else {
      op = '×';
      a = Math.floor(Math.random() * 9) + 2;
      b = Math.floor(Math.random() * 9) + 2;
      answer = a * b;
    }
  } else {
    const type = Math.random();
    if (type < 0.25) {
      op = '+';
      a = Math.floor(Math.random() * 90) + 10;
      b = Math.floor(Math.random() * 90) + 10;
      answer = a + b;
    } else if (type < 0.5) {
      op = '-';
      a = Math.floor(Math.random() * 90) + 10;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
    } else if (type < 0.75) {
      op = '×';
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      answer = a * b;
    } else {
      op = '÷';
      b = Math.floor(Math.random() * 9) + 2;
      answer = Math.floor(Math.random() * 12) + 2;
      a = b * answer;
    }
  }

  GameState.correctAnswer = answer;
  document.getElementById('question').textContent = `${a} ${op} ${b} = ?`;
  document.getElementById('answer-display').textContent = '';
  GameState.currentAnswer = '';
}

// ==================== 方块系统 ====================
function createBlocks() {
  Composite.clear(engine.world);
  GameState.blocks = [];
  GameState.bullets = [];
  
  // Check for boss level
  if (GameState.level % 5 === 0) {
    GameState.isBossLevel = true;
    GameState.boss = new Boss(GameState.level);
    
    document.getElementById('boss-hud').classList.add('show');
    updateBossHUD();
    
    // Boss warning
    const warning = document.getElementById('boss-warning');
    warning.classList.add('show');
    playSound('bossWarning');
    setTimeout(() => warning.classList.remove('show'), 2000);
    
    generateQuestion();
    return;
  }
  
  GameState.isBossLevel = false;
  document.getElementById('boss-hud').classList.remove('show');

  const level = GameState.level;
  const count = Math.min(3 + level * 2, 20);

  if (level <= 3) {
    // Static grid
    const size = 40;
    const cols = 5;
    const rows = Math.ceil(count / cols);
    const gridWidth = cols * size;
    const startX = (CONFIG.width - gridWidth) / 2 + size / 2;
    const startY = 80;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      createSingleBlock(startX + col * size, startY + row * size, true, size);
    }
  } else if (level <= 10) {
    // Moving blocks
    const size = 40;
    const spacing = 50;
    const cols = 5;
    const rows = Math.ceil(count / cols);
    const gridWidth = cols * spacing;
    const startX = (CONFIG.width - gridWidth) / 2 + spacing / 2;
    const startY = 60;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const block = createSingleBlock(startX + col * spacing, startY + row * spacing, false, size);
      block.movePattern = 'horizontal';
      block.movePhase = i * 0.5;
    }
  } else {
    // Chaotic blocks with different patterns
    for (let i = 0; i < count; i++) {
      const x = 60 + Math.random() * (CONFIG.width - 120);
      const y = 40 + Math.random() * (CONFIG.height / 3);
      const block = createSingleBlock(x, y, false, 38);
      
      const patterns = ['sine', 'circle', 'fall'];
      block.movePattern = patterns[Math.floor(Math.random() * patterns.length)];
      block.movePhase = Math.random() * Math.PI * 2;
      block.originalX = x;
      block.originalY = y;
    }
  }
  
  generateQuestion();
}

function createSingleBlock(x, y, isStatic, size) {
  const isGold = Math.random() < 0.1;
  const hp = isGold ? 3 : (Math.random() > 0.7 ? 2 : 1);
  
  const block = Bodies.rectangle(x, y, size, size, {
    isStatic: isStatic,
    restitution: 0.3,
    friction: 0.1,
    frictionAir: 0.01,
    label: 'block',
    hp: hp,
    maxHp: hp,
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
  if (GameState.skills.freeze.active) return;
  
  const time = Date.now() / 1000;
  
  GameState.blocks.forEach(block => {
    if (!block.movePattern) return;
    
    switch(block.movePattern) {
      case 'horizontal':
        Body.setPosition(block, {
          x: block.originalX || block.position.x + Math.sin(time + block.movePhase) * 2,
          y: block.position.y
        });
        break;
      case 'sine':
        Body.setPosition(block, {
          x: (block.originalX || block.position.x) + Math.sin(time * 2 + block.movePhase) * 30,
          y: block.position.y + 0.5
        });
        break;
      case 'circle':
        const radius = 30;
        Body.setPosition(block, {
          x: (block.originalX || block.position.x) + Math.cos(time + block.movePhase) * radius,
          y: (block.originalY || block.position.y) + Math.sin(time + block.movePhase) * radius
        });
        break;
      case 'fall':
        // Falls faster
        Body.setVelocity(block, { x: block.velocity?.x || 0, y: 2 });
        break;
    }
  });
  
  // Update boss
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
    document.getElementById('fever-indicator').classList.add('show');
    setTimeout(() => {
      document.getElementById('fever-indicator').classList.remove('show');
    }, 1000);
  }
  
  // Check achievements
  if (GameState.combo >= 5) unlockAchievement('combo5');
  if (GameState.combo >= 10) unlockAchievement('combo10');
  if (GameState.combo > GameState.maxCombo) {
    GameState.maxCombo = GameState.combo;
  }
}

function triggerNuke(count) {
  const flash = document.getElementById('nuke-flash');
  flash.classList.add('show');
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
      awardCoins(block);
      Composite.remove(engine.world, block);
    }
  });
  
  GameState.blocks = GameState.blocks.filter(block => {
    const dx = block.position.x - centerX;
    const dy = block.position.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist >= clearRadius + 100;
  });
  
  setTimeout(() => flash.classList.remove('show'), 300);
}

function triggerNukeEffect() {
  const flash = document.getElementById('nuke-flash');
  flash.classList.add('show');
  setTimeout(() => flash.classList.remove('show'), 500);
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
  
  // Plane type modifiers
  const speed = GameState.isFever ? CONFIG.bulletSpeed * 1.5 : CONFIG.bulletSpeed;
  const interval = GameState.isFever ? 30 : 60;
  
  // Power type fires more
  if (GameState.planeType === 'power') {
    bulletCount = Math.ceil(count * 1.5);
  }

  // Fire pattern based on upgrade
  const firePattern = () => {
    const penetrate = GameState.isPenetrate || GameState.skills.penetrateBuff;
    
    switch(upgrade) {
      case 1: // Dual
        createBullet(GameState.planeX - 10, CONFIG.planeY - 20, 0, -speed, penetrate);
        createBullet(GameState.planeX + 10, CONFIG.planeY - 20, 0, -speed, penetrate);
        break;
      case 2: // Triple
        createBullet(GameState.planeX - 15, CONFIG.planeY - 20, -0.5, -speed, penetrate);
        createBullet(GameState.planeX, CONFIG.planeY - 20, 0, -speed, penetrate);
        createBullet(GameState.planeX + 15, CONFIG.planeY - 20, 0.5, -speed, penetrate);
        break;
      case 3: // Quad
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

function createCoinFloat(x, y) {
  const el = document.createElement('div');
  el.className = 'coin-float';
  el.textContent = '+🪙';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function awardCoins(block) {
  const coins = block.isGold ? 5 : 1;
  GameState.coins += coins;
  GameState.totalKills++;
  
  if (GameState.coins >= 100) unlockAchievement('rich');
  if (GameState.totalKills >= 1) unlockAchievement('firstBlood');
  
  createCoinFloat(block.position.x, block.position.y);
  playSound('coin');
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

    // Bullet vs Block
    if ((isAttackA && isBlockB) || (isAttackB && isBlockA)) {
      const bullet = isAttackA ? bodyA : bodyB;
      const block = isBlockA ? bodyA : bodyB;

      // Handle penetration
      if (bullet.isPenetrate && bullet.penetrateCount > 0) {
        bullet.penetrateCount--;
      } else {
        Composite.remove(engine.world, bullet);
        GameState.bullets = GameState.bullets.filter(b => b !== bullet);
      }

      // Damage block
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
    
    // Bullet vs Boss
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

// ==================== 输入处理 ====================
document.querySelectorAll('.key').forEach(key => {
  key.addEventListener('click', (e) => {
    if (GameState.isGameOver || GameState.isShopOpen) return;

    const num = e.target.dataset.num;
    const action = e.target.dataset.action;

    if (num !== undefined) {
      if (GameState.currentAnswer.length < 2) {
        GameState.currentAnswer += num;
        document.getElementById('answer-display').textContent = GameState.currentAnswer;

        clearTimeout(GameState.submitTimer);
        GameState.submitTimer = setTimeout(() => {
          if (GameState.currentAnswer.length > 0) checkAnswer();
        }, 600);
      }
    } else if (action === 'clear') {
      GameState.currentAnswer = '';
      document.getElementById('answer-display').textContent = '';
      clearTimeout(GameState.submitTimer);
    }
  });
});

function checkAnswer() {
  const userAnswer = parseInt(GameState.currentAnswer);
  if (isNaN(userAnswer)) return;

  GameState.attempts++;
  GameState.stats.correctAnswers++;
  updateHUD();

  if (userAnswer === GameState.correctAnswer) {
    playSound('correct');
    updateCombo(true);
    fireBullets(userAnswer);
    
    setTimeout(() => {
      if (!GameState.isGameOver) generateQuestion();
    }, 400);
  } else {
    playSound('wrong');
    GameState.stats.wrongAnswers++;
    updateCombo(false);
    document.getElementById('answer-display').style.color = '#ff4444';
    setTimeout(() => {
      document.getElementById('answer-display').style.color = '#ffd700';
      GameState.currentAnswer = '';
      document.getElementById('answer-display').textContent = '';
    }, 400);
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
      document.getElementById('combo-text').textContent = text;
    }

    document.getElementById('combo-count').textContent = GameState.combo;
    comboEl.style.color = '#ff6b6b';
  } else {
    GameState.combo = 0;
    GameState.upgradeLevel = 0;
    document.getElementById('combo-text').textContent = '';
    document.getElementById('combo-count').textContent = '0';
    comboEl.style.color = '#666';
  }
}

// ==================== HUD更新 ====================
function updateHUD() {
  document.getElementById('level').textContent = GameState.level;
  document.getElementById('lives').textContent = '❤️'.repeat(GameState.lives) || '💔';
  document.getElementById('coins').textContent = GameState.coins;
}

// ==================== 游戏状态检查 ====================
function checkGameState() {
  // Check blocks falling
  GameState.blocks.forEach(block => {
    if (block.position.y > CONFIG.height - 80) {
      if (GameState.skills.shield.active) {
        GameState.skills.shield.hits--;
        if (GameState.skills.shield.hits <= 0) {
          GameState.skills.shield.active = false;
          document.querySelector('.shield-overlay').classList.remove('show');
        }
        Composite.remove(engine.world, block);
        GameState.blocks = GameState.blocks.filter(b => b !== block);
      } else {
        GameState.lives--;
        updateHUD();
        Composite.remove(engine.world, block);
        GameState.blocks = GameState.blocks.filter(b => b !== block);
        
        if (GameState.lives <= 0) {
          gameOver(false);
        }
      }
    }
  });

  // Level clear check
  if (!GameState.isBossLevel && GameState.blocks.length === 0 && !GameState.isGameOver) {
    levelComplete();
  } else if (GameState.isBossLevel && !GameState.boss && !GameState.isGameOver) {
    levelComplete();
  }

  // Clean bullets
  GameState.bullets = GameState.bullets.filter(bullet => {
    if (bullet.position.y < -50) {
      Composite.remove(engine.world, bullet);
      return false;
    }
    return true;
  });
  
  // Update moving blocks
  updateBlocks();
}

function levelComplete() {
  if (GameState.isPaused) return;
  
  GameState.isPaused = true;
  if (GameState.fireInterval) {
    clearInterval(GameState.fireInterval);
    GameState.fireInterval = null;
  }

  const egg = document.getElementById('easter-egg');
  egg.innerHTML = `<div>第 ${GameState.level} 关</div><div style="color:#00ff00">通关!</div>`;
  egg.classList.add('show');

  setTimeout(() => {
    GameState.level++;
    if (GameState.level > 10) unlockAchievement('survivor');
    
    GameState.attempts = 0;
    GameState.combo = 0;
    GameState.upgradeLevel = 0;
    document.getElementById('combo-text').textContent = '';
    
    updateHUD();
    createBlocks();
    GameState.isPaused = false;

    setTimeout(() => egg.classList.remove('show'), 1000);
  }, 1200);
}

function gameOver(isWin) {
  GameState.isGameOver = true;
  if (GameState.fireInterval) {
    clearInterval(GameState.fireInterval);
  }
  
  const overlay = document.getElementById('overlay');
  const unlockedAchievements = Object.values(Achievements).filter(a => a.unlocked);
  
  overlay.innerHTML = `
    <h1>${isWin ? '🎉 胜利!' : '💥 游戏结束'}</h1>
    <div class="subtitle">到达关卡: ${GameState.level} | 最高连击: ${GameState.maxCombo}</div>
    <div class="features">
      <p>总击杀: <span>${GameState.totalKills}</span> | 金币: <span>${GameState.coins}</span></p>
      <p>Boss击败: <span>${GameState.stats.bossKilled}</span></p>
    </div>
    <div class="achievements-showcase">
      ${Object.values(Achievements).map(a => 
        `<span class="achievement-badge ${a.unlocked ? 'unlocked' : ''}" title="${a.name}">${a.icon}</span>`
      ).join('')}
    </div>
    <button class="btn" onclick="resetGame()">再玩一次</button>
  `;
  overlay.style.display = 'flex';
}

// ==================== 渲染系统 ====================
function render() {
  ctx.save();
  
  // Screen shake
  if (GameState.shakeFrames > 0) {
    const shakeX = (Math.random() - 0.5) * 6;
    const shakeY = (Math.random() - 0.5) * 6;
    ctx.translate(shakeX, shakeY);
    GameState.shakeFrames--;
  } else if (GameState.combo >= 3) {
    const shakeX = (Math.random() - 0.5) * 2;
    const shakeY = (Math.random() - 0.5) * 2;
    ctx.translate(shakeX, shakeY);
  }
  
  // Clear canvas
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  
  // Draw grid background
  ctx.strokeStyle = 'rgba(255,255,255,0.02)';
  ctx.lineWidth = 1;
  for (let i = 0; i < CONFIG.width; i += 30) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, CONFIG.height);
    ctx.stroke();
  }

  // Draw plane
  drawPlane(GameState.planeX, CONFIG.planeY);
  
  // Draw boss
  if (GameState.boss) {
    GameState.boss.draw(ctx);
  }
  
  // Draw blocks
  GameState.blocks.forEach(block => drawBlock(block));
  
  // Draw bullets
  GameState.bullets.forEach(bullet => {
    ctx.fillStyle = bullet.render.fillStyle;
    ctx.shadowBlur = bullet.isPenetrate ? 15 : 0;
    ctx.shadowColor = '#ffaa00';
    ctx.beginPath();
    ctx.arc(bullet.position.x, bullet.position.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Trail
    ctx.fillStyle = 'rgba(255,215,0,0.3)';
    ctx.fillRect(bullet.position.x - 2, bullet.position.y + 5, 4, 15);
  });
  
  // Draw particles
  GameState.particles = GameState.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
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
  
  // Draw damage numbers
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
  
  ctx.restore();
}

function drawPlane(x, y) {
  ctx.save();
  ctx.translate(x, y);
  
  // Different plane colors based on type
  const colors = {
    balanced: { body: '#ff4444', wing: '#cc3333' },
    speed: { body: '#4488ff', wing: '#3366cc' },
    power: { body: '#ff8800', wing: '#cc6600' }
  };
  const c = colors[GameState.planeType];
  
  // Wings
  ctx.fillStyle = c.wing;
  ctx.fillRect(-30, 0, 60, 18);
  
  // Body
  ctx.fillStyle = c.body;
  ctx.fillRect(-12, -25, 24, 50);
  
  // Cockpit
  ctx.fillStyle = CONFIG.colors.planeWindow;
  ctx.fillRect(-8, -18, 16, 14);
  
  // Engine glow
  if (GameState.combo >= 3) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff6600';
  }
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(-8, 22, 16, 8);
  ctx.shadowBlur = 0;
  
  // Upgrade guns
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
  const size = 35;
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(block.angle);
  
  // Glow for gold blocks
  if (block.isGold) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffd700';
  }
  
  ctx.fillStyle = block.render.fillStyle;
  ctx.fillRect(-size/2, -size/2, size, size);
  ctx.shadowBlur = 0;
  
  // Border
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(-size/2, -size/2, size, size);
  
  // HP indicator
  if (block.hp < block.maxHp) {
    ctx.fillStyle = '#000';
    ctx.fillRect(-size/2, -size/2 - 10, size, 5);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(-size/2, -size/2 - 10, size * (block.hp / block.maxHp), 5);
  }
  
  // Gold indicator
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

const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

// Only add listeners if buttons exist (for backward compatibility)
if (btnLeft && btnRight) {
  btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); moveLeft = true; });
  btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); moveLeft = false; });
  btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); moveRight = true; });
  btnRight.addEventListener('touchend', (e) => { e.preventDefault(); moveRight = false; });
  btnLeft.addEventListener('mousedown', () => moveLeft = true);
  btnLeft.addEventListener('mouseup', () => moveLeft = false);
  btnRight.addEventListener('mousedown', () => moveRight = true);
  btnRight.addEventListener('mouseup', () => moveRight = false);
}

// Touch controls
document.getElementById('touch-left').addEventListener('touchstart', (e) => {
  e.preventDefault();
  moveLeft = true;
  document.querySelectorAll('.touch-hint').forEach(h => h.style.opacity = '0');
});
document.getElementById('touch-left').addEventListener('touchend', (e) => {
  e.preventDefault();
  moveLeft = false;
});
document.getElementById('touch-right').addEventListener('touchstart', (e) => {
  e.preventDefault();
  moveRight = true;
  document.querySelectorAll('.touch-hint').forEach(h => h.style.opacity = '0');
});
document.getElementById('touch-right').addEventListener('touchend', (e) => {
  e.preventDefault();
  moveRight = false;
});

// Auto aim toggle
function toggleAimMode() {
  GameState.autoAim = !GameState.autoAim;
  const modeText = GameState.autoAim ? '自动' : '手动';
  document.getElementById('aim-mode').textContent = modeText;
  
  const toggleBtn = document.getElementById('aim-toggle');
  toggleBtn.style.background = GameState.autoAim ? 'rgba(0,255,0,0.4)' : 'rgba(255,215,0,0.3)';
}

// Sound toggle
function toggleSound() {
  GameState.soundEnabled = !GameState.soundEnabled;
  const icon = document.getElementById('sound-icon');
  const text = document.getElementById('sound-text');
  const btn = document.getElementById('sound-toggle');
  
  if (GameState.soundEnabled) {
    icon.textContent = '🔊';
    text.textContent = '开启';
    btn.style.background = 'rgba(0,255,255,0.2)';
  } else {
    icon.textContent = '🔇';
    text.textContent = '关闭';
    btn.style.background = 'rgba(100,100,100,0.3)';
  }
}

// Plane movement
setInterval(() => {
  if (GameState.isGameOver || GameState.isPaused) return;
  
  const speed = GameState.planeType === 'speed' ? 12 : 8;
  
  if (GameState.autoAim && GameState.blocks.length > 0) {
    let targetBlock = GameState.blocks.reduce((lowest, block) => 
      block.position.y > lowest.position.y ? block : lowest, GameState.blocks[0]);
    
    const diff = targetBlock.position.x - GameState.planeX;
    GameState.planeX += diff * 0.12;
  } else {
    if (moveLeft && GameState.planeX > 40) GameState.planeX -= speed;
    if (moveRight && GameState.planeX < CONFIG.width - 40) GameState.planeX += speed;
  }
  
  GameState.planeX = Math.max(40, Math.min(CONFIG.width - 40, GameState.planeX));
}, 16);

// Prevent page scroll
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// Window resize
window.addEventListener('resize', () => {
  CONFIG.width = window.innerWidth;
  CONFIG.height = window.innerHeight;
  CONFIG.planeY = window.innerHeight - 200;
  canvas.width = CONFIG.width;
  canvas.height = CONFIG.height;
});

// ==================== 游戏控制 ====================
function startGame() {
  document.getElementById('overlay').style.display = 'none';
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
  GameState.lives = 3;
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
  GameState.boss = null;
  GameState.isBossLevel = false;
  GameState.skills = { freeze: { active: false }, shield: { active: false, hits: 0 }, bomb: { count: 0 } };
  
  document.getElementById('shop-panel').classList.remove('show');
  document.getElementById('combo-text').textContent = '';
  document.getElementById('nuke-flash').classList.remove('show');
  document.querySelector('.freeze-overlay').classList.remove('show');
  document.querySelector('.shield-overlay').classList.remove('show');
  document.getElementById('boss-hud').classList.remove('show');
  
  Composite.clear(engine.world);
  createBlocks();
  updateHUD();
}

// Export for HTML access
window.startGame = startGame;
window.resetGame = resetGame;
window.toggleAimMode = toggleAimMode;
window.toggleSound = toggleSound;
window.toggleShop = toggleShop;
