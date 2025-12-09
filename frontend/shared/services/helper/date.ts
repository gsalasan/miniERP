// ========= DATE FORMATTER UTILITY ========= //
function formatDate(input: string | Date | number, fmt = 'YYYY-MM-DD'): string {
  const d = new Date(input)
  if (isNaN(d.getTime())) return ''

  const yyyy = d.getFullYear()
  const yy = String(yyyy).slice(-2)
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')

  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const MMM = monthsShort[d.getMonth()]

  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')

  return fmt
    .replace('YYYY', String(yyyy))
    .replace('YY', yy)
    .replace('MM', MM)
    .replace('DD', dd)
    .replace('MMM', MMM)
    .replace('HH', hh)
    .replace('mm', mm)
    .replace('ss', ss)
}

// ========= MAIN EXPORT ========= //

export default {
  currentmillis(): number {
    return Date.now()
  },

  date2millis(dateTime: string, local = false): number {
    const time = new Date(dateTime).getTime()
    if (isNaN(time)) return 0

    const offset = local ? new Date().getTimezoneOffset() * 60000 : 0
    return time + offset
  },

  today(format = 'YYYY-MM-DD'): string {
    return formatDate(new Date(), format)
  },

  now(days = 0, format = 'YYYY-MM-DD HH:mm:ss'): string {
    const d = new Date()
    if (days !== 0) d.setDate(d.getDate() + days)
    return formatDate(d, format)
  },

  utcTime(): string {
    const now = new Date()
    return [
      String(now.getUTCHours()).padStart(2, '0'),
      String(now.getUTCMinutes()).padStart(2, '0'),
      String(now.getUTCSeconds()).padStart(2, '0')
    ].join(':')
  },

  readDate(date: string | Date | number, includeTime = false): string {
    return includeTime
      ? formatDate(date, 'DD-MMM-YY HH:mm')
      : formatDate(date, 'DD-MMM-YY')
  },

  readRangeDate(start: any, end: any): string {
    const fr = formatDate(start, 'MMM YY')
    const to = formatDate(end, 'MMM YY')

    if (fr === to) {
      return `${formatDate(start, 'DD')} - ${formatDate(end, 'DD MMM YY')}`
    }
    return `${formatDate(start, 'DD MMM')} - ${formatDate(end, 'DD MMM YY')}`
  },

  toDate(dateInput: any, format = 'YYYY-MM-DD'): string {
    return formatDate(dateInput, format)
  },

  addDate(dateInput: any, days: number, isMidNight = false, format = 'YYYY-MM-DD'): string {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return ''
    d.setDate(d.getDate() + days)
    if (isMidNight) d.setHours(0, 0, 0, 0)
    return formatDate(d, format)
  },

  subDate(dateInput: any, days: number): string {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return ''
    d.setDate(d.getDate() - days)
    return formatDate(d)
  },

  ym2date(value: string): string {
    try {
      const months = ['', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
      const [m, y] = value.toLowerCase().split(' ')
      const idx = months.indexOf(m)
      if (idx <= 0 || !y) return ''
      return `${y}-${String(idx).padStart(2, '0')}-01`
    } catch {
      return ''
    }
  },

  millis2textdhm(ms: number): string {
    const d = Math.floor(ms / 86400000)
    const h = Math.floor((ms % 86400000) / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    return `${d} Days : ${h} Hours : ${m} Minutes`
  },

  millis2textHm(ms: number): string {
    const d = new Date(ms)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  },

  millis2Date(ms: number, format = 'yyyy-MM-dd'): string {
    const yyyy = new Date(ms).getFullYear()
    const mm = String(new Date(ms).getMonth() + 1).padStart(2, '0')
    const dd = String(new Date(ms).getDate()).padStart(2, '0')

    if (format === 'yyyy-MM-dd') return `${yyyy}-${mm}-${dd}`
    if (format === 'dd-MM-yyyy') return `${dd}-${mm}-${yyyy}`

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    if (format === 'dd-MMM-yy') return `${dd}-${months[new Date(ms).getMonth()]}-${String(yyyy).slice(-2)}`

    return new Date(ms).toISOString()
  },

  diffInDay(start: any, end: any): number {
    return (new Date(end).getTime() - new Date(start).getTime()) / 86400000
  },

  sessionTimer(t: number) {
    const result = [
      { id: 0, text: 'Days', time: 0 },
      { id: 1, text: 'Hours', time: 0 },
      { id: 2, text: 'Minutes', time: 0 },
      { id: 3, text: 'Seconds', time: 0 }
    ]

    if (t >= 0) {
      result[3].time = Math.floor((t / 1000) % 60)
      result[2].time = Math.floor((t / 60000) % 60)
      result[1].time = Math.floor((t / 3600000) % 24)
      result[0].time = Math.floor(t / 86400000)
    }

    return result
  },

  readTimeLogs(timestamp: number | null): string {
    if (!timestamp) return ''

    const now = new Date()
    const d = new Date(timestamp)
    const diffMs = now.getTime() - d.getTime()

    if (diffMs < 0) return 'In the future'

    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffHour < 24) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }

    if (diffDay < 7) {
      const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
      return diffDay === 1 ? 'Yesterday' : `Last ${weekday}`
    }

    if (diffDay < 30) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  },

  getWeekNumber(dateInput: any): number | null {
    if (!dateInput) return null
    const dt = new Date(dateInput)
    if (isNaN(dt.getTime())) return null

    const day = (dt.getDay() + 6) % 7
    const nearestThu = new Date(dt)
    nearestThu.setDate(dt.getDate() - day + 3)

    const yearStart = new Date(nearestThu.getFullYear(), 0, 1)
    const diff = Math.round((nearestThu.getTime() - yearStart.getTime()) / 86400000)

    return Math.floor(diff / 7) + 1
  },

  addMinute(dateStr: string, minutes: number): string {
    const d = new Date(dateStr.replace(' ', 'T'))
    if (isNaN(d.getTime())) throw new Error('Invalid date format')
    d.setMinutes(d.getMinutes() + minutes)

    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  },

  convertToDHM(minutes: number): string {
    const d = Math.floor(minutes / 1440)
    const h = Math.floor((minutes % 1440) / 60)
    const m = minutes % 60

    const out = []
    if (d > 0) out.push(`${d} Days`)
    if (h > 0) out.push(`${h} Hours`)
    if (m > 0 || out.length === 0) out.push(`${m} Minutes`)

    return out.join(' ')
  },

  rangeDateTime(start: string, end: string, raw = false, toMinute = true) {
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()

    if (isNaN(s) || isNaN(e)) throw new Error('Invalid date format')

    const diff = e - s
    const neg = diff < 0
    const minutes = Math.round(Math.abs(diff) / 60000)

    if (raw) return neg ? -minutes : minutes

    if (toMinute) return neg ? `-${minutes}M` : `${minutes}M`

    const dhm = this.convertToDHM(minutes)
    return neg ? `-${dhm}` : dhm
  },

  minuteToDhm(minute: number): string {
    const m = Math.abs(minute)
    const d = Math.floor(m / 1440)
    const h = Math.floor((m % 1440) / 60)
    const mm = m % 60

    return `${minute < 0 ? '-' : ''}${String(d).padStart(2, '0')}:${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  },

  getMonthName(month: number): string {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return names[month] ?? ''
  },

  extractRangeDate(val: string, selector: 'start' | 'end' | null = null) {
    if (!val) return null

    const [start, end] = val.split(' to ').map(s => s.trim())
    const result = { start, end: end || start }

    if (selector) return result[selector]
    return result
  }
}
