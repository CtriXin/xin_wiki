---
title: Kimi Free Rate Limit 问题解决
date: 2026-02-04
tags: [Kimi, Rate Limit, Fallback]
---

# Kimi Free Rate Limit 问题解决

> **摘要**: Kimi Free 频繁触发 rate limit 时，添加 fallback 机制实现自动切换到备选模型，避免等待。

## 背景与需求

使用 Kimi K2.5 Free 时频繁遇到：
```
rate limit exceeded, please try again later [retrying in 10s attempt #4]
```

**原因**：
- Kimi Free 有严格的速率限制
- 默认只会重试，不会自动切换模型
- 等待重试浪费时间

## 技术方案

### 方案 1：添加 Fallback（推荐）

在 agent 配置中添加 fallback 链：

```json
{
  "agents": {
    "librarian": {
      "model": "opencode/kimi-k2.5-free",
      "variant": "high",
      "fallback": "opencode/glm-4.7-free"
    },
    "explore": {
      "model": "opencode/kimi-k2.5-free",
      "fallback": "opencode/minimax-2.1-free"
    }
  }
}
```

**效果**：
```
Before: Kimi Free → 超限 → 等 10s 重试 → 超限 → 等 10s 重试...
After:  Kimi Free → 超限 → 自动切 GLM/MiniMax Free → 完成
```

### 方案 2：直接用 Gemini Flash（更稳）

如果 Kimi Free 限制太严，直接用 Gemini Flash：

```json
{
  "agents": {
    "librarian": {
      "model": "google/gemini-2.5-flash",
      "variant": "high"
    },
    "explore": {
      "model": "google/gemini-2.5-flash"
    }
  },
  "categories": {
    "quick": {
      "model": "google/gemini-2.5-flash"
    },
    "code-exploration": {
      "model": "google/gemini-2.5-flash"
    }
  }
}
```

**优势**：
- Gemini 账户比 Kimi Free 稳定
- Flash 速度快、限制宽松
- 成本也很低

### 模型降级策略

| Tier | 模型 | 适用场景 |
|------|------|---------|
| Tier 1 | GPT-5.2/Codex | 核心架构、复杂逻辑 |
| Tier 2 | Gemini 3 Pro/2.5 Pro | UI还原、组件开发 |
| Tier 3 | Kimi K2 付费 | 中高端代码、调试 |
| Tier 4 | Gemini 2.5 Flash | 快速响应、中等任务 |
| Tier 5 | Kimi Free | 中端辅助、备选 |
| Tier 6 | GLM/MiniMax Free | 最简单执行、纯 fallback |

### 推荐配置（平衡成本和稳定性）

```json
{
  "agents": {
    "librarian": {
      "model": "google/gemini-2.5-flash",
      "variant": "high"
    },
    "explore": {
      "model": "opencode/kimi-k2.5-free",
      "fallback": "opencode/glm-4.7-free"
    }
  }
}
```

**理由**：
- Librarian 用 Gemini Flash（稳定、快）
- Explore 用 Kimi Free（免费）+ GLM fallback
- 避免频繁触发 rate limit

### 验证配置

```bash
# 连续发起几个搜索任务，测试 fallback
@librarian 查找所有 Vue 文件
@librarian 查找所有组件
@librarian 查找所有 API
```

第 3 次应该会触发超限并自动 fallback。
