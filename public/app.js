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

function checkAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (token) {
        authView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        displayName.textContent = username || 'Champion';
        injectChat(token);
        initRpsGame(token);
    } else {
        authView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
    }
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
            currentMatchId = data.matchId;
            document.getElementById('opponent-name').textContent = data.opponent1 === localStorage.getItem('username') ? data.opponent2 : data.opponent1;
            showView('game');
            startRoundCountdown();
        });

        gameSocket.on('roundResult', (result) => {
            displayRoundResult(result);
            setTimeout(() => { if (!result.isMatchOver) startRoundCountdown(); }, 3000);
        });

        gameSocket.on('matchOver', (data) => {
            const isWinner = data.winnerId === localStorage.getItem('userId');
            document.getElementById('final-result-title').textContent = isWinner ? 'VICTOIRE ! 🎉' : 'DÉFAITE... 💀';
            showView('match-over');
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
        choiceButtons.forEach(btn => { btn.classList.remove('selected'); btn.disabled = false; });
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
        document.getElementById('my-score').textContent = result.p1Score; // Simplified logic for display
        document.getElementById('opp-score').textContent = result.p2Score;
        const myId = localStorage.getItem('userId');
        const win = result.winnerId === myId;
        const draw = result.winnerId === null;
        roundMsgEl.textContent = draw ? 'ÉGALITÉ !' : (win ? 'MANCHE GAGNÉE ! ✅' : 'MANCHE PERDUE... ❌');
        roundMsgEl.style.background = draw ? '#eee' : (win ? '#d4edda' : '#f8d7da');
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
