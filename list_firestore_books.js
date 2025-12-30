import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listBooks() {
    const snapshot = await db.collection('books').get();
    const books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Found ${books.length} books.`);
    books.forEach(b => console.log(b.title));
}

listBooks().catch(console.error);
