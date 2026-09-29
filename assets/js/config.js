/* ============================================================
   BULAN — Single source of truth for business details.

   ►► EDIT THIS FILE BEFORE YOU GO LIVE. ◄◄
   Everything marked TODO is a placeholder. The quote builder,
   the pro-forma document and the forms all read from here.
   ============================================================ */

window.BULAN = {

  /* --- Identity ------------------------------------------ */
  legalName:   "Bulan Technologies (Pty) Ltd",   // TODO: confirm once registered with CIPC
  tradingName: "Bulan",
  tagline:     "Build it. Prove it. Defend it. Scale it.",

  /* --- Statutory details --------------------------------- */
  // TODO: replace every placeholder below with your real registered details.
  // Leave a value as an empty string ("") and it will simply be hidden.
  regNumber:   "2026/XXXXXX/07",     // CIPC company registration number
  vatNumber:   "",                   // Leave "" until you are VAT registered
  vatRate:     0.15,                 // 15% South African VAT
  chargeVat:   false,                // ► Set to true ONLY once you are VAT registered
  bbbee:       "Level 1 Contributor (EME sworn affidavit)", // TODO: confirm your level
  infoOfficer: "TODO: Full name of your registered Information Officer",

  /* --- Contact ------------------------------------------- */
  email:       "hello@bulan.co.za",        // TODO
  salesEmail:  "newbusiness@bulan.co.za",  // TODO
  securityEmail: "security@bulan.co.za",   // TODO (for vulnerability disclosure)
  privacyEmail:  "privacy@bulan.co.za",    // TODO (POPIA / data requests)
  phone:       "+27 00 000 0000",          // TODO
  phoneHref:   "+270000000000",            // TODO — digits only, with country code
  whatsapp:    "",                         // TODO — e.g. "27820000000", or leave "" to hide

  address: {
    line1:   "TODO: Street address",
    suburb:  "TODO: Suburb",
    city:    "Johannesburg",
    code:    "TODO",
    country: "South Africa"
  },

  hours: "Monday to Friday, 08:00 – 17:00 SAST (UTC+2)",

  social: {
    linkedin: "https://www.linkedin.com/company/bulan", // TODO
    github:   "",                                       // TODO or leave ""
    x:        ""                                        // TODO or leave ""
  },

  /* --- Banking (shown on the pro-forma quotation) --------- */
  // TODO: fill these in. Leave blank and the banking block is omitted.
  bank: {
    name:       "",   // e.g. "First National Bank"
    accountName:"",   // e.g. "Bulan Technologies (Pty) Ltd"
    accountNo:  "",
    branchCode: "",
    swift:      "",   // for international clients
    reference:  "Use your quotation number as the payment reference"
  },

  /* --- Commercial terms ---------------------------------- */
  quoteValidDays: 30,
  currency: "ZAR",
  currencySymbol: "R",
  paymentTerms: [
    "40% deposit on acceptance, balance on agreed milestones.",
    "Retainers are invoiced monthly in advance, 30 days' notice to cancel.",
    "Payment due within 14 days of invoice date unless otherwise agreed.",
    "All intellectual property transfers to the client on final payment."
  ],

  /* --- Form handling ------------------------------------- */
  // Where form submissions go.
  //  "endpoint" → POST JSON to formEndpoint. This is the live setup:
  //               a Netlify function running nodemailer. Credentials
  //               are environment variables on Netlify, never here.
  //  "mailto"   → fallback that opens the visitor's own mail client.
  //               Needs no server; use it if the function is down or
  //               while testing the site from disk.
  formMode: "endpoint",
  formEndpoint: "/.netlify/functions/contact",

  /* --- Analytics ----------------------------------------- */
  // Leave empty for none. A privacy-friendly, cookieless option keeps the
  // POPIA cookie story simple. See README.md.
  analytics: { provider: "", siteId: "" }
};
