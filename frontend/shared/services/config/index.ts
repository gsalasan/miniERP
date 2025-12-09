import { authStore } from '../stores/auth'
import { getConfigStoreState } from '../stores/config'
import version from './version'

export const getAuthStoreState = () => authStore.getState()

export const Config = {
  ...version,

  appName: () => 'Pit to Ship',
  app: () => 'pts',
  copyright: () => '© 2024 - 2025',
  geoCopyright: () => '© 2025 Geo Energy Group | All Rights Reserved.',
  rowsPerPage: () => [25, 50, 100, 500, 1000, 10000, 20000, 50000, 100000],
  denseTable: () => true,
  permissionOnLocal: () => true,
  detetimeInt: () => true,

  apiUrl(app = 'identity') {
    const appconfig = getConfigStoreState().getConfig()
    let url = ''

    if (appconfig.login) url = appconfig.identity
    else {
      const hostname = window.location.hostname
      if (hostname === 'prod-url') {
        const prefix = 'https://prod/'
        const apps = ['fms', 'crm', 'weigh']
        url = apps.includes(app) ? `${prefix}${app}/` : prefix
      } else {
        const apiHost = hostname.replace(/^([^.]+)/, '$1-api')
        const prefix = `http://${apiHost}/`
        url = app ? (appconfig[app as keyof typeof appconfig] as string) : prefix
      }
    }

    return url
  },

  getApiRoot(app = '') {
    return this.apiUrl(app) + 'api/v1/'
  },

  logout() {
    getAuthStoreState().clearData()
    window.location.assign('/login')
  }
}
