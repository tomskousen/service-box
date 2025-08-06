// Service Box 2.0 - Corrected Partner Flow with Priorities

// App State
let appState = {
    user: {
        name: '',
        id: null
    },
    pairings: [], // Array of pairing objects
    currentPairing: null, // Currently active pairing
    lastReset: new Date().toISOString()
};

// Pairing structure
class Pairing {
    constructor(partnerName, code, isCreator = true) {
        this.id = Date.now().toString();
        this.partnerName = partnerName;
        this.code = code;
        this.isCreator = isCreator;
        this.connected = false;
        this.myWantList = [];
        this.partnerWantList = [];
        this.myWillingList = []; // 5 items I selected from partner's wants
        this.myPriorities = []; // Ordered list with priorities
        this.partnerWillingList = []; // What they selected from my wants (hidden)
        this.currentAction = null;
        this.myScore = 0;
        this.partnerScore = 0;
        this.weekNumber = 1;
        this.monthStarted = new Date().toISOString();
        this.completedThisWeek = [];
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    setupScreens();
});

// Setup all screens HTML
function setupScreens() {
    const content = document.querySelector('.content');
    content.innerHTML = `
        <!-- Onboarding Screen -->
        <div id="onboarding" class="screen active">
            <div class="card">
                <h2>Welcome to Service Box</h2>
                <p style="margin: 20px 0; color: #666; line-height: 1.6;">
                    Strengthen your relationships through intentional daily service and appreciation.
                </p>
                <button class="btn" onclick="startSetup()">Get Started</button>
                <button class="btn btn-outline" onclick="showHowItWorks()">How It Works</button>
            </div>
        </div>

        <!-- How It Works -->
        <div id="howItWorks" class="screen">
            <div class="card">
                <h2>How Service Box Works</h2>
                <div style="margin: 20px 0;">
                    <div style="margin-bottom: 20px;">
                        <h3>1. Create Your Want List 💭</h3>
                        <p style="color: #666;">List what you'd appreciate from your partner.</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h3>2. Partner Sees YOUR List ✅</h3>
                        <p style="color: #666;">They select & prioritize 5 things they're willing to do from YOUR wants.</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h3>3. Daily Service 🎯</h3>
                        <p style="color: #666;">Each day, they get one of their 5 selected actions to focus on serving you.</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h3>4. Weekly Guessing 🎮</h3>
                        <p style="color: #666;">At week's end, you guess from YOUR full want list. Correct = 1 point for you, 2 for them!</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h3>5. Priority Points 🏆</h3>
                        <p style="color: #666;">They earn more points for completing higher priority services (5 pts for #1, 1 pt for #5).</p>
                    </div>
                </div>
                <button class="btn" onclick="startSetup()">Start Setup</button>
                <button class="btn btn-secondary" onclick="showOnboarding()">Back</button>
            </div>
        </div>

        <!-- Setup Screen -->
        <div id="setup" class="screen">
            <div class="card">
                <h2>Set Up Your Account</h2>
                <div class="input-group">
                    <label>Your Name</label>
                    <input type="text" id="userName" placeholder="Enter your name">
                </div>
                <button class="btn" onclick="createAccount()">Create Account</button>
                <button class="btn btn-secondary" onclick="showPairExisting()">I Have a Pairing Code</button>
            </div>
        </div>

        <!-- Pairing Management -->
        <div id="pairingManagement" class="screen">
            <div class="card">
                <h2>Your Pairings</h2>
                <div class="info-box">
                    <h4>Multiple Relationships</h4>
                    <p style="font-size: 14px;">You can pair with multiple people. Each pairing is private and separate.</p>
                </div>
                
                <div id="pairingsList" class="pairing-list"></div>
                
                <button class="btn" onclick="showNewPairing()">Add New Partner</button>
                <button class="btn btn-secondary" onclick="showDashboard()">Back to Dashboard</button>
            </div>
        </div>

        <!-- New Pairing Screen -->
        <div id="newPairing" class="screen">
            <div class="card">
                <h2>Connect with Partner</h2>
                <div class="input-group">
                    <label>Partner's Name</label>
                    <input type="text" id="newPartnerName" placeholder="Enter partner's name">
                </div>
                
                <div class="pairing-code">
                    <p style="color: #666; margin-bottom: 10px;">Share this code with them:</p>
                    <div class="code" id="pairingCode">XXXX</div>
                    <button class="btn btn-outline" onclick="copyCode()">Copy Code</button>
                </div>
                
                <button class="btn" onclick="savePairing()">Save Pairing</button>
                <button class="btn" onclick="shareApp()">Share App Link</button>
                <button class="btn btn-secondary" onclick="showPairingManagement()">Back</button>
            </div>
        </div>

        <!-- Enter Pairing Code -->
        <div id="enterCode" class="screen">
            <div class="card">
                <h2>Enter Partner's Code</h2>
                <div class="input-group">
                    <label>Their Name</label>
                    <input type="text" id="connectPartnerName" placeholder="Enter their name">
                </div>
                <div class="input-group">
                    <label>Pairing Code</label>
                    <input type="text" id="partnerCode" placeholder="Enter 4-digit code" maxlength="4" style="text-align: center; letter-spacing: 10px; font-size: 24px; font-weight: bold;">
                </div>
                <button class="btn" onclick="connectWithPartner()">Connect</button>
                <button class="btn btn-secondary" onclick="showSetup()">Back</button>
            </div>
        </div>

        <!-- Main Dashboard -->
        <div id="dashboard" class="screen">
            <div id="currentPairingDisplay" class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                <h3 style="color: white;">Current Pairing</h3>
                <p id="currentPairingName" style="font-size: 18px; font-weight: bold;">Not Selected</p>
                <button class="btn" style="background: white; color: #764ba2;" onclick="showPairingManagement()">Switch Partner</button>
            </div>
            
            <div class="score-display">
                <div class="score-item">
                    <div class="score-value" id="myScore">0</div>
                    <div class="score-label">My Points</div>
                </div>
                <div class="score-item">
                    <div class="score-value" id="partnerScore">0</div>
                    <div class="score-label" id="partnerScoreLabel">Partner's Points</div>
                </div>
            </div>

            <div class="card">
                <h3>Quick Actions</h3>
                <button class="btn" onclick="showMyWantList()">📝 My Want List</button>
                <button class="btn" onclick="showPartnerWantList()">💝 Partner's Want List</button>
                <button class="btn" onclick="getTodaysAction()">🎯 Today's Service</button>
                <button class="btn btn-outline" onclick="weeklyGuessing()">🎮 Weekly Guess</button>
                <button class="btn btn-secondary" onclick="resetMonth()">📅 New Month</button>
            </div>
        </div>

        <!-- My Want List -->
        <div id="myWantList" class="screen">
            <div class="card">
                <h2>My Want List</h2>
                <p style="color: #666; margin-bottom: 20px;">What would you appreciate from <span class="partner-name-display">your partner</span>?</p>
                
                <div class="input-group">
                    <input type="text" id="newWant" placeholder="e.g., Daily good morning text" onkeypress="if(event.key==='Enter') addWant()">
                </div>
                <button class="btn btn-outline" onclick="addWant()">Add to List</button>
                
                <div id="myWantItems" style="margin-top: 20px;"></div>
                
                <button class="btn" onclick="saveMyWantList()">Save List</button>
                <button class="btn btn-secondary" onclick="loadTemplates()">Load Templates</button>
                <button class="btn btn-secondary" onclick="showDashboard()">Back</button>
            </div>
        </div>

        <!-- Partner's Want List (for me to select from) -->
        <div id="partnerWantList" class="screen">
            <div class="card">
                <h2><span class="partner-name-display">Partner</span>'s Want List</h2>
                <p style="color: #666; margin-bottom: 20px;">Select & prioritize 5 things you're willing to do for them</p>
                
                <div class="info-box">
                    <h4>How Priority Works</h4>
                    <p style="font-size: 14px;">Drag to reorder. #1 = 5 points when completed, #5 = 1 point</p>
                </div>
                
                <div id="partnerWantItems" style="margin-top: 20px;"></div>
                
                <button class="btn" onclick="showPrioritySelection()">Prioritize My 5 Selections</button>
                <button class="btn btn-secondary" onclick="showDashboard()">Back</button>
            </div>
        </div>

        <!-- Priority Selection -->
        <div id="prioritySelection" class="screen">
            <div class="card">
                <h2>Prioritize Your Commitments</h2>
                <p style="color: #666; margin-bottom: 20px;">Drag to reorder. Higher priority = more points!</p>
                
                <div id="priorityList" style="margin-top: 20px;"></div>
                
                <button class="btn" onclick="savePriorities()">Save My Priorities</button>
                <button class="btn btn-secondary" onclick="showPartnerWantList()">Back</button>
            </div>
        </div>

        <!-- Today's Service Action -->
        <div id="todaysAction" class="screen">
            <div class="week-display">Week <span id="weekNumber">1</span> of Month</div>
            
            <div class="action-card">
                <h3>Today's Service for <span class="partner-name-display">Partner</span></h3>
                <div class="action-text" id="currentAction">Loading...</div>
                <div class="points-display">
                    Complete for: <strong><span id="actionPoints">0</span> points</strong>
                </div>
            </div>
            
            <button class="btn" onclick="completeAction()">✅ Mark as Complete</button>
            <button class="btn btn-secondary" onclick="skipAction()">Skip Today</button>
            <button class="btn btn-secondary" onclick="showDashboard()">Back</button>
        </div>

        <!-- Weekly Guessing -->
        <div id="guessing" class="screen">
            <div class="card">
                <h2>Weekly Guess</h2>
                <p style="color: #666; margin-bottom: 20px;">What did <span class="partner-name-display">your partner</span> do for you this week?</p>
                <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Choose from YOUR want list. If correct: You get 1 point, they get 2!</p>
                
                <div id="guessOptions"></div>
                
                <button class="btn" onclick="submitGuess()">Submit Guess</button>
                <button class="btn btn-secondary" onclick="showDashboard()">Back</button>
            </div>
        </div>
    `;
    
    // Initialize the app
    if (appState.user.name) {
        showDashboard();
        updateDisplay();
    }
}

// State Management
function loadState() {
    const saved = localStorage.getItem('serviceBoxV2State');
    if (saved) {
        appState = JSON.parse(saved);
    }
}

function saveState() {
    localStorage.setItem('serviceBoxV2State', JSON.stringify(appState));
}

// Navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
    
    // Update navigation
    const bottomNav = document.querySelector('.bottom-nav');
    const hideNavScreens = ['onboarding', 'howItWorks', 'setup', 'enterCode'];
    
    if (hideNavScreens.includes(screenId)) {
        bottomNav.style.display = 'none';
        document.getElementById('userDisplay').style.display = 'none';
    } else {
        bottomNav.style.display = 'flex';
        updateDisplay();
    }
}

function showOnboarding() { showScreen('onboarding'); }
function showHowItWorks() { showScreen('howItWorks'); }
function showSetup() { showScreen('setup'); }
function showPairExisting() { showScreen('enterCode'); }
function showDashboard() { showScreen('dashboard'); updateDisplay(); }
function showMyWantList() { showScreen('myWantList'); renderMyWantList(); }
function showPartnerWantList() { showScreen('partnerWantList'); renderPartnerWantList(); }
function showPrioritySelection() { showScreen('prioritySelection'); renderPriorityList(); }
function showPairingManagement() { showScreen('pairingManagement'); renderPairings(); }
function showNewPairing() { 
    showScreen('newPairing'); 
    document.getElementById('pairingCode').textContent = generateCode();
}

function startSetup() {
    showSetup();
}

// Account Creation
function createAccount() {
    const name = document.getElementById('userName').value.trim();
    
    if (!name) {
        alert('Please enter your name');
        return;
    }
    
    appState.user.name = name;
    appState.user.id = Date.now().toString();
    
    saveState();
    showPairingManagement();
}

function generateCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Pairing Management
function savePairing() {
    const partnerName = document.getElementById('newPartnerName').value.trim();
    if (!partnerName) {
        alert('Please enter partner\'s name');
        return;
    }
    
    const code = document.getElementById('pairingCode').textContent;
    const pairing = new Pairing(partnerName, code, true);
    appState.pairings.push(pairing);
    appState.currentPairing = pairing.id;
    
    saveState();
    alert(`Pairing created with ${partnerName}! Share code: ${code}`);
    showDashboard();
}

function connectWithPartner() {
    const partnerName = document.getElementById('connectPartnerName').value.trim();
    const code = document.getElementById('partnerCode').value;
    
    if (!partnerName || code.length !== 4) {
        alert('Please enter partner\'s name and 4-digit code');
        return;
    }
    
    const pairing = new Pairing(partnerName, code, false);
    pairing.connected = true;
    appState.pairings.push(pairing);
    appState.currentPairing = pairing.id;
    
    saveState();
    alert(`Connected with ${partnerName}!`);
    showDashboard();
}

function renderPairings() {
    const container = document.getElementById('pairingsList');
    if (appState.pairings.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No pairings yet. Add your first partner!</p>';
        return;
    }
    
    container.innerHTML = appState.pairings.map(pairing => `
        <div class="pairing-item ${pairing.id === appState.currentPairing ? 'active' : ''}" 
             onclick="selectPairing('${pairing.id}')">
            <div>
                <strong>${pairing.partnerName}</strong>
                <br><small>Code: ${pairing.code}</small>
            </div>
            <div>
                <span style="font-size: 20px;">${pairing.myScore + pairing.partnerScore} pts</span>
            </div>
        </div>
    `).join('');
}

function selectPairing(pairingId) {
    appState.currentPairing = pairingId;
    saveState();
    showDashboard();
}

function getCurrentPairing() {
    return appState.pairings.find(p => p.id === appState.currentPairing);
}

// Display Updates
function updateDisplay() {
    const pairing = getCurrentPairing();
    
    // Update user display in header
    const userDisplay = document.getElementById('userDisplay');
    if (appState.user.name && pairing) {
        userDisplay.style.display = 'flex';
        document.getElementById('user1Name').textContent = appState.user.name;
        document.getElementById('user2Name').textContent = pairing.partnerName;
    }
    
    // Update dashboard
    if (pairing) {
        document.getElementById('currentPairingName').textContent = 
            `${appState.user.name} 💑 ${pairing.partnerName}`;
        document.getElementById('myScore').textContent = pairing.myScore;
        document.getElementById('partnerScore').textContent = pairing.partnerScore;
        document.getElementById('partnerScoreLabel').textContent = `${pairing.partnerName}'s Points`;
        
        // Update all partner name displays
        document.querySelectorAll('.partner-name-display').forEach(el => {
            el.textContent = pairing.partnerName;
        });
    } else {
        document.getElementById('currentPairingName').textContent = 'No Partner Selected';
    }
}

// My Want List Functions
function renderMyWantList() {
    const pairing = getCurrentPairing();
    if (!pairing) return;
    
    const container = document.getElementById('myWantItems');
    container.innerHTML = pairing.myWantList.map((item, index) => `
        <div class="want-item">
            <span>${item}</span>
            <button class="delete-btn" onclick="deleteMyWant(${index})">Remove</button>
        </div>
    `).join('');
}

function addWant() {
    const pairing = getCurrentPairing();
    if (!pairing) {
        alert('Please select a partner first');
        return;
    }
    
    const input = document.getElementById('newWant');
    const value = input.value.trim();
    if (value) {
        pairing.myWantList.push(value);
        input.value = '';
        renderMyWantList();
        saveState();
    }
}

function deleteMyWant(index) {
    const pairing = getCurrentPairing();
    pairing.myWantList.splice(index, 1);
    renderMyWantList();
    saveState();
}

function loadTemplates() {
    const templates = [
        "Good morning text with something specific you love about me",
        "Plan and execute a surprise date without me having to think about it",
        "Handle the dishes without being asked",
        "Put your phone away completely during our meals together",
        "Give me a 10-minute back massage",
        "Write me a love note and hide it for me to find",
        "Cook my favorite meal",
        "Listen to me vent without trying to fix anything",
        "Take a walk with me and hold my hand",
        "Tell me something specific you appreciated about me today",
        "Handle bedtime routine so I can relax",
        "Bring me my favorite coffee/tea in bed",
        "Give me 30 minutes of uninterrupted alone time",
        "Compliment me in front of others",
        "Remember and handle something I mentioned needing to do"
    ];
    
    const pairing = getCurrentPairing();
    pairing.myWantList = [...new Set([...pairing.myWantList, ...templates])];
    renderMyWantList();
    saveState();
}

function saveMyWantList() {
    const pairing = getCurrentPairing();
    if (pairing.myWantList.length === 0) {
        alert('Please add at least one item');
        return;
    }
    saveState();
    alert('Your want list saved! Your partner can now see it and select from it.');
    showDashboard();
}

// Partner's Want List (for me to select from)
function renderPartnerWantList() {
    const pairing = getCurrentPairing();
    if (!pairing) return;
    
    // Simulate partner's want list (in real app, this would come from server)
    if (pairing.partnerWantList.length === 0) {
        pairing.partnerWantList = [
            "Morning coffee in bed",
            "Unexpected flowers",
            "Take over dinner plans",
            "Foot massage while watching TV",
            "Handle all the driving for a day",
            "Clean the bathroom without being asked",
            "Plan a picnic",
            "Leave sweet notes",
            "Make their lunch for work",
            "Run their errands"
        ];
    }
    
    const container = document.getElementById('partnerWantItems');
    container.innerHTML = pairing.partnerWantList.map((item, index) => `
        <div class="checkbox-wrapper">
            <input type="checkbox" 
                   id="partner-want-${index}"
                   value="${item}"
                   onchange="togglePartnerWant(${index}, this.checked)"
                   ${pairing.myWillingList.includes(item) ? 'checked' : ''}>
            <label for="partner-want-${index}">${item}</label>
        </div>
    `).join('');
}

function togglePartnerWant(index, isChecked) {
    const pairing = getCurrentPairing();
    const item = pairing.partnerWantList[index];
    
    if (isChecked) {
        if (pairing.myWillingList.length >= 5) {
            alert('Please select exactly 5 items');
            document.getElementById(`partner-want-${index}`).checked = false;
            return;
        }
        if (!pairing.myWillingList.includes(item)) {
            pairing.myWillingList.push(item);
        }
    } else {
        pairing.myWillingList = pairing.myWillingList.filter(i => i !== item);
    }
    
    saveState();
}

// Priority Management
function renderPriorityList() {
    const pairing = getCurrentPairing();
    if (!pairing || pairing.myWillingList.length !== 5) {
        alert('Please select exactly 5 items first');
        showPartnerWantList();
        return;
    }
    
    // Initialize priorities if not set
    if (pairing.myPriorities.length === 0) {
        pairing.myPriorities = pairing.myWillingList.map((item, index) => ({
            item: item,
            priority: index + 1,
            points: 5 - index
        }));
    }
    
    const container = document.getElementById('priorityList');
    container.innerHTML = pairing.myPriorities.map((priority, index) => `
        <div class="priority-item" draggable="true" ondragstart="drag(event)" ondragover="allowDrop(event)" ondrop="drop(event)" data-index="${index}">
            <div class="priority-number">${priority.priority}</div>
            <div class="priority-text">${priority.item}</div>
            <div class="priority-points">${priority.points} pts</div>
        </div>
    `).join('');
}

// Drag and drop for priorities
function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.dataset.index);
    ev.target.classList.add('dragging');
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drop(ev) {
    ev.preventDefault();
    const fromIndex = parseInt(ev.dataTransfer.getData("text"));
    const toElement = ev.target.closest('.priority-item');
    if (!toElement) return;
    
    const toIndex = parseInt(toElement.dataset.index);
    const pairing = getCurrentPairing();
    
    // Swap items
    const temp = pairing.myPriorities[fromIndex];
    pairing.myPriorities[fromIndex] = pairing.myPriorities[toIndex];
    pairing.myPriorities[toIndex] = temp;
    
    // Update priorities and points
    pairing.myPriorities.forEach((item, index) => {
        item.priority = index + 1;
        item.points = 5 - index;
    });
    
    saveState();
    renderPriorityList();
}

function savePriorities() {
    const pairing = getCurrentPairing();
    saveState();
    alert('Priorities saved! You\'ll earn more points for higher priority services.');
    showDashboard();
}

// Today's Action
function getTodaysAction() {
    const pairing = getCurrentPairing();
    if (!pairing) {
        alert('Please select a partner first');
        return;
    }
    
    if (pairing.myPriorities.length === 0) {
        alert('Please select and prioritize items from your partner\'s want list first');
        showPartnerWantList();
        return;
    }
    
    // Get random action from priorities
    const randomIndex = Math.floor(Math.random() * pairing.myPriorities.length);
    pairing.currentAction = pairing.myPriorities[randomIndex];
    
    // Calculate week number
    const monthStart = new Date(pairing.monthStarted);
    const now = new Date();
    const daysSinceStart = Math.floor((now - monthStart) / (1000 * 60 * 60 * 24));
    pairing.weekNumber = Math.floor(daysSinceStart / 7) + 1;
    
    document.getElementById('weekNumber').textContent = pairing.weekNumber;
    document.getElementById('currentAction').textContent = pairing.currentAction.item;
    document.getElementById('actionPoints').textContent = pairing.currentAction.points;
    
    showScreen('todaysAction');
    saveState();
}

function completeAction() {
    const pairing = getCurrentPairing();
    if (!pairing.currentAction) return;
    
    pairing.partnerScore += pairing.currentAction.points;
    pairing.completedThisWeek.push(pairing.currentAction.item);
    
    saveState();
    alert(`Great job! You earned ${pairing.currentAction.points} points for ${pairing.partnerName}!`);
    updateDisplay();
    showDashboard();
}

function skipAction() {
    showDashboard();
}

// Weekly Guessing
function weeklyGuessing() {
    const pairing = getCurrentPairing();
    if (!pairing) {
        alert('Please select a partner first');
        return;
    }
    
    if (pairing.myWantList.length === 0) {
        alert('You need a want list first');
        showMyWantList();
        return;
    }
    
    const container = document.getElementById('guessOptions');
    container.innerHTML = pairing.myWantList.map((item, index) => `
        <div class="checkbox-wrapper">
            <input type="radio" 
                   name="guess" 
                   id="guess-${index}"
                   value="${item}">
            <label for="guess-${index}">${item}</label>
        </div>
    `).join('');
    
    showScreen('guessing');
}

function submitGuess() {
    const pairing = getCurrentPairing();
    const selected = document.querySelector('input[name="guess"]:checked');
    
    if (!selected) {
        alert('Please select your guess');
        return;
    }
    
    // Simulate checking if guess is correct (in real app, would verify with partner's completions)
    const isCorrect = Math.random() > 0.3; // 70% chance for demo
    
    if (isCorrect) {
        pairing.myScore += 1;
        pairing.partnerScore += 2;
        alert(`🎉 Correct! You got 1 point and ${pairing.partnerName} got 2 points!`);
    } else {
        alert(`Not quite, but keep appreciating what ${pairing.partnerName} does for you!`);
    }
    
    saveState();
    updateDisplay();
    showDashboard();
}

// Reset Month
function resetMonth() {
    const pairing = getCurrentPairing();
    if (!pairing) return;
    
    if (confirm(`Start a new month with ${pairing.partnerName}? Selections will reset but scores remain.`)) {
        pairing.myWillingList = [];
        pairing.myPriorities = [];
        pairing.currentAction = null;
        pairing.completedThisWeek = [];
        pairing.weekNumber = 1;
        pairing.monthStarted = new Date().toISOString();
        
        saveState();
        alert('New month started! Time to select new commitments.');
        updateDisplay();
    }
}

// Sharing
function copyCode() {
    const code = document.getElementById('pairingCode').textContent;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(code);
        alert('Code copied to clipboard!');
    } else {
        alert(`Your code is: ${code}`);
    }
}

function shareApp() {
    const code = document.getElementById('pairingCode').textContent;
    const shareData = {
        title: 'Service Box',
        text: `Join me on Service Box! Use code ${code} to connect. Let's strengthen our relationship!`,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData);
    } else {
        const text = `Join me on Service Box!\n\nVisit: ${window.location.href}\nUse code: ${code}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            alert('Share link copied to clipboard!');
        } else {
            alert(text);
        }
    }
}

// Make functions global
window.showOnboarding = showOnboarding;
window.showHowItWorks = showHowItWorks;
window.startSetup = startSetup;
window.showSetup = showSetup;
window.showPairExisting = showPairExisting;
window.createAccount = createAccount;
window.showDashboard = showDashboard;
window.showMyWantList = showMyWantList;
window.showPartnerWantList = showPartnerWantList;
window.showPrioritySelection = showPrioritySelection;
window.showPairingManagement = showPairingManagement;
window.showNewPairing = showNewPairing;
window.savePairing = savePairing;
window.connectWithPartner = connectWithPartner;
window.selectPairing = selectPairing;
window.addWant = addWant;
window.deleteMyWant = deleteMyWant;
window.loadTemplates = loadTemplates;
window.saveMyWantList = saveMyWantList;
window.togglePartnerWant = togglePartnerWant;
window.savePriorities = savePriorities;
window.getTodaysAction = getTodaysAction;
window.completeAction = completeAction;
window.skipAction = skipAction;
window.weeklyGuessing = weeklyGuessing;
window.submitGuess = submitGuess;
window.resetMonth = resetMonth;
window.copyCode = copyCode;
window.shareApp = shareApp;
window.renderMyWantList = renderMyWantList;
window.renderPartnerWantList = renderPartnerWantList;
window.renderPriorityList = renderPriorityList;
window.drag = drag;
window.allowDrop = allowDrop;
window.drop = drop;