import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const SERVICE_ACCOUNT_PATH = './service-account.json';
const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const TAMIL_DESCRIPTION = `ஆன்மீகத் தேடலில் இருப்பவர்களுக்கு கர்மாவைப் பற்றிய சந்தேகங்கள் எப்போதும் ஒரு தடையாவே இருக்கின்றன. ஸ்ரீ பகவத் அவர்களின் 'ஆகாமிய கர்மா' நூல், இந்தச் சிக்கலான கர்ம வினைகளை மிக எளிமையாக விளக்குகிறது. நமது தற்போதைய எண்ணங்களும் செயல்களும் (ஆகாமிய கர்மா) எவ்வாறு நமது எதிர்காலத்தை மாற்றியமைக்கின்றன என்பதைப் புரியவைக்கிறது. கதைகள் மற்றும் உதாரணங்கள் மூலம், கர்மாவிலிருந்து விடுபட்டு மன அமைதியுடன் வாழ்வதற்கான வழியை இது காட்டுகிறது.`;

async function fixDescription() {
    const title = "Agamiya-Karma";
    const querySnapshot = await db.collection('books').where('title', '==', title).get();

    if (querySnapshot.empty) {
        console.log(`[NOT FOUND] Book title: "${title}"`);
        return;
    }

    const batch = db.batch();
    querySnapshot.forEach(doc => {
        batch.update(doc.ref, {
            description: TAMIL_DESCRIPTION,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });

    await batch.commit();
    console.log(`[UPDATED] ${title} with Tamil description.`);
}

fixDescription().catch(console.error);
