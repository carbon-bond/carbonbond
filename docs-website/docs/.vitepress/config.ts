export default {
  title: '碳鍵',
  description: '戰爭，一觸即發',
  themeConfig: {
	  logo: '/icon.svg',
    nav: [
      { text: '主站', link: 'https://carbonbond.cc' }
    ],
	  sidebar: [
		  {
        text: '介紹',
        items: [
          { text: '碳鍵是什麼？', link: '/概述/碳鍵是什麼.html' }
        ]
      },
		  {
        text: '開發',
        items: [
          { text: '碳鍵是什麼？', link: '/概述/碳鍵是什麼.html' }
        ]
      },
		  {
        text: '早期文件',
        items: [
          { text: '起源', link: '/起源.html' },
          { text: '快速開始', link: '/快速開始.html' },
          { text: 'docker啓動', link: '/docker啓動.html' },
          { text: 'rust 設置', link: '/rust設置.html' },
          { text: '前端設置', link: '/前端設置.html' },
          { text: '資料庫設置', link: '/資料庫設置.html' },
        ]
      }
	  ]
  },
  ignoreDeadLinks: 'localhostLinks'
}
