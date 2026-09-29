/* ============================================================
   BULAN — Quote builder → indicative pro-forma quotation.

   ►► PRICES LIVE IN THE CATALOGUE BELOW. Edit freely. ◄◄
   Every figure is an indicative starting price in ZAR, excluding
   VAT. Nothing here is a binding offer — the generated document
   says so explicitly, and it is NOT a tax invoice.
   ============================================================ */
(function () {
  'use strict';

  var C = window.BULAN || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var root = $('#quote-builder');
  if (!root) return;

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

  /* ========================================================
     2. State
     ======================================================== */
  var state = { items: {}, timeline: 'standard', months: 6, care: false };

  function money(n) {
    var s = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (C.currencySymbol || 'R') + ' ' + s;
  }

  function findItem(id) {
    for (var i = 0; i < CATALOG.length; i++) {
      var f = CATALOG[i].items.filter(function (x) { return x.id === id; })[0];
      if (f) return { item: f, group: CATALOG[i] };
    }
    return null;
  }

  /* ========================================================
     3. Pricing
     ======================================================== */
  function compute() {
    var lines = [], oneOff = 0, monthly = 0, groups = {};

    Object.keys(state.items).forEach(function (id) {
      if (!state.items[id]) return;
      var f = findItem(id);
      if (!f) return;
      groups[f.group.key] = true;
      if (f.item.recurring) {
        var total = f.item.price * state.months;
        monthly += f.item.price;
        oneOff  += total;
        lines.push({ name: f.item.name, note: f.group.label + ' · ' + money(f.item.price) + ' × ' + state.months + ' months', amount: total });
      } else {
        oneOff += f.item.price;
        lines.push({ name: f.item.name, note: f.group.label, amount: f.item.price });
      }
    });

    var disciplines = Object.keys(groups).length;
    var subtotal = oneOff;
    var adjustments = [];

    var tl = TIMELINES.filter(function (t) { return t.id === state.timeline; })[0];
    if (tl && tl.adj !== 0 && subtotal > 0) {
      var tAmt = subtotal * tl.adj;
      adjustments.push({ name: tl.name + ' timeline', amount: tAmt });
    }

    if (state.care && subtotal > 0) {
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
      subtotal: subtotal, monthly: monthly, net: net, vat: vat, total: net + vat
    };
  }

  /* ========================================================
     4. Render — option tiles
     ======================================================== */
  function renderCatalog() {
    var host = $('#qb-catalog');
    host.innerHTML = CATALOG.map(function (g) {
      return '<div class="qb-group">' +
        '<div class="qb-group-h"><h4>' + g.label + '</h4><span class="mono">' + g.blurb + '</span></div>' +
        '<div class="opts opts--2">' + g.items.map(function (it) {
          return '<label class="opt"><input type="checkbox" data-item="' + it.id + '">' +
            '<span class="opt-box"><span class="opt-tick"></span><span>' +
            '<span class="opt-t">' + it.name + '</span>' +
            '<span class="opt-d">' + it.desc + '</span>' +
            '<span class="opt-price">from ' + money(it.price) + (it.recurring ? ' / month' : '') + '</span>' +
            '</span></span></label>';
        }).join('') + '</div></div>';
    }).join('');

    $$('input[data-item]', host).forEach(function (cb) {
      cb.addEventListener('change', function () {
        state.items[cb.getAttribute('data-item')] = cb.checked;
        update();
      });
    });
  }

  function renderTimelines() {
    var host = $('#qb-timeline');
    host.innerHTML = TIMELINES.map(function (t) {
      return '<label class="opt opt--radio"><input type="radio" name="tl" value="' + t.id + '"' + (t.id === state.timeline ? ' checked' : '') + '>' +
        '<span class="opt-box"><span class="opt-tick"></span><span>' +
        '<span class="opt-t">' + t.name + '</span><span class="opt-d">' + t.desc + '</span>' +
        (t.adj !== 0 ? '<span class="opt-price">' + (t.adj > 0 ? '+' : '') + Math.round(t.adj * 100) + '% on the build</span>' : '') +
        '</span></span></label>';
    }).join('');
    $$('input[name="tl"]', host).forEach(function (r) {
      r.addEventListener('change', function () { state.timeline = r.value; update(); });
    });

    var careHost = $('#qb-care');
    careHost.innerHTML = '<label class="opt"><input type="checkbox" id="qb-care-cb">' +
      '<span class="opt-box"><span class="opt-tick"></span><span>' +
      '<span class="opt-t">' + CARE.name + '</span><span class="opt-d">' + CARE.desc + '</span>' +
      '<span class="opt-price">+' + Math.round(CARE.rate * 100) + '% of the build</span>' +
      '</span></span></label>';
    $('#qb-care-cb').addEventListener('change', function () { state.care = this.checked; update(); });
  }

  /* ========================================================
     5. Render — live summary
     ======================================================== */
  function update() {
    var q = compute();

    var host = $('#qb-lines');
    if (!q.lines.length) {
      host.innerHTML = '<p class="qb-empty">Select what you need and your indicative pricing appears here.</p>';
    } else {
      host.innerHTML = q.lines.map(function (l) {
        return '<div class="qb-line"><span class="qb-line-n">' + l.name + '<small>' + l.note + '</small></span>' +
               '<span class="qb-line-v">' + money(l.amount) + '</span></div>';
      }).join('') + q.adjustments.map(function (a) {
        return '<div class="qb-line qb-line--adj"><span class="qb-line-n">' + a.name + '</span>' +
               '<span class="qb-line-v">' + (a.amount < 0 ? '−' : '+') + money(Math.abs(a.amount)) + '</span></div>';
      }).join('');
    }

    $('#qb-subtotal').textContent = money(q.net);
    var vatRow = $('#qb-vat-row');
    if (C.chargeVat) {
      vatRow.hidden = false;
      $('#qb-vat').textContent = money(q.vat);
      $('#qb-vat-label').textContent = 'VAT @ ' + Math.round((C.vatRate || 0.15) * 100) + '%';
    } else {
      vatRow.hidden = true;
    }
    $('#qb-total').textContent = money(q.total);
    $('#qb-count').textContent = q.lines.length ? q.lines.length + ' item' + (q.lines.length > 1 ? 's' : '') : 'Empty';

    var hasItems = q.lines.length > 0;
    $$('[data-qb-next]').forEach(function (b) { b.setAttribute('aria-disabled', String(!hasItems)); });
    return q;
  }

  /* ========================================================
     6. Steps
     ======================================================== */
  var current = 1;
  function goto(n) {
    current = n;
    $$('.qb-pane').forEach(function (p) { p.classList.toggle('is-active', Number(p.dataset.pane) === n); });
    $$('.qb-step').forEach(function (s) {
      var i = Number(s.dataset.step);
      s.classList.toggle('is-active', i === n);
      s.classList.toggle('is-done', i < n);
    });
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $$('[data-qb-next]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (current === 3 && !window.BULAN_FORM.validate($('#qb-details'))) return;
      goto(Math.min(current + 1, 4));
      if (current === 4) finalise();
    });
  });
  $$('[data-qb-back]').forEach(function (b) {
    b.addEventListener('click', function () { goto(Math.max(current - 1, 1)); });
  });

  /* Months selector */
  var monthsEl = $('#qb-months');
  if (monthsEl) {
    monthsEl.addEventListener('change', function () { state.months = Number(this.value) || 6; update(); });
  }

  /* ========================================================
     7. Pro-forma document
     ======================================================== */
  var reference = '';

  function makeRef() {
    var d = new Date();
    var seq = String(Math.floor(Math.random() * 9000) + 1000);
    return 'BLN-' + d.getFullYear() + '-' + seq;
  }

  function addr() {
    var a = C.address || {};
    return [a.line1, a.suburb, a.city, a.code, a.country].filter(Boolean).join(', ');
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function buildDoc(q, d) {
    var issued = new Date();
    var expires = new Date(issued.getTime() + (C.quoteValidDays || 30) * 86400000);
    var fmt = function (x) { return x.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }); };

    var rows = q.lines.map(function (l) {
      return '<tr><td><strong>' + esc(l.name) + '</strong><br><span class="pf-note">' + esc(l.note) + '</span></td>' +
             '<td class="pf-r">' + money(l.amount) + '</td></tr>';
    }).join('') + q.adjustments.map(function (a) {
      return '<tr><td>' + esc(a.name) + '</td><td class="pf-r">' + (a.amount < 0 ? '−' : '') + money(Math.abs(a.amount)) + '</td></tr>';
    }).join('');

    // Only render banking details once real account details exist — otherwise
    // the block would show nothing but the generic payment-reference line.
    var bank = (C.bank && (C.bank.accountNo || C.bank.name)) ? C.bank : {};
    var bankRows = [
      ['Bank', bank.name], ['Account name', bank.accountName], ['Account number', bank.accountNo],
      ['Branch code', bank.branchCode], ['SWIFT / BIC', bank.swift], ['Reference', bank.reference]
    ].filter(function (r) { return r[1]; })
     .map(function (r) { return '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('');

    return '' +
    '<div class="pf">' +
      '<header class="pf-head">' +
        '<div>' +
          '<div class="pf-logo">' +
            '<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="none" stroke="#0B1220" stroke-width="2"/><path d="M22.4 6.2A13 13 0 1 0 22.4 25.8 15 15 0 0 1 22.4 6.2Z" fill="#0B1220"/></svg>' +
            '<span>' + esc(C.tradingName || 'Bulan') + '</span>' +
          '</div>' +
          '<p class="pf-small">' + esc(C.legalName || '') + '</p>' +
          (C.regNumber ? '<p class="pf-small">Reg. no. ' + esc(C.regNumber) + '</p>' : '') +
          (C.vatNumber ? '<p class="pf-small">VAT no. ' + esc(C.vatNumber) + '</p>' : '') +
          '<p class="pf-small">' + esc(addr()) + '</p>' +
          '<p class="pf-small">' + esc(C.email || '') + ' · ' + esc(C.phone || '') + '</p>' +
        '</div>' +
        '<div class="pf-r">' +
          '<h1>Pro-forma quotation</h1>' +
          '<table class="pf-meta">' +
            '<tr><th>Quotation no.</th><td>' + esc(reference) + '</td></tr>' +
            '<tr><th>Date issued</th><td>' + fmt(issued) + '</td></tr>' +
            '<tr><th>Valid until</th><td>' + fmt(expires) + '</td></tr>' +
            '<tr><th>Currency</th><td>' + esc(C.currency || 'ZAR') + '</td></tr>' +
          '</table>' +
        '</div>' +
      '</header>' +

      '<section class="pf-to">' +
        '<h2>Prepared for</h2>' +
        '<p><strong>' + esc(d.company || d.name || '—') + '</strong></p>' +
        (d.name ? '<p>' + esc(d.name) + (d.role ? ', ' + esc(d.role) : '') + '</p>' : '') +
        (d.email ? '<p>' + esc(d.email) + '</p>' : '') +
        (d.phone ? '<p>' + esc(d.phone) + '</p>' : '') +
        (d.country ? '<p>' + esc(d.country) + '</p>' : '') +
      '</section>' +

      '<table class="pf-items">' +
        '<thead><tr><th>Description</th><th class="pf-r">Amount (excl. VAT)</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '<tfoot>' +
          '<tr><th class="pf-r">Subtotal</th><td class="pf-r">' + money(q.net) + '</td></tr>' +
          (C.chargeVat ? '<tr><th class="pf-r">VAT @ ' + Math.round((C.vatRate || 0.15) * 100) + '%</th><td class="pf-r">' + money(q.vat) + '</td></tr>' : '') +
          '<tr class="pf-total"><th class="pf-r">Total</th><td class="pf-r">' + money(q.total) + '</td></tr>' +
        '</tfoot>' +
      '</table>' +

      (d.notes ? '<section class="pf-block"><h2>Client notes</h2><p>' + esc(d.notes) + '</p></section>' : '') +

      '<section class="pf-block"><h2>Payment terms</h2><ul>' +
        (C.paymentTerms || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') +
      '</ul></section>' +

      (bankRows ? '<section class="pf-block"><h2>Banking details</h2><table class="pf-bank">' + bankRows + '</table></section>' : '') +

      '<section class="pf-block pf-disclaimer">' +
        '<h2>Important</h2>' +
        '<p>This is an <strong>indicative pro-forma quotation</strong> generated from the Bulan website. It is <strong>not a tax invoice</strong> and does not create a contract or a payment obligation.</p>' +
        '<p>Figures are starting estimates based on the scope you selected. Final pricing is confirmed in writing after a discovery conversation, once scope, integrations, data volumes and acceptance criteria are agreed. Prices exclude third-party licences, cloud hosting and travel unless stated.</p>' +
        '<p>Valid for ' + (C.quoteValidDays || 30) + ' days from the date of issue. Security testing is performed only under a signed authorisation and agreed rules of engagement.</p>' +
      '</section>' +

      '<footer class="pf-foot"><span>' + esc(C.tradingName || 'Bulan') + ' · ' + esc(reference) + '</span><span>' + esc(C.tagline || '') + '</span></footer>' +
    '</div>';
  }

  /* Styling for the document lives in assets/css/proforma.css, loaded by
     quote.html. Keeping it in a real stylesheet means the site can ship a
     strict Content-Security-Policy with no 'unsafe-inline' for styles. */
  function ensureDoc(html) {
    var host = document.getElementById('proforma-doc');
    if (!host) {
      host = document.createElement('div');
      host.id = 'proforma-doc';
      document.body.appendChild(host);
    }
    host.innerHTML = html;
    return host;
  }

  function details() {
    var f = $('#qb-details');
    var d = new FormData(f), o = {};
    ['name', 'role', 'company', 'email', 'phone', 'country', 'notes'].forEach(function (k) { o[k] = (d.get(k) || '').toString().trim(); });
    return o;
  }

  function plainText(q, d) {
    var L = [];
    L.push('PRO-FORMA QUOTATION ' + reference);
    L.push('Prepared for: ' + (d.company || d.name));
    L.push('');
    q.lines.forEach(function (l) { L.push('  ' + l.name + ' (' + l.note + ') — ' + money(l.amount)); });
    q.adjustments.forEach(function (a) { L.push('  ' + a.name + ' — ' + (a.amount < 0 ? '-' : '+') + money(Math.abs(a.amount))); });
    L.push('');
    L.push('  Subtotal: ' + money(q.net));
    if (C.chargeVat) L.push('  VAT: ' + money(q.vat));
    L.push('  TOTAL: ' + money(q.total));
    L.push('');
    L.push('Timeline: ' + state.timeline + ' · Retainer duration: ' + state.months + ' months · Care plan: ' + (state.care ? 'yes' : 'no'));
    L.push('');
    L.push('Contact: ' + d.name + (d.role ? ', ' + d.role : '') + ' · ' + d.email + ' · ' + d.phone + ' · ' + d.country);
    if (d.notes) { L.push(''); L.push('Notes: ' + d.notes); }
    L.push('');
    L.push('Indicative only — not a tax invoice.');
    return L.join('\n');
  }

  function finalise() {
    var q = compute();
    var d = details();
    reference = makeRef();

    $('#qb-ref').textContent = reference;
    $('#qb-final-total').textContent = money(q.total);
    $('#qb-final-name').textContent = d.company || d.name || 'you';

    ensureDoc(buildDoc(q, d));

    // Notify Bulan that a quote was generated. In "mailto" mode that would
    // throw the visitor into their mail client uninvited, so there we offer
    // it as a button instead of doing it behind their back.
    var auto = (C.formMode || 'mailto') !== 'mailto';
    if (auto) {
      window.BULAN_FORM.send($('#qb-details'),
        'Pro-forma generated ' + reference + ' — ' + (d.company || d.name),
        plainText(q, d),
        { kind: 'quote', reference: reference, quote: plainText(q, d) }
      ).catch(function () {
        // The quotation itself is already on screen and downloadable, so a
        // failed notification must not look like a failed quotation. Fall
        // back to the manual send instead.
        $('#qb-sent-auto').hidden = true;
        $('#qb-send').hidden = false;
        $('#qb-send-wrap').hidden = false;
      });
    }
    $('#qb-sent-auto').hidden = !auto;
    $('#qb-send').hidden = auto;
    $('#qb-send-wrap').hidden = auto;
  }

  $('#qb-send').addEventListener('click', function () {
    var q = compute(), d = details();
    window.location.href = 'mailto:' + (C.salesEmail || C.email) +
      '?subject=' + encodeURIComponent('Quotation request ' + reference + ' — ' + (d.company || d.name)) +
      '&body=' + encodeURIComponent(plainText(q, d));
  });

  $('#qb-print').addEventListener('click', function () {
    document.body.classList.add('print-doc');
    window.print();
    setTimeout(function () { document.body.classList.remove('print-doc'); }, 600);
  });

  $('#qb-email').addEventListener('click', function () {
    var q = compute(), d = details();
    var to = d.email || C.salesEmail || C.email;
    window.location.href = 'mailto:' + to +
      '?subject=' + encodeURIComponent('Bulan pro-forma quotation ' + reference) +
      '&body=' + encodeURIComponent(plainText(q, d) + '\n\n— ' + (C.tradingName || 'Bulan') + '\n' + (C.email || ''));
  });

  $('#qb-restart').addEventListener('click', function () {
    state = { items: {}, timeline: 'standard', months: 6, care: false };
    $$('#qb-catalog input, #qb-care input').forEach(function (i) { i.checked = false; });
    var std = $('input[name="tl"][value="standard"]'); if (std) std.checked = true;
    if (monthsEl) monthsEl.value = '6';
    $('#qb-details').reset();
    update();
    goto(1);
  });

  /* Init */
  renderCatalog();
  renderTimelines();
  update();
})();
