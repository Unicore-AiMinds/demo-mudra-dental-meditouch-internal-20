import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useClinic } from './ClinicContext';
import { useToast } from '@/hooks/use-toast';
import { supabaseClient } from '@/lib/supabase-config';

// Define the AuditLog type based on your database schema
export interface AuditLog {
  id: string;
  timestamp: string;
  user_id?: string;
  user_name: string;
  user_role: string;
  action_category: 'auth' | 'appointment' | 'stock' | 'lab' | 'patient' | 'user' | 'settings' | 'doctor' | 'service' | 'prescription' | 'dental_history' | 'dental_charting' | 'vital_signs' | 'role' | 'permission' | 'backup';
  action_type: string;
  target_entity: string;
  target_id?: string;
  details: string;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
  clinic_type?: 'dental' | 'meditouch';
  created_at: string;
}

// Define the context type
interface AuditLogContextType {
  auditLogs: AuditLog[];
  allUsers: string[];
  isLoading: boolean;
  fetchAuditLogs: () => Promise<void>;
  logAction: (action: Omit<AuditLog, 'id' | 'timestamp' | 'user_id' | 'user_name' | 'user_role' | 'created_at' | 'ip_address' | 'user_agent'>) => Promise<void>;
  getFilteredLogs: (filters: {
    category?: string;
    user?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
  }) => AuditLog[];
}

// Create the context
const AuditLogContext = createContext<AuditLogContextType | undefined>(undefined);

// Provider component
export const AuditLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { activeClinic } = useClinic();
  const { toast } = useToast();

  // Function to get client IP address (simplified)
  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  // Function to fetch all unique users from all audit logs (for filter dropdown)
  const fetchAllUsers = useCallback(async (): Promise<void> => {
    try {
      console.log('Fetching all users from audit logs...');
      
      const { data: allLogs, error } = await supabaseClient
        .from('audit_logs')
        .select('user_name')
        .not('user_name', 'is', null)
        .neq('user_name', 'system')
        .neq('user_name', 'System')
        .neq('user_name', 'Unknown User');

      if (error) {
        throw error;
      }

      const uniqueUsers = Array.from(new Set(allLogs?.map(log => log.user_name) || []));
      console.log(`Found ${uniqueUsers.length} unique users:`, uniqueUsers);
      setAllUsers(uniqueUsers);
    } catch (error) {
      console.error('Error fetching all users:', error);
      setAllUsers([]);
    }
  }, []);

  // Function to fetch audit logs from Supabase
  const fetchAuditLogs = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Fetching audit logs from Supabase...');
      console.log('Current active clinic:', activeClinic);

      // Build query with clinic filter if active clinic is set
      let query = supabaseClient
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000); // Limit to last 1000 entries for performance

      // Filter by clinic type if active clinic is set
      // Also include entries with no clinic_type (e.g. backup logs)
      if (activeClinic && ['dental', 'meditouch'].includes(activeClinic)) {
        console.log(`Filtering audit logs for clinic: ${activeClinic}`);
        query = query.or(`clinic_type.eq.${activeClinic},clinic_type.is.null`);
      }

      const { data: fetchedLogs, error } = await query;

      if (error) {
        throw error;
      }

      console.log(`Fetched ${fetchedLogs?.length || 0} audit logs for clinic: ${activeClinic || 'all'}`);
      setAuditLogs(fetchedLogs || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit logs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, activeClinic]);

  // Function to log an action
  const logAction = useCallback(async (action: Omit<AuditLog, 'id' | 'timestamp' | 'user_id' | 'user_name' | 'user_role' | 'created_at' | 'ip_address' | 'user_agent'>): Promise<void> => {
    try {
      console.log('=== AUDIT LOG DEBUG ===');
      console.log('User context:', user);
      console.log('Active clinic:', activeClinic);
      console.log('Action to log:', action);

      if (!user) {
        console.error('AUDIT LOG ERROR: No user logged in');
        console.log('User object is null or undefined');
        return;
      }

      console.log('Getting client IP...');
      const ip_address = await getClientIP();
      console.log('Client IP:', ip_address);

      const user_agent = navigator.userAgent;
      console.log('User agent:', user_agent);

      // Check if user.id is a valid UUID format, otherwise set to null
      const isValidUUID = (str: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      const userId = user.id && isValidUUID(user.id) ? user.id : null;

      // Validate required fields
      if (!action.action_category || !action.action_type || !action.target_entity || !action.details) {
        console.error('AUDIT LOG VALIDATION ERROR: Missing required fields');
        console.error('action_category:', action.action_category);
        console.error('action_type:', action.action_type);
        console.error('target_entity:', action.target_entity);
        console.error('details:', action.details);
        throw new Error('Missing required fields for audit log');
      }

      // Validate action_category constraint
      const validCategories = [
        'auth', 'appointment', 'stock', 'lab', 'patient', 'user',
        'settings', 'doctor', 'service', 'prescription', 'dental_history',
        'dental_charting', 'vital_signs', 'role', 'permission', 'backup'
      ];

      if (!validCategories.includes(action.action_category)) {
        console.error('AUDIT LOG VALIDATION ERROR: Invalid action_category');
        console.error('action_category:', action.action_category);
        console.error('Valid categories:', validCategories);
        throw new Error(`Invalid action_category: ${action.action_category}`);
      }

      // Use provided clinic_type or fall back to activeClinic
      const validClinicType = action.clinic_type ||
        (activeClinic && ['dental', 'meditouch'].includes(activeClinic)
          ? activeClinic as 'dental' | 'meditouch'
          : null);

      // Prepare the audit log entry with proper data types
      const auditLogEntry = {
        timestamp: new Date().toISOString(),
        user_id: userId,
        user_name: user.name || 'Unknown User',
        user_role: user.role || 'unknown',
        action_category: action.action_category,
        action_type: action.action_type,
        target_entity: action.target_entity,
        target_id: action.target_id || null,
        details: action.details,
        changes: action.changes || null,
        ip_address: ip_address || null,
        user_agent: user_agent || null,
        clinic_type: validClinicType,
      };

      console.log('=== AUDIT LOG ENTRY TO INSERT ===');
      console.log(JSON.stringify(auditLogEntry, null, 2));

      console.log('Inserting into Supabase audit_logs table...');
      const { data, error } = await supabaseClient
        .from('audit_logs')
        .insert(auditLogEntry)
        .select();

      if (error) {
        console.error('SUPABASE INSERT ERROR DETAILS:');
        console.error('Error object:', JSON.stringify(error, null, 2));
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Error code:', error.code);
        throw error;
      }

      console.log('=== AUDIT LOG SUCCESS ===');
      console.log('Inserted data:', data);
      console.log('Audit log entry created successfully');

      // Refresh audit logs to include the new entry
      await fetchAuditLogs();
    } catch (error) {
      console.error('=== AUDIT LOG FAILURE ===');
      console.error('Error logging audit action:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      // Don't show toast for audit log failures to avoid disrupting user experience
    }
  }, [user, activeClinic, fetchAuditLogs]);

  // Function to get filtered logs
  const getFilteredLogs = useCallback((filters: {
    category?: string;
    user?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
  }): AuditLog[] => {
    return auditLogs.filter(log => {
      // Clinic filter - already applied at fetch level, but double-check for consistency
      if (activeClinic && ['dental', 'meditouch'].includes(activeClinic)) {
        if (log.clinic_type && log.clinic_type !== activeClinic) {
          return false;
        }
      }

      // Category filter
      if (filters.category && filters.category !== 'all' && log.action_category !== filters.category) {
        return false;
      }

      // User filter
      if (filters.user && filters.user !== 'all' && log.user_name !== filters.user) {
        return false;
      }

      // Date range filter
      if (filters.startDate) {
        const logDate = new Date(log.timestamp);
        const startDate = new Date(filters.startDate);
        if (logDate < startDate) {
          return false;
        }
      }

      if (filters.endDate) {
        const logDate = new Date(log.timestamp);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // Include the entire end date
        if (logDate > endDate) {
          return false;
        }
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const searchableText = [
          log.user_name,
          log.action_type,
          log.target_entity,
          log.details,
          log.action_category
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, activeClinic]);

  // Initialize audit logs and users on component mount
  useEffect(() => {
    fetchAuditLogs();
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug user context
  useEffect(() => {
    console.log('=== AUDIT LOG PROVIDER DEBUG ===');
    console.log('User context in AuditLogProvider:', user);
    console.log('Active clinic:', activeClinic);
  }, [user, activeClinic]);

  // Refresh audit logs when active clinic changes
  useEffect(() => {
    if (activeClinic) {
      console.log(`Active clinic changed to: ${activeClinic}, refreshing audit logs...`);
      fetchAuditLogs();
    }
  }, [activeClinic, fetchAuditLogs]);

  const value: AuditLogContextType = {
    auditLogs,
    allUsers,
    isLoading,
    fetchAuditLogs,
    logAction,
    getFilteredLogs,
  };

  return (
    <AuditLogContext.Provider value={value}>
      {children}
    </AuditLogContext.Provider>
  );
};

// Custom hook to use the audit log context
export const useAuditLog = () => {
  const context = useContext(AuditLogContext);
  if (context === undefined) {
    throw new Error('useAuditLog must be used within an AuditLogProvider');
  }
  return context;
};
