// Anthrix Tech — Bubble Navigation (phones only)
// - Draggable bubble that snaps to the nearest screen edge (magnet)
// - Menu items fan out around the bubble, adapting to any edge, corner,
//   screen size, orientation and safe area, and never cover the top bar
(function () {
  "use strict";

  var mqPhone = window.matchMedia("(max-width: 767px)");
  var mqLandPhone = window.matchMedia("(max-height: 500px) and (pointer: coarse)");
  var nav = document.getElementById("bubbleNav");
  var main = document.getElementById("bubbleMain");
  var itemsContainer = document.getElementById("bubbleItems");

  if (!nav || !main || !itemsContainer) return;

  // The theme switch lives in the top bar now: drop any leftover theme item
  var staleTheme = document.getElementById("bubbleTheme");
  if (staleTheme) staleTheme.remove();

  var itemEls = Array.prototype.slice.call(itemsContainer.querySelectorAll(".bubble-item"));

  var SIZE = 56;            // main bubble diameter (matches .bubble-main)
  var ITEM = 46;            // menu item diameter (matches .bubble-item)
  var margin = 8;           // gap kept from every screen edge and the top bar
  var dragThreshold = 6;
  var EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
  var STORE_KEY = "bubbleNavSnap";
  var EDGES = ["left", "right", "top", "bottom"];

  var snapState = { edge: "right", t: 1 }; // edge + position along it (0..1)
  var pos = { x: 0, y: 0 };
  var safe = { top: 0, right: 0, bottom: 0, left: 0 };
  var open = false;
  var dragging = false;
  var activePointerId = null;
  var dragStart = { x: 0, y: 0 };
  var startPos = { x: 0, y: 0 };
  var rafId = 0;
  var initialized = false;

  var icons = {
    home: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
    solution: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    work: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
    contact: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
    book: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  };

  function isPhone() {
    return mqPhone.matches || mqLandPhone.matches;
  }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
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

  // ------------------------------------------------------------
  // Screen geometry (read live, so any phone size works)
  // ------------------------------------------------------------

  function viewport() {
    return {
      w: document.documentElement.clientWidth || window.innerWidth,
      h: window.innerHeight,
    };
  }

  // Lowest y that bubble and items may use: just below the top bar
  function topLimit() {
    var header = document.querySelector(".site-nav");
    var headerH = header ? header.offsetHeight : 64;
    return Math.max(safe.top + margin, headerH + margin);
  }

  function bounds() {
    var v = viewport();
    var minX = margin + safe.left;
    var minY = topLimit();
    return {
      w: v.w,
      h: v.h,
      minX: minX,
      minY: minY,
      maxX: Math.max(minX, v.w - SIZE - margin - safe.right),
      maxY: Math.max(minY, v.h - SIZE - margin - safe.bottom),
    };
  }

  // ------------------------------------------------------------
  // Magnet: edge + ratio <-> pixel position
  // ------------------------------------------------------------

  function posFromState() {
    var b = bounds();
    var t = clamp(snapState.t, 0, 1);
    switch (snapState.edge) {
      case "left":
        return { x: b.minX, y: b.minY + t * (b.maxY - b.minY) };
      case "top":
        return { x: b.minX + t * (b.maxX - b.minX), y: b.minY };
      case "bottom":
        return { x: b.minX + t * (b.maxX - b.minX), y: b.maxY };
      default:
        return { x: b.maxX, y: b.minY + t * (b.maxY - b.minY) };
    }
  }

  function stateFromPos(p) {
    var b = bounds();
    var dist = {
      left: p.x - b.minX,
      right: b.maxX - p.x,
      top: p.y - b.minY,
      bottom: b.maxY - p.y,
    };
    var edge = "right";
    EDGES.forEach(function (name) {
      if (dist[name] < dist[edge]) edge = name;
    });
    var alongY = (p.y - b.minY) / (b.maxY - b.minY || 1);
    var alongX = (p.x - b.minX) / (b.maxX - b.minX || 1);
    var t = edge === "left" || edge === "right" ? alongY : alongX;
    return { edge: edge, t: clamp(t, 0, 1) };
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(snapState));
    } catch (error) {
      console.warn("Bubble navigation position could not be saved.", error);
    }
  }

  function loadState() {
    try {
      var value = localStorage.getItem(STORE_KEY);
      if (value) {
        var saved = JSON.parse(value);
        if (saved && EDGES.indexOf(saved.edge) !== -1 && Number.isFinite(saved.t)) {
          snapState = { edge: saved.edge, t: clamp(saved.t, 0, 1) };
        }
      }
    } catch (error) {
      console.warn("Bubble navigation position could not be restored.", error);
    }
  }

  // ------------------------------------------------------------
  // Positioning
  // ------------------------------------------------------------

  function applyPosition() {
    rafId = 0;
    main.style.transform = "translate3d(" + pos.x + "px, " + pos.y + "px, 0)";
  }

  function schedulePosition() {
    if (!rafId) rafId = window.requestAnimationFrame(applyPosition);
  }

  function setMainTransition(ms) {
    main.style.transition = ms
      ? "transform " + ms + "ms " + (reducedMotion() ? "ease" : EASE) + ", background-color 0.2s ease"
      : "none";
  }

  function snapToEdge(animate) {
    snapState = stateFromPos(pos);
    pos = posFromState();
    setMainTransition(animate ? (reducedMotion() ? 160 : 520) : 0);
    applyPosition();
    saveState();
  }

  function placeFromState() {
    pos = posFromState();
    setMainTransition(0);
    applyPosition();
  }

  // ------------------------------------------------------------
  // Item layout: fan the 6 items around the bubble on arcs that
  // stay inside the screen and below the top bar. If an arc is
  // full, the rest go on a second arc further out.
  // ------------------------------------------------------------

  function itemLimits() {
    var v = viewport();
    return {
      l: margin + safe.left + ITEM / 2,
      r: v.w - margin - safe.right - ITEM / 2,
      t: topLimit() + ITEM / 2,
      b: v.h - margin - safe.bottom - ITEM / 2,
    };
  }

  // Longest run of angles where an item at radius r stays on screen
  function arcAt(cx, cy, r, lim) {
    var step = 2;
    var n = 360 / step;
    var ok = [];
    var a, rad, ix, iy, i;
    for (a = 0; a < 360; a += step) {
      rad = (a * Math.PI) / 180;
      ix = cx + r * Math.cos(rad);
      iy = cy + r * Math.sin(rad);
      ok.push(ix >= lim.l && ix <= lim.r && iy >= lim.t && iy <= lim.b);
    }
    var all = true;
    for (i = 0; i < n; i++) {
      if (!ok[i]) { all = false; break; }
    }
    if (all) return { full: true, start: -90, len: 360 };

    var best = 0;
    var bestStart = 0;
    for (var s = 0; s < n; s++) {
      if (ok[s] && !ok[(s - 1 + n) % n]) {
        var run = 0;
        while (ok[(s + run) % n] && run < n) run++;
        if (run > best) { best = run; bestStart = s; }
      }
    }
    return { full: false, start: bestStart * step, len: best > 0 ? (best - 1) * step : -1 };
  }

  function fan(cx, cy, count, gap, firstRadius, ringStep, maxRings) {
    var lim = itemLimits();
    var out = [];
    var left = count;
    var r = firstRadius;
    for (var ring = 0; ring < maxRings && left > 0; ring++, r += ringStep) {
      var arc = arcAt(cx, cy, r, lim);
      if (arc.len < 0) continue;
      var capacity = arc.full
        ? Math.floor((2 * Math.PI * r) / gap)
        : Math.floor((arc.len * Math.PI / 180 * r) / gap) + 1;
      var take = Math.min(capacity, left);
      if (take < 1) continue;
      for (var i = 0; i < take; i++) {
        var angle;
        if (arc.full) angle = arc.start + (i * 360) / take;
        else if (take === 1) angle = arc.start + arc.len / 2;
        else angle = arc.start + (i * arc.len) / (take - 1);
        var rad = (angle * Math.PI) / 180;
        out.push({ x: cx + r * Math.cos(rad) - ITEM / 2, y: cy + r * Math.sin(rad) - ITEM / 2 });
      }
      left -= take;
    }
    return out;
  }

  function spreadPositions() {
    var cx = pos.x + SIZE / 2;
    var cy = pos.y + SIZE / 2;
    var n = itemEls.length;

    var points = fan(cx, cy, n, ITEM + 8, 92, 56, 6);
    if (points.length < n) points = fan(cx, cy, n, ITEM + 2, 72, 52, 9); // very small screens

    var lim = itemLimits();
    itemEls.forEach(function (element, index) {
      var p = points[index] || {
        x: clamp(cx - ITEM / 2, lim.l - ITEM / 2, lim.r - ITEM / 2),
        y: clamp(cy - ITEM / 2, lim.t - ITEM / 2, lim.b - ITEM / 2),
      };
      element.dataset.openX = p.x;
      element.dataset.openY = p.y;
      element.dataset.closedX = cx - ITEM / 2;
      element.dataset.closedY = cy - ITEM / 2;
    });
  }

  function applySpread(shouldOpen) {
    var reduced = reducedMotion();
    itemEls.forEach(function (element, index) {
      var delay = shouldOpen && !reduced ? index * 45 : 0;
      element.style.transitionDelay = delay + "ms";
      element.style.transitionDuration = (reduced ? 160 : shouldOpen ? 450 : 180) + "ms";
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

  // ------------------------------------------------------------
  // Pointer handling
  // ------------------------------------------------------------

  function onPointerDown(event) {
    if (!isPhone() || (event.pointerType === "mouse" && event.button !== 0)) return;
    activePointerId = event.pointerId;
    main.setPointerCapture(event.pointerId);
    dragging = false;
    dragStart = { x: event.clientX, y: event.clientY };
    startPos = { x: pos.x, y: pos.y };
  }

  function onPointerMove(event) {
    if (event.pointerId !== activePointerId || !main.hasPointerCapture(event.pointerId)) return;
    var dx = event.clientX - dragStart.x;
    var dy = event.clientY - dragStart.y;
    if (!dragging && Math.hypot(dx, dy) < dragThreshold) return;

    if (!dragging) {
      dragging = true;
      if (open) setOpen(false);
      setMainTransition(0);
    }

    var b = bounds();
    pos.x = clamp(startPos.x + dx, b.minX - SIZE / 2, b.maxX + SIZE / 2);
    pos.y = clamp(startPos.y + dy, b.minY - 10, b.maxY + SIZE / 2);
    schedulePosition();
    event.preventDefault();
  }

  function onPointerUp(event) {
    if (event.pointerId !== activePointerId) return;
    if (main.hasPointerCapture(event.pointerId)) main.releasePointerCapture(event.pointerId);
    activePointerId = null;
    if (dragging) {
      dragging = false;
      snapToEdge(true);
      return;
    }
    toggleMenu();
  }

  function onPointerCancel(event) {
    if (event.pointerId !== activePointerId) return;
    if (main.hasPointerCapture(event.pointerId)) main.releasePointerCapture(event.pointerId);
    activePointerId = null;
    if (dragging) snapToEdge(true);
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

  // ------------------------------------------------------------
  // Resize / orientation / breakpoint
  // ------------------------------------------------------------

  function updateBreakpoint() {
    if (isPhone()) {
      nav.classList.add("bubble-nav--ready");
      refreshSafeInsets();
      placeFromState();
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
    if (dragging) return;
    refreshSafeInsets();
    placeFromState();
    if (open) {
      spreadPositions();
      applySpread(true);
    }
  }

  function onOrientationChange() {
    if (open) setOpen(false);
    onResize();
    // Browsers report the new height a moment late
    window.setTimeout(onResize, 250);
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

    loadState();
    refreshSafeInsets();
    pos = posFromState();
    applyPosition();
    spreadPositions();
    applySpread(false);

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
    if (window.visualViewport) window.visualViewport.addEventListener("resize", onResize);
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