// eslint-disable-next-line import/no-cycle
import { loadArea, setConfig, getConfig } from './ak.js';

const hostnames = ['authorkit.dev', 'aem.page', 'aem.live', 'da.live'];

const locales = {
  '': { lang: 'en' },
  '/de': { lang: 'de' },
  '/es': { lang: 'es' },
  '/fr': { lang: 'fr' },
  '/hi': { lang: 'hi' },
  '/ja': { lang: 'ja' },
  '/zh': { lang: 'zh' },
};

const linkBlocks = [
  { fragment: '/fragments/' },
  { schedule: '/schedules/' },
  { youtube: 'https://www.youtube' },
];

// Blocks with self-managed styles
const components = ['fragment', 'schedule'];

// How to decorate an area before loading it
const decorateArea = ({ area = document }) => {
  const eagerLoad = (parent, selector) => {
    const img = parent.querySelector(selector);
    if (!img) return;
    img.removeAttribute('loading');
    img.fetchPriority = 'high';
  };

  eagerLoad(area, 'img');
};

// eslint-disable-next-line import/prefer-default-export
export async function loadPage() {
  setConfig({
    hostnames, locales, linkBlocks, components, decorateArea,
  });
  await loadArea();
}
await loadPage();

if (/\.(stage-ue|ue)\.da\.live$/.test(window.location.hostname)) {
  const { codeBase } = getConfig();
  // eslint-disable-next-line import/no-unresolved
  await import(`${codeBase}/scripts/ue.js`).then(({ default: ue }) => ue());
}

(function da() {
  const { searchParams } = new URL(window.location.href);
  const hasPreview = searchParams.has('dapreview');
  if (hasPreview) import('../tools/da/da.js').then((mod) => mod.default(loadPage));
  const hasQE = searchParams.has('quick-edit');
  if (hasQE) import('../tools/quick-edit/quick-edit.js').then((mod) => mod.default());
}());
