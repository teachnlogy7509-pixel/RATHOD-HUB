/* RATHOD HUB VIP sidebar + luxury focus styling without removing features */
(function(){
'use strict';
if(window.__RH_VIP_SIDEBAR__) return;
window.__RH_VIP_SIDEBAR__ = 1;

const featureMap = {
  home:{ label:'Home', icon:'fa-solid fa-house', accent:'59,130,246' },
  ai:{ label:'AI Doubt', icon:'fa-solid fa-circle-question', accent:'168,85,247' },
  aitutor:{ label:'AI Tutor Pro', icon:'fa-solid fa-robot', accent:'14,165,233' },
  quiz:{ label:'AI Learning', icon:'fa-solid fa-wand-magic-sparkles', accent:'139,92,246' },
  battle:{ label:'Live Quiz', icon:'fa-solid fa-trophy', accent:'244,63,94' },
  neet720:{ label:'NEET 720', icon:'fa-solid fa-notes-medical', accent:'16,185,129' },
  badges:{ label:'Badge Library', icon:'fa-solid fa-medal', accent:'245,158,11' },
  dailyBattle:{ label:'Daily 9 PM', icon:'fa-solid fa-clock', accent:'251,146,60' },
  materials:{ label:'Study Material', icon:'fa-solid fa-folder-open', accent:'234,179,8' },
  aicards:{ label:'AI Notes & Formula', icon:'fa-solid fa-wand-magic-sparkles', accent:'168,85,247' },
  dailyformula:{ label:'Daily Formula', icon:'fa-solid fa-square-root-variable', accent:'56,189,248' },
  focus:{ label:'Focus Timer', icon:'fa-solid fa-stopwatch', accent:'239,68,68' },
  studypower:{ label:'Study Power', icon:'fa-solid fa-bolt', accent:'249,115,22' },
  studyrooms:{ label:'Study Rooms', icon:'fa-solid fa-door-open', accent:'99,102,241' },
  diary:{ label:'Study Diary', icon:'fa-solid fa-calendar-check', accent:'34,197,94' },
  vault:{ label:'My Vault', icon:'fa-solid fa-lock', accent:'107,114,128' },
  community:{ label:'Community', icon:'fa-solid fa-users', accent:'236,72,153' },
  chatroom:{ label:'Live Chat', icon:'fa-solid fa-comments', accent:'8,145,178' },
  stories:{ label:'Stories', icon:'fa-solid fa-circle-play', accent:'168,85,247' },
  cardbattle:{ label:'Knowledge Battle', icon:'fa-solid fa-shield-halved', accent:'225,29,72' },
  games:{ label:'Games', icon:'fa-solid fa-gamepad', accent:'14,165,233' },
  hubevents:{ label:'Live Events', icon:'fa-solid fa-bolt', accent:'251,146,60' },
  leaderboard:{ label:'Leaderboard', icon:'fa-solid fa-trophy', accent:'250,204,21' },
  treasure:{ label:'NEET Treasure Hunt', icon:'fa-solid fa-map-location-dot', accent:'34,197,94' },
  tests45:{ label:'45Q Tests', icon:'fa-solid fa-file-pen', accent:'16,185,129' },
  ncert:{ label:'NCERT', icon:'fa-solid fa-book-open', accent:'59,130,246' },
  adminpanel:{ label:'Admin Panel', icon:'fa-solid fa-shield-halved', accent:'248,113,113' },
  profile:{ label:'My Profile', icon:'fa-solid fa-user-pen', accent:'96,165,250' },
  logout:{ label:'Logout', icon:'fa-solid fa-right-from-bracket', accent:'239,68,68' }
};

function injectStyle(){
  if(document.getElementById('rh-vip-sidebar-upgrade')) return;
  const style = document.createElement('style');
  style.id = 'rh-vip-sidebar-upgrade';
  style.textContent = `
    .rh-sidebar{background:linear-gradient(180deg,rgba(7,10,14,.985),rgba(4,6,10,.97))!important;box-shadow:inset -1px 0 0 rgba(255,255,255,.06),18px 0 48px rgba(0,0,0,.34)!important}
    .rh-side-title{padding:14px 12px 10px!important;font-size:10px!important;letter-spacing:.18em!important;color:#717784!important}
    .rh-side-sep{margin:10px 12px!important;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)!important}
    .rh-sidebar .rh-nav-btn{--accent1:239,68,68;position:relative;overflow:hidden;min-height:52px!important;margin:0 6px 10px!important;padding:11px 14px!important;border-radius:18px!important;border:1px solid rgba(var(--accent1),.26)!important;background:linear-gradient(90deg,rgba(var(--accent1),.18),rgba(var(--accent1),.08) 38%,rgba(255,255,255,.03) 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 14px 30px rgba(0,0,0,.18)!important;backdrop-filter:blur(14px);transform:translateZ(0);transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease}
    .rh-sidebar .rh-nav-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.06),transparent 38%,rgba(0,0,0,.06));pointer-events:none}
    .rh-sidebar .rh-nav-btn span,.rh-sidebar .rh-nav-btn i{position:relative;z-index:1}
    .rh-sidebar .rh-nav-btn span{font-size:14px!important;letter-spacing:.01em;font-weight:800!important;text-shadow:0 1px 8px rgba(0,0,0,.24)}
    .rh-sidebar .rh-nav-btn i{width:32px!important;height:32px!important;min-width:32px!important;border-radius:12px!important;display:grid!important;place-items:center!important;flex:0 0 32px;background:linear-gradient(135deg,rgba(var(--accent1),.34),rgba(var(--accent1),.16))!important;border:1px solid rgba(255,255,255,.08)!important;color:#fff!important;box-shadow:0 10px 18px rgba(var(--accent1),.16);transition:transform .18s ease,box-shadow .18s ease}
    .rh-sidebar .rh-nav-btn:hover{transform:translateY(-1px) scale(1.01)!important;border-color:rgba(var(--accent1),.48)!important;background:linear-gradient(90deg,rgba(var(--accent1),.28),rgba(var(--accent1),.12) 46%,rgba(255,255,255,.04) 100%)!important;color:#fff!important}
    .rh-sidebar .rh-nav-btn:hover i{transform:scale(1.06);box-shadow:0 12px 24px rgba(var(--accent1),.22)}
    .rh-sidebar .rh-nav-btn.rh-active{border-color:rgba(255,95,95,.92)!important;background:linear-gradient(90deg,rgba(255,66,66,.30),rgba(255,66,66,.12) 42%,rgba(255,255,255,.04) 100%)!important;box-shadow:inset 0 0 0 1px rgba(255,79,79,.20),0 0 0 1px rgba(255,79,79,.14),0 18px 34px rgba(239,43,43,.12)!important}
    .rh-sidebar .rh-nav-btn.rh-active i{background:linear-gradient(135deg,#ff5836,#ef2b2b)!important;box-shadow:0 12px 24px rgba(239,43,43,.24)}
    .rh-mobile-drawer{background:rgba(0,0,0,.84)!important;backdrop-filter:blur(14px)!important}
    .rh-mobile-drawer .rh-vip-mobile-shell{background:linear-gradient(180deg,rgba(7,10,14,.985),rgba(4,6,10,.97))!important;border:1px solid rgba(255,255,255,.10)!important;box-shadow:0 30px 80px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06)!important}
    .rh-mobile-drawer .rh-vip-mobile-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.08)!important}
    .rh-mobile-drawer .rh-vip-mobile-title{font-size:16px!important;font-weight:900!important;color:#fff!important}
    .rh-mobile-drawer .rh-vip-mobile-sub{font-size:10px!important;letter-spacing:.18em!important;text-transform:uppercase!important;color:#868da0!important;margin-top:4px!important}
    .rh-mobile-drawer .rh-vip-mobile-close{width:36px;height:36px;border-radius:12px;background:rgba(255,255,255,.06)!important;border:1px solid rgba(255,255,255,.10)!important;color:#fff!important}
    .rh-mobile-drawer .rh-vip-mobile-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important}
    .rh-mobile-drawer .rh-vip-mobile-card{--accent1:239,68,68;position:relative;overflow:hidden;min-height:94px!important;padding:12px 8px!important;border-radius:18px!important;border:1px solid rgba(var(--accent1),.28)!important;background:linear-gradient(180deg,rgba(var(--accent1),.18),rgba(255,255,255,.03) 76%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 12px 22px rgba(0,0,0,.18)!important;color:#fff!important;transition:transform .18s ease,border-color .18s ease}
    .rh-mobile-drawer .rh-vip-mobile-card::before{content:'';position:absolute;inset:0;background:linear-gradient(145deg,rgba(255,255,255,.08),transparent 42%,rgba(0,0,0,.10));pointer-events:none}
    .rh-mobile-drawer .rh-vip-mobile-card i,.rh-mobile-drawer .rh-vip-mobile-card span{position:relative;z-index:1}
    .rh-mobile-drawer .rh-vip-mobile-card i{width:42px;height:42px;border-radius:14px;display:grid!important;place-items:center!important;margin:0 auto 8px auto!important;background:linear-gradient(135deg,rgba(var(--accent1),.38),rgba(var(--accent1),.16))!important;border:1px solid rgba(255,255,255,.08)!important;color:#fff!important;box-shadow:0 10px 18px rgba(var(--accent1),.16)!important;font-size:18px!important}
    .rh-mobile-drawer .rh-vip-mobile-card span{font-size:11px!important;line-height:1.25!important;font-weight:800!important;display:block!important}
    .rh-mobile-drawer .rh-vip-mobile-card:active{transform:scale(.97)!important}
    #section-focus .rh-focus-shell{border-color:rgba(243,211,125,.22)!important;box-shadow:0 26px 70px rgba(0,0,0,.34)!important}
    #section-focus .rh-focus-vipBar{background:linear-gradient(135deg,#17120d 0%,#3c2c14 38%,#7b5a22 68%,#d5a646 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 18px 48px rgba(212,166,77,.16)!important}
    #section-focus .rh-focus-gold-chip{border-color:rgba(243,211,125,.28)!important;background:linear-gradient(90deg,rgba(243,211,125,.16),rgba(255,255,255,.04))!important;color:#f7e1a1!important}
    #section-focus .rh-focus-gold-title,#section-focus .rh-focus-sourceTimer .text-red-500,#section-focus .rh-focus-sourceTimer [class*='text-red'],#section-focus [class*='text-red-500'],#section-focus [class*='text-red-4'],#section-focus [class*='text-red-6']{color:#f4c95d!important;text-shadow:0 0 20px rgba(244,201,93,.18)!important}
    #section-focus .rh-focus-sourceTimer,#section-focus .rh-focus-sourceControl,#section-focus .rh-focus-panel,#section-focus .rh-focus-bookCard,#section-focus .rh-focus-mini,#section-focus .rh-focus-member,#section-focus .rh-focus-planRow{border-color:rgba(243,211,125,.18)!important;background:linear-gradient(180deg,rgba(19,16,12,.96),rgba(10,9,8,.96))!important;box-shadow:0 18px 42px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04)!important}
    #section-focus .rh-focus-panelOrange{background:radial-gradient(circle at top,rgba(212,166,77,.12),transparent 34%),linear-gradient(180deg,#14110d,#111827)!important;border-color:rgba(243,211,125,.22)!important}
    #section-focus .rh-focus-startBtn,#section-focus .rh-focus-bookStart,#section-focus button[class*='bg-red-'],#section-focus .rh-focus-plannerInput button{background:linear-gradient(90deg,#b98a2f,#f2c55d)!important;color:#23180a!important;border:1px solid rgba(255,235,180,.18)!important;box-shadow:0 12px 28px rgba(242,197,93,.20)!important}
    #section-focus .rh-focus-softBtn,#section-focus .rh-focus-inlineBtn,#section-focus .rh-focus-taskChip,#section-focus .rh-focus-tab{background:rgba(255,240,200,.06)!important;border:1px solid rgba(243,211,125,.18)!important;color:#f8e7be!important}
    #section-focus .rh-focus-tab.active{background:linear-gradient(90deg,rgba(212,166,77,.30),rgba(242,197,93,.18))!important;border-color:rgba(243,211,125,.30)!important}
    #section-focus .rh-focus-graphBar{background:linear-gradient(90deg,#b98a2f,#f2c55d)!important;box-shadow:0 0 16px rgba(242,197,93,.20)!important}
    #section-focus .rh-focus-member span,#section-focus .rh-focus-graphValue,#section-focus .rh-focus-bookTime,#section-focus .rh-focus-miniLabel,#section-focus .rh-focus-topClock{color:#f7ddb0!important}
    #section-focus div[class*='rounded-3xl'][class*='border'],#section-focus div[class*='rounded-2xl'][class*='border']{border-color:rgba(243,211,125,.14)!important;background:linear-gradient(180deg,rgba(17,15,12,.92),rgba(10,10,10,.94))!important;box-shadow:0 16px 36px rgba(0,0,0,.24)!important}
    #section-focus [class*='border-purple-'],#section-focus [class*='bg-purple-']{border-color:rgba(243,211,125,.20)!important;background:linear-gradient(180deg,rgba(63,45,18,.28),rgba(255,255,255,.03))!important}
    @media (max-width:900px){.rh-sidebar .rh-nav-btn{padding:11px 8px!important;margin:0 0 10px!important;min-height:50px!important}.rh-sidebar .rh-nav-btn i{width:34px!important;height:34px!important;min-width:34px!important;margin:0 auto!important}.rh-sidebar{padding:14px 8px!important}.rh-side-sep{margin:8px 6px!important}}
    @media (max-width:640px){.rh-mobile-drawer .rh-vip-mobile-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.rh-mobile-drawer .rh-vip-mobile-card{min-height:88px!important;padding:11px 7px!important}.rh-mobile-drawer .rh-vip-mobile-card span{font-size:10px!important}}
  `;
  document.head.appendChild(style);
}

function setButtonTheme(button, key){
  const meta = featureMap[key];
  if(!button || !meta) return;
  const icon = button.querySelector('i');
  const label = button.querySelector('span');
  button.style.setProperty('--accent1', meta.accent);
  if(icon) icon.className = meta.icon;
  if(label) label.textContent = meta.label;
}

function upgradeSidebar(){
  const mappings = [
    ['btn-home','home'],['btn-ai','ai'],['btn-aitutor','aitutor'],['btn-quiz','quiz'],['btn-battle','battle'],['btn-neet720','neet720'],['btn-badges','badges'],['btn-daily-battle','dailyBattle'],['btn-materials','materials'],['btn-aicards','aicards'],['btn-dailyformula','dailyformula'],['btn-focus','focus'],['btn-studypower','studypower'],['btn-studyrooms','studyrooms'],['btn-diary','diary'],['btn-vault','vault'],['btn-community','community'],['btn-chatroom','chatroom'],['btn-stories','stories'],['btn-cardbattle','cardbattle'],['btn-games','games'],['btn-hubevents','hubevents'],['btn-leaderboard','leaderboard'],['btn-treasure','treasure'],['btn-adminpanel','adminpanel']
  ];
  mappings.forEach(([id,key]) => setButtonTheme(document.getElementById(id), key));
  document.querySelectorAll('.rh-sidebar button[onclick="openProfile()"]').forEach(btn => setButtonTheme(btn,'profile'));
  document.querySelectorAll('.rh-sidebar button[onclick="logout()"]').forEach(btn => setButtonTheme(btn,'logout'));
}

function upgradeMobileDrawer(){
  const drawer = document.getElementById('mobile-menu-drawer');
  if(!drawer) return;
  const shell = drawer.firstElementChild;
  if(shell){
    shell.classList.add('rh-vip-mobile-shell');
    const head = shell.querySelector('.flex.justify-between.items-center');
    if(head){
      head.classList.add('rh-vip-mobile-head');
      const title = head.querySelector('b');
      const close = head.querySelector('button');
      if(title){
        title.className = 'rh-vip-mobile-title';
        title.innerHTML = 'All Features & Modules<div class="rh-vip-mobile-sub">VIP Edition • original names retained</div>';
      }
      if(close) close.className = 'rh-vip-mobile-close';
    }
    const grid = shell.querySelector('.grid');
    if(grid) grid.classList.add('rh-vip-mobile-grid');
  }
  const mapByMatcher = [
    ['switchTab(\'ai\')','ai'],['switchTab(\'aitutor\')','aitutor'],['switchTab(\'quiz\')','quiz'],['switchTab(\'battle\')','battle'],['switchTab(\'neet720\')','neet720'],['switchTab(\'badges\')','badges'],['openDailyBattle()','dailyBattle'],['switchTab(\'materials\')','materials'],['switchTab(\'aicards\')','aicards'],['switchTab(\'dailyformula\')','dailyformula'],['switchTab(\'focus\')','focus'],['switchTab(\'studypower\')','studypower'],['switchTab(\'studyrooms\')','studyrooms'],['switchTab(\'diary\')','diary'],['switchTab(\'vault\')','vault'],['switchTab(\'community\')','community'],['switchTab(\'chatroom\')','chatroom'],['switchTab(\'stories\')','stories'],['switchTab(\'cardbattle\')','cardbattle'],['switchTab(\'games\')','games'],['switchTab(\'hubevents\')','hubevents'],['switchTab(\'leaderboard\')','leaderboard'],['openLiveQuizSection(\'live-45q-panel\')','tests45'],['switchTab(\'treasure\')','treasure'],['ncert.nic.in','ncert'],['switchTab(\'adminpanel\')','adminpanel'],['openProfile()','profile'],['logout()','logout']
  ];
  mapByMatcher.forEach(([matcher,key]) => {
    drawer.querySelectorAll(`button[onclick*="${matcher}"], a[href*="${matcher}"]`).forEach(btn => {
      const meta = featureMap[key];
      if(!meta) return;
      btn.classList.add('rh-vip-mobile-card');
      btn.style.setProperty('--accent1', meta.accent);
      const icon = btn.querySelector('i');
      const label = btn.querySelector('span');
      if(icon) icon.className = meta.icon;
      if(label) label.textContent = meta.label;
    });
  });
}

function polishFocusSection(){
  const section = document.getElementById('section-focus');
  if(!section) return;
  Array.from(section.querySelectorAll('div')).forEach(el => {
    const txt = (el.innerText || '').trim();
    const cls = String(el.className || '');
    if(/Who's Studying\?|Last 7 Days|Achievements/i.test(txt) && /rounded/.test(cls)) el.classList.add('rh-focus-luxe-card');
    if(/UNLOCKED/i.test(txt) && /rounded/.test(cls)) el.classList.add('rh-focus-luxe-card');
  });
}

function run(){
  injectStyle();
  upgradeSidebar();
  upgradeMobileDrawer();
  polishFocusSection();
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once:true });
else setTimeout(run, 0);
new MutationObserver(() => setTimeout(run, 40)).observe(document.documentElement,{childList:true,subtree:true});
setInterval(run, 1500);
})();
