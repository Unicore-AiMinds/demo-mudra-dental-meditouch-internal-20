import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuditLog } from './AuditLogContext';
import { useAuth } from './AuthContext';

// Notification interface
export interface Notification {
  id: string;
  type: 'appointment' | 'patient' | 'prescription' | 'lab' | 'security' | 'user';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
  auditLogId: string;
}

// Context type
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  isLoading: boolean;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { auditLogs, isLoading: auditLoading } = useAuditLog();
  const { user } = useAuth();

  // Get read notifications from localStorage
  const getReadNotifications = useCallback((): Set<string> => {
    try {
      const stored = localStorage.getItem('readNotifications');
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  }, []);

  // Save read notifications to localStorage
  const saveReadNotifications = useCallback((readIds: Set<string>) => {
    try {
      localStorage.setItem('readNotifications', JSON.stringify(Array.from(readIds)));
    } catch (error) {
      console.error('Failed to save read notifications:', error);
    }
  }, []);

  // Transform audit log to notification
  const transformAuditLogToNotification = useCallback((auditLog: any, isRead: boolean): Notification | null => {
    const { id, action_category, action_type, user_name, timestamp, target_entity, details, target_id } = auditLog;

    // Filter only useful notification types - using actual action_type values from your database
    const notificationConfig: Record<string, Record<string, { type: Notification['type'], priority: Notification['priority'], getTitle: (log: any) => string, getMessage: (log: any) => string, getActionUrl?: (log: any) => string }>> = {
      appointment: {
        'Create Appointment': {
          type: 'appointment',
          priority: 'low',
          getTitle: () => 'New Appointment Scheduled',
          getMessage: (log) => {
            // Extract patient and service from details: "Created appointment for Dilip Page - Service: Check Up And X-ray, Date: 2025-09-29, Time: 12:30 PM"
            const match = log.details.match(/Created appointment for (.+?) - Service: (.+?), Date: (.+?), Time: (.+?)(?:,|$)/);
            if (match) {
              const [, patient, service, date, time] = match;
              return `${patient} - ${service} at ${time}`;
            }
            return log.details;
          },
          getActionUrl: () => '/appointments'
        },
        'Cancel Appointment': {
          type: 'appointment',
          priority: 'high',
          getTitle: () => 'Appointment Cancelled',
          getMessage: (log) => {
            // Extract patient and service from details
            const match = log.details.match(/Cancelled appointment for (.+?) - Service: (.+?), Date: (.+?), Time: (.+?)(?:,|$)/);
            if (match) {
              const [, patient, service, date, time] = match;
              return `${patient} - ${service} at ${time}`;
            }
            return log.details;
          },
          getActionUrl: () => '/appointments'
        },
        'Update Appointment': {
          type: 'appointment',
          priority: 'medium',
          getTitle: () => 'Appointment Rescheduled',
          getMessage: (log) => {
            // Extract patient info from details
            const match = log.details.match(/Updated appointment for (.+?) -/);
            if (match) {
              return `${match[1]} - appointment updated`;
            }
            return log.details;
          },
          getActionUrl: () => '/appointments'
        },
        'Complete Appointment': {
          type: 'appointment',
          priority: 'medium',
          getTitle: () => 'Appointment Completed',
          getMessage: (log) => {
            // Extract patient and service from details: "Completed appointment for Asmi Madne - Service: Ortho [braces], Date: 2025-09-27, Time: 6:00 PM"
            const match = log.details.match(/Completed appointment for (.+?) - Service: (.+?), Date: (.+?), Time: (.+?)(?:,|$)/);
            if (match) {
              const [, patient, service, date, time] = match;
              return `${patient} - ${service} completed`;
            }
            return log.details;
          },
          getActionUrl: () => '/appointments'
        }
      },
      patient: {
        'Create Patient': {
          type: 'patient',
          priority: 'medium',
          getTitle: () => 'New Patient Registered',
          getMessage: (log) => {
            // Extract patient name from details: "Created new patient record for Soham Dharmadhikari"
            const match = log.details.match(/Created new patient record for (.+)/);
            if (match) {
              return `${match[1]} - registered by ${log.user_name}`;
            }
            return log.details;
          },
          getActionUrl: (log) => log.target_id ? `/patients/${log.target_id}` : '/patients'
        }
      },
      lab: {
        'Complete Lab Work': {
          type: 'lab',
          priority: 'high',
          getTitle: () => 'Lab Work Completed',
          getMessage: (log) => `Lab work completed by ${log.user_name}`,
          getActionUrl: () => '/lab-work'
        },
        'Update Lab Status': {
          type: 'lab',
          priority: 'high',
          getTitle: () => 'Lab Results Ready',
          getMessage: (log) => `Lab results updated by ${log.user_name}`,
          getActionUrl: () => '/lab-work'
        }
      },
      auth: {
        'Login Failed': {
          type: 'security',
          priority: 'high',
          getTitle: () => 'Failed Login Attempt',
          getMessage: (log) => `Failed login attempt detected`,
        }
      },
      lab: {
        'Update Lab Work': {
          type: 'lab',
          priority: 'high',
          getTitle: (log) => {
            if (log.details.includes('→ "completed"')) {
              return 'Lab Work Completed';
            } else if (log.details.includes('→ "ready"')) {
              return 'Lab Results Ready';
            }
            return 'Lab Work Updated';
          },
          getMessage: (log) => {
            if (log.details.includes('→ "completed"')) {
              return `Lab work completed - ${log.details.split(' for ')[1]?.split(':')[0] || 'Patient'}`;
            } else if (log.details.includes('→ "ready"')) {
              return `Lab results are ready - ${log.details.split(' for ')[1]?.split(':')[0] || 'Patient'}`;
            }
            return `Lab work status updated by ${log.user_name}`;
          },
          getActionUrl: () => '/lab-work'
        }
      }
    };

    const categoryConfig = notificationConfig[action_category];
    if (!categoryConfig) return null;

    const actionConfig = categoryConfig[action_type];
    if (!actionConfig) return null;

    // Role-based filtering for user notifications (admin only)
    if (action_category === 'user' && user?.role !== 'admin') {
      return null;
    }

    // Special filtering for lab work - only show completed or ready status changes
    if (action_category === 'lab' && action_type === 'Update Lab Work') {
      const isCompleted = details.includes('→ "completed"');
      const isReady = details.includes('→ "ready"');
      if (!isCompleted && !isReady) {
        return null; // Filter out other lab status changes
      }
    }

    return {
      id: `notification-${id}`,
      type: actionConfig.type,
      title: actionConfig.getTitle(auditLog),
      message: actionConfig.getMessage(auditLog),
      timestamp,
      isRead,
      actionUrl: actionConfig.getActionUrl?.(auditLog),
      priority: actionConfig.priority,
      auditLogId: id
    };
  }, [user?.role]);

  // Process audit logs into notifications
  const processNotifications = useCallback(() => {
    if (auditLoading || !auditLogs.length) {
      setIsLoading(auditLoading);
      return;
    }

    setIsLoading(true);

    try {
      const readIds = getReadNotifications();
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Filter audit logs from last 48 hours and transform to notifications
      const recentNotifications = auditLogs
        .filter(log => {
          const logTime = new Date(log.timestamp);
          return logTime >= twoDaysAgo;
        })
        .map(log => transformAuditLogToNotification(log, readIds.has(`notification-${log.id}`)))
        .filter((notification): notification is Notification => notification !== null)
        .sort((a, b) => {
          // Sort by priority first (high -> medium -> low), then by timestamp within each priority
          const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;

          // Within same priority, sort by timestamp (newest first)
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        })
        .slice(0, 200); // Limit to 200 most recent notifications

      // Group similar notifications (e.g., multiple failed logins from same user)
      const groupedNotifications = recentNotifications.reduce((acc, notification) => {
        if (notification.type === 'security' && notification.title === 'Failed Login Attempt') {
          const existing = acc.find(n =>
            n.type === 'security' &&
            n.title === 'Failed Login Attempt' &&
            n.message.includes(notification.message.split(' ')[4]) // same username
          );

          if (existing) {
            // Update existing notification instead of creating duplicate
            existing.message = existing.message.replace(/Failed login attempt/, 'Multiple failed login attempts');
            existing.priority = 'high';
            return acc;
          }
        }

        acc.push(notification);
        return acc;
      }, [] as Notification[]);

      setNotifications(groupedNotifications.slice(0, 50)); // Show max 50 notifications
    } catch (error) {
      console.error('Error processing notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [auditLogs, auditLoading, getReadNotifications, transformAuditLogToNotification]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    const readIds = getReadNotifications();
    readIds.add(notificationId);
    saveReadNotifications(readIds);

    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, [getReadNotifications, saveReadNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    const readIds = getReadNotifications();
    notifications.forEach(notification => {
      readIds.add(notification.id);
    });
    saveReadNotifications(readIds);

    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  }, [notifications, getReadNotifications, saveReadNotifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  // Process notifications when audit logs change
  useEffect(() => {
    processNotifications();
  }, [processNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};