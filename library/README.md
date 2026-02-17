# Block Library Sample Content

Sample content for the da.live Document Authoring block library. Use these pages and structure when configuring blocks for your site.

## Carousel Block

### Preview

- **Sample page:** `library/carousel.plain.html`
- **Local preview:** Run `npx -y @adobe/aem-cli up --html-folder library` and open `http://localhost:3000/library/carousel`
- **Published URL:** `https://main--{repo}--{owner}.aem.live/library/carousel` (after deploying and adding library content)

### Adding to da.live Block Library

1. In da.live Admin, go to the block library setup for your site.
2. Add a new block entry for "Carousel".
3. Use the sample page URL as the reference/preview link.
4. Provide authors with the table structure below for creating carousel content in their documents.

### Document/Sheet Table Structure

When authoring a carousel in Google Docs or your Document Authoring source, use this table structure. Each row is one slide.

**Block header row:**
| carousel |

**Or with auto-play:** Use section metadata or add `autoplay` to the block name: `carousel autoplay`

**Slide rows (one row per slide, two columns):**

| Column 1: Image or Video | Column 2: Content |
|--------------------------|-------------------|
| ![Alt text](image-url.jpg) or [YouTube link](https://www.youtube.com/watch?v=xxx) | ## Heading<br><br>Body text<br><br>**[CTA link](url)** |
| ... | ... |

**Example – 2 slides with images:**

| carousel |
|----------|
| ![Slide 1](https://example.com/slide1.jpg) | ## Unmatched speed<br><br>AEM is the fastest way to publish.<br><br>**[Get started](https://www.aem.live/)** |
| ![Slide 2](https://example.com/slide2.jpg) | ## Content at scale<br><br>Publish more content with smaller teams. |

**Example – Video slide:**

| ![Image](url) | ## Image slide |
| [https://www.youtube.com/watch?v=dQw4w9WgXcQ](https://www.youtube.com/watch?v=dQw4w9WgXcQ) | ## Video slide<br><br>YouTube embeds work in the carousel. |

### Authoring Tips

- **Images:** Use an image reference or link in the first column.
- **Videos:** Paste a YouTube URL as a link in the first column.
- **Content:** Use headings (##, ###), paragraphs, and links. Wrap CTA links in **bold** for button styling.
- **Auto-play:** Add `autoplay` to section style or use block name `carousel autoplay`.
