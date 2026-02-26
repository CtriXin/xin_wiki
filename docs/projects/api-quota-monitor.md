# API 配额监控工具

> 实时监控 Kimi、MiniMax、阿里云百炼 (Bailian) 的 API 用量配额

## 📋 概述

API 配额监控工具是一个集中的配额管理解决方案，支持多个主流 AI 提供商的用量查询和可视化展示。

### 支持的提供商

- **Kimi**: 周度和分钟级配额监控
- **MiniMax**: 多模型配额监控（M2、M2.1、M2.5）
- **阿里云百炼 (Bailian)**: Coding Plan 套餐用量监控（月度、周度、5小时周期）

## 🚀 快速开始

### 安装依赖

```bash
cd projects/quota-monitor/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 配置 API 凭据

编辑 `config.json` 文件：

```json
{
  "kimi": {
    "auth_token": "your-kimi-auth-token"
  },
  "minimax": {
    "api_token": "your-minimax-api-token",
    "region": "china"
  },
  "bailian": {
    "cookie": "your-bailian-console-cookie",
    "region": "cn-beijing"
  }
}
```

### 启动服务

```bash
cd backend
source venv/bin/activate
python server.py
```

访问 [http://localhost:3001](http://localhost:3001) 查看配额监控界面。

## 🔧 配置指南

### Kimi 配置

1. 访问 [Kimi Code Console](https://www.kimi.com/code/console)
2. 打开开发者工具 (F12)
3. 在 Application → Cookies 中找到 `kimi-auth` cookie
4. 复制其值到 `config.json` 的 `kimi.auth_token` 字段

### MiniMax 配置

1. 访问 [MiniMax 用户中心](https://www.minimaxi.com/user-center/basic-information)
2. 获取 API Token
3. 根据使用区域设置 `region` 字段：
   - `china`: 使用 `api.minimaxi.com`
   - `global`: 使用 `api.minimax.io`

### 百炼 (Bailian) 配置

1. 访问 [百炼控制台](https://bailian.console.aliyun.com/cn-beijing/#/efm/coding_plan)
2. 打开开发者工具 (F12)
3. 在 Console 中运行 `document.cookie`
4. 复制完整的 cookie 字符串到 `config.json` 的 `bailian.cookie` 字段

> **注意**: Bailian cookie 有效期约 24 小时，过期后需要重新获取。

## 📊 数据结构

### Kimi 配额数据

```json
{
  "total": 100,
  "used": 41,
  "remaining": 59,
  "percentage": 41.0,
  "resetTime": "2026-02-26T08:39:19.540136Z",
  "rateLimit": {
    "total": 100,
    "used": 0,
    "remaining": 100,
    "percentage": 0.0,
    "resetTime": "2026-02-26T02:39:19.540136Z"
  }
}
```

### MiniMax 配额数据

```json
{
  "total": 600,
  "used": 0,
  "remaining": 600,
  "percentage": 0.0,
  "region": "china",
  "models": [
    {
      "name": "MiniMax-M2",
      "total": 600,
      "used": 0,
      "remaining": 600,
      "percentage": 0.0,
      "resetTimeSeconds": 1584.42
    }
  ]
}
```

### 百炼配额数据

```json
{
  "configured": true,
  "instance_name": "Coding Plan Lite",
  "remaining_days": 25,
  "status": "VALID",
  "monthly": {
    "total": 18000,
    "used": 1573,
    "remaining": 16427,
    "percentage": 8.7,
    "resetTimeHuman": "614小时4分钟后重置"
  },
  "weekly": {
    "total": 9000,
    "used": 1573,
    "remaining": 7427,
    "percentage": 17.5,
    "resetTimeHuman": "86小时4分钟后重置"
  },
  "fiveHour": {
    "total": 1200,
    "used": 91,
    "remaining": 1109,
    "percentage": 7.6,
    "resetTimeHuman": "0小时0分钟后重置"
  }
}
```

## 🛠️ API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/providers` | GET | 列出所有可用的提供商 |
| `/api/quota/<provider>` | GET | 获取指定提供商的配额信息 |
| `/api/config` | GET | 获取当前配置（敏感信息已过滤） |
| `/api/config` | POST | 更新配置 |
| `/api/test` | GET | 测试所有提供商 |

## 💡 使用技巧

### 自动化监控

可以设置定时任务定期检查配额：

```bash
# 每小时检查一次
0 * * * * curl http://localhost:3001/api/test > /dev/null 2>&1
```

### 用量告警

在脚本中添加用量告警逻辑：

```javascript
// 示例：当用量超过80%时发送告警
const WARNING_THRESHOLD = 80;
if (monthlyPercentage > WARNING_THRESHOLD) {
  // 发送告警通知
  sendAlert(`⚠️ 百炼用量已达 ${monthlyPercentage}%`);
}
```

## 🐞 常见问题

### Cookie 过期

**症状**: 返回 302 重定向或 401 未授权  
**解决**: 重新访问控制台并复制新的 cookie

### 403 Forbidden 错误

**原因**: sec_token 失效或地域不匹配  
**解决**: 
1. 从最新请求获取 sec_token
2. 检查 URL 中的地域是否正确

### 空数据响应

**原因**: 账号下没有激活的套餐  
**解决**: 
1. 确认已开通 Coding Plan 服务
2. 检查 commodityCode 是否正确

## 📚 相关文件

- **配置文件**: `projects/quota-monitor/config.json`
- **后端代码**: `projects/quota-monitor/backend/`
- **前端代码**: `projects/quota-monitor/frontend/`
- **日志文件**: 查看终端输出或系统日志

## 🔄 版本历史

### v1.0.0 (2026-02-26)

- 初始版本发布
- 支持 Kimi、MiniMax、百炼三个提供商
- Web 界面实时配额监控
- 配置管理界面