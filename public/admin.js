document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('skin-form');
    const colorInput = document.getElementById('skin-color');
    const colorHex = document.getElementById('color-hex');
    const status = document.getElementById('status');
    const submitBtn = document.getElementById('submit-btn');

    // Sync color preview
    colorInput.addEventListener('input', (e) => {
        colorHex.textContent = e.target.value.toUpperCase();
        colorHex.style.color = e.target.value;
    });

    async function checkAdminAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }

        try {
            const res = await fetch('/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const user = await res.json();
            if (!res.ok || user.permissions < 3) {
                alert("Accès réservé aux administrateurs.");
                window.location.href = '/';
            }
        } catch (err) {
            window.location.href = '/';
        }
    }

    checkAdminAuth();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const token = localStorage.getItem('token');
        if (!token) {
            showStatus('Authentification requise. Redirection...', 'error');
            setTimeout(() => window.location.href = '/', 2000);
            return;
        }

        const name = document.getElementById('skin-name').value;
        const priceValue = parseFloat(document.getElementById('skin-price').value);
        const color = colorInput.value;

        // Convert to cents for Stripe
        const priceInCents = Math.round(priceValue * 100);

        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Création en cours...';
        showStatus('Communication avec Stripe...', 'success');

        try {
            const response = await fetch('/skins/admin/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, price: priceInCents, color })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de la création');
            }

            showStatus(`Succès ! Skin "${data.name}" créé avec l'ID Stripe ${data.productId}`, 'success');
            form.reset();
            colorHex.textContent = '#6366F1';
            
        } catch (err) {
            showStatus(err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = 'Créer le Produit Stripe';
        }
    });

    function showStatus(msg, type) {
        status.textContent = msg;
        status.className = `status-msg ${type}`;
        status.style.display = 'block';
    }
});
