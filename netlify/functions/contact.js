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
const { KINDS, REF_RE, lead, receipt, quotation, oneLine } = require("../lib/mail-templates");
// The site's own price list and company details, shared with the browser.
const pricing = require("../../assets/js/pricing.js");
const siteConfig = require("../../assets/js/config.js");

/* --- Configuration ---------------------------------------- */
/* Values pasted into the Netlify UI often keep the quotes from a .env
   file, and Google shows app passwords in groups of four. Both break the
   login or the From address silently, so normalise them here. */
const unquote = (v) => (typeof v === "string" ? v.trim().replace(/^(["'])(.*)\1$/, "$2") : v);
for (const k of ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "MAIL_TO", "MAIL_ACK", "ALLOWED_ORIGIN"]) {
  if (process.env[k] !== undefined) process.env[k] = unquote(process.env[k]);
}
if (process.env.SMTP_PASS) process.env.SMTP_PASS = process.env.SMTP_PASS.replace(/\s+/g, "");

const {
  SMTP_HOST = "smtp.gmail.com",
  SMTP_PORT = "587",
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,               // e.g. "Bulan website <hello@bulan.co.za>"
  MAIL_TO,                 // where leads land
  MAIL_ACK = "true",       // send the visitor a receipt; "false" turns it off
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
/* oneLine (from the templates) is the header-injection guard: a
   newline in a subject or a name lets an attacker append their own
   headers, so CR/LF is stripped from anything near one. */

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

/* One email to the same visitor address per minute, whatever the IP.
   Stops the "email it to me" button being used to flood one inbox. */
const mailedTo = new Map();
function recentlyMailed(address) {
  const now = Date.now(), key = address.toLowerCase();
  for (const [k, t] of mailedTo) if (now - t > 60_000) mailedTo.delete(k);
  return mailedTo.has(key);
}
const markMailed = (address) => mailedTo.set(address.toLowerCase(), Date.now());

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
    console.warn(`Rejected a form post from ${origin}: ALLOWED_ORIGIN is "${ALLOWED_ORIGIN}".`);
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

  /* kind says which form sent this:
       brief       contact.html              → lead to Bulan + confirmation to visitor
       quote       quote builder, generated  → lead to Bulan + quotation to visitor
       quote-copy  "Email it to me" button   → quotation to visitor only
       enquiry     anything else             → lead to Bulan + confirmation to visitor */
  const copyOnly = data.kind === "quote-copy";
  const kind = copyOnly ? "quote" : KINDS.includes(data.kind) ? data.kind : "enquiry";

  // Quotations are priced here, from pricing.js, never from figures the
  // browser sends. The email then shows Bulan's own prices whatever the
  // request contained.
  let q = null, reference = "";
  if (kind === "quote") {
    const sel = data.selection && typeof data.selection === "object" ? data.selection : {};
    q = pricing.compute({
      items: (Array.isArray(sel.items) ? sel.items : []).slice(0, 60).map(String),
      timeline: String(sel.timeline || ""), months: sel.months, care: sel.care === true,
    }, siteConfig);
    if (!q.lines.length) return json(400, { error: "Select at least one item for the quotation.", fields: ["selection"] });
    reference = REF_RE.test(f.reference || "") ? f.reference
      : `BLN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    f.reference = reference;
  }
  const summary = q && {
    lines: q.lines, adjustments: q.adjustments, total: q.total, net: q.net, vat: q.vat,
    vatCharged: !!siteConfig.chargeVat, timeline: q.timeline.name, months: q.months,
    care: q.care, hasRecurring: q.monthly > 0,
  };

  if (copyOnly && recentlyMailed(f.email)) {
    return json(429, { error: "We emailed this address a moment ago. Check your inbox and spam folder, or try again in a minute." });
  }

  // Serverless runtimes run in UTC. Stamp the mail in the office's own
  // time so "received 09:11" does not really mean 11:11 SAST.
  const received = new Date().toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg", dateStyle: "medium", timeStyle: "short",
  }) + " SAST";
  const site = ORIGINS.length ? ORIGINS[0].replace(/^https?:\/\//, "") : "the Bulan website";

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

  if (!copyOnly) {
    const leadMail = lead({ kind, f, summary, received, ip, site });
    try {
      await transporter.sendMail({
        // From must be our own domain or SPF and DKIM fail and the mail
        // is filed as spam. The visitor goes in Reply-To instead, so
        // hitting reply in the inbox still reaches them.
        from: MAIL_FROM || `Bulan website <${SMTP_USER}>`,
        to: MAIL_TO,
        replyTo: `${oneLine(f.name)} <${f.email}>`,
        subject: oneLine(leadMail.subject),
        text: leadMail.text,
        html: leadMail.html,
      });
      console.info(`${kind} lead sent to ${MAIL_TO}`);
    } catch (err) {
      // Log the detail for us; tell the visitor nothing about our infrastructure.
      console.error("sendMail failed:", err && err.message);
      return json(502, { error: "We could not send that just now. Please email us directly." });
    }
  }

  /* The visitor's copy: their quotation, or a confirmation of their brief.
     Sent automatically unless MAIL_ACK=false; the "Email it to me" button
     always sends. After a lead, a failure here is logged and swallowed,
     since reporting it would make the visitor send the same brief twice. */
  let visitorSent = false;
  if (copyOnly || MAIL_ACK !== "false") {
    const mail = kind === "quote"
      ? quotation({ f, q, reference, cfg: siteConfig, site })
      : receipt({ kind, f, site });
    try {
      await transporter.sendMail({
        from: MAIL_FROM || `Bulan <${SMTP_USER}>`,
        to: f.email,
        replyTo: MAIL_TO,
        subject: oneLine(mail.subject),
        text: mail.text,
        html: mail.html,
      });
      markMailed(f.email);
      visitorSent = true;
      console.info(`${kind === "quote" ? "quotation" : "confirmation"} sent to ${f.email}`);
    } catch (err) {
      console.error("visitor copy failed:", err && err.message);
      if (copyOnly) return json(502, { error: "We could not email the quotation just now. Download it instead, or try again shortly." });
    }
  }

  return json(200, { ok: true, reference: reference || undefined, emailedVisitor: visitorSent });
};
