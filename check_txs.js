import { db } from './src/firebase.js';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';

async function checkTransactions() {
    console.log("Fetching latest transactions...");
    const q = query(collection(db, "transactions"), limit(20));
    const snap = await getDocs(q);

    if (snap.empty) {
        console.log("No transactions found.");
        return;
    }

    snap.docs.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id}`);
        console.log(`  Item: ${data.itemName}`);
        console.log(`  DeviceID: ${data.deviceId}`);
        console.log(`  Timestamp: ${data.timestamp?.toDate().toLocaleString()}`);
        console.log(`  Amount: ${data.amount}`);
        console.log('---');
    });
}

checkTransactions().catch(console.error);
