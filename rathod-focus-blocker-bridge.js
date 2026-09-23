/* RATHOD HUB native Focus Shield synchronizer.
   Keeps the Android Accessibility blocker aligned with the live web focus timer. */
(()=>{
'use strict';
if(window.__RH_NATIVE_FOCUS_SYNC_V2__)return;
window.__RH_NATIVE_FOCUS_SYNC_V2__=1;
let nativeActive=false;
let lastMinute=-1;

function bridgeReady(){return typeof window.AndroidFocus!=='undefined'}
function remainingSeconds(){
  try{
    if(typeof window.focusRemaining==='function')return Math.max(0,Number(window.focusRemaining())||0);
  }catch(_e){}
  return 0;
}
function timerIsRunning(){
  try{
    const state=window.focusState;
    return !!(state&&state.status==='running'&&!state.break&&remainingSeconds()>0);
  }catch(_e){return false}
}
function syncNativeFocus(force=false){
  if(!bridgeReady())return;
  const running=timerIsRunning();
  if(running){
    const minutes=Math.max(1,Math.ceil(remainingSeconds()/60));
    if(force||!nativeActive||minutes!==lastMinute){
      try{window.AndroidFocus.startFocus(minutes);nativeActive=true;lastMinute=minutes}catch(e){console.warn('Focus Shield start failed',e)}
    }
  }else if(nativeActive||force){
    try{window.AndroidFocus.stopFocus()}catch(e){console.warn('Focus Shield stop failed',e)}
    nativeActive=false;lastMinute=-1;
  }
}
function bindTimerButtons(){
  document.addEventListener('click',event=>{
    const target=event.target?.closest?.('button,[role="button"]');
    if(!target)return;
    const action=String(target.getAttribute('onclick')||'');
    if(/startFocusTimer|pauseFocusTimer|stopFocusTimer|resetFocusTimer|completeFocusTimer/.test(action)){
      setTimeout(()=>syncNativeFocus(true),80);
      setTimeout(()=>syncNativeFocus(true),500);
    }
  },true);
}
bindTimerButtons();
document.addEventListener('visibilitychange',()=>setTimeout(()=>syncNativeFocus(true),100));
window.addEventListener('focus',()=>setTimeout(()=>syncNativeFocus(true),100));
setInterval(()=>syncNativeFocus(false),500);
setTimeout(()=>syncNativeFocus(true),700);
})();
