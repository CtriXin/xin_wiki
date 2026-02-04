# Clash Verge 智能分流配置脚本

## 元信息
```yaml
title: Clash Verge 智能分流配置脚本
date: 2026-02-04
type: script
tags: [clash, proxy, network, shell, zsh, tun, system-proxy]
status: Active
author: xin
```

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
  export no_proxy="...内网域名排除..."
fi
```

### 步骤3: 关闭 TUN 模式
Clash Verge 设置 → TUN 模式 → 关闭

## 遇到的问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 开启 TUN 后内网域名无法访问 | TUN 模式强制所有流量经过 Clash，破坏内网路由 | 关闭 TUN，改用系统代理 + Shell 环境变量 |
| Google 访问证书错误 | Google 被屏蔽，直连时遭遇中间人攻击 | 添加 Google 相关域名到代理规则 |
| ChatGPT 无法访问 | 未在规则中添加 OpenAI 域名 | 添加 openai.com, chatgpt.com 等域名 |
| rf 命令无法访问内网 | localities.site 内网域名被 TUN 拦截 | 关闭 TUN 模式，使用 no_proxy 排除内网 |
| 代理关闭后终端流量黑洞 | zshrc 中硬编码代理地址，端口不通时仍尝试连接 | 添加端口检测逻辑，不可用时跳过代理设置 |
| scmp.adsconflux.xyz 被代理 | 该内网域名不在 no_proxy 列表 | 添加到 no_proxy 排除列表 |
| npm install 走代理失败 | 公司内网环境，npm 官方源直连更快 | npm/yarn/pnpm 默认直连，提供 `px` 命令临时走代理 |

## 最终代码

### Clash 扩展脚本
```javascript
// 白嫖机场订阅扩展脚本
function main(config, profileName) {
  const customRules = [
    // Google 相关
    'DOMAIN-KEYWORD,google,白嫖机场',
    'DOMAIN-SUFFIX,google.com,白嫖机场',
    'DOMAIN-SUFFIX,gstatic.com,白嫖机场',
    'DOMAIN-SUFFIX,googleapis.com,白嫖机场',

    // OpenAI / ChatGPT
    'DOMAIN-KEYWORD,openai,白嫖机场',
    'DOMAIN-SUFFIX,chatgpt.com,白嫖机场',
    'DOMAIN-SUFFIX,openai.com,白嫖机场',
    'DOMAIN-SUFFIX,oaistatic.com,白嫖机场',
    'DOMAIN-SUFFIX,oaiusercontent.com,白嫖机场',
    'DOMAIN-SUFFIX,auth0.com,白嫖机场',

    // item 相关
    'DOMAIN-KEYWORD,item,白嫖机场',
    'DOMAIN-SUFFIX,item.com,白嫖机场',

    // antigravity 相关
    'DOMAIN-KEYWORD,antigravity,白嫖机场',
    'DOMAIN-SUFFIX,antigravity.io,白嫖机场',

    // iTerm2 及其子进程
    'PROCESS-NAME,iTerm2,白嫖机场',
    'PROCESS-NAME,iTerm2-,白嫖机场',
    'PROCESS-NAME,zsh,白嫖机场',
    'PROCESS-NAME,bash,白嫖机场',
    'PROCESS-NAME,sh,白嫖机场',
    'PROCESS-NAME,fish,白嫖机场',

    // iTerm2 常用命令
    'PROCESS-NAME,curl,白嫖机场',
    'PROCESS-NAME,wget,白嫖机场',
    'PROCESS-NAME,git,白嫖机场',
    'PROCESS-NAME,ssh,白嫖机场',
    'PROCESS-NAME,scp,白嫖机场',
    'PROCESS-NAME,rsync,白嫖机场',
    'PROCESS-NAME,node,白嫖机场',
    'PROCESS-NAME,npm,白嫖机场',
    'PROCESS-NAME,pnpm,白嫖机场',
    'PROCESS-NAME,yarn,白嫖机场',
    'PROCESS-NAME,python,白嫖机场',
    'PROCESS-NAME,python3,白嫖机场',
    'PROCESS-NAME,pip,白嫖机场',
    'PROCESS-NAME,pip3,白嫖机场',
    'PROCESS-NAME,go,白嫖机场',
    'PROCESS-NAME,rustc,白嫖机场',
    'PROCESS-NAME,cargo,白嫖机场',
    'PROCESS-NAME,brew,白嫖机场',
    'PROCESS-NAME,gh,白嫖机场',
    'PROCESS-NAME,docker,白嫖机场',
    'PROCESS-NAME,kubectl,白嫖机场',
    'PROCESS-NAME,terraform,白嫖机场',
    'PROCESS-NAME,ansible,白嫖机场',
    'PROCESS-NAME,vim,白嫖机场',
    'PROCESS-NAME,nvim,白嫖机场',
    'PROCESS-NAME,hx,白嫖机场',
    'PROCESS-NAME,Emacs,白嫖机场',

    // Antigravity 应用
    'PROCESS-NAME,Electron,白嫖机场',
    'PROCESS-NAME,Antigravity Helper,白嫖机场',

    // 兜底规则
    'MATCH,DIRECT',
  ];

  config.rules = customRules;
  console.log('已清空订阅原有规则，只保留自定义规则');
  console.log('当前规则数:', config.rules.length);

  return config;
}
```

### Shell 环境变量配置
```bash
# Clash Verge 系统代理配置
# 自动检测：如果 7897 端口不通，则不设置代理（避免流量黑洞）
if curl -s --connect-timeout 1 -o /dev/null http://127.0.0.1:7897; then
  export http_proxy=http://127.0.0.1:7897
  export https_proxy=http://127.0.0.1:7897
  # 内网域名排除
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

# 简写命令
alias proxy='proxyon'
alias noproxy='proxyoff'

# 单次命令走代理（如：px curl https://google.com）
px() {
  http_proxy=http://127.0.0.1:7897 \
  https_proxy=http://127.0.0.1:7897 \
  no_proxy="localhost,127.0.0.1,::1,*.local" \
  "$@"
}

# 单次命令不走代理（如：np curl https://google.com）
np() {
  unset http_proxy https_proxy no_proxy; "$@"
}

# npm/yarn/pnpm 默认不走代理（公司内网直连更快）
npm() {
  local old_http=$http_proxy old_https=$https_proxy old_no=$no_proxy
  unset http_proxy https_proxy no_proxy
  command npm "$@"
  local exit_code=$?
  [ -n "$old_http" ] && export http_proxy=$old_http
  [ -n "$old_https" ] && export https_proxy=$old_https
  [ -n "$old_no" ] && export no_proxy=$old_no
  return $exit_code
}

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

## 使用方法

### Clash Verge 配置
1. 订阅 → 白嫖机场 → 扩展设置 → 全局扩展脚本
2. 将上述 JavaScript 代码粘贴进去
3. 关闭 TUN 模式
4. 开启系统代理
5. 重新加载订阅

### 终端配置
1. 将 Shell 配置添加到 `~/.zshrc`
2. `source ~/.zshrc`
3. 新开终端会自动检测代理

### 快捷命令

| 命令 | 作用 | 示例 |
|------|------|------|
| `proxy` / `proxyon` | 当前终端开启代理 | `proxy` |
| `noproxy` / `proxyoff` | 当前终端关闭代理 | `noproxy` |
| `px <cmd>` | 单次命令走代理 | `px curl https://google.com` |
| `np <cmd>` | 单次命令不走代理 | `np curl https://google.com` |

## 分流效果

| 流量类型 | 处理方式 | 示例 |
|----------|----------|------|
| item/antigravity 域名 | 走代理 | item.com, antigravity.io |
| Google/OpenAI/ChatGPT | 走代理 | google.com, chatgpt.com |
| iTerm2 终端命令 | 走代理 | curl, git, npm |
| 其他外网 | 直连 | baidu.com, 其他网站 |
| 内网域名 | 直连（no_proxy）| localities.site, scmp.adsconflux.xyz |

## 包管理器代理

### 默认行为

| 命令 | 代理状态 | 说明 |
|------|---------|------|
| `npm install` | **直连** | 公司内网环境，直连更快 |
| `yarn install` | **直连** | 同上 |
| `pnpm install` | **直连** | 同上 |

### 临时走代理

```bash
# 方式1：使用 px 前缀
px npm install some-package    # 这次 npm 走代理
px yarn add some-package       # 这次 yarn 走代理

# 方式2：先开启代理再执行
proxy
npm install                    # 这次走代理
noproxy                        # 用完关闭
```

### 场景示例

```bash
# 场景1：安装国外包需要代理
px npm install @foreign/package

# 场景2：内网项目正常安装
npm install                    # 直连，最快

# 场景3：不确定时测试
np curl https://registry.npmjs.org  # 测试直连速度
px curl https://registry.npmjs.org  # 测试代理速度
```

## 后续优化点

- [x] 包管理器默认直连，提供快捷切换命令 ✓ (2026-02-04 完成)
- [ ] 为特定项目添加自动检测并强制代理的功能
- [ ] 添加代理流量统计/监控
- [ ] 优化 no_proxy 列表，通过配置文件动态管理

---

**更新记录**:
- 2026-02-04: 初始版本，配置基础分流规则
- 2026-02-04: 补充 npm/yarn/pnpm 默认直连配置，添加 proxy/noproxy/px/np 快捷命令

## 关联文档
- [Clash Verge 官方文档](https://docs.clashverge.dev/)
- [Mihomo 规则文档](https://wiki.metacubex.one/)
