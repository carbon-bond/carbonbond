export default {
  title: '碳鍵',
  description: '次世代筆戰平台',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' }],
  ],
  themeConfig: {
	  logo: '/icon.svg',
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/carbon-bond/carbonbond',
      }
    ],
    nav: [
      { text: '主站', link: 'https://carbonbond.cc' }
    ],
	  sidebar: [
		  {
        text: '基礎',
        items: [
          { text: '碳鍵是什麼？', link: '/基礎/碳鍵是什麼.html' },
          { text: '安裝', link: '/基礎/安裝.html' },
          { text: '電郵設定', link: '/基礎/電郵設定.html' },
          { text: '設定檔一覽', link: '/基礎/設定檔一覽.html' }
        ]
      },
		  {
        text: '進階',
        items: [
          { text: '架構', link: '/進階/架構.html' },
          { text: 'HTTPS', link: '/進階/HTTPS.html' }
        ]
      },
		  {
        text: '開發',
        items: [
          { text: '環境設定', link: '/開發/環境設定.html' },
          { text: '本地編譯、執行', link: '/開發/本地運行.html' }
        ]
      },
		  {
        text: '早期文件',
        items: [
          { text: '起源', link: '/早期文件/起源.html' },
          { text: '快速開始', link: '/早期文件/快速開始.html' },
          { text: 'docker啓動', link: '/早期文件/docker啓動.html' },
          { text: 'rust 設置', link: '/早期文件/rust設置.html' },
          { text: '前端設置', link: '/早期文件/前端設置.html' },
          { text: '資料庫設置', link: '/早期文件/資料庫設置.html' },
        ]
      }
	  ]
  },
  ignoreDeadLinks: 'localhostLinks',
  markdown: {
    config: (md) => {
      md.use(require('markdown-it-footnote'));
    }
  }
}
