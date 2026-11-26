// Cuentas de SeaKings (las mismas de Bocón, en el mismo Supabase) y el contador de dibujos del mes.
// Los archivos que empiezan con "_" no son direcciones públicas: solo los usan las demás.
const env=k=>(process.env[k]||'').trim();
const configurado=()=>!!(env('SUPABASE_URL')&&env('SUPABASE_ANON_KEY')&&env('SUPABASE_SERVICE_ROLE_KEY'));
const base=()=>env('SUPABASE_URL').replace(/\/+$/,'');
// quién hace la petición (con la sesión de Supabase que manda la página)
async function usuario(req){
  const h=String(req.headers.authorization||''),tok=h.startsWith('Bearer ')?h.slice(7):'';if(!tok) return null;
  try{const r=await fetch(base()+'/auth/v1/user',{headers:{apikey:env('SUPABASE_ANON_KEY'),Authorization:'Bearer '+tok}});if(!r.ok) return null;const u=await r.json();return u&&u.id?u:null;}catch(_){return null;}
}
// base de datos con la llave secreta (solo aquí en el servidor, nunca en la página)
async function db(path,opts){
  opts=opts||{};const k=env('SUPABASE_SERVICE_ROLE_KEY');
  const h={apikey:k,'Content-Type':'application/json'};if(k.startsWith('eyJ')) h.Authorization='Bearer '+k;
  const r=await fetch(base()+'/rest/v1/'+path,Object.assign({},opts,{headers:Object.assign(h,opts.headers||{})}));
  let j=null;try{j=await r.json();}catch(_){}return {ok:r.ok,status:r.status,j};
}
// Pro de Bocón: misma regla que en Bocón (suscripción activa, tiempo pagado con un día de gracia, o correo en PRO_GRATIS)
const cortesia=email=>!!email&&env('PRO_GRATIS').toLowerCase().split(/[,\s]+/).filter(Boolean).includes(String(email).toLowerCase());
async function esPro(u){
  if(cortesia(u.email)) return true;
  const r=await db('bocon_suscripciones?select=estado,pagado_hasta&user_id=eq.'+encodeURIComponent(u.id));
  const row=r.ok&&Array.isArray(r.j)?r.j[0]:null;if(!row) return false;if(row.estado==='authorized') return true;
  const h=row.pagado_hasta?new Date(row.pagado_hasta).getTime():0;return h+864e5>Date.now();
}
// dibujos al mes: deben ser los mismos números que en Bocón, porque el contador es uno solo
const num=(k,d)=>{const t=env(k);if(t==='') return d;const v=Number(t);return Number.isFinite(v)&&v>=0?Math.floor(v):d;};
const tope=pro=>pro?num('DIBUJOS_POR_MES',30):num('DIBUJOS_GRATIS',10);
const mesActual=()=>new Date().toLocaleString('sv-SE',{timeZone:'America/Mexico_City'}).slice(0,7);
async function usados(uid,mes){
  const r=await db('bocon_dibujos?select=usados&user_id=eq.'+encodeURIComponent(uid)+'&mes=eq.'+mes);
  return r.ok&&Array.isArray(r.j)&&r.j[0]?r.j[0].usados:0;
}
const rpc=(fn,args)=>db('rpc/'+fn,{method:'POST',body:JSON.stringify(args)});
module.exports={env,configurado,usuario,db,esPro,tope,mesActual,usados,rpc};
