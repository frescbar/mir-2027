const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../docs/core-v1.js');
const q=(id,concept='alpha')=>({id,kind:'question',stem:'Synthetic question '+id,options:['A','B','C','D'],answer:0,learningConcept:concept,subject:'Synthetic',topic:'Same title',commentary:'Synthetic explanation',status:'historico_documental'});
const bank={questions:[q('one'),q('two'),q('other','beta')],flashcards:[{id:'ma',concept:'alpha',memoryCard:true,mnemonic:'Alpha'},{id:'mb',concept:'beta',memoryCard:true,mnemonic:'Beta'}],readings:[]};
test('a practice launched after the memory aid is assisted and cannot prove retention',()=>{
 const s=C.blank(),session=C.makeSession(bank,s,[{id:'one',kind:'question'}],{assisted:true});
 C.answer(s,session,0,{selected:0,confidence:'sure'},()=>null);
 assert.equal(s.attempts[0].help,true);assert.equal(C.stats(s,bank).first.total,0);assert.equal(C.stats(s,bank).assisted.total,1);
 assert.equal(C.conceptProgress(bank,s).length,0);assert.equal(s.schedule.one.intervalDays,1);
});
test('retention needs separated unassisted days and different question families; a later error resets it',()=>{
 const s=C.blank(),now=Date.now();
 const a=(id,itemId,at)=>({id,itemId,kind:'question',scored:true,at,correct:true,confidence:'sure',help:false});
 s.attempts=[a('1','one',now-8*C.DAY),a('2','two',now)];
 assert.equal(C.conceptProgress(bank,s,now)[0].status,'retenido');
 s.attempts[1].at=now-7*C.DAY;assert.equal(C.conceptProgress(bank,s,now)[0].status,'comprobar');
 s.attempts[1].at=now;s.attempts[1].itemId='one';assert.equal(C.conceptProgress(bank,s,now)[0].status,'comprobar');
 s.attempts[1].itemId='two';s.attempts.push({...a('3','one',now+1),correct:false});assert.equal(C.conceptProgress(bank,s,now+1)[0].status,'reforzar');
});
test('the same topic title in different specialties is not combined',()=>{
 const x=q('x'),y=q('y');delete x.learningConcept;delete y.learningConcept;x.subject='One';y.subject='Two';assert.notEqual(C.conceptKey(x),C.conceptKey(y));
});
test('home mnemonic cannot reveal a concept in an unfinished exam and changes no state',()=>{
 const s=C.blank(),date='2026-09-09';s.sessions['daily-'+date]={status:'complete'};
 s.sessions.exam=C.makeSession(bank,s,[{id:'one',kind:'question'}],{mode:'exam'});
 const before=JSON.stringify(s);assert.equal(C.memoryOfDay(bank,s,date).concept,'beta');assert.equal(JSON.stringify(s),before);
 s.sessions.exam.items.push({data:bank.questions[2]});assert.equal(C.memoryOfDay(bank,s,date),null);
});
test('transfer exercises remain optional and do not displace the daily bank',()=>{
 const b={...bank,questions:[...bank.questions,{...q('variant'),transfer:true}]},s=C.blank();
 assert.ok(!C.selectionPool(b,s).some(q=>q.transfer));assert.equal(C.conceptQuestions(b,s,'alpha')[0].id,'variant');
});
test('alternative explanations distinguish authored, source evidence and full-case context',()=>{
 const x=q('x');x.optionExplanations=['A specific authored explanation'];x.optionEvidence=[{optionIndex:2,text:'A source explanation of C'}];
 assert.equal(C.optionReason(x,0).kind,'authored');assert.equal(C.optionReason(x,2).kind,'excerpt');
 assert.equal(C.optionReason(x,1).kind,'context');assert.equal(C.optionReason(x,1).text,x.commentary);
 const shuffled={...x,options:['C','B','A','D'],optionExplanations:[],optionEvidence:[{optionIndex:0,text:'C still follows identity'}]};assert.equal(C.optionReason(shuffled,0).evidence[0].text,'C still follows identity');
});
test('one passage shared by several alternatives is emitted once with all option identities',()=>{
 const x=q('shared'),text='The source compares A with B in the same paragraph.';
 x.optionEvidence=[{optionIndex:0,text},{optionIndex:1,text:'  '+text+'  '},{optionIndex:1,text}];
 const d=C.optionDiscussion(x);assert.equal(d.shared.length,1);assert.deepEqual(d.shared[0].indices,[0,1]);assert.equal(d.reasons[0].evidence.length,0);assert.equal(d.reasons[1].evidence.length,0);assert.deepEqual(d.pending,[2,3]);
});
test('structured teaching cannot follow a changed option identity',()=>{
 const x=q('identity');x.optionTeaching=[{optionText:'A',reason:'Why A',contrast:'When A',pitfall:'Trap A'}];x.optionExplanations=['Legacy A'];
 assert.equal(C.optionReason(x,0).sections.reason,'Why A');x.options[0]='Changed';assert.notEqual(C.optionReason(x,0).kind,'authored');
});
