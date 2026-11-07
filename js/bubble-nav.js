// Anthrix Tech — Bubble Navigation (phones only)
// Floating draggable main bubble that spreads 6 quick-nav bubbles on tap.

(function () {
  "use strict";

  // ── Phone detection ─────────────────────────────────────────
  var mqPhone = window.matchMedia("(max-width: 767px)");
  var mqLandPhone = window.matchMedia("(max-height: 500px) and (pointer: coarse)");
  if (!mqPhone.matches && !mqLandPhone.matches) {
    return;
  }

  // ── Elements ────────────────────────────────────────────────
  var nav = document.getElementById("bubbleNav");
  var main = document.getElementById("bubbleMain");
  var itemsContainer = document.getElementById("bubbleItems");
  var themeBtn = document.getElementById("bubbleTheme");
  var itemEls = [].slice.call(itemsContainer.querySelectorAll(".bubble-item"));

  if (!nav || !main || !itemsContainer || !themeBtn || itemEls.length === 0) {
    return;
  }

  nav.classList.add("bubble-nav--ready");

  // ── Icons (inline SVG, 24px, stroke currentColor) ───────────
  var ICON_HOME =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  var ICON_SOLUTION =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h6a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3z"/><path d="M9 21V9a6 6 0 0 1 6-6v0a6 6 0 0 1 6 6v12"/></svg>';
  var ICON_WORK =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3z"/><path d="M7 7h10v7H7z"/></svg>';
  var ICON_CONTACT =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>';
  var ICON_BOOK =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var ICON_THEME_BRAND =
    '<span class="theme-dot" style="display:inline-block;width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,#FDBA8C 0%,#7144D4 45%,#3B0A9E 100%)" aria-hidden="true"></span>';
  var ICON_THEME_DARK =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var ICON_THEME_LIGHT =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M18.36 4.93l-1.41 1.41"/></svg>';

  // Inject icons into markup
  itemEls[0].innerHTML = ICON_HOME;        // home
  itemEls[1].innerHTML = ICON_SOLUTION;   // lightbulb
  itemEls[2].innerHTML = ICON_WORK;       // briefcase
  itemEls[3].innerHTML = ICON_CONTACT;    // mail
  itemEls[4].innerHTML = ICON_BOOK;       // calendar

  // Main bubble logo mark (~26px) + X
  main.innerHTML =
    '<svg class="logo-mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>' +
    '<svg class="x-mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';

  // ── State ───────────────────────────────────────────────────
  var pos = { x: 0, y: 0 };
  var open = false;
  var dragging = false;
  var dragStart = { x: 0, y: 0 };
  var lastPointer = { x: 0, y: 0 };
  var rafId = null;
  var MARGIN = 8;
  var DRAG_THRESHOLD = 6;

  // ── Safe area helpers ───────────────────────────────────────
  function safeInsets() {
    return {
      top: parseInt(getComputedStyle(document.documentElement).paddingTop.replace("px", "")) || 0,
      right: parseInt(getComputedStyle(document.documentElement).paddingRight.replace("px", "")) || 0,
      bottom: parseInt(getComputedStyle(document.documentElement).paddingBottom.replace("px", "")) || 0,
      left: parseInt(getComputedStyle(document.documentElement).paddingLeft.replace("px", "")) || 0,
    };
  }

  // Use env() via computed style of a test element
  function envInsets() {
    var t = document.createElement("div");
    t.style.position = "fixed";
    t.style.top = "env(safe-area-inset-top)";
    t.style.left = "env(safe-area-inset-left)";
    t.style.right = "env(safe-area-inset-right)";
    t.style.bottom = "env(safe-area-inset-bottom)";
    document.body.appendChild(t);
    var rect = t.getBoundingClientRect();
    document.body.removeChild(t);
    return {
      top: rect.top,
      left: rect.left,
      right: window.innerWidth - rect.right,
      bottom: window.innerHeight - rect.bottom,
    };
  }

  function getInsets() {
    var e = envInsets();
    return {
      top: Math.max(e.top, 0),
      right: Math.max(e.right, 0),
      bottom: Math.max(e.bottom, 0),
      left: Math.max(e.left, 0),
    };
  }

  // ── Position load / save / clamp ────────────────────────────
  function loadPosition() {
    try {
      var saved = localStorage.getItem("bubbleNavPos");
      if (saved) {
        pos = JSON.parse(saved);
      }
    } catch (e) {
      // ignore
    }
    if (pos.x == null || pos.y == null) {
      pos = { x: window.innerWidth - 76, y: window.innerHeight - 76 };
    }
    clampPosition();
    applyPosition();
  }

  function savePosition() {
    try {
      localStorage.setItem("bubbleNavPos", JSON.stringify(pos));
    } catch (e) {
      // ignore
    }
  }

  function clampPosition() {
    var insets = getInsets();
    var minX = MARGIN + insets.left;
    var minY = MARGIN + insets.top;
    var maxX = window.innerWidth - 56 - MARGIN - insets.right;
    var maxY = window.innerHeight - 56 - MARGIN - insets.bottom;
    pos.x = Math.min(Math.max(pos.x, minX), maxX);
    pos.y = Math.min(Math.max(pos.y, minY), maxY);
  }

  function applyPosition() {
    main.style.transform = "translate(" + pos.x + "px, " + pos.y + "px)";
  }

  // ── Drag (Pointer Events) ───────────────────────────────────
  function startDrag(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    main.setPointerCapture(e.pointerId);
    dragging = false;
    dragStart = { x: e.clientX, y: e.clientY };
    lastPointer = { x: e.clientX, y: e.clientY };
    main.style.touchAction = "none";
    if (open) {
      setOpen(false);
    }
  }

  function moveDrag(e) {
    if (!main.hasPointerCapture(e.pointerId)) return;
    var dx = e.clientX - lastPointer.x;
    var dy = e.clientY - lastPointer.y;
    lastPointer = { x: e.clientX, y: e.clientY };

    if (!dragging) {
      var moveDist = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y);
      if (moveDist < DRAG_THRESHOLD) return;
      dragging = true;
    }

    pos.x += dx;
    pos.y += dy;
    clampPosition();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(applyPosition);
  }

  function endDrag(e) {
    if (main.hasPointerCapture(e.pointerId)) {
      main.releasePointerCapture(e.pointerId);
    }
    if (dragging) {
      savePosition();
      dragging = false;
      return;
    }
    // Tap (under threshold) — toggle menu
    toggleMenu();
  }

  function cancelDrag(e) {
    if (main.hasPointerCapture(e.pointerId)) {
      main.releasePointerCapture(e.pointerId);
    }
    dragging = false;
  }

  main.addEventListener("pointerdown", startDrag, { passive: false });
  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", cancelDrag);

  // ── Open / close menu ───────────────────────────────────────
  function setOpen(isOpen) {
    open = isOpen;
    main.setAttribute("aria-expanded", String(isOpen));
    main.classList.toggle("is-open", isOpen);
    nav.classList.toggle("bubble-nav--open", isOpen);
    itemsContainer.setAttribute("aria-hidden", String(!isOpen));

    itemEls.forEach(function (el, i) {
      el.setAttribute("tabindex", isOpen ? "0" : "-1");
    });

    if (isOpen) {
      recomputeSpread();
      applySpread(open);
    } else {
      applySpread(false);
    }
  }

  function toggleMenu() {
    setOpen(!open);
  }

  // ── Spread computation ──────────────────────────────────────
  function getBubbleCenter() {
    var rect = main.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function getViewportCenter() {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  function clampPoint(x, y, size) {
    var insets = getInsets();
    var minX = MARGIN + insets.left;
    var minY = MARGIN + insets.top;
    var maxX = window.innerWidth - size - MARGIN - insets.right;
    var maxY = window.innerHeight - size - MARGIN - insets.bottom;
    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  }

  function recomputeSpread() {
    var center = getBubbleCenter();
    var vCenter = getViewportCenter();
    var dx = vCenter.x - center.x;
    var dy = vCenter.y - center.y;
    var dist = Math.hypot(dx, dy);
    var size = 46;

    var angle, radius, startAngle, arc;
    if (dist > 120) {
      // Arc: 200 degrees centered on direction to viewport center
      angle = Math.atan2(dy, dx);
      radius = 96;
      startAngle = angle - 100 * (Math.PI / 180);
      arc = 200 * (Math.PI / 180);
    } else {
      // Full circle: 60 degrees apart, starting at top
      angle = 0;
      radius = 96;
      startAngle = -90 * (Math.PI / 180);
      arc = 360 * (Math.PI / 180);
    }

    itemEls.forEach(function (el, i) {
      var a = startAngle + (arc * i) / (itemEls.length - 1 || 1);
      var tx = center.x + radius * Math.cos(a) - size / 2;
      var ty = center.y + radius * Math.sin(a) - size / 2;
      var clamped = clampPoint(tx, ty, size);
      el.dataset.bx = clamped.x;
      el.dataset.by = clamped.y;
      el.dataset.mx = center.x - size / 2;
      el.dataset.my = center.y - size / 2;
    });
  }

  function applySpread(isOpen) {
    itemEls.forEach(function (el, i) {
      var delay = isOpen ? i * 45 : (itemEls.length - 1 - i) * 15;
      el.style.transitionDelay = delay + "ms";
      if (isOpen) {
        el.style.transform = "translate(" + el.dataset.bx + "px, " + el.dataset.by + "px) scale(1)";
        el.style.opacity = "1";
      } else {
        el.style.transform = "translate(" + el.dataset.mx + "px, " + el.dataset.my + "px) scale(0.2)";
        el.style.opacity = "0";
      }
    });
  }

  // ── Theme ───────────────────────────────────────────────────
  function updateThemeIcon() {
    var theme = document.documentElement.getAttribute("data-theme") || "brand";
    var icon = theme === "brand" ? ICON_THEME_BRAND : theme === "dark" ? ICON_THEME_DARK : ICON_THEME_LIGHT;
    themeBtn.innerHTML = icon;
  }

  function cycleBubbleTheme() {
    if (typeof window.__cycleTheme === "function") {
      window.__cycleTheme();
    }
    updateThemeIcon();
  }

  themeBtn.addEventListener("click", cycleBubbleTheme);

  // MutationObserver: update theme icon when theme changes elsewhere
  var themeObserver = new MutationObserver(function () {
    updateThemeIcon();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  updateThemeIcon();

  // ── Active section (IntersectionObserver) ───────────────────
  var sectionIds = ["home", "solution", "work", "contact", "book-a-call"];
  var observerSupported = typeof IntersectionObserver !== "undefined";

  if (observerSupported) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.getAttribute("id");
          itemEls.forEach(function (el) {
            el.classList.toggle("is-active", el.getAttribute("data-section") === id);
          });
        });
      },
      { root: null, rootMargin: "-30% 0% -70%", threshold: 0 }
    );

    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  // ── Item click: close menu then navigate ────────────────────
  itemEls.forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      setOpen(false);
      var href = el.getAttribute("href");
      if (href && href.startsWith("#")) {
        var target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else if (href) {
        window.location.href = href;
      }
    });
  });

  // ── Close on outside tap ────────────────────────────────────
  window.addEventListener("pointerdown", function (e) {
    if (!open) return;
    if (nav.contains(e.target)) return;
    setOpen(false);
  });

  // ── Escape closes ───────────────────────────────────────────
  document.addEventListener("keydown", function (e) {
    if (!open) return;
    if (e.key === "Escape") {
      setOpen(false);
      main.focus();
    }
  });

  // ── Resize / orientation: re-clamp ──────────────────────────
  function onResize() {
    clampPosition();
    applyPosition();
    if (open) {
      recomputeSpread();
      applySpread(true);
    }
  }
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);

  // ── Breakpoint exit: hide bubble if no longer phone ─────────
  function checkBreakpoint() {
    if (!mqPhone.matches && !mqLandPhone.matches) {
      nav.style.display = "none";
      if (open) setOpen(false);
    } else {
      nav.style.display = "";
    }
  }
  mqPhone.addEventListener("change", checkBreakpoint);
  mqLandPhone.addEventListener("change", checkBreakpoint);

  // ── Boot ────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
