/* Reliable Supabase password recovery for RATHOD HUB.
   Supabase sends a recovery LINK, not an application-generated OTP.
   The link creates a recovery session; the user then sets a new password here. */
(()=>{
'use strict';

function getAuthClient(){
  try{return window.db || db}catch(e){return window.db||null}
}
function showToast(message,ok=true){
  try{if(typeof toast==='function')return toast(message,ok)}catch(e){}
  console[ok?'log':'error'](message)
}
function recoveryRedirect(){
  const url=new URL(window.location.href);
  url.search='';
  url.hash='password-recovery';
  return url.toString();
}
function setText(id,text){const el=document.getElementById(id);if(el)el.textContent=text}

let recoverySessionReady=false;

function prepareRecoveryModal(){
  const form=document.getElementById('password-reset-form');
  if(!form||form.dataset.rhRecoveryBound==='1')return;
  // Replace the old OTP form so its old verify/resend listeners cannot run.
  const fresh=form.cloneNode(true);
  form.replaceWith(fresh);
  fresh.dataset.rhRecoveryBound='1';
  fresh.addEventListener('submit',saveRecoveryPassword);
}

function showRecoveryModal(){
  prepareRecoveryModal();
  recoverySessionReady=true;
  const modal=document.getElementById('password-reset-modal');
  if(modal)modal.classList.remove('hidden');
  const otp=document.getElementById('reset-otp');
  const verify=document.getElementById('verify-otp-btn');
  const resend=document.getElementById('resend-reset-btn');
  const fields=document.getElementById('new-password-fields');
  if(otp){otp.value='';otp.disabled=true;otp.classList.add('hidden')}
  if(verify)verify.classList.add('hidden');
  if(resend)resend.classList.add('hidden');
  if(fields)fields.classList.remove('hidden');
  setText('reset-otp-email','Recovery link verified. अब नया password बनाइए।');
  const heading=document.querySelector('#password-reset-modal h3');
  if(heading)heading.textContent='नया Password बनाएँ';
  const sub=document.querySelector('#password-reset-modal h3 + p');
  if(sub)sub.textContent='नया password डालकर Save करें';
  document.getElementById('new-password')?.focus();
}

async function saveRecoveryPassword(event){
  event.preventDefault();
  if(!recoverySessionReady)return showToast('पहले email में आया recovery link खोलें।',false);
  const client=getAuthClient();
  const password=String(document.getElementById('new-password')?.value||'');
  const confirm=String(document.getElementById('confirm-password')?.value||'');
  const button=document.getElementById('save-password-btn');
  if(password.length<6)return showToast('Password कम से कम 6 characters का होना चाहिए।',false);
  if(password!==confirm)return showToast('दोनों passwords समान नहीं हैं।',false);
  if(!client?.auth)return showToast('Auth service उपलब्ध नहीं है। Page refresh करके फिर try करें।',false);
  if(button){button.disabled=true;button.textContent='Saving...'}
  try{
    const {error}=await client.auth.updateUser({password});
    if(error)throw error;
    showToast('Password successfully changed ✅');
    recoverySessionReady=false;
    document.getElementById('password-reset-modal')?.classList.add('hidden');
    document.getElementById('password-reset-form')?.reset();
    const clean=new URL(window.location.href);clean.search='';clean.hash='';
    window.history.replaceState({},'',clean.toString());
  }catch(error){
    console.error('Recovery password update failed:',error);
    showToast(error?.message||'Password update failed. फिर try करें।',false);
  }finally{
    if(button){button.disabled=false;button.textContent='Update Password'}
  }
}

function replaceForgotForm(){
  const oldForm=document.getElementById('forgot-form');
  if(!oldForm||oldForm.dataset.rhRecoveryBound==='1')return;
  const form=oldForm.cloneNode(true);
  oldForm.replaceWith(form);
  form.dataset.rhRecoveryBound='1';
  const title=form.querySelector('div.text-xs');
  if(title)title.textContent='Email पर recovery link भेजें';
  const button=form.querySelector('#forgot-btn');
  if(button)button.innerHTML='<i class="fa-solid fa-paper-plane mr-2"></i>Send Recovery Link';
  form.addEventListener('submit',sendRecoveryLink);
}

async function sendRecoveryLink(event){
  event.preventDefault();
  const client=getAuthClient();
  const input=document.getElementById('forgot-email');
  const email=String(input?.value||'').trim().toLowerCase();
  const button=document.getElementById('forgot-btn');
  if(!email)return;
  if(!client?.auth)return showToast('Auth service उपलब्ध नहीं है। Page refresh करके फिर try करें।',false);
  if(button){button.disabled=true;button.textContent='Sending...'}
  try{
    const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:recoveryRedirect()});
    if(error)throw error;
    document.getElementById('forgot-form')?.classList.add('hidden');
    setText('auth-note','Recovery link email पर भेज दिया गया है। Inbox/Spam में link खोलें।');
    showToast('Recovery link email पर भेज दिया गया है 📩');
  }catch(error){
    console.error('Password recovery email failed:',error);
    const message=String(error?.message||'');
    if(/error sending recovery email/i.test(message)){
      showToast('Recovery email अभी Supabase Auth से नहीं जा रहा। पहले इस link को खोलकर फिर try करें; समस्या रहे तो Supabase Auth में SMTP/Email provider चालू करना होगा।',false);
    }else{
      showToast(message||'Recovery email भेजने में समस्या हुई।',false);
    }
  }finally{
    if(button){button.disabled=false;button.textContent='Send Recovery Link'}
  }
}

function install(){
  const client=getAuthClient();
  if(!client?.auth)return;
  replaceForgotForm();
  prepareRecoveryModal();
  client.auth.onAuthStateChange((event)=>{
    if(event==='PASSWORD_RECOVERY')showRecoveryModal();
  });
  // If the SDK consumed the recovery hash before this loader finished.
  if(/(?:^|&)type=recovery(?:&|$)/.test(window.location.hash.slice(1))){
    setTimeout(showRecoveryModal,250);
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
