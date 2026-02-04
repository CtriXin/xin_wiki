# Knowledge Wiki Web

> 基于 VitePress 的个人知识库网站
> 比维基百科更好看、更现代、支持搜索和暗黑模式

## 效果预览

- 🎨 **现代化设计** - 简洁、专业、响应式
- 🌙 **暗黑模式** - 自动/手动切换
- 🔍 **全文搜索** - 本地搜索，无需后端
- 📱 **移动端适配** - 完美支持手机访问
- ⚡ **极速加载** - 静态生成，CDN 友好
- 📝 **Markdown 原生** - 直接复用现有内容

## 快速开始

```bash
# 1. 进入项目目录
cd knowledge-wiki-web

# 2. 安装依赖
npm install

# 3. 本地预览
npm run dev

# 4. 构建（生成静态网站）
npm run build
```

## 部署方式

1. **GitHub Pages**（免费）- 推送到 GitHub 自动部署
2. **Vercel/Netlify**（免费）- 连接 GitHub 自动构建
3. **自有服务器** - 上传 dist 文件夹即可

## 目录结构

```
knowledge-wiki-web/
├── docs/                    # 文档内容（从这里开始写）
│   ├── index.md            # 首页
│   ├── changelog.md        # 变更日志
│   ├── scripts/            # 脚本文档
│   └── ...
├── .vitepress/             # 配置文件
│   ├── config.js           # 站点配置
│   └── theme/              # 自定义主题
├── package.json
└── README.md
```

## 与现有知识库的关联

- `docs/` 目录可以直接软链接或复制 `knowledge-wiki/` 的内容
- 保持 Markdown 源文件不变
- 网站只是更漂亮的展示层
