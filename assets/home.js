/* Functional layer for the FedEx-style homepage. */
(function () {
  'use strict';

  var TRACK_URL = 'tracking-user.html';
  var CHAT_URL = 'tracking-user.html?chat=1';
  var ADMIN_URL = 'admin-portal.html';

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setHref(selector, href) {
    $all(selector).forEach(function (link) {
      link.setAttribute('href', href);
      link.removeAttribute('target');
    });
  }

  var toastTimer = null;
  function toast(message) {
    var el = document.getElementById('clone-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'clone-toast';
      el.className = 'clone-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      el.classList.remove('is-visible');
    }, 3400);
  }

  function normaliseCode(value) {
    return String(value || '').replace(/\s+/g, '').trim();
  }

  function goTrack(value) {
    var code = normaliseCode(value);
    if (!code) {
      toast('Enter a tracking number to continue.');
      return false;
    }
    window.location.assign(TRACK_URL + '?code=' + encodeURIComponent(code));
    return true;
  }

  /* Tracking forms (header menu + hero) */
  $all('#PageTrackingModule-large, #HeaderTrackingModule').forEach(function (form) {
    form.noValidate = true;
    var input = $('input[name="trackingNumber"]', form) || $('#trackingModuleTrackingNum', form);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!input) {
        toast('Enter a tracking number to continue.');
        return;
      }
      if (goTrack(input.value)) {
        input.blur();
      } else {
        input.focus();
        input.classList.add('clone-js-focus');
        window.setTimeout(function () { input.classList.remove('clone-js-focus'); }, 1800);
      }
    });
    if (input) {
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      });
    }
  });

  /* Header search box: treat a search as a tracking lookup in this demo */
  var searchForm = document.getElementById('fxg-search-header');
  var searchInput = document.getElementById('fxg-search-text');
  if (searchForm) {
    searchForm.noValidate = true;
    searchForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!goTrack(searchInput && searchInput.value)) {
        if (searchInput) searchInput.focus();
      }
    });
  }
  var searchIcon = document.getElementById('fxg-search-icon');
  if (searchIcon) {
    searchIcon.addEventListener('click', function (event) {
      event.preventDefault();
      var wrap = searchIcon.closest('.fxg-search');
      if (wrap) wrap.classList.add('clone-search-open');
      if (searchInput) {
        searchInput.focus();
        if (searchInput.value) {
          goTrack(searchInput.value);
        } else {
          toast('Type a tracking number, then press Enter.');
        }
      }
    });
  }

  /* The visible magnifier wrapper has no id in the original markup. */
  $all('.fxg-user-options__search-btn > a').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      var heroForm = document.getElementById('PageTrackingModule-large');
      var heroInput = heroForm && heroForm.querySelector('input[name="trackingNumber"]');
      if (heroInput) {
        heroInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(function () { heroInput.focus(); }, 340);
        toast('Search by tracking number using the field above.');
      } else if (searchInput) {
        searchInput.focus();
        toast('Type a tracking number, then press Enter.');
      }
    });
  });

  /* Make the main FedEx navigation point at the working clone pages */
  setHref('.fxg-header__logo_wrapper', 'index.html');
  setHref('#fxg-dropdown-signIn', TRACK_URL);
  setHref('a[data-analytics="hdr|tab|2|Tracking"]', TRACK_URL);
  setHref('a[data-analytics="hdr|tab|5|Support"]', CHAT_URL);
  setHref('a[data-analytics="hdr|Sign Up or Log In|link|SIGN UP / LOG IN"]', TRACK_URL);
  setHref('a[data-analytics="hdr|Sign Up or Log In|link|Administrative tools"]', ADMIN_URL);
  setHref('a[data-analytics*="|Tracking|link|"]', TRACK_URL);
  setHref('a[data-analytics="hdr|Support|link|Customer Support"]', CHAT_URL);
  setHref('a[data-analytics="hdr|Support|link|Frequently Asked Questions"]', CHAT_URL);

  /* Keep the sign-in dropdown inside the clone. */
  $all('a[data-analytics*="hdr|Sign Up or Log In|link|"]').forEach(function (link) {
    if (link.getAttribute('href') === ADMIN_URL || link.getAttribute('href') === TRACK_URL) return;
    link.setAttribute('href', TRACK_URL);
    link.removeAttribute('target');
  });

  /* The top-level Shipping / Design & Print / Locations menus have no clone pages.
     Keep their hover menus available but stop a reload when clicked. */
  ['hdr|tab|1|Shipping', 'hdr|tab|3|design & print', 'hdr|tab|4|Locations'].forEach(function (key) {
    $all('a[data-analytics="' + key + '"]').forEach(function (link) {
      link.setAttribute('href', '#');
      link.addEventListener('click', function (event) {
        event.preventDefault();
      });
    });
  });

  /* Hero cubes: track focuses the field; other options explain this demo. */
  $all('.fxg-cube').forEach(function (cube) {
    var label = (cube.textContent || '').replace(/\s+/g, ' ').trim().toUpperCase();
    cube.addEventListener('click', function (event) {
      if (label.indexOf('TRACK') !== -1) {
        event.preventDefault();
        var heroForm = document.getElementById('PageTrackingModule-large');
        var heroInput = heroForm && heroForm.querySelector('input[name="trackingNumber"]');
        if (heroInput) {
          heroInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          window.setTimeout(function () { heroInput.focus(); }, 340);
        }
      } else {
        event.preventDefault();
        toast('This homepage is focused on tracking. Use the Track page to follow a shipment.');
      }
    });
  });

  /* Desktop search link / skip link */
  var skip = $('.fxg-skip-to-main-content');
  if (skip) {
    skip.addEventListener('click', function (event) {
      event.preventDefault();
      var main = $('main, #main-content, .fxg-main-content');
      if (main) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* Mobile menu */
  var menu = document.getElementById('clone-mobile-menu');
  var menuButton = document.getElementById('fxg-mobile-menu-btn');
  var lastFocus = null;

  function openMenu() {
    if (!menu) return;
    lastFocus = document.activeElement;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('clone-menu-open');
    if (menuButton) menuButton.setAttribute('aria-expanded', 'true');
    var close = menu.querySelector('[data-close-menu]');
    if (close) window.setTimeout(function () { close.focus(); }, 60);
  }

  function closeMenu() {
    if (!menu || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('clone-menu-open');
    if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  if (menuButton) {
    menuButton.addEventListener('click', function (event) {
      event.preventDefault();
      if (menu && menu.classList.contains('is-open')) closeMenu();
      else openMenu();
    });
  }
  if (menu) {
    $all('[data-close-menu]', menu).forEach(function (el) {
      el.addEventListener('click', closeMenu);
    });
    $all('a', menu).forEach(function (link) {
      link.addEventListener('click', function () { closeMenu(); });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 767) closeMenu();
    });
  }

  /* Small admin entry point in the footer, for the site owner. */
  var footer = $('.fxg-footer') || $('footer');
  if (footer) {
    var admin = document.createElement('p');
    admin.className = 'clone-footer-admin';
    admin.innerHTML = '<a href="' + ADMIN_URL + '">Admin portal</a>';
    footer.appendChild(admin);
  }
})();
