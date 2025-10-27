// Version: 2024-06-10-1 - Always-open accordion, scroll highlight, grow effect, logo animation, index.html for GitHub Pages
//

// Initialize EmailJS
(function() {
    emailjs.init({
        publicKey: 'SvPmSEaLN8Fld9m9e',
        limitRate: true
    });
})();

// Mobile Navbar Side Panel
const menuBtn = document.querySelector('.navbar-menu-btn');
const sidePanel = document.querySelector('.navbar-sidepanel');
const closeBtn = document.querySelector('.sidepanel-close');

if (menuBtn && sidePanel && closeBtn) {
    menuBtn.addEventListener('click', () => {
        sidePanel.classList.add('open');
        sidePanel.focus();
        document.body.style.overflow = 'hidden';
    });
    closeBtn.addEventListener('click', () => {
        sidePanel.classList.remove('open');
        document.body.style.overflow = '';
    });
    // Close on outside click
    document.addEventListener('mousedown', (e) => {
        if (sidePanel.classList.contains('open') && !sidePanel.contains(e.target) && !menuBtn.contains(e.target)) {
            sidePanel.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidePanel.classList.contains('open')) {
            sidePanel.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
} 

// Accordion Highlight on Scroll - Always Open, Highlight Centered
const accordionItems = document.querySelectorAll('.accordion-item');

function getCenteredAccordionItem() {
    let minDiff = Infinity;
    let centered = null;
    const viewportCenter = window.innerHeight / 2;
    accordionItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const diff = Math.abs(itemCenter - viewportCenter);
        if (diff < minDiff) {
            minDiff = diff;
            centered = item;
        }
    });
    return centered;
}

function highlightCenteredAccordion() {
    const centered = getCenteredAccordionItem();
    accordionItems.forEach(item => {
        if (item === centered) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

window.addEventListener('scroll', highlightCenteredAccordion);
window.addEventListener('resize', highlightCenteredAccordion);
document.addEventListener('DOMContentLoaded', highlightCenteredAccordion);

// Smooth scroll to info-section when 'What You Learn' is clicked in navbar
const whatYouLearnLinks = Array.from(document.querySelectorAll('a')).filter(a => a.textContent.trim() === 'What You Learn');
whatYouLearnLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const infoSection = document.getElementById('info-section');
        if (infoSection) {
            infoSection.scrollIntoView({ behavior: 'smooth' });
            console.log('Scrolled to info-section from navbar.');
        }
    });
});

// Smooth scroll to pricing-section when 'Prices' is clicked in navbar
const pricesLinks = Array.from(document.querySelectorAll('a')).filter(a => a.textContent.trim() === 'Prices');
pricesLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pricingSection = document.getElementById('pricing-section');
        if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth' });
            console.log('Scrolled to pricing-section from navbar.');
        }
    });
});

// Smooth scroll to contact-section when 'Contact' is clicked in navbar or sidepanel
const contactLinks = Array.from(document.querySelectorAll('a')).filter(a => a.textContent.trim() === 'Contact');
contactLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const contactSection = document.getElementById('contact-section');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
            console.log('Scrolled to contact-section from navbar.');
        }
    });
});

// 1. Smooth scroll for 'About Me' in navbar/sidepanel
const aboutLinks = Array.from(document.querySelectorAll('a')).filter(a => a.textContent.trim() === 'About Me');
aboutLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const aboutSection = document.getElementById('about-section');
        if (aboutSection) {
            aboutSection.scrollIntoView({ behavior: 'smooth' });
            console.log('Scrolled to about-section from navbar.');
        }
    });
});

// 2. Hero 'Contact Me' button scrolls to contact form
const heroContactBtn = document.getElementById('contactBtn');
if (heroContactBtn) {
    heroContactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const contactSection = document.getElementById('contact-section');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
            console.log('Hero Contact Me button scrolls to contact-section.');
        }
    });
}

// 3. Hero 'View Lessons' button scrolls to info section and opens all accordions with animation
const heroLessonsBtn = document.getElementById('viewLessonsBtn');
if (heroLessonsBtn) {
    heroLessonsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const infoSection = document.getElementById('info-section');
        if (infoSection) {
            infoSection.scrollIntoView({ behavior: 'smooth' });
            // Open all accordions with dramatic animation
            const accordionItems = document.querySelectorAll('.accordion-item');
            accordionItems.forEach((item, idx) => {
                setTimeout(() => {
                    item.classList.add('open', 'dramatic');
                }, idx * 350); // stagger for drama
            });
            setTimeout(() => {
                accordionItems.forEach(item => item.classList.remove('dramatic'));
            }, accordionItems.length * 350 + 1000);
            console.log('Hero View Lessons button scrolls to info-section and opens accordions.');
        }
    });
}

// 4. Yellow banner 'Get In Touch' button scrolls to contact form
const ctaBtn = document.querySelector('.cta-btn');
if (ctaBtn) {
    ctaBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const contactSection = document.getElementById('contact-section');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
            console.log('CTA Get In Touch button scrolls to contact-section.');
        }
    });
}

// Parallax float effect for results section
function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top < window.innerHeight - 60 &&
        rect.bottom > 60
    );
}
function handleParallaxFloat() {
    const floatEls = document.querySelectorAll('.results-image, .results-transformation');
    floatEls.forEach(el => {
        if (isInViewport(el)) {
            el.classList.add('parallax-float');
        } else {
            el.classList.remove('parallax-float');
        }
    });
}
window.addEventListener('scroll', handleParallaxFloat);
window.addEventListener('resize', handleParallaxFloat);
document.addEventListener('DOMContentLoaded', handleParallaxFloat);

// Contact form submission with EmailJS
const contactForm = document.querySelector('.contact-form');
const contactSuccess = document.querySelector('.contact-success');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form values
        const firstName = this.querySelector('[name="firstName"]').value;
        const lastName = this.querySelector('[name="lastName"]').value;
        const email = this.querySelector('[name="email"]').value;
        const message = this.querySelector('[name="message"]').value;

        // Create template parameters
        const templateParams = {
            name: `${firstName} ${lastName}`,
            email: email,
            message: message
        };

        emailjs.send(
            'service_hahzv2f', // Service ID
            'template_4gfaeqj', // Template ID
            templateParams // Template parameters
        ).then(
            function(response) {
                contactForm.style.display = 'none';
                if (contactSuccess) contactSuccess.style.display = 'block';
                console.log('SUCCESS!', response.status, response.text);
            },
            function(error) {
                alert('Failed to send message. Please try again later.');
                console.error('FAILED...', error);
            }
        );
    });
}
// Reset form visibility on reload
window.addEventListener('DOMContentLoaded', function() {
    if (contactForm) contactForm.style.display = '';
    if (contactSuccess) contactSuccess.style.display = 'none';
}); 