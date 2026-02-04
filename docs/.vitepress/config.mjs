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
      { text: '迭代', link: '/iterations/' },
      { text: '脚本', link: '/scripts/' },
      { text: '功能', link: '/features/' },
      { text: '模板', link: '/templates/' },
    ],

    // 侧边栏
    sidebar: {
      '/iterations/': [
        {
          text: '系统迭代',
          items: [
            { text: '概览', link: '/iterations/' },
            { text: '知识库方案对比', link: '/iterations/wiki-solution-comparison' },
            { text: '知识库系统搭建', link: '/iterations/knowledge-wiki-system' },
            { text: '现代化与架构合并', link: '/iterations/wiki-modernization-and-merge' },
          ]
        }
      ],
      '/scripts/': [
        {
          text: '脚本工具',
          items: [
            { text: '概览', link: '/scripts/' },
            { text: '301 重定向管理', link: '/scripts/301-redirect-management' },
            { text: 'Clash Verge 智能分流', link: '/scripts/clash-verge-proxy-rules' },
            { text: 'deploy & lookup 封装', link: '/scripts/deploy-lookup-wrapper' },
          ]
        }
      ],
      '/templates/': [
        {
          text: '内容模板',
          items: [
            { text: '脚本模板', link: '/templates/script' },
            { text: 'Bug修复模板', link: '/templates/bugfix' },
          ]
        }
      ],
      '/features/': [
        {
          text: '功能开发',
          items: [
            { text: '概览', link: '/features/' },
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

    // 页脚
    footer: {
      message: '用 ❤️ 记录技术成长',
      copyright: 'Copyright © 2026'
    },

    // 搜索
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
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
  base: '/xin_wiki/',
  cleanUrls: true,

  // Markdown 配置
  markdown: {
    lineNumbers: true,
    theme: 'one-dark-pro',
    config: (md) => {
      // 自定义 Markdown 插件
    }
  },

  // 头部配置
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3a86ff' }],
  ]
})
