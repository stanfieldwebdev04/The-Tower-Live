// Settings modal pop-up functionality

document.querySelectorAll('.settings-card').forEach(card => {
    card.addEventListener('click', () => {
        const modalId = card.getAttribute('data-modal-target');
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.showModal();
        }
    });
});

document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('dialog');
        if (modal) {
            modal.close();
        }
    });
});

// Close settings modal when clicking outside of it
document.querySelectorAll('dialog').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.close();
        }
    });
});


// Auth gate functionality

if (document.getElementById('auth-gate')) {
    let isLoginMode = false;
    const gate = document.getElementById('auth-gate');
    const backdrop = document.querySelector('.auth-backdrop');
    const form = document.getElementById('auth-form');
    const title = document.getElementById('auth-title');
    const submitBtn = document.getElementById('auth-submit');
    const toggleLink = document.getElementById('auth-gate-link');
    const errorBox = document.getElementById('auth-error');

    // 1. On page load, check if user already has a valid 30-day cookie
        (async function checkSession() {
            const res = await fetch('/api/me');
            if (res.ok) {
                gate.style.display = 'none';
                if (backdrop) {
                    backdrop.style.display = "none";
                }
            }
        })();


    // 2. Toggle between login and signup modes
    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        title.textContent = isLoginMode ? 'Sign In' : 'Create an Account';
        submitBtn.textContent = isLoginMode ? 'Sign In' : 'Create Account';
        toggleLink.textContent = isLoginMode ? 'Create an account.' : 'Sign in.';
        errorBox.style.display = 'none'; // Clear any previous error messages
    });


    // Auth gate animation
    setTimeout(() => {
        gate.classList.add('active');
        if (backdrop) {
            backdrop.classList.add('active');
        }
    }, 2000);


    // 3. Submit credentials to Node.js
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.style.display = 'none';

        const endpoint = isLoginMode ? '/api/login' : '/api/register';
        const username = document.getElementById('auth-username').value;
        const password = document.getElementById('auth-password').value;

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (res.ok) {
            gate.style.display = 'none'; // Unlock stream and chat
            location.reload(); // Reload to intialize WebSockets/stream with the new cookie
        } else {
            errorBox.textContent = data.message || 'An error occurred';
            errorBox.style.display = 'block';
        }
    });
}

// Theme toggle
const themeToggle = document.getElementById('toggle-light');
const img = document.querySelectorAll('img');

const savedTheme = localStorage.getItem('theme');
const theme = savedTheme === 'light' ? 'light' : 'dark';
function applyTheme(theme) {
    const isLight = theme === 'light';
    const isDark = theme === 'dark';

    document.body.classList.toggle('light-theme', isLight);
    document.body.classList.toggle('dark-theme', isDark);
    if (themeToggle) {
        themeToggle.checked = isLight;
    }
    localStorage.setItem('theme', theme);
    img.forEach(image => {
        image.classList.toggle('invert', isDark);
    });

    const logo = document.querySelectorAll('.logo img');
    logo.forEach(img => {
        img.classList.remove('invert');
    });
}
if (themeToggle) {
    themeToggle.addEventListener('change', () => {
        applyTheme(themeToggle.checked ? 'light' : 'dark');
    });
}

// Apply saved theme on page load
applyTheme(theme);
