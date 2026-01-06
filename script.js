// ========== CORE FUZZY LOGIC ENGINE ==========
const trimf = (x, a, b, c) => Math.max(0, Math.min((x - a) / (b - a), (c - x) / (c - b)));

const getMemberships = (val, type) => {
    if (type === 'ac') return { 
        ineff: trimf(val, 15, 16, 20), 
        bal: trimf(val, 18, 21, 24), 
        eff: trimf(val, 22, 28, 29) 
    };
    if (type === 'fan') return { 
        low: trimf(val, -1, 0, 1.5), 
        mod: trimf(val, 1, 2.25, 3.5), 
        high: trimf(val, 3, 5, 6) 
    };
    if (type === 'plug') return { 
        low: trimf(val, -100, 0, 500), 
        act: trimf(val, 400, 1100, 1800), 
        heavy: trimf(val, 1500, 3000, 3100) 
    };
    if (type === 'lamp') return { 
        dim: trimf(val, -5, 0, 35), 
        std: trimf(val, 30, 52.5, 75), 
        bright: trimf(val, 65, 100, 105) 
    };
};

// ========== MULTI-ROOM SYSTEM ==========
const rooms = [
    { id: 1, name: "Living Room", maxFan: 5 },
    { id: 2, name: "Bedroom 1", maxFan: 5 },
    { id: 3, name: "Bedroom 2", maxFan: 5 },
    { id: 4, name: "Kitchen", maxFan: 3 }
];

function calculateRoom(id) {
    const ac = parseFloat(document.getElementById(`ac_${id}`).value);
    const fan = parseFloat(document.getElementById(`fan_${id}`).value);
    const plug = parseFloat(document.getElementById(`plug_${id}`).value);
    const lamp = parseFloat(document.getElementById(`lamp_${id}`).value);

    document.getElementById(`ac_l_${id}`).innerText = ac + "°C";
    document.getElementById(`plug_l_${id}`).innerText = plug + "W";

    const mAC = getMemberships(ac, 'ac');
    const mFan = getMemberships(fan, 'fan');
    const mPlug = getMemberships(plug, 'plug');
    const mLamp = getMemberships(lamp, 'lamp');

    const agg = {
        // ===== POOR EFFICIENCY RULES =====
        // Rule 1: AC Inefficient + Heavy Load + Bright Light
        poor: Math.min(mAC.ineff, mPlug.heavy, mLamp.bright),
        
        // Rule 4: AC Inefficient + High Fan (Wasteful cooling)
        poorFan: Math.min(mAC.ineff, mFan.high),
        
        // Rule 7: Heavy Load + Bright Light (High consumption)
        poorLoad: Math.min(mPlug.heavy, mLamp.bright),
        
        // ===== EXCELLENT EFFICIENCY RULES =====
        // Rule 2: AC Efficient + Low Load + Dim Light
        excellent: Math.min(mAC.eff, mPlug.low, mLamp.dim),
        
        // Rule 5: AC Efficient + Low Fan (Good cooling efficiency)
        excellentFan: Math.min(mAC.eff, mFan.low, mPlug.low),
        
        // Rule 8: AC Balanced + Low Load + Dim Light
        excellentBalanced: Math.min(mAC.bal, mPlug.low, mLamp.dim),
        
        // ===== AVERAGE EFFICIENCY RULES =====
        // Rule 3a: Fan Moderate + Active Load + Standard Light
        average1: Math.min(mFan.mod, mPlug.act, mLamp.std),
        
        // Rule 3b: Fan Low + Heavy Load + Bright Light
        average2: Math.min(mFan.low, mPlug.heavy, mLamp.bright),
        
        // Rule 6: AC Balanced + Moderate Fan + Active Load
        average3: Math.min(mAC.bal, mFan.mod, mPlug.act),
        
        // Rule 9: Mixed conditions - Standard light + Active load
        average4: Math.min(mLamp.std, mPlug.act, mFan.mod)
    };

    let num = 0, den = 0;
    for (let i = 0; i <= 100; i += 10) {
        // Aggregate all poor rules
        const poorStrength = Math.max(agg.poor, agg.poorFan, agg.poorLoad);
        // Aggregate all excellent rules
        const excellentStrength = Math.max(agg.excellent, agg.excellentFan, agg.excellentBalanced);
        // Aggregate all average rules
        const averageStrength = Math.max(agg.average1, agg.average2, agg.average3, agg.average4);
        
        const mu = Math.max(
            Math.min(poorStrength, trimf(i, -10, 0, 40)),
            Math.min(averageStrength, trimf(i, 30, 50, 70)),
            Math.min(excellentStrength, trimf(i, 60, 100, 110))
        );
        num += (i * mu);
        den += mu;
    }
    const score = den === 0 ? 50 : num / den;
    document.getElementById(`score_${id}`).innerText = Math.round(score) + "%";
    
    // Draw membership function graphs
    drawMembershipGraph(`ac_graph_${id}`, ac, 'ac');
    drawMembershipGraph(`fan_graph_${id}`, fan, 'fan');
    drawMembershipGraph(`plug_graph_${id}`, plug, 'plug');
    drawMembershipGraph(`lamp_graph_${id}`, lamp, 'lamp');
    drawEfficiencyOutputGraph(`eff_graph_${id}`, id);
    
    return score;
}

function updateAll() {
    let total = 0;
    rooms.forEach(r => total += calculateRoom(r.id));
    const globalScore = total / rooms.length;
    
    document.getElementById('global_score').innerText = Math.round(globalScore) + "%";
    const statusEl = document.getElementById('global_status');
    const scoreEl = document.getElementById('global_score');
    
    // Update Live Status tab
    const liveScore = document.getElementById('live_score');
    const liveStatusLabel = document.getElementById('live_status_label');
    const liveStatusIcon = document.getElementById('live_status_icon');
    const liveStatusName = document.getElementById('live_status_name');
    const liveStatusDesc = document.getElementById('live_status_description');
    const progressCircle = document.getElementById('progress_circle');
    
    // Calculate circle progress (565 is the circumference of the circle)
    const circleProgress = (globalScore / 100) * 565;
    
    // 5-level granularity for global efficiency
    if(globalScore >= 80) { 
        statusEl.innerText = "Excellent Performance"; 
        scoreEl.className = "text-4xl md:text-5xl font-black text-green-500";
        
        // Live Status Tab
        liveScore.innerText = Math.round(globalScore) + "%";
        liveStatusLabel.innerText = "Excellent";
        liveStatusIcon.className = "w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-5xl font-bold shadow-lg";
        liveStatusIcon.innerHTML = "✓";
        liveStatusName.className = "text-3xl font-bold text-white";
        liveStatusName.innerText = "Excellent Performance";
        liveStatusDesc.innerText = "Your home is highly energy efficient!";
        progressCircle.style.stroke = "#22c55e";
        progressCircle.style.strokeDashoffset = 565 - circleProgress;
    }
    else if(globalScore >= 60) { 
        statusEl.innerText = "Good Performance"; 
        scoreEl.className = "text-4xl md:text-5xl font-black text-lime-400";
        
        // Live Status Tab
        liveScore.innerText = Math.round(globalScore) + "%";
        liveStatusLabel.innerText = "Good";
        liveStatusIcon.className = "w-24 h-24 rounded-full bg-lime-500 flex items-center justify-center text-5xl font-bold shadow-lg";
        liveStatusIcon.innerHTML = "👍";
        liveStatusName.className = "text-3xl font-bold text-white";
        liveStatusName.innerText = "Good Performance";
        liveStatusDesc.innerText = "Efficiency is above average!";
        progressCircle.style.stroke = "#84cc16";
        progressCircle.style.strokeDashoffset = 565 - circleProgress;
    }
    else if(globalScore >= 40) { 
        statusEl.innerText = "Moderate Usage"; 
        scoreEl.className = "text-4xl md:text-5xl font-black text-yellow-400";
        
        // Live Status Tab
        liveScore.innerText = Math.round(globalScore) + "%";
        liveStatusLabel.innerText = "Moderate";
        liveStatusIcon.className = "w-24 h-24 rounded-full bg-yellow-500 flex items-center justify-center text-5xl font-bold shadow-lg animate-pulse";
        liveStatusIcon.innerHTML = "⚡";
        liveStatusName.className = "text-3xl font-bold text-white";
        liveStatusName.innerText = "Moderate Usage";
        liveStatusDesc.innerText = "Room for improvement exists.";
        progressCircle.style.stroke = "#eab308";
        progressCircle.style.strokeDashoffset = 565 - circleProgress;
    }
    else if(globalScore >= 25) { 
        statusEl.innerText = "Poor Performance"; 
        scoreEl.className = "text-4xl md:text-5xl font-black text-orange-500";
        
        // Live Status Tab
        liveScore.innerText = Math.round(globalScore) + "%";
        liveStatusLabel.innerText = "Poor";
        liveStatusIcon.className = "w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center text-5xl font-bold shadow-lg animate-pulse";
        liveStatusIcon.innerHTML = "⚠️";
        liveStatusName.className = "text-3xl font-bold text-white";
        liveStatusName.innerText = "Poor Performance";
        liveStatusDesc.innerText = "Consider energy saving measures.";
        progressCircle.style.stroke = "#f97316";
        progressCircle.style.strokeDashoffset = 565 - circleProgress;
    }
    else { 
        statusEl.innerText = "Critical Waste"; 
        scoreEl.className = "text-4xl md:text-5xl font-black text-red-700";
        
        // Live Status Tab
        liveScore.innerText = Math.round(globalScore) + "%";
        liveStatusLabel.innerText = "Critical";
        liveStatusIcon.className = "w-24 h-24 rounded-full bg-red-600 flex items-center justify-center text-5xl font-bold shadow-lg animate-pulse";
        liveStatusIcon.innerHTML = "🔴";
        liveStatusName.className = "text-3xl font-bold text-white";
        liveStatusName.innerText = "Critical Waste";
        liveStatusDesc.innerText = "Immediate action needed!";
        progressCircle.style.stroke = "#dc2626";
        progressCircle.style.strokeDashoffset = 565 - circleProgress;
    }
    
    // Update room breakdown in Live Status tab
    updateLiveStatusRoomBreakdown();
    
    // Draw global efficiency graph
    drawGlobalEfficiencyGraph('global_eff_graph', globalScore);
    
    return globalScore;
}

function updateLiveStatusRoomBreakdown() {
    const container = document.getElementById('live_rooms_breakdown');
    container.innerHTML = '';
    
    rooms.forEach(r => {
        const scoreEl = document.getElementById(`score_${r.id}`);
        const score = parseInt(scoreEl.innerText);
        
        let color, icon, status;
        if(score >= 70) {
            color = 'bg-green-500 bg-opacity-20 border-green-500';
            icon = '✓';
            status = 'Excellent';
        } else if(score >= 50) {
            color = 'bg-lime-500 bg-opacity-20 border-lime-500';
            icon = '👍';
            status = 'Good';
        } else if(score >= 35) {
            color = 'bg-yellow-500 bg-opacity-20 border-yellow-500';
            icon = '⚡';
            status = 'Moderate';
        } else {
            color = 'bg-orange-500 bg-opacity-20 border-orange-500';
            icon = '⚠️';
            status = 'Poor';
        }
        
        const card = document.createElement('div');
        card.className = `p-4 rounded-lg border ${color} transition-all`;
        card.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <div>
                    <div class="font-bold text-white text-sm">${r.name}</div>
                    <div class="text-xs text-slate-300">${status}</div>
                </div>
                <div class="text-2xl">${icon}</div>
            </div>
            <div class="text-2xl font-black text-white">${score}%</div>
            <div class="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-700 ease-out" style="width: ${score}%; ${
                    score >= 70 ? 'background: #22c55e;' :
                    score >= 50 ? 'background: #84cc16;' :
                    score >= 35 ? 'background: #eab308;' :
                    'background: #f97316;'
                }"></div>
            </div>
        `;
        container.appendChild(card);
    });
}

function drawGlobalEfficiencyGraph(canvasId, globalScore) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 5;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;
    
    // Clear canvas
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    
    // Draw border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, graphWidth, graphHeight);
    
    // Draw 5-level output membership functions for global score
    const outputFuncs = [
        { name: 'critical', range: [-10, 0, 20], color: '#7f1d1d' },      // Very dark red
        { name: 'poor', range: [10, 25, 40], color: '#ef4444' },          // Red
        { name: 'average', range: [35, 50, 65], color: '#eab308' },       // Yellow
        { name: 'good', range: [60, 75, 85], color: '#84cc16' },          // Lime
        { name: 'excellent', range: [80, 100, 110], color: '#22c55e' }    // Green
    ];
    
    outputFuncs.forEach(func => {
        ctx.strokeStyle = func.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        let firstPoint = true;
        for (let i = -10; i <= 110; i += 120 / 100) {
            const membership = trimf(i, func.range[0], func.range[1], func.range[2]);
            const x = padding + ((i + 10) / 120) * graphWidth;
            const y = padding + graphHeight - membership * graphHeight;
            
            if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    });
    
    // Draw global score line
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    const scoreX = padding + ((globalScore + 10) / 120) * graphWidth;
    ctx.beginPath();
    ctx.moveTo(scoreX, padding);
    ctx.lineTo(scoreX, padding + graphHeight);
    ctx.stroke();
    ctx.setLineDash([]);
}

// ========== MEMBERSHIP FUNCTION VISUALIZATION ==========
function drawMembershipGraph(canvasId, val, type) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 5;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;
    
    // Clear canvas
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    
    // Draw border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, graphWidth, graphHeight);
    
    // Get membership values
    const memberships = getMemberships(val, type);
    const membershipKeys = Object.keys(memberships);
    const colors = ['#ef4444', '#eab308', '#22c55e'];
    
    // Determine range based on type
    let range, step, label;
    if (type === 'ac') {
        range = [16, 28];
        step = 1;
        label = '°C';
    } else if (type === 'fan') {
        range = [0, 5];
        step = 0.5;
        label = '';
    } else if (type === 'plug') {
        range = [0, 3000];
        step = 200;
        label = 'W';
    } else if (type === 'lamp') {
        range = [0, 100];
        step = 10;
        label = '%';
    } else if (type === 'efficiency') {
        range = [0, 100];
        step = 10;
        label = '%';
    }
    
    // Draw grid and labels
    ctx.strokeStyle = '#e2e8f0';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    
    for (let i = range[0]; i <= range[1]; i += step) {
        const x = padding + ((i - range[0]) / (range[1] - range[0])) * graphWidth;
        ctx.beginPath();
        ctx.moveTo(x, padding + graphHeight);
        ctx.lineTo(x, padding + graphHeight + 3);
        ctx.stroke();
    }
    
    // Draw membership function curves
    membershipKeys.forEach((key, idx) => {
        ctx.strokeStyle = colors[idx];
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        let firstPoint = true;
        for (let i = range[0]; i <= range[1]; i += (range[1] - range[0]) / 100) {
            const membership = getMemberships(i, type)[key];
            const x = padding + ((i - range[0]) / (range[1] - range[0])) * graphWidth;
            const y = padding + graphHeight - membership * graphHeight;
            
            if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    });
    
    // Draw current value line
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    const currentX = padding + ((val - range[0]) / (range[1] - range[0])) * graphWidth;
    ctx.beginPath();
    ctx.moveTo(currentX, padding);
    ctx.lineTo(currentX, padding + graphHeight);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawEfficiencyOutputGraph(canvasId, roomId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 5;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;
    
    // Clear canvas
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    
    // Draw border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, graphWidth, graphHeight);
    
    // Get current efficiency score
    const ac = parseFloat(document.getElementById(`ac_${roomId}`).value);
    const fan = parseFloat(document.getElementById(`fan_${roomId}`).value);
    const plug = parseFloat(document.getElementById(`plug_${roomId}`).value);
    const lamp = parseFloat(document.getElementById(`lamp_${roomId}`).value);
    
    const mAC = getMemberships(ac, 'ac');
    const mFan = getMemberships(fan, 'fan');
    const mPlug = getMemberships(plug, 'plug');
    const mLamp = getMemberships(lamp, 'lamp');
    
    const agg = {
        poor: Math.min(mAC.ineff, mPlug.heavy, mLamp.bright),
        poorFan: Math.min(mAC.ineff, mFan.high),
        poorLoad: Math.min(mPlug.heavy, mLamp.bright),
        excellent: Math.min(mAC.eff, mPlug.low, mLamp.dim),
        excellentFan: Math.min(mAC.eff, mFan.low, mPlug.low),
        excellentBalanced: Math.min(mAC.bal, mPlug.low, mLamp.dim),
        average1: Math.min(mFan.mod, mPlug.act, mLamp.std),
        average2: Math.min(mFan.low, mPlug.heavy, mLamp.bright),
        average3: Math.min(mAC.bal, mFan.mod, mPlug.act),
        average4: Math.min(mLamp.std, mPlug.act, mFan.mod)
    };
    
    // Calculate current score
    let num = 0, den = 0;
    for (let i = 0; i <= 100; i += 10) {
        const poorStrength = Math.max(agg.poor, agg.poorFan, agg.poorLoad);
        const excellentStrength = Math.max(agg.excellent, agg.excellentFan, agg.excellentBalanced);
        const averageStrength = Math.max(agg.average1, agg.average2, agg.average3, agg.average4);
        
        const mu = Math.max(
            Math.min(poorStrength, trimf(i, -10, 0, 40)),
            Math.min(averageStrength, trimf(i, 30, 50, 70)),
            Math.min(excellentStrength, trimf(i, 60, 100, 110))
        );
        num += (i * mu);
        den += mu;
    }
    const score = den === 0 ? 50 : num / den;
    
    // Draw output membership functions
    const outputFuncs = [
        { name: 'poor', range: [-10, 0, 40], color: '#ef4444' },
        { name: 'average', range: [30, 50, 70], color: '#eab308' },
        { name: 'excellent', range: [60, 100, 110], color: '#22c55e' }
    ];
    
    outputFuncs.forEach(func => {
        ctx.strokeStyle = func.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        let firstPoint = true;
        for (let i = -10; i <= 110; i += 120 / 100) {
            const membership = trimf(i, func.range[0], func.range[1], func.range[2]);
            const x = padding + ((i + 10) / 120) * graphWidth;
            const y = padding + graphHeight - membership * graphHeight;
            
            if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    });
    
    // Draw current score line
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    const scoreX = padding + ((score + 10) / 120) * graphWidth;
    ctx.beginPath();
    ctx.moveTo(scoreX, padding);
    ctx.lineTo(scoreX, padding + graphHeight);
    ctx.stroke();
    ctx.setLineDash([]);
}

// ========== CHART SETUP ==========
let efficiencyChart, simChart;

function initCharts() {
    const ctx1 = document.getElementById('efficiencyChart').getContext('2d');
    efficiencyChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Global Efficiency %',
                data: [],
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { min: 0, max: 100 } }
        }
    });

    const ctx2 = document.getElementById('simChart').getContext('2d');
    simChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Simulation Efficiency %',
                data: [],
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { min: 0, max: 100 } }
        }
    });
}

// ========== UI GENERATION ==========
function initializeUI() {
    const multiContainer = document.getElementById('rooms_container');

    rooms.forEach(r => {
        const roomHtml = `
            <div id="card_${r.id}" class="room-card">
                <div class="flex justify-between items-start mb-4">
                    <h2 class="font-bold text-slate-800">${r.name}</h2>
                    <span id="score_${r.id}" class="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">--%</span>
                </div>
                <div class="space-y-3">
                    <div>
                        <div class="flex justify-between mb-1"><span class="slider-label">AC Temp</span><span class="text-xs font-bold" id="ac_l_${r.id}">22°C</span></div>
                        <input type="range" id="ac_${r.id}" min="16" max="28" step="0.5" value="22" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" oninput="updateAll()">
                        <canvas id="ac_graph_${r.id}" width="200" height="60" class="w-full border border-slate-200 rounded mt-2"></canvas>
                    </div>
                    <div>
                        <div class="flex justify-between mb-1"><span class="slider-label">Fan/Exhaust</span></div>
                        <input type="range" id="fan_${r.id}" min="0" max="${r.maxFan}" step="0.5" value="2" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" oninput="updateAll()">
                        <canvas id="fan_graph_${r.id}" width="200" height="60" class="w-full border border-slate-200 rounded mt-2"></canvas>
                    </div>
                    <div>
                        <div class="flex justify-between mb-1"><span class="slider-label">Plug Load</span><span class="text-xs font-bold" id="plug_l_${r.id}">500W</span></div>
                        <input type="range" id="plug_${r.id}" min="0" max="3000" step="100" value="500" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" oninput="updateAll()">
                        <canvas id="plug_graph_${r.id}" width="200" height="60" class="w-full border border-slate-200 rounded mt-2"></canvas>
                    </div>
                    <div>
                        <div class="flex justify-between mb-1"><span class="slider-label">Lighting</span></div>
                        <input type="range" id="lamp_${r.id}" min="0" max="100" value="40" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" oninput="updateAll()">
                        <canvas id="lamp_graph_${r.id}" width="200" height="60" class="w-full border border-slate-200 rounded mt-2"></canvas>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-slate-200">
                    <p class="text-xs font-bold text-slate-600 mb-2">Room Efficiency Output:</p>
                    <canvas id="eff_graph_${r.id}" width="200" height="60" class="w-full border border-slate-200 rounded"></canvas>
                </div>
            </div>
        `;
        multiContainer.innerHTML += roomHtml;
    });
}

// ========== SIMULATION ENGINE ==========
let isSimulating = false;
let simInterval = null;

function toggleSimulation() {
    isSimulating = !isSimulating;
    const btn = document.getElementById('simBtn');
    const text = document.getElementById('simText');
    const dot = document.getElementById('simDot');
    const banner = document.getElementById('simBanner');

    if (isSimulating) {
        btn.className = "bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-widest transition-all flex items-center gap-2";
        text.innerText = "⏹ Stop Simulation";
        dot.classList.remove('hidden');
        banner.classList.remove('hidden');
        
        simInterval = setInterval(() => {
            rooms.forEach(r => {
                document.getElementById(`ac_${r.id}`).value = (Math.random() * (28 - 16) + 16).toFixed(1);
                document.getElementById(`fan_${r.id}`).value = (Math.random() * r.maxFan).toFixed(1);
                document.getElementById(`plug_${r.id}`).value = Math.floor(Math.random() * 3000);
                document.getElementById(`lamp_${r.id}`).value = Math.floor(Math.random() * 100);
                document.getElementById(`card_${r.id}`).classList.add('sim-active');
            });
            const score = updateAll();
            
            // Update sim chart
            const timeLabel = new Date().toLocaleTimeString();
            simChart.data.labels.push(timeLabel);
            simChart.data.datasets[0].data.push(score);
            if (simChart.data.labels.length > 20) {
                simChart.data.labels.shift();
                simChart.data.datasets[0].data.shift();
            }
            simChart.update();
            
            setTimeout(() => rooms.forEach(r => document.getElementById(`card_${r.id}`).classList.remove('sim-active')), 500);
        }, 3000);
    } else {
        btn.className = "bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-widest transition-all flex items-center gap-2";
        text.innerText = "▶ Start Simulation";
        dot.classList.add('hidden');
        banner.classList.add('hidden');
        clearInterval(simInterval);
    }
}

// ========== REPORT GENERATION ==========
function downloadReport() {
    const timestamp = new Date().toLocaleString();
    let report = `SMART HOME ENERGY EFFICIENCY REPORT\n`;
    report += `Generated: ${timestamp}\n`;
    report += `-------------------------------------------\n\n`;
    
    rooms.forEach(r => {
        const ac = document.getElementById(`ac_${r.id}`).value;
        const fan = document.getElementById(`fan_${r.id}`).value;
        const plug = document.getElementById(`plug_${r.id}`).value;
        const lamp = document.getElementById(`lamp_${r.id}`).value;
        const score = document.getElementById(`score_${r.id}`).innerText;

        report += `ROOM: ${r.name.toUpperCase()}\n`;
        report += `- AC Temp: ${ac}°C\n`;
        report += `- Fan/Exhaust Speed: ${fan}\n`;
        report += `- Plug Load: ${plug}W\n`;
        report += `- Lamp Intensity: ${lamp}%\n`;
        report += `- Calculated Efficiency: ${score}\n\n`;
    });

    const global = document.getElementById('global_score').innerText;
    const status = document.getElementById('global_status').innerText;
    report += `-------------------------------------------\n`;
    report += `GLOBAL HOME EFFICIENCY SCORE: ${global}\n`;
    report += `STATUS: ${status}\n`;
    report += `METHOD: Hierarchical Fuzzy Inference (Centroid Defuzzification)`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Energy_Report_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// ========== TAB SWITCHING ==========
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('active');
        el.classList.add('inactive');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.remove('inactive');
    event.target.classList.add('active');
    
    if(tabName === 'history' || tabName === 'multi') {
        if(!efficiencyChart) initCharts();
    }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    initializeUI();
    updateAll();

    // Background updates
    setInterval(() => {
        const currentScore = updateAll();
        const timeLabel = new Date().toLocaleTimeString();
        efficiencyChart.data.labels.push(timeLabel);
        efficiencyChart.data.datasets[0].data.push(currentScore);
        if (efficiencyChart.data.labels.length > 20) {
            efficiencyChart.data.labels.shift();
            efficiencyChart.data.datasets[0].data.shift();
        }
        efficiencyChart.update();
    }, 5000);
});
