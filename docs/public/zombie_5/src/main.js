import { CONFIG } from './config.js';
import { loadImages } from './assets.js';
import { ZombieGame } from './game.js';

async function bootstrap () {
  const canvas = document.getElementById('gameCanvas');
  const ui = {
    gems: document.getElementById('gems'),
    scrap: document.getElementById('scrap'),
    core: document.getElementById('core'),
    kills: document.getElementById('kills'),
    wave: document.getElementById('wave'),
    layer: document.getElementById('layer'),
    baseHp: document.getElementById('baseHp'),
    combo: document.getElementById('combo'),
    buff: document.getElementById('buff'),
    quest: document.getElementById('quest'),
    forgeGems: document.getElementById('forgeGems'),
    forgeScrap: document.getElementById('forgeScrap'),
    forgeCore: document.getElementById('forgeCore'),
    bestLayer: document.getElementById('bestLayer'),
    bestKills: document.getElementById('bestKills'),
    waveInfo: document.getElementById('waveInfo'),
    upgradeToast: document.getElementById('upgradeToast'),
    upgradeName: document.getElementById('upgradeName'),
    skillBtn: document.getElementById('skillBtn'),
    gearGuideText: document.getElementById('gearGuideText'),
    mineLevel: document.getElementById('mineLevel'),
    mineDepth: document.getElementById('mineDepth'),
    mineStamina: document.getElementById('mineStamina'),
    mineStaminaBar: document.getElementById('mineStaminaBar'),
    mineStaminaHud: document.getElementById('mineStaminaHud'),
    mineStaminaHudText: document.getElementById('mineStaminaHudText'),
    mineStaminaHudBar: document.getElementById('mineStaminaHudBar'),
    mineNodes: document.getElementById('mineNodes'),
    mineMap: document.getElementById('mineMap'),
    mineQuest: document.getElementById('mineQuest'),
    bagStone: document.getElementById('bagStone'),
    bagCopper: document.getElementById('bagCopper'),
    bagCrystal: document.getElementById('bagCrystal'),
    bagMyth: document.getElementById('bagMyth'),
    bagIngot: document.getElementById('bagIngot'),
    autoSmeltState: document.getElementById('autoSmeltState'),
    smeltPolicy: document.getElementById('smeltPolicy')
  };

  const sketchHint = document.getElementById('sketchHint');
  const resources = document.getElementById('resources');
  const resourcesToggle = document.getElementById('resourcesToggle');
  const mineMapBtn = document.getElementById('mineMapBtn');
  const minePanelToggle = document.getElementById('minePanelToggle');
  const mineBagBtn = document.getElementById('mineBagBtn');
  const hintToggle = document.getElementById('hintToggle');
  const skillBtn = document.getElementById('skillBtn');
  const forgeBtn = document.getElementById('forgeBtn');
  const customBtn = document.getElementById('customBtn');
  const styleBtn = document.getElementById('styleBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const classBar = document.getElementById('classBar');
  const classToggle = document.getElementById('classToggle');
  const inventory = document.getElementById('inventory');
  const inventoryToggle = document.getElementById('inventoryToggle');

  const forgePanel = document.getElementById('forgePanel');
  const forgeClose = document.getElementById('forgeClose');
  const forgeUpgrade = document.getElementById('forgeUpgrade');
  const forgeSynthesize = document.getElementById('forgeSynthesize');
  const forgeRepair = document.getElementById('forgeRepair');
  const forgeUnlockGear = document.getElementById('forgeUnlockGear');
  const craftDo = document.getElementById('craftDo');
  const craftPreview = document.getElementById('craftPreview');
  const craftRecipeName = document.getElementById('craftRecipeName');
  const craftSuccessRate = document.getElementById('craftSuccessRate');
  const craftExplodeRate = document.getElementById('craftExplodeRate');
  const craftOutcomeHint = document.getElementById('craftOutcomeHint');
  const craftRuleBook = document.getElementById('craftRuleBook');
  const craftFx = document.getElementById('craftFx');
  const craftFxBar = document.getElementById('craftFxBar');
  const craftCells = Array.from(document.querySelectorAll('.craft-cell'));
  const craftResultOverlay = document.getElementById('craftResultOverlay');
  const craftResultTitle = document.getElementById('craftResultTitle');
  const craftResultBody = document.getElementById('craftResultBody');
  const craftResultOk = document.getElementById('craftResultOk');

  const customPanel = document.getElementById('customPanel');
  const customClose = document.getElementById('customClose');
  const drawCanvas = document.getElementById('drawCanvas');
  const drawCanvasZoom = document.getElementById('drawCanvasZoom');
  const drawTarget = document.getElementById('drawTarget');
  const drawSave = document.getElementById('drawSave');
  const drawClear = document.getElementById('drawClear');
  const drawZoom = document.getElementById('drawZoom');
  const drawResetOne = document.getElementById('drawResetOne');
  const drawResetAll = document.getElementById('drawResetAll');
  const drawZoomOverlay = document.getElementById('drawZoomOverlay');
  const drawZoomApply = document.getElementById('drawZoomApply');
  const drawZoomClear = document.getElementById('drawZoomClear');
  const drawZoomClose = document.getElementById('drawZoomClose');
  const introOverlay = document.getElementById('introOverlay');
  const introTitle = document.getElementById('introTitle');
  const introText = document.getElementById('introText');
  const introNext = document.getElementById('introNext');
  const introStart = document.getElementById('introStart');
  const tacticPanel = document.getElementById('tacticPanel');
  const tacticChoices = document.getElementById('tacticChoices');
  const tacticCountdown = document.getElementById('tacticCountdown');
  const guideToggle = document.getElementById('guideToggle');
  const guideDrawer = document.getElementById('guideDrawer');
  const prepPanel = document.getElementById('prepPanel');
  const prepText = document.getElementById('prepText');
  const waveStartBtn = document.getElementById('waveStartBtn');
  const prepOpenForge = document.getElementById('prepOpenForge');
  const mineBagPanel = document.getElementById('mineBagPanel');
  const mineBagClose = document.getElementById('mineBagClose');
  const smeltOne = document.getElementById('smeltOne');
  const smeltBatch = document.getElementById('smeltBatch');
  const autoSmeltToggle = document.getElementById('autoSmeltToggle');
  const smeltPolicyBtn = document.getElementById('smeltPolicyBtn');

  function collapseTransientPanels () {
    forgePanel?.classList.add('hidden');
    customPanel?.classList.add('hidden');
    prepPanel?.classList.add('hidden');
    waveStartBtn?.classList.add('hidden');
    mineBagPanel?.classList.add('hidden');
    drawZoomOverlay?.classList.add('hidden');
    craftResultOverlay?.classList.add('hidden');
    guideDrawer?.classList.add('collapsed');
    classBar?.classList.add('collapsed');
    inventory?.classList.add('collapsed');
    if (classToggle) classToggle.textContent = document.body.classList.contains('compact-ui') ? '🧑' : '展开职业栏';
    if (inventoryToggle) inventoryToggle.textContent = document.body.classList.contains('compact-ui') ? '🎒' : '展开装备栏';
    if (guideToggle) guideToggle.textContent = document.body.classList.contains('compact-ui') ? '📘' : '推荐';
    game.setMinePanelCollapsed(true);
  }

  const images = await loadImages(CONFIG.refImages);
  const game = new ZombieGame(canvas, ui, sketchHint, images);
  const STYLE_META = {
    line: { label: '线稿风', icon: '🎨' },
    block: { label: '方块风', icon: '🧱' },
    toon: { label: '立体风', icon: '🪄' },
    neo: { label: '电影风', icon: '🎬' }
  };
  function renderStyleButton (mode) {
    const meta = STYLE_META[mode] || STYLE_META.line;
    if (!styleBtn) return;
    if (document.body.classList.contains('compact-ui')) {
      styleBtn.textContent = meta.icon;
      styleBtn.title = `切换画风（当前${meta.label}）`;
    } else {
      styleBtn.textContent = meta.label;
    }
  }

  document.querySelectorAll('.class-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cls = btn.dataset.class;
      if (!cls) return;
      game.switchClass(cls);
      document.querySelectorAll('.class-btn').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      if (cls === 'miner') {
        collapseTransientPanels();
        setInfoCollapsed(true);
      }
      classBar?.classList.add('collapsed');
      if (classToggle) classToggle.textContent = '展开职业栏';
    });
  });

  document.querySelectorAll('.inv-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const idx = Number(slot.dataset.slot);
      if (Number.isNaN(idx)) return;
      game.equipItem(idx);
    });
  });

  skillBtn?.addEventListener('click', () => game.useSkill());
  forgeBtn?.addEventListener('click', () => forgePanel?.classList.toggle('hidden'));
  customBtn?.addEventListener('click', () => customPanel?.classList.toggle('hidden'));
  styleBtn?.addEventListener('click', () => {
    const mode = game.toggleVisualStyle();
    renderStyleButton(mode);
  });
  pauseBtn?.addEventListener('click', () => {
    const paused = game.togglePause();
    if (document.body.classList.contains('compact-ui')) {
      pauseBtn.textContent = paused ? '▶️' : '⏸️';
    } else {
      pauseBtn.textContent = paused ? '继续' : '暂停';
    }
  });
  mineMapBtn?.addEventListener('click', () => {
    game.cycleMiningMap();
  });
  minePanelToggle?.addEventListener('click', () => {
    game.toggleMinePanel();
  });
  mineBagBtn?.addEventListener('click', () => {
    mineBagPanel?.classList.toggle('hidden');
  });
  mineBagClose?.addEventListener('click', () => {
    mineBagPanel?.classList.add('hidden');
  });
  smeltOne?.addEventListener('click', () => game.smeltOre(false));
  smeltBatch?.addEventListener('click', () => game.smeltOre(true));
  autoSmeltToggle?.addEventListener('click', () => game.toggleAutoSmelt());
  smeltPolicyBtn?.addEventListener('click', () => game.cycleSmeltPolicy());
  forgeClose?.addEventListener('click', () => forgePanel?.classList.add('hidden'));
  customClose?.addEventListener('click', () => customPanel?.classList.add('hidden'));
  forgeUpgrade?.addEventListener('click', () => game.forgeUpgradeCurrent());
  forgeSynthesize?.addEventListener('click', () => game.forgeSynthesize());
  forgeRepair?.addEventListener('click', () => game.forgeRepairBase());
  forgeUnlockGear?.addEventListener('click', () => game.forgeUnlockNextGear());
  const craftOptions = ['empty', 'scrap', 'gem', 'core'];
  const craftLabels = { empty: '空', scrap: '🧩', gem: '💎', core: '🔷' };
  const craftState = ['empty', 'empty', 'empty', 'empty'];
  const previewText = { empty: '空', scrap: '零件', gem: '钻石', core: '核心' };
  function updateCraftPreview () {
    if (!craftPreview) return;
    const fill = craftState.filter(x => x !== 'empty');
    craftPreview.textContent = fill.length ? fill.map(x => previewText[x]).join(' + ') : '未放入材料';
    const insight = game.getCraftRecipeInsight(craftState.slice());
    if (craftRecipeName) craftRecipeName.textContent = insight.recipeName;
    if (craftSuccessRate) craftSuccessRate.textContent = insight.successRateText;
    if (craftExplodeRate) craftExplodeRate.textContent = insight.explodeRateText;
    if (craftOutcomeHint) craftOutcomeHint.textContent = insight.outcomeHint;
    if (craftRuleBook) craftRuleBook.textContent = insight.ruleBookText || '手册：先放入材料';
  }
  craftCells.forEach((cell, idx) => {
    cell.addEventListener('click', () => {
      const now = craftOptions.indexOf(craftState[idx]);
      const next = craftOptions[(now + 1) % craftOptions.length];
      craftState[idx] = next;
      cell.textContent = craftLabels[next];
      updateCraftPreview();
    });
  });
  let crafting = false;
  let craftNeedReview = false;
  let pendingCraftResult = null;
  function hideCraftResult () {
    craftResultOverlay?.classList.add('hidden');
  }
  function showCraftResult (result) {
    if (!result || !craftResultOverlay || !craftResultTitle || !craftResultBody) return;
    craftResultTitle.textContent = result.title || '合成结果';
    const lines = Array.isArray(result.lines) ? result.lines.filter(Boolean) : [];
    craftResultBody.innerHTML = lines.map((line) => `<div>${line}</div>`).join('');
    craftResultOverlay.classList.remove('hidden');
  }
  craftResultOk?.addEventListener('click', () => {
    const shouldCloseForge = !!pendingCraftResult?.closeForgePanel;
    hideCraftResult();
    if (shouldCloseForge) forgePanel?.classList.add('hidden');
    pendingCraftResult = null;
  });
  craftDo?.addEventListener('click', () => {
    if (crafting) return;
    if (craftNeedReview && pendingCraftResult) {
      showCraftResult(pendingCraftResult);
      craftNeedReview = false;
      craftDo.textContent = '开始合成';
      return;
    }
    crafting = true;
    craftDo.disabled = true;
    craftDo.textContent = '合成中...';
    craftFx?.classList.remove('hidden');
    if (craftFxBar) craftFxBar.style.width = '0%';
    let t = 0;
    const timer = setInterval(() => {
      t += 1;
      if (craftFxBar) craftFxBar.style.width = `${Math.min(100, t * 12.5)}%`;
      if (t >= 8) {
        clearInterval(timer);
        pendingCraftResult = game.forgeCraftGrid(craftState.slice());
        craftDo.disabled = false;
        craftFx?.classList.add('hidden');
        if (craftFxBar) craftFxBar.style.width = '0%';
        if (pendingCraftResult?.showResult) {
          craftNeedReview = true;
          craftDo.textContent = '查看结果';
        } else {
          craftNeedReview = false;
          craftDo.textContent = '开始合成';
        }
        crafting = false;
      }
    }, 70);
  });
  updateCraftPreview();
  classToggle?.addEventListener('click', () => {
    classBar?.classList.toggle('collapsed');
    if (!classBar) return;
    classToggle.textContent = document.body.classList.contains('compact-ui')
      ? '🧑'
      : (classBar.classList.contains('collapsed') ? '展开职业栏' : '收起职业栏');
  });
  inventoryToggle?.addEventListener('click', () => {
    inventory?.classList.toggle('collapsed');
    if (!inventory) return;
    inventoryToggle.textContent = document.body.classList.contains('compact-ui')
      ? '🎒'
      : (inventory.classList.contains('collapsed') ? '展开装备栏' : '收起装备栏');
  });
  guideToggle?.addEventListener('click', () => {
    guideDrawer?.classList.toggle('collapsed');
    if (!guideDrawer || !guideToggle) return;
    if (document.body.classList.contains('compact-ui')) {
      guideToggle.textContent = '📘';
    } else {
      guideToggle.textContent = guideDrawer.classList.contains('collapsed') ? '推荐' : '收起推荐';
    }
  });
  function setInfoCollapsed (collapsed) {
    resources?.classList.toggle('collapsed', collapsed);
    sketchHint?.classList.toggle('collapsed', collapsed);
    if (resourcesToggle) resourcesToggle.textContent = collapsed ? '▶' : '◀';
    if (hintToggle) hintToggle.textContent = collapsed ? '◀' : '▶';
  }
  resourcesToggle?.addEventListener('click', () => {
    const next = !resources?.classList.contains('collapsed');
    setInfoCollapsed(next);
  });
  hintToggle?.addEventListener('click', () => {
    const next = !sketchHint?.classList.contains('collapsed');
    setInfoCollapsed(next);
  });
  setInfoCollapsed(true);
  renderStyleButton(game.game.visualStyle);
  const introSteps = [
    '先选职业，再点怪战斗。战士/刺客贴身，弓手/法师远程。',
    '新增矿工职业：矿工模式不出怪，点矿石采集，去“矿工背包”熔炼资源。',
    '看右上“推荐”抽屉，遇到不同怪切换不同武器。',
    '去装备台铸造新武器，再强化。最强武器有冷却和条件。',
    '左/右按钮会在开局后收成图标，需要时再点开。'
  ];
  let introStep = 0;
  function renderIntro () {
    if (!introTitle || !introText || !introNext || !introStart) return;
    introTitle.textContent = `开局引导 ${introStep + 1}/${introSteps.length}`;
    introText.textContent = introSteps[introStep];
    const isLast = introStep >= introSteps.length - 1;
    introNext.classList.toggle('hidden', isLast);
    introStart.classList.toggle('hidden', !isLast);
  }
  introNext?.addEventListener('click', () => {
    introStep = Math.min(introSteps.length - 1, introStep + 1);
    renderIntro();
  });
  introStart?.addEventListener('click', () => {
    introOverlay?.classList.add('hidden');
    document.body.classList.add('compact-ui');
    if (classToggle) classToggle.textContent = '🧑';
    if (inventoryToggle) inventoryToggle.textContent = '🎒';
    if (forgeBtn) {
      forgeBtn.textContent = '🔧';
      forgeBtn.title = '装备台';
    }
    if (customBtn) {
      customBtn.textContent = '🎨';
      customBtn.title = '自定义';
    }
    if (styleBtn) {
      renderStyleButton(game.game.visualStyle);
    }
    if (pauseBtn) {
      pauseBtn.textContent = '⏸️';
      pauseBtn.title = '暂停/继续';
    }
    if (guideToggle) {
      guideToggle.textContent = '📘';
      guideToggle.title = '武器推荐';
    }
    if (classToggle) classToggle.title = '职业栏';
    if (inventoryToggle) inventoryToggle.title = '装备栏';
    collapseTransientPanels();
    game.start();
  });
  renderIntro();

  if (drawCanvas && drawTarget && drawSave && drawClear) {
    const dctx = drawCanvas.getContext('2d');
    dctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    function bindDrawSurface (surface, ctx, lineWidth) {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      let drawing = false;
      let lastX = 0;
      let lastY = 0;
      function pos (evt) {
        const r = surface.getBoundingClientRect();
        const x = (evt.clientX || (evt.touches && evt.touches[0].clientX) || 0) - r.left;
        const y = (evt.clientY || (evt.touches && evt.touches[0].clientY) || 0) - r.top;
        return { x: x * (surface.width / r.width), y: y * (surface.height / r.height) };
      }
      surface.addEventListener('pointerdown', (evt) => {
        drawing = true;
        const p = pos(evt);
        lastX = p.x;
        lastY = p.y;
        evt.preventDefault();
      });
      surface.addEventListener('pointermove', (evt) => {
        if (!drawing) return;
        const p = pos(evt);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        lastX = p.x;
        lastY = p.y;
        evt.preventDefault();
      });
      surface.addEventListener('pointerup', () => { drawing = false; });
      surface.addEventListener('pointerleave', () => { drawing = false; });
      surface.addEventListener('pointercancel', () => { drawing = false; });
    }
    bindDrawSurface(drawCanvas, dctx, 3.5);

    let zctx = null;
    if (drawCanvasZoom) {
      zctx = drawCanvasZoom.getContext('2d');
      zctx.clearRect(0, 0, drawCanvasZoom.width, drawCanvasZoom.height);
      bindDrawSurface(drawCanvasZoom, zctx, 8);
    }

    function openZoomCanvas () {
      if (!drawCanvasZoom || !drawZoomOverlay || !zctx) return;
      zctx.clearRect(0, 0, drawCanvasZoom.width, drawCanvasZoom.height);
      zctx.drawImage(drawCanvas, 0, 0, drawCanvasZoom.width, drawCanvasZoom.height);
      drawZoomOverlay.classList.remove('hidden');
    }

    drawZoom?.addEventListener('click', openZoomCanvas);
    drawCanvas.addEventListener('dblclick', openZoomCanvas);
    drawZoomApply?.addEventListener('click', () => {
      if (!drawCanvasZoom || !zctx) return;
      dctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      dctx.drawImage(drawCanvasZoom, 0, 0, drawCanvas.width, drawCanvas.height);
      drawZoomOverlay?.classList.add('hidden');
    });
    drawZoomClear?.addEventListener('click', () => {
      if (!drawCanvasZoom || !zctx) return;
      zctx.clearRect(0, 0, drawCanvasZoom.width, drawCanvasZoom.height);
    });
    drawZoomClose?.addEventListener('click', () => {
      drawZoomOverlay?.classList.add('hidden');
    });

    drawClear.addEventListener('click', () => dctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height));
    drawSave.addEventListener('click', () => {
      const out = document.createElement('canvas');
      out.width = drawCanvas.width;
      out.height = drawCanvas.height;
      const octx = out.getContext('2d');
      octx.drawImage(drawCanvas, 0, 0);
      const img = octx.getImageData(0, 0, out.width, out.height);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a > 0 && r > 245 && g > 245 && b > 245) data[i + 3] = 0;
      }
      octx.putImageData(img, 0, 0);
      game.setCustomSprite(drawTarget.value, out.toDataURL('image/png'));
    });
    drawResetOne?.addEventListener('click', () => {
      game.clearCustomSprite(drawTarget.value);
    });
    drawResetAll?.addEventListener('click', () => {
      game.clearAllCustomSprites();
    });
  }

  let tacticTick = 0;
  let tacticDeadline = 0;
  function hideTacticPanel () {
    tacticPanel?.classList.add('hidden');
    if (tacticTick) {
      clearInterval(tacticTick);
      tacticTick = 0;
    }
  }
  function renderTacticPanel (choices, deadlineTs) {
    if (!tacticPanel || !tacticChoices || !tacticCountdown) return;
    tacticDeadline = deadlineTs || (performance.now() + 5000);
    tacticChoices.innerHTML = '';
    choices.forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tactic-btn';
      btn.innerHTML = `<strong>${c.name}</strong>${c.desc}`;
      btn.addEventListener('click', () => {
        game.applyTactic(c.id);
        hideTacticPanel();
      });
      tacticChoices.appendChild(btn);
    });
    tacticPanel.classList.remove('hidden');
    if (tacticTick) clearInterval(tacticTick);
    tacticTick = setInterval(() => {
      const left = Math.max(0, Math.ceil((tacticDeadline - performance.now()) / 1000));
      tacticCountdown.textContent = String(left);
      if (left <= 0) hideTacticPanel();
    }, 180);
  }

  // 按条件弹装备台，减少打断：首波/关键波/可进行重要合成或维修时提示。
  game.onWaveStart = () => {
    hideTacticPanel();
    collapseTransientPanels();
    setInfoCollapsed(true);
  };
  game.onWaveCleared = (payload) => {
    if (!payload?.choices?.length) return;
    renderTacticPanel(payload.choices, payload.deadline);
  };
  game.onPreparation = (payload) => {
    if (!prepPanel || !prepText || !waveStartBtn) return;
    prepPanel.classList.remove('hidden');
    waveStartBtn.classList.remove('hidden');
    const waveNo = payload?.nextWave || 1;
    prepText.textContent = `第 ${waveNo} 波即将开始。可先配装、合成、切职业，准备好后再开战。`;
    waveStartBtn.textContent = `开始第 ${waveNo} 波`;
  };
  waveStartBtn?.addEventListener('click', () => {
    const ok = game.beginNextWave();
    if (ok) {
      collapseTransientPanels();
      setInfoCollapsed(true);
    }
  });
  prepOpenForge?.addEventListener('click', () => {
    prepPanel?.classList.add('hidden');
    forgePanel?.classList.remove('hidden');
  });
}

bootstrap();
