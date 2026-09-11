(function(){
'use strict';
const PACK='club-world.html',VERSION='club-v1',KEY='rh_club_installed_v1',AGE='rh_club_age_ok';
const $=id=>document.getElementById(id);
function toastMsg(t,ok=true){if(window.toast)return window.toast(t,ok);alert(t)}
function ageOpen(){$('club-age-modal')?.classList.remove('hidden')}
function ageClose(){$('club-age-modal')?.classList.add('hidden')}
async function installAndOpen(){
  const btn=$('club-install-btn'),bar=$('club-progress-bar'),text=$('club-progress-text');
  try{
    if(btn){btn.disabled=true;btn.textContent='Preparing Club…'}
    $('club-progress')?.classList.remove('hidden');
    const res=await fetch(PACK+'?v='+encodeURIComponent(VERSION),{cache:'reload'});if(!res.ok)throw new Error('Club download failed');
    const total=Number(res.headers.get('content-length')||0);let loaded=0,blob;
    if(res.body&&total){const reader=res.body.getReader(),parts=[];while(true){const x=await reader.read();if(x.done)break;parts.push(x.value);loaded+=x.value.length;const pct=Math.min(100,Math.round(loaded/total*100));if(bar)bar.style.width=pct+'%';if(text)text.textContent=pct+'% downloaded'}blob=new Blob(parts,{type:'text/html'})}else{blob=await res.blob();if(bar)bar.style.width='100%';if(text)text.textContent='Download complete'}
    try{const cache=await caches.open('rathod-club-v1');await cache.put(PACK,new Response(blob,{headers:{'Content-Type':'text/html'}}))}catch(e){}
    localStorage.setItem(KEY,'1');updateCard();openFrame();
  }catch(e){toastMsg(e.message||'Club download failed',false)}finally{if(btn){btn.disabled=false;btn.textContent=localStorage.getItem(KEY)?'ENTER CLUB →':'DOWNLOAD & ENTER →'}}
}
function requestOpen(){if(localStorage.getItem(AGE)==='1')return installAndOpen();ageOpen()}
function confirmAge(){localStorage.setItem(AGE,'1');ageClose();installAndOpen()}
function openFrame(){const shell=$('club-frame-shell'),frame=$('club-frame');if(!shell||!frame)return;frame.src=PACK+'?v='+encodeURIComponent(VERSION);shell.classList.remove('hidden');document.body.style.overflow='hidden'}
function closeFrame(){const shell=$('club-frame-shell'),frame=$('club-frame');if(shell)shell.classList.add('hidden');if(frame)frame.src='about:blank';document.body.style.overflow=''}
async function removePack(){if(!confirm('Downloaded Club data delete करें?'))return;localStorage.removeItem(KEY);try{await caches.delete('rathod-club-v1')}catch(e){}updateCard();toastMsg('Club download removed')}
function updateCard(){const installed=localStorage.getItem(KEY)==='1',b=$('club-install-btn'),s=$('club-pack-status');if(b)b.textContent=installed?'ENTER CLUB →':'DOWNLOAD & ENTER →';if(s)s.textContent=installed?'✓ Club installed • tap to enter':'Optional download • base app size पर असर नहीं'}
window.clubRequestOpen=requestOpen;window.clubConfirmAge=confirmAge;window.clubAgeClose=ageClose;window.clubClose=closeFrame;window.clubRemovePack=removePack;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',updateCard);else updateCard();
})();
