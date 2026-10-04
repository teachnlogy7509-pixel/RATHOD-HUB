/* RATHOD HUB • imports completed YPT 2.0 focus sessions */
(()=>{
'use strict';
const QUEUE='rathod_hub_focus_bridge_v1';
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
function currentUser(){try{return typeof user!=='undefined'&&user?user:null}catch{return null}}
function client(){try{return typeof db!=='undefined'&&db?db:null}catch{return null}}
let busy=false;
async function sync(){if(busy)return;const u=currentUser();if(!u?.id)return;const rows=read(QUEUE,[]).filter(x=>x&&Number(x.seconds)>=5);if(!rows.length)return;busy=true;try{
 const statsKey=`rathod_focus_v2_${u.id}_stats`,stats=read(statsKey,{sessions:[],goalHours:4}),map=new Map((stats.sessions||[]).map(x=>[x.id,x]));rows.forEach(x=>map.set(x.id,{id:x.id,date:x.date,seconds:Math.round(Number(x.seconds||0)),subject:x.subject||'Other',at:x.at||new Date().toISOString()}));stats.sessions=[...map.values()];localStorage.setItem(statsKey,JSON.stringify(stats));
 const ackKey=`rathod_hub_focus_bridge_ack_${u.id}`,done=new Set(read(ackKey,[])),pending=rows.filter(x=>!done.has(x.id)),api=client();if(!pending.length||!api)return;
 const payload=pending.map(x=>({id:x.id,user_id:u.id,date:x.date,seconds:Math.round(Number(x.seconds||0)),subject:x.subject||'Other',started_at:x.at||new Date().toISOString()}));const {error}=await api.from('focus_sessions').upsert(payload,{onConflict:'id'});if(error)throw error;payload.forEach(x=>done.add(x.id));localStorage.setItem(ackKey,JSON.stringify([...done].slice(-5000)));window.dispatchEvent(new CustomEvent('rathod-focus-imported',{detail:{count:payload.length}}));
 }catch(e){console.warn('YPT 2.0 focus bridge pending',e)}finally{busy=false}}
window.addEventListener('rathod-focus-bridge',sync);window.addEventListener('online',sync);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync()});setInterval(sync,30000);setTimeout(sync,1800);
})();
