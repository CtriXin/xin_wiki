# Xin Knowledge Wiki

> 统一的个人技术知识库 | 基于 VitePress
> 采用 Ethereal Tech (Cyber-Noir) 现代视觉风格

## 项目概述

本项目是一个单仓库架构的个人知识库系统。它将核心 Markdown 内容与基于 VitePress 的展示层完美结合，通过极客风的深色主题提供极致的阅读体验。

## 视觉风格

- **主题**: Ethereal Tech (Cyber-Noir)
- **配色**: 纯黑底色 (#020202) + 电光蓝 + 玫红 + 紫罗兰
- **特性**: 动态卡片发光效果、代码高亮深度优化、全响应式设计

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 本地预览 (实时热更新)
npm run dev

# 3. 构建静态站点
npm run build
```

## 目录结构

```text
.
├── docs/                   # 核心内容 (Markdown)
│   ├── scripts/            # 脚本工具
│   ├── iterations/         # 系统迭代
│   ├── templates/          # 内容模板
│   └── .vitepress/         # 站点配置与主题
├── .claude-skill.md        # AI 协作指南
├── package.json
└── README.md
```

## 创作流程

1. 在 `docs/` 对应目录下创建新的 `.md` 文件（可参考 `docs/templates/`）。
2. 在 `docs/changelog.md` 中记录变更。
3. 提交代码到 Git 仓库。

## 部署

推荐部署至 **GitHub Pages** 或 **Vercel**。项目已配置好 `.gitignore` 和 `cleanUrls`，可实现无缝自动化部署。