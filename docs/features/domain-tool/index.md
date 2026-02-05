---
title: 域名配置与广告位管理工具
date: 2026-02-05
tags: [tool, configuration, ads, excel]
---

# 域名配置与广告位管理工具

> **摘要**: 数据驱动的站点配置生成系统，将飞书 Excel 维护流自动化转换为项目可用的 JSON 配置，支持全自动化广告位渲染。

## 📚 文档导航

由于本工具功能涉及数据规范、渲染逻辑与架构原理，我们将文档拆分为以下子模块以提供更详尽的说明：

### 1. [核心架构与原理](./architecture.md)
了解工具的 **Pipeline-Filter** 处理流程、随机值生成策略以及增量更新机制。适合开发者阅读。

### 2. [Excel 数据规范](./data-spec.md)
面向运营与配置维护人员。详细说明了 Excel 的 Sheet 结构、表头命名宽容度以及特殊 JSON 字段的填写规范。

### 3. [模板与渲染系统](./rendering.md)
详解如何通过修改 `ads-template.js` 来控制生成的 JSON 结构，以及占位符系统的使用。适合需要调整广告输出格式的场景。

### 4. [Ads.txt Group 优先级与 Magic 占位符](./ads-txt-magic.md)
说明 ads.txt 与 ads.txt group 同时存在时的优先级规则，以及 `${_adsMagic}` 的兼容输出策略。

---

## 🚀 快速上手

虽然内部机制复杂，但日常使用仅需以下几步：

### 1. 准备数据
确保 Excel 文件已按照 [数据规范](./data-spec.md) 准备好，并放入 `tools/domain-tool/input/` 目录。

### 2. 执行生成
在项目根目录运行：

```bash
# 预览变更（推荐首选，不会修改文件）
npm run domain-tool -- --preview

# 执行生成（合并模式，保留现有配置）
npm run domain-tool
```

> **注意**: 如果没有配置 npm script，请使用完整命令 `node tools/domain-tool/index.js`。

### 3. 高级选项

| 场景 | 命令参数 | 说明 |
| :--- | :--- | :--- |
| **仅验证数据** | `--preview` | 在控制台打印生成的 JSON，不写入文件 |
| **调试特定域名** | `--domains "example.com"` | 仅处理指定域名，忽略 Excel 中的其他行 |
| **切换广告格式** | `--template ./path/to/tpl.js` | 使用自定义模板渲染广告位结构 |
| **强制覆盖** | `--overwrite` | ⚠️ 危险：丢弃所有现有配置，完全重写 |

---

## 常见问题 (FAQ)

**Q: 为什么生成的配置里有些字段是随机数？**
A: 当 Excel 中未填写某些非关键视觉字段（如 `siteThemeColor`）时，工具会根据 [架构文档](./architecture.md) 中的策略自动生成确定性的随机值，以保证新站点的视觉完整性。

**Q: 如何新增一个 Excel 表头字段？**
A: 无需修改代码。请参考 [数据规范](./data-spec.md) 中的映射配置章节，在 `config.js` 中添加新旧字段名的映射即可。
