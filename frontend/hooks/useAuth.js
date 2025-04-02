import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const verifyToken = async () => {
    try {
      console.log('Starting token verification...');
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);

      if (!token) {
        console.log('No token found');
        return false;
      }

      console.log('Verifying token with server...');
      const response = await api.get('/api/auth/verify');
      console.log('Server response:', response.data);
      
      if (response.data && response.data.user) {
        return { verified: true, user: response.data.user };
      }
      return false;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        const result = await verifyToken();
        if (result && result.verified) {
          setUser(result.user);
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem('token');
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        localStorage.removeItem('token');
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      if (response.data && response.data.token) {
        // Store token first
        localStorage.setItem('token', response.data.token);
        
        // Wait a moment to ensure localStorage is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Then verify and update state
        const verificationResult = await verifyToken();
        if (verificationResult && verificationResult.verified) {
          setUser(verificationResult.user);
          setIsLoggedIn(true);
          return response.data;
        }
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsLoggedIn(false);
    router.push('/login');
  };

  return {
    user,
    isLoggedIn,
    isLoading,
    login,
    logout
  };
}