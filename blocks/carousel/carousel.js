import { createPicture } from '../../scripts/utils/picture.js';

const AUTOPLAY_INTERVAL_MS = 5000;
const CAROUSEL_LABEL = 'Carousel';
const SLIDE_CONTROLS_LABEL = 'Carousel slide controls';

function getMediaFromColumn(col) {
  const picture = col.querySelector('picture');
  if (picture) {
    const img = picture.querySelector('img');
    return img ? { type: 'image', el: picture, src: img.src, alt: img.alt || '' } : null;
  }

  const video = col.querySelector('.video');
  if (video) return { type: 'video', el: video };

  const link = col.querySelector('a[href]');
  if (link?.href) {
    const href = link.getAttribute('href') || '';
    const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(href);
    const isYouTube = href.includes('youtube.com') || href.includes('youtu.be');
    if (isImage) return { type: 'image', el: link, src: href, alt: link.textContent?.trim() || '' };
    if (isYouTube) return null; /* Already transformed to .video by youtube block */
  }

  return null;
}

function getContentFromColumn(col) {
  const fragment = document.createDocumentFragment();
  [...col.children].forEach((child) => fragment.appendChild(child.cloneNode(true)));
  return fragment;
}

function createSlideMedia(mediaInfo) {
  const mediaDiv = document.createElement('div');
  mediaDiv.className = 'carousel-slide-media';

  if (mediaInfo.type === 'video') {
    mediaDiv.classList.add('carousel-slide-video');
    mediaDiv.append(mediaInfo.el);
    return mediaDiv;
  }

  if (mediaInfo.type === 'image') {
    const picture = createPicture({
      src: mediaInfo.src,
      alt: mediaInfo.alt,
      eager: false,
      breakpoints: [{ media: '(min-width: 900px)', width: '1600' }, { media: '(min-width: 600px)', width: '1200' }, { width: '750' }],
    });
    mediaDiv.append(picture);
  }

  return mediaDiv;
}

function updateActiveSlide(block, slideIndex) {
  const slides = block.querySelectorAll('.carousel-slide');
  const indicators = block.querySelectorAll('.carousel-slide-indicator');

  block.dataset.activeSlide = String(slideIndex);

  slides.forEach((slide, idx) => {
    slide.setAttribute('aria-hidden', idx !== slideIndex);
    slide.querySelectorAll('a').forEach((a) => {
      a.setAttribute('tabindex', idx === slideIndex ? '0' : '-1');
    });
  });

  indicators.forEach((indicator, idx) => {
    const btn = indicator.querySelector('button');
    if (btn) {
      btn.disabled = idx === slideIndex;
      btn.setAttribute('aria-current', idx === slideIndex ? 'true' : 'false');
    }
  });
}

function showSlide(block, slideIndex) {
  const slides = block.querySelectorAll('.carousel-slide');
  if (!slides.length) return;

  let idx = slideIndex;
  if (idx < 0) idx = slides.length - 1;
  if (idx >= slides.length) idx = 0;

  const slide = slides[idx];
  const container = block.querySelector('.carousel-slides');

  if (container) {
    container.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
  }
  updateActiveSlide(block, idx);
}

function bindEvents(block) {
  const prevBtn = block.querySelector('.carousel-prev');
  const nextBtn = block.querySelector('.carousel-next');
  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  const slides = block.querySelectorAll('.carousel-slide');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) + 1);
    });
  }

  indicators.forEach((indicator, idx) => {
    const btn = indicator.querySelector('button');
    if (btn) {
      btn.addEventListener('click', () => showSlide(block, idx));
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const slide = entry.target;
        const idx = parseInt(slide.dataset.slideIndex, 10);
        updateActiveSlide(block, idx);
      }
    });
  }, { threshold: 0.5 });

  slides.forEach((slide) => observer.observe(slide));

  block.addEventListener('keydown', (e) => {
    if (!block.contains(document.activeElement)) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) + 1);
    }
  });
}

function setupAutoplay(block) {
  const section = block.closest('.section');
  const hasAutoplay = block.classList.contains('autoplay')
    || section?.classList.contains('autoplay');
  if (!hasAutoplay) return;

  let intervalId;
  const start = () => {
    intervalId = setInterval(() => {
      const current = parseInt(block.dataset.activeSlide || '0', 10);
      const total = block.querySelectorAll('.carousel-slide').length;
      showSlide(block, total > 1 ? (current + 1) % total : 0);
    }, AUTOPLAY_INTERVAL_MS);
  };
  const stop = () => { clearInterval(intervalId); };

  block.addEventListener('mouseenter', stop);
  block.addEventListener('mouseleave', start);
  block.addEventListener('focusin', stop);
  block.addEventListener('focusout', (e) => {
    if (!block.contains(e.relatedTarget)) start();
  });

  start();
}

export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', CAROUSEL_LABEL);
  block.setAttribute('aria-label', CAROUSEL_LABEL);

  const container = document.createElement('div');
  container.className = 'carousel-slides-container';

  const slidesList = document.createElement('ul');
  slidesList.className = 'carousel-slides';
  slidesList.setAttribute('aria-label', 'Slides');

  const isMultiSlide = rows.length > 1;

  let nav;
  if (isMultiSlide) {
    nav = document.createElement('nav');
    nav.setAttribute('aria-label', SLIDE_CONTROLS_LABEL);
    nav.className = 'carousel-navigation';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'carousel-prev';
    prevBtn.setAttribute('aria-label', 'Previous slide');
    prevBtn.innerHTML = '<span aria-hidden="true">&larr;</span>';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'carousel-next';
    nextBtn.setAttribute('aria-label', 'Next slide');
    nextBtn.innerHTML = '<span aria-hidden="true">&rarr;</span>';

    nav.append(prevBtn);

    const indicatorsOl = document.createElement('ol');
    indicatorsOl.className = 'carousel-slide-indicators';

    rows.forEach((_, idx) => {
      const li = document.createElement('li');
      li.className = 'carousel-slide-indicator';
      li.innerHTML = `<button type="button" aria-label="Go to slide ${idx + 1}" ${idx === 0 ? 'disabled aria-current="true"' : ''}>${idx + 1}</button>`;
      indicatorsOl.append(li);
    });

    nav.append(indicatorsOl, nextBtn);
  }

  rows.forEach((row, idx) => {
    const cols = [...row.children];
    const mediaCol = cols[0];
    const contentCol = cols[1];

    const mediaInfo = mediaCol ? getMediaFromColumn(mediaCol) : null;
    if (!mediaInfo) return;

    const slide = document.createElement('li');
    slide.className = 'carousel-slide';
    slide.dataset.slideIndex = String(idx);
    slide.setAttribute('aria-hidden', idx !== 0);

    const mediaDiv = createSlideMedia(mediaInfo);
    slide.append(mediaDiv);

    if (contentCol) {
      const contentDiv = document.createElement('div');
      contentDiv.className = 'carousel-slide-content';
      const content = getContentFromColumn(contentCol);
      contentDiv.append(content);
      slide.append(contentDiv);
    }

    slidesList.append(slide);
  });

  container.append(slidesList);
  block.replaceChildren(container, ...(nav ? [nav] : []));

  block.dataset.activeSlide = '0';

  if (isMultiSlide) {
    bindEvents(block);
    setupAutoplay(block);
  }
}
