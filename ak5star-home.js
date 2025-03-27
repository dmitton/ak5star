function toggleMenu() {
  const nav = document.querySelector('nav');
  nav.classList.toggle('active');
}

// Popup functionality
function openPopup(type) {
    const popup = document.getElementById(`${type}-popup`);
    popup.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when popup is open
}

function closePopup(type) {
    const popup = document.getElementById(`${type}-popup`);
    popup.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

// Close popup when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('popup')) {
        event.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Close popup with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const popups = document.querySelectorAll('.popup.active');
        popups.forEach(popup => {
            popup.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});
