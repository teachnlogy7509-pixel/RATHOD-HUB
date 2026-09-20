/* Fast open fix for Admin Panel */
(function(){
'use strict';
if(window.__RH_ADMINPANEL_CLICK_FIX__) return;
window.__RH_ADMINPANEL_CLICK_FIX__ = 1;

function isAdminTrigger(target){
  const el = target && target.closest ? target.closest('button,a') : null;
  if(!el) return false;
  const id = el.id || '';
  const onclick = el.getAttribute('onclick') || '';
  const text = (el.textContent || '').toLowerCase();
  return id === 'btn-adminpanel'
    || onclick.includes("switchTab('adminpanel')")
    || text.includes('control room')
    || text.includes('admin panel');
}

function openAdminPanelNow(){
  try{
    if(typeof window.switchTab === 'function') {
      window.switchTab('adminpanel');
    }
  }catch(_e){}

  document.querySelectorAll('main section[id^="section-"]').forEach(section => {
    section.classList.add('hidden');
  });

  const adminSection = document.getElementById('section-adminpanel');
  if(adminSection) adminSection.classList.remove('hidden');

  document.querySelectorAll('.rh-nav-btn').forEach(btn => {
    btn.classList.remove('rh-active','active');
  });
  document.getElementById('btn-adminpanel')?.classList.add('rh-active');

  const drawer = document.getElementById('mobile-menu-drawer');
  if(drawer) drawer.classList.remove('rh-open');

  try{ window.scrollTo({ top:0, left:0, behavior:'smooth' }); }catch(_e){}
}

function bind(){
  if(document.documentElement.dataset.rhAdminFastBound === '1') return;
  document.documentElement.dataset.rhAdminFastBound = '1';
  let lastOpen = 0;
  const handler = (e) => {
    if(!isAdminTrigger(e.target)) return;
    const now = Date.now();
    if(now - lastOpen < 250) return;
    lastOpen = now;
    e.preventDefault();
    e.stopPropagation();
    if(typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    openAdminPanelNow();
  };
  document.addEventListener('click', handler, true);
  document.addEventListener('pointerup', handler, true);
  document.addEventListener('touchend', handler, true);
}

if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bind, { once:true });
} else {
  bind();
}
setInterval(bind, 2000);
})();
