/* The browser downloads private sessions only after the user requests one. */
(()=>{'use strict';
 const supported=!window.MIR_PRIVATE_BANK&&location.protocol==='https:'&&'serviceWorker' in navigator;
 const ready=supported?navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(()=>navigator.serviceWorker.ready).catch(()=>null):Promise.resolve(null);
 window.MIROffline={supported,async ready(){const r=await ready;if(!r?.active)throw new Error('Este navegador no ha podido preparar el acceso sin conexión. Recarga la web con conexión e inténtalo de nuevo.');return r;}};
})();
