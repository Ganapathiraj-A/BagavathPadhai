import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                if (!currentUser.isAnonymous) {
                    console.log("Logged in UID:", currentUser.uid);
                    try {
                        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
                        if (adminDoc.exists()) {
                            setIsAdmin(true);
                            setIsPending(false);
                        } else {
                            setIsAdmin(false);
                            // Check if a request is pending
                            const reqDoc = await getDoc(doc(db, 'admin_requests', currentUser.uid));
                            setIsPending(reqDoc.exists());
                        }
                    } catch (error) {
                        console.error("Error checking status:", error);
                        setIsAdmin(false);
                    }
                } else {
                    setIsAdmin(false);
                    setIsPending(false);
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
        <AdminAuthContext.Provider value={{ user, isAdmin, isPending, loading, setIsPending }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
