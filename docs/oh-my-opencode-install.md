---
title: oh-my-opencode 安装指南
date: 2026-02-04
tags: [oh-my-opencode, opencode, 安装]
---

# oh-my-opencode 安装指南

> **摘要**: 安装 oh-my-opencode 插件并完成基础配置，支持多模型混合使用策略。

## 背景与需求

需要在 OpenCode 基础上安装 oh-my-opencode 插件，以实现：
- 多模型混合使用（付费 + 免费）
- 智能 agent 调度
- 成本优化

## 技术方案

### 1. 安装 oh-my-opencode

```bash
# 全局安装
npm install -g oh-my-opencode@latest
```

### 2. 配置 OpenCode 插件

编辑 `~/.config/opencode/opencode.json`：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "opencode-gemini-auth@latest",
    "oh-my-opencode@latest"
  ]
}
```

### 3. 验证安装

```bash
# 启动 opencode
opencode

# 查看可用模型
/models

# 查看已连接 provider
/auth list
```

### 4. 绑定 Provider

需要绑定的 provider：

1. **OpenCode Zen** → 免费 Kimi/GLM/MiniMax
2. **Moonshot AI** → 付费 Kimi
3. **OpenAI** → Codex/GPT-5.2
4. **Google** → Gemini 3 Pro/Flash

```bash
/connect
# 依次绑定以上 provider
```

## 注意事项

- oh-my-opencode 是 opencode 的插件，需要先安装 opencode
- 安装后默认 agent 是 Sisyphus
- 模型配置在 `~/.config/opencode/oh-my-opencode.json`
