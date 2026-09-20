/* Loader keeps the existing Telegram Score module intact and loads the latest layout, songs, study and web monetization modules. */
(()=>{
'use strict';
if(window.__RH_TG_SCORE_LOADER__)return;
window.__RH_TG_SCORE_LOADER__=1;
const add=(id,src)=>{if(document.getElementById(id))return;const script=document.createElement('script');script.id=id;script.src=src;script.defer=true;document.head.appendChild(script)};
const ensureFocusScripts=()=>{
  add('rh-ypt-focus-script','rathod-ypt-focus.js?v=6');
  add('rh-focus-premium-direct-script','rathod-focus-premium-timer.js?v=18');
};
const extras=()=>{
  add('rh-auth-recovery-fix-script','rathod-auth-recovery-fix.js?v=2');
  add('rh-mobile-polish-script','rathod-mobile-polish.js?v=2');
  add('rh-archive-icon-fix-script','rathod-archive-icon-fix.js?v=6');
  add('rh-master-control-script','rathod-master-control.js?v=8');
  add('rh-song-library-script','rathod-song-library.js?v=8');
  add('rh-song-layout-fix-script','rathod-song-layout-fix.js?v=8');
  add('rh-mentor-room-script','rathod-mentor-room.js?v=8');
  add('rh-study-room-fix-script','rathod-study-room-fix.js?v=6');
  add('rh-study-ecosystem-script','rathod-study-ecosystem.js?v=3');
  ensureFocusScripts();
  add('rh-archive-layout-fix-script','rathod-archive-layout-fix.js?v=2');
  add('rh-adsense-verify-script','adsense-verify.js?v=1');
};
const core=document.createElement('script');core.id='rh-telegram-score-core';core.src='https://cdn.jsdelivr.net/gh/teachnlogy7509-pixel/RATHOD-HUB@ec7e12a007ff5409dca377912113c3abd38ab676/telegram-score.js';core.onload=extras;core.onerror=extras;core.defer=true;document.head.appendChild(core);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureFocusScripts,{once:true});else setTimeout(ensureFocusScripts,0);
setInterval(ensureFocusScripts,2500);
})();
