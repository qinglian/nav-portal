// 起始页设置数据管理（按页面隔离）

export const DEFAULT_SETTINGS = {
  searchBox: {
    visible: true,
  },
  timeWidget: {
    visible: true,
  },
  pageSidebar: {
    visible: true,
  },
  freeLayout: {
    enabled: false,
  },
}

export function getSettings(pageId = 'default') {
  const key = `nav-startpage-settings-${pageId}`
  const saved = localStorage.getItem(key)
  if (!saved) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
  try { return { ...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), ...JSON.parse(saved) } } catch { return JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) }
}

export function saveSettings(pageId, settings) {
  const key = `nav-startpage-settings-${pageId}`
  localStorage.setItem(key, JSON.stringify(settings))
}

export function updateSetting(pageId, category, key, value) {
  const settings = getSettings(pageId)
  if (!settings[category]) settings[category] = {}
  settings[category][key] = value
  saveSettings(pageId, settings)
  return settings
}
