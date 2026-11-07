// Anthrix Tech &mdash; Static site scripts

(function () {
  "use strict";

  // ============================================================
  // THEME SYSTEM &mdash; 3 themes: brand (default), dark, light
  // ============================================================

  var html = document.documentElement;
  var themes = ["brand", "dark", "light"]; // order for cycling

  // Theme icons for the segmented control (desktop)
  var themeIcons = {
    brand: '<span class="theme-icon-brand" aria-hidden="true"></span>',
    dark: '<span class="theme-icon-moon" aria-hidden="true">&#9789;</span>',
    light: '<span class="theme-icon-sun" aria-hidden="true">&#9728;</span>',
  };

  // Get the initial theme: localStorage > default brand
  function getInitialTheme() {
    try {
      var saved = localStorage.getItem("theme");
      if (saved && themes.indexOf(saved) !== -1) {
        return saved;
      }
    } catch (e) {
      // localStorage unavailable; ignore
    }
    return "brand"; // default theme
  }

  // Apply a theme to the document and UI controls
  function applyTheme(theme) {
    html.setAttribute("data-theme", theme);

    // Update desktop segmented control
    document.querySelectorAll(".theme-option").forEach(function (btn) {
      btn.setAttribute("aria-checked", btn.dataset.theme === theme ? "true" : "false");
    });

    // Update mobile cycling button text/icon
    var mobileBtn = document.getElementById("themeCycleMobile");
    if (mobileBtn) {
      mobileBtn.dataset.theme = theme;
      mobileBtn.innerHTML = themeIcons[theme];
    }

    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      // localStorage unavailable; ignore
    }
  }

  // Cycle to next theme (brand -> dark -> light -> brand)
  function cycleTheme() {
    var current = html.getAttribute("data-theme") || "brand";
    var idx = themes.indexOf(current);
    var next = themes[(idx + 1) % themes.length];
    applyTheme(next);
  }

  // Initialize theme from inline script (already applied) or default
  function initTheme() {
    var current = html.getAttribute("data-theme") || getInitialTheme();
    if (!html.getAttribute("data-theme")) {
      applyTheme(current);
    } else {
      // Inline script already set data-theme; just sync UI
      document.querySelectorAll(".theme-option").forEach(function (btn) {
        btn.setAttribute("aria-checked", btn.dataset.theme === current ? "true" : "false");
      });
      var mobileBtn = document.getElementById("themeCycleMobile");
      if (mobileBtn) {
        mobileBtn.dataset.theme = current;
        mobileBtn.innerHTML = themeIcons[current];
      }
    }
  }

  function bindThemeOptions() {
    document.querySelectorAll(".theme-option").forEach(function (btn) {
      if (btn.dataset.themeBound) return;
      btn.dataset.themeBound = "1";
      btn.addEventListener("click", function () {
        applyTheme(btn.dataset.theme);
      });
    });
  }

  // ============================================================
  // CONTACT FORM (unchanged from previous version)
  // ============================================================

  function initChrome() {
    bindThemeOptions();
    initTheme();
    initNav();
    initActiveObserver();
  }

  var chromeReady = false;
  function onChromeReady() {
    if (chromeReady) return;
    chromeReady = true;
    initChrome();
  }
  if (document.querySelector('[data-component="top-nav"]')) {
    document.addEventListener("components:ready", onChromeReady);
  } else {
    onChromeReady();
  }

  var form = document.getElementById("contactForm");
  var message = document.getElementById("formMessage");
  var submitBtn = document.getElementById("submitBtn");

  window.__applyTheme = applyTheme;
  window.__cycleTheme = cycleTheme;

  if (!form) {
    return;
  }

  var fields = {
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    project: document.getElementById("project"),
    budget: document.getElementById("budget"),
    timeline: document.getElementById("timeline"),
    building: document.getElementById("building"),
  };
  var errors = {
    name: document.getElementById("nameError"),
    email: document.getElementById("emailError"),
    project: document.getElementById("projectError"),
    budget: document.getElementById("budgetError"),
    timeline: document.getElementById("timelineError"),
    building: document.getElementById("buildingError"),
  };

  function clearErrors() {
    Object.keys(errors).forEach(function (key) {
      if (errors[key]) {
        errors[key].textContent = "";
      }
    });
    if (message) {
      message.style.display = "none";
      message.textContent = "";
      message.className = "form-message";
    }
  }

  function showError(key, text) {
    if (errors[key]) {
      errors[key].textContent = text;
    }
  }

  function showMessage(text, type) {
    if (!message) {
      return;
    }
    message.textContent = text;
    message.className = "form-message " + (type === "error" ? "error" : "success");
    message.style.display = "block";
  }

  function validate() {
    clearErrors();
    var ok = true;

    if (!fields.name || fields.name.value.trim().length < 2) {
      showError("name", "Please enter your name (at least 2 characters).");
      ok = false;
    }

    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!fields.email || !emailRe.test(fields.email.value.trim())) {
      showError("email", "Please enter a valid email address.");
      ok = false;
    }

    if (!fields.project || fields.project.value.trim().length === 0) {
      showError("project", "Please tell us about your project.");
      ok = false;
    }

    if (fields.budget && fields.budget.value && fields.budget.value.trim() === "") {
      showError("budget", "Please select a budget range.");
      ok = false;
    }

    if (fields.timeline && fields.timeline.value && fields.timeline.value.trim() === "") {
      showError("timeline", "Please select a time line.");
      ok = false;
    }

    if (!fields.building || fields.building.value.trim().length < 10) {
      showError("building", "Please describe what you're building (at least 10 characters).");
      ok = false;
    }

    return ok;
  }

  function setSubmitting(isSubmitting) {
    if (!submitBtn) {
      return;
    }
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? "Sending..." : "Send message";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors();

    if (!validate()) {
      showMessage("Please fix the errors above and try again.", "error");
      return;
    }

    setSubmitting(true);

    var endpoint = form.getAttribute("action") || "https://formspree.io/f/mqppoldb";

    // Formspree expects URL-encoded form data, not JSON
    var data = new FormData();
    data.append("name", fields.name.value.trim());
    data.append("email", fields.email.value.trim());
    data.append("project", fields.project.value.trim());
    if (fields.budget) data.append("budget", fields.budget.value);
    if (fields.timeline) data.append("timeline", fields.timeline.value);
    data.append("building", fields.building.value.trim());

    fetch(endpoint, {
      method: "POST",
      body: data,
    })
      .then(function (response) {
        setSubmitting(false);
        if (response.ok) {
          form.reset();
          showMessage("Thanks! We've received your message and will be in touch soon.", "success");
        } else {
          throw new Error("Submission failed");
        }
      })
      .catch(function () {
        setSubmitting(false);
        showMessage("Something went wrong. Please try again or email us directly at hello@anthrix.example.", "error");
      });
  });

  // ============================================================
  // NAV TOGGLE + MOBILE MENU
  // ============================================================

  var navBound = false;
  function initNav() {
    var navToggle = document.getElementById("navToggle");
    var navMenu = document.getElementById("navMenu");
    var breakpoint = 1180;
    if (!navToggle || !navMenu || navBound) return;
    navBound = true;

    function closeMenu() {
      navMenu.classList.remove("is-open");
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
    }

    function toggleMenu() {
      var open = !navMenu.classList.contains("is-open");
      navMenu.classList.toggle("is-open", open);
      navToggle.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open === true);
      navToggle.setAttribute("aria-label", open === true ? "Close menu" : "Open menu");
    }

    navToggle.addEventListener("click", toggleMenu);
    navMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("click", function (event) {
      if (window.innerWidth >= breakpoint) return;
      if (!navMenu.classList.contains("is-open")) return;
      if (navToggle.contains(event.target) || navMenu.contains(event.target)) return;
      closeMenu();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= breakpoint) closeMenu();
    });
  }

  // ============================================================
  // ACTIVE LINK HIGHLIGHTING (IntersectionObserver)
  // ============================================================

  function initActiveObserver() {
    var sectionIds = ["home", "solution", "work", "contact"];
    var hasSection = sectionIds.some(function (id) { return document.getElementById(id); });
    if (!hasSection || typeof IntersectionObserver === "undefined") return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute("id");
        document.querySelectorAll(".nav-links li a, .nav-link-book").forEach(function (a) {
          a.classList.remove("active");
        });
        document.querySelectorAll('.nav-links li a[href="#' + id + '"], .nav-link-book[href="#' + id + '"]').forEach(function (a) {
          a.classList.add("active");
        });
      });
    }, { root: null, rootMargin: "-30% 0% -70%", threshold: 0 });
    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }
})();
