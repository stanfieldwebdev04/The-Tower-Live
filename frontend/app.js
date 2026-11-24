// Modal pop-up functionality

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

// Close modal when clicking outside of it
document.querySelectorAll('dialog').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.close();
        }
    });
});



// Settings functionality to save to localStorage


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
