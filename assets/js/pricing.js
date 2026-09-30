/* ============================================================
   BULAN — the price list and the pricing rules.

   ►► PRICES LIVE IN THE CATALOGUE BELOW. Edit freely. ◄◄

   One file, read by two places:
     • the quote builder in the browser (quote.html loads it before
       quote.js, and it becomes window.BULAN_PRICING), and
     • the mail function on the server (require()d by contact.js),
       which recalculates every quotation from the item ids so the
       figures emailed under the Bulan name are always Bulan's own.

   Every figure is an indicative starting price in ZAR, excluding
   VAT. Nothing here is a binding offer.
   ============================================================ */
(function (root) {
  'use strict';

  /* ========================================================
     1. CATALOGUE
     price     — indicative starting price, ZAR, excl. VAT
     recurring — true = per month (multiplied by engagement months)
     ======================================================== */
  var CATALOG = [
    {
      key: 'dev', label: 'Software Development', blurb: 'Design and build.',
      items: [
        { id: 'dev-discovery', name: 'Discovery & solution architecture', desc: 'Two-week paid discovery: requirements, architecture, risk register, costed delivery plan.', price: 45000 },
        { id: 'dev-design',    name: 'Product & UX/UI design',            desc: 'User flows, wireframes, high-fidelity UI and a reusable component library.', price: 58000 },
        { id: 'dev-web-s',     name: 'Web application — compact',         desc: 'Up to ~12 screens, one integration, single user role.', price: 185000 },
        { id: 'dev-web-m',     name: 'Web application — standard',        desc: 'Up to ~30 screens, multiple roles, payments or third-party integrations.', price: 420000 },
        { id: 'dev-web-l',     name: 'Web platform — complex',            desc: 'Multi-tenant, workflow engines, reporting, high-volume data.', price: 850000 },
        { id: 'dev-mobile',    name: 'Mobile app (iOS + Android)',        desc: 'Cross-platform build, store submission and release pipeline included.', price: 320000 },
        { id: 'dev-api',       name: 'API & integration layer',           desc: 'Documented REST/GraphQL APIs, third-party integrations, webhooks.', price: 95000 },
        { id: 'dev-legacy',    name: 'Legacy modernisation assessment',   desc: 'Audit of an existing system with a staged, costed modernisation roadmap.', price: 55000 },
        { id: 'dev-cloud',     name: 'Cloud setup, CI/CD & DevOps',       desc: 'Infrastructure-as-code, environments, automated pipelines, monitoring.', price: 65000 },
        { id: 'dev-squad',     name: 'Dedicated engineer (embedded)',     desc: 'One senior engineer inside your team, full-time.', price: 118000, recurring: true }
      ]
    },
    {
      key: 'qa', label: 'Software Testing & Quality', blurb: 'Prove it works.',
      items: [
        { id: 'qa-assess',   name: 'QA maturity assessment',            desc: 'Where your quality process leaks, and the cheapest three fixes.', price: 32000 },
        { id: 'qa-strategy', name: 'Test strategy & test plan',          desc: 'Risk-based strategy, coverage model, entry/exit criteria, tooling choice.', price: 28000 },
        { id: 'qa-manual',   name: 'Functional & exploratory test cycle',desc: 'One full cycle with documented defects, severity and evidence.', price: 24000 },
        { id: 'qa-autoframe',name: 'Test automation framework setup',    desc: 'Framework, CI integration, reporting dashboard, team handover.', price: 78000 },
        { id: 'qa-regress',  name: 'Automated regression suite',         desc: 'Roughly 50 automated end-to-end cases, maintained and CI-wired.', price: 46000 },
        { id: 'qa-perf',     name: 'Performance & load testing',         desc: 'Load model, soak and spike tests, bottleneck analysis, tuning advice.', price: 58000 },
        { id: 'qa-a11y',     name: 'Accessibility audit (WCAG 2.2 AA)',  desc: 'Automated plus manual assistive-technology testing and a remediation list.', price: 36000 },
        { id: 'qa-uat',      name: 'UAT design & business-user support', desc: 'UAT scripts, facilitation and defect triage with your business team.', price: 30000 },
        { id: 'qa-embed',    name: 'Embedded QA engineer',               desc: 'One quality engineer inside your delivery team, full-time.', price: 92000, recurring: true }
      ]
    },
    {
      key: 'sec', label: 'Cyber Security', blurb: 'Defend it.',
      items: [
        { id: 'sec-va',      name: 'External vulnerability assessment',  desc: 'Authenticated and unauthenticated scanning of your internet-facing estate.', price: 38000 },
        { id: 'sec-webpt',   name: 'Web application penetration test',   desc: 'OWASP ASVS-aligned manual test, exploit proof, remediation retest included.', price: 65000 },
        { id: 'sec-mobpt',   name: 'Mobile application penetration test',desc: 'Static and dynamic analysis of the app, its storage and its APIs.', price: 72000 },
        { id: 'sec-netpt',   name: 'Internal network penetration test',  desc: 'Assumed-breach test of lateral movement, privilege escalation and segmentation.', price: 88000 },
        { id: 'sec-cloud',   name: 'Cloud security posture review',      desc: 'AWS, Azure or GCP configuration, identity and data-exposure review.', price: 52000 },
        { id: 'sec-code',    name: 'Secure source code review',          desc: 'Manual review of security-critical code paths plus SAST tuning.', price: 58000 },
        { id: 'sec-phish',   name: 'Phishing simulation & awareness',    desc: 'Simulated campaign plus training for up to 100 staff, with a board-ready report.', price: 34000 },
        { id: 'sec-popia',   name: 'POPIA readiness assessment',         desc: 'Gap analysis against the eight conditions, plus an action plan you can execute.', price: 42000 },
        { id: 'sec-iso',     name: 'ISO/IEC 27001 gap analysis',         desc: 'Control-by-control gap analysis and a prioritised path to certification.', price: 68000 },
        { id: 'sec-ir',      name: 'Incident response readiness',        desc: 'Playbooks, roles, comms templates and a tabletop exercise with your team.', price: 46000 },
        { id: 'sec-mon',     name: 'Managed monitoring & vulnerability management', desc: 'Continuous scanning, triage and monthly reporting.', price: 28000, recurring: true }
      ]
    },
    {
      key: 'ai', label: 'AI & Intelligent Automation', blurb: 'Scale it.',
      items: [
        { id: 'ai-assess',  name: 'AI opportunity assessment',       desc: 'We map your processes and rank them by payback, risk and effort. No hype.', price: 38000 },
        { id: 'ai-process', name: 'Process automation (per workflow)',desc: 'One end-to-end business workflow automated, monitored and handed over.', price: 68000 },
        { id: 'ai-docs',    name: 'Document intelligence pipeline',   desc: 'Extract, validate and route data from invoices, claims, forms or contracts.', price: 125000 },
        { id: 'ai-copilot', name: 'Internal assistant / RAG copilot',  desc: 'A grounded assistant over your own documents, with citations and access control.', price: 185000 },
        { id: 'ai-support', name: 'Customer support automation',      desc: 'Triage, deflection and hand-off to humans, wired into your existing helpdesk.', price: 145000 },
        { id: 'ai-gov',     name: 'AI governance & policy framework', desc: 'Acceptable-use policy, data boundaries, human-in-the-loop and audit controls.', price: 48000 },
        { id: 'ai-evals',   name: 'Model evaluation & monitoring',    desc: 'Evaluation harness, quality gates and drift alerting for a live AI feature.', price: 72000 },
        { id: 'ai-run',     name: 'Managed AI operations',            desc: 'We run, evaluate and improve your deployed AI systems.', price: 34000, recurring: true }
      ]
    }
  ];

  var TIMELINES = [
    { id: 'flexible',    name: 'Flexible',    desc: 'We slot it around other work. Longest runway, best price.', adj: -0.08 },
    { id: 'standard',    name: 'Standard',    desc: 'Normal delivery cadence. Start within 2–3 weeks.', adj: 0 },
    { id: 'accelerated', name: 'Accelerated', desc: 'Priority squad, compressed timeline, start within 5 working days.', adj: 0.18 }
  ];

  var CARE = { id: 'care', name: '12-month care plan', desc: 'Hosting oversight, dependency and security patching, monitoring, and a monthly health report.', rate: 0.15 };
  var BUNDLE = { threshold: 3, rate: 0.07, name: 'Integrated delivery discount' };

  function money(n, symbol) {
    var s = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (n < 0 ? '−' : '') + (symbol || 'R') + ' ' + s;
  }

  function findItem(id) {
    for (var i = 0; i < CATALOG.length; i++) {
      var f = CATALOG[i].items.filter(function (x) { return x.id === id; })[0];
      if (f) return { item: f, group: CATALOG[i] };
    }
    return null;
  }

  /* selection: { items: [ids] or {id: true}, timeline, months, care }
     config:    the site config (chargeVat, vatRate, currencySymbol)
     Unknown ids are ignored, so a tampered request can only drop lines. */
  function compute(selection, config) {
    var sel = selection || {}, C = config || {};
    var ids = Array.isArray(sel.items) ? sel.items
      : Object.keys(sel.items || {}).filter(function (k) { return sel.items[k]; });
    var months = Math.min(Math.max(parseInt(sel.months, 10) || 6, 1), 36);
    var lines = [], oneOff = 0, monthly = 0, groups = {}, seen = {};

    ids.forEach(function (id) {
      if (seen[id]) return;
      seen[id] = true;
      var f = findItem(id);
      if (!f) return;
      groups[f.group.key] = true;
      if (f.item.recurring) {
        var total = f.item.price * months;
        monthly += f.item.price;
        oneOff  += total;
        lines.push({ id: id, name: f.item.name, note: f.group.label + ' · ' + money(f.item.price, C.currencySymbol) + ' × ' + months + ' months', amount: total });
      } else {
        oneOff += f.item.price;
        lines.push({ id: id, name: f.item.name, note: f.group.label, amount: f.item.price });
      }
    });

    var disciplines = Object.keys(groups).length;
    var subtotal = oneOff;
    var adjustments = [];

    var tl = TIMELINES.filter(function (t) { return t.id === sel.timeline; })[0] || TIMELINES[1];
    if (tl.adj !== 0 && subtotal > 0) {
      adjustments.push({ name: tl.name + ' timeline', amount: subtotal * tl.adj });
    }
    if (sel.care === true && subtotal > 0) {
      adjustments.push({ name: CARE.name, amount: subtotal * CARE.rate });
    }
    if (disciplines >= BUNDLE.threshold && subtotal > 0) {
      adjustments.push({ name: BUNDLE.name + ' (' + disciplines + ' disciplines)', amount: -(subtotal * BUNDLE.rate) });
    }

    var adjTotal = adjustments.reduce(function (a, b) { return a + b.amount; }, 0);
    var net = subtotal + adjTotal;
    var vat = C.chargeVat ? net * (C.vatRate || 0.15) : 0;

    return {
      lines: lines, adjustments: adjustments, disciplines: disciplines,
      subtotal: subtotal, monthly: monthly, net: net, vat: vat, total: net + vat,
      timeline: tl, months: months, care: sel.care === true
    };
  }

  var api = { CATALOG: CATALOG, TIMELINES: TIMELINES, CARE: CARE, BUNDLE: BUNDLE,
              findItem: findItem, compute: compute, money: money };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BULAN_PRICING = api;
})(typeof window !== 'undefined' ? window : this);
