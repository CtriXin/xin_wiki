---
layout: home

hero:
  name: "Xin Knowledge"
  text: "个人技术知识库"
  tagline: 记录每一次迭代、每一个功能、每一行脚本、每一次修复
  image:
    src: /logo.svg
    alt: Knowledge Wiki
  actions:
    - theme: brand
      text: 开始探索
      link: /changelog
    - theme: alt
      text: 查看脚本
      link: /scripts/clash-verge-proxy-rules

features:
  - icon: 📝
    title: 迭代记录
    details: 记录每个版本的变更、决策和演进过程，保留完整的技术决策链
  - icon: ⚡
    title: 功能开发
    details: 新功能的背景调研、方案对比、实现细节和验收标准
  - icon: 🔧
    title: 脚本工具
    details: 自动化脚本、配置文件的创建过程、使用说明和故障排除
  - icon: 🐛
    title: Bug 修复
    details: 问题现象、根因分析、修复过程和预防措施
  - icon: 🔍
    title: 全文搜索
    details: 基于本地索引的快速搜索，无需后端服务，瞬间找到需要的内容
  - icon: 🎨
    title: 精美呈现
    details: 现代化的设计风格，支持深色模式，完美适配移动端
---

## 最近更新

### 2026-02-04

**[Clash Verge 智能分流配置](/scripts/clash-verge-proxy-rules)**

配置 Clash Verge 实现智能分流，item/antigravity/Google/ChatGPT 走代理，其他直连，内网域名排除。

**关键决策**: 放弃 TUN 模式，改用系统代理 + Shell 环境变量，解决内网访问冲突。

---

## 统计

| 类型 | 数量 |
|------|------|
| 脚本 | 1 |
| 功能 | 0 |
| Bug 修复 | 0 |
| 迭代 | 0 |

---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);
}
</style>
