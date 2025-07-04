
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/hooks/use-toast';
import { AuditLogTemplates } from '@/utils/auditLogger';
import bcrypt from 'bcryptjs';

// Define types for user roles
export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'inventory_manager';

// Define the user interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  login_attempts: number;
  locked_until?: string;
}

// Define auth context state
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  sessionToken: string | null;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Check if user is already logged in using session token
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedToken = localStorage.getItem('sessionToken');
        const storedUser = localStorage.getItem('mudraUser');

        if (storedToken && storedUser) {
          // Validate session token with database
          const sessions = await supabase.from('user_sessions').getAll({
            filters: { session_token: storedToken },
            limit: 1
          });

          if (sessions.length > 0) {
            const session = sessions[0];

            // Check if session is still valid
            if (new Date(session.expires_at) > new Date()) {
              // Update last accessed time
              await supabase.from('user_sessions').update(session.id, {
                last_accessed: new Date().toISOString()
              });

              setUser(JSON.parse(storedUser));
              setSessionToken(storedToken);
            } else {
              // Session expired, clean up
              await supabase.from('user_sessions').delete(session.id);
              localStorage.removeItem('sessionToken');
              localStorage.removeItem('mudraUser');
            }
          } else {
            // Invalid session token, clean up
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('mudraUser');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // Clean up on error
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('mudraUser');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [supabase]);

  // Initialize default admin user if none exists
  useEffect(() => {
    const initializeDefaultUser = async () => {
      try {
        console.log('Checking for existing users...');

        // Generate a test hash for debugging
        const testHash = await bcrypt.hash('admin123', 10);
        console.log('🔧 Generated test hash for "admin123":', testHash);

        // Check if any users exist
        const users = await supabase.from('users').getAll({ limit: 1 });
        console.log('Existing users found:', users.length);

        if (users.length === 0) {
          console.log('No users found, creating default admin...');
          // Create default admin user with hashed password
          const hashedPassword = await bcrypt.hash('admin123', 10);
          console.log('🔧 Generated hash for new user:', hashedPassword);

          const defaultAdmin = {
            name: 'System Administrator',
            email: 'admin@dentalmetrix.com',
            role: 'admin',
            password_hash: hashedPassword,
            is_active: true,
            is_verified: true,
            login_attempts: 0
          };

          const result = await supabase.from('users').insert(defaultAdmin);
          console.log('Default admin user creation result:', result);
          console.log('✅ Default admin user created with email: admin@dentalmetrix.com and password: admin123');
        } else {
          console.log('✅ Users already exist in database');

          // Test the existing user's password hash
          const adminUsers = await supabase.from('users').getAll({
            filters: { email: 'admin@dentalmetrix.com' },
            limit: 1
          });

          if (adminUsers.length > 0) {
            const adminUser = adminUsers[0];
            console.log('🔍 Existing admin user hash:', adminUser.password_hash);

            // Test if the hash works
            try {
              const testResult = await bcrypt.compare('admin123', adminUser.password_hash);
              console.log('🔧 Test password verification result:', testResult);

              if (!testResult) {
                console.log('⚠️ Existing hash does not work, consider updating it');
                console.log('🔧 You can run this SQL to fix it:');
                console.log(`UPDATE users SET password_hash = '${testHash}' WHERE email = 'admin@dentalmetrix.com';`);
              }
            } catch (testError) {
              console.error('❌ Error testing existing hash:', testError);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error initializing default user:', error);
        // Don't throw the error, just log it
      }
    };

    // Add a small delay to ensure database is ready
    setTimeout(initializeDefaultUser, 1000);
  }, [supabase]);

  // Generate session token
  const generateSessionToken = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('🔐 Database Login - Login attempt for:', email);

      // Find user by email in database
      console.log('📋 Searching for user in database...');
      const users = await supabase.from('users').getAll({
        filters: { email: email.toLowerCase() },
        limit: 1
      });

      console.log('👥 Users found:', users.length);
      if (users.length > 0) {
        console.log('👤 User data:', {
          id: users[0].id,
          name: users[0].name,
          email: users[0].email,
          role: users[0].role,
          is_active: users[0].is_active,
          login_attempts: users[0].login_attempts
        });
      }

      if (users.length === 0) {
        console.log('❌ No user found with email:', email);

        toast({
          title: 'Login Failed',
          description: 'Invalid email or password.',
          variant: 'destructive',
        });
        throw new Error('Invalid credentials');
      }

      const foundUser = users[0];

      // Check if account is active
      console.log('🔍 Checking account status...');
      if (!foundUser.is_active) {
        console.log('❌ Account is inactive');
        toast({
          title: 'Account Disabled',
          description: 'Your account has been disabled. Please contact an administrator.',
          variant: 'destructive',
        });
        throw new Error('Account disabled');
      }

      // Check if account is locked
      if (foundUser.locked_until && new Date(foundUser.locked_until) > new Date()) {
        const lockTime = new Date(foundUser.locked_until).toLocaleString();
        console.log('🔒 Account is locked until:', lockTime);
        toast({
          title: 'Account Locked',
          description: `Your account is locked until ${lockTime}. Please try again later.`,
          variant: 'destructive',
        });
        throw new Error('Account locked');
      }

      // If lock has expired, reset the counter and clear locked_until
      if (foundUser.locked_until && new Date(foundUser.locked_until) <= new Date()) {
        console.log('🔓 Lock has expired, resetting login attempts');
        await supabase.from('users').update(foundUser.id, {
          login_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString()
        });
        // Update the foundUser object for the current login attempt
        foundUser.login_attempts = 0;
        foundUser.locked_until = null;
      }

      // Verify password
      console.log('🔑 Verifying password...');
      if (!foundUser.password_hash) {
        console.log('❌ No password hash found for user');
        toast({
          title: 'Login Failed',
          description: 'Account setup incomplete. Please contact an administrator.',
          variant: 'destructive',
        });
        throw new Error('No password set');
      }

      console.log('🔍 Attempting password verification...');
      console.log('🔍 Input password:', password);
      console.log('🔍 Stored hash:', foundUser.password_hash);
      console.log('🔍 Hash length:', foundUser.password_hash?.length);

      let isPasswordValid = false;
      try {
        isPasswordValid = await bcrypt.compare(password, foundUser.password_hash);
        console.log('🔐 bcrypt.compare result:', isPasswordValid);
      } catch (bcryptError) {
        console.error('❌ bcrypt.compare error:', bcryptError);

        // Fallback: For development, also try direct comparison (REMOVE IN PRODUCTION)
        if (password === 'admin123' && foundUser.email === 'admin@dentalmetrix.com') {
          console.log('🔧 Using fallback authentication for development');
          isPasswordValid = true;
        }
      }

      if (!isPasswordValid) {
        // Increment login attempts
        const newAttempts = foundUser.login_attempts + 1;
        const updateData = {
          login_attempts: newAttempts,
          updated_at: new Date().toISOString()
        };

        // Lock account after 5 failed attempts
        if (newAttempts >= 5) {
          updateData.locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
          console.log('🔒 Account locked for user:', foundUser.name);
        }

        console.log('📊 Updating failed login attempts:', updateData);
        await supabase.from('users').update(foundUser.id, updateData);

        console.log('❌ Invalid password for user:', foundUser.name);
        console.log('🔍 Password hash from DB:', foundUser.password_hash ? 'Present' : 'Missing');
        console.log('🔍 Password provided:', password ? 'Present' : 'Missing');

        // Log failed login attempt
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const SUPABASE_URL = 'https://cqtloiklvpvafeoiyyhy.supabase.co';
          const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdGxvaWtsdnB2YWZlb2l5eWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTE1MjAsImV4cCI6MjA2Mjk2NzUyMH0.iaGIQNydn1xK8SQXidXLHya6X2qUtQGq0lVqGw8OZbw';
          const auditClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

          const auditEntry = {
            timestamp: new Date().toISOString(),
            user_id: foundUser.id,
            user_name: foundUser.name,
            user_role: foundUser.role,
            action_category: 'auth',
            action_type: 'Login Failed',
            target_entity: 'Authentication',
            details: `Failed login attempt for: ${foundUser.name} (${foundUser.email}) - Invalid password`,
            ip_address: null,
            user_agent: navigator.userAgent,
            clinic_type: 'dental',
            created_at: new Date().toISOString()
          };

          await auditClient.from('audit_logs').insert(auditEntry);
          console.log('✅ Failed login audit log created');
        } catch (auditError) {
          console.error('Failed to log failed login audit:', auditError);
        }

        toast({
          title: 'Login Failed',
          description: `Invalid email or password. ${5 - newAttempts} attempts remaining.`,
          variant: 'destructive',
        });
        throw new Error('Invalid credentials');
      }

      // Generate session token
      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Create session - Supabase client will automatically add created_at
      const sessionData = {
        user_id: foundUser.id,
        session_token: token,
        expires_at: expiresAt.toISOString(),
        ip_address: null, // Could be populated from request
        user_agent: navigator.userAgent,
        last_accessed: new Date().toISOString()
      };

      console.log('💾 Creating session with data:', sessionData);
      await supabase.from('user_sessions').insert(sessionData);

      // Update user login info - only include columns that exist
      const userUpdateData = {
        last_login: new Date().toISOString(),
        login_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString()
      };

      console.log('👤 Updating user login info:', userUpdateData);
      await supabase.from('users').update(foundUser.id, userUpdateData);

      // Set user in state and localStorage
      setUser(foundUser);
      setSessionToken(token);
      localStorage.setItem('mudraUser', JSON.stringify(foundUser));
      localStorage.setItem('sessionToken', token);

      console.log('✅ Database login successful for user:', foundUser.name);

      // Log successful login audit entry
      try {
        // Import the audit log client directly to avoid circular dependency
        const { createClient } = await import('@supabase/supabase-js');
        const SUPABASE_URL = 'https://cqtloiklvpvafeoiyyhy.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdGxvaWtsdnB2YWZlb2l5eWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTE1MjAsImV4cCI6MjA2Mjk2NzUyMH0.iaGIQNydn1xK8SQXidXLHya6X2qUtQGq0lVqGw8OZbw';
        const auditClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const auditEntry = {
          timestamp: new Date().toISOString(),
          user_id: foundUser.id,
          user_name: foundUser.name,
          user_role: foundUser.role,
          action_category: 'auth',
          action_type: 'User Login',
          target_entity: 'Authentication',
          details: `User logged in: ${foundUser.name} (${foundUser.email})`,
          ip_address: null,
          user_agent: navigator.userAgent,
          clinic_type: 'dental',
          created_at: new Date().toISOString()
        };

        await auditClient.from('audit_logs').insert(auditEntry);
        console.log('✅ Login audit log created');
      } catch (auditError) {
        console.error('Failed to log login audit:', auditError);
      }

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${foundUser.name}!`,
      });

      // Navigate to root and let permission-based routing handle the redirect
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (user) {
        console.log('👋 Logout for user:', user.name);
        
        // Log logout audit entry
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const SUPABASE_URL = 'https://cqtloiklvpvafeoiyyhy.supabase.co';
          const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdGxvaWtsdnB2YWZlb2l5eWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTE1MjAsImV4cCI6MjA2Mjk2NzUyMH0.iaGIQNydn1xK8SQXidXLHya6X2qUtQGq0lVqGw8OZbw';
          const auditClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

          const auditEntry = {
            timestamp: new Date().toISOString(),
            user_id: user.id,
            user_name: user.name,
            user_role: user.role,
            action_category: 'auth',
            action_type: 'User Logout',
            target_entity: 'Authentication',
            details: `User logged out: ${user.name} (${user.email})`,
            ip_address: null,
            user_agent: navigator.userAgent,
            clinic_type: 'dental',
            created_at: new Date().toISOString()
          };

          await auditClient.from('audit_logs').insert(auditEntry);
          console.log('✅ Logout audit log created');
        } catch (auditError) {
          console.error('Failed to log logout audit:', auditError);
        }
      }

      // Delete session from database
      if (sessionToken) {
        const sessions = await supabase.from('user_sessions').getAll({
          filters: { session_token: sessionToken },
          limit: 1
        });
        if (sessions.length > 0) {
          await supabase.from('user_sessions').delete(sessions[0].id);
        }
      }

      // Clear local state
      setUser(null);
      setSessionToken(null);
      localStorage.removeItem('mudraUser');
      localStorage.removeItem('sessionToken');

      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
      });

      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);

      // Fallback to local logout
      setUser(null);
      setSessionToken(null);
      localStorage.removeItem('mudraUser');
      localStorage.removeItem('sessionToken');

      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
      });

      navigate('/login');
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      // Find user by email
      const users = await supabase.from('users').getAll({
        filters: { email: email.toLowerCase() },
        limit: 1
      });

      if (users.length === 0) {
        // Don't reveal if email exists or not for security
        toast({
          title: 'Password Reset',
          description: 'If an account with this email exists, you will receive password reset instructions.',
        });
        return;
      }

      const user = users[0];

      // Generate reset token
      const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token
      await supabase.from('password_reset_tokens').insert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        ip_address: null,
        user_agent: navigator.userAgent
      });

      // In a real app, you would send an email here
      // For demo purposes, we'll show the token in console
      console.log(`Password reset token for ${email}: ${resetToken}`);

      toast({
        title: 'Password Reset',
        description: 'If an account with this email exists, you will receive password reset instructions.',
      });
    } catch (error) {
      console.error('Forgot password failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to process password reset request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Reset password function
  const resetPassword = async (token: string, newPassword: string) => {
    try {
      // Find valid reset token
      const tokens = await supabase.from('password_reset_tokens').getAll({
        filters: { token: token },
        limit: 1
      });

      if (tokens.length === 0) {
        toast({
          title: 'Invalid Token',
          description: 'The password reset token is invalid or has expired.',
          variant: 'destructive',
        });
        throw new Error('Invalid token');
      }

      const resetToken = tokens[0];

      // Check if token is expired
      if (new Date(resetToken.expires_at) < new Date()) {
        toast({
          title: 'Token Expired',
          description: 'The password reset token has expired. Please request a new one.',
          variant: 'destructive',
        });
        throw new Error('Token expired');
      }

      // Check if token is already used
      if (resetToken.used_at) {
        toast({
          title: 'Token Used',
          description: 'This password reset token has already been used.',
          variant: 'destructive',
        });
        throw new Error('Token already used');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      await supabase.from('users').update(resetToken.user_id, {
        password_hash: hashedPassword,
        login_attempts: 0,
        locked_until: null
      });

      // Mark token as used
      await supabase.from('password_reset_tokens').update(resetToken.id, {
        used_at: new Date().toISOString()
      });

      // Get user for audit log
      const user = await supabase.from('users').getById(resetToken.user_id);
      if (user) {
        try {
          const auditEntry = AuditLogTemplates.user.passwordReset(user.id, user.name, user.email);
          await supabase.from('audit_logs').insert({
            ...auditEntry,
            clinic_type: 'dental'
          });
        } catch (auditError) {
          console.error('Failed to log audit:', auditError);
        }
      }

      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset successfully. You can now log in with your new password.',
      });

      navigate('/login');
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      forgotPassword,
      resetPassword,
      isAuthenticated: !!user,
      sessionToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
