(function () {
  const THRESHOLD = 16;
  const targets = () =>
    document.querySelectorAll('.nav, .page-toolbar');

  let getScrollY = () => window.scrollY || document.documentElement.scrollTop || 0;

  function update() {
    const active = getScrollY() > THRESHOLD;
    targets().forEach((el) => {
      el.classList.toggle('chrome-glass--active', active);
    });
  }

  window.registerChromeGlassScroll = (fn) => {
    getScrollY = fn;
    update();
  };

  window.updateChromeGlass = update;

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', update);
  } else {
    update();
  }
})();
