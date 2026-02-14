import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Xin Knowledge',
  description: '个人技术知识库 - 记录迭代、功能、脚本与修复',

  // 主题配置
  themeConfig: {
    // 导航栏 - 重排顺序，移除模板
    nav: [
      { text: '首页', link: '/' },
      { text: '🎮 游戏', link: '/features/game/' },
      { text: '脚本', link: '/scripts/' },
      { text: '功能', link: '/features/' },
      { text: '迭代', link: '/iterations/' },
      { text: '变更日志', link: '/changelog' },
    ],

    // 侧边栏 - 移除模板
    sidebar: {
      '/iterations/': [
        {
          text: '系统迭代',
          items: [
            { text: '概览', link: '/iterations/' },
            { text: '知识库方案对比', link: '/iterations/wiki-solution-comparison' },
            { text: '知识库系统搭建', link: '/iterations/knowledge-wiki-system' },
            { text: '现代化与架构合并', link: '/iterations/wiki-modernization-and-merge' },
            { text: '搜索增强与 Skill 同步', link: '/iterations/search-and-automation' },
            { text: '自动化部署与外网访问', link: '/iterations/deployment-and-access' },
            { text: 'Skill Frontmatter 修复', link: '/iterations/skill-frontmatter-fix' },
          ]
        }
      ],
      '/scripts/': [
        {
          text: '脚本工具',
          items: [
            { text: '概览', link: '/scripts/' },
            { text: '301 重定向管理', link: '/scripts/301-redirect-management' },
            { text: 'Clash分流配置+命令行代理', link: '/scripts/clash-verge-proxy-rules' },
            { text: 'deploy & lookup 封装', link: '/scripts/deploy-lookup-wrapper' },
          ]
        }
      ],
      '/features/': [
        {
          text: '功能开发',
          items: [
            { text: '概览', link: '/features/' },
          ]
        },
        {
          text: '🎮 数学飞机大战',
          collapsed: false,
          items: [
            { text: '游戏介绍', link: '/features/game/' },
            { text: '开始游玩 ↗', link: '/game/index.html' },
          ]
        },
        {
          text: '域名配置工具',
          collapsed: true,
          items: [
            { text: '工具概览', link: '/features/domain-tool/' },
            { text: '架构与原理', link: '/features/domain-tool/architecture' },
            { text: 'Excel 规范', link: '/features/domain-tool/data-spec' },
            { text: '渲染系统', link: '/features/domain-tool/rendering' },
          ]
        }
      ],
      '/bugfixes/': [
        {
          text: '问题修复',
          items: [
            { text: '概览', link: '/bugfixes/' },
          ]
        }
      ]
    },

    footer: {
      message: '用 ❤️ 记录技术成长',
      copyright: 'Copyright © 2026'
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
          }
        }
      }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/CtriXin/xin_wiki' }
    ],

    outline: { level: 'deep', label: '页面导航' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题'
  },

  base: '/xin_wiki/',
  cleanUrls: true,

  markdown: {
    lineNumbers: true,
    theme: 'one-dark-pro'
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3a86ff' }],
  ]
})
