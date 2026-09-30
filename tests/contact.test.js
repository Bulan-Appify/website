/* Tests for netlify/functions/contact.js.
 *
 *   npm test
 *
 * Runs the real handler against a throwaway SMTP server on localhost, so
 * validation, header safety, escaping and composition are exercised for
 * real. No credentials and no network: nothing leaves the machine.
 *
 * The "Mail endpoint is not configured" line near the end is expected —
 * it is the last case deliberately removing the password to prove a
 * misconfiguration returns 500 rather than crashing.
 */
const net = require("net");
const path = require("path");

const FN = path.join(__dirname, "..", "netlify", "functions", "contact.js");
const PORT = 2599;
let captured = [];

// Minimal SMTP server: enough of the conversation for nodemailer to finish.
const server = net.createServer((sock) => {
  let buf = "", inData = false, msg = "";
  sock.write("220 localhost ESMTP test\r\n");
  sock.on("data", (chunk) => {
    buf += chunk.toString();
    let i;
    while ((i = buf.indexOf("\r\n")) >= 0) {
      const line = buf.slice(0, i); buf = buf.slice(i + 2);
      if (inData) {
        if (line === ".") { inData = false; captured.push(msg); msg = ""; sock.write("250 OK queued\r\n"); }
        else msg += line + "\n";
        continue;
      }
      const cmd = line.toUpperCase();
      if (cmd.startsWith("EHLO") || cmd.startsWith("HELO")) sock.write("250-localhost\r\n250 AUTH PLAIN LOGIN\r\n");
      else if (cmd.startsWith("AUTH")) sock.write("235 Authentication successful\r\n");
      else if (cmd.startsWith("MAIL FROM") || cmd.startsWith("RCPT TO")) sock.write("250 OK\r\n");
      else if (cmd === "DATA") { inData = true; sock.write("354 End data with <CR><LF>.<CR><LF>\r\n"); }
      else if (cmd === "QUIT") { sock.write("221 Bye\r\n"); sock.end(); }
      else sock.write("250 OK\r\n");
    }
  });
  sock.on("error", () => {});
});

let ipSeq = 0;
function reload() { delete require.cache[require.resolve(FN)]; }

function call(body, headers = {}) {
  const { handler } = require(FN);
  return handler({
    httpMethod: "POST",
    headers: Object.assign({ "x-nf-client-connection-ip": "203.0.113." + (++ipSeq) }, headers),
    body: JSON.stringify(body),
  });
}

const LF = String.fromCharCode(10);
const CR = String.fromCharCode(13);

// Quoted-printable: undo soft line breaks, then the =XX escapes.
// Done with split/join so no newline ever has to live inside a regex.
function unqp(t) {
  return t.split("=" + CR + LF).join("")
          .split("=" + LF).join("")
          .replace(/=([0-9A-Fa-f]{2})/g, function (_, h) {
            return String.fromCharCode(parseInt(h, 16));
          });
}

function split(raw) {
  // Select the text/html part by name. Splitting on the first
  // quoted-printable marker picks the plain-text part whenever a field
  // holds a non-ASCII character, which silently tests the wrong body.
  var i = raw.indexOf("Content-Type: text/html");
  var part = i < 0 ? "" : raw.slice(i);
  var b = part.indexOf(LF + LF);
  return {
    headers: raw.slice(0, raw.indexOf(LF + LF)),
    html: unqp(b < 0 ? "" : part.slice(b)),
  };
}

// Subject folds across continuation lines, so walk them rather than
// trying to express the fold in a pattern.
function decodeSubject(h) {
  var out = "", on = false;
  h.split(LF).forEach(function (line) {
    if (/^Subject:/i.test(line)) { on = true; out += line.replace(/^Subject:/i, ""); return; }
    if (!on) return;
    if (/^[ \t]/.test(line)) out += line; else on = false;
  });
  // RFC 2047: whitespace between adjacent encoded-words is dropped.
  out = out.replace(/\?=\s+=\?/g, "?==?");
  return out.replace(/=\?UTF-8\?Q\?(.*?)\?=/gi, function (_, e) {
    return e.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, function (__, x) {
      return String.fromCharCode(parseInt(x, 16));
    });
  }).replace(/\s+/g, " ").trim();
}

const VALID = {
  name: "Thabo Mokoena", company: "Meridian Freight", email: "t@meridian.co.za",
  phone: "+27 82 555 0100", country: "South Africa",
  services: ["Software development", "Cyber security"],
  budget: "R250 000 – R1m", timeline: "Within a month",
  message: "We need the driver app rebuilt before peak season.",
  consent: true,
};

(async () => {
  Object.assign(process.env, {
    SMTP_HOST: "127.0.0.1", SMTP_PORT: String(PORT),
    SMTP_USER: "hello@bulan.co.za", SMTP_PASS: "test-pass",
    MAIL_FROM: "Bulan website <hello@bulan.co.za>", MAIL_TO: "hello@bulan.co.za",
    MAIL_ACK: "false", ALLOWED_ORIGIN: "",
  });

  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  let failures = 0;
  const pass = (n, c) => { if (!c) failures++; console.log((c ? "  PASS  " : "  FAIL  ") + n); };

  // --- validation -------------------------------------------------
  let r = await call({ name: "x", consent: true });
  pass("missing email rejected (400)", r.statusCode === 400);

  r = await call({ name: "x", email: "not-an-email", consent: true });
  pass("bad email rejected (400)", r.statusCode === 400);

  r = await call({ name: "x", email: "a@b.co", consent: false });
  pass("missing consent rejected (400)", r.statusCode === 400);

  r = await call({ _gotcha: "bot", name: "x", email: "a@b.co", consent: true });
  pass("honeypot answers 200 and sends nothing", r.statusCode === 200 && captured.length === 0);

  r = await (async () => {
    delete require.cache[require.resolve(FN)];
    return require(FN).handler({ httpMethod: "GET", headers: {}, body: "" });
  })();
  pass("GET rejected (405)", r.statusCode === 405);

  // --- origin -------------------------------------------------------
  process.env.ALLOWED_ORIGIN = "https://www.bulan.co.za"; reload();
  r = await call(VALID, { origin: "https://evil.example" });
  pass("cross-origin POST rejected (403)", r.statusCode === 403);
  process.env.ALLOWED_ORIGIN = "https://bulan.co.za, https://www.bulan.co.za"; reload();
  captured = [];
  r = await call(VALID, { origin: "https://bulan.co.za" });
  pass("any origin in a comma-separated list accepted", r.statusCode === 200);
  process.env.ALLOWED_ORIGIN = ""; reload();

  // --- AWS event shapes ---------------------------------------------
  // Lambda Function URLs and API Gateway HTTP APIs send the v2 shape:
  // method under requestContext.http, and a body that may be base64.
  captured = [];
  r = await require(FN).handler({
    requestContext: { http: { method: "POST", sourceIp: "192.0.2.44" } },
    headers: { "content-type": "application/json" },
    isBase64Encoded: true,
    body: Buffer.from(JSON.stringify(VALID)).toString("base64"),
  });
  pass("AWS v2 event (base64 body) accepted and sent", r.statusCode === 200 && captured.length === 1);
  pass("AWS v2 source IP recorded", (captured[0] || "").includes("192.0.2.44"));

  r = await require(FN).handler({ requestContext: { http: { method: "GET" } }, headers: {} });
  pass("AWS v2 GET rejected (405)", r.statusCode === 405);

  // --- the happy path -------------------------------------------------
  captured = [];
  r = await call(VALID);
  pass("valid enquiry accepted (200)", r.statusCode === 200);
  pass("exactly one mail sent", captured.length === 1);

  const parts = split(captured[0] || "");
  pass("From is our own domain", /From:.*hello@bulan\.co\.za/.test(parts.headers));
  pass("Reply-To is the visitor", /Reply-To:.*t@meridian\.co\.za/.test(parts.headers));
  // Subject carries an em-dash, so it arrives RFC 2047 encoded.
  pass("subject names the company", decodeSubject(parts.headers).includes("Meridian Freight"));
  pass("services array flattened", parts.html.includes("Software development, Cyber security"));
  pass("brief included", parts.html.includes("peak season"));

  // One ticked checkbox arrives as a string, not an array.
  captured = [];
  r = await call(Object.assign({}, VALID, { services: "Cyber security" }));
  const single = split(captured[0] || "");
  pass("single service (string) included", r.statusCode === 200 && single.html.includes("Cyber security"));

  // --- injection + escaping -------------------------------------------
  captured = [];
  await call(Object.assign({}, VALID, {
    name: "Evil\r\nBcc: attacker@evil.example",
    message: "<script>alert(1)</script> & \"quoted\"",
  }));
  const evil = split(captured[0] || "");
  pass("no injected Bcc header", !/^Bcc:/mi.test(evil.headers));
  pass("only our own To header", (evil.headers.match(/^To:/gmi) || []).length === 1);
  pass("script tag escaped in HTML body", evil.html.includes("&lt;script&gt;") && !/<script>/.test(evil.html));
  pass("newline in name collapsed, not rendered as two lines", !evil.html.includes("Evil" + LF));

  // --- throttle --------------------------------------------------------
  const ip = { "x-nf-client-connection-ip": "198.51.100.7" };
  await call(VALID, ip);
  r = await call(VALID, ip);
  pass("rapid repeat from one IP throttled (429)", r.statusCode === 429);

  // --- receipt (MAIL_ACK) ----------------------------------------------
  process.env.MAIL_ACK = "true"; reload();
  captured = [];
  r = await call(Object.assign({}, VALID, { kind: "quote", reference: "BLN-Q-1", quote: "TOTAL: R 1" }));
  const receipt = split(captured[1] || "");
  pass("quote with MAIL_ACK sends lead and receipt", r.statusCode === 200 && captured.length === 2);
  pass("receipt goes to the visitor", /^To:.*t@meridian\.co\.za/mi.test(receipt.headers));
  pass("receipt names the quotation", decodeSubject(receipt.headers).includes("BLN-Q-1"));
  pass("receipt greets by first name", (captured[1] || "").includes("Hi Thabo,"));
  process.env.MAIL_ACK = "false"; reload();

  // --- misconfiguration -------------------------------------------------
  const keep = process.env.SMTP_PASS; delete process.env.SMTP_PASS; reload();
  r = await call(VALID);
  pass("missing credentials surface as 500, not a crash", r.statusCode === 500);
  process.env.SMTP_PASS = keep; reload();

  server.close();
  console.log(failures ? "\n" + failures + " CHECK(S) FAILED" : "\nall checks passed");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
