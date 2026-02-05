---
title: deploy & lookup 命令封装
date: 2026-02-04
type: script
tags: [shell, zsh, deploy, scmp, alias]
status: Active
author: xin
---

# deploy & lookup 命令封装

> **摘要**: 通过 zsh 函数封装内网 `deploy` 和 `lookup` 命令，实现无参数时自动显示帮助信息和可用服务列表，优化交互体验。

## 背景与需求

公司内网使用 `deploy` 和 `lookup` 命令进行服务部署和查询，但存在以下痛点：
1. **无参数时直接报错**，交互不友好。
2. **需要记忆复杂参数**，容易遗忘。
3. **缺乏使用提示**，新手上手成本高。

本脚本旨在通过一层 Shell 封装，提供更人性化的 CLI 体验。

## 首次使用与认证

在使用 `deploy` 或 `lookup` 之前，需要先完成 SCMP 登录认证：

```bash
# 设置分享 ID
export SCMP_SHARE_ID='<share_id>'

# 执行登录（根据提示输入密码）
python3 /Users/xin/auto-skills/scmp-deploy/scripts/scmp_cli.py login --prompt-password
```

## 最终代码

### deploy 封装

```bash
deploy() {
  if [[ $# -lt 1 ]]; then
    echo "Usage: deploy <server-name>"
    echo ""
    echo "Examples:"
    echo "  deploy ptc-xxx"
    echo ""
    echo "Available servers:"
    lookup list 2>/dev/null || echo "  (run 'lookup' to see all)"
    return 1
  fi
  command deploy "$@"
}
```

### lookup 封装

```bash
lookup() {
  # 支持显式查看帮助
  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    echo "Usage: lookup <command> [args]"
    echo ""
    echo "Commands:"
    echo "  lookup list              # 列出所有服务"
    echo "  lookup domain <service>  # 查询服务域名"
    echo "  lookup ip <service>      # 查询服务IP"
    echo "  lookup service <domain>  # 根据域名查服务"
    return 0
  fi

  # 无参数时直接进入交互模式，有参数时透传给原命令
  command lookup "$@"
}
```

## 使用方法

### 部署服务
```bash
# 直接输入 deploy 查看帮助
deploy
# 输出:
# Usage: deploy <server-name>
# Examples: deploy ptc-301-gb
# Available servers: [自动列出]

# 实际部署
deploy ptc-301-gb
```

### 查询服务
```bash
# 直接输入 lookup 进入交互模式
lookup
# -> 进入 SCMP 服务/域名快速查询工具

# 输入 lookup -h 查看帮助
lookup -h
# 输出所有可用子命令说明...

# 查询具体服务
lookup ip ptc-301-gb
```

## 关联文档
- [Clash Verge 智能分流配置](./clash-verge-proxy-rules.md)