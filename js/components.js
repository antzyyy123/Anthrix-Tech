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

  function injectBubbleNav() {
    if (!document.querySelector('[data-component="top-nav"], .site-nav') || document.getElementById("bubbleNav")) return;
    document.body.insertAdjacentHTML("beforeend",
      '<div class="bubble-nav" id="bubbleNav" role="navigation" aria-label="Quick navigation">' +
        '<button type="button" class="bubble bubble-main" id="bubbleMain" aria-label="Open menu" aria-expanded="false" aria-controls="bubbleItems"></button>' +
        '<div id="bubbleItems" aria-hidden="true">' +
          '<a class="bubble bubble-item" href="index.html#home" aria-label="Home" data-section="home" tabindex="-1"></a>' +
          '<a class="bubble bubble-item" href="services.html#solution" aria-label="Solution" data-section="solution" tabindex="-1"></a>' +
          '<a class="bubble bubble-item" href="work.html#work" aria-label="Work" data-section="work" tabindex="-1"></a>' +
          '<a class="bubble bubble-item" href="contact.html#contact" aria-label="Contact" data-section="contact" tabindex="-1"></a>' +
          '<a class="bubble bubble-item" href="contact.html#contact" aria-label="Book a call" data-section="book-a-call" tabindex="-1"></a>' +
        '</div>' +
      '</div>');
  }

  injectBubbleNav();

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
