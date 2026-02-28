/**
 * API Quota Monitor - Node.js Backend
 * 支持：Kimi, MiniMax, 百炼，Codex, Gemini
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const app = express();
app.use(cors());
app.use(express.json());

// 配置文件路径
const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const DATA_DIR = path.join(__dirname, '..', 'data');
const CODEX_WEB_SESSION_FILE = path.join(DATA_DIR, 'codex_web_session.json');
const CODEX_OAUTH_PROFILE_DIR = path.join(DATA_DIR, 'codex_oauth_profile');

// 确保数据目录存在
fs.mkdirSync(DATA_DIR, { recursive: true });

const codexOauthState = {
  status: 'idle', // idle | pending | connected | error
  startedAt: null,
  connectedAt: null,
  lastCheckedAt: null,
  lastError: null,
  message: null,
};
let codexOauthContext = null;
let codexOauthInterval = null;
let codexOauthChecking = false;
let codexOauthAttachedViaCDP = false;

// 加载配置
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('加载配置失败:', e);
  }
  return { kimi: {}, minimax: {}, bailian: {}, codex: {}, gemini: {} };
}

let config = loadConfig();

// ==================== Codexbar 配置读取 ====================
const CODEXBAR_CONFIG_PATH = path.join(process.env.HOME, '.codexbar', 'config.json');

function loadCodexbarConfig() {
  try {
    if (fs.existsSync(CODEXBAR_CONFIG_PATH)) {
      const data = fs.readFileSync(CODEXBAR_CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('加载 codexbar 配置失败:', e.message);
  }
  return null;
}

// 获取 codexbar 中的 minimax api key
function getCodexbarMinimaxKey() {
  const codexbarConfig = loadCodexbarConfig();
  if (!codexbarConfig || !codexbarConfig.providers) return null;

  const minimaxProvider = codexbarConfig.providers.find(p => p.id === 'minimax');
  if (minimaxProvider && minimaxProvider.enabled && minimaxProvider.apiKey) {
    return {
      apiKey: minimaxProvider.apiKey,
      region: minimaxProvider.region === 'cn' ? 'china' : 'global'
    };
  }
  return null;
}

// ==================== Browser Cookie 读取 ====================
// 尝试从浏览器读取 kimi cookie
async function getKimiCookieFromBrowser() {
  // 1. 先尝试 Safari
  const safariCookiePaths = [
    path.join(process.env.HOME, 'Library', 'Containers', 'com.apple.Safari', 'Data', 'Library', 'Cookies', 'Cookies.binarycookies'),
    path.join(process.env.HOME, 'Library', 'Cookies', 'Cookies.binarycookies')
  ];

  for (const cookiePath of safariCookiePaths) {
    try {
      if (!fs.existsSync(cookiePath)) continue;

      const cookieData = fs.readFileSync(cookiePath);
      const cookies = parseBinaryCookies(cookieData);
      const kimiAuthCookie = cookies.find(c => c.name === 'kimi-auth');

      if (kimiAuthCookie && kimiAuthCookie.value) {
        console.log('从 Safari 获取到 Kimi cookie');
        return kimiAuthCookie.value;
      }
    } catch (e) {
      // 继续尝试下一个路径
    }
  }

  // 2. Safari 没有，尝试用 playwright 从 Chrome 获取
  console.log('Safari 无 cookie，尝试从 Chrome 获取...');
  try {
    const { chromium } = require('playwright');

    // 尝试连接已运行的 Chrome (CDP)
    const cdpUrl = process.env.CHROME_CDP_URL || "http://127.0.0.1:9222";
    let browser;
    try {
      browser = await chromium.connectOverCDP(cdpUrl);
    } catch (e) {
      // 启动临时 Chrome
      const userDataDir = path.join(process.env.HOME || "/tmp", ".kimi-chrome-temp");
      browser = await chromium.launch({
        channel: 'chrome',
        headless: false,
        userDataDir,
        args: ['--no-first-run']
      });
    }

    try {
      const context = browser.contexts()[0] || (await browser.newContext());
      const cookies = await context.cookies('https://www.kimi.com');
      const kimiAuth = cookies.find(c => c.name === 'kimi-auth');
      if (kimiAuth && kimiAuth.value) {
        console.log('从 Chrome 获取到 Kimi cookie');
        return kimiAuth.value;
      }
    } finally {
      await browser.close();
    }
  } catch (e) {
    console.log('从 Chrome 获取 cookie 失败:', e.message);
  }

  return null;
}

// 解析 Safari binarycookies 格式
function parseBinaryCookies(buffer) {
  const cookies = [];
  try {
    // 二进制格式解析
    const magic = buffer.toString('binary', 0, 4);
    if (magic !== 'cook') return cookies;

    // 读取 cookie 数量
    const numCookies = buffer.readUInt32BE(4);
    let offset = 8;

    for (let i = 0; i < numCookies && offset < buffer.length; i++) {
      try {
        const cookieSize = buffer.readUInt32BE(offset);
        const cookieData = buffer.slice(offset + 4, offset + 4 + cookieSize);

        let pos = 0;
        // 跳过 flags, domain length, path length 等
        const flags = cookieData.readUInt8(pos); pos += 4;
        const domainLen = cookieData.readUInt8(pos); pos += 1;
        const pathLen = cookieData.readUInt8(pos); pos += 1;

        // 读取 domain
        const domain = cookieData.slice(pos, pos + domainLen).toString('utf8'); pos += domainLen;
        // 读取 name
        const nameLen = cookieData.readUInt8(pos); pos += 1;
        const name = cookieData.slice(pos, pos + nameLen).toString('utf8'); pos += nameLen;
        // 读取 value
        const valueLen = cookieData.readUInt8(pos); pos += 1;
        const value = cookieData.slice(pos, pos + valueLen).toString('utf8');

        if (domain.includes('kimi.com') || name === 'kimi-auth') {
          cookies.push({ name, value, domain });
        }

        offset += 4 + cookieSize;
      } catch (e) {
        break;
      }
    }
  } catch (e) {
    console.error('解析 cookie 失败:', e.message);
  }
  return cookies;
}

// ==================== 自动加载凭证 ====================
function getAutoCredentials() {
  const credentials = { kimi: null, minimax: null };

  // 尝试从 codexbar 获取 minimax api key
  const codexbarMinimax = getCodexbarMinimaxKey();
  if (codexbarMinimax) {
    credentials.minimax = codexbarMinimax;
  }

  return credentials;
}

// 查找可用命令
function isCmdAvailable(cmd) {
  const paths = String(process.env.PATH || '').split(':');
  for (const p of paths) {
    const full = path.join(p, cmd);
    try {
      fs.accessSync(full, fs.constants.X_OK);
      return full;
    } catch {}
  }
  return null;
}

// 解析 JSON 文本（容错）
function parseJsonText(text) {
  const src = String(text || '').trim();
  if (!src) throw new Error('空输出，无法解析 JSON');
  try {
    return JSON.parse(src);
  } catch {}

  const start = Math.min(
    ...[src.indexOf('{'), src.indexOf('[')].filter((x) => x >= 0)
  );
  if (Number.isFinite(start) && start >= 0) {
    const sliced = src.slice(start);
    try {
      return JSON.parse(sliced);
    } catch {}
  }
  // 尝试提取第一段完整 JSON（兼容日志 + 多段 JSON 输出）
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== '{' && src[i] !== '[') continue;
    const open = src[i];
    const close = open === '{' ? '}' : ']';
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let j = i; j < src.length; j++) {
      const ch = src[j];
      if (inStr) {
        if (esc) {
          esc = false;
          continue;
        }
        if (ch === '\\') {
          esc = true;
          continue;
        }
        if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') {
        inStr = true;
        continue;
      }
      if (ch === open) depth += 1;
      else if (ch === close) depth -= 1;
      if (depth === 0) {
        const part = src.slice(i, j + 1);
        try {
          return JSON.parse(part);
        } catch {
          break;
        }
      }
    }
  }
  throw new Error(`无法解析 JSON: ${src.slice(0, 180)}`);
}

// 格式化时间
function fmtDateTime(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return null;
  const d = new Date(n);
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function fmtAnyDate(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' || /^[0-9]+$/.test(String(v))) {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return null;
    const ms = n < 1e12 ? n * 1000 : n;
    return fmtDateTime(ms);
  }
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return fmtDateTime(d.getTime());
}

function toNumOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toPercent(used, total) {
  const u = Number(used);
  const t = Number(total);
  if (!Number.isFinite(u) || !Number.isFinite(t) || t <= 0) return null;
  return Number(((u / t) * 100).toFixed(1));
}

function round1(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 10) / 10;
}

function hoursUntil(iso) {
  if (!iso) return null;
  const t = new Date(String(iso)).getTime();
  if (!Number.isFinite(t)) return null;
  return round1((t - Date.now()) / 3600000);
}

// ==================== Kimi Provider ====================
async function fetchKimiQuota() {
  const cfg = config.kimi || {};
  let authToken = cfg.auth_token;

  // 如果没有配置 token，尝试从浏览器自动获取
  if (!authToken) {
    authToken = await getKimiCookieFromBrowser();
  }

  if (!authToken) {
    return { error: 'Kimi 未登录 (请在浏览器登录 kimi.com 后刷新)', configured: false };
  }

  // 解码 JWT 获取 session 信息
  let sessionInfo = null;
  try {
    const parts = authToken.split('.');
    if (parts.length === 3) {
      let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4 !== 0) payload += '=';
      sessionInfo = JSON.parse(Buffer.from(payload, 'base64').toString());
    }
  } catch (e) {}

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
    'Cookie': `kimi-auth=${authToken}`,
    'Origin': 'https://www.kimi.com',
    'Referer': 'https://www.kimi.com/code/console',
    'Accept': '*/*',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'connect-protocol-version': '1',
    'x-language': 'en-US',
    'x-msh-platform': 'web',
  };

  if (sessionInfo) {
    headers['x-msh-device-id'] = sessionInfo.device_id || cfg.device_id || '';
    headers['x-msh-session-id'] = sessionInfo.ssid || cfg.session_id || '';
    headers['x-traffic-id'] = sessionInfo.sub || cfg.traffic_id || '';
  }

  try {
    const response = await fetch('https://www.kimi.com/apiv2/kimi.gateway.billing.v1.BillingService/GetUsages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ scope: ['FEATURE_CODING'] })
    });

    const data = await response.json();

    if (data.code === 'unauthenticated') {
      return { error: '认证失败，请更新 kimi-auth token', configured: true };
    }

    const usages = data.usages || [];
    const codingUsage = usages.find(u => u.scope === 'FEATURE_CODING');

    if (!codingUsage) {
      return { error: '未找到 FEATURE_CODING 数据', configured: true };
    }

    const detail = codingUsage.detail || {};
    const limits = codingUsage.limits || [];

    const limit = parseInt(detail.limit || 0);
    const used = parseInt(detail.used || 0);
    const remaining = parseInt(detail.remaining || 0);
    const usedPercent = limit > 0 ? (used / limit * 100) : 0;

    const result = {
      configured: true,
      total: limit,
      used,
      remaining,
      percentage: Math.round(usedPercent * 10) / 10,
      resetTime: detail.resetTime || ''
    };

    if (limits.length > 0) {
      const rate = limits[0].detail || {};
      const rateUsed = parseInt(rate.used || 0);
      const rateLimit = parseInt(rate.limit || 0);
      result.rateLimit = {
        used: rateUsed,
        total: rateLimit,
        percentage: rateLimit > 0 ? Math.round((rateUsed / rateLimit * 100) * 10) / 10 : 0,
        resetTime: rate.resetTime || ''
      };
    }

    return result;
  } catch (e) {
    return { error: `请求失败：${e.message}`, configured: true };
  }
}

// ==================== MiniMax Provider ====================
async function fetchMiniMaxQuota() {
  const cfg = config.minimax || {};
  let apiToken = cfg.api_token;
  let region = cfg.region || 'china';

  // 如果没有配置 token，尝试从 codexbar 自动获取
  if (!apiToken) {
    const codexbarMinimax = getCodexbarMinimaxKey();
    if (codexbarMinimax) {
      apiToken = codexbarMinimax.apiKey;
      region = codexbarMinimax.region;
      console.log('从 codexbar 配置获取到 MiniMax api key');
    }
  }

  if (!apiToken) {
    return { error: 'MiniMax api_token 未配置 (请输入或在 codexbar 中配置)', configured: false };
  }

  const baseUrls = {
    global: 'https://api.minimax.io',
    china: 'https://api.minimaxi.com'
  };

  const url = `${baseUrls[region]}/v1/api/openplatform/coding_plan/remains`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.base_resp && data.base_resp.status_code !== 0) {
      return { error: data.base_resp.status_msg || 'API 错误', configured: true };
    }

    const modelRemains = data.model_remains || [];

    if (modelRemains.length === 0) {
      return { error: '未找到模型数据', configured: true };
    }

    const first = modelRemains[0];
    const total = first.current_interval_total_count || 0;
    const remaining = first.current_interval_usage_count || 0;
    const used = Math.max(0, total - remaining);
    const usedPercent = total > 0 ? (used / total * 100) : 0;

    const models = modelRemains.map(m => {
      const mTotal = m.current_interval_total_count || 0;
      const mRemaining = m.current_interval_usage_count || 0;
      const mUsed = Math.max(0, mTotal - mRemaining);
      const mPercent = mTotal > 0 ? (mUsed / mTotal * 100) : 0;
      const remainsSeconds = (m.remains_time || 0) / 1000;

      return {
        name: m.model_name || 'Unknown',
        total: mTotal,
        used: mUsed,
        remaining: mRemaining,
        percentage: Math.round(mPercent * 10) / 10,
        resetTimeSeconds: remainsSeconds,
        resetTimeHuman: remainsSeconds > 0 ?
          `${Math.floor(remainsSeconds / 3600)}h ${Math.floor((remainsSeconds % 3600) / 60)}m` : ''
      };
    });

    return {
      configured: true,
      total,
      used,
      remaining,
      percentage: Math.round(usedPercent * 10) / 10,
      models,
      region
    };
  } catch (e) {
    return { error: `请求失败：${e.message}`, configured: true };
  }
}

// ==================== Bailian Provider ====================
const BAILIAN_DEFAULT_PARAMS =
  '{"Api":"zeldaEasy.broadscope-bailian.codingPlan.queryCodingPlanInstanceInfoV2","V":"1.0","Data":{"queryCodingPlanInstanceInfoRequest":{"commodityCode":"sfm_codingplan_public_cn"}}}';

function findCodingPlanInfos(node) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findCodingPlanInfos(item);
      if (found) return found;
    }
    return null;
  }
  for (const [k, v] of Object.entries(node)) {
    if (String(k).toLowerCase() === "codingplaninstanceinfos" && Array.isArray(v)) {
      return v;
    }
  }
  for (const v of Object.values(node)) {
    const found = findCodingPlanInfos(v);
    if (found) return found;
  }
  return null;
}

function maybeJsonParse(v) {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (!(s.startsWith("{") || s.startsWith("["))) return v;
  try {
    return JSON.parse(s);
  } catch {
    return v;
  }
}

function findFirstQuotaInfo(node) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findFirstQuotaInfo(item);
      if (found) return found;
    }
    return null;
  }
  if (node.codingPlanQuotaInfo && typeof node.codingPlanQuotaInfo === "object") {
    return node.codingPlanQuotaInfo;
  }
  for (const v of Object.values(node)) {
    const next = maybeJsonParse(v);
    const found = findFirstQuotaInfo(next);
    if (found) return found;
  }
  return null;
}

function pickBailianUsage(raw) {
  let infos =
    raw?.data?.DataV2?.data?.data?.codingPlanInstanceInfos ||
    raw?.data?.DataV2?.data?.codingPlanInstanceInfos ||
    raw?.data?.data?.codingPlanInstanceInfos ||
    findCodingPlanInfos(raw);
  if (!Array.isArray(infos) || infos.length === 0) {
    const parsedDataV2 = maybeJsonParse(raw?.data?.DataV2?.data);
    infos =
      parsedDataV2?.data?.codingPlanInstanceInfos ||
      parsedDataV2?.codingPlanInstanceInfos ||
      findCodingPlanInfos(parsedDataV2) ||
      infos;
  }

  let instance = Array.isArray(infos) && infos.length > 0 ? infos[0] || {} : {};
  let q = instance.codingPlanQuotaInfo || {};
  if (!q || typeof q !== "object" || Object.keys(q).length === 0) {
    const fallbackQ =
      findFirstQuotaInfo(raw) ||
      findFirstQuotaInfo(raw?.data?.DataV2?.data) ||
      findFirstQuotaInfo(raw?.data?.DataV2);
    if (fallbackQ) q = fallbackQ;
  }

  if (!q || typeof q !== "object" || Object.keys(q).length === 0) {
    const ret = raw?.data?.DataV2?.ret;
    const msg = Array.isArray(ret) && ret.length ? ret.join("; ") : raw?.data?.errorMsg || raw?.message || "";
    throw new Error(`响应结构缺少 codingPlanQuotaInfo${msg ? ` | ${msg}` : ""}`);
  }

  const formatResetHuman = (ms) => {
    if (!ms) return null;
    const diff = ms - Date.now();
    if (diff < 0) return '即将重置';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}天${hours}小时后重置`;
    if (hours > 0) return `${hours}小时${minutes}分后重置`;
    return `${minutes}分钟后重置`;
  };

  const periodMap = {
    fiveHour: {
      refreshAt: fmtDateTime(q.per5HourQuotaNextRefreshTime),
      refreshInHours: hoursUntil(q.per5HourQuotaNextRefreshTime),
      resetTimeHuman: formatResetHuman(q.per5HourQuotaNextRefreshTime),
      total: toNumOrNull(q.per5HourTotalQuota),
      used: toNumOrNull(q.per5HourUsedQuota),
      remaining: toNumOrNull((q.per5HourTotalQuota || 0) - (q.per5HourUsedQuota || 0)),
      percentage: toPercent(q.per5HourUsedQuota, q.per5HourTotalQuota),
    },
    weekly: {
      refreshAt: fmtDateTime(q.perWeekQuotaNextRefreshTime),
      refreshInHours: hoursUntil(q.perWeekQuotaNextRefreshTime),
      resetTimeHuman: formatResetHuman(q.perWeekQuotaNextRefreshTime),
      total: toNumOrNull(q.perWeekTotalQuota),
      used: toNumOrNull(q.perWeekUsedQuota),
      remaining: toNumOrNull((q.perWeekTotalQuota || 0) - (q.perWeekUsedQuota || 0)),
      percentage: toPercent(q.perWeekUsedQuota, q.perWeekTotalQuota),
    },
    monthly: {
      refreshAt: fmtDateTime(q.perBillMonthQuotaNextRefreshTime),
      refreshInHours: hoursUntil(q.perBillMonthQuotaNextRefreshTime),
      total: toNumOrNull(q.perBillMonthTotalQuota),
      used: toNumOrNull(q.perBillMonthUsedQuota),
      remaining: toNumOrNull((q.perBillMonthTotalQuota || 0) - (q.perBillMonthUsedQuota || 0)),
      percentage: toPercent(q.perBillMonthUsedQuota, q.perBillMonthTotalQuota),
    },
  };

  return {
    instanceName: instance.instanceName || "Coding Plan",
    instanceType: instance.instanceType,
    remainingDays: instance.remainingDays,
    status: instance.status,
    ...periodMap
  };
}

function parseBailianCurl(curlText) {
  const cookieMatch = curlText.match(/(?:\s|\\)-b\s+'([^']+)'/) || curlText.match(/(?:\s|\\)-H\s+'[Cc]ookie:\s*([^']+)'/);
  const secTokenMatch = curlText.match(/[?&]sec_token=([^'&\s]+)/);
  const dataRawMatch = curlText.match(/--data-raw\s+'([^']+)'/);

  let params = BAILIAN_DEFAULT_PARAMS;
  if (dataRawMatch) {
    const decoded = dataRawMatch[1];
    const paramsMatch = decoded.match(/(?:^|&)params=([^&]+)/);
    if (paramsMatch) {
      params = decodeURIComponent(paramsMatch[1]);
    }
  }

  if (!cookieMatch) {
    throw new Error("无法从 cURL 解析 cookie");
  }

  return {
    cookie: cookieMatch[1],
    sec_token: secTokenMatch ? decodeURIComponent(secTokenMatch[1]) : "",
    params,
    updatedAt: new Date().toISOString(),
  };
}

async function fetchBailianQuota() {
  const cfg = config.bailian || {};
  const cookie = cfg.cookie;
  const secToken = cfg.sec_token || '';

  if (!cookie) {
    return {
      error: '需要登录态 Cookie',
      configured: false,
      note: '请在百炼控制台复制 cURL 或运行：document.cookie'
    };
  }

  const baseUrl = 'https://bailian-cs.console.aliyun.com/data/api.json';
  const queryParams = new URLSearchParams();
  queryParams.append('action', 'BroadScopeAspnGateway');
  queryParams.append('product', 'sfm_bailian');
  queryParams.append('api', 'zeldaEasy.broadscope-bailian.codingPlan.queryCodingPlanInstanceInfoV2');
  queryParams.append('_v', 'undefined');

  const body = new URLSearchParams({
    params: cfg.params || BAILIAN_DEFAULT_PARAMS,
    region: cfg.region || 'cn-beijing',
    sec_token: secToken,
  });

  try {
    const response = await fetch(`${baseUrl}?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://bailian.console.aliyun.com',
        'Referer': 'https://bailian.console.aliyun.com/cn-beijing/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookie
      },
      body: body.toString()
    });

    const text = await response.text();

    if (!text || text.trim() === '') {
      return { error: 'API 返回空内容 - Cookie 可能已过期', configured: true };
    }

    let raw;
    try {
      raw = JSON.parse(text);
    } catch (e) {
      return { error: `JSON 解析失败`, configured: true };
    }

    if (raw.code !== '200' && raw.code !== 200) {
      if (raw.data?.errorCode === 'BailianGateway.Login.NotLogined') {
        return { error: '登录已过期，请刷新百炼控制台获取新 cURL', configured: true };
      }
      return { error: raw.errorMsg || 'API 错误', configured: true };
    }

    const usage = pickBailianUsage(raw);
    return {
      configured: true,
      ...usage,
      source: cfg.source || 'api'
    };

  } catch (e) {
    return { error: `请求失败：${e.message}`, configured: true };
  }
}

// ==================== Codex Provider ====================
function normalizeCodexUsage(raw) {
  // Web/API shape: { primary, secondary, ... }
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.primary) {
    const p = raw.primary || {};
    const s = raw.secondary || {};
    const latest = fmtAnyDate(raw.updatedAt || p.updatedAt || s.updatedAt || Date.now());
    return {
      latestUpdatedAt: latest,
      periods: {
        fiveHour: {
          total: toNumOrNull(p.total ?? p.limit ?? null),
          used: toNumOrNull(p.used ?? p.count ?? null),
          remaining: toNumOrNull(p.remaining ?? null),
          percent: toNumOrNull(p.usedPercent ?? p.used_percent ?? null),
          refreshAt: fmtAnyDate(p.resetsAt || p.resetAt || p.nextReset),
          windowMinutes: toNumOrNull(p.windowMinutes ?? p.window_minutes),
        },
        week: {
          total: toNumOrNull(s.total ?? s.limit ?? null),
          used: toNumOrNull(s.used ?? s.count ?? null),
          remaining: toNumOrNull(s.remaining ?? null),
          percent: toNumOrNull(s.usedPercent ?? s.used_percent ?? null),
          refreshAt: fmtAnyDate(s.resetsAt || s.resetAt || s.nextReset),
          windowMinutes: toNumOrNull(s.windowMinutes ?? s.window_minutes),
        },
      },
      fetchedAt: fmtDateTime(Date.now()),
      source: raw.source || 'web',
      accountEmail: raw.accountEmail || null,
      candidatesCount: 2,
    };
  }

  // codexbar JSON array shape
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0] || {};
    const u = first.usage || {};

    const pickPeriod = (node) => {
      if (!node || typeof node !== 'object') return null;
      const percent = toNumOrNull(node.usedPercent);
      return {
        total: null,
        used: null,
        remaining: null,
        percent,
        refreshAt: fmtAnyDate(node.resetsAt),
        windowMinutes: toNumOrNull(node.windowMinutes),
      };
    };

    const primary = pickPeriod(u.primary);
    const secondary = pickPeriod(u.secondary);
    const latest = fmtAnyDate(u.updatedAt || first?.credits?.updatedAt || Date.now());

    const fiveHour = primary || null;
    const week = secondary || null;

    return {
      latestUpdatedAt: latest,
      periods: { fiveHour, week },
      fetchedAt: fmtDateTime(Date.now()),
      source: first.source || 'web',
      accountEmail: u.accountEmail || first?.usage?.accountEmail || null,
      candidatesCount: (fiveHour ? 1 : 0) + (week ? 1 : 0),
    };
  }

  return {
    latestUpdatedAt: fmtDateTime(Date.now()),
    periods: { fiveHour: null, week: null },
    fetchedAt: fmtDateTime(Date.now()),
    source: 'unknown',
  };
}

function hasCodexWebSessionFile() {
  try {
    if (!fs.existsSync(CODEX_WEB_SESSION_FILE)) return false;
    const s = JSON.parse(fs.readFileSync(CODEX_WEB_SESSION_FILE, 'utf8'));
    return !!(s?.cookie || s?.authorization);
  } catch {
    return false;
  }
}

function buildCookieHeader(cookies) {
  return (cookies || [])
    .filter((c) => c && c.name && c.value)
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
}

function extractCsrfToken(cookies) {
  const item = (cookies || []).find((c) => c && String(c.name) === '__Host-next-auth.csrf-token');
  if (!item?.value) return null;
  const val = String(item.value);
  const idx = val.indexOf('%7C');
  if (idx > 0) return decodeURIComponent(val.slice(0, idx));
  const plainIdx = val.indexOf('|');
  if (plainIdx > 0) return val.slice(0, plainIdx);
  return decodeURIComponent(val);
}

function hasCodexSessionCookie(cookies) {
  const names = new Set((cookies || []).map((c) => String(c?.name || '').toLowerCase()));
  return names.has('__secure-next-auth.session-token') || names.has('__secure-authjs.session-token');
}

async function persistCodexWebSessionFromContext(context, source = 'oauth-browser') {
  const cookies = await context.cookies(['https://chatgpt.com', 'https://openai.com']);
  if (!hasCodexSessionCookie(cookies)) return false;
  const cookie = buildCookieHeader(cookies);
  if (!cookie) return false;
  const csrfToken = extractCsrfToken(cookies);
  const webSession = {
    url: 'https://chatgpt.com/backend-api/wham/usage',
    cookie,
    csrfToken: csrfToken || null,
    authorization: null,
    source,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(CODEX_WEB_SESSION_FILE, JSON.stringify(webSession, null, 2));
  return true;
}

function stopCodexOauthMonitor() {
  if (codexOauthInterval) {
    clearInterval(codexOauthInterval);
    codexOauthInterval = null;
  }
}

async function closeCodexOauthContext() {
  if (codexOauthAttachedViaCDP) {
    codexOauthContext = null;
    codexOauthAttachedViaCDP = false;
    return;
  }
  try {
    if (codexOauthContext) await codexOauthContext.close();
  } catch {}
  codexOauthContext = null;
  codexOauthAttachedViaCDP = false;
}

function codexOauthStatusPayload() {
  return {
    status: codexOauthState.status,
    startedAt: codexOauthState.startedAt,
    connectedAt: codexOauthState.connectedAt,
    lastCheckedAt: codexOauthState.lastCheckedAt,
    lastError: codexOauthState.lastError,
    message: codexOauthState.message,
    mode: codexOauthAttachedViaCDP ? 'cdp' : 'playwright',
    hasWebSession: hasCodexWebSessionFile(),
  };
}

function getCodexRawError(raw) {
  const first = Array.isArray(raw) ? (raw[0] || {}) : raw;
  if (!first || typeof first !== 'object') return null;
  const msg = first?.error?.message || first?.error || null;
  return msg ? String(msg) : null;
}

function isCodexUsageUsable(usage) {
  const periods = usage?.periods || {};
  const nodes = [periods.fiveHour, periods.week].filter((x) => x && typeof x === 'object');
  if (nodes.length === 0) return false;
  return nodes.some((n) => (
    n.percent !== null && n.percent !== undefined
  ) || (
    n.used !== null && n.used !== undefined
  ) || (
    n.total !== null && n.total !== undefined
  ) || (
    n.remaining !== null && n.remaining !== undefined
  ) || (
    n.refreshAt !== null && n.refreshAt !== undefined
  ));
}

function friendlyCodexCliError(e) {
  const stderr = String(e?.stderr || '');
  const stdout = String(e?.stdout || '');
  const msg = String(e?.message || '');
  const all = `${msg}\n${stderr}\n${stdout}`;
  if (all.includes("unexpected argument '--json'") || all.includes("unrecognized subcommand 'usage'")) {
    return '当前 codex CLI 版本不再支持 `codex usage --json`';
  }
  return msg || '调用失败';
}

async function fetchCodexQuota() {
  const CODEXBAR_PATH = '/opt/homebrew/bin/codexbar';
  const codexbarPath = fs.existsSync(CODEXBAR_PATH) ? CODEXBAR_PATH : null;
  const codexPath = isCmdAvailable('codex');
  const reasons = [];

  // 优先使用 codexbar
  if (codexbarPath) {
    try {
      const { stdout, stderr } = await execFileAsync(codexbarPath, ['usage', '--provider', 'codex', '--json'], {
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 2,
        encoding: 'utf8',
      });
      const raw = parseJsonText((stdout || '').trim() || (stderr || '').trim());
      const rawErr = getCodexRawError(raw);
      if (rawErr) throw new Error(rawErr);
      const usage = normalizeCodexUsage(raw);
      if (!isCodexUsageUsable(usage)) {
        throw new Error('返回数据不含可用 usage 字段');
      }
      return {
        configured: true,
        ...usage,
        source: usage.source || 'codexbar'
      };
    } catch (e) {
      const msg = String(e?.message || '调用失败');
      reasons.push(`codexbar: ${msg}`);
      console.log('[Codex] codexbar 调用失败:', msg);
    }
  }

  // 退而使用 codex CLI
  if (codexPath) {
    try {
      const { stdout, stderr } = await execFileAsync(codexPath, ['usage', '--json'], {
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 2,
        encoding: 'utf8',
      });
      const raw = parseJsonText((stdout || '').trim() || (stderr || '').trim());
      const rawErr = getCodexRawError(raw);
      if (rawErr) throw new Error(rawErr);
      const usage = normalizeCodexUsage(raw);
      if (!isCodexUsageUsable(usage)) {
        throw new Error('返回数据不含可用 usage 字段');
      }
      return {
        configured: true,
        ...usage,
        source: usage.source || 'codex-cli'
      };
    } catch (e) {
      const msg = friendlyCodexCliError(e);
      reasons.push(`codex CLI: ${msg}`);
      console.log('[Codex] codex CLI 调用失败:', msg);
    }
  }

  // 检查 web session
  if (fs.existsSync(CODEX_WEB_SESSION_FILE)) {
    try {
      const webSession = JSON.parse(fs.readFileSync(CODEX_WEB_SESSION_FILE, 'utf8'));
      if (webSession?.cookie || webSession?.authorization) {
        const headers = {
          accept: '*/*',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          referer: 'https://chatgpt.com/',
          origin: 'https://chatgpt.com',
        };
        if (webSession.cookie) headers.cookie = webSession.cookie;
        if (webSession.csrfToken) headers['x-csrf-token'] = webSession.csrfToken;
        if (webSession.authorization) headers.authorization = webSession.authorization;

        const resp = await fetch(webSession.url || 'https://chatgpt.com/backend-api/wham/usage', {
          method: 'GET',
          headers,
        });
        const text = await resp.text();
        if (!resp.ok) {
          const extra = reasons.length ? `；先前失败：${reasons.join(' | ')}` : '';
          return { error: `codex web 请求失败 ${resp.status}${extra}`, configured: true };
        }
        const raw = parseJsonText(text);
        const rawErr = getCodexRawError(raw);
        if (rawErr) {
          const extra = reasons.length ? `；先前失败：${reasons.join(' | ')}` : '';
          return { error: `codex web 返回错误：${rawErr}${extra}`, configured: true };
        }
        const usage = normalizeCodexUsage(raw);
        if (!isCodexUsageUsable(usage)) {
          const extra = reasons.length ? `；先前失败：${reasons.join(' | ')}` : '';
          return { error: `codex web 返回空 usage${extra}`, configured: true };
        }
        return {
          configured: true,
          ...usage,
          source: usage.source || 'web'
        };
      }
    } catch (e) {
      console.log('[Codex] web session 调用失败:', e.message);
    }
  }

  const detail = reasons.length ? `（失败详情：${reasons.join(' | ')}）` : '';
  return { error: `没有可用数据源：未检测到可用 codex 数据源${detail}`, configured: false };
}

// ==================== Gemini Provider ====================
function normalizeGeminiUsage(raw) {
  // codexbar gemini shape
  if (Array.isArray(raw) && raw.length > 0 && String(raw[0]?.provider || '').toLowerCase() === 'gemini') {
    const first = raw[0] || {};
    const u = first.usage || {};
    const p = u.pro || u.primary || null;
    const s = u.flash || u.secondary || null;

    const mapBucket = (bucket) => {
      if (!bucket) return null;
      const percent = round1(bucket.percent ?? bucket.usedPercent);
      const remainingPercent = percent === null ? null : round1(100 - percent);
      return {
        total: toNumOrNull(bucket.total ?? bucket.limit ?? null),
        used: toNumOrNull(bucket.used ?? bucket.count ?? null),
        remaining: toNumOrNull(bucket.remaining ?? null),
        percent,
        remainingPercent,
        refreshAt: fmtAnyDate(bucket.resetsAt || bucket.resetAt || bucket.nextReset),
        refreshInHours: hoursUntil(bucket.resetsAt || bucket.resetAt || bucket.nextReset),
        windowMinutes: toNumOrNull(bucket.windowMinutes ?? bucket.window_minutes),
      };
    };

    return {
      latestUpdatedAt: fmtAnyDate(u.updatedAt || u.updated_at || first?.credits?.updatedAt || Date.now()),
      periods: {
        pro: {
          label: 'Gemini Pro',
          ...(mapBucket(p) || {}),
        },
        flash: {
          label: 'Gemini Flash',
          ...(mapBucket(s) || {}),
        },
      },
      rawBuckets: {
        primary: mapBucket(p),
        secondary: mapBucket(s),
      },
      fetchedAt: fmtDateTime(Date.now()),
      source: first.source || 'api',
      accountEmail: u.accountEmail || u.email || null,
      candidatesCount: (p ? 1 : 0) + (s ? 1 : 0),
    };
  }

  // Fallback
  return {
    latestUpdatedAt: fmtDateTime(Date.now()),
    periods: { pro: null, flash: null },
    fetchedAt: fmtDateTime(Date.now()),
    source: 'unknown',
  };
}

async function fetchGeminiQuota() {
  const CODEXBAR_PATH = '/opt/homebrew/bin/codexbar';
  const codexbarPath = fs.existsSync(CODEXBAR_PATH) ? CODEXBAR_PATH : null;
  const geminiPath = isCmdAvailable('gemini');

  // 优先使用 codexbar
  if (codexbarPath) {
    try {
      const { stdout, stderr } = await execFileAsync(codexbarPath, ['usage', '--provider', 'gemini', '--json'], {
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 2,
        encoding: 'utf8',
      });
      const raw = parseJsonText(stdout || stderr);
      const usage = normalizeGeminiUsage(raw);
      return {
        configured: true,
        ...usage,
        source: usage.source || 'codexbar'
      };
    } catch (e) {
      console.log('[Gemini] codexbar 调用失败:', e.message);
    }
  }

  // 退而使用 gemini CLI
  if (geminiPath) {
    try {
      const { stdout, stderr } = await execFileAsync(
        geminiPath,
        ['--prompt', '/stats', '--output-format', 'json', '--yolo'],
        {
          timeout: 30000,
          maxBuffer: 1024 * 1024 * 2,
          encoding: 'utf8',
        }
      );
      const raw = parseJsonText(stdout || stderr);
      const usage = normalizeGeminiUsage(raw);
      return {
        configured: true,
        ...usage,
        source: usage.source || 'gemini-cli'
      };
    } catch (e) {
      console.log('[Gemini] gemini CLI 调用失败:', e.message);
    }
  }

  return { error: '没有可用数据源：未检测到 codexbar 或 gemini CLI', configured: false };
}

// ==================== API Routes ====================

// 导入百炼 cURL
app.post('/api/bailian/import-curl', (req, res) => {
  const { curl } = req.body;
  if (!curl) return res.status(400).json({ error: '缺少 cURL 内容' });
  
  try {
    const session = parseBailianCurl(curl);
    config.bailian = { ...config.bailian, ...session, source: 'manual-curl' };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    res.json({ ok: true, updatedAt: session.updatedAt });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// 获取配额
app.get('/api/quota/:provider', async (req, res) => {
  const provider = req.params.provider;

  try {
    let result;
    switch (provider) {
      case 'kimi':
        result = await fetchKimiQuota();
        break;
      case 'minimax':
        result = await fetchMiniMaxQuota();
        break;
      case 'bailian':
        result = await fetchBailianQuota();
        break;
      case 'codex':
        result = await fetchCodexQuota();
        break;
      case 'gemini':
        result = await fetchGeminiQuota();
        break;
      default:
        return res.status(404).json({ error: `未知 provider: ${provider}` });
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 获取所有 provider 状态
app.get('/api/providers', (req, res) => {
  // 检查是否可以从 codexbar 自动获取
  const codexbarMinimax = getCodexbarMinimaxKey();
  const hasCodexbarMinimax = !!codexbarMinimax;

  res.json({
    providers: ['kimi', 'minimax', 'bailian', 'codex', 'gemini'],
    configured: {
      kimi: !!(config.kimi?.auth_token),
      minimax: !!(config.minimax?.api_token) || hasCodexbarMinimax,
      bailian: !!(config.bailian?.cookie),
      codex: fs.existsSync('/opt/homebrew/bin/codexbar') || isCmdAvailable('codex') || hasCodexWebSessionFile(),
      gemini: fs.existsSync('/opt/homebrew/bin/codexbar') || isCmdAvailable('gemini')
    }
  });
});

// 获取配置
app.get('/api/config', (req, res) => {
  // 检查是否可以从 codexbar 自动获取
  const codexbarMinimax = getCodexbarMinimaxKey();
  const hasCodexbarMinimax = !!codexbarMinimax;

  res.json({
    kimi: {
      auth_token: config.kimi?.auth_token || '',
      configured: !!(config.kimi?.auth_token),
      auto_source: 'safari'
    },
    minimax: {
      api_token: config.minimax?.api_token || '',
      region: config.minimax?.region || 'china',
      configured: !!(config.minimax?.api_token) || hasCodexbarMinimax,
      auto_source: hasCodexbarMinimax ? 'codexbar' : null
    },
    bailian: {
      cookie: config.bailian?.cookie || '',
      sec_token: config.bailian?.sec_token || '',
      configured: !!(config.bailian?.cookie)
    },
    codex: {
      configured: fs.existsSync('/opt/homebrew/bin/codexbar') || !!isCmdAvailable('codex') || hasCodexWebSessionFile(),
      oauth_status: codexOauthState.status,
      oauth_connected_at: codexOauthState.connectedAt || null
    },
    gemini: {
      configured: fs.existsSync('/opt/homebrew/bin/codexbar') || !!isCmdAvailable('gemini')
    }
  });
});

// 更新配置
app.post('/api/config', (req, res) => {
  try {
    const newConfig = req.body;

    if (newConfig.kimi) {
      config.kimi = { ...config.kimi, ...newConfig.kimi };
    }
    if (newConfig.minimax) {
      config.minimax = { ...config.minimax, ...newConfig.minimax };
    }
    if (newConfig.bailian) {
      config.bailian = { ...config.bailian, ...newConfig.bailian };
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

    console.log('[Config] 配置已更新');

    res.json({
      message: '配置已保存',
      providers: Object.keys(config),
      configured: {
        kimi: !!(config.kimi?.auth_token),
        minimax: !!(config.minimax?.api_token),
        bailian: !!(config.bailian?.cookie)
      }
    });
  } catch (e) {
    console.error('[Config] 保存失败:', e);
    res.status(500).json({ error: e.message });
  }
});

// 导入 Codex Web cURL
app.post('/api/codex/import-curl', (req, res) => {
  try {
    const { curl } = req.body;
    if (!curl) {
      return res.status(400).json({ error: '缺少 cURL 内容' });
    }

    const urlMatch = curl.match(/curl\s+'([^']+)'/);
    const cookieMatch = curl.match(/(?:\s|\\)-b\s+'([^']+)'/);
    const csrfMatch = curl.match(/(?:\s|\\)-H\s+'(?:x-csrf-token|X-CSRF-Token):\s*([^']+)'/);
    const authMatch = curl.match(/(?:\s|\\)-H\s+'authorization:\s*Bearer\s+([^']+)'/i);

    const webSession = {
      url: urlMatch ? urlMatch[1] : 'https://chatgpt.com/backend-api/wham/usage',
      cookie: cookieMatch ? cookieMatch[1] : null,
      csrfToken: csrfMatch ? csrfMatch[1] : null,
      authorization: authMatch ? `Bearer ${authMatch[1]}` : null,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(CODEX_WEB_SESSION_FILE, JSON.stringify(webSession, null, 2));

    res.json({ ok: true, updatedAt: webSession.updatedAt });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// 启动 Codex 网页登录（近似 OAuth：浏览器登录态接入）
app.post('/api/codex/oauth/start', async (req, res) => {
  try {
    if (codexOauthState.status === 'pending' && codexOauthContext) {
      return res.json({ ok: true, ...codexOauthStatusPayload() });
    }

    let chromium;
    try {
      ({ chromium } = require('playwright'));
    } catch {
      return res.status(500).json({ error: '缺少 playwright 依赖，请先安装' });
    }

    stopCodexOauthMonitor();
    await closeCodexOauthContext();

    codexOauthState.status = 'pending';
    codexOauthState.startedAt = new Date().toISOString();
    codexOauthState.connectedAt = null;
    codexOauthState.lastCheckedAt = null;
    codexOauthState.lastError = null;
    codexOauthState.message = '正在准备浏览器登录...';

    const cdpUrl = process.env.CHROME_CDP_URL || 'http://127.0.0.1:9222';
    let connectedViaCDP = false;
    try {
      const browser = await chromium.connectOverCDP(cdpUrl);
      codexOauthContext = browser.contexts()[0] || (await browser.newContext());
      codexOauthAttachedViaCDP = true;
      connectedViaCDP = true;
      codexOauthState.message = `已连接当前 Chrome（${cdpUrl}），请确认 ChatGPT 登录态`;
    } catch {
      codexOauthContext = await chromium.launchPersistentContext(CODEX_OAUTH_PROFILE_DIR, {
        channel: 'chrome',
        headless: false,
        args: ['--no-first-run'],
      });
      codexOauthAttachedViaCDP = false;
      codexOauthState.message = '未连上当前 Chrome，已启动独立浏览器，请完成登录（支持扫码）';
      codexOauthContext.on('close', () => {
        codexOauthContext = null;
        stopCodexOauthMonitor();
        if (codexOauthState.status === 'pending') {
          codexOauthState.status = hasCodexWebSessionFile() ? 'connected' : 'idle';
          codexOauthState.message = hasCodexWebSessionFile() ? '浏览器已关闭，已有可用会话' : '浏览器已关闭，尚未获取会话';
        }
      });
    }
    let page = codexOauthContext.pages()[0];
    if (!page) page = await codexOauthContext.newPage();
    if (!connectedViaCDP) {
      await page.goto('https://chatgpt.com/auth/login', { waitUntil: 'domcontentloaded' });
    }

    codexOauthInterval = setInterval(async () => {
      if (codexOauthChecking || !codexOauthContext) return;
      codexOauthChecking = true;
      try {
        codexOauthState.lastCheckedAt = new Date().toISOString();
        const ok = await persistCodexWebSessionFromContext(codexOauthContext, 'oauth-browser');
        if (ok) {
          codexOauthState.status = 'connected';
          codexOauthState.connectedAt = new Date().toISOString();
          codexOauthState.message = '已获取登录会话，可直接拉取 Codex usage';
          codexOauthState.lastError = null;
          stopCodexOauthMonitor();
        }
      } catch (e) {
        codexOauthState.status = 'error';
        codexOauthState.lastError = String(e?.message || '未知错误');
        codexOauthState.message = '会话读取失败，请重试';
        stopCodexOauthMonitor();
      } finally {
        codexOauthChecking = false;
      }
    }, 3000);

    res.json({ ok: true, ...codexOauthStatusPayload() });
  } catch (e) {
    codexOauthState.status = 'error';
    codexOauthState.lastError = String(e?.message || '未知错误');
    codexOauthState.message = '启动失败，请检查本机 Chrome 与 Playwright';
    stopCodexOauthMonitor();
    await closeCodexOauthContext();
    res.status(500).json({ error: codexOauthState.lastError, ...codexOauthStatusPayload() });
  }
});

app.get('/api/codex/oauth/status', (req, res) => {
  res.json({ ok: true, ...codexOauthStatusPayload() });
});

app.post('/api/codex/oauth/stop', async (req, res) => {
  stopCodexOauthMonitor();
  await closeCodexOauthContext();
  codexOauthState.status = hasCodexWebSessionFile() ? 'connected' : 'idle';
  codexOauthState.message = hasCodexWebSessionFile() ? '已停止监听，已有可用会话' : '已停止';
  codexOauthState.lastError = null;
  res.json({ ok: true, ...codexOauthStatusPayload() });
});

// 测试所有 provider
app.get('/api/test', async (req, res) => {
  const results = {
    kimi: await fetchKimiQuota(),
    minimax: await fetchMiniMaxQuota(),
    bailian: await fetchBailianQuota(),
    codex: await fetchCodexQuota(),
    gemini: await fetchGeminiQuota()
  };
  res.json(results);
});

// 静态文件服务
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// 主页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('🚀 API Quota Monitor Server');
  console.log('='.repeat(60));
  console.log(`📁 Config: ${CONFIG_PATH}`);
  console.log(`🔑 Configured: kimi=${!!config.kimi?.auth_token}, minimax=${!!config.minimax?.api_token}, bailian=${!!config.bailian?.cookie}, codex=${fs.existsSync('/opt/homebrew/bin/codexbar') || !!isCmdAvailable('codex')}, gemini=${fs.existsSync('/opt/homebrew/bin/codexbar') || !!isCmdAvailable('gemini')}`);
  console.log('='.repeat(60));
  console.log('📡 API Endpoints:');
  console.log('   GET  /api/providers      - List providers');
  console.log('   GET  /api/quota/:name   - Get quota for provider');
  console.log('   GET  /api/config        - Get current config');
  console.log('   POST /api/config        - Update config');
  console.log('   GET  /api/test          - Test all providers');
  console.log('='.repeat(60));
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log('='.repeat(60));
  console.log('');
});
