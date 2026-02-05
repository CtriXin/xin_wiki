---
title: Ads.txt Group 优先级与 Magic 占位符
date: 2026-02-05
tags: [domain-tool, ads, config]
---

# Ads.txt Group 优先级与 Magic 占位符

> **摘要**: 在域名配置工具中引入 `${_adsMagic}`，实现“有 group 走 group 路径、无 group 走 ads.txt 内容”的兼容输出，并配套健康检查告警。

## 背景与需求

部分项目需要同时支持两种 ads.txt 输入方式：

- **ads.txt 内容**（完整文本）
- **ads.txt group**（如 `group_31`，映射到本地 group 文件）

历史上模板字段 `ads: '${_ads}'` 只会强制输出内容，导致当表格同时填写了 `ads.txt` + `ads.txt group` 时，无法按 group 优先输出。为兼容旧项目与新需求，引入 Magic 占位符。

## 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `ads: '${_adsMagic}'` | string | 无 | **优先 group**：有 group 输出 group 路径，无 group 输出 ads.txt 内容 |
| `ads: '${_ads}'` | string | 无 | **强制内容**：无论是否存在 group，都只输出 ads.txt 内容 |
| `ads_file: '${_ads_file}'` | string | 无 | 仅输出 group 文件路径字段 |
| `adsFile.groupPattern` | RegExp | `/^group[_\s]*(\d+)$/i` | 判断 ads.txt 内容是否为 group 的识别规则 |
| `adsFile.adsFileTemplate` | string | `src/utils/config/adstxt/group_${group}.txt` | group 路径模板 |

## 完整配置示例

```js
template: {
  // ads.txt 配置
  ads: '${_adsMagic}', // 有 group 输出 group 路径，否则输出 ads.txt 内容
  ads_file: '${_ads_file}',
}

adsFile: {
  adsFileTemplate: 'src/utils/config/adstxt/group_${group}.txt',
  groupPattern: /^group[_\s]*(\d+)$/i,
  defaultValue: 'success'
}
```

## 使用方法

```bash
# 预览生成结果
node tools/domain-tool/index.js --preview
```

## 注意事项

- 若模板使用 `ads: '${_ads}'`，即使 Excel 中存在 `ads.txt group`，也会**强制输出 ads.txt 内容**，并触发健康检查告警。
- 若同时存在 `ads.txt` 与 `ads.txt group` 且输出仍为内容，检查是否：
  - group 值未匹配 `groupPattern`
  - 模板未使用 `${_adsMagic}` 或 `ads_file`

## 健康检查与告警示例

以下告警会在生成阶段输出（便于快速发现配置误差）：

- **Ads.txt 优先级告警**  
  触发条件：Excel 同时提供 `ads.txt` 与 `ads.txt group`，但最终输出仍为内容模式。  
  典型输出：
  ```text
  [Ads.txt优先级] Excel 同时提供了 ads.txt 与 ads.txt group，但输出仍为 ads.txt 内容，请检查 group 是否被识别或模板是否缺少 'ads_file' 字段。
  ```

- **模板强制内容提示**  
  触发条件：模板使用 `ads: '${_ads}'` 且 Excel 中存在 group。  
  典型输出：
  ```text
  [Ads.txt配置提示] 模板使用 \${_ads}，即使存在 ads.txt group 也会强制输出 ads.txt 内容。若希望 group 优先，请改用 \${_adsMagic} 或在模板中加入 'ads_file'。
  ```

- **Group 无效提示**  
  触发条件：`ads.txt group` 值未命中 `groupPattern`。  
  典型输出：
  ```text
  [Ads.txt Group无效] 发现 ads.txt group 值="group_xx"，但未匹配到 groupPattern，已回退为 ads.txt 内容。
  ```
