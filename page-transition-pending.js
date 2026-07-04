try {
  var nav = performance.getEntriesByType('navigation')[0];
  var isHistoryNav = nav && nav.type === 'back_forward';

  if (
    !isHistoryNav &&
    sessionStorage.getItem('page-transition') &&
    !window.location.pathname.includes('/profession')
  ) {
    document.documentElement.classList.add('page-enter-pending');
  }
} catch (e) {}
