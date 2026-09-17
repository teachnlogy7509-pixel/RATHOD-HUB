/* RATHOD HUB VIP Song Library — Google Drive media mode.
   Supabase stores only metadata; no song bytes are written to Supabase Storage.
*/
(()=>{
'use strict';
if(window.__RH_SONG_LIBRARY__)return;
window.__RH_SONG_LIBRARY__=1;
const OWNER_EMAILS=new Set(['ashisharmy1982@gmail.com','teachnlogy7509@gmail.com']);
const $=id=>document.getElementById(id);
const E=value=>String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));
const notify=(text,ok=true)=>{if(typeof window.toast==='function')window.toast(text,ok);else console.info(text)};
function currentEmail(){return String(window.user?.email||window.profile?.email||'').trim().toLowerCase()}
function isAdmin(){return OWNER_EMAILS.has(currentEmail())||window.profile?.role==='admin'||window.profile?.role==='owner'}
function apiUrl(){return String(window.RATHOD_SONG_API_URL||localStorage.getItem('rh_song_api_url')||'').trim().replace(/\/+$/,'')}
function targetForAiNotes(){
  const ids=['section-ai-shorts-notes','section-ai-short-notes','section-short-notes','section-aishorts','section-ainotes'];
  for(const id of ids){const el=$(id);if(el)return el}
  return [...document.querySelectorAll('main section,section')].find(el=>/(AI[ ]*Shorts|Short[ ]*Notes|Notes[ ]*AI|AI[ ]*Notes)/i.test(String(el.innerText||'').slice(0,5000)))||null;
}
function songSection(){
  let section=$('section-songlibrary');
  if(section)return section;
  const main=document.querySelector('main');
  if(!main)return null;
  section=document.createElement('section');
  section.id='section-songlibrary';
  section.className='hidden space-y-4';
  section.innerHTML=`
    <div class="rounded-3xl border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-950/50 via-slate-950 to-cyan-950/35 p-5 sm:p-7 shadow-2xl">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-fuchsia-400/10 px-3 py-1 text-[10px] font-black tracking-widest text-fuchsia-200">🎵 VIP MUSIC • ADMIN CURATED</div>
          <h2 class="mt-2 text-2xl font-black text-white">RATHOD VIP Song Library</h2>
          <p class="mt-2 text-xs leading-5 text-slate-400">Admin द्वारा जोड़े गए MP4/MP3 songs automatic music format में list-wise सुनें।</p>
        </div>
        <button type="button" data-rh-song-refresh class="rh-icon-btn rounded-xl px-3 py-2" aria-label="Refresh songs">↻</button>
      </div>
      <div data-rh-song-list class="mt-5 grid gap-3 sm:grid-cols-2"><div class="text-xs text-slate-500">VIP songs loading…</div></div>
      <div data-rh-song-admin class="mt-5 hidden rounded-3xl border border-amber-400/30 bg-amber-500/5 p-4">
        <div class="inline-flex items-center gap-2 text-[10px] font-black tracking-widest text-amber-300">🔐 ADMIN VIP UPLOAD</div>
        <p class="mt-1 text-xs text-slate-400">MP4 या MP3 upload करें। File सीधे Railway के Google Drive API पर जाएगी; Supabase Storage में media save नहीं होगी।</p>
        <div class="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input data-rh-song-title class="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-xs" placeholder="Song title" maxlength="120">
          <input data-rh-song-file type="file" accept="video/mp4,audio/mpeg,audio/mp3,audio/*" class="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs">
          <button type="button" data-rh-song-upload class="rounded-xl bg-fuchsia-600 px-4 py-3 text-xs font-black text-white">Upload VIP Song</button>
        </div>
        <div class="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input data-rh-song-api class="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-xs" placeholder="Railway PDF Worker public URL" value="${E(apiUrl())}">
          <button type="button" data-rh-song-api-save class="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-xs font-black text-cyan-200">Save API URL</button>
        </div>
        <div class="mt-1 text-[10px] text-slate-500">Railway service में public domain बनाकर उसका URL यहाँ एक बार save करें।</div>
        <div data-rh-song-status class="mt-2 text-[10px] text-slate-500"></div>
      </div>
    </div>`;
  main.appendChild(section);
  section.querySelector('[data-rh-song-refresh]').onclick=loadSongs;
  section.querySelector('[data-rh-song-upload]').onclick=uploadSong;
  section.querySelector('[data-rh-song-api-save]').onclick=()=>{
    const value=section.querySelector('[data-rh-song-api]').value.trim().replace(/\/+$/,'');
    if(value)localStorage.setItem('rh_song_api_url',value);else localStorage.removeItem('rh_song_api_url');
    section.querySelector('[data-rh-song-status]').textContent=value?'✅ Google Drive upload API URL saved.':'API URL हटाया गया।';
  };
  return section;
}
function openLibrary(){
  const section=songSection();
  if(!section)return;
  document.querySelectorAll('main section[id^="section-"]').forEach(el=>el.classList.add('hidden'));
  section.classList.remove('hidden');
  document.querySelectorAll('.rh-nav-btn,.rh-mobile-bottom button').forEach(el=>el.classList.remove('active','rh-active'));
  loadSongs();
}
function injectButtons(){
  // Deliberately no navigation buttons: VIP Song Library stays inside AI Shorts Notes AI.
}
function injectAiCard(){
  if($('rh-song-library-card'))return;
  const target=targetForAiNotes()||$('section-home')||document.querySelector('main');
  if(!target)return;
  const card=document.createElement('div');card.id='rh-song-library-card';card.className='mt-4 rounded-3xl border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-950/60 to-cyan-950/40 p-4 sm:p-5 shadow-xl';
  card.innerHTML='<div class="flex flex-wrap items-center justify-between gap-3"><div><div class="inline-flex items-center gap-2 text-[10px] font-black tracking-widest text-fuchsia-300">🎵 VIP MUSIC • UNIQUE SONG LIST</div><div class="mt-1 text-lg font-black text-white">RATHOD VIP Song Library</div><p class="mt-1 text-xs text-slate-400">AI Shorts Notes AI के अंदर अलग premium-style music box.</p></div><button type="button" data-rh-song-open class="rounded-2xl bg-fuchsia-600 px-4 py-3 text-xs font-black text-white">Open VIP Songs</button></div>';
  target.appendChild(card);card.querySelector('[data-rh-song-open]').onclick=openLibrary;
}
async function uploadSong(){
  const section=songSection(),file=section?.querySelector('[data-rh-song-file]')?.files?.[0],title=(section?.querySelector('[data-rh-song-title]')?.value||'').trim(),status=section?.querySelector('[data-rh-song-status]');
  if(!window.db){notify('Supabase app connection नहीं मिला',false);return}
  const authUser=window.user||((await db.auth?.getUser?.())?.data?.user);
  if(!authUser){notify('पहले app में login करें',false);return}
  if(!isAdmin()){notify('केवल Admin upload कर सकता है',false);return}
  if(!file){notify('MP4 या MP3 file चुनें',false);return}
  if(file.size>250*1024*1024){notify('File 250 MB से छोटी रखें',false);return}
  const endpoint=apiUrl();
  if(!endpoint){const hint='पहले Railway PDF Worker का public URL Save API URL में save करें';if(status)status.textContent='❌ '+hint;notify(hint,false);return}
  const name=title||file.name.replace(/[.][^.]+$/,'').replace(/[_-]+/g,' ').trim()||'RATHOD HUB Song';
  try{
    if(status)status.textContent='Google Drive API पर upload हो रहा है…';
    const sessionResult=await db.auth?.getSession?.();
    const token=sessionResult?.data?.session?.access_token;
    if(!token)throw new Error('Supabase login session नहीं मिली');
    const form=new FormData();form.append('title',name);form.append('file',file,file.name);
    const response=await fetch(endpoint+'/song/upload',{method:'POST',headers:{Authorization:'Bearer '+token},body:form});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.ok)throw new Error(payload.error||('Upload failed HTTP '+response.status));
    if(status)status.textContent='✅ Google Drive में MP3 save हो गई।';
    section.querySelector('[data-rh-song-file]').value='';section.querySelector('[data-rh-song-title]').value='';
    notify('VIP Song Google Drive में save हो गई ✓');setTimeout(loadSongs,1000);
  }catch(error){
    const raw=String(error?.message||error||'Upload failed');
    if(status)status.textContent='❌ '+raw;
    notify(raw.slice(0,180),false);
  }
}
async function loadSongs(){
  const section=songSection();if(!section||!window.db)return;
  const list=section.querySelector('[data-rh-song-list]');if(!list)return;
  section.querySelector('[data-rh-song-admin]')?.classList.toggle('hidden',!isAdmin());
  try{
    const result=await db.from('rh_song_library').select('id,title,audio_url,drive_url,status,created_at').eq('status','ready').order('created_at',{ascending:false});
    if(result.error)throw result.error;
    const rows=result.data||[];
    list.innerHTML=rows.length?rows.map((row,index)=>`<article class="rounded-3xl border border-fuchsia-400/15 bg-slate-950/85 p-4"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><div class="truncate font-black text-slate-100"><span class="mr-2 text-fuchsia-300">${String(index+1).padStart(2,'0')}</span>🎵 ${E(row.title)}</div><div class="mt-1 text-[10px] text-emerald-300">VIP MP3 • RATHOD HUB</div></div>${row.drive_url?`<a class="text-[10px] text-cyan-300" href="${E(row.drive_url)}" target="_blank" rel="noopener">Drive</a>`:''}</div><audio class="mt-3 w-full" controls preload="metadata" src="${E(row.audio_url||'')}"></audio></article>`).join(''):'<div class="rounded-2xl bg-black/20 p-4 text-xs text-slate-500">अभी कोई VIP song ready नहीं है।</div>';
  }catch(error){list.innerHTML='<div class="text-xs text-amber-300">Song Library metadata SQL अभी run नहीं हुआ।</div>'}
}
function boot(){injectButtons();injectAiCard();songSection();if(isAdmin())loadSongs()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
new MutationObserver(()=>{clearTimeout(window.__rhSongTimer);window.__rhSongTimer=setTimeout(boot,250)}).observe(document.documentElement,{childList:true,subtree:true});
window.openSongLibrary=openLibrary;window.loadSongLibrary=loadSongs;
})();
