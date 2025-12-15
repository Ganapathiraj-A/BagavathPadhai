const files = [
    { name: "January 2024" },
    { name: "february 2024" },
    { name: "March 2024" },
    { name: "April 2024" },
    { name: "Jan 2023" }, // Abbr
    { name: "Feb 23" },   // Abbr
    { name: "Dec 2023" },
    { name: "Random File" },
    { name: "ஜனவரி 2024" },
    { name: "பிப்ரவரி 2024" },
    { name: "மார்ச் 2024" },
    { name: "ஏப்ரல் 2024" },
    { name: "மே 2024" },
    { name: "ஜூன் 2024" },
    { name: "ஜூலை 2024" },
    { name: "ஆகஸ்ட் 2024" },
    { name: "செப்டம்பர் 2024" },
    { name: "அக்டோபர் 2024" },
    { name: "நவம்பர் 2024" },
    { name: "டிசம்பர் 2024" },
    { name: "1. January" }
];

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTHS_ABBR = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTHS_TAMIL = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];

const getMonthIndex = (name) => {
    if (!name) return -1;
    const lower = name.toLowerCase();

    // Check full names first
    let idx = MONTHS.findIndex(m => lower.includes(m));
    if (idx !== -1) return idx;

    // Check Tamil
    idx = MONTHS_TAMIL.findIndex(m => name.includes(m)); // Use original name for Tamil as it's not case-insensitive
    if (idx !== -1) return idx;

    // Check abbreviations
    idx = MONTHS_ABBR.findIndex(m => lower.includes(m));
    return idx;
};

const sortItems = (a, b) => {
    const idxA = getMonthIndex(a.name);
    const idxB = getMonthIndex(b.name);

    console.log(`Comparing ${a.name} (${idxA}) vs ${b.name} (${idxB})`);

    if (idxA !== -1 && idxB !== -1) {
        if (idxA !== idxB) return idxA - idxB;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    }

    // Prioritize items WITH months over items WITHOUT
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;

    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
};

const sorted = files.sort(sortItems);
console.log("Sorted Result:", sorted.map(f => f.name));
