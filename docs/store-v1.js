/* MIR/27: private cloud storage + explicit local mode. No service-role keys. */
(()=>{'use strict';
const API='https://baplujcmcrqnjyarkere.supabase.co',KEY='sb_publishable_Gj5hyMV4ovSFdBUNp2p0nQ_J_ja4PV_',AUTH='mir27.auth.v1',LEGACY='sb-baplujcmcrqnjyarkere-auth-token';
const localMode=!!window.MIR_PRIVATE_BANK;let auth=null,role=null,revision=0,queue=Promise.resolve(),refreshPromise=null,dbPromise=null;const images=new Map();
let offlineMode=false,offlinePacket=null,pending=false,lastSync=0;
function sessionLoad(){if(localMode)return null;try{const v=JSON.parse(localStorage.getItem(AUTH)||localStorage.getItem(LEGACY)||'null');return v?.access_token?v:null;}catch{return null;}}
auth=sessionLoad();
const RECOVERY='mir27.password-recovery.v1';let recovering=false;
try{recovering=!!auth&&sessionStorage.getItem(RECOVERY)==='1';}catch{}
function setRecovery(value){recovering=value;try{if(value)sessionStorage.setItem(RECOVERY,'1');else sessionStorage.removeItem(RECOVERY);}catch{}}
async function requestPasswordReset(email){
 if(localMode)throw new Error('Abre la web de MIR/27 para recuperar el acceso.');
 await request('/auth/v1/recover?redirect_to='+encodeURIComponent('https://mir-2027.vercel.app/'),{method:'POST',body:{email:email.trim()},bearer:false});
}
async function consumeRecoveryLink(){
 const params=new URLSearchParams(location.hash.slice(1));
 if(params.has('error')||params.has('error_code')){history.replaceState(null,'',location.pathname+location.search+'#recover');throw new Error('El enlace ha caducado o ya se ha utilizado. Solicita uno nuevo.');}
 if(params.get('type')!=='recovery')return;
 const access_token=params.get('access_token'),refresh_token=params.get('refresh_token');
 history.replaceState(null,'',location.pathname+location.search+'#reset-password');
 if(!access_token||!refresh_token){history.replaceState(null,'','#recover');throw new Error('El enlace de recuperación está incompleto. Solicita uno nuevo.');}
 auth={access_token,refresh_token,expires_at:Math.floor(Date.now()/1000)+3600};
 try{const user=await request('/auth/v1/user',{retry:false});if(!user?.id)throw new Error('No se pudo verificar el enlace.');persistAuth({...auth,user});setRecovery(true);}
 catch(e){persistAuth(null);setRecovery(false);history.replaceState(null,'','#recover');throw new Error('No se pudo validar el enlace. Comprueba la conexión o solicita uno nuevo.');}
}
async function updatePassword(password){
 if(!recovering||!auth)throw new Error('Abre primero el enlace de recuperación de tu correo.');
 if(typeof password!=='string'||password.length<8)throw new Error('Utiliza al menos 8 caracteres.');
 const user=await request('/auth/v1/user',{method:'PUT',body:{password},retry:false});
 persistAuth({...auth,user});setRecovery(false);return user;
}
function persistAuth(s){auth=s?{...s,expires_at:s.expires_at||Math.floor(Date.now()/1000)+(s.expires_in||3600)}:null;try{if(auth)localStorage.setItem(AUTH,JSON.stringify(auth));else{localStorage.removeItem(AUTH);localStorage.removeItem(LEGACY);}}catch{}}
async function request(path,{method='GET',body=null,bearer=true,retry=true}={}){if(bearer)await ensureAuth();const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),45000);try{const headers={apikey:KEY,'Content-Type':'application/json'};if(bearer&&auth?.access_token)headers.Authorization='Bearer '+auth.access_token;const res=await fetch(API+path,{method,headers,body:body===null?undefined:JSON.stringify(body),signal:ctl.signal,cache:'no-store'});const text=await res.text();let data;try{data=text?JSON.parse(text):null;}catch{data={message:'Respuesta del servidor no interpretable'};}if(!res.ok){if(res.status===401&&bearer&&retry&&auth?.refresh_token){await refresh();return request(path,{method,body,bearer,retry:false});}const e=new Error(data?.msg||data?.error_description||data?.message||data?.error||'Error de conexión '+res.status);e.status=res.status;throw e;}return data;}catch(e){if(e.name==='AbortError')throw new Error('La conexión tardó demasiado. El progreso pendiente se conserva en este dispositivo.');throw e;}finally{clearTimeout(timer);}}
async function refresh(){if(refreshPromise)return refreshPromise;if(!auth?.refresh_token)throw new Error('Inicia sesión para acceder al banco privado.');refreshPromise=request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:auth.refresh_token},bearer:false}).then(persistAuth).finally(()=>{refreshPromise=null;});return refreshPromise;}
async function ensureAuth(){if(localMode)return;if(!auth?.access_token)throw new Error('Inicia sesión para acceder al banco privado.');if((auth.expires_at||0)*1000<Date.now()+45000)await refresh();}
async function signIn(email,password){offlineMode=false;offlinePacket=null;images.clear();const s=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email:email.trim(),password},bearer:false});persistAuth(s);setRecovery(false);await membership();return auth.user;}
async function membership(){if(localMode){role='local';return role;}await ensureAuth();const m=await request('/rest/v1/app_members?select=role&user_id=eq.'+encodeURIComponent(auth.user.id));if(!m?.[0]){const error=new Error('La cuenta no tiene acceso autorizado a MIR/27.');error.status=403;throw error;}role=m[0].role;return role;}
async function signOut(){const owner=auth?.user?.id;try{await queue;}catch{}if(auth&&!offlineMode&&navigator.onLine!==false){try{await request('/auth/v1/logout',{method:'POST'});}catch{}}persistAuth(null);setRecovery(false);role=null;images.clear();offlineMode=false;offlinePacket=null;pending=false;if(owner)await Promise.all(['offline-','cached-state-','backups-'].map(p=>idbDelete(p+owner).catch(()=>{})));}
function database(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open('mir27.private.progress.v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('El navegador no permite almacenamiento local. Exporta tu progreso antes de cerrar.'));});return dbPromise;}
async function idbGet(key){const db=await database();return new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function idbSet(key,v){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(v,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
async function idbDelete(key){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
async function allRows(table,select='*',extra=''){const out=[];for(let offset=0;offset<50000;offset+=500){const batch=await request('/rest/v1/'+table+'?select='+select+'&order='+encodeURIComponent(table==='mir_content'?'kind,external_id':'external_id')+'&limit=500&offset='+offset+extra);if(!Array.isArray(batch))throw new Error('Colección no válida: '+table);out.push(...batch);if(batch.length<500)return out;}throw new Error('Banco demasiado grande para esta versión.');}
function assemble(rows){const b={schema:'mir2027.bank.v2',version:'1.0.0',questions:[],readings:[],flashcards:[],atlas:[],sources:[],topicStats:[],media:{},manifest:{}};const kinds={question:'questions',reading:'readings',flashcard:'flashcards',atlas:'atlas',source:'sources',topic:'topicStats'};for(const row of rows){if(kinds[row.kind])b[kinds[row.kind]].push(row.data);else if(row.kind==='manifest')b.manifest=row.data;}b.version=b.manifest.version||b.version;return b;}
function canFallback(error){return navigator.onLine===false||!error?.status;}
async function cachedPacket(){if(!auth?.user?.id)return null;const packet=await idbGet('offline-'+auth.user.id).catch(()=>null);return packet?.owner===auth.user.id&&packet?.bank&&packet?.state?packet:null;}
async function useOffline(){const packet=await cachedPacket();if(!packet)throw new Error('No hay una sesión descargada para esta cuenta. Conéctate para entrar y prepararla.');offlinePacket=packet;offlineMode=true;return packet;}
async function loadBank(){if(localMode)return window.MIR_PRIVATE_BANK;if(offlineMode)return(offlinePacket||await useOffline()).bank;try{return assemble(await allRows('mir_content','kind,external_id,data'));}catch(e){if(!canFallback(e))throw e;return(await useOffline()).bank;}}
async function loadState(){
 if(localMode)return MIRCore.normalize(await idbGet('local-progress'));
 const owner=auth?.user?.id;
 if(offlineMode||navigator.onLine===false){const packet=offlinePacket||await useOffline(),cached=await idbGet('cached-state-'+owner).catch(()=>null),dirty=await idbGet('pending-'+owner).catch(()=>null);pending=!!dirty;revision=Number(packet.state.revision||0);return MIRCore.merge(cached||packet.state,dirty||cached||packet.state);}
 try{await membership();const rows=await request('/rest/v1/user_state?select=state,revision&user_id=eq.'+encodeURIComponent(owner));revision=Number(rows?.[0]?.revision||0);let s=MIRCore.normalize(rows?.[0]?.state);s.revision=revision;const dirty=await idbGet('pending-'+owner).catch(()=>null);pending=!!dirty;if(dirty)s=MIRCore.merge(s,dirty);await idbSet('cached-state-'+owner,s).catch(()=>{});lastSync=Date.now();return s;}
 catch(e){if(!canFallback(e))throw e;await useOffline();return loadState();}
}
async function backupState(state){if(localMode)return;const owner=auth?.user?.id;if(!owner)return;const list=await idbGet('backups-'+owner)||[],now=Date.now();await idbSet('backups-'+owner,[{at:now,state:MIRCore.copy(state)},...list].slice(0,3));}
async function listBackups(){return localMode||!auth?.user?.id?[]:await idbGet('backups-'+auth.user.id)||[];}
function saveState(state){
 state.updatedAt=Date.now();const payload=MIRCore.copy(state),owner=auth?.user?.id;
 queue=queue.catch(()=>{}).then(async()=>{
  if(localMode){await idbSet('local-progress',payload);return payload;}
  if(!owner)throw new Error('Inicia sesión para guardar el progreso.');
  const key='pending-'+owner;await idbSet(key,payload);pending=true;
  if(offlineMode||navigator.onLine===false){offlinePacket=await cachedPacket();offlineMode=true;return payload;}
  if(auth?.user?.id!==owner)throw new Error('Vuelve a entrar con la cuenta de este progreso.');
  let merged=payload;
  for(let i=0;i<4;i++){
   let result;try{result=await request('/rest/v1/rpc/mir_save_state',{method:'POST',body:{p_expected_revision:revision,p_state:merged}});}catch(e){if(canFallback(e)&&await cachedPacket()){await useOffline();return merged;}throw e;}
   revision=Number(result.revision);
   if(result.ok){merged.revision=revision;await idbSet('cached-state-'+owner,merged);await idbDelete(key);pending=false;lastSync=Date.now();const backups=await listBackups().catch(()=>[]);if(!backups.length||Date.now()-backups[0].at>86400000)await backupState(merged).catch(()=>{});return merged;}
   merged=MIRCore.merge(merged,result.state);await idbSet(key,merged);
  }
  throw new Error('Otro dispositivo está guardando cambios. Reintenta; tu copia local permanece intacta.');
 });return queue;
}
async function media(id){if(localMode)return window.MIR_PRIVATE_BANK.media?.[id]||null;if(images.has(id))return images.get(id);if(offlineMode)return offlinePacket?.media?.[id]||null;const rows=await request('/rest/v1/mir_media?select=data&external_id=eq.'+encodeURIComponent(id)+'&limit=1');const v=rows?.[0]?.data||null;if(v){if(images.size>80)images.delete(images.keys().next().value);images.set(id,v);}return v;}
async function mediaCatalog(){
 const metadata=(id,v)=>({id,title:v.title||v.alt||'Imagen del documento',alt:v.alt||'',sourceId:v.sourceId||'',pdfPage:v.pdfPage||null});
 if(localMode)return Object.entries(window.MIR_PRIVATE_BANK.media||{}).map(([id,v])=>metadata(id,v));
 if(offlineMode)return Object.entries(offlinePacket?.media||{}).map(([id,v])=>metadata(id,v));
 const owner=auth?.user?.id;
 const rows=await allRows('mir_media','external_id,title:data->>title,alt:data->>alt,sourceId:data->>sourceId,pdfPage:data->pdfPage');
 if(auth?.user?.id!==owner)throw new Error('La cuenta cambió mientras se cargaban las imágenes.');
 return rows.map(row=>metadata(row.external_id,row));
}
async function prepareOffline(bank,state,sessionId){
 if(localMode)throw new Error('Este archivo ya funciona sin conexión.');
 if(navigator.onLine===false||offlineMode)throw new Error('Necesitas conexión para preparar una sesión.');
 await membership();const owner=auth.user.id,session=state.sessions[sessionId];if(!session?.items?.length)throw new Error('Inicia una sesión antes de descargarla.');
 const subset={schema:'mir2027.bank.v2',version:bank.version,questions:[],readings:[],flashcards:[],atlas:[],sources:bank.sources,topicStats:[],manifest:{offlineSession:session.id}},mediaIds=new Set(),sets={question:'questions',reading:'readings',flashcard:'flashcards'};
 for(const item of session.items){const data=item.data||bank[sets[item.kind]]?.find(x=>x.id===item.id);if(!data)throw new Error('Falta una actividad de la sesión.');if(!subset[sets[item.kind]].some(x=>x.id===data.id))subset[sets[item.kind]].push(MIRCore.copy(data));for(const id of [...(data.images||[]),...(data.commentaryImages||[]),...(data.context?.images||[])])mediaIds.add(id);}
 const downloaded={};for(const id of mediaIds){const value=await media(id);if(!value?.data)throw new Error('No se pudo descargar una imagen. La sesión anterior se conserva.');downloaded[id]=value;}
 const packet={owner,sessionId,savedAt:Date.now(),bank:subset,state:MIRCore.copy(state),media:downloaded};
 if(auth?.user?.id!==owner)throw new Error('La cuenta cambió durante la descarga.');
 await idbSet('offline-'+owner,packet);await idbSet('cached-state-'+owner,state);offlinePacket=packet;
 return{sessionId,savedAt:packet.savedAt,activities:session.items.length,images:mediaIds.size};
}
async function offlineInfo(){const packet=await cachedPacket();return packet?{sessionId:packet.sessionId,savedAt:packet.savedAt,activities:packet.state.sessions[packet.sessionId]?.items.length||0,images:Object.keys(packet.media).length}:null;}
async function removeOffline(){if(auth?.user?.id)await idbDelete('offline-'+auth.user.id);offlinePacket=null;}
async function reconnect(){if(localMode)return;await ensureAuth();await membership();offlineMode=false;}
async function importBank(b,onProgress=()=>{}){if(localMode)throw new Error('Usa la opción de conectar con la web desde el paquete privado.');if(role!=='admin')throw new Error('Solo el administrador puede incorporar el banco.');if(b?.schema!=='mir2027.bank.v2'||!Array.isArray(b.questions))throw new Error('Archivo de banco incompatible.');const sets=[['source',b.sources||[]],['media',Object.values(b.media||{})],['question',b.questions],['reading',b.readings||[]],['flashcard',b.flashcards||[]],['atlas',b.atlas||[]],['topic',(b.topicStats||[]).map((x,i)=>({...x,id:x.id||'topic-'+MIRCore.hash(x.subject+'|'+x.topic)}))]];let processed=0;const rejected=[],total=sets.reduce((n,[,items])=>n+items.length,0);for(const [kind,items] of sets){const step=kind==='media'?2:20;for(let i=0;i<items.length;i+=step){let result;for(let retry=0;;retry++){try{result=await request('/rest/v1/rpc/mir_import_batch',{method:'POST',body:{p_kind:kind,p_items:items.slice(i,i+step)}});break;}catch(e){if(retry>=3||(e.status&&e.status<500&&e.status!==429))throw e;await new Promise(r=>setTimeout(r,1000*2**retry));}}processed+=result.processed;rejected.push(...result.rejected.map(x=>({...x,kind})));onProgress({processed,total,rejected:rejected.length,kind});}}
const manifest={...(b.manifest||{}),id:'documental-v1',importedAt:new Date().toISOString(),importComplete:rejected.length===0,processed,rejected:rejected.length};await request('/rest/v1/rpc/mir_import_batch',{method:'POST',body:{p_kind:'manifest',p_items:[manifest]}});return{processed,total,rejected};}
async function init(){if(localMode)return{mode:'local',user:null,role:'local'};await consumeRecoveryLink();if(!auth)return{mode:'cloud',user:null,role:null};if(recovering)return{mode:'cloud',user:auth.user,recovery:true};if(navigator.onLine===false){await useOffline();return{mode:'offline',user:auth.user,role:'cached'};}try{await membership();return{mode:'cloud',user:auth.user,role};}catch(e){if(canFallback(e)){await useOffline();return{mode:'offline',user:auth.user,role:'cached'};}if(e.status===400||e.status===401)persistAuth(null);throw e;}}
window.MIRStore={VERSION:'1.3.1',init,signIn,signOut,requestPasswordReset,updatePassword,prepareOffline,offlineInfo,removeOffline,reconnect,listBackups,backupState,loadBank,loadState,saveState,media,mediaCatalog,importBank,get offline(){return offlineMode;},get pending(){return pending;},get lastSync(){return lastSync;},get recovering(){return recovering;},get local(){return localMode;},get user(){return auth?.user||null;},get role(){return role;},API};
})();
