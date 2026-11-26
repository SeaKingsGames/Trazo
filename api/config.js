// La página pregunta aquí cómo entrar a la cuenta y cuántos dibujos da cada plan.
const C=require('./_cuentas');
module.exports=async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(!C.configurado()) return res.status(404).json({error:'Faltan las variables de Supabase en Vercel'});
  res.status(200).json({supabaseUrl:C.env('SUPABASE_URL'),supabaseKey:C.env('SUPABASE_ANON_KEY'),google:C.env('LOGIN_GOOGLE')==='1',
    boconUrl:C.env('BOCON_URL')||'https://www.seakingsstudios.com',dibujos:{gratis:C.tope(false),pro:C.tope(true)}});
};
