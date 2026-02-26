// 数学飞机大战 - 狂暴模式版
// 游戏配置
const config = {
  width: window.innerWidth,
  height: window.innerHeight,
  planeY: window.innerHeight - 170 - 120,
  bulletSpeed: 8,
  colors: {
    plane: '#ff4444',
    planeWindow: '#ffd700',
    bullet: '#ffd700',
    block1: '#ff6b6b',
    block2: '#4ecdc4',
    block3: '#ffe66d',
    easter: '#ff0000'
  }
};

const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const touchLeft = document.getElementById('touch-left');
const touchRight = document.getElementById('touch-right');

let hasUsedTouch = false;

function setupControls(element, isLeft) {
  const startHandler = (e) => {
    e.preventDefault();
    if (isLeft) moveLeft = true;
    else moveRight = true;

    btnLeft.style.opacity = '0';
    btnRight.style.opacity = '0';
    btnLeft.style.pointerEvents = 'none';
    btnRight.style.pointerEvents = 'none';

    if (!hasUsedTouch) {
      hasUsedTouch = true;
      document.querySelectorAll('.touch-hint').forEach(hint => {
        hint.style.opacity = '0';
      });
      setTimeout(() => {
        document.querySelectorAll('.touch-hint').forEach(hint => {
          hint.style.display = 'none';
        });
      }, 3000);
    }
  };

  const endHandler = (e) => {
    e.preventDefault();
    if (isLeft) moveLeft = false;
    else moveRight = false;

    btnLeft.style.opacity = '1';
    btnRight.style.opacity = '1';
    btnLeft.style.pointerEvents = 'auto';
    btnRight.style.pointerEvents = 'auto';
  };

  element.addEventListener('touchstart', startHandler);
  element.addEventListener('touchend', endHandler);
  element.addEventListener('mousedown', startHandler);
  element.addEventListener('mouseup', endHandler);
  element.addEventListener('mouseleave', endHandler);
}

setupControls(btnLeft, true);
setupControls(btnRight, false);
setupControls(touchLeft, true);
setupControls(touchRight, false);

// 游戏状态
let gameState = {
  level: 1,
  attempts: 0,
  lives: 3,
  combo: 0,
  currentAnswer: '',
  correctAnswer: 0,
  isGameOver: false,
  isPaused: true,
  planeX: config.width / 2,
  isTransitioning: false,
  bullets: [],
  blocks: [],
  particles: [],
  easterEggActive: false,
  upgradeLevel: 0,
  fireInterval: null,
  autoAim: false,
  submitTimer: null,
  soundEnabled: true,
  isFever: false,
  isPenetrate: false,
  shakeFrames: 0
};

// Matter.js 模块
const Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Events = Matter.Events,
  Vector = Matter.Vector;

// 创建引擎
const engine = Engine.create();
engine.gravity.y = 0.05;

// Canvas设置
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = config.width;
canvas.height = config.height;

// 数学题目生成器
function generateQuestion() {
  const level = gameState.level;
  let a, b, op, answer;

  if (level <= 10) {
    op = Math.random() > 0.5 ? '+' : '-';
    if (op === '+') {
      a = Math.floor(Math.random() * 15) + 1;
      b = Math.floor(Math.random() * (20 - a)) + 1;
      answer = a + b;
    } else {
      a = Math.floor(Math.random() * 15) + 5;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
    }
  } else if (level <= 20) {
    const type = Math.random();
    if (type < 0.4) {
      op = '+';
      a = Math.floor(Math.random() * 80) + 10;
      b = Math.floor(Math.random() * (100 - a)) + 1;
      answer = a + b;
    } else if (type < 0.8) {
      op = '-';
      a = Math.floor(Math.random() * 80) + 20;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
    } else {
      op = '×';
      a = Math.floor(Math.random() * 8) + 2;
      b = Math.floor(Math.random() * 8) + 2;
      answer = a * b;
    }
  } else {
    const type = Math.random();
    if (type < 0.3) {
      op = '+';
      a = Math.floor(Math.random() * 90) + 10;
      b = Math.floor(Math.random() * (100 - a)) + 1;
      answer = a + b;
    } else if (type < 0.6) {
      op = '-';
      a = Math.floor(Math.random() * 90) + 10;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
    } else if (type < 0.8) {
      op = '×';
      a = Math.floor(Math.random() * 9) + 2;
      b = Math.floor(Math.random() * 9) + 2;
      answer = a * b;
    } else {
      op = '÷';
      b = Math.floor(Math.random() * 8) + 2;
      answer = Math.floor(Math.random() * 9) + 2;
      a = b * answer;
    }
  }

  gameState.correctAnswer = answer;
  document.getElementById('question').textContent = `${a} ${op} ${b} = ?`;
  document.getElementById('answer-display').textContent = '';
  gameState.currentAnswer = '';
  checkEasterEgg();
}

function checkEasterEgg() {
  if (gameState.combo >= 3 && Math.random() < 0.05) {
    gameState.easterEggActive = true;
    const egg = document.getElementById('easter-egg');
    egg.textContent = ['🧧 红包模式！', '🎆 烟花助阵！', '🐲 龙年大吉！'][Math.floor(Math.random() * 3)];
    egg.classList.add('show');
    setTimeout(() => egg.classList.remove('show'), 2000);
  } else {
    gameState.easterEggActive = false;
  }
}

function createBlocks() {
  Composite.clear(engine.world);
  gameState.blocks = [];

  const level = gameState.level;
  const count = Math.min(3 + level * 2, 25);

  if (level <= 5) {
    const size = 35;
    const cols = 5;
    const rows = Math.ceil(count / cols);
    const gridWidth = cols * size;
    const startX = (config.width - gridWidth) / 2 + size / 2;
    const startY = 80;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * size;
      const y = startY + row * size;
      createSingleBlock(x, y, true, size);
    }
  } else if (level <= 15) {
    const size = 38;
    const spacing = 45;
    const cols = 5;
    const rows = Math.ceil(count / cols);
    const gridWidth = cols * spacing;
    const startX = (config.width - gridWidth) / 2 + spacing / 2;
    const startY = 70;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * spacing;
      const y = startY + row * spacing;
      createSingleBlock(x, y, false, size);
    }
  } else {
    for (let i = 0; i < count; i++) {
      const x = 60 + Math.random() * (config.width - 120);
      const y = 40 + Math.random() * (config.height / 2.5);
      createSingleBlock(x, y, false, 35);
    }
  }
}

function createSingleBlock(x, y, isStatic, size) {
  const isEaster = gameState.easterEggActive && Math.random() < 0.3;

  const block = Bodies.rectangle(x, y, size, size, {
    isStatic: isStatic,
    restitution: 0.2,
    friction: 0.1,
    frictionAir: 0.02,
    label: 'block',
    hp: isEaster ? 1 : (Math.random() > 0.7 ? 2 : 1),
    maxHp: isEaster ? 1 : (Math.random() > 0.7 ? 2 : 1),
    isEaster: isEaster,
    render: {
      fillStyle: isEaster ? '#ff0000' : (Math.random() > 0.6 ? '#ff6b6b' : '#4ecdc4')
    },
    collisionFilter: {
      group: 0,
      category: 0x0001,
      mask: 0xFFFFFFFF
    }
  });

  gameState.blocks.push(block);
  Composite.add(engine.world, block);
}

// 狂暴模式功能
function updateFeverMode() {
  const wasFever = gameState.isFever;
  gameState.isFever = gameState.combo >= 3;
  gameState.isPenetrate = gameState.combo >= 5;
  
  if (gameState.isFever && !wasFever) {
    gameState.shakeFrames = 30;
  }
}

function triggerNuke(count) {
  const flash = document.getElementById('nuke-flash');
  flash.classList.add('show');
  playSound('nuke');
  
  const clearRadius = (count * 0.2) * Math.min(config.width, config.height) / 100;
  const centerX = config.width / 2;
  const centerY = config.height / 2;
  
  gameState.blocks.forEach(block => {
    const dx = block.position.x - centerX;
    const dy = block.position.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < clearRadius + 100) {
      createParticles(block.position.x, block.position.y, '#ffd700', 20);
      Composite.remove(engine.world, block);
    }
  });
  
  gameState.blocks = gameState.blocks.filter(block => {
    const dx = block.position.x - centerX;
    const dy = block.position.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist >= clearRadius + 100;
  });
  
  setTimeout(() => {
    flash.classList.remove('show');
  }, 300);
}

function fireBullets(count) {
  updateFeverMode();
  
  if (count >= 20) {
    triggerNuke(count);
  }
  
  playSound('shoot');

  if (gameState.fireInterval) {
    clearInterval(gameState.fireInterval);
  }

  const upgrade = gameState.upgradeLevel;
  let bulletCount = count;
  
  const speed = gameState.isFever ? config.bulletSpeed * 1.5 : config.bulletSpeed;
  const interval = gameState.isFever ? 40 : 80;

  if (upgrade === 1) {
    bulletCount = Math.ceil(count / 2);
    createBullet(gameState.planeX - 6, config.planeY - 20, 0, -speed, gameState.isPenetrate);
    createBullet(gameState.planeX + 6, config.planeY - 20, 0, -speed, gameState.isPenetrate);
  } else if (upgrade === 2) {
    bulletCount = Math.ceil(count / 3);
    createBullet(gameState.planeX - 15, config.planeY - 20, 0, -speed, gameState.isPenetrate);
    createBullet(gameState.planeX, config.planeY - 20, 0, -speed, gameState.isPenetrate);
    createBullet(gameState.planeX + 15, config.planeY - 20, 0, -speed, gameState.isPenetrate);
  } else if (upgrade === 3) {
    bulletCount = Math.ceil(count / 4);
    createBullet(gameState.planeX - 15, config.planeY - 20, 0, -speed, gameState.isPenetrate);
    createBullet(gameState.planeX - 5, config.planeY - 20, 0, -speed, gameState.isPenetrate);
    createBullet(gameState.planeX + 5, config.planeY - 20, 0, -speed, gameState.isPenetrate);
    createBullet(gameState.planeX + 15, config.planeY - 20, 0, -speed, gameState.isPenetrate);
  } else {
    createBullet(gameState.planeX, config.planeY - 20, 0, -speed, gameState.isPenetrate);
  }

  let fired = 0;
  gameState.fireInterval = setInterval(() => {
    if (fired >= bulletCount || gameState.isGameOver) {
      clearInterval(gameState.fireInterval);
      gameState.fireInterval = null;
      return;
    }

    if (upgrade === 1) {
      createBullet(gameState.planeX - 6, config.planeY - 20, 0, -speed, gameState.isPenetrate);
      createBullet(gameState.planeX + 6, config.planeY - 20, 0, -speed, gameState.isPenetrate);
    } else if (upgrade === 2) {
      createBullet(gameState.planeX - 15, config.planeY - 20, 0, -speed, gameState.isPenetrate);
      createBullet(gameState.planeX, config.planeY - 20, 0, -speed, gameState.isPenetrate);
      createBullet(gameState.planeX + 15, config.planeY - 20, 0, -speed, gameState.isPenetrate);
    } else if (upgrade === 3) {
      createBullet(gameState.planeX - 15, config.planeY - 20, 0, -speed, gameState.isPenetrate);
      createBullet(gameState.planeX - 5, config.planeY - 20, 0, -speed, gameState.isPenetrate);
      createBullet(gameState.planeX + 5, config.planeY - 20, 0, -speed, gameState.isPenetrate);
      createBullet(gameState.planeX + 15, config.planeY - 20, 0, -speed, gameState.isPenetrate);
    } else {
      createBullet(gameState.planeX, config.planeY - 20, 0, -speed, gameState.isPenetrate);
    }
    fired++;
  }, interval);
}

function createBullet(x, y, vx, vy, isPenetrate = false) {
  const bulletColor = gameState.isFever ? '#ffaa00' : config.colors.bullet;
  const bulletWidth = isPenetrate ? 10 : 6;
  const bulletHeight = isPenetrate ? 20 : 16;
  
  const bullet = Bodies.rectangle(x, y, bulletWidth, bulletHeight, {
    isStatic: false,
    frictionAir: 0,
    restitution: 0,
    label: 'bullet',
    isPenetrate: isPenetrate,
    penetrateCount: isPenetrate ? 2 : 0,
    render: { fillStyle: bulletColor }
  });
  
  bullet.collisionFilter = {
    group: -1,
    category: 0x0002,
    mask: 0x0001
  };

  Matter.Body.setVelocity(bullet, { x: vx, y: vy });
  gameState.bullets.push(bullet);
  Composite.add(engine.world, bullet);
}

function createParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const speed = 3 + Math.random() * 3;
    const particle = {
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 30,
      color: color,
      size: 3 + Math.random() * 3
    };
    gameState.particles.push(particle);
  }
}

// 碰撞检测
Events.on(engine, 'collisionStart', (event) => {
  const pairs = event.pairs;

  pairs.forEach(pair => {
    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;

    const isAttackA = (bodyA.label === 'bullet' || bodyA.label === 'laser');
    const isAttackB = (bodyB.label === 'bullet' || bodyB.label === 'laser');
    const isBlockA = (bodyA.label === 'block');
    const isBlockB = (bodyB.label === 'block');

    if ((isAttackA && isBlockB) || (isAttackB && isBlockA)) {
      const attack = isAttackA ? bodyA : bodyB;
      const block = isBlockA ? bodyA : bodyB;

      if (attack.label === 'bullet') {
        if (attack.isPenetrate && attack.penetrateCount > 0) {
          attack.penetrateCount--;
        } else if (!attack.isPenetrate || attack.penetrateCount <= 0) {
          Composite.remove(engine.world, attack);
          gameState.bullets = gameState.bullets.filter(b => b !== attack);
        }
      }

      if (!block.hasOwnProperty('lastHitTime') || Date.now() - block.lastHitTime > 200) {
        block.hp--;
        block.lastHitTime = Date.now();
        createParticles(block.position.x, block.position.y, block.render.fillStyle, 5);

        if (block.hp <= 0) {
          Composite.remove(engine.world, block);
          gameState.blocks = gameState.blocks.filter(b => b !== block);
          createParticles(block.position.x, block.position.y, '#ffd700', 15);

          if (block.isEaster) {
            gameState.lives = Math.min(gameState.lives + 1, 5);
            updateHUD();
          }
        } else {
          playSound('hit');
        }
      }
    }
  });
});

function updateCombo(isCorrect) {
  const comboEl = document.getElementById('combo');
  const comboCount = document.getElementById('combo-count');
  const comboText = document.getElementById('combo-text');

  if (isCorrect) {
    gameState.combo++;
    comboEl.classList.add('show');
    setTimeout(() => {
      comboEl.classList.remove('show');
    }, 2000);

    let newUpgrade = 0;
    let text = '';
    if (gameState.combo >= 8) {
      newUpgrade = 3;
      text = '四连发！';
    } else if (gameState.combo >= 5) {
      newUpgrade = 2;
      text = '三连发！';
    } else if (gameState.combo >= 3) {
      newUpgrade = 1;
      text = '双发！';
    }

    if (newUpgrade > gameState.upgradeLevel) {
      gameState.upgradeLevel = newUpgrade;
      comboText.textContent = text;
      comboEl.style.color = '#ffd700';
    } else {
      comboText.textContent = '';
      comboEl.style.color = '#ff6b6b';
    }

    comboCount.textContent = gameState.combo;
    comboEl.classList.add('show');
  } else {
    gameState.combo = 0;
    gameState.upgradeLevel = 0;
    comboEl.classList.remove('show');
  }
}

function updateHUD() {
  document.getElementById('level').textContent = gameState.level;
  document.getElementById('attempts').textContent = gameState.attempts;
  document.getElementById('lives').textContent = '❤️'.repeat(gameState.lives);
}

function checkGameState() {
  gameState.blocks.forEach(block => {
    if (block.position.y > config.height - 100) {
      gameState.lives--;
      updateHUD();
      Composite.remove(engine.world, block);
      gameState.blocks = gameState.blocks.filter(b => b !== block);

      if (gameState.lives <= 0) {
        gameOver(false);
      }
    }
  });

  if (gameState.blocks.length === 0 && !gameState.isGameOver) {
    levelComplete();
  }

  gameState.bullets = gameState.bullets.filter(bullet => {
    if (bullet.position.y < -50 || bullet.position.y > config.height + 50) {
      Composite.remove(engine.world, bullet);
      return false;
    }
    return true;
  });
}

function levelComplete() {
  if (gameState.isTransitioning) return;
  gameState.isTransitioning = true;

  if (gameState.fireInterval) {
    clearInterval(gameState.fireInterval);
    gameState.fireInterval = null;
  }

  gameState.bullets.forEach(bullet => {
    Composite.remove(engine.world, bullet);
  });
  gameState.bullets = [];

  gameState.isPaused = true;

  const egg = document.getElementById('easter-egg');
  egg.textContent = `第 ${gameState.level} 关通过！`;
  egg.style.color = '#00ff00';
  egg.classList.add('show');

  setTimeout(() => {
    gameState.level++;
    gameState.attempts = 0;
    updateHUD();
    createBlocks();
    generateQuestion();
    gameState.isPaused = false;
    gameState.isTransitioning = false;

    setTimeout(() => {
      egg.classList.remove('show');
      egg.style.color = '#ffd700';
    }, 1000);
  }, 800);
}

function gameOver(isWin) {
  gameState.isGameOver = true;
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <h1>${isWin ? '🎉 胜利！' : '💥 游戏结束'}</h1>
    <p>到达关卡: ${gameState.level}<br>总答题次数: ${gameState.attempts}</p>
    <button class="btn" onclick="resetGame()">再玩一次</button>
  `;
}

function resetGame() {
  if (gameState.fireInterval) {
    clearInterval(gameState.fireInterval);
  }
  
  const flash = document.getElementById('nuke-flash');
  if (flash) flash.classList.remove('show');
  
  gameState = {
    level: 1,
    attempts: 0,
    lives: 3,
    combo: 0,
    currentAnswer: '',
    correctAnswer: 0,
    isGameOver: false,
    isPaused: false,
    isTransitioning: false,
    planeX: config.width / 2,
    bullets: [],
    blocks: [],
    particles: [],
    easterEggActive: false,
    upgradeLevel: 0,
    fireInterval: null,
    autoAim: false,
    submitTimer: null,
    soundEnabled: gameState.soundEnabled,
    isFever: false,
    isPenetrate: false,
    shakeFrames: 0
  };

  Composite.clear(engine.world);
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('combo').classList.remove('show');

  createBlocks();
  generateQuestion();
  updateHUD();
}

function startGame() {
  document.getElementById('overlay').style.display = 'none';
  gameState.isPaused = false;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  resetGame();
  gameLoop();
}

function render() {
  ctx.save();
  
  if (gameState.shakeFrames > 0) {
    const shakeX = (Math.random() - 0.5) * 4;
    const shakeY = (Math.random() - 0.5) * 4;
    ctx.translate(shakeX, shakeY);
    gameState.shakeFrames--;
  } else if (gameState.combo >= 3 && gameState.combo < 5) {
    const shakeX = (Math.random() - 0.5) * 2;
    const shakeY = (Math.random() - 0.5) * 2;
    ctx.translate(shakeX, shakeY);
  }
  
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, config.width, config.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < config.width; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, config.height);
    ctx.stroke();
  }
  for (let i = 0; i < config.height; i += 20) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(config.width, i);
    ctx.stroke();
  }

  drawPixelPlane(gameState.planeX, config.planeY);

  gameState.blocks.forEach(block => {
    drawPixelBlock(block);
  });

  gameState.bullets.forEach(bullet => {
    if (bullet.label === 'laser') {
      ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
      ctx.fillRect(bullet.position.x - 5, bullet.bounds.min.y, 10, bullet.bounds.max.y - bullet.bounds.min.y);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(bullet.position.x - 2, bullet.bounds.min.y, 4, bullet.bounds.max.y - bullet.bounds.min.y);
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff0000';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(bullet.position.x - 8, bullet.bounds.min.y, 16, bullet.bounds.max.y - bullet.bounds.min.y);
      ctx.shadowBlur = 0;
    } else {
      const isPenetrate = bullet.isPenetrate;
      const bulletWidth = isPenetrate ? 5 : 3;
      const bulletHeight = isPenetrate ? 10 : 8;
      
      if (isPenetrate) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffaa00';
      }
      
      ctx.fillStyle = bullet.render.fillStyle;
      ctx.fillRect(bullet.position.x - bulletWidth, bullet.position.y - bulletHeight, bulletWidth * 2, bulletHeight * 2);
      
      ctx.shadowBlur = 0;
      
      const tailLength = isPenetrate ? 20 : 10;
      ctx.fillStyle = isPenetrate ? 'rgba(255,170,0,0.5)' : 'rgba(255,215,0,0.4)';
      ctx.fillRect(bullet.position.x - bulletWidth + 1, bullet.position.y + bulletHeight, (bulletWidth - 1) * 2, tailLength);
    }
  });

  gameState.particles = gameState.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    p.vy += 0.2;

    if (p.life > 0) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 30;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.globalAlpha = 1;
      return true;
    }
    return false;
  });
  
  ctx.restore();
}

function drawPixelPlane(x, y) {
  ctx.save();
  ctx.translate(x, y);

  if (gameState.upgradeLevel >= 2) {
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-30, -150);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, -150);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(30, -150);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = config.colors.plane;
  ctx.fillRect(-15, -20, 30, 40);
  ctx.fillRect(-25, 0, 50, 15);
  ctx.fillStyle = config.colors.planeWindow;
  ctx.fillRect(-8, -15, 16, 12);
  ctx.fillStyle = config.colors.plane;
  ctx.fillRect(-10, 15, 20, 10);

  if (gameState.upgradeLevel >= 1) {
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-20, -25, 6, 10);
    ctx.fillRect(14, -25, 6, 10);
  }

  ctx.restore();
}

function drawPixelBlock(block) {
  const x = block.position.x;
  const y = block.position.y;
  const size = 30;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(block.angle);

  ctx.fillStyle = block.render.fillStyle;
  ctx.fillRect(-size / 2, -size / 2, size, size);

  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(-size / 2, -size / 2, size, size);

  if (block.hp < block.maxHp) {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(-size / 2, -size / 2 - 8, size, 4);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(-size / 2, -size / 2 - 8, size * (block.hp / block.maxHp), 4);
  }

  if (block.isEaster) {
    ctx.fillStyle = '#ffd700';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('福', 0, 5);
  }

  ctx.restore();
}

function gameLoop() {
  if (!gameState.isPaused && !gameState.isGameOver) {
    Engine.update(engine, 1000 / 60);
    checkGameState();
  }
  render();
  requestAnimationFrame(gameLoop);
}

// 输入处理
document.querySelectorAll('.key').forEach(key => {
  key.addEventListener('click', (e) => {
    if (gameState.isGameOver) return;

    const num = e.target.dataset.num;
    const action = e.target.dataset.action;

    if (num !== undefined) {
      if (gameState.currentAnswer.length < 2) {
        gameState.currentAnswer += num;
        document.getElementById('answer-display').textContent = gameState.currentAnswer;

        clearTimeout(gameState.submitTimer);
        gameState.submitTimer = setTimeout(() => {
          if (gameState.currentAnswer.length > 0) {
            checkAnswer();
          }
        }, 800);
      }
    } else if (action === 'clear') {
      gameState.currentAnswer = '';
      document.getElementById('answer-display').textContent = '';
      clearTimeout(gameState.submitTimer);
    }
  });
});

function checkAnswer() {
  const userAnswer = parseInt(gameState.currentAnswer);
  if (isNaN(userAnswer)) return;

  gameState.attempts++;
  updateHUD();

  if (userAnswer === gameState.correctAnswer) {
    playSound('correct');
    updateCombo(true);
    fireBullets(userAnswer);
    setTimeout(() => {
      if (!gameState.isGameOver) {
        generateQuestion();
      }
    }, 500);
  } else {
    playSound('wrong');
    updateCombo(false);
    document.getElementById('answer-display').style.color = '#ff4444';
    setTimeout(() => {
      document.getElementById('answer-display').style.color = '#ffd700';
      gameState.currentAnswer = '';
      document.getElementById('answer-display').textContent = '';
    }, 500);
  }
}

// 方向键控制
let moveLeft = false;
let moveRight = false;

document.getElementById('btn-left').addEventListener('touchstart', (e) => {
  e.preventDefault();
  moveLeft = true;
});
document.getElementById('btn-left').addEventListener('touchend', (e) => {
  e.preventDefault();
  moveLeft = false;
});
document.getElementById('btn-right').addEventListener('touchstart', (e) => {
  e.preventDefault();
  moveRight = true;
});
document.getElementById('btn-right').addEventListener('touchend', (e) => {
  e.preventDefault();
  moveRight = false;
});

document.getElementById('btn-left').addEventListener('mousedown', () => moveLeft = true);
document.getElementById('btn-left').addEventListener('mouseup', () => moveLeft = false);
document.getElementById('btn-right').addEventListener('mousedown', () => moveRight = true);
document.getElementById('btn-right').addEventListener('mouseup', () => moveRight = false);

function toggleAimMode() {
  gameState.autoAim = !gameState.autoAim;
  const modeText = gameState.autoAim ? '自动' : '手动';
  document.getElementById('aim-mode').textContent = modeText;

  const toggleBtn = document.getElementById('aim-toggle');
  if (gameState.autoAim) {
    toggleBtn.style.background = 'rgba(0,255,0,0.4)';
  } else {
    toggleBtn.style.background = 'rgba(255,215,0,0.3)';
  }
}

setInterval(() => {
  if (gameState.isGameOver || gameState.isPaused) return;

  if (gameState.autoAim && gameState.blocks.length > 0) {
    let targetBlock = gameState.blocks[0];
    let maxY = gameState.blocks[0].position.y;

    gameState.blocks.forEach(block => {
      if (block.position.y > maxY) {
        maxY = block.position.y;
        targetBlock = block;
      }
    });

    const targetX = targetBlock.position.x;
    const diff = targetX - gameState.planeX;
    gameState.planeX += diff * 0.1;
    gameState.planeX = Math.max(30, Math.min(config.width - 30, gameState.planeX));

    document.querySelectorAll('.touch-hint').forEach(h => h.style.display = 'none');
  } else {
    if (moveLeft && gameState.planeX > 30) {
      gameState.planeX -= 8;
    }
    if (moveRight && gameState.planeX < config.width - 30) {
      gameState.planeX += 8;
    }
  }
}, 16);

document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

window.addEventListener('resize', () => {
  config.width = window.innerWidth;
  config.height = window.innerHeight;
  config.planeY = window.innerHeight - 250;
  canvas.width = config.width;
  canvas.height = config.height;
});

// 音效
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (!gameState.soundEnabled) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'shoot') {
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'hit') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'correct') {
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
  } else if (type === 'wrong') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.3);
  } else if (type === 'nuke') {
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
  }
}

function toggleSound() {
  gameState.soundEnabled = !gameState.soundEnabled;

  const icon = document.getElementById('sound-icon');
  const text = document.getElementById('sound-text');
  const btn = document.getElementById('sound-toggle');

  if (gameState.soundEnabled) {
    icon.textContent = '🔊';
    text.textContent = '开启';
    btn.style.background = 'rgba(0,255,255,0.2)';
  } else {
    icon.textContent = '🔇';
    text.textContent = '关闭';
    btn.style.background = 'rgba(100,100,100,0.3)';
  }
}
