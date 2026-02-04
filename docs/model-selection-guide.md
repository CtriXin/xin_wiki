---
title: 模型选择指南
date: 2026-02-04
tags: [模型, Kimi, Gemini, GPT, 选型]
---

# 模型选择指南

> **摘要**: 根据实测结果，为不同场景选择最适合的模型，实现质量与成本的最优平衡。

## 背景与需求

了解各模型的实际表现和适用场景，避免资源浪费。

## 技术方案

### 模型质量梯队（实测）

1. **GPT-5.2 / Codex** → 最强代码能力
2. **Gemini 3 Pro / 2.5 Pro** → 前端/UI/多模态顶级
3. **Kimi K2 付费** → 代码能力强，性价比高
4. **Kimi K2.5 Free** → 免费中较好
5. **GLM 4.7 Free / MiniMax 2.1 Free** → 略差，只做最简单任务

### 各模型专长

#### GPT-5.2 / Codex
- **适用场景**：复杂架构、核心逻辑、深度编码
- **配置给**：Sisyphus, Hephaestus, deep/ultrabrain 类别
- **成本**：高，但质量最好

#### Gemini 3 Pro / 2.5 Pro
- **适用场景**：UI还原、视觉设计、多模态（图片解析）
- **配置给**：Frontend Engineer, Multimodal Looker, visual-engineering 类别
- **成本**：中等，账户充足

#### Gemini 2.5 Flash
- **适用场景**：快速响应、中等复杂度任务
- **特点**：速度快、限制宽松
- **替代方案**：如果 Kimi Free 限制太严，可以用 Flash 替代

#### Kimi K2 付费
- **适用场景**：中高端代码、调试、架构规划
- **配置给**：Oracle, Prometheus
- **优势**：200k 长上下文，性价比高

#### Kimi K2.5 Free
- **适用场景**：代码搜索、简单问答、日常探索
- **配置给**：Librarian, Explore, quick 类别
- **限制**：Rate limit 较严，需要 fallback

#### GLM 4.7 Free / MiniMax 2.1 Free
- **适用场景**：最简单的执行、纯 fallback
- **配置给**：simple/minimal 类别，fallback 链末端
- **特点**：免费，但质量略差

### 前端开发场景选型（Vue3）

| 任务类型 | 推荐模型 |
|---------|---------|
| 页面还原 | Gemini 3 Pro |
| 组件架构 | GPT-5.2 / Codex |
| 代码搜索 | Kimi Free (with fallback) |
| 快速问答 | Kimi Free |
| 简单格式化 | GLM/MiniMax Free |

### Provider 配置清单

需要绑定的 provider：

1. **OpenCode Zen** → 免费 Kimi/GLM/MiniMax
2. **Moonshot AI** → 付费 Kimi
3. **OpenAI** → Codex/GPT-5.2
4. **Google** → Gemini 3 Pro/Flash
