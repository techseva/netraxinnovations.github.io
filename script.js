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

  document.getElementById('year').textContent = new Date().getFullYear();
})();
