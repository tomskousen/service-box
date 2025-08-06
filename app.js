// Service Box Mobile App - Main JavaScript

// App State
let appState = {
    user: {
        name: '',
        partnersName: '',
        pairingCode: null,
        connectedCode: null
    },
    wantList: [],
    willingList: [],
    monthlySelections: [],
    currentAction: null,
    myScore: 0,
    partnerScore: 0,
    lastReset: new Date().toISOString(),
    selectedGuess: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    checkInstallPrompt();
    setupServiceWorker();
    
    // Update nav based on current screen
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

// State Management
function loadState() {
    const saved = localStorage.getItem('serviceBoxState');
    if (saved) {
        appState = JSON.parse(saved);
        if (appState.user.name) {
            showDashboard();
            updateDashboard();
        }
    }
}

function saveState() {
    localStorage.setItem('serviceBoxState', JSON.stringify(appState));
    // In a real app, this would sync with a server
    syncWithPartner();
}

function syncWithPartner() {
    // Simulated sync - in production this would use Firebase/Supabase
    if (appState.user.connectedCode) {
        console.log('Syncing with partner code:', appState.user.connectedCode);
    }
}

// Navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
    
    // Hide bottom nav for onboarding screens
    const bottomNav = document.querySelector('.bottom-nav');
    const shareBtn = document.querySelector('.share-button');
    const hideNavScreens = ['onboarding', 'howItWorks', 'setup', 'pairing', 'enterCode'];
    
    if (hideNavScreens.includes(screenId)) {
        bottomNav.style.display = 'none';
        shareBtn.style.display = 'none';
    } else {
        bottomNav.style.display = 'flex';
        shareBtn.style.display = 'block';
    }
}

function showOnboarding() { showScreen('onboarding'); }
function showHowItWorks() { showScreen('howItWorks'); }
function showSetup() { showScreen('setup'); }
function showPairing() { showScreen('pairing'); }
function showPairExisting() { showScreen('enterCode'); }
function showDashboard() { showScreen('dashboard'); updateDashboard(); }
function showWantList() { showScreen('wantList'); renderWantList(); }
function showWillingSelection() { showScreen('willingSelection'); renderWillingList(); }
function showTodaysAction() { showScreen('todaysAction'); }
function showGuessing() { showScreen('guessing'); }

function startSetup() {
    showSetup();
}

// Account Creation
function createAccount() {
    const name = document.getElementById('userName').value.trim();
    const partnerName = document.getElementById('partnerName').value.trim();
    
    if (!name || !partnerName) {
        alert('Please enter both names');
        return;
    }
    
    appState.user.name = name;
    appState.user.partnersName = partnerName;
    appState.user.pairingCode = generateCode();
    
    saveState();
    showPairing();
    
    document.getElementById('pairingCode').textContent = appState.user.pairingCode;
}

function generateCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function copyCode() {
    const code = appState.user.pairingCode;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(code);
        alert('Code copied to clipboard!');
    } else {
        alert(`Your code is: ${code}`);
    }
}

function connectWithPartner() {
    const code = document.getElementById('partnerCode').value;
    if (code.length !== 4) {
        alert('Please enter a 4-digit code');
        return;
    }
    
    appState.user.connectedCode = code;
    saveState();
    alert('Connected successfully!');
    showDashboard();
}

function skipPairing() {
    showDashboard();
}

// Dashboard
function updateDashboard() {
    const myScoreEl = document.getElementById('myScore');
    const partnerScoreEl = document.getElementById('partnerScore');
    const connectedPartnerEl = document.getElementById('connectedPartner');
    const statusBadge = document.getElementById('connectionStatus');
    
    if (myScoreEl) myScoreEl.textContent = appState.myScore;
    if (partnerScoreEl) partnerScoreEl.textContent = appState.partnerScore;
    if (connectedPartnerEl) connectedPartnerEl.textContent = appState.user.partnersName || 'Partner';
    
    if (statusBadge) {
        if (appState.user.connectedCode) {
            statusBadge.className = 'status-badge status-connected';
            statusBadge.innerHTML = `Connected with ${appState.user.partnersName}`;
        } else {
            statusBadge.className = 'status-badge status-waiting';
            statusBadge.innerHTML = 'Waiting for partner to connect';
        }
    }
}

// Want List Functions
function renderWantList() {
    const container = document.getElementById('wantItems');
    if (!container) return;
    
    container.innerHTML = appState.wantList.map((item, index) => `
        <div class="want-item">
            <span>${item}</span>
            <button class="delete-btn" onclick="deleteWant(${index})">Remove</button>
        </div>
    `).join('');
}

function addWant() {
    const input = document.getElementById('newWant');
    const value = input.value.trim();
    if (value) {
        appState.wantList.push(value);
        input.value = '';
        renderWantList();
        saveState();
    }
}

function deleteWant(index) {
    appState.wantList.splice(index, 1);
    renderWantList();
    saveState();
}

function loadTemplates() {
    const templates = [
        "Give a genuine compliment daily",
        "Put phone away during meals",
        "Plan a surprise date",
        "5-minute back massage",
        "Write a love note",
        "Cook favorite meal",
        "Listen without solving",
        "Morning coffee in bed",
        "Take a walk together",
        "Share daily gratitude"
    ];
    
    appState.wantList = [...new Set([...appState.wantList, ...templates])];
    renderWantList();
    saveState();
}

function saveWantList() {
    if (appState.wantList.length === 0) {
        alert('Please add at least one item');
        return;
    }
    saveState();
    alert('Want list saved!');
    showDashboard();
}

// Willing Selection
function renderWillingList() {
    const container = document.getElementById('willingItems');
    if (!container) return;
    
    container.innerHTML = appState.wantList.map((item, index) => `
        <div class="checkbox-wrapper">
            <input type="checkbox" 
                   id="willing-${index}" 
                   onchange="toggleWilling(${index}, this.checked)"
                   ${appState.willingList.includes(item) ? 'checked' : ''}>
            <label for="willing-${index}">${item}</label>
        </div>
    `).join('');
    updateSelectionCount();
}

function toggleWilling(index, isChecked) {
    const item = appState.wantList[index];
    
    if (isChecked) {
        // Adding item
        if (appState.willingList.length >= 5) {
            alert('Please select exactly 5 items');
            // Uncheck the box since we can't add more
            document.getElementById(`willing-${index}`).checked = false;
            return;
        }
        if (!appState.willingList.includes(item)) {
            appState.willingList.push(item);
        }
    } else {
        // Removing item
        appState.willingList = appState.willingList.filter(i => i !== item);
    }
    
    updateSelectionCount();
    saveState();
}

function updateSelectionCount() {
    document.getElementById('selectionCount').textContent = 
        `${appState.willingList.length}/5 Selected`;
}

function saveWillingList() {
    if (appState.willingList.length !== 5) {
        alert('Please select exactly 5 items');
        return;
    }
    appState.monthlySelections = [...appState.willingList];
    saveState();
    alert('Selections saved!');
    showDashboard();
}

// Today's Action
function getTodaysAction() {
    if (appState.monthlySelections.length === 0) {
        alert('Please complete willing selection first');
        showWillingSelection();
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * appState.monthlySelections.length);
    appState.currentAction = appState.monthlySelections[randomIndex];
    
    const actionElement = document.getElementById('currentAction');
    if (actionElement) {
        actionElement.textContent = appState.currentAction;
    }
    showTodaysAction();
    saveState();
}

function completeAction() {
    appState.myScore += 1;
    saveState();
    alert('Great job! Action completed! +1 point');
    updateDashboard();
    showDashboard();
}

// Guessing Game
function startGuessing() {
    if (!appState.currentAction) {
        alert('No action selected for today yet!');
        return;
    }
    
    const container = document.getElementById('guessOptions');
    if (!container) return;
    
    container.innerHTML = appState.monthlySelections.map((item, index) => `
        <div class="checkbox-wrapper">
            <input type="radio" 
                   name="guess" 
                   id="guess-${index}"
                   value="${index}"
                   onchange="selectGuess(${index})">
            <label for="guess-${index}">${item}</label>
        </div>
    `).join('');
    showGuessing();
}

function selectGuess(index) {
    appState.selectedGuess = appState.monthlySelections[index];
}

function submitGuess() {
    if (!appState.selectedGuess) {
        alert('Please select your guess');
        return;
    }
    
    if (appState.selectedGuess === appState.currentAction) {
        appState.myScore += 1;
        appState.partnerScore += 1;
        alert('🎉 Correct! You both get a point!');
    } else {
        alert(`Not quite! The action was: ${appState.currentAction}`);
    }
    
    appState.selectedGuess = null;
    saveState();
    updateDashboard();
    showDashboard();
}

// Month Reset
function resetMonth() {
    if (confirm('Start a new month? This will clear selections but keep scores.')) {
        appState.willingList = [];
        appState.monthlySelections = [];
        appState.currentAction = null;
        appState.lastReset = new Date().toISOString();
        saveState();
        alert('New month started!');
        updateDashboard();
    }
}

// Sharing
function shareApp() {
    const shareData = {
        title: 'Service Box',
        text: `Join me on Service Box! Use code ${appState.user.pairingCode} to connect.`,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData);
    } else {
        const text = `Join me on Service Box!\n\nVisit: ${window.location.href}\nUse code: ${appState.user.pairingCode}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            alert('Share link copied to clipboard!');
        } else {
            alert(text);
        }
    }
}

// PWA Installation
let deferredPrompt;

function checkInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install prompt after user has used app
        setTimeout(() => {
            if (appState.user.name && !localStorage.getItem('installDismissed')) {
                document.getElementById('installPrompt').classList.add('show');
            }
        }, 30000); // Show after 30 seconds
    });
}

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('App installed');
            }
            deferredPrompt = null;
        });
    }
    document.getElementById('installPrompt').classList.remove('show');
}

function dismissInstall() {
    localStorage.setItem('installDismissed', 'true');
    document.getElementById('installPrompt').classList.remove('show');
}

// Service Worker
function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js');
    }
}

// Profile placeholder
function showProfile() {
    alert(`Profile:\n${appState.user.name}\nCode: ${appState.user.pairingCode}\nPartner: ${appState.user.partnersName}`);
}