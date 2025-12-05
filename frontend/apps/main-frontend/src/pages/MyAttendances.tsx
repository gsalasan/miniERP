import React, { useEffect, useState } from 'react';
import { getMyAttendances } from '../api/attendance';
import { getMyPermissions, getMyLeaves } from '../api/requests';

interface AttendanceHistoryItem {
  date: string;
  checkIn?: string;
  checkOut?: string;
  note?: string;
}

interface RequestDay {
  date: string;
  type: 'permission' | 'leave';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  details?: string; // e.g., "FAMILY_EMERGENCY", "ANNUAL - 3 days"
}

// Small component: given a note string (either an address or "lat, lng"),
// resolve coordinates to a readable address using the backend reverse-geocode endpoint.
const AddressName: React.FC<{ note?: string }> = ({ note }) => {
  const [addr, setAddr] = useState<string | null>(null);

  useEffect(() => {
    if (!note) return;

    // Detect coordinate pair like "-6.865799, 107.574603"
    const m = (note || '').trim().match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
    if (!m) {
      setAddr(note);
      return;
    }

    const lat = m[1];
    const lng = m[2];
    let cancelled = false;

    const url = `http://localhost:4004/api/v1/attendances/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;
    // If no auth token, don't bother calling the protected endpoint (avoid 401)
    const token = localStorage.getItem('token');
    if (!token) {
      console.debug('[AddressName] No token in localStorage, falling back to coords');
      setAddr(`${lat}, ${lng}`);
      return;
    }

    // Add some debugging to help diagnose 401s in the browser
    console.debug('[AddressName] Fetching reverse-geocode', { url, token: token ? 'present' : 'missing' });

    fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
      .then(res => {
        console.debug('[AddressName] reverse-geocode status', res.status);
        if (res.status === 401) {
          // Token rejected — fall back to coords
          console.warn('[AddressName] reverse-geocode returned 401 Unauthorized');
          if (!cancelled) setAddr(`${lat}, ${lng}`);
          // still return a resolved Promise so chain doesn't try to parse JSON
          return Promise.resolve(null as any);
        }
        return res.json();
      })
      .then((json) => {
        if (cancelled || !json) return;
        // backend returns { data: { address: '...' } } per controller
        const address = json.data?.address || json.address || json.display_name || json.result || `${lat}, ${lng}`;
        setAddr(address);
      })
      .catch((err) => {
        console.error('[AddressName] reverse-geocode error', err);
        if (!cancelled) setAddr(`${lat}, ${lng}`);
      });

    return () => { cancelled = true; };
  }, [note]);

  if (!note) return <span>-</span>;
  if (addr === null) return <span>Loading...</span>;
  return <span>{addr}</span>;
};

export default function MyAttendancesPage() {
  const [records, setRecords] = useState<AttendanceHistoryItem[]>([]);
  const [requestDays, setRequestDays] = useState<RequestDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Fetch data
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [attendanceRes, permissionsRes, leavesRes] = await Promise.all([
          getMyAttendances(),
          getMyPermissions().catch(() => ({ data: [] })),
          getMyLeaves().catch(() => ({ data: [] })),
        ]);

        console.log('Raw attendance data:', attendanceRes.data); // Debug log
        
        const data = (attendanceRes.data || []).map((a: any) => {
          // Parse datetime to HH:MM in local time
          const formatTime = (dateTime: any) => {
            if (!dateTime) return undefined;
            const date = new Date(dateTime);
            if (isNaN(date.getTime())) return undefined;
            return date.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            });
          };
          
          return {
            date: a.date,
            checkIn: formatTime(a.check_in_time),
            checkOut: formatTime(a.check_out_time),
            note: a.check_in_location,
          };
        });
        
        setRecords(data);

        // Process permissions and leaves into RequestDay[]
        const reqDays: RequestDay[] = [];

        // Add permission days
        const permissions = Array.isArray(permissionsRes) ? permissionsRes : (permissionsRes.data || []);
        permissions.forEach((perm: any) => {
          const start = new Date(perm.start_time);
          const end = new Date(perm.end_time);
          let current = new Date(start);
          
          const details = `${perm.permission_type || 'Permission'} - ${perm.duration_hours || 0}h`;
          
          while (current <= end) {
            reqDays.push({
              date: current.toISOString().split('T')[0],
              type: 'permission',
              status: perm.status,
              details,
            });
            current.setDate(current.getDate() + 1);
          }
        });

        // Add leave days
        const leaves = Array.isArray(leavesRes) ? leavesRes : (leavesRes.data || []);
        leaves.forEach((leave: any) => {
          const start = new Date(leave.start_date);
          const end = new Date(leave.end_date);
          let current = new Date(start);
          
          const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const details = `${leave.leave_type || 'Leave'} - ${totalDays} day${totalDays > 1 ? 's' : ''}`;
          
          while (current <= end) {
            reqDays.push({
              date: current.toISOString().split('T')[0],
              type: 'leave',
              status: leave.status,
              details,
            });
            current.setDate(current.getDate() + 1);
          }
        });

        setRequestDays(reqDays);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch attendance');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Calendar logic
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const hasRecord = (date: Date): boolean => {
    return records.some(r => {
      const d = new Date(r.date);
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });
  };

  const getRequestForDate = (date: Date): RequestDay | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return requestDays.find(r => r.date === dateStr);
  };

  const getRecordsForDate = (date: Date): AttendanceHistoryItem[] => {
    return records.filter(r => {
      const d = new Date(r.date);
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });
  };

  // Calculate total hours worked
  const calculateWorkHours = (checkIn?: string, checkOut?: string): string => {
    if (!checkIn || !checkOut) return '-';
    
    const [inHour, inMin] = checkIn.split(':').map(Number);
    const [outHour, outMin] = checkOut.split(':').map(Number);
    
    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;
    
    const diffMinutes = outMinutes - inMinutes;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return `${hours} hr ${minutes} min`;
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    if (i < firstDay || i >= firstDay + daysInMonth) return null;
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i - firstDay + 1);
  });

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const selectedRecords = getRecordsForDate(selectedDate);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f7f9fc', 
      paddingBottom: '20px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      {/* Header - Mekari Style */}
      <div style={{
        background: '#d7263d',
        color: '#fff',
        padding: '20px 16px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Kembali"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Riwayat Absensi</h1>
        </div>
        <p style={{ fontSize: '13px', color: '#ffecec', margin: 0, opacity: 0.9, paddingLeft: '36px' }}>Lihat riwayat kehadiran Anda</p>
      </div>

      <div style={{ padding: '0 16px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Error */}
        {error && (
          <div style={{ 
            background: '#fff', 
            color: '#d7263d', 
            padding: '14px 16px', 
            borderRadius: '14px', 
            marginBottom: '16px',
            fontSize: '13px',
            border: '1px solid #ffecec',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ 
            background: '#fff',
            borderRadius: '14px',
            padding: '40px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          }}>
            <p style={{ color: '#98a2b3', fontSize: '14px', margin: 0 }}>Memuat data...</p>
          </div>
        )}

        {!loading && (
          <div>
            {/* Calendar */}
            <div style={{ 
              borderRadius: '14px', 
              border: '1px solid #e5e7eb',
              background: '#ffffff', 
              padding: '18px',
              marginBottom: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            }}>
              {/* Month Nav */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  style={{
                    background: '#f1f4ff',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#246bfd',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '10px',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 700, 
                  color: '#1e293b',
                }}>
                  {monthName}
                </div>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  style={{
                    background: '#f1f4ff',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#246bfd',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '10px',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>

              {/* Day names */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                {dayNames.map(day => (
                  <div key={day} style={{ 
                    textAlign: 'center', 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    color: '#98a2b3',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                {calendarDays.map((date, i) => {
                  if (!date) return <div key={i} />;

                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  const isToday = date.toDateString() === new Date().toDateString();
                  const hasData = hasRecord(date);
                  const request = getRequestForDate(date);
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

                  // Determine cell background
                  let cellBg = 'transparent';
                  let borderColor = 'transparent';
                  
                  if (isSelected) {
                    cellBg = '#d7263d';
                  } else if (isToday) {
                    cellBg = '#ffecec';
                  } else if (hasData) {
                    cellBg = '#e9f0ff';
                  }
                  
                  // Add border for requests
                  if (request && !isSelected) {
                    if (request.status === 'PENDING') {
                      borderColor = '#F59E0B';
                    } else if (request.status === 'APPROVED') {
                      borderColor = '#10B981';
                    } else if (request.status === 'REJECTED') {
                      borderColor = '#EF4444';
                    }
                  }

                  return (
                    <button
                      key={date.toString()}
                      onClick={() => setSelectedDate(date)}
                      style={{
                        aspectRatio: '1',
                        border: borderColor !== 'transparent' ? `2px solid ${borderColor}` : 'none',
                        borderRadius: '10px',
                        background: cellBg,
                        color: isSelected 
                          ? '#ffffff' 
                          : !isCurrentMonth 
                            ? '#cbd5e1' 
                            : isToday
                              ? '#d7263d'
                              : '#1e293b',
                        fontWeight: isSelected || isToday || hasData || request ? 600 : 400,
                        fontSize: '14px',
                        cursor: 'pointer',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {date.getDate()}
                      {request && !isSelected && (
                        <div style={{
                          position: 'absolute',
                          bottom: '4px',
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: borderColor,
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Details Section */}
            <div>
              <div style={{ 
                background: '#ffffff',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              }}>
                <h2 style={{ 
                  fontSize: '14px', 
                  fontWeight: 700, 
                  color: '#1e293b', 
                  margin: 0, 
                }}>
                  {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h2>
              </div>

              {/* Show request info if exists */}
              {(() => {
                const request = getRequestForDate(selectedDate);
                if (!request) return null;
                
                const statusColors = {
                  PENDING: { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74', icon: '⏳' },
                  APPROVED: { bg: '#F0FDF4', text: '#065F46', border: '#86EFAC', icon: '✓' },
                  REJECTED: { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5', icon: '✗' },
                };
                const colors = statusColors[request.status];
                
                return (
                  <div style={{
                    borderRadius: '12px',
                    border: `1.5px solid ${colors.border}`,
                    background: colors.bg,
                    padding: '14px 16px',
                    marginBottom: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: colors.text,
                      }}>
                        {colors.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '13px', 
                          fontWeight: 700, 
                          color: colors.text,
                          letterSpacing: '0.3px',
                          marginBottom: '2px',
                        }}>
                          {request.type === 'leave' ? 'Cuti' : 'Izin'} - {request.details?.split(' - ')[0] || ''}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: colors.text,
                          fontWeight: 500,
                        }}>
                          {request.details?.split(' - ')[1] || request.details || 'No details'}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: colors.text,
                        background: 'white',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {request.status === 'PENDING' ? 'Menunggu' : request.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {selectedRecords.length === 0 ? (
                <div style={{
                  borderRadius: '14px',
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  padding: '40px 20px',
                  textAlign: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#98a2b3', 
                    fontWeight: 400, 
                  }}>
                      Tidak ada data absensi
                  </div>
                </div>
              ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {selectedRecords.map((rec, idx) => (
                      <div
                        key={idx}
                        style={{
                          borderRadius: '14px',
                          border: '1px solid #e5e7eb',
                          background: '#ffffff',
                          padding: '16px',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: rec.note ? '16px' : '0' }}>
                          {/* Check In */}
                          <div>
                            <div style={{ 
                              fontSize: '10px', 
                              color: '#98a2b3', 
                              fontWeight: 600, 
                              marginBottom: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px',
                            }}>
                              Masuk
                            </div>
                            <div style={{ 
                              fontSize: '18px', 
                              fontWeight: 700, 
                              color: '#1e293b',
                            }}>
                              {rec.checkIn || '—'}
                            </div>
                          </div>

                          {/* Check Out */}
                          <div>
                            <div style={{ 
                              fontSize: '10px', 
                              color: '#98a2b3', 
                              fontWeight: 600, 
                              marginBottom: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px',
                            }}>
                              Keluar
                            </div>
                            <div style={{ 
                              fontSize: '18px', 
                              fontWeight: 700, 
                              color: rec.checkOut ? '#1e293b' : '#cbd5e1',
                            }}>
                              {rec.checkOut || '—'}
                            </div>
                          </div>

                          {/* Total Hours */}
                          {rec.checkIn && rec.checkOut && (
                            <div>
                              <div style={{ 
                                fontSize: '10px', 
                                color: '#98a2b3', 
                                fontWeight: 600, 
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                              }}>
                                Total Jam
                              </div>
                              <div style={{ 
                                fontSize: '18px', 
                                fontWeight: 700, 
                                color: '#1e293b',
                              }}>
                                {calculateWorkHours(rec.checkIn, rec.checkOut)}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {rec.note && (
                          <div style={{ 
                            paddingTop: '16px', 
                            borderTop: '1px solid #e5e7eb',
                          }}>
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#d7263d', 
                              fontWeight: 700, 
                              marginBottom: '12px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                              Lokasi Absen
                            </div>
                            
                            {/* Map Preview Card */}
                            {(() => {
                              // Extract coordinates from rec.note
                              const match = (rec.note || '').trim().match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
                              const lat = match ? match[1] : null;
                              const lng = match ? match[2] : null;
                              
                              return (
                                <div style={{
                                  background: '#ffffff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '14px',
                                  overflow: 'hidden',
                                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                                }}>
                                  {/* Embedded Google Maps view without interaction */}
                                  <div style={{
                                    position: 'relative',
                                    height: '200px',
                                    background: '#f0f4f8',
                                    borderBottom: '1px solid #e5e7eb',
                                    overflow: 'hidden',
                                  }}>
                                    {lat && lng ? (
                                      <iframe
                                        src={`https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                                        title="Lokasi Absen"
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          border: 0,
                                          filter: 'grayscale(0.03)',
                                          pointerEvents: 'none',
                                        }}
                                        loading="lazy"
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      <div style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#94a3b8',
                                        fontSize: '13px',
                                      }}>
                                        Lokasi tidak tersedia
                                      </div>
                                    )}

                                    <div style={{
                                      position: 'absolute',
                                      top: '12px',
                                      right: '12px',
                                      background: 'rgba(255,255,255,0.95)',
                                      backdropFilter: 'blur(8px)',
                                      padding: '6px 12px',
                                      borderRadius: '8px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      color: '#64748b',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                    }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                      </svg>
                                      View Only
                                    </div>
                                  </div>
                                  
                                  {/* Address Info */}
                                  <div style={{ padding: '16px' }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: '12px',
                                    }}>
                                      {/* Pin Icon */}
                                      <div style={{
                                        width: '40px',
                                        height: '40px',
                                        minWidth: '40px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #d7263d 0%, #b91c33 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 12px rgba(215, 38, 61, 0.25)',
                                      }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                          <circle cx="12" cy="10" r="3"/>
                                        </svg>
                                      </div>
                                      
                                      {/* Address Details */}
                                      <div style={{ flex: 1 }}>
                                        <div style={{ 
                                          fontSize: '10px', 
                                          color: '#98a2b3',
                                          fontWeight: 600,
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.3px',
                                          marginBottom: '6px',
                                        }}>
                                          Alamat Lengkap
                                        </div>
                                        <div style={{ 
                                          fontSize: '14px', 
                                          color: '#1e293b',
                                          fontWeight: 600,
                                          lineHeight: '1.5',
                                          marginBottom: '8px',
                                        }}>
                                          <AddressName note={rec.note} />
                                        </div>
                                      </div>
                                      
                                      {/* Verified Badge */}
                                      <div style={{
                                        width: '36px',
                                        height: '36px',
                                        minWidth: '36px',
                                        borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5">
                                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                          <polyline points="22 4 12 14.01 9 11.01"/>
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
