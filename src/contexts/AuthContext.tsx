
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

  // Check if user is already logged in using Supabase session
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check Supabase session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Get user details from the users table
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (userData) {
            setUser(userData);
          } else {
            // Fallback to localStorage if user not found in database
            const storedUser = localStorage.getItem('mudraUser');
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            }
          }
        } else {
          // Fallback to localStorage if no session
          const storedUser = localStorage.getItem('mudraUser');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // Fallback to localStorage
        const storedUser = localStorage.getItem('mudraUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
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
      // First try to sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'password' // Use provided password or fallback to 'password'
      });

      if (authError) {
        // If Supabase Auth fails, try the legacy approach
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

        // Create a Supabase auth account for this user for future logins
        try {
          await supabase.auth.signUp({
            email,
            password: 'password',
            options: {
              data: {
                user_id: foundUser.id
              }
            }
          });

          // Update the user record with the auth_id
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            await supabase.from<User>('users').update(
              { auth_id: authUser.id },
              { id: foundUser.id }
            );
          }
        } catch (signupError) {
          console.error('Error creating auth account:', signupError);
          // Continue with login even if auth account creation fails
        }

        toast({
          title: 'Login Successful',
          description: `Welcome back, ${foundUser.name}!`,
        });
      } else {
        // Supabase Auth succeeded, get user details from the users table
        const { data: userData } = await supabase.from<User>('users').getAll({
          filters: { auth_id: authData.user.id }
        });

        if (userData && userData.length > 0) {
          // Set user in state and localStorage
          setUser(userData[0]);
          localStorage.setItem('mudraUser', JSON.stringify(userData[0]));

          toast({
            title: 'Login Successful',
            description: `Welcome back, ${userData[0].name}!`,
          });
        } else {
          throw new Error('User not found in database');
        }
      }

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
