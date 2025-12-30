const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('./service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateDescriptions() {
    try {
        const booksInfo = JSON.parse(fs.readFileSync('books_info.json', 'utf8'));
        const snapshot = await db.collection('books').get();
        const firestoreBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log(`Loaded ${booksInfo.length} PDF info entries and ${firestoreBooks.length} Firestore books.`);

        for (const book of firestoreBooks) {
            const title = book.title;
            console.log(`Processing: ${title}`);

            // Manual and heuristic matching
            const mappings = {
                "Gnana Viduthalai-Kavalaigal Anaithirkum Theervu - Combo": ["ஞான விடுதலை", "கவலைகள் அனைத்தும்"],
                "Kavaligal Anaithirkum Theervu": ["கவலைகள்_அனைத்திற்கும்_தீர்வு", "Kavalaigal Anaithirkum Theervu"],
                "Karma Vinai": ["Karma Vinai", "f®kh Éid"], // Transliterated OCR
                "Gnana Pattarai": ["ஞான பட்டறை", "Gnana Pattarai"],
                "Pathu Kattalai": ["Pathu Kattalai", "Pathu Kattalaigal"],
                "Sath Dharisanam": ["சத் தரிசனம்", "Sath Dharisanam"],
                "Aanmana-Ragasiam": ["ஆன்ம ஞான ரகசியம்", "Anma Gnana Ragasiyam", "Aanmana-Ragasiam"],
                "Gnana-Viduthalai": ["ஞான விடுதலை", "Gnana Vidudhalai"],
                "Aanmavai-Thrundu-Aanmavaga-Iru": ["ஆன்மாவை_துறந்து_ஆன்மாவாக_இரு", "Aanmavai Thurandhu"],
                "Dhyanathai-Vidu-Gnanathai-Peru": ["தியானத்தை_விடு_ஞானத்தை_பெறு", "Thiyanathai Vidu"],
                "Gnana Malarvu": ["ஞான மலர்வு", "Gnana Malarvu"],
                "Agamiya-Karma": ["ஆகாமிய கர்மா", "Agamiya Karma"],
                "Summa-Iru": ["சும்மா இரு", "Summa-Iru"],
                "Renounce God & Be God": ["Renounce-God-Be-God"],
                "Absolute Reality": ["Absolute-Reality"],
                "Give Up Meditation Get Enlightment": ["Give-up-meditation-Get-enlightenment"],
                "Dont Delay Enlighment": ["Dont-Delay-Enlightenment"]
            };

            let matchedPdf = null;
            const searchTerms = mappings[title] || [title];

            const normalize = (s) => s.toLowerCase().replace(/\s+/g, '').replace(/[.-]/g, '');

            // Priority 1: Filename matches
            for (const term of searchTerms) {
                const normalizedTerm = normalize(term);
                matchedPdf = booksInfo.find(p => normalize(p.filename).includes(normalizedTerm));
                if (matchedPdf) break;
            }

            // Priority 2: Sample text matches (only if no filename match)
            if (!matchedPdf) {
                for (const term of searchTerms) {
                    const normalizedTerm = normalize(term);
                    matchedPdf = booksInfo.find(p => normalize(p.sample_text).includes(normalizedTerm));
                    if (matchedPdf) break;
                }
            }

            if (matchedPdf) {
                console.log(`  Matched with: ${matchedPdf.filename}`);
                let description = "";

                const text = matchedPdf.sample_text;

                // Strategy 1: Look for "About the Author" or "Introduction" or "gâ¥òiu" (Introduction in OCR)
                const markers = ["About the Author", "Introduction", "Ã]©Aç«", "gâ¥òiu", "Ã]©A :", "About the Book"];
                let foundMarker = false;
                for (const marker of markers) {
                    const index = text.indexOf(marker);
                    if (index !== -1) {
                        // Take text after marker, up to next big block or end
                        description = text.substring(index + marker.length).trim();
                        foundMarker = true;
                        break;
                    }
                }

                if (!foundMarker || description.length < 50) {
                    // Strategy 2: Get first few paragraphs that aren't copyright/metadata
                    const blocks = text.split('\n\n').filter(b => b.trim().length > 50);
                    description = blocks.find(b =>
                        !b.includes("Copyright") &&
                        !b.includes("First Edition") &&
                        !b.includes("Published by") &&
                        !b.includes("Printed at")
                    ) || blocks[0] || "";
                }

                // Clean up description
                description = description.replace(/\s+/g, ' ').substring(0, 500).trim();
                if (description.length > 497) description += "...";

                if (description && description.length > 30) {
                    console.log(`  Updating description: ${description.substring(0, 50)}...`);
                    await db.collection('books').doc(book.id).update({
                        description: description,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    console.log(`  No suitable description found in PDF text.`);
                }
            } else {
                console.log(`  No matching PDF found.`);
            }
        }

        console.log("Update completed.");
    } catch (error) {
        console.error("Error updating descriptions:", error);
    }
}

updateDescriptions();
