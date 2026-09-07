/* Display real corpus availability. No bank, credentials or patient data in this file. */
(()=>{'use strict';
if(!window.MIRStore)return;
let summary=null;
const original=MIRStore.loadBank;
MIRStore.loadBank=async function(...args){const bank=await original.apply(this,args);summary={questions:bank.questions?.length||0,eligible:(bank.questions||[]).filter(MIRCore.eligible).length,images:(bank.atlas||[]).filter(x=>x.images?.length).length};return bank;};
function render(){const main=document.getElementById('main');if(!summary||!main||main.querySelector('#corpus-connection')||!document.querySelector('[data-action="daily"]'))return;
const box=document.createElement('section');box.id='corpus-connection';box.className='card';box.style.borderLeft='4px solid #167d6d';
const title=document.createElement('h2'),text=document.createElement('p');const button=document.createElement('button');button.className='primary';
if(MIRStore.local){title.textContent='Banco documental incluido en esta copia';text.textContent=summary.questions.toLocaleString('es-ES')+' registros · '+summary.eligible.toLocaleString('es-ES')+' preguntas para practicar. Para tener el mismo banco en tu enlace web, abre la autorización privada. No se utiliza Drive ni se comparte tu contraseña con este archivo.';button.textContent='Conectar este banco con mi web';button.dataset.action='bridge';}
else if(summary.questions<100){title.textContent='Tu web todavía tiene el banco piloto';text.textContent='En esta web hay '+summary.questions+' preguntas. El archivo local ampliado y la web son copias distintas hasta incorporar el banco. La importación conserva el progreso y no publica los documentos en GitHub.';button.textContent='Incorporar banco privado';button.dataset.action='import-file';}
else return;
box.append(title,text,button);main.prepend(box);}
new MutationObserver(render).observe(document.getElementById('main'),{childList:true,subtree:true});
})();
