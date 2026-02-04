---
title: 个人知识库系统搭建
date: 2026-02-04
tags: [knowledge-base, wiki, vitepress, markdown]
---

# 个人知识库系统搭建

> **总结**: 搭建基于 VitePress 的技术知识库，确立“双轨制”架构（Markdown 源文件 + 静态站点展示），制定文档分类与命名规范，解决技术资产散落问题。

## 最终架构

采用 **内容层** 与 **展示层** 逻辑分离的架构：

```text
knowledge-wiki/
├── docs/                (内容仓库)
│   ├── iterations/      (系统演进)
│   ├── scripts/         (运维脚本)
│   └── index.md         (门户入口)
└── .vitepress/          (站点驱动)
```

## 关键设计决策

1. **模板化**: 统一 script, bugfix, iteration 格式。
2. **规范化**: 确立语义化文件名与元信息记录标准。
3. **自动化**: 规划 GitHub Actions 自动部署流程。

## 关联文档
- [方案对比与选型](./wiki-solution-comparison.md)