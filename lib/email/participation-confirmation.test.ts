import assert from "node:assert/strict";
import { test } from "node:test";
import { sendParticipationConfirmationEmail } from "./participation-confirmation";

const details = {
  customerName: "Juan Pérez",
  customerEmail: "juan@example.com",
  raffleTitle: "Buena Vida Fest",
  numbers: [4, 27],
  reservationCode: "RF-909FFA",
  confirmedAt: "2026-11-09T18:00:00.000Z",
  total: 100000,
};

test("envía el correo después de una participación confirmada", async () => {
  let sent = false;
  let payload = "";
  const result = await sendParticipationConfirmationEmail(details, {
    claimSend: async () => true,
    markSent: async () => { sent = true; },
    markFailed: async () => { throw new Error("no debía fallar"); },
    apiKey: "re_test_key",
    from: "Rifly <no-reply@example.com>",
    fetchImpl: async (_url, init) => { payload = String(init?.body); return new Response("{}", { status: 200 }); },
  });
  assert.deepEqual(result, { status: "sent" });
  assert.equal(sent, true);
  assert.match(payload, /RF-909FFA/);
  assert.match(payload, /Buena Vida Fest/);
  assert.match(payload, /juan@example.com/);
});

test("confirma la participación sin correo y no intenta enviar", async () => {
  let claimed = false;
  const result = await sendParticipationConfirmationEmail({ ...details, customerEmail: null }, {
    claimSend: async () => { claimed = true; return true; },
    markSent: async () => {},
    markFailed: async () => {},
    fetchImpl: async () => { throw new Error("no debía llamar Resend"); },
  });
  assert.deepEqual(result, { status: "skipped", reason: "missing_email" });
  assert.equal(claimed, false);
});

test("un fallo del correo no genera un segundo envío ni una segunda reserva", async () => {
  let attempts = 0;
  let failed = "";
  const first = await sendParticipationConfirmationEmail(details, {
    claimSend: async () => { attempts += 1; return true; },
    markSent: async () => {},
    markFailed: async error => { failed = error; },
    apiKey: "re_test_key",
    from: "Rifly <no-reply@example.com>",
    fetchImpl: async () => new Response("provider failure", { status: 500 }),
  });
  const second = await sendParticipationConfirmationEmail(details, {
    claimSend: async () => false,
    markSent: async () => {},
    markFailed: async () => {},
    apiKey: "re_test_key",
    from: "Rifly <no-reply@example.com>",
    fetchImpl: async () => { throw new Error("no debe repetir el envío mientras está bloqueado"); },
  });
  assert.equal(first.status, "failed");
  assert.match(failed, /Resend respondió 500/);
  assert.deepEqual(second, { status: "skipped", reason: "already_sent_or_in_progress" });
  assert.equal(attempts, 1);
});
