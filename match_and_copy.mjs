import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { readFileSync } from 'fs';

// Configuration
const SERVICE_ACCOUNT_PATH = './service-account.json';
const DIGITAL_BOOKS_BASE = '/home/ganapathiraj/Code/AndroidDevelopment/SriBagavath/DigitalBooks';
const DEST_DIR = '/home/ganapathiraj/Code/AndroidDevelopment/DevCleanBooks';

// Mappings
const MAPPINGS = {
    "Gnana Viduthalai-Kavalaigal Anaithirkum Theervu - Combo": "Tamil/ஞான விடுதலை.pdf",
    "Kavaligal Anaithirkum Theervu": "Tamil/கவலைகள்_அனைத்திற்கும்_தீர்வு.pdf",
    "Karma Vinai": "Tamil/ஆகாமிய கர்மா.pdf",
    "Absolute Reality": "English/Absolute-Reality.pdf",
    "Vedanta": "English/Vedanta.pdf",
    "Gnana Pattarai": "Tamil/ஞான பட்டறை.pdf",
    "Summa Iru-Anma Gnanam-Anmavai Thurnthu Anmavaka Iru - Combo": "Tamil/சும்மா இரு.pdf",
    "Pathu Kattalai": "Tamil/Pathu Kattalaigal_240710_115549.pdf",
    "Sath Dharisanam": "Tamil/சத் தரிசனம்.pdf",
    "Aanmana-Ragasiam": "Tamil/ஆன்ம ஞான ரகசியம்.pdf",
    "Gnana-Viduthalai": "Tamil/ஞான விடுதலை.pdf",
    "Aanmavai-Thrundu-Aanmavaga-Iru": "Tamil/ஆன்மாவை_துறந்து_ஆன்மாவாக_இரு.pdf",
    "Dhyanathai-Vidu-Gnanathai-Peru": "Tamil/தியானத்தை_விடு_ஞானத்தை_பெறு.pdf",
    "Gnana Malarvu": "Tamil/ஞான மலர்வு.pdf",
    "Divine You": "English/Divine-You.pdf",
    "Dont Delay Enlighment": "English/Dont-Delay-Enlightenment.pdf",
    "Give Up Meditation Get Enlightment": "English/Give-up-meditation-Get-enlightenment.pdf",
    "Renounce God & Be God": "English/Renounce-God-Be-God.pdf",
    "Vedantham": "Tamil/வேதாந்தம்.pdf",
    "Nammai Arivom": "Tamil/Nammai Arivom Book  26-4-2024.pdf",
    "Agamiya-Karma": "English/Agamiya Karma English version 6.8.16.pdf",
    "Summa-Iru": "Tamil/சும்மா இரு.pdf"
};

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function main() {
    if (!fs.existsSync(DEST_DIR)) {
        fs.mkdirSync(DEST_DIR, { recursive: true });
        console.log(`Created destination directory: ${DEST_DIR}`);
    }

    const snapshot = await db.collection('books').get();
    const titles = snapshot.docs.map(doc => doc.data().title);

    console.log(`Found ${titles.length} books in Firestore.`);

    let copiedCount = 0;
    const missing = [];

    for (const title of titles) {
        const relPath = MAPPINGS[title];
        if (!relPath) {
            console.log(`No direct mapping for: ${title}`);
            missing.push(title);
            continue;
        }

        const srcPath = path.join(DIGITAL_BOOKS_BASE, relPath);
        if (fs.existsSync(srcPath)) {
            let fileName = path.basename(srcPath);
            let destPath = path.join(DEST_DIR, fileName);

            // Handle filename conflicts
            const ext = path.extname(fileName);
            const base = path.basename(fileName, ext);
            let counter = 1;
            while (fs.existsSync(destPath)) {
                destPath = path.join(DEST_DIR, `${base}_${counter}${ext}`);
                counter++;
            }

            fs.copyFileSync(srcPath, destPath);
            console.log(`Copied: ${title} -> ${path.basename(destPath)}`);
            copiedCount++;
        } else {
            console.log(`File not found for ${title}: ${srcPath}`);
            missing.push(title);
        }
    }

    console.log(`\nSummary:`);
    console.log(`Total processed: ${titles.length}`);
    console.log(`Successfully copied: ${copiedCount}`);
    if (missing.length > 0) {
        console.log(`Missing/Unmatched: ${missing.length}`);
        missing.forEach(m => console.log(` - ${m}`));
    }
}

main().catch(console.error);
