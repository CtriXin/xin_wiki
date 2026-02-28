# AI Quota Monitor

实时监控各大 AI 平台配额使用情况的仪表盘应用。

## 功能特性

- **全新升级的现代化 UI**:
  - **高级视觉设计**: 玻璃拟态 (Glassmorphism)、环境光背景动画、Plus Jakarta Sans 字体。
  - **动态交互**: 进度条平滑加载动画、Bento Grid 响应式布局、侧边栏导航。
  - **实时感知**: 状态指示灯、同步刷新动画。
- **在线配置中心**: 无需编辑文件，直接在 UI 中配置 Kimi、MiniMax、百炼等 Token。
- **支持多个 AI 平台配额监控**:
  - **Kimi** - 月之暗面 Kimi 大模型
  - **MiniMax** - MiniMax 大模型
  - **阿里云百炼** - 阿里百炼 Coding Plan
  - **Codex** - OpenAI Codex (通过 codexbar/codex CLI)
  - **Gemini** - Google Gemini (通过 codexbar/gemini CLI)
- **多端适配**: 完美支持桌面端与移动端浏览器。
- **自动同步**: 首次加载自动请求所有平台数据，当前 Tab 每 60 秒自动刷新。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务

```bash
npm start
```

访问 http://localhost:3001

### 3. 配置凭证 (两种方式)

- **方式 A (推荐)**: 访问页面后点击右上角的 **⚙️ 配置中心** 图标，直接在界面中填入 Token 并保存。
- **方式 B**: 手动创建并编辑 `config.json` 文件：

```bash
cp config.example.json config.json
```

## 配置说明

### Kimi

1. 访问 https://www.kimi.com/code/console
2. 打开浏览器开发者工具 (F12)
3. 在 Network 标签找到任意 API 请求
4. 复制请求头中的 `Authorization: Bearer xxx` 中的 token
5. 或者复制 `kimi-auth` Cookie 值

### MiniMax

1. 访问 MiniMax 开放平台
2. 进入 API Key 管理页面
3. 创建或复制你的 API Token
4. 设置 `region`: `china` (国内) 或 `global` (海外)

### 阿里云百炼

1. 访问 https://bailian.console.aliyun.com
2. 登录阿里云账号
3. 打开浏览器开发者工具 (F12)
4. 在 Console 中运行 `document.cookie`
5. 复制完整的 Cookie 字符串

### Codex

Codex 支持三种数据源（按优先级）：

1. **codexbar** (推荐) - 自动检测 `/opt/homebrew/bin/codexbar`
2. **codex CLI** - 自动检测 `codex` 命令
3. **Web Session** - 导入 ChatGPT 网页的 cURL

导入 Web Session:
```bash
# 在 ChatGPT 页面 F12 → Network → 找到 wham/usage 请求
# 右键 → Copy → Copy as cURL
# 然后在设置页面导入
```

### Gemini

Gemini 支持两种数据源（按优先级）：

1. **codexbar** - 自动检测 `/opt/homebrew/bin/codexbar`
2. **gemini CLI** - 自动检测 `gemini` 命令

## API 接口

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/providers` | GET | 获取所有 provider 列表 |
| `/api/quota/:provider` | GET | 获取指定 provider 配额信息 |
| `/api/config` | GET | 获取当前配置 |
| `/api/config` | POST | 更新配置 |
| `/api/test` | GET | 测试所有 provider |

## 项目结构

```
monit/
├── backend/
│   └── server.js          # Node.js 后端服务
├── frontend/
│   └── index.html         # 前端页面
├── config.json            # 配置文件（需自行创建）
├── config.example.json    # 配置模板
├── package.json           # 项目依赖
└── README.md              # 说明文档
```

## 开发模式

支持热重载的开发模式：

```bash
npm run dev
```

## SwiftBar 菜单栏脚本

项目已内置脚本：

- `/Users/xin/monit/swiftbar/ai_monitor.1m.sh`

使用步骤：

1. 安装 SwiftBar（https://swiftbar.app/）
2. 在 SwiftBar 设置中把 Plugin Folder 指向：`/Users/xin/monit/swiftbar`
3. 保持服务运行：`npm start`

脚本支持顶部模式切换（在下拉菜单里直接点）：

- Auto / Kimi / MiniMax / Codex / Gemini / Bailian

也可命令行设置：

```bash
/Users/xin/monit/swiftbar/ai_monitor.1m.sh --set-top codex
```

## 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 HTML/CSS/JavaScript
- **UI**: 自定义 CSS 变量，玻璃拟态设计

## License

MIT
