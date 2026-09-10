const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../docs/core-v1.js'),L=require('../docs/learning-v1.js');
const q=id=>({id,kind:'question',stem:'Synthetic clinical scenario '+id,options:['A','B','C','D'],answer:0,learningConcept:'concept',subject:'Synthetic',status:'historico_documental',transfer:true});
const bank={questions:['a','b','c','d'].map(q),flashcards:[],readings:[]};
const time=1900000000000;
function trained(){const s=C.blank();s.attempts=[{id:'old',itemId:'a',kind:'question',scored:true,correct:true,confidence:'sure',at:time,concept:'concept',family:C.family(bank.questions[0])}];return s;}
test('error causes require an actual scored error and remain user supplied',()=>{
 const s=trained();assert.equal(L.classify(s,'old','knowledge'),false);
 s.attempts.push({...s.attempts[0],id:'wrong',correct:false});
 assert.equal(L.errorProfile(s).unknown,1);assert.equal(L.classify(s,'wrong','confusion',10),true);
 assert.equal(L.classify(s,'wrong','made-up'),false);assert.equal(L.errorProfile(s).counts.confusion,1);
 s.attempts.push({...s.attempts[0],id:'observation',correct:false,scored:false});assert.equal(L.classify(s,'observation','reading'),false);
});
test('classification and exposures survive synchronization without modifying attempts',()=>{
 const a=trained(),b=C.copy(a);a.attempts[0].correct=false;b.attempts[0].correct=false;
 L.classify(a,'old','reading',20);L.classify(b,'old','calculation',10);L.expose(b,'concept','memory',30);
 const m=C.merge(a,b);assert.equal(m.errorReviews.old.cause,'reading');assert.equal(m.conceptExposures.concept.at,30);assert.equal(m.attempts.length,1);
});
test('delayed queue waits a full seven days and requires a genuinely unseen family',()=>{
 const s=trained();assert.equal(L.queue(bank,s,time+7*C.DAY-1)[0].ready,false);
 const x=L.queue(bank,s,time+7*C.DAY)[0];assert.equal(x.ready,true);assert.notEqual(x.item.id,'a');
 const b=C.copy(bank);b.questions.forEach(q=>q.family='same');assert.equal(L.queue(b,s,time+8*C.DAY)[0].blocked,'cases');
});
test('a viewed explanation resets the due date and invalidates a started check',()=>{
 const s=trained(),x=L.queue(bank,s,time+8*C.DAY)[0];const session=C.makeSession(bank,s,[x.item]);
 assert.equal(L.validateCheck(s,session.items[0],time+8*C.DAY).valid,true);
 L.expose(s,'concept','memory',time+8*C.DAY);assert.equal(L.validateCheck(s,session.items[0],time+8*C.DAY+1).valid,false);
 assert.equal(L.queue(bank,s,time+8*C.DAY)[0].dueAt,time+15*C.DAY);
});
test('a successful confident seven-day check advances to thirty days; an error resets it',()=>{
 const s=trained(),x=L.queue(bank,s,time+8*C.DAY)[0];s.attempts.push({id:'check',itemId:x.item.id,kind:'question',concept:'concept',family:x.item.retention.family,scored:true,correct:true,confidence:'sure',at:time+8*C.DAY,retention:{...x.item.retention,valid:true}});
 const result=L.queue(bank,s,time+37*C.DAY)[0];assert.equal(result.stageDays,30);assert.equal(result.ready,false);assert.equal(L.queue(bank,s,time+38*C.DAY)[0].ready,true);
 s.attempts.push({...s.attempts[0],id:'failure',correct:false,at:time+39*C.DAY});assert.equal(L.queue(bank,s,time+40*C.DAY)[0].stageDays,7);
});
test('active exams reserve concepts and their cases; a topic heading alone cannot establish a precise concept',()=>{
 const s=trained();s.sessions.exam=C.makeSession(bank,s,[{id:'b',kind:'question'}],{mode:'exam'});
 assert.equal(L.queue(bank,s,time+8*C.DAY)[0].blocked,'session');
 const broad=C.copy(bank);broad.questions.forEach(q=>delete q.learningConcept);assert.equal(L.queue(broad,s,time+8*C.DAY).length,0);
});
test('retention metadata survives a frozen session and answer, and does not re-score history',()=>{
 const s=trained(),x=L.queue(bank,s,time+8*C.DAY)[0],session=C.makeSession(bank,s,[x.item]);
 const check=L.validateCheck(s,session.items[0],time+8*C.DAY);C.answer(s,session,0,{selected:0,confidence:'sure',retention:check},()=>null);
 assert.equal(s.attempts[1].retention.valid,true);assert.equal(s.attempts[0].at,time);assert.equal(s.preferences.dailySize,10);
});
