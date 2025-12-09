import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------- TYPES ----------
interface AuditTrailCfg {
  cols: string[]
  as_json: boolean
}

interface AppConfig {
  login: boolean
  identity: string
  crm: string
  hr: string
  project: string
  procurement: string
  engineering: string
  finance: string
}

interface ConfigState {
  dark_mode: boolean | 'auto'
  sidebar: string
  lang: string
  audit_trail_cfg: AuditTrailCfg
  appconfig: AppConfig
  csvdelimiter: string

  // METHODS
  getDarkMode: () => boolean | 'auto'
  setDarkMode: (v: boolean | 'auto') => void

  getConfig: () => AppConfig
  saveConfig: (v: AppConfig) => void

  getData: (key: keyof ConfigState) => any
  setData: (key: keyof ConfigState, v: any) => void

  getAuditTrailCfg: () => AuditTrailCfg
  setAuditTrailCfg: (v: AuditTrailCfg) => void
}

// ---------- DEFAULT STATE ----------
const defaultState = {
  dark_mode: false,
  sidebar: '',
  lang: '',
  audit_trail_cfg: {
    cols: [],
    as_json: false
  },
  appconfig: {
    login: false,
    identity: "http://localhost:4001/",
    crm: "http://localhost:4002/",
    hr: "http://localhost:4003/",
    project: "http://localhost:4004/",
    procurement: "http://localhost:4005/",
    finance: "http://localhost:4006/",
    engineering: "http://localhost:4007/",
  },
  csvdelimiter: ','
}

// ---------- STORE ----------
export const configStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      getDarkMode: () => get().dark_mode,
      setDarkMode: (v) => set({ dark_mode: v }),

      getConfig: () => get().appconfig,
      saveConfig: (v) => set({ appconfig: v }),

      getData: (key) => (get() as any)[key],
      setData: (key, v) => set({ [key]: v } as any),

      getAuditTrailCfg: () => get().audit_trail_cfg,
      setAuditTrailCfg: (v) => set({ audit_trail_cfg: v }),
    }),
    {
      name: 'config-store',
      partialize: (state) => state,
    }
  )
)

// ✅ Helper: Ambil state tanpa hook React
export const getConfigStoreState = () => configStore.getState()
