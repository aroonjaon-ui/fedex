(function () {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('mobile-nav');

  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('open', open);
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('nav-open', open);
    };

    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));

    nav.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) return;
      if (link.hasAttribute('data-open-auth') && typeof window.openAuth === 'function') {
        event.preventDefault();
        setOpen(false);
        window.openAuth();
        return;
      }
      setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 720) setOpen(false);
    });
  }
})();
