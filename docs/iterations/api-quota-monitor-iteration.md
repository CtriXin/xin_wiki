# API 配额监控项目迭代记录

## 项目概述
API 配额监控项目用于实时监控多个AI提供商（Kimi、MiniMax、阿里云百炼）的API用量配额，提供统一的可视化界面和配置管理。

## 迭代时间线

### 2026-02-25 (初始开发)
- **项目初始化**: 创建基本项目结构
- **多提供商支持**: 实现Kimi、MiniMax、Bailian基础框架
- **前端界面**: 开发响应式Web界面，支持深色模式
- **配置管理**: 实现配置文件存储和Web界面配置更新

### 2026-02-26 (Bug修复与功能完善)
- **Bailian API集成**: 
  - 初始实现使用DashScope公共API（失败）
  - 发现需要使用阿里云控制台内部API
  - 根据《阿里云百炼用量查询完整指南》重新实现
  - 修复数据解析逻辑错误
  - 正确处理嵌套JSON响应结构
- **Cookie认证支持**: 实现完整的session cookie认证机制
- **多维度配额显示**: 支持月度、周、5小时三种配额维度
- **错误处理优化**: 改进网络错误和认证错误的处理

## 关键技术突破

### Bailian内部API调用
通过分析浏览器开发者工具，发现正确的API端点：
- **URL**: `https://bailian-cs.console.aliyun.com/data/api.json`
- **Method**: POST
- **认证**: Cookie-based session authentication
- **API**: `zeldaEasy.broadscope-bailian.codingPlan.queryCodingPlanInstanceInfoV2`

### 复杂请求参数构建
成功构建包含cornerstoneParam的复杂JSON参数结构，包括：
- feTraceId (UUID生成)
- X-Anonymous-Id (从cookie中提取cna值)
- 完整的控制台上下文信息

### 响应数据解析
正确解析嵌套的JSON响应结构：
```
result.data.DataV2.data.data.codingPlanInstanceInfos[0].codingPlanQuotaInfo
```

## 使用命令

### 本地运行
```bash
# 进入项目目录
cd ~/xin_wiki/projects/quota-monitor

# 创建虚拟环境（推荐）
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r backend/requirements.txt

# 启动服务器
python backend/server.py
```

### 访问界面
- **地址**: http://localhost:3001
- **刷新数据**: 点击"🔄 刷新"按钮
- **配置管理**: 点击"⚙️ 配置"按钮

### 配置说明
配置文件位于 `config.json`:
```json
{
  "kimi": {
    "auth_token": "kimi-auth cookie值"
  },
  "minimax": {
    "api_token": "MiniMax API Token",
    "region": "china|global"
  },
  "bailian": {
    "cookie": "完整的阿里云控制台cookie字符串",
    "region": "cn-beijing"
  }
}
```

## 已知问题与解决方案

### 1. Bailian Cookie过期
- **问题**: Cookie有效期约24小时，过期后无法获取数据
- **解决方案**: 重新从浏览器复制新的cookie

### 2. 端口冲突
- **问题**: 默认5000端口可能被占用
- **解决方案**: 项目已修改为使用3001端口

### 3. Python环境问题
- **问题**: macOS系统Python环境限制
- **解决方案**: 使用虚拟环境或用户级pip安装

## 未来改进方向

1. **自动Cookie刷新**: 实现自动登录获取新鲜cookie
2. **数据持久化**: 添加历史用量数据存储和图表
3. **用量告警**: 实现用量阈值告警功能
4. **更多提供商**: 扩展支持其他AI服务提供商
5. **移动端优化**: 改进移动设备体验

## 项目状态
✅ **功能完整** - 所有三个提供商均能正确显示配额  
✅ **稳定运行** - 经过多次测试验证  
✅ **文档齐全** - 包含完整的使用和配置说明