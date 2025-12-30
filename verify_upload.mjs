import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const SERVICE_ACCOUNT_PATH = './service-account.json';
const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verify() {
    const snapshot = await db.collection('books').get();
    console.log(`Total books in Firestore: ${snapshot.size}`);
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- "${data.title}" | Category: ${data.category}`);
    });
}

verify().catch(console.error);
