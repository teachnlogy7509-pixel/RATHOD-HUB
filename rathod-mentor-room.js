/* RATHOD HUB • 1.1 Mentor — free 1-to-1 voice/video room */
(function(){
'use strict';
if(window.__RH_MENTOR_ROOM__)return;window.__RH_MENTOR_ROOM__=1;
const DOMAIN='meet.jit.si',ROOM_PREFIX='RATHOD_HUB_11_MENTOR_';
let meeting=null,openRoom='';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function identity(){return String(window.user?.id||'guest').replace(/[^a-zA-Z0-9]/g,'').slice(0,28)||'guest'}
function getRoom(){
  try{
    const url=new URL(location.href),incoming=url.searchParams.get('mentorRoom');
    if(incoming&&new RegExp('^'+ROOM_PREFIX+'[A-Z0-9_-]{3,80}$','i').test(incoming)){
      localStorage.setItem('rh_mentor_room',incoming.toUpperCase());
      return incoming.toUpperCase();
    }
    const saved=localStorage.getItem('rh_mentor_room');
    if(saved&&saved.startsWith(ROOM_PREFIX))return saved;
  }catch(_e){}
  const room=ROOM_PREFIX+identity().toUpperCase();
  try{localStorage.setItem('rh_mentor_room',room)}catch(_e){}
  return room;
}
function inviteUrl(room){const url=new URL(location.href);url.searchParams.set('mentorRoom',room);return url.toString()}
function displayName(){return String(window.profile?.name||window.user?.email?.split('@')[0]||'Student').slice(0,60)}
function findStudyHost(){
  const ids=['section-studyrooms','section-study-room','section-study','study-rooms','study-room','section-focus'];
  for(const id of ids){const el=$(id);if(el)return el}
  const candidates=[...document.querySelectorAll('section,main,[role="main"]')].filter(el=>/study\s*rooms?/i.test(String(el.innerText||'').slice(0,2500)));
  return candidates.sort((a,b)=>a.innerText.length-b.innerText.length)[0]||null;
}
function installIconFix(){
  if(document.getElementById('rh-archive-icon-fix'))return;
  const style=document.createElement('style');style.id='rh-archive-icon-fix';style.textContent=`
    .rh-feature-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important;flex:0 0 42px!important;line-height:1!important;margin:0 0 10px!important;overflow:hidden!important;vertical-align:top!important;box-sizing:border-box!important}
    .rh-feature-icon i{display:inline-flex!important;align-items:center!important;justify-content:center!important;position:static!important;width:auto!important;height:auto!important;line-height:1!important;margin:0!important;transform:none!important}
    .rh-feature-icon+b{display:block!important;clear:both!important;line-height:1.25!important}
    .rh-feature-icon+b+p{display:block!important;clear:both!important;line-height:1.3!important;margin-top:4px!important}
    .rh-mobile-bottom button{line-height:1.1!important;white-space:nowrap!important}
    .rh-mobile-bottom button i{display:block!important;position:static!important;line-height:1!important;margin:0 0 3px!important}
    .rh-mobile-bottom button span{display:block!important;line-height:1.1!important}
    .rh-icon-btn{position:relative!important;overflow:visible!important}
    .rh-notify-badge{z-index:2!important;pointer-events:none!important}
    @media(max-width:640px){.rh-feature-icon{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;flex-basis:36px!important;margin-bottom:8px!important}.rh-feature-icon i{font-size:15px!important}}
  `;document.head.appendChild(style);
}
function createMentorCard(){
  if($('rh-mentor-card'))return;
  const card=document.createElement('div');card.id='rh-mentor-card';card.className='mb-4 rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-950/70 via-slate-950 to-violet-950/70 p-5 shadow-2xl';
  card.innerHTML='<div class="flex flex-wrap items-start justify-between gap-3"><div><div class="text-[10px] font-black tracking-[.2em] text-cyan-300">STUDY ROOM • SPECIAL ROOM</div><h3 class="mt-1 text-xl font-black text-white">1.1 Mentor</h3><p class="mt-2 text-xs leading-5 text-slate-300">अलग 1-to-1 room — free Voice और optional Video. अधिकतम 2 लोग। PC में mic/camera न हो तो भी बिना device के join करके आवाज़ सुन सकते हैं।</p></div><div class="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-[10px] font-black text-cyan-200">🎙️ 1V1</div></div><div class="mt-4 flex flex-wrap gap-2"><button type="button" data-rh-mentor-open class="rounded-2xl bg-cyan-600 px-4 py-3 text-xs font-black text-white">Open 1.1 Mentor</button><button type="button" data-rh-mentor-copy class="rounded-2xl border border-slate-600 bg-slate-900/70 px-4 py-3 text-xs font-black text-slate-200">Copy invite link</button></div><p class="mt-3 text-[10px] text-slate-500">Jitsi public free service: call link केवल trusted person के साथ share करें।</p>';
  const host=findStudyHost();if(host)host.prepend(card);else{card.classList.add('fixed','bottom-20','left-3','right-3','z-[9998]','mx-auto','max-w-xl');document.body.appendChild(card)}
  card.querySelector('[data-rh-mentor-open]').onclick=open;
  card.querySelector('[data-rh-mentor-copy]').onclick=copyInvite;
}
function createFloatingIcon(){
  if($('rh-mentor-float'))return;
  const b=document.createElement('button');b.id='rh-mentor-float';b.type='button';b.title='1.1 Mentor — 1-to-1 Voice/Video';b.setAttribute('aria-label','Open 1.1 Mentor');b.className='fixed bottom-4 right-4 z-[10000] flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-600 px-4 py-3 text-xs font-black text-white shadow-2xl';b.innerHTML='🎙️ <span>1.1 Mentor</span>';b.onclick=open;document.body.appendChild(b)
}
async function copyInvite(){
 const url=inviteUrl(getRoom());
 try{await navigator.clipboard.writeText(url);window.toast?.('1.1 Mentor invite link copied ✓')}catch(_e){const area=document.createElement('textarea');area.value=url;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();window.toast?.('Invite link copied ✓')}
}
function loadJitsi(){return new Promise((resolve,reject)=>{if(window.JitsiMeetExternalAPI)return resolve();const old=$('rh-jitsi-api');if(old){old.addEventListener('load',()=>resolve(),{once:true});old.addEventListener('error',()=>reject(new Error('Jitsi script load failed')),{once:true});return}const script=document.createElement('script');script.id='rh-jitsi-api';script.src='https://meet.jit.si/external_api.js';script.async=true;script.onload=()=>resolve();script.onerror=()=>reject(new Error('Free calling service load नहीं हुआ'));document.head.appendChild(script)})}
function close(){try{meeting?.dispose()}catch(_e){}meeting=null;$('rh-mentor-modal')?.remove()}
function open(){
 if($('rh-mentor-modal'))return;
 openRoom=getRoom();
 const overlay=document.createElement('div');overlay.id='rh-mentor-modal';overlay.className='fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 p-3';overlay.innerHTML='<div class="w-full max-w-3xl overflow-hidden rounded-3xl border border-cyan-400/30 bg-slate-950 shadow-2xl"><div class="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3"><div><b class="text-base text-white">🎙️ 1.1 Mentor</b><p class="text-[10px] text-slate-400">Free private 1-to-1 Voice / Video • अधिकतम 2 लोग</p></div><button type="button" data-rh-mentor-close class="rounded-xl px-3 py-2 text-lg text-slate-300">×</button></div><div class="flex flex-wrap items-center gap-2 border-b border-slate-800 px-4 py-3"><button type="button" data-rh-mentor-copy class="rounded-xl bg-cyan-600 px-3 py-2 text-[10px] font-black text-white">Copy invite link</button><span class="text-[10px] text-slate-500">Phone वाला इस link से join करे। PC पर mic/camera off रखकर भी आवाज़ सुन सकते हैं।</span></div><div id="rh-mentor-status" class="px-4 py-2 text-[10px] text-amber-300">Calling service तैयार हो रही है…</div><div id="rh-mentor-jitsi" class="min-h-[420px] bg-black"></div></div>';
 document.body.appendChild(overlay);overlay.querySelector('[data-rh-mentor-close]').onclick=close;overlay.querySelector('[data-rh-mentor-copy]').onclick=copyInvite;overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 loadJitsi().then(()=>{
  if(!window.JitsiMeetExternalAPI)throw new Error('Calling API unavailable');
  const mount=$('rh-mentor-jitsi');
  meeting=new window.JitsiMeetExternalAPI(DOMAIN,{roomName:openRoom,parentNode:mount,width:'100%',height:420,userInfo:{displayName:displayName()},configOverwrite:{prejoinPageEnabled:true,disableDeepLinking:true,startWithAudioMuted:false,startWithVideoMuted:false,maxParticipants:2},interfaceConfigOverwrite:{TOOLBAR_BUTTONS:['microphone','camera','hangup','fullscreen','chat','tileview','settings']}});
  meeting.addEventListener('videoConferenceJoined',()=>{$('rh-mentor-status').textContent='✅ Connected — Voice/Video controls नीचे हैं';$('rh-mentor-status').className='px-4 py-2 text-[10px] text-emerald-300'});
  meeting.addEventListener('participantJoined',event=>{if(event?.id)window.toast?.('1.1 Mentor में दूसरा participant जुड़ गया ✓')});
  meeting.addEventListener('readyToClose',close);
 }).catch(error=>{const status=$('rh-mentor-status');if(status){status.textContent='Calling service connect नहीं हुआ। HTTPS और internet check करें।';status.className='px-4 py-2 text-[10px] text-red-300'}console.error('1.1 Mentor failed',error)})
}
function run(){installIconFix();createMentorCard();createFloatingIcon()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();new MutationObserver(()=>{clearTimeout(window.__rhMentorTimer);window.__rhMentorTimer=setTimeout(run,180)}).observe(document.documentElement,{childList:true,subtree:true});setInterval(run,2500);
window.rhMentorOpen=open;window.rhMentorClose=close;
})();
