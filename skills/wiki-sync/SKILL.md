---
name: wiki-sync
description: 自动同步规范。每次编辑 knowledge-wiki-web 文档后，提示并执行全局同步脚本，确保各 AI 的 global skills 与本地 wiki 保持一致。
---

# Wiki Sync Skill

## 目标
确保在编辑 `/Users/xin/knowledge-wiki-web` 的任意文档后，**立即提醒并执行同步流程**，保持：

- `skills` 目录内容同步到各个 AI 的 global skills
- global 技能引用的 wiki 目录与实际文档一致

## 触发条件
当用户请求：

- 新增、修改、删除 wiki 文档
- 调整 wiki 技能或模板
- 对 wiki 的 `docs/`、`skills/` 内容进行编辑

## 必做动作
1. 明确提示“需要同步”。
2. 要求或提醒用户执行 `/Users/xin/knowledge-wiki-web/scripts` 下的同步命令（由用户在本地运行）。
3. 说明同步链路：
   - 本仓库 `skills/` → 全局 skills → 调用时使用 global skills → 文档写回本仓库 `docs/`

## 文档修改约定
- 修改 wiki 技能文件 **只在** `/Users/xin/knowledge-wiki-web/skills/` 内进行。
- 新增文档 **只在** `/Users/xin/knowledge-wiki-web/docs/` 内进行。
- 调用时优先使用 global skills，避免直接使用临时路径。

## 输出示例
```
已修改 wiki 文档，请运行 /Users/xin/knowledge-wiki-web/scripts 下的同步命令完成全局同步。
```
