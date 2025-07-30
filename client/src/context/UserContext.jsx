// UserContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    try {
      const user_info = JSON.parse(localStorage.getItem('userData'));
      const token = localStorage.getItem('authToken');
      
      if (!token || !user_info?._id) {
        throw new Error('Authentication data missing');
      }

      const response = await axios.get(`${base_url}/api/user/single-user/${user_info._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setUserData(response.data.user);
        console.log(response.data.user)
      } else {
        setError(response.data.message || 'Failed to fetch user data');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = () => {
    setLoading(true);
    setError(null);
    fetchUserData();
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <UserContext.Provider value={{ userData, loading, error, refreshUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};