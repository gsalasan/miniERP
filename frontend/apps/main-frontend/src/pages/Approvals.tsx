import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PermissionRequest,
  OvertimeRequest,
  ReimbursementRequest,
  LeaveRequest,
} from '../api/requests';
import {
  getTeamRequests,
  getAllApprovalRequests,
  approveRequest,
  rejectRequest,
} from '../api/approvals';
import { addNotification } from '../api/notifications';
import { SuccessNotification } from '../components/SuccessNotification';

type AllRequest = (PermissionRequest | OvertimeRequest | ReimbursementRequest | LeaveRequest) & {
  requestType: 'permission' | 'overtime' | 'reimbursement' | 'leave';
  employee?: {
    id?: string;
    full_name: string;
    position: string;
    department?: string;
  };
};

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState<AllRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AllRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [isHRAdmin, setIsHRAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [historyRequests, setHistoryRequests] = useState<AllRequest[]>([]);
  // Notification popup state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error',
  });

  // Add keyframe animation for spinner
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Check for tab query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'history') {
      setActiveTab('history');
    }
  }, [searchParams]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found');
      }
      const user = JSON.parse(userStr);
      
      let data;
      
      // Check if user is HR Admin or Manager
      if (user.roles && user.roles.includes('HR_ADMIN')) {
        // HR Admin - get all requests
        data = await getAllApprovalRequests();
        setIsHRAdmin(true);
      } else if (user.employee_id) {
        // Manager - get team requests
        data = await getTeamRequests(user.employee_id);
        setIsManager(true);
      } else {
        throw new Error('No access to approvals');
      }

      // Flatten all requests into single array - PENDING only
      const allRequests: AllRequest[] = [
        ...data.leave_requests.map((r: any) => ({ ...r, requestType: 'leave' as const })),
        ...data.permission_requests.map((r: any) => ({ ...r, requestType: 'permission' as const })),
        ...data.overtime_requests.map((r: any) => ({ ...r, requestType: 'overtime' as const })),
        ...data.reimbursement_requests.map((r: any) => ({ ...r, requestType: 'reimbursement' as const })),
      ].filter(r => r.status === 'PENDING');

      // Get history (approved/rejected) - need to fetch all and filter
      const historyRequests: AllRequest[] = [
        ...data.leave_requests.map((r: any) => ({ ...r, requestType: 'leave' as const })),
        ...data.permission_requests.map((r: any) => ({ ...r, requestType: 'permission' as const })),
        ...data.overtime_requests.map((r: any) => ({ ...r, requestType: 'overtime' as const })),
        ...data.reimbursement_requests.map((r: any) => ({ ...r, requestType: 'reimbursement' as const })),
      ].filter(r => r.status !== 'PENDING');

      console.log('🔍 All data from API:', data);
      console.log('📋 History requests filtered:', historyRequests);

      // Sort by created_at desc
      allRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      historyRequests.sort((a, b) => {
        const aTime = (a.approved_at || a.updated_at || a.created_at) as string;
        const bTime = (b.approved_at || b.updated_at || b.created_at) as string;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
      
      setRequests(allRequests);
      setHistoryRequests(historyRequests);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const getRequestLabel = (req: AllRequest) => {
    switch (req.requestType) {
      case 'leave': return 'Leave';
      case 'permission': return 'Permission';
      case 'overtime': return 'Overtime';
      case 'reimbursement': return 'Reimbursement';
    }
  };

  const getRequestEmployee = (req: AllRequest) => {
    // Use employee data from backend
    if (req.employee) {
      return req.employee.full_name;
    }
    return `EMP-${req.employee_id}`;
  };

  const getRequestDescription = (req: AllRequest) => {
    if (req.requestType === 'leave') {
      const r = req as any;
      return `${r.leave_type} - ${r.reason || 'No reason provided'}`;
    } else if (req.requestType === 'permission') {
      const r = req as PermissionRequest;
      return `${r.permission_type} - ${r.reason}`;
    } else if (req.requestType === 'overtime') {
      const r = req as OvertimeRequest;
      return `${r.overtime_code} - ${r.description}`;
    } else {
      const r = req as ReimbursementRequest;
      return `${r.reimbursement_type} - Rp ${r.amount.toLocaleString()}`;
    }
  };

  const getRequestDate = (req: AllRequest) => {
    if (req.requestType === 'leave') {
      const r = req as any;
      return `${new Date(r.start_date).toLocaleDateString('id-ID')} - ${new Date(r.end_date).toLocaleDateString('id-ID')}`;
    } else if (req.requestType === 'permission') {
      const r = req as PermissionRequest;
      return `${new Date(r.start_time).toLocaleDateString('id-ID')} - ${new Date(r.end_time).toLocaleDateString('id-ID')}`;
    } else if (req.requestType === 'overtime') {
      const r = req as OvertimeRequest;
      return new Date(r.overtime_date).toLocaleDateString('id-ID');
    } else {
      const r = req as ReimbursementRequest;
      return new Date(r.claim_date).toLocaleDateString('id-ID');
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found');
      }
      const user = JSON.parse(userStr);

      // Call new approval API
      await approveRequest(
        selectedRequest.requestType as any,
        selectedRequest.id,
        user.employee_id
      );

      // Add notification for the REQUESTER (employee who submitted the request)
      // NOT for the approver or all users
      if (selectedRequest.employee_id) {
        addNotification({
          userId: selectedRequest.employee_id, // Send notification to requester only
          type: selectedRequest.requestType,
          action: 'approved',
          title: `${getRequestLabel(selectedRequest)} Request Approved`,
          message: `Your ${selectedRequest.requestType} request has been approved`,
        });
      }

      setShowDetailModal(false);
      setSelectedRequest(null);
      await loadRequests();
      
      // Show success notification popup
      setNotificationData({
        title: 'Request Approved!',
        message: `${getRequestLabel(selectedRequest)} request has been approved successfully`,
        type: 'success',
      });
      setShowNotification(true);
    } catch (err: any) {
      setError(err.message || 'Failed to approve request');
      
      // Show error notification
      setNotificationData({
        title: 'Approval Failed',
        message: err.message || 'Failed to approve request',
        type: 'error',
      });
      setShowNotification(true);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      alert('Rejection reason is required');
      return;
    }

    try {
      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found');
      }
      const user = JSON.parse(userStr);

      // Call new approval API
      await rejectRequest(
        selectedRequest.requestType as any,
        selectedRequest.id,
        user.employee_id,
        rejectionReason
      );

      // Add notification for the REQUESTER (employee who submitted the request)
      // NOT for the approver or all users
      if (selectedRequest.employee_id) {
        addNotification({
          userId: selectedRequest.employee_id, // Send notification to requester only
          type: selectedRequest.requestType,
          action: 'rejected',
          title: `${getRequestLabel(selectedRequest)} Request Rejected`,
          message: `Your ${selectedRequest.requestType} request has been rejected: ${rejectionReason}`,
        });
      }

      setShowDetailModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      await loadRequests();
      
      // Show success notification popup
      setNotificationData({
        title: 'Request Rejected',
        message: `${getRequestLabel(selectedRequest)} request has been rejected`,
        type: 'success',
      });
      setShowNotification(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reject request');
      
      // Show error notification
      setNotificationData({
        title: 'Rejection Failed',
        message: err.message || 'Failed to reject request',
        type: 'error',
      });
      setShowNotification(true);
    }
  };

  const openDetailModal = (req: AllRequest) => {
    setSelectedRequest(req);
    setRejectionReason('');
    setShowDetailModal(true);
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
            onClick={() => navigate('/dashboard')}
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
            aria-label="Back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Approval Requests</h1>
        </div>
        <p style={{ fontSize: '14px', color: '#fff', opacity: 0.9, margin: 0 }}>Review and manage employee requests</p>
      </div>

      <div style={{ padding: '0 16px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '16px',
          borderBottom: '2px solid #E5E7EB',
        }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'pending' ? '2px solid #d7263d' : '2px solid transparent',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 600,
              color: activeTab === 'pending' ? '#d7263d' : '#6B7280',
              cursor: 'pointer',
              marginBottom: '-2px',
            }}
          >
            Pending ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'history' ? '2px solid #d7263d' : '2px solid transparent',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 600,
              color: activeTab === 'history' ? '#d7263d' : '#6B7280',
              cursor: 'pointer',
              marginBottom: '-2px',
            }}
          >
            History ({historyRequests.length})
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ 
            background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', 
            color: '#991B1B', 
            padding: '14px 18px', 
            borderRadius: '10px', 
            marginBottom: '24px',
            border: '1px solid #FCA5A5',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            color: '#6B7280',
            background: '#FFF',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #E5E7EB',
              borderTop: '4px solid #3B82F6',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite',
            }}/>
            Loading data...
          </div>
        )}

        {/* Empty State */}
        {!loading && activeTab === 'pending' && requests.length === 0 && (
          <div
            style={{
              background: '#FFF',
              borderRadius: '16px',
              padding: '80px 20px',
              textAlign: 'center',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>No pending requests</h3>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>All requests have been processed</p>
          </div>
        )}

        {/* Pending Table */}
        {!loading && activeTab === 'pending' && requests.length > 0 && (
          <div style={{ 
            background: '#FFF', 
            borderRadius: '16px', 
            border: '1px solid #E5E7EB', 
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)', borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Receipt</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req, index) => (
                  <tr 
                    key={`${req.requestType}-${req.id}`} 
                    style={{ 
                      borderBottom: index < requests.length - 1 ? '1px solid #F3F4F6' : 'none',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '18px 20px', fontSize: '14px', color: '#111827', fontWeight: 600 }}>{getRequestEmployee(req)}</td>
                    <td style={{ padding: '18px 20px', fontSize: '14px', color: '#111827', fontWeight: 600 }}>{getRequestLabel(req)}</td>
                    <td style={{ padding: '18px 20px', fontSize: '14px', color: '#6B7280' }}>{getRequestDate(req)}</td>
                    <td style={{ padding: '18px 20px', fontSize: '14px', color: '#6B7280', maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getRequestDescription(req)}
                    </td>
                    <td style={{ padding: '18px 20px' }}>
                      {req.requestType === 'reimbursement' && (req as ReimbursementRequest).receipt_url ? (
                        <a
                          href={(req as ReimbursementRequest).receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                            color: '#FFF',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                          View
                        </a>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#9CA3AF' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '18px 20px' }}>
                      <button
                        onClick={() => openDetailModal(req)}
                        style={{
                          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 18px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* History Table */}
        {!loading && activeTab === 'history' && (
          historyRequests.length === 0 ? (
            <div
              style={{
                background: '#FFF',
                borderRadius: '16px',
                padding: '80px 20px',
                textAlign: 'center',
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>No history yet</h3>
              <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Approved or rejected requests will appear here</p>
            </div>
          ) : (
            <div style={{ 
              background: '#FFF', 
              borderRadius: '16px', 
              border: '1px solid #E5E7EB', 
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)', borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Receipt</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Processed</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRequests.map((req, index) => (
                    <tr 
                      key={`${req.requestType}-${req.id}`} 
                      style={{ 
                        borderBottom: index < historyRequests.length - 1 ? '1px solid #F3F4F6' : 'none',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '18px 20px', fontSize: '14px', color: '#111827', fontWeight: 600 }}>{getRequestEmployee(req)}</td>
                      <td style={{ padding: '18px 20px', fontSize: '14px', color: '#111827', fontWeight: 600 }}>{getRequestLabel(req)}</td>
                      <td style={{ padding: '18px 20px', fontSize: '14px', color: '#6B7280' }}>{getRequestDate(req)}</td>
                      <td style={{ padding: '18px 20px', fontSize: '14px', color: '#6B7280', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {getRequestDescription(req)}
                      </td>
                      <td style={{ padding: '18px 20px' }}>
                        {req.requestType === 'reimbursement' && (req as ReimbursementRequest).receipt_url ? (
                          <a
                            href={(req as ReimbursementRequest).receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                              color: '#FFF',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 600,
                              textDecoration: 'none',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5"/>
                              <polyline points="21 15 16 10 5 21"/>
                            </svg>
                            View
                          </a>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '18px 20px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: req.status === 'APPROVED' ? '#D1FAE5' : '#FEE2E2',
                          color: req.status === 'APPROVED' ? '#065F46' : '#991B1B',
                        }}>
                          {req.status === 'APPROVED' ? '✓ Approved' : '✗ Rejected'}
                        </span>
                      </td>
                      <td style={{ padding: '18px 20px', fontSize: '13px', color: '#6B7280' }}>
                        {new Date((req as any).approved_at || (req as any).updated_at || req.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
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
          }}
          onClick={() => {
            setShowDetailModal(false);
            setSelectedRequest(null);
            setRejectionReason('');
          }}
        >
          <div
            style={{
              background: '#FFF',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600, color: '#1F2937' }}>
              {getRequestLabel(selectedRequest)} Request Details
            </h2>

            {/* Request Details */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Employee</div>
                <div style={{ fontSize: '14px', color: '#1F2937', fontWeight: 500 }}>{getRequestEmployee(selectedRequest)}</div>
                {selectedRequest.employee?.position && (
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{selectedRequest.employee.position}</div>
                )}
              </div>

              {selectedRequest.requestType === 'leave' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Leave Type</div>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>{(selectedRequest as any).leave_type}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Date</div>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>{getRequestDate(selectedRequest)}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Total Days</div>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>{(selectedRequest as any).total_days} days</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Reason</div>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>{(selectedRequest as any).reason || 'No reason provided'}</div>
                  </div>
                </>
              )}

              {selectedRequest.requestType === 'permission' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Permission Type</div>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>{(selectedRequest as PermissionRequest).permission_type}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Date</div>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>{getRequestDate(selectedRequest)}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Duration</div>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>{(selectedRequest as PermissionRequest).duration_hours} hours</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Reason</div>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>{(selectedRequest as PermissionRequest).reason}</div>
                  </div>
                </>
              )}

              {selectedRequest.requestType === 'overtime' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Date</div>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>{getRequestDate(selectedRequest)}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Time</div>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>
                      {new Date((selectedRequest as OvertimeRequest).start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date((selectedRequest as OvertimeRequest).end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Overtime Code</div>
                    <div style={{ fontSize: '14px', color: '#1F2937', fontWeight: 500 }}>{(selectedRequest as OvertimeRequest).overtime_code}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Duration</div>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>{(selectedRequest as OvertimeRequest).duration_hours} hours</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Work Description</div>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>{(selectedRequest as OvertimeRequest).description}</div>
                  </div>
                </>
              )}

              {selectedRequest.requestType === 'reimbursement' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Reimbursement Type</div>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>{(selectedRequest as ReimbursementRequest).reimbursement_type}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Date</div>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>{getRequestDate(selectedRequest)}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Amount</div>
                    <div style={{ fontSize: '14px', color: '#1F2937', fontWeight: 600 }}>Rp {(selectedRequest as ReimbursementRequest).amount.toLocaleString()}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Description</div>
                    <div style={{ fontSize: '14px', color: '#1F2937' }}>{(selectedRequest as ReimbursementRequest).description}</div>
                  </div>
                  {(selectedRequest as any).location && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Location</div>
                      <div style={{
                        background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
                        border: '1px solid #E5E7EB',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', color: '#1F2937', fontWeight: 500, lineHeight: '1.5' }}>
                            {(selectedRequest as any).location}
                          </div>
                          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M12 6v6l4 2"/>
                            </svg>
                            Submitted location
                          </div>
                        </div>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'not-allowed',
                          opacity: 0.7,
                        }} title="Location verified">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <path d="M9 11l3 3L22 4"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                  {(selectedRequest as ReimbursementRequest).receipt_file && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Receipt/Proof</div>
                      <a href={(selectedRequest as ReimbursementRequest).receipt_file} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: '#3B82F6' }}>
                        View Receipt
                      </a>
                    </div>
                  )}
                </>
              )}

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Submitted at</div>
                <div style={{ fontSize: '14px', color: '#1F2937' }}>{new Date(selectedRequest.created_at).toLocaleString('id-ID')}</div>
              </div>
            </div>

            {/* Rejection Reason Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Rejection Reason (if rejected)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
                placeholder="Enter reason if you will reject this request..."
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                style={{
                  flex: 1,
                  background: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.4)';
                }}
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.4)';
                }}
              >
                Approve
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
