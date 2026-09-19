/* RATHOD HUB • VIP premium polish for main focus timer */
(function(){
'use strict';
if(window.__RH_FOCUS_TIMER_PREMIUM__) return;
window.__RH_FOCUS_TIMER_PREMIUM__ = 1;

const db = () => { try { return window.db || null; } catch (e) { return null; } };
const uid = () => { try { return String(window.user?.id || ''); } catch (e) { return ''; } };
let miniData = { rank: '—', focus3day: '0h 0m', next: 'VIP progress' };
let loadingMini = false;

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
    .rh-ypt-mini-row{display:grid;grid-template-columns:repeat(1,minmax(0,1fr));gap:16px;margin-top:18px}
    @media (min-width: 900px){.rh-ypt-mini-row{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .rh-ypt-mini-card{position:relative;overflow:hidden;border:1px solid rgba(251,191,36,.14);border-radius:24px;padding:18px;background:linear-gradient(135deg,rgba(15,23,42,.88),rgba(28,25,23,.92));box-shadow:0 18px 42px rgba(0,0,0,.24)}
    .rh-ypt-mini-card:before{content:"";position:absolute;inset:auto auto -30px -30px;width:120px;height:120px;background:radial-gradient(circle,rgba(251,191,36,.10),transparent 70%);pointer-events:none}
    .rh-ypt-mini-card .label{font-size:10px;font-weight:900;letter-spacing:.24em;text-transform:uppercase;color:#fcd34d}
    .rh-ypt-mini-card .value{display:block;margin-top:8px;font-size:34px;line-height:1;font-weight:900;color:#fff7ed}
    .rh-ypt-mini-card .meta{display:block;margin-top:8px;font-size:11px;color:#cbd5e1}
    .rh-ypt-mini-card.rank .value{color:#93c5fd}
    .rh-ypt-mini-card.focus .value{color:#fca5a5}
  `;
  document.head.appendChild(style);
}

function textIncludes(el, str){
  return !!el && String(el.textContent || '').toLowerCase().includes(String(str).toLowerCase());
}

function fmtShort(sec){
  sec = Math.max(0, Number(sec) || 0);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

function findFocusRoot(section){
  return Array.from(section.querySelectorAll('div')).find(node => textIncludes(node,'RATHOD HUB FOCUS')) || null;
}

function findTimerCard(section){
  const timer = Array.from(section.querySelectorAll('*')).find(el => /^\d{2}:\d{2}:\d{2}$/.test(String(el.textContent || '').trim()));
  if(!timer) return null;
  return timer.closest('div.rounded-3xl,div.rounded-[32px],div.rounded-[28px]') || timer.parentElement?.parentElement || timer.parentElement || null;
}

function findTodayCard(section){
  return Array.from(section.querySelectorAll('div')).find(el => {
    const txt = String(el.innerText || '').toLowerCase();
    return txt.includes('today') && txt.includes('study time');
  }) || null;
}

function findStreakCard(section){
  return Array.from(section.querySelectorAll('div')).find(el => String(el.innerText || '').toLowerCase().includes('consecutive study days')) || null;
}

function findSessionsCard(section){
  return Array.from(section.querySelectorAll('div')).find(el => String(el.innerText || '').toLowerCase().includes('completed sessions')) || null;
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
  row.innerHTML = '<span class="rh-focus-vip-chip">⚜ Premium</span><span class="rh-focus-vip-chip">👑 VIP Timer</span><span class="rh-focus-vip-chip">✨ YPT Mode</span>';
  title.parentElement.appendChild(row);
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

function renderYptMiniCards(section){
  const streakCard = findStreakCard(section);
  const sessionsCard = findSessionsCard(section);
  if(streakCard) streakCard.classList.add('rh-focus-hide');
  if(sessionsCard) sessionsCard.classList.add('rh-focus-hide');
  const todayCard = findTodayCard(section);
  if(todayCard) todayCard.classList.add('rh-focus-today-card');
  const anchor = todayCard?.parentElement || streakCard?.parentElement || sessionsCard?.parentElement;
  if(!anchor) return;
  let row = document.getElementById('rh-ypt-mini-row');
  if(!row){
    row = document.createElement('div');
    row.id = 'rh-ypt-mini-row';
    row.className = 'rh-ypt-mini-row';
    anchor.insertAdjacentElement('afterend', row);
  }
  row.innerHTML = `
    <div class="rh-ypt-mini-card rank">
      <span class="label">Your Rank</span>
      <b class="value">${miniData.rank}</b>
      <span class="meta">YPT leaderboard style live rank</span>
    </div>
    <div class="rh-ypt-mini-card focus">
      <span class="label">3-Day Focus</span>
      <b class="value">${miniData.focus3day}</b>
      <span class="meta">${miniData.next}</span>
    </div>
  `;
}

async function loadMiniData(){
  if(loadingMini) return;
  const client = db();
  if(!client || !uid()) return;
  loadingMini = true;
  try{
    const [boardRes, statusRes] = await Promise.all([
      client.rpc('get_ypt_focus_leaderboard',{ p_limit: 100 }),
      client.rpc('get_focus_avatar_status')
    ]);
    const rows = Array.isArray(boardRes?.data) ? boardRes.data : [];
    const mine = rows.find(x => String(x.user_id) === uid());
    const status = Array.isArray(statusRes?.data) ? statusRes.data[0] : (statusRes?.data || {});
    const totalSeconds = Number(status.total_seconds || 0);
    const avatars = Array.isArray(status.avatars) ? status.avatars : [];
    const next = avatars.find(x => !x.unlocked);
    miniData = {
      rank: mine ? `#${mine.rank}` : '—',
      focus3day: fmtShort(totalSeconds),
      next: next ? `Next VIP unlock • ${Number(next.target_hours || 0)}h target` : 'All VIP avatars unlocked'
    };
  }catch(e){
    console.warn('Mini YPT card load skipped', e);
  }finally{
    loadingMini = false;
    const section = document.getElementById('section-focus');
    if(section) renderYptMiniCards(section);
  }
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
  renderYptMiniCards(section);
  loadMiniData();
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(polish, 1200), { once:true });
else setTimeout(polish, 1200);
setInterval(polish, 1800);
})();
