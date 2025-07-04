import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/contexts/AuditLogContext';
import { AuditLogTemplates } from '@/utils/auditLogger';
import { roleOperations } from '@/lib/database/roles';
import bcrypt from 'bcryptjs';

// Define the User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: string; // Now supports dynamic roles from the roles table
  role_id?: string; // UUID reference to roles table
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  login_attempts: number;
  locked_until?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Define the context type
interface UserManagementContextType {
  users: User[];
  isLoading: boolean;
  refreshUsers: () => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'created_at' | 'updated_at' | 'login_attempts' | 'is_verified'> & { password: string }) => Promise<User>;
  updateUser: (id: string, user: Partial<User> & { password?: string }) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string, isActive: boolean) => Promise<void>;
  resetUserPassword: (id: string, newPassword: string) => Promise<void>;
  unlockUser: (id: string) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  getUsersByRole: (role: string) => User[];
}

// Create the context
const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

// Custom hook to use the context
export const useUserManagement = () => {
  const context = useContext(UserManagementContext);
  if (context === undefined) {
    throw new Error('useUserManagement must be used within a UserManagementProvider');
  }
  return context;
};

// Provider component
export const UserManagementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  // Fetch users from Supabase
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      const data = await supabase.from('users').getAll({
        order: { column: 'created_at', ascending: false }
      });

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  // Hash password helper
  const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  };

  // Add a new user
  const addUser = async (
    userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'login_attempts' | 'is_verified'> & { password: string }
  ): Promise<User> => {
    try {
      // Hash the password
      const hashedPassword = await hashPassword(userData.password);

      // Look up role_id from role name
      let roleId = null;
      if (userData.role) {
        const roles = await roleOperations.getAll();
        const role = roles.find(r => r.name === userData.role);
        if (role) {
          roleId = role.id;
          console.log('🔍 Found role_id for', userData.role, ':', roleId);
        } else {
          console.warn('⚠️ Role not found:', userData.role);
        }
      }

      // Prepare user data
      const { password, ...userWithoutPassword } = userData;
      const newUser = {
        ...userWithoutPassword,
        role_id: roleId, // Set the role_id for proper permission lookup
        password_hash: hashedPassword,
        login_attempts: 0,
        is_verified: false
      };

      // Insert user
      const { error: insertError } = await supabase
        .from('users')
        .insert(newUser);

      if (insertError) {
        throw insertError;
      }

      // Fetch the newly created user
      const fetchedData = await supabase.from('users').getAll({
        filters: { email: userData.email },
        order: { column: 'created_at', ascending: false },
        limit: 1
      });

      const data = fetchedData.length > 0 ? fetchedData[0] : null;
      
      if (!data) {
        throw new Error('Failed to fetch newly created user');
      }

      // Update local state
      setUsers(prev => [data, ...prev]);

      // Log audit action
      try {
        const auditEntry = AuditLogTemplates.user.create(
          data.id,
          data.name,
          data.email,
          data.role,
          data.phone,
          data.is_active
        );
        await logAction({ ...auditEntry, clinic_type: 'dental' });
      } catch (auditError) {
        console.error('Failed to log user creation audit:', auditError);
      }

      toast({
        title: 'Success',
        description: `User ${userData.name} created successfully.`,
      });

      return data;
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update a user
  const updateUser = async (
    id: string,
    userData: Partial<User> & { password?: string }
  ): Promise<User> => {
    try {
      // Get existing user for audit logging
      const existingUser = users.find(u => u.id === id);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Prepare update data
      const { password, ...updateData } = userData;
      let finalUpdateData = { ...updateData };

      // Hash new password if provided
      if (password) {
        finalUpdateData = {
          ...finalUpdateData,
          password_hash: await hashPassword(password)
        };
      }

      // Update role_id if role is being changed
      if (userData.role && userData.role !== existingUser.role) {
        const roles = await roleOperations.getAll();
        const role = roles.find(r => r.name === userData.role);
        if (role) {
          finalUpdateData = {
            ...finalUpdateData,
            role_id: role.id
          };
          console.log('🔍 Updated role_id for', userData.role, ':', role.id);
        } else {
          console.warn('⚠️ Role not found during update:', userData.role);
        }
      }

      // Update user
      const updatedData = await supabase
        .from('users')
        .update(id, finalUpdateData);

      let data;
      if (Array.isArray(updatedData) && updatedData.length > 0) {
        data = updatedData[0];
      } else if (!Array.isArray(updatedData) && updatedData) {
        data = updatedData;
      } else {
        data = await supabase.from('users').getById(id);
      }

      if (!data) {
        throw new Error('Failed to fetch updated user');
      }

      // Update local state
      setUsers(prev =>
        prev.map(user => (user.id === id ? data : user))
      );

      // Log audit action
      try {
        const updatedUser = { ...existingUser, ...userData };
        const auditEntry = AuditLogTemplates.user.update(
          id,
          existingUser.name,
          {
            before: existingUser,
            after: updatedUser
          }
        );
        await logAction({ ...auditEntry, clinic_type: 'dental' });
      } catch (auditError) {
        console.error('Failed to log user update audit:', auditError);
      }

      toast({
        title: 'Success',
        description: 'User updated successfully.',
      });

      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete a user
  const deleteUser = async (id: string): Promise<void> => {
    try {
      // Get user before deletion for audit logging
      const userToDelete = users.find(user => user.id === id);
      if (!userToDelete) {
        throw new Error('User not found');
      }

      // Delete user
      const error = await supabase
        .from('users')
        .delete(id);

      if (error) {
        throw error;
      }

      // Update local state
      setUsers(prev => prev.filter(user => user.id !== id));

      // Log audit action
      try {
        const auditEntry = AuditLogTemplates.user.delete(
          id,
          userToDelete.name,
          userToDelete.email,
          userToDelete.role
        );
        await logAction({ ...auditEntry, clinic_type: 'dental' });
      } catch (auditError) {
        console.error('Failed to log user deletion audit:', auditError);
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (id: string, isActive: boolean): Promise<void> => {
    try {
      await updateUser(id, { is_active: isActive });
      
      const user = users.find(u => u.id === id);
      toast({
        title: 'Success',
        description: `User ${user?.name} ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  };

  // Reset user password
  const resetUserPassword = async (id: string, newPassword: string): Promise<void> => {
    try {
      await updateUser(id, { 
        password: newPassword,
        login_attempts: 0,
        locked_until: null
      });
      
      const user = users.find(u => u.id === id);
      toast({
        title: 'Success',
        description: `Password reset for ${user?.name} successfully.`,
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  // Unlock user account
  const unlockUser = async (id: string): Promise<void> => {
    try {
      await updateUser(id, { 
        login_attempts: 0,
        locked_until: null
      });
      
      const user = users.find(u => u.id === id);
      toast({
        title: 'Success',
        description: `Account unlocked for ${user?.name} successfully.`,
      });
    } catch (error) {
      console.error('Error unlocking user:', error);
      throw error;
    }
  };

  // Refresh users
  const refreshUsers = async (): Promise<void> => {
    await fetchUsers();
  };

  // Get user by ID
  const getUserById = (id: string): User | undefined => {
    return users.find(user => user.id === id);
  };

  // Get users by role
  const getUsersByRole = (role: string): User[] => {
    return users.filter(user => user.role === role);
  };

  return (
    <UserManagementContext.Provider
      value={{
        users,
        isLoading,
        refreshUsers,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        resetUserPassword,
        unlockUser,
        getUserById,
        getUsersByRole,
      }}
    >
      {children}
    </UserManagementContext.Provider>
  );
};
