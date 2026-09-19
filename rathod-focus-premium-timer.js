/* RATHOD HUB • VIP premium polish for main focus timer */
(function(){
'use strict';
if(window.__RH_FOCUS_TIMER_PREMIUM__) return;
window.__RH_FOCUS_TIMER_PREMIUM__ = 1;

function ensureStyle(){
  if(document.getElementById('rh-focus-premium-style')) return;
  const style = document.createElement('style');
  style.id = 'rh-focus-premium-style';
  style.textContent = `
    .rh-focus-vip-shell{position:relative;overflow:hidden;border:1px solid rgba(251,191,36,.18)!important;background:linear-gradient(135deg,rgba(8,10,18,.96),rgba(22,14,10,.92))!important;box-shadow:0 24px 70px rgba(0,0,0,.38),0 0 0 1px rgba(251,191,36,.08)!important}
    .rh-focus-vip-shell:before{content:"";position:absolute;inset:-90px auto auto -70px;width:220px;height:220px;background:radial-gradient(circle,rgba(251,191,36,.18),transparent 68%);pointer-events:none}
    .rh-focus-vip-shell:after{content:"";position:absolute;inset:auto -80px -90px auto;width:240px;height:240px;background:radial-gradient(circle,rgba(239,68,68,.14),transparent 70%);pointer-events:none}
    .rh-focus-vip-badge{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;border:1px solid rgba(251,191,36,.18);background:linear-gradient(90deg,rgba(251,191,36,.16),rgba(255,255,255,.04));font-size:10px;font-weight:900;letter-spacing:.24em;text-transform:uppercase;color:#fde68a;box-shadow:0 0 25px rgba(251,191,36,.08)}
    .rh-focus-vip-title{background:linear-gradient(90deg,#fef3c7,#fbbf24,#fb7185);-webkit-background-clip:text;background-clip:text;color:transparent!important;text-shadow:none!important}
    .rh-focus-timer-panel{position:relative;border:1px solid rgba(251,191,36,.16)!important;background:linear-gradient(180deg,rgba(8,10,24,.92),rgba(4,6,14,.96))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 20px 50px rgba(0,0,0,.28)!important}
    .rh-focus-timer-panel:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at top,rgba(251,191,36,.10),transparent 36%);pointer-events:none}
    .rh-focus-timer-glow{color:#fde68a!important;text-shadow:0 0 24px rgba(251,191,36,.16),0 0 45px rgba(239,68,68,.16)!important}
    .rh-focus-premium-btn{border:1px solid rgba(251,191,36,.16)!important;background:linear-gradient(180deg,rgba(251,191,36,.16),rgba(255,255,255,.04))!important;color:#fef3c7!important;box-shadow:0 10px 24px rgba(0,0,0,.18)}
    .rh-focus-premium-btn:hover{transform:translateY(-1px);box-shadow:0 16px 28px rgba(251,191,36,.10)}
    .rh-focus-start-btn{background:linear-gradient(90deg,#f59e0b,#ef4444)!important;color:#fff7ed!important;border:0!important;box-shadow:0 16px 34px rgba(239,68,68,.18),0 0 0 1px rgba(251,191,36,.14)!important}
    .rh-focus-vip-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.10);font-size:10px;font-weight:800;color:#f8fafc}
    .rh-focus-hide{display:none!important}
    .rh-focus-today-card{border:1px solid rgba(251,191,36,.18)!important;background:linear-gradient(135deg,rgba(251,191,36,.12),rgba(255,255,255,.03))!important;box-shadow:0 18px 40px rgba(0,0,0,.24)}
  `;
  document.head.appendChild(style);
}

function textIncludes(el, str){
  return !!el && String(el.textContent || '').toLowerCase().includes(String(str).toLowerCase());
}

function findFocusRoot(section){
  return Array.from(section.querySelectorAll('div')).find(node => textIncludes(node,'RATHOD HUB FOCUS')) || null;
}

function findTimerCard(section){
  const timer = Array.from(section.querySelectorAll('*')).find(el => /^\d{2}:\d{2}:\d{2}$/.test(String(el.textContent || '').trim()));
  if(!timer) return null;
  return timer.closest('div.rounded-3xl,div.rounded-[32px],div.rounded-[28px]') || timer.parentElement?.parentElement || timer.parentElement || null;
}

function addVipBadge(root){
  if(!root || root.querySelector('.rh-focus-vip-badge')) return;
  const title = Array.from(root.querySelectorAll('h1,h2,h3,h4,b')).find(el => textIncludes(el,'RATHOD HUB FOCUS'));
  if(!title) return;
  title.classList.add('rh-focus-vip-title');
  const badge = document.createElement('div');
  badge.className = 'rh-focus-vip-badge';
  badge.textContent = 'VIP Focus Suite';
  title.parentElement?.insertBefore(badge, title);
}

function styleTimerPanels(section){
  const timer = Array.from(section.querySelectorAll('*')).find(el => /^\d{2}:\d{2}:\d{2}$/.test(String(el.textContent || '').trim()));
  if(timer){
    timer.classList.add('rh-focus-timer-glow');
    const card = findTimerCard(section);
    if(card) card.classList.add('rh-focus-timer-panel');
  }
  Array.from(section.querySelectorAll('button')).forEach(btn => {
    const txt = String(btn.textContent || '').trim().toLowerCase();
    if(/start/.test(txt) || /pomodoro/.test(txt)) btn.classList.add('rh-focus-start-btn');
    else btn.classList.add('rh-focus-premium-btn');
  });
}

function isDuplicateStatCard(el){
  const txt = String(el.innerText || '').trim().toLowerCase().replace(/\s+/g,' ');
  if(!txt) return false;
  if(txt.includes('completed sessions')) return true;
  if(txt.includes('consecutive study days')) return true;
  if(txt === 'streak' || txt.startsWith('streak ')) return txt.includes('consecutive study days');
  if(txt === 'sessions' || txt.startsWith('sessions ')) return txt.includes('completed sessions');
  return false;
}

function hideDuplicateStats(section){
  Array.from(section.querySelectorAll('.rh-focus-hide')).forEach(el => el.classList.remove('rh-focus-hide'));
  const timerCard = findTimerCard(section);
  Array.from(section.querySelectorAll('div')).forEach(card => {
    if(card === timerCard || card.contains(timerCard)) return;
    if(isDuplicateStatCard(card)) card.classList.add('rh-focus-hide');
  });

  const todayCard = Array.from(section.querySelectorAll('div')).find(el => {
    const txt = String(el.innerText || '').toLowerCase();
    return txt.includes('study time') && txt.includes('today');
  });
  if(todayCard) todayCard.classList.add('rh-focus-today-card');
}

function addTopChips(section){
  const root = findFocusRoot(section);
  if(!root || root.querySelector('.rh-focus-vip-chip-row')) return;
  const title = Array.from(root.querySelectorAll('h1,h2,h3,h4,b')).find(el => textIncludes(el,'RATHOD HUB FOCUS'));
  if(!title || !title.parentElement) return;
  const row = document.createElement('div');
  row.className = 'rh-focus-vip-chip-row';
  row.style.display = 'flex';
  row.style.gap = '8px';
  row.style.flexWrap = 'wrap';
  row.style.margin = '12px 0 6px';
  row.innerHTML = '<span class="rh-focus-vip-chip">⚜ Premium</span><span class="rh-focus-vip-chip">👑 VIP Timer</span><span class="rh-focus-vip-chip">✨ Focus Luxury</span>';
  title.parentElement.appendChild(row);
}

function polish(){
  ensureStyle();
  const section = document.getElementById('section-focus');
  if(!section) return;
  const root = findFocusRoot(section);
  if(root) root.classList.add('rh-focus-vip-shell');
  addVipBadge(root);
  addTopChips(section);
  styleTimerPanels(section);
  hideDuplicateStats(section);
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(polish, 1200), { once:true });
else setTimeout(polish, 1200);
setInterval(polish, 1500);
})();
