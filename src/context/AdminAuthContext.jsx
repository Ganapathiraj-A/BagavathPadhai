import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                if (!currentUser.isAnonymous) {
                    console.log("Logged in UID:", currentUser.uid); // Helper for the user
                    try {
                        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
                        setIsAdmin(adminDoc.exists());
                    } catch (error) {
                        console.error("Error checking admin status:", error);
                        setIsAdmin(false);
                    }
                } else {
                    setIsAdmin(false);
                }
                setLoading(false);
            } else {
                signInAnonymously(auth).catch((error) => {
                    console.error("Anonymous auth failed", error);
                    setLoading(false);
                });
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AdminAuthContext.Provider value={{ user, isAdmin, loading }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
