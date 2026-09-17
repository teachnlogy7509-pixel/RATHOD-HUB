/* Loader keeps the existing Telegram Score module intact and loads the latest layout, songs and 1.1 Mentor fixes. */
(()=>{
'use strict';
if(window.__RH_TG_SCORE_LOADER__)return;
window.__RH_TG_SCORE_LOADER__=1;
const add=(id,src)=>{if(document.getElementById(id))return;const script=document.createElement('script');script.id=id;script.src=src;script.defer=true;document.head.appendChild(script)};
const extras=()=>{
  add('rh-auth-recovery-fix-script','rathod-auth-recovery-fix.js?v=2');
  add('rh-mobile-polish-script','rathod-mobile-polish.js?v=2');
  add('rh-archive-icon-fix-script','rathod-archive-icon-fix.js?v=6');
  add('rh-master-control-script','rathod-master-control.js?v=8');
  add('rh-song-library-script','rathod-song-library.js?v=8');
  add('rh-song-layout-fix-script','rathod-song-layout-fix.js?v=8');
  add('rh-mentor-room-script','rathod-mentor-room.js?v=7');
  add('rh-study-room-fix-script','rathod-study-room-fix.js?v=6');
};
const core=document.createElement('script');core.id='rh-telegram-score-core';core.src='https://cdn.jsdelivr.net/gh/teachnlogy7509-pixel/RATHOD-HUB@ec7e12a007ff5409dca377912113c3abd38ab676/telegram-score.js';core.onload=extras;core.onerror=extras;core.defer=true;document.head.appendChild(core);
})();
