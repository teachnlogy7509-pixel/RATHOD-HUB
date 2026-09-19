/* RATHOD HUB • VIP focus hard replacement */
(function(){
'use strict';
if(window.__RH_FOCUS_TIMER_PREMIUM_V11__) return;
window.__RH_FOCUS_TIMER_PREMIUM_V11__ = 1;
window.__RH_FOCUS_TIMER_PREMIUM__ = 1;

const db = () => { try { return window.db || null; } catch (e) { return null; } };
const uid = () => { try { return String(window.user?.id || ''); } catch (e) { return ''; } };
const STORAGE_KEY = 'rh_focus_planner_tasks_v4';
const SUBJECT_CARDS = [
  { name:'Botany', note:'Plants + diagrams revision', session:50, icon:'🌿', glow:'#22c55e' },
  { name:'Zoology', note:'Animals + NCERT notes', session:50, icon:'🦋', glow:'#10b981' },
  { name:'Chemistry', note:'Reactions + revision', session:50, icon:'🧪', glow:'#f59e0b' },
  { name:'Physics', note:'Numericals + concepts', session:60, icon:'⚡', glow:'#38bdf8' },
  { name:'Revision', note:'Weak topics quick revise', session:40, icon:'🔁', glow:'#f97316' }
];
const FALLBACK_MEMBERS = [
  { name:'StudyMate', total_seconds:45123, icon:'👑', glow:'#f59e0b' },
  { name:'Dreamer', total_seconds:40123, icon:'🌙', glow:'#8b5cf6' },
  { name:'Candy', total_seconds:35123, icon:'🍬', glow:'#ec4899' },
  { name:'Focus', total_seconds:30123, icon:'🔥', glow:'#f97316' },
  { name:'Miya', total_seconds:25123, icon:'🌸', glow:'#f472b6' },
  { name:'Note', total_seconds:22123, icon:'📚', glow:'#22c55e' },
  { name:'Targin', total_seconds:18123, icon:'✨', glow:'#facc15' },
  { name:'Mind', total_seconds:14823, icon:'🧠', glow:'#60a5fa' }
];
const SIDEBAR_GLOWS = {
  'ai doubt':'#ef4444','ai learning':'#8b5cf6','live quiz':'#fb7185','neet 720':'#10b981','daily 9 pm':'#f59e0b',
  'study material':'#f59e0b','question archive':'#60a5fa','ai notes & formula':'#c084fc','focus timer':'#ef4444','study power':'#facc15','study rooms':'#38bdf8','study diary':'#22c55e','my vault':'#a855f7','community':'#8b5cf6','live chat':'#06b6d4','pw yakeen':'#ef4444'
};
let appState = { activeTab:'timer', rank:'—', focus3day:'0h 0m', nextText:'VIP progress', dailyGoal:'0h 0m', members:[], loading:false };

function textOf(el){ return String(el?.textContent || '').trim(); }
function fmtShort(sec){ sec=Math.max(0,Number(sec)||0); const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60); return h?`${h}h ${m}m`:`${m}m`; }
function fmtHours(sec){ return `${(Math.max(0,Number(sec)||0)/3600).toFixed(1)}h`; }
function todayLabel(){ try { return new Date().toLocaleDateString(undefined,{ weekday:'short', month:'numeric', day:'numeric' }); } catch(e){ return 'Today'; } }
function liveClock(){ try { return new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }); } catch(e){ return '--:--'; } }
function plannerStore(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ return []; } }
function savePlanner(tasks){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch(e){} }
function normalizeMember(m, i){ const f = FALLBACK_MEMBERS[i % FALLBACK_MEMBERS.length]; return { name:m.name || `Member ${i+1}`, total_seconds:Number(m.total_seconds || 0), icon:m.icon || f.icon, glow:m.glow || f.glow }; }
function findSection(){ return document.getElementById('section-focus'); }
function sourceRoot(section){ return section?.querySelector('#rh-focus-source-host') || null; }
function allSource(section, sel){ return Array.from((sourceRoot(section) || section).querySelectorAll(sel)); }
function firstSource(section, sel){ return (sourceRoot(section) || section).querySelector(sel); }

function ensureStyle(){
  if(document.getElementById('rh-focus-vip-style-v11')) return;
  const style = document.createElement('style');
  style.id = 'rh-focus-vip-style-v11';
  style.textContent = `
    #section-focus{position:relative;border:1px solid rgba(251,191,36,.12)!important;border-radius:34px!important;overflow:hidden!important;background:radial-gradient(circle at top right,rgba(249,115,22,.12),transparent 28%),radial-gradient(circle at top left,rgba(251,191,36,.10),transparent 24%),linear-gradient(180deg,#151515,#0f0f10)!important;box-shadow:0 30px 90px rgba(0,0,0,.42)!important;padding:18px!important}
    #section-focus>.rh-focus-source-host{display:none!important}
    .rh-focus-shell{border-radius:30px;overflow:hidden;border:1px solid rgba(251,191,36,.16);background:linear-gradient(180deg,#111111,#0f0f10);box-shadow:0 24px 70px rgba(0,0,0,.30)}
    .rh-focus-vipBar{padding:18px 18px 12px;background:linear-gradient(135deg,#0e0f13 0%,#22170d 32%,#7c3f10 68%,#f97316 100%);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 18px 48px rgba(249,115,22,.18);position:relative}
    .rh-focus-vipBar:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(251,191,36,.16),transparent 35%,transparent 68%,rgba(255,255,255,.05));pointer-events:none}
    .rh-focus-vipTop{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;font-weight:800;position:relative;z-index:1}.rh-focus-vipSubject{display:flex;align-items:center;gap:10px}.rh-focus-topMeta{display:flex;gap:10px;align-items:center}.rh-focus-topClock{padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);font-size:11px}
    .rh-focus-vipTimer{margin-top:18px;font-size:52px;line-height:1;font-weight:900;letter-spacing:.05em;position:relative;z-index:1;text-shadow:0 0 18px rgba(255,255,255,.08)}
    .rh-focus-tabs{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;position:relative;z-index:1}.rh-focus-tab{appearance:none;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#fff7ed;font-size:13px;padding:9px 14px;border-radius:999px;cursor:pointer;font-weight:700}.rh-focus-tab.active{background:linear-gradient(90deg,rgba(251,191,36,.22),rgba(249,115,22,.28));border-color:rgba(251,191,36,.34);box-shadow:0 0 0 1px rgba(251,191,36,.10) inset}
    .rh-focus-body{padding:18px;background:linear-gradient(180deg,#111111,#0e0e0f);min-height:260px}.rh-focus-grid{display:grid;grid-template-columns:1.2fr .85fr;gap:18px}
    .rh-focus-panel{border:1px solid rgba(251,191,36,.12)!important;border-radius:26px!important;background:linear-gradient(180deg,#171717,#111111)!important;box-shadow:0 18px 44px rgba(0,0,0,.24)!important}.rh-focus-panelOrange{border-color:rgba(251,124,48,.28)!important;box-shadow:0 18px 44px rgba(251,124,48,.10)!important;background:radial-gradient(circle at top,rgba(249,115,22,.10),transparent 32%),linear-gradient(180deg,#0b0d14,#111827)!important}
    .rh-focus-cardTitle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.rh-focus-cardTitle b{font-size:24px;color:#fff}.rh-focus-cardTitle span{font-size:12px;color:#9ca3af}
    .rh-focus-inlineActions{display:flex;gap:8px;flex-wrap:wrap}.rh-focus-inlineBtn{appearance:none;border:1px solid rgba(251,191,36,.18);background:rgba(251,191,36,.10);color:#fde68a;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:800;cursor:pointer}
    .rh-focus-booksGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.rh-focus-bookCard{position:relative;overflow:hidden;padding:18px;border-radius:24px;border:1px solid rgba(251,191,36,.16);background:linear-gradient(180deg,#1a1a1a,#131313);box-shadow:0 16px 34px rgba(0,0,0,.22)}.rh-focus-bookCard:before{content:"";position:absolute;inset:auto -20px -20px auto;width:120px;height:120px;background:radial-gradient(circle,var(--glow),transparent 70%);opacity:.22;pointer-events:none}.rh-focus-bookTop{display:flex;align-items:center;justify-content:space-between;gap:12px}.rh-focus-bookIcon{width:52px;height:52px;border-radius:18px;display:grid;place-items:center;font-size:24px;background:linear-gradient(135deg,var(--glow),#ffffff22);box-shadow:0 0 0 1px rgba(255,255,255,.06) inset,0 10px 24px color-mix(in srgb,var(--glow) 34%, transparent)}.rh-focus-bookName{font-size:22px;font-weight:900;color:#fff}.rh-focus-bookNote{margin-top:8px;font-size:13px;color:#d1d5db}.rh-focus-bookFoot{margin-top:14px;display:flex;align-items:center;justify-content:space-between;gap:12px}.rh-focus-bookTime{font-size:13px;font-weight:800;color:#fde68a}.rh-focus-bookStart{appearance:none;border:0;background:linear-gradient(90deg,var(--glow),#f59e0b);color:#fff;padding:10px 14px;border-radius:999px;font-size:12px;font-weight:900;cursor:pointer;box-shadow:0 10px 22px color-mix(in srgb,var(--glow) 28%, transparent)}
    .rh-focus-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:18px}.rh-focus-mini{position:relative;overflow:hidden;border-radius:24px;padding:18px;border:1px solid rgba(251,191,36,.10);background:linear-gradient(180deg,#171717,#111111)}.rh-focus-mini:before{content:"";position:absolute;inset:auto -10px -24px auto;width:110px;height:110px;background:radial-gradient(circle,rgba(251,124,48,.12),transparent 68%);pointer-events:none}.rh-focus-miniLabel{font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#9ca3af}.rh-focus-miniValue{display:block;margin-top:10px;font-size:34px;line-height:1;font-weight:900;color:#fff}.rh-focus-miniMeta{display:block;margin-top:8px;font-size:12px;color:#cbd5e1}
    .rh-focus-graphList{display:grid;gap:12px}.rh-focus-graphRow{display:grid;grid-template-columns:160px 1fr 68px;gap:12px;align-items:center}.rh-focus-graphName{font-size:14px;font-weight:900;color:#fff7ed;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:6px 10px;border-radius:999px;background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.12)}.rh-focus-graphTrack{height:14px;border-radius:999px;background:#1f2937;overflow:hidden}.rh-focus-graphBar{height:100%;border-radius:999px;background:linear-gradient(90deg,#fb7c30,#fbbf24);box-shadow:0 0 16px rgba(251,124,48,.18)}.rh-focus-graphValue{font-size:12px;font-weight:800;color:#fbcc9d;text-align:right}
    .rh-focus-groupGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.rh-focus-member{position:relative;overflow:hidden;padding:12px 8px;border-radius:22px;border:1px solid rgba(251,191,36,.10);background:linear-gradient(180deg,#191919,#141414);text-align:center}.rh-focus-member:before{content:"";position:absolute;inset:auto -18px -18px auto;width:100px;height:100px;background:radial-gradient(circle,var(--member-glow),transparent 72%);opacity:.24;pointer-events:none}.rh-focus-member.top{border-color:rgba(251,124,48,.38);box-shadow:0 0 0 1px rgba(251,124,48,.12) inset}.rh-focus-avatar{width:58px;height:58px;border-radius:20px;margin:0 auto 10px;display:grid;place-items:center;font-weight:900;color:#111827;font-size:24px;background:linear-gradient(135deg,var(--member-glow),#fbbf24);box-shadow:0 12px 24px rgba(251,124,48,.22)}.rh-focus-member b{display:block;font-size:14px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rh-focus-member span{display:block;margin-top:4px;font-size:12px;color:#fb923c}
    .rh-focus-plannerInput{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}.rh-focus-plannerInput input{flex:1;min-width:220px;background:#0f172a;border:1px solid rgba(255,255,255,.10);color:#fff;padding:12px 14px;border-radius:16px}.rh-focus-plannerInput button{appearance:none;border:0;background:linear-gradient(90deg,#ff9f2a,#ff6e1d);color:#fff;padding:12px 16px;border-radius:16px;font-weight:800;cursor:pointer}.rh-focus-taskDone{text-decoration:line-through;opacity:.6}.rh-focus-taskActions{display:flex;gap:8px}.rh-focus-taskChip{appearance:none;border:1px solid rgba(255,255,255,.10);background:#1b1b1d;color:#fff;padding:7px 10px;border-radius:999px;font-size:12px;cursor:pointer}.rh-focus-planList{display:grid;gap:12px}.rh-focus-planRow{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 14px;border-radius:20px;background:linear-gradient(180deg,#1a1a1a,#151515);border:1px solid rgba(251,191,36,.10)}.rh-focus-planLeft{display:flex;align-items:center;gap:12px;min-width:0}.rh-focus-planDot{width:22px;height:22px;border-radius:999px;background:#fb7c30;display:grid;place-items:center;color:#fff;font-weight:900;flex:0 0 22px}.rh-focus-planTitle{font-size:18px;font-weight:700;color:#fff}.rh-focus-planSub{display:block;margin-top:4px;font-size:12px;color:#9ca3af}
    .rh-vip-sidebar .rh-nav-btn,.rh-vip-sidebar button,.rh-vip-sidebar a{position:relative;border-radius:18px!important;border:1px solid rgba(255,255,255,.05)!important;transition:.18s ease;overflow:hidden}.rh-vip-sidebar .rh-nav-btn:before,.rh-vip-sidebar button:before,.rh-vip-sidebar a:before{content:"";position:absolute;inset:auto -20px -16px auto;width:90px;height:90px;background:radial-gradient(circle,var(--vipGlow,#f59e0b),transparent 72%);opacity:.18;pointer-events:none}.rh-vip-sidebar .rh-nav-btn:hover,.rh-vip-sidebar button:hover,.rh-vip-sidebar a:hover{border-color:color-mix(in srgb,var(--vipGlow,#f59e0b) 45%, transparent)!important;box-shadow:0 0 0 1px color-mix(in srgb,var(--vipGlow,#f59e0b) 18%, transparent) inset,0 10px 24px rgba(0,0,0,.18)}.rh-vip-sidebar .rh-nav-btn span,.rh-vip-sidebar button span,.rh-vip-sidebar a span{font-weight:800!important;color:#fff!important}.rh-vip-sidebar .rh-nav-btn i,.rh-vip-sidebar button i,.rh-vip-sidebar a i,.rh-vip-sidebar .rh-nav-btn svg,.rh-vip-sidebar button svg,.rh-vip-sidebar a svg{color:var(--vipGlow,#f59e0b)!important;filter:drop-shadow(0 0 10px color-mix(in srgb,var(--vipGlow,#f59e0b) 55%, transparent))}
    @media (max-width:1024px){.rh-focus-grid,.rh-focus-metrics,.rh-focus-booksGrid{grid-template-columns:1fr}.rh-focus-groupGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.rh-focus-vipTimer{font-size:40px}.rh-focus-graphRow{grid-template-columns:108px 1fr 52px}}
  `;
  document.head.appendChild(style);
}

function ensureSourceHost(section){
  let host = sourceRoot(section);
  if(!host){
    host = document.createElement('div');
    host.id = 'rh-focus-source-host';
    host.className = 'rh-focus-source-host';
    const staleShell = section.querySelector('#rh-focus-shell');
    if(staleShell) staleShell.remove();
    Array.from(section.childNodes).forEach(node => host.appendChild(node));
    section.appendChild(host);
  }
  Array.from(section.childNodes).forEach(node => {
    if(node !== host && !(node.id === 'rh-focus-shell')) host.appendChild(node);
  });
  return host;
}

function currentTimerText(section){
  const timerNode = allSource(section,'*').find(el => /^\d{2}:\d{2}:\d{2}$/.test(textOf(el)));
  return textOf(timerNode) || '00:30:00';
}
function selectedSubject(section){
  const s = firstSource(section,'select');
  return s?.value || s?.options?.[s.selectedIndex]?.text || 'Botany';
}
function setSubjectValue(section, subject){
  const select = firstSource(section,'select');
  if(!select) return false;
  let option = Array.from(select.options || []).find(o => String(o.value||o.textContent||'').toLowerCase() === subject.toLowerCase() || String(o.textContent||'').toLowerCase() === subject.toLowerCase());
  if(!option){ option = document.createElement('option'); option.value = subject; option.textContent = subject; select.appendChild(option); }
  select.value = option.value;
  select.dispatchEvent(new Event('change', { bubbles:true }));
  return true;
}
function quickSetDuration(section, minutes){
  const input = firstSource(section,'input[type="number"]');
  if(!input) return;
  input.value = String(minutes);
  input.dispatchEvent(new Event('input', { bubbles:true }));
  input.dispatchEvent(new Event('change', { bubbles:true }));
}
function startFocusForSubject(section, subject){
  setSubjectValue(section, subject);
  const startBtn = allSource(section,'button').find(btn => /start/i.test(textOf(btn)) && !/pomodoro/i.test(textOf(btn)));
  if(startBtn) startBtn.click();
  appState.activeTab = 'timer';
  renderApp(section);
}
function getTodayStudy(section){
  const todayCard = allSource(section,'div').find(el => { const t = String(el.innerText || '').toLowerCase(); return t.includes('today') && t.includes('study time'); });
  const match = String(todayCard?.innerText || '').match(/(\d+h\s*\d+m|\d+h|\d+m)/i);
  return match ? match[1] : appState.dailyGoal;
}

function premiumizeSidebar(){
  const sidebar = document.querySelector('.rh-sidebar');
  if(!sidebar) return;
  sidebar.classList.add('rh-vip-sidebar');
  sidebar.querySelectorAll('button,a,.rh-nav-btn').forEach(el => {
    const key = textOf(el).toLowerCase();
    const glow = Object.keys(SIDEBAR_GLOWS).find(k => key.includes(k));
    if(glow) el.style.setProperty('--vipGlow', SIDEBAR_GLOWS[glow]);
  });
}

function ensureShell(section){
  let shell = section.querySelector('#rh-focus-shell');
  if(shell) return shell;
  shell = document.createElement('div');
  shell.id = 'rh-focus-shell';
  shell.className = 'rh-focus-shell';
  shell.innerHTML = `
    <div class="rh-focus-vipBar">
      <div class="rh-focus-vipTop"><div class="rh-focus-vipSubject"><span>👑</span><span id="rh-focus-vip-subject">Botany</span></div><div class="rh-focus-topMeta"><span id="rh-focus-top-clock" class="rh-focus-topClock">--:--</span><span>VIP Mode</span></div></div>
      <div id="rh-focus-vip-timer" class="rh-focus-vipTimer">00:30:00</div>
      <div class="rh-focus-tabs">
        <button type="button" class="rh-focus-tab active" data-rh-focus-tab="timer">Timer</button>
        <button type="button" class="rh-focus-tab" data-rh-focus-tab="books">Books</button>
        <button type="button" class="rh-focus-tab" data-rh-focus-tab="insights">Insights</button>
        <button type="button" class="rh-focus-tab" data-rh-focus-tab="planner">Planner</button>
      </div>
    </div>
    <div id="rh-focus-body" class="rh-focus-body"></div>`;
  section.appendChild(shell);
  shell.querySelectorAll('[data-rh-focus-tab]').forEach(btn => btn.addEventListener('click', () => { appState.activeTab = btn.getAttribute('data-rh-focus-tab') || 'timer'; renderApp(section); }));
  return shell;
}

function renderGroupPanel(){
  const members = (appState.members.length ? appState.members : FALLBACK_MEMBERS).map(normalizeMember);
  return `<div class="rh-focus-panel" style="padding:18px"><div class="rh-focus-cardTitle"><div><b>Study Group</b><span>Study together • motivate each other</span></div><span>${members.length} online</span></div><div class="rh-focus-groupGrid">${members.slice(0,8).map((m,idx)=>`<div class="rh-focus-member ${idx<3?'top':''}" style="--member-glow:${m.glow}"><div class="rh-focus-avatar">${m.icon}</div><b>${m.name}</b><span>${fmtShort(m.total_seconds || 0)}</span></div>`).join('')}</div></div>`;
}

function renderTimerTab(section, body){
  body.innerHTML = `
    <div class="rh-focus-grid">
      <div class="rh-focus-panel rh-focus-panelOrange" style="padding:18px">
        <div class="rh-focus-cardTitle"><div><b>Live Timer</b><span>Current subject and clock</span></div><span id="rh-focus-live-clock">${liveClock()}</span></div>
        <div class="rh-focus-metrics" style="margin-bottom:0">
          <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Current Subject</span><b class="rh-focus-miniValue">${selectedSubject(section)}</b><span class="rh-focus-miniMeta">Ready for focus</span></div>
          <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Current Time</span><b class="rh-focus-miniValue" id="rh-focus-clock-card">${liveClock()}</b><span class="rh-focus-miniMeta">Kitna baj raha hai abhi</span></div>
        </div>
      </div>
      <div class="rh-focus-panel" style="padding:18px">
        <div class="rh-focus-cardTitle"><div><b>Quick Actions</b><span>Fast controls</span></div><span>${currentTimerText(section)}</span></div>
        <div class="rh-focus-inlineActions"><button type="button" class="rh-focus-inlineBtn" data-rh-duration="25">25 min</button><button type="button" class="rh-focus-inlineBtn" data-rh-duration="50">50 min</button><button type="button" class="rh-focus-inlineBtn" data-rh-duration="60">1 hour</button><button type="button" class="rh-focus-inlineBtn" data-rh-quick-subject="Botany">Botany</button><button type="button" class="rh-focus-inlineBtn" data-rh-quick-subject="Zoology">Zoology</button><button type="button" class="rh-focus-inlineBtn" data-rh-quick-subject="Revision">Revision</button></div>
      </div>
    </div>
    <div style="margin-top:18px">${renderGroupPanel()}</div>`;
  body.querySelectorAll('[data-rh-duration]').forEach(btn => btn.addEventListener('click', () => quickSetDuration(section, btn.getAttribute('data-rh-duration'))));
  body.querySelectorAll('[data-rh-quick-subject]').forEach(btn => btn.addEventListener('click', () => startFocusForSubject(section, btn.getAttribute('data-rh-quick-subject') || 'Botany')));
}

function renderBooksTab(section, body){
  body.innerHTML = `<div class="rh-focus-panel" style="padding:18px"><div class="rh-focus-cardTitle"><div><b>Premium Focus Books</b><span>Direct subject start</span></div><span>${SUBJECT_CARDS.length} subjects</span></div><div class="rh-focus-booksGrid">${SUBJECT_CARDS.map(card=>`<div class="rh-focus-bookCard" style="--glow:${card.glow}"><div class="rh-focus-bookTop"><div class="rh-focus-bookIcon">${card.icon}</div><div class="rh-focus-bookTime">${card.session} min</div></div><div class="rh-focus-bookName">${card.name}</div><div class="rh-focus-bookNote">${card.note}</div><div class="rh-focus-bookFoot"><span class="rh-focus-bookTime">Premium Start</span><button type="button" class="rh-focus-bookStart" data-rh-book-subject="${card.name}" data-rh-book-minutes="${card.session}">Start Now</button></div></div>`).join('')}</div></div>`;
  body.querySelectorAll('[data-rh-book-subject]').forEach(btn => btn.addEventListener('click', () => { const subject = btn.getAttribute('data-rh-book-subject') || 'Botany'; const minutes = parseInt(btn.getAttribute('data-rh-book-minutes') || '50',10) || 50; quickSetDuration(section, minutes); startFocusForSubject(section, subject); }));
}

function renderInsightsTab(body){
  const members = (appState.members.length ? appState.members : FALLBACK_MEMBERS).map(normalizeMember);
  const max = Math.max(...members.map(m => Number(m.total_seconds || 0)),1);
  body.innerHTML = `
    <div class="rh-focus-metrics">
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Daily Goal</span><b class="rh-focus-miniValue">${appState.dailyGoal}</b><span class="rh-focus-miniMeta">Today's study time</span></div>
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Your Rank</span><b class="rh-focus-miniValue">${appState.rank}</b><span class="rh-focus-miniMeta">Live leaderboard standing</span></div>
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">3-Day Focus</span><b class="rh-focus-miniValue">${appState.focus3day}</b><span class="rh-focus-miniMeta">${appState.nextText}</span></div>
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Study Together</span><b class="rh-focus-miniValue">${members.length}</b><span class="rh-focus-miniMeta">Active focus members</span></div>
    </div>
    <div class="rh-focus-panel" style="padding:18px"><div class="rh-focus-cardTitle"><div><b>All Users Hours Graph</b><span>Sabhi users ka focus hours</span></div><span>${members.length} users</span></div><div class="rh-focus-graphList">${members.map(m=>{const sec=Number(m.total_seconds||0);const pct=Math.max(8,Math.round((sec/max)*100));return `<div class="rh-focus-graphRow"><div class="rh-focus-graphName">${m.name||'Member'}</div><div class="rh-focus-graphTrack"><div class="rh-focus-graphBar" style="width:${pct}%"></div></div><div class="rh-focus-graphValue">${fmtHours(sec)}</div></div>`}).join('')}</div></div>`;
}

function bindPlannerActions(section, body){
  const input = body.querySelector('#rh-focus-planner-input');
  const addBtn = body.querySelector('#rh-focus-planner-add');
  const renderList = () => renderPlannerTab(section, body);
  addBtn?.addEventListener('click', () => {
    const value = String(input?.value || '').trim();
    if(!value) return;
    const tasks = plannerStore();
    tasks.unshift({ id: Date.now().toString(36), text:value, done:false, subject:selectedSubject(section), date:new Date().toISOString().slice(0,10) });
    savePlanner(tasks); renderList();
  });
  body.querySelectorAll('[data-rh-task-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-rh-task-toggle');
    savePlanner(plannerStore().map(t => t.id === id ? { ...t, done: !t.done } : t)); renderList();
  }));
  body.querySelectorAll('[data-rh-task-delete]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-rh-task-delete');
    savePlanner(plannerStore().filter(t => t.id !== id)); renderList();
  }));
}
function renderPlannerTab(section, body){
  const subject = selectedSubject(section);
  const date = new Date().toISOString().slice(0,10);
  const tasks = plannerStore().filter(t => t.date === date);
  body.innerHTML = `<div class="rh-focus-panel" style="padding:18px"><div class="rh-focus-cardTitle"><div><b>${subject} Planner</b><span>User set tasks</span></div><span>${currentTimerText(section)}</span></div><div class="rh-focus-plannerInput"><input id="rh-focus-planner-input" type="text" placeholder="Aaj kya karna hai? likho..."><button id="rh-focus-planner-add" type="button">Add Task</button></div><div class="rh-focus-planList">${tasks.length?tasks.map((t,i)=>`<div class="rh-focus-planRow"><div class="rh-focus-planLeft"><div class="rh-focus-planDot">${i+1}</div><div><div class="rh-focus-planTitle ${t.done?'rh-focus-taskDone':''}">${t.text}</div><span class="rh-focus-planSub">${t.subject || subject}</span></div></div><div class="rh-focus-taskActions"><button type="button" class="rh-focus-taskChip" data-rh-task-toggle="${t.id}">${t.done?'Undo':'Done'}</button><button type="button" class="rh-focus-taskChip" data-rh-task-delete="${t.id}">Delete</button></div></div>`).join(''):'<div class="rh-focus-planRow"><div class="rh-focus-planLeft"><div class="rh-focus-planDot">+</div><div><div class="rh-focus-planTitle">No task added yet</div><span class="rh-focus-planSub">Aaj kya karna hai yaha add karo</span></div></div></div>'}</div></div>`;
  bindPlannerActions(section, body);
}

function renderApp(section){
  const shell = ensureShell(section); if(!shell) return;
  shell.querySelector('#rh-focus-vip-subject').textContent = `${selectedSubject(section)} • ${todayLabel()}`;
  shell.querySelector('#rh-focus-vip-timer').textContent = currentTimerText(section);
  shell.querySelector('#rh-focus-top-clock').textContent = liveClock();
  shell.querySelectorAll('[data-rh-focus-tab]').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-rh-focus-tab') === appState.activeTab));
  const body = shell.querySelector('#rh-focus-body'); if(!body) return;
  if(appState.activeTab === 'books') renderBooksTab(section, body);
  else if(appState.activeTab === 'insights') renderInsightsTab(body);
  else if(appState.activeTab === 'planner') renderPlannerTab(section, body);
  else renderTimerTab(section, body);
}

async function loadData(section){
  appState.dailyGoal = getTodayStudy(section) || appState.dailyGoal;
  if(appState.loading) return;
  const client = db(); if(!client || !uid()) { renderApp(section); return; }
  appState.loading = true;
  try{
    const [boardRes, statusRes] = await Promise.all([client.rpc('get_ypt_focus_leaderboard',{ p_limit: 12 }),client.rpc('get_focus_avatar_status')]);
    const rows = Array.isArray(boardRes?.data) ? boardRes.data : [];
    const mine = rows.find(x => String(x.user_id) === uid());
    const raw = Array.isArray(statusRes?.data) ? statusRes.data[0] : (statusRes?.data || {});
    const totalSeconds = Number(raw.total_seconds || 0);
    const avatars = Array.isArray(raw.avatars) ? raw.avatars : [];
    const next = avatars.find(x => !x.unlocked);
    appState.rank = mine ? `#${mine.rank}` : '—';
    appState.focus3day = fmtShort(totalSeconds);
    appState.nextText = next ? `Next unlock • ${Number(next.target_hours || 0)}h target` : 'All VIP avatars unlocked';
    appState.members = rows.map((r,i) => normalizeMember({ name:r.name || 'Aspirant', total_seconds:Number(r.total_seconds || 0) }, i));
  }catch(e){ console.warn('focus vip load skipped', e); }
  finally{ appState.loading = false; renderApp(section); }
}

function boot(){
  ensureStyle();
  const section = findSection();
  if(!section) return;
  premiumizeSidebar();
  ensureSourceHost(section);
  ensureShell(section);
  renderApp(section);
  loadData(section);
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 900), { once:true }); else setTimeout(boot, 300);
setInterval(() => { if(document.visibilityState !== 'hidden') boot(); }, 2500);
setInterval(() => {
  const shell = document.getElementById('rh-focus-shell');
  if(!shell) return;
  const section = findSection();
  shell.querySelector('#rh-focus-top-clock') && (shell.querySelector('#rh-focus-top-clock').textContent = liveClock());
  const clockCard = document.getElementById('rh-focus-clock-card'); if(clockCard) clockCard.textContent = liveClock();
  const live = document.getElementById('rh-focus-live-clock'); if(live) live.textContent = liveClock();
  if(section){ shell.querySelector('#rh-focus-vip-timer') && (shell.querySelector('#rh-focus-vip-timer').textContent = currentTimerText(section)); shell.querySelector('#rh-focus-vip-subject') && (shell.querySelector('#rh-focus-vip-subject').textContent = `${selectedSubject(section)} • ${todayLabel()}`); }
}, 1000);
})();
