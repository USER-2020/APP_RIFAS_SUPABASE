import assert from "node:assert/strict";
import { test } from "node:test";
import { hasAllowedOrigin } from "./request-origin";

const request = (origin?: string) => new Request("http://localhost:3000/api/admin/reservations/example", {
  method: "POST", headers: origin ? { origin } : {},
});

test("accepts the public HTTPS origin even when the proxy uses internal HTTP", () => {
  assert.equal(hasAllowedOrigin(request("https://rifly.online"), "https://rifly.online/"), true);
});

test("supports local same-origin requests without a public URL", () => {
  assert.equal(hasAllowedOrigin(request("http://localhost:3000"), ""), true);
});

test("rejects missing, opaque, foreign, downgraded and deceptive origins", () => {
  for (const origin of [undefined, "null", "https://other.example", "http://rifly.online", "https://rifly.online.attacker.example", "https://rifly.online:444", "https://rifly.online/path", "http://localhost:3000"]) {
    assert.equal(hasAllowedOrigin(request(origin), "https://rifly.online"), false, origin);
  }
});

test("does not accept forged forwarding headers or malformed configuration", () => {
  const incoming = request("https://attacker.example");
  incoming.headers.set("x-forwarded-host", "attacker.example");
  incoming.headers.set("x-forwarded-proto", "https");
  assert.equal(hasAllowedOrigin(incoming, "https://rifly.online"), false);
  assert.equal(hasAllowedOrigin(incoming, "not a URL"), false);
  assert.equal(hasAllowedOrigin(incoming, "file:///tmp/app"), false);
});
