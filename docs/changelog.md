# 变更日志

> 按时间倒序排列的所有修改记录

## 2026-02-04

### `<script>` 301 重定向管理
- **类型**: 脚本记录
- **状态**: 🟢 Active
- **文档**: [scripts/301-redirect-management.md](./scripts/301-redirect-management.md)
- **摘要**: 整理并记录 301 重定向管理工具的快捷命令
- **关键决策**: 整合散落的 `.my-commands` 文档至 Wiki

### `<script>` deploy & lookup 补充认证信息
- **类型**: 文档更新
- **文档**: [scripts/deploy-lookup-wrapper.md](./scripts/deploy-lookup-wrapper.md)
- **摘要**: 补充 SCMP 首次使用的登录与环境变量配置

### `<feature>` Carrevplat.com Configuration Lookup
- **类型**: 配置记录
- **状态**: 🟢 Active
- **文档**: [features/carrevplat-config.md](./features/carrevplat-config.md)
- **摘要**: 记录 carrevplat.com 的 SCMP 配置信息 (Service, Git URL, Branch)
- **关键决策**: N/A

### `<iteration>` 搜索功能增强与 Skill 同步自动化
- **类型**: 功能增强 & 自动化
- **状态**: 🔵 Completed
- **文档**: [iterations/search-and-automation.md](./iterations/search-and-automation.md)
- **摘要**: 汉化并增强本地搜索，建立规范化的 Skill 自动同步机制，统一语义化命名
- **关键决策**: 采用目录化 Skill 结构，移除文件名日期前缀

### `<iteration>` 知识库方案对比与选型
- **类型**: 前期调研
- **状态**: 🔵 Completed
- **文档**: [iterations/wiki-solution-comparison.md](./iterations/wiki-solution-comparison.md)
- **摘要**: 对比 Markdown, VitePress, Notion 等方案，确定最终技术架构
- **关键决策**: 选定 VitePress 作为展示层，Markdown 作为内容层

### `<iteration>` 知识库系统现代化与架构合并
- **类型**: UI/UX 优化 & 架构调整
- **状态**: 🔵 Completed
- **文档**: [iterations/wiki-modernization-and-merge.md](./iterations/wiki-modernization-and-merge.md)
- **摘要**: 升级 Cyber-Noir 视觉风格，合并内容与 Web 项目，修复死链与构建错误
- **关键决策**: 采用单仓库管理模式，强制高对比度深色主题

### `<iteration>` 个人知识库系统搭建
- **类型**: 系统迭代
- **状态**: 🟢 Active
- **文档**: [iterations/knowledge-wiki-system.md](./iterations/knowledge-wiki-system.md)
- **摘要**: 搭建 Markdown + VitePress 双轨知识库系统，统一模板，解决技术记录散落问题
- **关键决策**: 采用双轨制，Markdown 保证内容持久，VitePress 提供美观展示

### `<script>` deploy & lookup 命令封装
- **类型**: 脚本创建
- **状态**: 🟢 Active
- **文档**: [scripts/deploy-lookup-wrapper.md](./scripts/deploy-lookup-wrapper.md)
- **摘要**: 封装 deploy and lookup 命令，无参数时显示友好帮助信息，提升内网工具使用体验
- **关键决策**: 使用 zsh 函数封装，在调用真实命令前检查参数，增强可用性

### `<script>` Clash Verge 智能分流配置脚本（补充更新）
- **类型**: 脚本更新
- **状态**: 🟢 Active
- **文档**: [scripts/clash-verge-proxy-rules.md](./scripts/clash-verge-proxy-rules.md)
- **摘要**: npm/yarn/pnpm 默认直连，添加 proxy/noproxy/px/np 快捷命令
- **关键决策**: 公司内网环境包管理器直连更快，提供灵活的单次命令代理切换

### `<script>` Clash Verge 智能分流配置脚本
- **类型**: 脚本创建
- **状态**: 🟢 Active
- **文档**: [scripts/clash-verge-proxy-rules.md](./scripts/clash-verge-proxy-rules.md)
- **摘要**: 配置 Clash Verge 实现智能分流，item/antigravity/Google/ChatGPT 走代理，其他直连，内网域名排除
- **关键决策**: 放弃 TUN 模式，改用系统代理 + Shell 环境变量，解决内网访问冲突

---

## 模板

```markdown
### `<type>` 标题
- **类型**: iteration | feature | script | bugfix
- **状态**: 🟡 Draft | 🟢 Active | 🔵 Completed | ⚪ Archived
- **文档**: [路径](./path/to/doc.md)
- **摘要**: 一句话描述
- **关键决策**: 重要的技术决策
```