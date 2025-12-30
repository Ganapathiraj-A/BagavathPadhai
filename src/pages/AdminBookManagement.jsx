import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, ChevronLeft, LogOut, Package, Image as ImageIcon, BookOpen } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, setDoc, query, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { signOut } from 'firebase/auth';

// Helper to compress image to Base64
const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith('.heic')) {
            reject(new Error("HEIC format is not supported by the browser. Please use a standard JPEG or PNG image."));
            return;
        }

        const attemptLoad = (src, isBlob) => {
            const img = new Image();
            img.onload = () => {
                if (isBlob) URL.revokeObjectURL(src);
                try {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 800;

                    if (width > MAX_WIDTH) {
                        height = (height * MAX_WIDTH) / width;
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    let quality = 0.8;
                    let dataUrl = canvas.toDataURL('image/jpeg', quality);
                    const TARGET_SIZE = 350000; // 350KB target

                    while (dataUrl.length * 0.75 > TARGET_SIZE && quality > 0.3) {
                        quality -= 0.1;
                        dataUrl = canvas.toDataURL('image/jpeg', quality);
                    }

                    resolve(dataUrl);
                } catch (e) {
                    reject(new Error("Image processing error: " + e.message));
                }
            };

            img.onerror = (e) => {
                if (isBlob) {
                    URL.revokeObjectURL(src);
                    const reader = new FileReader();
                    reader.onload = (re) => attemptLoad(re.target.result, false);
                    reader.onerror = (err) => reject(new Error("Failed to read file: " + err.message));
                    reader.readAsDataURL(file);
                } else {
                    reject(new Error("Unable to load image. Only JPEG/PNG are supported."));
                }
            };

            img.src = src;
        };

        try {
            const objectUrl = URL.createObjectURL(file);
            attemptLoad(objectUrl, true);
        } catch (e) {
            const reader = new FileReader();
            reader.onload = (re) => attemptLoad(re.target.result, false);
            reader.readAsDataURL(file);
        }
    });
};

const CATEGORIES = ['Tamil Books', 'English Books'];

const AdminBookManagement = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [coverImage, setCoverImage] = useState(null);

    const action = searchParams.get('action');
    const editingId = searchParams.get('id');
    const showForm = action === 'add' || action === 'edit';
    const editingBook = action === 'edit' ? books.find(b => b.id === editingId) : null;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Tamil Books',
        price: '',
        weight: '',
        hasCover: false,
        coverUrl: ''
    });

    useEffect(() => {
        loadBooks();
    }, []);

    useEffect(() => {
        if (editingBook) {
            setFormData({
                title: editingBook.title || '',
                description: editingBook.description || '',
                category: editingBook.category || 'Tamil Books',
                price: editingBook.price || '',
                weight: editingBook.weight || '',
                hasCover: editingBook.hasCover || false,
                coverUrl: ''
            });

            if (editingBook.hasCover) {
                const fetchCover = async () => {
                    try {
                        const snap = await getDoc(doc(db, 'book_covers', editingBook.id));
                        if (snap.exists()) {
                            setFormData(prev => ({ ...prev, coverUrl: snap.data().cover }));
                        }
                    } catch (e) {
                        console.error("Cover fetch failed", e);
                    }
                };
                fetchCover();
            }
        } else if (action === 'add') {
            resetForm();
        }
    }, [editingBook, action]);

    const loadBooks = async () => {
        try {
            setLoading(true);
            const querySnapshot = await getDocs(query(collection(db, 'books'), orderBy('title', 'asc')));
            const loadedBooks = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBooks(loadedBooks);
        } catch (error) {
            console.error('Error loading books:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverImage(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            let finalCoverUrl = formData.coverUrl;

            if (coverImage) {
                try {
                    finalCoverUrl = await compressImage(coverImage);
                } catch (compressError) {
                    console.error("Compression failed:", compressError);
                    alert("Image processing failed: " + compressError.message);
                    throw compressError;
                }
            }

            const bookData = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                price: Number(formData.price),
                weight: Number(formData.weight),
                hasCover: !!finalCoverUrl,
                updatedAt: serverTimestamp()
            };

            let bookId;
            if (editingBook) {
                bookId = editingBook.id;
                await updateDoc(doc(db, 'books', bookId), bookData);
            } else {
                const docRef = await addDoc(collection(db, 'books'), { ...bookData, createdAt: serverTimestamp() });
                bookId = docRef.id;
            }

            if (finalCoverUrl && (coverImage || finalCoverUrl !== editingBook?.coverUrl)) {
                await setDoc(doc(db, 'book_covers', bookId), {
                    cover: finalCoverUrl,
                    updatedAt: serverTimestamp()
                });
            }

            alert(editingBook ? 'Book updated!' : 'Book added!');
            setSearchParams({});
            resetForm();
            loadBooks();
        } catch (error) {
            console.error('Error saving book:', error);
            alert('Error saving book: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (bookId) => {
        if (window.confirm('Are you sure you want to delete this book?')) {
            try {
                await deleteDoc(doc(db, 'books', bookId));
                await deleteDoc(doc(db, 'book_covers', bookId)).catch(() => { });
                alert('Book deleted!');
                loadBooks();
            } catch (error) {
                alert('Delete failed: ' + error.message);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            category: 'Tamil Books',
            price: '',
            weight: '',
            hasCover: false,
            coverUrl: ''
        });
        setCoverImage(null);
    };

    const handleLogout = async () => {
        if (confirm("Logout?")) {
            await GoogleAuth.signOut();
            await signOut(auth);
            navigate('/');
        }
    };

    if (loading && !showForm) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>Loading books...</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)' }}>
            <PageHeader
                title="Book Management"
                leftAction={
                    <button onClick={() => navigate('/configuration')} style={{ background: 'none', border: 'none', padding: '8px' }}>
                        <ChevronLeft size={24} />
                    </button>
                }
                rightAction={
                    <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#dc2626' }}>
                        <LogOut size={20} />
                    </button>
                }
            />

            <div style={{ padding: '1.5rem', maxWidth: '64rem', margin: '0 auto' }}>
                {!showForm ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <button
                            onClick={() => setSearchParams({ action: 'add' })}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                borderRadius: '0.5rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                border: 'none',
                                width: '100%',
                                marginBottom: '1.5rem'
                            }}
                        >
                            <Plus size={20} /> Add New Book
                        </button>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {books.map(book => (
                                <div key={book.id} style={{ padding: '1.25rem', backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ width: '48px', height: '64px', backgroundColor: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {book.hasCover ? <BookOpen size={24} color="#9ca3af" /> : <ImageIcon size={24} color="#d1d5db" />}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{book.title}</h3>
                                            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '2px 0' }}>{book.category} • ₹{book.price} • {book.weight}g</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => setSearchParams({ action: 'edit', id: book.id })} style={{ padding: '0.5rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(book.id)} style={{ padding: '0.5rem', backgroundColor: '#ef4444', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {books.length === 0 && <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>No books found. Add your first book!</p>}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Book Title *</label>
                                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Category *</label>
                                <select name="category" value={formData.category} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}>
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Price (₹) *</label>
                                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Weight (grams) *</label>
                                    <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Cover Image</label>
                                <input type="file" onChange={handleImageChange} accept="image/*" style={{ width: '100%', padding: '0.5rem' }} />
                                {(coverImage || formData.coverUrl) && (
                                    <div style={{ marginTop: '1rem', position: 'relative', width: '120px' }}>
                                        <img src={coverImage ? URL.createObjectURL(coverImage) : formData.coverUrl} alt="Cover Preview" style={{ width: '100%', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }} />
                                        <button type="button" onClick={() => { setCoverImage(null); setFormData(p => ({ ...p, coverUrl: '' })); }} style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', width: '24px', height: '24px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Package size={14} /></button>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setSearchParams({})} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={uploading} style={{ flex: 2, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'var(--color-primary)', color: 'white', fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
                                    {uploading ? 'Saving...' : (editingBook ? 'Update Book' : 'Add Book')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AdminBookManagement;
