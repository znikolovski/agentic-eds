function applyFocalPoint(img) {
  const { title } = img.dataset;
  if (!title?.includes('data-focal')) return;
  delete img.dataset.title;
  const [x, y] = title.split(':')[1].split(',');
  img.style.objectPosition = `${x}% ${y}%`;
}

export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];

  // First row: background image
  const bgRow = rows.shift();
  if (bgRow) {
    const pic = bgRow.querySelector('picture');
    if (pic) {
      bgRow.classList.add('cta-banner-bg');
      const img = pic.querySelector('img');
      if (img) applyFocalPoint(img);
    } else {
      bgRow.remove();
    }
  }

  // Remaining rows: content
  const content = document.createElement('div');
  content.classList.add('cta-banner-content');

  rows.forEach((row) => {
    const cell = row.querySelector(':scope > div');
    if (!cell) return;
    content.append(...cell.childNodes);
    row.remove();
  });

  block.append(content);
}
