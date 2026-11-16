(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Disclosures: every feature, category and policy opens on its own. */
  const setOpen = (button, open, animate = true) => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    if (!panel) return;
    button.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    if (open && animate && !reduceMotion.matches) {
      panel.classList.remove('opening');
      void panel.offsetWidth;
      panel.classList.add('opening');
    }
  };

  const discs = [...document.querySelectorAll('.disc')];
  discs.forEach((b) => setOpen(b, false, false));
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.disc');
    if (b) setOpen(b, b.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('animationend', (e) => e.target.classList.remove('opening'));

  /* Section menu: move focus to the chosen section's heading. */
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href')));

  const goTo = (target, focusEl, instant = false) => {
    target.scrollIntoView({ behavior: instant || reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    focusEl.focus({ preventScroll: true });
    history.replaceState(null, '', '#' + target.id);
  };

  navLinks.forEach((a, i) => {
    a.addEventListener('click', (e) => {
      const section = sections[i];
      if (!section) return;
      e.preventDefault();
      goTo(section, section.querySelector('h1, h2'));
      markCurrent(i);
    });
  });

  const markCurrent = (index) => {
    navLinks.forEach((a, i) => {
      if (i === index) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  };

  const updateCurrent = () => {
    const line = window.innerHeight * 0.35;
    let index = 0;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= line) index = i; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      const contact = sections.length - 1;
      if (sections[contact].getBoundingClientRect().top < window.innerHeight) index = contact;
    }
    markCurrent(index);
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateCurrent(); ticking = false; });
  }, { passive: true });
  updateCurrent();

  /* Links to #privacy, #terms, #accessibility or a section open and focus it. */
  const openFromHash = (instant = false) => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    const button = el.matches('.item, .group') ? el.querySelector('.disc') : null;
    if (button) {
      setOpen(button, true, false);
      goTo(el, button, instant);
    } else if (el.matches('section')) {
      goTo(el, el.querySelector('h1, h2'), instant);
    }
  };
  window.addEventListener('hashchange', () => openFromHash());
  openFromHash(true);

  /* Feature search. */
  const search = document.getElementById('feature-search');
  const status = document.getElementById('search-status');
  const groups = [...document.querySelectorAll('#features .group')];
  let announceTimer;

  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    let found = 0;
    groups.forEach((g) => {
      const button = g.querySelector('.disc-group');
      let inGroup = 0;
      g.querySelectorAll('.item').forEach((item) => {
        const match = !q || item.dataset.search.includes(q);
        item.hidden = !match;
        if (match) inGroup++;
      });
      found += inGroup;
      g.hidden = q !== '' && inGroup === 0;
      setOpen(button, q !== '' && inGroup > 0, false);
    });
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      if (!q) status.textContent = '';
      else if (found === 0) status.textContent = 'No features match. Try a shorter word.';
      else status.textContent = found === 1 ? '1 feature found.' : found + ' features found.';
    }, 500);
  });

  /* Contact form. */
  const form = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  /* Subscribe with Razorpay.
     PAY_API is the netraPay Cloud Function address. While it is empty, Subscribe falls back to the
     contact form, and ?demo=1 shows the whole flow without taking any payment. */
  const PAY_SERVER = 'https://asia-south1-netrax-mainapp.cloudfunctions.net/netraPay';
  const PAY_LIVE = false; // true once live Razorpay keys are set; until then only ?paytest=1 reaches the server
  const query = new URLSearchParams(location.search);
  const PAY_API = PAY_LIVE || query.get('paytest') === '1' ? PAY_SERVER : '';
  const DEMO = !PAY_API && query.get('demo') === '1';
  const payDialog = document.getElementById('pay-dialog');
  const payForm = document.getElementById('pay-form');
  const payEmail = document.getElementById('pay-email');
  const payEmail2 = document.getElementById('pay-email2');
  const agreeEmail = document.getElementById('pay-agree-email');
  const agreeTerms = document.getElementById('pay-agree-terms');
  const paySubmit = document.getElementById('pay-submit');
  const payStatus = document.getElementById('pay-status');
  const formView = document.getElementById('pay-form-view');
  const resultView = document.getElementById('pay-result-view');
  let payPlan = null;
  let payOpener = null;
  let handingOff = false;
  /* Shown on the page. The payment server decides what is charged and replaces these when it answers. */
  const LIST_PRICES = { '1m': 3800, '3m': 9500, '6m': 16900, '1y': 25900 };
  const PLAN_MONTHS = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 };
  let prices = { ...LIST_PRICES };

  const rupees = (paise) => '₹' + (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const showPrice = (key) => {
    const el = document.querySelector(`[data-price-for="${key}"]`);
    if (!el || !prices[key]) return;
    const months = PLAN_MONTHS[key];
    el.textContent = 'Price: ' + rupees(prices[key]) +
      (months > 1 ? ', about ' + rupees(Math.round(prices[key] / months / 100) * 100) + ' a month' : '');
    el.hidden = false;
  };
  Object.keys(prices).forEach(showPrice);
  const longDate = (ms) => new Intl.DateTimeFormat(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(new Date(ms));

  const api = async (path, body) => {
    const response = await fetch(PAY_API.replace(/\/$/, '') + path, body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : { method: 'GET' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'The payment service did not answer. Try again in a minute.');
    return data;
  };

  if (PAY_API) {
    api('/plans').then((data) => {
      data.plans.forEach((p) => { prices[p.key] = p.amount; showPrice(p.key); });
    }).catch(() => {});
  }

  const updateSubmit = () => { paySubmit.disabled = !(agreeEmail.checked && agreeTerms.checked); };
  agreeEmail.addEventListener('change', updateSubmit);
  agreeTerms.addEventListener('change', updateSubmit);

  const openPay = (button) => {
    payPlan = { key: button.dataset.planKey, label: button.dataset.plan };
    payOpener = button;
    payForm.reset();
    ['pay-email-err', 'pay-email2-err'].forEach((id) => { document.getElementById(id).textContent = ''; });
    [payEmail, payEmail2].forEach((f) => f.removeAttribute('aria-invalid'));
    payStatus.textContent = '';
    updateSubmit();
    document.getElementById('pay-title').textContent = 'Subscribe to ' + payPlan.label;
    document.getElementById('pay-summary').textContent = 'Netra Plus Premium, ' + payPlan.label +
      (prices[payPlan.key] ? ', ' + rupees(prices[payPlan.key]) : '') + '. Paid once, no automatic renewal.';
    document.getElementById('pay-demo').hidden = !DEMO;
    formView.hidden = false;
    resultView.hidden = true;
    if (!payDialog.open) payDialog.showModal();
    payEmail.focus();
  };

  const showResult = (title, text, details, next) => {
    formView.hidden = true;
    resultView.hidden = false;
    document.getElementById('pay-result-title').textContent = title;
    document.getElementById('pay-result-text').textContent = text;
    const dl = document.getElementById('pay-result-details');
    dl.replaceChildren();
    details.forEach(([term, value]) => {
      const dt = document.createElement('dt'); dt.textContent = term;
      const dd = document.createElement('dd'); dd.textContent = value;
      dl.append(dt, dd);
    });
    document.getElementById('pay-result-next').textContent = next || '';
    handingOff = false;
    if (!payDialog.open) payDialog.showModal();
    document.getElementById('pay-result-title').focus();
  };

  const showSuccess = (r) => showResult(
    'Subscription successful',
    'Your Netra Plus Premium is active.',
    [['Sign-in email', r.email], ['Plan', 'Netra Plus Premium, ' + r.plan], ['Starts', longDate(r.startsAt)], ['Expires on', longDate(r.expiresAt)]],
    'Open the Netra Plus app and sign in with ' + r.email + '. Premium turns on within a minute and ends on the expiry date.',
  );

  const showAlreadyActive = (r) => showResult(
    'You already have an active subscription',
    'Premium is already active on this email, so there is nothing to pay.',
    [['Sign-in email', r.email], ['Plan', r.plan]].concat(r.expiresAt ? [['Expires on', longDate(r.expiresAt)]] : []),
    'You can buy a new plan after this one ends.',
  );

  payDialog.addEventListener('click', (e) => { if (e.target.closest('[data-pay-close]')) payDialog.close(); });
  payDialog.addEventListener('close', () => {
    if (payOpener && !handingOff) setTimeout(() => { if (!payDialog.open) payOpener.focus(); }, 0);
  });

  const loadCheckout = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('The payment page could not load. Check your internet connection and try again.'));
    document.head.append(s);
  });

  payForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = payEmail.value.trim().toLowerCase();
    const email2 = payEmail2.value.trim().toLowerCase();
    const emailErr = !email ? 'Enter your email address.'
      : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? '' : 'Email needs one @ sign and a domain, for example name@gmail.com.';
    const email2Err = emailErr ? '' : email2 !== email ? 'The two emails do not match. Type the same email in both boxes.' : '';
    document.getElementById('pay-email-err').textContent = emailErr;
    document.getElementById('pay-email2-err').textContent = email2Err;
    payEmail.toggleAttribute('aria-invalid', !!emailErr);
    payEmail2.toggleAttribute('aria-invalid', !!email2Err);
    if (emailErr) { payEmail.focus(); return; }
    if (email2Err) { payEmail2.focus(); return; }

    paySubmit.disabled = true;
    payStatus.textContent = 'Checking your email.';
    try {
      if (DEMO) {
        await new Promise((r) => setTimeout(r, 600));
        if (email.startsWith('active')) {
          showAlreadyActive({ email, plan: '3 months', expiresAt: Date.now() + 40 * 86400000 });
        } else {
          const days = { '1m': 30, '3m': 90, '6m': 180, '1y': 365 }[payPlan.key];
          const now = Date.now();
          showSuccess({ email, plan: payPlan.label, startsAt: now, expiresAt: now + days * 86400000 });
        }
        return;
      }

      const order = await api('/order', { email, plan: payPlan.key, accepted: true });
      if (order.status === 'already_active') { showAlreadyActive(order); return; }

      payStatus.textContent = 'Opening the payment page.';
      await loadCheckout();
      handingOff = true;
      payDialog.close();
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Netra Plus',
        description: 'Netra Plus Premium, ' + order.plan,
        image: new URL('logo-square.png', location.href).href,
        prefill: { email: order.email },
        readonly: { email: true },
        notes: { email: order.email },
        theme: { color: '#F2C230', backdrop_color: '#101114' },
        modal: {
          confirm_close: true,
          ondismiss: () => showResult('Payment not completed', 'You closed the payment page. No money was taken.', [],
            'You can press Subscribe again when you are ready.'),
        },
        handler: async (response) => {
          showResult('Confirming your payment', 'Please wait a moment.', [], '');
          try {
            showSuccess(await api('/verify', response));
          } catch (err) {
            showResult('Payment received, confirming', 'We received your payment but could not confirm it yet. Premium turns on by itself within a few minutes.',
              [['Sign-in email', order.email], ['Payment ID', response.razorpay_payment_id]],
              'If Premium is not on within 15 minutes, email netraplushelpdesk@gmail.com with this payment ID.');
          }
        },
      });
      rzp.on('payment.failed', () => {});
      rzp.open();
    } catch (err) {
      payStatus.textContent = err.message;
      updateSubmit();
    }
  });

  document.querySelectorAll('[data-plan]').forEach((button) => {
    button.addEventListener('click', () => {
      if (PAY_API || DEMO) { openPay(button); return; }
      const message = document.getElementById('message');
      message.value = 'I want to subscribe to Netra Plus Premium, ' + button.dataset.plan +
        ' plan.\nMy Netra Plus sign-in email: ';
      formStatus.textContent = button.dataset.plan + ' plan added to your message. Enter your name and email, then send.';
      const name = document.getElementById('from_name');
      goTo(document.getElementById('contact'), name.value ? message : name);
      markCurrent(navLinks.length - 1);
    });
  });
  const checks = {
    from_name: (v) => (v ? '' : 'Enter your name.'),
    from_email: (v) => (!v ? 'Enter your email address.' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Email needs an @ sign and a domain, for example name@gmail.com.'),
    message: (v) => (v ? '' : 'Write your message.'),
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let firstBad = null;
    Object.entries(checks).forEach(([id, check]) => {
      const field = document.getElementById(id);
      const msg = check(field.value.trim());
      document.getElementById(id + '-err').textContent = msg;
      if (msg) {
        field.setAttribute('aria-invalid', 'true');
        firstBad = firstBad || field;
      } else {
        field.removeAttribute('aria-invalid');
      }
    });
    if (firstBad) { firstBad.focus(); return; }

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    formStatus.textContent = 'Sending your message.';
    try {
      if (!window.emailjs) throw new Error('EmailJS not loaded');
      emailjs.init({ publicKey: 'SIqICA0HpiyvSPhs2' });
      await emailjs.sendForm('service_6rsq898', 'template_ii2wbgk', form);
      form.reset();
      formStatus.textContent = 'Message sent. We will reply by email.';
    } catch (err) {
      formStatus.textContent = 'Your message could not be sent. Check your internet connection and try again, or email netraplushelpdesk@gmail.com.';
    } finally {
      submit.disabled = false;
    }
  });

  /* Greeting and clock in the visitor's own time zone. Updated quietly, never announced. */
  const clock = document.getElementById('clock');
  const clockTime = document.getElementById('clock-time');
  const clockZone = document.getElementById('clock-zone');
  const greetTime = document.getElementById('greet-time');
  const dateFormat = new Intl.DateTimeFormat(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  let zoneName = '';
  try {
    zoneName = new Intl.DateTimeFormat(undefined, { timeZoneName: 'long' })
      .formatToParts(new Date()).find((part) => part.type === 'timeZoneName').value;
  } catch (e) { /* zone name is optional */ }

  const tick = () => {
    const now = new Date();
    const hour = now.getHours();
    greetTime.textContent =
      hour >= 5 && hour < 12 ? 'Good morning' : hour >= 12 && hour < 17 ? 'Good afternoon' : hour >= 17 && hour < 22 ? 'Good evening' : 'Hello';
    clockTime.textContent = dateFormat.format(now);
    clockTime.dateTime = now.toISOString();
    clockZone.textContent = zoneName;
    clock.hidden = false;
    setTimeout(tick, 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
  };
  tick();

  document.getElementById('year').textContent = new Date().getFullYear();
})();
