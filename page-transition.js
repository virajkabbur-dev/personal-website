(function () {
  if (typeof gsap === 'undefined') return;

  const TRANSITION_KEY = 'page-transition';

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function hasTransition(mode) {
    return (document.body.dataset.pageTransition || '').includes(mode);
  }

  function getExitTargets() {
    return [
      document.querySelector('.page'),
      document.querySelector('.page-toolbar'),
      document.querySelector('.profession-intro__text'),
      document.querySelector('.notes'),
    ].filter(Boolean);
  }

  function clearPageTransform() {
    const page = document.querySelector('.page');
    if (page) gsap.set(page, { clearProps: 'transform' });
  }

  function runEnterAnimation() {
    if (!sessionStorage.getItem(TRANSITION_KEY)) return;

    sessionStorage.removeItem(TRANSITION_KEY);
    clearPageTransform();

    if (prefersReducedMotion()) {
      document.documentElement.classList.remove('page-enter-pending');
      return;
    }

    const page = document.querySelector('.page');
    const toolbar = document.querySelector('.page-toolbar');
    const notes = document.querySelector('.notes');

    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.classList.remove('page-enter-pending');
        clearPageTransform();
        if (toolbar) gsap.set(toolbar, { clearProps: 'transform' });
        if (notes) gsap.set(notes, { clearProps: 'transform' });
      },
    });

    if (page) {
      gsap.set(page, { opacity: 0 });
      tl.to(page, { opacity: 1, duration: 0.55, ease: 'power2.out' }, 0);
    }

    [toolbar, notes].forEach((el) => {
      if (!el) return;
      gsap.set(el, { opacity: 0, y: 20 });
      tl.to(el, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 0);
    });

    if (!page && !toolbar && !notes) {
      document.documentElement.classList.remove('page-enter-pending');
    }
  }

  function runExitAnimation(href) {
    if (prefersReducedMotion()) {
      window.location.href = href;
      return;
    }

    const page = document.querySelector('.page');
    const toolbar = document.querySelector('.page-toolbar');
    const notes = document.querySelector('.notes');
    const intro = document.querySelector('.profession-intro__text');
    const others = [toolbar, notes, intro].filter(Boolean);

    if (!page && !others.length) {
      window.location.href = href;
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem(TRANSITION_KEY, '1');
        window.location.href = href;
      },
    });

    if (page) {
      tl.to(page, { opacity: 0, duration: 0.45, ease: 'power2.in' }, 0);
    }

    if (others.length) {
      tl.to(
        others,
        {
          opacity: 0,
          y: -20,
          duration: 0.45,
          ease: 'power2.in',
          stagger: 0.05,
        },
        0
      );
    }
  }

  function isSamePageLink(href) {
    try {
      const target = new URL(href, window.location.href);
      const current = new URL(window.location.href);
      return target.pathname === current.pathname;
    } catch {
      return false;
    }
  }

  function initExit() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a.page-link');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;

      if (href.startsWith('http://') || href.startsWith('https://')) {
        try {
          const url = new URL(href);
          if (url.origin !== window.location.origin) return;
        } catch {
          return;
        }
      }

      if (isSamePageLink(href)) return;

      e.preventDefault();
      runExitAnimation(link.href);
    });
  }

  clearPageTransform();

  if (hasTransition('enter')) {
    if (document.body.classList.contains('profession-page')) {
      if (sessionStorage.getItem(TRANSITION_KEY)) {
        sessionStorage.removeItem(TRANSITION_KEY);
        document.documentElement.classList.remove('page-enter-pending');
      }
    } else {
      runEnterAnimation();
    }
  }

  if (hasTransition('exit')) {
    initExit();
  }
})();
