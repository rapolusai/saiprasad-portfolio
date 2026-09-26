import { absoluteAsset, escapeHtml, fetchJson, initializeCommon, initials, safeUrl, SITE_PATH, CONTENT_PATH } from "./shared.js";

const root = document.querySelector("[data-project-story]");
const slug = new URLSearchParams(window.location.search).get("slug");

function facts(project) {
  return [
    ["Role", project.role || "Software engineering"],
    ["Timeline", project.timeline || "Iterative delivery"],
    ["Year", project.year || "Recent"],
    ["Stack", (project.technologies || []).slice(0, 3).join(" · ") || "Full stack"]
  ].map(([label, value]) => `<div><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`).join("");
}

function storySection(number, label, title, body, extra = "") {
  if (!body) return "";
  return `<section class="story-section reveal"><div class="story-section__label">${number} / ${escapeHtml(label)}</div><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p>${extra}</div></section>`;
}

function render(project) {
  const images = project.images || [];
  const cover = images[0];
  const highlights = (project.highlights || []).filter(Boolean);
  const links = [["View live product", safeUrl(project.liveUrl)]].filter(([, url]) => url);
  document.title = `${project.title} — Rapolu\`s`;
  root.innerHTML = `<article>
    <header class="story-hero reveal"><div class="story-hero__meta"><span>${escapeHtml(project.category || "Case study")}</span><span>${escapeHtml(project.status === "draft" ? "Preview" : "Published")}</span></div>
      <h1>${escapeHtml(project.title)}</h1><p class="story-hero__summary">${escapeHtml(project.summary)}</p>
      <div class="story-hero__facts">${facts(project)}</div></header>
    <div class="story-cover reveal">${cover ? `<img src="${escapeHtml(absoluteAsset(cover.path))}" alt="${escapeHtml(cover.alt || `${project.title} project screen`)}">` : `<div class="story-cover__placeholder">${escapeHtml(initials(project.title))}</div>`}</div>
    <div class="story-content">
      ${storySection("01", "Context", "The challenge", project.challenge)}
      ${storySection("02", "Engineering", "The approach", project.solution)}
      ${storySection("03", "Impact", "What changed", project.outcome, highlights.length ? `<ul class="story-highlights">${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "")}
      ${storySection("04", "Next", "Where it can go", project.future)}
      ${links.length ? `<section class="story-section reveal"><div class="story-section__label">05 / LINKS</div><div><h2>Explore further</h2><div class="story-links">${links.map(([label, url]) => `<a class="button button--ghost" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${label} <span>↗</span></a>`).join("")}</div></div></section>` : ""}
    </div>
    ${images.length > 1 ? `<div class="story-gallery">${images.slice(1).map((image) => `<figure class="reveal"><img src="${escapeHtml(absoluteAsset(image.path))}" alt="${escapeHtml(image.alt || `${project.title} interface screen`)}" loading="lazy">${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ""}</figure>`).join("")}</div>` : ""}
    <aside class="story-next reveal"><p class="eyebrow">Have a similar challenge?</p><h2>Let’s turn complexity into a system your team can trust.</h2><a class="button button--light" href="contact.html?project=${encodeURIComponent(project.title)}">Start a conversation <span>↗</span></a></aside>
  </article>`;
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")), { threshold: .08 });
  root.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
}

function notFound() {
  root.innerHTML = `<section class="project-story-loading"><p class="eyebrow">Project not found</p><h1>This story isn’t published yet.</h1><a class="button button--ghost" href="index.html#work">Return to selected work</a></section>`;
}

async function start() {
  try {
    const [site, content] = await Promise.all([fetchJson(SITE_PATH), fetchJson(CONTENT_PATH)]);
    initializeCommon(site);
    const isPreview = new URLSearchParams(window.location.search).has("preview");
    let project = (content.projects || []).find((item) => item.slug === slug && (item.status === "published" || isPreview));
    if (isPreview) {
      try {
        const preview = JSON.parse(sessionStorage.getItem("portfolio-project-preview") || "null");
        if (preview?.slug === slug) project = preview;
      } catch { /* Ignore malformed local preview data. */ }
    }
    project ? render(project) : notFound();
  } catch { notFound(); }
}
start();
