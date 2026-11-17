# TucuOficios

Vitrina de profesionales de oficios en San Miguel de Tucumán. Los clientes contactan por WhatsApp.

**Stack:** React 19 + Vite + Tailwind 4 · Supabase (base de datos, login con Google, fotos) · Netlify.

**Sitio:** https://tucuoficios.net.ar

## Configuración (una sola vez)

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor** → pegá y ejecutá `supabase/schema.sql`.
3. **Authentication → Providers → Google**: activalo y cargá el Client ID / Secret
   (se crean en Google Cloud Console → APIs y servicios → Credenciales → ID de cliente OAuth, tipo "Aplicación web").
   En Google, como *URI de redireccionamiento autorizado* poné la que te muestra Supabase
   (`https://TU-PROYECTO.supabase.co/auth/v1/callback`).
4. **Authentication → URL Configuration**: en *Site URL* poné `https://tucuoficios.net.ar` y en *Redirect URLs*
   agregá `http://localhost:3000/**` y `https://tucuoficios.net.ar/**`.
5. Copiá `.env.example` a `.env` y completá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
   (Project Settings → API).
6. Entrá a la web con tu cuenta de Google y después ejecutá en el SQL Editor:
   ```sql
   insert into public.admins (user_id)
     select id from auth.users where email = 'TU_EMAIL@gmail.com';
   ```

## Desarrollo

```bash
npm install
npm run dev
```

## Seguridad

Las reglas viven en la base de datos (RLS + triggers), no en el navegador:

- El público solo ve publicaciones **aprobadas**.
- Publicar requiere login. Cada usuario edita y borra solo lo suyo; el admin, todo.
- Las publicaciones nuevas o editadas quedan **pendientes** hasta que las aprueba un admin.
- Límite de 5 publicaciones por usuario y 1 cada 2 minutos.
- Las fotos se suben comprimidas (WebP) a la carpeta del usuario, máx. 3 MB.

## Deploy

Netlify publica automáticamente cada push a `main` (build: `npm run build`, carpeta `dist`).
Las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están cargadas en
Netlify → Project configuration → Environment variables.

Dominio `tucuoficios.net.ar` registrado en NIC Argentina (vence cada 17/11), delegado a Netlify DNS.

## Flujo de trabajo

- `dev`: rama de trabajo. Cada push publica una copia de prueba en https://dev--tucuoficios.netlify.app
- `main`: producción (https://tucuoficios.net.ar). Solo recibe cambios ya probados en `dev`.

1. Trabajá y commiteá en `dev`, y hacé push.
2. Probá en dev--tucuoficios.netlify.app (el login con Google también funciona ahí).
3. Si está todo bien, uní `dev` en `main` (en GitHub Desktop: rama `main` → *Branch → Merge into current branch* → `dev`) y hacé push.

El build corre `tsc --noEmit` antes de compilar: si hay errores de TypeScript, Netlify no publica.

## Base de datos

- `supabase/schema.sql`: esquema inicial (tablas, permisos RLS, triggers, storage).
- `supabase/migrations/`: cada cambio posterior, un archivo por cambio, con fecha en el nombre.

Para cambiar la base: creá un archivo nuevo en `supabase/migrations/` (ej. `20261201120000_algo.sql`), ejecutalo en Supabase → SQL Editor y commitealo junto con el código que lo usa. Nunca edites una migración ya aplicada: hacé una nueva.

## Tests

`npm test` corre los tests (`src/__tests__/`). También corren en cada build de Netlify: si alguno falla, no se publica.
