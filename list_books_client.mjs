import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDcWq4rwAmFznpm3KT-AqljZHy17w9Wj1Q",
    authDomain: "sri-bagavath-dev.firebaseapp.com",
    projectId: "sri-bagavath-dev",
    storageBucket: "sri-bagavath-dev.firebasestorage.app",
    messagingSenderId: "265576571338",
    appId: "1:265576571338:web:d03c5576d41e0c2a25ef33"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listBooks() {
    try {
        const querySnapshot = await getDocs(collection(db, 'books'));
        const books = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Found " + books.length + " books.");
        books.forEach(b => console.log("- " + b.title));
    } catch (e) {
        console.error("Error fetching books:", e);
    }
}

listBooks();
