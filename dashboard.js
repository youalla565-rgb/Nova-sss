/* =========================================================
   Nova Studio — Admin Dashboard Script
   Content editor, member approval, and image uploads —
   all backed by Supabase (database + storage).
   Requires: supabase-config.js loaded before this file.
========================================================= */

const THEME_KEY = 'nova_theme';
const MEDIA_BUCKET = 'media';

const DEFAULT_CONTENT = {
  heroTitle: 'نصمم هويات بصرية لا تُنسى',
  heroSubtitle: 'استوديو إبداعي متخصص في تصميم الهويات البصرية والمواقع الرقمية.',
  aboutTitle: 'من نحن',
  aboutText: 'Nova Studio استوديو تصميم يجمع بين الإبداع والدقة لخدمة علامتك التجارية.',
  servicesIntro: 'كل ما تحتاجه علامتك التجارية في مكان واحد.',
  contactIntro: 'أخبرنا عن فكرتك، وسنعود إليك خلال 24 ساعة.'
};

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
  const links = document.querySelectorAll('.dash-link[data-target]');
  const panels = document.querySelectorAll('.dash-panel');
  links.forEach(link => {
    link.addEventListener('click', () => {
      const target = link.getAttribute('data-target');
      links.forEach(l => l.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      link.classList.add('active');
      document.getElementById(target).classList.add('active');
      document.querySelector('.dash-sidebar').classList.remove('open');
    });
  });
  const sidebarBtn = document.getElementById('sidebar-toggle');
  if(sidebarBtn){
    sidebarBtn.addEventListener('click', () => document.querySelector('.dash-sidebar').classList.toggle('open'));
  }
}

/* ---------- CONTENT EDITOR ---------- */
async function getContentMap(){
  const { data, error } = await sb.from('content').select('key, value');
  if(error){ console.error(error); return {}; }
  const map = {};
  (data || []).forEach(row => { map[row.key] = row.value; });
  return map;
}

async function loadContentForm(){
  const map = await getContentMap();
  document.querySelectorAll('#panel-content [data-field]').forEach(input => {
    const key = input.getAttribute('data-field');
    input.value = map[key] !== undefined ? map[key] : (DEFAULT_CONTENT[key] || '');
  });
}

function initContentForm(){
  const form = document.getElementById('content-form');
  if(!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'جاري الحفظ...';

    try{
      const rows = [];
      form.querySelectorAll('[data-field]').forEach(input => {
        rows.push({ key: input.getAttribute('data-field'), value: input.value });
      });
      const { error } = await sb.from('content').upsert(rows, { onConflict: 'key' });
      if(error) throw error;
      showToast('تم حفظ النصوص بنجاح');
    }catch(err){
      showToast('حصل خطأ أثناء الحفظ');
      console.error(err);
    }finally{
      btn.disabled = false;
      btn.innerText = original;
    }
  });
}

/* ---------- MEMBERS APPROVAL ---------- */
async function fetchMembers(){
  const { data, error } = await sb.from('members').select('*').order('created_at', { ascending: false });
  if(error){ console.error(error); return []; }
  return data || [];
}

async function renderMembers(){
  const list = document.getElementById('members-list');
  if(!list) return;
  const members = await fetchMembers();
  list.innerHTML = '';

  if(members.length === 0){
    list.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-[var(--muted)]">لا يوجد أعضاء حالياً</td></tr>`;
    updateMemberStats(members);
    return;
  }

  members.forEach(m => {
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
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      try{
        const { error } = await sb.from('members').update({ status: action === 'approve' ? 'approved' : 'rejected' }).eq('id', id);
        if(error) throw error;
        showToast(action === 'approve' ? 'تم قبول العضو' : 'تم رفض العضو');
        renderMembers();
      }catch(err){
        showToast('حصل خطأ، حاول تاني');
        console.error(err);
      }
    });
  });

  updateMemberStats(members);
}

function updateMemberStats(members){
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

/* ---------- MEDIA / IMAGE EDITOR (Supabase Storage) ---------- */
async function uploadToBucket(file, key){
  const ext = file.name.split('.').pop();
  const path = `${key}-${Date.now()}.${ext}`;
  const { error: uploadError } = await sb.storage.from(MEDIA_BUCKET).upload(path, file, { upsert: true });
  if(uploadError) throw uploadError;
  const { data } = sb.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl;
  const { error: dbError } = await sb.from('content').upsert([{ key, value: publicUrl }], { onConflict: 'key' });
  if(dbError) throw dbError;
  return publicUrl;
}

async function initMediaUploads(){
  const map = await getContentMap();
  if(map.logo_url){ const p = document.getElementById('preview-logo'); if(p) p.src = map.logo_url; }
  if(map.heroBg_url){ const p = document.getElementById('preview-hero'); if(p) p.src = map.heroBg_url; }

  const setupUploader = (inputId, previewId, key) => {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if(!input) return;
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if(!file) return;
      try{
        const url = await uploadToBucket(file, key);
        if(preview) preview.src = url;
        showToast('تم تحديث الصورة بنجاح');
      }catch(err){
        showToast('فشل رفع الصورة');
        console.error(err);
      }
    });
  };

  setupUploader('upload-logo', 'preview-logo', 'logo_url');
  setupUploader('upload-hero', 'preview-hero', 'heroBg_url');
}

/* ---------- THEME ---------- */
function applyTheme(theme){ document.documentElement.setAttribute('data-theme', theme); }
function initTheme(){ applyTheme(localStorage.getItem(THEME_KEY) || 'dark'); }
function initThemeToggle(){
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  });
}

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initThemeToggle();
  initSidebarNav();
  loadContentForm();
  initContentForm();
  renderMembers();
  initMediaUploads();
  if(window.lucide) lucide.createIcons();
});
