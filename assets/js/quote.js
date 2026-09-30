/* ============================================================
   BULAN — Quote builder → indicative pro-forma quotation.

   ►► PRICES LIVE IN pricing.js, NOT HERE. ◄◄
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

  /* The price list and the pricing rules live in pricing.js, shared with
     the mail function on the server. Edit prices there. */
  var P = window.BULAN_PRICING;
  var CATALOG = P.CATALOG, TIMELINES = P.TIMELINES, CARE = P.CARE;

  /* ========================================================
     1. State
     ======================================================== */
  var state = { items: {}, timeline: 'standard', months: 6, care: false };

  function money(n) { return P.money(n, C.currencySymbol); }

  /* ========================================================
     2. Pricing — shared with the server, see pricing.js
     ======================================================== */
  function compute() { return P.compute(state, C); }

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
    host.innerHTML =
      '<table class="pf-page" role="presentation">' +
        '<thead><tr><td><div class="pf-space-top"></div></td></tr></thead>' +
        '<tfoot><tr><td><div class="pf-space-bottom"></div></td></tr></tfoot>' +
        '<tbody><tr><td>' + html + '</td></tr></tbody>' +
      '</table>';
    return host;
  }

  function details() {
    var f = $('#qb-details');
    var d = new FormData(f), o = {};
    ['name', 'role', 'company', 'email', 'phone', 'country', 'notes'].forEach(function (k) { o[k] = (d.get(k) || '').toString().trim(); });
    return o;
  }

  /* What the visitor picked, by id. The server prices the quotation from
     these with the same pricing.js, so the emailed figures are Bulan's own. */
  function selection() {
    return {
      items: Object.keys(state.items).filter(function (k) { return state.items[k]; }),
      timeline: state.timeline, months: state.months, care: !!state.care
    };
  }

  var endpoint = (C.formMode || 'mailto') === 'endpoint';

  function status(msg, ok) {
    var el = $('#qb-email-status');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('is-err', !ok);
    el.hidden = !msg;
  }

  /* kind "quote": Bulan gets the lead and the visitor gets the quotation.
     kind "quote-copy": the visitor gets the quotation again, nothing else. */
  function sendQuote(kind) {
    var q = compute(), d = details();
    return window.BULAN_FORM.send($('#qb-details'),
      'Quotation ' + reference + ' — ' + (d.company || d.name),
      plainText(q, d),
      { kind: kind, reference: reference, selection: selection() });
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

    // Send it: the lead to Bulan and the quotation to the visitor. In
    // "mailto" mode that would throw the visitor into their mail client
    // uninvited, so there it stays a button.
    status('', true);
    $('#qb-sent-auto').hidden = true;
    $('#qb-send').hidden = endpoint;
    $('#qb-send-wrap').hidden = endpoint;
    if (endpoint) {
      sendQuote('quote').then(function () {
        $('#qb-sent-to').textContent = d.email;
        $('#qb-sent-auto').hidden = false;
      }).catch(function () {
        // The quotation is already on screen and downloadable, so a failed
        // send must not look like a failed quotation. Offer to try again.
        $('#qb-send').hidden = false;
        status('We could not send it just now. Try "Send it to Bulan" again, or download it.', false);
      });
    }
  }

  $('#qb-send').addEventListener('click', function () {
    var btn = this;
    if (endpoint) {
      btn.disabled = true;
      sendQuote('quote').then(function () {
        btn.hidden = true;
        $('#qb-sent-to').textContent = details().email;
        $('#qb-sent-auto').hidden = false;
        status('', true);
      }).catch(function (e) {
        status((e && e.message) || 'That did not send. Please try again shortly.', false);
      }).then(function () { btn.disabled = false; });
      return;
    }
    var q = compute(), d = details();
    window.location.href = 'mailto:' + (C.salesEmail || C.email) +
      '?subject=' + encodeURIComponent('Quotation request ' + reference + ' — ' + (d.company || d.name)) +
      '&body=' + encodeURIComponent(plainText(q, d));
  });

  /* Printing. The document title is what "Save as PDF" suggests as the
     file name (and what a browser prints if its headers are forced on),
     so it names the quotation rather than the web page. beforeprint also
     catches Ctrl+P once a quotation exists, so the shortcut prints the
     document and not the builder. */
  var pageTitle = document.title;
  function startPrint() {
    if (!reference || !document.getElementById('proforma-doc')) return;
    document.body.classList.add('print-doc');
    document.title = 'Bulan quotation ' + reference;
  }
  function endPrint() {
    document.body.classList.remove('print-doc');
    document.title = pageTitle;
  }
  window.addEventListener('beforeprint', startPrint);
  window.addEventListener('afterprint', endPrint);

  $('#qb-print').addEventListener('click', function () {
    startPrint();
    window.print();
    // Some browsers skip afterprint; do not leave the page stuck in print mode.
    setTimeout(endPrint, 1000);
  });

  $('#qb-email').addEventListener('click', function () {
    var btn = this, d = details();
    if (endpoint) {
      btn.disabled = true;
      status('Sending to ' + d.email + '…', true);
      sendQuote('quote-copy').then(function () {
        status('Sent to ' + d.email + '. Check your inbox (and spam folder) in a minute.', true);
      }).catch(function (e) {
        status((e && e.message) || 'That did not send. Please try again shortly.', false);
      }).then(function () { btn.disabled = false; });
      return;
    }
    var q = compute();
    window.location.href = 'mailto:' + (d.email || C.salesEmail || C.email) +
      '?subject=' + encodeURIComponent('Bulan pro-forma quotation ' + reference) +
      '&body=' + encodeURIComponent(plainText(q, d) + '\n\n— ' + (C.tradingName || 'Bulan') + '\n' + (C.email || ''));
  });

  $('#qb-restart').addEventListener('click', function () {
    state = { items: {}, timeline: 'standard', months: 6, care: false };
    reference = '';   // so Ctrl+P prints the builder again, not the old quotation
    status('', true);
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
