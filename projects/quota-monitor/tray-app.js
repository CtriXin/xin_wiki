/**
 * AI Quota Monitor - Menu Bar App
 * 菜单栏应用版本
 */

const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell } = require('electron');
const path = require('path');
const http = require('http');

let tray = null;
let mainWindow = null;
let apiServer = null;

// 启动后端 API 服务
function startApiServer() {
  return new Promise((resolve, reject) => {
    // 先检查端口是否已被占用
    const testPort = require('net').createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log('API 服务已在运行');
          resolve('http://localhost:3001');
        }
      })
      .once('listening', () => {
        testPort.close();
        // 启动服务
        const serverPath = path.join(__dirname, 'backend', 'server.js');
        const proc = require('child_process').spawn('node', [serverPath], {
          cwd: __dirname,
          stdio: ['ignore', 'pipe', 'pipe']
        });

        proc.stdout.on('data', (data) => {
          const str = data.toString();
          console.log('[Server]', str);
          if (str.includes('API Quota Monitor Server')) {
            resolve('http://localhost:3001');
          }
        });

        proc.stderr.on('data', (data) => {
          console.error('[Server Error]', data.toString());
        });

        // 超时保护
        setTimeout(() => resolve('http://localhost:3001'), 10000);
      })
      .listen(3001);
  });
}

// 创建进度条图片
function createProgressImage(percentage, color = '#10b981') {
  const size = 16;
  const canvas = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" fill="none" stroke="#333" stroke-width="2"/>
      <circle cx="8" cy="8" r="6" fill="none" stroke="${color}" stroke-width="2"
        stroke-dasharray="${37 * percentage / 100} 37" transform="rotate(-90 8 8)"/>
    </svg>
  `;
  return nativeImage.createFromBuffer(Buffer.from(canvas));
}

// 获取配额数据
async function fetchQuota(url, provider) {
  try {
    const res = await fetch(`${url}/api/quota/${provider}`);
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}

// 更新菜单
async function updateTrayMenu() {
  if (!tray) return;

  const apiUrl = 'http://localhost:3001';

  // 获取数据
  const [kimiData, minimaxData] = await Promise.all([
    fetchQuota(apiUrl, 'kimi'),
    fetchQuota(apiUrl, 'minimax')
  ]);

  const kimiPercent = kimiData?.percentage || 0;
  const minimaxPercent = minimaxData?.percentage || 0;

  // 创建动态图标（显示总体使用量）
  const totalPercent = Math.round((kimiPercent + minimaxPercent) / 2);
  const icon = createTrayIcon(totalPercent);
  tray.setImage(icon);

  // 构建菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `🤖 Kimi: ${kimiPercent.toFixed(1)}%`,
      enabled: false
    },
    {
      label: `📊 进度: ${createBar(kimiPercent)}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: `🧠 MiniMax: ${minimaxPercent.toFixed(1)}%`,
      enabled: false
    },
    {
      label: `📊 进度: ${createBar(minimaxPercent)}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: '🔄 刷新',
      click: () => updateTrayMenu()
    },
    {
      label: '📖 打开完整界面',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      }
    },
    { type: 'separator' },
    {
      label: '⚙️ 设置',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      }
    },
    { type: 'separator' },
    {
      label: '❌ 退出',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(`AI Quota: Kimi ${kimiPercent}% | MiniMax ${minimaxPercent}%`);
}

// 创建进度条
function createBar(percent) {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// 创建托盘图标
function createTrayIcon(percentage) {
  const size = 22;
  // 根据使用量选择颜色
  let color = '#10b981'; // 绿色
  if (percentage > 50) color = '#f59e0b'; // 黄色
  if (percentage > 80) color = '#ef4444'; // 红色

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="11" cy="11" r="9" fill="url(#grad)"/>
      <circle cx="11" cy="11" r="7" fill="#1e1e1e"/>
      <text x="11" y="15" font-size="8" fill="white" text-anchor="middle" font-family="Arial">${percentage}</text>
    </svg>
  `;

  return nativeImage.createFromBuffer(Buffer.from(svg));
}

// 创建主窗口
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  mainWindow.loadURL('http://localhost:3001');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

// 创建托盘
function createTray() {
  tray = new Tray(createTrayIcon(0));
  tray.setToolTip('AI Quota Monitor');

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      createMainWindow();
    }
  });

  // 初始菜单
  updateTrayMenu();

  // 每分钟更新
  setInterval(updateTrayMenu, 60000);
}

// App 就绪
app.whenReady().then(async () => {
  console.log('🚀 启动 AI Quota Monitor...');

  // 启动 API 服务
  await startApiServer();
  console.log('✅ API 服务已启动');

  // 创建托盘
  createTray();

  // 初始更新
  setTimeout(updateTrayMenu, 3000);
});

app.on('window-all-closed', () => {
  // 不退出，保持托盘
});

app.on('before-quit', () => {
  // 允许退出
  if (mainWindow) {
    mainWindow.removeAllListeners('close');
    mainWindow.close();
  }
});
