---
title: 多模型配置策略
date: 2026-02-04
tags: [oh-my-opencode, 模型配置, 成本优化]
---

# 多模型配置策略：付费 + 免费混合使用

> **摘要**: 配置 oh-my-opencode 实现付费模型处理核心任务，免费模型处理日常任务，整体成本降低 60-80%。

## 背景与需求

目标：
- **核心任务**（架构设计、复杂逻辑）：使用付费模型
- **日常任务**（搜索、简单问答）：使用免费模型
- **Fallback**：主要模型不可用时自动降级

## 技术方案

### 模型分配策略

| Agent | 模型 | 用途 | 成本 |
|-------|------|------|------|
| **Sisyphus** (主) | GPT-5.2 max | 复杂架构、核心逻辑 | 💰 付费 |
| **Hephaestus** | GPT-5.2 Codex medium | 深度编码任务 | 💰 付费 |
| **Oracle** | Kimi K2 | 调试、设计审查 | 💰 付费 |
| **Frontend Engineer** | Gemini 3 Pro max | UI还原、组件开发 | 💰 付费 |
| **Multimodal Looker** | Gemini 3 Pro max | 图片/多模态 | 💰 付费 |
| **Librarian** | Kimi K2.5 Free | 代码库搜索 | ✅ 免费 |
| **Explore** | Kimi K2.5 Free | 快速探索 | ✅ 免费 |
| **Quick 任务** | Kimi K2.5 Free | 简单问答 | ✅ 免费 |
| **Simple** | GLM 4.7 Free | 最简单任务 | ✅ 免费 |
| **Minimal** | MiniMax 2.1 Free | 备选 | ✅ 免费 |

### 完整配置示例

```json
{
  "agents": {
    "sisyphus": {
      "model": "openai/gpt-5.2",
      "variant": "max",
      "temperature": 0.7,
      "skills": ["playwright", "git-master"],
      "permission": {
        "edit": "allow",
        "bash": "allow",
        "webfetch": "ask"
      }
    },
    "hephaestus": {
      "model": "openai/gpt-5.2-codex",
      "variant": "medium"
    },
    "oracle": {
      "model": "kimi/kimi-k2",
      "variant": "high"
    },
    "frontend-engineer": {
      "model": "google/gemini-3-pro",
      "variant": "max"
    },
    "librarian": {
      "model": "opencode/kimi-k2.5-free",
      "variant": "high",
      "fallback": "opencode/glm-4.7-free"
    },
    "explore": {
      "model": "opencode/kimi-k2.5-free",
      "fallback": "opencode/minimax-2.1-free"
    },
    "multimodal-looker": {
      "model": "google/gemini-3-pro",
      "variant": "max"
    },
    "prometheus": {
      "model": "kimi/kimi-k2",
      "variant": "high"
    }
  },
  "categories": {
    "visual-engineering": {
      "model": "google/gemini-3-pro",
      "variant": "max"
    },
    "deep": {
      "model": "openai/gpt-5.2",
      "variant": "medium"
    },
    "quick": {
      "model": "opencode/kimi-k2.5-free"
    },
    "ultrabrain": {
      "model": "openai/gpt-5.2",
      "variant": "xhigh"
    },
    "artistry": {
      "model": "google/gemini-3-pro",
      "variant": "max"
    },
    "code-exploration": {
      "model": "opencode/kimi-k2.5-free"
    },
    "simple": {
      "model": "opencode/glm-4.7-free"
    },
    "minimal": {
      "model": "opencode/minimax-2.1-free"
    }
  }
}
```

## 成本优化效果

| 指标 | 比例 |
|------|------|
| 日常任务（免费模型） | ~70% |
| 核心任务（付费模型） | ~25% |
| Fallback（GLM/MiniMax） | ~5% |
| **总体成本降低** | **60-80%** |
