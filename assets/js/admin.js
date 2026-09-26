import { escapeHtml, fetchJson, initials, projectHref, CONTENT_PATH } from "./shared.js";

const ADMIN_GITHUB_LOGIN = "rapolusai";
const state = {
  credentials: null,
  content: { version: 1, updatedAt: new Date().toISOString(), projects: [] },
  selectedId: null,
  images: [],
  pendingFiles: []
};

const connectPanel = document.querySelector("[data-connect-panel]");
const connectForm = document.querySelector("[data-connect-form]");
const studio = document.querySelector("[data-studio]");
const projectForm = document.querySelector("[data-project-form]");
const storyList = document.querySelector("[data-story-list]");
const imageInput = projectForm.elements.screenshots;
const imageQueue = document.querySelector("[data-image-queue]");
const uploadZone = document.querySelector("[data-upload-zone]");
const connectionState = document.querySelector("[data-connection-state]");
const formStatus = document.querySelector("[data-form-status]");
const toast = document.querySelector("[data-toast]");
const editorTitle = document.querySelector("[data-editor-title]");
const editorKicker = document.querySelector("[data-editor-kicker]");
const deleteButton = document.querySelector("[data-delete]");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("is-visible"), 3500);
}

function showStatus(message, error = false) {
  formStatus.textContent = message;
  formStatus.hidden = !message;
  formStatus.classList.toggle("is-error", error);
}

function savedRepository() {
  try { return JSON.parse(localStorage.getItem("portfolio-repository") || "null"); }
  catch { return null; }
}

function fillSavedRepository() {
  const saved = savedRepository();
  if (!saved) return;
  connectForm.elements.repo.value = saved.repo || "";
  connectForm.elements.branch.value = saved.branch || "main";
}

async function verifyAdminIdentity(token) {
  const response = await fetch("https://api.github.com/user", {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" }
  });
  if (!response.ok) throw new Error("GitHub could not verify this sign-in token.");
  const user = await response.json();
  if (user.login?.toLowerCase() !== ADMIN_GITHUB_LOGIN) throw new Error(`Access denied. This Studio is restricted to @${ADMIN_GITHUB_LOGIN}.`);
  return user;
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  return btoa(binary);
}

function base64ToText(base64) {
  const bytes = Uint8Array.from(atob(base64.replace(/\n/g, "")), (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function github(path, options = {}) {
  if (!state.credentials) throw new Error("Connect your repository first.");
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(state.credentials.owner)}/${encodeURIComponent(state.credentials.repo)}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${state.credentials.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    let detail = "";
    try { detail = (await response.json()).message; } catch { detail = response.statusText; }
    throw new Error(`GitHub: ${detail || `request failed (${response.status})`}`);
  }
  return response.status === 204 ? null : response.json();
}

async function loadRepositoryContent() {
  const path = `/contents/${CONTENT_PATH}?ref=${encodeURIComponent(state.credentials.branch)}`;
  try {
    const file = await github(path);
    state.content = JSON.parse(base64ToText(file.content));
  } catch (error) {
    if (!error.message.includes("Not Found")) throw error;
    state.content = await fetchJson(CONTENT_PATH);
  }
  if (!Array.isArray(state.content.projects)) state.content.projects = [];
}

function setConnected(connected) {
  connectPanel.hidden = connected;
  studio.hidden = !connected;
  connectionState.classList.toggle("is-connected", connected);
  connectionState.innerHTML = `<i></i>${connected ? `@${ADMIN_GITHUB_LOGIN} connected` : "Not connected"}`;
}

connectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = connectForm.querySelector("button[type=submit]");
  submit.disabled = true;
  submit.textContent = "Connecting…";
  const data = new FormData(connectForm);
  state.credentials = { owner: ADMIN_GITHUB_LOGIN, repo: data.get("repo").trim(), branch: data.get("branch").trim(), token: data.get("token").trim() };
  try {
    await verifyAdminIdentity(state.credentials.token);
    await github("");
    await loadRepositoryContent();
    localStorage.setItem("portfolio-repository", JSON.stringify({ repo: state.credentials.repo, branch: state.credentials.branch }));
    sessionStorage.setItem("portfolio-github-token", state.credentials.token);
    setConnected(true);
    renderStoryList();
    selectProject(state.content.projects[0]?.id || null);
    showToast(`Signed in as @${ADMIN_GITHUB_LOGIN}.`);
  } catch (error) {
    state.credentials = null;
    alert(`${error.message}\n\nCheck the repository name, branch, and token permission.`);
  } finally {
    submit.disabled = false;
    submit.innerHTML = "Verify and enter <span>↗</span>";
  }
});

function renderStoryList() {
  if (!state.content.projects.length) {
    storyList.innerHTML = `<p class="story-list__empty">No stories yet.</p>`;
    return;
  }
  storyList.innerHTML = state.content.projects.map((project) => `<button type="button" class="story-list__item ${project.id === state.selectedId ? "is-active" : ""}" data-id="${escapeHtml(project.id)}"><span>${escapeHtml(initials(project.title))}</span><div><strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(project.status)} · ${escapeHtml(project.year || "No year")}</small></div></button>`).join("");
}

storyList.addEventListener("click", (event) => {
  const item = event.target.closest("[data-id]");
  if (item) selectProject(item.dataset.id);
});

function value(name, next = "") { projectForm.elements[name].value = next ?? ""; }

function blankProject() {
  return { id: "", title: "", slug: "", summary: "", category: "", status: "published", featured: true, year: String(new Date().getFullYear()), role: "", timeline: "", technologies: [], challenge: "", solution: "", outcome: "", future: "", highlights: [], images: [], liveUrl: "" };
}

function selectProject(id) {
  const project = state.content.projects.find((item) => item.id === id) || blankProject();
  state.selectedId = project.id || null;
  state.images = structuredClone(project.images || []);
  state.pendingFiles = [];
  value("id", project.id); value("title", project.title); value("slug", project.slug); value("summary", project.summary); value("category", project.category); value("status", project.status); value("year", project.year); value("role", project.role); value("timeline", project.timeline); value("technologies", (project.technologies || []).join(", ")); value("challenge", project.challenge); value("solution", project.solution); value("outcome", project.outcome); value("future", project.future); value("highlights", (project.highlights || []).join("\n")); value("liveUrl", project.liveUrl);
  projectForm.elements.featured.checked = Boolean(project.featured);
  editorKicker.textContent = project.id ? "Editing story" : "New story";
  editorTitle.textContent = project.title || "Untitled project";
  deleteButton.hidden = !project.id;
  showStatus("");
  renderStoryList();
  renderImageQueue();
}

document.querySelector("[data-new-project]").addEventListener("click", () => selectProject(null));
projectForm.elements.title.addEventListener("input", () => {
  editorTitle.textContent = projectForm.elements.title.value || "Untitled project";
  if (!state.selectedId && !projectForm.elements.slug.dataset.touched) projectForm.elements.slug.value = slugify(projectForm.elements.title.value);
});
projectForm.elements.slug.addEventListener("input", () => { projectForm.elements.slug.dataset.touched = "true"; });

function slugify(value) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function safeFilename(value) { return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+/, ""); }

function collectProject() {
  const data = new FormData(projectForm);
  const id = data.get("id") || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`);
  return {
    id,
    slug: slugify(data.get("slug")),
    title: data.get("title").trim(),
    summary: data.get("summary").trim(),
    category: data.get("category").trim(),
    status: data.get("status"),
    featured: projectForm.elements.featured.checked,
    year: data.get("year").trim(),
    role: data.get("role").trim(),
    timeline: data.get("timeline").trim(),
    technologies: data.get("technologies").split(",").map((item) => item.trim()).filter(Boolean),
    challenge: data.get("challenge").trim(),
    solution: data.get("solution").trim(),
    outcome: data.get("outcome").trim(),
    future: data.get("future").trim(),
    highlights: data.get("highlights").split("\n").map((item) => item.trim()).filter(Boolean),
    images: structuredClone(state.images),
    liveUrl: data.get("liveUrl").trim()
  };
}

async function fileData(file) {
  const buffer = new Uint8Array(await file.arrayBuffer());
  return bytesToBase64(buffer);
}

function addFiles(files) {
  for (const file of files) {
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) { showToast(`${file.name} is not a supported image.`); continue; }
    if (file.size > 5 * 1024 * 1024) { showToast(`${file.name} is larger than 5 MB.`); continue; }
    state.pendingFiles.push({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${file.name}`, file, preview: URL.createObjectURL(file) });
  }
  renderImageQueue();
}

imageInput.addEventListener("change", () => { addFiles(imageInput.files); imageInput.value = ""; });
["dragenter", "dragover"].forEach((name) => uploadZone.addEventListener(name, (event) => { event.preventDefault(); uploadZone.classList.add("is-dragging"); }));
["dragleave", "drop"].forEach((name) => uploadZone.addEventListener(name, (event) => { event.preventDefault(); uploadZone.classList.remove("is-dragging"); }));
uploadZone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));

function renderImageQueue() {
  const existing = state.images.map((image, index) => `<div class="queued-image"><img src="${escapeHtml(image.path)}" alt=""><span>${escapeHtml(image.path.split("/").pop())}</span><button type="button" data-remove-existing="${index}" aria-label="Remove image">×</button></div>`);
  const pending = state.pendingFiles.map((item) => `<div class="queued-image"><img src="${escapeHtml(item.preview)}" alt=""><span>${escapeHtml(item.file.name)} · new</span><button type="button" data-remove-pending="${escapeHtml(item.id)}" aria-label="Remove image">×</button></div>`);
  imageQueue.innerHTML = [...existing, ...pending].join("");
}

imageQueue.addEventListener("click", (event) => {
  const existing = event.target.closest("[data-remove-existing]");
  const pending = event.target.closest("[data-remove-pending]");
  if (existing) state.images.splice(Number(existing.dataset.removeExisting), 1);
  if (pending) {
    const index = state.pendingFiles.findIndex((item) => item.id === pending.dataset.removePending);
    if (index >= 0) { URL.revokeObjectURL(state.pendingFiles[index].preview); state.pendingFiles.splice(index, 1); }
  }
  renderImageQueue();
});

async function publish(project, { deleting = false } = {}) {
  showStatus("Preparing one atomic Git commit…");
  const ref = await github(`/git/ref/heads/${encodeURIComponent(state.credentials.branch)}`);
  const baseCommit = await github(`/git/commits/${ref.object.sha}`);
  const entries = [];

  if (!deleting) {
    for (const item of state.pendingFiles) {
      const content = await fileData(item.file);
      const blob = await github("/git/blobs", { method: "POST", body: JSON.stringify({ content, encoding: "base64" }) });
      const path = `assets/uploads/${project.slug}/${Date.now()}-${safeFilename(item.file.name)}`;
      entries.push({ path, mode: "100644", type: "blob", sha: blob.sha });
      project.images.push({ path, alt: `${project.title} project screen` });
    }
    const duplicate = state.content.projects.find((item) => item.slug === project.slug && item.id !== project.id);
    if (duplicate) throw new Error("Another project already uses this slug.");
    const index = state.content.projects.findIndex((item) => item.id === project.id);
    if (index >= 0) state.content.projects[index] = project; else state.content.projects.unshift(project);
  } else {
    state.content.projects = state.content.projects.filter((item) => item.id !== project.id);
  }

  state.content.updatedAt = new Date().toISOString();
  const jsonBytes = new TextEncoder().encode(`${JSON.stringify(state.content, null, 2)}\n`);
  const contentBlob = await github("/git/blobs", { method: "POST", body: JSON.stringify({ content: bytesToBase64(jsonBytes), encoding: "base64" }) });
  entries.push({ path: CONTENT_PATH, mode: "100644", type: "blob", sha: contentBlob.sha });
  const tree = await github("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree: entries }) });
  const action = deleting ? "Remove" : state.selectedId ? "Update" : "Publish";
  const commit = await github("/git/commits", { method: "POST", body: JSON.stringify({ message: `${action} project: ${project.title}`, tree: tree.sha, parents: [ref.object.sha] }) });
  await github(`/git/refs/heads/${encodeURIComponent(state.credentials.branch)}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) });
  return commit;
}

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!projectForm.reportValidity()) return;
  const project = collectProject();
  const buttons = projectForm.querySelectorAll("button[type=submit]");
  buttons.forEach((button) => { button.disabled = true; });
  try {
    const commit = await publish(project);
    state.selectedId = project.id;
    state.images = project.images;
    state.pendingFiles.forEach((item) => URL.revokeObjectURL(item.preview));
    state.pendingFiles = [];
    value("id", project.id);
    showStatus(`Published in commit ${commit.sha.slice(0, 7)}. The live site will update after the deployment finishes.`);
    renderStoryList(); renderImageQueue(); deleteButton.hidden = false;
    showToast("Project published. Deployment is now running.");
  } catch (error) { showStatus(error.message, true); }
  finally { buttons.forEach((button) => { button.disabled = false; }); }
});

document.querySelector("[data-preview]").addEventListener("click", () => {
  if (!projectForm.elements.title.value || !projectForm.elements.slug.value) { showStatus("Add a title and slug before previewing.", true); return; }
  const project = collectProject();
  sessionStorage.setItem("portfolio-project-preview", JSON.stringify(project));
  window.open(`${projectHref(project.slug)}&preview=1`, "_blank", "noopener");
});

deleteButton.addEventListener("click", async () => {
  const project = collectProject();
  if (!project.id || !confirm(`Delete “${project.title}” from the website? This creates a Git commit and can be recovered from history.`)) return;
  deleteButton.disabled = true;
  try {
    await publish(project, { deleting: true });
    renderStoryList(); selectProject(state.content.projects[0]?.id || null);
    showToast("Project removed and deployment started.");
  } catch (error) { showStatus(error.message, true); }
  finally { deleteButton.disabled = false; }
});

document.querySelector("[data-disconnect]").addEventListener("click", () => {
  state.credentials = null;
  sessionStorage.removeItem("portfolio-github-token");
  connectForm.elements.token.value = "";
  setConnected(false);
});

async function restoreSession() {
  fillSavedRepository();
  const saved = savedRepository();
  const token = sessionStorage.getItem("portfolio-github-token");
  if (!saved || !token) return;
  state.credentials = { ...saved, owner: ADMIN_GITHUB_LOGIN, token };
  try {
    await verifyAdminIdentity(token);
    await loadRepositoryContent();
    setConnected(true); renderStoryList(); selectProject(state.content.projects[0]?.id || null);
  } catch { state.credentials = null; sessionStorage.removeItem("portfolio-github-token"); }
}
restoreSession();
