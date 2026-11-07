// Anthrix &mdash; Static site scripts

(function () {
  "use strict";

  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open === true);
    });
  }

  // Contact form
  var form = document.getElementById("contactForm");
  var message = document.getElementById("formMessage");
  var submitBtn = document.getElementById("submitBtn");

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

    // Name (required, min 2)
    if (!fields.name || fields.name.value.trim().length < 2) {
      showError("name", "Please enter your name (at least 2 characters).");
      ok = false;
    }

    // Email (required, valid format)
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!fields.email || !emailRe.test(fields.email.value.trim())) {
      showError("email", "Please enter a valid email address.");
      ok = false;
    }

    // Project (required)
    if (!fields.project || fields.project.value.trim().length === 0) {
      showError("project", "Please tell us about your project.");
      ok = false;
    }

    // Budget (optional, but if set must be valid)
    if (fields.budget && fields.budget.value && fields.budget.value.trim() === "") {
      showError("budget", "Please select a budget range.");
      ok = false;
    }

    // Timeline (optional)
    if (fields.timeline && fields.timeline.value && fields.timeline.value.trim() === "") {
      showError("timeline", "Please select a time line.");
      ok = false;
    }

    // What are you building? (required, min 10 chars)
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

    var payload = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      project: fields.project.value.trim(),
      budget: fields.budget ? fields.budget.value : "",
      timeline: fields.timeline ? fields.timeline.value : "",
      building: fields.building.value.trim(),
    };

    // Endpoint for the contact form submission.
    // Wire this to your form backend (e.g. Formspree, Netlify Forms, or your own API).
    var endpoint = form.getAttribute("action") || "/api/contact";

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
})();
