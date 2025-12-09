import Cfunction from './function'

export const Constant = {
  ...Cfunction,
  modalBodyHeight: null,
  numberPrecision: 3,
  moneyPrecision: 2,
  colors(val: number) {
    const col = ['white', 'positive', 'info', 'accent', 'primary', 'negative', 'secondary', 'dark']
    const i = val
    if (i >= 0) return col[i]
    else return 'primary'
  },
  default: [
    { id: 1, name: 'Yes' },
    { id: 0, name: 'No' }
  ],
  active: [
    { id: 1, name: 'Active' },
    { id: 0, name: 'Inactive' }
  ],
  years: [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039, 2040],
  quartals: [1, 2, 3, 4],
  groupSp: ['dashboard_item'],
  language: ['ID', 'EN'],
  gender: ['Male / Laki-laki', 'Female / Perempuan'],
  religions: ['Islam', 'Kristen Katolik', 'Kristen Protestan', 'Hindu', 'Buddha', 'konghucu', 'Lainnya'],
  csvdelimiter: [
    { id: ';', name: 'Semicolon (;)' },
    { id: ',', name: 'Comma (,)' }
  ],
  // CONSTANT
  componentTesting: [
    { name: 'form-examples', label: 'Form Examples', query: {} },
    { name: 'generator', label: 'Generator', query: {} },
    { name: 'qr-code-testing', label: 'QR Code Testing', query: {} }
    // {name: 'gmaps-testing', label: 'GMaps Testing', query: {} },
    // {name: 'calendar-testing', label: 'Calendar Testing', query: {} },
    // {name: 'gantt-testing', label: 'Gantt Chart Testing', query: {} }
  ],
  weekdays: [
    { label: 'Monday', value: 'monday' },
    { label: 'Tuesday', value: 'tuesday' },
    { label: 'Wednesday', value: 'wednesday' },
    { label: 'Thursday', value: 'thursday' },
    { label: 'Friday', value: 'friday' },
    { label: 'Saturday', value: 'saturday' },
    { label: 'Sunday', value: 'sunday' }
  ],
  month_days() {
    return Array.from({ length: 31 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }))
  },

  main: {
    apps: ['identity', 'crm', 'engineering', 'finance', 'hr', 'procurement', 'project'],
    auth: {
      event_notifications: {
        channel: [
          { label: 'Email', value: 'email' },
          { label: 'Push', value: 'push' }
        ],
        schedule_type: [
          { label: 'Day', value: 'day' },
          { label: 'CRUD', value: 'crud' },
          { label: 'Event Based', value: 'event_based' },
          { label: 'Custom', value: 'custom' }
        ],
        crud_events: {
          label: { label: 'Data identifier' },
          type: { label: 'CRUD Event' },
          user: { label: 'Username who triggered it' }
        }
      }
    },
    transaction: {
      approvals: {
        status: ['Pending', 'Ongoing', 'Reject', 'Approve']
      },
    }
  }
}
