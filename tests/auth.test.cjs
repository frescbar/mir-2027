const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.join(__dirname,'..');
async function until(check){for(let i=0;i<120;i++){if(check())return;await new Promise(r=>setTimeout(r,15));}throw new Error('Authentication view did not appear');}
function boot(hash='',respond=()=>{throw Error('Unexpected network request');}){
 const errors=[],calls=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'docs/index.html'),'utf8'),{url:'https://mir-2027.vercel.app/'+hash,runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window;w.scrollTo=()=>{};w.structuredClone=structuredClone;
 w.fetch=async(url,options)=>{const call={url,method:options.method,body:options.body?JSON.parse(options.body):null,headers:options.headers};calls.push(call);const out=respond(call);return new Response(JSON.stringify(out.body??out),{status:out.status||200});};
 for(const name of ['core-v1','learning-v1','store-v1','print-v1','launcher','app-v1'])w.eval(fs.readFileSync(path.join(root,'docs',name+'.js'),'utf8'));
 return{dom,w,calls,errors,find:s=>w.document.querySelector(s)};
}
test('forgot-password form sends a recovery request without authenticating or touching progress',async()=>{
 const app=boot('',call=>{assert.ok(call.url.includes('/auth/v1/recover?'));return{};});
 try{
  await until(()=>app.find('#login'));app.find('a[href="#recover"]').click();await until(()=>app.find('#recover'));
  app.find('#recover input').value=' user@example.test ';app.find('#recover').dispatchEvent(new app.w.Event('submit',{bubbles:true,cancelable:true}));
  await until(()=>app.find('#recover').hidden);
  assert.equal(app.calls.length,1);assert.equal(app.calls[0].method,'POST');assert.equal(app.calls[0].body.email,'user@example.test');
  assert.equal(new URL(app.calls[0].url).searchParams.get('redirect_to'),'https://mir-2027.vercel.app/');
  assert.equal(app.calls[0].headers.Authorization,undefined);assert.equal(app.w.localStorage.length,0);
  assert.match(app.find('#recovery-message').textContent,/Si el correo corresponde/);assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
});
test('verified recovery link opens password form, checks confirmation and returns to login after update',async()=>{
 const user={id:'test-user',email:'user@example.test'};
 const app=boot('#access_token=synthetic-access&refresh_token=synthetic-refresh&type=recovery',call=>{
  if(call.url.endsWith('/auth/v1/user'))return user;
  if(call.url.endsWith('/auth/v1/logout'))return{};
  throw Error('Recovery must not read or write study data');
 });
 try{
  await until(()=>app.find('#reset-password'));
  assert.equal(app.w.location.hash,'#reset-password');assert.equal(app.w.MIRStore.recovering,true);
  assert.equal(app.calls[0].headers.Authorization,'Bearer synthetic-access');assert.equal(app.find('#nav').children.length,0);
  const form=app.find('#reset-password');form.elements.namedItem('password').value='synthetic-new-password';form.elements.namedItem('confirmation').value='different-password';
  form.dispatchEvent(new app.w.Event('submit',{bubbles:true,cancelable:true}));assert.match(app.find('#password-message').textContent,/no coinciden/);assert.equal(app.calls.length,1);
  form.elements.namedItem('confirmation').value='synthetic-new-password';form.dispatchEvent(new app.w.Event('submit',{bubbles:true,cancelable:true}));
  await until(()=>app.find('#login'));
  assert.deepEqual(app.calls.map(c=>c.method),['GET','PUT','POST']);assert.deepEqual(app.calls[1].body,{password:'synthetic-new-password'});
  assert.equal(app.w.MIRStore.recovering,false);assert.equal(app.w.MIRStore.user,null);assert.equal(app.w.localStorage.length,0);assert.equal(app.w.sessionStorage.length,0);assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
});
test('expired recovery links are cleared and offer a fresh request',async()=>{
 const app=boot('#error=access_denied&error_code=otp_expired&error_description=Expired');
 try{await until(()=>app.find('#recover'));assert.equal(app.w.location.hash,'#recover');assert.match(app.find('#recovery-message').textContent,/caducado/);assert.equal(app.calls.length,0);assert.equal(app.w.MIRStore.user,null);assert.deepEqual(app.errors,[]);}finally{app.dom.window.close();}
});
test('invalid recovery sessions cannot set passwords or persist credentials',async()=>{
 const app=boot('#access_token=invalid&refresh_token=invalid&type=recovery',()=>({status:401,body:{message:'Invalid token'}}));
 try{await until(()=>app.find('#recover'));assert.equal(app.find('#reset-password'),null);assert.equal(app.w.localStorage.length,0);assert.equal(app.w.MIRStore.recovering,false);await assert.rejects(()=>app.w.MIRStore.updatePassword('synthetic-new-password'),/enlace de recuperación/);assert.equal(app.calls.length,1);assert.deepEqual(app.errors,[]);}finally{app.dom.window.close();}
});
