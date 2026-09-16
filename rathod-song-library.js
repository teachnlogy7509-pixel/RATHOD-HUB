/* RATHOD HUB VIP Song Library
   - Public users stream processed MP3 files.
   - Owner uploads MP4/audio to the private Supabase queue.
   - Railway converts the queue item and archives the MP3 in Google Drive.
*/
(()=>{
'use strict';
if(window.__RH_SONG_LIBRARY__)return;
window.__RH_SONG_LIBRARY__=1;
const OWNER='teachnlogy7509@gmail.com';
const $=id=>document.getElementById(id);
const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const notify=(text,ok=true)=>{if(typeof window.toast==='function')window.toast(text,ok);else console.info(text)};
function currentEmail(){return String(window.user?.email||window.profile?.email||'').trim().toLowerCase()}
function isAdmin(){return currentEmail()===OWNER||window.profile?.role==='admin'||window.profile?.role==='owner'}
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
        <p class="mt-1 text-xs text-slate-400">MP4 या MP3 upload करें। Railway FFmpeg इसे MP3 में तैयार करके Google Drive में archive करेगा।</p>
        <div class="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input data-rh-song-title class="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-xs" placeholder="Song title" maxlength="120">
          <input data-rh-song-file type="file" accept="video/mp4,audio/mpeg,audio/mp3,audio/*" class="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs">
          <button type="button" data-rh-song-upload class="rounded-xl bg-fuchsia-600 px-4 py-3 text-xs font-black text-white">Upload VIP Song</button>
        </div>
        <div data-rh-song-status class="mt-2 text-[10px] text-slate-500"></div>
      </div>
    </div>`;
  main.appendChild(section);
  section.querySelector('[data-rh-song-refresh]').onclick=loadSongs;
  section.querySelector('[data-rh-song-upload]').onclick=uploadSong;
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
  const name=title||file.name.replace(/[.][^.]+$/,'').replace(/[_-]+/g,' ').trim()||'RATHOD HUB Song';
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-100)||'song.mp4';
  const path=currentEmail().replace(/[^a-z0-9]/g,'_')+'/'+Date.now()+'-'+safe;
  try{
    if(status)status.textContent='Supabase Storage में upload हो रहा है…';
    if(!db.storage?.from)throw new Error('Supabase Storage unavailable');
    const up=await db.storage.from('rh-song-uploads').upload(path,file,{upsert:false,contentType:file.type||'video/mp4'});
    if(up.error)throw up.error;
    const row=await db.from('rh_song_library').insert({title:name,source_bucket:'rh-song-uploads',source_path:path,source_type:file.type||'video/mp4',status:'queued',uploaded_by:authUser.id}).select().single();
    if(row.error){try{await db.storage.from('rh-song-uploads').remove([path])}catch(_e){}throw row.error}
    if(status)status.textContent='✅ Queue में चला गया। Railway MP3 conversion के बाद song list में आएगा।';
    section.querySelector('[data-rh-song-file]').value='';section.querySelector('[data-rh-song-title]').value='';
    notify('VIP Song queued ✓');setTimeout(loadSongs,1500);
  }catch(error){
    const raw=String(error?.message||error||'Upload failed');
    const hint=/bucket|storage|not found/i.test(raw)?'Supabase में supabase-song-library.sql पूरा Run करें।':/row.level|policy|permission|unauthorized/i.test(raw)?'Supabase RLS में owner email और login check करें।':raw;
    if(status)status.textContent='❌ '+hint;
    notify(hint.slice(0,180),false);
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
  }catch(error){list.innerHTML='<div class="text-xs text-amber-300">Song Library SQL अभी run नहीं हुआ या service processing शुरू नहीं हुई।</div>'}
}
function boot(){injectButtons();injectAiCard();songSection();if(isAdmin())loadSongs()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
new MutationObserver(()=>{clearTimeout(window.__rhSongTimer);window.__rhSongTimer=setTimeout(boot,250)}).observe(document.documentElement,{childList:true,subtree:true});
window.openSongLibrary=openLibrary;window.loadSongLibrary=loadSongs;
})();
