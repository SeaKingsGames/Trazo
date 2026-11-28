// Pide a una IA de texto el código SVG de un dibujo con el estilo fijo de Trazo (caricatura 2D, contorno grueso).
// No es IA de imágenes: la IA escribe el dibujo como código y la página lo muestra.
// Primero Gemini (nivel gratis); fal.ai solo si está su llave y Gemini ya no responde.
// Hay que entrar con la cuenta de SeaKings (la misma de Bocón) y los dibujos se cuentan junto con los de Bocón.
const C=require('./_cuentas');
const env=k=>(process.env[k]||'').trim();
const num=(k,d)=>{const v=Number(env(k));return Number.isFinite(v)&&v>0?v:d;};

const ESTILO=`You draw cartoon stickers as SVG code.
Reply with ONE complete SVG document and nothing else: no markdown fences, no comments, no explanation.

Canvas
- Start with <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> and no width/height attributes.
- Transparent background: never draw a background rectangle, floor or scenery unless the request is a place or a scene.
- Center the subject. It fills about 80% of the canvas, with a margin of about 30 units.

Style (always the same)
- 2D cartoon, friendly and expressive, like a sticker for a kids' animated show. Clean and simple, never busy.
- One bold dark outline around the silhouette and around each main part: stroke="#1b1a22", stroke-width 9, stroke-linejoin="round", stroke-linecap="round".
- Never double outlines. Do not put an outlined shape just inside or just outside another outlined shape, and do not draw rims, rings or borders as two lines. A rim (a peel, a crust, a frame) is one filled shape; the part inside it goes on top with NO stroke.
- Inner details (shading, highlights, cheeks, spots, patterns) have NO stroke. Eyes, mouth and small lines use stroke-width 5.
- Flat, saturated fills. At most one darker shade per part (same hue, no stroke) and one small white highlight (no stroke). No gradients, filters, blur, shadows or textures.
- Few shapes, usually 10 to 40 elements. Simple, instantly recognizable shapes. Prefer <path> with smooth curves; also circle, ellipse, rect, polygon, line, polyline and g.
- Anything with a face gets big simple eyes with a white shine dot and a small mouth.
- Draw from back to front so the outlines overlap correctly.

Limits
- Use only these elements: svg, g, path, circle, ellipse, rect, line, polyline, polygon. No text unless the user asks for words. No image, script, style, foreignObject, links, CSS or animation.
- Keep it under about 60 elements and 12 KB.
- The drawing must be suitable for all ages. If the request is not, draw a cute question mark sticker instead.`;

// Fondos: lugares a pantalla completa para poner detrás de los personajes (16:9 o 9:16)
const estiloFondo=vertical=>`You draw cartoon BACKGROUNDS (scenery for animated videos) as SVG code.
Reply with ONE complete SVG document and nothing else: no markdown fences, no comments, no explanation.

Canvas
- Start with <svg xmlns="http://www.w3.org/2000/svg" viewBox="${vertical?'0 0 1080 1920':'0 0 1920 1080'}"> and no width/height attributes.
- Fill the whole canvas edge to edge. The first element is a rect that covers the full canvas (sky or wall). No transparent areas, no border, no frame.
- It is an empty place: NO characters, people, animals or faces, and no text.
- Characters will stand in front of it. Keep the lower middle part open (clear floor or ground): put furniture, trees and big objects toward the left and right sides and in the back, never in the center foreground.
- The floor or ground line is at about ${vertical?'72':'70'}% of the height.
- Depth, drawn back to front: sky or wall, far things, middle things, floor or ground, then a few near things only at the edges.

Style (always the same)
- 2D cartoon background like a kids' animated show: friendly, clean and simple, never busy.
- Outlines: stroke="#1b1a22", stroke-width 6, stroke-linejoin="round", stroke-linecap="round". Far things can use stroke-width 4 or no outline.
- Never double outlines. Inner details (shading, highlights, patterns) have NO stroke.
- Flat fills, a little softer and less saturated than the characters so they stand out. At most one darker shade per object (same hue, no stroke). No gradients, filters, blur, shadows or textures.
- Big simple shapes, usually 40 to 110 elements. Repeated details (tiles, bricks, leaves, books) only a few, as simple shapes.

Limits
- Use only these elements: svg, g, path, circle, ellipse, rect, line, polyline, polygon. No image, script, style, foreignObject, links, CSS or animation.
- Keep it under about 130 elements and 30 KB.
- It must be suitable for all ages. If the request is not, draw a sunny park instead.`;

// Personaje armable: piezas separadas para que Bocón Estudio lo arme como marioneta (sin ojos ni boca: Bocón se los pone)
const ESTILO_ARMABLE=`You draw cartoon characters as SVG code, split into separate body parts so an animation app can move them like a puppet.
Reply with ONE complete SVG document and nothing else: no markdown fences, no comments, no explanation.

Canvas
- Start with <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900"> and no width/height attributes. Transparent background: only the character.
- Full body, front view, standing straight and centered. The head top is near y=50 and the feet touch y=860.
- If the request is an animal, an object or a food, draw it as a cute character standing on two legs with two arms.

Parts (required)
- Put EVERY shape inside exactly one of these six groups, in this order (back to front), with exactly these ids:
  <g id="pieA"> the character's right leg and foot, on the LEFT side of the image
  <g id="pieB"> the character's left leg and foot, on the RIGHT side of the image
  <g id="cuerpo"> torso, neck, clothes and tail (no arms, no legs)
  <g id="brazoA"> the character's right arm with its hand, on the LEFT side of the image
  <g id="brazoB"> the character's left arm with its hand, on the RIGHT side of the image
  <g id="cabeza"> head, hair, ears, hat and nose
- Do not nest these groups inside each other and do not put a transform on them.

Pose
- Arms hang straight down beside the body with a small gap from the torso, hands at hip height. Each arm is one straight shape (no bent elbow). Its top end starts about 20 units inside the torso so the shoulder joint is hidden.
- Legs are straight with a gap between them. The top of each leg starts about 25 units inside the bottom of the torso.
- The head sits on the neck and overlaps it by about 20 units.

Face
- Draw NO eyes, NO eyebrows and NO mouth: the app adds them. Leave the face as plain skin; cheeks and a nose are fine.
- Inside the cabeza group add three invisible guides: <circle id="ojoA" cx="…" cy="…" r="…" fill="none" stroke="none"/> where the character's right eye goes (left side of the image), <circle id="ojoB" … fill="none" stroke="none"/> for the other eye (r is the eye radius), and <ellipse id="boca" cx="…" cy="…" rx="…" ry="…" fill="none" stroke="none"/> where the mouth goes (rx is half the mouth width).

Style (always the same)
- 2D cartoon, friendly and expressive, like a character of a kids' animated show. Clean and simple, never busy.
- One bold dark outline around each part: stroke="#1b1a22", stroke-width 9, stroke-linejoin="round", stroke-linecap="round".
- Never double outlines. Inner details (shading, highlights, cheeks, patterns) have NO stroke.
- Flat, saturated fills. At most one darker shade per part (same hue, no stroke) and one small white highlight. No gradients, filters, blur, shadows or textures.

Limits
- Use only these elements: svg, g, path, circle, ellipse, rect, line, polyline, polygon. No text, image, script, style, foreignObject, links, CSS or animation.
- Keep it under about 80 elements and 16 KB.
- It must be suitable for all ages. If the request is not, draw a friendly round blue monster instead.`;

// Otra cara: el mismo dibujo con otra expresión
const CARAS={
  feliz:'very happy, with a big open smile',triste:'sad, with teary eyes and a frown',enojado:'angry, with frowning eyebrows',
  sorprendido:'surprised, with wide eyes and an open round mouth',asustado:'scared, with trembling eyes and a sweat drop',
  enamorado:'in love, with heart-shaped eyes and a blush',dormido:'asleep, with closed eyes and small Z letters',pensativo:'thoughtful, looking up with a small mouth'
};

// ---- freno extra contra ráfagas (vive mientras la función está caliente; el tope real es el del mes) ----
const usos=new Map();
function permitido(ip){
  const ahora=Date.now(),hora=3600e3,max=num('LIMITE_POR_HORA',20);
  const lista=(usos.get(ip)||[]).filter(t=>ahora-t<hora);
  if(lista.length>=max){usos.set(ip,lista);return false;}
  lista.push(ahora);usos.set(ip,lista);
  if(usos.size>5000) for(const k of usos.keys()){usos.delete(k);if(usos.size<4000) break;}
  return true;
}

const {limpiar}=require('./_svg');

// ---- proveedores ----
async function gemini(sistema,pedido,temp,maxTok){
  const key=env('GEMINI_API_KEY');if(!key) return {error:'sin-llave'};
  const modelos=(env('GEMINI_MODELOS')||'gemini-flash-latest,gemini-flash-lite-latest').split(',').map(x=>x.trim()).filter(Boolean);
  let ultimo='sin-respuesta';
  for(const modelo of modelos){
    let r;
    try{
      r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`,{
        method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},
        body:JSON.stringify({systemInstruction:{parts:[{text:sistema}]},contents:[{role:'user',parts:[{text:pedido}]}],
          generationConfig:{temperature:temp,maxOutputTokens:maxTok||16000}})});
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
async function fal(sistema,pedido,temp,maxTok){
  const key=env('FAL_KEY');if(!key) return {error:'sin-llave'};
  const modelo=env('FAL_MODELO')||'~google/gemini-flash-latest';
  try{
    const r=await fetch('https://fal.run/openrouter/router',{method:'POST',headers:{Authorization:'Key '+key,'Content-Type':'application/json'},
      body:JSON.stringify({model:modelo,system_prompt:sistema,prompt:pedido,temperature:temp,max_tokens:maxTok||16000})});
    if(!r.ok) return {error:r.status===429?'agotado':'error-'+r.status};
    const j=await r.json();return {texto:j.output||'',modelo:'fal:'+modelo};
  }catch(_){return {error:'red'};}
}

const MENSAJES={
  agotado:'La IA está muy ocupada o ya se usaron los dibujos de hoy. Intenta en un rato.',
  bloqueado:'Ese dibujo no se puede hacer. Prueba con otra cosa.',
  'sin-llave':'Falta configurar la llave de la IA en Vercel (GEMINI_API_KEY).',
};

module.exports=async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(!C.configurado()) return res.status(503).json({error:'Faltan las variables de Supabase en Vercel.'});
  const u=await C.usuario(req);if(!u) return res.status(401).json({error:'Entra a tu cuenta para dibujar.',entrar:true});
  const pro=await C.esPro(u),mes=C.mesActual(),max=C.tope(pro);
  if(req.method==='GET') return res.status(200).json({pro,usados:await C.usados(u.id,mes),tope:max,topePro:C.tope(true),admin:C.esAdmin(u.email)});
  if(req.method!=='POST') return res.status(405).json({error:'Usa POST'});
  if(!max) return res.status(403).json({error:'Los dibujos con IA son de Bocón Pro.',pro});
  const ip=String(req.headers['x-forwarded-for']||'').split(',')[0].trim()||'?';
  if(!permitido(ip)) return res.status(429).json({error:'Hiciste muchos dibujos seguidos. Espera un rato y sigue.'});
  let b=req.body;if(typeof b==='string'){try{b=JSON.parse(b);}catch(_){b={};}}b=b||{};
  const que=String(b.que||'').trim().slice(0,200),cambio=String(b.cambio||'').trim().slice(0,200);
  if(!que) return res.status(400).json({error:'Escribe qué quieres dibujar.'});
  // modo: estampita (lo de siempre), fondo (16:9 o 9:16) o armable (piezas para Bocón, solo Pro)
  const modo=b.modo==='fondo'||b.modo==='armable'?b.modo:'estampita',vertical=modo==='fondo'&&b.formato==='9:16';
  if(modo==='armable'&&!pro) return res.status(403).json({error:'El personaje armable es de Bocón Pro.',soloPro:true,pro});
  const sistema=modo==='fondo'?estiloFondo(vertical):modo==='armable'?ESTILO_ARMABLE:ESTILO;
  const caja=modo==='fondo'?(vertical?'0 0 1080 1920':'0 0 1920 1080'):modo==='armable'?'0 0 600 900':'0 0 512 512';
  const maxTok=modo==='fondo'?24000:16000;
  let pedido=(modo==='fondo'?'Draw this place as a background: ':modo==='armable'?'Draw this character: ':'Draw: ')+que,temp=.8;
  if(cambio&&b.svg){
    const actual=limpiar(b.svg,caja);if(!actual) return res.status(400).json({error:'No encontré el dibujo que quieres cambiar.'});
    pedido=`Here is the current drawing of "${que}":\n${actual.slice(0,60000)}\n\nChange it like this: ${cambio}\nKeep everything else and the same style${modo==='armable'?', the same six part groups and the face guides':''}. Reply with the full new SVG.`;temp=.5;
  }else if(b.cara&&CARAS[b.cara]&&b.svg&&modo==='estampita'){
    const actual=limpiar(b.svg,caja);if(!actual) return res.status(400).json({error:'No encontré el dibujo.'});
    pedido=`Here is a drawing of "${que}":\n${actual.slice(0,60000)}\n\nRedraw the SAME drawing: same character, pose, colors, shapes and size. Change ONLY the face (eyes, eyebrows and mouth) so it looks ${CARAS[b.cara]}. You may add one small emotion detail next to the head (tears, a sweat drop, blush, little hearts or Z letters). If it has no face, give it a simple cute face with that expression. Reply with the full new SVG.`;temp=.4;
  }else if(b.otra){pedido+=`\nMake a different version from the usual one (new pose, angle or design), variation #${Math.floor(Math.random()*1000)}.`;temp=1.1;}

  // se aparta el dibujo antes de llamar a la IA; es el mismo contador que usa Bocón
  const r=await C.rpc('bocon_dibujo_usar',{p_user:u.id,p_mes:mes,p_tope:max});
  if(!r.ok) return res.status(500).json({error:'No pude revisar tus dibujos del mes. Intenta otra vez.'});
  const n=Number(r.j);
  if(!(n>0)) return res.status(429).json({error:pro?`Ya usaste tus ${max} dibujos de este mes. Se renuevan el día 1.`:`Ya usaste tus ${max} dibujos gratis de este mes. Con Bocón Pro tienes ${C.tope(true)} al mes.`,usados:max,tope:max,pro});
  const devolver=()=>C.rpc('bocon_dibujo_devolver',{p_user:u.id,p_mes:mes}).catch(()=>null);

  let g=await gemini(sistema,pedido,temp,maxTok);
  if(g.error&&g.error!=='bloqueado'){const f=await fal(sistema,pedido,temp,maxTok);if(!f.error) g=f;}
  if(g.error){await devolver();return res.status(g.error==='agotado'?429:502).json({error:MENSAJES[g.error]||'La IA no respondió. Intenta otra vez.',usados:n-1,tope:max});}
  const svg=limpiar(g.texto,caja);
  if(!svg){await devolver();return res.status(502).json({error:'La IA no regresó un dibujo. Intenta otra vez.',usados:n-1,tope:max});}
  if(modo==='armable'&&!(/id="cabeza"/.test(svg)&&/id="cuerpo"/.test(svg))){await devolver();return res.status(502).json({error:'La IA no separó las piezas del personaje. Intenta otra vez.',usados:n-1,tope:max});}
  res.status(200).json({svg,modo,usados:n,tope:max});
};
module.exports.CARAS=CARAS;
