// Galería pública de Trazo: la gente publica sus dibujos y salen en la galería cuando un administrador los aprueba.
//   GET  /api/galeria                 → los aprobados (para trazo y para www.seakingsstudios.com/galeria-trazo)
//   GET  /api/galeria?svg=<id>        → el dibujo aprobado como imagen SVG
//   GET  /api/galeria?pendientes=1    → los que esperan aprobación (solo administradores)
//   POST /api/galeria {svg,titulo,modo}          → publicar un dibujo (con cuenta)
//   POST /api/galeria {accion:'aprobar'|'rechazar',id} → revisar (solo administradores)
const C=require('./_cuentas');
const {limpiar}=require('./_svg');
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CAJAS={estampita:'0 0 512 512',fondo:'0 0 1920 1080'};
const titulo=t=>String(t||'').replace(/<[^>]*>/g,'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,80);
const faltaTabla=r=>r.status===404||/trazo_galeria/.test(JSON.stringify(r.j||''))&&!r.ok;

module.exports=async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET, POST');return res.status(204).end();}
  if(!C.configurado()) return res.status(503).json({error:'Faltan las variables de Supabase en Vercel.'});
  const q=req.query||{};

  if(req.method==='GET'&&q.svg){
    if(!UUID.test(String(q.svg))) return res.status(404).end();
    const r=await C.db('trazo_galeria?select=svg&estado=eq.aprobado&id=eq.'+q.svg);
    const row=r.ok&&Array.isArray(r.j)&&r.j[0];if(!row) return res.status(404).end();
    res.setHeader('Content-Type','image/svg+xml; charset=utf-8');
    res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'");
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800');
    return res.status(200).send(limpiar(row.svg)||'');
  }

  if(req.method==='GET'&&!q.pendientes){
    const r=await C.db('trazo_galeria?select=id,titulo,modo,revisado&estado=eq.aprobado&order=revisado.desc.nullslast&limit=300');
    if(!r.ok) return res.status(faltaTabla(r)?503:500).json({error:'La galería todavía no está lista.'});
    res.setHeader('Cache-Control','public, max-age=60, s-maxage=300');
    return res.status(200).json({dibujos:r.j.map(d=>({id:d.id,titulo:d.titulo,modo:d.modo,fecha:d.revisado}))});
  }

  res.setHeader('Cache-Control','no-store');
  const u=await C.usuario(req);if(!u) return res.status(401).json({error:'Entra a tu cuenta para publicar.',entrar:true});
  const admin=C.esAdmin(u.email);

  if(req.method==='GET'){
    if(!admin) return res.status(403).json({error:'Solo para administradores.'});
    const r=await C.db('trazo_galeria?select=id,titulo,modo,svg,creado&estado=eq.pendiente&order=creado.asc&limit=60');
    if(!r.ok) return res.status(faltaTabla(r)?503:500).json({error:'La galería todavía no está lista.'});
    return res.status(200).json({pendientes:r.j});
  }
  if(req.method!=='POST') return res.status(405).json({error:'Usa GET o POST'});
  let b=req.body;if(typeof b==='string'){try{b=JSON.parse(b);}catch(_){b={};}}b=b||{};

  if(b.accion){
    if(!admin) return res.status(403).json({error:'Solo para administradores.'});
    if(!UUID.test(String(b.id||''))||!['aprobar','rechazar'].includes(b.accion)) return res.status(400).json({error:'Falta el dibujo.'});
    const cambio={estado:b.accion==='aprobar'?'aprobado':'rechazado',revisado:new Date().toISOString()};
    if(b.accion==='aprobar'&&b.titulo) cambio.titulo=titulo(b.titulo)||undefined;
    const r=await C.db('trazo_galeria?id=eq.'+b.id,{method:'PATCH',body:JSON.stringify(cambio),headers:{Prefer:'return=minimal'}});
    return r.ok?res.status(200).json({ok:true}):res.status(500).json({error:'No se pudo guardar.'});
  }

  const modo=b.modo==='fondo'?'fondo':'estampita',t=titulo(b.titulo),svg=limpiar(b.svg,CAJAS[modo]);
  if(!t) return res.status(400).json({error:'Ponle un nombre al dibujo.'});
  if(!svg||svg.length>60000) return res.status(400).json({error:'Ese dibujo no se puede publicar.'});
  // freno: pocos pendientes por persona
  const p=await C.db('trazo_galeria?select=id&estado=eq.pendiente&user_id=eq.'+u.id);
  if(!p.ok) return res.status(faltaTabla(p)?503:500).json({error:'La galería todavía no está lista.'});
  if(p.j.length>=10) return res.status(429).json({error:'Ya tienes 10 dibujos esperando revisión. Cuando los revisemos puedes mandar más.'});
  const r=await C.db('trazo_galeria',{method:'POST',body:JSON.stringify({user_id:u.id,titulo:t,modo,svg}),headers:{Prefer:'return=minimal'}});
  if(!r.ok) return res.status(500).json({error:'No se pudo publicar. Intenta otra vez.'});
  res.status(200).json({ok:true});
};
