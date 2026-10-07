(() => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');

  // Solid header once the page scrolls past the top of the hero
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  const setMenu = (open) => {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Fade sections in as they scroll into view
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => revealer.observe(el));

  // Highlight the nav link for the section currently in view
  const navLinks = new Map([...nav.querySelectorAll('ul a')].map((a) => [a.hash.slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => navLinks.get(entry.target.id)?.classList.toggle('is-active', entry.isIntersecting));
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((_, id) => { const section = document.getElementById(id); if (section) spy.observe(section); });

  document.getElementById('year').textContent = new Date().getFullYear();

  // Contact form: one form for quotes, driver applications and general questions
  const form = document.getElementById('contact-form');
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('button[type="submit"]');
  const MODES = {
    quote: { button: 'Request a Quote', subject: 'New freight quote request' },
    driver: { button: 'Send Application', subject: 'New driver application' },
    general: { button: 'Send Message', subject: 'New message' },
  };
  const LABELS = {
    inquiry: 'Inquiry', name: 'Name', company: 'Company', email: 'Email', phone: 'Phone',
    origin: 'Pickup', destination: 'Delivery', equipment: 'Equipment', pickup_date: 'Pickup date',
    commodity: 'Commodity & weight', cdl_experience: 'CDL-A experience',
    trailer_experience: 'Trailer experience', message: 'Message',
  };
  const EMAIL = 'contact@ymdlanes.com';

  const setMode = (mode) => {
    form.querySelectorAll('.mode-fields').forEach((fieldset) => {
      const active = fieldset.dataset.mode === mode;
      fieldset.hidden = !active;
      fieldset.disabled = !active; // disabled fields are skipped by validation and submission
    });
    form.querySelectorAll('[data-show]').forEach((el) => { el.hidden = !el.dataset.show.split(' ').includes(mode); });
    form.querySelector(`input[name="inquiry"][data-mode="${mode}"]`).checked = true;
    submit.querySelector('.btn-label').textContent = MODES[mode].button;
    form.elements._subject.value = `${MODES[mode].subject}: ymdlanes.com`;
  };
  const currentMode = () => form.querySelector('input[name="inquiry"]:checked').dataset.mode;

  setMode(currentMode());
  form.addEventListener('change', (e) => { if (e.target.name === 'inquiry') setMode(e.target.dataset.mode); });
  document.querySelectorAll('a[data-inquiry]').forEach((a) => {
    a.addEventListener('click', () => setMode(a.dataset.inquiry));
  });

  const setStatus = (text, kind = '') => {
    status.textContent = text;
    status.className = `form-status${kind ? ` is-${kind}` : ''}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    if (data.get('_gotcha')) return; // honeypot filled: almost certainly a bot

    // Formspree isn't configured yet, so hand the message to the visitor's email app instead
    if (form.action.includes('YOUR_FORM_ID')) {
      const body = [...data]
        .filter(([key, value]) => !key.startsWith('_') && value)
        .map(([key, value]) => `${LABELS[key] || key}: ${value}`)
        .join('\n');
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(form.elements._subject.value)}&body=${encodeURIComponent(body)}`;
      setStatus(`Opening your email app… If nothing happens, email us at ${EMAIL}.`);
      return;
    }

    submit.disabled = true;
    setStatus('Sending…');
    try {
      const res = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const mode = currentMode();
      form.reset();
      setMode(mode);
      setStatus("Thanks! Your message is on its way and we'll be in touch soon.", 'success');
    } catch {
      setStatus(`Something went wrong sending that. Please email us directly at ${EMAIL}.`, 'error');
    } finally {
      submit.disabled = false;
    }
  });
})();
