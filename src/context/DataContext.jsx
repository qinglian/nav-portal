import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const DataContext = createContext()

const DEFAULT_DATA = {
  categories: [
    {
      id: 'ai-tools',
      name: 'AI 工具',
      icon: 'Sparkles',
      sites: [
        { id: '1', name: 'ChatGPT', url: 'https://chat.openai.com', description: 'OpenAI 对话 AI' },
        { id: '2', name: 'Claude', url: 'https://claude.ai', description: 'Anthropic AI 助手' },
        { id: '3', name: 'Midjourney', url: 'https://midjourney.com', description: 'AI 图像生成' },
        { id: '4', name: 'Stable Diffusion', url: 'https://stability.ai', description: '开源图像生成' },
        { id: '5', name: 'Perplexity', url: 'https://perplexity.ai', description: 'AI 搜索引擎' },
        { id: '6', name: 'Gemini', url: 'https://gemini.google.com', description: 'Google AI' },
      ]
    },
    {
      id: 'dev-tools',
      name: '开发工具',
      icon: 'Code',
      sites: [
        { id: '7', name: 'GitHub', url: 'https://github.com', description: '代码托管平台' },
        { id: '8', name: 'Stack Overflow', url: 'https://stackoverflow.com', description: '开发者问答社区' },
        { id: '9', name: 'CodePen', url: 'https://codepen.io', description: '前端代码演示' },
        { id: '10', name: 'Vercel', url: 'https://vercel.com', description: '前端部署平台' },
        { id: '11', name: 'npm', url: 'https://npmjs.com', description: 'Node 包管理' },
        { id: '12', name: 'MDN', url: 'https://developer.mozilla.org', description: 'Web 开发文档' },
      ]
    },
    {
      id: 'design',
      name: '设计资源',
      icon: 'Palette',
      sites: [
        { id: '13', name: 'Dribbble', url: 'https://dribbble.com', description: '设计师作品展示' },
        { id: '14', name: 'Behance', url: 'https://behance.net', description: '创意作品集' },
        { id: '15', name: 'Figma', url: 'https://figma.com', description: '协作设计工具' },
        { id: '16', name: 'Unsplash', url: 'https://unsplash.com', description: '免费高清图片' },
        { id: '17', name: 'Pexels', url: 'https://pexels.com', description: '免费图片视频' },
        { id: '18', name: 'Canva', url: 'https://canva.com', description: '在线设计工具' },
      ]
    },
    {
      id: 'media',
      name: '影音娱乐',
      icon: 'Play',
      sites: [
        { id: '19', name: 'Bilibili', url: 'https://bilibili.com', description: '弹幕视频网站' },
        { id: '20', name: 'YouTube', url: 'https://youtube.com', description: '全球视频平台' },
        { id: '21', name: 'Netflix', url: 'https://netflix.com', description: '流媒体平台' },
        { id: '22', name: 'Spotify', url: 'https://spotify.com', description: '音乐流媒体' },
        { id: '23', name: 'SoundCloud', url: 'https://soundcloud.com', description: '音乐分享平台' },
        { id: '24', name: 'Twitch', url: 'https://twitch.tv', description: '游戏直播平台' },
      ]
    },
    {
      id: 'social',
      name: '社交媒体',
      icon: 'Users',
      sites: [
        { id: '25', name: 'Twitter / X', url: 'https://twitter.com', description: '社交媒体平台' },
        { id: '26', name: '微博', url: 'https://weibo.com', description: '中文社交平台' },
        { id: '27', name: '知乎', url: 'https://zhihu.com', description: '问答社区' },
        { id: '28', name: '小红书', url: 'https://xiaohongshu.com', description: '生活方式社区' },
        { id: '29', name: 'Reddit', url: 'https://reddit.com', description: '社区论坛' },
        { id: '30', name: 'Discord', url: 'https://discord.com', description: '社区聊天平台' },
      ]
    }
  ]
}

export function DataProvider({ children }) {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('nav-data')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return DEFAULT_DATA
      }
    }
    return DEFAULT_DATA
  })

  useEffect(() => {
    localStorage.setItem('nav-data', JSON.stringify(data))
  }, [data])

  const addCategory = useCallback((category) => {
    setData(prev => ({
      ...prev,
      categories: [...prev.categories, { ...category, sites: [] }]
    }))
  }, [])

  const updateCategory = useCallback((categoryId, updates) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId ? { ...cat, ...updates } : cat
      )
    }))
  }, [])

  const deleteCategory = useCallback((categoryId) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== categoryId)
    }))
  }, [])

  const addSite = useCallback((categoryId, site) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId
          ? { ...cat, sites: [...cat.sites, site] }
          : cat
      )
    }))
  }, [])

  const updateSite = useCallback((categoryId, siteId, updates) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              sites: cat.sites.map(site =>
                site.id === siteId ? { ...site, ...updates } : site
              )
            }
          : cat
      )
    }))
  }, [])

  const deleteSite = useCallback((categoryId, siteId) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId
          ? { ...cat, sites: cat.sites.filter(site => site.id !== siteId) }
          : cat
      )
    }))
  }, [])

  const resetData = useCallback(() => {
    setData(DEFAULT_DATA)
  }, [])

  return (
    <DataContext.Provider value={{
      data,
      addCategory,
      updateCategory,
      deleteCategory,
      addSite,
      updateSite,
      deleteSite,
      resetData
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}
