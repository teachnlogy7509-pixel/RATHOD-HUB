/* RATHOD HUB shared Firebase catalog bridge — metadata only; files remain in Drive/R2. */
(async()=>{
'use strict';
if(window.__RH_SHARED_FIREBASE_LIBRARY__)return;window.__RH_SHARED_FIREBASE_LIBRARY__=1;
const config={apiKey:'AIzaSyBMexli-_SAjcRWeY6jnRfdoxkwzjrvM6U',authDomain:'rathod-hub.firebaseapp.com',projectId:'rathod-hub',storageBucket:'rathod-hub.firebasestorage.app',messagingSenderId:'130962755921',appId:'1:130962755921:web:c3b3c4bb680290213c0370'};
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const safe=v=>/^https:\/\//i.test(String(v||''))?String(v):'#';
let sharedMaterials=[],sharedSongs=[];
try{
 const [{initializeApp},{getAuth,signInAnonymously},{getFirestore,collection,query,orderBy,limit,onSnapshot}] = await Promise.all([
  import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
  import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
  import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js')]);
 const app=initializeApp(config,'rathod-shared-catalog'),auth=getAuth(app),fire=getFirestore(app);await signInAnonymously(auth);
 const api={collection,query,orderBy,limit,onSnapshot};
 const render=()=>{
  const box=document.getElementById('materials-box');if(!box)return;
  box.querySelectorAll('[data-rh3-shared]').forEach(x=>x.remove());
  const q=String(document.getElementById('material-search')?.value||'').toLowerCase().trim(),cat=String(document.getElementById('material-filter')?.value||'');
  const rows=sharedMaterials.filter(x=>(!q||`${x.title||''} ${x.description||''} ${x.subject||''} ${x.folder||''}`.toLowerCase().includes(q))&&(!cat||[x.subject,x.folder].includes(cat)));
  rows.forEach(x=>{const a=document.createElement('article');a.dataset.rh3Shared='1';a.className='relative overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-slate-900 to-slate-950 p-4';a.innerHTML=`<div class="flex items-start gap-3"><div class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500/10 font-black text-rose-300">PDF</div><div class="min-w-0 flex-1"><div class="flex flex-wrap gap-1"><span class="rounded-full bg-amber-500/10 px-2 py-1 text-[8px] font-black text-amber-300">${esc(x.subject||'STUDY')}</span><span class="rounded-full bg-violet-500/10 px-2 py-1 text-[8px] font-black text-violet-300">RATHOD 3.0</span></div><h4 class="mt-2 line-clamp-2 text-sm font-black text-white">${esc(x.title||'Material')}</h4></div></div><p class="mt-3 line-clamp-2 min-h-[32px] text-[10px] leading-4 text-slate-400">${esc(x.description||x.folder||'Shared NEET material')}</p><a target="_blank" rel="noopener" href="${safe(x.url)}" class="mt-3 block rounded-xl bg-amber-500 py-2.5 text-center text-[10px] font-black text-slate-950">Open</a>`;box.appendChild(a)});
 };
 window.rhFirebaseSharedLibrary={loadMaterials:async()=>sharedMaterials,loadSongs:async()=>sharedSongs,renderMaterials:render};
 api.onSnapshot(api.query(api.collection(fire,'materials'),api.orderBy('createdAt','desc'),api.limit(300)),snap=>{sharedMaterials=snap.docs.map(d=>({id:d.id,...d.data()}));render();window.dispatchEvent(new CustomEvent('rathod-shared-library-ready',{detail:{materials:sharedMaterials.length,songs:sharedSongs.length}}))});
 api.onSnapshot(api.query(api.collection(fire,'songs'),api.orderBy('createdAt','desc'),api.limit(200)),snap=>{sharedSongs=snap.docs.map(d=>({id:'firebase_'+d.id,title:d.data().title,audio_url:d.data().audioUrl||d.data().audio_url,drive_file_id:d.data().driveFileId||d.data().drive_file_id,drive_url:d.data().driveUrl||d.data().drive_url,status:d.data().status||'ready'})).filter(x=>x.status==='ready');window.dispatchEvent(new CustomEvent('rathod-shared-library-ready',{detail:{materials:sharedMaterials.length,songs:sharedSongs.length}}))});
 document.getElementById('material-search')?.addEventListener('input',()=>setTimeout(render,0));document.getElementById('material-filter')?.addEventListener('change',()=>setTimeout(render,0));setInterval(()=>{if(sharedMaterials.length&&!document.querySelector('[data-rh3-shared]'))render()},3000);
}catch(error){console.warn('Shared Rathod catalog unavailable',error)}
})();
