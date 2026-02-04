---
title: 变更日志格式规范升级
date: 2026-02-04
tags: [workflow, changelog, standardization]
---

# 变更日志格式规范升级

> **总结**: 针对 Changelog 的可读性进行了深度优化，确立了“类型优先、摘要前置”的记录顺序，并统一了时间戳格式。

## 变更详情

### 旧格式
- 信息分散，时间戳在标题中，阅读视线跳跃大。

### 新格式 (v3.0)
采用结构化信息块，阅读顺序更符合逻辑：
1. **类型**: 先看是什么（迭代/脚本/修复）。
2. **摘要**: 再看做了什么核心变更。
3. **文档**: 感兴趣则点击跳转详情。
4. **状态**: 确认当前进展。
5. **Last Modified**: 确认时效性。

```markdown
### 标题
- **类型**: iteration | script | feature
- **摘要**: 一句话描述
- **文档**: [链接](./path/to/doc.md)
- **状态**: 🟢 Active | 🔵 Completed
- **Last Modified**: YYYY-MM-DD HH:mm
```

## 关联文档
- [首页](../index.md)
