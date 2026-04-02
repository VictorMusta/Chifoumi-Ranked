const API_BASE = ''; // Backend is on the same origin
let gameSocket;

const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const toggleAuth = document.getElementById('toggle-auth');
const regFields = document.getElementById('reg-fields');
const authError = document.getElementById('auth-error');
const submitBtn = document.getElementById('submit-btn');
const cancelQueueBtn = document.getElementById('cancel-queue-btn');
const closeGameBtn = document.getElementById('close-game-btn');
const logoutBtn = document.getElementById('logout-btn');
const displayName = document.getElementById('display-name');

let isLogin = true;

// Init
// Moved to the bottom of the file

// Toggle Login/Register
toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    authTitle.textContent = isLogin ? 'Connexion' : 'Inscription';
    submitBtn.textContent = isLogin ? 'Se Connecter' : 'Créer un Compte';
    submitBtn.className = isLogin ? 'neo-btn neo-btn-primary' : 'neo-btn neo-btn-secondary';
    toggleAuth.textContent = isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter";
    regFields.classList.toggle('hidden', isLogin);
    authError.classList.add('hidden');
    document.getElementById('email').required = !isLogin;
});

// Submit Form
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.classList.add('hidden');
    
    const payload = {
        password: document.getElementById('password').value,
    };

    if (isLogin) {
        payload.identifier = document.getElementById('username').value;
    } else {
        payload.username = document.getElementById('username').value;
        payload.email = document.getElementById('email').value;
    }

    const endpoint = isLogin ? '/auth/login' : '/auth/register';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Une erreur est survenue');
        }

        if (isLogin) {
            if (data.accessToken) {
                const token = data.accessToken;
                const payload = JSON.parse(atob(token.split('.')[1]));
                localStorage.setItem('token', token);
                localStorage.setItem('username', payload.username);
                localStorage.setItem('userId', payload.id || payload.sub);
                window.location.reload();
            }
        } else {
            // After register, switch to login
            isLogin = true;
            // On simulate le clic pour remettre l'UI en mode login
            toggleAuth.click();
            authError.textContent = 'Compte créé ! Connecte-toi maintenant.';
            authError.classList.remove('hidden');
            authError.style.background = 'var(--color-yellow)';
        }
    } catch (err) {
        console.error('Auth Error:', err);
        authError.textContent = err.message;
        authError.classList.remove('hidden');
        authError.style.background = 'var(--color-red)';
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    location.reload();
});

async function fetchUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch('/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            window.currentUser = data;
            updateSubscriptionUI(data);
            return data;
        }
    } catch (err) {
        console.error('Failed to fetch user profile', err);
    }
}

function updateSubscriptionUI(user) {
    const statusEl = document.getElementById('sub-status');
    const trialEl = document.getElementById('trial-counter');
    const trialsCountEl = document.getElementById('remaining-trials');
    const upgradeBtn = document.getElementById('upgrade-pro-btn');
    const referralCodeInput = document.getElementById('my-referral-code');

    const tiers = ['GRATUIT (Limitée)', 'BASIQUE (2x Pierre)', 'PREMIUM PRO 👑'];
    statusEl.textContent = tiers[user.subscriptionTier] || 'Inconnu';
    
    if (user.subscriptionTier < 2 && user.remainingTrialMatches > 0) {
        trialEl.classList.remove('hidden');
        trialsCountEl.textContent = user.remainingTrialMatches;
    } else {
        trialEl.classList.add('hidden');
    }

    if (user.subscriptionTier === 2) {
        upgradeBtn.classList.add('hidden');
        referralCodeInput.value = user.generatedReferralCode || '';
        referralCodeInput.placeholder = user.generatedReferralCode ? '' : 'Code prêt à être généré !';
    } else {
        upgradeBtn.classList.remove('hidden');
    }
}

async function checkAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (token) {
        authView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        displayName.textContent = username || 'Champion';
        await fetchUserProfile();
        injectChat(token);
        initRpsGame(token);
        setupSubscriptionPage();
    } else {
        authView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
    }
}

function setupSubscriptionPage() {
    const upgradeBtn = document.getElementById('upgrade-pro-btn');
    const genCodeBtn = document.getElementById('gen-code-btn');
    const redeemCodeBtn = document.getElementById('redeem-code-btn');
    const token = localStorage.getItem('token');

    upgradeBtn.onclick = async () => {
        const res = await fetch('/stripe/checkout', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ tier: 'pro' })
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
    };

    genCodeBtn.onclick = async () => {
        const res = await fetch('/auth/referral/generate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.code) {
           document.getElementById('my-referral-code').value = data.code;
        } else {
            alert(data.message || 'Erreur lors de la génération');
        }
    };

    redeemCodeBtn.onclick = async () => {
        const code = document.getElementById('redeem-code-input').value;
        const res = await fetch('/auth/referral/redeem', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ code })
        });
        const data = await res.json();
        if (data.success) {
            alert('BRAVO ! Tu es PRO !');
            window.location.reload();
        } else {
            alert(data.message || 'Code invalide');
        }
    };
}

function initRpsGame(token) {
    const playRpsBtn = document.getElementById('play-rps-btn');
    const gameModal = document.getElementById('game-modal');
    const matchmakingView = document.getElementById('matchmaking-view');
    const gameView = document.getElementById('game-view');
    const matchOverView = document.getElementById('match-over-view');
    const countdownEl = document.getElementById('countdown-timer');
    const roundMsgEl = document.getElementById('round-result-msg');
    const choiceButtons = document.querySelectorAll('.choice-btn');

    let currentMatchId = null;
    let countdownInterval = null;
    let selectedMove = null;

    if (!playRpsBtn) return;

    function initSocket() {
        if (gameSocket) return;
        gameSocket = io('/game', { auth: { token: token } });
        
        gameSocket.on('stats', updateGlobalStats);
        gameSocket.on('globalStatsUpdate', updateGlobalStats);
        
        gameSocket.on('matchFound', (data) => {
            console.log('[RPS] Match Found:', data);
            window.currentMatch = data;
            document.getElementById('opponent-name').textContent = data.yourPosition === 1 ? data.opponent2 : data.opponent1;
            document.getElementById('my-score').textContent = '0';
            document.getElementById('opp-score').textContent = '0';
            showView('game');
            startRoundCountdown();
        });

        gameSocket.on('roundResult', (result) => {
            console.log('[RPS] Round Result:', result);
            displayRoundResult(result);
            setTimeout(() => { if (!result.isMatchOver) startRoundCountdown(); }, 3000);
        });

        gameSocket.on('matchOver', (data) => {
            console.log('[RPS] Match Over:', data);
            const myPos = window.currentMatch?.yourPosition;
            const win = (myPos === 1 && data.p1Score > data.p2Score) || (myPos === 2 && data.p2Score > data.p1Score);
            const draw = data.p1Score === data.p2Score;
            
            // Adjust if winnerId was sent explicitly (forfeits etc)
            const finalWin = data.winnerId ? String(data.winnerId) === String(localStorage.getItem('userId')) : win;
            
            document.getElementById('final-result-title').textContent = draw ? 'ÉGALITÉ !' : (finalWin ? 'VICTOIRE ! 🎉' : 'DÉFAITE... 💀');
            showView('match-over');
            window.currentMatch = null;
        });
    }

    function updateGlobalStats(stats) {
        document.getElementById('stat-best-streak').textContent = stats.bestStreak || 0;
        document.getElementById('stat-best-holder').textContent = stats.bestStreakHolder || 'N/A';
        document.getElementById('stat-total-wins').textContent = stats.totalMatches || 0;
        document.getElementById('stat-total-rounds').textContent = stats.totalRounds || 0;
    }

    function showView(viewName) {
        matchmakingView.style.display = viewName === 'matchmaking' ? 'block' : 'none';
        gameView.style.display = viewName === 'game' ? 'block' : 'none';
        matchOverView.style.display = viewName === 'match-over' ? 'block' : 'none';
        gameModal.style.display = 'flex';
    }

    function startRoundCountdown() {
        let timeLeft = 2.0;
        selectedMove = null;
        
        const userTier = window.currentUser?.subscriptionTier || 0;
        const hasTrials = (window.currentUser?.remainingTrialMatches || 0) > 0;

        choiceButtons.forEach(btn => { 
            btn.classList.remove('selected'); 
            btn.disabled = false; 
            
            // Paywall: Lock Rock for FREE users (tier 0) if no trials
            if (btn.dataset.move === 'rock' && userTier === 0 && !hasTrials) {
                btn.disabled = true;
                btn.title = "DÉBLOQUEZ LA PIERRE POUR 5€ !";
                btn.style.opacity = "0.5";
            }
        });
        
        roundMsgEl.textContent = 'Choisissez votre coup !';
        countdownEl.textContent = timeLeft.toFixed(1);
        if (countdownInterval) clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            timeLeft -= 0.1;
            if (timeLeft <= 0) { timeLeft = 0; clearInterval(countdownInterval); finishSelection(); }
            countdownEl.textContent = timeLeft.toFixed(1);
        }, 100);
    }

    function finishSelection() {
        choiceButtons.forEach(btn => btn.disabled = true);
        if (!selectedMove) selectedMove = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];
        gameSocket.emit('playMove', { matchId: currentMatchId, move: selectedMove });
        roundMsgEl.textContent = 'Attente de l\'adversaire...';
    }

    function displayRoundResult(result) {
        const myPos = window.currentMatch?.yourPosition;
        const isP1 = myPos === 1;
        
        document.getElementById('my-score').textContent = isP1 ? result.p1Score : result.p2Score;
        document.getElementById('opp-score').textContent = isP1 ? result.p2Score : result.p1Score;
        
        const myId = String(localStorage.getItem('userId'));
        const win = (isP1 && result.winnerId === window.currentMatch?.p1Id && result.winnerId !== null) || 
                    (!isP1 && result.winnerId === window.currentMatch?.p2Id && result.winnerId !== null);
        
        // Simpler win check if winnerId is definitive
        const absoluteWin = result.winnerId && result.winnerId === myId;
        // BUT if playing against self, we MUST use position-based check on a specific winnerRef
        const realWin = (isP1 && result.winnerId === window.currentMatch?.p1Id) || 
                       (!isP1 && result.winnerId === window.currentMatch?.p2Id);
        
        const draw = result.winnerId === null;
        
        // Final sanity check: if playing against self, we rely on result position logic?
        // No, backend result.winnerId is correctly set to p1Id or p2Id.
        // If myId matches winnerId, I win. Simple and robust.
        
        roundMsgEl.textContent = draw ? 'ÉGALITÉ !' : (win ? 'MANCHE GAGNÉE ! ✅' : 'MANCHE PERDUE... ❌');
        roundMsgEl.style.background = draw ? '#eee' : (win ? '#d4edda' : '#f8d7da');
        roundMsgEl.style.color = 'black'; // Ensure readability
    }

    playRpsBtn.addEventListener('click', () => {
        initSocket();
        showView('matchmaking');
        gameSocket.emit('joinQueue');
    });

    choiceButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedMove = btn.dataset.move;
            choiceButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    // Handle cancel and close within the scope
    document.getElementById('cancel-queue-btn').onclick = () => {
        if (gameSocket) gameSocket.emit('leaveQueue');
        gameModal.style.display = 'none';
    };
    document.getElementById('close-game-btn').onclick = () => {
        gameModal.style.display = 'none';
    };

    // Initial stats fetch
    initSocket();
    gameSocket.emit('getStats');
}

function injectChat(token) {
    const container = document.getElementById('chat-frame-container');
    if (!container) return;
    container.innerHTML = `
        <iframe src="chat/index.html?token=${token}" 
                style="position: fixed; bottom: 0; right: 0; width: 120px; height: 120px; border: none; z-index: 9999;" 
                allow="autoplay"></iframe>
    `;

    window.addEventListener('message', (event) => {
        if (event.data.type === 'chat-resize') {
            const iframe = container.querySelector('iframe');
            if (iframe) {
                iframe.style.width = event.data.expanded ? '400px' : '120px';
                iframe.style.height = event.data.expanded ? '600px' : '120px';
            }
        }
    });
}

// Kickstart the app
checkAuth();
