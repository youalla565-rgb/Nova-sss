/* =========================================================
   Nova Studio — Shared Front-End Script
   Theme toggle (local, per-visitor), mobile nav, FAQ accordion,
   dynamic content + contact form now backed by Supabase.
   Requires: supabase-config.js loaded before this file.
========================================================= */

const THEME_KEY = 'nova_theme';

/* ---------- THEME (kept local — it's a per-device UI preference) ---------- */
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
}
function initTheme(){
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
}
function toggleTheme(){
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
}
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  document.querySelectorAll('.theme-toggle').forEach(btn => btn.addEventListener('click', toggleTheme));
});

/* ---------- DYNAMIC CONTENT FROM SUPABASE ---------- */
async function applyDynamicContent(){
  try{
    const { data, error } = await sb.from('content').select('key, value');
    if(error) throw error;

    const map = {};
    (data || []).forEach(row => { map[row.key] = row.value; });

    document.querySelectorAll('[data-key]').forEach(el => {
      const key = el.getAttribute('data-key');
      if(map[key]) el.innerText = map[key];
    });

    // logo image (falls back to the inline SVG mark if not set)
    if(map.logo_url){
      document.querySelectorAll('[data-media="logo_url"]').forEach(img => {
        img.src = map.logo_url;
        img.classList.remove('hidden');
        const svg = img.parentElement.querySelector('.spark');
        if(svg) svg.classList.add('hidden');
      });
    }

    // hero background image
    if(map.heroBg_url){
      document.querySelectorAll('[data-media="heroBg_url"]').forEach(el => {
        el.style.backgroundImage = `url(${map.heroBg_url})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
      });
    }
  }catch(e){ console.warn('تعذر تحميل المحتوى من قاعدة البيانات', e); }
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

/* ---------- CONTACT FORM → members table ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('lead-form');
  const toast = document.getElementById('toast');
  if(!form) return;
  let toastTimer;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn.innerText;
    submitBtn.disabled = true;
    submitBtn.innerText = 'جاري الإرسال...';

    const name = form.querySelector('[name="name"]').value;
    const email = form.querySelector('[name="email"]').value;
    const message = form.querySelector('[name="message"]')?.value || '';

    try{
      const { error } = await sb.from('members').insert([{ name, email, status: 'pending' }]);
      if(error) throw error;

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
    }catch(err){
      alert('في مشكلة حصلت أثناء الإرسال، حاول تاني.');
      console.error(err);
    }finally{
      submitBtn.disabled = false;
      submitBtn.innerText = originalLabel;
    }
  });
});

/* init icons if lucide present */
document.addEventListener('DOMContentLoaded', () => {
  if(window.lucide) lucide.createIcons();
});
