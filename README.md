# Xin Knowledge Wiki

> 统一的个人技术知识库 | 基于 VitePress

> 采用 Ethereal Tech (Cyber-Noir) 现代视觉风格

> 记录所以与AI共同迭代的过程...

## 🌐 在线预览

**访问地址**: [https://ctrixin.github.io/xin_wiki/](https://ctrixin.github.io/xin_wiki/)

## OpenCode + oh-my-opencode 专题

### 快速开始

| 文档 | 说明 |
|------|------|
| [oh-my-opencode 安装指南](./docs/oh-my-opencode-install.md) | 安装和基础配置 |
| [多模型配置策略](./docs/oh-my-opencode-model-strategy.md) | 付费+免费混合使用 |
| [模型选择指南](./docs/model-selection-guide.md) | 各模型专长和选型 |

### 进阶使用

| 文档 | 说明 |
|------|------|
| [Agent 调度机制](./docs/agent-scheduling.md) | 理解调度逻辑 |
| [Kimi Free Rate Limit 处理](./docs/kimi-free-rate-limit.md) | 解决限流问题 |
| [配置文件迁移](./docs/config-migration.md) | 多电脑同步配置 |

## 常用操作

### 本地管理
```bash
# 安装依赖
npm install

# 本地预览 (实时热更新)
npm run dev

# 构建静态站点
npm run build
```

### 部署与分发
```bash
# 推送内容到 GitHub (触发自动部署)
git add .
git commit -m "docs: 更新笔记内容"
git push

# 同步 Skill 指南到全局 AI 配置目录
npm run sync-skills
```

## 目录结构

```text
.
├── docs/                   # 核心内容 (Markdown)
│   ├── scripts/            # 脚本工具
│   ├── iterations/         # 系统迭代记录
│   ├── templates/          # 内容模板
│   └── .vitepress/         # 站点配置与主题
├── .claude-skill.md        # AI 协作指南
├── package.json
└── README.md
```

## 部署信息

本项目通过 **GitHub Actions** 自动部署至 **GitHub Pages**。
配置文件位于 `.github/workflows/deploy.yml`。
