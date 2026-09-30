# Bulan — website

A fast, dependency-free marketing site for a South African software, testing, cyber
security and AI automation firm. No build step, no npm, no framework. Plain HTML, one
stylesheet set and three small scripts.

**Positioning:** *Build it. Prove it. Defend it. Scale it.* — four disciplines, one
accountable team. The trust argument is transparency (published prices, published
method, code ownership, no lock-in) rather than a logo wall we have not earned yet.

---

## 1. Look at it locally

**Double-click `index.html`.** Every internal link is relative (`assets/css/main.css`,
`../index.html`), so the site renders correctly straight off disk — no server needed.

A local server is still better for realistic testing, because `file://` does not send the
`_headers` security policy and some browsers restrict things like the print dialog:

```powershell
.\serve.ps1                 # opens http://localhost:8000
.\serve.ps1 -Port 3000      # or pick your own port
```

`npx serve .` or the VS Code "Live Server" extension work just as well.

> **Why relative and not root-relative?** A path like `/assets/css/main.css` only resolves
> when a web server is serving the folder as a site root. Opened from disk it points at
> `C:\assets\…` and you get unstyled HTML. Relative paths work from disk, from a server,
> and from a subdirectory (GitHub Pages project sites) — so keep them relative.
>
> The `<link rel="canonical">`, `og:url` and JSON-LD entries are deliberately still
> absolute `https://www.bulan.co.za/...` URLs. Search engines need those to be absolute.

---

## 2. Before you go live — the checklist

Every placeholder in the site is underlined in **amber** on screen (the `.tbc` class), so
you can spot them by browsing. Work through this list and the amber disappears.

### 2.1 One file does most of it

Open **`assets/js/config.js`**. It is the single source of truth for business details and
it feeds the quote builder, the pro-forma document and the forms. Replace every `TODO`.

| Field | What to put |
|---|---|
| `legalName`, `regNumber` | Exactly as registered with CIPC |
| `vatNumber`, `chargeVat` | Leave `chargeVat: false` until you are VAT registered. Registration is compulsory above R1m taxable turnover in 12 months. |
| `bbbee` | Your actual level. Under R10m turnover you are an EME and a sworn affidavit is enough. |
| `infoOfficer` | The person you register with the Information Regulator |
| `email`, `salesEmail`, `securityEmail`, `privacyEmail`, `phone`, `phoneHref` | Real addresses. `phoneHref` is digits only with country code. |
| `address` | Registered office |
| `social.linkedin` | Create the company page first — it is the highest-value trust link you have |
| `bank` | Appears on the pro-forma quotation. Leave blank and that block is omitted. |
| `formMode`, `formEndpoint` | See §3 below |

### 2.2 Things config.js cannot reach

These are hard-coded in HTML so that search engines and people without JavaScript still
see them. Find and replace across the project:

```powershell
# from the website folder
Select-String -Path *.html,services\*.html,legal\*.html,insights\*.html -Pattern "bulan.co.za"
```

- [ ] **Domain** — `www.bulan.co.za` appears in every `<link rel="canonical">`, every
      `og:url`, all the JSON-LD blocks, `sitemap.xml`, `robots.txt` and
      `.well-known/security.txt`. Replace it everywhere with your real domain once the
      company name is confirmed.
- [ ] **Footer contact block** — `index.html` and every generated page carry
      `hello@bulan.co.za` and `+27 00 000 0000` in the footer. Replace across all files.
- [ ] **JSON-LD** — `email`, `telephone` and `address` in the structured data at the top
      of `index.html` and `contact.html`.
- [ ] **Founders** — `about.html`, the section marked with a big comment block. Real
      names, real roles, real background, real LinkedIn URLs. This single section does
      more for credibility than anything else on the site.
- [ ] **Legal pages** — `legal/privacy.html`, `legal/paia.html`, `legal/terms.html`,
      `legal/cookies.html`, `legal/vulnerability-disclosure.html`. Fill in the dates,
      addresses and supplier names, then **have a South African attorney review them**.
      They are carefully drafted and accurate to how this site actually behaves, but they
      are not legal advice and they are not a substitute for your own MSA.
- [ ] **`.well-known/security.txt`** — set `Expires` to within 12 months and diarise a
      reminder. An expired security.txt is worse than none.

### 2.3 Turning off the staging block

The site currently tells search engines to stay away, because the placeholders above
would otherwise get indexed against the Bulan name. Two things do that, and both must be
reversed **on launch day** — not before, or Google will cache the placeholder version.

1. **`robots.txt`** — delete the `STAGING` block and uncomment the `LIVE` block.
2. **The `noindex` tag on all 21 pages.** Each page carries this just below its canonical
   link:

   ```html
   <!-- STAGING ONLY — delete these two lines before launch. See README §2.4. -->
   <meta name="robots" content="noindex, nofollow">
   ```

   Remove it everywhere in one go:

   ```powershell
   # from the website folder
   Get-ChildItem -Recurse -Filter *.html | ForEach-Object {
     (Get-Content $_.FullName -Raw) `
       -replace '(?m)^\s*<!-- STAGING ONLY[^\r\n]*\r?\n', '' `
       -replace '(?m)^\s*<meta name="robots" content="noindex, nofollow">\r?\n', '' |
       Set-Content $_.FullName -NoNewline -Encoding utf8
   }
   ```

   Then confirm nothing is left: `Select-String -Path *.html,*\*.html -Pattern noindex`
   should return only `404.html`, which is *supposed* to be `noindex`. Re-add
   `<meta name="robots" content="noindex, follow">` to `404.html` afterwards.

3. Verify on the live site: `https://yourdomain/robots.txt` should say `Allow: /`, and
   view-source on the homepage should have no `noindex`.

### 2.4 Registrations worth doing in week one

- [ ] Register your **Information Officer** with the Information Regulator
      (<https://inforegulator.org.za>) — free, online, about 20 minutes.
- [ ] Publish the **PAIA manual** (already written, at `/legal/paia.html`).
- [ ] Get the **B-BBEE EME affidavit** sworn. Procurement teams ask for it constantly.
- [ ] Register the **domain** and set up email on it. A `@gmail.com` address on a
      proposal costs you work.
- [ ] Create the **LinkedIn company page** and link it from `config.js`.

---

## 3. Email — the contact form and quote builder

Both forms POST JSON to a Netlify function that sends mail with **nodemailer**.
Nothing about this runs on GitHub Pages: Pages serves static files only and cannot
execute a function. **The site must be on Netlify for email to work.**

```
netlify/functions/contact.js   the endpoint
netlify.toml                   tells Netlify where functions live
package.json                   exists only so Netlify installs nodemailer
.env.example                   documents the variables (holds no secrets)
```

### 3.1 Get an app password

Google will not accept your normal account password from a script.

1. The sending account needs **2-Step Verification** switched on.
2. Google Account → **Security** → **2-Step Verification** → **App passwords**.
3. Create one named "Bulan website" and copy the 16-character value.

### 3.2 Set the variables in Netlify

**Site configuration → Environment variables.** Never in a file, never in git.

| Variable | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | the sending mailbox, e.g. `hello@bulan.co.za` |
| `SMTP_PASS` | the 16-character app password |
| `MAIL_FROM` | `"Bulan website <hello@bulan.co.za>"` |
| `MAIL_TO` | where leads should land |
| `ALLOWED_ORIGIN` | `https://www.bulan.co.za` once the domain is live. Comma-separate several (`https://bulan.co.za,https://www.bulan.co.za`) if both resolve. |
| `MAIL_ACK` | `true` (the default). `false` stops the visitor receipt. |

> **`MAIL_FROM` must be your own domain.** Sending "from" the visitor's address
> fails SPF and DKIM and lands the mail in spam. The function puts the visitor in
> `Reply-To`, so hitting reply in your inbox still reaches them.

> **The receipt is on.** The visitor gets an instant email saying their brief or
> quotation request arrived and that a person will reply within one business day.
> The site copy says the same, so the receipt does not contradict the "human reply"
> promise. Because anyone can type any address into a form, the receipt repeats
> only the first name and a validated `BLN-YYYY-NNNN` reference — no message,
> company or figures — so it is useless for relaying spam.
>
> **One template per form.** `netlify/lib/mail-templates.js` builds the emails.
> The contact form sends `kind: "brief"` (from `data-kind` on the `<form>`), the
> quote builder sends `kind: "quote"` with its figures, and anything else is an
> `enquiry`. A new form gets its own template by adding a `data-kind` and an entry
> to `KIND` in that file. A brief that ticks *Live security incident* is marked
> URGENT in the subject.

### 3.3 Test it locally

Needs Node 18 or later. Nothing else to install.

```powershell
npm install
copy .env.example .env      # then change the lines marked ◄ CHANGE
npm run mail:check          # logs in to Gmail and sends a test brief + receipt
npm run dev                 # the site with live mail on http://localhost:8888
```

`npm run mail:check` is the first thing to run when a form says it sent but no
email arrived. It shows the settings it read (password masked), logs in, and
explains a refusal in plain words. `npm run mail:check -- you@example.com` also
sends the receipt to that address.

`npm run dev` ignores `ALLOWED_ORIGIN`, since the page is on localhost. To use
the Netlify CLI instead, `npm run dev:netlify`.

### 3.3a No email on Netlify? Check in this order

1. **Did the form show an error?** "That did not send" means the function failed:
   open **Logs → Functions → contact**. No error means it sent; check Spam.
2. **Redeploy after changing variables.** They only apply to the next deploy:
   **Deploys → Trigger deploy → Deploy site**.
3. **`ALLOWED_ORIGIN` must be empty** until the real domain is live. Set to
   `https://www.bulan.co.za`, it refuses every post from a `*.netlify.app` link
   (the log says "Rejected a form post from …").
4. **Scopes.** Each variable must include the **Functions** scope and the deploy
   context you are testing (Production, or Deploy Previews).
5. **`SMTP_PASS` is an app password**, and `MAIL_FROM` uses the same address as
   `SMTP_USER`. Run `npm run mail:check` locally with the same values to confirm.

The log shows `brief lead sent to …` and `receipt sent to …` for every
successful send.

### 3.4 What the function does

- Rejects anything that is not a POST, and any cross-origin POST once
  `ALLOWED_ORIGIN` is set
- Silently absorbs the honeypot field, answering 200 so bots do not retry
- Throttles repeat sends from one IP (a speed bump on a warm container, not a
  security control — Netlify's platform limits do the real work)
- Caps every field length, so nobody can paste a novel to burn your send quota
- Strips CR/LF from anything reaching a mail header, blocking header injection
- Escapes every value before it enters the HTML body
- Returns a real error to the page on failure, so the form shows "that did not
  send" with your address instead of pretending it worked

### 3.5 If you ever need to switch it off

Set `formMode: "mailto"` in `assets/js/config.js`. The forms revert to opening the
visitor's own mail client and need no server at all. Useful if the function breaks
and you want the site to keep collecting enquiries while you fix it.

## 4. Deploying

The site is static files. Anywhere that serves static files will work.

### Netlify (simplest — the mail function runs with no extra setup)
Connect the git repository. `netlify.toml` already declares the publish directory
and the functions folder, so there is nothing to configure in the UI except the
environment variables in section 3.2. `_headers` and `_redirects` are picked up
automatically, which is also why Netlify beats GitHub Pages here — Pages ignores
both, so you would lose the CSP, HSTS and the clean URLs.

### AWS (S3 + CloudFront + Lambda)
The mail function is portable: `netlify/functions/contact.js` accepts both the
Netlify / API Gateway REST event and the Lambda Function URL / HTTP API (v2) event,
and `npm test` covers both. Moving to AWS is configuration, not a rewrite:

1. **Static files → S3**, served through **CloudFront** (Origin Access Control, bucket
   not public). Upload everything except `netlify/`, `tests/`, `node_modules/` and the
   repo files listed at the top of `_redirects`.
2. **Function → Lambda** (Node 18+). Zip the `netlify/` folder (the function
   requires `netlify/lib/mail-templates.js`) with `node_modules/`, handler
   `netlify/functions/contact.handler`. Put it behind an API Gateway HTTP API
   or a Function URL.
3. **Same origin.** Add a CloudFront behaviour `/api/contact` → the Lambda origin,
   and set `formEndpoint: "/api/contact"` in `assets/js/config.js`. The form then
   posts to your own domain, so the CSP (`connect-src 'self'`) and CORS need no change.
4. **Variables** from §3.2 go on the Lambda (or in Secrets Manager). Nothing in git.
5. **Mail:** Gmail SMTP keeps working, or switch to **Amazon SES** by changing only
   `SMTP_HOST` (`email-smtp.af-south-1.amazonaws.com`), `SMTP_USER` and `SMTP_PASS`
   (SES SMTP credentials). Verify the domain in SES and leave the sandbox first.
6. **`_headers` and `_redirects` are Netlify-only.** Recreate the headers as a
   CloudFront *response headers policy*, the clean URLs as a small CloudFront Function,
   and set the custom error response for 403/404 to `/404.html`.

### GitHub Pages
Serves the static pages fine, including from a project subdirectory
(`username.github.io/bulan/`) because the links are relative. But it **cannot run
the mail function**, and it ignores `_headers` and `_redirects`, so you also lose
the security headers and the tidy URLs. Use it to preview, not to launch.

### A South African host (Afrihost, Xneelo, HostAfrica)
Upload the folder contents to `public_html`. Keeps data resident in South Africa, which
is occasionally a procurement requirement. `_headers` does nothing on Apache — translate
it to `.htaccess`:

```apache
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "DENY"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self' mailto:; frame-ancestors 'none'; base-uri 'self'; object-src 'none'"
</IfModule>
ErrorDocument 404 /404.html
```

### After deploying, always
- [ ] Force HTTPS and redirect the apex domain to `www` (or the reverse — pick one and
      make the canonical tags match).
- [ ] Submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- [ ] Create a Google Business Profile — it matters a lot for "software company
      Johannesburg" style searches.
- [ ] Test the OG card at <https://www.opengraph.xyz> once the domain resolves.
- [ ] Run Lighthouse. It should score at or near 100 on Performance, Accessibility, Best
      Practices and SEO out of the box.

---

## 5. The quote builder

`/quote.html`, driven by `assets/js/quote.js`.

**All prices live in the `CATALOG` array at the top of that file.** Each line is:

```js
{ id: 'dev-web-s', name: 'Web application — compact', desc: '…', price: 185000 }
{ id: 'qa-embed',  name: 'Embedded QA engineer',      desc: '…', price: 92000, recurring: true }
```

`recurring: true` means "per month" and gets multiplied by the duration chosen in step 2.

Below the catalogue: `TIMELINES` (the ±% modifiers), `CARE` (the 15% care plan) and
`BUNDLE` (the 7% discount for three or more disciplines).

> **If you change a price in `quote.js`, change it on the service page too.** The figures
> are deliberately duplicated in the HTML so they are indexable by search engines. They
> appear on the four `services/*.html` pages, `services.html`, and in the FAQ answers on
> `index.html`.

**The PDF.** There is no PDF library. "Download / print PDF" builds a properly typeset A4
document into a hidden container, adds `.print-doc` to `<body>`, and calls
`window.print()`. The visitor picks *Save as PDF* as the destination. This is more
reliable than any JS PDF generator, weighs nothing, and prints correctly. Styling is in
`assets/css/proforma.css`.

**The legal framing matters.** The generated document says clearly that it is an
indicative pro-forma, not a tax invoice, and that it creates no contract. Do not remove
that language — a "quote" that looks binding when you did not mean it to be is a real
commercial risk, and SARS has opinions about documents that resemble tax invoices.

---

## 6. Editing content

### Structure

```
index.html                 Homepage
services.html              Services overview
services/                  One page per discipline
approach.html              Delivery method, engagement models, pricing logic
industries.html            Eight sectors
about.html                 Story, founders (PLACEHOLDERS), values, careers
insights.html + insights/  Three long-form articles
contact.html               Enquiry form + vendor pack + response commitments
quote.html                 Quote builder → pro-forma
legal/                     Privacy/POPIA, PAIA, terms, cookies, disclosure
404.html
assets/css/main.css        Design system: tokens, layout, components
assets/css/forms.css       Forms, quote builder, articles, legal pages
assets/css/proforma.css    The printable quotation document
assets/js/config.js        ►► YOUR BUSINESS DETAILS ◄◄
assets/js/main.js          Nav, accordions, reveal, form handling
assets/js/quote.js         ►► YOUR PRICES ◄◄
```

### Changing the navigation or footer

There is no template engine, so the header and footer markup is repeated in all 21 pages.
To change a nav link everywhere at once:

```powershell
# PowerShell, from the website folder
Get-ChildItem -Recurse -Filter *.html |
  ForEach-Object {
    (Get-Content $_.FullName -Raw) -replace 'Old link text','New link text' |
      Set-Content $_.FullName -NoNewline -Encoding utf8
  }
```

Always commit before a bulk replace so you can undo it.

One caution: because links are relative, the *same* destination is written differently
depending on where the page sits. The homepage says `href="about.html"`; a page inside
`services/` or `legal/` says `href="../about.html"`. If you bulk-replace a URL, match on
the filename (`about.html`) rather than the whole path, or you will only fix half of them.

### Adding an insight article

Copy an existing file from `insights/`, change the content, then add it in three places:
the card grid on `insights.html`, the teaser row on `index.html`, and `sitemap.xml`.
Update the `Article` JSON-LD block in the `<head>` — headline, description, URL and both
dates.

### The design system

Everything is driven by CSS custom properties at the top of `main.css`. To reskin the
site, change the tokens rather than hunting through rules:

| Token | Current | Role |
|---|---|---|
| `--ink` | `#05070B` | Page background |
| `--surface` / `--surface-2` | `#0C111B` / `#111827` | Cards, panels |
| `--accent` | `#8AA9FF` | Moonlight blue — links, CTAs, eyebrows |
| `--signal` | `#5BE9B9` | Verification/trust cues only, used sparingly |
| `--text` / `--text-2` / `--muted` | | Three-level text hierarchy |

One accent colour, used consistently, is what makes it read as designed rather than
decorated. Resist adding a second.

### Fonts

Deliberately no web fonts — the stack uses Inter Tight / Segoe UI Variable / SF Pro if
present and falls back gracefully. That keeps the site instant, and it keeps the cookie
and POPIA story clean (Google Fonts transmits visitor IP addresses to Google). If you
want a distinctive typeface later, **self-host it**: put the `.woff2` files in
`assets/fonts/`, add an `@font-face` block to `main.css`, and add the family to `--sans`.
Do not add a Google Fonts `<link>` — it contradicts what `legal/cookies.html` promises.

---

## 7. Honesty rules for this site

These were deliberate decisions. Breaking them would undo the whole positioning.

1. **No fabricated proof.** No invented client logos, testimonials, case studies, project
   counts or years of experience. A new firm that fakes a track record gets caught, and
   in this industry being caught is terminal. Add real proof as you earn it.
2. **No implied certifications.** The "standards" section on the homepage lists
   frameworks the work is *measured against* — that is a factual statement about method.
   It is not a claim to hold ISO 27001 or any personal certification. If either founder
   earns OSCP, CISSP, ISTQB, AWS or Azure certifications, name them on `about.html`. Until
   then, say nothing.
3. **Prices stay published.** The entire trust argument depends on it.
4. **Commitments are contractual.** The one-day reply, the 30-day defect warranty, the
   100% code ownership, the 30-days-notice retainer — these are on the site as promises.
   Put them in your MSA and honour them, or take them off the site.
5. **Security testing wording stays.** "Authorised testing only", the rules-of-engagement
   language and the vulnerability disclosure policy protect you legally and signal
   competence. Do not soften them for marketing reasons.

---

## 8. Known gaps, in priority order

1. **Founder bios** on `about.html` — placeholders. Highest-impact fix on the site.
2. **No real proof yet.** After the first two or three engagements, add a case studies
   page. Even an anonymised one ("a JSE-listed retailer", with permission) is worth more
   than every adjective on the homepage.
3. **Forms are `mailto` until you configure a backend** (§3).
4. **The OG share image is the mark only.** It is clean and deliberate, but a version with
   the headline on it would earn more clicks from LinkedIn. Design one at 1200×630 and
   overwrite `assets/img/og.png`.
5. **No analytics.** Intentional — it keeps the cookie notice honest. If you add any, use
   a cookieless tool, name it in `legal/cookies.html`, and add its domain to `connect-src`
   in `_headers`.
6. **No blog CMS.** Articles are hand-written HTML. At about a dozen articles, revisit —
   Astro or Eleventy would let you write Markdown while still shipping static files.

---

## 9. Licence

© Bulan Technologies (Pty) Ltd. All rights reserved.
