# 自动化部署与外网访问

## 元信息
```yaml
title: 自动化部署与外网访问
date: 2026-02-04
type: iteration
tags: [github-pages, actions, ci, deployment]
status: Completed
author: Gemini
```

## 背景

为了方便随时随地查阅知识库，并实现“提交即发布”的自动化工作流，需要将项目部署至外网环境。

## 技术方案

### 1. 托管平台: GitHub Pages
- **优势**: 免费、稳定、支持自定义域名、与代码仓库深度集成。
- **Source 选择**: `GitHub Actions` (优于传统的分支部署，支持更复杂的构建逻辑)。

### 2. 自动化流水线: GitHub Actions
- **配置文件**: `.github/workflows/deploy.yml`。
- **流程**: 
    1. 推送代码至 `main` 分支触发。
    2. Node.js 环境初始化（版本 20）。
    3. 安装依赖并执行 `npm run docs:build`。
    4. 将生成的 `dist` 目录作为 Artifact 上传并部署至 GitHub Pages 环境。

### 3. 适配配置
- **Base URL**: 设置为 `/xin_wiki/` 以匹配 GitHub Pages 的二级目录结构。
- **并发控制**: 设置 `cancel-in-progress: true`，解决多次提交导致的部署冲突。

## 部署记录

- **仓库地址**: [https://github.com/CtriXin/xin_wiki](https://github.com/CtriXin/xin_wiki)
- **访问地址**: [https://ctrixin.github.io/xin_wiki/](https://ctrixin.github.io/xin_wiki/)

## 遇到问题与解决

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Permission denied (publickey) | 本地未配置 GitHub SSH Key | 切换远程仓库地址为 HTTPS 协议 |
| 样式加载失败 (404) | 静态资源引用路径未适配二级目录 | 在 `config.mjs` 中设置 `base: '/xin_wiki/'` |
| Multiple artifacts found | 并发构建任务冲突 | 在 workflow 中添加 `concurrency` 并发控制配置 |

## 关联文档
- [知识库系统现代化与架构合并](./wiki-modernization-and-merge.md)
- [首页](./../index.md)
