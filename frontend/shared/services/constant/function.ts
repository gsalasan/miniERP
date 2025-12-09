import Hdate from '../helper/date'
type Option = { value: string | number; label: string }

export default {
  yearOptions(): string[] {
    const now = parseInt(Hdate.toDate(Hdate.today(), 'YYYY'), 10)
    const iterate = now + 2
    const years: string[] = []
    for (let index = 2023; index <= iterate; index++) {
      years.push(index.toString())
    }
    return years
  },
  changeToToggle(array: any[], value = 'id', label = 'name'): Option[] {
    const opt: Option[] = []
    if (Array.isArray(array) && array.length > 0) {
      array.forEach((element) => {
        if (value in element && label in element) {
          opt.push({ value: element[value], label: element[label] })
        }
      })
    }
    return opt
  },
  months(key: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return months[key] || ''
  },
  days(key: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[key] || ''
  }
}
