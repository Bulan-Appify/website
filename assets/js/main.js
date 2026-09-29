/* ============================================================
   BULAN — site behaviour. No dependencies.
   ============================================================ */
(function () {
  'use strict';

  var C = window.BULAN || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* --- 1. Sticky header ---------------------------------- */
  var hdr = $('.hdr');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('is-stuck', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- 2. Mobile nav ------------------------------------- */
  var burger = $('.burger');
  var mnav = $('.mnav');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      mnav.classList.toggle('is-open', !open);
      document.body.style.overflow = !open ? 'hidden' : '';
    });
    $$('a', mnav).forEach(function (a) {
      a.addEventListener('click', function () {
        burger.setAttribute('aria-expanded', 'false');
        mnav.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mnav.classList.contains('is-open')) { burger.click(); burger.focus(); }
    });
  }

  /* --- 3. Desktop dropdown (keyboard + touch) ------------- */
  $$('.nav-link[aria-haspopup="true"]').forEach(function (btn) {
    var drop = btn.parentElement.querySelector('.drop');
    if (!drop) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      drop.classList.toggle('is-open', !open);
    });
    document.addEventListener('click', function (e) {
      if (!btn.parentElement.contains(e.target)) {
        btn.setAttribute('aria-expanded', 'false');
        drop.classList.remove('is-open');
      }
    });
    btn.parentElement.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { btn.setAttribute('aria-expanded', 'false'); drop.classList.remove('is-open'); btn.focus(); }
    });
  });

  /* --- 4. Scroll reveal ---------------------------------- */
  var reveals = $$('[data-reveal]');
  if (reveals.length) {
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* --- 5. Card pointer glow ------------------------------ */
  if (window.matchMedia('(hover: hover)').matches) {
    $$('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* --- 6. Accordions ------------------------------------- */
  $$('.acc-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.acc-i');
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      item.classList.toggle('is-open', !open);
    });
  });

  /* --- 7. Year stamps ------------------------------------ */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* --- 8. Fill config-driven text ------------------------ */
  $$('[data-cfg]').forEach(function (el) {
    var path = el.getAttribute('data-cfg');
    var val = path.split('.').reduce(function (o, k) { return (o || {})[k]; }, C);
    if (val === undefined || val === null || val === '') return;
    if (el.tagName === 'A' && el.hasAttribute('data-cfg-href')) {
      el.setAttribute('href', el.getAttribute('data-cfg-href').replace('{v}', val));
    }
    el.textContent = val;
  });

  /* --- 9. Forms ------------------------------------------ */
  window.BULAN_FORM = {
    validate: function (form) {
      var ok = true;
      $$('[required]', form).forEach(function (f) {
        var valid;
        if (f.type === 'checkbox') {
          // A named group is satisfied when any one of its boxes is ticked.
          var group = f.name ? $$('input[type="checkbox"][name="' + f.name + '"]', form) : [f];
          valid = group.some(function (c) { return c.checked; });
        } else {
          valid = String(f.value).trim() !== '';
          if (valid && f.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim());
        }
        f.setAttribute('aria-invalid', valid ? 'false' : 'true');
        var scope = f.closest('.field, .consent, fieldset');
        var err = scope && scope.querySelector('.err');
        if (err) err.classList.toggle('is-shown', !valid);
        if (!valid && ok) { f.focus(); }
        if (!valid) ok = false;
      });
      return ok;
    },
    /* Hands the submission off. Resolves true on success, false on a
       real failure, so the UI can tell the difference instead of
       claiming success whatever happened. */
    send: function (form, subject, body, extra) {
      // Spam honeypot — resolve true so bots believe they won.
      var hp = form.querySelector('.hp input');
      if (hp && hp.value) return Promise.resolve(true);

      var mode = C.formMode || 'mailto';

      if (mode === 'endpoint' && C.formEndpoint) {
        var payload = {};
        new FormData(form).forEach(function (v, k) {
          if (k === '_gotcha') { payload._gotcha = v; return; }
          if (payload[k] === undefined) { payload[k] = v; return; }
          // Repeated names (the service checkboxes) become an array.
          if (!Array.isArray(payload[k])) payload[k] = [payload[k]];
          payload[k].push(v);
        });
        payload.consent = !!form.querySelector('[name="consent"]:checked');
        if (extra) Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });

        return fetch(C.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (r) {
          return r.ok ? true : r.json().catch(function () { return {}; }).then(function (j) {
            throw new Error(j.error || 'Send failed');
          });
        });
      }

      if (mode === 'netlify') { form.submit(); return Promise.resolve(true); }

      var to = C.salesEmail || C.email || '';
      window.location.href = 'mailto:' + to +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      return Promise.resolve(true);
    }
  };

  /* Generic contact form wiring */
  var cform = $('#contact-form');
  if (cform) {
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!window.BULAN_FORM.validate(cform)) return;

      var btn = cform.querySelector('button[type="submit"]');
      var label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      var err = $('#contact-error');
      if (err) err.hidden = true;

      var d = new FormData(cform);
      var lines = [];
      var labels = {
        name: 'Name', company: 'Company', email: 'Email', phone: 'Phone',
        country: 'Country', services: 'Services needed', budget: 'Budget band',
        timeline: 'Timeline', heard: 'How they found us', message: 'Brief'
      };
      Object.keys(labels).forEach(function (k) {
        var v = d.getAll(k).filter(Boolean).join(', ');
        if (v) lines.push(labels[k] + ': ' + v);
      });
      var NL = String.fromCharCode(10);
      var body = 'New enquiry from the Bulan website' + NL +
                 '----------------------------------------' + NL +
                 lines.join(NL) + NL + NL +
                 'Received: ' + new Date().toLocaleString('en-ZA');

      window.BULAN_FORM
        .send(cform, 'Website enquiry — ' + (d.get('company') || d.get('name') || 'New lead'), body)
        .then(function () {
          cform.hidden = true;
          var ok = $('#contact-success');
          if (ok) { ok.hidden = false; ok.focus(); ok.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        })
        .catch(function (ex) {
          if (btn) { btn.disabled = false; btn.innerHTML = label; }
          if (err) {
            $('#contact-error-msg').textContent =
              (ex && ex.message) || 'Something went wrong on our side.';
            err.hidden = false;
            err.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        });
    });
  }
})();
