/* eslint-disable */
import { Helper } from '../helper/index'
import Api from '../api/index'
import { Config } from '../config/index'
import { Constant } from '../constant/index'
import { Lang } from '../lang'
import { useAuthStore } from '../stores/auth'
import * as XLSX from 'xlsx'

export const Handler = {
  permissions(router: any, action: string, meta: any, callback: { (status: any, data: any): void; (arg0: boolean, arg1: any): void }) {
    const app = meta.app
    const slug = meta.module
    const permissions = useAuthStore().getPermissions()
    let status = false
    for (const e of permissions) {
      if (e && slug && ((app && app === e.app && slug === e.name) || (!app && slug === e.name))) {
        meta.permission = e.detail
        if (meta.permission[action]) status = true
        break
      }
    }
    const permissionName = `${app} - ${slug}.${action}`
    if (!status) {
      router.push({
        name: '403',
        state: {
          permission: permissionName
        }
      })
    }
    callback(status, meta.permission)
  },
  /* END OF MODULE HANDLER */

  /* HANDLING FILES */
  formData(data: any) {
    const dataModel = new FormData()
    // if(data.id || data._id) dataModel.append('_method', 'PUT')
    for (const key in data) {
      if (data[key]) dataModel.append(key, data[key])
    }
    return dataModel
  },
  async storeFile(dataModel: any, callback: any, endpoint = 'auth/master-files') {
    const model = this.formData(dataModel)
    const API = new Api()
    let dataapi = null
    let msg = 'upload failed'
    let ep = endpoint
    if (dataModel.id > 0) ep += `/${dataModel.id}`
    await API.post(
      ep,
      model,
      (status: number, data: any) => {
        if (status === 200) {
          dataapi = data
          msg = 'upload success'
        }
      },
      'main',
      true
    )
    callback(dataapi, msg)
  },
  exportData(data: any, filename: string) {
    let blob = new Blob([data], { type: 'application/octet-stream' })
    let link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = `${filename}.xlsx`
    link.click()
  },
  exportXLS(meta: { tableExport: any; tableExportSample: any[]; name: string }) {
    const tempArr: any[] = []
    const columns = meta.tableExport(Helper, Constant, Lang)
    meta.tableExportSample.forEach((x: any, xIndex: string | number) => {
      const tempData = <any>{}
      columns.forEach((y: { label: any; field: (arg0: any) => any; name: any; formatter: string }) => {
        const label = y.label
        const field = typeof y.field === 'function' ? y.name : y.field

        // Get value from original data
        let value = x[field]

        if (typeof value === 'object') value = JSON.stringify(value)
        if (typeof y.field === 'function') value = y.field(x)
        if (Array.isArray(value)) value = JSON.stringify(value)

        if (y.formatter) {
          if (y.formatter == 'float') value = value ? parseFloat(value) : 0
          else if (y.formatter == 'integer') value = value ? parseInt(value) : 0
          else if (y.formatter == 'date') value = Helper.toDate(value, 'YYYY-MM-DD')
          else if (y.formatter == 'time') value = Helper.toDate(value, 'HH:mm:ss')
          else if (y.formatter == 'datetime') value = Helper.toDate(value, 'YYYY-MM-DD HH:mm:ss')
          else if (y.formatter == 'millis') value = Helper.toDate(value, 'YYYY-MM-DD HH:mm:ss')
        }

        tempData[label] = value
      })
      tempArr.push(tempData)
    })
    const data = XLSX.utils.json_to_sheet(tempArr)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, data, 'data')
    XLSX.writeFile(wb, `${meta.name}-table-import-template.xlsx`)
  },
  /* _type avail :
    min-char-{lenght}
    max-char-{lenght}
    min-numb-{lenght}
    max-numb-{lenght}
    min-max-char-{lenghtMin}-{lengthMax}
    min-max-numb-{lenghtMin}-{lengthMax}
    required
  */
  rules(_type = 'required', _msg = null, _raw = false, t = null) {
    let mxVal = null
    let minVal = 0
    let maxVal = 0
    let msg = ''
    let length = 0
    let res: any = []
    let minChar: any = _type.split(/min-char-/)
    let maxChar: any = _type.split(/max-char-/)
    let minNumb: any = _type.split(/min-numb-/)
    let maxNumb: any = _type.split(/max-numb-/)
    let minMaxChar: any = _type.split(/min-max-char-/)
    let minMaxNumb: any = _type.split(/min-max-numb-/)

    // minumum character
    if (minChar.length === 2 && minChar[0] === '') {
      length = parseInt(minChar[1])
      msg = `Minimal ${length} characters`
      msg = _msg ? _msg : msg
      res = [(val: any) => (!!val && val.length >= length) || msg]
    }
    // maximum character
    else if (maxChar.length === 2 && maxChar[0] === '') {
      length = parseInt(maxChar[1])
      msg = `Maximum ${length} characters`
      msg = _msg ? _msg : msg
      res = [(val: any) => (!!val && val.length <= length) || msg]
    }
    // minumum number value
    else if (minNumb.length === 2 && minNumb[0] === '') {
      length = parseInt(minNumb[1])
      msg = `Minimal value is ${length}`
      msg = _msg ? _msg : msg
      res = [(val: any) => (!!val && val >= length) || msg]
    }
    // maximum number value
    else if (maxNumb.length === 2 && maxNumb[0] === '') {
      length = parseInt(maxNumb[1])
      msg = `Maximum value is ${length}`
      msg = _msg ? _msg : msg
      res = [(val: any) => val <= length || msg]
    }
    // minumum & maximum character
    else if (minMaxChar.length === 2 && minMaxChar[0] === '') {
      mxVal = minMaxChar[1].split('-')
      if (mxVal.length === 2) {
        minVal = parseInt(mxVal[0])
        maxVal = parseInt(mxVal[1])

        const minMsg = `Min ${minVal} characters`
        const maxMsg = `Max ${maxVal} characters`
        res = [(val: any) => ((!!val && val.length >= minVal) || _msg ? _msg : minMsg), (val: any) => ((!!val && val.length <= maxVal) || _msg ? _msg : maxMsg)]
      }
    }
    // minumum & maximum number
    else if (minMaxNumb.length === 2 && minMaxNumb[0] === '') {
      mxVal = minMaxNumb[1].split('-')
      if (mxVal.length === 2) {
        minVal = parseInt(mxVal[0])
        maxVal = parseInt(mxVal[1])
        const minMsg = `Min value is ${minVal}`
        const maxMsg = `Max value is ${maxVal}`
        res = [(val: any) => ((!!val && val >= minVal) || _msg ? _msg : minMsg), (val: any) => ((!!val && val <= maxVal) || _msg ? _msg : maxMsg)]
      }
    }
    // required
    else {
      msg = `Field is required!`
      msg = _msg ? _msg : msg
      res = [(val: any) => (!!val && val !== '' && val !== ' ' && val !== '  ' && val !== '   ') || msg]
    }

    if (_raw) return res[0]
    return res
  },
  approvalIsRunning(approval_status: any) {
    if (!approval_status || approval_status === 'Pending') return false
    return true
  },
  hasAdditionalPermision(type: string) {
    const Auth = useAuthStore()
    const user = Auth.getUser()

    if (user && user.additional_permissions !== undefined && user.additional_permissions !== null) {
      const permissionsArray = user.additional_permissions.split(',')
      return permissionsArray.includes(type)
    }
    return false
  }
}

export interface Dialog {
  [props: string]: any
  show: boolean
  title?: string
  width?: string
  maximize?: boolean
  persistent?: boolean
}

export interface DataFile {
  id: number | null
  name: string | null
  description: string | null
  filename: string | null
  path: string | null
  cdn_path: string | null
  module: string | null
  reference_id: string | number | null
  reference_code: string | null
  file: any
}
