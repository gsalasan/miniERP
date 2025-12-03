// Simple notification system using localStorage
// Note: Notifications are now scoped per user to prevent cross-user notification leaks
export interface Notification {
  id: string;
  userId: string; // User ID who should receive this notification
  type: 'permission' | 'leave' | 'overtime' | 'reimbursement';
  action: 'approved' | 'rejected';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const STORAGE_KEY = 'app_notifications';

// Get current user ID from localStorage
const getCurrentUserId = (): string | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user.id || user.employee_id || null;
  } catch {
    return null;
  }
};

export const getNotifications = (): Notification[] => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return [];
    
    const stored = localStorage.getItem(STORAGE_KEY);
    const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
    
    // Only return notifications for current user
    return allNotifications.filter(n => n.userId === currentUserId);
  } catch {
    return [];
  }
};

export const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
    
    const newNotif: Notification = {
      ...notif,
      id: Date.now().toString() + Math.random().toString(36),
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    allNotifications.unshift(newNotif);
    
    // Keep only last 200 notifications globally (across all users)
    const trimmed = allNotifications.slice(0, 200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    
    return newNotif;
  } catch (error) {
    console.error('Error adding notification:', error);
    return null;
  }
};

export const markAsRead = (id: string) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
    const updated = allNotifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

export const markAllAsRead = () => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
    
    // Only mark current user's notifications as read
    const updated = allNotifications.map(n => 
      n.userId === currentUserId ? { ...n, read: true } : n
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

export const getUnreadCount = (): number => {
  return getNotifications().filter(n => !n.read).length;
};

export const clearNotifications = () => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];
    
    // Remove only current user's notifications
    const remaining = allNotifications.filter(n => n.userId !== currentUserId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};
