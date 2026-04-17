// AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, getCurrentUser, logoutUser } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser,  setCurrentUser]  = useState(null);
  const [userProfile,  setUserProfile]  = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [uploadCount,  setUploadCount]  = useState(0);

  // Guest upload count via localStorage
  useEffect(() => {
    if (!currentUser) {
      const stored = localStorage.getItem('unregisteredUploadCount');
      setUploadCount(stored ? parseInt(stored) : 0);
    }
  }, [currentUser]);

  const updateUserOnlineStatus = async (userId, isOnline) => {
    try {
      const token = await auth.currentUser.getIdToken();
      await fetch(`http://localhost:8000/admin/user/${userId}/update-online-status`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_online: isOnline }),
      });
    } catch (error) {
      console.error('Failed to update online status:', error);
    }
  };

  const fetchUserProfile = async (user) => {
    try {
      const token    = await user.getIdToken();
      const response = await fetch(`http://localhost:8000/auth/user/${user.uid}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const profileData = await response.json();
        setUserProfile(profileData);
        if (user.uid) await updateUserOnlineStatus(user.uid, true);
        return profileData;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    return null;
  };

  const updateProfile = async () => {
    if (currentUser) await fetchUserProfile(currentUser);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);

      if (user) {
        const profile = await fetchUserProfile(user);
        if (user.email === 'verityx.team@gmail.com') {
          setUserProfile({ ...profile, isAdmin: true });
        } else {
          setUserProfile(profile);
        }

        try {
          const token    = await user.getIdToken();
          const response = await fetch('http://localhost:8000/uploads/limit', {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          });
          if (response.ok) {
            const data = await response.json();
            setUploadCount(data.current_count || 0);
          }
        } catch (error) {
          console.error('Error fetching upload count:', error);
        }
      } else {
        setUserProfile(null);
        const stored = localStorage.getItem('unregisteredUploadCount');
        setUploadCount(stored ? parseInt(stored) : 0);
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentUser?.uid) await updateUserOnlineStatus(currentUser.uid, false);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser]);

  const incrementUploadCount = async () => {
    if (currentUser) {
      try {
        const token    = await currentUser.getIdToken();
        const response = await fetch('http://localhost:8000/uploads/increment', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const result = await response.json();
          setUploadCount(result.current_count || uploadCount + 1);
        }
      } catch (error) {
        console.error('Error incrementing upload count:', error);
      }
    } else {
      const newCount = uploadCount + 1;
      setUploadCount(newCount);
      localStorage.setItem('unregisteredUploadCount', newCount.toString());
    }
  };

  // Registered users have UNLIMITED uploads (max_uploads = -1)
  const canUpload = () => {
    if (currentUser) return true;           // always true for registered
    return uploadCount < 3;                 // guest: 3 max
  };

  const getUploadLimit = () => {
    if (currentUser) return -1;             // -1 = unlimited
    return 3;
  };

  const logout = async () => {
    try {
      if (currentUser?.uid) await updateUserOnlineStatus(currentUser.uid, false);
      await logoutUser();
      setCurrentUser(null);
      setUploadCount(0);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    currentUser, userProfile, uploadCount,
    incrementUploadCount, canUpload, getUploadLimit,
    logout, updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};