import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Xin Knowledge',
  description: '个人技术知识库 - 记录迭代、功能、脚本与修复',

  // 主题配置
  themeConfig: {
    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '变更日志', link: '/changelog' },
      { text: '脚本', link: '/scripts/' },
      { text: '功能', link: '/features/' },
      { text: 'Bug修复', link: '/bugfixes/' },
    ],

    // 侧边栏
    sidebar: {
      '/scripts/': [
        {
          text: '脚本',
          items: [
            { text: '概览', link: '/scripts/' },
            { text: 'Clash Verge 智能分流', link: '/scripts/clash-verge-proxy-rules' },
          ]
        }
      ],
      '/features/': [
        {
          text: '功能',
          items: [
            { text: '概览', link: '/features/' },
          ]
        }
      ],
      '/bugfixes/': [
        {
          text: 'Bug修复',
          items: [
            { text: '概览', link: '/bugfixes/' },
          ]
        }
      ]
    },

    // 页脚
    footer: {
      message: '用 ❤️ 记录技术成长',
      copyright: 'Copyright © 2026'
    },

    // 搜索
    search: {
      provider: 'local'
    },

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourname' }
    ],

    // 编辑链接
    editLink: {
      pattern: 'https://github.com/yourname/knowledge-wiki/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    // 最后更新时间
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    },

    // 大纲显示层级
    outline: {
      level: 'deep',
      label: '页面导航'
    },

    // 文档翻页
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    // 返回顶部
    returnToTopLabel: '返回顶部',

    // 菜单标签
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题'
  },

  // 生成配置
  base: '/',
  cleanUrls: true,

  // Markdown 配置
  markdown: {
    lineNumbers: true,
    config: (md) => {
      // 自定义 Markdown 插件
    }
  },

  // 头部配置
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#5f67ee' }],
  ]
})
