/* ============================================================
   Bulan — contact / quotation mail endpoint.

   POST /.netlify/functions/contact   (Netlify)
   POST /api/contact                  (AWS: Lambda behind CloudFront)

   The same file runs on both. Netlify Functions and API Gateway REST
   APIs send the "v1" event shape; Lambda Function URLs and API Gateway
   HTTP APIs send "v2". The handler normalises either. See README §4.

   Handles both the enquiry form and the quote builder. Everything
   the client sends is treated as untrusted: validated, length-capped
   and escaped before it reaches an email body.

   Configuration is entirely environment variables — set them in
   Netlify under Site configuration → Environment variables (or on the
   Lambda function when hosted on AWS). Nothing
   secret belongs in this file or in git. See .env.example.
   ============================================================ */

const nodemailer = require("nodemailer");

/* --- Configuration ---------------------------------------- */
const {
  SMTP_HOST = "smtp.gmail.com",
  SMTP_PORT = "587",
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,               // e.g. "Bulan website <hello@bulan.co.za>"
  MAIL_TO,                 // where leads land
  MAIL_ACK = "false",      // send the sender a receipt? see note below
  ALLOWED_ORIGIN = "",     // e.g. "https://www.bulan.co.za" — comma-separate several
} = process.env;

const ORIGINS = ALLOWED_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

/* Field limits. Generous for humans, hostile to anyone pasting a
   novel into the message box to run up our send quota. */
const LIMITS = {
  name: 120, company: 160, email: 200, phone: 40, country: 80,
  role: 120, budget: 80, timeline: 80, heard: 200,
  message: 6000, notes: 4000, quote: 12000, reference: 40,
};

const REQUIRED = ["name", "email"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* --- Helpers ----------------------------------------------- */
const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

/* Header injection guard: a newline in a subject or a name lets an
   attacker append their own headers. Strip CR/LF anywhere near one. */
const oneLine = (s) => String(s || "").replace(/[\r\n]+/g, " ").trim();

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  },
  body: JSON.stringify(body),
});

/* Best-effort throttle. Serverless instances are recycled, so this
   only slows a burst that lands on one warm container — it is a speed
   bump, not a security control. Netlify's platform rate limiting and
   the honeypot do the heavier lifting. */
const seen = new Map();
function throttled(ip) {
  const now = Date.now();
  for (const [k, t] of seen) if (now - t > 60_000) seen.delete(k);
  const last = seen.get(ip);
  seen.set(ip, now);
  return last != null && now - last < 8_000;
}

/* --- Handler ----------------------------------------------- */
exports.handler = async (event) => {
  const rc = event.requestContext || {};
  const method = event.httpMethod || (rc.http && rc.http.method) || "";
  // v2 lowercases header names; v1 may not. Lowercase once, read once.
  const headers = {};
  for (const [k, v] of Object.entries(event.headers || {})) headers[k.toLowerCase()] = v;

  if (method === "OPTIONS") return json(204, {});
  if (method !== "POST") return json(405, { error: "Method not allowed" });

  // Same-origin only. The form is on our own site; anything else is abuse.
  const origin = headers.origin || "";
  if (ORIGINS.length && origin && !ORIGINS.includes(origin)) {
    return json(403, { error: "Forbidden" });
  }

  if (!SMTP_USER || !SMTP_PASS || !MAIL_TO) {
    console.error("Mail endpoint is not configured: SMTP_USER, SMTP_PASS and MAIL_TO are required.");
    return json(500, { error: "Mail is not configured on the server." });
  }

  let data;
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : event.body;
    data = JSON.parse(raw || "{}");
  } catch {
    return json(400, { error: "Malformed request." });
  }

  // Honeypot. Bots fill hidden fields; humans never see them.
  // Answer 200 so the bot believes it succeeded and does not retry.
  if (data._gotcha) return json(200, { ok: true });

  const ip =
    (headers["x-nf-client-connection-ip"] ||
     (headers["x-forwarded-for"] || "").split(",")[0] ||
     (rc.http && rc.http.sourceIp) ||
     (rc.identity && rc.identity.sourceIp) ||
     "unknown").trim();
  if (throttled(ip)) return json(429, { error: "Please wait a moment before sending again." });

  // Trim and cap every field we recognise; ignore anything we do not.
  const f = {};
  for (const [k, max] of Object.entries(LIMITS)) {
    if (data[k] != null) f[k] = String(data[k]).trim().slice(0, max);
  }
  // FormData sends one ticked checkbox as a plain string and several as an
  // array, so accept both or a single chosen service silently disappears.
  const services = [].concat(data.services == null ? [] : data.services).filter(Boolean);
  if (services.length) {
    f.services = services.map((s) => String(s).slice(0, 80)).slice(0, 12).join(", ");
  }

  // Collapse whitespace in the short fields. A name or company holding a
  // newline is not a security problem in a body — nodemailer quotes the
  // headers correctly either way — but it renders as a broken two-line
  // table cell. The free-text fields keep their line breaks.
  const MULTILINE = new Set(["message", "notes", "quote"]);
  for (const k of Object.keys(f)) if (!MULTILINE.has(k)) f[k] = oneLine(f[k]);

  const missing = REQUIRED.filter((k) => !f[k]);
  if (missing.length) return json(400, { error: "Missing required fields.", fields: missing });
  if (!EMAIL_RE.test(f.email)) return json(400, { error: "That email address does not look valid.", fields: ["email"] });
  if (!data.consent) return json(400, { error: "Consent is required so that we may reply.", fields: ["consent"] });

  const isQuote = data.kind === "quote";
  const who = oneLine(f.company || f.name);
  const subject = isQuote
    ? `Quotation ${oneLine(f.reference) || ""} — ${who}`.replace(/\s+/g, " ").trim()
    : `Website enquiry — ${who}`;

  /* --- Compose ------------------------------------------- */
  // Serverless runtimes run in UTC. Stamp the mail in the office's own
  // time so "received 09:11" does not really mean 11:11 SAST.
  const received = new Date().toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg", dateStyle: "medium", timeStyle: "short",
  }) + " SAST";
  const ORDER = [
    ["name", "Name"], ["role", "Job title"], ["company", "Company"],
    ["email", "Email"], ["phone", "Phone"], ["country", "Country"],
    ["services", "Services"], ["budget", "Budget"], ["timeline", "Timeline"],
    ["heard", "Found us via"], ["reference", "Quotation ref"],
  ];
  const rows = ORDER.filter(([k]) => f[k]);
  const body = f.message || f.notes || "";

  const text = [
    isQuote ? "PRO-FORMA QUOTATION REQUEST" : "NEW ENQUIRY",
    "".padEnd(46, "-"),
    ...rows.map(([k, label]) => `${label}: ${f[k]}`),
    body ? `\n${isQuote ? "Notes" : "Brief"}:\n${body}` : "",
    f.quote ? `\nQuotation breakdown:\n${f.quote}` : "",
    `\nReceived: ${received}`,
    `Source IP: ${ip}`,
  ].filter(Boolean).join("\n");

  const html = `<!doctype html><meta charset="utf-8">
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#10151F;max-width:640px">
  <p style="font:600 11px/1 monospace;letter-spacing:.14em;text-transform:uppercase;color:#6B7688;margin:0 0 6px">
    ${isQuote ? "Pro-forma quotation request" : "New enquiry"}
  </p>
  <h2 style="margin:0 0 18px;font-size:19px;letter-spacing:-.02em">${esc(who)}</h2>
  <table style="border-collapse:collapse;font-size:14px;width:100%">
    ${rows.map(([k, label]) => `<tr>
      <th style="text-align:left;padding:7px 18px 7px 0;color:#6B7688;font-weight:500;white-space:nowrap;vertical-align:top">${label}</th>
      <td style="padding:7px 0;border-bottom:1px solid #EDF0F5">${
        k === "email" ? `<a href="mailto:${esc(f[k])}">${esc(f[k])}</a>` : esc(f[k])
      }</td></tr>`).join("")}
  </table>
  ${body ? `<h3 style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6B7688;margin:26px 0 8px">${isQuote ? "Notes" : "Brief"}</h3>
  <div style="font-size:14px;line-height:1.65;white-space:pre-wrap">${esc(body)}</div>` : ""}
  ${f.quote ? `<h3 style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6B7688;margin:26px 0 8px">Quotation breakdown</h3>
  <pre style="font-size:12.5px;line-height:1.6;background:#F5F7FB;padding:14px;border-radius:8px;white-space:pre-wrap;margin:0">${esc(f.quote)}</pre>` : ""}
  <p style="font-size:12px;color:#8A93A3;margin-top:28px;border-top:1px solid #EDF0F5;padding-top:12px">
    Sent from the Bulan website · ${esc(received)} · IP ${esc(ip)}
  </p>
</div>`;

  /* --- Send ---------------------------------------------- */
  const port = Number(SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,            // 465 is implicit TLS; 587 upgrades via STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  try {
    await transporter.sendMail({
      // From must be our own domain or SPF and DKIM fail and the mail
      // is filed as spam. The visitor goes in Reply-To instead, so
      // hitting reply in the inbox still reaches them.
      from: MAIL_FROM || `Bulan website <${SMTP_USER}>`,
      to: MAIL_TO,
      replyTo: `${oneLine(f.name)} <${f.email}>`,
      subject: oneLine(subject),
      text,
      html,
    });

    /* An acknowledgement is deliberately OFF by default. The site
       promises "a considered human reply, not an auto-responder", and
       an instant templated email undercuts exactly that claim. Set
       MAIL_ACK=true only if you decide a delivery receipt is worth it. */
    if (MAIL_ACK === "true") {
      await transporter.sendMail({
        from: MAIL_FROM || `Bulan <${SMTP_USER}>`,
        to: f.email,
        subject: isQuote
          ? `We have your quotation request ${oneLine(f.reference)} — Bulan`.replace(/\s+/g, " ")
          : "We have your message — Bulan",
        text: `Hi ${oneLine(f.name).split(" ")[0]},\n\nThis is a delivery receipt, not our reply.\n\n`
            + (isQuote
              ? `We have your quotation request${f.reference ? " " + oneLine(f.reference) : ""}. `
                + `An engineer will review it and respond within one business day.\n\n`
              : `We have your message and an engineer will respond within one business day.\n\n`)
            + `— Bulan\n`,
      });
    }

    return json(200, { ok: true });
  } catch (err) {
    // Log the detail for us; tell the visitor nothing about our infrastructure.
    console.error("sendMail failed:", err && err.message);
    return json(502, { error: "We could not send that just now. Please email us directly." });
  }
};
