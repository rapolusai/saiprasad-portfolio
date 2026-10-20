/* Google Analytics 4 — loads only after the visitor accepts. */
(function () {
  var ID = "G-F4ZBDVZBVN";
  var KEY = "rapolus-analytics-consent";
  var get = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  var set = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };

  function load() {
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", ID, { anonymize_ip: true });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
    document.head.appendChild(s);
  }

  function banner() {
    var css = document.createElement("style");
    css.textContent = ".ra-consent{position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:9999;max-width:34rem;margin:0 auto;padding:1rem 1.1rem;border-radius:1rem;background:#0b1730;color:#e8eefc;border:1px solid rgba(255,255,255,.18);box-shadow:0 18px 50px rgba(0,0,0,.45);font:14px/1.5 Inter,system-ui,sans-serif}.ra-consent p{margin:0 0 .75rem}.ra-consent a{color:#7db4ff}.ra-consent div{display:flex;gap:.6rem;justify-content:flex-end}.ra-consent button{font:600 14px Inter,system-ui,sans-serif;padding:.55rem 1rem;border-radius:.7rem;border:1px solid rgba(255,255,255,.25);background:transparent;color:#e8eefc;cursor:pointer}.ra-consent button.ra-yes{background:#2f86ff;border-color:#2f86ff;color:#fff}";
    document.head.appendChild(css);
    var box = document.createElement("div");
    box.className = "ra-consent";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Analytics consent");
    box.innerHTML = '<p>We use Google Analytics to count visits and understand which pages are useful. No names or emails are collected. Allow analytics cookies?</p><div><button type="button" class="ra-no">Decline</button><button type="button" class="ra-yes">Accept</button></div>';
    box.querySelector(".ra-yes").onclick = function () { set("granted"); box.remove(); load(); };
    box.querySelector(".ra-no").onclick = function () { set("denied"); box.remove(); };
    document.body.appendChild(box);
  }

  var c = get();
  if (c === "granted") load();
  else if (c !== "denied") {
    if (document.body) banner(); else document.addEventListener("DOMContentLoaded", banner);
  }
})();
