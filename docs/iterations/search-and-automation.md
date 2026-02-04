# 搜索功能增强与 Skill 同步自动化

## 元信息
```yaml
title: 搜索功能增强与 Skill 同步自动化
date: 2026-02-04
type: iteration
tags: [search, automation, skill, workflow]
status: Completed
author: Gemini
```

## 背景

随着知识库内容的增加，需要更高效的查询手段。同时，为了让 AI 助手在不同环境下都能遵循本项目的管理规范，需要一套标准化的 Skill 分发机制。

## 技术实现

### 1. 本地搜索深度汉化
- **配置优化**: 在 `config.mjs` 中对 `local-search` 进行深度定制。
- **汉化处理**: 翻译了搜索按钮、占位符、页脚导航提示（切换、选择、关闭）等 UI 文本。
- **交互体验**: 支持 `Cmd + K` 快捷键唤起，实现正文级别的全量关键词检索。

### 2. Skill 规范化与自动化同步
- **规范适配**: 确立了 `knowledge-wiki/SKILL.md` 的目录结构，确保符合主流 AI 终端（Gemini, Claude, OpenCode 等）的识别规范。
- **自动化脚本**: 编写了 `scripts/sync-skills.sh`，实现：
    - 自动检测并创建家目录 (`$HOME`) 下的工具配置文件夹。
    - 一键将本地 `.claude-skill.md` 同步至全局配置目录并重命名为 `SKILL.md`。
    - 清理冗余的旧版本非规范文件。
- **集成工作流**: 将同步指令集成至 `npm scripts`，通过 `npm run sync-skills` 即可完成全端更新。

### 3. 命名规范统一
- **去日期化**: 执行了全局文件名重构，移除 `YYYY-MM-DD-` 前缀，采用纯语义化命名。
- **链接修复**: 批量修正了因命名变更导致的内部引用死链，确保静态构建 100% 通过。

## 变更详情

- **docs/.vitepress/config.mjs**: 更新 `themeConfig.search` 配置。
- **scripts/sync-skills.sh**: 新增自动化同步脚本。
- **package.json**: 新增 `sync-skills` 指令。
- **.claude-skill.md**: 更新了项目架构图及协作指南。

## 最终效果

| 特性 | 描述 |
|------|------|
| 搜索 | 支持全量中文关键词搜索，极速响应 |
| 协作 | AI 助手可通过 `activate_skill knowledge-wiki` 快速加载管理规范 |
| 规范 | 文件名简洁（如 `wiki-system.md`），链接优雅 |

## 关联文档
- [知识库系统现代化与架构合并](./wiki-modernization-and-merge.md)
- [README.md](./../index.md)
