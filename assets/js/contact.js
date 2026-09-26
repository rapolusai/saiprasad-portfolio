import { fetchJson, initializeCommon, SITE_PATH } from "./shared.js";

const form = document.querySelector("[data-contact-form]");
const status = document.querySelector("[data-contact-status]");
const project = new URLSearchParams(window.location.search).get("project");

if (project && form) {
  form.elements.topic.value = "Project collaboration";
  form.elements.message.value = `I’d like to discuss a project related to ${project}.\n\n`;
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const topic = String(data.get("topic") || "Project enquiry").trim();
  const message = String(data.get("message") || "").trim();
  const subject = `${topic} — ${name}`;
  const body = [`Hello Rapolu\`s,`, "", message, "", `From: ${name}`, `Reply to: ${email}`].join("\n");
  status.textContent = "Opening your email application…";
  window.location.href = `mailto:rajinirapolus@gamil.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

fetchJson(SITE_PATH).then(initializeCommon).catch(() => initializeCommon({}));

const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) entry.target.classList.add("is-visible");
}), { threshold: .08 });
document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));
