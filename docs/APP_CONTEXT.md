# RIFLY: contexto para agentes

## 1. Resumen

RIFLY es una aplicación web para gestionar rifas pequeñas. Tiene un sitio público para descubrir rifas y reservar números, y un panel administrativo para gestionar administradores, crear rifas y seleccionar una rifa destacada.

El comprador no crea cuenta. Sólo entrega nombre y WhatsApp al reservar. Los administradores sí usan Supabase Auth con email y contraseña.

## 2. Stack

- Next.js `16.3.4`.
- App Router.
- React 19.
- TypeScript.
- Tailwind CSS v4.
- Supabase PostgreSQL.
- Supabase Auth.
- Supabase Storage.
- Supabase Realtime preparado.
- `@supabase/ssr` y `@supabase/supabase-js`.
- React Hook Form y Zod para formularios.
- `react-phone-input-2` para teléfonos internacionales, con Colombia como país inicial.
- Lucide React para iconos.
- Despliegue previsto: Vercel o un hosting Node.js/VPS.

## 3. Comandos

```powershell
npm install
npm run dev
npm run lint
npm run build
npm start
```

La aplicación local usa normalmente:

```text
http://localhost:3000
```

## 4. Variables de entorno

Archivo local: `.env.local`. No debe subirse al repositorio.

Variables necesarias:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_publishable_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=tu_clave_secreta_server_only
```

Reglas:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` pueden llegar al navegador.
- `SUPABASE_SERVICE_ROLE_KEY` sólo puede usarse en código servidor.
- Nunca usar `SUPABASE_SERVICE_ROLE_KEY` en una variable `NEXT_PUBLIC_*`.
- No copiar secretos reales en documentación, commits, issues o mensajes para agentes.
- La clave service role fue expuesta durante el desarrollo y debe revocarse/generarse de nuevo antes de producción.

## 5. Estructura principal

```text
app/
  page.tsx                         Home pública
  rifas/page.tsx                   Catálogo público conectado a Supabase
  rifa/[slug]/page.tsx             Detalle público y selección de números
  reserva/[code]/page.tsx          Flujo de captura y estado de reserva
  admin/login/page.tsx             Login de administradores
  admin/page.tsx                   Dashboard admin
  admin/perfil/page.tsx            Perfil del admin actual
  admin/usuarios/page.tsx          CRUD de administradores
  admin/rifas/nueva/page.tsx       Wizard de creación de rifas
  admin/rifas/[id]/page.tsx        Confirmación básica de rifa creada
  admin/rifas/destacada/page.tsx   Selección de rifa destacada
  api/admin/profile/route.ts       Actualizar perfil admin
  api/admin/users/route.ts         Crear admin
  api/admin/users/[id]/route.ts    Editar/eliminar admin
  api/admin/raffles/route.ts       Crear rifa y subir portada
  api/admin/raffles/featured/...   Seleccionar destacada
components/
  admin-shell.tsx                  Sidebar, navegación, logout y perfil
  raffle-create-form.tsx           Wizard de creación de rifa
  number-picker.tsx                Selector público de números
  reservation-form.tsx             Nombre, WhatsApp y RPC de reserva
  phone-field.tsx                  Input internacional de teléfono
  admin-user-form.tsx               Crear administradores
  admin-user-list.tsx               Editar/eliminar administradores
lib/
  raffles.ts                       Lecturas públicas server-side
  format.ts                        Formato COP y fechas
  auth/require-admin.ts             Protección server-side de admins
  supabase/server.ts                Cliente Supabase server
  supabase/browser.ts               Cliente Supabase browser
  supabase/admin.ts                 Cliente service role server-only
supabase/
  migrations/                      Migraciones PostgreSQL
  seed.sql                          Datos demo, no ejecutar en producción
public/
  logo.svg
  favicon.svg
  sw.js
```

## 6. Rutas públicas

- `/`: home. Consulta rifas públicas y muestra sólo la rifa marcada `is_featured` como destacada.
- `/rifas`: catálogo de rifas con estado público `active`, `closed` o `finished`.
- `/rifa/[slug]`: detalle server-rendered, metadata dinámica, grid de números y selección.
- `/reserva/nueva?...`: captura de nombre y WhatsApp para crear la reserva.
- `/reserva/[code]`: ruta prevista para consultar una reserva por código; aún necesita terminar la lectura real de Supabase.
- `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`: SEO/PWA inicial.

Las rifas `draft` no deben aparecer públicamente.

## 7. Flujo público de participación

1. Usuario entra a `/rifas`.
2. Abre `/rifa/[slug]`.
3. Ve estados de `raffle_numbers`.
4. Selecciona números disponibles.
5. El selector muestra cantidad y total visual.
6. Continúa a `/reserva/nueva` con `raffleId`, `slug`, título y números.
7. Captura nombre completo y WhatsApp.
8. `reservation-form.tsx` llama la RPC `create_reservation`.
9. PostgreSQL vuelve a validar disponibilidad, precio y estado.
10. Se genera código `RF-XXXXXX`.
11. Se muestra total real y enlace de WhatsApp.

El precio enviado desde el navegador no es confiable: el total definitivo debe venir de PostgreSQL.

## 8. Flujo administrativo

### Autenticación

- `/admin/login` usa Supabase Auth email/password.
- `proxy.ts` redirige usuarios no autenticados fuera de `/admin/*`.
- `requireAdmin()` comprueba sesión y `profiles.role = 'admin'` en servidor.
- El primer admin debe crearse en Supabase Auth y luego insertarse en `profiles` con rol `admin`.

### Dashboard

`/admin` consulta métricas reales desde Supabase:

- Rifas activas.
- Reservas pendientes.
- Números confirmados.
- Total confirmado.
- Últimas rifas.

`AdminShell` incluye:

- Sidebar colapsable en desktop.
- Drawer en móvil.
- Navegación por iconos.
- Perfil.
- Cerrar sesión con `supabase.auth.signOut()`.

### Administradores

`/admin/usuarios` permite:

- Crear administradores.
- Listar nombre, email, estado y fecha.
- Editar nombre, email y contraseña opcional.
- Eliminar administradores con confirmación.
- Impedir que el usuario actual se elimine a sí mismo.

Las operaciones sensibles utilizan `SUPABASE_SERVICE_ROLE_KEY` sólo en endpoints server-side.

### Crear rifas

`/admin/rifas/nueva` tiene wizard responsive de cuatro pasos:

1. Datos básicos.
2. Fechas y dinámica.
3. Portada y contacto.
4. Revisión y publicación.

La creación llama `/api/admin/raffles` con `multipart/form-data`.

El endpoint:

- Valida con Zod.
- Comprueba que el usuario sea admin.
- Ejecuta `create_raffle()`.
- Genera números automáticamente.
- Sube la portada a Storage en `raffles/{raffle_id}/cover.ext`.
- Actualiza `raffles.image_path`.

El slug se deriva automáticamente del nombre hasta que el usuario lo modifica manualmente.

### Rifa destacada

`/admin/rifas/destacada` permite elegir una rifa `active` o `closed`.

La RPC `set_featured_raffle()` deja una única rifa con `is_featured = true`.

## 9. Base de datos

Migración inicial: `20260911000000_initial.sql`.

Tablas:

- `profiles`: perfiles admin vinculados a `auth.users`.
- `customers`: nombre y teléfono del comprador, sin email/documento/ciudad.
- `raffles`: configuración y estado de cada rifa.
- `raffle_numbers`: números por rifa y estado.
- `reservations`: reserva, código, total y fechas.
- `reservation_numbers`: relación reserva-número.

Estados:

```text
raffles: draft | active | closed | finished
raffle_numbers: available | pending | confirmed | blocked
reservations: pending | confirmed | rejected | expired | cancelled
```

Migración destacada: `20260911010000_featured_raffle.sql`.

Migración de creación: `20260911020000_create_raffle_rpc.sql`.

## 10. RPC importantes

- `is_admin()`: comprueba el rol del usuario autenticado.
- `create_reservation(...)`: reserva atómica; calcula total desde DB.
- `release_expired_reservations()`: libera reservas vencidas.
- `confirm_reservation(reservation_id)`: confirma todos los números de una reserva.
- `reject_reservation(reservation_id, reason)`: rechaza y libera números.
- `set_featured_raffle(raffle_id)`: selecciona rifa destacada.
- `create_raffle(...)`: crea rifa y genera números.

Las migraciones ya fueron aplicadas al proyecto Supabase durante el desarrollo mediante:

```powershell
npx supabase db push
```

No ejecutar `supabase/seed.sql` si no se quieren datos de ejemplo.

## 11. Storage

Bucket esperado:

```text
raffles
```

Configuración recomendada:

- Bucket público para lectura.
- JPG, PNG y WebP.
- Máximo 5 MB.
- Escritura sólo para administradores.

Las URLs públicas se construyen con:

```text
{SUPABASE_URL}/storage/v1/object/public/raffles/{image_path}
```

## 12. RLS y seguridad

RLS está habilitado en todas las tablas principales.

Público:

- Puede leer rifas `active`, `closed` y `finished`.
- Puede leer estados públicos de números.
- Puede ejecutar `create_reservation()`.
- No puede leer customers completos.
- No puede insertar reservas directamente.

Admin:

- Puede gestionar rifas y números mediante políticas de rol.
- Puede consultar customers y reservations.
- Puede confirmar/rechazar reservas mediante RPC.

No agregar datos privados del comprador a componentes públicos.

## 13. Estado actual y pendientes

Implementado:

- Home y catálogo conectados a rifas reales.
- Detalle público conectado a Supabase.
- Selección de números.
- Wizard público de participación.
- RPC de reserva.
- Login admin.
- CRUD de administradores.
- Perfil admin y logout.
- Dashboard con métricas reales.
- Wizard admin para crear rifas.
- Subida de portada y preview.
- Rifa destacada.
- RLS, migraciones y Storage base.
- Metadata, sitemap, robots y manifest.

Pendiente o incompleto:

- CRUD completo de rifas: editar, duplicar, cerrar y soft delete desde UI.
- Listado admin completo de reservas.
- Confirmar/rechazar reservas desde el panel.
- Participantes y búsquedas administrativas.
- Realtime en el cliente para actualizar el grid sin recargar.
- Countdown visible de `reserved_until`.
- Página `/reserva/[code]` consultando la reserva real.
- Ganador y finalización de rifas.
- Image optimization completa con `next/image` para URLs de Storage.
- Registro explícito del service worker `public/sw.js`.
- Políticas de Storage automatizadas por migración.
- Pruebas end-to-end.

## 14. Reglas para agentes futuros

1. No reintroducir `lib/demo.ts` ni datos hardcodeados en páginas públicas.
2. No ejecutar `supabase/seed.sql` salvo que el usuario pida datos demo.
3. No usar `SUPABASE_SERVICE_ROLE_KEY` en Client Components.
4. Para cambios de DB, crear una migración nueva y aplicar `npx supabase db push`.
5. No modificar migraciones ya aplicadas para corregir comportamiento; crear otra migración.
6. Mantener compradores sin Auth: nombre y WhatsApp únicamente.
7. Mantener el total y disponibilidad definitivos en PostgreSQL.
8. Validar cambios con `npm run lint` y `npm run build`.
9. Mantener textos en español y touch targets adecuados para móvil.
10. Rotar cualquier secreto que aparezca en logs, capturas, archivos compartidos o conversaciones.

## 15. Checklist de prueba local

```text
[ ] .env.local configurado sin publicar secretos
[ ] Usuario admin creado en Supabase Auth
[ ] Perfil admin insertado en profiles
[ ] Bucket raffles creado
[ ] Migraciones aplicadas
[ ] npm run dev iniciado
[ ] Login en /admin/login
[ ] Crear rifa en /admin/rifas/nueva
[ ] Crear como draft y verificar que no aparece públicamente
[ ] Crear como active y verificar /rifas
[ ] Seleccionar números
[ ] Completar nombre y WhatsApp
[ ] Confirmar que la RPC crea la reserva
[ ] Ver código RF-XXXXXX
[ ] Probar logout
[ ] Ejecutar npm run lint
[ ] Ejecutar npm run build
```
