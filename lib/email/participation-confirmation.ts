export type ParticipationConfirmation = {
  customerName: string;
  customerEmail: string | null;
  raffleTitle: string;
  numbers: number[];
  reservationCode: string;
  confirmedAt: string;
  total: number;
};

type EmailDependencies = {
  claimSend: () => Promise<boolean>;
  markSent: () => Promise<void>;
  markFailed: (error: string) => Promise<void>;
  fetchImpl?: typeof fetch;
  apiKey?: string;
  from?: string;
};

export type ConfirmationEmailResult =
  | { status: "sent" }
  | { status: "skipped"; reason: "missing_email" | "already_sent_or_in_progress" | "not_configured" }
  | { status: "failed"; error: string };

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] ?? character));

export function buildParticipationConfirmationEmail(details: ParticipationConfirmation) {
  const numbers = details.numbers.map(number => String(number).padStart(2, "0")).join(", ");
  const confirmedAt = new Date(details.confirmedAt).toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota" });
  const total = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(details.total);
  const name = escapeHtml(details.customerName);
  const raffle = escapeHtml(details.raffleTitle);
  const code = escapeHtml(details.reservationCode);
  const numbersHtml = escapeHtml(numbers);

  return {
    subject: "Participación confirmada · " + details.raffleTitle,
    text: "Hola " + details.customerName + ",\n\nTu participación en " + details.raffleTitle + " quedó confirmada.\nNúmeros seleccionados: " + numbers + "\nCódigo de referencia: " + details.reservationCode + "\nFecha de confirmación: " + confirmedAt + "\nTotal: " + total + "\n\nGracias por participar en Rifly.",
    html: "<div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#101828;max-width:600px;margin:auto\"><h1 style=\"color:#6d4aff\">Participación confirmada</h1><p>Hola " + name + ",</p><p>Tu participación en <strong>" + raffle + "</strong> quedó confirmada correctamente.</p><div style=\"background:#f6f7fb;border-radius:12px;padding:20px\"><p><strong>Números seleccionados:</strong> " + numbersHtml + "</p><p><strong>Código de referencia:</strong> " + code + "</p><p><strong>Fecha de confirmación:</strong> " + escapeHtml(confirmedAt) + "</p><p><strong>Precio total:</strong> " + escapeHtml(total) + "</p></div><p>Conserva este correo y tu código de referencia.</p><p>Gracias por participar en Rifly.</p></div>",
  };
}

export async function sendParticipationConfirmationEmail(details: ParticipationConfirmation, dependencies: EmailDependencies): Promise<ConfirmationEmailResult> {
  if (!details.customerEmail) {
    console.warn("Participación confirmada sin correo del cliente", { reservationCode: details.reservationCode });
    return { status: "skipped", reason: "missing_email" };
  }

  if (!(await dependencies.claimSend())) return { status: "skipped", reason: "already_sent_or_in_progress" };
  const apiKey = dependencies.apiKey ?? process.env.RESEND_API_KEY;
  const from = dependencies.from ?? process.env.MAIL_FROM;
  if (!apiKey || !from) {
    const error = "RESEND_API_KEY o MAIL_FROM no están configuradas";
    await dependencies.markFailed(error);
    console.warn(error, { reservationCode: details.reservationCode });
    return { status: "skipped", reason: "not_configured" };
  }

  const email = buildParticipationConfirmationEmail(details);
  try {
    const response = await (dependencies.fetchImpl ?? fetch)("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [details.customerEmail], subject: email.subject, text: email.text, html: email.html }),
    });
    if (!response.ok) throw new Error("Resend respondió " + response.status + ": " + (await response.text()).slice(0, 300));
    await dependencies.markSent();
    return { status: "sent" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido al enviar el correo";
    await dependencies.markFailed(message);
    console.error("No se pudo enviar el correo de confirmación", { reservationCode: details.reservationCode, error: message });
    return { status: "failed", error: message };
  }
}
