import axios from 'axios';
import Alert from '../helper/alert';
import { Config } from '../config/index';
import { authStore } from '../stores/auth';

export const getAuthStoreState = () => authStore.getState();

type Position =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'center-start'
  | 'center'
  | 'center-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end';

export default class Api {
  apiService: any = {};
  token = '';
  app = Config.app();
  skipNotice = false;
  multipart_formdata = false;
  static get: any;

  private static isRefreshing = false;
  private static failedQueue: {
    resolve: (token: string) => void;
    reject: (err: any) => void;
  }[] = [];

  constructor() {
    this.apiService = axios.create();
  }

  setFormMultipart() {
    this.apiService.defaults.headers['Content-Type'] = 'multipart/form-data';
  }

  // =========================================================
  // REQUEST PER METHOD
  // =========================================================
  get(path: string, callback: any, app = '', resType = 'json') {
    return this.req('GET', app, path, null, callback, false, resType);
  }
  post(path: string, request: any, callback: any, app = '', isMultipart = false, resType = 'json') {
    return this.req('POST', app, path, request, callback, isMultipart, resType);
  }
  put(path: string, request: any, callback: any, app = '', isMultipart = false) {
    return this.req('PUT', app, path, request, callback, isMultipart, 'json');
  }
  patch(path: string, request: any, callback: any, app = '') {
    return this.req('PATCH', app, path, request, callback, false, 'json');
  }
  delete(path: string, request: any, callback: any, app = '') {
    return this.req('DELETE', app, path, request, callback, false, 'json');
  }

  // =========================================================
  // CORE HTTP HANDLER
  // =========================================================
  async req(type: string, app: string, path: string, request: any, callback: any, isMultipart = false, resType = 'json') {
    const config = this.buildConfig(type, app, path, request, isMultipart, resType);

    try {
      const response = await this.apiService.request(config);
      if (config.responseType === 'blob') {
        callback(200, null, null, response);
        return;
      }
      const res = this.transformRes(response);

      if (res.status === 401) return this.handle401Retry(config, callback)
      else this.validateResponseData(res, path)

      if (this.validateResponseData(res, path)) callback(res.status, res.data, res.message, response);
    } catch (error: any) {
      console.warn('api_res_error', error);
      if (error?.response) {
        const res = this.transformRes(error?.response ?? error);
        this.validateResponseData(res, path);
        callback(res.status, res.data, res.message, error);
      } else {
        Alert.showToast('Failed to load resource from server.', 'error', 'top-end', 5000);
        callback(500, null, null, error);
      }
    }
  }

  private buildConfig(type: string, app: string, path: string, request: any, isMultipart = false, resType = 'json') {
    this.apiService.defaults.headers['Access-Control-Allow-Origin'] = '*';
    if (isMultipart) this.setFormMultipart();
    else if (this.multipart_formdata) this.setFormMultipart();
    else if (path === 'token') this.apiService.defaults.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    else this.apiService.defaults.headers['Content-Type'] = 'application/json';

    let apiroot = '';
    if (app) apiroot = Config.getApiRoot(app);
    else apiroot = Config.getApiRoot('main');

    const config: any = { method: type, url: apiroot + path, responseType: resType };

    if (path !== 'token') {
      this.token = getAuthStoreState().getToken();
      Object.assign(config, { headers: { Authorization: `Bearer ${this.token}` } });
    }

    if (type !== 'GET') Object.assign(config, { data: request });

    return config;
  }

  private transformRes(response: any) {
    const res = response?.data;
    return {
      status: response?.status ?? 401,
      data: res?.data !== undefined ? res.data : res,
      message: res?.status?.message ?? res?.message ?? response?.statusText,
      response: response
    };
  }

  private validateResponseData(res: any, path: string) {
    if (this.skipNotice) return false;

    let msg = 'Failed to load resource from server.';
    let type: 'success' | 'error' | 'info' | 'warning' = 'info';
    let pos: Position = 'top-end';
    if (res.status === 200) return true;
    else if (res.status === 400) {
      msg = res.message;
      type = 'info';
    } else if (res.status === 403) {
      msg = `Forbidden (403) | ${res.message ?? ''}`;
      type = 'error';
    } else if (res.status === 404) {
      msg = 'Not Found 404';
      type = 'info';
    } else if (405 <= res.status && res.status < 500) {
      msg = res.message;
      type = 'info';
    } else if (500 <= res.status && res.status < 600) {
      msg = `Server Error ${res.status} | ${res.message}`;
      type = 'error';
    } else if (res.message === 'Network Error') {
      msg = 'Network Error. The server is unreachable.';
      type = 'error';
    } else {
      msg = 'Error in UI Section. ' + JSON.stringify(res);
      console.warn(`path: ${path}`, msg, JSON.stringify(res));
      if (window.location.host.indexOf('localhost') === -1) return false;
    }

    Alert.showToast(msg, type, pos, 5000);
    return false;
  }

  // =========================================================
  // REFRESH TOKEN + QUEUE
  // =========================================================
  private async handle401Retry(originalConfig: any, callback: any) {
    const refreshToken = getAuthStoreState().getRefreshToken();
    if (!refreshToken) {
      Alert.showToast('Session expired. Please login again.', 'error', 'top-end', 12000);
      return Config.logout();
    }

    if (Api.isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        Api.failedQueue.push({ resolve, reject });
      })
        .then((newToken: string) => {
          originalConfig.headers.Authorization = `Bearer ${newToken}`;
          return this.apiService.request(originalConfig).then((response: any) => {
            const res = this.transformRes(response);
            callback(res.status, res.data, res.message, response);
          });
        })
        .catch((err) => {
          console.warn(err);
          Alert.showToast('Session expired. Please login again.', 'error', 'top-end', 12000);
          return Config.logout();
        });
    }

    Api.isRefreshing = true;

    return new Promise<string>((resolve, reject) => {
      void (async () => {
        try {
          const newToken = await this.doRefreshToken();
          Api.failedQueue.forEach((p) => p.resolve(newToken));
          Api.failedQueue = [];

          originalConfig.headers.Authorization = `Bearer ${newToken}`;
          const retryResponse = await this.apiService.request(originalConfig);

          const res = this.transformRes(retryResponse);
          callback(res.status, res.data, res.message, retryResponse);

          resolve(retryResponse);
        } catch (err) {
          Api.failedQueue.forEach((p) => p.reject(err));
          Api.failedQueue = [];
          Alert.showToast('Session expired. Please login again.', 'error', 'top-end', 12000);
          Config.logout();
          reject(err instanceof Error ? err : new Error(String(err)));
        } finally {
          Api.isRefreshing = false;
        }
      })();
    });
  }

  private async doRefreshToken(): Promise<string> {
    const apiUrl = Config.getApiRoot('main');
    const refreshToken = getAuthStoreState().getRefreshToken();

    const r = await axios.post(`${apiUrl}refresh-token`, { refresh_token: refreshToken });

    if (r.status !== 200 || !r.data?.access_token) throw new Error('Invalid refresh token');

    getAuthStoreState().setTokenInfo({
      access_token: r.data.access_token,
      refresh_token: r.data.refresh_token,
      token_expire: r.data.expire_token
    });

    return r.data.access_token;
  }
}
