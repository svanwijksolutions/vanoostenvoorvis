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
  initIconDraw();
  initScrollMotion();
  initCookieNotice();
}

// Zelftekenende iconen die direct bij laden tekenen (.icon-draw, geen scroll-trigger).
// Zelfde fix als de .icon-draw-slow-iconen: Chromium past stroke-dasharray/
// stroke-dashoffset niet toe op inhoud die via <use href="sprite.svg#icon-x">
// verwezen wordt (het is geen "echt" kind-element in de lichte DOM), waardoor de
// animatie eerder onzichtbaar bleef. Losgetrokken: de paden staan nu inline in de
// HTML (geen <use> meer) en de werkelijke padlengte wordt hier per icoon opgehaald.
function initIconDraw() {
  document.querySelectorAll('.icon-draw path, .icon-draw circle, .icon-draw rect').forEach((el) => {
    if (typeof el.getTotalLength !== 'function') return;
    const length = el.getTotalLength();
    el.style.strokeDasharray = String(length);
    el.style.strokeDashoffset = String(length);
  });
}

function initCookieNotice() {
  try {
    if (localStorage.getItem('cookieConsent') === 'true') return;
  } catch (err) {
    return;
  }
  const banner = document.createElement('div');
  banner.className = 'cookie-notice';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookiemelding');
  banner.innerHTML =
    '<p>Deze website gebruikt alleen functionele cookies, nodig om de site goed te laten werken. Meer weten? Lees onze <a href="privacy.html">privacyverklaring</a>.</p>' +
    '<button type="button" class="btn btn-primary cookie-accept">Accepteren</button>';
  document.body.appendChild(banner);
  banner.querySelector('.cookie-accept').addEventListener('click', () => {
    try {
      localStorage.setItem('cookieConsent', 'true');
    } catch (err) {
      // localStorage niet beschikbaar, banner sluit toch
    }
    banner.remove();
  });
}

function initScrollMotion() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !('IntersectionObserver' in window)) return;

  document.body.classList.add('js-motion');

  // Zelftekenende USP-iconen: stroke-dasharray/dashoffset exact instellen op de
  // werkelijke padlengte van elk lijnstukje (i.p.v. één vaste schatting), zodat de
  // 6-seconden-animatie evenredig over de hele lijn loopt, ook bij korte en lange
  // stukjes lijn binnen hetzelfde icoon.
  document.querySelectorAll('.icon-draw-slow path, .icon-draw-slow circle, .icon-draw-slow rect').forEach((el) => {
    if (typeof el.getTotalLength !== 'function') return;
    const length = el.getTotalLength();
    el.style.strokeDasharray = String(length);
    el.style.strokeDashoffset = String(length);
  });

  // .scroll-in = bestaande fade/translate-reveal voor kaarten/blokken.
  // .icon-draw-slow = zelftekenende USP-iconen (RULES.md "Bewegende elementen"),
  // beide gebruiken dezelfde veilige observer + vangnet-timeout hieronder.
  const items = document.querySelectorAll('.scroll-in, .icon-draw-slow');
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
    document.querySelectorAll('.scroll-in:not(.in-view), .icon-draw-slow:not(.in-view)').forEach((item) => item.classList.add('in-view'));
  }, 4000);
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
  let lockedScrollY = 0;

  // Bugfix Sem 27-07-2026 ("het menu doet gek als ik naar beneden scroll"):
  // body.menu-open { overflow: hidden } alleen is op mobiel (vooral iOS
  // Safari) niet altijd genoeg om te voorkomen dat de pagina onder het
  // geopende menu meeschuift. Body op position: fixed zetten tijdens het
  // openstaan van het menu is de standaard, betrouwbare oplossing: de
  // scrollpositie wordt hier bewaard en bij het sluiten weer exact
  // teruggezet, zodat de bezoeker niet naar de bovenkant van de pagina
  // springt.
  function openMenu() {
    lockedScrollY = window.scrollY;
    mobileMenu.classList.add('open');
    document.body.classList.add('menu-open');
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + lockedScrollY + 'px';
    document.body.style.width = '100%';
    toggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    document.body.classList.remove('menu-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, lockedScrollY);
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

  initNavDropdown();
  initMobileAccordion();
}

// Desktop "Aanbod"-dropdown: opent bij hover/focus, sluit bij het verlaten van
// het menu of bij Escape, volledig toetsenbord-navigeerbaar (RULES.md
// "Navigatie"). Een korte sluit-vertraging voorkomt dat de kleine ruimte
// tussen link en menu de hover per ongeluk breekt.
function initNavDropdown() {
  const dropdown = document.querySelector('.nav-dropdown');
  if (!dropdown) return;
  const toggle = dropdown.querySelector('.nav-dropdown-toggle');
  const menu = dropdown.querySelector('.nav-dropdown-menu');
  if (!toggle || !menu) return;

  let closeTimer = null;

  function open() {
    clearTimeout(closeTimer);
    dropdown.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  }
  function close() {
    dropdown.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(close, 200);
  }

  dropdown.addEventListener('mouseenter', open);
  dropdown.addEventListener('mouseleave', scheduleClose);
  dropdown.addEventListener('focusin', open);
  dropdown.addEventListener('focusout', (e) => {
    if (!dropdown.contains(e.relatedTarget)) close();
  });
  dropdown.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dropdown.classList.contains('open')) {
      close();
      toggle.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) close();
  });
}

// Mobiel: "Aanbod" klapt accordion-stijl uit binnen het mobiele menu, geen
// apart flyout-patroon (RULES.md "Navigatie"). Gecollapste links krijgen
// tabindex -1 zodat toetsenbordgebruikers niet door onzichtbare links tabben.
function initMobileAccordion() {
  const item = document.querySelector('.mobile-nav-item');
  if (!item) return;
  const toggle = item.querySelector('.mobile-accordion-toggle');
  const list = item.querySelector('.mobile-accordion-list');
  if (!toggle || !list) return;
  const links = list.querySelectorAll('a');

  function setOpen(isOpen) {
    item.classList.toggle('accordion-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    links.forEach((link) => {
      if (isOpen) link.removeAttribute('tabindex');
      else link.setAttribute('tabindex', '-1');
    });
  }

  setOpen(false);
  toggle.addEventListener('click', () => {
    setOpen(!item.classList.contains('accordion-open'));
  });
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

    // Honeypot: onzichtbaar voor mensen, alleen bots vullen dit in. Stil negeren.
    if (form.website && form.website.value.trim() !== '') return;

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
