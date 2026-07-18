/* =========================================================
   Nova Studio — Shared Front-End Script
   Theme toggle, mobile nav, dynamic content from the
   admin dashboard (localStorage), FAQ accordion, contact form.
========================================================= */

const STORAGE = {
  theme:   'nova_theme',
  content: 'nova_content',
  media:   'nova_media',
  members: 'nova_members'
};

/* ---------- THEME ---------- */
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
}
function initTheme(){
  const saved = localStorage.getItem(STORAGE.theme) || 'dark';
  applyTheme(saved);
}
function toggleTheme(){
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem(STORAGE.theme, next);
}
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const toggleBtns = document.querySelectorAll('.theme-toggle');
  toggleBtns.forEach(btn => btn.addEventListener('click', toggleTheme));
});

/* ---------- DYNAMIC CONTENT FROM DASHBOARD ---------- */
function applyDynamicContent(){
  try{
    const content = JSON.parse(localStorage.getItem(STORAGE.content) || '{}');
    document.querySelectorAll('[data-key]').forEach(el => {
      const key = el.getAttribute('data-key');
      if(content[key]) el.innerText = content[key];
    });

    const media = JSON.parse(localStorage.getItem(STORAGE.media) || '{}');
    if(media.logo){
      document.querySelectorAll('[data-media="logo"]').forEach(el => el.setAttribute('src', media.logo));
    }
    if(media.heroBg){
      document.querySelectorAll('[data-media="heroBg"]').forEach(el => {
        el.style.backgroundImage = `url(${media.heroBg})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
      });
    }
  }catch(e){ console.warn('content sync failed', e); }
}
document.addEventListener('DOMContentLoaded', applyDynamicContent);

/* ---------- MOBILE MENU ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const iconMenu = document.getElementById('icon-menu');
  const iconClose = document.getElementById('icon-close');
  if(!menuBtn) return;

  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    iconMenu.classList.toggle('hidden');
    iconClose.classList.toggle('hidden');
  });
  document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      iconMenu.classList.remove('hidden');
      iconClose.classList.add('hidden');
    });
  });
});

/* ---------- FAQ ACCORDION ---------- */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.faq-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
});

/* ---------- CONTACT FORM ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('lead-form');
  const toast = document.getElementById('toast');
  if(!form) return;
  let toastTimer;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // save as a "pending member" lead for the admin dashboard
    try{
      const members = JSON.parse(localStorage.getItem(STORAGE.members) || '[]');
      const name = form.querySelector('[name="name"]').value;
      const email = form.querySelector('[name="email"]').value;
      members.push({ id: Date.now(), name, email, status: 'pending' });
      localStorage.setItem(STORAGE.members, JSON.stringify(members));
    }catch(e){ console.warn(e); }

    if(toast){
      toast.classList.remove('translate-y-24','opacity-0');
      toast.classList.add('translate-y-0','opacity-100');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.add('translate-y-24','opacity-0');
        toast.classList.remove('translate-y-0','opacity-100');
      }, 3800);
    }
    form.reset();
  });
});

/* init icons if lucide present */
document.addEventListener('DOMContentLoaded', () => {
  if(window.lucide) lucide.createIcons();
});
