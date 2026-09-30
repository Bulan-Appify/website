/* ============================================================
   Bulan — email templates for the contact endpoint.

   Three kinds of submission, one template each:

     brief    the "Start a brief" form on contact.html
     quote    the quote builder on quote.html
     enquiry  anything else (a future form, or an old client
              that does not say what it is)

   Each kind builds two emails: the lead that lands in Bulan's
   inbox, and the receipt the visitor gets back.

   Email HTML is not web HTML. Gmail, Outlook and Apple Mail each
   strip different things, so this uses nested tables, inline
   styles, a 600px column and no SVG, web fonts or external images.

   Lives outside netlify/functions/ on purpose: every .js file in
   that folder becomes a public endpoint. The bundler pulls this in
   through the require() in contact.js.
   ============================================================ */

/* --- Palette ------------------------------------------------
   Taken from the site (assets/css/main.css). The inbox is light,
   so the dark ink is used once, for the header band, and the
   moonlight accent carries links and labels. Each kind gets its
   own quiet tint so the three are told apart at a glance. */
const C = {
  ink: "#0C111B",      // header band
  text: "#10151F",
  text2: "#3B4556",
  muted: "#6B7688",
  faint: "#9AA3B2",
  line: "#E4E8F0",
  canvas: "#F2F4F8",   // behind the card
  panel: "#F6F8FB",    // quiet inner panels
  accent: "#8AA9FF",   // on dark
  link: "#3355CC",     // on white (the site accent is too light for text on white)
  button: "#2F4FB8",
};

const KIND = {
  brief:   { label: "New brief",          tintBg: "#E9EEFF", tintFg: "#2F4FB8", form: "brief form" },
  quote:   { label: "Quotation request",  tintBg: "#E2F6EE", tintFg: "#0B7254", form: "quote builder" },
  enquiry: { label: "New enquiry",        tintBg: "#EEF1F5", tintFg: "#4A5568", form: "website" },
};
const KINDS = Object.keys(KIND);

const URGENT_SERVICE = "Live security incident";

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";

/* --- Helpers ----------------------------------------------- */
const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

const oneLine = (s) => String(s || "").replace(/[\r\n]+/g, " ").trim();

function money(n) {
  const v = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (n < 0 ? "−" : "") + "R " + v;
}

const firstName = (name) => oneLine(name).split(/\s+/)[0].slice(0, 40);

/* --- Quote summary: sanitise what the builder sends ----------
   The figures are the visitor's own indicative numbers, shown back
   to us for convenience. They are never trusted for anything else,
   but they are still shape-checked so a malformed payload cannot
   break the layout. */
function cleanSummary(s) {
  if (!s || typeof s !== "object") return null;
  const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const str = (v, max) => oneLine(v).slice(0, max);
  const lines = (Array.isArray(s.lines) ? s.lines : []).slice(0, 40)
    .map((l) => ({ name: str(l && l.name, 160), note: str(l && l.note, 200), amount: num(l && l.amount) }))
    .filter((l) => l.name && l.amount != null);
  const adjustments = (Array.isArray(s.adjustments) ? s.adjustments : []).slice(0, 10)
    .map((a) => ({ name: str(a && a.name, 160), amount: num(a && a.amount) }))
    .filter((a) => a.name && a.amount != null);
  const total = num(s.total);
  if (total == null) return null;
  const months = Number.isInteger(s.months) && s.months > 0 && s.months <= 60 ? s.months : null;
  return {
    lines, adjustments, total,
    net: num(s.net), vat: num(s.vat), vatCharged: s.vatCharged === true,
    timeline: str(s.timeline, 40), months, care: s.care === true,
    hasRecurring: s.hasRecurring === true,
  };
}

/* --- Building blocks ---------------------------------------- */
function shell({ preheader, header, body, footer }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>Bulan</title></head>
<body style="margin:0;padding:0;background:${C.canvas};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.canvas};">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.canvas}" style="background:${C.canvas};">
<tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;font-family:${FONT};color:${C.text};">
    <tr><td bgcolor="${C.ink}" style="background:${C.ink};border-radius:12px 12px 0 0;padding:18px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="font:700 18px/1 ${FONT};color:#FFFFFF;letter-spacing:-.01em;">Bulan<span style="color:${C.accent};">.</span></td>
        <td align="right" style="font:600 11px/1 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:${C.accent};">${esc(header)}</td>
      </tr></table>
    </td></tr>
    <tr><td bgcolor="#FFFFFF" style="background:#FFFFFF;padding:30px 28px 26px;border:1px solid ${C.line};border-top:0;border-radius:0 0 12px 12px;">
      ${body}
    </td></tr>
    <tr><td style="padding:18px 28px 0;font:12px/1.6 ${FONT};color:${C.faint};text-align:center;">${footer}</td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

const badge = (k) =>
  `<span style="display:inline-block;padding:5px 10px;border-radius:999px;background:${KIND[k].tintBg};color:${KIND[k].tintFg};font:600 11px/1 ${MONO};letter-spacing:.12em;text-transform:uppercase;">${esc(KIND[k].label)}</span>`;

const sectionTitle = (t) =>
  `<p style="margin:28px 0 10px;font:600 11px/1 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:${C.muted};">${esc(t)}</p>`;

function detailsTable(rows) {
  if (!rows.length) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font:14px/1.5 ${FONT};">
${rows.map(([label, value], i) => `<tr>
  <td valign="top" style="width:132px;padding:9px 16px 9px 0;color:${C.muted};${i ? `border-top:1px solid ${C.line};` : ""}">${esc(label)}</td>
  <td valign="top" style="padding:9px 0;color:${C.text};${i ? `border-top:1px solid ${C.line};` : ""}">${value}</td>
</tr>`).join("")}
</table>`;
}

const textPanel = (s) =>
  `<div style="background:${C.panel};border:1px solid ${C.line};border-radius:8px;padding:16px 18px;font:14px/1.65 ${FONT};color:${C.text};white-space:pre-wrap;">${esc(s)}</div>`;

const button = (href, label) =>
  `<a href="${esc(href)}" style="display:inline-block;background:${C.button};color:#FFFFFF;text-decoration:none;font:600 14px/1 ${FONT};padding:13px 20px;border-radius:8px;">${esc(label)}</a>`;

const link = (href, label) => `<a href="${esc(href)}" style="color:${C.link};text-decoration:none;">${esc(label)}</a>`;

function quoteTotalPanel(sum, reference) {
  const meta = [
    sum.timeline && `${sum.timeline} timeline`,
    sum.hasRecurring && sum.months && `${sum.months}-month retainer`,
    sum.care && "12-month care plan",
  ].filter(Boolean).join(" · ");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 4px;background:${KIND.quote.tintBg};border-radius:10px;">
<tr><td style="padding:18px 20px;">
  <p style="margin:0 0 6px;font:600 11px/1 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:${KIND.quote.tintFg};">Indicative total ${sum.vatCharged ? "incl. VAT" : "excl. VAT"}</p>
  <p style="margin:0;font:700 30px/1.15 ${FONT};color:${C.text};letter-spacing:-.02em;">${esc(money(sum.total))}</p>
  <p style="margin:8px 0 0;font:13px/1.5 ${FONT};color:${C.text2};">${reference ? `Ref <strong style="font-family:${MONO};font-weight:600;">${esc(reference)}</strong>` : ""}${reference && meta ? " · " : ""}${esc(meta)}</p>
</td></tr></table>`;
}

function quoteLinesTable(sum) {
  const row = (name, note, amount, opts = {}) => `<tr>
  <td valign="top" style="padding:10px 12px 10px 0;border-top:1px solid ${C.line};${opts.strong ? "font-weight:700;" : ""}">${esc(name)}${note ? `<br><span style="font-size:12.5px;color:${C.muted};">${esc(note)}</span>` : ""}</td>
  <td valign="top" align="right" style="padding:10px 0;border-top:1px solid ${C.line};white-space:nowrap;${opts.strong ? "font-weight:700;" : ""}${amount < 0 ? `color:${KIND.quote.tintFg};` : ""}">${esc(money(amount))}</td>
</tr>`;
  const rows = [
    ...sum.lines.map((l) => row(l.name, l.note, l.amount)),
    ...sum.adjustments.map((a) => row(a.name, "", a.amount)),
  ];
  if (sum.vatCharged && sum.net != null) rows.push(row("Subtotal", "", sum.net));
  if (sum.vatCharged && sum.vat != null) rows.push(row("VAT", "", sum.vat));
  rows.push(row("Total", "", sum.total, { strong: true }));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font:14px/1.45 ${FONT};color:${C.text};">
<tr><td style="padding:0 0 8px;font-size:12px;color:${C.muted};">Item</td><td align="right" style="padding:0 0 8px;font-size:12px;color:${C.muted};">Amount</td></tr>
${rows.join("")}
</table>`;
}

/* --- The lead: lands in Bulan's inbox ------------------------ */
function lead({ kind, f, summary, received, ip, site }) {
  const k = KIND[kind];
  const who = oneLine(f.company || f.name);
  const urgent = kind !== "quote" && (f.services || "").includes(URGENT_SERVICE);
  const person = [f.name, f.role].filter(Boolean).join(", ");

  const subject = (
    kind === "quote"
      ? `Quotation ${oneLine(f.reference)} — ${who}${summary ? ` — ${money(summary.total)}` : ""}`
      : `${urgent ? "URGENT: live security incident — " : ""}${k.label} — ${who}`
  ).replace(/\s+/g, " ").trim();

  // [label, html value, plain value]
  const telHref = f.phone ? `tel:${f.phone.replace(/[^\d+]/g, "")}` : "";
  const rows = [
    ["Name", esc(f.name), f.name],
    f.role && ["Job title", esc(f.role), f.role],
    f.company && ["Company", esc(f.company), f.company],
    ["Email", link(`mailto:${f.email}`, f.email), f.email],
    f.phone && ["Phone", link(telHref, f.phone), f.phone],
    f.country && ["Based in", esc(f.country), f.country],
    f.services && ["Needs", esc(f.services), f.services],
    f.budget && ["Budget", esc(f.budget), f.budget],
    f.timeline && ["Start", esc(f.timeline), f.timeline],
    f.heard && ["Found us via", esc(f.heard), f.heard],
  ].filter(Boolean);

  const note = f.message || f.notes || "";
  const noteTitle = kind === "quote" ? "Client notes" : kind === "brief" ? "The brief" : "Message";
  const replySubject = kind === "quote" ? `Your Bulan quotation ${oneLine(f.reference)}` : `Re: your ${kind === "brief" ? "brief" : "enquiry"} to Bulan`;
  const reply = `mailto:${f.email}?subject=${encodeURIComponent(replySubject.trim())}`;

  const body = `
${badge(kind)}
<h1 style="margin:14px 0 4px;font:700 23px/1.25 ${FONT};color:${C.text};letter-spacing:-.02em;">${esc(who)}</h1>
<p style="margin:0;font:14px/1.5 ${FONT};color:${C.muted};">${esc(person && person !== who ? person + " · " : "")}${esc(received)}</p>
${urgent ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0;"><tr><td style="background:#FFF4E0;border:1px solid #F3D29B;border-radius:8px;padding:12px 16px;font:14px/1.5 ${FONT};color:#7A4B00;"><strong>Live security incident.</strong> Respond to this one first${f.phone ? `, and call ${esc(f.phone)}` : ""}.</td></tr></table>` : ""}
${kind === "quote" && summary ? quoteTotalPanel(summary, f.reference) : ""}
${sectionTitle("Contact")}
${detailsTable(rows)}
${note ? sectionTitle(noteTitle) + textPanel(note) : ""}
${kind === "quote" ? sectionTitle("Quotation breakdown") + (summary ? quoteLinesTable(summary) : f.quote ? `<pre style="margin:0;background:${C.panel};border:1px solid ${C.line};border-radius:8px;padding:14px 16px;font:12.5px/1.6 ${MONO};white-space:pre-wrap;color:${C.text};">${esc(f.quote)}</pre>` : "") : ""}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;"><tr>
  <td>${button(reply, `Reply to ${firstName(f.name)}`)}</td>
  ${f.phone ? `<td style="padding-left:16px;font:14px ${FONT};">${link(telHref, `Call ${f.phone}`)}</td>` : ""}
</tr></table>
${kind === "quote" ? `<p style="margin:18px 0 0;font:12.5px/1.5 ${FONT};color:${C.muted};">Indicative figures from the visitor's own selections. Not a tax invoice and not yet an offer.</p>` : ""}`;

  const footer = `Sent from the ${esc(k.form)} on ${esc(site)} · ${esc(received)} · IP ${esc(ip)}<br>Reply goes straight to ${esc(f.email)}.`;

  const text = [
    `${k.label.toUpperCase()}${urgent ? " — URGENT: LIVE SECURITY INCIDENT" : ""}`,
    "".padEnd(46, "-"),
    kind === "quote" && summary ? `Indicative total: ${money(summary.total)} ${summary.vatCharged ? "incl." : "excl."} VAT\n` : "",
    ...rows.map(([label, , plain]) => `${label}: ${plain}`),
    kind === "quote" && f.reference ? `Reference: ${f.reference}` : "",
    note ? `\n${noteTitle}:\n${note}` : "",
    kind === "quote" && summary
      ? `\nQuotation breakdown:\n${[...summary.lines, ...summary.adjustments].map((l) => `  ${l.name} — ${money(l.amount)}`).join("\n")}\n  TOTAL — ${money(summary.total)}`
      : f.quote ? `\nQuotation breakdown:\n${f.quote}` : "",
    `\nReceived: ${received}`,
    `Source IP: ${ip}`,
  ].filter(Boolean).join("\n");

  return {
    subject,
    text,
    html: shell({ preheader: `${k.label} from ${who}`, header: "Website lead", body, footer }),
  };
}

/* --- The receipt: goes back to the visitor -------------------
   Anyone can type any address into a form, so this email goes to
   people who may never have visited the site. It therefore echoes
   almost nothing they typed: a first name and a reference we can
   validate. No message, no company, no figures, and no links. That
   keeps it useless as a way to send spam through our mail server. */
const REF_RE = /^BLN-\d{4}-\d{4}$/;

function receipt({ kind, f, site }) {
  const name = firstName(f.name) || "there";
  const ref = REF_RE.test(f.reference || "") ? f.reference : "";
  const what = kind === "quote" ? "quotation request" : kind === "brief" ? "brief" : "message";

  const subject = kind === "quote" && ref
    ? `We have your quotation request ${ref} — Bulan`
    : `We have your ${what} — Bulan`;

  const lines = [
    `Thank you for your ${what}. This is an automatic receipt so you know it reached us.`,
    kind === "quote"
      ? "An engineer will review your selections and reply personally within one business day, to confirm scope or answer anything the pro-forma leaves open."
      : "An engineer will read it and reply personally within one business day. That reply comes from a person, not a sequence.",
    "If anything changes in the meantime, reply to this email and it reaches the same team.",
  ];

  const body = `
${badge(kind)}
<h1 style="margin:14px 0 18px;font:700 22px/1.3 ${FONT};color:${C.text};letter-spacing:-.02em;">Hi ${esc(name)},</h1>
${lines.map((l) => `<p style="margin:0 0 14px;font:15px/1.65 ${FONT};color:${C.text2};">${esc(l)}</p>`).join("")}
${ref ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 18px;"><tr><td style="background:${C.panel};border:1px solid ${C.line};border-radius:8px;padding:12px 16px;font:13px/1.4 ${FONT};color:${C.muted};">Your reference<br><strong style="font:600 16px/1.5 ${MONO};color:${C.text};">${esc(ref)}</strong></td></tr></table>` : ""}
<p style="margin:6px 0 0;font:15px/1.65 ${FONT};color:${C.text};">— The Bulan team</p>`;

  const footer = `You are receiving this because this address was entered on the ${esc(KIND[kind].form)} at ${esc(site)}.<br>We do not add you to any mailing list. If this was not you, ignore this email.`;

  const text = [`Hi ${name},`, "", ...lines.flatMap((l) => [l, ""]), ref ? `Your reference: ${ref}\n` : "", "— The Bulan team", "",
    `You are receiving this because this address was entered on the ${KIND[kind].form} at ${site}. If this was not you, ignore this email.`]
    .join("\n");

  return {
    subject,
    text,
    html: shell({ preheader: `Receipt for your ${what}. A person will reply within one business day.`, header: "Receipt", body, footer }),
  };
}

module.exports = { KINDS, cleanSummary, lead, receipt, esc, oneLine, money };
