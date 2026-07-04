(function () {
  const gallery = document.getElementById('gallery');
  const lightbox = document.getElementById('lightbox');
  if (!gallery || !lightbox) return;

  const items = Array.from(gallery.querySelectorAll('.gallery__item'));
  const lightboxImg = lightbox.querySelector('.lightbox__img');
  const lightboxCount = lightbox.querySelector('.lightbox__count');
  const closeBtn = lightbox.querySelector('.lightbox__close');
  const prevBtn = lightbox.querySelector('.lightbox__prev');
  const nextBtn = lightbox.querySelector('.lightbox__next');

  let currentIndex = 0;

  function showImage(index) {
    const item = items[index];
    if (!item) return;

    currentIndex = index;
    const img = item.querySelector('img');
    lightboxImg.classList.remove('lightbox__img--visible');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCount.textContent = `${index + 1} / ${items.length}`;

    requestAnimationFrame(function () {
      lightboxImg.classList.add('lightbox__img--visible');
    });
  }

  function openLightbox(index) {
    showImage(index);
    lightbox.classList.add('lightbox--open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('lightbox--open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxImg.classList.remove('lightbox__img--visible');
    items[currentIndex]?.focus();
  }

  function showPrev() {
    const nextIndex = (currentIndex - 1 + items.length) % items.length;
    showImage(nextIndex);
  }

  function showNext() {
    const nextIndex = (currentIndex + 1) % items.length;
    showImage(nextIndex);
  }

  items.forEach(function (item, index) {
    item.addEventListener('click', function () {
      openLightbox(index);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', showPrev);
  nextBtn.addEventListener('click', showNext);

  lightbox.addEventListener('click', function (event) {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (event) {
    if (!lightbox.classList.contains('lightbox--open')) return;

    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') showPrev();
    if (event.key === 'ArrowRight') showNext();
  });
})();
