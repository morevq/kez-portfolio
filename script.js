if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (window.location.hash) {
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}
window.addEventListener('pageshow', () => {
  requestAnimationFrame(() => window.scrollTo(0, 0));
}, { once: true });

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const galleryTargets = {
  insomnia: document.querySelector('[data-gallery="insomnia"]'),
  personal: document.querySelector('[data-gallery="personal"]'),
  storyboards: document.querySelector('[data-gallery="storyboards"]'),
};

let gallerySignature = '';

function closeMenu() {
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.textContent = 'Menu';
  document.body.style.overflow = '';
}

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';

  if (isOpen) {
    closeMenu();
    return;
  }

  mobileNav.hidden = false;
  menuButton.setAttribute('aria-expanded', 'true');
  menuButton.textContent = 'Close';
  document.body.style.overflow = 'hidden';
  mobileNav.querySelector('a').focus();
});

mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileNav.hidden) {
    closeMenu();
    menuButton.focus();
  }
});

function createMedia(item, { loopingPreview = false } = {}) {
  if (item.type === 'video') {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.playsInline = true;
    video.controls = !loopingPreview;
    if (loopingPreview) makeLoopingPreview(video);
    video.src = item.src;
    video.setAttribute('aria-label', item.title);
    video.addEventListener('loadeddata', () => {
      video.parentElement?.classList.add('video-ready');
    }, { once: true });
    return video;
  }

  if (item.type === 'pdf') {
    const link = document.createElement('a');
    link.className = 'pdf-card';
    link.href = item.src;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.setAttribute('aria-label', `Open ${item.title} PDF`);

    const label = document.createElement('span');
    label.textContent = 'Open PDF ↗';
    link.append(label);
    return link;
  }

  const image = document.createElement('img');
  image.src = item.src;
  image.alt = item.title;
  image.loading = 'lazy';
  image.decoding = 'async';
  return image;
}

function createEmptyState(folder, formats) {
  const empty = document.createElement('div');
  empty.className = 'empty-state';

  const title = document.createElement('p');
  title.textContent = 'This section is ready for your work.';

  const path = document.createElement('code');
  path.textContent = folder;

  const hint = document.createElement('small');
  hint.textContent = `Add ${formats} files named 01, 02, 03…`;

  empty.append(title, path, hint);
  return empty;
}

function setSectionVisible(id, isVisible) {
  document.querySelector(`#${id}`).hidden = !isVisible;
  document.querySelectorAll(`a[href="#${id}"]`).forEach((link) => {
    link.hidden = !isVisible;
  });
}

function createGroupHeading(title, count, showCount = true) {
  const heading = document.createElement('div');
  heading.className = 'gallery-group-heading';

  const label = document.createElement('h3');
  label.textContent = title;
  heading.append(label);
  if (showCount) {
    const total = document.createElement('p');
    total.textContent = `${String(count).padStart(2, '0')} ${count === 1 ? 'work' : 'works'}`;
    heading.append(total);
  }
  return heading;
}

function createWorkMeta(item) {
  const meta = document.createElement('div');
  meta.className = 'work-meta';
  const title = document.createElement('h3');
  title.textContent = item.title;
  const type = document.createElement('p');
  type.textContent = item.label;
  meta.append(title, type);
  return meta;
}

function classifyStill(image, figure) {
  const classify = () => {
    const ratio = image.naturalWidth / image.naturalHeight;
    if (ratio < 0.85) figure.classList.add('portrait');
    else if (ratio > 1.9) figure.classList.add('panorama');
  };

  if (image.complete) classify();
  else image.addEventListener('load', classify, { once: true });
}

function makeLoopingPreview(video) {
  video.controls = false;
  video.removeAttribute('controls');
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute('muted', '');
  video.addEventListener('canplay', () => {
    video.play().catch(() => {});
  }, { once: true });
}

function renderInsomnia(items) {
  const target = galleryTargets.insomnia;
  const videos = items.filter((item) => item.type === 'video');
  const stills = items.filter((item) => item.type === 'image');
  const backgrounds = stills.filter((item) => !/postcard|poster/i.test(item.title));
  const posters = stills.filter((item) => /poster/i.test(item.title));
  const postcards = stills.filter((item) => /postcard/i.test(item.title));
  target.replaceChildren();

  if (!items.length) {
    target.append(createEmptyState('works/insomnia', 'image or video'));
    return;
  }

  if (videos.length) {
    const videoGroup = document.createElement('div');
    videoGroup.className = 'insomnia-video-group';
    videoGroup.append(createGroupHeading('Film', videos.length, false));

    videos.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'work-card insomnia-video';
      const media = document.createElement('div');
      media.className = 'media gallery-media';
      media.append(createMedia(item));
      const award = document.createElement('div');
      award.className = 'award-caption solo film-award';
      award.innerHTML = '<strong>Jury-awarded Audience Choice Prize</strong>';
      card.append(media, award);
      videoGroup.append(card);
    });
    target.append(videoGroup);
  }

  if (backgrounds.length) {
    const stillGroup = document.createElement('div');
    stillGroup.className = 'insomnia-still-group';
    stillGroup.append(createGroupHeading('Backgrounds', backgrounds.length, false));

    const grid = document.createElement('div');
    grid.className = 'insomnia-stills';
    backgrounds.forEach((item) => {
      const figure = document.createElement('figure');
      figure.className = 'insomnia-still';

      const media = document.createElement('div');
      media.className = 'media gallery-media';
      const image = createMedia(item);
      classifyStill(image, figure);
      media.append(image);

      figure.append(media);
      if (!/^Background\s+\d+/i.test(item.title)) {
        const caption = document.createElement('figcaption');
        caption.textContent = item.title;
        figure.append(caption);
      }
      grid.append(figure);
    });
    stillGroup.append(grid);
    target.append(stillGroup);
  }

  if (posters.length || postcards.length) {
    const extrasGroup = document.createElement('div');
    extrasGroup.className = 'insomnia-extras-group';

  if (posters.length) {
    const posterGroup = document.createElement('div');
    posterGroup.className = 'insomnia-poster-group';
    posterGroup.append(createGroupHeading('Poster', posters.length, false));

    posters.forEach((item) => {
      const figure = document.createElement('figure');
      figure.className = 'insomnia-still poster';
      const media = document.createElement('div');
      media.className = 'media gallery-media';
      media.append(createMedia(item));
      figure.append(media);
      posterGroup.append(figure);
    });
    extrasGroup.append(posterGroup);
  }

  if (postcards.length) {
    const postcardGroup = document.createElement('div');
    postcardGroup.className = 'insomnia-postcard-group';
    postcardGroup.append(createGroupHeading('Postcard', postcards.length, false));

    postcards.forEach((item) => {
      const figure = document.createElement('figure');
      figure.className = 'insomnia-still postcard';
      const media = document.createElement('div');
      media.className = 'media gallery-media';
      media.append(createMedia(item));

      const caption = document.createElement('figcaption');
      caption.className = 'award-caption solo postcard-award';
      caption.innerHTML = '<strong>One of the winners</strong>';
      figure.append(media, caption);
      postcardGroup.append(figure);
    });
    extrasGroup.append(postcardGroup);
  }

    target.append(extrasGroup);
  }
}

function renderPersonal(items) {
  const target = galleryTargets.personal;
  target.replaceChildren();
  setSectionVisible('personal', items.length > 0);

  if (!items.length) {
    return;
  }

  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'artwork-card';

    const media = document.createElement('div');
    media.className = 'media gallery-media';
    media.append(createMedia(item));
    card.append(media);
    target.append(card);
  });
}

function renderStoryboards(items) {
  const target = galleryTargets.storyboards;
  const videos = items.filter((item) => item.type === 'video');
  const sequence = items.filter((item) => item.type === 'image');
  const documents = items.filter((item) => item.type === 'pdf');
  target.replaceChildren();

  if (!items.length) {
    target.append(createEmptyState('works/storyboards', 'image, video or PDF'));
    return;
  }

  if (videos.length) {
    const videoGroup = document.createElement('div');
    videoGroup.className = 'storyboard-video-group';
    videoGroup.append(createGroupHeading('Animatics', videos.length, false));

    const videoList = document.createElement('div');
    videoList.className = 'storyboard-videos';
    videos.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'reel-item';

      const number = document.createElement('div');
      number.className = 'reel-number';
      number.textContent = item.number;

      const frame = document.createElement('div');
      frame.className = 'reel-frame gallery-media';
      const video = createMedia(item, { loopingPreview: true });
      frame.append(video);

      const copy = document.createElement('div');
      copy.className = 'reel-copy';
      const title = document.createElement('h3');
      title.textContent = item.title;
      const type = document.createElement('p');
      type.textContent = item.label;
      copy.append(title, type);
      card.append(number, frame, copy);
      videoList.append(card);
    });
    videoGroup.append(videoList);
    target.append(videoGroup);
  }

  if (sequence.length) {
    const sequenceGroups = new Map();
    sequence.forEach((item) => {
      const prefix = item.title.replace(/\s+\d+$/u, '').trim() || 'Sequence';
      if (!sequenceGroups.has(prefix)) sequenceGroups.set(prefix, []);
      sequenceGroups.get(prefix).push(item);
    });

    const sequenceGroup = document.createElement('div');
    sequenceGroup.className = 'storyboard-sequence-group';
    sequenceGroup.append(createGroupHeading('Storyboard sequence', sequence.length, false));

    sequenceGroups.forEach((groupItems) => {
      const series = document.createElement('div');
      series.className = 'storyboard-sequence-series';
      const strip = document.createElement('div');
      strip.className = 'storyboard-sequence';
      groupItems.forEach((item) => {
        const figure = document.createElement('figure');
        const image = createMedia(item);
        figure.append(image);
        strip.append(figure);
      });
      series.append(strip);
      sequenceGroup.append(series);
    });
    target.append(sequenceGroup);
  }

  documents.forEach((item) => {
    const documentCard = document.createElement('div');
    documentCard.className = 'storyboard-document';
    documentCard.append(createMedia(item), createWorkMeta(item));
    target.append(documentCard);
  });
}

async function refreshGalleries() {
  try {
    const response = await fetch(`gallery-data.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Gallery data returned ${response.status}`);

    const data = await response.json();
    const nextSignature = JSON.stringify(data);
    if (nextSignature === gallerySignature) return;

    gallerySignature = nextSignature;
    renderInsomnia(data.insomnia ?? []);
    renderPersonal(data.personal ?? []);
    renderStoryboards(data.storyboards ?? []);
    Object.values(galleryTargets).forEach((target) => target.classList.remove('gallery-loading'));
  } catch (error) {
    console.error(error);
    Object.values(galleryTargets).forEach((target) => {
      target.classList.remove('gallery-loading');
      target.replaceChildren(createEmptyState('Run npm run dev', 'gallery'));
    });
  }
}

document.querySelector('#year').textContent = new Date().getFullYear();
refreshGalleries();

if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  setInterval(refreshGalleries, 2500);
}
