/* Preserves the complete previous admin layout and adds central master control. */
(function(){
'use strict';
if(window.__RH_ADMIN_LOADER__)return;window.__RH_ADMIN_LOADER__=1;
function addScript(id,src){
 if(document.getElementById(id))return;
 var s=document.createElement('script');s.id=id;s.src=src;s.defer=true;document.head.appendChild(s);
}
function loadMaster(){
 addScript('rh-archive-icon-fix-script','rathod-archive-icon-fix.js?v=1');
 addScript('rh-master-control-script','rathod-master-control.js?v=2');
}
var core=document.createElement('script');
core.id='rh-admin-layout-core';
core.src='https://cdn.jsdelivr.net/gh/teachnlogy7509-pixel/RATHOD-HUB@ffb56928ddf4794c34e2adc577de92d2c1b36010/rathod-admin-layout.js';
core.onload=loadMaster;core.onerror=loadMaster;core.defer=true;document.head.appendChild(core);
})();
