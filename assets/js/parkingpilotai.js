document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll(".ppai-card, .ppai-price, .ppai-steps li").forEach((node) => {
  node.classList.add("ppai-reveal");
  observer.observe(node);
});

// Product pages link to each other with site-root paths (/parkingpilotai/privacy, /).
// Resolve them against wherever the site is actually served (a preview, a sub-folder,
// a local server) and to real file names, so every link works in all of those places
// as well as on the live domain.
const siteRoot = new URL("../../", import.meta.url);
document.querySelectorAll('a[href^="/"]:not([href^="//"])').forEach((link) => {
  const raw = link.getAttribute("href");
  const hash = raw.includes("#") ? raw.slice(raw.indexOf("#")) : "";
  const parts = raw.split("#")[0].split("?")[0].split("/").filter(Boolean);
  const file = !parts.length ? "index.html" : parts.length === 1 ? `${parts[0]}/index.html` : `${parts.join("/")}.html`;
  link.href = new URL(file, siteRoot).href + hash;
});
