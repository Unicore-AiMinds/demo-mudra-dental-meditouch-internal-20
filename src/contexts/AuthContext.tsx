
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useToast } from '@/hooks/use-toast';

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

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('mudraUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
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
      // For demo purposes, we're using a simple password check
      // In production, you should use proper authentication with hashed passwords

      // Find user with matching email
      const users = await supabase.from<User>('users').getAll({
        filters: { email: email }
      });

      const foundUser = users[0];

      if (!foundUser || password !== 'password') {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password',
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
  const logout = () => {
    setUser(null);
    localStorage.removeItem('mudraUser');

    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out',
    });

    navigate('/login');
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
