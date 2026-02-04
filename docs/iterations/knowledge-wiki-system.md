# 个人知识库系统搭建

## 元信息
```yaml
title: 个人知识库系统搭建
date: 2026-02-04
type: iteration
tags: [knowledge-base, wiki, vitepress, markdown, documentation]
status: Active
author: xin
```

## 背景与需求

之前的技术记录散落在各处：
- 配置文件注释
- 命令行历史
- 记忆中的操作步骤

需要一个**结构化的知识库**来记录：
1. 技术迭代和决策
2. 脚本和工具的使用方法
3. Bug 修复过程
4. 新功能的调研和实现

## 核心需求

| 需求 | 优先级 | 说明 |
|------|--------|------|
| 易于编写 | P0 | 使用 Markdown，不需要复杂工具 |
| 版本控制 | P0 | 可以追溯历史变更 |
| 可持续迭代 | P0 | 统一的格式，方便持续添加 |
| 美观展示 | P1 | 比纯 Markdown 更好看 |
| 全文搜索 | P1 | 快速找到需要的内容 |
| 低成本部署 | P1 | 免费或极低成本 |

## 方案对比

### 方案1: 纯 Markdown + Git
- ✅ 零成本、版本控制、随时编辑
- ❌ 阅读体验一般、无搜索、无分类
- **适合**: 个人快速记录

### 方案2: Notion / 语雀
- ✅ 可视化编辑、自带搜索
- ❌ 依赖第三方、导出不便、自定义受限
- **适合**: 团队协作

### 方案3: VitePress 静态网站 ⭐ 选定
- ✅ Markdown 原生、现代化设计、全文搜索、暗黑模式
- ✅ 静态生成，免费部署到 GitHub Pages/Vercel
- ❌ 需要 Node.js 构建
- **适合**: 个人知识库，内容 + 展示兼顾

### 方案4: MediaWiki / DokuWiki
- ✅ 功能强大、专业百科体验
- ❌ 需要服务器、配置复杂、过于重量级
- **适合**: 大型文档项目

## 最终架构

采用 **双轨制**：

```
knowledge-wiki/              # Markdown 源文件（内容层）
├── README.md               # 入口导航
├── CHANGELOG.md            # 变更时间线
├── INDEX.md                # 主题索引
├── templates/              # 统一模板
│   ├── script.md
│   ├── bugfix.md
│   ├── feature.md
│   └── iteration.md
├── scripts/                # 脚本记录
├── features/               # 功能记录
├── bugfixes/               # Bug修复
└── iterations/             # 迭代记录

knowledge-wiki-web/          # VitePress 网站（展示层）
├── docs/                   # 网站内容（软链接或复制）
│   ├── .vitepress/
│   │   └── config.mjs     # 站点配置
│   ├── index.md           # 首页
│   ├── changelog.md
│   └── scripts/
├── package.json
└── README.md
```

## 关键设计决策

### 1. 模板系统
每种类型都有统一模板，确保格式一致：
- **script.md**: 背景、方案对比、代码、使用方法
- **bugfix.md**: 问题、根因、修复过程、预防措施
- **feature.md**: 需求、调研、实现、验收
- **iteration.md**: 背景、方案对比、架构、决策

### 2. 文件命名规范
```
YYYY-MM-DD-简短描述.md

例如:
2026-02-04-clash-verge-proxy-rules.md
2026-02-04-deploy-lookup-wrapper.md
```

### 3. 状态管理
- 🟡 Draft - 草稿/进行中
- 🟢 Active - 已启用/生效中
- 🔵 Completed - 已完成
- ⚪ Archived - 已归档/过时

### 4. 标签系统
每篇文档必须包含标签，便于索引：
```yaml
tags: [clash, proxy, network, shell, zsh]
```

## 实现过程

### 步骤1: 创建 Markdown 知识库
1. 设计目录结构
2. 创建模板文件
3. 编写第一篇文章（Clash Verge 配置）

### 步骤2: 搭建 VitePress 网站
1. 初始化项目: `npm install vitepress`
2. 配置 `config.mjs`: 导航、侧边栏、搜索
3. 设计首页: Hero 区域、特色展示
4. 同步 Markdown 内容

### 步骤3: 修复技术问题
**问题1**: ESM 模块错误
- 原因: VitePress 1.0 需要 ESM
- 解决: `config.js` → `config.mjs`, `package.json` 添加 `"type": "module"`

**问题2**: 主题加载失败
- 原因: 空的 `theme` 目录导致 VitePress 尝试加载不存在的自定义主题
- 解决: 删除空目录，使用默认主题

### 步骤4: 创建索引和导航
1. `CHANGELOG.md`: 时间线变更记录
2. `INDEX.md`: 按标签分类的索引
3. `.claude-skill.md`: AI 使用指南

## 最终效果

### Markdown 版本
- 纯文本，随时可用任何编辑器编写
- Git 版本控制，变更可追溯
- 模板确保格式统一

### VitePress 网站
- 🎨 现代化设计，默认就很好看
- 🔍 内置全文搜索（本地索引）
- 🌙 自动暗黑模式
- 📱 完美移动端适配
- ⚡ 静态生成，可部署到 GitHub Pages

## 使用方法

### 日常记录
```bash
# 在 knowledge-wiki/ 目录下
# 1. 复制对应模板
cp templates/script.md scripts/2026-02-04-new-script.md

# 2. 编辑内容
vim scripts/2026-02-04-new-script.md

# 3. 更新 CHANGELOG.md 和 INDEX.md
```

### 构建网站
```bash
cd knowledge-wiki-web

# 安装依赖
npm install

# 本地预览
npm run dev

# 构建（生成 dist/）
npm run build
```

### 部署
- **GitHub Pages**: 推送到 GitHub → Settings → Pages
- **Vercel**: 导入仓库 → 自动构建
- **Netlify**: 连接 GitHub → 自动部署

## 本次迭代成果

| 文档 | 类型 | 状态 |
|------|------|------|
| [Clash Verge 智能分流配置](./../scripts/clash-verge-proxy-rules.md) | 脚本 | 🟢 Active |
| [deploy & lookup 封装](./../scripts/deploy-lookup-wrapper.md) | 脚本 | 🟢 Active |
| 知识库系统搭建 | 迭代 | 🟢 Active |

## 后续优化点

- [ ] 自动化同步 Markdown → VitePress
- [ ] 添加全文搜索索引自动更新
- [ ] 配置 GitHub Actions 自动部署
- [ ] 设计自定义主题配色
- [ ] 添加阅读统计功能

## 关键经验

1. **内容优先**: 先保证 Markdown 内容质量，展示层只是锦上添花
2. **双轨制**: 源文件和网站分离，便于迁移和备份
3. **模板化**: 统一格式大幅降低维护成本
4. **渐进式**: 先跑起来，再优化体验

## 关联文档
- [CHANGELOG.md](./../changelog.md)
- [INDEX.md](./../index.md)
- [README.md](./../index.md)
