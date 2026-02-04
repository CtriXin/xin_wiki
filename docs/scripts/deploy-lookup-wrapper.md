# deploy & lookup 命令封装

## 元信息
```yaml
title: deploy & lookup 命令封装
date: 2026-02-04
type: script
tags: [shell, zsh, deploy, scmp, alias]
status: Active
author: xin
```

## 背景与需求

公司内网使用 `deploy` 和 `lookup` 命令进行服务部署和查询，但：
1. **无参数时直接报错**，不友好
2. **需要记忆参数格式**，容易忘记
3. **没有自动补全使用提示**

需要封装一层帮助信息，提升使用体验。

## 首次使用与认证

在使用 `deploy` 或 `lookup` 之前，需要先完成 SCMP 登录认证：

```bash
# 设置分享 ID
export SCMP_SHARE_ID='<share_id>'

# 执行登录（根据提示输入密码）
python3 /Users/xin/auto-skills/scmp-deploy/scripts/scmp_cli.py login --prompt-password
```

## 实现方案

通过 zsh 函数封装，在调用真实命令前检查参数，无参数时显示帮助信息。

## 最终代码

### deploy 封装

```bash
deploy() {
  if [[ $# -lt 1 ]]; then
    echo "Usage: deploy <server-name>"
    echo ""
    echo "Examples:"
    echo "  deploy ptc-301-gb"
    echo ""
    echo "Available servers:"
    lookup list 2>/dev/null || echo "  (run 'lookup' to see all)"
    return 1
  fi
  command deploy "$@"
}
```

**特性**:
- 无参数时显示用法示例
- 自动调用 `lookup list` 显示可用服务列表
- 有参数时调用真实 `deploy` 命令

### lookup 封装

```bash
lookup() {
  if [[ $# -lt 1 ]]; then
    echo "Usage: lookup <command> [args]"
    echo ""
    echo "Commands:"
    echo "  lookup list              # 列出所有服务"
    echo "  lookup domain <service>  # 查询服务域名"
    echo "  lookup ip <service>      # 查询服务IP"
    echo "  lookup service <domain>  # 根据域名查服务"
    return 1
  fi
  command lookup "$@"
}
```

**特性**:
- 无参数时显示所有子命令说明
- 清晰的命令分类和用途描述
- 有参数时调用真实 `lookup` 命令

## 使用方法

### 部署服务
```bash
# 显示帮助
deploy
# 输出:
# Usage: deploy <server-name>
#
# Examples:
#   deploy ptc-301-gb
#
# Available servers:
#   [自动列出可用服务]

# 实际部署
deploy ptc-301-gb
```

### 查询服务
```bash
# 显示帮助
lookup
# 输出:
# Usage: lookup <command> [args]
#
# Commands:
#   lookup list              # 列出所有服务
#   lookup domain <service>  # 查询服务域名
#   lookup ip <service>      # 查询服务IP
#   lookup service <domain>  # 根据域名查服务

# 查询具体服务
lookup domain ptc-301-gb
lookup ip ptc-301-gb
lookup list
```

## 效果对比

| 场景 | 封装前 | 封装后 |
|------|--------|--------|
| 输入 `deploy` | 报错/无输出 | 显示用法 + 可用服务列表 |
| 输入 `lookup` | 报错/无输出 | 显示所有子命令说明 |
| 新手体验 | 需要查文档 | 自解释，一看就会 |

## 后续优化点

- [ ] 添加命令自动补全（zsh completions）
- [ ] 支持 `deploy --list` 显式列出服务
- [ ] 添加 deploy 日志记录功能
- [ ] 集成到 CI/CD 流程

## 关联文档
- [Clash Verge 智能分流配置](./clash-verge-proxy-rules.md)
