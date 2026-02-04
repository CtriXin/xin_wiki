---
title: Agent 调度机制说明
date: 2026-02-04
tags: [oh-my-opencode, Agent, 调度, Sisyphus]
---

# Agent 调度机制说明

> **摘要**: 理解 oh-my-opencode 的 Agent 调度机制，掌握普通对话、Ultrawork 模式、定向调用三种使用方式。

## 背景与需求

了解不同场景下 Agent 的调用方式，优化使用体验和成本。

## 技术方案

### oh-my-opencode 默认 Agents

| Agent | 角色 | 默认模型 | 职责 |
|-------|------|---------|------|
| **Sisyphus** | 项目经理/主调度 | GPT-5.2 | 分析任务、调度其他 agent |
| **Hephaestus** | 深度工匠 | GPT-5.2 Codex | 复杂编码任务 |
| **Prometheus** | 架构规划师 | Kimi K2 | 项目规划、架构设计 |
| **Atlas** | 任务执行者 | Kimi K2.5 | 执行具体任务 |
| **Oracle** | 调试专家 | Kimi K2 | 代码审查、调试 |
| **Frontend Engineer** | UI 专家 | Gemini 3 Pro | 前端开发、视觉还原 |
| **Librarian** | 文档/搜索 | Kimi Free | 代码库搜索、文档查询 |
| **Explore** | 快速探索 | Kimi Free | 快速 grep、文件查找 |
| **Multimodal Looker** | 多模态 | Gemini 3 Pro | 图片解析、视觉理解 |

### 三种调度模式

#### 1. 普通对话（默认）

```
你: 帮我改一下这个组件的样式
↓
Sisyphus (GPT-5.2) → 直接执行 → 完成
```

**特点**：
- 直接触发 Sisyphus 配置的模型
- 不自动调度其他 agent
- 适合简单、明确的任务

#### 2. Ultrawork 模式（`ulw` 或 `ultrawork`）

```
你: ulw 帮我重构这个 Vue3 项目
↓
Sisyphus (GPT-5.2) → 分析任务 → 调度其他 agents:
  ├─ @prometheus 规划架构 (Kimi K2)
  ├─ @explore 搜索现有代码 (Kimi Free)
  ├─ @frontend-engineer 设计组件 (Gemini 3 Pro)
  └─ Sisyphus 自己整合 (GPT-5.2)
```

**特点**：
- Sisyphus 变成"调度员"
- 自动分析任务复杂度
- 分派给最适合的 agent
- 多 agent 并行执行

#### 3. 定向调用（`@agent`）

```bash
# 明确调用特定 agent，绕过 Sisyphus 调度
@librarian 查找所有使用了 provide/inject 的文件
@frontend-engineer 根据设计稿还原登录页面
@oracle 分析这个报错
```

**特点**：
- 直接使用指定 agent
- 使用其配置的模型
- 适合明确知道需要什么能力的场景

### 使用建议

#### 日常简单任务（90% 时间）

```bash
# 直接用自然语言，Sisyphus 自动处理
帮我搜索 composables
查看 README 内容
格式化这个组件
```

#### 复杂任务（10% 时间）

```bash
# 加 ulw，触发完整调度
ulw 帮我设计一个完整的后台管理系统架构
ulw 从 Figma 还原整个页面
```

#### 省钱场景（可选）

```bash
# 明确要最便宜的模型做搜索
@librarian 查找所有接口定义
@explore 搜索配置文件
```

### 查看当前模型

```bash
# 查看 session 使用的 agents
session_info

# 查看详细日志
tail -f /tmp/oh-my-opencode.log

# 终端会显示
Agents Used: build, oracle, librarian, explore
```

### 成本优化策略

| 场景 | 方式 | Token 消耗 |
|------|------|-----------|
| 简单任务 | 直接对话 | 一次 GPT-5.2 |
| 复杂任务 | 加 ulw | 分派给便宜模型 |
| 明确搜索 | @librarian | 免费 Kimi |

**建议**：
- 简单明确的任务：直接说，不用 `ulw`
- 复杂/探索性任务：加 `ulw`
- 明确要省钱：用 `@librarian` / `@explore`
