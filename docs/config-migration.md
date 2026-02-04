---
title: 配置文件迁移指南
date: 2026-02-04
tags: [迁移, 配置, OpenCode, oh-my-opencode]
---

# 配置文件迁移指南

> **摘要**: 使用一键脚本将 OpenCode 和 oh-my-opencode 配置迁移到新电脑，API key 需要重新绑定。

## 背景与需求

需要在多台电脑之间同步 OpenCode 配置，但：
- API key 不应包含在备份中（安全）
- 模型配置策略需要保留
- 迁移过程需要简单快捷

## 技术方案

### 需要复制的文件

#### ✅ 需要复制

```bash
~/.config/opencode/opencode.json           # 主配置（插件列表）
~/.config/opencode/oh-my-opencode.json    # oh-my-opencode 模型配置
./.opencode/oh-my-opencode.json          # 项目级配置（如有）
./.opencode/AGENTS.md                    # 项目级 AGENTS.md（如有）
```

#### ❌ 需要重新配置（不要复制）

```bash
~/.local/share/opencode/auth.json         # API keys 和 OAuth tokens
```

**原因**：
- OAuth tokens 有设备绑定
- API keys 可能在新电脑上失效
- 安全考虑（不要把 auth.json 传云端）

### 一键迁移脚本

#### 导出脚本（旧电脑运行）

```bash
#!/bin/bash
# OpenCode 配置导出脚本
# 用法: ./export-opencode-config.sh [输出目录]

OUTPUT_DIR="${1:-~/opencode-config-backup}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="opencode-config-${TIMESTAMP}"
FULL_PATH="${OUTPUT_DIR}/${BACKUP_NAME}"

mkdir -p "${FULL_PATH}"

# 复制主配置
cp "${HOME}/.config/opencode/opencode.json" "${FULL_PATH}/"
cp "${HOME}/.config/opencode/oh-my-opencode.json" "${FULL_PATH}/"

# 复制项目级配置
mkdir -p "${FULL_PATH}/project-configs"
cp -r ./.opencode/* "${FULL_PATH}/project-configs/" 2>/dev/null

# 创建压缩包
cd "${OUTPUT_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}/"
rm -rf "${BACKUP_NAME}/"
```

#### 导入脚本（新电脑运行）

```bash
#!/bin/bash
# OpenCode 配置导入脚本
# 用法: ./import-opencode-config.sh [备份文件.tar.gz]

BACKUP_FILE="${1}"

# 解压备份
EXTRACT_DIR="/tmp/opencode-import-$(date +%s)"
mkdir -p "$EXTRACT_DIR"
tar -xzf "$BACKUP_FILE" -C "$EXTRACT_DIR"

# 找到解压后的目录
BACKUP_DIR=$(find "$EXTRACT_DIR" -type d -name "opencode-config-*" | head -1)

# 安装 oh-my-opencode
npm install -g oh-my-opencode@latest

# 复制配置文件
mkdir -p "${HOME}/.config/opencode"
cp "${BACKUP_DIR}/opencode.json" "${HOME}/.config/opencode/"
cp "${BACKUP_DIR}/oh-my-opencode.json" "${HOME}/.config/opencode/"

# 复制项目级配置
cp -r "${BACKUP_DIR}/project-configs/"* "${HOME}/" 2>/dev/null

rm -rf "$EXTRACT_DIR"
```

### 使用方法

#### 在旧电脑

```bash
# 1. 运行导出脚本
./export-opencode-config.sh

# 2. 传输到新电脑
# 通过 U盘/云盘/邮件发送生成的 .tar.gz 文件
```

#### 在新电脑

```bash
# 1. 运行导入脚本
./import-opencode-config.sh ~/Downloads/opencode-config-xxxx.tar.gz

# 2. 启动 opencode 并重新绑定 provider
opencode
/connect
```

### 重新绑定 Provider

```bash
# 依次绑定以下 provider：
/connect          # OpenCode Zen（免费 Kimi/GLM/Minimax）
/connect          # Moonshot AI（付费 Kimi）
/connect          # OpenAI（Codex/GPT-5.2）
/connect          # Google（Gemini）

# 验证绑定
/models           # 查看可用模型
/auth list       # 查看已连接 provider

# 测试
ulw 测试配置     # 测试多 agent 调度
```

### 安全提示

⚠️ **备份文件不包含 API keys**，可以安全地：
- 上传到云盘
- 通过邮件发送给自己
- 存到 U 盘

但 **不要分享给别人**，因为 oh-my-opencode.json 包含模型策略偏好。
