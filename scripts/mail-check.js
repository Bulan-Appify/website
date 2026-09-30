/* Checks the mail settings and sends one test lead and one receipt.
 *
 *   npm run mail:check                    uses .env
 *   npm run mail:check -- you@example.com also sends the receipt there
 *
 * Use it when a form "works" but no email arrives. It logs in to the
 * SMTP server first and says in plain words what is wrong.
 */
const { loadEnv, FILE } = require("./load-env");

const hadFile = loadEnv();
process.env.ALLOWED_ORIGIN = "";

const REQUIRED = ["SMTP_USER", "SMTP_PASS", "MAIL_TO"];
const mask = (v) => (v ? v.slice(0, 2) + "…" + ` (${v.length} characters)` : "(not set)");

console.log(hadFile ? `Settings from ${FILE}` : "No .env file found; using the shell's environment.");
console.log(`  SMTP_HOST  ${process.env.SMTP_HOST || "smtp.gmail.com (default)"}`);
console.log(`  SMTP_PORT  ${process.env.SMTP_PORT || "587 (default)"}`);
console.log(`  SMTP_USER  ${process.env.SMTP_USER || "(not set)"}`);
console.log(`  SMTP_PASS  ${mask((process.env.SMTP_PASS || "").replace(/\s/g, ""))}`);
console.log(`  MAIL_FROM  ${process.env.MAIL_FROM || "(not set, defaults to SMTP_USER)"}`);
console.log(`  MAIL_TO    ${process.env.MAIL_TO || "(not set)"}`);
console.log(`  MAIL_ACK   ${process.env.MAIL_ACK || "true (default)"}\n`);

const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`✗ Missing: ${missing.join(", ")}. Add them to .env (see .env.example).`);
  process.exit(1);
}

const pass = process.env.SMTP_PASS.replace(/\s/g, "");
if (/gmail\.com$/i.test(process.env.SMTP_HOST || "smtp.gmail.com") && pass.length !== 16) {
  console.warn("! SMTP_PASS is not 16 characters. Gmail needs an app password (16 letters),");
  console.warn("  not your normal password. Google Account → Security → App passwords.\n");
}
const from = process.env.MAIL_FROM || "";
if (from && !from.toLowerCase().includes(process.env.SMTP_USER.toLowerCase())) {
  console.warn(`! MAIL_FROM (${from}) is not SMTP_USER. Gmail will rewrite or reject it.`);
  console.warn(`  Use: MAIL_FROM="Bulan website <${process.env.SMTP_USER}>"\n`);
}

const nodemailer = require("nodemailer");

function explain(err) {
  const m = (err && (err.response || err.message)) || String(err);
  if (/535|534|Username and Password not accepted|Invalid login|EAUTH/i.test(m))
    return "The login was refused. For Gmail: turn on 2-Step Verification, create an app password,\n  and put those 16 letters in SMTP_PASS. SMTP_USER must be the same Gmail address.";
  if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|ESOCKET|getaddrinfo/i.test(m))
    return "Could not reach the mail server. Check SMTP_HOST and SMTP_PORT (smtp.gmail.com, 587),\n  and that your network or firewall allows outgoing port 587.";
  if (/550|553|554/i.test(m))
    return "The server refused an address. Check MAIL_TO and MAIL_FROM are real addresses.";
  return "";
}

(async () => {
  const port = Number(process.env.SMTP_PORT) || 587;
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com", port, secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10_000,
  });
  try {
    await t.verify();
    console.log("✓ Logged in to the mail server.");
  } catch (err) {
    console.error("✗ Could not log in:", err.message);
    const why = explain(err); if (why) console.error("  " + why);
    process.exit(1);
  }

  // Send through the real handler, so this also proves the templates.
  const { handler } = require("../netlify/functions/contact");
  const visitor = process.argv[2] || process.env.MAIL_TO;
  const r = await handler({
    httpMethod: "POST",
    headers: { "x-nf-client-connection-ip": "127.0.0.1" },
    body: JSON.stringify({
      kind: "brief", name: "Test Visitor", company: "Mail check", email: visitor,
      services: "Not sure yet", consent: true,
      message: "This is a test brief sent by npm run mail:check. Nothing to action.",
    }),
  });
  if (r.statusCode !== 200) {
    console.error(`✗ The function answered ${r.statusCode}: ${r.body}`);
    process.exit(1);
  }
  console.log(`✓ Test brief sent to ${process.env.MAIL_TO}.`);
  if (process.env.MAIL_ACK !== "false") console.log(`✓ Receipt sent to ${visitor}, unless a "receipt failed" line appears above.`);
  console.log("\nNot in the inbox within a minute? Check Spam and the Promotions tab.");
})();
