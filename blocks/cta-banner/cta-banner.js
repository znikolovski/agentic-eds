export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];

  // First row: background image
  const bgRow = rows.shift();
  if (bgRow) {
    const pic = bgRow.querySelector('picture');
    if (pic) {
      bgRow.classList.add('cta-banner-bg');
      const img = pic.querySelector('img');

      // Next row may hold image crop/position (e.g. "50, 25")
      if (img && rows.length) {
        const nextCell = rows[0]?.querySelector(':scope > div');
        const text = nextCell?.textContent.trim();
        if (text && /^\d+\s*,\s*\d+$/.test(text)) {
          const [x, y] = text.split(',').map((v) => v.trim());
          img.style.objectPosition = `${x}% ${y}%`;
          rows.shift().remove();
        }
      }
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
