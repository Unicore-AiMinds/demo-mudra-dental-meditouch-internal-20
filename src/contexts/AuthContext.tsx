
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/components/ui/use-toast';

// Define types for user roles
export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'inventory';

// Define the user interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Define auth context state
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const { toast } = useToast();

  // Check if user is already logged in using localStorage
  useEffect(() => {
    const checkSession = () => {
      try {
        // Check localStorage for stored user
        const storedUser = localStorage.getItem('mudraUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Initialize default admin user if none exists
  useEffect(() => {
    const initializeDefaultUser = async () => {
      try {
        // Check if any users exist
        const users = await supabase.from<User>('users').getAll({ limit: 1 });

        if (users.length === 0) {
          // Create default admin user
          const defaultAdmin = {
            name: 'Dr. Khanna',
            email: 'admin@mudraclinic.com',
            role: 'admin' as UserRole
          };

          await supabase.from<User>('users').insert(defaultAdmin);
          console.log('Default admin user created');
        }
      } catch (error) {
        console.error('Error initializing default user:', error);
      }
    };

    initializeDefaultUser();
  }, [supabase]);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Attempting login with:', { email, password });

      // For demo purposes, we'll use hardcoded users
      // In a real app, this would be replaced with actual authentication
      const demoUsers = [
        {
          id: '1',
          name: 'Dr. Khanna',
          email: 'admin@mudraclinic.com',
          role: 'admin' as UserRole
        },
        {
          id: '2',
          name: 'Dr. Smith',
          email: 'doctor@mudraclinic.com',
          role: 'doctor' as UserRole
        },
        {
          id: '3',
          name: 'Jane Doe',
          email: 'receptionist@mudraclinic.com',
          role: 'receptionist' as UserRole
        },
        {
          id: '4',
          name: 'John Inventory',
          email: 'inventory@mudraclinic.com',
          role: 'inventory' as UserRole
        }
      ];

      // TEMPORARY PROVISION: Allow any email with "admin" in it to log in as admin
      if (email.toLowerCase().includes('admin')) {
        const adminUser = {
          id: '1',
          name: 'Administrator',
          email: email,
          role: 'admin' as UserRole
        };

        // Set user in state and localStorage
        setUser(adminUser);
        localStorage.setItem('mudraUser', JSON.stringify(adminUser));

        toast({
          title: 'Admin Login Successful',
          description: 'Welcome, Administrator! (Temporary provision)',
        });

        navigate('/dashboard');
        return;
      }

      // Find user with matching email
      const foundUser = demoUsers.find(user => user.email === email);

      if (!foundUser || password !== 'password') {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password. For demo, use password: "password"',
          variant: 'destructive',
        });
        throw new Error('Invalid credentials');
      }

      // Set user in state and localStorage
      setUser(foundUser);
      localStorage.setItem('mudraUser', JSON.stringify(foundUser));

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${foundUser.name}!`,
      });

      navigate('/dashboard');
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
      // Sign out from Supabase Auth
      await supabase.auth.signOut();

      // Clear local state
      setUser(null);
      localStorage.removeItem('mudraUser');

      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
      });

      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);

      // Fallback to local logout
      setUser(null);
      localStorage.removeItem('mudraUser');

      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
      });

      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAuthenticated: !!user,
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
