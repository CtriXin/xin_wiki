# Skill Frontmatter 修复记录

## 元信息
```yaml
title: Skill Frontmatter 修复记录
date: 2026-02-04
type: iteration
tags: [skill, frontmatter, workflow, fix]
status: Completed
author: Codex
```

## 背景

加载技能时出现告警：`missing YAML frontmatter delimited by ---`。  
根因是 Skill 母文件 `.claude-skill.md` 顶部缺少可解析的 YAML frontmatter。

## 修复过程

### 1. 定位问题
- 检查了 `knowledge-wiki` 技能文件结构，确认内容从一级标题开始，缺少开头的 `---` frontmatter 块。

### 2. 实施修复
- 在 `.claude-skill.md` 文件最顶部新增标准 YAML frontmatter：
  - `name: knowledge-wiki`
  - `description: 面向个人技术知识库（VitePress）的协作技能，支持记录、索引更新、构建预览与死链检查。`

### 3. 验证结果
- 文件已满足技能解析器的基本格式要求，后续重新加载技能时应不再出现该告警。

## 变更详情

- **docs/.claude-skill.md**: 新增 frontmatter 头部，保持正文内容不变。

## 关联文档
- [系统迭代索引](./index.md)
- [变更日志](./../changelog.md)
