/* Public trust + quiz feedback experience for RATHOD HUB */
(function(){
'use strict';
if(window.__RH_PUBLIC_TRUST_FEEDBACK__) return;
window.__RH_PUBLIC_TRUST_FEEDBACK__ = 1;

const STORE_KEY = 'rh_quiz_feedback_v1';
const FACTS = {
  about: 'about.html',
  faq: 'faq.html',
  llms: 'llms.txt',
  home: './'
};

function toastMsg(msg, ok=true){
  if(typeof window.toast === 'function') return window.toast(msg, ok);
  console.log(msg);
}
function esc(s){
  return String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function ensureStyle(){
  if(document.getElementById('rh-public-trust-feedback-style')) return;
  const style = document.createElement('style');
  style.id = 'rh-public-trust-feedback-style';
  style.textContent = `
    .rh-official-facts-card{position:relative;overflow:hidden;border:1px solid rgba(244,193,93,.22);border-radius:26px;background:linear-gradient(135deg,rgba(24,17,10,.96),rgba(13,18,29,.94));box-shadow:0 18px 40px rgba(0,0,0,.28);padding:18px}
    .rh-official-facts-card:before{content:'';position:absolute;inset:auto -30px -30px auto;width:200px;height:200px;background:radial-gradient(circle,rgba(244,193,93,.14),transparent 70%);pointer-events:none}
    .rh-official-facts-kicker{font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#f4c15d}
    .rh-official-facts-title{margin-top:6px;font-size:24px;font-weight:900;color:#fff}
    .rh-official-facts-copy{margin-top:8px;font-size:13px;line-height:1.7;color:#d5dde7;max-width:900px}
    .rh-official-facts-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}
    .rh-official-facts-item{border:1px solid rgba(255,255,255,.08);border-radius:18px;background:rgba(255,255,255,.04);padding:14px}
    .rh-official-facts-item b{display:block;color:#fff;font-size:14px;margin-top:8px}
    .rh-official-facts-item span{display:block;color:#9eabba;font-size:11px;line-height:1.6;margin-top:4px}
    .rh-official-facts-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
    .rh-official-btn,.rh-feedback-open-btn{appearance:none;border:0;border-radius:14px;padding:12px 16px;font-size:12px;font-weight:900;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px}
    .rh-official-btn.primary,.rh-feedback-open-btn{background:linear-gradient(90deg,#f59e0b,#ef4444);color:#fff;box-shadow:0 10px 24px rgba(239,68,68,.16)}
    .rh-official-btn.secondary{background:#121923;color:#fff;border:1px solid rgba(255,255,255,.12)}
    .rh-result-action-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
    .rh-feedback-overlay{position:fixed;inset:0;z-index:1500;background:rgba(0,0,0,.72);backdrop-filter:blur(10px);display:none;align-items:center;justify-content:center;padding:16px}
    .rh-feedback-overlay.rh-open{display:flex}
    .rh-feedback-modal{width:min(720px,100%);max-height:92vh;overflow:auto;border-radius:28px;border:1px solid rgba(244,193,93,.2);background:linear-gradient(180deg,rgba(12,15,21,.98),rgba(15,20,31,.98));box-shadow:0 28px 80px rgba(0,0,0,.48);padding:22px}
    .rh-feedback-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px}
    .rh-feedback-top b{display:block;font-size:24px;color:#fff}
    .rh-feedback-top p{font-size:12px;color:#9eabba;margin-top:6px;line-height:1.6}
    .rh-feedback-close{width:40px;height:40px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;cursor:pointer}
    .rh-feedback-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:14px}
    .rh-feedback-box{border:1px solid rgba(255,255,255,.10);border-radius:18px;background:#111822;padding:14px}
    .rh-feedback-label{font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#f4c15d;margin-bottom:8px}
    .rh-stars{display:flex;gap:8px;flex-wrap:wrap}.rh-star-btn{width:46px;height:46px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:#141c28;color:#fff;cursor:pointer;font-size:18px}.rh-star-btn.active{background:linear-gradient(135deg,#f59e0b,#ef4444);border-color:transparent}
    .rh-chip-grid{display:flex;gap:8px;flex-wrap:wrap}.rh-chip{padding:9px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:#141c28;color:#dbe4ee;font-size:11px;font-weight:800;cursor:pointer}.rh-chip.active{background:rgba(244,193,93,.12);border-color:rgba(244,193,93,.4);color:#fbe4a2}
    .rh-feedback-modal textarea,.rh-feedback-modal input{width:100%;background:#0e141c;border:1px solid rgba(255,255,255,.12);color:#fff;border-radius:16px;padding:13px 14px;font-size:13px;outline:none}
    .rh-feedback-foot{display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;margin-top:16px}
    .rh-feedback-links{display:flex;gap:10px;flex-wrap:wrap}.rh-feedback-links a{font-size:11px;color:#f4c15d;text-decoration:none;font-weight:800}
    .rh-feedback-submit{appearance:none;border:0;border-radius:16px;padding:13px 18px;background:linear-gradient(90deg,#f59e0b,#ef4444);color:#fff;font-size:12px;font-weight:900;cursor:pointer}
    .rh-feedback-note{font-size:11px;color:#8ea0b3;line-height:1.6}
    @media (max-width:800px){.rh-official-facts-grid,.rh-feedback-meta{grid-template-columns:1fr}.rh-official-facts-title{font-size:20px}}
  `;
  document.head.appendChild(style);
}

function saveFeedback(entry){
  try{
    const rows = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    rows.unshift(entry);
    localStorage.setItem(STORE_KEY, JSON.stringify(rows.slice(0, 200)));
  }catch(e){}
}

function ensureFactsCard(){
  const home = document.getElementById('section-home');
  if(!home || home.querySelector('#rh-official-facts-card')) return;
  const target = home.querySelector('.rh-home-main') || home;
  const card = document.createElement('section');
  card.id = 'rh-official-facts-card';
  card.className = 'rh-official-facts-card';
  card.innerHTML = `
    <div class="rh-official-facts-kicker">Official public information</div>
    <div class="rh-official-facts-title">RATHOD HUB ke bare me ab <span style="color:#f4c15d">clear facts</span> bhi visible hain</div>
    <div class="rh-official-facts-copy">Google aur AI tools ko sahi samajh mile isliye official About, FAQ aur AI facts pages add kiye gaye hain. Isse RATHOD HUB ko sirf ek quiz page nahi, balki <b>complete NEET preparation platform</b> ke roop me samajhna aasaan hoga.</div>
    <div class="rh-official-facts-grid">
      <div class="rh-official-facts-item"><div>📘</div><b>About RATHOD HUB</b><span>Platform kya hai, kisliye hai, aur iske core modules ka official overview.</span></div>
      <div class="rh-official-facts-item"><div>❓</div><b>Official FAQ</b><span>Students, Google aur AI ke common questions ke direct answers.</span></div>
      <div class="rh-official-facts-item"><div>🤖</div><b>AI Facts File</b><span>Assistants ke liye short trusted public facts file jo galat summaries ko kam kare.</span></div>
    </div>
    <div class="rh-official-facts-actions">
      <a class="rh-official-btn primary" href="${FACTS.about}" target="_blank" rel="noopener">Open About</a>
      <a class="rh-official-btn secondary" href="${FACTS.faq}" target="_blank" rel="noopener">Open FAQ</a>
      <a class="rh-official-btn secondary" href="${FACTS.llms}" target="_blank" rel="noopener">Open AI Facts</a>
    </div>
  `;
  target.insertBefore(card, target.children[1] || null);
}

function ensureFeedbackModal(){
  if(document.getElementById('rh-feedback-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'rh-feedback-overlay';
  overlay.className = 'rh-feedback-overlay';
  overlay.innerHTML = `
    <div class="rh-feedback-modal">
      <div class="rh-feedback-top">
        <div>
          <b>Quiz Feedback</b>
          <p>Quiz, Daily 9 PM Battle, 45Q Test ya kisi bhi result ke baad yahan se feedback diya ja sakta hai. Ye internal feedback experience hai aur saath me official pages bhi diye gaye hain jisse public understanding better ho.</p>
        </div>
        <button class="rh-feedback-close" type="button" aria-label="Close">✕</button>
      </div>
      <div class="rh-feedback-meta">
        <div class="rh-feedback-box"><div class="rh-feedback-label">Quiz type</div><div id="rh-feedback-quiz-type" class="rh-feedback-note">General Quiz</div></div>
        <div class="rh-feedback-box"><div class="rh-feedback-label">Experience</div><div id="rh-feedback-quiz-status" class="rh-feedback-note">Tell what felt best and what should improve.</div></div>
      </div>
      <div class="rh-feedback-box">
        <div class="rh-feedback-label">Rating</div>
        <div class="rh-stars" id="rh-feedback-stars"></div>
      </div>
      <div class="rh-feedback-box" style="margin-top:12px;">
        <div class="rh-feedback-label">What should we note?</div>
        <div class="rh-chip-grid" id="rh-feedback-tags"></div>
      </div>
      <div class="rh-feedback-box" style="margin-top:12px;">
        <div class="rh-feedback-label">Your feedback</div>
        <textarea id="rh-feedback-text" rows="5" placeholder="Jaise: timer smooth tha, question quality acchi thi, ya kisi question me improvement chahiye..."></textarea>
      </div>
      <div class="rh-feedback-box" style="margin-top:12px;">
        <div class="rh-feedback-label">Optional name</div>
        <input id="rh-feedback-name" type="text" placeholder="Aapka naam (optional)" />
      </div>
      <div class="rh-feedback-foot">
        <div>
          <div class="rh-feedback-links">
            <a href="${FACTS.about}" target="_blank" rel="noopener">About page</a>
            <a href="${FACTS.faq}" target="_blank" rel="noopener">FAQ page</a>
            <a href="${FACTS.llms}" target="_blank" rel="noopener">AI facts file</a>
          </div>
          <div class="rh-feedback-note" style="margin-top:8px;">Feedback browser me safe rahega aur future admin export ke liye use ho sakta hai.</div>
        </div>
        <button id="rh-feedback-submit" class="rh-feedback-submit" type="button">Submit Feedback</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target === overlay) closeFeedback(); });
  overlay.querySelector('.rh-feedback-close').addEventListener('click', closeFeedback);
  overlay.querySelector('#rh-feedback-submit').addEventListener('click', submitFeedback);
  const starWrap = overlay.querySelector('#rh-feedback-stars');
  for(let i=1;i<=5;i++){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rh-star-btn';
    btn.dataset.value = String(i);
    btn.textContent = '★';
    btn.addEventListener('click', () => setRating(i));
    starWrap.appendChild(btn);
  }
  const tags = ['Question quality','Timer experience','Difficulty','Wrong answer','Too easy','Too hard','Loved it','UI feel','Need explanation'];
  const tagWrap = overlay.querySelector('#rh-feedback-tags');
  tags.forEach(tag => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'rh-chip';
    chip.textContent = tag;
    chip.dataset.tag = tag;
    chip.addEventListener('click', () => chip.classList.toggle('active'));
    tagWrap.appendChild(chip);
  });
}

function setRating(n){
  document.querySelectorAll('#rh-feedback-stars .rh-star-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.value) <= n);
  });
  document.getElementById('rh-feedback-overlay').dataset.rating = String(n);
}
function openFeedback(type='General Quiz', status='Share your experience'){
  ensureFeedbackModal();
  const overlay = document.getElementById('rh-feedback-overlay');
  overlay.classList.add('rh-open');
  overlay.dataset.quizType = type;
  overlay.querySelector('#rh-feedback-quiz-type').textContent = type;
  overlay.querySelector('#rh-feedback-quiz-status').textContent = status;
  overlay.querySelector('#rh-feedback-text').value = '';
  overlay.querySelector('#rh-feedback-name').value = (window.profile && window.profile.name) || '';
  overlay.querySelectorAll('.rh-chip.active').forEach(x => x.classList.remove('active'));
  setRating(5);
}
function closeFeedback(){
  const overlay = document.getElementById('rh-feedback-overlay');
  if(overlay) overlay.classList.remove('rh-open');
}
function submitFeedback(){
  const overlay = document.getElementById('rh-feedback-overlay');
  if(!overlay) return;
  const entry = {
    createdAt: new Date().toISOString(),
    quizType: overlay.dataset.quizType || 'General Quiz',
    rating: Number(overlay.dataset.rating || 5),
    tags: Array.from(overlay.querySelectorAll('.rh-chip.active')).map(x => x.dataset.tag),
    text: overlay.querySelector('#rh-feedback-text').value.trim(),
    name: overlay.querySelector('#rh-feedback-name').value.trim(),
    userId: window.user?.id || null,
    email: window.user?.email || null
  };
  saveFeedback(entry);
  closeFeedback();
  toastMsg('Feedback saved ✓');
}

function ensureResultAction(target, type, status){
  if(!target || target.querySelector('.rh-result-action-row')) return;
  const row = document.createElement('div');
  row.className = 'rh-result-action-row';
  row.innerHTML = `
    <button type="button" class="rh-feedback-open-btn">Give Feedback</button>
    <a class="rh-official-btn secondary" href="${FACTS.faq}" target="_blank" rel="noopener">Official FAQ</a>
    <a class="rh-official-btn secondary" href="${FACTS.about}" target="_blank" rel="noopener">About RATHOD HUB</a>
  `;
  row.querySelector('.rh-feedback-open-btn').addEventListener('click', () => openFeedback(type, status));
  target.appendChild(row);
}

function watchResults(){
  const hubTest = document.getElementById('hub-test-result');
  if(hubTest && !hubTest.classList.contains('hidden') && /Test Complete!/i.test(hubTest.textContent || '')){
    ensureResultAction(hubTest, '45Q Test', '45Q Test complete hua. Kaisa laga?');
  }
  const n720 = document.getElementById('n720-pro-test-status');
  if(n720 && /Score:/i.test(n720.textContent || '')){
    ensureResultAction(n720.parentElement || n720, 'NEET 720 Pro Test', 'Pro Test submit ho gaya. Experience share karo.');
  }
  document.querySelectorAll('.qb-final-summary-box,.qb-shell').forEach(box => {
    const txt = box.textContent || '';
    if(/quiz|battle|winner|result|complete/i.test(txt)) ensureResultAction(box, 'Live Quiz / Daily 9 PM', 'Live quiz ya battle experience share karo.');
  });
}

function boot(){
  ensureStyle();
  ensureFactsCard();
  ensureFeedbackModal();
  watchResults();
}

window.openHubQuizFeedback = openFeedback;
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1200), { once:true });
else setTimeout(boot, 1200);
setInterval(boot, 2500);
})();
