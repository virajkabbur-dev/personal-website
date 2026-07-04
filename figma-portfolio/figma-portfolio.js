(function () {
  const MIN_LOADER_MS = 600;
  const LOAD_TIMEOUT_MS = 25000;

  document.querySelectorAll('[data-figma-embed]').forEach((wrap) => {
    const iframe = wrap.querySelector('.figma-project__frame');
    const loader = wrap.querySelector('.figma-project__loader');
    const loaderText = wrap.querySelector('.figma-project__loader-text');
    const loaderHint = wrap.querySelector('.figma-project__loader-hint');

    if (!iframe || !loader) return;

    let shownAt = Date.now();
    let settled = false;

    function finishLoading(success) {
      if (settled) return;
      settled = true;

      const elapsed = Date.now() - shownAt;
      const delay = Math.max(0, MIN_LOADER_MS - elapsed);

      window.setTimeout(() => {
        wrap.classList.add('figma-project__frame-wrap--loaded');
        loader.setAttribute('aria-busy', 'false');

        if (!success && loaderText && loaderHint) {
          loaderText.textContent = 'Having trouble loading the embed';
          loaderHint.textContent = 'Use the buttons below to open in Figma instead';
          loader.classList.add('figma-project__loader--error');
          wrap.classList.remove('figma-project__frame-wrap--loaded');
        }
      }, delay);
    }

    iframe.addEventListener('load', () => finishLoading(true));
    iframe.addEventListener('error', () => finishLoading(false));

    window.setTimeout(() => {
      if (!settled) finishLoading(true);
    }, LOAD_TIMEOUT_MS);
  });
})();
