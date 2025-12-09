import Api from '../api/index'
import alert from './alert'
import date from './date'
import numbers from './numbers'
import text from './text'
import { Config } from '../config'
import { useAuthStore } from '../stores/auth'

// simple event bus (tanpa Quasar)
export const bus = {
  events: {} as Record<string, Function[]>,

  on(event: string, callback: Function) {
    if (!this.events[event]) this.events[event] = []
    this.events[event].push(callback)
  },

  emit(event: string, payload?: any) {
    if (!this.events[event]) return
    this.events[event].forEach(cb => cb(payload))
  }
}

export const Helper = {
  ...alert,
  ...date,
  ...numbers,
  ...text,
  bus,

  unreactive<T>(arr: T): T {
    return JSON.parse(JSON.stringify(arr))
  },

  makeAccessToken() {
    let result = ''
    const timemillis = new Date().getTime()
    const day = 60000 * 24 // valid for one day
    const num = Math.round(timemillis / day) * 7777777

    const characters =
      'Aa0Bb1Cc2Dd3Ee4Ff5Gg6Hh7Ii8Jj9KkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz'
    const charactersLength = characters.length

    const arr = String(num).split('').map(Number)

    for (let i = 0; i < arr.length; i++) {
      const el = arr[i]
      const iter = (el + i) * num
      const key = Number(String(iter).slice(-2))
      const to = Math.floor((key / 99) * charactersLength)
      const fr = Math.max(to - 1, 0)
      result += characters.substring(fr, to)
    }
    return result
  },

  path2UrlBlob(path: string, isPublic = false) {
    return Config.apiUrl('main') + 'v1/auth/master-files/view'
  },

  viewBlobFile(path: string, isPublic = false, storageId: string | null = null) {
    const basePath = Config.apiUrl('main') + 'v1/auth/master-files/view'
    const token = useAuthStore().getToken()

    let url = `${basePath}?path=${path}&token=${token}`
    if (isPublic) url += '&mode=public'
    if (storageId) url += `&storage_id=${storageId}`

    return url
  },

  async blobFile(path: string, isPublic = false, storageId: string | null = null) {
    let file = ''
    const API = new Api()
    API.skipNotice = true

    const mode = isPublic ? 'public' : 'private'
    let ep = `auth/master-files/download?mode=${mode}&path=${path}`
    if (storageId) ep += `&storage_id=${storageId}`

    await API.get(
      ep,
      (status: number, _data: any, _message: string, response: any) => {
        API.skipNotice = false
        if (status === 200) {
          const contentType = response.headers['content-type'] || 'application/pdf'
          const blob = new Blob([response.data], { type: contentType })
          file = URL.createObjectURL(blob)
        }
      },
      'main',
      'blob'
    )
    return file
  },

  async getBlobFile(path: string, isPublic = false, storageId: string | null = null) {
    const API = new Api()
    API.skipNotice = true

    const mode = isPublic ? 'public' : 'private'
    let ep = `auth/master-files/download?mode=${mode}&path=${path}`
    if (storageId) ep += `&storage_id=${storageId}`

    return new Promise((resolve) => {
      API.get(
        ep,
        (status: number, _data: any, _message: string, response: any) => {
          API.skipNotice = false

          if (status === 200) {
            const contentType =
              response.headers['content-type'] || 'application/octet-stream'

            const blob = new Blob([response.data], { type: contentType })
            const filename = path.split('/').pop() || 'file.bin'
            const file = new File([blob], filename, { type: contentType })
            resolve(file)
          } else {
            resolve(null)
          }
        },
        'main',
        'blob'
      )
    })
  },

  findArrayByKey(arr: any[], key: string, value: any, getIndex = false) {
    if (!arr) return null

    for (let i = 0; i < arr.length; i++) {
      if (arr[i][key] === value) {
        return getIndex ? i : arr[i]
      }
    }
    return null
  },

  adjustIframeHeight(iframe: HTMLIFrameElement | null) {
    if (iframe?.contentWindow?.document) {
      const contentHeight = iframe.contentWindow.document.body.scrollHeight
      iframe.style.height = `${contentHeight + 50}px`
    }
  },

  openIframeNewTab(url: string) {
    window.open(url, '_blank')
  },

  object2columns(obj: object, ignoreKeys: string[] = []) {
    return Object.keys(obj)
      .filter(key => !ignoreKeys.includes(key))
      .map(key => ({
        name: key,
        label: this.slug2label(key),
        align: 'left',
        field: key,
        sortable: true
      }))
  },

  getFilledArray(details: any[] = [], excludeKey: string[] = []) {
    return details.filter(item =>
      Object.entries(item).some(([key, value]) => !excludeKey.includes(key) && value === true)
    )
  },
}
