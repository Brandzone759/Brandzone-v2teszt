#!/usr/bin/env node
/**
 * BrandZone blog build script
 * ============================
 *
 * Turns per-article source files into the final static blog pages, the blog
 * index (card list) and the blog URL block inside sitemap.xml.
 *
 * This is NOT a framework or a server. It is a one-shot script you run locally
 * before committing:
 *
 *     node scripts/build-blog.js            # build everything
 *     node scripts/build-blog.js --check    # validate only, write nothing
 *
 * The output is plain static HTML — identical in spirit to what Netlify already
 * serves today. Nothing here runs at request time.
 *
 * ── Source layout (per language) ────────────────────────────────────────────
 *
 *   blog/
 *     _template.html          shared article shell (menu, footer, tracking, JSON-LD slot)
 *     _index_template.html    shared index shell (with a {{CARDS_HTML}} slot)
 *     blog-style.css
 *     content/
 *       <slug>/               ← the folder name IS the slug (single source of truth)
 *         meta.json           title, description, dates, faq, highlights, cta ...
 *         body.html           the article torso only (no hero / faq / cta)
 *
 *   blog-ro/                  same structure; its own template with Romanian chrome.
 *                             Skipped automatically until the folder exists.
 *
 * ── meta.json fields ────────────────────────────────────────────────────────
 *
 *   Required : title, description, ogDescription, eyebrow, datePublished,
 *              readingTime, excerpt
 *   Optional : lang (default = the site's language),
 *              order (tie-break within one datePublished; lower = higher up),
 *              highlights [ {value,label} ], faq [ {q,a} ],
 *              ctaTitle, ctaText
 *   Not used : slug (comes from folder name), image (og:image + JSON-LD image are
 *              fixed to the logo), featured (card size is position-driven),
 *              dateModified (JSON-LD uses datePublished)
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ── Configuration ───────────────────────────────────────────────────────────

const ROOT = path.join(__dirname, "..");
const SITE_URL = "https://brandzone.ro";
const LOGO_URL = `${SITE_URL}/brandzone-logo.jpg`; // fixed og:image + JSON-LD image
const SITEMAP_PATH = path.join(ROOT, "sitemap.xml");

// One entry per language. A site is skipped if its folder does not exist yet,
// so adding blog-ro later needs no change here beyond creating the folder.
const SITES = [
  { base: "blog", lang: "hu" },
  { base: "blog-ro", lang: "ro" },
];

const CHECK_ONLY = process.argv.includes("--check");

// ── Small helpers ───────────────────────────────────────────────────────────

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

/** Escape a plain-text value so it is safe inside HTML text or an attribute. */
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strip tags to plain text (used for the JSON-LD FAQ answer text). */
function stripTags(html) {
  return String(html).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

const HU_MONTHS = [
  "január", "február", "március", "április", "május", "június",
  "július", "augusztus", "szeptember", "október", "november", "december",
];
const RO_MONTHS = [
  "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
  "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie",
];

/** "2026-07-31" → "2026. július 31." (hu) / "31 iulie 2026" (ro). */
function formatDate(iso, lang) {
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return iso;
  if (lang === "ro") return `${d} ${RO_MONTHS[m - 1]} ${y}`;
  return `${y}. ${HU_MONTHS[m - 1]} ${d}.`;
}

// ── 1. Load one site's articles ─────────────────────────────────────────────

function loadArticles(site) {
  const contentDir = path.join(ROOT, site.base, "content");
  if (!fs.existsSync(contentDir)) return [];

  const slugs = fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const articles = [];

  for (const slug of slugs) {
    const dir = path.join(contentDir, slug);
    const metaPath = path.join(dir, "meta.json");
    const bodyPath = path.join(dir, "body.html");
    const coverPath = path.join(dir, "cover.svg");

    if (!fs.existsSync(metaPath)) {
      fail(`[${site.base}/${slug}] missing meta.json`);
      continue;
    }
    if (!fs.existsSync(bodyPath)) {
      fail(`[${site.base}/${slug}] missing body.html`);
      continue;
    }

    let meta;
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    } catch (e) {
      fail(`[${site.base}/${slug}] meta.json is not valid JSON: ${e.message}`);
      continue;
    }

    // A slug in meta.json is not needed; if present it must match the folder,
    // otherwise the two can silently drift (the historical canonical bug).
    if (meta.slug && meta.slug !== slug) {
      fail(
        `[${site.base}/${slug}] meta.json "slug" ("${meta.slug}") does not match the ` +
          `folder name. Remove it, or rename the folder — never let them differ.`
      );
    }

    const required = [
      "title", "description", "ogDescription",
      "eyebrow", "datePublished", "readingTime", "excerpt",
    ];
    for (const field of required) {
      if (!meta[field]) fail(`[${site.base}/${slug}] meta.json is missing required field "${field}"`);
    }

    articles.push({
      site: site.base,
      slug,
      lang: meta.lang || site.lang,
      title: meta.title,
      description: meta.description,
      ogDescription: meta.ogDescription || meta.description,
      eyebrow: meta.eyebrow,
      datePublished: meta.datePublished,
      order: typeof meta.order === "number" ? meta.order : Infinity,
      readingTime: meta.readingTime,
      excerpt: meta.excerpt || meta.description,
      highlights: Array.isArray(meta.highlights) ? meta.highlights : [],
      faq: Array.isArray(meta.faq) ? meta.faq : [],
      ctaTitle: meta.ctaTitle || "Nézzük meg együtt, hol tart nálatok",
      ctaText:
        meta.ctaText ||
        "Írj nekünk, és átbeszéljük. Nem árajánlattal kezdünk, hanem azzal, hogy megnézzük, van-e egyáltalán értelme.",
      body: fs.readFileSync(bodyPath, "utf8").trim(),
      coverSvg: fs.existsSync(coverPath) ? fs.readFileSync(coverPath, "utf8").trim() : null,
    });
  }

  return articles;
}

// ── 2. Validate internal links within a site ────────────────────────────────

function validateLinks(articles) {
  const known = new Set(articles.map((a) => a.slug));
  for (const art of articles) {
    // Relative "<slug>.html" links (the style used across the codebase).
    for (const m of art.body.matchAll(/href="([a-z0-9\-]+)\.html"/g)) {
      if (!known.has(m[1])) {
        fail(`[${art.site}/${art.slug}] broken internal link: "${m[1]}.html" — no such article`);
      }
    }
    // Absolute "/<base>/<slug>" links (catches the old wrong-slug pattern).
    for (const m of art.body.matchAll(new RegExp(`href="/${art.site}/([a-z0-9\\-]+)"`, "g"))) {
      if (!known.has(m[1])) {
        fail(`[${art.site}/${art.slug}] broken internal link: "/${art.site}/${m[1]}" — no such slug`);
      }
    }
  }
}

// ── 3. Render one article ───────────────────────────────────────────────────

function renderHighlights(highlights) {
  if (!highlights.length) return "";
  const items = highlights
    .map(
      (h) =>
        `            <div class="art-band card-effects">\n` +
        `                <span class="art-band-price">${esc(h.value)}</span>\n` +
        `                <span class="art-band-label">${esc(h.label)}</span>\n` +
        `            </div>`
    )
    .join("\n");
  return `        <div class="art-bands">\n${items}\n        </div>\n`;
}

function renderFaq(faq, lang) {
  if (!faq.length) return "";
  const items = faq
    .map(
      (f) =>
        `                <div class="art-faq-item">\n` +
        `                    <button type="button" class="art-faq-q">${esc(f.q)}</button>\n` +
        // f.a is author-written HTML (may contain <strong>, <a>): do NOT escape.
        `                    <div class="art-faq-a"><p>${f.a}</p></div>\n` +
        `                </div>`
    )
    .join("\n");
  const title = lang === "ro" ? "Întrebări frecvente" : "Gyakori kérdések";
  return (
    `\n            <div class="art-faq">\n` +
    `                <h2>${title}</h2>\n\n${items}\n            </div>\n`
  );
}

function renderJsonLd(art) {
  const indent = (obj) => JSON.stringify(obj, null, 2).replace(/\n/g, "\n    ");

  const blocks = [];

  blocks.push(
    `    <script type="application/ld+json">\n    ` +
      indent({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: art.title,
        description: art.description,
        inLanguage: art.lang,
        datePublished: art.datePublished,
        dateModified: art.datePublished,
        image: LOGO_URL,
        mainEntityOfPage: `${SITE_URL}/${art.site}/${art.slug}`,
        author: { "@type": "Organization", name: "BrandZone", url: SITE_URL },
        publisher: {
          "@type": "Organization",
          name: "BrandZone",
          logo: { "@type": "ImageObject", url: LOGO_URL },
        },
      }) +
      `\n    </script>`
  );

  if (art.faq.length) {
    blocks.push(
      `    <script type="application/ld+json">\n    ` +
        indent({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: art.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: stripTags(f.a) },
          })),
        }) +
        `\n    </script>`
    );
  }

  return blocks.join("\n");
}

function renderArticle(template, art) {
  const map = {
    "{{LANG}}": art.lang,
    "{{TITLE}}": esc(art.title),
    "{{DESCRIPTION}}": esc(art.description),
    "{{OG_DESCRIPTION}}": esc(art.ogDescription),
    "{{SLUG}}": art.slug,
    "{{JSONLD}}": renderJsonLd(art),
    "{{EYEBROW}}": esc(art.eyebrow),
    "{{DATE_DISPLAY}}": esc(formatDate(art.datePublished, art.lang)),
    "{{READING_TIME}}": esc(art.readingTime),
    "{{HIGHLIGHTS_HTML}}": renderHighlights(art.highlights),
    "{{ARTICLE_BODY}}": art.body, // author HTML — not escaped
    "{{FAQ_HTML}}": renderFaq(art.faq, art.lang),
    "{{CTA_TITLE}}": esc(art.ctaTitle),
    "{{CTA_TEXT}}": art.ctaText, // author HTML — not escaped
  };
  let html = template;
  for (const [key, val] of Object.entries(map)) html = html.split(key).join(val);
  return html;
}

// ── 4. Order articles + assign card size ────────────────────────────────────

// Sort: newest first → then `order` ascending within a date → then slug.
function sortForIndex(articles) {
  return [...articles].sort(
    (a, b) =>
      b.datePublished.localeCompare(a.datePublished) ||
      a.order - b.order ||
      a.slug.localeCompare(b.slug)
  );
}

// Card size is position-driven: every 3rd card (0,3,6,…) is full width, giving
// the 1-card / 2-card / 1-card rhythm. A final card that would otherwise sit
// alone in a 2-card row is promoted to full width too.
function isFeatured(i, total) {
  if (i % 3 === 0) return true;
  if (i === total - 1 && i % 3 === 1) return true;
  return false;
}

// A deterministic cover pattern per slug (matches classes in blog-style.css).
const COVERS = ["bars", "curve", "wave"];
function coverFor(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return COVERS[h % COVERS.length];
}
function defaultCoverSvg(slug) {
  const p = coverFor(slug);
  if (p === "bars") {
    return `<svg viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                        <rect class="cover-bar b1" x="60" y="62" width="60" height="14" rx="7"/>
                        <rect class="cover-bar b2" x="60" y="105" width="130" height="14" rx="7"/>
                        <rect class="cover-bar b3" x="60" y="148" width="210" height="14" rx="7"/>
                        <path class="cover-line" d="M60,40 V186"/>
                    </svg>`;
  }
  if (p === "wave") {
    return `<svg viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                        <path class="cover-wave-a" d="M-40,92 Q0,58 40,92 T120,92 T200,92 T280,92 T360,92 T440,92"/>
                        <path class="cover-wave-b" d="M-40,138 Q0,172 40,138 T120,138 T200,138 T280,138 T360,138 T440,138"/>
                        <path class="cover-line" d="M200,20 V205"/>
                    </svg>`;
  }
  return `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                        <path class="cover-line" d="M0,210 H400 M0,160 H400 M0,110 H400 M0,60 H400"/>
                        <path class="cover-curve" d="M20,225 C90,215 120,180 160,150 S250,110 300,55 L360,40"/>
                        <circle class="cover-dot" cx="360" cy="40" r="6"/>
                    </svg>`;
}

function renderIndex(indexTemplate, articles) {
  const ordered = sortForIndex(articles);
  const total = ordered.length;
  const cards = ordered
    .map((a, i) => {
      const cls = isFeatured(i, total) ? "blog-card featured card-effects" : "blog-card card-effects";
      return (
        `            <a href="${a.slug}.html" class="${cls}">\n` +
        `                <div class="blog-cover">\n` +
        `                    ${a.coverSvg || defaultCoverSvg(a.slug)}\n` +
        `                </div>\n` +
        `                <div class="blog-card-body">\n` +
        `                    <p class="blog-card-eyebrow">${esc(a.eyebrow)}</p>\n` +
        `                    <h2>${esc(a.title)}</h2>\n` +
        `                    <p>${esc(a.excerpt)}</p>\n` +
        `                    <span class="blog-card-meta">${esc(a.readingTime)} <span class="arrow">→</span></span>\n` +
        `                </div>\n` +
        `            </a>`
      );
    })
    .join("\n\n");
  return indexTemplate.replace("{{CARDS_HTML}}", cards);
}

// ── 5. Sitemap block per site ───────────────────────────────────────────────

function sitemapUrlsForSite(site, articles) {
  const ordered = sortForIndex(articles);
  const today = new Date().toISOString().slice(0, 19) + "+00:00";
  const lines = [
    `<url>\n  <loc>${SITE_URL}/${site.base}/</loc>\n  <lastmod>${today}</lastmod>\n  <priority>0.80</priority>\n</url>`,
    ...ordered.map(
      (a) =>
        `<url>\n  <loc>${SITE_URL}/${site.base}/${a.slug}</loc>\n` +
        `  <lastmod>${a.datePublished}T00:00:00+00:00</lastmod>\n  <priority>0.60</priority>\n</url>`
    ),
  ];
  return lines.join("\n");
}

function updateSitemap(perSiteUrls) {
  if (!fs.existsSync(SITEMAP_PATH)) {
    warn(`sitemap.xml not found at ${SITEMAP_PATH} — skipped.`);
    return;
  }
  let sitemap = fs.readFileSync(SITEMAP_PATH, "utf8");

  for (const { base, urls } of perSiteUrls) {
    const marker = `${base.toUpperCase()}-URLS`; // BLOG-URLS / BLOG-RO-URLS
    const start = `<!-- ${marker}-START -->`;
    const end = `<!-- ${marker}-END -->`;
    const block = `${start}\n${urls}\n${end}`;

    if (sitemap.includes(start) && sitemap.includes(end)) {
      sitemap = sitemap.replace(new RegExp(`${start}[\\s\\S]*?${end}`), block);
    } else {
      sitemap = sitemap.replace("</urlset>", `${block}\n</urlset>`);
      warn(`sitemap.xml had no ${marker} markers — inserted a new block before </urlset>. Review the diff.`);
    }
  }

  fs.writeFileSync(SITEMAP_PATH, sitemap, "utf8");
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const built = []; // { site, articles }

  for (const site of SITES) {
    const siteDir = path.join(ROOT, site.base);
    if (!fs.existsSync(siteDir)) continue; // e.g. blog-ro not created yet

    const articles = loadArticles(site);
    if (!articles.length) continue;

    validateLinks(articles);
    built.push({ site, articles });
  }

  if (errors.length) {
    console.error("\n✖ Build stopped — fix these first:\n");
    errors.forEach((e) => console.error("  - " + e));
    process.exit(1);
  }

  if (CHECK_ONLY) {
    const n = built.reduce((s, b) => s + b.articles.length, 0);
    console.log(`✓ ${n} article(s) across ${built.length} site(s) validated — no errors.`);
    warnings.forEach((w) => console.warn("  ! " + w));
    process.exit(0);
  }

  const perSiteUrls = [];

  for (const { site, articles } of built) {
    const siteDir = path.join(ROOT, site.base);
    const template = fs.readFileSync(path.join(siteDir, "_template.html"), "utf8");
    const indexTemplate = fs.readFileSync(path.join(siteDir, "_index_template.html"), "utf8");

    for (const art of articles) {
      const html = renderArticle(template, art);
      fs.writeFileSync(path.join(siteDir, `${art.slug}.html`), html, "utf8");
      console.log(`✓ wrote ${site.base}/${art.slug}.html`);
    }

    fs.writeFileSync(path.join(siteDir, "index.html"), renderIndex(indexTemplate, articles), "utf8");
    console.log(`✓ wrote ${site.base}/index.html (${articles.length} cards)`);

    perSiteUrls.push({ base: site.base, urls: sitemapUrlsForSite(site, articles) });
  }

  updateSitemap(perSiteUrls);
  console.log(`✓ updated sitemap.xml`);

  const total = built.reduce((s, b) => s + b.articles.length, 0);
  console.log(`\n✓ Build complete: ${total} article(s) across ${built.length} site(s).`);
  if (warnings.length) {
    console.log("\nWarnings:");
    warnings.forEach((w) => console.log("  ! " + w));
  }
}

main();