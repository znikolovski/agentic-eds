/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { showSlide } from '../blocks/carousel/carousel.js';
import { moveInstrumentation } from './ue-utils.js';

/**
 * Construct a DA editor URL for a given content path.
 * Derives org/site from the UE hostname (branch--site--org.ue.da.live).
 */
function getDaEditUrl(path) {
  const { hostname } = window.location;
  const match = hostname.match(/^[^-]+--([^-]+)--([^.]+)\./);
  if (!match) return null;
  const [, site, org] = match;
  return `https://da.live/edit#/${org}/${site}${path}`;
}

const setupObservers = () => {
  const mutatingBlocks = document.querySelectorAll('div.cards, div.carousel, div.card, div.hero, div.cta-banner');
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.target.tagName === 'DIV') {
        const addedElements = mutation.addedNodes;
        const removedElements = mutation.removedNodes;

        // detect the mutation type of the block or picture (for cards)
        const type = mutation.target.classList.contains('cards-card-image') ? 'cards-image' : mutation.target.attributes['data-aue-component']?.value;

        switch (type) {
          case 'cards':
            // handle card div > li replacements
            if (addedElements.length === 1 && addedElements[0].tagName === 'UL') {
              const ulEl = addedElements[0];
              const removedDivEl = [...mutation.removedNodes].filter((node) => node.tagName === 'DIV');
              removedDivEl.forEach((div, index) => {
                if (index < ulEl.children.length) {
                  moveInstrumentation(div, ulEl.children[index]);
                }
              });
            }
            break;
          case 'cards-image':
            // handle card-image picture replacements
            if (mutation.target.classList.contains('cards-card-image')) {
              const addedPictureEl = [...mutation.addedNodes].filter((node) => node.tagName === 'PICTURE');
              const removedPictureEl = [...mutation.removedNodes].filter((node) => node.tagName === 'PICTURE');
              if (addedPictureEl.length === 1 && removedPictureEl.length === 1) {
                const oldImgEL = removedPictureEl[0].querySelector('img');
                const newImgEl = addedPictureEl[0].querySelector('img');
                if (oldImgEL && newImgEl) {
                  moveInstrumentation(oldImgEL, newImgEl);
                }
              }
            }
            break;
          case 'carousel': {
            // replaceChildren removes all rows in a single mutation,
            // so iterate through all removed carousel-item nodes
            const removedItems = [...removedElements].filter(
              (node) => node.attributes?.['data-aue-component']?.value === 'carousel-item',
            );
            const slides = mutation.target.querySelectorAll('li.carousel-slide');
            removedItems.forEach((removedItem) => {
              const resourceAttr = removedItem.getAttribute('data-aue-resource');
              if (resourceAttr) {
                const itemMatch = resourceAttr.match(/item-(\d+)/);
                if (itemMatch && itemMatch[1]) {
                  const slideIndex = parseInt(itemMatch[1], 10);
                  const targetSlide = Array.from(slides).find(
                    (slide) => parseInt(slide.getAttribute('data-slide-index'), 10) === slideIndex,
                  );
                  if (targetSlide) {
                    moveInstrumentation(removedItem, targetSlide);
                  }
                }
              }
            });
            break;
          }
          case 'card':
            // handle picture extraction from <p> into card-picture-container
            if (addedElements.length === 1 && addedElements[0].classList?.contains('card-picture-container')) {
              const removedP = [...removedElements].find((node) => node.tagName === 'P');
              if (removedP) {
                const oldImg = removedP.querySelector('img');
                const newImg = addedElements[0].querySelector('img');
                if (oldImg && newImg) {
                  moveInstrumentation(oldImg, newImg);
                }
              }
            }
            break;
          case 'hero':
            // handle card variant: content rows removed, foreground added
            if (addedElements.length === 1 && addedElements[0].classList?.contains('hero-foreground')) {
              const fg = addedElements[0];
              const removedRows = [...removedElements].filter((node) => node.tagName === 'DIV');
              const fgText = fg.querySelector('.fg-text');
              if (fgText && removedRows.length > 0) {
                // Transfer instrumentation from first content row to foreground text
                moveInstrumentation(removedRows[0], fgText);
              }
            }
            break;
          case 'cta-banner':
            // handle content rows removed, cta-banner-content wrapper added
            if (addedElements.length === 1 && addedElements[0].classList?.contains('cta-banner-content')) {
              const contentDiv = addedElements[0];
              const removedRows = [...removedElements].filter((node) => node.tagName === 'DIV');
              if (removedRows.length > 0) {
                moveInstrumentation(removedRows[0], contentDiv);
              }
            }
            break;
          default:
            break;
        }
      }
    });
  });

  mutatingBlocks.forEach((cardsBlock) => {
    observer.observe(cardsBlock, { childList: true, subtree: true });
  });
};

const setupUEEventHandlers = () => {
  // For each picture or img element change, update the srcsets of the picture element sources
  document.body.addEventListener('aue:content-patch', ({ detail: { patch, request } }) => {
    let element = document.querySelector(`[data-aue-resource="${request.target.resource}"]`);
    if (element && element.getAttribute('data-aue-prop') !== patch.name) element = element.querySelector(`[data-aue-prop='${patch.name}']`);
    if (element?.getAttribute('data-aue-type') !== 'media') return;

    const picture = element.tagName === 'IMG' ? element.closest('picture') : element;
    picture?.querySelectorAll('source').forEach((source) => source.remove());
    picture?.querySelector('img')?.removeAttribute('srcset');
  });

  document.body.addEventListener('aue:ui-select', (event) => {
    const { detail } = event;
    const resource = detail?.resource;

    // Remove any existing fragment edit overlay
    document.querySelectorAll('.fragment-edit-overlay').forEach((el) => el.remove());

    if (resource) {
      const element = document.querySelector(`[data-aue-resource="${resource}"]`);
      if (!element) {
        return;
      }
      const blockEl = element.parentElement?.closest('.block[data-aue-resource]') || element?.closest('.block[data-aue-resource]');
      if (blockEl) {
        const block = blockEl.getAttribute('data-aue-component');
        const index = element.getAttribute('data-slide-index');

        switch (block) {
          case 'carousel':
            if (index) {
              showSlide(blockEl, index);
            }
            break;
          default:
            break;
        }
      }

      // Check if the selected element or its context has a fragment path
      const fragmentEl = element.closest('[data-fragment-path]')
        || element.querySelector('[data-fragment-path]');
      if (fragmentEl) {
        const { fragmentPath } = fragmentEl.dataset;
        const editUrl = getDaEditUrl(fragmentPath);
        if (editUrl) {
          const overlay = document.createElement('div');
          overlay.className = 'fragment-edit-overlay';
          overlay.style.cssText = 'position:absolute;top:0;right:0;z-index:9999;padding:6px 12px;'
            + 'background:#1473e6;color:#fff;border-radius:0 0 0 4px;font:600 13px/1.4 sans-serif;'
            + 'cursor:pointer;display:flex;align-items:center;gap:6px;';
          overlay.innerHTML = '<span>Edit Fragment</span><span style="font-size:16px">\u2197</span>';
          overlay.addEventListener('pointerdown', (e) => {
            e.stopImmediatePropagation();
            e.preventDefault();
            window.open(editUrl, '_blank');
          });
          fragmentEl.style.position = 'relative';
          fragmentEl.prepend(overlay);
        }
      }
    }
  });
};

export default () => {
  setupObservers();
  setupUEEventHandlers();
};
