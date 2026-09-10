const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const {IDBFactory}=require('fake-indexeddb');
const C=require('../docs/core-v1.js');
const root=path.join(__dirname,'..','docs');
const bank={schema:'mir2027.bank.v2',version:'1.2.0',questions:[{id:'q',stem:'Synthetic question for offline recovery',options:['A','B','C','D'],answer:1,status:'historico_documental',images:['photo'],commentaryImages:['explanation'],references:[]}],readings:[],flashcards:[],sources:[],atlas:[],topicStats:[],manifest:{}};
function server(){return{state:C.blank(),revision:0,calls:[],missing:false,conflicts:0};}
function boot(db,remote,{online=true,owner='alice',authenticated=true}={}){
 const dom=new JSDOM('',{url:'https://mir-2027.vercel.app/',runScripts:'outside-only'}),w=dom.window;
 w.indexedDB=db;let connected=online;Object.defineProperty(w.navigator,'onLine',{get:()=>connected});
 if(authenticated)w.localStorage.setItem('mir27.auth.v1',JSON.stringify({access_token:'synthetic',refresh_token:'synthetic',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:owner}}));
 w.fetch=async(url,opts)=>{
  if(!connected)throw new TypeError('Synthetic disconnected network');
  const body=opts.body?JSON.parse(opts.body):null;remote.calls.push({url,body});let result;
  if(url.includes('/app_members?'))result=[{role:'admin'}];
  else if(url.includes('/mir_content?'))result=bank.questions.map(data=>({kind:'question',external_id:data.id,data}));
  else if(url.includes('/user_state?'))result=[{state:remote.state,revision:remote.revision}];
  else if(url.includes('/mir_media?'))result=remote.missing?[]:[{data:{id:new URL(url).searchParams.get('external_id').slice(3),data:'data:image/jpeg;base64,c3ludGhldGlj'}}];
  else if(url.includes('/rpc/mir_save_state')){
   if(body.p_expected_revision!==remote.revision){remote.conflicts++;result={ok:false,state:remote.state,revision:remote.revision};}
   else{remote.state=structuredClone(body.p_state);remote.revision++;result={ok:true,revision:remote.revision};}
  }else if(url.endsWith('/logout'))result={};
  else throw new Error('Unexpected request '+url);
  return new Response(JSON.stringify(result));
 };
 for(const name of ['core-v1','learning-v1','store-v1'])w.eval(fs.readFileSync(path.join(root,name+'.js'),'utf8'));
 return{dom,w,S:w.MIRStore,setOnline(value){connected=value;},close(){dom.window.close();}};
}
async function prepare(app){
 await app.S.init();const state=await app.S.loadState(),session=C.makeSession(bank,state,[{id:'q',kind:'question'}],{id:'downloaded'});
 state.sessions[session.id]=session;state.activeSession=session.id;
 const saved=await app.S.saveState(state);await app.S.prepareOffline(bank,saved,session.id);return saved;
}
test('download survives reload offline and merges both devices after a revision conflict',async()=>{
 const db=new IDBFactory(),remote=server();let app=boot(db,remote);
 await prepare(app);app.close();app=boot(db,remote,{online:false});
 try{
  assert.equal((await app.S.init()).mode,'offline');assert.equal((await app.S.loadBank()).questions.length,1);
  assert.ok((await app.S.media('photo')).data);assert.ok((await app.S.media('explanation')).data);
  const state=await app.S.loadState(),session=state.sessions.downloaded;
  C.answer(state,session,0,{selected:1,confidence:'sure'},()=>null);state.notes.q={text:'Offline note',at:Date.now()};state.marks.q={value:true,at:Date.now()};
  await app.S.saveState(state);assert.equal(app.S.pending,true);app.close();app=boot(db,remote,{online:false});
  await app.S.init();const resumed=await app.S.loadState();assert.equal(resumed.attempts.length,1);assert.equal(resumed.notes.q.text,'Offline note');
  remote.state.attempts.push({id:'other-device',itemId:'another',kind:'question',correct:false,at:Date.now()});remote.state.notes.another={text:'Other device note',at:Date.now()};remote.revision++;
  app.setOnline(true);await app.S.reconnect();const merged=await app.S.saveState(resumed);
  assert.equal(remote.conflicts,1);assert.equal(merged.attempts.length,2);assert.equal(remote.state.attempts.length,2);assert.equal(merged.notes.another.text,'Other device note');assert.equal(merged.marks.q.value,true);assert.equal(app.S.pending,false);
  assert.ok((await app.S.listBackups()).length>0);
 }finally{app.close();}
});
test('private offline data belongs to its account and logout removes the download',async()=>{
 const db=new IDBFactory(),remote=server(),a=boot(db,remote);await prepare(a);
 const b=boot(db,remote,{online:false,owner:'bob'});
 try{await assert.rejects(()=>b.S.init(),/No hay una sesión descargada/);assert.equal(await b.S.offlineInfo(),null);}finally{b.close();}
 await a.S.signOut();assert.equal(a.S.user,null);a.close();const after=boot(db,remote,{online:false});
 try{await assert.rejects(()=>after.S.init(),/No hay una sesión descargada/);}finally{after.close();}
});
test('incomplete downloads preserve the previous complete packet',async()=>{
 const app=boot(new IDBFactory(),server());
 try{
  const state=await prepare(app),old=await app.S.offlineInfo();
  const q={...bank.questions[0],id:'q2',images:['missing'],commentaryImages:[]},b={...bank,questions:[q]};
  const session=C.makeSession(b,state,[{id:q.id,kind:'question'}],{id:'incomplete'});state.sessions.incomplete=session;
  // Return an absent resource only for the new image; old in-memory media is still valid.
  app.w.fetch=async()=>new Response(JSON.stringify([]));
  // Membership must still succeed.
  app.w.fetch=async url=>new Response(JSON.stringify(url.includes('/app_members?')?[{role:'admin'}]:[]));
  await assert.rejects(()=>app.S.prepareOffline(b,state,'incomplete'),/No se pudo descargar una imagen/);
  assert.equal((await app.S.offlineInfo()).sessionId,old.sessionId);
 }finally{app.close();}
});
test('loss of coverage without a download still persists unsynced progress',async()=>{
 const db=new IDBFactory(),remote=server();let app=boot(db,remote);
 await app.S.init();let state=await app.S.loadState();app.setOnline(false);state.notes.q={text:'Keep me',at:Date.now()};await app.S.saveState(state);app.close();
 app=boot(db,remote);try{await app.S.init();state=await app.S.loadState();assert.equal(state.notes.q.text,'Keep me');await app.S.saveState(state);assert.equal(remote.state.notes.q.text,'Keep me');}finally{app.close();}
});
test('a revoked membership online is not treated as a network outage',async()=>{
 const db=new IDBFactory(),remote=server(),app=boot(db,remote);await prepare(app);
 try{app.w.fetch=async()=>new Response('[]');await assert.rejects(()=>app.S.init(),/no tiene acceso autorizado/);assert.equal(app.S.offline,false);}finally{app.close();}
});
test('unscored study, its review date and optional preference survive offline reload and synchronization',async()=>{
 const db=new IDBFactory(),remote=server();let app=boot(db,remote);await app.S.init();let state=await app.S.loadState();
 const question={...bank.questions[0],isAnnulled:true,answer:null},content={...bank,questions:[question]},session=C.makeSession(content,state,[{id:'q',kind:'question'}],{id:'unscored-offline'});
 state.sessions[session.id]=session;state.activeSession=session.id;state.preferences.includeObservations=true;state=await app.S.saveState(state);await app.S.prepareOffline(content,state,session.id);app.close();app=boot(db,remote,{online:false});
 try{
  await app.S.init();state=await app.S.loadState();C.answer(state,state.sessions[session.id],0,{selected:1,confidence:'sure'},()=>null);state=await app.S.saveState(state);app.close();app=boot(db,remote,{online:false});await app.S.init();state=await app.S.loadState();
  assert.equal(state.attempts[0].scored,false);assert.equal(state.attempts[0].correct,null);assert.equal(state.studySchedule.q.intervalDays,7);assert.equal(state.preferences.includeObservations,true);assert.equal(C.stats(state).first.total,0);
  app.setOnline(true);await app.S.reconnect();await app.S.saveState(state);assert.equal(remote.state.studySchedule.q.intervalDays,7);assert.equal(remote.state.attempts[0].scored,false);
 }finally{app.close();}
});
test('cloud image catalog requests metadata only and keeps binary image data on demand',async()=>{
 const app=boot(new IDBFactory(),server());try{
  await app.S.init();let call;
  app.w.fetch=async url=>{call=new URL(url);return new Response(JSON.stringify([{external_id:'photo',title:'Source photograph',sourceId:'document',pdfPage:7}]));};
  const catalog=await app.S.mediaCatalog();assert.equal(catalog[0].id,'photo');assert.equal(catalog[0].pdfPage,7);assert.equal(catalog[0].data,undefined);
  assert.equal(call.searchParams.get('order'),'external_id');assert.match(call.searchParams.get('select'),/title:data->>title/);assert.ok(!call.searchParams.get('select').split(',').includes('data'));
 }finally{app.close();}
});
test('service worker serves its offline shell and never intercepts cloud data',async()=>{
 const handlers={},cached={shell:true};let claimed=false;
 const cache={match:async key=>key==='/index.html'?cached:null,addAll:async()=>{}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),{URL,Response,Set,Promise,self:{location:{origin:'https://mir-2027.vercel.app'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{claimed=true;}}},caches:{open:async()=>cache,keys:async()=>[],delete:async()=>{}},fetch:async()=>{throw Error('offline');}});
 let response;
 handlers.fetch({request:{url:'https://baplujcmcrqnjyarkere.supabase.co/rest/v1/user_state',method:'GET'},respondWith:p=>{response=p;}});assert.equal(response,undefined);
 handlers.fetch({request:{url:'https://mir-2027.vercel.app/private-bank.json',method:'GET'},respondWith:p=>{response=p;}});assert.equal(response,undefined);
 handlers.fetch({request:{url:'https://mir-2027.vercel.app/',method:'GET',mode:'navigate'},respondWith:p=>{response=p;}});assert.equal(await response,cached);
 let activation;handlers.activate({waitUntil:p=>{activation=p;}});await activation;assert.equal(claimed,true);
});
test('service worker never serves an old script for a new version query',async()=>{
 const handlers={},fresh={version:'future'},requested=[];
 vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),{URL,Response,Set,Promise,self:{location:{origin:'https://mir-2027.vercel.app'},addEventListener:(name,fn)=>handlers[name]=fn},caches:{open:async()=>({match:async(request,options)=>{assert.equal(options?.ignoreSearch,undefined);return null;}})},fetch:async request=>{requested.push(request.url);return fresh;}});
 let response;handlers.fetch({request:{url:'https://mir-2027.vercel.app/core-v1.js?v=future',method:'GET'},respondWith:p=>{response=p;}});assert.equal(await response,fresh);assert.equal(requested.length,1);
});
