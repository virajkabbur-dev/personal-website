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
  const lightboxStage = lightbox.querySelector('.lightbox__stage');

  let currentIndex = 0;
  let lightboxRequestId = 0;
  const imageCache = new Map();

  function createLoader(parent) {
    const loader = document.createElement('span');
    loader.className = 'gallery__loader';
    loader.setAttribute('aria-hidden', 'true');
    parent.appendChild(loader);
    return loader;
  }

  function markGalleryItemLoaded(item, img) {
    if (item.classList.contains('gallery__item--loaded')) return;

    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      item.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
    }

    item.classList.add('gallery__item--loaded');
    imageCache.set(img.currentSrc || img.src, img);
  }

  function initGalleryLoading() {
    items.forEach((item, index) => {
      const img = item.querySelector('img');
      if (!img) return;

      createLoader(item);

      if (index < 4) {
        img.loading = 'eager';
        img.fetchPriority = 'high';
      }

      const onReady = () => markGalleryItemLoaded(item, img);

      if (img.complete && img.naturalWidth > 0) {
        onReady();
      } else {
        img.addEventListener('load', onReady, { once: true });
        img.addEventListener(
          'error',
          () => {
            item.classList.add('gallery__item--loaded', 'gallery__item--error');
          },
          { once: true }
        );
      }
    });
  }

  function preloadImage(src) {
    if (imageCache.has(src)) {
      return Promise.resolve(imageCache.get(src));
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  function preloadAdjacent(index) {
    const prev = items[(index - 1 + items.length) % items.length]?.querySelector('img')?.src;
    const next = items[(index + 1) % items.length]?.querySelector('img')?.src;
    if (prev) preloadImage(prev).catch(() => {});
    if (next) preloadImage(next).catch(() => {});
  }

  function showImage(index) {
    const item = items[index];
    if (!item) return;

    currentIndex = index;
    const sourceImg = item.querySelector('img');
    const src = sourceImg?.currentSrc || sourceImg?.src;
    if (!src) return;

    const requestId = ++lightboxRequestId;
    lightbox.classList.add('lightbox--loading');
    lightboxImg.classList.remove('lightbox__img--visible');
    lightboxCount.textContent = `${index + 1} / ${items.length}`;

    preloadImage(src)
      .then((loadedImg) => {
        if (requestId !== lightboxRequestId) return;

        lightboxImg.src = loadedImg.currentSrc || loadedImg.src;
        lightboxImg.alt = sourceImg.alt;
        lightbox.classList.remove('lightbox--loading');

        requestAnimationFrame(() => {
          lightboxImg.classList.add('lightbox__img--visible');
        });

        preloadAdjacent(index);
      })
      .catch(() => {
        if (requestId !== lightboxRequestId) return;
        lightbox.classList.remove('lightbox--loading');
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
    lightboxRequestId += 1;
    lightbox.classList.remove('lightbox--open', 'lightbox--loading');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxImg.classList.remove('lightbox__img--visible');
    items[currentIndex]?.focus();
  }

  function showPrev() {
    showImage((currentIndex - 1 + items.length) % items.length);
  }

  function showNext() {
    showImage((currentIndex + 1) % items.length);
  }

  initGalleryLoading();

  items.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', showPrev);
  nextBtn.addEventListener('click', showNext);

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox || event.target === lightboxStage) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('lightbox--open')) return;

    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') showPrev();
    if (event.key === 'ArrowRight') showNext();
  });
})();
