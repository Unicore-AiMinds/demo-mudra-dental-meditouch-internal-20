
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

// Mock users for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Dr. Khanna',
    email: 'admin@mudraclinic.com',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Dr. Priya Sharma',
    email: 'doctor@mudraclinic.com',
    role: 'doctor',
  },
  {
    id: '3',
    name: 'Lakshmi Patel',
    email: 'receptionist@mudraclinic.com',
    role: 'receptionist',
  },
  {
    id: '4',
    name: 'Rajesh Kumar',
    email: 'inventory@mudraclinic.com',
    role: 'inventory',
  }
];

// Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('mudraUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Find user with matching email
      const foundUser = mockUsers.find(u => u.email === email);
      
      if (!foundUser || password !== 'password') {
        throw new Error('Invalid credentials');
      }
      
      // Set user in state and localStorage
      setUser(foundUser);
      localStorage.setItem('mudraUser', JSON.stringify(foundUser));
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
