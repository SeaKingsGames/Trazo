# Trazo

Dibujos de caricatura en SVG hechos con una IA de texto: escribes qué quieres («una manzana mordida») y la IA escribe el dibujo como código, siempre con el mismo estilo (2D, contorno grueso, colores planos, fondo transparente). No es IA de imágenes.

Se descarga en SVG, en PNG o como **estampita para Bocón** (WebP con fondo transparente y borde blanco, igual que las imágenes de Bocón Estudio).

## Publicarlo en Vercel

1. En Vercel: **Add New → Project** e importa este repo. No necesita comando de build.
2. Saca una llave gratis de Gemini en [Google AI Studio](https://aistudio.google.com) → **Get API key**.
3. En el proyecto de Vercel: **Settings → Environment Variables** y agrega `GEMINI_API_KEY` con tu llave.
4. **Deployments → Redeploy** para que tome la variable.

## Variables

| Variable | Para qué | Si no la pones |
|---|---|---|
| `GEMINI_API_KEY` | La IA que dibuja (nivel gratis de Google) | La página avisa que falta la llave |
| `GEMINI_MODELOS` | Modelos a probar en orden, separados por comas | `gemini-flash-latest,gemini-flash-lite-latest` |
| `LIMITE_POR_HORA` | Dibujos por persona por hora | 20 |
| `FAL_KEY` | Respaldo con fal.ai cuando Gemini ya no responde. **Cobra de tus créditos** | Solo se usa Gemini |
| `FAL_MODELO` | Modelo de OpenRouter dentro de fal | `~google/gemini-flash-latest` |

## Cómo funciona

- `index.html`: toda la página. Limpia el SVG otra vez antes de mostrarlo y lo muestra como imagen, así nunca corre código.
- `api/dibujar.js`: función de Vercel. Tiene las instrucciones fijas del estilo (`ESTILO`), llama a Gemini y, si se acaba el límite y hay `FAL_KEY`, a fal.ai. Quita del SVG todo lo que no sea figura (scripts, enlaces, imágenes de fuera).
- «¿Le cambias algo?» manda el dibujo actual con el cambio. «Hacer otra versión» pide una variación.
- La lista «Tus dibujos» se guarda solo en el navegador de cada quien.

## Sobre los límites

- El nivel gratis de Gemini tiene un tope de peticiones por día por proyecto; cuando se acaba, la página dice que se intente más tarde. Los topes exactos se ven en AI Studio.
- En el nivel gratis, Google puede usar lo que se manda para mejorar sus productos. La página lo avisa en «Preguntas».
- El límite por persona vive en la memoria de la función: sirve contra abusos simples, no es exacto. Si activas `FAL_KEY`, pon un tope de gasto en fal.ai.

## Cambiar el estilo

Todo el estilo está en el texto `ESTILO` de `api/dibujar.js`. Si cambias el grosor o el color del contorno, también conviene cambiar el borde blanco de la estampita (`estampita()` en `index.html`).
