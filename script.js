gsap.registerPlugin(ScrollTrigger);

// GSAP Parallax
gsap.utils.toArray('.parallax-bg').forEach(bg => {
  gsap.to(bg, {
    yPercent: 30,
    ease: "none",
    scrollTrigger: {
      trigger: bg.parentNode,
      scrub: true,
    },
  });
});

// GSAP Fade-In
gsap.utils.toArray('section').forEach(section => {
  gsap.from(section, {
    y: 50,
    opacity: 0,
    duration: 1,
    scrollTrigger: {
      trigger: section,
      start: "top 80%",
      toggleActions: "play none none reverse",
    },
  });
});

// Sidebar Interactivity
function updateSidebar() {
    const sidebarLines = document.querySelectorAll('.sidebar-line');
    const sections = document.querySelectorAll('section');
    let current = '';

    sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            current = section.id;
        }
    });

    sidebarLines.forEach((line) => {
        line.classList.toggle('active', line.dataset.section === current);
    });
}

window.addEventListener('scroll', updateSidebar);
window.addEventListener('load', updateSidebar);

// Hamburger
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('flex');
    navLinks.classList.toggle('hidden');
});