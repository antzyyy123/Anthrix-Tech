(function () {
  "use strict";

  var statusCard = document.querySelector(".next-open-call-card");
  var statusRow = document.querySelector("[data-next-open-status-row]");
  var statusText = document.querySelector("[data-next-open-status]");
  var timeText = document.querySelector("[data-next-open-time]");
  var dateText = document.querySelector("[data-next-open-date]");
  var reasonText = document.querySelector("[data-next-open-reason]");
  var bookingLink = document.querySelector("[data-next-open-link]");
  var availability = window.AnthrixAvailability;
  if (!statusCard || !statusRow || !statusText || !timeText || !dateText || !reasonText || !bookingLink) return;

  var activeRequest = 0;
  var currentSlot = null;
  var midnightTimer = 0;
  var refreshInterval = 0;

  function scheduleMidnightRefresh() {
    if (midnightTimer) window.clearTimeout(midnightTimer);
    if (!availability) return;
    var now = availability.readManilaTime();
    var nextMidnightUtc = Date.UTC(now.year, now.month - 1, now.day + 1, -8);
    midnightTimer = window.setTimeout(refresh, Math.max(1000, nextMidnightUtc - Date.now() + 50));
  }

  function showFallback() {
    currentSlot = null;
    statusCard.classList.remove("is-open", "is-closed");
    statusCard.classList.add("is-neutral");
    statusRow.classList.remove("is-open", "is-closed");
    statusRow.classList.add("is-neutral");
    statusText.textContent = "Pick a time that works";
    timeText.textContent = "";
    dateText.textContent = "";
    reasonText.textContent = "";
    reasonText.hidden = true;
    bookingLink.textContent = "Book a call";
  }

  function showSlot(slot, state, reason) {
    currentSlot = slot;
    statusCard.classList.remove("is-open", "is-closed", "is-neutral");
    statusCard.classList.add(state);
    statusRow.classList.remove("is-open", "is-closed", "is-neutral");
    statusRow.classList.add(state);
    statusText.textContent = state === "is-open" ? "OPEN TODAY" : "CLOSED TODAY";
    timeText.textContent = slot.time;
    dateText.textContent = availability.formatDate(slot.date, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: undefined,
    }) + ", PHT";
    reasonText.textContent = reason || "";
    reasonText.hidden = !reason;
    bookingLink.textContent = "Book this slot";
  }

  function refresh() {
    var request = ++activeRequest;
    try {
      scheduleMidnightRefresh();
      if (!availability) {
        showFallback();
        return;
      }

      var today = availability.readManilaTime();
      var todayKey = availability.dateKey(today.year, today.month, today.day);
      availability.loadHolidays(today.year).then(function (holidayResult) {
        if (request !== activeRequest) return;
        if (!holidayResult || holidayResult.status !== "ready") {
          showFallback();
          return;
        }

        return availability.findNextSlot().then(function (slot) {
          if (request !== activeRequest) return;
          if (!slot) {
            showFallback();
            return;
          }

          var maps = {};
          maps[today.year] = holidayResult.map;
          var holiday = availability.holidayName(todayKey, maps);
          var day = availability.weekday(todayKey);
          if (day >= 5) {
            showSlot(slot, "is-closed", "Weekend");
          } else if (holiday) {
            showSlot(slot, "is-closed", "Holiday: " + holiday);
          } else {
            var hasRemainingSlot = availability.slotDefinitions.some(function (item) {
              return !availability.isSlotPast(todayKey, item.start, today);
            });
            if (hasRemainingSlot) showSlot(slot, "is-open");
            else showSlot(slot, "is-closed", "No more slots today");
          }
        });
      }).catch(function () {
        if (request === activeRequest) showFallback();
      });
    } catch (error) {
      showFallback();
    }
  }

  bookingLink.addEventListener("click", function (event) {
    if (!currentSlot) return;
    var previousDate;
    var previousTime;
    var dateWriteAttempted = false;
    var timeWriteAttempted = false;
    try {
      previousDate = sessionStorage.getItem("anthrix-call-date");
      previousTime = sessionStorage.getItem("anthrix-call-time");
      dateWriteAttempted = true;
      sessionStorage.setItem("anthrix-call-date", currentSlot.date);
      timeWriteAttempted = true;
      sessionStorage.setItem("anthrix-call-time", currentSlot.time);
      event.preventDefault();
      window.location.href = bookingLink.href;
    } catch (error) {
      try {
        if (dateWriteAttempted) {
          if (previousDate !== null) sessionStorage.setItem("anthrix-call-date", previousDate);
          else sessionStorage.removeItem("anthrix-call-date");
        }
        if (timeWriteAttempted) {
          if (previousTime !== null) sessionStorage.setItem("anthrix-call-time", previousTime);
          else sessionStorage.removeItem("anthrix-call-time");
        }
      } catch (rollbackError) {
        // The default link remains available when session storage cannot be used.
      }
      showFallback();
    }
  });

  refresh();
  refreshInterval = window.setInterval(refresh, 60 * 1000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) refresh();
  });
  window.addEventListener("pagehide", function () {
    if (midnightTimer) window.clearTimeout(midnightTimer);
    if (refreshInterval) window.clearInterval(refreshInterval);
  });
})();
