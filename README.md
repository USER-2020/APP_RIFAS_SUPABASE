# RIFLY

Rifly es una plataforma mobile-first para gestionar rifas pequeñas: catálogo público, selección de números, reservas transaccionales y operación administrativa.

## Stack

Next.js 16 con App Router, React, TypeScript, Tailwind CSS v4, Supabase Auth/PostgreSQL/Storage/Realtime, React Hook Form, Zod y Lucide.

## Ejecutar localmente

```bash
npm install
copy .env.example .env.local
npm run dev
```

Configura `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_SITE_URL` en `.env.local`. Nunca expongas una service role key al navegador.

## Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta `supabase/migrations/20260911000000_initial.sql` en el SQL Editor.
3. No ejecutes `supabase/seed.sql` si no quieres datos demo.
4. Crea el bucket público `raffles` y limita escritura a usuarios cuyo perfil tenga rol `admin`.
5. Crea el primer usuario en Authentication, inserta su perfil `admin` y configura `SUPABASE_SERVICE_ROLE_KEY` sólo en el servidor.
6. Entra a `/admin/usuarios` para crear administradores adicionales desde la aplicación.
7. Activa Realtime para `raffle_numbers` y programa `release_expired_reservations()` con pg_cron o un job externo.

La RPC `create_reservation` calcula el precio en PostgreSQL y bloquea la operación completa si algún número dejó de estar disponible. `confirm_reservation` y `reject_reservation` son atómicas y sólo aceptan administradores. La creación de usuarios admin usa la clave service role únicamente en el endpoint servidor `/api/admin/users`; nunca la pongas en una variable `NEXT_PUBLIC_*`.

## Integración con otras plataformas

Rifly puede ser consumida por plataformas como REM Experience mediante usuarios de API. En `/admin/integraciones`, un administrador crea el usuario consumidor, su organización y una integración. Rifly muestra un token `rfly_live_...` una sola vez; debe guardarse únicamente en el servidor de la plataforma externa, nunca en el navegador.

La integración permite crear rifas con `POST /api/v1/raffles`. Para campañas ligadas a una compra, la plataforma externa valida la orden y solicita un token temporal con `POST /api/v1/raffles/{id}/participation-tokens`. La respuesta incluye un `embedUrl` para mostrar el selector de números de Rifly dentro de un iframe. Ese token temporal está limitado a una rifa, una compra, una cantidad máxima de números y una fecha de vencimiento. Al confirmar, Rifly valida y marca los números como confirmados sin revisión manual.

La documentación completa está en [`docs/INTEGRATION_API.md`](docs/INTEGRATION_API.md).

REM puede continuar usando la API REST directamente. El SDK `@rifly/sdk` es opcional y ofrece métodos TypeScript sobre los mismos endpoints, tokens, permisos y embeds. Debe ejecutarse en el backend de REM; la PWA sólo debe comunicarse con el backend propio de REM.

## Producción

En Hostinger, configura `NEXT_PUBLIC_SITE_URL=https://rifly.online` antes de compilar y vuelve a desplegar después de cambiarla. Debe coincidir con el origen público que usa el navegador (protocolo, dominio y puerto, si existe). En local conserva `http://localhost:3000`.

La API de confirmación y rechazo de reservas usa esta URL para validar el encabezado `Origin`, incluso cuando el proxy del hosting entrega una URL interna a Next.js. No requiere desactivar CORS ni confiar en encabezados reenviados. Las variables de Supabase deben usar los nombres `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` (esta última sólo en el servidor).

Para comprobar la validación del origen: `node --import tsx --test lib/request-origin.test.ts`.

Importa el repositorio en Vercel, configura las tres variables de entorno y despliega. Después de modificar SQL, ejecuta la migración en el proyecto Supabase. El manifest, robots, sitemap y metadata de cada rifa están preparados para compartir previews en redes sociales.This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

Después de confirmar una participación desde el iframe, Rifly puede enviar automáticamente el correo de confirmación al customer_email del token. Configura RESEND_API_KEY y MAIL_FROM sólo en el servidor. El correo no bloquea la confirmación y puede reintentarse desde el endpoint administrativo de la reserva.
