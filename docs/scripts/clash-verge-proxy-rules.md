---
title: Clash Verge 智能分流配置脚本
date: 2026-02-04
tags: [clash, proxy, network, shell, zsh]
---

# Clash Verge 智能分流配置脚本

> **总结**: 配置 Clash Verge 实现智能分流策略：特定技术域名（item/antigravity）与 Google/OpenAI 走代理，包管理器与内网环境直连，彻底解决内网冲突与证书错误问题。

## 背景与需求

需要配置 Clash Verge 实现以下分流策略：
1. **item 和 antigravity 相关域名** → 走代理
2. **iTerm2 及终端命令** → 走代理（curl, git, npm 等）
3. **Google/OpenAI/ChatGPT** → 走代理（避免证书错误）
4. **其他所有流量** → 直连（节省流量）

## 技术方案对比

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| TUN 模式 | 强制所有应用代理，无需配置 | 与系统 utun 冲突，内网域名无法直连 | ❌ 放弃 |
| 系统代理 + 进程规则 | 浏览器等自动走代理，内网正常 | 终端需要额外配置 | ✅ 采用 |

## 实现过程

### 步骤1: 创建 Clash 扩展脚本
文件: `~/Library/Application Support/io.github.clash-verge-rev.clash-verge-rev/profiles/sQiNyHMYkrVH.js`

**核心逻辑**:
- 清空订阅原有规则
- 只保留自定义规则列表
- 兜底规则设为 `MATCH,DIRECT`

### 步骤2: 配置 Shell 代理环境变量
文件: `~/.zshrc`

**关键配置**:
```bash
# 自动检测代理端口是否可用
if curl -s --connect-timeout 1 -o /dev/null http://127.0.0.1:7897; then
  export http_proxy=http://127.0.0.1:7897
  export https_proxy=http://127.0.0.1:7897
  export no_proxy="..."
fi
```

## 最终代码

### Clash 扩展脚本
```javascript
function main(config, profileName) {
  const customRules = [
    'DOMAIN-SUFFIX,google.com,白嫖机场',
    'DOMAIN-SUFFIX,chatgpt.com,白嫖机场',
    'DOMAIN-KEYWORD,item,白嫖机场',
    'DOMAIN-KEYWORD,antigravity,白嫖机场',
    'PROCESS-NAME,iTerm2,白嫖机场',
    'MATCH,DIRECT',
  ];
  config.rules = customRules;
  return config;
}
```

## 关联文档
- [deploy & lookup 命令封装](./deploy-lookup-wrapper.md)