// AuthContext.js - Update to track user online status
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, getCurrentUser, logoutUser } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadCount, setUploadCount] = useState(0);

    // Track uploads for unregistered users
    useEffect(() => {
        if (!currentUser) {
            const storedCount = localStorage.getItem('unregisteredUploadCount');
            setUploadCount(storedCount ? parseInt(storedCount) : 0);
        }
    }, [currentUser]);

    const updateUserOnlineStatus = async (userId, isOnline) => {
        try {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`http://localhost:8000/admin/user/${userId}/update-online-status`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_online: isOnline })
            });
            
            if (!response.ok) {
                console.error('Failed to update online status:', response.status);
            }
        } catch (error) {
            console.error('Failed to update online status:', error);
        }
    };

    const fetchUserProfile = async (user) => {
        try {
            const token = await user.getIdToken();
            const response = await fetch(`http://localhost:8000/auth/user/${user.uid}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const profileData = await response.json();
                setUserProfile(profileData);
                
                // Update user as online
                if (user.uid) {
                    await updateUserOnlineStatus(user.uid, true);
                }
                
                return profileData;
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
        return null;
    };

    const updateProfile = async () => {
        if (currentUser) {
            await fetchUserProfile(currentUser);
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setCurrentUser(user);
            
            if (user) {
               const profile = await fetchUserProfile(user);

                if (user.email === 'verityx.team@gmail.com') {
                    setUserProfile({
                    ...profile,
                    isAdmin: true
                    });
                } else {
                    setUserProfile(profile);
                }

                try {
                    // Get user's upload count from backend
                    const token = await user.getIdToken();
                    const response = await fetch('http://localhost:8000/uploads/limit', {
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
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
                // Unregistered user - get from local storage
                const storedCount = localStorage.getItem('unregisteredUploadCount');
                setUploadCount(storedCount ? parseInt(storedCount) : 0);
            }
            
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Update online status when user leaves the app
    useEffect(() => {
        const handleBeforeUnload = async () => {
            if (currentUser && currentUser.uid) {
                await updateUserOnlineStatus(currentUser.uid, false);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [currentUser]);

    const incrementUploadCount = async () => {
        if (currentUser) {
            // Registered user - update in backend
            try {
                const token = await currentUser.getIdToken();
                const response = await fetch('http://localhost:8000/uploads/increment', {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    setUploadCount(result.current_count || uploadCount + 1);
                }
            } catch (error) {
                console.error('Error incrementing upload count:', error);
            }
        } else {
            // Unregistered user - update in local storage
            const newCount = uploadCount + 1;
            setUploadCount(newCount);
            localStorage.setItem('unregisteredUploadCount', newCount.toString());
        }
    };

    const canUpload = () => {
        const maxUploads = currentUser ? 50 : 3;
        return uploadCount < maxUploads;
    };

    const getUploadLimit = () => {
        return currentUser ? 50 : 3;
    };

    const logout = async () => {
        try {
            // Update user as offline before logout
            if (currentUser && currentUser.uid) {
                await updateUserOnlineStatus(currentUser.uid, false);
            }
            
            await logoutUser();
            setCurrentUser(null);
            setUploadCount(0);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const value = {
        currentUser,
        userProfile,
        uploadCount,
        incrementUploadCount,
        canUpload,
        getUploadLimit,
        logout,
        updateProfile 
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};