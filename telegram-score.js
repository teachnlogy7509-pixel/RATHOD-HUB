/* Loader keeps the existing Telegram Score module intact and guarantees the
   archive/icon, central master-control, VIP Song Library and desktop layout modules are present. */
(()=>{
'use strict';
if(window.__RH_TG_SCORE_LOADER__)return;
window.__RH_TG_SCORE_LOADER__=1;
const add=(id,src)=>{
  if(document.getElementById(id))return;
  const s=document.createElement('script');s.id=id;s.src=src;s.defer=true;document.head.appendChild(s);
};
const extras=()=>{
  add('rh-archive-icon-fix-script','rathod-archive-icon-fix.js?v=1');
  add('rh-master-control-script','rathod-master-control.js?v=2');
  add('rh-song-library-script','rathod-song-library.js?v=2');
  add('rh-song-layout-fix-script','rathod-song-layout-fix.js?v=2');
};
const core=document.createElement('script');
core.id='rh-telegram-score-core';
core.src='https://cdn.jsdelivr.net/gh/teachnlogy7509-pixel/RATHOD-HUB@ec7e12a007ff5409dca377912113c3abd38ab676/telegram-score.js';
core.onload=extras;core.onerror=extras;core.defer=true;document.head.appendChild(core);
})();
