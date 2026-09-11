// Use the configured public URL behind reverse proxies; never trust arbitrary
// forwarded headers to decide which sites may submit authenticated requests.
export function hasAllowedOrigin(request: Request, siteUrl = process.env.NEXT_PUBLIC_SITE_URL): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  try {
    const expected = new URL(siteUrl || request.url);
    if (!["http:", "https:"].includes(expected.protocol)) return false;
    return origin === expected.origin;
  } catch {
    return false;
  }
}
