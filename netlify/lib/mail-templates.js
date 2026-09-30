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

const badge = (k, label = KIND[k].label) =>
  `<span style="display:inline-block;padding:5px 10px;border-radius:999px;background:${KIND[k].tintBg};color:${KIND[k].tintFg};font:600 11px/1 ${MONO};letter-spacing:.12em;text-transform:uppercase;">${esc(label)}</span>`;

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

/* --- Emails to the visitor ------------------------------------
   Anyone can type any address into a form, so these go to people who
   may never have visited the site. They carry only what Bulan controls:
     • options picked from the form's own lists, checked against them,
     • quotation lines recalculated on the server from pricing.js,
     • a name and company, trimmed short and with anything that looks
       like a link removed.
   The free-text message is never echoed. That keeps the form useless as
   a way to send someone else's words through Bulan's mail server. */
const REF_RE = /^BLN-\d{4}-\d{4}$/;

// The option lists on contact.html. Anything else is dropped from the copy.
const BRIEF_OPTIONS = {
  services: ["Software development", "Software testing", "Cyber security", "AI & automation", "Not sure yet", "Live security incident"],
  budget: ["Under R50 000", "R50 000 – R250 000", "R250 000 – R1m", "Over R1m", "Monthly retainer", "Need help sizing it"],
  timeline: ["Immediately / urgent", "Within a month", "1–3 months", "Later this year", "Exploring only"],
  country: ["South Africa", "Rest of Africa", "United Kingdom", "Europe", "United States / Canada", "Middle East", "Asia-Pacific", "Other"],
};

const LINKISH = /(https?:\/\/\S*|www\.\S*|\b[\w-]+(\.[\w-]+)*\.(com|net|org|io|co|za|info|biz|xyz|top|ru|me|app|site|online|link|click)\b\S*)/gi;
const safeText = (s, max) => oneLine(s).replace(LINKISH, "").replace(/[<>]/g, "").replace(/\s{2,}/g, " ").trim().slice(0, max);

// Config values that are still placeholders (TODO, 2026/XXXXXX/07) stay off client email.
const real = (v) => (typeof v === "string" && v.trim() && !/TODO|X{4,}/.test(v) ? v.trim() : "");

function briefChoices(f) {
  const pick = (list, v) => (list.includes(v) ? v : "");
  const services = (f.services || "").split(", ").filter((x) => BRIEF_OPTIONS.services.includes(x));
  return [
    services.length && ["What you need", services.join(", ")],
    pick(BRIEF_OPTIONS.budget, f.budget) && ["Budget", f.budget],
    pick(BRIEF_OPTIONS.timeline, f.timeline) && ["Start", f.timeline],
    pick(BRIEF_OPTIONS.country, f.country) && ["Based in", f.country],
  ].filter(Boolean);
}

const para = (t) => `<p style="margin:0 0 14px;font:15px/1.65 ${FONT};color:${C.text2};">${esc(t)}</p>`;
const visitorFooter = (kind, site) =>
  `You are receiving this because this address was entered on the ${esc(KIND[kind].form)} at ${esc(site)}.<br>We do not add you to any mailing list. If this was not you, ignore this email.`;

function receipt({ kind, f, site }) {
  const name = safeText(firstName(f.name), 40) || "there";
  const what = kind === "brief" ? "brief" : "message";
  const choices = kind === "brief" ? briefChoices(f) : [];

  const lines = [
    `Thank you for your ${what}. This is an automatic confirmation so you know it reached us.`,
    "An engineer will read it and reply personally within one business day. That reply comes from a person, not a sequence.",
    "If anything changes in the meantime, reply to this email and it reaches the same team.",
  ];

  const body = `
${badge(kind)}
<h1 style="margin:14px 0 18px;font:700 22px/1.3 ${FONT};color:${C.text};letter-spacing:-.02em;">Hi ${esc(name)},</h1>
${lines.map(para).join("")}
${choices.length ? sectionTitle("What you sent us") + detailsTable(choices.map(([k, v]) => [k, esc(v)])) +
  `<p style="margin:10px 0 0;font:13px/1.5 ${FONT};color:${C.muted};">Your message itself is with the team. For your privacy we do not repeat it by email.</p>` : ""}
<p style="margin:22px 0 0;font:15px/1.65 ${FONT};color:${C.text};">— The Bulan team</p>`;

  const text = [`Hi ${name},`, "", ...lines.flatMap((l) => [l, ""]),
    ...(choices.length ? ["What you sent us:", ...choices.map(([k, v]) => `  ${k}: ${v}`), ""] : []),
    "— The Bulan team", "", `You are receiving this because this address was entered on the ${KIND[kind].form} at ${site}. If this was not you, ignore this email.`]
    .join("\n");

  return {
    subject: `We have your ${what} — Bulan`,
    text,
    html: shell({ preheader: `Confirmation of your ${what}. A person will reply within one business day.`, header: "Confirmation", body, footer: visitorFooter(kind, site) }),
  };
}

/* --- The quotation: the full pro-forma, emailed to the visitor ---------
   q is pricing.compute() run on the server; cfg is assets/js/config.js. */
function quotation({ f, q, reference, cfg, site, issued = new Date() }) {
  const name = safeText(firstName(f.name), 40) || "there";
  const company = safeText(f.company, 80);
  const person = safeText(f.name, 60);
  const days = Number(cfg.quoteValidDays) || 30;
  const fmt = (d) => d.toLocaleDateString("en-ZA", { timeZone: "Africa/Johannesburg", day: "2-digit", month: "short", year: "numeric" });
  const expires = new Date(issued.getTime() + days * 86400000);
  const vatRate = Math.round((cfg.vatRate || 0.15) * 100);
  const a = cfg.address || {};
  const address = [a.line1, a.suburb, a.city, a.code, a.country].map(real).filter(Boolean).join(", ");
  const contact = [real(cfg.salesEmail) || real(cfg.email), real(cfg.phone) && !/^\+27 00/.test(cfg.phone) ? cfg.phone : ""].filter(Boolean).join(" · ");
  const bank = cfg.bank && (real(cfg.bank.accountNo) || real(cfg.bank.name)) ? cfg.bank : null;
  const bankRows = bank ? [["Bank", bank.name], ["Account name", bank.accountName], ["Account number", bank.accountNo],
    ["Branch code", bank.branchCode], ["SWIFT / BIC", bank.swift], ["Reference", reference]].filter(([, v]) => real(v)) : [];

  const sum = {
    lines: q.lines, adjustments: q.adjustments, total: q.total, net: q.net, vat: q.vat,
    vatCharged: !!cfg.chargeVat, timeline: q.timeline && q.timeline.name, months: q.months,
    care: q.care, hasRecurring: q.monthly > 0,
  };

  const metaRow = (k, v) => `<tr><td style="padding:3px 14px 3px 0;color:${C.muted};">${esc(k)}</td><td style="padding:3px 0;font-weight:600;color:${C.text};">${esc(v)}</td></tr>`;

  const body = `
${badge("quote", "Pro-forma quotation")}
<h1 style="margin:14px 0 6px;font:700 23px/1.25 ${FONT};color:${C.text};letter-spacing:-.02em;">Your quotation from Bulan</h1>
<p style="margin:0 0 4px;font:15px/1.65 ${FONT};color:${C.text2};">Hi ${esc(name)}, here is the quotation you built on our website, as generated. An engineer will review it and reply personally within one business day.</p>
${quoteTotalPanel(sum, reference)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0;font:13px/1.5 ${FONT};">
<tr>
  <td valign="top" style="width:50%;padding-right:12px;">
    <p style="margin:0 0 6px;font:600 11px/1 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:${C.muted};">Prepared for</p>
    <p style="margin:0;color:${C.text};font-weight:600;">${esc(company || person || "—")}</p>
    ${company && person ? `<p style="margin:0;color:${C.text2};">${esc(person)}</p>` : ""}
    <p style="margin:0;color:${C.text2};">${esc(f.email)}</p>
  </td>
  <td valign="top" style="width:50%;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font:13px/1.5 ${FONT};">
      ${metaRow("Quotation no.", reference)}${metaRow("Date issued", fmt(issued))}${metaRow("Valid until", fmt(expires))}${metaRow("Currency", cfg.currency || "ZAR")}
    </table>
  </td>
</tr></table>
${sectionTitle("Quotation")}
${quoteLinesTable(sum)}
${sectionTitle("Payment terms")}
<ul style="margin:0;padding-left:18px;font:13.5px/1.6 ${FONT};color:${C.text2};">${(cfg.paymentTerms || []).map((t) => `<li style="margin:0 0 4px;">${esc(t)}</li>`).join("")}</ul>
${bankRows.length ? sectionTitle("Banking details") + detailsTable(bankRows.map(([k, v]) => [k, esc(v)])) : ""}
${sectionTitle("Important")}
<p style="margin:0 0 8px;font:12.5px/1.6 ${FONT};color:${C.muted};">This is an <strong>indicative pro-forma quotation</strong> generated from the Bulan website. It is <strong>not a tax invoice</strong> and does not create a contract or a payment obligation.</p>
<p style="margin:0 0 8px;font:12.5px/1.6 ${FONT};color:${C.muted};">Figures are starting estimates based on the scope you selected. Final pricing is confirmed in writing after a discovery conversation, once scope, integrations, data volumes and acceptance criteria are agreed. Prices exclude third-party licences, cloud hosting and travel unless stated.</p>
<p style="margin:0;font:12.5px/1.6 ${FONT};color:${C.muted};">Valid for ${days} days from the date of issue. Security testing is performed only under a signed authorisation and agreed rules of engagement.</p>
<p style="margin:26px 0 0;font:15px/1.65 ${FONT};color:${C.text};">Questions, or ready to go ahead? Reply to this email and quote <strong style="font-family:${MONO};">${esc(reference)}</strong>.</p>
<p style="margin:14px 0 0;font:15px/1.65 ${FONT};color:${C.text};">— The Bulan team</p>`;

  const company_lines = [real(cfg.legalName), real(cfg.regNumber) && `Reg. no. ${cfg.regNumber}`, real(cfg.vatNumber) && `VAT no. ${cfg.vatNumber}`, address, contact].filter(Boolean);
  const footer = `${company_lines.map(esc).join(" · ")}${company_lines.length ? "<br>" : ""}You are receiving this because this address was entered on the ${esc(KIND.quote.form)} at ${esc(site)}. If this was not you, ignore this email.`;

  const text = [
    `PRO-FORMA QUOTATION ${reference}`,
    `Prepared for: ${company || person}${company && person ? ` (${person})` : ""}`,
    `Date issued: ${fmt(issued)} · Valid until: ${fmt(expires)} · Currency: ${cfg.currency || "ZAR"}`,
    "",
    ...q.lines.map((l) => `  ${l.name} (${l.note}) — ${money(l.amount)}`),
    ...q.adjustments.map((x) => `  ${x.name} — ${money(x.amount)}`),
    "",
    cfg.chargeVat && `  Subtotal: ${money(q.net)}\n  VAT @ ${vatRate}%: ${money(q.vat)}`,
    `  TOTAL (${cfg.chargeVat ? "incl." : "excl."} VAT): ${money(q.total)}`,
    "",
    "Payment terms:", ...(cfg.paymentTerms || []).map((t) => `  - ${t}`),
    "",
    "Indicative pro-forma only. Not a tax invoice and not a contract.",
    `Questions, or ready to go ahead? Reply to this email and quote ${reference}.`,
    "", "— The Bulan team",
  ].filter((l) => l !== false).join("\n");

  return {
    subject: `Your Bulan quotation ${reference} — ${money(q.total)}`,
    text,
    html: shell({ preheader: `Pro-forma quotation ${reference}: ${money(q.total)} ${cfg.chargeVat ? "incl." : "excl."} VAT. Valid ${days} days.`, header: "Quotation", body, footer }),
  };
}

module.exports = { KINDS, REF_RE, lead, receipt, quotation, esc, oneLine, money };
