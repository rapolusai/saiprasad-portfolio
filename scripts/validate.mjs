import { access, readFile } from "node:fs/promises";

const required = ["index.html", "project.html", "contact.html", "admin.html", "parkingpilotai/index.html", "parkingpilotai/privacy.html", "parkingpilotai/terms.html", "parkingpilotai/refund.html", "parkingpilotai/contact.html", "assets/css/styles.css", "assets/js/site.js", "assets/js/project.js", "assets/js/contact.js", "assets/js/admin.js", "assets/js/parkingpilotai.js", "content/site.json", "content/projects.json", "content/products.json"];
await Promise.all(required.map((path) => access(path)));

const site = JSON.parse(await readFile("content/site.json", "utf8"));
const content = JSON.parse(await readFile("content/projects.json", "utf8"));
const productsContent = JSON.parse(await readFile("content/products.json", "utf8"));
if (!site.name || !site.email) throw new Error("content/site.json needs a name and email.");
if (!Array.isArray(content.projects)) throw new Error("content/projects.json must contain a projects array.");
if (!Array.isArray(productsContent.products)) throw new Error("content/products.json must contain a products array.");

for (const product of productsContent.products) {
  for (const field of ["id", "name", "status", "summary", "href"]) {
    if (!product[field]) throw new Error(`Product is missing ${field}.`);
  }
}

const ids = new Set();
const slugs = new Set();
for (const project of content.projects) {
  for (const field of ["id", "slug", "title", "summary", "status"]) {
    if (!project[field]) throw new Error(`Project is missing ${field}.`);
  }
  if (!/^[a-z0-9-]+$/.test(project.slug)) throw new Error(`Invalid project slug: ${project.slug}`);
  if (ids.has(project.id)) throw new Error(`Duplicate project id: ${project.id}`);
  if (slugs.has(project.slug)) throw new Error(`Duplicate project slug: ${project.slug}`);
  ids.add(project.id); slugs.add(project.slug);
  for (const image of project.images || []) {
    if (!image.path) throw new Error(`Project ${project.slug} has an image without a path.`);
    if (!/^https?:/i.test(image.path)) await access(image.path);
  }
}

console.log(`Validated ${content.projects.length} project stories, ${productsContent.products.length} products, and ${required.length} required files.`);
