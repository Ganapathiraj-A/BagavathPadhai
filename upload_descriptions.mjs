import admin from 'firebase-admin';
import fs from 'fs';
import { readFileSync } from 'fs';

// Configuration
const SERVICE_ACCOUNT_PATH = './service-account.json';
const PREFACES_FILE = './book_prefaces.txt';

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const TITLE_MAPPING = {
    "Absolute Reality": "Absolute Reality",
    "Agamiya Karma": "Agamiya-Karma",
    "Divine You": "Divine You",
    "Don't Delay Enlightenment": "Dont Delay Enlighment",
    "Give up Meditation Get Enlightenment": "Give Up Meditation Get Enlightment",
    "Renounce God & Be God": "Renounce God & Be God",
    "Vedanta": "Vedanta",
    "ஆகாமிய கர்மா": "Karma Vinai",
    "ஆன்ம ஞான ரகசியம்": "Aanmana-Ragasiam",
    "ஆன்மாவை_துறந்து_ஆன்மாவாக_இரு": "Aanmavai-Thrundu-Aanmavaga-Iru",
    "கவலைகள்_அனைத்திற்கும்_தீர்வு": "Kavaligal Anaithirkum Theervu",
    "சத் தரிசனம்": "Sath Dharisanam",
    "ஞான பட்டறை": "Gnana Pattarai",
    "ஞான மலர்வு": "Gnana Malarvu",
    "ஞான விடுதலை": "Gnana-Viduthalai",
    "தியானத்தை_விடு_ஞானத்தை_பெறு": "Dhyanathai-Vidu-Gnanathai-Peru",
    "வேதாந்தம்": "Vedantham",
    "சும்மா இரு": "Summa-Iru",
    "பத்து கட்டளைகள்": "Pathu Kattalai",
    "நம்மை அறிவோம்": "Nammai Arivom",
    "ஞான விடுதலை (காம்போ)": "Gnana Viduthalai-Kavalaigal Anaithirkum Theervu - Combo",
    "சும்மா இரு (காம்போ)": "Summa Iru-Anma Gnanam-Anmavai Thurnthu Anmavaka Iru - Combo"
};

async function uploadDescriptions() {
    const content = fs.readFileSync(PREFACES_FILE, 'utf8');
    const sections = content.split(/Book: /g).slice(1);

    console.log(`Found ${sections.length} sections in file.`);

    for (const section of sections) {
        const lines = section.split('\n');
        const textTitle = lines[0].trim();
        const description = lines.slice(2).join('\n').trim();

        if (!textTitle || !description) continue;

        const firestoreTitle = TITLE_MAPPING[textTitle] || textTitle;

        try {
            const querySnapshot = await db.collection('books').where('title', '==', firestoreTitle).get();

            if (querySnapshot.empty) {
                console.log(`[NOT FOUND] Book title: "${firestoreTitle}"`);
                continue;
            }

            const batch = db.batch();
            querySnapshot.forEach(doc => {
                batch.update(doc.ref, { description: description });
            });

            await batch.commit();
            console.log(`[UPDATED] ${firestoreTitle}`);
        } catch (error) {
            console.error(`[ERROR] Updating ${title}:`, error.message);
        }
    }

    console.log('\nUpload complete.');
}

uploadDescriptions().catch(console.error);
