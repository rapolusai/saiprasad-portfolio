export const CONTENT_PATH = "content/projects.json";
export const SITE_PATH = "content/site.json";
export const PRODUCTS_PATH = "content/products.json";

export const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export const safeUrl = (value = "") => {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

export const absoluteAsset = (path = "") => {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return path.replace(/^\.?\//, "");
};

export async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

export function initializeCommon(site = {}) {
  document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = new Date().getFullYear(); });
  const social = site.social || {};
  Object.entries(social).forEach(([network, url]) => {
    if (!url) return;
    document.querySelectorAll(`[data-social="${network}"]`).forEach((link) => {
      link.href = safeUrl(url);
      link.hidden = false;
    });
  });
  if (site.resumeUrl) {
    document.querySelectorAll("[data-resume-link]").forEach((link) => {
      link.href = safeUrl(site.resumeUrl);
      link.textContent = "Download my resume ↗";
    });
  }
}

export const projectHref = (slug) => `project.html?slug=${encodeURIComponent(slug)}`;

export function initials(title = "Project") {
  return title.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}
