---
title: 广告模板与渲染系统
date: 2026-02-05
tags: [domain-tool, template]
---

# 广告模板与渲染系统

> **摘要**: 介绍如何通过 `ads-template.js` 自定义生成的 HTML 结构，以及占位符系统的使用方法。

## 模板系统设计

为了应对 Google AdSense 和 AdX 多变的各个代码格式，本工具将**数据提取**与**HTML 生成**解耦。

-   **数据**: 来自 Excel (Slot ID, Client ID, Dimensions)。
-   **结构**: 来自 Template 文件 (HTML Wrapper, Script tags)。

### 模板文件结构 (`ads-template.js`)

一个标准的模板文件包含三个部分：

```javascript
module.exports = {
    // 1. 包装器: 定义广告代码的外层包裹结构
    wrapper: {
        scriptUrl: '${scriptUrl}',
        // 可以在这里扩展更多外层属性
    },

    // 2. 广告位格式: 定义每个具体广告位的内部字段结构
    slotFormat: {
        'data-ad-slot': '${slot}',
        'data-ad-client': '${client}',
        'style': '${style}',
        // 支持自定义 class 或其他属性
        'class': 'adsbygoogle custom-class'
    },

    // 3. 位置映射: 定义具体的页面位置 (Positon) 对应的输出逻辑
    adsense: {
        // 将 Excel 中的 'home_1' 位置映射为 JSON 中的 home_1 字段
        'home_1': '${home_1}',
        'detail_1': '${detail_1}'
    }
}
```

## 占位符系统 (Placeholders)

在模板中可以使用 `$` 开头的占位符，它们将在生成时被动态替换。

| 占位符 | 来源 | 说明 |
| :--- | :--- | :--- |
| `${slot}` | Excel/Regex | 提取出的 Ad Slot ID |
| `${client}` | Excel/Regex | 提取出的 Ad Client ID (ca-pub-xxx) |
| `${style}` | Static/Dynamic | 广告位的 CSS Style |
| `${scriptUrl}` | Config | 广告脚本的加载地址 (gpt.js / adsbygoogle.js) |
| `${format}` | Excel | 如 `auto`, `rectangle` 等 |
| `${fullWidth}` | Default | 是否全宽响应 (true/false) |

## Ads.txt 占位符与优先级

ads.txt 输出由 **模板字段**控制，与 Excel 字段共存时的优先级如下：

- `ads: '${_adsMagic}'`  
  有 `ads.txt group` 时输出 group 文件路径；否则输出 `ads.txt` 内容。
- `ads: '${_ads}'`  
  强制输出 `ads.txt` 内容，即使 Excel 中存在 group。
- `ads_file: '${_ads_file}'`  
  仅输出 group 文件路径字段。

> 若 Excel 同时存在 `ads.txt` 与 `ads.txt group`，但输出仍为内容模式，会触发健康检查告警。详见 [Ads.txt Group 优先级与 Magic 占位符](./ads-txt-magic.md)。

### 动态渲染流程

1.  **加载模板**: 工具根据 `--template` 参数加载指定的 JS 文件。
2.  **解析 Excel**: 提取出原始的 HTML 片段。
3.  **正则匹配**: 从原始 HTML 中提取核心参数（如 Slot ID）。
4.  **注入**: 将核心参数填入 `slotFormat` 定义的结构中。
5.  **组装**: 将格式化后的 Object 放入对应的 `adsense.{position}` 字段。

## 场景示例：切换广告格式

**场景**: 仅需要输出 Slot ID，由前端组件负责拼接 HTML。

只需创建一个新的简化模板 `simple-template.js`:

```javascript
module.exports = {
    // 极简模式，不输出冗余字段
    slotFormat: {
        'slot_id': '${slot}'
    }
}
```

运行命令时指定该模板：
```bash
node tools/domain-tool/index.js --template simple-template.js
```

生成的 JSON 将变为：
```json
"home_1": {
    "slot_id": "123456789"
}
```
无需修改任何解析逻辑代码。
