# 变更日志

> 按时间倒序排列的所有修改记录

## 2026-02-04

### 自动化部署与外网访问
- **类型**: 部署优化
- **状态**: 🔵 Completed
- **文档**: [iterations/deployment-and-access.md](./iterations/deployment-and-access.md)
- **摘要**: 配置 GitHub Actions 自动化流水线，实现外网 HTTPS 访问
- **关键决策**: 采用 GitHub Actions 部署方案，适配 base 路径

### 301 重定向管理
- **类型**: 脚本记录
- **状态**: 🟢 Active
- **文档**: [scripts/301-redirect-management.md](./scripts/301-redirect-management.md)
- **摘要**: 整理并记录 301 重定向管理工具的快捷命令
- **关键决策**: 整合散落的 `.my-commands` 文档至 Wiki

### deploy & lookup 补充认证信息
- **类型**: 文档更新
- **文档**: [scripts/deploy-lookup-wrapper.md](./scripts/deploy-lookup-wrapper.md)
- **摘要**: 补充 SCMP 首次使用的登录与环境变量配置

### 搜索功能增强与 Skill 同步自动化
- **类型**: 功能增强 & 自动化
- **状态**: 🔵 Completed
- **文档**: [iterations/search-and-automation.md](./iterations/search-and-automation.md)
- **摘要**: 汉化并增强本地搜索，建立规范化的 Skill 自动同步机制，统一语义化命名

### 知识库方案对比与选型
- **类型**: 前期调研
- **状态**: 🔵 Completed
- **文档**: [iterations/wiki-solution-comparison.md](./iterations/wiki-solution-comparison.md)
- **摘要**: 对比 Markdown, VitePress, Notion 等方案，确定最终技术架构

### 知识库系统现代化与架构合并
- **类型**: UI/UX 优化 & 架构调整
- **状态**: 🔵 Completed
- **文档**: [iterations/wiki-modernization-and-merge.md](./iterations/wiki-modernization-and-merge.md)
- **摘要**: 升级 Cyber-Noir 视觉风格，合并内容与 Web 项目，修复死链与构建错误

### 个人知识库系统搭建
- **类型**: 系统迭代
- **状态**: 🟢 Active
- **文档**: [iterations/knowledge-wiki-system.md](./iterations/knowledge-wiki-system.md)
- **摘要**: 搭建 Markdown + VitePress 双轨知识库系统

### deploy & lookup 命令封装
- **类型**: 脚本创建
- **状态**: 🟢 Active
- **文档**: [scripts/deploy-lookup-wrapper.md](./scripts/deploy-lookup-wrapper.md)
- **摘要**: 封装 deploy and lookup 命令，无参数时显示友好帮助信息

### Clash Verge 智能分流配置脚本（补充更新）
- **类型**: 脚本更新
- **状态**: 🟢 Active
- **文档**: [scripts/clash-verge-proxy-rules.md](./scripts/clash-verge-proxy-rules.md)
- **摘要**: npm/yarn/pnpm 默认直连，添加快捷命令

### Clash Verge 智能分流配置脚本
- **类型**: 脚本创建
- **状态**: 🟢 Active
- **文档**: [scripts/clash-verge-proxy-rules.md](./scripts/clash-verge-proxy-rules.md)
- **摘要**: 配置 Clash Verge 实现智能分流

---

## 模板

```markdown
### 标题
- **类型**: iteration | feature | script | bugfix
- **状态**: 🟡 Draft | 🟢 Active | 🔵 Completed | ⚪ Archived
- **文档**: [路径](./path/to/doc.md)
- **摘要**: 一句话描述
- **关键决策**: 重要的技术决策
```
