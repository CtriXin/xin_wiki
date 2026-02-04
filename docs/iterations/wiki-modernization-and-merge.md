# 知识库系统现代化与架构合并

## 元信息
```yaml
title: 知识库系统现代化与架构合并
date: 2026-02-04
type: iteration
tags: [ui, ux, architecture, merge, vitepress]
status: Completed
author: Gemini
```

## 背景与需求

在系统初步搭建后，发现以下问题：
1. **视觉风格平庸**: 默认主题缺乏辨识度，且在自定义过程中出现了文字颜色不可读（#3c3c43 在深色背景下）的问题。
2. **架构冗余**: 内容（knowledge-wiki）与展示（knowledge-wiki-web）分为两个项目，导致修改内容后需要手动同步，维护成本高。
3. **构建报错**: 原始 Markdown 文档中包含未转义的 HTML 标签（如 `<script>`），导致 VitePress 构建失败。

## 技术方案

### 1. UI/UX 深度定制
- **配色方案**: 采用 Cyber-Noir（赛博黑客）风格，以纯黑（#020202）为底，电光蓝（#3a86ff）、玫红（#ff006e）和紫罗兰（#8338ec）作为点缀。
- **动态交互**: 引入鼠标追踪技术，为 Feature 卡片添加动态发光（Spotlight）效果。
- **高亮优化**: 将代码高亮引擎切换至 `one-dark-pro`，并手动通过 CSS 滤镜提升 Token 的饱和度和亮度。
- **Logo 设计**: 创作了全新的几何风格 SVG Logo，契合系统整体色调。

### 2. 架构合并 (Merge)
- **单仓库管理**: 将 `knowledge-wiki` 的内容完整并入 `knowledge-wiki-web/docs/`。
- **统一路由**: 重新配置导航栏和侧边栏，将“迭代”、“脚本”、“功能”、“模板”统一索引。
- **Git 准备**: 添加 `.gitignore`，规范化提交路径，为上传 GitHub 做准备。

## 变更详情

### 视觉部分
- **style.css**: 强制全局深色模式，修复文字不可读问题，重构按钮与卡片样式。
- **index.js**: 注入鼠标坐标监听逻辑。
- **logo.svg**: 扁平化几何科技感设计。

### 架构部分
- 迁移 `templates/` 到 `docs/`。
- 迁移 `iterations/` 到 `docs/`。
- 修复了 10+ 处由于目录深度变化导致的死链。

## 最终效果

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 项目数量 | 2 个 (Wiki + Web) | 1 个 (统一管理) |
| 视觉风格 | 默认 VitePress | 极客风 Ethereal Tech |
| 阅读体验 | 文字颜色冲突 | 高对比度，代码高亮清晰 |
| 构建状态 | 报错 (HTML Tag 冲突) | 成功 (100% Pass) |

## 关联文档
- [CHANGELOG.md](../changelog.md)
- [系统架构规划](./knowledge-wiki-system.md)
