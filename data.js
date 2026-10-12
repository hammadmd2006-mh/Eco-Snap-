/* EcoSnap data & shared state: waste items, player state, leaderboard seed. Load first. */
// Preset Waste Items Database
const WASTE_DATABASE = {
    bottle: {
        name: "PET Plastic Bottle (#1)",
        confidence: "98.4%",
        correctBin: "blue",
        correctBinName: "Blue Bin - Dry Recyclables",
        condition: "Liquid Residue Inside",
        conditionWarning: "Dirty / Unwashed bottle detected. Rinsing yields +5 bonus points!",
        co2: 0.18,
        weight: 0.05,
        category: "Plastics",
        img: "https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=700&q=80",
        bboxText: "PET Plastic Bottle (98.4%)"
    },
    pizzabox: {
        name: "Greasy Pizza Box",
        confidence: "94.2%",
        correctBin: "green",
        correctBinName: "Green Bin - Organic / Compost",
        condition: "Grease Contaminated",
        conditionWarning: "Soiled bottom cardboard cannot be recycled! Compost dirty part in Green Bin.",
        co2: 0.22,
        weight: 0.25,
        category: "Paper",
        img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80",
        bboxText: "Greasy Cardboard (94.2%)"
    },
    battery: {
        name: "AA Alkaline Battery",
        confidence: "99.1%",
        correctBin: "yellow",
        correctBinName: "Yellow Bin - Hazardous / E-Waste",
        condition: "Intact Heavy Metal",
        conditionWarning: "Contains toxic metals! Tape terminals before dropping in Yellow bin.",
        co2: 0.35,
        weight: 0.03,
        category: "Hazardous",
        img: "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=700&q=80",
        bboxText: "AA Battery (99.1%)"
    },
    can: {
        name: "Aluminum Soda Can",
        confidence: "97.6%",
        correctBin: "blue",
        correctBinName: "Blue Bin - Metals & Recyclables",
        condition: "Clean Empty Metal",
        conditionWarning: "Clean & ready! Crush vertically to save 70% bin volume.",
        co2: 0.31,
        weight: 0.04,
        category: "Metals",
        img: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=700&q=80",
        bboxText: "Aluminum Can (97.6%)"
    },
    apple: {
        name: "Organic Apple Core",
        confidence: "96.8%",
        correctBin: "green",
        correctBinName: "Green Bin - Organic / Compost",
        condition: "Biodegradable Food",
        conditionWarning: "Organic waste! Diverts methane gas from landfills into fertile soil.",
        co2: 0.12,
        weight: 0.08,
        category: "Organic",
        img: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=700&q=80",
        bboxText: "Apple Core (96.8%)"
    },
    circuit: {
        name: "E-Waste Circuit Board",
        confidence: "98.9%",
        correctBin: "yellow",
        correctBinName: "Yellow Bin - E-Waste",
        condition: "Electronic Component",
        conditionWarning: "E-Waste hazard! Specialized recycling recovers copper and rare silver.",
        co2: 0.45,
        weight: 0.12,
        category: "Hazardous",
        img: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80",
        bboxText: "E-Waste Circuit (98.9%)"
    }
};

// Player State (Gamification System)
let playerState = {
    snapPoints: 4260, // User starts with 4,260 initial SnapPoints per prompt choice
    level: 8,
    title: "Green Guardian 🌿",
    streak: 5,
    itemsSorted: 14,
    co2Saved: 2.82,
    hasRinsedCurrent: false,
    scanLog: [
        { name: "PET Plastic Bottle (#1)", bin: "Blue Bin", condition: "Rinsed", co2: 0.18, points: 15, time: "2 mins ago" },
        { name: "Aluminum Soda Can", bin: "Blue Bin", condition: "Clean", co2: 0.31, points: 10, time: "1 hour ago" },
        { name: "Greasy Pizza Box", bin: "Green Bin", condition: "Composted", co2: 0.22, points: 10, time: "3 hours ago" },
        { name: "Organic Apple Core", bin: "Green Bin", condition: "Organic", co2: 0.12, points: 10, time: "1 day ago" }
    ]
};

// Leaderboard Dataset
let leaderboardData = [
    { rank: 1, name: "Alex", title: "Planet Champion 🌎", points: 4820, avatar: "🥇" },
    { rank: 2, name: "Rahul", title: "Planet Champion 🌎", points: 4510, avatar: "🥈" },
    { rank: 3, name: "You (Current Player)", title: "Green Guardian 🌿", points: 4260, avatar: "🥉", isUser: true },
    { rank: 4, name: "Priya", title: "Eco Explorer 🌱", points: 3890, avatar: "⭐" },
    { rank: 5, name: "Sam", title: "Waste Wrangler 🧹", points: 3450, avatar: "⭐" }
];

let currentActiveItem = WASTE_DATABASE.bottle;
let chartInstance = null;
let isWebcamLive = false;
