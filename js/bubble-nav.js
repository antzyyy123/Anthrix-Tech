// Anthrix Tech — Bubble Navigation (phones only)
(function () {
  "use strict";

  var mqPhone = window.matchMedia("(max-width: 767px)");
  var mqLandPhone = window.matchMedia("(max-height: 500px) and (pointer: coarse)");
  var nav = document.getElementById("bubbleNav");
  var main = document.getElementById("bubbleMain");
  var itemsContainer = document.getElementById("bubbleItems");

  if (!nav || !main || !itemsContainer) return;

  var itemEls = Array.prototype.slice.call(itemsContainer.querySelectorAll(".bubble-item"));
  var themeBtn = document.getElementById("bubbleTheme");
  var pos = { x: 0, y: 0 };
  var safe = { top: 0, right: 0, bottom: 0, left: 0 };
  var open = false;
  var dragging = false;
  var activePointerId = null;
  var dragStart = { x: 0, y: 0 };
  var lastPointer = { x: 0, y: 0 };
  var rafId = 0;
  var initialized = false;
  var margin = 8;
  var dragThreshold = 6;

  var icons = {
    home: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
    solution: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 22h4M8.5 14.5A7 7 0 1 1 15.5 14.5c-.9.7-1.3 1.5-1.5 2.5h-4c-.2-1-.6-1.8-1.5-2.5Z"/></svg>',
    work: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></svg>',
    contact: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
    book: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/></svg>',
    brand: '<span class="theme-dot" aria-hidden="true"></span>',
    dark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/></svg>',
    light: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>',
  };

  function isPhone() {
    return mqPhone.matches || mqLandPhone.matches;
  }

  function setLogoMark() {
    if (main.querySelector(".logo-mark")) return;
    var source = document.querySelector(".site-nav .logo");
    if (!source) return;

    var namespace = "http://www.w3.org/2000/svg";
    var mark = document.createElementNS(namespace, "svg");
    mark.setAttribute("viewBox", source.getAttribute("viewBox"));
    mark.setAttribute("class", "logo-mark");
    mark.setAttribute("width", "26");
    mark.setAttribute("aria-hidden", "true");

    var defs = source.querySelector("defs");
    if (defs) mark.appendChild(defs.cloneNode(true));

    var sourcePath = source.querySelector("path");
    var logoPath = document.createElementNS(namespace, "path");
    ["fill", "fill-rule", "d"].forEach(function (name) {
      if (sourcePath.hasAttribute(name)) logoPath.setAttribute(name, sourcePath.getAttribute(name));
    });

    var pathData = logoPath.getAttribute("d");
    var truncatedAt = pathData ? pathData.indexOf("...") : -1;
    if (truncatedAt !== -1) {
      // Avoid copying the literal truncation placeholder into the bubble's SVG path.
      var lastCurve = pathData.lastIndexOf("C", truncatedAt);
      if (lastCurve > 0) logoPath.setAttribute("d", pathData.slice(0, lastCurve));
    }
    mark.appendChild(logoPath);

    var ids = {};
    Array.prototype.forEach.call(mark.querySelectorAll("[id]"), function (element) {
      ids[element.id] = "bubble-" + element.id;
      element.id = ids[element.id];
    });
    Array.prototype.forEach.call(mark.querySelectorAll("*"), function (element) {
      Array.prototype.forEach.call(element.attributes, function (attribute) {
        attribute.value = attribute.value.replace(/url\(#([^)]+)\)/g, function (match, id) {
          return ids[id] ? "url(#" + ids[id] + ")" : match;
        });
      });
    });
    main.insertBefore(mark, main.firstChild);
  }

  function updateThemeIcon() {
    if (!themeBtn) return;
    var theme = document.documentElement.getAttribute("data-theme") || "brand";
    themeBtn.innerHTML = icons[theme] ? icons[theme] : icons.brand;
  }

  function refreshSafeInsets() {
    var probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;top:env(safe-area-inset-top);right:env(safe-area-inset-right);" +
      "bottom:env(safe-area-inset-bottom);left:env(safe-area-inset-left);visibility:hidden;";
    document.body.appendChild(probe);
    var rect = probe.getBoundingClientRect();
    safe = {
      top: Math.max(0, rect.top),
      right: Math.max(0, document.documentElement.clientWidth - rect.right),
      bottom: Math.max(0, window.innerHeight - rect.bottom),
      left: Math.max(0, rect.left),
    };
    probe.remove();
  }

  function clampPoint(x, y, size) {
    var viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    var minX = margin + safe.left;
    var minY = margin + safe.top;
    var maxX = Math.max(minX, viewportWidth - size - margin - safe.right);
    var maxY = Math.max(minY, window.innerHeight - size - margin - safe.bottom);
    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  }

  function clampPosition() {
    var clamped = clampPoint(pos.x, pos.y, 56);
    pos.x = clamped.x;
    pos.y = clamped.y;
  }

  function applyPosition() {
    rafId = 0;
    main.style.transform = "translate3d(" + pos.x + "px, " + pos.y + "px, 0)";
  }

  function schedulePosition() {
    if (!rafId) rafId = window.requestAnimationFrame(applyPosition);
  }

  function savePosition() {
    try {
      localStorage.setItem("bubbleNavPos", JSON.stringify(pos));
    } catch (error) {
      console.warn("Bubble navigation position could not be saved.", error);
    }
  }

  function loadPosition() {
    var saved = null;
    try {
      var value = localStorage.getItem("bubbleNavPos");
      if (value) saved = JSON.parse(value);
    } catch (error) {
      console.warn("Bubble navigation position could not be restored.", error);
    }

    if (
      saved &&
      Number.isFinite(saved.x) &&
      Number.isFinite(saved.y)
    ) {
      pos = { x: saved.x, y: saved.y };
    } else {
      pos = {
        x: (document.documentElement.clientWidth || window.innerWidth) - 76,
        y: window.innerHeight - 76,
      };
    }
    clampPosition();
    applyPosition();
  }

  function spreadPositions() {
    var viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    var center = { x: pos.x + 28, y: pos.y + 28 };
    var viewportCenter = { x: viewportWidth / 2, y: window.innerHeight / 2 };
    var dx = viewportCenter.x - center.x;
    var dy = viewportCenter.y - center.y;
    var distance = Math.hypot(dx, dy);
    var startAngle = distance > 120
      ? Math.atan2(dy, dx) - (100 * Math.PI / 180)
      : -Math.PI / 2;

    itemEls.forEach(function (element, index) {
      var angle = distance > 120
        ? startAngle + (index * 200 * Math.PI / 180) / (itemEls.length - 1)
        : startAngle + index * Math.PI / 3;
      var point = clampPoint(
        center.x + 96 * Math.cos(angle) - 23,
        center.y + 96 * Math.sin(angle) - 23,
        46
      );
      element.dataset.openX = point.x;
      element.dataset.openY = point.y;
      element.dataset.closedX = center.x - 23;
      element.dataset.closedY = center.y - 23;
    });
  }

  function applySpread(shouldOpen) {
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    itemEls.forEach(function (element, index) {
      var delay = shouldOpen && !reducedMotion ? index * 45 : 0;
      element.style.transitionDelay = delay + "ms";
      element.style.transitionDuration = (reducedMotion ? 160 : shouldOpen ? 450 : 180) + "ms";
      var x = shouldOpen ? element.dataset.openX : element.dataset.closedX;
      var y = shouldOpen ? element.dataset.openY : element.dataset.closedY;
      element.style.transform = "translate3d(" + x + "px, " + y + "px, 0) scale(" +
        (shouldOpen ? "1" : "0.2") + ")";
      element.style.opacity = shouldOpen ? "1" : "0";
    });
  }

  function setOpen(shouldOpen) {
    open = shouldOpen;
    main.setAttribute("aria-expanded", String(open));
    main.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    main.classList.toggle("is-open", open);
    nav.classList.toggle("bubble-nav--open", open);
    itemsContainer.setAttribute("aria-hidden", String(!open));
    itemEls.forEach(function (element) {
      element.setAttribute("tabindex", open ? "0" : "-1");
    });

    if (open) spreadPositions();
    applySpread(open);
  }

  function toggleMenu() {
    setOpen(!open);
  }

  function onPointerDown(event) {
    if (!isPhone() || (event.pointerType === "mouse" && event.button !== 0)) return;
    activePointerId = event.pointerId;
    main.setPointerCapture(event.pointerId);
    dragging = false;
    dragStart = { x: event.clientX, y: event.clientY };
    lastPointer = { x: event.clientX, y: event.clientY };
  }

  function onPointerMove(event) {
    if (event.pointerId !== activePointerId || !main.hasPointerCapture(event.pointerId)) return;
    var distance = Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y);
    if (!dragging && distance < dragThreshold) return;

    if (!dragging) {
      dragging = true;
      if (open) setOpen(false);
    }

    var dx = event.clientX - lastPointer.x;
    var dy = event.clientY - lastPointer.y;
    lastPointer = { x: event.clientX, y: event.clientY };
    pos.x += dx;
    pos.y += dy;
    clampPosition();
    schedulePosition();
    event.preventDefault();
  }

  function onPointerUp(event) {
    if (event.pointerId !== activePointerId) return;
    if (main.hasPointerCapture(event.pointerId)) main.releasePointerCapture(event.pointerId);
    activePointerId = null;
    if (dragging) {
      savePosition();
      dragging = false;
      return;
    }
    toggleMenu();
  }

  function onPointerCancel(event) {
    if (event.pointerId !== activePointerId) return;
    if (main.hasPointerCapture(event.pointerId)) main.releasePointerCapture(event.pointerId);
    activePointerId = null;
    if (dragging) savePosition();
    dragging = false;
  }

  function onOutsidePointerDown(event) {
    if (open && !nav.contains(event.target)) setOpen(false);
  }

  function onKeyDown(event) {
    if (open && event.key === "Escape") {
      setOpen(false);
      main.focus();
    }
  }

  function updateBreakpoint() {
    if (isPhone()) {
      nav.classList.add("bubble-nav--ready");
      refreshSafeInsets();
      clampPosition();
      schedulePosition();
    } else {
      if (open) setOpen(false);
      nav.classList.remove("bubble-nav--ready");
    }
  }

  function onResize() {
    if (!isPhone()) {
      updateBreakpoint();
      return;
    }
    refreshSafeInsets();
    clampPosition();
    schedulePosition();
    if (open) {
      spreadPositions();
      applySpread(true);
    }
  }

  function onOrientationChange() {
    if (open) setOpen(false);
    onResize();
  }

  function init() {
    if (initialized) return;
    initialized = true;

    setLogoMark();
    main.insertAdjacentHTML(
      "beforeend",
      '<svg class="x-mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12"/></svg>'
    );

    var iconNames = ["home", "solution", "work", "contact", "book"];
    itemEls.slice(0, 5).forEach(function (element, index) {
      element.innerHTML = icons[iconNames[index]];
    });

    loadPosition();
    spreadPositions();
    applySpread(false);
    updateThemeIcon();

    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        if (typeof window.__cycleTheme === "function") window.__cycleTheme();
        updateThemeIcon();
      });
    }

    main.addEventListener("pointerdown", onPointerDown);
    main.addEventListener("pointermove", onPointerMove, { passive: false });
    main.addEventListener("pointerup", onPointerUp);
    main.addEventListener("pointercancel", onPointerCancel);
    main.addEventListener("click", function (event) {
      if (event.detail === 0 && isPhone()) toggleMenu();
    });
    document.addEventListener("pointerdown", onOutsidePointerDown);
    document.addEventListener("keydown", onKeyDown);

    itemEls.forEach(function (element) {
      element.addEventListener("click", function (event) {
        event.preventDefault();
        setOpen(false);
        var href = element.getAttribute("href");
        if (!href) return;

        if (href.charAt(0) === "#") {
          var target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.location.href = href;
        }
      });
    });

    var themeObserver = new MutationObserver(updateThemeIcon);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    if (typeof IntersectionObserver !== "undefined") {
      var sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var sectionId = entry.target.id;
          itemEls.forEach(function (element) {
            element.classList.toggle("is-active", element.dataset.section === sectionId);
          });
        });
      }, { root: null, rootMargin: "-30% 0px -60% 0px", threshold: 0 });

      ["home", "solution", "work", "contact", "book-a-call"].forEach(function (id) {
        var section = document.getElementById(id);
        if (section) sectionObserver.observe(section);
      });
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientationChange);
    mqPhone.addEventListener("change", updateBreakpoint);
    mqLandPhone.addEventListener("change", updateBreakpoint);
    updateBreakpoint();
  }

  var componentObserver = new MutationObserver(function () {
    if (!document.querySelector(".site-nav .logo")) return;
    componentObserver.disconnect();
    init();
  });

  if (document.querySelector(".site-nav .logo")) {
    init();
  } else {
    componentObserver.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener("components:ready", function () {
      if (document.querySelector(".site-nav .logo")) {
        componentObserver.disconnect();
        init();
      }
    }, { once: true });
    document.addEventListener("DOMContentLoaded", function () {
      if (document.querySelector(".site-nav .logo")) {
        componentObserver.disconnect();
        init();
      }
    }, { once: true });
  }
})();
