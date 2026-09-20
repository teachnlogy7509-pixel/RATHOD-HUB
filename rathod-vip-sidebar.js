/* RATHOD HUB VIP premium sidebar styling without removing any feature */
(function(){
'use strict';
if(window.__RH_VIP_SIDEBAR__) return;
window.__RH_VIP_SIDEBAR__ = 1;

function injectStyle(){
  if(document.getElementById('rh-vip-sidebar-upgrade')) return;
  const style = document.createElement('style');
  style.id = 'rh-vip-sidebar-upgrade';
  style.textContent = `
    .rh-sidebar{background:linear-gradient(180deg,rgba(7,10,14,.98),rgba(4,6,10,.96))!important;box-shadow:inset -1px 0 0 rgba(255,255,255,.06),18px 0 48px rgba(0,0,0,.34)!important}
    .rh-side-title{padding:14px 12px 10px!important;font-size:10px!important;letter-spacing:.18em!important;color:#717784!important}
    .rh-side-sep{margin:10px 12px!important;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)!important}
    .rh-sidebar .rh-nav-btn{--accent1:239,68,68;position:relative;overflow:hidden;min-height:52px!important;margin:0 6px 10px!important;padding:11px 14px!important;border-radius:18px!important;border:1px solid rgba(var(--accent1),.26)!important;background:linear-gradient(90deg,rgba(var(--accent1),.18),rgba(var(--accent1),.08) 38%,rgba(255,255,255,.03) 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 14px 30px rgba(0,0,0,.18)!important;backdrop-filter:blur(14px);transform:translateZ(0)}
    .rh-sidebar .rh-nav-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.06),transparent 38%,rgba(0,0,0,.06));pointer-events:none}
    .rh-sidebar .rh-nav-btn span,.rh-sidebar .rh-nav-btn i{position:relative;z-index:1}
    .rh-sidebar .rh-nav-btn span{font-size:14px!important;letter-spacing:.01em;font-weight:800!important;text-shadow:0 1px 8px rgba(0,0,0,.24)}
    .rh-sidebar .rh-nav-btn i{width:32px!important;height:32px!important;min-width:32px!important;border-radius:12px!important;display:grid!important;place-items:center!important;flex:0 0 32px;background:linear-gradient(135deg,rgba(var(--accent1),.34),rgba(var(--accent1),.16))!important;border:1px solid rgba(255,255,255,.08)!important;color:#fff!important;box-shadow:0 10px 18px rgba(var(--accent1),.16);transition:transform .18s ease,box-shadow .18s ease}
    .rh-sidebar .rh-nav-btn:hover{transform:translateY(-1px) scale(1.01)!important;border-color:rgba(var(--accent1),.48)!important;background:linear-gradient(90deg,rgba(var(--accent1),.28),rgba(var(--accent1),.12) 46%,rgba(255,255,255,.04) 100%)!important;color:#fff!important}
    .rh-sidebar .rh-nav-btn:hover i{transform:scale(1.06);box-shadow:0 12px 24px rgba(var(--accent1),.22)}
    .rh-sidebar .rh-nav-btn.rh-active{border-color:rgba(255,95,95,.92)!important;background:linear-gradient(90deg,rgba(255,66,66,.30),rgba(255,66,66,.12) 42%,rgba(255,255,255,.04) 100%)!important;box-shadow:inset 0 0 0 1px rgba(255,79,79,.20),0 0 0 1px rgba(255,79,79,.14),0 18px 34px rgba(239,43,43,.12)!important}
    .rh-sidebar .rh-nav-btn.rh-active i{background:linear-gradient(135deg,#ff5836,#ef2b2b)!important;box-shadow:0 12px 24px rgba(239,43,43,.24)}
    #btn-home{--accent1:59,130,246}#btn-ai{--accent1:168,85,247}#btn-aitutor{--accent1:14,165,233}#btn-quiz{--accent1:139,92,246}#btn-battle{--accent1:244,63,94}#btn-neet720{--accent1:16,185,129}#btn-badges{--accent1:245,158,11}#btn-daily-battle{--accent1:251,146,60}#btn-materials{--accent1:234,179,8}#btn-aicards{--accent1:168,85,247}#btn-dailyformula{--accent1:56,189,248}#btn-focus{--accent1:239,68,68}#btn-studypower{--accent1:249,115,22}#btn-studyrooms{--accent1:99,102,241}#btn-diary{--accent1:34,197,94}#btn-vault{--accent1:107,114,128}#btn-community{--accent1:236,72,153}#btn-chatroom{--accent1:8,145,178}#btn-stories{--accent1:168,85,247}#btn-cardbattle{--accent1:225,29,72}#btn-games{--accent1:14,165,233}#btn-hubevents{--accent1:251,146,60}#btn-leaderboard{--accent1:250,204,21}#btn-treasure{--accent1:34,197,94}#btn-rathodnew{--accent1:217,70,239}#btn-adminpanel{--accent1:248,113,113}
    .rh-sidebar button[onclick="openProfile()"]{--accent1:96,165,250}.rh-sidebar button[onclick="logout()"]{--accent1:239,68,68}
    @media (max-width:900px){.rh-sidebar .rh-nav-btn{padding:11px 8px!important;margin:0 0 10px!important;min-height:50px!important}.rh-sidebar .rh-nav-btn i{width:34px!important;height:34px!important;min-width:34px!important;margin:0 auto!important}.rh-sidebar{padding:14px 8px!important}.rh-side-sep{margin:8px 6px!important}}
  `;
  document.head.appendChild(style);
}

function run(){
  injectStyle();
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once:true });
else setTimeout(run, 0);
setInterval(run, 1500);
})();
