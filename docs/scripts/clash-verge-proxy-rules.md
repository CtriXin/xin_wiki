---
title: Clash Verge 智能分流配置脚本
date: 2026-02-04
tags: [clash, proxy, network, shell, zsh]
---

# Clash Verge 智能分流配置脚本

> **总结**: 配置 Clash Verge 实现智能分流策略：特定技术域名（iterm/antigravity）与 Google/OpenAI 走代理，包管理器与内网环境直连，彻底解决内网冲突与证书错误问题。

## 背景与需求

需要配置 Clash Verge 实现以下分流策略：
1. **iterm 和 antigravity 相关域名** → 走代理
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
订阅对应的 ✈️ - 订阅 - 找到对应的订阅 - 右键 - 找到扩展脚本 - 点击编辑
文件: `~/Library/Application Support/io.github.clash-verge-rev.clash-verge-rev/profiles/sQiNyHMYkrVH.js`

**核心逻辑**:
- 清空订阅原有规则
- 只保留自定义规则列表
- 兜底规则设为 `MATCH,DIRECT`

### 步骤2: 配置 Shell 代理环境变量
文件: `~/.zshrc`

将以下完整配置添加到你的 shell 配置文件中。这段配置包含自动检测、手动开关、临时命令封装以及包管理器的特殊处理。

```bash
# Clash Verge 系统代理配置
# 配合规则模式：item/antigravity/终端命令走代理，其他直连
# 自动检测：如果 7897 端口不通，则不设置代理（避免流量黑洞）
if curl -s --connect-timeout 1 -o /dev/null http://127.0.0.1:7897; then
  export http_proxy=http://127.0.0.1:7897
  export https_proxy=http://127.0.0.1:7897
  # 内网域名排除（避免 rf 等内网命令走代理失败）
  # 注意：请根据实际情况调整 no_proxy 列表
  export no_proxy="scmp.adsconflux.xyz,.adsconflux.xyz,10.153.16.238,localhost,127.0.0.1,::1,*.local,*.site,localities.site,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12"
else
  echo "[Clash] 代理端口 7897 未启动，跳过代理设置"
fi

# 手动切换代理的快捷命令
proxyon() {
  export http_proxy=http://127.0.0.1:7897
  export https_proxy=http://127.0.0.1:7897
  export no_proxy="scmp.adsconflux.xyz,.adsconflux.xyz,10.153.16.238,localhost,127.0.0.1,::1,*.local,*.site,localities.site,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12"
  echo "[Clash] 代理已开启"
}

proxyoff() {
  unset http_proxy https_proxy no_proxy
  echo "[Clash] 代理已关闭"
}

# 简写命令：proxy / noproxy
alias proxy='proxyon'
alias noproxy='proxyoff'

# 单次命令走代理（如：px curl https://google.com）
px() {
  http_proxy=http://127.0.0.1:7897 \
  https_proxy=http://127.0.0.1:7897 \
  no_proxy="localhost,127.0.0.1,::1,*.local" \
  "$@"
}

# 单次命令不走代理（如：np npm install）
np() {
  unset http_proxy https_proxy no_proxy; "$@"
}

# npm 默认不走代理（公司内网直连更快）
# 如需走代理：px npm install 或先执行 proxy
npm() {
  # 保存当前代理设置
  local old_http=$http_proxy
  local old_https=$https_proxy
  local old_no=$no_proxy

  # 取消代理执行 npm
  unset http_proxy https_proxy no_proxy
  command npm "$@"
  local exit_code=$?

  # 恢复代理设置
  [ -n "$old_http" ] && export http_proxy=$old_http
  [ -n "$old_https" ] && export https_proxy=$old_https
  [ -n "$old_no" ] && export no_proxy=$old_no

  return $exit_code
}

# yarn / pnpm 同样默认不走代理
yarn() {
  local old_http=$http_proxy old_https=$https_proxy old_no=$no_proxy
  unset http_proxy https_proxy no_proxy
  command yarn "$@"
  local exit_code=$?
  [ -n "$old_http" ] && export http_proxy=$old_http
  [ -n "$old_https" ] && export https_proxy=$old_https
  [ -n "$old_no" ] && export no_proxy=$old_no
  return $exit_code
}

pnpm() {
  local old_http=$http_proxy old_https=$https_proxy old_no=$no_proxy
  unset http_proxy https_proxy no_proxy
  command pnpm "$@"
  local exit_code=$?
  [ -n "$old_http" ] && export http_proxy=$old_http
  [ -n "$old_https" ] && export https_proxy=$old_https
  [ -n "$old_no" ] && export no_proxy=$old_no
  return $exit_code
}
```

### 命令说明

| 命令 | 说明 | 示例 |
|------|------|------|
| `proxy` / `proxyon` | 全局开启 Shell 代理 | `proxy` |
| `noproxy` / `proxyoff` | 全局关闭 Shell 代理 | `noproxy` |
| `px <command>` | 单次命令**走**代理 | `px curl google.com` |
| `np <command>` | 单次命令**不走**代理 | `np curl internal.site` |
| `npm install` | 默认**不走**代理（使用内网源） | `npm install` |
| `px npm install` | 强制 npm **走**代理 | `px npm install` |

## 最终代码

### Clash 扩展脚本
```javascript
// xxx机场订阅扩展脚本
// 功能：只有指定规则走代理，其他所有流量直连

function main(config, profileName) {
  // 定义只走代理的规则
  const customRules = [
    // Google 相关（避免证书错误）
    'DOMAIN-KEYWORD,google,xxx机场',
    'DOMAIN-SUFFIX,youtube.com,xxx机场',
    'DOMAIN-SUFFIX,google.com,xxx机场',
    'DOMAIN-SUFFIX,gstatic.com,xxx机场',
    'DOMAIN-SUFFIX,googleapis.com,xxx机场',

    //机场
    'DOMAIN-KEYWORD,xn--mesv7f5toqlp,xxx机场',

    // rf 命令使用的域名 (localities.site)
    'DOMAIN-SUFFIX,localities.site,xxx机场',

    // OpenAI / ChatGPT
    'DOMAIN-KEYWORD,openai,xxx机场',
    'DOMAIN-SUFFIX,chatgpt.com,xxx机场',
    'DOMAIN-SUFFIX,openai.com,xxx机场',
    'DOMAIN-SUFFIX,oaistatic.com,xxx机场',
    'DOMAIN-SUFFIX,oaiusercontent.com,xxx机场',
    'DOMAIN-SUFFIX,auth0.com,xxx机场',


    // antigravity 相关
    'DOMAIN-KEYWORD,antigravity,xxx机场',
    'DOMAIN-SUFFIX,antigravity.io,xxx机场',

    // iTerm2 及其子进程
    'PROCESS-NAME,iTerm2,xxx机场',
    'PROCESS-NAME,iTerm2-,xxx机场',
    'PROCESS-NAME,zsh,xxx机场',
    'PROCESS-NAME,bash,xxx机场',
    'PROCESS-NAME,sh,xxx机场',
    'PROCESS-NAME,fish,xxx机场',

    // iTerm2 中常用的命令
    'PROCESS-NAME,curl,xxx机场',
    'PROCESS-NAME,wget,xxx机场',
    'PROCESS-NAME,git,xxx机场',
    'PROCESS-NAME,ssh,xxx机场',
    'PROCESS-NAME,scp,xxx机场',
    'PROCESS-NAME,rsync,xxx机场',
    'PROCESS-NAME,node,xxx机场',
    'PROCESS-NAME,npm,xxx机场',
    'PROCESS-NAME,pnpm,xxx机场',
    'PROCESS-NAME,yarn,xxx机场',
    'PROCESS-NAME,python,xxx机场',
    'PROCESS-NAME,python3,xxx机场',
    'PROCESS-NAME,pip,xxx机场',
    'PROCESS-NAME,pip3,xxx机场',
    'PROCESS-NAME,go,xxx机场',
    'PROCESS-NAME,rustc,xxx机场',
    'PROCESS-NAME,cargo,xxx机场',
    'PROCESS-NAME,brew,xxx机场',
    'PROCESS-NAME,gh,xxx机场',
    'PROCESS-NAME,docker,xxx机场',
    'PROCESS-NAME,kubectl,xxx机场',
    'PROCESS-NAME,terraform,xxx机场',
    'PROCESS-NAME,ansible,xxx机场',
    'PROCESS-NAME,vim,xxx机场',
    'PROCESS-NAME,nvim,xxx机场',
    'PROCESS-NAME,hx,xxx机场',
    'PROCESS-NAME,Emacs,xxx机场',

    // Antigravity 应用
    'PROCESS-NAME,Electron,xxx机场',
    'PROCESS-NAME,Antigravity Helper,xxx机场',

    // 兜底规则：其他所有流量直连
    'MATCH,DIRECT',
  ]

  // 完全替换订阅的规则，只使用自定义规则
  config.rules = customRules;

  console.log('已清空订阅原有规则，只保留自定义规则');
  console.log('当前规则数:', config.rules.length);

  return config;
}

```

## 关联文档
- [deploy & lookup 命令封装](./deploy-lookup-wrapper.md)