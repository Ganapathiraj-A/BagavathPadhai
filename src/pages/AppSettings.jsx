import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard, Home, Layers, Settings } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const AppSettings = () => {
    const navigate = useNavigate();
    const [landingPage, setLandingPage] = useState(localStorage.getItem('admin_landing_page') || '/');

    const handleLandingPageChange = (e) => {
        const newValue = e.target.value;
        setLandingPage(newValue);
        localStorage.setItem('admin_landing_page', newValue);
        window.dispatchEvent(new Event('storage'));
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            <PageHeader
                title="App Settings"
                leftAction={
                    <button onClick={() => navigate('/configuration')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                        <ChevronLeft size={24} />
                    </button>
                }
            />

            <div style={{ padding: '1.5rem', maxWidth: '32rem', margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        border: '1px solid #e5e7eb'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb'
                        }}>
                            <Settings size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>General Preferences</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
                            Default Landing Page
                        </label>
                        <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                            Choose which screen opens by default when you log in or launch the app.
                        </p>
                        <select
                            value={landingPage}
                            onChange={handleLandingPageChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #e5e7eb',
                                backgroundColor: 'white',
                                fontSize: '1rem',
                                color: '#1f2937',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="/">Default Home Page</option>
                            <option value="/configuration">Admin Home Screen</option>
                            <option value="/admin/program-management">Admin - Program Hub</option>
                            <option value="/admin-dashboard">Analytics Dashboard</option>
                        </select>
                    </div>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
                            Changes are saved automatically and synced across your sessions.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AppSettings;
