import { Constant } from '../constant/index'

export default {
  formatNumber(value: any, precision: number | null = null) {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return null
    }
    if (precision == null) precision = Constant.numberPrecision
    const formatted = parseFloat(value)
      .toFixed(precision)
      // .replace('.', ',') // Use comma for decimals
      .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',') // Thousand separator
    return formatted
  },
  formatNumberAccounting(value: any, precision: number | null = null, prefix: any = '', suffix: any = '') {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return null
    }

    if (precision == null) precision = Constant.numberPrecision

    const numericValue = parseFloat(value)
    const absValue = Math.abs(numericValue)
      .toFixed(precision)
      .replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')

    if (numericValue < 0) {
      return `(${prefix}${absValue}${suffix})` // Wrap in parentheses if negative
    }

    return `${prefix}${absValue}${suffix}` // Wrap in parentheses if negative
  },
  formatMoney(value: any) {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return null
    }
    const precision = Constant.moneyPrecision || 2
    const formatted = parseFloat(value)
      .toFixed(precision)
      // .replace('.', ',') // Use comma for decimals
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',') // Thousand separator
    return formatted
  },
  setCurrency2(number: number, format = 'id-ID') {
    if (isNaN(number)) {
      return null
    }
    return new Intl.NumberFormat(format).format(number)
  },
  round(number: number, precision = 2) {
    if (isNaN(number)) {
      return null
    }
    const factor = 10 ** precision
    return Math.round(number * factor) / factor
  },
  checkNum(str: string) {
    return !isNaN(Number(str))
  },
  sumOfArray<T>(array: T[], prop?: keyof T, startAt = 0): number {
    return array.reduce((total, item, index) => {
      if (index >= startAt) {
        total += prop ? +item[prop] : +item
      }
      return total
    }, 0)
  },
  sumWhere<T>(array: T[], prop: keyof T, where: keyof T, val: any): number {
    return array.reduce((total, item) => {
      if (item[where] === val) {
        total += +item[prop]
      }
      return total
    }, 0)
  },
  sumOfObject(obj: Record<string, number>): number {
    return this.sumOfArray(Object.values(obj))
  },
  getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in km
  },
  deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  },
  numberSay(number: number): string {
    if (number < 0) return 'Invalid number'

    const first = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen ']
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
    const scales = ['', 'thousand', 'million', 'billion', 'trillion']

    let word = ''
    for (let i = 0; i < scales.length; i++) {
      const tempNumber = number % (1000 * Math.pow(1000, i))
      const scaleValue = Math.floor(tempNumber / Math.pow(1000, i))

      if (scaleValue !== 0) {
        if (scaleValue < 20) {
          const firstWord = first[scaleValue]
          if (firstWord) word = firstWord + scales[i] + ' ' + word
        } else {
          word = tens[Math.floor(scaleValue / 10)] + '-' + first[scaleValue % 10] + scales[i] + ' ' + word
        }
      }

      const remainder = number % Math.pow(1000, i + 1)
      if (Math.floor(remainder / (100 * Math.pow(1000, i))) !== 0) {
        word = first[Math.floor(remainder / (100 * Math.pow(1000, i)))] + 'hundred ' + word
      }
    }
    return word.trim()
  },
  terbilang(number: number): string {
    if (number < 0 || number > 9999999999) return 'NUMBER OUT OF RANGE!'

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    const billions = Math.floor(number / 1000000000)
    number %= 1000000000

    const millions = Math.floor(number / 1000000)
    number %= 1000000

    const thousands = Math.floor(number / 1000)
    number %= 1000

    const hundreds = Math.floor(number / 100)
    number %= 100

    const tensPlace = Math.floor(number / 10)
    const onesPlace = Math.floor(number % 10)

    let result = ''

    if (billions) result += `${this.terbilang(billions)} Billion `
    if (millions) result += `${this.terbilang(millions)} Million `
    if (thousands) result += `${this.terbilang(thousands)} Thousand `
    if (hundreds) result += `${this.terbilang(hundreds)} Hundred `

    if (tensPlace > 0 || onesPlace > 0) {
      if (tensPlace < 2) {
        result += ones[tensPlace * 10 + onesPlace]
      } else {
        result += tens[tensPlace]
        if (onesPlace > 0) result += ` ${ones[onesPlace]}`
      }
    }

    return result.trim() || 'Zero'
  },
  formatNumberAuto(value: any, max_precision: number | null = 4) {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return null
    }

    const num = Number(value)

    // Ambil decimal length asli dari input
    let decimalLength = 0
    if (value.toString().includes('.')) {
      decimalLength = value.toString().split('.')[1].length
    }

    // Tentukan precision:
    // - Jika tidak ada decimal → 0
    // - Jika ada decimal → gunakan panjang decimal, tapi batasi oleh max_precision
    let precision = decimalLength > 0 ? decimalLength : 0
    if (max_precision !== null) {
      precision = Math.min(precision, max_precision)
    }

    const formatted = num.toFixed(precision).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')

    return formatted
  }
}
