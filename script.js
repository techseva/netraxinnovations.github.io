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
  /* Netra Plus shield for the payment window, built in so the window never has to fetch it. */
  const CHECKOUT_LOGO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAEAAQADASIAAhEBAxEB/8QAHQAAAAYDAQAAAAAAAAAAAAAAAAECAwcIBAUGCf/EAEsQAAEDAwIDBQUFBAYHBwUAAAEAAgMEBREGIQcSMQgTQVFhIjJxgZEUQqGxwVJictEVIyQzgpIWJUOio7LwF2Nzk7PC0kRFU+Hx/8QAGwEAAAcBAAAAAAAAAAAAAAAAAAECAwQFBgf/xAAvEQABBAEDAgQFBAMBAAAAAAABAAIDBBEFITEGEhNBUWEiIzJxgRRCocEzsdEk/9oADAMBAAIRAxEAPwCp7NmpSIdEacCQgls2G6QnECklG7zS2tJaMJHhhPR+4Ekoxyljoggglo0MFL8ETeiNEkFGOqWxJA9UsbBLAwEWcI8ePglNzjGEbdgj3x5pJS8lAdUrI80nou94dcJtZ66idU2i3sgoh0q6t/dRO/hOMu+SYmnjhGXnCUGF3C4VHgqQuIHB3W2iqX7ZcKGKspAMvnon961n8QxkfHC4FnRFDZimGY3ZSXsczkJAYfJOtADRkAFBm3VGd0/3bYRDKPIRpON0pGjGfNBBBBBGiQ2RovEoII0EEEEEEEEROEEEaakaS7ICdSCUMkcIiQuZHRGksOWpSII0pnRLIIGUiPol5OMIknZBPRe6E3GA4kFOtAGAEl3ojaEpBBBOI0bUpE1KCIDJSDyh4pxgGd0gDfK6PR+jdT6tqu409ZqqtwcOkazETPVzzsE3LKyEdzzgI2sLjgLSBbvRmlb/AKtuYt+n7XPXS59stGGRjzc47NU+aD7PVpt4jq9cXD7dOMH7BQvIjHo+TqflhTVaaegs9vZbrPQU9vo2DDYYGBo+fn81k9T6tgrgsh3cravpj5N38KLOGfZ+sdj7q5atmZeLg3Dm0rNqaM/veLz+HoptikjggbDHGyONg5WtY0NAHgAB0Wr785xkpiruEVOznmlDQPNYK5rM9t/c9yt4qTIxgLczSxvbyPa1zT1DhkKHuJnBDTuo3S3GwvZZrk7csa3+zyn1aPdJ8x9FIlJdKasYHU07ZR5A4P0TxkJ8U3V1exUf3RuwlvqMlbhypPrLR+pNIVv2a/WySmBOI5m+3FJ/C8bH4dVocq+FZFT11HJRV1NDVUsow+GZgc1w+BUQa84E2e5F9XpSo/oqoO/2Wcl0B9AerfxC3OmdYRTANsjtPr5KnsaU9m7DlVu6o10GrNE6n0tMWXq1ywMz7MzBzxO+DhsufII6rZQTxTN7o3ZCq3Mc04cMIII2tyjc0AZT2UjKSgggjRoIIIIIIJLuuUpBBERlEECUaLZEc+SNcsz3UpJZ0Sh5IDhGUtgxujQb7oRhpJAAJJOAB1JRH3TfJS4fePwToW9smhNa3jBtelL1Vg/ejon8v1IAXcWPs+cT7hh1RZqe2MP3q2rYzHyBJUSW5Xj3c8J5kbzsAorQCsfZOy5KA1+oNZ0sfnFb6d0hH+J+B+CkLTfArhnZOSSa0VV7nbg95cKg8hP8DMD6qqs9T0YP3Z+ykMozO8lTy02u5XWpFNbLfV10zjtHTwukd9AFK2kOz1rq7hk12ZSafpnbl1a/MuPSNuT9cK2Nrp6e1QfZ7RQ0dtgAwI6SBsYx8hkoPa97+YnJPXPUrN3Os5HbQMx91Pi0oA5cVF2keBmgNPBktxhqNSVrce1VHkgB9I29fmVJcRENGyjpIoqSkZsyCnYI2NHwCcMeXHIOExWVNJSNInna13XlBy76LI29Rt2zmRxVnBXii4CPkAxjJRSSRRNDpHBoPTzPwC5m66zoIcx05BcM9Dk/XoPxXDao15T2+mdU3SvioondBze2/wCA6k/BRq+nzTu7WjJKll4aN9lIl0vsUJcyLc+PTP8AILgNca7stjonyXi5she9pEcLDzSOOPBo3+ZUK6z4zV1Wx9JpmB1Kw9aqZoMh/hb0H4lRZUPqqyodU1k0lRO85dJI4ucfmtvpXSJwH2dvZVFjVWs2j3KmPSnESeKuMlquD5G8xcYJsjIz5FTjo7iZa7lGynryIKg7YccZPoehVJxE9pEjHFjm7gg4IXR2XVlbShsVe37TEPvjZ4H6qfqXTEcwzFyEVbVg74ZAr8UUtPVxh1PM2TbcA7j4rJFP55VWdB8QamBjHW+4CoYz/ZOfh7fh4hTJpjirTVDWxXCPD/MkA/XoViLGly1ndrgrNrg8ZbupDkpopoHQzMbJG4Ycx4BafiCo51hwR0jfnPnoqd1qqnD36Y4Zn1YdvphSTZrzabowfZauJ0hH9248rx8itoIf3cpypPPXOYnEKNM1jhhwVQ9VcC9YWgufbu4vEI3Hc+xJ/ld1PwKja62y42yYwXKgqaORpwWzxOYfxC9Ce6B25BjxBWJc9O2u6U5hraOGaMjBZIwPb9CtTU6msx7TDuVZLQj5BwvPQt36hAtwrkaj4BaKuvPJT0H2GV3R1LIY/wDdOW/go51B2a7lFzPst6D2jcMqYN/8zCfyWgg6jrSbPy1Q3U5Bxuq+YPkgpHu/BbiBQud3drirWtPWmnaSfkcFcrdtH6qtef6Q05dKcDqTTOI+oCtGajVk+l4KYdDI3kLRIIOBa4tcC1w6gjBCCltcHDITaCaccOwnMjOPFNP9p2QNksJLgucHQI0hhPMlpISilsHsq0fY+0Nb6jT02sKqCOWrfVvggL2B3IxgGcZ6Ek9fRVaJwxXp7I1N3fBC0OwP62WolPzkI/RZ7qOVzKmGnGThTKDQZclSdIZOTl7x5b5cxwmTFkdAtjJD7OSuC1pxIsOl637HVHmlIOMuwCR16Alc1cyR7sblXrMk4AXViA49EkxHfYqGbrx3p/aFDS83lyxn83H9Fx964y3+tDxEBA0+L37Y+AwE6zTLEnDVIwQN1YysrKCjH9qrYoj5E5P0C5a98QNP20ECcSP8A44z8uqq7eOIcj3uNffiM59iFxOfTZcpW8Qo2OIoqJ8zv25nYHxwN1ZwdM2JeQmnWoY/qKsreuKNbWPMVAwtZ0w32R/NR3qXiLSU3M253YFw/wBhCeZx+Q/VQbddT6guWWyVjoojsY4RyDHy3K1bIiXZPX8Vf1elImbyFQptYa0YiCkG/wDFS51JMNkp/sUfTvpMOkPwHQfiuIq5q24VJqq6qmqZnHd8ji4lCGAYyQs2GABaWtRgrN7Ym4VNLZlmOXlY0NNsFlx06fjiwQslkY8QpuAo6wXU+3gmZqUcvurbd21JfCCNihhGMrQhk0Egkge+OQdHMOCF1Fh1zcqAtjuMQroh97PLJ9ehWrlp8uOeqxpKY77ZCiz04p24kblPw2JIjlpU36O1vZrk5kdNcxTzAj+oqHcjgfQn9CphsOsL7RBrftvfsH+zqBzgj0PX81SWSnz02IW705rDVOn3AUF1lMTekE57yP6Hp8lmrfS7HEugOCrWPVgRiUK+Nr4i0bvZulvnpd8d5EO9Z8dtx9F1Vpv9kuY/sNypZj+yJAHD5HdUs05x07vlivtkwejpqOT8eR36Fd5aOIWgr64ct1pY6h2PZqWmGQfM/wA1QS6ZdrfUzI9t1Ka+Cb6XYVsABjbogG+qgW13W6RRtfZdSVjYvBolE0fyByugpNd6qowO+bbbg399ronfUZCiiw1pw4YRmq/9pypaMbHe81rviExLQUsmeaBm/kMLi9O8RX1tYynuVmko2ucG99HKJIwT0z4hSAzBGcKVG5kgy1RnsczZwVd+1bw/tTdG1Oq6WPu6yhdGXOAGXRudykE+PUEZVUx5q+XaOg77g1qZuB7NA54/wua79FQhsmVsNBeTCRnhVdvZ2UZeOfOPDCSHkDGOqPLUgrQ9yhZXOs975JxNs95OJLeE6UmR2AvQHstw91wR040fepef/M95Xn4/xyvRTs4RCPg9pxmNhb4T9QT+qzXUm8LR7/0ptI4cV3zx7JJ8AqY9qPUH2G+zMbA2SeN7GxE9BzNLnZ81dGqGIHkeDT+Sob2sjnWMo8TUgY+ETf5rN6VA195jXKzMhZC5wUTT6mvM3u1AhHTEbcLX1NVW1JJqKqaT+J5wg2P0ynGRei6FHBGzgKjdYe/krHjiPUhPsgz91ZEcXTZZLIgOu6dwmdyseGDbGFlRxAdOqWwDHROsaBucpWEWcIRx77jZZAARMwUsDCCBSoxlPt6LHacFPscCNkfCIcpSCCCNLREA9U2+IEbJ1pAJynBghEURKwH0xP3R8ljS025OAtuWDGyacxp6jdFyhytJJS+OMJialGMAZ+S3r4Rg+PomZYfTBRYQC19uuF2tjxJbblW0bx0MMzmfkumt3FPX9vcD/TP2prejamJsn49VonQLHlg23CjS1YZfqaD+E82aRvBViOD/ABVq9TVlutlbQQ09W6vayd8IIZIwt9nY9N+vyVwKGTmooXHq6Np/BeeXAMOZruj5egq4D/vYXoRajm2U3/hj8lh9Qrx17hZGMAq3D3SQtLuVzPGaMT8MtRROGzrbU/8Apk/ovO6nkDmNG/Qbr0b4mtEmh7vGfvUVQP8AhPXm9Se634BXvTu/ePcf6VdcG4WYhnfCIIujlpVBXPN98Jz5ptBJDsJ3CEpHKcr0b7PGP+yTTmOn9G0//IvON4y1ejHZyeH8IdNkeNtg/wCUhZ3qH6Gff+lLqclSDVD+zS/wH8lQ7tXxlusC49HVMhH+RivnUjNM8AdWn8lRntdwGLUdJKRtJUTY/wArFSaQMX2fYqc8/IeoPhZ6ZWTHEMZ8E3B4LJHRb0KjARpQCSlA5KWgcpTcZ3ThTScj6IAhJwTwnouiWur0Vw21rq/lkslhqZKcnBqZR3cI/wATuvyypk0n2W62Tkk1LqSODO7oaCHnI9Od2B9AoFjUq0Bw926fbXe7hVwTrA4N6FXVs/Zz4Z0UYFRQ3C4vHV1RWOAP+FmAugp+DPDCmYGM0dbCB15w9x+pcq5/UNcbAJwU3lUOGcdCjV8peD3DCRpadGWsA/stc0/UFaG69nnhlWtd3Frq7e89HU1Y/b5OyEG9RQE4IKV+keFSsbnASxkNVj9V9mF0bXy6b1CTjpFXw9f8bOn0UQ6x4Z610nzvu1km+zt/+pp/62HH8TenzwrCDU685w126ZfA9vkuOaSeowjwi5sddkeR5hTvsmSCCiLR4JJZvnbKNxOdikkk9UaAykGJp3ITE8WG+fyWUm5/7tGlLquBUTjruDHRs0B/4gV/ra7lt0A8mBUV7OtP3+un7ZDO5d/xArx0kvLRxD9wLAa44C+77K8rjMDVq+Ir86PuY86Sf/0Xrzfo/cYPHC9FeIU4/wBEbq47BlFUE/8AkvXnRRe634D8la9MOz4h+yh3xjtWbnBR7HdJCJzgDhaoBVxwtAggNxlBNpeUl5PLsvQzsu1An4MabI8KBjfo54/Reebzsr4dj2tE/Bmzsz/dMmiP+GZ381n+ov8AA0+h/pS6e7ipslOY3DzBVM+2jT8lRZ5AzGamUH/y2q5HeAjOVUrtswFtutk43DK7BPxjP8ln9Kf/AO+M/dT5B8l6rNFs0ELIa7YdT6rGiOWp3vCANui6FuqEFPoDrskNdtupc4JcGrnraeK43GOemtRPMxoHK+ceefus9ep8FHtXI6rO+Q7J6KN0pw1cZobRV/1jXfZrRS5YHYkqH5EcZ9T5+g3VquE/Z8sFgZDXXyJt2rm4dzVLPYaf3Y+nzdlStovSFn0tboqS3UkMYibyt5G4a3+Efr1K6Npxv1WMu6tPay0HDf5VjHA2PhMUtLDTxsiija1rBhoAwAPQeCZvNzo7RSGprZmsZg4Hi7HkEnUF1prRa5rhUuDWRNJx4k+QVFuO/GC76yvNXarbWOhtbHlj3Md/ejPuj9381Dp05LUnZH+T6JxzgxvcVMfEbtN2y11clFZInVcrSWkQEEA+rzkfIA/FQ9eO0Jrqvmc+CGlpwTtzvfIcfUD8FFlst1Vca2OjoKWapqJThkUTC5zj6AKYtMdnHiNdqZs9VS0Noa7cNrJ/bx6tbkj5rTDTNOqt+duff/ii/qJnH4BgLV2vj/r2hmD5HUsuDnYvYfzx+Clnh/2oaWonjpdRUzqZx2L5HDkJ9HgbfMfNRvq7s8a5sdMZ++s9a1oLuWKrDXEDyD8ZUP1VK6N74pY+V7CWuHkRsUY07TrbT4I39kTrE7CO8ZC9NdN6ht2oKBlXbpxIwgEtzuM/9dVnz00FQxzJYw4OGD6rz34N8Ub1oS8Qwvq5H2suDS1xz3IJ3x5t8x81fPR+oaPUdhp7pSPBbI32gDnlKzt2k+o/tdx5FS2PbIMtUYcT+BGntQiWrtcAoK05PeU7Q3J/eb7rvwKrFrvQt+0fVujuVMX0vNysqo2nuz6HO7T6FegZkC0eqtP2zUFE+mr4I3h7S0lzA7IPgQeoS6mrT1CADlvokyVhJ9154uwiGM79FLvGXg7XaYlludlhkqKDJdJCMudEP2m+Jb6dR8FEO62tK7Fbj74yqyWJ0Rw5GcZ26JufeNLTc7gBhTE0VLHZTg73V9zeQDyxQAHyy8/yVvmS8kTW9cNCqp2QIg693iXH34W/QOP6qzVRPjLQcY2XNOoZcXnFaKmzMDVp+J1UI9Bagk/YttS7r/3RH6rz9oM92zPgAru8ba51Nwp1RIXf/bpGj/EWt/VUjpMBux8VfdJ/FC93qf6UHVNntCyx0RPx80jvNtgUecjota1VTitEz3SEaSzqUpIKW3hE7CuL2I7kZOHUlEXf3FdUNx4+0GP/AJqm7uhVk+xHc+7de7aXbtnhqGjPg5rmH8eVUuvszScfTClUTmbCt02XHRVy7alNz6RZMGjDKiOTp+8R/wC5T22pB2yoj7WFEK3hlNM0ZLWvz68uHD8isXp8uLUbvdXEjPluHsqVQ+4nQNkzCcjbopN7PnD5vELWv2Srdy2ygYKiswcF4zhrB8T19MrpE07YYjI/gLPRxl7u0Lquzvwcm1ZPDqG/Uzm2lruangeMCox9537gP1Porm2WhpbXRspqaNrGNAAw3HQYHRYlsp6W30cdLSQshhjYGNYxuAABgD4LLM/kud3r77kne47eQV5FCI2doWaZMlJL/wDrKw+/9UbpsjBKhF+E4Gqv/bH1zNarAyxUkvLNVkxbHcAjL3fIYH+JVBttJPV1cNJRwulqJntjiY0ZLnE4AUwdsWskn4nU1KSeWCk73HrI4kn6ALG7Jtop7nxeo56loc23QSVbQfF4w1p+rlttNDammmc8ndVk+Xz9gVkeA3CS36KtMNVWRMluz2gzzY3JxuGnwaOnrjJUvAtaegHwWD3rWjAPTZB0/wCSxktl0zy9xySrRseNlTTtW60u9w4hVWnWVMkFLStb3zWOI7wkZDT+6ARt559FDYwAG9VZftM8I73etTu1ZpijNc+aFraqljHtktGA9g8dsAjqor0dwc13f7g2GaxVtrpWuHfVNZEYw0eOAd3O8gFuNMt04qYIIGOfXKqrMcjpMYUcSxhwPQqzXY31nMY59NVUvMIOUR5P3HZ5foct+BC4HtKaNtukr1Yo7ZCIIZra1j2jxkjdylx9SMElavs1VMlPxdooGHH2qGRm3m0c4/FqTqBZe08yt+4/CFcGGfscr3unOMgpJnOeuVq3VYwTnrumn1e4XPnTjCuxFus64R09bAYaiMPafPw+CrDx24RvtX2nUunYHPpxmSrpY2+4PGRgHh5jw6qxbqrGcE/VNTVIe0skAc0jBB3BHknqWqPpyiRp+/uimreIwtKoMHg9EzKc7qUe0PoKm0fqCC52ktbarqXPjiB/uJRu5g9NwQoskOy6jTssswiVnBWbmidE/sKsL2O6Y/Z7nU4wHVJOf4WAf+5ThLOXFxyTkqK+yjSGk4fVdcRjna9+fV78fk1SKXDJ6rk3UljN1+PVajT2fKC4HtK15g4RXdnNj7Q+CAb9cyAn/lVSKcjuxjZWN7WdeIdE26gDhzVVx5iPNscZP5vVcafZjVu+kWdung+pKpdWdmcgeSeyjz6pKMLVB3kqlaTKNEjBwkI0FKXZYu5tnEx1NzYbXUb4wM/eYQ9v/KVFpW20NdTY9ZWi6g4EFXGXH90nB/AlQ78PjVnx+oKkVX9koK9CmVXsgg5zutBxap/6W4W3eMNDn07O8x+6fZd+BT1BVNlpI5Gv5mkeyfMeH4LPo42V4qrZKMx11O+nOfNzdlyStYLZGgrUvj+DK872B0b3Ru95ji0/IqQuBuvn6F1d3r5u6o65rYp3+DCDlrj6eB+K5bXFsks+rrlb5Wlr2TO2+e/45WgnA5ThdcfHHbrdj+HBZjJhlyPJelNjvcF0oWVVO9mCBzAHOD/LyPis0VRx5qmXZ84tyWGWHTt8nxSk8lLUPds3/u3ny8j4fBWrpblFWU7Z4Hnld4eIPkuZajUloS+G/jyPqtDA9k7ctXR/aj6IvtJWh+0u/aP1ShVH9oqB46e8JVa7Y9vlpuJlDXcp7qstbCw42yxxaR+S0fZnvTbNxNh5y1oqad0WSfVrsfQH6Kbu1Lpp2peG0N3pIy+usMrpXBo9p9O/3/8AKQD9VUikraq3V9PcKOTu6inkbJE4eBBXQ9Oc29pnhA+WFRTAw2e93C9HftzXMD2OBa7cY8kk1g/b/FRTwk4kWfVNhhbHI2KqY0Nmhed4neX8PkV33eg+S57Z8SvIYnjBCvow147m7rb/AG5w6PH1SX1r37vkL8D7zlqTJ9VyvELW9m0rYKmtrqtoc0FrY2uHNI4jZjfX8hlNQukneI4xklKc0MHcVCHaqv0V01nb6OI5NJSvLv8AG8kfgFp+zJQy1fGGgmYPYpKeeeQ+Q5MD8So9vV2q79eqy9VxBnqpOZzQdmgbBo9AMD5KxHZU08bZpy5arrIy2W5YpqMOG/dNOXP+Bdt8l0a6RpukmN3OMfkqhizPayOFOr6kEY9E2agnxwtY+qA+81MvqwOjh8lyx05K0jY1tHTj9oJitr4qaB007wGNH19Fq56xrGF7ngD8/RQFxy4qPl77Tdjmy/3aqoaQRGPFjSPvHxI6dAp2m0JtQmEbOPM+iankZXYXPWn46a+/0t1BHbqSTvKC3ufyuHQyHAOPQYwo6ne7ueu6xKNvK3qtnZKf7beaSlA5i+UZHnv0XW69eOjV7G8ALKyyOnl7neat7wUpf6L4R0TAN6tzWD4NG/45XRnxCabTttFktFmbgfY6RveAftu9opt9SAxzgcYGcriWqzGa27C19WPtjVb+1ddftWrLRaWnakpXSuGfvSO2/BoUTwj2AVvuLd0beuJV5rWSF8TJu4jP7rByj8loYD7AHRdq0iD9PSjj9AFkbr++ZxTiCIkBESVaYUPC07TkI02x2OqW05GUlAhHnbCalz4eCdSXgEdd0RRg4OVcPgnqH+mtB26Z7wZGxBjv4m+yc/QfVSBTVhilbIx2CwgjHoqvdmfUgo66tsM0mGvxPAPM9HD8irDNqXAgj8Fx/Xajqd14HB3H5WzpyiaEFQV2utNmg11FqKnb/ZbrEJgR0Djs4f5vzUHO33V1OKNih1pwsrqARh9wtgdU03mWH3gPzVL5o3RSOie3lewlpHkQt705dFmmGnlqz+pQ9kmSsWVuRjp4qXuDnGKt02+C036SSegHsRVBOXQjycPvNH1HwUTuGRuEy9uFb3KcVuPw5RkKHXsPhd3NV/bFfqK80jKmiqIpWPbkFjg4EeYI6rYGbb3lRTRGuL9pCpDrfUOfSl2XUzzlhPmP2T6hWK0Dxjst/bHT1kn2WrI3jkIDifQ9HfgfRc31XpmzVJfD8Tf5Wmq6jFNgO2KmNkzN2SNbJHI0skYdw5p2IPyVU+OvC+XSdwmu1mjdLY53FzQNzTE/dP7vkVZCG4QzsD4JWvb6HcfJHJO2WN0c8bJ4HDD4pG8zXDy3VbpOsT6ZNnkHkJ+1TbaZgqjdtuFwtNYKy21clPO37zD19D5j4qStPce9U2ylEFVRU1Zjbm5iwn5bj6KTNWcDtH3176qwXR2nqx5J7iZhkpifTG7Qo8r+znxIjeTQ01sukZ6SUtczB+TsFdAbe0rVWfMwT6HlUBht1T2tylXTtCaoq6Z0FHbqSkc4Y53Oc8j5bKM73eLtqCv+23atkqpfDm2a30DRsFJFF2duJj5sVluoKBnjJUV0YaPoSV3ulOBWl7K5tVqi+C+VDdxRULSyAHyc87u+SMW9K0xuY8A+3KMMuWfhOVG3B/hzWayuDampbJS2WB39oqMY58fcYfEnxPgrPiWnpKaGhoomQ0lNG2KCNnRrQMALXd/FDTx0tJTRUdJCOWKCFoaxg8sJmSoYxvPI5rWnYEnqVg9Z1iXUpccNHAV9UpNrNyeVsn1HNk5WJXXCGkgM1RK2NgBJLiBsOp38PVcNrTiZYNOxmN9Q2eqA2hiIc/8Ak35/RQFrviBfNWyuhnkNNQZ2p43e95c5+9+XopOldNWbZDpB2t9Um1qMUA+E5K77i1xdfXNksumZi2M5bNWtPUeIj/8Al9FEFOzffck5KahixjbCz4I8DJC6VR0+GlGI4hgf7WXsWn2HdzynY9gPBSh2aNN/09xKp6ioZmjoAaickbAM33+eAoveCAcDJ8ArUcFbGNI8KRWzN5blfnfAthB/IlQOo7grUzjkp/T4fElyuzuVxNZXz1JdjvHkj4eH4LmNe3xtk0ncboZAHQwuLAT1djYfVZYmyd9yoh7S1/DLXQ6eheC+of304z0YOn1P5Llui0XXb7GkbZyVqLcorwFyhGF75ZHSyHL3uLnH1JyszfGFiUzSB8AssdF28N2wFiM53KNBBBLQWiS2uwOiQjHRIafJBOg5CQ9uBkI2E5wjOUZOEngrM0xdpbDqKiu0Wc08oc9o+837w+Yyrg2i4w19vp62mk54J42vjdnqCMhUseOqnfs46obWW2fTFXMftFKDJS8x96PxA+B3+BWQ6r079RXE7Buz/Su9Is9knhu4KnSzXJ1vuEdV7zM8r2Ho5h2I+irn2ktDjSusH19A0m1XD+ugeB7O++P0+SnQS7gHwWTfbJR660VVaWrADVxNdNQSEbjxLR+ayWhaj+isAk/Cdire/VEzMjlUuSHgeS2N/tVXZbvUWuugMU8Dy1wI/FYBXWGPD2hw4WPky04Kx3twcJOCDkHBCfIBRcowlkJPcuj03xB1VYnMEFxfPCzYRzkvAHoeo+qkvTfHuINEd9tUrSNjJAQ4H8iPxUGlp6YKT3Z8lVW9HpW/8rBn22KnR6hPF9JVqLZxY0TXgc13jpSfuzBzcfMhb2n1jph28WprcM+VS0fqFTsR79Ah3Y/ZH0VJJ0fTJyx7gprdblP1NCuJUat0y0c82qraAPOpaf1Wmr+JuhKFhzqKKpI+5Tsc/P4KqvdDyH0ShHtjwQZ0hUz8T3FB2ty/taAp3v3Ha2RhzLNaJ6h3QPndyN+ONyo01PxK1bfi5r640cLtjHTZbkeruq5QRgJbWDPRXdPRKVTeNm/vuVCl1GeXYlMtDnOL3ElxOSSeqyYmDYkJccfRPMb4NCtQFDLsnJS4o8Y8VkNOAkt2b8k7Q0tRX1sNFRxmWeZwaxo8z+iJzg0ZcdkYb3HAXb8EdGy601rT0z2ltHTuElRJ4NaNzn/ryVi9S18VZc8UoDKOmYIKZjejY27DH5rWaQsFPw+0JFaIiP6XuLA+reNixh35T6lNg7dd1yfqDUzdnIafhC1um1PCYC5O97GyN8z3hrI2lznHoAPFVU17fTqbV9ddQXdyX93A0+Ebdh9evzUy8fNSGyaYZaKWTlrbmC1wBw5kI94+men1VfoRjC0vSGm+DCbDhu7j7Kt1m13OEQ8llR7DHinwsdHzHzK2pCog7Cfe7lbnCIPy3OEz7R8ylDZo32yiKMHJWpR5SchGN0nhEDlKa7BSwchNIwfBKBygRlB3VZdhu9ZYb1SXegeWT00ge3yPmD6EZCw0mTBGE29ocCCNilNcWnIVv9P3ij1BYqS+W92YalmXN8Y3j3mH1H5YW2p55IZGTQvMcjCHNcPAqt3AzXQ0ve3Wu6Sf6lr3gSk79w/oJB+R9FZF8PI7YhzTu0tOQ4HoQfEYXKdc0p2nznH0nhbHT7QsR78rmOO+g4db2H/Six07WXikbiogb1k//vUKrbg9sjmSNLXgkOBGCCOoKupbauShqO8YMtcMPYejwoo49cMxV97q/TUBfkc9bTsG583tHn5hXvTWuAAVpz9j/SrdT07PzGBQEPIhAjZBwOUY6LeZWf7cHCTy+uEfJ6pSCGEYA4SeT1Q5QljHmh7Pqi4QwEjlCU1u2wS8IwlYJQyktaPEJYAyggOqWAAiKcS43YykA5GUObAKI8JI5TwdgbnxVi+AOgY7DbDrPUdPioe3+x07huM7g481y3AThn/SU8WqdRQFtDEQ+lgeP70+EhH7I8PNThdJX1krQdombRNG2AsD1PrzWg1YTv5rQ6ZQOfEeFqa6aeuqZKmd5fJIcknqsWuqaS0Wqpu9xkEVJSM7yRx8ceA9Sdgtu2lORytyTsBlVz7QOu2Xq6jTNoqA+10L8yysO1RN0J9Wt6D4ZWY0TTH6jY7f2jkq2u2m148+a4TWmo6vVOp6u81W3fvxFHnaOMe60fJYMbVjwsAKymnC7BDE2Noa0bBYt7i8lx5TvgiRc49UC4BPJvCUDhE5/h4JtBDCVha1Kb0SUE2mwcJaMdUSCLhOox0SSMo0ECUE25uxIU8dn7iMyeKDR1/nDXt9m21D3bf+E4n/AHfooIc1E0uY8OaSC05BB3Cg6hQivQmKTz/gp+tadXkDgr0GmJGS3GDg+iyKTMDiBnu3e8FEnAvinHf6eLT1/lAu8YDIZnHH2tg8Cf8A8g/3viplZHG9oczdp6Fce1KjY02bw5B9j6rZwTssxhwUD8beFYBm1Lpeny05kq6Jg3HnIweXm1QWQR5hXu7oeH0UMcYOEcVydNe9OsbBW+9LTYwyX1HkfwWz6e6oa8CC0d/I/wDVS6jpjt5IlXfJx6oA7lO1lPPRVMlPVQSQzRnlex4wWnyKZB3W9BBGQs6QWu32SkEEEE6nCQAgm0pvTqlByLCWhskg+bgUqJsk0rYoWOkkccMa0ZLj6BG5waMlJG5wEMkYGymPgrwqfdZIdQakgLbeCH09K8EOn8nO8menj8FsuDvCRznQ3zU0Ie8EGno3D2QfN3n8Oin2GmDGNbsANsBYHqHqlsQMFU5dwT6K90/TCcPkCxpB7DIohyRtAADRgbdNvAeibMHK0uO+FnzRhrDISGtbuSVEfHDijFpKjdbbU9kt7mZ/Vg7ilaf9o79/yb4dVg6FGxqc/ZGN/Mq9llbWj73cLT9oDiS2x0s2lrHN/rSobirmad6aMj3Bj758fIKuELd8u3J80ckk1VVSVNRI6SWVxc97jkuJ6knzTrAPALs2labFp8Ahj8uT6lY65adYk7nJ6NoAylomjDcI1ahRkEEEEaCCCbMg6YKBcSdshEThAbrBHRBJB26Ic3okYTOEvJ80YOySgiSg7CWgkt6pSJLBygmng56p1AgEboIEJqJ74pGyRPcx7TlrgcEHzVjeCnGJtwMNj1HM2O4EBkdS9waypx0Dj0bJ69HeO6rmcYOyR0dzAkH0UHUtMg1CExyj8+ikVLb67stXoPTSR1MQlhPMM4O24PkR4FLki5hh3RVa4Q8Zq2zSRWzUUzp6cYZHVOyXNHg1/wC0PI9R6qzFivdvvNJHPRzxu528waHg7eYI6hcf1fQ7OlSZxlvkVsKtyOy3I5XD8TOF1r1VE6ogibT3BrfYezbPp/8AoqtGrtHXvTVXJDX0zzG1xHetacfPyV4CMrCvFptl3pnU90o2VDCMB3R7Pgf0OysdF6snp4jm+Jqj3NMjsZcNiqG52G6LJ81YHiDwEnLpK/S8oqY93GGNuHt+LP8A4qFL3p272eZ0dbRyM5TguAOP5j5rptHVqtxoMbt/RZuxSmhO42Wq5kYd6LYWqxXW5ytZR0kjwTjmIw36qYuH3AquqnQ1moc0sDvaAkaQXD91nU/PAR3tVq02kyOCTXqTTHYbKJ9LaZvGo61sFupHua88veEHlH8z8FZPhVwhoNPNZXXFjKivxuT93+XwCkDTen7Pp+jbS2qkZEGjDpHDL3foB6Bbhj2tGG4+S5nrXV01rMcGzf5WkqaZHB8TtyhBTxQxcoA+XghPJFTxGSV4a0eJ/JYd5vFDbKYzVMjchpcGZ3OPyHr0Vb+L/GuorJJbbpqXlIy11Ww+yweUfmf3z8lUaVolnVJNth5lS7NuOs3JXW8b+MFPY2zWexlk11Ps5yHNpf3neb/JvRviqw1VRVVtXLV1k8k88ri+SR7sucT4kptz3zPL3uL3E5LicklOsYuv6XpcGnQiOIb+Z8yslbuvsu7ncI42klPAY6ImbJStMKKN90sEY6hBzsYwU1zeiHN6JWSiyEsuJQBI8Ujm9EOb0Rbo+4I8BGk83ojJ9ESHcFgIIIJSbSgUaQDhKByESSQjRg7okESLKVkI0hLHREnGuyicNuibIwnUTuiMFAhMkLp9C67vekqtv2Sd0lLzZdA55AHq0/dPw+a5ojdJIyE3NCyVhY8ZBS4pnRkOaVb/AId8XLHqGnZDUVHdVONw73m/EePxCkmGoZLEJInskYRlrmnII+K8+I5JYJWSwSPje05a5pwQfipQ4e8Y71p+RsVw5qmDYFw3J/iHQ/HYrnusdFB2ZKZ39Fo6msg/DKrdhxGHDZwOQRsQsa7UNsvEfJerTS3DHSR4LJR/jbg/VcborinpjUkbG/aW08rve8h8R1CkGmiiqIxLBNHLEej2OyD9FhHxXdPkw4FpCuAYphkbrXWi1WOzM/1NZaSjef8AauHeyD4Od0+SyXOe95ke5z3ncknJKypoY4IzLK9jIx1c93KB8yuH1hxJ0tp6Bzn1jJXjb3sNz+Z+QQEd3UXgAFxQ+TCM8LrjJyxl7iGtG5JOwXA6+4oWPTNI8/amvlOeXG5P8I8fj0UHcQ+Nl3vUjqe1ZggGwe9uBjzDf1OSooq6qqrql1TVzyTyv9573Ekrb6R0RjEtw/hVFzWWjaJdhxB4j3vVs0kT5pKeic7+7D8l/wDGfH4dAuMa3J6lBjU60YC6JDXjgYI4xgBZ6SZ8ru55QY3CyGDKQ1m26WzbZP4wmtkeDlKQSeYoJWzUZGyLBz02Q5ihzIJJwUWD5IEI+YocyNFsiQR5afFFt4IIiMLCQQQRIIIIvFGgDlBG1KSAcIwd0MJJCUgggiwiQRt6okAcIkAUtIc0ZKPmQ5kAlEgpshJePJOkZSSNkeMoByTTyTU8rZYZHxyNOWuY7BC7rTPFvWFgw2KtMzfEuJDj8x+uVwuElzcqNPVinHbK0Ee6fjnez6ThSHqnjDq2/wAZjkqGwt8wS531Ow+QXAVFRPVSulqZpJpHdXPcSfxTYYlgIV6sMA7YmgBKlsPk3ccpDWpbRnYJbGDG+6WAApAKY5RAYCdj6JtLa4AdEYRnhOIJHOPIoi8EYwUrIScJzwRJPOMYwURdnoj2R4S0aayUC4+aBCGE4iyeuEjnKHO70Sc4QwnERIBSec+iS4klHxyhhf/Z';
  const PAY_SERVER = 'https://asia-south1-netrax-mainapp.cloudfunctions.net/netraPay';
  const PAY_LIVE = true; // live Razorpay keys are set: every visitor can subscribe
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
  const perMonth = (key) => (PLAN_MONTHS[key] > 1 && prices[key]
    ? 'about ' + rupees(Math.round(prices[key] / PLAN_MONTHS[key] / 100) * 100) + ' a month' : '');
  const showPrice = (key) => {
    if (!prices[key]) return;
    const price = document.querySelector(`[data-card-price="${key}"]`);
    const per = document.querySelector(`[data-card-per="${key}"]`);
    if (price) price.textContent = rupees(prices[key]);
    if (per) per.textContent = perMonth(key);
  };
  Object.keys(prices).forEach(showPrice);

  /* Plan details: each plan card opens a dialog with its price, details and the Subscribe button. */
  const planDialog = document.getElementById('plan-dialog');
  const planSubscribe = document.getElementById('plan-subscribe');
  let planCard = null;
  let planHandingOff = false;
  document.querySelectorAll('[data-plan-open]').forEach((card) => {
    card.addEventListener('click', () => {
      const key = card.dataset.planOpen;
      const name = card.dataset.planName;
      planCard = card;
      document.getElementById('plan-title').textContent = name + ' plan';
      document.getElementById('plan-price').textContent = prices[key]
        ? rupees(prices[key]) + ' for ' + name + (perMonth(key) ? ', ' + perMonth(key) : '') + '. Paid once.'
        : 'Paid once.';
      planSubscribe.dataset.plan = name;
      planSubscribe.dataset.planKey = key;
      planSubscribe.textContent = 'Subscribe to ' + name;
      planDialog.showModal();
      document.getElementById('plan-title').focus();
    });
  });
  planDialog.addEventListener('click', (e) => {
    if (e.target.closest('[data-plan-close]') || e.target === planDialog) planDialog.close();
  });
  planDialog.addEventListener('close', () => {
    if (planCard && !planHandingOff) planCard.focus();
    planHandingOff = false;
  });
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

  const openPay = (button, opener = button) => {
    payPlan = { key: button.dataset.planKey, label: button.dataset.plan };
    payOpener = opener;
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
        image: CHECKOUT_LOGO,
        prefill: { email: order.email },
        readonly: { email: true },
        notes: { email: order.email },
        theme: { color: '#15161A', backdrop_color: '#101114' },
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
      let opener = button;
      if (planDialog.open && planDialog.contains(button)) {
        planHandingOff = true;
        planDialog.close();
        opener = planCard;
      }
      if (PAY_API || DEMO) { openPay(button, opener); return; }
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
