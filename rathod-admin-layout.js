/* Preserves the complete previous admin layout and loads the current control/layout guards. */
(function(){
'use strict';
if(window.__RH_ADMIN_LOADER__)return;window.__RH_ADMIN_LOADER__=1;
function addScript(id,src){
  if(document.getElementById(id))return;
  var script=document.createElement('script');script.id=id;script.src=src;script.defer=true;document.head.appendChild(script);
}
function loadMaster(){
  addScript('rh-archive-icon-fix-script','rathod-archive-icon-fix.js?v=3');
  addScript('rh-master-control-script','rathod-master-control.js?v=5');
}
var core=document.createElement('script');
core.id='rh-admin-layout-core';
core.src='https://cdn.jsdelivr.net/gh/teachnlogy7509-pixel/RATHOD-HUB@ffb56928ddf4794c34e2adc577de92d2c1b36010/rathod-admin-layout.js';
core.onload=loadMaster;core.onerror=loadMaster;core.defer=true;document.head.appendChild(core);
})();
