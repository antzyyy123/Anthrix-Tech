(function () {
  "use strict";

  var fixedHolidays = [
    ["01-01", "New Year's Day"],
    ["04-09", "Araw ng Kagitingan"],
    ["05-01", "Labor Day"],
    ["06-12", "Independence Day"],
    ["08-21", "Ninoy Aquino Day"],
    ["11-01", "All Saints' Day"],
    ["11-30", "Bonifacio Day"],
    ["12-08", "Feast of the Immaculate Conception"],
    ["12-24", "Christmas Eve"],
    ["12-25", "Christmas Day"],
    ["12-30", "Rizal Day"],
    ["12-31", "Last Day of the Year"],
  ];
  var slotDefinitions = [
    { start: 9, label: "9:00 AM" },
    { start: 10, label: "10:00 AM" },
    { start: 11, label: "11:00 AM" },
    { start: 13, label: "1:00 PM" },
    { start: 14, label: "2:00 PM" },
    { start: 15, label: "3:00 PM" },
    { start: 16, label: "4:00 PM" },
  ];
  var holidayMaps = Object.create(null);
  var holidayStatuses = Object.create(null);
  var holidayPromises = Object.create(null);

  function readManilaTime(value) {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(value || new Date());
    var result = {};
    parts.forEach(function (part) {
      if (part.type !== "literal") result[part.type] = Number(part.value);
    });
    return result;
  }

  function dateKey(year, month, day) {
    return String(year).padStart(4, "0") + "-" +
      String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
  }

  function parseDate(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!match) return null;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var check = new Date(Date.UTC(year, month - 1, day));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() + 1 !== month || check.getUTCDate() !== day) return null;
    return { year: year, month: month, day: day };
  }

  function weekday(value) {
    var date = parseDate(value);
    return date ? (new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay() + 6) % 7 : -1;
  }

  function fixedHolidayMap(year) {
    var holidays = Object.create(null);
    fixedHolidays.forEach(function (holiday) {
      holidays[year + "-" + holiday[0]] = holiday[1];
    });
    return holidays;
  }

  function formatDate(value, options) {
    var date = parseDate(value);
    if (!date) return "";
    var dateOptions = Object.assign({
      timeZone: "UTC",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }, options || {});
    Object.keys(dateOptions).forEach(function (key) {
      if (dateOptions[key] === undefined) delete dateOptions[key];
    });
    return new Intl.DateTimeFormat("en-PH", dateOptions)
      .format(new Date(Date.UTC(date.year, date.month - 1, date.day, 12)));
  }

  function holidayMap(year) {
    return holidayMaps[year] || fixedHolidayMap(year);
  }

  function holidayName(value, maps) {
    var date = parseDate(value);
    if (!date) return "";
    var map = maps && maps[date.year] ? maps[date.year] : holidayMap(date.year);
    return map[value] || "";
  }

  function isPast(value, currentManila) {
    return value < dateKey(currentManila.year, currentManila.month, currentManila.day);
  }

  function canSelectDate(value, currentManila, maps) {
    var day = weekday(value);
    return day >= 0 && day < 5 && !isPast(value, currentManila) && !holidayName(value, maps);
  }

  function isSlotPast(value, hour, currentManila) {
    if (value !== dateKey(currentManila.year, currentManila.month, currentManila.day)) return false;
    return hour * 60 <= currentManila.hour * 60 + currentManila.minute;
  }

  function loadHolidays(year) {
    if (holidayStatuses[year] === "ready" || holidayStatuses[year] === "failed") {
      return Promise.resolve({ map: holidayMaps[year], status: holidayStatuses[year] });
    }
    if (holidayPromises[year]) return holidayPromises[year];
    holidayStatuses[year] = "loading";
    var request;
    try {
      request = fetch("https://date.nager.at/api/v3/PublicHolidays/" + year + "/PH");
    } catch (error) {
      request = Promise.reject(error);
    }
    holidayPromises[year] = Promise.resolve(request)
      .then(function (response) {
        if (!response.ok) throw new Error("Holiday service returned " + response.status);
        return response.json();
      })
      .then(function (items) {
        if (!Array.isArray(items)) throw new Error("Holiday service returned an unexpected response");
        var holidays = Object.create(null);
        items.forEach(function (item) {
          if (!item || typeof item.date !== "string" || !parseDate(item.date)) return;
          if (Number(item.date.slice(0, 4)) !== year) return;
          if (typeof item.localName !== "string" && typeof item.name !== "string") return;
          holidays[item.date] = item.localName || item.name;
        });
        holidayMaps[year] = holidays;
        holidayStatuses[year] = "ready";
      })
      .catch(function () {
        holidayMaps[year] = fixedHolidayMap(year);
        holidayStatuses[year] = "failed";
      })
      .then(function () {
        return { map: holidayMaps[year], status: holidayStatuses[year] };
      });
    return holidayPromises[year];
  }

  function findNextSlot(value) {
    var currentManila = readManilaTime(value);
    var current = dateKey(currentManila.year, currentManila.month, currentManila.day);
    var end = new Date(Date.UTC(currentManila.year, currentManila.month - 1 + 6, 1));
    var lastMonth = { year: end.getUTCFullYear(), month: end.getUTCMonth() + 1 };
    var loadedYear = -1;

    function inRange(dateValue) {
      var date = parseDate(dateValue);
      return date && (date.year > currentManila.year ||
        (date.year === currentManila.year && date.month >= currentManila.month)) &&
        (date.year < lastMonth.year ||
        (date.year === lastMonth.year && date.month <= lastMonth.month));
    }

    function search(dateValue) {
      if (!inRange(dateValue)) return Promise.resolve(null);
      var date = parseDate(dateValue);
      var nextLoad = Promise.resolve();
      if (date.year !== loadedYear) {
        loadedYear = date.year;
        nextLoad = loadHolidays(date.year).then(function (result) {
          if (result.status === "failed") throw new Error("Holiday fallback is active");
        });
      }
      return nextLoad.then(function () {
        if (canSelectDate(dateValue, currentManila) ) {
          var slot = slotDefinitions.find(function (item) {
            return !isSlotPast(dateValue, item.start, currentManila);
          });
          if (slot) return { date: dateValue, time: slot.label, hour: slot.start };
        }
        var next = new Date(Date.UTC(date.year, date.month - 1, date.day + 1));
        return search(dateKey(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()));
      });
    }

    return search(current).catch(function () {
      return null;
    });
  }

  window.AnthrixAvailability = {
    slotDefinitions: slotDefinitions,
    readManilaTime: readManilaTime,
    dateKey: dateKey,
    parseDate: parseDate,
    weekday: weekday,
    fixedHolidayMap: fixedHolidayMap,
    formatDate: formatDate,
    holidayMap: holidayMap,
    holidayName: holidayName,
    isPast: isPast,
    canSelectDate: canSelectDate,
    isSlotPast: isSlotPast,
    loadHolidays: loadHolidays,
    findNextSlot: findNextSlot,
  };
})();
