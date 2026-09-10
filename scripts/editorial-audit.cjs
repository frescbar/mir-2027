/* Generates a private, versioned review inventory. Does not approve clinical content. */
const fs=require('node:fs'),crypto=require('node:crypto'),C=require('../docs/core-v1.js'),L=require('../docs/learning-v1.js');
const bank=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const records=bank.questions.map(q=>({
 id:q.id,contentVersion:q.versionHash||String(C.hash(JSON.stringify(q))),subject:q.subject,
 authoredOptions:q.options.map((_,i)=>C.optionReason(q,i).kind==='authored'),
 structuredOptions:q.options.map((_,i)=>!!C.optionReason(q,i).sections),
 memory:!!q.takeaway,preciseConcept:!!L.preciseKey(q),imageMissing:!!(q.imageRequired&&!q.image&&!q.images?.length),
 externalReview:'pending',issues:C.observations(q),
 priority:q.isAnnulled||q.sourceDiscrepancy?'conflict':q.imageRequired&&!q.images?.length&&!q.image?'image':q.options.some((_,i)=>C.optionReason(q,i).kind!=='authored')?'explanations':'clinical-review',
 referenceIds:(q.references||[]).map(r=>r.id),
 reviewer:null,reviewedAt:null,decision:null,proposedChanges:null
}));
const result={schema:'mir27.editorial-inventory.v1',bankVersion:bank.version,date:new Date().toISOString().slice(0,10),bankSha256:crypto.createHash('sha256').update(JSON.stringify(bank.questions)).digest('hex'),coverage:L.coverage(bank),records};
fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2));console.log(JSON.stringify(result.coverage));
