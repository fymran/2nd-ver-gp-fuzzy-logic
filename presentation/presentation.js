// ========== FUZZY LOGIC ENGINE ========== 

// Triangular membership function
function trimf(x, a, b, c) {
    if (x <= a || x >= c) return 0;
    if (x <= b) return (x - a) / (b - a);
    return (c - x) / (c - b);
}

// Input parameter definitions based on real-life constraints
const inputDefinitions = {
    ac: {
        range: [16, 28],
        sets: {
            inefficient: [15, 16, 20],  // AC too cold, wastes energy
            balanced: [18, 22, 26],     // Comfortable range
            efficient: [22, 26, 29]     // Warmer side, less cooling needed
        }
    },
    fan: {
        range: [0, 5],
        sets: {
            low: [-1, 0, 2],           // Fan off or minimal
            moderate: [1, 2.5, 4],     // Standard ventilation
            high: [3, 5, 6]            // Maximum speed
        }
    },
    plug: {
        range: [0, 3000],
        sets: {
            low: [-500, 0, 500],       // Minimal load
            active: [300, 1500, 2700], // Standard household use
            heavy: [1500, 2250, 3500]  // High consumption
        }
    },
    lamp: {
        range: [0, 100],
        sets: {
            dim: [-10, 0, 35],         // Low/off
            standard: [25, 50, 75],    // Normal use
            bright: [65, 100, 110]     // Maximum brightness
        }
    }
};

// Output membership functions (Room level)
const roomOutputDefinitions = {
    poor: [0, 0, 33],
    average: [25, 50, 75],
    excellent: [67, 100, 100]
};

// Global efficiency levels (5-level system)
const globalOutputDefinitions = {
    critical: [0, 0, 24],      // 0-24%
    poor: [15, 25, 39],        // 15-39%
    moderate: [35, 50, 65],    // 35-65%
    good: [55, 75, 85],        // 55-85%
    excellent: [75, 100, 100]  // 75-100%
};

// Get membership values for all fuzzy sets of an input
function getMemberships(value, inputType) {
    const definition = inputDefinitions[inputType];
    const memberships = {};
    
    for (const [setName, params] of Object.entries(definition.sets)) {
        memberships[setName] = trimf(value, params[0], params[1], params[2]);
    }
    
    return memberships;
}

// Calculate room-level fuzzy inference
function calculateRoom(ac, fan, plug, lamp) {
    // Get membership values for each input
    const mAC = getMemberships(ac, 'ac');
    const mFan = getMemberships(fan, 'fan');
    const mPlug = getMemberships(plug, 'plug');
    const mLamp = getMemberships(lamp, 'lamp');

    // Apply 9 fuzzy rules (Mamdani MIN operator)
    const rules = {
        // POOR EFFICIENCY: 3 rules
        poor1: Math.min(mAC.inefficient, mPlug.heavy, mLamp.bright),
        poor2: Math.min(mAC.inefficient, mFan.high),
        poor3: Math.min(mPlug.heavy, mLamp.bright),
        
        // EXCELLENT EFFICIENCY: 3 rules
        excellent1: Math.min(mAC.efficient, mPlug.low, mLamp.dim),
        excellent2: Math.min(mAC.efficient, mFan.low, mPlug.low),
        excellent3: Math.min(mAC.balanced, mPlug.low, mLamp.dim),
        
        // AVERAGE EFFICIENCY: 3 rules
        average1: Math.min(mFan.moderate, mPlug.active, mLamp.standard),
        average2: Math.min(mFan.low, mPlug.heavy, mLamp.bright),
        average3: Math.min(mAC.balanced, mFan.moderate, mPlug.active)
    };

    // Aggregate rules by category using MAX operator
    const poorStrength = Math.max(rules.poor1, rules.poor2, rules.poor3);
    const excellentStrength = Math.max(rules.excellent1, rules.excellent2, rules.excellent3);
    const averageStrength = Math.max(rules.average1, rules.average2, rules.average3);

    // Defuzzification using Centroid method
    let numerator = 0;
    let denominator = 0;
    const step = 2; // Step through 0-100 in 2% increments

    for (let i = 0; i <= 100; i += step) {
        const muPoor = trimf(i, roomOutputDefinitions.poor[0], roomOutputDefinitions.poor[1], roomOutputDefinitions.poor[2]) * poorStrength;
        const muAverage = trimf(i, roomOutputDefinitions.average[0], roomOutputDefinitions.average[1], roomOutputDefinitions.average[2]) * averageStrength;
        const muExcellent = trimf(i, roomOutputDefinitions.excellent[0], roomOutputDefinitions.excellent[1], roomOutputDefinitions.excellent[2]) * excellentStrength;

        const mu = Math.max(muPoor, muAverage, muExcellent);
        numerator += i * mu;
        denominator += mu;
    }

    const score = denominator === 0 ? 50 : numerator / denominator;

    // Return room efficiency with detailed information
    return {
        score: Math.max(0, Math.min(100, score)),
        memberships: {
            ac: mAC,
            fan: mFan,
            plug: mPlug,
            lamp: mLamp
        },
        aggregations: {
            poor: poorStrength,
            average: averageStrength,
            excellent: excellentStrength
        },
        triggeredRules: getTriggeredRules(rules)
    };
}

// Identify which rules were triggered significantly
function getTriggeredRules(rules) {
    const triggered = [];
    for (const [name, strength] of Object.entries(rules)) {
        if (strength > 0.1) {  // Only report rules with strength > 0.1
            triggered.push({ name, strength: strength.toFixed(3) });
        }
    }
    return triggered.sort((a, b) => b.strength - a.strength);
}

// ========== TEST SCENARIOS ========== 

const testScenarios = {
    A: {
        name: "All Minimum (Most Efficient)",
        description: "All systems at minimal or off state",
        inputs: {
            ac: 28,
            fan: 0,
            plug: 0,
            lamp: 0
        }
    },
    B: {
        name: "All Maximum (Least Efficient)",
        description: "All systems at maximum capacity",
        inputs: {
            ac: 16,
            fan: 5,
            plug: 3000,
            lamp: 100
        }
    },
    C: {
        name: "Balanced (Typical Usage)",
        description: "Comfortable, realistic daily usage",
        inputs: {
            ac: 22,
            fan: 2,
            plug: 1500,
            lamp: 50
        }
    }
};

const rooms = ['Living Room', 'Bedroom 1', 'Bedroom 2', 'Kitchen'];

// Execute all test scenarios
function runAllTests() {
    const results = {};
    
    ['A', 'B', 'C'].forEach(scenarioKey => {
        results[scenarioKey] = {};
        const scenario = testScenarios[scenarioKey];
        
        rooms.forEach((roomName, index) => {
            const result = calculateRoom(
                scenario.inputs.ac,
                scenario.inputs.fan,
                scenario.inputs.plug,
                scenario.inputs.lamp
            );
            results[scenarioKey][index] = result;
        });
    });
    
    return results;
}

// ========== VISUALIZATION FUNCTIONS ========== 

// Create hero chart showing fuzzy membership concept
function createHeroChart() {
    const canvas = document.getElementById('heroChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(40, 10);
    ctx.lineTo(40, height - 30);
    ctx.stroke();
    
    // Draw triangular membership function
    ctx.fillStyle = 'rgba(79, 70, 229, 0.3)';
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    
    const scale = (width - 60) / 100;
    const yScale = (height - 40) / 1;
    
    ctx.beginPath();
    ctx.moveTo(40, height - 30);
    ctx.lineTo(40 + scale * 20, height - 30);
    ctx.lineTo(40 + scale * 50, 10 + 10);
    ctx.lineTo(40 + scale * 80, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.fill();
    ctx.stroke();
    
    // Add labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('0', 40, height - 10);
    ctx.fillText('50', 40 + scale * 50, height - 10);
    ctx.fillText('100', width - 20, height - 10);
    
    ctx.textAlign = 'right';
    ctx.fillText('μ(x)', 20, 20);
    ctx.fillText('1.0', 20, height - 30);
    ctx.fillText('0.5', 20, (height - 30) / 2 + 15);
}

// Draw implementation membership function chart
function createImplementationChart() {
    const canvas = document.getElementById('implementationChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw AC temperature membership functions
    const padding = 30;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;
    
    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // Plot AC temperature membership functions
    const acScale = plotWidth / 12;
    const yScale = plotHeight / 1;
    
    const colors = ['#4f46e5', '#06b6d4', '#22c55e'];
    const acSets = ['inefficient', 'balanced', 'efficient'];
    
    acSets.forEach((setName, idx) => {
        const params = inputDefinitions.ac.sets[setName];
        ctx.strokeStyle = colors[idx];
        ctx.fillStyle = colors[idx].replace(')', ', 0.2)').replace('rgb', 'rgba');
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (let ac = 15; ac <= 29; ac += 0.5) {
            const mu = trimf(ac, params[0], params[1], params[2]);
            const x = padding + (ac - 15) * acScale;
            const y = height - padding - mu * yScale;
            if (ac === 15) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    });
    
    // Add axis labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('16°C', padding, height - padding + 15);
    ctx.fillText('28°C', padding + acScale * 12, height - padding + 15);
    ctx.textAlign = 'right';
    ctx.fillText('Membership', 15, 15);
    ctx.fillText('1.0', 15, height - padding + 3);
    ctx.fillText('0', 15, height - padding + 3);
}

// Create output membership function chart
function createOutputChart() {
    const canvas = document.getElementById('outputChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const padding = 30;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;
    
    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // Plot room output membership functions
    const scoreScale = plotWidth / 100;
    const yScale = plotHeight / 1;
    
    const colors = ['#dc2626', '#eab308', '#22c55e'];
    const outputSets = ['poor', 'average', 'excellent'];
    
    outputSets.forEach((setName, idx) => {
        const params = roomOutputDefinitions[setName];
        ctx.strokeStyle = colors[idx];
        ctx.fillStyle = colors[idx].replace(')', ', 0.2)').replace('rgb', 'rgba');
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (let score = 0; score <= 100; score += 1) {
            const mu = trimf(score, params[0], params[1], params[2]);
            const x = padding + score * scoreScale;
            const y = height - padding - mu * yScale;
            if (score === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    });
    
    // Add axis labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('0%', padding, height - padding + 15);
    ctx.fillText('50%', padding + scoreScale * 50, height - padding + 15);
    ctx.fillText('100%', width - padding, height - padding + 15);
    ctx.textAlign = 'right';
    ctx.fillText('Membership', 15, 15);
}

// Display test results
function displayResults(scenarioKey) {
    const results = runAllTests();
    const scenario = testScenarios[scenarioKey];
    
    rooms.forEach((roomName, index) => {
        const result = results[scenarioKey][index];
        const score = result.score;
        
        // Update score display
        const scoreElement = document.getElementById(`score${scenarioKey}${index + 1}`);
        if (scoreElement) {
            scoreElement.textContent = score.toFixed(1) + '%';
            scoreElement.style.color = getStatusColor(score);
        }
        
        // Create radar chart for triggered rules
        const canvasId = `chart${scenarioKey}${index + 1}`;
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            createRuleChart(canvas, result.aggregations, score);
        }
        
        // Display analysis
        const analysisElement = document.getElementById(`analysis${scenarioKey}${index + 1}`);
        if (analysisElement) {
            analysisElement.innerHTML = `
                <strong>Status:</strong> ${getStatusLabel(score)}<br>
                <strong>Triggered Rules:</strong> ${result.triggeredRules.length}
            `;
        }
    });
    
    // Display global score
    const globalScores = rooms.map((_, index) => results[scenarioKey][index].score);
    const globalAverage = globalScores.reduce((a, b) => a + b, 0) / globalScores.length;
    
    const globalCanvasId = `globalChart${scenarioKey}`;
    const globalCanvas = document.getElementById(globalCanvasId);
    if (globalCanvas) {
        createGlobalChart(globalCanvas, globalAverage);
    }
    
    const globalScoreElement = document.getElementById(`globalScore${scenarioKey}`);
    if (globalScoreElement) {
        globalScoreElement.innerHTML = `
            <strong>Global Efficiency:</strong> ${globalAverage.toFixed(1)}% <strong>(${getGlobalStatus(globalAverage)})</strong>
        `;
    }
}

// Create rule aggregation visualization
function createRuleChart(canvas, aggregations, score) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 20;
    
    // Draw pie chart segments
    const segments = [
        { label: 'Poor', value: aggregations.poor, color: '#dc2626' },
        { label: 'Average', value: aggregations.average, color: '#eab308' },
        { label: 'Excellent', value: aggregations.excellent, color: '#22c55e' }
    ];
    
    const total = segments.reduce((sum, seg) => sum + seg.value, 1);
    let currentAngle = -Math.PI / 2;
    
    segments.forEach(segment => {
        const sliceAngle = (segment.value / total) * 2 * Math.PI;
        
        // Draw segment
        ctx.fillStyle = segment.color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, maxRadius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        currentAngle += sliceAngle;
    });
    
    // Draw center circle with score
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius * 0.5, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = getStatusColor(score);
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(score.toFixed(0) + '%', centerX, centerY);
}

// Create global efficiency chart
function createGlobalChart(canvas, score) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw efficiency bar
    const barX = 50;
    const barY = height / 2 - 20;
    const barWidth = width - 100;
    const barHeight = 40;
    
    // Background
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Filled portion
    const fillWidth = (score / 100) * barWidth;
    ctx.fillStyle = getStatusColor(score);
    ctx.fillRect(barX, barY, fillWidth, barHeight);
    
    // Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Text
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(score.toFixed(1) + '%', width / 2, barY - 30);
    
    // Status label
    ctx.font = '14px Arial';
    ctx.fillStyle = getStatusColor(score);
    ctx.fillText(getGlobalStatus(score), width / 2, barY + barHeight + 30);
}

// Create comparison chart
function createComparisonChart() {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;
    
    const results = runAllTests();
    const labels = rooms;
    const datasets = [];
    
    ['A', 'B', 'C'].forEach((scenarioKey, idx) => {
        const data = rooms.map((_, roomIdx) => results[scenarioKey][roomIdx].score);
        datasets.push({
            label: `Scenario ${scenarioKey}`,
            data: data,
            borderColor: ['#4f46e5', '#06b6d4', '#22c55e'][idx],
            backgroundColor: ['#4f46e5', '#06b6d4', '#22c55e'][idx].replace(')', ', 0.1)').replace('rgb', 'rgba'),
            borderWidth: 2,
            tension: 0.4
        });
    });
    
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Room Efficiency Comparison Across Test Scenarios'
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Efficiency Score (%)'
                    }
                }
            }
        }
    });
}

// Helper functions
function getStatusColor(score) {
    if (score >= 80) return '#22c55e';  // Green - Excellent
    if (score >= 60) return '#84cc16';  // Lime - Good
    if (score >= 40) return '#eab308';  // Yellow - Moderate
    if (score >= 25) return '#f97316';  // Orange - Poor
    return '#dc2626';                   // Red - Critical
}

function getStatusLabel(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    if (score >= 25) return 'Poor';
    return 'Critical';
}

function getGlobalStatus(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    if (score >= 25) return 'Poor';
    return 'Critical';
}

// Show/hide scenario content
function showScenario(scenarioKey) {
    // Hide all scenarios
    ['A', 'B', 'C'].forEach(key => {
        document.getElementById(`scenario${key}`).classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected scenario
    document.getElementById(`scenario${scenarioKey}`).classList.add('active');
    
    // Add active class to selected button
    event.target.classList.add('active');
    
    // Display results
    setTimeout(() => displayResults(scenarioKey), 100);
}

// ========== INITIALIZATION ========== 

document.addEventListener('DOMContentLoaded', function() {
    createHeroChart();
    createImplementationChart();
    createOutputChart();
    createComparisonChart();
    
    // Display default scenario (A)
    displayResults('A');
});
