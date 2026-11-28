// Limpieza del SVG que regresa la IA (o que manda la página): solo figuras, nada que pueda ejecutar código o traer cosas de fuera.
const PERMITIDOS=new Set(['svg','g','path','circle','ellipse','rect','line','polyline','polygon','title','desc','defs','lineargradient','radialgradient','stop','clippath','use']);
function limpiar(texto,caja){
  const m=String(texto||'').match(/<svg[\s\S]*<\/svg>/i);if(!m) return null;
  let s=m[0];
  s=s.replace(/<!--[\s\S]*?-->/g,'').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g,'');
  // quita elementos no permitidos con todo y contenido
  s=s.replace(/<(script|style|foreignObject|iframe|object|embed|image|a|animate\w*|set|audio|video|text)\b[\s\S]*?(<\/\1\s*>|\/>)/gi,'');
  s=s.replace(/<\/?([a-zA-Z][\w:-]*)\b[^>]*>/g,(tag,nombre)=>PERMITIDOS.has(nombre.toLowerCase())?tag:'');
  s=s.replace(/\s(on\w+|style)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'');
  s=s.replace(/\s(xlink:)?href\s*=\s*("(?!#)[^"]*"|'(?!#)[^']*')/gi,'');
  s=s.replace(/url\(\s*['"]?(?!#)[^)]*\)/gi,'none');
  if(!/viewBox=/i.test(s)) s=s.replace(/<svg\b/i,`<svg viewBox="${caja||'0 0 512 512'}"`);
  if(!/xmlns=/i.test(s)) s=s.replace(/<svg\b/i,'<svg xmlns="http://www.w3.org/2000/svg"');
  s=s.replace(/<svg\b[^>]*>/i,t=>t.replace(/\s(width|height)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,''));
  if(!/<(path|circle|ellipse|rect|polygon|polyline|line)\b/i.test(s)) return null;
  return s.length>120000?null:s;
}

module.exports={limpiar};
