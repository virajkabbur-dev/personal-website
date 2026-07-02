try {
  if (
    sessionStorage.getItem('page-transition') &&
    !window.location.pathname.includes('/profession')
  ) {
    document.documentElement.classList.add('page-enter-pending');
  }
} catch (e) {}
