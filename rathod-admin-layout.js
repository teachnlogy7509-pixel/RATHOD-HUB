/* Preserves the complete previous admin layout and adds central master control. */
(function(){
'use strict';
if(window.__RH_ADMIN_LOADER__)return;window.__RH_ADMIN_LOADER__=1;
function loadMaster(){
 if(document.getElementById('rh-master-control-script'))return;
 var m=document.createElement('script');m.id='rh-master-control-script';m.src='rathod-master-control.js?v=2';m.defer=true;document.head.appendChild(m);
}
var core=document.createElement('script');
core.id='rh-admin-layout-core';
core.src='https://cdn.jsdelivr.net/gh/teachnlogy7509-pixel/RATHOD-HUB@ffb56928ddf4794c34e2adc577de92d2c1b36010/rathod-admin-layout.js';
core.onload=loadMaster;core.onerror=loadMaster;core.defer=true;document.head.appendChild(core);
})();
