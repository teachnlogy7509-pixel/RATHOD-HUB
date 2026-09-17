/* RATHOD HUB VIP Song Library — in-content Google Drive music box. */
(()=>{
'use strict';
if(window.__RH_SONG_LIBRARY__)return;
window.__RH_SONG_LIBRARY__=1;
const OWNER_EMAILS=new Set(['ashisharmy1982@gmail.com','teachnlogy7509@gmail.com']);
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function dbRef(){try{if(window.db)return window.db;if(typeof db!=='undefined')return db}catch(_e){}return null}
function userRef(){try{if(window.user)return window.user;if(typeof user!=='undefined')return user}catch(_e){}return null}
function profileRef(){try{if(window.profile)return window.profile;if(typeof profile!=='undefined')return profile}catch(_e){}return null}
function currentEmail(){return String(userRef()?.email||profileRef()?.email||'').trim().toLowerCase()}
function isAdmin(){return OWNER_EMAILS.has(currentEmail())||['admin','owner'].includes(String(profileRef()?.role||'').toLowerCase())}
function apiUrl(){return String(window.RATHOD_SONG_API_URL||localStorage.getItem('rh_song_api_url')||'').trim().replace(/\/+$/,'')}
function notify(text,ok=true){if(typeof window.toast==='function')window.toast(text,ok);else console.info(text)}
function aiHost(){
  for(const id of ['section-aicards','section-ai-shorts-notes','section-ai-short-notes','section-short-notes','section-aishorts','section-ainotes']){const node=$(id);if(node)return node}
  return [...document.querySelectorAll('main section,section')].find(node=>/(AI[ ]*Shorts|Short[ ]*Notes|Notes[ ]*&?[ ]*Formula|AI[ ]*Notes)/i.test(String(node.innerText||'').slice(0,5000)))||null;
}
function songRows(rows){
  if(!rows.length)return '<div class="rounded-2xl bg-black/20 p-4 text-xs text-slate-500">अभी कोई VIP song ready नहीं है।</div>';
  return rows.map((row,index)=>`<article class="rh-song-row rounded-3xl border border-fuchsia-400/15 bg-slate-950/85 p-4"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><div class="font-black text-slate-100" style="overflow-wrap:anywhere"><span class="mr-2 text-fuchsia-300">${String(index+1).padStart(2,'0')}</span>🎵 ${esc(row.title)}</div><div class="mt-1 text-[10px] text-emerald-300">VIP MP3 • RATHOD HUB</div></div>${row.drive_url?`<a class="shrink-0 text-[10px] text-cyan-300" href="${esc(row.drive_url)}" target="_blank" rel="noopener">Drive</a>`:''}</div><audio class="mt-3 block w-full" controls preload="metadata" src="${esc(row.audio_url||'')}"></audio></article>`).join('');
}
function ensureLibrarySection(){
  let section=$('section-songlibrary');
  if(section)return section;
  const host=document.querySelector('.rh-content')||document.querySelector('.rh-main')||document.querySelector('main');
  if(!host)return null;
  section=document.createElement('section');section.id='section-songlibrary';section.className='hidden space-y-4';section.style.cssText='position:relative;display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box;clear:both';
  section.innerHTML='<div class="w-full rounded-3xl border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-950/50 via-slate-950 to-cyan-950/35 p-5 sm:p-7 shadow-2xl"><div class="flex flex-wrap items-start justify-between gap-3"><div><div class="text-[10px] font-black tracking-widest text-fuchsia-200">🎵 VIP MUSIC • ADMIN CURATED</div><h2 class="mt-2 text-2xl font-black text-white">RATHOD VIP Song Library</h2></div><button type="button" data-rh-song-refresh class="rh-icon-btn rounded-xl px-3 py-2">↻</button></div><div data-rh-song-list class="mt-5 grid w-full gap-3 sm:grid-cols-2"></div></div>';
  host.appendChild(section);section.querySelector('[data-rh-song-refresh]').onclick=loadSongs;return section;
}
function ensureInlineCard(){
  const existing=$('rh-song-library-card');if(existing)return existing;
  const host=aiHost();if(!host)return null;
  const card=document.createElement('div');card.id='rh-song-library-card';card.className='mt-5 w-full rounded-3xl border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-950/70 to-cyan-950/45 p-4 sm:p-5 shadow-xl';
  card.innerHTML='<div class="flex flex-wrap items-start justify-between gap-3"><div><div class="text-[10px] font-black tracking-widest text-fuchsia-300">🎵 VIP MUSIC • UNIQUE SONG LIST</div><h3 class="mt-1 text-lg font-black text-white">RATHOD VIP Song Library</h3><p class="mt-1 text-xs text-slate-400">AI Notes & Formula के अंदर Admin के Google Drive songs सुनें।</p></div><button type="button" data-rh-song-open class="shrink-0 rounded-2xl bg-fuchsia-600 px-4 py-3 text-xs font-black text-white">Open Full Library</button></div><div data-rh-song-inline-list class="mt-4 grid w-full gap-3 sm:grid-cols-2"><div class="text-xs text-slate-500">VIP songs loading…</div></div><details data-rh-song-admin-wrap class="mt-4 hidden rounded-3xl border border-amber-400/30 bg-amber-500/5 p-4"><summary class="cursor-pointer text-[10px] font-black tracking-widest text-amber-300">🔐 ADMIN VIP UPLOAD</summary><p class="mt-2 text-xs text-slate-400">MP4 या MP3 सीधे Railway से Google Drive में जाएगा। Supabase Storage में media नहीं जाएगी।</p><div class="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input data-rh-song-title class="min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-xs" placeholder="Song title" maxlength="120"><input data-rh-song-file type="file" accept="video/mp4,audio/mpeg,audio/mp3,audio/*" class="min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs"><button type="button" data-rh-song-upload class="rounded-xl bg-fuchsia-600 px-4 py-3 text-xs font-black text-white">Upload</button></div><div class="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"><input data-rh-song-api class="min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-xs" placeholder="Railway PDF Worker URL" value="${esc(apiUrl())}"><button type="button" data-rh-song-api-save class="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-xs font-black text-cyan-200">Save URL</button></div><div data-rh-song-status class="mt-2 text-[10px] text-slate-500"></div></details>';
  host.appendChild(card);
  card.querySelector('[data-rh-song-open]').onclick=openLibrary;
  card.querySelector('[data-rh-song-upload]').onclick=uploadSong;
  card.querySelector('[data-rh-song-api-save]').onclick=()=>{
    const input=card.querySelector('[data-rh-song-api]');
    const value=String(input?.value||'').trim().replace(/\/+$/,'');
    if(value)localStorage.setItem('rh_song_api_url',value);else localStorage.removeItem('rh_song_api_url');
    card.querySelector('[data-rh-song-status]').textContent=value?'✅ Google Drive API URL saved.':'API URL हटाया गया।';
  };
  return card;
}
function renderRows(rows){
  const card=$('rh-song-library-card');const section=ensureLibrarySection();
  const inline=card?.querySelector('[data-rh-song-inline-list]');if(inline)inline.innerHTML=songRows(rows);
  const list=section?.querySelector('[data-rh-song-list]');if(list)list.innerHTML=songRows(rows);
}
async function loadSongs(){
  const d=dbRef();if(!d)return;
  ensureInlineCard();ensureLibrarySection();
  const result=await d.from('rh_song_library').select('id,title,audio_url,drive_url,status,created_at').eq('status','ready').order('created_at',{ascending:false});
  if(result.error){console.info('Song Library query pending',result.error.message);return}
  renderRows(result.data||[]);
}
async function uploadSong(){
  const card=$('rh-song-library-card'),d=dbRef(),u=userRef(),file=card?.querySelector('[data-rh-song-file]')?.files?.[0],title=String(card?.querySelector('[data-rh-song-title]')?.value||'').trim(),status=card?.querySelector('[data-rh-song-status]');
  if(!d||!u)return notify('पहले app में login करें',false);
  if(!isAdmin())return notify('केवल Admin upload कर सकता है',false);
  if(!file)return notify('MP4 या MP3 file चुनें',false);
  const endpoint=apiUrl();if(!endpoint)return notify('पहले Railway API URL save करें',false);
  if(file.size>250*1024*1024)return notify('File 250 MB से छोटी रखें',false);
  try{
    if(status)status.textContent='Google Drive पर upload हो रहा है…';
    const session=(await d.auth.getSession()).data.session;if(!session?.access_token)throw new Error('Login session नहीं मिली');
    const form=new FormData();form.append('title',title||file.name.replace(/\.[^.]+$/,'')||'RATHOD HUB Song');form.append('file',file,file.name);
    const response=await fetch(endpoint+'/song/upload',{method:'POST',headers:{Authorization:'Bearer '+session.access_token},body:form});
    const payload=await response.json().catch(()=>({}));if(!response.ok||!payload.ok)throw new Error(payload.error||('Upload failed HTTP '+response.status));
    if(status)status.textContent='✅ Google Drive में MP3 save हो गई।';card.querySelector('[data-rh-song-file]').value='';card.querySelector('[data-rh-song-title]').value='';notify('VIP Song save हो गई ✓');loadSongs();
  }catch(error){if(status)status.textContent='❌ '+(error.message||error);notify(error.message||'Upload failed',false)}
}
function openLibrary(){const section=ensureLibrarySection();if(!section)return;document.querySelectorAll('main section[id^="section-"]').forEach(node=>node.classList.add('hidden'));section.classList.remove('hidden');loadSongs()}
function boot(){const card=ensureInlineCard();ensureLibrarySection();card?.querySelector('[data-rh-song-admin-wrap]')?.classList.toggle('hidden',!isAdmin());if(card)loadSongs()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
new MutationObserver(()=>{clearTimeout(window.__rhSongTimer);window.__rhSongTimer=setTimeout(boot,300)}).observe(document.documentElement,{childList:true,subtree:true});
window.openSongLibrary=openLibrary;window.loadSongLibrary=loadSongs;
})();
