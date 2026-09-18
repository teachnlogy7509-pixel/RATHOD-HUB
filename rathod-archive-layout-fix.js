/* RATHOD HUB • Question Archive / Mistake Vault overlap fix */
(function(){
'use strict';
function apply(){
  if(document.getElementById('rh-archive-layout-fix'))return;
  var style=document.createElement('style');
  style.id='rh-archive-layout-fix';
  style.textContent=''
    +'#mistake-vault-list>div{min-width:0!important;max-width:100%!important;overflow:hidden!important;box-sizing:border-box!important}'
    +'#mistake-vault-list>div>.flex.justify-between{align-items:flex-start!important;min-width:0!important}'
    +'#mistake-vault-list>div>.flex.justify-between>div:first-child{min-width:0!important;flex:1 1 auto!important;max-width:100%!important}'
    +'#mistake-vault-list b{display:block!important;max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;line-height:1.5!important}'
    +'#mistake-vault-list>div>.flex.justify-between>span{flex:0 0 auto!important;margin-left:8px!important;white-space:nowrap!important}'
    +'#mistake-vault-list .flex.flex-wrap{align-items:center!important;min-width:0!important}'
    +'#mistake-vault-list button,#mistake-vault-list p,#mistake-vault-list span{max-width:100%;overflow-wrap:anywhere;word-break:break-word}'
    +'@media(max-width:640px){#mistake-vault-list>div{padding:12px!important}#mistake-vault-list>div>.flex.justify-between{gap:8px!important}#mistake-vault-list b{font-size:13px!important}.rh-content #mistake-vault-list button{white-space:normal!important}}
';
  document.head.appendChild(style);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
})();
