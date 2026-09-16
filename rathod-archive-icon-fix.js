/* RATHOD HUB archive/icon layout guard — safe to load before or after the mentor module. */
(function(){
'use strict';
function removeUnwantedNavigation(){
  ['rh-mentor-float','btn-songlibrary','btn-songlibrary-mobile','btn-songlibrary-more'].forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.remove();
  });
}
function apply(){
  removeUnwantedNavigation();
  if(document.getElementById('rh-archive-icon-fix'))return;
  var style=document.createElement('style');
  style.id='rh-archive-icon-fix';
  style.textContent=''
    +'.rh-feature-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important;flex:0 0 42px!important;line-height:1!important;margin:0 0 10px!important;overflow:hidden!important;vertical-align:top!important;box-sizing:border-box!important}'
    +'.rh-feature-icon i{display:inline-flex!important;align-items:center!important;justify-content:center!important;position:static!important;width:auto!important;height:auto!important;line-height:1!important;margin:0!important;transform:none!important}'
    +'.rh-feature-icon+b{display:block!important;clear:both!important;line-height:1.25!important}'
    +'.rh-feature-icon+b+p{display:block!important;clear:both!important;line-height:1.3!important;margin-top:4px!important}'
    +'.rh-mobile-bottom button{line-height:1.1!important;white-space:nowrap!important}'
    +'.rh-mobile-bottom button i{display:block!important;position:static!important;line-height:1!important;margin:0 0 3px!important}'
    +'.rh-mobile-bottom button span{display:block!important;line-height:1.1!important}'
    +'.rh-icon-btn{position:relative!important;overflow:visible!important}'
    +'.rh-notify-badge{z-index:2!important;pointer-events:none!important}'
    +'#rh-mentor-float,#btn-songlibrary,#btn-songlibrary-mobile,#btn-songlibrary-more{display:none!important}'
    +'@media(max-width:640px){.rh-feature-icon{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;flex-basis:36px!important;margin-bottom:8px!important}.rh-feature-icon i{font-size:15px!important}}';
  document.head.appendChild(style);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
setInterval(removeUnwantedNavigation,500);
})();
