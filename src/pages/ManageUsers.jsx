import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, onSnapshot, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import PageHeader from '../components/PageHeader';
import { Check, X, Shield, Mail, Calendar, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ManageUsers = () => {
    const [requests, setRequests] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Stream pending requests
        const unsubRequests = onSnapshot(collection(db, 'admin_requests'), (snapshot) => {
            setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        // Get current admins
        const fetchAdmins = async () => {
            const snap = await getDocs(collection(db, 'admins'));
            setAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchAdmins();

        return () => unsubRequests();
    }, []);

    const handleApprove = async (req) => {
        if (confirm(`Promote ${req.email} to Admin?`)) {
            try {
                // 1. Add to admins collection
                await setDoc(doc(db, 'admins', req.id), {
                    email: req.email,
                    displayName: req.displayName || '',
                    grantedAt: Timestamp.now(),
                    grantedBy: 'System'
                });
                // 2. Remove from requests
                await deleteDoc(doc(db, 'admin_requests', req.id));
                alert("User approved successfully!");
            } catch (e) {
                alert("Error approving user: " + e.message);
            }
        }
    };

    const handleReject = async (requestId) => {
        if (confirm("Reject and delete this request?")) {
            await deleteDoc(doc(db, 'admin_requests', requestId));
        }
    };

    const handleRevoke = async (adminId, email) => {
        if (confirm(`Revoke admin access for ${email}?`)) {
            await deleteDoc(doc(db, 'admins', adminId));
            setAdmins(admins.filter(a => a.id !== adminId));
        }
    };

    return (
        <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
            <PageHeader title="User Management" />

            <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '1.5rem' }}>

                {/* Pending Requests Section */}
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>Access Requests ({requests.length})</h2>

                {requests.length === 0 ? (
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', textAlign: 'center', color: '#6b7280', marginBottom: '2rem' }}>
                        No pending access requests.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                        {requests.map(req => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600 }}>{req.email}</div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        ID: {req.id} • {req.timestamp?.toDate().toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleApprove(req)}
                                        style={{ padding: '0.5rem', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleReject(req.id)}
                                        style={{ padding: '0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Current Admins Section */}
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#111827', marginTop: '3rem' }}>Authorized Administrators</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {admins.map(admin => (
                        <div
                            key={admin.id}
                            style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ backgroundColor: '#eff6ff', padding: '0.5rem', borderRadius: '0.5rem', color: '#2563eb' }}>
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{admin.email}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{admin.id}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRevoke(admin.id, admin.email)}
                                style={{ padding: '0.5rem', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ManageUsers;
