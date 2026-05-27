import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const DataContext = createContext()

const DEFAULT_DATA = {
  categories: [
    {
      id: 'ai-tools',
      name: 'AI 工具',
      tags: ['聊天对话', '图像生成', '视频生成', '代码助手', '搜索引擎'],
      sites: [
        { id: '1', name: 'ChatGPT', url: 'https://chat.openai.com', description: 'OpenAI 对话 AI', tag: '聊天对话' },
        { id: '2', name: 'Claude', url: 'https://claude.ai', description: 'Anthropic AI 助手', tag: '聊天对话' },
        { id: '3', name: 'Midjourney', url: 'https://midjourney.com', description: 'AI 图像生成', tag: '图像生成' },
        { id: '4', name: 'Stable Diffusion', url: 'https://stability.ai', description: '开源图像生成', tag: '图像生成' },
        { id: '5', name: 'Perplexity', url: 'https://perplexity.ai', description: 'AI 搜索引擎', tag: '搜索引擎' },
        { id: '6', name: 'Gemini', url: 'https://gemini.google.com', description: 'Google AI', tag: '聊天对话' },
        { id: '7', name: 'Runway', url: 'https://runwayml.com', description: 'AI 视频生成', tag: '视频生成' },
        { id: '8', name: 'GitHub Copilot', url: 'https://github.com/copilot', description: 'AI 代码助手', tag: '代码助手' },
      ]
    },
    {
      id: 'dev-tools',
      name: '开发工具',
      tags: ['代码托管', '学习社区', '部署平台', '包管理', '开发文档'],
      sites: [
        { id: '9', name: 'GitHub', url: 'https://github.com', description: '代码托管平台', tag: '代码托管' },
        { id: '10', name: 'Stack Overflow', url: 'https://stackoverflow.com', description: '开发者问答社区', tag: '学习社区' },
        { id: '11', name: 'CodePen', url: 'https://codepen.io', description: '前端代码演示', tag: '学习社区' },
        { id: '12', name: 'Vercel', url: 'https://vercel.com', description: '前端部署平台', tag: '部署平台' },
        { id: '13', name: 'npm', url: 'https://npmjs.com', description: 'Node 包管理', tag: '包管理' },
        { id: '14', name: 'MDN', url: 'https://developer.mozilla.org', description: 'Web 开发文档', tag: '开发文档' },
      ]
    },
    {
      id: 'design',
      name: '设计资源',
      tags: ['作品展示', '设计工具', '图片素材', '在线设计'],
      sites: [
        { id: '15', name: 'Dribbble', url: 'https://dribbble.com', description: '设计师作品展示', tag: '作品展示' },
        { id: '16', name: 'Behance', url: 'https://behance.net', description: '创意作品集', tag: '作品展示' },
        { id: '17', name: 'Figma', url: 'https://figma.com', description: '协作设计工具', tag: '设计工具' },
        { id: '18', name: 'Unsplash', url: 'https://unsplash.com', description: '免费高清图片', tag: '图片素材' },
        { id: '19', name: 'Pexels', url: 'https://pexels.com', description: '免费图片视频', tag: '图片素材' },
        { id: '20', name: 'Canva', url: 'https://canva.com', description: '在线设计工具', tag: '在线设计' },
      ]
    },
    {
      id: 'media',
      name: '影音娱乐',
      tags: ['视频网站', '音乐平台', '直播平台', '流媒体'],
      sites: [
        { id: '21', name: 'Bilibili', url: 'https://bilibili.com', description: '弹幕视频网站', tag: '视频网站' },
        { id: '22', name: 'YouTube', url: 'https://youtube.com', description: '全球视频平台', tag: '视频网站' },
        { id: '23', name: 'Netflix', url: 'https://netflix.com', description: '流媒体平台', tag: '流媒体' },
        { id: '24', name: 'Spotify', url: 'https://spotify.com', description: '音乐流媒体', tag: '音乐平台' },
        { id: '25', name: 'SoundCloud', url: 'https://soundcloud.com', description: '音乐分享平台', tag: '音乐平台' },
        { id: '26', name: 'Twitch', url: 'https://twitch.tv', description: '游戏直播平台', tag: '直播平台' },
      ]
    },
    {
      id: 'social',
      name: '社交媒体',
      tags: ['社交平台', '问答社区', '生活方式', '社区论坛'],
      sites: [
        { id: '27', name: 'Twitter / X', url: 'https://twitter.com', description: '社交媒体平台', tag: '社交平台' },
        { id: '28', name: '微博', url: 'https://weibo.com', description: '中文社交平台', tag: '社交平台' },
        { id: '29', name: '知乎', url: 'https://zhihu.com', description: '问答社区', tag: '问答社区' },
        { id: '30', name: '小红书', url: 'https://xiaohongshu.com', description: '生活方式社区', tag: '生活方式' },
        { id: '31', name: 'Reddit', url: 'https://reddit.com', description: '社区论坛', tag: '社区论坛' },
        { id: '32', name: 'Discord', url: 'https://discord.com', description: '社区聊天平台', tag: '社区论坛' },
      ]
    }
  ]
}

export function DataProvider({ children }) {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('nav-data-v2')
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
    localStorage.setItem('nav-data-v2', JSON.stringify(data))
  }, [data])

  const addCategory = useCallback((category) => {
    setData(prev => ({
      ...prev,
      categories: [...prev.categories, { ...category, sites: [], tags: [] }]
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

  // 排序网站
  const reorderSites = useCallback((categoryId, sites) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId ? { ...cat, sites } : cat
      )
    }))
  }, [])

  // 排序分类
  const reorderCategories = useCallback((categories) => {
    setData(prev => ({ ...prev, categories }))
  }, [])

  // 排序子分类标签
  const reorderTags = useCallback((categoryId, tags) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId ? { ...cat, tags } : cat
      )
    }))
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
      resetData,
      reorderSites,
      reorderCategories,
      reorderTags
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
