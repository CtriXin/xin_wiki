---
title: Excel 数据规范与映射指南
date: 2026-02-05
tags: [domain-tool, data-spec]
---

# Excel 数据规范与映射指南

> **摘要**: 详细说明 Excel 输入文件的结构要求、特殊字段格式以及如何通过配置文件自定义列映射。

## Excel 结构概览

工具要求 Excel 文件必须包含两个特定的工作表（Sheet），分别用于存储基础信息和广告位数据。

### Sheet 1: 域名配置 (Domain Config)

此表为**一行一域名**的结构，定义站点的全局属性。

#### 关键字段映射

为了兼容运营人员不同的命名习惯，工具在 `config.js` 中维护了一套**软映射 (Soft Mapping)** 机制。

| 标准字段 key | Excel常见表头 (支持模糊匹配) | 数据类型 | 说明 |
| :--- | :--- | :--- | :--- |
| `domain` | 域名, domain, new domain | String | **唯一主键**，必须存在 |
| `siteName` | 网站名称, 网站标题, Title | String | 站点显示名称 |
| `firebaseConfig` | Firebase, Firebase信息 | JSON/String | 支持 minified JSON 字符串 |
| `ads_group` | ads.txt group, adsGroup | String/Number | 广告分组 ID，用于映射 ads.txt |
| `ads_content` | Ads.txt, ads.txt content | String | 只有在无分组时的直接内容 |

#### 特殊字段格式说明

1.  **Firebase Config**:
    工具会自动尝试解析该单元格。支持两种格式：
    -   标准 JSON: `{"apiKey": "AIza...", ...}`
    -   简化键值对: `apiKey: "AIz...", projectId: "..."` (工具会自动补全引号使其合规)

2.  **Theme Filter**:
    用于根据 Excel 内容控制站点的主题过滤规则。
    -   格式: `{"fuel": "Gasoline"}`

### Sheet 2: 广告位配置 (Ads Slots)

此表采用**矩阵式结构**，以支持每个域名拥有任意数量的广告位。

-   **列结构**: 每一个域名占用固定的 **3列**。
-   **第一行**: 域名标识 (如 `example.com` 占据 A, B, C 三列)。
-   **第二行**: 固定表头 `广告位名称 | head | body`。

#### 数据层级

```text
Row 1:  [Domain A]   [   ]    [   ]    |  [Domain B]   [   ]    [   ]
Row 2:  [Slot Name]  [Head]   [Body]   |  [Slot Name]  [Head]   [Body]
Row 3:  [home_top]   [<scr..] [<div..] |  [home_top]   [<scr..] [<div..]
```

### 自定义映射配置

如果 Excel 表头发生变化（例如运营将 "域名" 改为 "网站地址"），**无需修改代码**，只需更新 `config.js` 中的 `mapping` 对象：

```javascript
// config.js
mapping: {
    // 左侧是 Excel 表头，右侧是内部字段名
    '网站地址': 'domain',
    'Site Address': 'domain',
    
    // 支持一对多映射
    'Contact Email': 'email',
    'Support Mail': 'email'
}
```
