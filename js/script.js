if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  loadComponent('header-placeholder', 'components/header.html', initHeader);
  loadComponent('footer-placeholder', 'components/footer.html', initFooter);
  initContactForm();
  initCounters();
}

function initFab() {
  const fab = document.querySelector('.rfab');
  if (!fab) return;
  const main = fab.querySelector('.rfab-main');
  const items = fab.querySelectorAll('.rfab-item');

  function setOpen(open) {
    fab.classList.toggle('rfab--open', open);
    main.setAttribute('aria-expanded', String(open));
    items.forEach((item) => item.setAttribute('tabindex', open ? '0' : '-1'));
  }

  main.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!fab.classList.contains('rfab--open'));
  });

  items.forEach((item) => {
    item.addEventListener('click', () => {
      const link = item.getAttribute('data-rfab-link');
      if (!link) return;
      if (item.getAttribute('data-rfab-blank') === 'true') {
        window.open(link, '_blank', 'noopener');
      } else {
        window.location.href = link;
      }
      setOpen(false);
    });
  });

  document.addEventListener('click', (e) => {
    if (!fab.contains(e.target)) setOpen(false);
  });
  fab.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
}

function loadComponent(id, url, callback) {
  const el = document.getElementById(id);
  if (!el) return;
  fetch(url)
    .then((res) => res.text())
    .then((html) => {
      el.innerHTML = html;
      if (callback) callback();
    })
    .catch(() => {});
}

function initHeader() {
  const toggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const menuLinks = document.querySelectorAll('.mobile-menu a');

  function openMenu() {
    mobileMenu.classList.add('open');
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    toggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  menuLinks.forEach((link) => link.addEventListener('click', closeMenu));

  const current = document.body.getAttribute('data-page');
  if (current) {
    document.querySelectorAll('[data-nav="' + current + '"]').forEach((link) => {
      link.setAttribute('aria-current', 'page');
    });
  }

  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
}

function initFooter() {
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  initFab();
}

function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  counters.forEach((el) => {
    const target = parseFloat(el.getAttribute('data-counter'));
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = target;
    } else {
      requestAnimationFrame(tick);
    }
  });
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('form-status');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const naam = form.naam.value.trim();
    const email = form.email.value.trim();
    const ophaaldatum = form.ophaaldatum ? form.ophaaldatum.value.trim() : '';
    const bericht = form.bericht.value.trim();

    const subject = 'Bestelling via website van ' + naam;
    const bodyLines = [
      'Naam: ' + naam,
      'E-mail: ' + email,
      ophaaldatum ? 'Gewenste ophaaldatum: ' + ophaaldatum : null,
      '',
      bericht,
    ].filter((line) => line !== null);

    const mailto =
      'mailto:info@vanoostenvoorvis.nl?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(bodyLines.join('\n'));

    window.location.href = mailto;

    if (status) {
      status.textContent = 'Uw e-mailprogramma opent zo met een vooraf ingevuld bericht aan de winkel.';
      status.classList.add('visible');
    }
  });
}
