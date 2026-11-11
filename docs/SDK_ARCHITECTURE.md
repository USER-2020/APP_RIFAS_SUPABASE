# Arquitectura inicial del SDK de Rifly

## Objetivo

Dar a una PWA una integración segura con Rifly sin encerrar el contrato en Next.js, React o Supabase. El SDK vive en `sdk/rifly` y usa únicamente APIs web estándar.

```text
PWA (navegador)
  -> BFF propio de la aplicación
     -> @rifly/sdk (token permanente sólo en servidor)
        -> API REST de Rifly
```

El frontend puede recibir `embedUrl` para mostrar el selector de números, pero no debe recibir el token permanente de integración.

REM puede consumir Rifly de dos maneras equivalentes:

- API REST directa, usando `fetch`, Axios u otro cliente HTTP.
- `@rifly/sdk`, que encapsula las mismas rutas y autenticación.

El SDK es una capa de conveniencia, no una sustitución de la API. Por eso una integración existente puede mantenerse sin cambios y adoptar el SDK gradualmente.

## Capas previstas

- **Core:** cliente HTTP, tipos, errores y serialización de fechas.
- **Adaptadores de servidor:** Next.js Route Handler, Express/Fastify, Deno/Bun, Cloudflare Workers y Supabase Edge Functions.
- **Adaptadores de cliente:** helpers opcionales para React, React Native, Flutter, Swift y Kotlin. Estos consumirán un BFF o endpoints públicos limitados; nunca almacenarán la clave de integración.
- **Eventos:** webhooks firmados para desacoplar reservas, pagos y ganadores.

## Compatibilidad y versionado

El SDK usa la API versionada `/api/v1`. Los cambios incompatibles deben crear una nueva versión del contrato o del paquete mayor. Los tipos del SDK deben reflejar el JSON público, no las tablas internas de Supabase.
