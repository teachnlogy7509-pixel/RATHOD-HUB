/* RATHOD HUB • app-style focus rebuild */
(function(){
'use strict';
if(window.__RH_FOCUS_TIMER_PREMIUM__) return;
window.__RH_FOCUS_TIMER_PREMIUM__ = 1;

const db = () => { try { return window.db || null; } catch (e) { return null; } };
const uid = () => { try { return String(window.user?.id || ''); } catch (e) { return ''; } };
const SUBJECT_TODOS = {
  Biology:['Revise diagrams for 20 min','Solve 15 MCQs','Make one quick note summary'],
  Physics:['Numericals practice 30 min','Formula revision','Wrong questions recheck'],
  Chemistry:['NCERT reading 25 min','Reaction list revise','20 PYQ questions'],
  Math:['Solve 10 calculus problems','Revision of weak topic','Speed test 20 min'],
  English:['Read one passage','Vocabulary revision','Writing practice 15 min'],
  History:['Read one chapter','Important dates revise','Short answer notes'],
  Science:['Topic recap 20 min','Concept mapping','Practice worksheet']
};
const SUBJECT_MINUTES = { Biology:'02:39:18', Physics:'01:40:00', Chemistry:'02:05:20', Math:'03:10:12', English:'01:25:40', History:'00:55:20', Science:'01:18:44' };
let appState = { activeTab:'timer', rank:'—', focus3day:'0h 0m', nextText:'VIP progress', dailyGoal:'0h 0m', members:[], loading:false };

function textOf(el){ return String(el?.textContent || '').trim(); }
function fmtShort(sec){ sec=Math.max(0,Number(sec)||0); const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60); return h?`${h}h ${m}m`:`${m}m`; }
function initials(name){ return String(name||'S').split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase(); }
function todayLabel(){ try { return new Date().toLocaleDateString(undefined,{ weekday:'short', month:'numeric', day:'numeric' }); } catch(e){ return 'Today'; } }

function ensureStyle(){
  if(document.getElementById('rh-focus-app-style')) return;
  const style = document.createElement('style');
  style.id = 'rh-focus-app-style';
  style.textContent = `
    .rh-focus-app-root{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.08)!important;background:linear-gradient(180deg,#161616,#101010)!important;box-shadow:0 30px 90px rgba(0,0,0,.42)!important}
    .rh-focus-app-root:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.04),transparent 18%);pointer-events:none}
    .rh-focus-gold-chip{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;border:1px solid rgba(251,191,36,.18);background:linear-gradient(90deg,rgba(251,191,36,.14),rgba(255,255,255,.03));font-size:10px;font-weight:900;letter-spacing:.24em;text-transform:uppercase;color:#fde68a;box-shadow:0 0 24px rgba(251,191,36,.08)}
    .rh-focus-gold-title{background:linear-gradient(90deg,#fff6cc,#fbbf24,#f59e0b);-webkit-background-clip:text;background-clip:text;color:transparent!important;text-shadow:none!important}
    .rh-focus-app-shell{margin-top:18px;border-radius:30px;overflow:hidden;border:1px solid rgba(255,255,255,.08);background:#111}
    .rh-focus-app-top{padding:18px 18px 12px;background:linear-gradient(180deg,#fb7c30,#ef6b1d);color:#fff}
    .rh-focus-app-topRow{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;font-weight:800}
    .rh-focus-app-topSubject{display:flex;align-items:center;gap:10px}
    .rh-focus-app-bigTimer{margin-top:18px;font-size:52px;line-height:1;font-weight:900;letter-spacing:.05em}
    .rh-focus-app-tabs{display:flex;gap:22px;margin-top:16px;overflow:auto;padding-bottom:2px}
    .rh-focus-tabBtn{appearance:none;background:none;border:0;color:rgba(255,255,255,.76);font-size:14px;padding:0 0 9px;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent}
    .rh-focus-tabBtn.active{color:#fff;border-color:#fff;font-weight:900}
    .rh-focus-app-body{padding:18px;background:#101010}
    .rh-focus-view{display:none}
    .rh-focus-view.active{display:block}
    .rh-focus-timerGrid{display:grid;grid-template-columns:1.25fr .85fr;gap:18px}
    .rh-focus-panel{border:1px solid rgba(255,255,255,.08)!important;border-radius:26px!important;background:#121212!important;box-shadow:0 18px 44px rgba(0,0,0,.24)!important}
    .rh-focus-panelOrange{border-color:rgba(251,124,48,.28)!important;box-shadow:0 18px 44px rgba(251,124,48,.10)!important;background:linear-gradient(180deg,#0b0d14,#111827)!important}
    .rh-focus-timerGlow{color:#fff4ed!important;text-shadow:0 0 24px rgba(251,124,48,.18)!important}
    .rh-focus-softBtn{background:#1b1b1d!important;border:1px solid rgba(255,255,255,.10)!important;color:#f8fafc!important}
    .rh-focus-startBtn{background:linear-gradient(90deg,#ff9f2a,#ff6e1d)!important;color:#fff!important;border:0!important;box-shadow:0 14px 30px rgba(255,110,29,.22)!important}
    .rh-focus-cards3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
    .rh-focus-cards2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
    .rh-focus-mini{position:relative;overflow:hidden;border-radius:24px;padding:18px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,#151515,#101010)}
    .rh-focus-mini:before{content:"";position:absolute;inset:auto -10px -24px auto;width:110px;height:110px;background:radial-gradient(circle,rgba(251,124,48,.12),transparent 68%);pointer-events:none}
    .rh-focus-miniLabel{font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#9ca3af}
    .rh-focus-miniValue{display:block;margin-top:10px;font-size:34px;line-height:1;font-weight:900;color:#fff}
    .rh-focus-miniMeta{display:block;margin-top:8px;font-size:12px;color:#cbd5e1}
    .rh-focus-bookList,.rh-focus-planList{display:grid;gap:12px}
    .rh-focus-bookRow,.rh-focus-planRow{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 14px;border-radius:20px;background:#171717;border:1px solid rgba(255,255,255,.08)}
    .rh-focus-bookLeft,.rh-focus-planLeft{display:flex;align-items:center;gap:12px;min-width:0}
    .rh-focus-play{width:34px;height:34px;border-radius:999px;background:linear-gradient(135deg,#ffb341,#fb7c30);display:grid;place-items:center;color:#fff;font-size:13px;font-weight:900;flex:0 0 34px}
    .rh-focus-bookTitle{font-size:22px;font-weight:800;color:#fff}
    .rh-focus-bookSub,.rh-focus-planSub{display:block;margin-top:4px;font-size:12px;color:#9ca3af}
    .rh-focus-bookTime{font-size:18px;font-weight:800;color:#f8fafc;white-space:nowrap}
    .rh-focus-planDot{width:22px;height:22px;border-radius:999px;background:#fb7c30;display:grid;place-items:center;color:#fff;font-weight:900;flex:0 0 22px}
    .rh-focus-planTitle{font-size:18px;font-weight:700;color:#fff}
    .rh-focus-insightGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
    .rh-focus-groupGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
    .rh-focus-member{padding:12px 8px;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:#151515;text-align:center}
    .rh-focus-member.top{border-color:rgba(251,124,48,.38);box-shadow:0 0 0 1px rgba(251,124,48,.12) inset}
    .rh-focus-avatar{width:58px;height:58px;border-radius:20px;margin:0 auto 10px;background:linear-gradient(135deg,#fb7c30,#fbbf24);display:grid;place-items:center;font-weight:900;color:#111827;font-size:20px;box-shadow:0 12px 24px rgba(251,124,48,.22)}
    .rh-focus-member b{display:block;font-size:14px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .rh-focus-member span{display:block;margin-top:4px;font-size:12px;color:#fb923c}
    .rh-focus-hidden{display:none!important}
    .rh-focus-cardTitle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
    .rh-focus-cardTitle b{font-size:24px;color:#fff}
    .rh-focus-cardTitle span{font-size:12px;color:#9ca3af}
    @media (max-width:1024px){
      .rh-focus-timerGrid,.rh-focus-cards3,.rh-focus-cards2,.rh-focus-insightGrid{grid-template-columns:1fr}
      .rh-focus-groupGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
      .rh-focus-app-bigTimer{font-size:40px}
    }
  `;
  document.head.appendChild(style);
}

function findSection(){ return document.getElementById('section-focus'); }
function currentTimerText(section){ return textOf(Array.from(section.querySelectorAll('*')).find(el => /^\d{2}:\d{2}:\d{2}$/.test(textOf(el)))) || '00:00:00'; }
function selectedSubject(section){ const s = section.querySelector('select'); return s?.value || s?.options?.[s.selectedIndex]?.text || 'Biology'; }
function findRoot(section){ return Array.from(section.querySelectorAll('div')).find(el => String(el.innerText || '').includes('RATHOD HUB FOCUS')) || null; }
function findTitleEl(root){ return Array.from(root?.querySelectorAll('h1,h2,h3,h4,b') || []).find(el => textOf(el).toLowerCase().includes('rathod hub focus')) || null; }
function findTimerPanel(section){ const timer = Array.from(section.querySelectorAll('*')).find(el => /^\d{2}:\d{2}:\d{2}$/.test(textOf(el))); return timer?.closest('div.rounded-3xl,div.rounded-[32px],div.rounded-[28px]') || timer?.parentElement?.parentElement || null; }
function findControlPanel(section){ return section.querySelector('select')?.closest('div.rounded-3xl,div.rounded-[32px],div.rounded-[28px]') || section.querySelector('select')?.parentElement?.parentElement || null; }
function findStats(section){
  const nodes = Array.from(section.querySelectorAll('div'));
  return {
    today:nodes.find(el => String(el.innerText || '').toLowerCase().includes('today') && String(el.innerText || '').toLowerCase().includes('study time')) || null,
    streak:nodes.find(el => String(el.innerText || '').toLowerCase().includes('consecutive study days')) || null,
    sessions:nodes.find(el => String(el.innerText || '').toLowerCase().includes('completed sessions')) || null
  };
}

function ensureGoldHeader(section){
  const root = findRoot(section); if(!root) return null;
  root.classList.add('rh-focus-app-root');
  const title = findTitleEl(root);
  if(title) title.classList.add('rh-focus-gold-title');
  if(!root.querySelector('.rh-focus-gold-chip')){
    const chip = document.createElement('div');
    chip.className = 'rh-focus-gold-chip';
    chip.textContent = 'Yeolpumta Style';
    root.insertBefore(chip, root.firstChild);
  }
  return root;
}

function ensureShell(section){
  let shell = document.getElementById('rh-focus-app-shell');
  if(shell) return shell;
  shell = document.createElement('div');
  shell.id = 'rh-focus-app-shell';
  shell.className = 'rh-focus-app-shell';
  shell.innerHTML = `
    <div class="rh-focus-app-top">
      <div class="rh-focus-app-topRow">
        <div class="rh-focus-app-topSubject"><span>☰</span><span id="rh-focus-app-subject">Biology</span></div>
        <div>YPT Mode</div>
      </div>
      <div id="rh-focus-app-timer" class="rh-focus-app-bigTimer">00:00:00</div>
      <div class="rh-focus-app-tabs">
        <button type="button" class="rh-focus-tabBtn active" data-rh-focus-tab="timer">Timer</button>
        <button type="button" class="rh-focus-tabBtn" data-rh-focus-tab="books">Books</button>
        <button type="button" class="rh-focus-tabBtn" data-rh-focus-tab="insights">Insights</button>
        <button type="button" class="rh-focus-tabBtn" data-rh-focus-tab="planner">Planner</button>
      </div>
    </div>
    <div class="rh-focus-app-body">
      <div id="rh-focus-view-timer" class="rh-focus-view active"></div>
      <div id="rh-focus-view-books" class="rh-focus-view"></div>
      <div id="rh-focus-view-insights" class="rh-focus-view"></div>
      <div id="rh-focus-view-planner" class="rh-focus-view"></div>
    </div>`;
  const root = ensureGoldHeader(section);
  root?.appendChild(shell);
  bindTabs(shell, section);
  return shell;
}

function bindTabs(shell, section){
  shell.querySelectorAll('[data-rh-focus-tab]').forEach(btn => {
    if(btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      appState.activeTab = btn.getAttribute('data-rh-focus-tab') || 'timer';
      updateActiveTab(shell);
      renderViews(section);
    });
  });
}
function updateActiveTab(shell){
  shell.querySelectorAll('[data-rh-focus-tab]').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-rh-focus-tab') === appState.activeTab));
  shell.querySelectorAll('.rh-focus-view').forEach(view => view.classList.remove('active'));
  shell.querySelector(`#rh-focus-view-${appState.activeTab}`)?.classList.add('active');
}

function renderTimerView(section){
  const target = document.getElementById('rh-focus-view-timer'); if(!target) return;
  const timerPanel = findTimerPanel(section); const controlPanel = findControlPanel(section);
  if(!timerPanel || !controlPanel) return;
  timerPanel.classList.add('rh-focus-panel','rh-focus-panelOrange');
  controlPanel.classList.add('rh-focus-panel');
  const timerDisplay = Array.from(timerPanel.querySelectorAll('*')).find(el => /^\d{2}:\d{2}:\d{2}$/.test(textOf(el)));
  if(timerDisplay) timerDisplay.classList.add('rh-focus-timerGlow');
  Array.from(section.querySelectorAll('button')).forEach(btn => {
    const t = textOf(btn).toLowerCase();
    if(/start/.test(t) || /pomodoro/.test(t)) btn.classList.add('rh-focus-startBtn');
    else btn.classList.add('rh-focus-softBtn');
  });
  target.innerHTML = '<div id="rh-focus-timerGrid" class="rh-focus-timerGrid"></div><div style="margin-top:18px" id="rh-focus-groupWrap"></div>';
  const grid = document.getElementById('rh-focus-timerGrid');
  const left = document.createElement('div'); const right = document.createElement('div');
  left.appendChild(timerPanel); right.appendChild(controlPanel); grid.appendChild(left); grid.appendChild(right);
  renderGroupPanel(document.getElementById('rh-focus-groupWrap'));
}

function renderBooksView(section){
  const target = document.getElementById('rh-focus-view-books'); if(!target) return;
  const current = selectedSubject(section);
  const rows = Object.keys(SUBJECT_MINUTES).map(name => ({ name, time:name===current?currentTimerText(section):SUBJECT_MINUTES[name], active:name===current }));
  target.innerHTML = `
    <div class="rh-focus-panel" style="padding:18px">
      <div class="rh-focus-cardTitle"><div><b>For each subject</b><span>Study and todo</span></div><span>${rows.length} subjects</span></div>
      <div class="rh-focus-bookList">
        ${rows.map(r => `<div class="rh-focus-bookRow"><div class="rh-focus-bookLeft"><div class="rh-focus-play">▶</div><div><div class="rh-focus-bookTitle">${r.name}</div><span class="rh-focus-bookSub">${r.active?'Current subject':'Ready to study'}</span></div></div><div class="rh-focus-bookTime">${r.time}</div></div>`).join('')}
      </div>
    </div>`;
}

function renderInsightsView(section){
  const target = document.getElementById('rh-focus-view-insights'); if(!target) return;
  target.innerHTML = `
    <div class="rh-focus-insightGrid">
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Daily Goal</span><b class="rh-focus-miniValue">${appState.dailyGoal}</b><span class="rh-focus-miniMeta">Today's study time</span></div>
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Your Rank</span><b class="rh-focus-miniValue">${appState.rank}</b><span class="rh-focus-miniMeta">Live leaderboard standing</span></div>
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">3-Day Focus</span><b class="rh-focus-miniValue">${appState.focus3day}</b><span class="rh-focus-miniMeta">${appState.nextText}</span></div>
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Study Together</span><b class="rh-focus-miniValue">${appState.members.length || 8}</b><span class="rh-focus-miniMeta">Active focus members</span></div>
    </div>
    <div style="margin-top:18px" id="rh-focus-insightGroup"></div>`;
  renderGroupPanel(document.getElementById('rh-focus-insightGroup'));
}

function renderPlannerView(section){
  const target = document.getElementById('rh-focus-view-planner'); if(!target) return;
  const subject = selectedSubject(section);
  const tasks = SUBJECT_TODOS[subject] || ['Focus for 30 minutes','Finish one planned task','Revise mistakes'];
  target.innerHTML = `
    <div class="rh-focus-panel" style="padding:18px">
      <div class="rh-focus-cardTitle"><div><b>${subject}</b><span>Planner</span></div><span>${currentTimerText(section)}</span></div>
      <div class="rh-focus-planList">
        ${tasks.map((t,i)=>`<div class="rh-focus-planRow"><div class="rh-focus-planLeft"><div class="rh-focus-planDot">${i+1}</div><div><div class="rh-focus-planTitle">${t}</div><span class="rh-focus-planSub">${i===0?'Current target':i===1?'Revision target':'Bonus target'}</span></div></div><span class="rh-focus-bookTime">${subject}</span></div>`).join('')}
      </div>
    </div>`;
}

function renderGroupPanel(host){
  if(!host) return;
  const members = appState.members.length ? appState.members : [
    { name:'StudyMate', total_seconds:45123 },{ name:'Dreamer', total_seconds:40123 },{ name:'Candy', total_seconds:35123 },{ name:'Focus', total_seconds:30123 },
    { name:'Miya', total_seconds:25123 },{ name:'Note', total_seconds:22123 },{ name:'Targin', total_seconds:18123 },{ name:'Mind', total_seconds:14823 }
  ];
  host.innerHTML = `
    <div class="rh-focus-panel" style="padding:18px">
      <div class="rh-focus-cardTitle"><div><b>Study Group</b><span>Study together • motivate each other</span></div><span>${members.length} online</span></div>
      <div class="rh-focus-groupGrid">
        ${members.slice(0,8).map((m,idx)=>`<div class="rh-focus-member ${idx<3?'top':''}"><div class="rh-focus-avatar">${initials(m.name)}</div><b>${m.name}</b><span>${fmtShort(m.total_seconds || 0)}</span></div>`).join('')}
      </div>
    </div>`;
}

function renderViews(section){
  const shell = ensureShell(section);
  if(!shell) return;
  const subjectEl = shell.querySelector('#rh-focus-app-subject');
  const timerEl = shell.querySelector('#rh-focus-app-timer');
  if(subjectEl) subjectEl.textContent = `${selectedSubject(section)} • ${todayLabel()}`;
  if(timerEl) timerEl.textContent = currentTimerText(section);
  updateActiveTab(shell);
  renderTimerView(section);
  renderBooksView(section);
  renderInsightsView(section);
  renderPlannerView(section);
}

async function loadData(section){
  if(appState.loading) return;
  const client = db();
  if(!client || !uid()) return;
  appState.loading = true;
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
    const todayCard = findStats(section).today;
    appState.rank = mine ? `#${mine.rank}` : '—';
    appState.focus3day = fmtShort(totalSeconds);
    appState.nextText = next ? `Next unlock • ${Number(next.target_hours || 0)}h target` : 'All VIP avatars unlocked';
    appState.members = rows.map(r => ({ name:r.name || 'Aspirant', total_seconds:Number(r.total_seconds || 0) }));
    appState.dailyGoal = textOf(todayCard?.querySelector('b')) || appState.dailyGoal;
  }catch(e){ console.warn('focus app load skipped', e); }
  finally{ appState.loading = false; renderViews(section); }
}

function bindSubject(section){
  const sel = section.querySelector('select');
  if(!sel || sel.dataset.rhFocusBound) return;
  sel.dataset.rhFocusBound = '1';
  sel.addEventListener('change', () => renderViews(section));
}

function hideUnused(section){
  const stats = findStats(section);
  if(stats.streak) stats.streak.classList.add('rh-focus-hidden');
  if(stats.sessions) stats.sessions.classList.add('rh-focus-hidden');
}

function boot(){
  ensureStyle();
  const section = findSection();
  if(!section) return;
  ensureGoldHeader(section);
  ensureShell(section);
  bindSubject(section);
  hideUnused(section);
  renderViews(section);
  loadData(section);
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1200), { once:true });
else setTimeout(boot, 1200);
setInterval(() => { if(document.visibilityState !== 'hidden') boot(); }, 2500);
})();
