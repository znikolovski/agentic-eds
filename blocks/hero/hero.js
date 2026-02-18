function setBackgroundFocus(img) {
  const { title } = img.dataset;
  if (!title?.includes('data-focal')) return;
  delete img.dataset.title;
  const [x, y] = title.split(':')[1].split(',');
  img.style.objectPosition = `${x}% ${y}%`;
}

function decorateBackground(bg) {
  const bgPic = bg.querySelector('picture');
  if (!bgPic) return;

  const img = bgPic.querySelector('img');
  setBackgroundFocus(img);

  const vidLink = bgPic.closest('a[href*=".mp4"]');
  if (!vidLink) return;
  const video = document.createElement('video');
  video.src = vidLink.href;
  video.loop = true;
  video.muted = true;
  video.inert = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('preload', 'none');
  video.load();
  video.addEventListener('canplay', () => {
    video.play();
    bgPic.remove();
  });
  vidLink.parentElement.append(video, bgPic);
  vidLink.remove();
}

function decorateForeground(fg) {
  [...fg.children].forEach((child, idx) => {
    const heading = child.querySelector('h1, h2, h3, h4, h5, h6');
    const text = heading || child.querySelector('p, a, ul');
    if (heading) {
      heading.classList.add('hero-heading');
      const detail = heading.previousElementSibling;
      if (detail) {
        detail.classList.add('hero-detail');
      }
    }
    // Determine foreground column types
    if (text) {
      child.classList.add('fg-text');
      if (idx === 0) {
        child.closest('.hero').classList.add('hero-text-start');
      } else {
        child.closest('.hero').classList.add('hero-text-end');
      }
    }
  });
}

function decorateCard(el) {
  const rows = [...el.querySelectorAll(':scope > div')];

  // Detect background row (first row containing a picture or video link)
  const firstCell = rows[0]?.querySelector(':scope > div');
  const hasBg = firstCell?.querySelector('picture') || firstCell?.querySelector('a[href*=".mp4"]');
  if (hasBg) {
    const bgRow = rows.shift();
    bgRow.classList.add('hero-background');
    decorateBackground(bgRow);
  }

  // Build foreground card from remaining rows
  const fg = document.createElement('div');
  fg.classList.add('hero-foreground');
  const col = document.createElement('div');
  col.classList.add('fg-text');

  rows.forEach((row, idx) => {
    const cell = row.querySelector(':scope > div');
    if (!cell) return;
    let heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
    const btn = cell.querySelector('.btn');

    if (!heading && idx === 0) {
      const strong = cell.querySelector('strong');
      if (strong && !btn) {
        heading = document.createElement('h2');
        heading.textContent = strong.textContent;
      }
    }

    if (heading) {
      heading.classList.add('hero-heading');
      col.append(heading);
    } else if (btn) {
      const group = document.createElement('p');
      group.classList.add('btn-group');
      group.append(...cell.childNodes);
      col.append(group);
    } else {
      const p = document.createElement('p');
      p.append(...cell.childNodes);
      col.append(p);
    }
    row.remove();
  });

  fg.append(col);
  el.append(fg);
}

export default async function init(el) {
  if (el.classList.contains('card')) {
    decorateCard(el);
    return;
  }
  const rows = [...el.querySelectorAll(':scope > div')];
  const fg = rows.pop();
  fg.classList.add('hero-foreground');
  decorateForeground(fg);
  if (rows.length) {
    const bg = rows.pop();
    bg.classList.add('hero-background');
    decorateBackground(bg);
  }
}
