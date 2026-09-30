/* Local test server: the site plus the real mail function.
 *
 *   npm run dev            → http://localhost:8888
 *   npm run dev -- 3000    → pick another port
 *
 * Serves the static files and routes POST /.netlify/functions/contact
 * to netlify/functions/contact.js, exactly as Netlify does, with the
 * variables from .env. Real email is sent, so the forms can be tested
 * end to end without installing the Netlify CLI.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { loadEnv, FILE } = require("./load-env");

if (!loadEnv()) {
  console.error(`No .env found at ${FILE}\nCopy .env.example to .env and fill it in first.`);
  process.exit(1);
}
// The page is served from localhost, so an origin check meant for the
// live domain would reject every local send.
process.env.ALLOWED_ORIGIN = "";

const ROOT = path.join(__dirname, "..");
const PORT = Number(process.argv[2]) || 8888;
const { handler } = require("../netlify/functions/contact");

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "application/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".txt": "text/plain",
  ".xml": "application/xml", ".ico": "image/x-icon",
};

http.createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);

  if (url === "/.netlify/functions/contact") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const r = await handler({
      httpMethod: req.method,
      headers: Object.assign({ "x-nf-client-connection-ip": "127.0.0.1" }, req.headers),
      body,
    });
    console.log(`${req.method} ${url} → ${r.statusCode}${r.statusCode >= 400 ? "  " + r.body : ""}`);
    res.writeHead(r.statusCode, r.headers);
    return res.end(r.body);
  }

  let file = path.normalize(path.join(ROOT, url));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": TYPES[".html"] });
      return res.end(fs.readFileSync(path.join(ROOT, "404.html")));
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Bulan site with live mail on http://localhost:${PORT}`);
  console.log(`Leads go to ${process.env.MAIL_TO || "(MAIL_TO not set)"}. Ctrl+C to stop.`);
});
