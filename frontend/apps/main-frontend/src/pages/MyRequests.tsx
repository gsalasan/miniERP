import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMyPermissions,
  getMyOvertimes,
  getMyReimbursements,
  getMyLeaves,
  createPermissionRequest,
  createOvertimeRequest,
  createReimbursementRequest,
  createLeaveRequest,
  PermissionRequest,
  OvertimeRequest,
  ReimbursementRequest,
  LeaveRequest,
  cancelPermission,
  cancelOvertime,
  cancelReimbursement,
  cancelLeave,
} from '../api/requests';
import { SuccessNotification } from '../components/SuccessNotification';

type AllRequest = (PermissionRequest | OvertimeRequest | ReimbursementRequest | LeaveRequest) & {
  requestType: 'permission' | 'overtime' | 'reimbursement' | 'leave';
};

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<AllRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [requestType, setRequestType] = useState<'permission' | 'overtime' | 'reimbursement' | 'leave' | ''>('');
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  // Notification popup state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error',
  });

  // Add keyframe animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleIn {
        from { 
          opacity: 0;
          transform: scale(0.95);
        }
        to { 
          opacity: 1;
          transform: scale(1);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const [permissions, overtimes, reimbursements, leaves] = await Promise.all([
        getMyPermissions(),
        getMyOvertimes(),
        getMyReimbursements(),
        getMyLeaves(),
      ]);

      const allRequests: AllRequest[] = [
        ...permissions.map((r) => ({ ...r, requestType: 'permission' as const })),
        ...overtimes.map((r) => ({ ...r, requestType: 'overtime' as const })),
        ...reimbursements.map((r) => ({ ...r, requestType: 'reimbursement' as const })),
        ...leaves.map((r) => ({ ...r, requestType: 'leave' as const })),
      ];

      // Sort by created_at desc
      allRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRequests(allRequests);
    } catch (err: any) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCancelRequest = async (req: AllRequest) => {
    if (!confirm('Yakin ingin membatalkan pengajuan ini?')) return;

    try {
      if (req.requestType === 'permission') {
        await cancelPermission(req.id);
      } else if (req.requestType === 'overtime') {
        await cancelOvertime(req.id);
      } else if (req.requestType === 'leave') {
        await cancelLeave(req.id);
      } else {
        await cancelReimbursement(req.id);
      }
      alert('Pengajuan berhasil dibatalkan');
      loadRequests();
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan pengajuan');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: { bg: string; text: string } } = {
      PENDING: { bg: '#e9f0ff', text: '#246bfd' },
      APPROVED: { bg: '#E8F5E9', text: '#2E7D32' },
      REJECTED: { bg: '#ffecec', text: '#d7263d' },
      CANCELLED: { bg: '#f1f4ff', text: '#98a2b3' },
    };
    const style = styles[status] || styles.CANCELLED;
    const label = status === 'PENDING' ? 'Menunggu' : status === 'APPROVED' ? 'Disetujui' : status === 'REJECTED' ? 'Ditolak' : 'Dibatalkan';
    
    return (
      <span
        style={{
          background: style.bg,
          color: style.text,
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          display: 'inline-block',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
        }}
      >
        {label}
      </span>
    );
  };

  const getRequestLabel = (req: AllRequest) => {
    if (req.requestType === 'permission') {
      return 'Izin';
    } else if (req.requestType === 'overtime') {
      const r = req as OvertimeRequest;
      return `Lembur ${r.overtime_code}`;
    } else {
      return 'Reimbursement';
    }
  };

  const getRequestDescription = (req: AllRequest) => {
    if (req.requestType === 'permission') {
      const r = req as PermissionRequest;
      return r.reason;
    } else if (req.requestType === 'overtime') {
      const r = req as OvertimeRequest;
      return r.description;
    } else {
      const r = req as ReimbursementRequest;
      return `${r.reimbursement_type} - Rp ${r.amount.toLocaleString()}`;
    }
  };

  const getRequestDate = (req: AllRequest) => {
    if (req.requestType === 'permission') {
      const r = req as PermissionRequest;
      return new Date(r.start_time).toLocaleDateString('id-ID');
    } else if (req.requestType === 'overtime') {
      const r = req as OvertimeRequest;
      return new Date(r.overtime_date).toLocaleDateString('id-ID');
    } else {
      const r = req as ReimbursementRequest;
      return new Date(r.claim_date).toLocaleDateString('id-ID');
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);

      // Validation
      if (requestType === 'leave') {
        if (!formData.leave_type || !formData.start_date || !formData.end_date || !formData.reason) {
          setError('Semua field wajib diisi');
          return;
        }
        // Calculate duration
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        await createLeaveRequest({
          leave_type: formData.leave_type,
          start_date: new Date(formData.start_date + 'T00:00:00').toISOString(),
          end_date: new Date(formData.end_date + 'T23:59:59').toISOString(),
          duration_days: duration,
          reason: formData.reason,
        });
      } else if (requestType === 'permission') {
        if (!formData.start_time || !formData.end_time || !formData.permission_type || !formData.reason) {
          setError('Semua field wajib diisi');
          return;
        }
        // Calculate duration
        const start = new Date(formData.start_time);
        const end = new Date(formData.end_time);
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        await createPermissionRequest({
          start_time: new Date(formData.start_time + 'T00:00:00').toISOString(),
          end_time: new Date(formData.end_time + 'T23:59:59').toISOString(),
          duration_hours: duration * 8, // Assuming 8 hours per day
          permission_type: formData.permission_type,
          reason: formData.reason,
        });
      } else if (requestType === 'overtime') {
        if (!formData.overtime_date || !formData.start_time || !formData.end_time || !formData.overtime_code || !formData.description) {
          setError('Semua field wajib diisi');
          return;
        }
        // Calculate duration
        const [startHour, startMin] = formData.start_time.split(':').map(Number);
        const [endHour, endMin] = formData.end_time.split(':').map(Number);
        const duration = (endHour + endMin / 60) - (startHour + startMin / 60);

        // Create full datetime strings
        const startDateTime = new Date(`${formData.overtime_date}T${formData.start_time}:00`).toISOString();
        const endDateTime = new Date(`${formData.overtime_date}T${formData.end_time}:00`).toISOString();

        await createOvertimeRequest({
          overtime_date: new Date(formData.overtime_date + 'T00:00:00').toISOString(),
          start_time: startDateTime,
          end_time: endDateTime,
          duration_hours: duration,
          overtime_code: formData.overtime_code,
          description: formData.description,
        });
      } else if (requestType === 'reimbursement') {
        if (!formData.claim_date || !formData.reimbursement_type || !formData.amount || !formData.description) {
          setError('Semua field wajib diisi');
          return;
        }

        await createReimbursementRequest({
          reimbursement_type: formData.reimbursement_type,
          claim_date: new Date(formData.claim_date + 'T00:00:00').toISOString(),
          amount: parseFloat(formData.amount),
          description: formData.description,
          receipt_file: formData.receipt_file ? 'pending_upload' : undefined, // TODO: implement file upload
        });
      }

      // Success: close modal, refresh list
      setShowModal(false);
      const currentType = requestType; // Save before reset
      setRequestType('');
      setFormData({});
      await loadRequests();
      
      // Show success notification popup
      const typeLabels: Record<string, string> = {
        leave: 'Cuti',
        permission: 'Izin',
        overtime: 'Lembur',
        reimbursement: 'Reimbursement',
      };
      setNotificationData({
        title: 'Pengajuan Berhasil!',
        message: `Pengajuan ${typeLabels[currentType]} Anda telah berhasil dibuat dan menunggu persetujuan`,
        type: 'success',
      });
      setShowNotification(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal membuat pengajuan');
      
      // Show error notification
      setNotificationData({
        title: 'Pengajuan Gagal',
        message: err.response?.data?.message || err.message || 'Gagal membuat pengajuan',
        type: 'error',
      });
      setShowNotification(true);
    }
  };

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
            onClick={() => navigate(-1)}
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
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Pengajuan Saya</h1>
        </div>
        <p style={{ fontSize: '13px', color: '#ffecec', margin: 0, opacity: 0.9, paddingLeft: '36px' }}>Kelola izin, lembur, dan reimbursement Anda</p>
      </div>

      <div style={{ padding: '0 16px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Button Buat Pengajuan */}
        <button
          onClick={() => {
            setShowModal(true);
            setRequestType('');
            setFormData({});
          }}
          style={{
            background: '#d7263d',
            color: '#FFF',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '20px',
            width: '100%',
            boxShadow: '0 2px 10px rgba(215, 38, 61, 0.2)',
          }}
        >
          + Buat Pengajuan Baru
        </button>

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

        {/* Empty State */}
        {!loading && requests.length === 0 && (
          <div style={{ 
            background: '#fff', 
            borderRadius: '14px', 
            padding: '40px 20px', 
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          }}>
            <p style={{ color: '#98a2b3', fontSize: '13px', margin: 0 }}>Belum ada pengajuan terbaru.</p>
          </div>
        )}

        {/* List Pengajuan */}
        {!loading && requests.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.map((req) => {
              // Check if recently updated (within last 5 minutes)
              const updatedAt = req.approved_at || req.updated_at || req.created_at;
              const isRecentlyUpdated = updatedAt && 
                (new Date().getTime() - new Date(updatedAt).getTime()) < 5 * 60 * 1000 &&
                req.status !== 'PENDING';
              
              return (
                <div 
                  key={req.id}
                  style={{
                    background: isRecentlyUpdated ? '#F0FDF4' : '#fff',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    border: isRecentlyUpdated ? '2px solid #10B981' : '1px solid #e5e7eb',
                    boxShadow: isRecentlyUpdated ? '0 4px 14px rgba(16, 185, 129, 0.15)' : '0 2px 10px rgba(0,0,0,0.06)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                        {getRequestLabel(req)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#98a2b3' }}>
                        {getRequestDate(req)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                      {isRecentlyUpdated && (
                        <div style={{
                          background: '#10B981',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          whiteSpace: 'nowrap',
                        }}>
                          Updated
                        </div>
                      )}
                      {getStatusBadge(req.status)}
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px', lineHeight: '1.5' }}>
                    {getRequestDescription(req)}
                  </div>

                  {req.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancelRequest(req)}
                      style={{
                        background: '#fff',
                        color: '#d7263d',
                        border: '1px solid #d7263d',
                        borderRadius: '10px',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      Batalkan Pengajuan
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Form - Centered for Better UX */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out',
            padding: window.innerWidth <= 768 ? '20px' : '40px',
          }}
          onClick={() => {
            setShowModal(false);
            setRequestType('');
            setFormData({});
          }}
        >
          <div
            style={{
              background: '#FFF',
              borderRadius: '16px',
              padding: window.innerWidth <= 768 ? '20px' : '28px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              animation: 'scaleIn 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >

            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 700, color: '#1F2937' }}>Buat Pengajuan Baru</h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>Pilih jenis pengajuan dan isi formulir</p>
            </div>

            {/* Type Selector */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                Jenis Pengajuan <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={requestType}
                onChange={(e) => {
                  setRequestType(e.target.value as any);
                  setFormData({});
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1.5px solid #D1D5DB',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#1F2937',
                  background: '#F9FAFB',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
              >
                <option value="">-- Pilih Jenis Pengajuan --</option>
                <option value="leave">Cuti</option>
                <option value="permission">Izin</option>
                <option value="overtime">Lembur</option>
                <option value="reimbursement">Klaim Biaya</option>
              </select>
            </div>

            {/* Dynamic Form Fields */}
            {requestType === 'leave' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Jenis Cuti <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.leave_type || ''}
                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1.5px solid #D1D5DB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: '#1F2937',
                      background: '#F9FAFB',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
                  >
                    <option value="">-- Pilih Jenis Cuti --</option>
                    <option value="ANNUAL">Cuti Tahunan</option>
                    <option value="SICK">Cuti Sakit</option>
                    <option value="MATERNITY">Cuti Melahirkan</option>
                    <option value="PATERNITY">Cuti Ayah</option>
                    <option value="EMERGENCY">Cuti Darurat</option>
                    <option value="UNPAID">Cuti Tanpa Gaji</option>
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Tanggal Mulai <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1.5px solid #D1D5DB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: '#F9FAFB',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Tanggal Selesai <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1.5px solid #D1D5DB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: '#F9FAFB',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Alasan Cuti <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <textarea
                    value={formData.reason || ''}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1.5px solid #D1D5DB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: '#F9FAFB',
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
                    placeholder="Jelaskan alasan mengajukan cuti..."
                  />
                </div>
              </>
            )}

            {requestType === 'permission' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Tanggal Mulai <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_time || ''}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1.5px solid #D1D5DB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: '#F9FAFB',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Tanggal Selesai <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_time || ''}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1.5px solid #D1D5DB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: '#F9FAFB',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Tipe Izin <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.permission_type || ''}
                    onChange={(e) => setFormData({ ...formData, permission_type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1.5px solid #D1D5DB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: '#F9FAFB',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
                  >
                    <option value="">-- Pilih Tipe --</option>
                    <option value="PERSONAL">Keperluan Pribadi</option>
                    <option value="MEDICAL">Sakit/Medis</option>
                    <option value="FAMILY_EMERGENCY">Keperluan Keluarga Darurat</option>
                    <option value="OFFICIAL_BUSINESS">Urusan Dinas</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Alasan <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <textarea
                    value={formData.reason || ''}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1.5px solid #D1D5DB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: '#F9FAFB',
                      outline: 'none',
                      transition: 'all 0.2s',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                    placeholder="Jelaskan alasan izin Anda..."
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
                  />
                </div>
              </>
            )}

            {requestType === 'overtime' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                    Tanggal Lembur <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.overtime_date || ''}
                    onChange={(e) => setFormData({ ...formData, overtime_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                      Jam Mulai <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.start_time || ''}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                      Jam Selesai <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.end_time || ''}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                    Kode Lembur <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.overtime_code || ''}
                    onChange={(e) => setFormData({ ...formData, overtime_code: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">-- Pilih Kode Lembur --</option>
                    <option value="L1">L1 - Lembur Weekday 8 Jam</option>
                    <option value="L2">L2 - Lembur Weekday 4 Jam</option>
                    <option value="L3">L3 - Lembur Weekend 8 Jam</option>
                    <option value="L4">L4 - Lembur Weekend 4 Jam</option>
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                    Deskripsi Pekerjaan <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical',
                    }}
                    placeholder="Jelaskan pekerjaan yang dilakukan selama lembur..."
                  />
                </div>
              </>
            )}

            {requestType === 'reimbursement' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                    Tanggal Klaim <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.claim_date || ''}
                    onChange={(e) => setFormData({ ...formData, claim_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                    Tipe Klaim <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.reimbursement_type || ''}
                    onChange={(e) => setFormData({ ...formData, reimbursement_type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">-- Pilih Tipe Klaim --</option>
                    <option value="TRANSPORTATION">Transportasi</option>
                    <option value="MEALS">Makan</option>
                    <option value="ACCOMMODATION">Akomodasi</option>
                    <option value="COMMUNICATION">Komunikasi</option>
                    <option value="MEDICAL">Medis</option>
                    <option value="OFFICE_SUPPLIES">Perlengkapan Kantor</option>
                    <option value="TRAINING">Pelatihan</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                    Jumlah (Rp) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                    placeholder="50000"
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                    Deskripsi <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical',
                    }}
                    placeholder="Jelaskan detail pengeluaran..."
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                    Upload Struk/Bukti
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFormData({ ...formData, receipt_file: e.target.files?.[0] })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Format: JPG, PNG, PDF (Max 2MB)</p>
                </div>
              </>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setRequestType('');
                  setFormData({});
                }}
                style={{
                  flex: 1,
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#374151',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#E5E7EB')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#F3F4F6')}
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={!requestType}
                style={{
                  flex: 1,
                  background: !requestType ? '#D1D5DB' : '#d7263d',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: !requestType ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: !requestType ? 'none' : '0 2px 8px rgba(215, 38, 61, 0.25)',
                }}
                onMouseEnter={(e) => {
                  if (requestType) e.currentTarget.style.background = '#b81f31';
                }}
                onMouseLeave={(e) => {
                  if (requestType) e.currentTarget.style.background = '#d7263d';
                }}
              >
                Ajukan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Notification Popup */}
      <SuccessNotification
        show={showNotification}
        title={notificationData.title}
        message={notificationData.message}
        type={notificationData.type}
        onClose={() => setShowNotification(false)}
      />
    </div>
  );
}
