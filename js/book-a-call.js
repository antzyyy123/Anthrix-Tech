(function () {
  "use strict";

  var availability = window.AnthrixAvailability;
  if (!availability) throw new Error("Booking availability helpers did not load.");

  var calendarGrid = document.getElementById("calendarGrid");
  var calendarHeading = document.getElementById("calendarHeading");
  var monthSummary = document.getElementById("monthSummary");
  var holidayNotice = document.getElementById("holidayNotice");
  var holidayList = document.getElementById("holidayList");
  var timelineArea = document.getElementById("timelineArea");
  var timelinePrompt = document.getElementById("timelinePrompt");
  var timelineDate = document.getElementById("timelineDate");
  var timeLine = document.getElementById("timeLine");
  var summary = document.getElementById("bookingSummary");
  var continueButton = document.getElementById("continueBooking");
  var nextAvailableButton = document.getElementById("nextAvailableButton");
  var todayButton = document.getElementById("todayButton");
  var openGuideButton = document.getElementById("openGuide");
  var guideBackdrop = document.getElementById("guideBackdrop");
  var guideDialog = document.getElementById("guideDialog");
  var guideStepTitle = document.getElementById("guideStepTitle");
  var guideProgress = document.getElementById("guideProgress");
  var guideProgressBottom = document.getElementById("guideProgressBottom");
  var guideScreenshot = document.getElementById("guideScreenshot");
  var guideScreenshotFallback = document.getElementById("guideScreenshotFallback");
  var guideHighlightLayer = document.getElementById("guideHighlightLayer");
  var guideDescriptions = document.getElementById("guideDescriptions");
  var guideDots = document.getElementById("guideDots");
  var guideBackButton = document.getElementById("guideBack");
  var guideNextButton = document.getElementById("guideNext");
  var closeGuideButton = document.getElementById("closeGuide");
  var clock = document.getElementById("philippineClock");
  var previousButton = document.getElementById("previousMonth");
  var nextButton = document.getElementById("nextMonth");
  var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var slotDefinitions = availability.slotDefinitions;
  var holidayMaps = Object.create(null);
  var holidayLoads = Object.create(null);
  var holidayPromises = Object.create(null);
  var currentManila = availability.readManilaTime();
  var visibleMonth = { year: currentManila.year, month: currentManila.month };
  var lastMonth = addMonths(visibleMonth, 6);
  var selectedDate = "";
  var selectedTime = "";
  var timer = 0;
  var lastClockDate = "";
  var lastClockMinute = "";
  var localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  var guideStepIndex = 0;
  // Adjust each highlight's percentage coordinates to move it over the matching screenshot detail.
  var STEPS = [
    {
      title: "Pick a work day",
      image: "images/manual/step-1.png",
      alt: "November 2026 calendar with weekdays, weekend columns, and month controls",
      descriptions: [
        { number: 1, text: "Choose an open date from Monday to Friday." },
        { number: 2, text: "Use the month arrows to move through the available months." },
      ],
      highlights: [
        { x: 28, y: 42, width: 38, height: 40, number: 1, arrow: { x: 50, y: 45, angle: 90 } },
        { x: 27, y: 2, width: 4, height: 7, number: 2 },
        { x: 68, y: 2, width: 4, height: 7, number: 2 },
      ],
    },
    {
      title: "Check holidays and weekends",
      image: "images/manual/step-2.png",
      alt: "November 2026 calendar with a Philippine holiday and greyed weekend dates",
      descriptions: [
        { number: 1, text: "Red dates mark Philippine holidays. They cannot be selected." },
        { number: 2, text: "Saturday and Sunday are not available for calls." },
      ],
      highlights: [
        { x: 69, y: 22, width: 5, height: 11, number: 1, arrow: { x: 71, y: 14, angle: 90 } },
        { x: 66, y: 32, width: 9, height: 10, number: 2 },
      ],
    },
    {
      title: "Pick a time",
      image: "images/manual/step-3.png",
      alt: "Booking timeline with one-hour times, lunch break, and next available time button",
      descriptions: [
        { number: 1, text: "Choose an open start time for your one-hour call." },
        { number: 2, text: "The 12 PM to 1 PM lunch break is not available." },
        { number: 3, text: "Use Next available time to jump to the earliest opening." },
      ],
      highlights: [
        { x: 20, y: 23, width: 61, height: 9, number: 1, arrow: { x: 50, y: 18, angle: 90 } },
        { x: 20, y: 42, width: 61, height: 7, number: 2 },
        { x: 20, y: 89, width: 16, height: 8, number: 3 },
      ],
    },
    {
      title: "Check your call",
      image: "images/manual/step-4.png",
      alt: "Your call card showing a selected date and Philippine time",
      descriptions: [
        { number: 1, text: "Check that the date and time are right. Your local time is also shown when your device uses another timezone." },
      ],
      highlights: [
        { x: 2, y: 29, width: 88, height: 10, number: 1, arrow: { x: 50, y: 23, angle: 90 } },
      ],
    },
    {
      title: "Continue to the contact form",
      image: "images/manual/step-5.png",
      alt: "Your call card with the Continue to contact form button enabled",
      descriptions: [
        { number: 1, text: "When a date and time are selected, continue to the contact form to send your request." },
      ],
      highlights: [
        { x: 2, y: 64, width: 96, height: 15, number: 1, arrow: { x: 50, y: 59, angle: 90 } },
      ],
    },
    {
      title: "Fill in and send the contact form",
      image: "images/manual/step-6.png",
      alt: "Contact form showing the selected call date and a Change link above the fields",
      descriptions: [
        { number: 1, text: "The selected call appears above the form. Fill in your details and project information, then send the form." },
        { number: 2, text: "Use Change if you want to pick a different date or time." },
      ],
      highlights: [
        { x: 9, y: 14, width: 89, height: 30, number: 1, arrow: { x: 50, y: 10, angle: 90 } },
        { x: 9, y: 46, width: 24, height: 12, number: 2 },
      ],
    },
    {
      title: "Wait for our email",
      image: "images/manual/step-7.png",
      alt: "Contact form success message after a booking request was sent",
      descriptions: [
        { number: 1, text: "We will reply by email to confirm the time or suggest another. Your request is not confirmed until we email you." },
      ],
      highlights: [
        { x: 10, y: 24, width: 88, height: 47, number: 1, arrow: { x: 50, y: 18, angle: 90 } },
      ],
    },
  ];
  var guidePreviousFocus = null;

  var dateKey = availability.dateKey;
  var parseDate = availability.parseDate;
  var weekday = availability.weekday;
  var formatDate = availability.formatDate;
  var readManilaTime = availability.readManilaTime;

  function addMonths(value, amount) {
    var date = new Date(Date.UTC(value.year, value.month - 1 + amount, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
  }

  function fixedHolidayMap(year) {
    return availability.fixedHolidayMap(year);
  }

  function isPast(value) {
    return availability.isPast(value, currentManila);
  }

  function holidayName(value) {
    return availability.holidayName(value, holidayMaps);
  }

  function canSelectDate(value) {
    return availability.canSelectDate(value, currentManila, holidayMaps);
  }

  function isWithinBookingRange(value) {
    var date = parseDate(value);
    if (!date) return false;
    var month = { year: date.year, month: date.month };
    return (month.year > currentManila.year ||
      (month.year === currentManila.year && month.month >= currentManila.month)) &&
      (month.year < lastMonth.year ||
      (month.year === lastMonth.year && month.month <= lastMonth.month));
  }

  function isSlotPast(value, hour) {
    return availability.isSlotPast(value, hour, currentManila);
  }

  function persistSelection() {
    try {
      if (selectedDate) {
        sessionStorage.setItem("anthrix-call-date", selectedDate);
        if (selectedTime) sessionStorage.setItem("anthrix-call-time", selectedTime);
        else sessionStorage.removeItem("anthrix-call-time");
      } else {
        sessionStorage.removeItem("anthrix-call-date");
        sessionStorage.removeItem("anthrix-call-time");
      }
    } catch (error) {
      console.warn("Could not save the selected call time.", error);
    }
  }

  function renderMonthSummary() {
    if (!monthSummary) return;
    var year = visibleMonth.year;
    var month = visibleMonth.month;
    var numberOfDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
    var today = dateKey(currentManila.year, currentManila.month, currentManila.day);
    var prefix = dateKey(year, month, 1).slice(0, 7) + "-";
    var holidayMap = holidayMaps[year] || fixedHolidayMap(year);
    var holidayDates = Object.keys(holidayMap).filter(function (date) {
      return date.indexOf(prefix) === 0;
    });
    var workDays = 0;
    for (var day = 1; day <= numberOfDays; day += 1) {
      var value = dateKey(year, month, day);
      var isTodayOrFuture = value >= today;
      if (isTodayOrFuture && weekday(value) < 5 && !holidayMap[value]) workDays += 1;
    }
    monthSummary.textContent = workDays + " work " + (workDays === 1 ? "day" : "days") +
      " left, " + holidayDates.length + " " + (holidayDates.length === 1 ? "holiday" : "holidays");
  }

  function createElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function renderNotice() {
    if (!holidayNotice) return;
    var state = holidayLoads[visibleMonth.year];
    holidayNotice.hidden = state !== "failed";
    holidayNotice.textContent = state === "failed"
      ? "Live Philippine holidays aren’t available right now. Fixed-date holidays are shown."
      : "";
  }

  function renderHolidayList() {
    if (!holidayList) return;
    holidayList.replaceChildren();
    var prefix = dateKey(visibleMonth.year, visibleMonth.month, 1).slice(0, 7) + "-";
    var holidayMap = holidayMaps[visibleMonth.year] || fixedHolidayMap(visibleMonth.year);
    Object.keys(holidayMap).filter(function (date) {
      return date.indexOf(prefix) === 0;
    }).sort().forEach(function (date) {
      var item = createElement("li", "is-holiday",
        new Intl.DateTimeFormat("en-PH", {
          timeZone: "UTC",
          month: "long",
          day: "numeric",
        }).format(new Date(Date.UTC(
          Number(date.slice(0, 4)),
          Number(date.slice(5, 7)) - 1,
          Number(date.slice(8, 10)),
          12
        ))) + " — " + holidayMap[date]);
      holidayList.appendChild(item);
    });
    if (!holidayList.children.length) {
      holidayList.appendChild(createElement("li", "", "No holidays listed this month."));
    }
  }

  function renderCalendar(focusDateOverride) {
    if (!calendarGrid || !calendarHeading) return;
    var focusDate = focusDateOverride || (document.activeElement && document.activeElement.classList.contains("calendar-day")
      ? document.activeElement.dataset.date
      : "");
    calendarHeading.textContent = monthNames[visibleMonth.month - 1] + " " + visibleMonth.year;
    calendarGrid.replaceChildren();

    weekdayLabels.forEach(function (label, index) {
      calendarGrid.appendChild(createElement("span", "calendar-weekday" + (index > 4 ? " is-weekend" : ""), label));
    });

    var offset = (new Date(Date.UTC(visibleMonth.year, visibleMonth.month - 1, 1)).getUTCDay() + 6) % 7;
    for (var blank = 0; blank < offset; blank += 1) {
      var empty = createElement("span", "calendar-empty");
      empty.setAttribute("aria-hidden", "true");
      calendarGrid.appendChild(empty);
    }

    var dayCount = new Date(Date.UTC(visibleMonth.year, visibleMonth.month, 0)).getUTCDate();
    for (var day = 1; day <= dayCount; day += 1) {
      var value = dateKey(visibleMonth.year, visibleMonth.month, day);
      var dayOfWeek = weekday(value);
      var holiday = holidayName(value);
      var isToday = value === dateKey(currentManila.year, currentManila.month, currentManila.day);
      var button = createElement("button", "calendar-day" +
        (dayOfWeek > 4 ? " is-weekend" : "") +
        (isToday ? " is-today" : "") +
        (isPast(value) ? " is-past" : "") +
        (holiday ? " is-holiday" : "") +
        (selectedDate === value ? " is-selected" : ""), "");
      button.type = "button";
      button.dataset.date = value;
      button.setAttribute("aria-pressed", String(selectedDate === value));
      button.setAttribute("aria-label", formatDate(value) +
        (isToday ? ", today" : "") +
        (holiday ? ", " + holiday + ", holiday, unavailable" : "") +
        (dayOfWeek > 4 ? ", weekend, unavailable" : "") +
        (isPast(value) ? ", past date, unavailable" : ""));
      if (holiday) button.title = holiday;
      button.disabled = !canSelectDate(value);
      button.appendChild(createElement("span", "calendar-day-number", String(day)));
      if (isToday) button.appendChild(createElement("span", "today-stamp", "now"));
      if (holiday) button.appendChild(createElement("span", "holiday-stamp", holiday));
      button.addEventListener("click", function () {
        selectedDate = this.dataset.date;
        selectedTime = "";
        persistSelection();
        renderCalendar();
        renderTimeline();
        renderSummary();
      });
      calendarGrid.appendChild(button);
    }

    for (var trailing = offset + dayCount; trailing < 42; trailing += 1) {
      var trailingEmpty = createElement("span", "calendar-empty");
      trailingEmpty.setAttribute("aria-hidden", "true");
      calendarGrid.appendChild(trailingEmpty);
    }

    renderNotice();
    renderHolidayList();
    renderMonthSummary();
    loadHolidays(visibleMonth.year);
    if (focusDate) {
      var focusTarget = calendarGrid.querySelector('[data-date="' + focusDate + '"]');
      if (focusTarget && !focusTarget.disabled) focusTarget.focus();
      else calendarGrid.focus();
    }
    if (previousButton) {
      previousButton.disabled = visibleMonth.year === currentManila.year && visibleMonth.month === currentManila.month;
    }
    if (nextButton) {
      nextButton.disabled = visibleMonth.year === lastMonth.year && visibleMonth.month === lastMonth.month;
    }
  }

  function moveCalendarFocus(value, step) {
    var initial = parseDate(value);
    if (!initial) return;
    var date = new Date(Date.UTC(initial.year, initial.month - 1, initial.day));
    for (var attempts = 0; attempts < 42; attempts += 1) {
      date.setUTCDate(date.getUTCDate() + step);
      var candidate = dateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
      if (!isWithinBookingRange(candidate)) return;
      var candidateMonth = { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
      var monthChanged = candidateMonth.year !== visibleMonth.year || candidateMonth.month !== visibleMonth.month;
      if (monthChanged) visibleMonth = candidateMonth;
      if (monthChanged) renderCalendar(candidate);
      var button = calendarGrid.querySelector('[data-date="' + candidate + '"]');
      if (button && !button.disabled) {
        button.focus();
        return;
      }
      if (monthChanged) renderCalendar();
    }
  }

  function changeMonth(amount, focusDay) {
    var next = addMonths(visibleMonth, amount);
    if (next.year < currentManila.year ||
        (next.year === currentManila.year && next.month < currentManila.month) ||
        next.year > lastMonth.year ||
        (next.year === lastMonth.year && next.month > lastMonth.month)) return;
    visibleMonth = next;
    clearSelection();
    var dayCount = new Date(Date.UTC(next.year, next.month, 0)).getUTCDate();
    var focusDate = dateKey(next.year, next.month, Math.min(focusDay || 1, dayCount));
    renderCalendar(focusDate);
    renderTimeline();
    renderSummary();
  }

  if (calendarGrid) {
    calendarGrid.addEventListener("keydown", function (event) {
      var target = event.target;
      if (!target || !target.classList.contains("calendar-day")) return;
      var value = target.dataset.date;
      var parsed = parseDate(value);
      if (!parsed) return;
      var steps = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -7,
        ArrowDown: 7,
      };
      if (Object.prototype.hasOwnProperty.call(steps, event.key)) {
        event.preventDefault();
        moveCalendarFocus(value, steps[event.key]);
      } else if (event.key === "PageUp" || event.key === "PageDown") {
        event.preventDefault();
        changeMonth(event.key === "PageUp" ? -1 : 1, parsed.day);
      }
    });
  }

  function loadHolidays(year) {
    if (holidayLoads[year] === "ready" || holidayLoads[year] === "failed") return Promise.resolve();
    if (holidayPromises[year]) return holidayPromises[year];
    holidayLoads[year] = "loading";
    holidayPromises[year] = availability.loadHolidays(year)
      .then(function (result) {
        holidayMaps[year] = result.map;
        holidayLoads[year] = result.status;
      })
      .then(function () {
        if (selectedDate && (!canSelectDate(selectedDate) ||
            (selectedTime && isSlotPast(selectedDate, getSlotHour(selectedTime))))) {
          clearSelection();
          persistSelection();
        }
        if (visibleMonth.year === year) renderCalendar();
        renderTimeline();
        renderSummary();
      });
    return holidayPromises[year];
  }

  function clearSelection() {
    selectedTime = "";
    selectedDate = "";
    persistSelection();
  }

  function getSlotHour(label) {
    var slot = slotDefinitions.find(function (item) { return item.label === label; });
    return slot ? slot.start : -1;
  }

  function timeHasPassed(hour) {
    return isSlotPast(selectedDate, hour);
  }

  function renderTimeline() {
    if (!timelineArea || !timeLine || !timelineDate) return;
    var hasDate = Boolean(selectedDate);
    timelineArea.classList.toggle("is-idle", !hasDate);
    if (timelinePrompt) {
      timelinePrompt.hidden = hasDate;
      if (!hasDate && timelinePrompt.dataset.noAvailability !== "true") {
        timelinePrompt.textContent = "Pick a day to see open times.";
      }
    }
    timelineDate.hidden = !hasDate;
    timeLine.replaceChildren();
    if (!hasDate) return;
    if (timelinePrompt) timelinePrompt.dataset.noAvailability = "false";
    timelineDate.textContent = formatDate(selectedDate);

    var visibleCount = 0;
    slotDefinitions.forEach(function (slot) {
      if (slot.start === 13) {
        timeLine.appendChild(createElement("div", "lunch-break", "12:00–1:00 PM · lunch break"));
      }
      if (timeHasPassed(slot.start)) return;
      visibleCount += 1;
      var end = slot.start + 1;
      var range = slot.label + " – " + (end === 12 ? "12:00 PM" : end < 12 ? end + ":00 AM" : end === 13 ? "1:00 PM" : end - 12 + ":00 PM");
      var button = createElement("button", "time-slot" + (selectedTime === slot.label ? " is-selected" : ""), range);
      button.type = "button";
      button.dataset.time = slot.label;
      button.setAttribute("aria-pressed", String(selectedTime === slot.label));
      button.addEventListener("click", function () {
        selectedTime = this.dataset.time;
        persistSelection();
        renderTimeline();
        var selectedButton = timeLine.querySelector('[data-time="' + selectedTime + '"]');
        if (selectedButton) selectedButton.focus();
        renderSummary();
      });
      timeLine.appendChild(button);
    });
    if (!visibleCount) timeLine.appendChild(createElement("p", "no-times", "No start times remain today. Choose another date."));
  }

  function renderSummary() {
    if (!summary || !continueButton) return;
    var complete = Boolean(selectedDate && selectedTime);
    summary.replaceChildren(document.createTextNode(complete
      ? "Your call: " + formatDate(selectedDate) + " at " + selectedTime + " Philippine time"
      : "Choose a date and time to continue."));
    if (complete && localTimeZone && localTimeZone !== "Asia/Manila") {
      var hour = getSlotHour(selectedTime);
      var localDate = new Date(Date.UTC(
        Number(selectedDate.slice(0, 4)),
        Number(selectedDate.slice(5, 7)) - 1,
        Number(selectedDate.slice(8, 10)),
        hour - 8
      ));
      var localTime = new Intl.DateTimeFormat(undefined, {
        timeZone: localTimeZone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(localDate);
      summary.appendChild(document.createTextNode(" (" + localTime + " your time)"));
    }
    continueButton.disabled = !complete;
  }

  async function findNextAvailableTime() {
    var value = dateKey(currentManila.year, currentManila.month, currentManila.day);
    var loadedYear = -1;
    while (isWithinBookingRange(value)) {
      var date = parseDate(value);
      if (date.year !== loadedYear) {
        await loadHolidays(date.year);
        loadedYear = date.year;
      }
      if (canSelectDate(value)) {
        var availableSlot = slotDefinitions.find(function (slot) {
          return !isSlotPast(value, slot.start);
        });
        if (availableSlot) {
          visibleMonth = { year: date.year, month: date.month };
          selectedDate = value;
          selectedTime = availableSlot.label;
          if (timelinePrompt) timelinePrompt.dataset.noAvailability = "false";
          persistSelection();
          renderCalendar(value);
          renderTimeline();
          renderSummary();
          var dayButton = calendarGrid.querySelector('[data-date="' + value + '"]');
          if (dayButton) dayButton.focus();
          return true;
        }
      }
      var nextDate = new Date(Date.UTC(date.year, date.month - 1, date.day + 1));
      value = dateKey(nextDate.getUTCFullYear(), nextDate.getUTCMonth() + 1, nextDate.getUTCDate());
    }
    if (timelinePrompt) {
      timelinePrompt.textContent = "No open times were found in the next six months.";
      timelinePrompt.dataset.noAvailability = "true";
      timelinePrompt.hidden = false;
    }
    timelineArea.classList.add("is-idle");
    return false;
  }

  function updateClock() {
    currentManila = readManilaTime();
    if (clock) {
      clock.textContent = new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(new Date()) + " (Philippine time)";
    }
    var currentDate = dateKey(currentManila.year, currentManila.month, currentManila.day);
    var currentMinute = currentDate + " " + String(currentManila.hour).padStart(2, "0") + ":" + String(currentManila.minute).padStart(2, "0");
    var dayChanged = lastClockDate !== "" && lastClockDate !== currentDate;
    var minuteChanged = lastClockMinute !== "" && lastClockMinute !== currentMinute;
    var currentMonth = { year: currentManila.year, month: currentManila.month };
    if (dayChanged && (visibleMonth.year !== currentMonth.year || visibleMonth.month !== currentMonth.month)) {
      lastMonth = addMonths(currentMonth, 6);
      visibleMonth = currentMonth;
      if (selectedDate && isPast(selectedDate)) clearSelection();
      loadHolidays(visibleMonth.year);
      renderCalendar();
      renderTimeline();
      renderSummary();
    } else if (dayChanged || minuteChanged) {
      if (selectedDate && !canSelectDate(selectedDate)) clearSelection();
      if (selectedTime) {
        var selectedSlot = slotDefinitions.find(function (slot) { return slot.label === selectedTime; });
        if (!selectedSlot || timeHasPassed(selectedSlot.start)) {
          selectedTime = "";
          persistSelection();
        }
      }
      renderCalendar();
      renderTimeline();
      renderSummary();
    }
    lastClockDate = currentDate;
    lastClockMinute = currentMinute;
  }

  function continueToContact() {
    if (!selectedDate || !selectedTime) return;
    var target = "contact.html#book-a-call";
    try {
      sessionStorage.removeItem("anthrix-call-date");
      sessionStorage.removeItem("anthrix-call-time");
      sessionStorage.setItem("anthrix-call-date", selectedDate);
      sessionStorage.setItem("anthrix-call-time", selectedTime);
    } catch (error) {
      var query = new URLSearchParams({ call_date: selectedDate, call_time: selectedTime });
      target = "contact.html?" + query.toString() + "#book-a-call";
    }
    window.location.href = target;
  }

  function restoreSelection() {
    var savedDate = "";
    var savedTime = "";
    try {
      savedDate = sessionStorage.getItem("anthrix-call-date") || "";
      savedTime = sessionStorage.getItem("anthrix-call-time") || "";
    } catch (error) {
      console.warn("Could not read the saved call selection.", error);
    }
    if (!savedDate || !isWithinBookingRange(savedDate) || !canSelectDate(savedDate)) {
      if (savedDate || savedTime) clearSelection();
      return;
    }
    selectedDate = savedDate;
    selectedTime = slotDefinitions.some(function (slot) { return slot.label === savedTime; }) &&
      !isSlotPast(savedDate, getSlotHour(savedTime)) ? savedTime : "";
    var date = parseDate(savedDate);
    visibleMonth = { year: date.year, month: date.month };
  }

  function renderGuideStep(index, focusTitle) {
    if (!guideBackdrop || !guideStepTitle || !guideProgress || !guideProgressBottom ||
        !guideScreenshot || !guideScreenshotFallback || !guideHighlightLayer || !guideDescriptions) return;
    guideStepIndex = Math.max(0, Math.min(index, STEPS.length - 1));
    var step = STEPS[guideStepIndex];
    guideStepTitle.textContent = step.title;
    guideProgress.textContent = "Step " + (guideStepIndex + 1) + " of " + STEPS.length;
    guideProgressBottom.textContent = guideProgress.textContent;
    guideScreenshot.alt = step.alt;
    guideScreenshot.hidden = false;
    guideScreenshotFallback.hidden = true;
    guideHighlightLayer.hidden = false;
    if (guideScreenshot.getAttribute("src") !== step.image) guideScreenshot.src = step.image;
    if (guideScreenshot.complete && !guideScreenshot.naturalWidth) {
      guideScreenshot.hidden = true;
      guideHighlightLayer.hidden = true;
      guideScreenshotFallback.hidden = false;
    }
    guideHighlightLayer.replaceChildren();
    guideDescriptions.replaceChildren();
    step.highlights.forEach(function (highlight) {
      var box = createElement("div", "guide-highlight", "");
      box.style.left = highlight.x + "%";
      box.style.top = highlight.y + "%";
      box.style.width = highlight.width + "%";
      box.style.height = highlight.height + "%";
      var callout = createElement("span", "guide-callout", String(highlight.number));
      box.appendChild(callout);
      guideHighlightLayer.appendChild(box);
      if (highlight.arrow) {
        var arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        arrow.setAttribute("class", "guide-arrow");
        arrow.setAttribute("viewBox", "0 0 100 100");
        arrow.setAttribute("aria-hidden", "true");
        arrow.style.left = highlight.arrow.x + "%";
        arrow.style.top = highlight.arrow.y + "%";
        arrow.style.transform = "translate(-50%, -50%) rotate(" + highlight.arrow.angle + "deg)";
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", "12");
        line.setAttribute("y1", "50");
        line.setAttribute("x2", "80");
        line.setAttribute("y2", "50");
        var arrowHead = document.createElementNS("http://www.w3.org/2000/svg", "path");
        arrowHead.setAttribute("d", "M64 34 L82 50 L64 66");
        arrow.appendChild(line);
        arrow.appendChild(arrowHead);
        guideHighlightLayer.appendChild(arrow);
      }
    });
    step.descriptions.forEach(function (description) {
      var item = createElement("li", "", "");
      var number = createElement("span", "guide-description-number", String(description.number));
      var text = createElement("p", "", description.text);
      item.appendChild(number);
      item.appendChild(text);
      guideDescriptions.appendChild(item);
    });
    if (guideBackButton) guideBackButton.disabled = guideStepIndex === 0;
    if (guideNextButton) {
      guideNextButton.textContent = guideStepIndex === STEPS.length - 1 ? "Done" : "Next";
    }
    if (guideDots) {
      Array.prototype.forEach.call(guideDots.children, function (dot, dotIndex) {
        dot.classList.toggle("is-current", dotIndex === guideStepIndex);
        if (dotIndex === guideStepIndex) dot.setAttribute("aria-current", "step");
        else dot.removeAttribute("aria-current");
      });
    }
    if (focusTitle) guideStepTitle.focus();
  }

  function openGuide() {
    if (!guideBackdrop || !guideDialog || !openGuideButton) return;
    guidePreviousFocus = document.activeElement;
    guideBackdrop.hidden = false;
    document.documentElement.classList.add("guide-open");
    renderGuideStep(0, false);
    if (closeGuideButton) closeGuideButton.focus();
    else guideDialog.focus();
  }

  function closeGuide() {
    if (!guideBackdrop || guideBackdrop.hidden) return;
    guideBackdrop.hidden = true;
    document.documentElement.classList.remove("guide-open");
    if (guidePreviousFocus && typeof guidePreviousFocus.focus === "function") {
      guidePreviousFocus.focus();
    } else if (openGuideButton) {
      openGuideButton.focus();
    }
  }

  function setupGuide() {
    if (!guideBackdrop || !guideDialog || !openGuideButton || !guideStepTitle ||
        !guideProgress || !guideProgressBottom || !guideDots || !guideBackButton ||
        !guideNextButton || !closeGuideButton || !guideScreenshot || !guideScreenshotFallback ||
        !guideHighlightLayer || !guideDescriptions) return;
    STEPS.forEach(function (step, index) {
      var dot = createElement("button", "guide-dot", "");
      dot.type = "button";
      dot.setAttribute("aria-label", "Go to step " + (index + 1) + ": " + step.title);
      dot.addEventListener("click", function () {
        renderGuideStep(index, true);
      });
      guideDots.appendChild(dot);
    });
    guideScreenshot.addEventListener("error", function () {
      guideScreenshot.hidden = true;
      guideHighlightLayer.hidden = true;
      guideScreenshotFallback.hidden = false;
    });
    guideScreenshot.addEventListener("load", function () {
      guideScreenshot.hidden = false;
      guideHighlightLayer.hidden = false;
      guideScreenshotFallback.hidden = true;
    });
    openGuideButton.addEventListener("click", openGuide);
    closeGuideButton.addEventListener("click", closeGuide);
    guideBackdrop.addEventListener("click", function (event) {
      if (event.target === guideBackdrop) closeGuide();
    });
    guideBackButton.addEventListener("click", function () {
      renderGuideStep(guideStepIndex - 1, true);
    });
    guideNextButton.addEventListener("click", function () {
      if (guideStepIndex === STEPS.length - 1) {
        closeGuide();
        return;
      }
      renderGuideStep(guideStepIndex + 1, true);
    });
    guideDialog.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeGuide();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        renderGuideStep(guideStepIndex + (event.key === "ArrowRight" ? 1 : -1), false);
        return;
      }
      if (event.key !== "Tab") return;
      var focusable = Array.prototype.filter.call(
        guideDialog.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
        function (element) {
          return !element.closest("[hidden]");
        }
      );
      if (!focusable.length) {
        event.preventDefault();
        guideDialog.focus();
        return;
      }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (!guideDialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    renderGuideStep(0, false);
  }

  if (todayButton) {
    todayButton.addEventListener("click", function () {
      visibleMonth = { year: currentManila.year, month: currentManila.month };
      clearSelection();
      renderCalendar(dateKey(currentManila.year, currentManila.month, currentManila.day));
      renderTimeline();
      renderSummary();
    });
  }

  if (previousButton) {
    previousButton.addEventListener("click", function () {
      changeMonth(-1, 1);
    });
  }
  if (nextButton) {
    nextButton.addEventListener("click", function () {
      changeMonth(1, 1);
    });
  }
  if (nextAvailableButton) {
    nextAvailableButton.addEventListener("click", function () {
      nextAvailableButton.disabled = true;
      findNextAvailableTime().finally(function () {
        nextAvailableButton.disabled = false;
      });
    });
  }
  if (continueButton) continueButton.addEventListener("click", continueToContact);

  setupGuide();
  restoreSelection();
  loadHolidays(visibleMonth.year);
  renderCalendar();
  renderTimeline();
  renderSummary();
  updateClock();
  timer = window.setInterval(updateClock, 1000);
  window.addEventListener("pagehide", function () {
    if (timer) window.clearInterval(timer);
  });
})();
