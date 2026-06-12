import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const ThemeContext = createContext()

const THEME_MODES = ['light', 'dark', 'system', 'sunrise-sunset']

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function isDaytime() {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18
}

function resolveTheme(mode) {
  if (mode === 'system') return getSystemTheme()
  if (mode === 'sunrise-sunset') return isDaytime() ? 'light' : 'dark'
  return mode // 'light' or 'dark'
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('nav-theme-mode')
    if (saved && THEME_MODES.includes(saved)) return saved
    return 'system'
  })

  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(themeMode))

  // 应用主题到 DOM
  useEffect(() => {
    const resolved = resolveTheme(themeMode)
    setResolvedTheme(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
    localStorage.setItem('nav-theme-mode', themeMode)
  }, [themeMode])

  // 监听系统主题变化
  useEffect(() => {
    if (themeMode !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const resolved = getSystemTheme()
      setResolvedTheme(resolved)
      document.documentElement.setAttribute('data-theme', resolved)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [themeMode])

  // 日出日落模式：每分钟检查一次
  useEffect(() => {
    if (themeMode !== 'sunrise-sunset') return
    const resolved = isDaytime() ? 'light' : 'dark'
    setResolvedTheme(resolved)
    document.documentElement.setAttribute('data-theme', resolved)

    const timer = setInterval(() => {
      const r = isDaytime() ? 'light' : 'dark'
      setResolvedTheme(r)
      document.documentElement.setAttribute('data-theme', r)
    }, 60000)
    return () => clearInterval(timer)
  }, [themeMode])

  const setTheme = useCallback((mode) => {
    setThemeMode(mode)
  }, [])

  // 兼容旧代码的 toggleTheme
  const toggleTheme = useCallback(() => {
    setThemeMode(prev => {
      const resolved = resolveTheme(prev)
      return resolved === 'light' ? 'dark' : 'light'
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, themeMode, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export { THEME_MODES }
