/* Admin-controlled VIP premium launch background */
(function(){
'use strict';
if(window.__RH_VIP_LAUNCH_BG__) return;
window.__RH_VIP_LAUNCH_BG__ = 1;

const DEFAULT_CONFIG = {
  mode: 'aurora',
  opacity: 0.22,
  videoSrc: '',
  blur: 0,
  tint: 'gold'
};

function readConfig(){
  try{
    const local = JSON.parse(localStorage.getItem('rh_admin_vip_bg') || 'null');
    const win = window.RH_ADMIN_VIP_BG || null;
    return { ...DEFAULT_CONFIG, ...(local || {}), ...(win || {}) };
  }catch(e){
    return { ...DEFAULT_CONFIG };
  }
}

function ensureStyle(){
  if(document.getElementById('rh-vip-launch-bg-style')) return;
  const style = document.createElement('style');
  style.id = 'rh-vip-launch-bg-style';
  style.textContent = `
    #rh-vip-launch-bg{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
    #rh-vip-launch-bg .rh-vip-bg-layer{position:absolute;inset:-8%;width:116%;height:116%}
    #rh-vip-launch-bg .rh-vip-bg-aurora{background:
      radial-gradient(circle at 12% 18%, rgba(255,190,92,.30), transparent 26%),
      radial-gradient(circle at 84% 18%, rgba(255,120,46,.22), transparent 22%),
      radial-gradient(circle at 28% 82%, rgba(250,204,21,.18), transparent 24%),
      radial-gradient(circle at 70% 78%, rgba(168,85,247,.14), transparent 26%),
      linear-gradient(120deg, rgba(7,10,18,.96), rgba(18,10,6,.94) 46%, rgba(8,10,14,.96));
      animation: rhVipAuroraMove 16s ease-in-out infinite alternate;
      filter:saturate(1.15)
    }
    #rh-vip-launch-bg .rh-vip-bg-grid{background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:42px 42px;mix-blend-mode:soft-light;opacity:.20}
    #rh-vip-launch-bg .rh-vip-bg-shine{background:linear-gradient(120deg,transparent 0%,rgba(255,255,255,.10) 22%,transparent 44%,transparent 100%);transform:translateX(-40%);animation:rhVipShine 8s linear infinite;opacity:.45}
    #rh-vip-launch-bg video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(1.05) contrast(1.02)}
    body > *:not(#rh-vip-launch-bg){position:relative;z-index:1}
    @keyframes rhVipAuroraMove{0%{transform:scale(1) translate3d(0,0,0)}50%{transform:scale(1.05) translate3d(-1.5%,1.5%,0)}100%{transform:scale(1.08) translate3d(1.5%,-1%,0)}}
    @keyframes rhVipShine{0%{transform:translateX(-50%) skewX(-18deg)}100%{transform:translateX(160%) skewX(-18deg)}}
  `;
  document.head.appendChild(style);
}

function ensureRoot(){
  let root = document.getElementById('rh-vip-launch-bg');
  if(!root){
    root = document.createElement('div');
    root.id = 'rh-vip-launch-bg';
    document.body.prepend(root);
  }
  return root;
}

function render(){
  if(!document.body) return;
  ensureStyle();
  const cfg = readConfig();
  const root = ensureRoot();
  root.style.opacity = String(cfg.opacity || DEFAULT_CONFIG.opacity);
  root.style.filter = cfg.blur ? `blur(${cfg.blur}px)` : 'none';
  if(cfg.mode === 'video' && cfg.videoSrc){
    root.innerHTML = `<video autoplay muted loop playsinline webkit-playsinline><source src="${cfg.videoSrc}"></video><div class="rh-vip-bg-layer rh-vip-bg-grid"></div><div class="rh-vip-bg-layer rh-vip-bg-shine"></div>`;
  }else{
    root.innerHTML = `<div class="rh-vip-bg-layer rh-vip-bg-aurora"></div><div class="rh-vip-bg-layer rh-vip-bg-grid"></div><div class="rh-vip-bg-layer rh-vip-bg-shine"></div>`;
  }
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once:true });
else setTimeout(render, 0);
setInterval(render, 12000);
})();
