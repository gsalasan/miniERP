// stores/auth.ts
import { create } from 'zustand'

// ---------- Helper for storage ----------
const storageHelper = {
  getData: (state: string, key: string, default_value: any, type: 'session' | 'local' = 'session') => {
    const raw = type === 'session' ? sessionStorage.getItem(state) : localStorage.getItem(state)
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed[key]
    } else {
      // Initialize storage with default value
      if (type === 'session') sessionStorage.setItem(state, JSON.stringify(default_value))
      else localStorage.setItem(state, JSON.stringify(default_value))
      return default_value[key]
    }
  },
  saveData: (state: string, key: string, default_data: any, value: any, type: 'session' | 'local' = 'session') => {
    let data = default_data
    const raw = type === 'session' ? sessionStorage.getItem(state) : localStorage.getItem(state)
    if (raw) data = JSON.parse(raw)
    data[key] = value

    if (type === 'session') sessionStorage.setItem(state, JSON.stringify(data))
    else localStorage.setItem(state, JSON.stringify(data))

    return data[key]
  }
}

// ---------- Default State ----------
const defaultData = {
  refresh_token: '',
  token: '',
  token_expire: 0,
  remember: false,
  user: {
    id: 0,
    username: '',
    name: '',
    email: '',
    phone: '',
    profile_picture: '',
    user_type: '',
    companies: '',
    vendors: '',
    role_code: null,
    role: { permissions: [] },
    permissions: [],
    menu: { menu_items: [] },
    menu_favorites: [],
    table_configs: [],
    table_summaries: [],
    tracker_token: null,
    additional_permissions: null
  },
  notifications: [],
  company_code: '',
  vendor_code: '',
  app: '',
  printMode: false
}

// ---------- Zustand Store ----------
type AuthState = typeof defaultData & {
  // TOKEN
  setTokenInfo: (token?:string) => void
  getToken: () => string
  getRefreshToken: () => string
  setTokenExpire: (num: number) => void
  getTokenExpire: () => number

  // USER
  setUser: (data: any) => void
  getUser: () => any

  // MENU
  getMenu: () => any
  getPermissions: () => any

  // FAVORITES
  setFavs: (list: any) => any
  getFavs: () => any

  // TABLE
  setTblConfigs: (cfg: any) => any
  getTblConfigs: () => any
  setTblSummaries: (summaries: any) => any
  getTblSummaries: () => any

  // COMPANY/VENDOR
  setCompany: (c: string) => void
  getCompanyCode: () => string | null
  getCompanies: (opt?: boolean, string?: boolean) => any
  setVendor: (v: string) => void
  getVendorCode: () => string | null
  getVendors: (opt?: boolean, string?: boolean) => any

  // APP
  setApp: (x: string) => void
  getApp: () => string

  // GENERIC
  setData: (key: string, value: any) => void
  getData: (key: string) => any
  clearData: () => void

  // PRINT MODE
  setPrintMode: (mode: boolean) => void
  getPrintMode: () => boolean
}

export const authStore = create<AuthState>((set, get) => ({
  ...defaultData,

  // TOKEN
  getToken: () => storageHelper.getData('auth', 'token', get(), 'local'),
  getRefreshToken: () => storageHelper.getData('auth', 'refresh_token', get(), 'local'),
  setTokenInfo: (token) => {
    if (token) storageHelper.saveData('auth', 'token', get(), token, 'local')
    // if (refresh_token) storageHelper.saveData('auth', 'refresh_token', get(), refresh_token, 'local')
    // if (token_expire) storageHelper.saveData('auth', 'token_expire', get(), token_expire, 'local')
    set({
      token: token ?? get().token,
      // refresh_token: refresh_token ?? get().refresh_token,
      // token_expire: token_expire ?? get().token_expire
    })
  },
  getTokenExpire: () => storageHelper.getData('auth', 'token_expire', get(), 'local'),
  setTokenExpire: (num) => {
    storageHelper.saveData('auth', 'token_expire', get(), num, 'local')
    set({ token_expire: num })
  },

  // USER
  setUser: (data) => {
    const company_code = get().company_code || (data.company_code?.split(',')[0] ?? '')
    storageHelper.saveData('auth', 'user', get(), data, 'local')
    storageHelper.saveData('auth', 'company_code', get(), company_code, 'local')
    set({ user: data, company_code })
  },
  getUser: () => storageHelper.getData('auth', 'user', get(), 'local'),

  // MENU
  getMenu: () => get().getUser()?.menu?.menu_items,
  getPermissions: () => get().getUser()?.permissions,

  // FAVORITES
  setFavs: (favs) => {
    const user = { ...get().getUser(), menu_favorites: favs }
    storageHelper.saveData('auth', 'user', get(), user, 'local')
    set({ user })
    return user.menu_favorites
  },
  getFavs: () => get().getUser()?.menu_favorites,

  // TABLE
  setTblConfigs: (cfg) => {
    const user = { ...get().getUser(), table_configs: cfg }
    storageHelper.saveData('auth', 'user', get(), user, 'local')
    set({ user })
    return user.table_configs
  },
  getTblConfigs: () => get().getUser()?.table_configs,
  setTblSummaries: (summaries) => {
    const user = { ...get().getUser(), table_summaries: summaries }
    storageHelper.saveData('auth', 'user', get(), user, 'local')
    set({ user })
    return user.table_summaries
  },
  getTblSummaries: () => get().getUser()?.table_summaries,

  // COMPANY/VENDOR
  setCompany: (c) => {
    storageHelper.saveData('auth', 'company_code', get(), c, 'local')
    set({ company_code: c })
  },
  getCompanyCode: () => {
    const code = storageHelper.getData('auth', 'company_code', get(), 'local')
    if (!code || code.toLowerCase() === 'all') return null
    return code
  },
  getCompanies: (opt = false, string = false) => {
    const companies = get().getUser()?.companies
    if (!companies) return []
    if (string) return companies
    const arr = companies.split(',').filter((x: string) => x.toLowerCase() !== 'all')
    if (!opt && arr.length > 1) arr.push('All')
    return arr
  },
  setVendor: (v) => {
    storageHelper.saveData('auth', 'vendor_code', get(), v, 'local')
    set({ vendor_code: v })
  },
  getVendorCode: () => {
    const v = storageHelper.getData('auth', 'vendor_code', get(), 'local')
    if (!v || v.toLowerCase() === 'all') return null
    return v
  },
  getVendors: (opt = false, string = false) => {
    const vendors = get().getUser()?.vendors
    if (!vendors) return []
    if (string) return vendors
    const arr = vendors.split(',').filter((x: string) => x.toLowerCase() !== 'all')
    if (!opt && arr.length > 1) arr.push('All')
    return arr
  },

  // APP
  setApp: (x) => {
    storageHelper.saveData('auth', 'app', get(), x, 'local')
    set({ app: x })
  },
  getApp: () => storageHelper.getData('auth', 'app', get(), 'local'),

  // GENERIC
  setData: (key, value) => storageHelper.saveData('auth', key, get(), value, 'local'),
  getData: (key) => storageHelper.getData('auth', key, get(), 'local'),

  // CLEAR
  clearData: () => {
    localStorage.setItem('auth', JSON.stringify(defaultData))
    set({ ...defaultData })
  },

  // PRINT MODE
  setPrintMode: (mode) => set({ printMode: mode }),
  getPrintMode: () => get().printMode
}))
