# Trazo

Dibujos de caricatura en SVG hechos con una IA de texto: escribes qué quieres («una manzana mordida») y la IA escribe el dibujo como código, siempre con el mismo estilo (2D, contorno grueso, colores planos, fondo transparente). No es IA de imágenes.

Se descarga en SVG, en PNG o como **estampita para Bocón** (WebP con fondo transparente y borde blanco, igual que las imágenes de Bocón Estudio).

## Cuentas y contador

Para dibujar hay que entrar con la cuenta de SeaKings, la misma de Bocón Estudio (mismo Supabase). Los dibujos se cuentan juntos con los de Bocón en la tabla `bocon_dibujos`: gratis 10 al mes y con Bocón Pro 30. Se renuevan el día 1 (hora de México). Si la IA falla, el dibujo no se cuenta.

Antes hay que tener corrido el SQL de Bocón (`supabase/esquema.sql` del repo de Bocón, parte «Dibujar con IA»).

## Publicarlo en Vercel

1. En Vercel: **Add New → Project** e importa este repo. No necesita comando de build.
2. Saca una llave de Gemini en [Google AI Studio](https://aistudio.google.com) → **Get API key**, en un **proyecto de Google distinto** al de Bocón, para que cada uno tenga su propio tope diario.
3. En el proyecto de Vercel: **Settings → Environment Variables** (abajo la lista) y luego **Deployments → Redeploy**.
4. En Supabase: **Authentication → URL Configuration → Redirect URLs**, agrega la dirección de Trazo (por ejemplo `https://trazo.vercel.app/**`) para que funcionen el enlace del correo y Google.
5. Agrega Trazo a tu aviso de privacidad: guarda el correo de la cuenta y cuántos dibujos lleva cada quien en el mes.

## Variables

| Variable | Para qué | Si no la pones |
|---|---|---|
| `GEMINI_API_KEY` | La IA que dibuja (nivel gratis de Google), del proyecto de Google de Trazo | La página avisa que falta la llave |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Las mismas de Bocón: cuentas y contador | La página avisa que faltan las cuentas |
| `DIBUJOS_GRATIS` y `DIBUJOS_POR_MES` | Dibujos al mes gratis y con Pro. **Pon los mismos números que en Bocón**: el contador es uno solo | 10 y 30 |
| `PRO_GRATIS` | Los mismos correos con Pro de regalo que en Bocón | Nadie tiene Pro de regalo aquí |
| `LOGIN_GOOGLE` | `1` si activaste Google en Supabase (igual que en Bocón) | Solo se entra con código por correo |
| `BOCON_URL` | La dirección de Bocón, para el enlace «Con Bocón Pro…» | Lleva a seakingsstudios.com |
| `GEMINI_MODELOS` | Modelos a probar en orden, separados por comas | `gemini-flash-latest,gemini-flash-lite-latest` |
| `LIMITE_POR_HORA` | Freno extra contra ráfagas, por persona | 20 |
| `FAL_KEY` y `FAL_MODELO` | Respaldo con fal.ai cuando Gemini ya no responde. **Cobra de tus créditos** | Solo se usa Gemini |

## Cómo funciona

- `index.html`: toda la página. Limpia el SVG otra vez antes de mostrarlo y lo muestra como imagen, así nunca corre código.
- `api/dibujar.js`: función de Vercel. Revisa la cuenta y el contador del mes, tiene las instrucciones fijas del estilo (`ESTILO`, las mismas que en Bocón), llama a Gemini y, si se acaba el límite y hay `FAL_KEY`, a fal.ai. Quita del SVG todo lo que no sea figura (scripts, enlaces, imágenes de fuera).
- `api/_cuentas.js`: cuentas de Supabase, si es Pro y el contador. `api/config.js`: lo que la página necesita para entrar a la cuenta.
- `vendor/supabase.js`: cliente de Supabase (licencia MIT), el mismo de Bocón.
- «¿Le cambias algo?» manda el dibujo actual con el cambio. «Hacer otra versión» pide una variación.
- La lista «Tus dibujos» se guarda solo en el navegador de cada quien.

## Sobre los límites

- El nivel gratis de Gemini tiene un tope de peticiones por día por proyecto; cuando se acaba, la página dice que se intente más tarde. Los topes exactos se ven en AI Studio.
- En el nivel gratis, Google puede usar lo que se manda para mejorar sus productos. La página lo avisa en «Preguntas».
- El freno por hora vive en la memoria de la función: es solo contra ráfagas; el tope real es el del mes. Si activas `FAL_KEY`, pon un tope de gasto en fal.ai.

## Cambiar el estilo

Todo el estilo está en el texto `ESTILO` de `api/dibujar.js`. Si cambias el grosor o el color del contorno, también conviene cambiar el borde blanco de la estampita (`estampita()` en `index.html`).
