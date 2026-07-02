(function () {
  const STORAGE_KEY = 'theme';
  const root = document.documentElement;

  try {
    if (localStorage.getItem(STORAGE_KEY) === 'dark') {
      root.setAttribute('data-theme', 'dark');
    }
  } catch (e) {}

  function getTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function setTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}

    updateThemeIcon();
  }

  function updateThemeIcon() {
    const btn = document.querySelector('.page-toolbar__btn--theme');
    const img = btn?.querySelector('.page-toolbar__icon--theme');
    if (!btn || !img) return;

    const base = btn.dataset.assetBase || 'public/assets';
    const isDark = getTheme() === 'dark';

    img.src = isDark ? `${base}/light-mode.svg` : `${base}/dark-mode.svg`;
    btn.setAttribute(
      'aria-label',
      isDark ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }

  function init() {
    const btn = document.querySelector('.page-toolbar__btn--theme');
    if (!btn) return;

    btn.addEventListener('click', () => {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });

    updateThemeIcon();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
