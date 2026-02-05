# 变更日志

> 按时间倒序排列的所有修改记录

## 2026-02-05

### Ads.txt Group 优先级与 Magic 占位符
- **类型**: feature
- **摘要**: 新增 `${_adsMagic}` 以兼容 group 与内容优先级，并补充健康检查告警说明
- **文档**: [features/domain-tool/ads-txt-magic.md](./features/domain-tool/ads-txt-magic.md)
- **状态**: 🟢 Active
- **Last Modified**: 2026-02-05 16:20

### 301 重定向管理工具文档合并与全量补全
- **类型**: script
- **摘要**: 合并分散的 301 文档，补全了 `restore` 智能溯源、批量处理语法、Git 自动化流等全量命令逻辑
- **文档**: [301-redirect-management.md](./scripts/301-redirect-management.md)
- **状态**: 🔵 Completed
- **Last Modified**: 2026-02-05 12:15

### 域名配置工具模块化重构
- **类型**: iteration
- **摘要**: 将分散的域名配置说明重构为模块化包结构，提升文档内链稳定性
- **文档**: [features/domain-tool/index.md](./features/domain-tool/index.md)
- **状态**: 🔵 Completed
- **Last Modified**: 2026-02-05 11:30

## 2026-02-04

### 配置文件迁移指南
- **类型**: feature
- **摘要**: 创建一键迁移脚本，实现 OpenCode 配置在多电脑间同步
- **文档**: [config-migration.md](./config-migration.md)
- **状态**: 🟢 Active
- **Last Modified**: 2026-02-04 20:36

### Kimi Free Rate Limit 问题解决
- **类型**: feature
- **摘要**: 为 Kimi Free 添加 fallback 机制，解决限流时的自动切换问题
- **文档**: [kimi-free-rate-limit.md](./kimi-free-rate-limit.md)
- **状态**: 🟢 Active
- **Last Modified**: 2026-02-04 20:30

### Agent 调度机制说明
- **类型**: feature
- **摘要**: 详细说明 Sisyphus/Hephaestus/Prometheus/Atlas 等 Agent 的调度逻辑
- **文档**: [agent-scheduling.md](./agent-scheduling.md)
- **状态**: 🟢 Active
- **Last Modified**: 2026-02-04 20:20

### 模型选择指南
- **类型**: feature
- **摘要**: 根据实测结果整理各模型专长，为不同场景推荐最优选型
- **文档**: [model-selection-guide.md](./model-selection-guide.md)
- **状态**: 🟢 Active
- **Last Modified**: 2026-02-04 20:10

### 多模型配置策略
- **类型**: feature
- **摘要**: 制定付费模型处理核心任务、免费模型处理日常任务的混合使用策略
- **文档**: [oh-my-opencode-model-strategy.md](./oh-my-opencode-model-strategy.md)
- **状态**: 🟢 Active
- **Last Modified**: 2026-02-04 20:05

### oh-my-opencode 安装指南
- **类型**: feature
- **摘要**: 安装 oh-my-opencode 插件并完成基础配置
- **文档**: [oh-my-opencode-install.md](./oh-my-opencode-install.md)
- **状态**: 🟢 Active
- **Last Modified**: 2026-02-04 20:00

### 变更日志格式规范升级
- **类型**: 流程优化
- **摘要**: 重构 Changelog 记录格式，确立“类型-摘要-文档-状态-时间”的标准顺序
- **文档**: [iterations/changelog-format-update.md](./iterations/changelog-format-update.md)
- **状态**: 🔵 Completed
- **Last Modified**: 2026-02-04 20:00

### 死链校验流程补强
- **类型**: 流程优化
- **摘要**: 母 Skill 增加“提交前死链检查”规范，并补齐缺失页面以修复构建失败
- **文档**: [features/carrevplat-config.md](./features/carrevplat-config.md)
- **状态**: 🔵 Completed
- **Last Modified**: 2026-02-04 19:05

### Skill Frontmatter 修复
- **类型**: 系统修复
- **摘要**: 修复 `knowledge-wiki` 技能文件缺少 YAML frontmatter 的加载告警
- **文档**: [iterations/skill-frontmatter-fix.md](./iterations/skill-frontmatter-fix.md)
- **状态**: 🔵 Completed
- **Last Modified**: 2026-02-04 18:50

### 自动化部署与外网访问
- **类型**: 部署优化
- **摘要**: 配置 GitHub Actions 自动化流水线，实现外网 HTTPS 访问
- **文档**: [iterations/deployment-and-access.md](./iterations/deployment-and-access.md)
- **状态**: 🔵 Completed
- **Last Modified**: 2026-02-04 18:35

### 301 重定向管理
- **类型**: 脚本记录
- **摘要**: 整理并记录 301 重定向管理工具的快捷命令
- **文档**: [scripts/301-redirect-management.md](./scripts/301-redirect-management.md)
- **状态**: 🟢 Active
- **Last Modified**: 2026-02-04 18:20

### deploy & lookup 补充认证信息
- **类型**: 文档更新
- **摘要**: 补充 SCMP 首次使用的登录与环境变量配置
- **文档**: [scripts/deploy-lookup-wrapper.md](./scripts/deploy-lookup-wrapper.md)
- **状态**: 🟢 Active
- **Last Modified**: 2026-02-04 18:05

### 搜索功能增强与 Skill 同步自动化
- **类型**: 功能增强 & 自动化
- **摘要**: 汉化并增强本地搜索，建立规范化的 Skill 自动同步机制
- **文档**: [iterations/search-and-automation.md](./iterations/search-and-automation.md)
- **状态**: 🔵 Completed
- **Last Modified**: 2026-02-04 17:50

### 知识库方案对比与选型
- **类型**: 前期调研
- **摘要**: 对比 Markdown, VitePress, Notion 等方案，确定最终技术架构
- **文档**: [iterations/wiki-solution-comparison.md](./iterations/wiki-solution-comparison.md)
- **状态**: 🔵 Completed
- **Last Modified**: 2026-02-04 17:20

### 知识库系统现代化与架构合并
- **类型**: UI/UX 优化 & 架构调整
- **摘要**: 升级 Cyber-Noir 视觉风格，合并内容与 Web 项目
- **文档**: [iterations/wiki-modernization-and-merge.md](./iterations/wiki-modernization-and-merge.md)
- **状态**: 🔵 Completed
- **Last Modified**: 2026-02-04 16:40

### 个人知识库系统搭建
- **类型**: 系统迭代
- **摘要**: 搭建 Markdown + VitePress 双轨知识库系统
- **文档**: [iterations/knowledge-wiki-system.md](./iterations/knowledge-wiki-system.md)
- **状态**: 🟢 Active
- **Last Modified**: 2026-02-04 15:10

### deploy & lookup 命令封装
- **类型**: 脚本创建
- **摘要**: 封装 deploy and lookup 命令，无参数时显示友好帮助信息
- **文档**: [scripts/deploy-lookup-wrapper.md](./scripts/deploy-lookup-wrapper.md)
- **状态**: 🟢 Active
- **Last Modified**: 2026-02-04 14:35

### Clash Verge 智能分流配置脚本
- **类型**: 脚本更新
- **摘要**: 配置 Clash Verge 实现智能分流，支持包管理器直连
- **文档**: [scripts/clash-verge-proxy-rules.md](./scripts/clash-verge-proxy-rules.md)
- **状态**: 🟢 Active
- **Last Modified**: 2026-02-04 14:00

---

## 模板

```markdown
### 标题
- **类型**: iteration | script | feature
- **摘要**: 一句话描述
- **文档**: [链接](./path/to/doc.md)
- **状态**: 🟢 Active | 🔵 Completed
- **Last Modified**: YYYY-MM-DD HH:mm
```
