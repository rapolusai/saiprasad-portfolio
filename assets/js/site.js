import { absoluteAsset, escapeHtml, fetchJson, initializeCommon, initials, projectHref, safeUrl, SITE_PATH, CONTENT_PATH, PRODUCTS_PATH } from "./shared.js";

const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const navigation = document.querySelector("[data-nav]");
const projectGrid = document.querySelector("[data-project-grid]");
const emptyState = document.querySelector("[data-project-empty]");
const productGrid = document.querySelector("[data-product-grid]");
const productEmptyState = document.querySelector("[data-product-empty]");

const setHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 30);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  document.documentElement.style.setProperty("--scroll-progress", `${scrollable > 0 ? Math.min(100, window.scrollY / scrollable * 100) : 0}%`);
};
setHeader();
window.addEventListener("scroll", setHeader, { passive: true });

menuButton?.addEventListener("click", () => {
  const open = navigation.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(open));
});
navigation?.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    navigation.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  }
});

const heroVisual = document.querySelector(".hero-visual");
const codeWindow = heroVisual?.querySelector(".code-window");
const canUsePointerDepth = window.matchMedia("(prefers-reduced-motion: no-preference) and (pointer: fine)");

if (heroVisual && codeWindow && canUsePointerDepth.matches) {
  const restingTransform = "perspective(1000px) rotateX(2deg) rotateY(-4deg) translateZ(0)";
  heroVisual.addEventListener("pointermove", (event) => {
    const bounds = heroVisual.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    codeWindow.style.transform = `perspective(1000px) rotateX(${2 - y * 7}deg) rotateY(${-4 + x * 9}deg) translateZ(12px)`;
    heroVisual.style.setProperty("--pointer-x", `${50 + x * 30}%`);
    heroVisual.style.setProperty("--pointer-y", `${50 + y * 30}%`);
  });
  heroVisual.addEventListener("pointerleave", () => {
    codeWindow.style.transform = restingTransform;
    heroVisual.style.removeProperty("--pointer-x");
    heroVisual.style.removeProperty("--pointer-y");
  });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));

const expertiseViews = {
  backend: { label: "BACKEND", nodes: [["CLIENTS"], ["API GATEWAY"], ["IDENTITY", "CORE API", "WORKERS"], ["SQL", "EVENTS", "CACHE"]], tags: ["Resilience", "Security", "Performance"] },
  frontend: { label: "PRODUCT", nodes: [["USER NEED"], ["DESIGN SYSTEM"], ["REACT", "ANGULAR", "TYPESCRIPT"], ["ACCESSIBLE", "FAST", "RESPONSIVE"]], tags: ["Clarity", "UX", "Maintainability"] },
  cloud: { label: "DELIVERY", nodes: [["GIT PUSH"], ["CI PIPELINE"], ["TEST", "BUILD", "SCAN"], ["DOCKER", "K8S", "AWS"]], tags: ["Automation", "Observability", "Reliability"] },
  data: { label: "DATA", nodes: [["WORKLOAD"], ["DATA MODEL"], ["POSTGRES", "MYSQL", "MONGODB"], ["INDEX", "CACHE", "MEASURE"]], tags: ["Latency", "Throughput", "Integrity"] }
};

function renderExpertise(key) {
  const view = expertiseViews[key];
  const panel = document.querySelector("[data-expertise-panel]");
  if (!view || !panel) return;
  panel.innerHTML = `<p class="mono-label">CURRENT VIEW / ${view.label}</p><div class="system-map" aria-hidden="true">
    <div class="map-node">${view.nodes[0][0]}</div><i></i><div class="map-node">${view.nodes[1][0]}</div><i></i>
    <div class="map-services">${view.nodes[2].map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div><i></i>
    <div class="map-databases">${view.nodes[3].map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></div>
    <div class="panel-tags">${view.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`;
}
document.querySelectorAll("[data-expertise]").forEach((item) => {
  const activate = () => {
    document.querySelectorAll("[data-expertise]").forEach((node) => node.classList.remove("is-active"));
    item.classList.add("is-active");
    renderExpertise(item.dataset.expertise);
  };
  item.addEventListener("mouseenter", activate);
  item.addEventListener("focus", activate);
  item.addEventListener("click", activate);
});

function renderProjects(projects) {
  const published = projects.filter((project) => project.status === "published");
  const featured = published.filter((project) => project.featured);
  const items = (featured.length ? featured : published).slice(0, 6);
  if (!items.length) {
    projectGrid.innerHTML = "";
    emptyState.hidden = false;
    return;
  }
  projectGrid.innerHTML = items.map((project, index) => {
    const image = project.images?.[0];
    const tech = (project.technologies || []).slice(0, 3);
    return `<a class="project-card ${image ? "has-image" : "has-placeholder"} reveal" href="${projectHref(project.slug)}">
      <div class="project-card__image">
        <span class="project-card__index">${String(index + 1).padStart(2, "0")}</span>
        <span class="project-card__type">Case study</span>
        ${image ? `<img src="${escapeHtml(absoluteAsset(image.path))}" alt="${escapeHtml(image.alt || `${project.title} screen`)}" loading="lazy">` : `<div class="project-card__placeholder">${escapeHtml(initials(project.title))}</div>`}
      </div>
      <div class="project-card__body">
        <div class="project-card__meta"><span>${escapeHtml(project.category || "Project")}</span><span>${escapeHtml(project.year || "")}</span></div>
        <h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.summary)}</p>
        <div class="project-card__footer"><div class="tag-list">${tech.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div><span class="project-arrow">↗</span></div>
      </div></a>`;
  }).join("");
  projectGrid.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));
  if (canUsePointerDepth.matches) {
    projectGrid.querySelectorAll(".project-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - .5;
        const y = (event.clientY - bounds.top) / bounds.height - .5;
        card.style.setProperty("--card-x", `${50 + x * 70}%`);
        card.style.setProperty("--card-y", `${50 + y * 70}%`);
        card.style.transform = `perspective(1100px) rotateX(${-y * 4}deg) rotateY(${x * 5}deg) translateY(-6px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--card-x");
        card.style.removeProperty("--card-y");
        card.style.removeProperty("transform");
      });
    });
  }
}

function renderProducts(products) {
  if (!productGrid) return;
  const published = products.filter((product) => product.status?.toLowerCase() === "live");
  if (!published.length) {
    productGrid.innerHTML = "";
    if (productEmptyState) productEmptyState.hidden = false;
    return;
  }
  productGrid.innerHTML = published.map((product, index) => {
    const href = safeUrl(product.href || "#") || "#";
    const features = (product.features || []).slice(0, 4);
    return `<a class="product-showcase__card reveal" href="${escapeHtml(href)}">
      <div class="product-showcase__visual" aria-hidden="true"><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(initials(product.name))}</strong><i></i></div>
      <div class="product-showcase__body">
        <div class="product-showcase__meta"><span>${escapeHtml(product.category || "Product")}</span><b>${escapeHtml(product.status)}</b></div>
        <h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.summary)}</p>
        <div class="product-showcase__footer"><div class="tag-list">${features.map((feature) => `<span>${escapeHtml(feature)}</span>`).join("")}</div><strong>Explore product ↗</strong></div>
      </div></a>`;
  }).join("");
  productGrid.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));
}

async function start() {
  const [siteResult, projectsResult, productsResult] = await Promise.allSettled([fetchJson(SITE_PATH), fetchJson(CONTENT_PATH), fetchJson(PRODUCTS_PATH)]);
  initializeCommon(siteResult.status === "fulfilled" ? siteResult.value : {});
  renderProjects(projectsResult.status === "fulfilled" ? projectsResult.value.projects || [] : []);
  renderProducts(productsResult.status === "fulfilled" ? productsResult.value.products || [] : []);
}
start();
