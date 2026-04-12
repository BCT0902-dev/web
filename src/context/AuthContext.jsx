import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                
                // 1. Check if user is the root owner Google Account
                if (user.email === 'buicongtoi01@gmail.com') {
                    setIsAdmin(true);
                    
                    // Upsert admin identity to Firestore so the user manager recognizes them
                    await setDoc(doc(db, 'users', user.uid), {
                        email: user.email,
                        displayName: user.displayName || 'Bùi Công Tới',
                        role: 'admin',
                        lastLogin: new Date()
                    }, { merge: true });
                } else {
                    // Pull their profile to see if they were manually granted 'admin' role
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists() && userDoc.data().role === 'admin') {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                    }
                }
            } else {
                setCurrentUser(null);
                
                // 2. Check traditional Hardcoded 2FA admin session token
                if (localStorage.getItem('bct_admin_session') === 'true') {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            }
            setLoading(false);
        });

        // Add a secondary check for instant render of traditional Admin token if firebase is slow
        if (localStorage.getItem('bct_admin_session') === 'true') {
            setIsAdmin(true);
        }

        return unsubscribe;
    }, []);

    const logout = async () => {
        await signOut(auth);
        localStorage.removeItem('bct_admin_session');
        setIsAdmin(false);
    };

    const loginAsAdminLocal = () => {
        localStorage.setItem('bct_admin_session', 'true');
        setIsAdmin(true);
    };

    const value = {
        currentUser,
        isAdmin,
        logout,
        loginAsAdminLocal
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
