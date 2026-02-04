---
title: 自动化部署与外网访问
date: 2026-02-04
tags: [github-pages, actions, ci, deployment]
---

# 自动化部署与外网访问

> **总结**: 配置 GitHub Actions 自动化部署流水线，将本地知识库通过 HTTPS 安全发布至 GitHub Pages，实现“提交即上线”的高效工作流。

## 技术方案

1. **CI/CD**: 使用 GitHub Actions 执行构建任务。
2. **环境适配**: 修正 `base` 路径以适配 GitHub Pages 二级域名。
3. **并发控制**: 引入并发取消机制，确保部署产物一致性。

## 关联文档
- [现代化与架构合并](./wiki-modernization-and-merge.md)