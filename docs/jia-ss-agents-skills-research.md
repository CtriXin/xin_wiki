# JIA-ss/agents Skills 研究报告

> 研究日期：2026-02-28
> GitHub 仓库：https://github.com/JIA-ss/agents
> Skills 目录：https://github.com/JIA-ss/agents/tree/main/skills

---

## 目录

- [概述](#概述)
- [14 个 Skills 详解](#14-个-skills-详解)
- [共同模式和架构](#共同模式和架构)
- [安装和使用](#安装和使用)
- [总结](#总结)

---

## 概述

JIA-ss/agents 是一个基于 Claude Code 的 AI Agent 工作流系统，提供了 **14 个可安装的 Skills**，覆盖了从需求分析到代码实现、再到内容创作的完整流程。

### 核心设计理念

- **Skill Driven Development (SDD)**：以 Skill 为单位的开发模式
- **结构化工作流**：每个阶段都有明确的输入/输出和状态管理
- **独立审查机制**：支持 AI 自我审查和迭代改进
- **MCP 集成**：多服务降级策略和平台特定集成

---

## 14 个 Skills 详解

### 1. codex - OpenAI Codex CLI 自动化

**功能**：在无头模式(headless)下使用 OpenAI Codex CLI 执行代码任务

**四阶段工作流**：
- **PARSE**：识别用户意图（代码审查、新任务、恢复会话），提取参数
- **VALIDATE**：验证目标目录存在、codex 已安装、在 git 仓库中
- **EXECUTE**：使用 `--full-auto` 运行 codex 命令，用 `-o <FILE>` 捕获输出
- **REPORT**：返回输出文件内容，总结代码变更

**关键命令**：
```bash
# 代码审查
codex exec review --full-auto -o review.md

# 通用任务
codex exec --full-auto -o result.md "prompt"

# 恢复会话
codex resume --last
```

**默认模型**：`gpt-5.2-codex`

---

### 2. copilot - GitHub Copilot 集成

**功能**：提供 GitHub Copilot 的集成和使用支持

---

### 3. openclaw-devops - OpenClaw 网关系统管理

**功能**：通过 CLI 直接管理 OpenClaw Gateway 服务

**主要功能**：
| 模块 | 命令 |
|------|------|
| Gateway | `openclaw gateway status/start/stop/restart` |
| 日志 | `openclaw logs --limit 50` |
| 诊断 | `openclaw doctor [--repair]` |
| 模型 | `openclaw models status/list/set` |
| Cron | `openclaw cron list/run/enable` |

**核心架构**：使用双配置文件（需手动同步）
- `~/.openclaw/openclaw.json` — CLI 配置
- `~/.clawdbot/clawdbot.json` — Gateway 配置

**常见问题**："CLI 能看到 Telegram 里看不到" — 当只更新了一个文件时发生

---

### 4. research - 研究技能

**功能**：提供研究能力，支持深度信息搜索和分析

---

### 5. sdd-init - SDD 体系初始化

**功能**：在目标项目中一键初始化 Skill 驱动开发(SDD)体系

**六步工作流**：
1. 收集项目信息（名称、技术栈、Skill 名称、目标路径）
2. 确定目标路径
3. 创建目录结构：`mkdir -p <target>/.claude/skills/<skill-name>`
4. 生成 CLAUDE.local.md（基于模板）
5. 生成首个 SKILL.md（精简版骨架）
6. 输出完成摘要

**核心规则**：
- 规则1：不覆盖已有文件（必须询问用户）
- 规则2：技术栈适配（Unity/C#, Node.js, Python 等）
- 规则3：SKILL.md 保持最小集
- 规则4：Sync 规则不可删减（9 种变更类型必须完整）

**内置资源**：
- `templates/CLAUDE.local.template.md`
- `templates/SKILL.template.md`
- `templates/examples/` (unity-csharp, nodejs, python)
- `guides/` (快速入门、功能识别、Skill 生命周期)
- `scripts/` (生成 Skill 索引、健康报告)

---

### 6. self-review - 自我审查执行框架

**功能**：执行带独立 AI 审查(Codex)的任务，自我修正，迭代改进直到满足质量标准

**六阶段流程**：
1. **Task Confirmation** — 创建任务规格 `00-task-spec.md`
2. **Task Execution** — 在 `evidence/` 目录生成证据文件
3. **Independent Review** — Codex 通过 `reviews/round-{N}/` 审查
4. **Review Analysis** — 分类问题，判定结果
5. **Improvement** — 修复问题，如需要返回阶段2
6. **Delivery** — 输出 `final-report.md`

**判定规则**：
| 判定 | 条件 |
|------|------|
| **PASS** | 无阻塞项，无严重问题，≤5个主要问题 |
| **NEEDS_IMPROVEMENT** | 1-2个严重问题 或 >5个主要问题 |
| **REJECTED** | >2个严重问题 或 任何阻塞项 |

**触发关键词**："自我监督"、"迭代审查"、"自我修正"、"质量循环"、"自动改进"、"独立审查"

---

### 7. skill-generator - Skill 生成器

**功能**：生成完整的 Skill（含 TDD 测试）

---

### 8. websearch - Web 搜索整合

**功能**：整合多后端 Web 搜索：YDC > Exa > Tavily > Jina，自动降级

**执行流程**：

**Phase 0: 预检**
- 每次搜索前读取 `~/.claude.json` 检查 MCP 配置状态
- 对未安装的 MCP 检查环境变量 Key
- Key 存在则自动安装，缺失则跳过并提示用户

**Phase 1: 解析搜索意图**
- 提取关键词
- 识别搜索类型（通用/代码/深度研究/页面读取）

**Phase 2: 执行搜索（降级策略）**
- 按优先级依次尝试：YDC → Exa → Tavily → Jina
- 成功即停止，全部失败则降级使用 WebFetch

**Phase 3: 格式化输出**
- 统一格式输出，标注来源

**MCP 优先级与参数**：
| 优先级 | MCP | 工具调用 | 关键参数 |
|--------|-----|----------|----------|
| 1 | YDC | `mcp__you-search__you-search` | query, count, freshness |
| 2 | Exa | `mcp__exa__web_search_exa` | query, numResults |
| 3 | Tavily | `mcp__tavily__tavily_search` | query, max_results |
| 4 | Jina | `mcp__jina__jina_search` | query, count |

**补充能力**：
- 深度页面读取：`jina_reader` > `tavily_extract` > `you-contents`
- 深度研究：`tavily_research`
- 代码搜索：`get_code_context_exa`
- 站点爬取：`tavily_map` / `tavily_crawl`
- 企业调研：`company_research_exa`

**核心约束**：
1. 预检必须在每次搜索前完成
2. 严禁使用 Claude 内置的 `WebSearch` 工具
3. 每次搜索只使用一个后端
4. 全部 MCP 不可用时降级使用 WebFetch

---

### 9. workflow-specify - 工作流规格定义

**功能**：将模糊的用户需求转换为结构化的 AI 可执行规格文档

**五阶段执行流程**：CAPTURE → CLARIFY → STRUCTURE → REVIEW → VALIDATE

| 阶段 | 说明 |
|------|------|
| **CAPTURE** | 读取项目上下文，扫描代码库结构，识别干系人，提取原始需求 |
| **CLARIFY** | 检测模糊词汇，用问题解决歧义，记录确认的假设 |
| **STRUCTURE** | 根据模式选择模板，用 As-a/I-want/So-that 格式写用户故事 |
| **REVIEW** | 通过 Codex 或独立 Agent 执行审查 |
| **VALIDATE** | 运行完整性检查，请求用户批准 |

**三种模式**：
- **Mini**：概述、用户故事、范围外、检查清单（用于 bug 修复）
- **Standard（默认）**：包含 1-7 节和 9
- **Full**：包含所有章节和附录（大型功能）

**责任边界**：定义用户需要什么（WHAT），不涉及如何实现（HOW）

---

### 10. workflow-plan - 技术规划

**功能**：将 `spec.md` 转换为 `plan.md`，包含架构设计、技术选型、风险评估、ADR

**六阶段迭代工作流**：
| 阶段 | 动作 | 输出 |
|------|------|------|
| ANALYZE | 读取 spec.md，识别研究主题 | `analyze/analysis.md` |
| RESEARCH | 每个主题独立技术研究 | `research/{topic}/research.md` |
| ANALYSIS-REVIEW | 评估研究充分性 | CONTINUE 或 PASS |
| PLAN | 架构设计，技术选型 | `plan.md`(草稿) |
| REVIEW | 验证设计(Codex 或 Agent) | `reviews/round-{N}/review-response.md` |
| VALIDATE | 用户批准 | `plan.md`(status: approved) |

**研究要求**：
- 每个主题至少需要 2 个证据文件
- 结论必须引用证据，格式：`[E-1][E-2]`
- 证据必须包含搜索关键词、URL、关键发现、来源可信度评级(A-D)

**责任边界**：
- **在范围内**：系统架构和模块设计、技术选型和技术理由、技术风险评估、ADR 文档、安全和可观测性策略
- **范围外**（由 `/workflow-task` 处理）：任务分解和实现步骤、详细测试用例和验收标准、部署/迁移/回滚程序、性能测试计划、项目时间线和资源分配

---

### 11. workflow-task - 任务分解

**功能**：将技术计划转换为可执行的任务列表

**六阶段流程**：PARSE → DECOMPOSE → ANALYZE → REVIEW → REFINE → VALIDATE

**核心功能**：
- 将 `plan.md` 分解为 `tasks.md`
- 支持递归子模块规划
- 任务粒度检测
- 依赖分析
- 断点恢复

**关键要求**：
- Plan.md 必须状态为 approved 才能处理
- 用户选择审查方式（Codex 或独立 Agent）
- 任务粒度标准：30分钟-8小时
- 依赖必须形成有效 DAG（无循环）
- 优先级：P0(阻塞) > P1(核心) > P2(辅助) > P3(优化)

**任务标记**：
| 标记 | 含义 |
|------|------|
| `[T]` | TDD - 先写测试 |
| `[P]` | 可并行 |
| `[R]` | 需要审查 |

---

### 12. workflow-implement - 代码实现

**功能**：基于任务列表执行代码实现

**工作流**：LOAD → PLAN → EXECUTE → REVIEW → COMMIT → REPORT

**核心特性**：
- **任务 DAG 构建**：解析 tasks.md 构建有向无环图
- **拓扑排序**：确定执行顺序，支持批处理并行化
- **TDD 支持**：标记 `[T]` 的任务遵循测试驱动开发
- **并行执行**：标记 `[P]` 的任务通过 Task 工具并发运行
- **审计追踪**：记录所有步骤到 `ledger.jsonl`
- **审查选项**：Codex 或独立 Agent 审查
- **原子提交**：每个任务独立提交

---

### 13. workflow-review - 代码审查

**功能**：独立审查代码实现质量

**六阶段流程**：COLLECT → ANALYZE → REVIEW → VERDICT → IMPROVE → REPORT

| 阶段 | 名称 | 输出 |
|------|------|------|
| 1 | COLLECT | evidence/ |
| 2 | ANALYZE | analysis/dimension-report.md |
| 3 | REVIEW | reviews/round-{N}/review-response.md |
| 4 | VERDICT | PASS/NEEDS_FIX/REJECTED |
| 5 | IMPROVE | workflow-implement 触发 |
| 6 | REPORT | final-report.md |

**五维度检查**：
| 维度 | 标准 |
|------|------|
| 代码质量 | 圈复杂度 ≤15 |
| 测试覆盖 | 100%通过，≥80%覆盖 |
| 规范符合 | 100%验收标准 |
| 安全检查 | 无 BLOCKER |
| 性能检查 | 无 MAJOR 问题 |

**判定规则**：
- **PASS**：blocker=0, critical=0, major≤5, tests_passed=true
- **NEEDS_FIX**：blocker=0, (critical∈[1,2] 或 major>5), round<3
- **REJECTED**：blocker>0 或 critical>2 或 tests_failed 或 round≥3

---

### 14. xhs-workflow - 小红书内容创作

**功能**：小红书内容创作全流程自动化，从热点调研到一键发布

**六阶段工作流**：
1. **RESEARCH** — 趋势研究，使用 `search_feeds` 和 `get_feed_detail`
2. **TOPIC** — 选题策划，提供 3-5 个提案供用户选择
3. **COPY** — 标题和正文撰写（标题≤20字，正文≤1000字）
4. **VISUAL** — 配图生成，使用 `fal-ai` 工具
5. **REVIEW** — 质量审核（平台限制+百分制评分）
6. **PUBLISH** — 最终发布，通过 `publish_content` MCP 工具

**平台限制**：
| 限制 | 规则 |
|------|------|
| 标题 | ≤20字符 |
| 正文 | ≤1000字符 |
| 图片 | 必须是本地绝对路径 |
| 标签 | 在 tags 数组参数中，不在正文中 |

**必需的 MCP 服务**：
- **xiaohongshu-mcp** at `http://localhost:18060`（用于搜索和发布）
- **fal-ai**（用于图片生成）

**触发关键词**："帮我创作小红书"、"写一篇小红书"、"发布小红书"、"/创作"、"/热点"、"/写文"、"xhs"、"小红书"

---

## 共同模式和架构

### 1. 统一的工作流模式

这些 Skills 展现出一个清晰的**分层工作流架构**：

```
用户需求 → Specify(需求规格) → Plan(技术规划) → Task(任务分解) → Implement(代码实现) → Review(代码审查)
```

每个阶段都有明确的：
- **输入**：前一阶段的输出文件
- **处理**：特定的分析/转换逻辑
- **输出**：下一阶段的输入
- **状态管理**：`.state.yaml` 文件追踪进度

### 2. 审查-改进循环

多个 Skills 采用**独立审查 + 迭代改进**模式：
- `self-review`：任务执行后独立审查，循环改进
- `workflow-review`：六阶段审查流程，可触发重新实现
- `workflow-specify`：REVIEW 阶段后可返回改进
- `workflow-plan`：研究不充分可返回继续研究

### 3. 质量判定标准

Skills 定义了清晰的**判定规则**：

| 判定 | 条件 |
|------|------|
| PASS | 满足所有质量标准 |
| NEEDS_FIX/IMPROVEMENT | 存在可修复的问题 |
| REJECTED | 存在严重阻塞问题 |

### 4. 目录结构标准化

所有 workflow-related skills 遵循统一的目录结构：

```
.workflow/{feature}/
├── specify/
│   ├── capture/
│   ├── clarify/
│   ├── spec.md
│   └── reviews/
├── plan/
│   ├── analyze/
│   ├── research/
│   ├── plan.md
│   └── reviews/
├── task/
│   ├── tasks.md
│   └── reviews/
├── implement/
│   ├── audit/
│   ├── commits/
│   ├── reviews/
│   └── logs/
├── review/
│   ├── evidence/
│   ├── analysis/
│   ├── reviews/
│   └── improvements/
└── .state.yaml
```

### 5. MCP 服务集成模式

- **websearch**：多 MCP 降级策略（YDC → Exa → Tavily → Jina → WebFetch）
- **xhs-workflow**：依赖 xiaohongshu-mcp 和 fal-ai 两个服务
- **openclaw-devops**：依赖 CLI 工具和双配置文件

### 6. 任务标记系统

统一的标记语法：
- `[T]` - TDD（先写测试）
- `[P]` - 可并行化
- `[R]` - 需要审查

### 7. 研究驱动决策

`workflow-plan` 强调**证据驱动的技术决策**：
- 每个主题至少 2 个证据
- 结论必须引用证据
- 来源可信度评级(A-D)

### 8. 触发关键词机制

多个 Skills 使用**自然语言触发**：
- `self-review`："自我监督"、"迭代审查"、"质量循环"
- `xhs-workflow`："帮我创作小红书"、"发布小红书"
- `workflow-specify`："需求"、"规格"、"用户故事"

---

## 安装和使用

### 安装方式

Skills 位于 `skills/` 目录下，需要安装到项目的 `.claude/skills/` 目录中。

推荐使用 `sdd-init` skill 进行初始化：
```bash
# 使用 sdd-init 初始化 SDD 体系
```

### 前置依赖

- Claude Code
- 根据具体 skill 需要的 MCP 服务或 CLI 工具

---

## 总结

这 14 个 Skills 构成了一个**完整的 AI 驱动开发工作流系统**：

| 类别 | Skills |
|------|--------|
| **开发工作流** | workflow-specify, workflow-plan, workflow-task, workflow-implement, workflow-review |
| **质量保证** | self-review |
| **搜索能力** | websearch, research |
| **代码执行** | codex, copilot |
| **系统管理** | openclaw-devops |
| **Skill 开发** | sdd-init, skill-generator |
| **内容创作** | xhs-workflow |

### 核心价值

1. **结构化**：每个阶段都有明确的输入/输出和判定标准
2. **可审计**：完整的审计追踪和证据文件
3. **可迭代**：支持多轮审查和改进
4. **可扩展**：以 Skill 为单位的模块化设计

### 适用场景

- 软件开发团队需要规范化的 AI 协作流程
- 需要独立审查和质量控制的项目
- 自动化内容创作（小红书等平台）
- 系统管理和运维自动化

---

*本报告由 Claude Code 自动生成*
