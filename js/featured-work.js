(function () {
  "use strict";

  var projects = [
    {
      title: "Library management system",
      image: "images/work/LMS.png",
      alt: "Screenshot of the library management system",
      client: "Iloilo City Public Library (Dr. Graciano Lopez Jaena Learning Resource Center and Museum)",
      problem: "Library records and borrowing were handled manually.",
      built: "A web-based library management system for managing books, members and borrowing, with a public catalog.",
      result: "Staff manage books, members and borrowing in one system, and visitors can search the catalog online.",
      tools: ["Flask", "MySQL", "HTML", "CSS", "JavaScript", "Bootstrap", "androidStudio", "node.js", "blender", "jinja2", "tailwindcss"],
    },
    {
      title: "Store management sheets",
      image: "images/work/TindaHub.png",
      alt: "Screenshot of the store management sheets and dashboard",
      client: "A local sari-sari store",
      problem: "Sales, stock, expenses and customer credit were tracked by hand.",
      built: "Automated Google Sheets with a store dashboard covering sales, inventory, restock alerts, expenses, customer credit and payments.",
      result: "Sales, stock, expenses and customer credit update in one dashboard, with alerts for items to restock and a list of who still owes.",
      tools: ["Google Sheets", "Apps Script", "HTML", "CSS", "JavaScript"],
    },
  ];

  var marquee = document.querySelector("[data-featured-marquee]");
  var viewport = document.querySelector("[data-featured-window]");
  var track = document.querySelector("[data-featured-track]");
  var backdrop = document.querySelector("[data-project-dialog-backdrop]");
  var dialog = document.querySelector("[data-project-dialog]");
  var dialogContent = document.querySelector("[data-project-dialog-content]");
  var closeButton = document.querySelector("[data-project-dialog-close]");
  if (!marquee || !viewport || !track || !backdrop || !dialog || !dialogContent || !closeButton) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var resizeTimer = 0;
  var pendingRender = false;
  var activeOpener = null;
  var previousBodyOverflow = "";
  var previousDocumentOverflow = "";

  function createElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function createImage(project, frame) {
    var image = createElement("img");
    image.alt = project.alt;
    image.width = 1280;
    image.height = 720;
    image.loading = "lazy";
    image.hidden = true;
    var placeholder = createElement("span", "featured-work-placeholder", "Screenshot coming");
    image.addEventListener("load", function () {
      image.hidden = false;
      placeholder.hidden = true;
    });
    image.addEventListener("error", function () {
      image.hidden = true;
      placeholder.hidden = false;
    });
    frame.append(image, placeholder);
    image.src = project.image;
  }

  function fitToolTags(card, tools) {
    var list = card.querySelector(".featured-work-tools");
    if (!list) return;
    var maxVisible = Math.min(3, tools.length);
    for (var visibleCount = maxVisible; visibleCount >= 0; visibleCount -= 1) {
      list.replaceChildren();
      tools.slice(0, visibleCount).forEach(function (tool) {
        list.appendChild(createElement("li", "", tool));
      });
      var hiddenCount = tools.length - visibleCount;
      if (hiddenCount) list.appendChild(createElement("li", "featured-work-tools-more", "+" + hiddenCount));
      if (list.scrollWidth <= list.clientWidth) break;
    }
  }

  function fitToolTagsIn(half) {
    half.querySelectorAll(".featured-work-card").forEach(function (card) {
      var project = projects[Number(card.dataset.projectIndex)];
      fitToolTags(card, project.tools);
    });
  }

  function createCard(project, index, exposed) {
    var card = createElement("article", "featured-work-card");
    card.dataset.projectIndex = String(index);
    if (!exposed) {
      card.setAttribute("aria-hidden", "true");
      card.setAttribute("inert", "");
      card.tabIndex = -1;
    }

    var frame = createElement("div", "featured-work-image-frame");
    createImage(project, frame);
    var title = createElement("h3", "", project.title);
    var client = createElement("p", "featured-work-client", project.client);
    client.title = project.client;
    var tools = createElement("ul", "featured-work-tools");
    tools.setAttribute("aria-label", "Tools used");
    project.tools.forEach(function (tool) {
      tools.appendChild(createElement("li", "", tool));
    });

    var detailsButton = createElement("button", "home-action-button featured-work-view", "View details");
    detailsButton.type = "button";
    detailsButton.setAttribute("aria-label", "View details for " + project.title);
    if (exposed) {
      detailsButton.addEventListener("click", function () {
        openDialog(project, detailsButton);
      });
    } else {
      detailsButton.tabIndex = -1;
    }

    card.append(frame, title, client, tools, detailsButton);
    return card;
  }

  function createHalf(exposed) {
    var half = createElement("div", "featured-work-half");
    if (!exposed) {
      half.setAttribute("aria-hidden", "true");
      half.setAttribute("inert", "");
      half.tabIndex = -1;
    }
    projects.forEach(function (project, index) {
      half.appendChild(createCard(project, index, exposed));
    });
    return half;
  }

  function renderTrack() {
    track.replaceChildren();
    var firstHalf = createHalf(true);
    track.appendChild(firstHalf);
    fitToolTagsIn(firstHalf);
    if (reducedMotion.matches) return;

    var halfWidth = firstHalf.getBoundingClientRect().width;
    var viewportWidth = viewport.clientWidth;
    if (!halfWidth || !viewportWidth) return;
    var setCount = Math.max(1, Math.ceil((viewportWidth * 2) / halfWidth));
    for (var setIndex = 1; setIndex < setCount; setIndex += 1) {
      projects.forEach(function (project, index) {
        firstHalf.appendChild(createCard(project, index, false));
      });
    }

    var secondHalf = createHalf(false);
    for (var repeatIndex = 1; repeatIndex < setCount; repeatIndex += 1) {
      projects.forEach(function (project, index) {
        secondHalf.appendChild(createCard(project, index, false));
      });
    }
    track.appendChild(secondHalf);
    fitToolTagsIn(firstHalf);
    fitToolTagsIn(secondHalf);
  }

  function addDetail(parent, label, value) {
    var detail = createElement("p", "project-dialog-detail");
    var heading = createElement("strong", "", label + ": ");
    detail.append(heading, document.createTextNode(value));
    parent.appendChild(detail);
  }

  function renderDialog(project) {
    dialogContent.replaceChildren();
    var title = createElement("h2", "", project.title);
    title.id = "projectDialogTitle";
    var client = createElement("p", "project-dialog-client", project.client);
    var frame = createElement("div", "project-dialog-image");
    createImage(project, frame);
    dialogContent.append(title, client, frame);
    addDetail(dialogContent, "The problem", project.problem);
    addDetail(dialogContent, "What we built", project.built);
    addDetail(dialogContent, "The result", project.result);

    var tools = createElement("ul", "project-dialog-tools");
    tools.setAttribute("aria-label", "Tools used");
    project.tools.forEach(function (tool) {
      tools.appendChild(createElement("li", "", tool));
    });
    var bookLink = createElement("a", "home-action-button", "Book a call");
    bookLink.href = "book-a-call.html";
    dialogContent.append(tools, bookLink);
  }

  function openDialog(project, opener) {
    activeOpener = opener;
    renderDialog(project);
    previousBodyOverflow = document.body.style.overflow;
    previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    backdrop.hidden = false;
    marquee.classList.add("is-dialog-open");
    closeButton.focus();
  }

  function getSemanticOpener(index) {
    return track.querySelector(
      '.featured-work-half:not([aria-hidden="true"]) [data-project-index="' + index + '"] .featured-work-view'
    );
  }

  function closeDialog() {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    marquee.classList.remove("is-dialog-open");
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousDocumentOverflow;
    var projectIndex = activeOpener && activeOpener.closest("[data-project-index]")
      ? activeOpener.closest("[data-project-index]").dataset.projectIndex
      : "";
    if (pendingRender) {
      pendingRender = false;
      renderTrack();
      activeOpener = getSemanticOpener(projectIndex);
    }
    if (activeOpener && activeOpener.isConnected) activeOpener.focus();
    activeOpener = null;
  }

  function getFocusableElements() {
    return Array.prototype.slice.call(dialog.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (element) {
      return !element.hidden && element.getAttribute("aria-hidden") !== "true";
    });
  }

  closeButton.addEventListener("click", closeDialog);
  viewport.addEventListener("click", function (event) {
    if (event.target.closest && event.target.closest(".featured-work-view")) return;
    var repeatedButtons = track.querySelectorAll(
      '.featured-work-card[aria-hidden="true"] .featured-work-view'
    );
    for (var index = 0; index < repeatedButtons.length; index += 1) {
      var bounds = repeatedButtons[index].getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) continue;
      var card = repeatedButtons[index].closest(".featured-work-card");
      var projectIndex = Number(card.dataset.projectIndex);
      openDialog(projects[projectIndex], getSemanticOpener(projectIndex));
      break;
    }
  });
  backdrop.addEventListener("click", function (event) {
    if (event.target === backdrop) closeDialog();
  });
  dialog.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key !== "Tab") return;
    var focusable = getFocusableElements();
    if (!focusable.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  marquee.addEventListener("focusin", function (event) {
    var card = event.target.closest && event.target.closest('.featured-work-card:not([aria-hidden="true"])');
    if (!card) return;
    var target = event.target.getBoundingClientRect();
    var visible = viewport.getBoundingClientRect();
    if (target.left < visible.left || target.right > visible.right) {
      marquee.classList.add("is-focus-reveal");
    }
  });
  marquee.addEventListener("focusout", function (event) {
    if (!marquee.contains(event.relatedTarget)) marquee.classList.remove("is-focus-reveal");
  });

  function scheduleRender() {
    if (!backdrop.hidden) {
      pendingRender = true;
      return;
    }
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(renderTrack, 150);
  }

  renderTrack();
  window.addEventListener("resize", scheduleRender, { passive: true });
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", scheduleRender);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(scheduleRender);
  }
})();
