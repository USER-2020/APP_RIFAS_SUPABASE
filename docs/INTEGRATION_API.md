# API de integración de Rifly

La API permite que una plataforma externa, como REM Experience, cree rifas usando la lógica de Rifly.

## Flujo actual

1. Un administrador crea una organización y una integración desde el endpoint administrativo.
2. Rifly devuelve un token una sola vez.
3. REM guarda el token únicamente en su servidor.
4. REM llama `POST /api/v1/raffles` con `Authorization: Bearer <token>`.
5. Rifly crea la rifa y sus números dentro de la organización asociada.

El token nunca debe aparecer en código frontend, URLs, logs ni respuestas posteriores.

## Crear un usuario de API

Desde `/admin/integraciones`, un administrador registra el usuario o empresa que consumirá la API. Rifly crea su organización, integración y token.

`POST /api/admin/integrations` requiere una sesión de administrador de Rifly.

```json
{
  "consumerName": "REM Experience",
  "consumerEmail": "dev@remexperience.com",
  "name": "REM Experience",
  "providerKey": "rem-experience",
  "organizationName": "REM Experience",
  "organizationSlug": "rem-experience",
  "scopes": ["raffles:read", "raffles:write"]
}
```

La respuesta incluye `token` sólo en ese momento. Debe guardarse en un gestor de secretos. Este token permanente se usa únicamente desde el servidor del proyecto consumidor.

## Crear una rifa desde REM

```bash
curl -X POST "https://rifly.online/api/v1/raffles" \
  -H "Authorization: Bearer rfly_live_TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Rifa de experiencia",
    "slug": "rifa-de-experiencia",
    "description": "Participa y gana una experiencia.",
    "prizeName": "Experiencia premium",
    "pricePerNumber": 25000,
    "numberStart": 0,
    "numberEnd": 99,
    "salesCloseAt": "2026-12-01T20:00:00-05:00",
    "drawAt": "2026-12-05T20:00:00-05:00",
    "drawMethod": "Sorteo en vivo",
    "reservationMinutes": 15,
    "status": "draft"
  }'
```

La respuesta incluye el `id`, el `slug` y la URL pública de Rifly.

### Subir la portada

Después de crear la rifa, usa el `id` devuelto para subir la imagen como `multipart/form-data`:

```bash
curl -X POST "https://rifly.online/api/v1/raffles/RAFFLE_ID/image" \\
  -H "Authorization: Bearer rfly_live_TU_TOKEN" \\
  -F "image=@./portada-rifa.jpg"
```

Formatos permitidos: JPG, PNG y WebP. Tamaño máximo: 5 MB.

## Consultar y editar una rifa

El token debe tener `raffles:read` para consultar una rifa y `raffles:write` para editarla. La integración sólo puede acceder a rifas de su propia organización. Los rangos de números no se modifican por API para proteger reservas existentes.

```bash
curl -X PATCH "https://rifly.online/api/v1/raffles/RAFFLE_ID" \\
  -H "Authorization: Bearer rfly_live_TU_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Rifa actualizada",
    "pricePerNumber": 30000,
    "status": "active",
    "salesCloseAt": "2026-12-01T20:00:00-05:00",
    "drawAt": "2026-12-05T20:00:00-05:00"
  }'
```

También puedes consultar la configuración actual con `GET /api/v1/raffles/RAFFLE_ID`.

## Crear una participación para una compra válida

REM debe validar primero su propia compra. Después solicita un token temporal por orden:

```bash
curl -X POST "https://rifly.online/api/v1/raffles/RAFFLE_ID/participation-tokens" \
  -H "Authorization: Bearer rfly_live_TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "externalPurchaseId": "ORD-87452",
    "externalUserId": "USER-2048",
    "allowedNumbers": 2,
    "customer": {
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "phone": "573001234567"
    }
  }'
```

Rifly devuelve `embedUrl`. REM debe mostrar esa URL en un iframe. El token de participación es de un solo uso y expira; no reemplaza al token permanente de la integración.

```html
<iframe src="EMBED_URL_DEVUELTA_POR_RIFLY" width="100%" height="800" title="Seleccionar números de la rifa"></iframe>
```

Al confirmar, Rifly valida la cantidad permitida, bloquea los números y crea la reserva como confirmada. No requiere revisión manual del administrador.

Si el token contiene un correo del cliente y Rifly tiene configurado Resend, después de confirmar se envía un correo con los números, el código de reserva, la fecha y el total. El envío no revierte la participación si el proveedor falla. Los envíos quedan registrados en participation_tokens.confirmation_email_sent_at; un administrador puede reintentar un envío pendiente mediante POST /api/admin/reservations/{RESERVATION_ID}/confirmation-email.

## Endpoints previstos

- `GET /api/v1/raffles/:id`
- `PATCH /api/v1/raffles/:id`
- `GET /api/v1/raffles/:id/reservations`
- Webhooks para reservas, pagos y ganadores.

## API REST directa o SDK

La integración actual de REM sigue siendo válida y no necesita instalar el SDK. REM puede continuar enviando peticiones HTTP directamente a los endpoints `/api/v1` con su token Bearer.

El SDK de Rifly es una alternativa opcional que encapsula esas mismas peticiones. No crea una API diferente ni cambia el modelo de seguridad: utiliza los mismos tokens, permisos, organizaciones, rifas y URLs de embed.

| Opción | Uso recomendado |
| --- | --- |
| API REST directa | REM ya tiene su cliente HTTP o necesita controlar completamente las peticiones. |
| `@rifly/sdk` | Proyectos TypeScript que prefieren métodos tipados y manejo centralizado de errores. |

### Uso del SDK desde REM

El SDK debe instalarse y ejecutarse en el backend de REM, nunca en el navegador:

```ts
import { createRiflyClient } from "@rifly/sdk";

const rifly = createRiflyClient({
  baseUrl: process.env.RIFLY_URL ?? "https://rifly.online",
  token: process.env.RIFLY_API_TOKEN!,
});

const raffle = await rifly.createRaffle({
  title: "Rifa de experiencia",
  slug: "rifa-de-experiencia",
  description: "Participa y gana una experiencia.",
  prizeName: "Experiencia premium",
  pricePerNumber: 25000,
  numberStart: 0,
  numberEnd: 99,
  salesCloseAt: "2026-12-01T20:00:00-05:00",
  drawAt: "2026-12-05T20:00:00-05:00",
  drawMethod: "Sorteo en vivo",
  status: "draft",
});
```

El SDK también expone `getRaffle`, `updateRaffle`, `uploadRaffleImage` y `createParticipationToken`. La PWA o frontend de REM debe llamar a un endpoint propio de REM; ese endpoint usa el SDK y conserva `RIFLY_API_TOKEN` en variables de entorno o un gestor de secretos.

La documentación específica está en [`sdk/rifly/README.md`](../sdk/rifly/README.md) y la arquitectura multiplataforma en [`docs/SDK_ARCHITECTURE.md`](SDK_ARCHITECTURE.md).

## Correo de confirmación

Configura RESEND_API_KEY y MAIL_FROM únicamente en el servidor. El dominio de MAIL_FROM debe estar verificado en Resend. Ejecuta npm test para validar el flujo de correo.
