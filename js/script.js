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
  var callSummary = document.getElementById("callBookingSummary");
  var callDateField = document.getElementById("callDate");
  var callTimeField = document.getElementById("callTime");

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
      if (fields[key]) {
        fields[key].setAttribute("aria-invalid", "false");
      }
    });
    if (message) {
      message.style.display = "none";
      message.textContent = "";
      message.className = "form-message";
    }
  }

  function clearFormMessage() {
    if (!message) return;
    message.style.display = "none";
    message.textContent = "";
    message.className = "form-message";
  }

  function showError(key, text) {
    if (errors[key]) {
      errors[key].textContent = text;
    }
    if (fields[key]) {
      fields[key].setAttribute("aria-invalid", "true");
    }
  }

  function clearFieldError(key) {
    if (errors[key]) {
      errors[key].textContent = "";
    }
    if (fields[key]) {
      fields[key].setAttribute("aria-invalid", "false");
    }
  }

  function validateName(value) {
    var nameRe = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ.'-]*(?: [A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ.'-]*)*,\s*[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'-]*(?: [A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'-]*)*(?:\s+[A-Za-z]\.)?$/;
    if (!value) {
      return "Please enter your name as Lastname, Firstname M.I. (for example, Dela Cruz, Juan P.).";
    }
    if (!nameRe.test(value)) {
      return "Use Lastname, Firstname M.I. format (for example, Dela Cruz, Juan P.). The middle initial is optional.";
    }
    return "";
  }

  function validateEmail(value) {
    if (!value) {
      return "Please enter your email address.";
    }
    if (value.length > 254) {
      return "Email addresses must be 254 characters or fewer.";
    }
    if (/\s/.test(value)) {
      return "Email addresses cannot contain spaces.";
    }
    if (value.indexOf("@") === -1) {
      return "Please include an @ symbol, like juan@your-school.edu.ph.";
    }
    if (value.indexOf("@") !== value.lastIndexOf("@")) {
      return "Please use only one @ symbol in your email address.";
    }
    if (value.indexOf("..") !== -1) {
      return "Email addresses cannot contain two dots in a row.";
    }

    var parts = value.split("@");
    var local = parts[0];
    var domain = parts[1];
    var localRe = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
    if (!local || local.length > 64 || local.charAt(0) === "." || local.charAt(local.length - 1) === "." || !localRe.test(local)) {
      return "Please check the part of your email address before @.";
    }
    if (!domain) {
      return "Please enter a domain after @, like your-school.edu.ph.";
    }
    if (domain.indexOf(".") === -1) {
      return "Your email domain needs an ending, such as .com or .edu.ph.";
    }

    var domainRe = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
    if (!domainRe.test(domain)) {
      return "Please enter a valid domain, such as your-school.edu.ph.";
    }

    var blockedDomains = ["mailinator.com", "tempmail.com", "example.com"];
    var isBlockedDomain = blockedDomains.some(function (blockedDomain) {
      return domain === blockedDomain || domain.slice(-(blockedDomain.length + 1)) === "." + blockedDomain;
    });
    if (isBlockedDomain) {
      return "Please use a school or personal email address, not a temporary or example address.";
    }
    return "";
  }

  function showMessage(text, type, showCalendarLink) {
    if (!message) {
      return;
    }
    message.replaceChildren(document.createTextNode(text));
    if (type === "error" && showCalendarLink) {
      var link = document.createElement("a");
      link.href = "book-a-call.html";
      link.textContent = "Choose another date and time.";
      message.appendChild(document.createTextNode(" "));
      message.appendChild(link);
    }
    message.className = "form-message " + (type === "error" ? "error" : "success");
    message.style.display = "block";
  }

  function showCallDateError() {
    showMessage("That call date or time is no longer available.", "error", true);
  }

  var callBooking = { date: "", time: "" };
  var callTimeOptions = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
  var fixedCallHolidays = ["01-01", "04-09", "05-01", "06-12", "08-21", "11-01", "11-30", "12-08", "12-24", "12-25", "12-30", "12-31"];

  function parseCallDate(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!match) return null;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
    return { year: year, month: month, day: day, date: date };
  }

  function manilaDateKey() {
    var parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    var values = {};
    parts.forEach(function (part) {
      if (part.type !== "literal") values[part.type] = part.value;
    });
    return values.year + "-" + values.month + "-" + values.day;
  }

  function renderCallBooking() {
    if (!callSummary || !callDateField || !callTimeField) return;
    var parsed = parseCallDate(callBooking.date);
    if (!parsed || callTimeOptions.indexOf(callBooking.time) === -1) {
      callBooking = { date: "", time: "" };
      callDateField.value = "";
      callTimeField.value = "";
      callSummary.hidden = true;
      return;
    }

    callDateField.value = callBooking.date;
    callTimeField.value = callBooking.time;
    callSummary.replaceChildren(document.createTextNode(
      "Your call: " + new Intl.DateTimeFormat("en-PH", {
        timeZone: "UTC",
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12))) +
      " at " + callBooking.time + " (Philippine time) "
    ));
    var changeLink = document.createElement("a");
    changeLink.href = "book-a-call.html";
    changeLink.textContent = "Change";
    callSummary.appendChild(changeLink);
    callSummary.hidden = false;
  }

  function loadCallBooking() {
    var storedDate = "";
    var storedTime = "";
    try {
      storedDate = sessionStorage.getItem("anthrix-call-date") || "";
      storedTime = sessionStorage.getItem("anthrix-call-time") || "";
    } catch (error) {
      console.warn("Could not read the saved call selection.", error);
    }

    var query = new URLSearchParams(window.location.search);
    var queryDate = query.get("call_date");
    var queryTime = query.get("call_time");
    if (queryDate && queryTime) {
      storedDate = queryDate;
      storedTime = queryTime;
    }
    callBooking = { date: storedDate, time: storedTime };
    renderCallBooking();
  }

  async function isCallBookingValid() {
    if (!callBooking.date && !callBooking.time) return true;
    var parsed = parseCallDate(callBooking.date);
    if (!parsed || callTimeOptions.indexOf(callBooking.time) === -1) return false;
    if (parsed.date.getUTCDay() === 0 || parsed.date.getUTCDay() === 6) return false;
    if (callBooking.date < manilaDateKey()) return false;

    var holidayDates;
    try {
      var response = await fetch("https://date.nager.at/api/v3/PublicHolidays/" + parsed.year + "/PH");
      if (!response.ok) throw new Error("Holiday service returned " + response.status);
      var holidays = await response.json();
      if (!Array.isArray(holidays)) throw new Error("Holiday service returned an unexpected response");
      holidayDates = holidays.map(function (holiday) { return holiday && holiday.date; });
    } catch (error) {
      console.warn("Could not verify live Philippine holidays; using fixed-date holidays.", error);
      holidayDates = fixedCallHolidays.map(function (monthDay) { return parsed.year + "-" + monthDay; });
    }
    return holidayDates.indexOf(callBooking.date) === -1;
  }

  function clearCallBooking() {
    callBooking = { date: "", time: "" };
    try {
      sessionStorage.removeItem("anthrix-call-date");
      sessionStorage.removeItem("anthrix-call-time");
    } catch (error) {
      console.warn("Could not clear the saved call selection.", error);
    }
    if (callDateField) callDateField.value = "";
    if (callTimeField) callTimeField.value = "";
    if (callSummary) callSummary.hidden = true;
    if (window.location.search) {
      try {
        window.history.replaceState(null, "", window.location.pathname + window.location.hash);
      } catch (error) {
        console.warn("Could not remove the call selection from the page URL.", error);
      }
    }
  }

  function validate() {
    clearErrors();
    var ok = true;

    if (fields.name) {
      fields.name.value = fields.name.value.trim();
      var nameError = validateName(fields.name.value);
      if (nameError) {
        showError("name", nameError);
        ok = false;
      }
    } else {
      ok = false;
    }

    if (fields.email) {
      fields.email.value = fields.email.value.trim().toLowerCase();
      var emailError = validateEmail(fields.email.value);
      if (emailError) {
        showError("email", emailError);
        ok = false;
      }
    } else {
      ok = false;
    }

    if (!fields.project || !fields.project.value) {
      showError("project", "Please select the type of project you need.");
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

  if (fields.name) {
    fields.name.addEventListener("blur", function () {
      fields.name.value = fields.name.value.trim();
      var error = validateName(fields.name.value);
      if (error) {
        showError("name", error);
      } else {
        clearFieldError("name");
      }
    });
  }

  if (fields.email) {
    fields.email.addEventListener("blur", function () {
      fields.email.value = fields.email.value.trim().toLowerCase();
      var error = validateEmail(fields.email.value);
      if (error) {
        showError("email", error);
      } else {
        clearFieldError("email");
      }
    });
  }

  loadCallBooking();

  var submissionInProgress = false;
  var successfulSubmission = false;

  function setSubmitting(isSubmitting) {
    if (!submitBtn) {
      return;
    }
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? "Sending..." : "Send message";
  }

  form.addEventListener("input", function (event) {
    if (!successfulSubmission || !event.target.matches("input, select, textarea")) return;
    successfulSubmission = false;
    clearFormMessage();
    setSubmitting(false);
  });
  form.addEventListener("change", function (event) {
    if (!successfulSubmission || !event.target.matches("input, select, textarea")) return;
    successfulSubmission = false;
    clearFormMessage();
    setSubmitting(false);
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (submissionInProgress || successfulSubmission) return;
    clearErrors();

    if (!validate()) {
      showMessage("Please fix the errors above and try again.", "error");
      return;
    }

    submissionInProgress = true;
    setSubmitting(true);
    try {
      if (!(await isCallBookingValid())) {
        showCallDateError();
        return;
      }

      var endpoint = form.getAttribute("action") || "https://formspree.io/f/mqppoldb";
      var data = new FormData();
      data.append("name", fields.name.value.trim());
      data.append("email", fields.email.value.trim());
      data.append("project", fields.project.value.trim());
      if (fields.budget) data.append("budget", fields.budget.value);
      if (fields.timeline) data.append("timeline", fields.timeline.value);
      data.append("building", fields.building.value.trim());
      if (callBooking.date && callBooking.time) {
        data.append("call_date", callBooking.date);
        data.append("call_time", callBooking.time);
      }

      var response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" },
        });
      } catch (error) {
        showMessage("No connection. Please check your internet and try again.", "error");
        return;
      }

      if (!response.ok) {
        var errorMessage;
        if (response.status === 404) {
          errorMessage = "The contact form could not be found (404). Please email us directly at anthonyojera02@gmail.com.";
        } else if (response.status === 403) {
          errorMessage = "This request was blocked or is not allowed (403). Please email us directly at anthonyojera02@gmail.com.";
        } else if (response.status === 429) {
          errorMessage = "Too many requests. Please wait a moment and try again.";
        } else {
          errorMessage = "Something went wrong (HTTP " + response.status +
            "). Please try again or email us directly at anthonyojera02@gmail.com.";
        }
        showMessage(errorMessage, "error");
        return;
      }

      successfulSubmission = true;
      try {
        form.reset();
      } catch (error) {
        console.warn("The contact form could not be reset after a successful send.", error);
      }
      try {
        clearCallBooking();
      } catch (error) {
        console.warn("The saved call selection could not be cleared after a successful send.", error);
      }
      try {
        showMessage("Thanks! We've received your message and will be in touch soon.", "success");
      } catch (error) {
        console.warn("The success message could not be displayed.", error);
      }
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sent";
      }
    } finally {
      submissionInProgress = false;
      if (!successfulSubmission) setSubmitting(false);
    }
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
