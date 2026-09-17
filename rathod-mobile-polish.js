/* RATHOD HUB update checker only. No navigation or new feature is added here. */
(()=>{
'use strict';
if(window.__RH_MOBILE_POLISH__)return;
window.__RH_MOBILE_POLISH__=1;
const $=id=>document.getElementById(id);
function notify(text,ok=true){try{window.toast?.(text,ok)}catch(_e){console.info(text)}}
async function forceRathodUpdate(){
  const button=$('web-update-btn');
  if(button?.dataset.rhUpdating==='1')return;
  if(button){button.dataset.rhUpdating='1';button.disabled=true;button.classList.add('animate-spin')}
  notify('Latest update check हो रहा है…');
  const stamp=Date.now();
  try{
    const checks=await Promise.allSettled([
      fetch(`./index.html?rh_update_check=${stamp}`,{cache:'no-store'}),
      fetch(`./sw.js?rh_update_check=${stamp}`,{cache:'no-store'}),
    ]);
    const reachable=checks.some(result=>result.status==='fulfilled'&&result.value?.ok);
    if(!reachable)throw new Error('Update server did not respond');
    if('serviceWorker' in navigator){
      try{
        const registrations=await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(registrations.map(registration=>registration.update()));
      }catch(error){console.info('Service worker refresh skipped',error)}
    }
    if('caches' in window){
      try{
        const keys=await caches.keys();
        await Promise.allSettled(keys.filter(key=>key.startsWith('rathod-hub-')).map(key=>caches.delete(key)));
      }catch(error){console.info('Cache cleanup skipped',error)}
    }
    notify('Update मिल गया। App reload हो रहा है…');
    const next=new URL(location.href);next.searchParams.set('android_app','1');next.searchParams.set('update',String(stamp));
    setTimeout(()=>location.replace(next.toString()),220);
  }catch(error){
    console.warn('RATHOD HUB update check failed',error);
    notify('Update server तक नहीं पहुँचा। थोड़ी देर बाद फिर try करें।',false);
    if(button){button.dataset.rhUpdating='';button.disabled=false;button.classList.remove('animate-spin')}
  }
}
window.forceRathodUpdate=forceRathodUpdate;
})();
