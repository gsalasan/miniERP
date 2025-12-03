
import React from 'react';
import LocationDisplay from './LocationDisplay';

type RecordItem = {
  id?: string | number;
  type?: string; // Check In / Check Out
  time: string;
  note?: string;
};

interface AttendanceHistoryProps {
  records?: RecordItem[];
  maxItems?: number;
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ records = [], maxItems = 5 }) => {
  const list = records.slice(0, maxItems);
  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ marginBottom: 8 }}>Riwayat Absen</h4>
      {list.length === 0 ? (
        <div style={{ color: '#666' }}>Belum ada riwayat absen.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {list.map((r, i) => (
            <li key={r.id ?? i} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{r.type || 'Check'}</div>
                <div style={{ fontSize: 13, color: '#444' }}>
                  {r.time && r.time.includes('-') ? (
                    <>
                      <span>Check In: {r.time.split('-')[0].trim()}</span>
                      {r.time.split('-')[1] && (
                        <span style={{ marginLeft: 12 }}>Check Out: {r.time.split('-')[1].trim()}</span>
                      )}
                    </>
                  ) : (
                    r.time
                  )}
                </div>
                {r.note && <LocationDisplay coordsOrAddress={r.note} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AttendanceHistory;
