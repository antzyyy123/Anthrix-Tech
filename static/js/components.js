(function () {
  "use strict";

  function loadComponent(selector, path) {
    var host = document.querySelector(selector);
    if (!host) return Promise.resolve(false);
    return fetch(path)
      .then(function (r) {
        if (!r.ok) throw new Error(r.status + " " + path);
        return r.text();
      })
      .then(function (html) {
        host.outerHTML = html;
        return true;
      })
      .catch(function () {
        return false;
      });
  }

  function setActiveNav() {
    var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".nav-links a[data-nav], .nav-link-book[data-nav]").forEach(function (a) {
      a.classList.toggle("active", (a.getAttribute("data-nav") || "").toLowerCase() === file);
    });
  }

  function ready() {
    Promise.all([
      loadComponent('[data-component="top-nav"]', "components/top-nav.html"),
      loadComponent('[data-component="footer"]', "components/footer.html"),
    ]).then(function () {
      setActiveNav();
      document.dispatchEvent(new CustomEvent("components:ready"));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }
})();
