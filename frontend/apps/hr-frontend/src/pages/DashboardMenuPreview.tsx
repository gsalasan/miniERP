import React from 'react';
import DashboardMenu from '../components/DashboardMenu';

// Dummy data for attendance records
const dummyAttendance = [
  { id: 1, type: 'Check In', time: '09:32', note: '+6.858728852319176, 107.574601...' },
  { id: 2, type: 'Check Out', time: '17:01', note: '+6.858728852319176, 107.574601...' },
];

export default function DashboardMenuPreview() {
  return (
    <div style={{ padding: 32, background: '#f4f4f4', minHeight: '100vh' }}>
      <DashboardMenu attendanceRecords={dummyAttendance} />
    </div>
  );
}
