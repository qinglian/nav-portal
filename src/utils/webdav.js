// 通用 WebDAV 客户端（支持自定义服务器）

const BACKUP_DIR = '/nav-portal-backup'
const BACKUP_FILE = 'nav-data.json'

// 预设服务器
export const WEBDAV_PRESETS = [
  {
    id: 'jianguoyun',
    name: '坚果云',
    host: 'https://dav.jianguoyun.com/dav',
    helpUrl: 'https://www.jianguoyun.com',
    helpText: '坚果云官网 → 账户信息 → 安全选项 → 添加应用密码'
  },
  {
    id: 'custom',
    name: '自定义 WebDAV',
    host: '',
    helpUrl: '',
    helpText: '填写您的 WebDAV 服务器地址、账号和密码'
  }
]

class WebDAVClient {
  constructor(host, username, password) {
    this.host = host.replace(/\/+$/, '') // 去掉末尾斜杠
    this.username = username
    this.password = password
    this.baseUrl = this.host
  }

  // 基础请求
  async request(method, path, body = null, headers = {}) {
    const url = `${this.baseUrl}${path}`
    const auth = btoa(`${this.username}:${this.password}`)
    
    const options = {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        ...headers
      }
    }
    
    if (body) {
      options.body = body
    }
    
    try {
      const response = await fetch(url, options)
      return response
    } catch (error) {
      throw new Error(`WebDAV请求失败: ${error.message}`)
    }
  }

  // 测试连接
  async testConnection() {
    try {
      const response = await this.request('PROPFIND', '/')
      return response.status >= 200 && response.status < 300
    } catch {
      return false
    }
  }

  // 创建目录
  async createDirectory(path) {
    const response = await this.request('MKCOL', path)
    return response.status === 201 || response.status === 405
  }

  // 上传文件
  async uploadFile(path, content) {
    const response = await this.request('PUT', path, content, {
      'Content-Type': 'application/json'
    })
    return response.status >= 200 && response.status < 300
  }

  // 下载文件
  async downloadFile(path) {
    const response = await this.request('GET', path)
    if (response.status === 200) {
      return await response.text()
    }
    if (response.status === 404) {
      return null
    }
    throw new Error(`下载失败: ${response.status}`)
  }

  // 获取文件信息
  async getFileInfo(path) {
    const response = await this.request('PROPFIND', path, null, {
      'Depth': '0',
      'Content-Type': 'text/xml'
    })
    
    if (response.status === 207) {
      const text = await response.text()
      const modifiedMatch = text.match(/<d:getlastmodified>([^<]+)<\/d:getlastmodified>/) || text.match(/<getlastmodified[^>]*>([^<]+)<\/getlastmodified>/)
      const sizeMatch = text.match(/<d:getcontentlength>([^<]+)<\/d:getcontentlength>/) || text.match(/<getcontentlength[^>]*>([^<]+)<\/getcontentlength>/)
      return {
        modified: modifiedMatch ? modifiedMatch[1] : null,
        size: sizeMatch ? parseInt(sizeMatch[1]) : 0
      }
    }
    return null
  }

  // 备份数据
  async backup(data) {
    await this.createDirectory(BACKUP_DIR)
    const content = JSON.stringify(data, null, 2)
    const path = `${BACKUP_DIR}/${BACKUP_FILE}`
    const success = await this.uploadFile(path, content)
    
    if (success) {
      const info = await this.getFileInfo(path)
      return { success: true, timestamp: info?.modified }
    }
    return { success: false, error: '上传失败' }
  }

  // 恢复数据
  async restore() {
    const path = `${BACKUP_DIR}/${BACKUP_FILE}`
    const content = await this.downloadFile(path)
    
    if (content) {
      try {
        const data = JSON.parse(content)
        return { success: true, data }
      } catch {
        return { success: false, error: '数据格式错误' }
      }
    }
    return { success: false, error: '备份文件不存在' }
  }

  // 获取备份信息
  async getBackupInfo() {
    const path = `${BACKUP_DIR}/${BACKUP_FILE}`
    try {
      const info = await this.getFileInfo(path)
      if (info) {
        return { exists: true, modified: info.modified, size: info.size }
      }
    } catch {
      // 文件不存在
    }
    return { exists: false }
  }
}

// 创建客户端实例
export const createClient = (config) => {
  return new WebDAVClient(config.host, config.username, config.password)
}

// 保存/读取配置
export const saveWebDAVConfig = (config) => {
  localStorage.setItem('nav-webdav-config', JSON.stringify(config))
}

export const getWebDAVConfig = () => {
  const saved = localStorage.getItem('nav-webdav-config')
  return saved ? JSON.parse(saved) : null
}

export const clearWebDAVConfig = () => {
  localStorage.removeItem('nav-webdav-config')
}

export default WebDAVClient
