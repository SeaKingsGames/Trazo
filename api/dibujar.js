// Pide a una IA de texto el código SVG de un dibujo con el estilo fijo de Trazo (caricatura 2D, contorno grueso).
// No es IA de imágenes: la IA escribe el dibujo como código y la página lo muestra.
// Primero Gemini (nivel gratis); fal.ai solo si está su llave y Gemini ya no responde.
const env=k=>(process.env[k]||'').trim();
const num=(k,d)=>{const v=Number(env(k));return Number.isFinite(v)&&v>0?v:d;};

const ESTILO=`You draw cartoon stickers as SVG code.
Reply with ONE complete SVG document and nothing else: no markdown fences, no comments, no explanation.

Canvas
- Start with <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> and no width/height attributes.
- Transparent background: never draw a background rectangle, floor or scenery unless the request is a place or a scene.
- Center the subject. It fills about 80% of the canvas, with a margin of about 30 units.

Style (always the same)
- 2D cartoon, friendly and expressive, like a sticker for a kids' animated show.
- Bold outlines: every shape has stroke="#1b1a22", stroke-width from 8 to 12, stroke-linejoin="round" and stroke-linecap="round". Small inner details use stroke-width 5 or 6.
- Flat, saturated fills. At most one darker shade shape per part (same hue, darker) and one small white highlight on big shapes. No gradients, filters, blur, shadows or textures.
- Simple, clean, instantly recognizable shapes. Prefer <path> with smooth curves; also circle, ellipse, rect, polygon, line, polyline and g.
- Anything with a face gets big simple eyes with a white shine dot and a small mouth.
- Draw from back to front so the outlines overlap correctly.

Limits
- Use only these elements: svg, g, path, circle, ellipse, rect, line, polyline, polygon. No text unless the user asks for words. No image, script, style, foreignObject, links, CSS or animation.
- Keep it under about 150 elements and 20 KB.
- The drawing must be suitable for all ages. If the request is not, draw a cute question mark sticker instead.`;

// ---- límite de uso por persona (vive mientras la función está caliente; Gemini gratis pone el tope real) ----
const usos=new Map();
function permitido(ip){
  const ahora=Date.now(),hora=3600e3,max=num('LIMITE_POR_HORA',20);
  const lista=(usos.get(ip)||[]).filter(t=>ahora-t<hora);
  if(lista.length>=max){usos.set(ip,lista);return false;}
  lista.push(ahora);usos.set(ip,lista);
  if(usos.size>5000) for(const k of usos.keys()){usos.delete(k);if(usos.size<4000) break;}
  return true;
}

// ---- limpieza: solo figuras, nada que pueda ejecutar código o traer cosas de fuera ----
const PERMITIDOS=new Set(['svg','g','path','circle','ellipse','rect','line','polyline','polygon','title','desc','defs','lineargradient','radialgradient','stop','clippath','use']);
function limpiar(texto){
  const m=String(texto||'').match(/<svg[\s\S]*<\/svg>/i);if(!m) return null;
  let s=m[0];
  s=s.replace(/<!--[\s\S]*?-->/g,'').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g,'');
  // quita elementos no permitidos con todo y contenido
  s=s.replace(/<(script|style|foreignObject|iframe|object|embed|image|a|animate\w*|set|audio|video|text)\b[\s\S]*?(<\/\1\s*>|\/>)/gi,'');
  s=s.replace(/<\/?([a-zA-Z][\w:-]*)\b[^>]*>/g,(tag,nombre)=>PERMITIDOS.has(nombre.toLowerCase())?tag:'');
  s=s.replace(/\s(on\w+|style)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'');
  s=s.replace(/\s(xlink:)?href\s*=\s*("(?!#)[^"]*"|'(?!#)[^']*')/gi,'');
  s=s.replace(/url\(\s*['"]?(?!#)[^)]*\)/gi,'none');
  if(!/viewBox=/i.test(s)) s=s.replace(/<svg\b/i,'<svg viewBox="0 0 512 512"');
  if(!/xmlns=/i.test(s)) s=s.replace(/<svg\b/i,'<svg xmlns="http://www.w3.org/2000/svg"');
  s=s.replace(/<svg\b[^>]*>/i,t=>t.replace(/\s(width|height)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,''));
  if(!/<(path|circle|ellipse|rect|polygon|polyline|line)\b/i.test(s)) return null;
  return s.length>120000?null:s;
}

// ---- proveedores ----
async function gemini(sistema,pedido,temp){
  const key=env('GEMINI_API_KEY');if(!key) return {error:'sin-llave'};
  const modelos=(env('GEMINI_MODELOS')||'gemini-flash-latest,gemini-flash-lite-latest').split(',').map(x=>x.trim()).filter(Boolean);
  let ultimo='sin-respuesta';
  for(const modelo of modelos){
    let r;
    try{
      r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`,{
        method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},
        body:JSON.stringify({systemInstruction:{parts:[{text:sistema}]},contents:[{role:'user',parts:[{text:pedido}]}],
          generationConfig:{temperature:temp,maxOutputTokens:16000}})});
    }catch(_){ultimo='red';continue;}
    if(r.status===429){ultimo='agotado';continue;}
    if(!r.ok){ultimo='error-'+r.status;continue;}
    const j=await r.json().catch(()=>null),c=j&&j.candidates&&j.candidates[0];
    if(!c){ultimo=j&&j.promptFeedback&&j.promptFeedback.blockReason?'bloqueado':'vacio';continue;}
    const texto=((c.content&&c.content.parts)||[]).filter(p=>!p.thought).map(p=>p.text||'').join('');
    return {texto,modelo};
  }
  return {error:ultimo};
}
async function fal(sistema,pedido,temp){
  const key=env('FAL_KEY');if(!key) return {error:'sin-llave'};
  const modelo=env('FAL_MODELO')||'~google/gemini-flash-latest';
  try{
    const r=await fetch('https://fal.run/openrouter/router',{method:'POST',headers:{Authorization:'Key '+key,'Content-Type':'application/json'},
      body:JSON.stringify({model:modelo,system_prompt:sistema,prompt:pedido,temperature:temp,max_tokens:16000})});
    if(!r.ok) return {error:r.status===429?'agotado':'error-'+r.status};
    const j=await r.json();return {texto:j.output||'',modelo:'fal:'+modelo};
  }catch(_){return {error:'red'};}
}

const MENSAJES={
  agotado:'Ya se usaron todos los dibujos gratis por ahora. Intenta en un rato.',
  bloqueado:'Ese dibujo no se puede hacer. Prueba con otra cosa.',
  'sin-llave':'Falta configurar la llave de la IA en Vercel (GEMINI_API_KEY).',
};

module.exports=async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({error:'Usa POST'});
  const ip=String(req.headers['x-forwarded-for']||'').split(',')[0].trim()||'?';
  if(!permitido(ip)) return res.status(429).json({error:'Hiciste muchos dibujos seguidos. Espera un rato y sigue.'});
  let b=req.body;if(typeof b==='string'){try{b=JSON.parse(b);}catch(_){b={};}}b=b||{};
  const que=String(b.que||'').trim().slice(0,200),cambio=String(b.cambio||'').trim().slice(0,200);
  if(!que) return res.status(400).json({error:'Escribe qué quieres dibujar.'});
  let pedido='Draw: '+que,temp=.8;
  if(cambio&&b.svg){
    const actual=limpiar(b.svg);if(!actual) return res.status(400).json({error:'No encontré el dibujo que quieres cambiar.'});
    pedido=`Here is the current drawing of "${que}":\n${actual.slice(0,60000)}\n\nChange it like this: ${cambio}\nKeep everything else and the same style. Reply with the full new SVG.`;temp=.5;
  }else if(b.otra){pedido+=`\nMake a different version from the usual one (new pose, angle or design), variation #${Math.floor(Math.random()*1000)}.`;temp=1.1;}

  let r=await gemini(ESTILO,pedido,temp);
  if(r.error&&r.error!=='bloqueado'){const f=await fal(ESTILO,pedido,temp);if(!f.error) r=f;}
  if(r.error) return res.status(r.error==='agotado'?429:502).json({error:MENSAJES[r.error]||'La IA no respondió. Intenta otra vez.'});
  const svg=limpiar(r.texto);
  if(!svg) return res.status(502).json({error:'La IA no regresó un dibujo. Intenta otra vez.'});
  res.status(200).json({svg,modelo:r.modelo});
};
module.exports.limpiar=limpiar;
