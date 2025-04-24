import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "One Hub 文档",
  description: "One Hub 文档",
  head: [['link', { rel: 'icon', href: 'https://raw.githubusercontent.com/MartialBE/one-api/main/web/src/assets/images/logo.svg' }]],
  lastUpdated: true,
  markdown: {
    math: true,
    image: {
      lazyLoading: true
    }
  },
  themeConfig: {
    search: {
      provider: 'local'
    },
    logo: { light: 'https://raw.githubusercontent.com/MartialBE/one-api/main/web/src/assets/images/logo.svg', dark: 'https://github.com/MartialBE/one-api/assets/42402987/c4125d1a-5577-446d-ba15-2a71c52140c1', alt: 'One Hub Logo' },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '文档', link: '/deployment/index' }
    ],

    sidebar: [
      {
        text: '部署',
        items: [
          { text: '部署说明', link: '/deployment/index' },
          { text: '环境变量', link: '/deployment/env' },
          { text: '图床配置', link: '/deployment/storage' },
          { text: '自动升级', link: '/deployment/update' },
          { text: '消息通知', link: '/deployment/notify' },
          { text: '命令行参数', link: '/deployment/cli' },
          { text: '扩展价格', link: '/deployment/ExtraRatios' },
        ]
      },
      {
        text: '使用',
        items: [
          { text: '使用说明', link: '/use/index' },
          { text: '添加 VertexAI', link: '/use/VertexAI' },
          { text: 'Rerank 接口', link: '/use/Rerank' },
          { text: '推理设置', link: '/use/reasoning' },
          { text: '价格更新', link: '/use/prices_update' },
          { text: '特殊调用', link: '/use/special' },
          { text: '常见问题', link: '/use/FAQ' }

        ]
      },
      {
        text: '开发',
        items: [
          { text: '开发说明', link: '/dev/index' }
        ]
      },
      {
        text: '其他',
        items: [
          { text: '更新日志', link: 'https://github.com/MartialBE/one-api/releases' },
          { text: '请我喝杯咖啡', link: 'https://github.com/MartialBE/one-hub/wiki/Coffee' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/MartialBE/one-hub' }
    ]
  }
})
