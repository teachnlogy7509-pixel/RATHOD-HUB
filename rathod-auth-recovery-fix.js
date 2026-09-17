/* RATHOD HUB password recovery using an email OTP code, not a link. */
(()=>{
'use strict';
function getAuthClient(){try{return window.db||db}catch(e){return window.db||null}}
function showToast(message,ok=true){try{if(typeof toast==='function')return toast(message,ok)}catch(e){}console[ok?'log':'error'](message)}
function setText(id,text){const el=document.getElementById(id);if(el)el.textContent=text}
let resetEmail='';
let codeVerified=false;
function prepareResetForm(){
  const oldForm=document.getElementById('password-reset-form');
  if(!oldForm||oldForm.dataset.rhOtpBound==='1')return;
  const form=oldForm.cloneNode(true);
  oldForm.replaceWith(form);
  form.dataset.rhOtpBound='1';
  form.addEventListener('submit',saveNewPassword);
  form.querySelector('#verify-otp-btn')?.addEventListener('click',verifyRecoveryCode);
  form.querySelector('#resend-reset-btn')?.addEventListener('click',()=>sendResetCode(null,true));
}
function showOtpModal(email){
  prepareResetForm();
  resetEmail=String(email||'').trim().toLowerCase();
  codeVerified=false;
  document.getElementById('password-reset-modal')?.classList.remove('hidden');
  const otp=document.getElementById('reset-otp');
  const verify=document.getElementById('verify-otp-btn');
  const fields=document.getElementById('new-password-fields');
  const resend=document.getElementById('resend-reset-btn');
  if(otp){otp.classList.remove('hidden');otp.disabled=false;otp.value='';otp.focus()}
  if(verify){verify.classList.remove('hidden');verify.disabled=false;verify.textContent='Verify Code'}
  if(fields)fields.classList.add('hidden');
  if(resend)resend.classList.remove('hidden');
  setText('reset-otp-email','6-digit code भेजा गया: '+resetEmail);
  const heading=document.querySelector('#password-reset-modal h3');
  if(heading)heading.textContent='Reset Password';
  const sub=document.querySelector('#password-reset-modal h3 + p');
  if(sub)sub.textContent='Email में आया OTP code डालें';
}
async function sendResetCode(event,resend=false){
  event?.preventDefault();
  const client=getAuthClient();
  const input=document.getElementById('forgot-email');
  const email=String(resetEmail||input?.value||'').trim().toLowerCase();
  const button=document.getElementById('forgot-btn');
  if(!email)return showToast('Registered email डालें।',false);
  if(!client?.auth)return showToast('Auth service उपलब्ध नहीं है। Page refresh करके फिर try करें।',false);
  if(button&&!resend){button.disabled=true;button.textContent='Sending...'}
  const resendButton=document.getElementById('resend-reset-btn');
  if(resendButton&&resend){resendButton.disabled=true;resendButton.textContent='Sending...'}
  try{
    // Supabase sends the recovery token; the Auth email template must render
    // {{ .Token }} so the user receives a numeric code instead of a link.
    const {error}=await client.auth.resetPasswordForEmail(email);
    if(error)throw error;
    showOtpModal(email);
    showToast(resend?'नया reset code भेज दिया गया 📩':'6-digit reset code email पर भेज दिया गया 📩');
  }catch(error){
    console.error('Password reset OTP request failed:',error);
    const message=String(error?.message||'');
    if(/error sending recovery email/i.test(message))showToast('Reset code email नहीं गया। Supabase Auth SMTP/Email provider और Reset Password template में {{ .Token }} check करें।',false);
    else showToast(message||'Reset code भेजने में समस्या हुई।',false);
  }finally{
    if(button&&!resend){button.disabled=false;button.textContent='Send Reset OTP'}
    if(resendButton&&resend){resendButton.disabled=false;resendButton.textContent='Resend code'}
  }
}
async function verifyRecoveryCode(){
  const client=getAuthClient();
  const otp=String(document.getElementById('reset-otp')?.value||'').trim();
  const verify=document.getElementById('verify-otp-btn');
  if(!resetEmail)return showToast('पहले Forgot Password से code मंगाइए।',false);
  if(!/^\d{6,8}$/.test(otp))return showToast('6 या 8 digit OTP code डालें।',false);
  if(!client?.auth)return showToast('Auth service उपलब्ध नहीं है।',false);
  if(verify){verify.disabled=true;verify.textContent='Verifying...'}
  try{
    const {error}=await client.auth.verifyOtp({email:resetEmail,token:otp,type:'recovery'});
    if(error)throw error;
    codeVerified=true;
    document.getElementById('new-password-fields')?.classList.remove('hidden');
    if(verify)verify.classList.add('hidden');
    const input=document.getElementById('reset-otp');
    if(input)input.disabled=true;
    document.getElementById('new-password')?.focus();
    showToast('Code verified ✅ अब नया password बनाइए।');
  }catch(error){
    console.error('Recovery OTP verification failed:',error);
    showToast(error?.message||'Code गलत या expire हो गया है।',false);
  }finally{
    if(verify&&!codeVerified){verify.disabled=false;verify.textContent='Verify Code'}
  }
}
async function saveNewPassword(event){
  event.preventDefault();
  if(!codeVerified)return showToast('पहले email वाला code verify करें।',false);
  const client=getAuthClient();
  const password=String(document.getElementById('new-password')?.value||'');
  const confirm=String(document.getElementById('confirm-password')?.value||'');
  const button=document.getElementById('save-password-btn');
  if(password.length<6)return showToast('Password कम से कम 6 characters का होना चाहिए।',false);
  if(password!==confirm)return showToast('दोनों passwords समान नहीं हैं।',false);
  if(!client?.auth)return showToast('Auth service उपलब्ध नहीं है।',false);
  if(button){button.disabled=true;button.textContent='Updating...'}
  try{
    const {error}=await client.auth.updateUser({password});
    if(error)throw error;
    showToast('Password successfully changed ✅');
    codeVerified=false;resetEmail='';
    document.getElementById('password-reset-modal')?.classList.add('hidden');
    document.getElementById('password-reset-form')?.reset();
  }catch(error){
    console.error('Password update failed:',error);
    showToast(error?.message||'Password update failed।',false);
  }finally{if(button){button.disabled=false;button.textContent='Update Password'}}
}
function replaceForgotForm(){
  const oldForm=document.getElementById('forgot-form');
  if(!oldForm||oldForm.dataset.rhOtpBound==='1')return;
  const form=oldForm.cloneNode(true);
  oldForm.replaceWith(form);
  form.dataset.rhOtpBound='1';
  const title=form.querySelector('div.text-xs');
  if(title)title.textContent='Reset Password via OTP';
  const button=form.querySelector('#forgot-btn');
  if(button)button.innerHTML='<i class="fa-solid fa-paper-plane mr-2"></i>Send Reset OTP';
  form.addEventListener('submit',sendResetCode);
}
function install(){
  const client=getAuthClient();
  if(!client?.auth)return;
  replaceForgotForm();
  prepareResetForm();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
