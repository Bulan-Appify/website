/* Reads .env from the project root into process.env, for local use.
 *
 * No dotenv dependency: the format is simple enough to parse here,
 * and package.json stays at the single dependency Netlify installs.
 * Values already set in the real environment win over the file.
 */
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", ".env");

function loadEnv() {
  if (!fs.existsSync(FILE)) return false;
  for (const raw of fs.readFileSync(FILE, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    const quoted = /^(["']).*\1$/.test(val);
    if (quoted) val = val.slice(1, -1);
    else val = val.replace(/\s+#.*$/, "");   // allow trailing comments on unquoted values
    if (process.env[key] === undefined) process.env[key] = val;
  }
  return true;
}

module.exports = { loadEnv, FILE };
