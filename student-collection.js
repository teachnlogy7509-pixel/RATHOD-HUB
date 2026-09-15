/* RATHOD HUB VIP Bridge: Daily 9 PM answer/completion events.
   This file is loaded by index.html after the main app scripts. */
(function(){
'use strict';
function name(){try{return String(window.profile?.name||window.user?.user_metadata?.name||'RATHOD Aspirant').slice(0,60)}catch(e){return 'RATHOD Aspirant'}}
async function emit(type,payload,mode){try{if(!window.db||!window.user)return;var r=await window.db.from('rh_bridge_events').insert({event_type:type,delivery_mode:mode||'digest',user_id:window.user.id,display_name:name(),payload:payload||{}});if(r.error)console.info('Daily bridge event SQL pending.',r.error.message)}catch(e){console.info('Daily bridge event skipped.',e?.message||e)}}
function wrap(key,after){var fn=window[key];if(typeof fn!=='function'||fn.__rhDailyBridgeWrapped)return;var wrapped=async function(){var args=arguments,result=await fn.apply(this,args);try{await after(args,result)}catch(e){}return result};wrapped.__rhDailyBridgeWrapped=true;window[key]=wrapped}
function patch(){
 wrap('submitBattleAnswer',async(args)=>{await emit('question_solved',{mode:'Daily 9 PM',is_correct:null,xp_delta:0},'digest')});
 wrap('finishBattle',async()=>{await emit('quiz_completed',{mode:'Daily 9 PM'},'immediate')});
}
patch();setInterval(patch,2500);
})();
