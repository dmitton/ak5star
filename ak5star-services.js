// Sticky header functionality with smooth scroll following
let ticking = false;

function handleScroll() {
    if (!ticking) {
        requestAnimationFrame(() => {
            const header = document.querySelector('.sticky-header');
            const scrollPosition = window.scrollY;
            const windowHeight = window.innerHeight;
            const headerHeight = header.offsetHeight;
            
            // Calculate how much the header should move up based on scroll position
            // When scrollPosition = 0, header stays at bottom (translateY(0))
            // When scrollPosition = windowHeight - headerHeight, header reaches top (translateY(-(windowHeight - headerHeight)))
            const maxScroll = windowHeight - headerHeight;
            const translateY = Math.min(scrollPosition, maxScroll);
            
            if (scrollPosition > 0) {
                header.style.transform = `translateY(-${translateY}px)`;
                header.classList.add('scrolled');
            } else {
                header.style.transform = 'translateY(0)';
                header.classList.remove('scrolled');
            }
            
            ticking = false;
        });
        ticking = true;
    }
}

// Add scroll event listener with passive option for better performance
window.addEventListener('scroll', handleScroll, { passive: true });

// Mobile menu functionality
function toggleMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    mobileMenuToggle.classList.toggle('active');
    mobileMenu.classList.toggle('active');
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuToggle && mobileMenu && !mobileMenuToggle.contains(event.target) && !mobileMenu.contains(event.target)) {
        mobileMenuToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
    }
});
