/* RATHOD HUB • VIP focus app */
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
function fmtHours(sec){ return `${(Math.max(0,Number(sec)||0)/3600).toFixed(1)}h`; }
function initials(name){ return String(name||'S').split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase(); }
function todayLabel(){ try { return new Date().toLocaleDateString(undefined,{ weekday:'short', month:'numeric', day:'numeric' }); } catch(e){ return 'Today'; } }

function ensureStyle(){
  if(document.getElementById('rh-focus-vip-style')) return;
  const style = document.createElement('style');
  style.id = 'rh-focus-vip-style';
  style.textContent = `
    .rh-focus-root{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.08)!important;background:linear-gradient(180deg,#151515,#0f0f10)!important;box-shadow:0 30px 90px rgba(0,0,0,.42)!important}
    .rh-focus-gold-chip{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;border:1px solid rgba(251,191,36,.18);background:linear-gradient(90deg,rgba(251,191,36,.14),rgba(255,255,255,.03));font-size:10px;font-weight:900;letter-spacing:.24em;text-transform:uppercase;color:#fde68a;box-shadow:0 0 24px rgba(251,191,36,.08)}
    .rh-focus-gold-title{background:linear-gradient(90deg,#fff6cc,#fbbf24,#f59e0b);-webkit-background-clip:text;background-clip:text;color:transparent!important;text-shadow:none!important}
    .rh-focus-shell{margin-top:18px;border-radius:30px;overflow:hidden;border:1px solid rgba(255,255,255,.08);background:#111}
    .rh-focus-vipBar{padding:18px 18px 12px;background:linear-gradient(135deg,#0e0f13 0%,#23180f 28%,#7c3f10 62%,#f97316 100%);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 18px 48px rgba(249,115,22,.18);position:relative}
    .rh-focus-vipBar:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(251,191,36,.18),transparent 34%,transparent 66%,rgba(255,255,255,.06));pointer-events:none}
    .rh-focus-vipTop{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;font-weight:800;position:relative;z-index:1}
    .rh-focus-vipSubject{display:flex;align-items:center;gap:10px}
    .rh-focus-vipTimer{margin-top:18px;font-size:52px;line-height:1;font-weight:900;letter-spacing:.05em;position:relative;z-index:1;text-shadow:0 0 18px rgba(255,255,255,.08)}
    .rh-focus-tabs{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;position:relative;z-index:1}
    .rh-focus-tab{appearance:none;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#fff7ed;font-size:13px;padding:9px 14px;border-radius:999px;cursor:pointer;font-weight:700}
    .rh-focus-tab.active{background:linear-gradient(90deg,rgba(251,191,36,.22),rgba(249,115,22,.28));border-color:rgba(251,191,36,.34);box-shadow:0 0 0 1px rgba(251,191,36,.10) inset}
    .rh-focus-body{padding:18px;background:#101010;min-height:260px}
    .rh-focus-grid{display:grid;grid-template-columns:1.2fr .85fr;gap:18px}
    .rh-focus-panel{border:1px solid rgba(255,255,255,.08)!important;border-radius:26px!important;background:#121212!important;box-shadow:0 18px 44px rgba(0,0,0,.24)!important}
    .rh-focus-panelOrange{border-color:rgba(251,124,48,.28)!important;box-shadow:0 18px 44px rgba(251,124,48,.10)!important;background:linear-gradient(180deg,#0b0d14,#111827)!important}
    .rh-focus-timerGlow{color:#fff4ed!important;text-shadow:0 0 24px rgba(251,124,48,.18)!important}
    .rh-focus-softBtn{background:#1b1b1d!important;border:1px solid rgba(255,255,255,.10)!important;color:#f8fafc!important}
    .rh-focus-startBtn{background:linear-gradient(90deg,#ff9f2a,#ff6e1d)!important;color:#fff!important;border:0!important;box-shadow:0 14px 30px rgba(255,110,29,.22)!important}
    .rh-focus-cardTitle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
    .rh-focus-cardTitle b{font-size:24px;color:#fff}
    .rh-focus-cardTitle span{font-size:12px;color:#9ca3af}
    .rh-focus-bookList,.rh-focus-planList,.rh-focus-graphList{display:grid;gap:12px}
    .rh-focus-bookRow,.rh-focus-planRow{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 14px;border-radius:20px;background:#171717;border:1px solid rgba(255,255,255,.08)}
    .rh-focus-bookLeft,.rh-focus-planLeft{display:flex;align-items:center;gap:12px;min-width:0}
    .rh-focus-play{width:34px;height:34px;border-radius:999px;background:linear-gradient(135deg,#ffb341,#fb7c30);display:grid;place-items:center;color:#fff;font-size:13px;font-weight:900;flex:0 0 34px}
    .rh-focus-bookTitle{font-size:22px;font-weight:800;color:#fff}
    .rh-focus-bookSub,.rh-focus-planSub{display:block;margin-top:4px;font-size:12px;color:#9ca3af}
    .rh-focus-bookTime{font-size:18px;font-weight:800;color:#f8fafc;white-space:nowrap}
    .rh-focus-planDot{width:22px;height:22px;border-radius:999px;background:#fb7c30;display:grid;place-items:center;color:#fff;font-weight:900;flex:0 0 22px}
    .rh-focus-planTitle{font-size:18px;font-weight:700;color:#fff}
    .rh-focus-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:18px}
    .rh-focus-mini{position:relative;overflow:hidden;border-radius:24px;padding:18px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,#151515,#101010)}
    .rh-focus-mini:before{content:"";position:absolute;inset:auto -10px -24px auto;width:110px;height:110px;background:radial-gradient(circle,rgba(251,124,48,.12),transparent 68%);pointer-events:none}
    .rh-focus-miniLabel{font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#9ca3af}.rh-focus-miniValue{display:block;margin-top:10px;font-size:34px;line-height:1;font-weight:900;color:#fff}.rh-focus-miniMeta{display:block;margin-top:8px;font-size:12px;color:#cbd5e1}
    .rh-focus-graphRow{display:grid;grid-template-columns:120px 1fr 64px;gap:12px;align-items:center}.rh-focus-graphName{font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rh-focus-graphTrack{height:14px;border-radius:999px;background:#1f2937;overflow:hidden}.rh-focus-graphBar{height:100%;border-radius:999px;background:linear-gradient(90deg,#fb7c30,#fbbf24);box-shadow:0 0 16px rgba(251,124,48,.18)}.rh-focus-graphValue{font-size:12px;font-weight:800;color:#fbcc9d;text-align:right}
    .rh-focus-groupGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.rh-focus-member{padding:12px 8px;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:#151515;text-align:center}.rh-focus-member.top{border-color:rgba(251,124,48,.38);box-shadow:0 0 0 1px rgba(251,124,48,.12) inset}.rh-focus-avatar{width:58px;height:58px;border-radius:20px;margin:0 auto 10px;background:linear-gradient(135deg,#fb7c30,#fbbf24);display:grid;place-items:center;font-weight:900;color:#111827;font-size:20px;box-shadow:0 12px 24px rgba(251,124,48,.22)}.rh-focus-member b{display:block;font-size:14px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rh-focus-member span{display:block;margin-top:4px;font-size:12px;color:#fb923c}
    .rh-focus-hidden{display:none!important}
    @media (max-width:1024px){.rh-focus-grid,.rh-focus-metrics{grid-template-columns:1fr}.rh-focus-groupGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.rh-focus-vipTimer{font-size:40px}.rh-focus-graphRow{grid-template-columns:88px 1fr 52px}}
  `;
  document.head.appendChild(style);
}

function findSection(){ return document.getElementById('section-focus'); }
function findRoot(section){ return Array.from(section.querySelectorAll('div')).find(el => String(el.innerText || '').includes('RATHOD HUB FOCUS')) || null; }
function findTitleEl(root){ return Array.from(root?.querySelectorAll('h1,h2,h3,h4,b') || []).find(el => textOf(el).toLowerCase().includes('rathod hub focus')) || null; }
function currentTimerText(section){ return textOf(Array.from(section.querySelectorAll('*')).find(el => /^\d{2}:\d{2}:\d{2}$/.test(textOf(el)))) || '00:00:00'; }
function selectedSubject(section){ const s = section.querySelector('select'); return s?.value || s?.options?.[s.selectedIndex]?.text || 'Biology'; }
function findTimerPanel(section){ const timer = Array.from(section.querySelectorAll('*')).find(el => /^\d{2}:\d{2}:\d{2}$/.test(textOf(el))); return timer?.closest('div.rounded-3xl,div.rounded-[32px],div.rounded-[28px]') || timer?.parentElement?.parentElement || null; }
function findControlPanel(section){ return section.querySelector('select')?.closest('div.rounded-3xl,div.rounded-[32px],div.rounded-[28px]') || section.querySelector('select')?.parentElement?.parentElement || null; }
function findStats(section){ const nodes = Array.from(section.querySelectorAll('div')); return { today:nodes.find(el => String(el.innerText || '').toLowerCase().includes('today') && String(el.innerText || '').toLowerCase().includes('study time')) || null, streak:nodes.find(el => String(el.innerText || '').toLowerCase().includes('consecutive study days')) || null, sessions:nodes.find(el => String(el.innerText || '').toLowerCase().includes('completed sessions')) || null }; }

function ensureGoldHeader(section){
  const root = findRoot(section); if(!root) return null;
  root.classList.add('rh-focus-root');
  const title = findTitleEl(root); if(title) title.classList.add('rh-focus-gold-title');
  if(!root.querySelector('.rh-focus-gold-chip')){ const chip=document.createElement('div'); chip.className='rh-focus-gold-chip'; chip.textContent='Yeolpumta Style'; root.insertBefore(chip, root.firstChild); }
  return root;
}

function ensureShell(section){
  let shell = document.getElementById('rh-focus-shell');
  if(shell) return shell;
  shell = document.createElement('div');
  shell.id = 'rh-focus-shell';
  shell.className = 'rh-focus-shell';
  shell.innerHTML = `
    <div class="rh-focus-vipBar">
      <div class="rh-focus-vipTop"><div class="rh-focus-vipSubject"><span>👑</span><span id="rh-focus-vip-subject">Biology</span></div><div>VIP Mode</div></div>
      <div id="rh-focus-vip-timer" class="rh-focus-vipTimer">00:00:00</div>
      <div class="rh-focus-tabs">
        <button type="button" class="rh-focus-tab active" data-rh-focus-tab="timer">Timer</button>
        <button type="button" class="rh-focus-tab" data-rh-focus-tab="books">Books</button>
        <button type="button" class="rh-focus-tab" data-rh-focus-tab="insights">Insights</button>
        <button type="button" class="rh-focus-tab" data-rh-focus-tab="planner">Planner</button>
      </div>
    </div>
    <div id="rh-focus-body" class="rh-focus-body"></div>`;
  ensureGoldHeader(section)?.appendChild(shell);
  shell.querySelectorAll('[data-rh-focus-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.activeTab = btn.getAttribute('data-rh-focus-tab') || 'timer';
      renderApp(section);
    });
  });
  return shell;
}

function renderGroupPanel(){
  const members = appState.members.length ? appState.members : [
    { name:'StudyMate', total_seconds:45123 },{ name:'Dreamer', total_seconds:40123 },{ name:'Candy', total_seconds:35123 },{ name:'Focus', total_seconds:30123 },
    { name:'Miya', total_seconds:25123 },{ name:'Note', total_seconds:22123 },{ name:'Targin', total_seconds:18123 },{ name:'Mind', total_seconds:14823 }
  ];
  return `<div class="rh-focus-panel" style="padding:18px"><div class="rh-focus-cardTitle"><div><b>Study Group</b><span>Study together • motivate each other</span></div><span>${members.length} online</span></div><div class="rh-focus-groupGrid">${members.slice(0,8).map((m,idx)=>`<div class="rh-focus-member ${idx<3?'top':''}"><div class="rh-focus-avatar">${initials(m.name)}</div><b>${m.name}</b><span>${fmtShort(m.total_seconds || 0)}</span></div>`).join('')}</div></div>`;
}

function renderTimerTab(section, body){
  const timerPanel = findTimerPanel(section); const controlPanel = findControlPanel(section);
  if(!timerPanel || !controlPanel) return;
  timerPanel.classList.add('rh-focus-panel','rh-focus-panelOrange');
  controlPanel.classList.add('rh-focus-panel');
  const timerDisplay = Array.from(timerPanel.querySelectorAll('*')).find(el => /^\d{2}:\d{2}:\d{2}$/.test(textOf(el)));
  if(timerDisplay) timerDisplay.classList.add('rh-focus-timerGlow');
  Array.from(section.querySelectorAll('button')).forEach(btn => { const t=textOf(btn).toLowerCase(); if(/start/.test(t)||/pomodoro/.test(t)) btn.classList.add('rh-focus-startBtn'); else btn.classList.add('rh-focus-softBtn'); });
  body.innerHTML = '<div id="rh-focus-grid" class="rh-focus-grid"></div><div style="margin-top:18px">'+renderGroupPanel()+'</div>';
  const grid = body.querySelector('#rh-focus-grid');
  const left = document.createElement('div'); const right = document.createElement('div');
  left.appendChild(timerPanel); right.appendChild(controlPanel); grid.appendChild(left); grid.appendChild(right);
}

function renderBooksTab(section, body){
  const current = selectedSubject(section);
  const rows = Object.keys(SUBJECT_MINUTES).map(name => ({ name, time:name===current?currentTimerText(section):SUBJECT_MINUTES[name], active:name===current }));
  body.innerHTML = `<div class="rh-focus-panel" style="padding:18px"><div class="rh-focus-cardTitle"><div><b>For each subject</b><span>Study and todo</span></div><span>${rows.length} subjects</span></div><div class="rh-focus-bookList">${rows.map(r=>`<div class="rh-focus-bookRow"><div class="rh-focus-bookLeft"><div class="rh-focus-play">▶</div><div><div class="rh-focus-bookTitle">${r.name}</div><span class="rh-focus-bookSub">${r.active?'Current subject':'Ready to study'}</span></div></div><div class="rh-focus-bookTime">${r.time}</div></div>`).join('')}</div></div>`;
}

function renderInsightsTab(body){
  const members = appState.members.length ? appState.members : [
    { name:'StudyMate', total_seconds:45123 },{ name:'Dreamer', total_seconds:40123 },{ name:'Candy', total_seconds:35123 },{ name:'Focus', total_seconds:30123 },
    { name:'Miya', total_seconds:25123 },{ name:'Note', total_seconds:22123 },{ name:'Targin', total_seconds:18123 },{ name:'Mind', total_seconds:14823 }
  ];
  const max = Math.max(...members.map(m => Number(m.total_seconds || 0)),1);
  body.innerHTML = `
    <div class="rh-focus-metrics">
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Daily Goal</span><b class="rh-focus-miniValue">${appState.dailyGoal}</b><span class="rh-focus-miniMeta">Today's study time</span></div>
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Your Rank</span><b class="rh-focus-miniValue">${appState.rank}</b><span class="rh-focus-miniMeta">Live leaderboard standing</span></div>
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">3-Day Focus</span><b class="rh-focus-miniValue">${appState.focus3day}</b><span class="rh-focus-miniMeta">${appState.nextText}</span></div>
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Study Together</span><b class="rh-focus-miniValue">${members.length}</b><span class="rh-focus-miniMeta">Active focus members</span></div>
    </div>
    <div class="rh-focus-panel" style="padding:18px"><div class="rh-focus-cardTitle"><div><b>All Users Hours Graph</b><span>Sabhi users ka focus hours</span></div><span>${members.length} users</span></div><div class="rh-focus-graphList">${members.map(m=>{const sec=Number(m.total_seconds||0);const pct=Math.max(8,Math.round((sec/max)*100));return `<div class="rh-focus-graphRow"><div class="rh-focus-graphName">${m.name||'Member'}</div><div class="rh-focus-graphTrack"><div class="rh-focus-graphBar" style="width:${pct}%"></div></div><div class="rh-focus-graphValue">${fmtHours(sec)}</div></div>`}).join('')}</div></div>
    <div style="margin-top:18px">${renderGroupPanel()}</div>`;
}

function renderPlannerTab(section, body){
  const subject = selectedSubject(section);
  const tasks = SUBJECT_TODOS[subject] || ['Focus for 30 minutes','Finish one planned task','Revise mistakes'];
  body.innerHTML = `<div class="rh-focus-panel" style="padding:18px"><div class="rh-focus-cardTitle"><div><b>${subject}</b><span>Planner</span></div><span>${currentTimerText(section)}</span></div><div class="rh-focus-planList">${tasks.map((t,i)=>`<div class="rh-focus-planRow"><div class="rh-focus-planLeft"><div class="rh-focus-planDot">${i+1}</div><div><div class="rh-focus-planTitle">${t}</div><span class="rh-focus-planSub">${i===0?'Current target':i===1?'Revision target':'Bonus target'}</span></div></div><span class="rh-focus-bookTime">${subject}</span></div>`).join('')}</div></div>`;
}

function renderApp(section){
  const shell = ensureShell(section); if(!shell) return;
  const subject = selectedSubject(section); const timer = currentTimerText(section);
  shell.querySelector('#rh-focus-vip-subject').textContent = `${subject} • ${todayLabel()}`;
  shell.querySelector('#rh-focus-vip-timer').textContent = timer;
  shell.querySelectorAll('[data-rh-focus-tab]').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-rh-focus-tab') === appState.activeTab));
  const body = shell.querySelector('#rh-focus-body'); if(!body) return;
  if(appState.activeTab === 'books') renderBooksTab(section, body);
  else if(appState.activeTab === 'insights') renderInsightsTab(body);
  else if(appState.activeTab === 'planner') renderPlannerTab(section, body);
  else renderTimerTab(section, body);
}

async function loadData(section){
  if(appState.loading) return;
  const client = db(); if(!client || !uid()) return;
  appState.loading = true;
  try{
    const [boardRes, statusRes] = await Promise.all([client.rpc('get_ypt_focus_leaderboard',{ p_limit: 12 }),client.rpc('get_focus_avatar_status')]);
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
  }catch(e){ console.warn('focus vip load skipped', e); }
  finally{ appState.loading = false; renderApp(section); }
}

function bindSubject(section){ const sel=section.querySelector('select'); if(!sel||sel.dataset.boundVip) return; sel.dataset.boundVip='1'; sel.addEventListener('change',()=>renderApp(section)); }
function hideUnused(section){ const stats=findStats(section); if(stats.streak) stats.streak.classList.add('rh-focus-hidden'); if(stats.sessions) stats.sessions.classList.add('rh-focus-hidden'); }

function boot(){
  ensureStyle();
  const section = findSection(); if(!section) return;
  ensureGoldHeader(section); ensureShell(section); bindSubject(section); hideUnused(section); renderApp(section); loadData(section);
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1200), { once:true }); else setTimeout(boot, 1200);
setInterval(() => { if(document.visibilityState !== 'hidden') boot(); }, 2500);
})();
