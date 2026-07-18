/* =========================================================
   Nova Studio — Admin Dashboard Script
   Content editor, member approval, media/image upload.
   All data is persisted in the browser via localStorage —
   this is a front-end-only demo dashboard (no server).
========================================================= */

const STORAGE = {
  theme:   'nova_theme',
  content: 'nova_content',
  media:   'nova_media',
  members: 'nova_members'
};

const DEFAULT_CONTENT = {
  heroTitle: 'نصمم هويات بصرية لا تُنسى',
  heroSubtitle: 'استوديو إبداعي متخصص في تصميم الهويات البصرية والمواقع الرقمية.',
  aboutTitle: 'من نحن',
  aboutText: 'Nova Studio استوديو تصميم يجمع بين الإبداع والدقة لخدمة علامتك التجارية.',
  servicesIntro: 'كل ما تحتاجه علامتك التجارية في مكان واحد.',
  contactIntro: 'أخبرنا عن فكرتك، وسنعود إليك خلال 24 ساعة.'
};

const DEFAULT_MEMBERS = [
  { id: 1, name: 'سارة العتيبي', email: 'sara@example.com', status: 'approved' },
  { id: 2, name: 'أحمد فتحي', email: 'ahmed@example.com', status: 'pending' },
  { id: 3, name: 'منى خليل', email: 'mona@example.com', status: 'pending' }
];

function seedIfEmpty(){
  if(!localStorage.getItem(STORAGE.content)){
    localStorage.setItem(STORAGE.content, JSON.stringify(DEFAULT_CONTENT));
  }
  if(!localStorage.getItem(STORAGE.members)){
    localStorage.setItem(STORAGE.members, JSON.stringify(DEFAULT_MEMBERS));
  }
  if(!localStorage.getItem(STORAGE.media)){
    localStorage.setItem(STORAGE.media, JSON.stringify({ logo: '', heroBg: '' }));
  }
}

function showToast(msg){
  const toast = document.getElementById('dash-toast');
  if(!toast) return;
  toast.querySelector('span').innerText = msg;
  toast.classList.remove('translate-y-24','opacity-0');
  toast.classList.add('translate-y-0','opacity-100');
  clearTimeout(window.__dashToastTimer);
  window.__dashToastTimer = setTimeout(() => {
    toast.classList.add('translate-y-24','opacity-0');
    toast.classList.remove('translate-y-0','opacity-100');
  }, 2600);
}

/* ---------- SIDEBAR NAVIGATION ---------- */
function initSidebarNav(){
  const links = document.querySelectorAll('.dash-link');
  const panels = document.querySelectorAll('.dash-panel');
  links.forEach(link => {
    link.addEventListener('click', () => {
      const target = link.getAttribute('data-target');
      links.forEach(l => l.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      link.classList.add('active');
      document.getElementById(target).classList.add('active');

      // close sidebar on mobile after selecting
      document.querySelector('.dash-sidebar').classList.remove('open');
    });
  });

  const sidebarBtn = document.getElementById('sidebar-toggle');
  if(sidebarBtn){
    sidebarBtn.addEventListener('click', () => {
      document.querySelector('.dash-sidebar').classList.toggle('open');
    });
  }
}

/* ---------- CONTENT EDITOR ---------- */
function loadContentForm(){
  const content = JSON.parse(localStorage.getItem(STORAGE.content) || '{}');
  document.querySelectorAll('#panel-content [data-field]').forEach(input => {
    const key = input.getAttribute('data-field');
    if(content[key] !== undefined) input.value = content[key];
  });
}

function initContentForm(){
  const form = document.getElementById('content-form');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = JSON.parse(localStorage.getItem(STORAGE.content) || '{}');
    form.querySelectorAll('[data-field]').forEach(input => {
      content[input.getAttribute('data-field')] = input.value;
    });
    localStorage.setItem(STORAGE.content, JSON.stringify(content));
    showToast('تم حفظ النصوص بنجاح');
  });
}

/* ---------- MEMBERS APPROVAL ---------- */
function renderMembers(){
  const list = document.getElementById('members-list');
  if(!list) return;
  const members = JSON.parse(localStorage.getItem(STORAGE.members) || '[]');
  list.innerHTML = '';

  if(members.length === 0){
    list.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-[var(--muted)]">لا يوجد أعضاء حالياً</td></tr>`;
    return;
  }

  members.slice().reverse().forEach(m => {
    const statusClass = m.status === 'approved' ? 'status-approved' : m.status === 'rejected' ? 'status-rejected' : 'status-pending';
    const statusLabel = m.status === 'approved' ? 'مقبول' : m.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة';
    const row = document.createElement('tr');
    row.className = 'border-b border-[var(--border)]';
    row.innerHTML = `
      <td class="py-3 px-3 font-medium">${m.name}</td>
      <td class="py-3 px-3 text-[var(--muted)] font-en text-sm">${m.email}</td>
      <td class="py-3 px-3"><span class="status-pill ${statusClass}">${statusLabel}</span></td>
      <td class="py-3 px-3 flex gap-2 justify-end">
        <button data-action="approve" data-id="${m.id}" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition">قبول</button>
        <button data-action="reject" data-id="${m.id}" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">رفض</button>
      </td>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-id'));
      const action = btn.getAttribute('data-action');
      const members = JSON.parse(localStorage.getItem(STORAGE.members) || '[]');
      const target = members.find(m => m.id === id);
      if(target){
        target.status = action === 'approve' ? 'approved' : 'rejected';
        localStorage.setItem(STORAGE.members, JSON.stringify(members));
        showToast(action === 'approve' ? 'تم قبول العضو' : 'تم رفض العضو');
        renderMembers();
        updateMemberStats();
      }
    });
  });
}

function updateMemberStats(){
  const members = JSON.parse(localStorage.getItem(STORAGE.members) || '[]');
  const total = members.length;
  const pending = members.filter(m => m.status === 'pending').length;
  const approved = members.filter(m => m.status === 'approved').length;
  const elTotal = document.getElementById('stat-total');
  const elPending = document.getElementById('stat-pending');
  const elApproved = document.getElementById('stat-approved');
  if(elTotal) elTotal.innerText = total;
  if(elPending) elPending.innerText = pending;
  if(elApproved) elApproved.innerText = approved;
}

/* ---------- MEDIA / IMAGE EDITOR ---------- */
function initMediaUploads(){
  const media = JSON.parse(localStorage.getItem(STORAGE.media) || '{}');

  const setupUploader = (inputId, previewId, key) => {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if(!input) return;

    if(media[key] && preview) preview.src = media[key];

    input.addEventListener('change', () => {
      const file = input.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const current = JSON.parse(localStorage.getItem(STORAGE.media) || '{}');
        current[key] = reader.result;
        localStorage.setItem(STORAGE.media, JSON.stringify(current));
        if(preview) preview.src = reader.result;
        showToast('تم تحديث الصورة بنجاح');
      };
      reader.readAsDataURL(file);
    });
  };

  setupUploader('upload-logo', 'preview-logo', 'logo');
  setupUploader('upload-hero', 'preview-hero', 'heroBg');
}

/* ---------- THEME (dashboard has its own toggle too) ---------- */
function applyTheme(theme){ document.documentElement.setAttribute('data-theme', theme); }
function initTheme(){
  const saved = localStorage.getItem(STORAGE.theme) || 'dark';
  applyTheme(saved);
}
function initThemeToggle(){
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      localStorage.setItem(STORAGE.theme, next);
    });
  });
}

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  seedIfEmpty();
  initTheme();
  initThemeToggle();
  initSidebarNav();
  loadContentForm();
  initContentForm();
  renderMembers();
  updateMemberStats();
  initMediaUploads();
  if(window.lucide) lucide.createIcons();
});
