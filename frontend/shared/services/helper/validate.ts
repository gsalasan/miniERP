export default {
  ym2date(yearMonth: string): string {
    try {
      const months = ['', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
      const [monthStr, year] = yearMonth.split(' ')
      if (monthStr) {
        const monthIndex = months.indexOf(monthStr.toLowerCase())
        if (monthIndex <= 0 || !year) return ''
        const month = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`
        return `${year}-${month}-01`
      }
      return ''
    } catch (error) {
      console.error("Invalid input for 'ym2date'", error)
      return ''
    }
  },
  validateDate(val: string, maskDate: string, isRange: boolean | undefined = false, required: boolean | undefined = false): boolean {
    if (required && (!val || val === '')) return false

    // console.log(val, maskDate, isRange, required)
    // if (props.datetime) return 'YYYY-MM-DD HH:mm';
    // if (props.millis) return 'YYYY-MM-DD HH:mm';
    // if (props.time) return 'HH:mm';
    // if (props.yearMonth) return 'MMM YYYY';
    // return 'YYYY-MM-DD';

    try {
      if (val) {
        let year = 0,
          month = 0,
          day = 0,
          hour = 0,
          minute = 0
        if (maskDate == 'MMM YYYY') {
          const parsedDate = this.ym2date(val)
          if (!parsedDate) return false
          return true
        } else if (isRange) {
          const [start, end] = val.split(' to ')
          if (!start || !end) return false
          return true
        } else if (maskDate == 'YYYY-MM-DD HH:mm') {
          const [datePart, timePart] = val.split(' ')
          if (datePart && timePart) {
            const timeParts = timePart.split(':').map(Number) // time parts
            if (timeParts[0] && timeParts[1]) [hour, minute] = timeParts
            const dateParts = datePart.split('-').map(Number) // date parts
            if (dateParts[0] && dateParts[1] && dateParts[2]) [year, month, day] = dateParts
          } else return false
        } else if (maskDate === 'HH:mm') {
          const timeParts = val.split(':').map(Number)
          if (timeParts[0] && timeParts[1]) [hour, minute] = timeParts
        } else {
          const dateParts = val.split('-').map(Number)
          if (dateParts[0] && dateParts[1] && dateParts[2]) {
            ;[year, month, day] = dateParts
          } else return false
        }

        // Validations
        if (maskDate !== 'HH:mm') {
          if (year && year < 1900) return false
          if (month <= 0 || month > 12) return false
          if (day <= 0 || day > 31) return false
        }
        if (hour > 23) return false
        if (minute > 59) return false
      }
      return true
    } catch (error) {
      console.error('Error validating date', error)
      return false
    }
  },
  validateRequired(val: string | null): boolean {
    val = `${val}`
    return val !== 'null' && val.trim() !== ''
  },
  validateNumber(val: string, required = false): boolean {
    const isNumber = /^-?\d*\.?\d*$/.test(val)
    if (!isNumber) {
      if (required) return this.validateRequired(val)
      return val === null || val === ''
    }
    return true
  }
}
