export default {
  findString(string: string, keyword: string): boolean {
    if (!string || !keyword) return false
    return string.includes(keyword)
  },

  replace(target: string, replace: string, str: string): string {
    if (!target || !str) return str
    const regex = new RegExp(target, 'g')
    return ('' + str).replace(regex, replace)
  },

  delStr(str: string, fromRight = 1): string {
    if (!str) return ''
    return str.slice(0, str.length - fromRight)
  },

  capitalize(str: string): string {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
  },

  formatCamelCase(text: string, withS = true): string {
    if (!text) return ''
    let res = text.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
    res = res.startsWith('-') ? res.slice(1) : res
    return withS ? res + 's' : res
  },

  base64(str: string, type: 'enc' | 'dec'): string {
    if (!str) return ''
    return type === 'enc' ? btoa(str) : atob(str)
  },

  getFirstChar(str: string): string {
    return str?.charAt(0) ?? ''
  },

  arrToStr(arr: any[]): string {
    if (!Array.isArray(arr)) return ''
    return arr.join(',')
  },

  acronym(phrase: string | null): string {
    if (!phrase) return ''
    return phrase
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase())
      .join('')
  },

  strArr2ValLabel(strArr: string[]): { value: string; label: string }[] {
    return Array.isArray(strArr)
      ? strArr.map((e) => ({ value: e, label: e }))
      : []
  },

  slug2label(slug: string): string {
    if (!slug) return ''
    return slug
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  },

  label2slug(label: string, separator: string = '_'): string {
    if (!label) return ''
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, separator)
  },

  truncateText(text: string, maxLength: number = 50): string {
    if (!text) return ''
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
  },

  gen_ref_id(company_code: string, year: string, month: string): string {
    return `${company_code}-${year}-${month}`
  },

  schema2label(str: string): string {
    if (!str) return ''
    return str
      .split('.')
      .map((part) =>
        part
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
      )
      .join(' > ')
  }
}
