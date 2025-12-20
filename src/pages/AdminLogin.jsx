import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Lock, Mail, Chrome } from 'lucide-react';
import '../components/RegistrationStyles.css';

const AdminLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAdmin, isPending, loading: authLoading, setIsPending } = useAdminAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Get the page the user was trying to access
    const from = location.state?.from?.pathname || '/admin-review';

    useEffect(() => {
        // If already admin, redirect away
        if (!authLoading && isAdmin) {
            navigate(from, { replace: true });
        }
    }, [isAdmin, authLoading, navigate, from]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('Invalid email or password.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            setError('Google login failed: ' + err.message);
            setLoading(false);
        }
    };

    const handleRequestAccess = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await setDoc(doc(db, 'admin_requests', user.uid), {
                email: user.email,
                displayName: user.displayName || '',
                timestamp: Timestamp.now(),
                status: 'PENDING'
            });
            setIsPending(true);
            alert("Access request sent! Please wait for an existing admin to approve you.");
        } catch (err) {
            setError('Request failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return <div className="spinner">Checking access...</div>;
    }

    return (
        <div className="payment-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Admin Login</h2>

                {error && (
                    <div style={{
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        padding: '10px',
                        borderRadius: '6px',
                        marginBottom: '15px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    {/* Only show login form if user is not authenticated OR exists but not admin/pending */}
                    {(!user || user.isAnonymous) ? (
                        <>
                            <div className="form-group">
                                <label>Email</label>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '8px', padding: '0 10px', background: 'white' }}>
                                    <Mail size={20} color="#6b7280" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{ border: 'none', boxShadow: 'none' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '8px', padding: '0 10px', background: 'white' }}>
                                    <Lock size={20} color="#6b7280" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ border: 'none', boxShadow: 'none' }}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary full-width"
                                style={{ marginTop: '20px' }}
                                disabled={loading}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>

                            <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center' }}>
                                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e5e7eb' }} />
                                <span style={{ padding: '0 10px', color: '#6b7280', fontSize: '13px' }}>OR</span>
                                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e5e7eb' }} />
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="btn-secondary full-width"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                                disabled={loading}
                            >
                                <Chrome size={20} color="#4285F4" />
                                Sign in with Google
                            </button>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{ marginBottom: '1.5rem', color: '#4b5563' }}>
                                <p>Signed in as: <b>{user.email}</b></p>
                                {isPending ? (
                                    <div style={{ backgroundColor: '#fff7ed', color: '#c2410c', padding: '1rem', borderRadius: '0.75rem', marginTop: '1rem' }}>
                                        <b>Access Request Pending</b>
                                        <p style={{ fontSize: '13px', marginTop: '0.5rem' }}>An administrator needs to approve your request before you can access management tools.</p>
                                    </div>
                                ) : (
                                    <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '0.75rem', marginTop: '1rem' }}>
                                        <b>Unauthorized</b>
                                        <p style={{ fontSize: '13px', marginTop: '0.5rem' }}>You do not have administrative privileges.</p>
                                        <button
                                            type="button"
                                            onClick={handleRequestAccess}
                                            className="btn-primary"
                                            style={{ marginTop: '1rem', width: '100%', background: '#dc2626' }}
                                            disabled={loading}
                                        >
                                            {loading ? 'Sending Request...' : 'Request Admin Access'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button type="button" onClick={() => auth.signOut()} style={{ color: '#6b7280', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Sign out</button>
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <button type="button" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>Back to Home</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
