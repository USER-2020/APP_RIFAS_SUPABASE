# @rifly/sdk

SDK inicial de Rifly para integrar rifas desde una PWA y otros backends.

## Principios

- Sólo usa `fetch`, `FormData` y tipos web estándar.
- No depende de Next.js, React, Supabase ni un framework de UI.
- Puede ejecutarse en Node, Deno, Bun, Edge Functions y un backend-for-frontend (BFF) de una PWA.
- El token `rfly_live_...` debe permanecer en el servidor. Nunca lo incluyas en el bundle, service worker, localStorage o código del navegador.

## Uso en un backend/BFF

```ts
import { createRiflyClient } from "@rifly/sdk";

const rifly = createRiflyClient({
  baseUrl: process.env.RIFLY_URL!,
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

La PWA llama a su propio endpoint (`/api/raffles`, por ejemplo) y ese endpoint usa el SDK. Así el navegador nunca conoce la clave permanente.

## Compatibilidad con la integración actual de REM

REM puede seguir usando la API REST directamente. El SDK no reemplaza ni rompe esa integración: es un cliente opcional para los mismos endpoints `/api/v1`, tokens Bearer, permisos, organizaciones y embeds.

Sin SDK:

```ts
await fetch("https://rifly.online/api/v1/raffles", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.RIFLY_API_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
});
```

Con SDK:

```ts
await rifly.createRaffle(data);
```

Ambas opciones producen el mismo resultado. La elección depende de si REM prefiere controlar manualmente HTTP o usar métodos TypeScript tipados.

## Flujo PWA con embed

1. El backend de REM valida la compra.
2. El backend llama `createParticipationToken`.
3. Rifly devuelve un `embedUrl` temporal.
4. El frontend muestra esa URL en un `iframe`.
5. El token permanente de REM nunca llega al navegador.

## Hoja de ruta

1. `@rifly/sdk` core REST, ya iniciado.
2. Adaptador PWA/BFF con ejemplos para Next.js, Express, Cloudflare Workers y Supabase Edge Functions.
3. Eventos/webhooks para reservas y pagos.
4. Adaptadores de experiencia para React Native, Flutter, Swift y Kotlin que consuman el mismo contrato HTTP.

La API actual cubre creación, consulta y edición de rifas, subida de portada y emisión de tokens temporales de participación.
