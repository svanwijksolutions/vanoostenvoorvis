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
  initScrollMotion();
  initScrollProgress();
  initHeroParallax();
}

function initScrollMotion() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !('IntersectionObserver' in window)) return;

  document.body.classList.add('js-motion');

  const items = document.querySelectorAll('.scroll-in');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  items.forEach((item) => observer.observe(item));

  // Vangnet: forceer zichtbaarheid als de observer om wat voor reden dan ook iets mist.
  setTimeout(() => {
    document.querySelectorAll('.scroll-in:not(.in-view)').forEach((item) => item.classList.add('in-view'));
  }, 4000);
}

function initScrollProgress() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);

  const onScroll = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    bar.style.width = progress + '%';
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initHeroParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const img = document.querySelector('.hero-photo-card img');
  if (!img) return;

  const onScroll = () => {
    const rect = img.parentElement.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const offset = rect.top * 0.08;
    img.style.transform = `translateY(${offset}px) scale(1.08)`;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
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
