(function () {
  const intro = document.getElementById('professionIntro');
  const typewriter = document.getElementById('professionTypewriter');
  const content = document.querySelector('.profession-content');
  const body = document.body;

  if (!intro || !typewriter || typeof gsap === 'undefined') return;

  const INTRO_SEEN_KEY = 'profession-intro-seen';
  const TECH_REVEAL_SEEN_KEY = 'profession-tech-reveal-seen';
  const BUSINESS_REVEAL_SEEN_KEY = 'profession-business-reveal-seen';

  const TEXT_REVEAL_SECTIONS = [
    { sectionId: 'professionTechnology', textId: 'professionTechnologyText', seenKey: TECH_REVEAL_SEEN_KEY },
    { sectionId: 'professionBusiness', textId: 'professionBusinessText', seenKey: BUSINESS_REVEAL_SEEN_KEY },
  ];

  let locoScroll = null;
  let resizeHandler = null;
  let activeTextReveal = null;

  function isMobileView() {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initLocomotiveScroll() {
    if (typeof locomotiveScroll === 'undefined' || prefersReducedMotion() || locoScroll) {
      return locoScroll;
    }

    locoScroll = new locomotiveScroll({
      lenisOptions: {
        lerp: 0.08,
        smoothWheel: true,
      },
    });

    const lenis = locoScroll.lenisInstance;
    if (lenis && typeof window.registerChromeGlassScroll === 'function') {
      window.registerChromeGlassScroll(() => lenis.scroll);
      lenis.on('scroll', window.updateChromeGlass);
    }

    resizeHandler = () => {
      locoScroll?.resize();
    };
    window.addEventListener('resize', resizeHandler);
    return locoScroll;
  }

  function splitRevealWords(textEl) {
    const text = textEl.textContent.trim();
    textEl.textContent = '';
    const words = text.split(/\s+/);

    return words.map((word, index) => {
      const span = document.createElement('span');
      span.className = 'profession-reveal__word';
      span.textContent = word;
      textEl.appendChild(span);
      if (index < words.length - 1) {
        textEl.appendChild(document.createTextNode(' '));
      }
      return span;
    });
  }

  function hasSeenReveal(seenKey) {
    try {
      return sessionStorage.getItem(seenKey) === '1';
    } catch (e) {
      return false;
    }
  }

  function markRevealSeen(seenKey) {
    try {
      sessionStorage.setItem(seenKey, '1');
    } catch (e) {}
  }

  function setupTextReveal({ sectionId, textId, seenKey }, lenis) {
    const section = document.getElementById(sectionId);
    const textEl = document.getElementById(textId);
    const pinEl = section?.querySelector('.profession-reveal__pin');

    if (!section || !textEl || !pinEl || !lenis) return;

    if (prefersReducedMotion() || hasSeenReveal(seenKey)) {
      section.classList.add('profession-reveal--ready');
      return;
    }

    const words = splitRevealWords(textEl);
    const initialVisible = 3;
    const revealWords = words.slice(initialVisible);
    const scrollBudget = () => {
      const base = Math.max(window.innerHeight * 1.1, revealWords.length * 34);
      return isMobileView() ? base * 0.5 : base;
    };
    const lockThreshold = () => (isMobileView() ? 14 : 2);

    words.forEach((word, index) => {
      gsap.set(word, { opacity: index < initialVisible ? 1 : 0.18 });
    });

    const state = {
      section,
      pinEl,
      seenKey,
      words,
      revealWords,
      progress: 0,
      phase: 'idle',
      placeholder: null,
      touchY: 0,
      mobileTouchMove: null,
    };

    function applyProgress() {
      const revealed = Math.floor(state.progress * state.revealWords.length);
      state.revealWords.forEach((word, index) => {
        gsap.set(word, { opacity: index < revealed ? 1 : 0.18 });
      });
    }

    function alignPinToTop() {
      const top = state.pinEl.getBoundingClientRect().top;
      if (Math.abs(top) > 1) {
        lenis.scrollTo(lenis.scroll + top, { immediate: true });
      }
    }

    function lock() {
      if (state.phase !== 'idle' || activeTextReveal) return;

      state.phase = 'locked';
      activeTextReveal = state;
      alignPinToTop();

      state.placeholder = document.createElement('div');
      state.placeholder.className = 'profession-reveal__placeholder';
      state.placeholder.style.height = `${state.pinEl.offsetHeight}px`;
      state.pinEl.after(state.placeholder);

      state.pinEl.classList.add('profession-reveal__pin--locked');
      body.classList.add('profession-page--text-reveal');
      lenis.stop();

      if (isMobileView()) {
        state.mobileTouchMove = (e) => {
          if (activeTextReveal !== state || state.phase !== 'locked') return;
          if (e.touches.length !== 1) return;
          const y = e.touches[0].clientY;
          const delta = (state.touchY - y) * 1.4;
          state.touchY = y;
          if (!consumeScrollDelta(delta)) return;
          e.preventDefault();
        };
        window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
        window.addEventListener('touchmove', state.mobileTouchMove, { passive: false, capture: true });
      }
    }

    function unlock() {
      if (state.phase !== 'locked') return;

      state.phase = 'done';
      state.progress = 1;
      gsap.set(state.words, { opacity: 1 });
      section.classList.add('profession-reveal--ready');
      markRevealSeen(seenKey);

      state.pinEl.classList.remove('profession-reveal__pin--locked');
      state.placeholder?.remove();
      state.placeholder = null;

      body.classList.remove('profession-page--text-reveal');
      if (state.mobileTouchMove) {
        window.removeEventListener('touchstart', onTouchStart, { capture: true });
        window.removeEventListener('touchmove', state.mobileTouchMove, { capture: true });
        state.mobileTouchMove = null;
      }

      activeTextReveal = null;
      lenis.start();
      lenis.resize();
    }

    function consumeScrollDelta(delta) {
      if (state.phase !== 'locked') return false;

      if (delta > 0) {
        state.progress = Math.min(1, state.progress + delta / scrollBudget());
        applyProgress();
        if (state.progress >= 1) {
          unlock();
        }
        return true;
      }

      if (delta < 0 && state.progress > 0) {
        state.progress = Math.max(0, state.progress + delta / scrollBudget());
        applyProgress();
        return true;
      }

      return state.phase === 'locked';
    }

    function onLenisScroll() {
      if (state.phase !== 'idle') return;
      const { top } = state.pinEl.getBoundingClientRect();
      if (top <= lockThreshold()) lock();
    }

    function onWheel(e) {
      if (activeTextReveal !== state) return;
      if (!consumeScrollDelta(e.deltaY)) return;
      e.preventDefault();
      e.stopPropagation();
    }

    function onTouchStart(e) {
      if (activeTextReveal !== state) return;
      state.touchY = e.touches[0].clientY;
    }

    lenis.on('scroll', onLenisScroll);
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });

    if (!isMobileView()) {
      window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
      window.addEventListener(
        'touchmove',
        (e) => {
          if (activeTextReveal !== state) return;
          const y = e.touches[0].clientY;
          const delta = state.touchY - y;
          state.touchY = y;
          if (!consumeScrollDelta(delta)) return;
          e.preventDefault();
        },
        { passive: false, capture: true }
      );
    }
  }

  function initTextReveal() {
    const lenis = locoScroll?.lenisInstance;
    if (!lenis) {
      TEXT_REVEAL_SECTIONS.forEach(({ sectionId, seenKey }) => {
        const section = document.getElementById(sectionId);
        if (section) section.classList.add('profession-reveal--ready');
      });
      return;
    }

    TEXT_REVEAL_SECTIONS.forEach((config) => setupTextReveal(config, lenis));
  }

  function onPageReady() {
    initLocomotiveScroll();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        locoScroll?.resize();
        initTextReveal();
        initProjectsCarousel();
        initProjectCardReveal();
      });
    });
  }

  function initProjectCardReveal() {
    const sections = document.querySelectorAll('.profession-projects');
    if (!sections.length) return;

    if (prefersReducedMotion()) return;

    sections.forEach((root) => {
      const cards = [...root.querySelectorAll('.profession-project-card')];
      const toolbar = root.querySelector('.profession-projects__toolbar');
      if (!cards.length) return;

      gsap.set(cards, { autoAlpha: 0 });
      if (toolbar) gsap.set(toolbar, { autoAlpha: 0 });

      const reveal = () => {
        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

        if (toolbar) {
          tl.to(toolbar, { autoAlpha: 1, duration: 0.55 }, 0);
        }

        tl.to(
          cards,
          {
            autoAlpha: 1,
            duration: 0.85,
            stagger: { each: 0.14, from: 'start' },
          },
          toolbar ? 0.08 : 0
        );

        root.classList.add('profession-projects--revealed');
      };

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          reveal();
          observer.disconnect();
        },
        { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
      );

      observer.observe(root);
    });
  }

  function initProjectsCarousel() {
    document.querySelectorAll('.profession-projects').forEach((root) => {
      const track = root.querySelector('.profession-projects__track');
      const prevBtn = root.querySelector('.profession-projects__btn--prev');
      const nextBtn = root.querySelector('.profession-projects__btn--next');

      if (!track || !prevBtn || !nextBtn) return;

      function getScrollStep() {
        const card = track.querySelector('.profession-project-card');
        if (!card) return 0;
        const gap = parseFloat(getComputedStyle(track).gap) || 24;
        return card.offsetWidth + gap;
      }

      function updateButtons() {
        const maxScroll = track.scrollWidth - track.clientWidth;
        prevBtn.disabled = track.scrollLeft <= 1;
        nextBtn.disabled = track.scrollLeft >= maxScroll - 1;
      }

      prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
      });

      nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
      });

      track.addEventListener('scroll', updateButtons, { passive: true });
      window.addEventListener('resize', updateButtons);

      track.addEventListener(
        'wheel',
        (e) => {
          if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
          e.preventDefault();
          track.scrollLeft += e.deltaX;
        },
        { passive: false }
      );

      updateButtons();
    });
  }

  function preventScroll(e) {
    e.preventDefault();
  }

  function preventKeyScroll(e) {
    const blocked = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
    if (blocked.includes(e.key)) e.preventDefault();
  }

  function lockScroll() {
    body.classList.add('profession-page--animating');
    window.scrollTo(0, 0);
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', preventKeyScroll);
  }

  function unlockScroll() {
    body.classList.remove('profession-page--animating');
    window.removeEventListener('wheel', preventScroll);
    window.removeEventListener('touchmove', preventScroll);
    window.removeEventListener('keydown', preventKeyScroll);
    window.scrollTo(0, 0);
    onPageReady();
  }

  function getToolbarMetrics() {
    const toolbar = document.querySelector('.page-toolbar');
    if (!toolbar) {
      return { paddingLeft: 64, paddingTop: 0, barHeight: 56 };
    }

    const styles = getComputedStyle(toolbar);
    const paddingLeft = parseFloat(styles.paddingLeft) || 64;
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const barHeight = (parseFloat(styles.minHeight) || paddingTop + 56) - paddingTop;

    return { paddingLeft, paddingTop, barHeight };
  }

  function getCornerPosition() {
    const { paddingLeft, paddingTop, barHeight } = getToolbarMetrics();
    let fontSize = 17;

    if (window.matchMedia('(max-width: 600px)').matches) {
      fontSize = 15;
    } else if (window.matchMedia('(max-width: 900px)').matches) {
      fontSize = 16;
    }

    const endScale = fontSize / getCenterFontSize();
    const scaledH = typewriter.getBoundingClientRect().height * endScale;
    const top = paddingTop + (barHeight - scaledH) / 2;

    return { left: paddingLeft, top, fontSize };
  }

  function getCenterFontSize() {
    return parseFloat(window.getComputedStyle(typewriter).fontSize) || 64;
  }

  function hasSeenIntro() {
    try {
      return sessionStorage.getItem(INTRO_SEEN_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function markIntroSeen() {
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch (e) {}
  }

  function createChar(char) {
    const span = document.createElement('span');
    span.className = 'profession-intro__char';
    span.textContent = char === ' ' ? '\u00A0' : char;
    return span;
  }

  const LINE1_CHAR_DELAY = 0.075;
  const LINE2_CHAR_DELAY = 0.075;
  const LINE_BREAK_PAUSE = 0.4;
  const CHAR_DURATION = 0.35;

  function buildTypewriterDOM() {
    typewriter.innerHTML = '';
    const line1Chars = [];
    const line2Chars = [];

    'Jack of all'.split('').forEach((char) => {
      const el = createChar(char);
      typewriter.appendChild(el);
      line1Chars.push(el);
    });

    typewriter.appendChild(document.createElement('br'));

    'Master of '.split('').forEach((char) => {
      const el = createChar(char);
      typewriter.appendChild(el);
      line2Chars.push(el);
    });

    const strike = document.createElement('span');
    strike.className = 'profession-intro__strike profession-intro__char';
    strike.textContent = 'N';
    typewriter.appendChild(strike);
    line2Chars.push(strike);

    'One'.split('').forEach((char) => {
      const el = createChar(char);
      typewriter.appendChild(el);
      line2Chars.push(el);
    });

    return {
      line1: line1Chars,
      line2: line2Chars,
      all: [...line1Chars, ...line2Chars],
    };
  }

  function applyCornerPosition() {
    const corner = getCornerPosition();
    const endScale = corner.fontSize / getCenterFontSize();

    gsap.set(typewriter, {
      position: 'fixed',
      left: corner.left,
      top: corner.top,
      x: 0,
      y: 0,
      xPercent: 0,
      yPercent: 0,
      scale: endScale,
      fontWeight: 500,
      transformOrigin: 'left top',
    });
  }

  function setCentered() {
    gsap.set(typewriter, {
      position: 'fixed',
      left: '50%',
      top: '50%',
      xPercent: -50,
      yPercent: -50,
      x: 0,
      y: 0,
      scale: 1,
      fontSize: getCenterFontSize(),
      fontWeight: 500,
      transformOrigin: 'center center',
    });
  }

  function getCornerTweenValues() {
    const corner = getCornerPosition();
    const endScale = corner.fontSize / getCenterFontSize();
    const rect = typewriter.getBoundingClientRect();
    const scaledW = rect.width * endScale;
    const scaledH = rect.height * endScale;
    const targetCenterX = corner.left + scaledW / 2;
    const targetCenterY = corner.top + scaledH / 2;
    const currentCenterX = rect.left + rect.width / 2;
    const currentCenterY = rect.top + rect.height / 2;

    return {
      x: gsap.getProperty(typewriter, 'x') + (targetCenterX - currentCenterX),
      y: gsap.getProperty(typewriter, 'y') + (targetCenterY - currentCenterY),
      scale: endScale,
      fontWeight: 500,
    };
  }

  function showFinalState() {
    const { all: chars } = buildTypewriterDOM();
    applyCornerPosition();
    gsap.set(chars, { opacity: 1, y: 0 });

    body.classList.add('profession-page--ready');
    gsap.set(content, { autoAlpha: 1, y: 0, visibility: 'visible' });
    markIntroSeen();
    onPageReady();
  }

  function restoreProfessionFromHistory() {
    body.classList.remove('profession-page--animating', 'profession-page--text-reveal');
    window.removeEventListener('wheel', preventScroll);
    window.removeEventListener('touchmove', preventScroll);
    window.removeEventListener('keydown', preventKeyScroll);

    document.querySelectorAll('.profession-reveal__pin--locked').forEach((el) => {
      el.classList.remove('profession-reveal__pin--locked');
    });
    document.querySelectorAll('.profession-reveal__placeholder').forEach((el) => el.remove());
    activeTextReveal = null;

    document.documentElement.classList.remove('page-enter-pending');

    const page = document.querySelector('.page');
    [page, typewriter, content].filter(Boolean).forEach((el) => {
      gsap.set(el, { clearProps: 'opacity,transform,visibility,autoAlpha,y,x,scale' });
    });

    if (body.classList.contains('profession-page--ready')) {
      gsap.set(content, { autoAlpha: 1, visibility: 'visible' });
      if (page) gsap.set(page, { opacity: 1 });
      applyCornerPosition();
      locoScroll?.lenisInstance?.start();
      locoScroll?.resize();
      return;
    }

    showFinalState();
  }

  window.addEventListener('pagehide', (event) => {
    if (event.persisted) restoreProfessionFromHistory();
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) restoreProfessionFromHistory();
  });

  window.addEventListener('page-history-restore', restoreProfessionFromHistory);

  function runAnimation() {
    const { line1, line2, all: chars } = buildTypewriterDOM();
    setCentered();

    gsap.set(chars, { opacity: 0, y: 6 });
    gsap.set(content, { autoAlpha: 0, y: 12 });

    const charTween = {
      opacity: 1,
      y: 0,
      duration: CHAR_DURATION,
      ease: 'power2.out',
    };

    const tl = gsap.timeline();

    tl.to(line1, {
      ...charTween,
      stagger: { each: LINE1_CHAR_DELAY, ease: 'power1.out' },
    });

    tl.to(line2, {
      ...charTween,
      stagger: { each: LINE2_CHAR_DELAY, ease: 'power1.out' },
    }, `+=${LINE_BREAK_PAUSE}`);

    tl.to({}, { duration: 1.5 });

    tl.to(typewriter, {
      duration: 1,
      ease: 'power3.inOut',
      x: () => getCornerTweenValues().x,
      y: () => getCornerTweenValues().y,
      scale: () => getCornerTweenValues().scale,
    });

    tl.add(() => applyCornerPosition());

    tl.to(
      content,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
      },
      '-=0.45'
    );

    tl.add(() => {
      body.classList.add('profession-page--ready');
      markIntroSeen();
      unlockScroll();
    });
  }

  if (prefersReducedMotion() || hasSeenIntro()) {
    showFinalState();
  } else {
    try {
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav && nav.type === 'back_forward') {
        showFinalState();
        return;
      }
    } catch (e) {}

    lockScroll();
    runAnimation();
  }

  window.addEventListener('resize', () => {
    if (!body.classList.contains('profession-page--ready') || !typewriter) return;
    applyCornerPosition();
  });
})();
