/* RATHOD HUB mobile access + lightweight update checker. */
(()=>{
'use strict';
if(window.__RH_MOBILE_POLISH__)return;
window.__RH_MOBILE_POLISH__=1;
const $=id=>document.getElementById(id);
function notify(text,ok=true){try{window.toast?.(text,ok)}catch(_e){console.info(text)}}
function closeMenu(){try{window.closeMobileMenu?.()}catch(_e){}}
function openSongs(){
  if(typeof window.openSongLibrary==='function'){window.openSongLibrary();closeMenu();return}
  notify('Song Library load हो रही है…');
  setTimeout(()=>{if(typeof window.openSongLibrary==='function'){window.openSongLibrary();closeMenu()}},700);
}
function openMentor(){
  if(typeof window.rhMentorOpen==='function'){window.rhMentorOpen();closeMenu();return}
  notify('1.1 Mentor load हो रहा है…');
  setTimeout(()=>{if(typeof window.rhMentorOpen==='function'){window.rhMentorOpen();closeMenu()}},700);
}
function addDrawerLinks(){
  const grid=document.querySelector('#mobile-menu-drawer .grid');
  if(!grid)return;
  const items=[
    {id:'songs',icon:'🎵',label:'Song Library',action:openSongs},
    {id:'mentor',icon:'🎙️',label:'1.1 Mentor',action:openMentor},
  ];
  items.forEach(item=>{
    if(grid.querySelector(`[data-rh-mobile-feature="${item.id}"]`))return;
    const button=document.createElement('button');
    button.type='button';
    button.dataset.rhMobileFeature=item.id;
    button.className='bg-slate-800 p-3 rounded-xl flex flex-col items-center gap-2 border border-cyan-400/25';
    button.innerHTML=`<span class="text-lg">${item.icon}</span><span>${item.label}</span>`;
    button.addEventListener('click',item.action);
    grid.appendChild(button);
  });
}
function addHomeQuickFeatures(){
  const home=$('section-home');
  if(!home||home.querySelector('#rh-mobile-quick-features'))return;
  const card=document.createElement('div');
  card.id='rh-mobile-quick-features';
  card.className='rh-mobile-quick-features';
  card.innerHTML='<div><div class="text-[9px] font-black tracking-[.18em] text-cyan-300">QUICK ACCESS</div><b>Special Features</b><p>Mobile से Song Library और 1.1 Mentor सीधे खोलें।</p></div><div class="rh-mobile-quick-actions"><button type="button" data-rh-quick-song>🎵 Song Library</button><button type="button" data-rh-quick-mentor>🎙️ 1.1 Mentor</button></div>';
  home.insertBefore(card,home.firstElementChild||null);
  card.querySelector('[data-rh-quick-song]').addEventListener('click',openSongs);
  card.querySelector('[data-rh-quick-mentor]').addEventListener('click',openMentor);
}
function addStyle(){
  if($('rh-mobile-polish-style'))return;
  const style=document.createElement('style');style.id='rh-mobile-polish-style';
  style.textContent='.rh-mobile-quick-features{display:none}@media(max-width:900px){.rh-mobile-quick-features{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px;padding:14px;border:1px solid rgba(34,211,238,.24);border-radius:18px;background:linear-gradient(135deg,rgba(8,24,42,.94),rgba(34,10,54,.86));box-shadow:0 8px 22px rgba(0,0,0,.18)}.rh-mobile-quick-features b{display:block;color:#fff;font-size:14px;margin-top:3px}.rh-mobile-quick-features p{color:#94a3b8;font-size:10px;margin-top:3px;line-height:1.35}.rh-mobile-quick-actions{display:flex;flex-direction:column;gap:7px;flex:none}.rh-mobile-quick-actions button{border:1px solid rgba(255,255,255,.16);border-radius:11px;padding:8px 10px;background:rgba(255,255,255,.08);color:#fff;font-size:10px;font-weight:900;white-space:nowrap}.rh-mobile-quick-actions button:active{transform:scale(.98)}}';
  document.head.appendChild(style);
}
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
function install(){addStyle();addDrawerLinks();addHomeQuickFeatures()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
setTimeout(install,900);
})();
