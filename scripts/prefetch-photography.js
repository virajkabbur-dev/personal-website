(function () {
  const PHOTO_PATHS = [
    'public/assets/photography/IMG_3375.JPG',
    'public/assets/photography/IMG_0878.JPG',
    'public/assets/photography/IMG_1225.JPG',
    'public/assets/photography/NO_FUSION_0619_010.jpg?v=2',
    'public/assets/photography/IMG_5084.JPG',
    'public/assets/photography/IMG_1450.JPG',
    'public/assets/photography/IMG_1026.JPG',
    'public/assets/photography/NO_FUSION_0429_029.jpg?v=2',
    'public/assets/photography/IMG_1416.JPG',
    'public/assets/photography/IMG_0941.JPG',
    'public/assets/photography/IMG_0211.jpg',
    'public/assets/photography/NO_FUSION_0515_007.jpg?v=2',
    'public/assets/photography/IMG_4394_Original.jpg',
    'public/assets/photography/NO_FUSION_0517_007.jpg?v=2',
    'public/assets/photography/NO_FUSION_0503_003.jpg?v=2',
    'public/assets/photography/NO_FUSION_0522_001.jpg?v=2',
  ];

  function prefetchPhotos() {
    PHOTO_PATHS.forEach((path) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = path;
    });
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(prefetchPhotos, { timeout: 5000 });
  } else {
    window.setTimeout(prefetchPhotos, 2500);
  }
})();
