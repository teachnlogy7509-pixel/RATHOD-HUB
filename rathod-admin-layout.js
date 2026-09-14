/* RATHOD HUB requested navigation/admin cleanup */
(function(){
'use strict';
if(window.__RH_ADMIN_LAYOUT__)return;window.__RH_ADMIN_LAYOUT__=1;
const $=id=>document.getElementById(id);
function role(){return window.profile?.role||''}
function notify(text,ok=true){if(typeof window.toast==='function')window.toast(text,ok)}
function removeNavAndRedirect(){
 $('btn-aitutor')?.remove();$('btn-quiz')?.remove();
 document.querySelectorAll('[onclick]').forEach(el=>{let v=el.getAttribute('onclick')||'';if(v.includes("switchTab('aitutor')"))el.setAttribute('onclick',v.replaceAll("switchTab('aitutor')","switchTab('ai')"));if(v.includes("switchTab('quiz')"))el.setAttribute('onclick',v.replaceAll("switchTab('quiz')","switchTab('neet720')"))});
 const ai=$('section-ai'),tutor=$('section-aitutor')||$('ai-tutor-embedded');if(ai&&tutor&&tutor.parentElement!==ai){tutor.id='ai-tutor-embedded';tutor.classList.remove('hidden');tutor.removeAttribute('hidden');tutor.classList.add('mt-5');ai.appendChild(tutor)}
 const neet=$('section-neet720'),learning=$('section-quiz')||$('ai-learning-embedded');if(neet&&learning&&learning.parentElement!==neet){learning.id='ai-learning-embedded';learning.classList.remove('hidden');learning.removeAttribute('hidden');learning.classList.add('mt-6');neet.appendChild(learning)}
}
function movePdfToAdmin(){
 const lab=$('pdf-quiz-lab'),host=$('admin-controls-host');if(!lab)return;
 if(role()==='admin'&&host){lab.classList.remove('hidden');if(lab.parentElement!==host){if(!$('admin-pdf-quiz-title')){const title=document.createElement('div');title.id='admin-pdf-quiz-title';title.className='rounded-2xl border border-amber-400/25 bg-amber-500/5 p-4';title.innerHTML='<b class="text-amber-300">📄 Admin PDF → Live Quiz</b><p class="mt-1 text-[10px] text-slate-400">PDF upload aur quiz generation केवल Admin Panel से नियंत्रित होगा।</p>';host.appendChild(title)}host.appendChild(lab)}}else lab.classList.add('hidden')
}
function protectPdfUpload(){if(document.documentElement.dataset.rhPdfProtected)return;document.documentElement.dataset.rhPdfProtected='1';document.addEventListener('submit',e=>{if(e.target?.id==='pdf-quiz-form'&&role()!=='admin'){e.preventDefault();e.stopImmediatePropagation();notify('PDF Quiz upload केवल Admin कर सकता है।',false)}},true)}
async function deleteCoupon(code,row){
 if(role()!=='admin')return notify('Admin only',false);if(!confirm(`Coupon ${code} delete करें?`))return;const db=window.db;if(!db)return notify('Database ready नहीं है।',false);
 try{let r=await db.from('hub_access_coupons').update({active:false}).eq('code',code);if(r.error)throw r.error;try{await db.from('hub_notifications').delete().eq('tag','announcement').contains('metadata',{coupon_code:code})}catch(e){}row?.remove();notify('Coupon delete हो गया ✓');setTimeout(()=>window.showVaultCoupon?.(),300)}catch(e){notify(e.message||'Coupon delete नहीं हुआ',false)}
}
async function keepNewestCouponOnly(code){
 if(role()!=='admin'||!code||sessionStorage.getItem('rh_coupon_cleanup_'+code))return;const db=window.db;if(!db)return;
 try{const r=await db.from('hub_access_coupons').update({active:false}).eq('active',true).neq('code',code);if(r.error)throw r.error;sessionStorage.setItem('rh_coupon_cleanup_'+code,'1');notify('पुराने coupons हटा दिए गए—latest 1 active है ✓')}catch(e){console.info('Old coupon cleanup unavailable',e?.message||e)}
}
function cleanCouponList(){
 const box=$('vault-coupon-code');if(!box)return;const rows=[...box.children].filter(x=>/ACTIVE COUPON/i.test(x.textContent||''));if(!rows.length)return;
 rows.slice(1).forEach(x=>x.remove());const row=rows[0],code=(row.querySelector('code')?.textContent||'').trim();if(role()==='admin'&&code){keepNewestCouponOnly(code);if(!row.querySelector('.rh-delete-coupon')){const actions=row.lastElementChild||row,b=document.createElement('button');b.type='button';b.className='rh-delete-coupon rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white';b.textContent='Delete';b.onclick=()=>deleteCoupon(code,row);actions.appendChild(b)}}
}
function run(){try{removeNavAndRedirect();movePdfToAdmin();protectPdfUpload();cleanCouponList()}catch(e){console.warn('RATHOD layout update',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
new MutationObserver(()=>{clearTimeout(window.__rhLayoutTimer);window.__rhLayoutTimer=setTimeout(run,60)}).observe(document.documentElement,{childList:true,subtree:true});setInterval(run,1500);
})();