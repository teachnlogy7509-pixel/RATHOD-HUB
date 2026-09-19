/* RATHOD HUB • Yeolpumta-style full focus layout */
(function(){
'use strict';
if(window.__RH_FOCUS_TIMER_PREMIUM__) return;
window.__RH_FOCUS_TIMER_PREMIUM__ = 1;

const db = () => { try { return window.db || null; } catch (e) { return null; } };
const uid = () => { try { return String(window.user?.id || ''); } catch (e) { return ''; } };
const SUBJECT_TODOS = {
  Biology: ['Revise diagrams for 20 min','Solve 15 MCQs','Make one quick note summary'],
  Physics: ['Numericals practice 30 min','Formula revision','Wrong questions recheck'],
  Chemistry: ['NCERT reading 25 min','Reaction list revise','20 PYQ questions'],
  Math: ['Solve 10 calculus problems','Revision of weak topic','Speed test 20 min'],
  English: ['Read one passage','Vocabulary revision','Writing practice 15 min'],
  History: ['Read one chapter','Important dates revise','Short answer notes'],
  Science: ['Topic recap 20 min','Concept mapping','Practice worksheet']
};

let state = {
  rank: '—',
  focus3day: '0h 0m',
  nextText: 'VIP progress',
  members: [],
  loading: false
};

function ensureStyle(){
  if(document.getElementById('rh-focus-ypt-style')) return;
  const style = document.createElement('style');
  style.id = 'rh-focus-ypt-style';
  style.textContent = `
    .rh-ypt-shell{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.08)!important;background:linear-gradient(180deg,#181818,#101010)!important;box-shadow:0 24px 80px rgba(0,0,0,.38)!important}
    .rh-ypt-shell:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.03),transparent 18%)}
    .rh-ypt-vip-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);font-size:10px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#f8fafc}
    .rh-ypt-topbar{margin-top:16px;border-radius:28px;padding:18px 18px 16px;background:linear-gradient(180deg,#fb7c30,#ef6b1d);color:#fff;box-shadow:0 22px 48px rgba(239,107,29,.25)}
    .rh-ypt-topbar-head{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;font-weight:700;opacity:.95}
    .rh-ypt-topbar-subject{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:800}
    .rh-ypt-topbar-timer{margin-top:18px;font-size:52px;line-height:1;font-weight:900;letter-spacing:.04em}
    .rh-ypt-tabs{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.18)}
    .rh-ypt-tab{font-size:14px;color:rgba(255,255,255,.78);padding-bottom:8px;border-bottom:2px solid transparent}
    .rh-ypt-tab.active{color:#fff;border-color:#fff;font-weight:800}
    .rh-ypt-main-grid{display:grid;grid-template-columns:1.35fr .9fr;gap:18px;margin-top:18px}
    .rh-ypt-panel{border:1px solid rgba(255,255,255,.08)!important;border-radius:26px!important;background:#101010!important;box-shadow:0 18px 44px rgba(0,0,0,.24)!important}
    .rh-ypt-panel-accent{border-color:rgba(251,124,48,.34)!important;box-shadow:0 18px 44px rgba(251,124,48,.10)!important}
    .rh-ypt-timer-panel{background:linear-gradient(180deg,#090909,#111827)!important}
    .rh-ypt-glow{color:#fff4ed!important;text-shadow:0 0 24px rgba(251,124,48,.12)!important}
    .rh-ypt-start{background:linear-gradient(90deg,#ff9f2a,#ff6e1d)!important;color:#fff!important;border:0!important;box-shadow:0 14px 30px rgba(255,110,29,.22)!important}
    .rh-ypt-soft{background:#1b1b1d!important;border:1px solid rgba(255,255,255,.10)!important;color:#f8fafc!important}
    .rh-ypt-small-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:18px}
    .rh-ypt-mini{position:relative;overflow:hidden;border-radius:24px;padding:18px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,#151515,#101010)}
    .rh-ypt-mini:before{content:"";position:absolute;inset:auto -10px -24px auto;width:120px;height:120px;background:radial-gradient(circle,rgba(251,124,48,.12),transparent 68%);pointer-events:none}
    .rh-ypt-mini-label{font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#9ca3af}
    .rh-ypt-mini-value{display:block;margin-top:10px;font-size:34px;line-height:1;font-weight:900;color:#fff}
    .rh-ypt-mini-meta{display:block;margin-top:8px;font-size:12px;color:#cbd5e1}
    .rh-ypt-feature-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;margin-top:18px}
    .rh-ypt-card-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
    .rh-ypt-card-title b{font-size:26px;color:#fff}
    .rh-ypt-card-title span{font-size:12px;color:#9ca3af}
    .rh-ypt-todo-list{display:grid;gap:10px}
    .rh-ypt-todo{display:flex;align-items:center;gap:12px;padding:14px 12px;border-radius:18px;background:#171717;border:1px solid rgba(255,255,255,.08)}
    .rh-ypt-dot{width:22px;height:22px;border-radius:999px;background:#fb7c30;display:grid;place-items:center;color:#fff;font-weight:900;flex:0 0 22px}
    .rh-ypt-todo small{display:block;margin-top:4px;color:#9ca3af;font-size:12px}
    .rh-ypt-group-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
    .rh-ypt-member{padding:12px 8px;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:#151515;text-align:center;transition:.2s ease}
    .rh-ypt-member.top{border-color:rgba(251,124,48,.38);box-shadow:0 0 0 1px rgba(251,124,48,.12) inset}
    .rh-ypt-avatar{width:58px;height:58px;border-radius:20px;margin:0 auto 10px;background:linear-gradient(135deg,#fb7c30,#fbbf24);display:grid;place-items:center;font-weight:900;color:#111827;font-size:20px;box-shadow:0 12px 24px rgba(251,124,48,.22)}
    .rh-ypt-member b{display:block;font-size:14px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .rh-ypt-member span{display:block;margin-top:4px;font-size:12px;color:#fb923c}
    .rh-ypt-focus-card-hide{display:none!important}
    @media (max-width: 1024px){
      .rh-ypt-main-grid,.rh-ypt-feature-grid{grid-template-columns:1fr}
      .rh-ypt-small-grid{grid-template-columns:1fr}
      .rh-ypt-group-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      .rh-ypt-topbar-timer{font-size:38px}
    }
  `;
  document.head.appendChild(style);
}

function textOf(el){ return String(el?.textContent || '').trim(); }
function fmtShort(sec){ sec=Math.max(0,Number(sec)||0); const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60); return h?`${h}h ${m}m`:`${m}m`; }
function todayLabel(){ try { return new Date().toLocaleDateString(undefined,{ weekday:'short', month:'numeric', day:'numeric' }); } catch(e){ return 'Today'; } }
function currentTimerText(section){ return textOf(Array.from(section.querySelectorAll('*')).find(el => /^\d{2}:\d{2}:\d{2}$/.test(textOf(el)))) || '00:00:00'; }
function selectedSubject(section){ const s=section.querySelector('select'); return s?.value || s?.options?.[s.selectedIndex]?.text || 'Focus'; }
function findRoot(section){ return Array.from(section.querySelectorAll('div')).find(el => String(el.innerText || '').includes('RATHOD HUB FOCUS')) || null; }
function findTimerPanel(section){ const timer=Array.from(section.querySelectorAll('*')).find(el => /^\d{2}:\d{2}:\d{2}$/.test(textOf(el))); return timer?.closest('div.rounded-3xl,div.rounded-[32px],div.rounded-[28px]') || timer?.parentElement?.parentElement || null; }
function findControlPanel(section){ return section.querySelector('select')?.closest('div.rounded-3xl,div.rounded-[32px],div.rounded-[28px]') || section.querySelector('select')?.parentElement?.parentElement || null; }
function findStatCards(section){
  const nodes = Array.from(section.querySelectorAll('div'));
  return {
    today: nodes.find(el => String(el.innerText || '').toLowerCase().includes('today') && String(el.innerText || '').toLowerCase().includes('study time')) || null,
    streak: nodes.find(el => String(el.innerText || '').toLowerCase().includes('consecutive study days')) || null,
    sessions: nodes.find(el => String(el.innerText || '').toLowerCase().includes('completed sessions')) || null
  };
}

function ensureHeader(section, root){
  let header = document.getElementById('rh-ypt-topbar');
  if(!header){
    header = document.createElement('div');
    header.id = 'rh-ypt-topbar';
    header.className = 'rh-ypt-topbar';
    header.innerHTML = `
      <div class="rh-ypt-topbar-head">
        <div class="rh-ypt-topbar-subject"><span>☰</span><span id="rh-ypt-subject-name">Focus</span></div>
        <div>YPT Mode</div>
      </div>
      <div id="rh-ypt-top-timer" class="rh-ypt-topbar-timer">00:00:00</div>
      <div class="rh-ypt-tabs">
        <div class="rh-ypt-tab active">Timer</div>
        <div class="rh-ypt-tab">Books</div>
        <div class="rh-ypt-tab">Insights</div>
        <div class="rh-ypt-tab">Planner</div>
      </div>`;
    const anchor = root?.querySelector('.rh-focus-vip-chip-row') || root?.lastElementChild || root;
    if(anchor) anchor.insertAdjacentElement('afterend', header); else root?.appendChild(header);
  }
  const badgeHost = root && !root.querySelector('.rh-ypt-vip-badge') ? root : null;
  if(badgeHost){
    const badge = document.createElement('div');
    badge.className = 'rh-ypt-vip-badge';
    badge.textContent = 'Yeolpumta Style';
    badgeHost.insertBefore(badge, badgeHost.firstChild);
  }
  const subjectEl = document.getElementById('rh-ypt-subject-name');
  const timerEl = document.getElementById('rh-ypt-top-timer');
  if(subjectEl) subjectEl.textContent = `${selectedSubject(section)} • ${todayLabel()}`;
  if(timerEl) timerEl.textContent = currentTimerText(section);
}

function buildLayout(section){
  const timerPanel = findTimerPanel(section);
  const controlPanel = findControlPanel(section);
  const stats = findStatCards(section);
  if(!timerPanel || !controlPanel || !stats.today) return;

  let mainGrid = document.getElementById('rh-ypt-main-grid');
  if(!mainGrid){
    mainGrid = document.createElement('div');
    mainGrid.id = 'rh-ypt-main-grid';
    mainGrid.className = 'rh-ypt-main-grid';
    timerPanel.parentElement?.insertAdjacentElement('beforebegin', mainGrid);
  }
  const leftSlot = mainGrid.querySelector('.left') || document.createElement('div');
  const rightSlot = mainGrid.querySelector('.right') || document.createElement('div');
  leftSlot.className = 'left';
  rightSlot.className = 'right';
  if(!leftSlot.parentElement) mainGrid.appendChild(leftSlot);
  if(!rightSlot.parentElement) mainGrid.appendChild(rightSlot);
  if(timerPanel.parentElement !== leftSlot) leftSlot.appendChild(timerPanel);
  if(controlPanel.parentElement !== rightSlot) rightSlot.appendChild(controlPanel);
  timerPanel.classList.add('rh-ypt-panel','rh-ypt-panel-accent','rh-ypt-timer-panel');
  controlPanel.classList.add('rh-ypt-panel');

  const timerDisplay = Array.from(timerPanel.querySelectorAll('*')).find(el => /^\d{2}:\d{2}:\d{2}$/.test(textOf(el)));
  if(timerDisplay) timerDisplay.classList.add('rh-ypt-glow');
  Array.from(section.querySelectorAll('button')).forEach(btn => {
    const t = textOf(btn).toLowerCase();
    if(/start/.test(t) || /pomodoro/.test(t)) btn.classList.add('rh-ypt-start');
    else btn.classList.add('rh-ypt-soft');
  });

  let statRow = document.getElementById('rh-ypt-small-grid');
  if(!statRow){
    statRow = document.createElement('div');
    statRow.id = 'rh-ypt-small-grid';
    statRow.className = 'rh-ypt-small-grid';
    mainGrid.insertAdjacentElement('afterend', statRow);
  }
  const rankCard = document.getElementById('rh-ypt-rank-card') || document.createElement('div');
  const focusCard = document.getElementById('rh-ypt-focus3-card') || document.createElement('div');
  rankCard.id = 'rh-ypt-rank-card';
  focusCard.id = 'rh-ypt-focus3-card';
  rankCard.className = 'rh-ypt-mini';
  focusCard.className = 'rh-ypt-mini';
  stats.today.classList.add('rh-ypt-mini');
  if(stats.today.parentElement !== statRow) statRow.appendChild(stats.today);
  if(rankCard.parentElement !== statRow) statRow.appendChild(rankCard);
  if(focusCard.parentElement !== statRow) statRow.appendChild(focusCard);
  if(stats.streak) stats.streak.classList.add('rh-ypt-focus-card-hide');
  if(stats.sessions) stats.sessions.classList.add('rh-ypt-focus-card-hide');

  stats.today.innerHTML = `<span class="rh-ypt-mini-label">Daily Goal</span><b class="rh-ypt-mini-value">${textOf(stats.today.querySelector('b')) || '0h 0m'}</b><span class="rh-ypt-mini-meta">Today's study time</span>`;
  rankCard.innerHTML = `<span class="rh-ypt-mini-label">Your Rank</span><b class="rh-ypt-mini-value">${state.rank}</b><span class="rh-ypt-mini-meta">Live focus leaderboard</span>`;
  focusCard.innerHTML = `<span class="rh-ypt-mini-label">3-Day Focus</span><b class="rh-ypt-mini-value">${state.focus3day}</b><span class="rh-ypt-mini-meta">${state.nextText}</span>`;

  let featureGrid = document.getElementById('rh-ypt-feature-grid');
  if(!featureGrid){
    featureGrid = document.createElement('div');
    featureGrid.id = 'rh-ypt-feature-grid';
    featureGrid.className = 'rh-ypt-feature-grid';
    statRow.insertAdjacentElement('afterend', featureGrid);
  }
  let planner = document.getElementById('rh-ypt-planner-card');
  let group = document.getElementById('rh-ypt-group-card');
  if(!planner){
    planner = document.createElement('div');
    planner.id = 'rh-ypt-planner-card';
    planner.className = 'rh-ypt-panel';
    featureGrid.appendChild(planner);
  }
  if(!group){
    group = document.createElement('div');
    group.id = 'rh-ypt-group-card';
    group.className = 'rh-ypt-panel';
    featureGrid.appendChild(group);
  }
  planner.innerHTML = `
    <div style="padding:18px">
      <div class="rh-ypt-card-title"><div><b>${selectedSubject(section)}</b><span>Subject study & todo</span></div><span>${currentTimerText(section)}</span></div>
      <div id="rh-ypt-todo-list" class="rh-ypt-todo-list"></div>
    </div>`;
  group.innerHTML = `
    <div style="padding:18px">
      <div class="rh-ypt-card-title"><div><b>Study Group</b><span>Study together • motivate each other</span></div><span>${state.members.length} online</span></div>
      <div id="rh-ypt-group-grid" class="rh-ypt-group-grid"></div>
    </div>`;
  renderTodos(section);
  renderMembers();
}

function renderTodos(section){
  const list = document.getElementById('rh-ypt-todo-list');
  if(!list) return;
  const subject = selectedSubject(section);
  const tasks = SUBJECT_TODOS[subject] || ['Focus for 30 minutes','Finish one planned task','Revise mistakes'];
  list.innerHTML = tasks.map((task,i) => `
    <div class="rh-ypt-todo">
      <div class="rh-ypt-dot">${i+1}</div>
      <div><div style="color:#fff;font-size:18px;font-weight:700">${task}</div><small>${subject} plan • ${i===0?'Current target':i===1?'Revision target':'Bonus target'}</small></div>
    </div>`).join('');
}

function initials(name){ return String(name||'S').split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase(); }
function renderMembers(){
  const grid = document.getElementById('rh-ypt-group-grid');
  if(!grid) return;
  const rows = state.members.length ? state.members : [
    { name:'StudyMate', total_seconds:45123 },{ name:'Dreamer', total_seconds:40123 },{ name:'Candy', total_seconds:35123 },{ name:'Focus', total_seconds:30123 },
    { name:'Miya', total_seconds:25123 },{ name:'Note', total_seconds:22123 },{ name:'Targin', total_seconds:18123 },{ name:'Mind', total_seconds:14823 }
  ];
  grid.innerHTML = rows.slice(0,8).map((m,idx) => `
    <div class="rh-ypt-member ${idx<3?'top':''}">
      <div class="rh-ypt-avatar">${initials(m.name)}</div>
      <b>${m.name || 'Member'}</b>
      <span>${fmtShort(m.total_seconds || 0)}</span>
    </div>`).join('');
}

async function loadData(){
  if(state.loading) return;
  const client = db();
  if(!client || !uid()) return;
  state.loading = true;
  try{
    const [boardRes, statusRes] = await Promise.all([
      client.rpc('get_ypt_focus_leaderboard',{ p_limit: 12 }),
      client.rpc('get_focus_avatar_status')
    ]);
    const rows = Array.isArray(boardRes?.data) ? boardRes.data : [];
    const mine = rows.find(x => String(x.user_id) === uid());
    const raw = Array.isArray(statusRes?.data) ? statusRes.data[0] : (statusRes?.data || {});
    const totalSeconds = Number(raw.total_seconds || 0);
    const avatars = Array.isArray(raw.avatars) ? raw.avatars : [];
    const next = avatars.find(x => !x.unlocked);
    state.rank = mine ? `#${mine.rank}` : '—';
    state.focus3day = fmtShort(totalSeconds);
    state.nextText = next ? `Next unlock • ${Number(next.target_hours || 0)}h target` : 'All VIP avatars unlocked';
    state.members = rows.map(r => ({ name: r.name || 'Aspirant', total_seconds: Number(r.total_seconds || 0) }));
  }catch(e){
    console.warn('YPT layout data load skipped', e);
  }finally{
    state.loading = false;
    const section = document.getElementById('section-focus');
    if(section){ buildLayout(section); ensureHeader(section, findRoot(section)); }
  }
}

function bindSubject(section){
  const sel = section.querySelector('select');
  if(!sel || sel.dataset.rhYptBound) return;
  sel.dataset.rhYptBound = '1';
  sel.addEventListener('change', () => {
    ensureHeader(section, findRoot(section));
    renderTodos(section);
  });
}

function hideDuplicateStreakLabel(section){
  Array.from(section.querySelectorAll('*')).forEach(el => {
    const txt = textOf(el).toLowerCase();
    if(txt === 'focus session') el.style.opacity = '.8';
  });
}

function polish(){
  ensureStyle();
  const section = document.getElementById('section-focus');
  if(!section) return;
  const root = findRoot(section);
  if(root) root.classList.add('rh-ypt-shell');
  ensureHeader(section, root);
  bindSubject(section);
  buildLayout(section);
  hideDuplicateStreakLabel(section);
  loadData();
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(polish, 1200), { once:true });
else setTimeout(polish, 1200);
setInterval(polish, 2200);
})();
