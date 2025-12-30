import React, { useEffect, useState } from 'react';
import { TransactionService } from '../services/TransactionService';
import PageHeader from '../components/PageHeader';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = TransactionService.streamUserTransactions((data) => {
            const bookOrders = (data || []).filter(tx => tx.itemType === 'BOOK' || (tx.orderItems && tx.orderItems.length > 0));
            setOrders(bookOrders);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'BNK_VERIFIED': return 'green';
            case 'PENDING': return 'orange';
            case 'REJECTED': return 'red';
            default: return 'gray';
        }
    };

    const formatDate = (ts) => {
        if (!ts) return "";
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return date.toLocaleDateString();
    };

    return (
        <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingBottom: '20px' }}>
            <PageHeader title="My Orders" />

            <div style={{ padding: '16px' }}>
                {loading && <p style={{ textAlign: 'center' }}>Loading Orders...</p>}
                {!loading && orders.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>
                        <p>No orders found yet.</p>
                    </div>
                )}

                {orders.map(order => (
                    <div key={order.id} className="card" style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>{formatDate(order.timestamp)}</span>
                            <span style={{
                                color: getStatusColor(order.status),
                                fontWeight: 'bold',
                                fontSize: '11px',
                                background: '#f3f4f6',
                                padding: '2px 8px',
                                borderRadius: '12px'
                            }}>
                                {order.status === 'BNK_VERIFIED' ? 'COMPLETED' : order.status}
                            </span>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            {order.orderItems?.map((item, idx) => (
                                <div key={idx} style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
                                    {item.title} <span style={{ fontWeight: 400, color: '#666' }}>x {item.quantity}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
                            <div style={{ fontSize: '13px', color: '#4b5563' }}>
                                Total: <strong style={{ color: '#111827' }}>₹{order.amount}</strong>
                            </div>
                            <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 500 }}>
                                View Details ↗
                            </div>
                        </div>

                        {order.shippingAddress && (
                            <div style={{ marginTop: '12px', fontSize: '12px', color: '#666', background: '#f9fafb', padding: '8px', borderRadius: '4px' }}>
                                <strong>Ship to:</strong> {order.shippingAddress.name}, {order.shippingAddress.city}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyOrders;
