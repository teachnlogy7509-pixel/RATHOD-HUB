/* RATHOD HUB • Study Room permission, media fallback and Listen Only fix */
(function(){
'use strict';
if(window.__RH_STUDY_ROOM_FIX__)return;window.__RH_STUDY_ROOM_FIX__=1;
let patched=false;
function mediaError(e){
 if(e?.name==='NotAllowedError'||e?.name==='SecurityError')return 'Camera/Microphone blocked है। Browser/App permission settings में Allow करें।';
 if(e?.name==='NotFoundError'||e?.name==='OverconstrainedError')return 'इस device पर Camera/Microphone नहीं मिला। “Listen Only” से join करें।';
 if(e?.name==='NotReadableError'||e?.name==='AbortError')return 'Camera/Microphone किसी दूसरे app में busy है। उसे बंद करके फिर try करें।';
 return e?.message||'Live media start नहीं हुआ।';
}
function injectButtons(){
 document.querySelectorAll('[id^="room-voice-"]').forEach(deck=>{
  const key=deck.id.replace('room-voice-','');if(document.getElementById('listen-join-'+key))return;
  const grid=deck.querySelector('.grid.grid-cols-2');if(!grid)return;
  const b=document.createElement('button');b.id='listen-join-'+key;b.type='button';b.className='rounded-xl border border-emerald-400/25 bg-emerald-600 py-2.5 text-xs font-black';b.textContent='👂 Listen Only';b.onclick=()=>window.joinListenOnly(key);grid.insertBefore(b,grid.lastElementChild||null);
  const help=document.createElement('p');help.className='mt-2 text-[9px] leading-4 text-slate-500';help.textContent='PC में mic/camera न हो तब भी Listen Only से room में दिखेंगे और दूसरे students को सुन सकेंगे।';grid.after(help);
 });
}
async function joinListenOnly(key){
 const vs=ensureVoiceState(key);if(vs.joined)return;
 const rc=roomChannels[key];if(!rc||!rc.joined)return toast('पहले Enter Room दबाएँ।',false);
 try{
  await rc.ready;vs.joined=true;vs.listener=true;vs.muted=true;vs.camera=false;vs.stream=null;
  await rc.channel.track({user_id:user.id,name:profile?.name||user.email||'Member',voice:false,camera:false,listening:true});
  startLiveStudyClock(key);setRoomConnectionStatus(key,'● Listening','emerald');
  const announce=()=>rc.channel.send({type:'broadcast',event:'voice-signal',payload:{type:'join',fromId:user.id,listener:true}}).catch(()=>{});
  await announce();vs.reannounceTimers=[setTimeout(announce,1200),setTimeout(announce,4000)];
  document.getElementById('voice-join-'+key)?.classList.add('hidden');document.getElementById('camera-join-'+key)?.classList.add('hidden');document.getElementById('listen-join-'+key)?.classList.add('hidden');document.getElementById('voice-mute-'+key)?.classList.add('hidden');document.getElementById('camera-toggle-'+key)?.classList.add('hidden');document.getElementById('voice-leave-'+key)?.classList.remove('hidden');document.getElementById('enable-audio-'+key)?.classList.remove('hidden');
  renderRoomMembers(key);toast('👂 Listen Only joined — आवाज़ न आए तो “आवाज़ चालू करें” दबाएँ।');
 }catch(e){vs.joined=false;vs.listener=false;console.error('Listen only failed',e);toast(e?.message||'Listen Only connect नहीं हुआ।',false)}
}
function patch(){
 if(patched||typeof window.joinVoice!=='function'||typeof window.createPeer!=='function'||typeof window.ensureVoiceState!=='function')return;patched=true;
 const originalReserve=window.reserveVoiceSlot;
 window.reserveVoiceSlot=async function(key){try{return await originalReserve(key)}catch(e){const msg=String(e?.message||'');if(/full|maximum|limit/i.test(msg))throw e;console.warn('Voice slot service unavailable; presence fallback used',e);return{ok:true,fallback:true}}};
 const originalPeer=window.createPeer;
 window.createPeer=function(key,peerId){const existing=ensureVoiceState(key).peers?.[peerId];const pc=originalPeer(key,peerId);if(pc&&!existing&&!ensureVoiceState(key).stream){try{pc.addTransceiver('audio',{direction:'recvonly'});pc.addTransceiver('video',{direction:'recvonly'})}catch(e){console.info('Receive transceiver fallback',e)}}return pc};
 const originalRender=window.renderRoomMembers;
 window.renderRoomMembers=function(key){originalRender(key);const rc=roomChannels[key],host=document.getElementById('room-speakers-'+key);if(!rc||!host)return;const people=Object.values(rc.channel.presenceState()).flat().filter((p,i,a)=>p?.user_id&&a.findIndex(x=>x.user_id===p.user_id)===i),listeners=people.filter(p=>p.listening);listeners.forEach(p=>{if(host.querySelector('[data-listener="'+p.user_id+'"]'))return;const chip=document.createElement('span');chip.dataset.listener=p.user_id;chip.className='text-[10px] rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300';chip.textContent='👂 '+(p.name||'Listener');host.appendChild(chip)})};
 const originalPersist=window.persistFocusSession;
 if(typeof originalPersist==='function')window.persistFocusSession=async function(session){if(session?.subject!=='Live Study Room')return originalPersist(session);try{const{error}=await db.from('focus_sessions').upsert({id:session.id,user_id:user.id,date:session.date,seconds:Math.round(Number(session.seconds||0)),subject:session.subject,started_at:session.at},{onConflict:'id'});if(error)console.info('Study Room focus saved locally only:',error.message)}catch(e){console.info('Study Room focus saved locally only:',e?.message||e)}};
 window.joinListenOnly=joinListenOnly;
 window.joinVoice=async function(key,withCamera=false){
  const vs=ensureVoiceState(key);if(vs.joined)return;const rc=roomChannels[key];if(!rc||!rc.joined)return toast('पहले Enter Room दबाएँ।',false);
  if(!window.isSecureContext&&location.hostname!=='localhost')return toast('Live media के लिए direct HTTPS page खोलें।',false);
  if(!navigator.mediaDevices?.getUserMedia)return toast('इस device में media support नहीं है—Listen Only use करें।',false);
  let stream=null,reserved=false;
  try{
   await rc.ready;const active=getVoicePeople(key);if(active.length>=MAX_VOICE_USERS)return toast('Live Voice full है—Listen Only से join करें।',false);
   if(withCamera){
    try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:{facingMode:'user',width:{ideal:640},height:{ideal:480}}})}
    catch(first){if(['NotFoundError','OverconstrainedError'].includes(first?.name)){try{stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:640},height:{ideal:480}}});toast('Microphone नहीं मिला—Camera Only mode चालू है।')}catch(second){throw second}}else throw first}
   }else stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
   await reserveVoiceSlot(key);reserved=true;vs.stream=stream;vs.joined=true;vs.listener=false;vs.muted=false;vs.camera=stream.getVideoTracks().length>0;
   const hasAudio=stream.getAudioTracks().length>0;await rc.channel.track({user_id:user.id,name:profile?.name||user.email||'Member',voice:hasAudio,camera:vs.camera,listening:false});startVoiceHeartbeat(key);startLiveStudyClock(key);
   const announce=()=>rc.channel.send({type:'broadcast',event:'voice-signal',payload:{type:'join',fromId:user.id}}).catch(()=>{});await announce();vs.reannounceTimers=[setTimeout(announce,1200),setTimeout(announce,4000)];
   stream.getTracks().forEach(track=>track.onended=()=>{if(vs.joined)setRoomConnectionStatus(key,(track.kind==='video'?'Camera':'Mic')+' stopped by device','amber')});
   document.getElementById('voice-join-'+key)?.classList.add('hidden');document.getElementById('camera-join-'+key)?.classList.add('hidden');document.getElementById('listen-join-'+key)?.classList.add('hidden');document.getElementById('voice-mute-'+key)?.classList.toggle('hidden',!hasAudio);document.getElementById('voice-leave-'+key)?.classList.remove('hidden');document.getElementById('camera-toggle-'+key)?.classList.toggle('hidden',!vs.camera);if(vs.camera)showLocalCamera(key);renderRoomMembers(key);
   const room=STUDY_ROOMS.find(r=>r.key===key),hostName=profile?.name||user.email||'Member';Promise.resolve(sendHubNotification(vs.camera?'🎥 Public Live Cam Started':'🎙 Public Voice Room Live',(room?.name||key)+' • '+hostName,'voice','studyrooms',{room:key,camera:vs.camera})).catch(e=>console.info('Room notification skipped',e));toast(vs.camera?'🎥 Live Cam joined':'🎙 Live Voice joined');
  }catch(e){console.error('Study Room media failed',e);if(stream)stream.getTracks().forEach(t=>t.stop());if(reserved)await releaseVoiceSlot(key);vs.stream=null;vs.joined=false;vs.listener=false;vs.camera=false;toast(mediaError(e),false)}
 };
 const originalLeave=window.leaveVoice;
 window.leaveVoice=async function(key){await originalLeave(key);const b=document.getElementById('listen-join-'+key);if(b)b.classList.remove('hidden')};
}
function run(){patch();injectButtons()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();new MutationObserver(()=>{clearTimeout(window.__rhRoomFixTimer);window.__rhRoomFixTimer=setTimeout(run,80)}).observe(document.documentElement,{childList:true,subtree:true});setInterval(run,1200);
})();
