/* EcoSnap application engine: navigation, HUD, scan game, rewards, leaderboard, impact dashboard, toasts. */
// Navigation Tab Logic
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-eco-800', 'bg-eco-50', 'shadow-sm');
        btn.classList.add('text-slate-600');
    });

    const activeBtn = document.getElementById(`nav-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.add('text-eco-800', 'bg-eco-50', 'shadow-sm');
        activeBtn.classList.remove('text-slate-600');
    }

    if (tabId === 'leaderboard') renderLeaderboard();
    if (tabId === 'impact') renderImpactDashboard();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

// Gamification HUD & Progression Updater
function updatePlayerHUD() {
    // Level Title mapping calculation
    let pts = playerState.snapPoints;
    let level = 1;
    let title = "Eco Novice 🌱";
    let nextLevelPts = 500;

    if (pts >= 3500) {
        level = 10;
        title = "Planet Champion 🌎";
        nextLevelPts = 5000;
    } else if (pts >= 2000) {
        level = 8;
        title = "Green Guardian 🌿";
        nextLevelPts = 3500;
    } else if (pts >= 1200) {
        level = 5;
        title = "Eco Explorer 🌱";
        nextLevelPts = 2000;
    } else if (pts >= 500) {
        level = 3;
        title = "Waste Wrangler 🧹";
        nextLevelPts = 1200;
    }

    playerState.level = level;
    playerState.title = title;

    // DOM Updates
    document.getElementById('hud-snappoints').innerText = pts.toLocaleString();
    document.getElementById('hud-level-badge').innerHTML = `<i class="fa-solid fa-star"></i> Lvl ${level}`;
    document.getElementById('hud-level-title').innerText = title;

    // Home Stats
    document.getElementById('home-stat-points').innerText = pts.toLocaleString();
    document.getElementById('home-stat-items').innerText = `${playerState.itemsSorted} Items`;
    document.getElementById('home-stat-co2').innerText = `${playerState.co2Saved.toFixed(2)} kg`;

    // Calculate Progress Bar %
    let prevLevelPts = level === 8 ? 2000 : (level === 5 ? 1200 : 500);
    let progressPct = Math.min(100, Math.max(10, Math.round(((pts - prevLevelPts) / (nextLevelPts - prevLevelPts)) * 100)));
    document.getElementById('hud-level-progress').style.width = `${progressPct}%`;
    document.getElementById('hud-progress-text').innerText = `${progressPct}%`;

    // Sync User Score in Leaderboard
    const userLbEntry = leaderboardData.find(item => item.isUser);
    if (userLbEntry) {
        userLbEntry.points = pts;
        userLbEntry.title = title;
    }

    // Re-sort leaderboard by points descending
    leaderboardData.sort((a, b) => b.points - a.points);
    leaderboardData.forEach((item, index) => item.rank = index + 1);

    const updatedUserRank = leaderboardData.find(item => item.isUser).rank;
    document.getElementById('home-stat-rank').innerText = `#${updatedUserRank} Campus`;
}

// Add Points with Animated Particle Effect
function addSnapPoints(amount, sourceReason) {
    playerState.snapPoints += amount;
    updatePlayerHUD();
    triggerFloatingPointsAnim(`+${amount} SnapPoints ♻️`);
}

// Floating Points Particles
function triggerFloatingPointsAnim(text) {
    const container = document.getElementById('floating-points-container');
    const el = document.createElement('div');
    el.className = 'absolute font-black text-amber-300 text-lg bg-slate-900/90 px-4 py-2 rounded-2xl border-2 border-amber-400 shadow-2xl animate-float-points pointer-events-none z-50 flex items-center gap-1.5';
    el.innerHTML = `<span>⚡</span> ${text}`;

    // Randomize position near top center / HUD
    el.style.left = `${Math.random() * 40 + 30}%`;
    el.style.top = `20%`;

    container.appendChild(el);
    setTimeout(() => el.remove(), 1200);
}

// Scan Game Modes
function setScanMode(mode) {
    const presetBar = document.getElementById('scanner-presets-bar');
    const fileZone = document.getElementById('scanner-file-zone');
    const camStream = document.getElementById('webcam-stream');
    const activeImg = document.getElementById('scanner-active-img');

    if (mode === 'preset') {
        presetBar.classList.remove('hidden');
        fileZone.classList.add('hidden');
        camStream.classList.add('hidden');
        activeImg.classList.remove('hidden');
    } else if (mode === 'file') {
        presetBar.classList.add('hidden');
        fileZone.classList.remove('hidden');
        camStream.classList.add('hidden');
        activeImg.classList.remove('hidden');
    } else if (mode === 'cam') {
        presetBar.classList.remove('hidden');
        fileZone.classList.add('hidden');
        toggleLiveCamera();
    }
}

// Preset Item Loader
function loadScanPreset(key) {
    const item = WASTE_DATABASE[key];
    if (!item) return;

    currentActiveItem = item;
    playerState.hasRinsedCurrent = false;

    document.getElementById('scanner-active-img').src = item.img;
    document.getElementById('scan-res-name').innerText = item.name;
    document.getElementById('scan-res-confidence').innerText = `${item.confidence} Confidence`;
    document.getElementById('scan-res-condition-text').innerText = item.conditionWarning;
    document.getElementById('ai-bbox-text').innerText = item.bboxText;

    // Reset rinse button text
    const rinseBtn = document.getElementById('rinse-btn');
    rinseBtn.classList.remove('bg-emerald-600', 'text-white');
    rinseBtn.classList.add('bg-amber-500', 'text-slate-950');
    rinseBtn.innerHTML = `<i class="fa-solid fa-soap mr-1"></i> Rinse First (+5 Pts)`;

    showToast(`Loaded item: ${item.name}`, 'info');
}

function applyRinseBonus() {
    if (playerState.hasRinsedCurrent) {
        showToast('Item already rinsed!', 'info');
        return;
    }
    playerState.hasRinsedCurrent = true;
    addSnapPoints(5, "Rinse Bonus");

    const rinseBtn = document.getElementById('rinse-btn');
    rinseBtn.classList.remove('bg-amber-500', 'text-slate-950');
    rinseBtn.classList.add('bg-emerald-600', 'text-white');
    rinseBtn.innerHTML = `<i class="fa-solid fa-check mr-1"></i> Rinsed (+5 Pts Added)`;

    document.getElementById('scan-res-condition-text').innerText = "Rinsed & Cleaned! Clean materials prevent batch recycling contamination.";
    showToast('+5 SnapPoints Bonus earned for rinsing item!', 'success');
}

// SUBMIT BIN CHOICE MINI-GAME CORE LOGIC
function submitBinChoice(selectedBinColor) {
    const correctColor = currentActiveItem.correctBin;

    if (selectedBinColor === correctColor) {
        // CORRECT BIN PLACEMENT!
        playerState.itemsSorted++;
        playerState.co2Saved += currentActiveItem.co2;

        let pointsEarned = 10;
        let bonusMessages = ["+10 SnapPoints for correct bin placement!"];

        // Check 10-item streak bonus
        if (playerState.itemsSorted % 10 === 0) {
            pointsEarned += 50;
            bonusMessages.push("🔥 10-Item Streak Bonus: +50 SnapPoints!");
        }

        addSnapPoints(pointsEarned, "Correct Bin");

        // Trigger Confetti Celebration
        confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
        });

        // Add to Log
        playerState.scanLog.unshift({
            name: currentActiveItem.name,
            bin: `${selectedBinColor.toUpperCase()} Bin`,
            condition: playerState.hasRinsedCurrent ? "Rinsed (+5 Pts)" : "Standard",
            co2: currentActiveItem.co2,
            points: pointsEarned,
            time: "Just now"
        });

        // Show Celebration Modal
        openRewardModal(
            `+${pointsEarned} SnapPoints ♻️`,
            `Awesome! ${currentActiveItem.name} correctly placed in the ${currentActiveItem.correctBinName}.`,
            bonusMessages
        );

    } else {
        // INCORRECT BIN CHOICE
        showToast(`Incorrect bin! ${currentActiveItem.name} belongs in the ${currentActiveItem.correctBinName}. Try again!`, 'error');
    }
}

// Quiz Answer
function handleHomeQuizAnswer(colorChoice) {
    if (colorChoice === 'green') {
        confetti({ particleCount: 50, spread: 60 });
        addSnapPoints(10, "Quiz Bonus");
        showToast("Correct! Greasy pizza box cardboard cannot be recycled and goes to Green Compost! +10 SnapPoints!", "success");
    } else {
        showToast("Not quite! Soiled greasy cardboard goes in the Green Bin for composting.", "info");
    }
}

// Live Camera Toggle
async function toggleLiveCamera() {
    const video = document.getElementById('webcam-stream');
    const img = document.getElementById('scanner-active-img');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.classList.remove('hidden');
        img.classList.add('hidden');
        isWebcamLive = true;
        showToast("Webcam active. Point camera at waste item.", "success");
    } catch (err) {
        showToast("Camera access unavailable. Using preset simulator.", "info");
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            document.getElementById('scanner-active-img').src = evt.target.result;
            setScanMode('preset');
            loadScanPreset('bottle');
            showToast("Uploaded photo analyzed by AI model", "success");
        };
        reader.readAsDataURL(file);
    }
}

// Reward Modal Controls
function openRewardModal(title, desc, breakdownList) {
    const modal = document.getElementById('reward-modal');
    const card = document.getElementById('reward-modal-card');

    document.getElementById('reward-modal-title').innerText = title;
    document.getElementById('reward-modal-desc').innerText = desc;

    const bdBox = document.getElementById('reward-modal-breakdown');
    bdBox.innerHTML = breakdownList.map(msg => `<div>• ${msg}</div>`).join('');

    modal.classList.remove('hidden');
    setTimeout(() => {
        card.classList.remove('scale-95', 'opacity-0');
        card.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeRewardModal() {
    const modal = document.getElementById('reward-modal');
    const card = document.getElementById('reward-modal-card');

    card.classList.remove('scale-100', 'opacity-100');
    card.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

// Leaderboard Renderer
function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-tbody');
    tbody.innerHTML = leaderboardData.map((user) => `
        <tr class="${user.isUser ? 'bg-eco-50/80 font-bold border-l-4 border-eco-600' : 'hover:bg-slate-50'} transition-colors">
            <td class="py-3.5 px-3">
                <span class="text-base">${user.avatar}</span>
                <span class="font-extrabold text-slate-700 ml-1">#${user.rank}</span>
            </td>
            <td class="py-3.5 px-3 font-bold ${user.isUser ? 'text-eco-900' : 'text-slate-800'}">
                ${user.name} ${user.isUser ? '<span class="text-[10px] bg-eco-200 text-eco-900 px-1.5 py-0.5 rounded ml-1">YOU</span>' : ''}
            </td>
            <td class="py-3.5 px-3 text-slate-500 font-medium">${user.title}</td>
            <td class="py-3.5 px-3 text-right font-black text-emerald-700">${user.points.toLocaleString()} pts</td>
        </tr>
    `).join('');
}

// Impact Dashboard Renderer
function renderImpactDashboard() {
    document.getElementById('impact-stat-points').innerText = playerState.snapPoints.toLocaleString();
    document.getElementById('impact-stat-co2').innerText = `${playerState.co2Saved.toFixed(2)} kg`;
    document.getElementById('impact-stat-landfill').innerText = `${(playerState.itemsSorted * 0.12).toFixed(2)} kg`;

    // Table log
    const tbody = document.getElementById('impact-log-tbody');
    tbody.innerHTML = playerState.scanLog.map(log => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 font-bold text-slate-800">${log.name}</td>
            <td class="p-4"><span class="px-2.5 py-1 rounded-full bg-eco-100 text-eco-800 font-bold">${log.bin}</span></td>
            <td class="p-4 text-slate-500">${log.condition}</td>
            <td class="p-4 font-bold text-amber-600">+${log.points} SnapPoints</td>
            <td class="p-4 text-slate-400">${log.time}</td>
        </tr>
    `).join('');

    renderImpactChart();
}

function renderImpactChart() {
    const ctx = document.getElementById('impactDoughnutChart');
    if (!ctx) return;

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Plastics', 'Paper & Cardboard', 'Metals', 'Organic', 'Hazardous E-Waste'],
            datasets: [{
                data: [42, 28, 15, 10, 5],
                backgroundColor: ['#4caf50', '#f59e0b', '#3b82f6', '#84cc16', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { font: { family: 'Plus Jakarta Sans', size: 11 } } }
            },
            cutout: '68%'
        }
    });
}

function addRandomImpactLog() {
    const keys = Object.keys(WASTE_DATABASE);
    const item = WASTE_DATABASE[keys[Math.floor(Math.random() * keys.length)]];

    playerState.itemsSorted++;
    playerState.co2Saved += item.co2;
    addSnapPoints(10, "Simulated Sort");

    playerState.scanLog.unshift({
        name: item.name,
        bin: item.correctBinName.split(' - ')[0],
        condition: "Simulated",
        co2: item.co2,
        points: 10,
        time: "Just now"
    });

    renderImpactDashboard();
    showToast(`Simulated sort logged: ${item.name}`, 'info');
}

function resetImpactData() {
    playerState.scanLog = [];
    renderImpactDashboard();
    showToast('Impact history log cleared', 'info');
}

// Toast Helper
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-box');
    const toast = document.createElement('div');

    let bgClass = 'bg-slate-900 text-white';
    let icon = 'fa-info-circle text-blue-400';

    if (type === 'success') {
        bgClass = 'bg-eco-900 text-white border border-eco-400';
        icon = 'fa-circle-check text-emerald-400';
    } else if (type === 'error') {
        bgClass = 'bg-red-950 text-white border border-red-500';
        icon = 'fa-triangle-exclamation text-red-400';
    }

    toast.className = `${bgClass} pointer-events-auto px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 transition-all duration-300 transform translate-y-2 opacity-0`;
    toast.innerHTML = `<i class="fa-solid ${icon} text-base"></i> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}
    

// Remote photos can be blocked: show a branded placeholder instead of a broken image
document.addEventListener('error', e => {
    const t = e.target;
    if (t.tagName === 'IMG' && !t.dataset.fb) {
        t.dataset.fb = '1';
        t.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2e7d32"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs><rect width="700" height="500" fill="url(#g)"/><text x="350" y="285" font-size="130" text-anchor="middle">♻️</text></svg>');
    }
}, true);
