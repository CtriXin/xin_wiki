---
name: knowledge-wiki
description: 面向个人技术知识库（VitePress）的协作技能，支持记录、索引更新、构建预览与死链检查。
---

# Knowledge Wiki Skill

## 项目路径
```
/Users/xin/knowledge-wiki-web/      # 统一后的知识库项目（包含内容与展示）
```

## 项目概述
个人技术知识库系统，采用 VitePress 驱动的单仓库架构：
- **内容与展示合一**: Markdown 源文件存放在 `docs/` 目录下，直接由 VitePress 渲染。
- **现代视觉风格**: 采用 Ethereal Tech (Cyber-Noir) 主题，具备深色模式、代码高亮优化及动态交互效果。

## 目录结构

```
knowledge-wiki-web/                 # 📁 仓库根目录
├── docs/                           # 📁 核心内容与配置
│   ├── .vitepress/                # ⚙️ VitePress 配置 (主题、Logo、路由)
│   ├── public/                    # 🖼️ 静态资源 (logo.svg)
│   ├── templates/                 # 📄 内容模板 (script, bugfix, iteration)
│   ├── iterations/                # 🔄 系统迭代记录
│   ├── scripts/                   # 📜 脚本工具记录
│   ├── features/                  # ⚡ 功能记录
│   ├── bugfixes/                  # 🐛 Bug 修复记录
│   ├── index.md                   # 🏠 网站首页
│   ├── changelog.md               # 📅 变更总日志
│   └── .claude-skill.md           # 📍 本文件 (AI 协作指南)
├── package.json                   # 📦 项目依赖
└── .gitignore                     # 🙈 Git 忽略配置
```

## 快速查询指令

### 1. 查看最近更新 (Changelog)
```bash
head -n 50 docs/changelog.md
```

### 2. 查看所有文档列表
```bash
find docs -name "*.md" -type f | grep -v node_modules
```

### 3. 按标签查找内容
```bash
grep -r "tags:" docs --include="*.md" | head -20
```

## 核心文件速览

| 文件 | 作用 |
|------|------|
| `docs/changelog.md` | 按时间倒序的所有变更记录 |
| `docs/iterations/index.md` | 系统架构演进索引 |
| `docs/templates/` | 创建新文档的标准化模板 |
| `docs/.vitepress/config.mjs` | 导航栏、侧边栏及插件配置 |

## 协作规范

### 1. 命名与格式规范
- **语义化文件名**: 文件名**严禁**携带日期前缀。应使用简洁的英文/拼音描述，单词间用连字符分隔（如 `wiki-system.md`）。
- **元信息强制**: 必须在 Markdown 顶部包含 YAML Frontmatter，日期信息记录在 `date` 字段中。
- **目录归位**: 
    - 脚本存放在 `docs/scripts/`
    - 系统/架构迭代存放在 `docs/iterations/`
    - 新功能调研存放在 `docs/features/`
    - Bug 记录存放在 `docs/bugfixes/`

### 2. 创建新文档流程
1. **复制模板**: 从 `docs/templates/` 选择对应类型的模板。
2. **填写元信息**: 必须包含 `title`, `date`, `type`, `tags`, `status`。
3. **更新日志**: 在 `docs/changelog.md` 顶部添加新条目，并包含**创建日期**与**编辑日期**。
4. **侧边栏同步**: 如果是新分类或重要文档，需更新 `docs/.vitepress/config.mjs` 中的 `sidebar`。
5. **本地验证 (关键)**: 见下方“发布前置检查”。

### 3. 发布前置检查 (Pre-Push Checks)
为了避免 GitHub Actions 部署失败，**任何修改**在提交 Git 之前**必须**执行：
1. **本地构建**: 运行 `npm run build`。
2. **死链检查**: 仔细观察构建输出，确保没有 `(!) Found dead link` 警告。
3. **Skill 同步**: 运行 `npm run sync-skills` 确保全局配置同步。

### 4. 链接规范
- 内部引用请使用相对路径。
- 严禁引用 `docs` 目录外的文件（如 `../../README.md`），应改为引用 `index.md`。

## AI 调用词汇（快捷指令）

| 调用词汇 | 动作 | 示例 |
|----------|------|------|
| **"记录到 wiki"** | 整理当前会话，按模板存入 `docs/` | "记录刚才的 UI 优化到 wiki" |
| **"更新索引"** | 自动更新 `changelog.md` 和对应分类的 `index.md` | "新写了脚本，帮我更新索引" |
| **"检查并发布"** | 执行构建检查、同步 Skill 并提交 Push | "检查无误后帮我发布到 GitHub" |

---
**项目创建时间**: 2026-02-04
**最后更新**: 2026-02-04 19:10 (强化发布检查机制)
**维护者**: xin / Gemini