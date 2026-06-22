const csrftoken = document.querySelector(
    'meta[name="csrf-token"]'
).getAttribute('content');

$(document).ready(function () {
  // 1 variable with multiple theme colors
  const themeColors = {
    customers: "vivid-orange",
    Advertiser: "living-coral",
    NGO: "violet-sky",
    pharmacy: "light-sea-green",
    client: "dark-blue",
  };

  // Get the current path
  const path = window.location.pathname;

  // Default color
  let selectedColor = "#F79E1B";
  let bgColor;

  // Loop and match theme by keyword in path
  $.each(themeColors, function (keyword, color) {
    if (path.includes(keyword)) {
      selectedColor = color;
      bgColor =
        selectedColor == "vivid-orange"
          ? "#F79E1B"
          : selectedColor == "living-coral"
          ? "#FF6F61"
          : selectedColor == "light-sea-green"
          ? "#3AAFA9"
          : selectedColor == "dark-blue"
          ? "#123456"
          : "#6B79F5";
      return false;
    }
  });

  $(".bookmark-fill").click(function () {
    $(this).addClass(`material-filled text-${selectedColor}`);
  });
  document.documentElement.style.setProperty("--radio-border-color", bgColor);
  document.documentElement.style.setProperty("--radio-fill-color", bgColor);
  // Common chart options function
  function getChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          yAlign: "bottom",
          backgroundColor: "#3AAFA9",
          displayColors: true,
          callbacks: {
            title: () => "",
            label: function (tooltipItem) {
              return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
            },
          },
        },
      },
      scales: {
        x: { title: { display: false } },
        yLeft: {
          type: "linear",
          position: "left",
          beginAtZero: true,
          min: 0,
          max: 800,
          ticks: { stepSize: 200 },
        },
        yRight: {
          type: "linear",
          position: "right",
          beginAtZero: true,
          min: 0,
          max: 800,
          ticks: { display: false },
          grid: { drawOnChartArea: false },
        },
      },
    };
  }

  // Initialize chart helper
  function initChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      return new Chart(canvas.getContext("2d"), config);
    }
    return null;
  }

  //  Pharmacy Home Page Chart
  const pharmacyChart = initChart("pharmacyChart", {
    type: "line",
    data: {
      labels: ["0", "1", "2", "3", "4", "5", "6", "7"],
      datasets: [
        {
          label: "Total Revenue",
          data: [600, 400, 590, 650, 800, 400, 160, 570],
          borderColor: "#5182E3",
          borderWidth: 2,
          tension: 0,
          yAxisID: "yLeft",
          pointRadius: 3,
          pointBackgroundColor: "#FFFFFF",
          pointBorderColor: "#5182E3",
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#FFFFFF",
          pointHoverBorderColor: "#5182E3",
        },
        {
          label: "Total Enquiries",
          data: [600, 700, 300, 250, 200, 600, 180, 700],
          borderColor: "#FFA500",
          borderWidth: 2,
          tension: 0,
          yAxisID: "yRight",
          pointRadius: 3,
          pointBackgroundColor: "#FFFFFF",
          pointBorderColor: "#FFA500",
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#FFFFFF",
          pointHoverBorderColor: "#FFA500",
        },
        {
          label: "Points Earned",
          data: [0, 580, 170, 560, 410, 401, 70, 160],
          borderColor: "#3AAFA9",
          borderWidth: 2,
          tension: 0,
          yAxisID: "yRight",
          pointRadius: 3,
          pointBackgroundColor: "#FFFFFF",
          pointBorderColor: "#3AAFA9",
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#FFFFFF",
          pointHoverBorderColor: "#3AAFA9",
        },
      ],
    },
    options: getChartOptions(),
  });

  //End Customers Home Page Chart
  const customersChart = initChart("customersChart", {
    type: "line",
    data: {
      labels: ["0", "1", "2", "3", "4", "5", "6", "7"],
      datasets: [
        {
          label: "Bill Amount",
          data: [600, 400, 590, 650, 800, 400, 160, 570],
          borderColor: "#5182E3",
          borderWidth: 2,
          tension: 0,
          yAxisID: "yLeft",
          pointRadius: 3,
          pointBackgroundColor: "#FFFFFF",
          pointBorderColor: "#5182E3",
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#FFFFFF",
          pointHoverBorderColor: "#5182E3",
        },
        {
          label: "Purchases Amount",
          data: [600, 700, 300, 250, 200, 600, 180, 700],
          borderColor: "#F79E1B",
          borderWidth: 2,
          tension: 0,
          yAxisID: "yRight",
          pointRadius: 3,
          pointBackgroundColor: "#FFFFFF",
          pointBorderColor: "#F79E1B",
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#FFFFFF",
          pointHoverBorderColor: "#F79E1B",
        },
        {
          label: "Points Earned",
          data: [0, 580, 170, 560, 410, 401, 70, 160],
          borderColor: "#3AAFA9",
          borderWidth: 2,
          tension: 0,
          yAxisID: "yRight",
          pointRadius: 3,
          pointBackgroundColor: "#FFFFFF",
          pointBorderColor: "#3AAFA9",
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#FFFFFF",
          pointHoverBorderColor: "#3AAFA9",
        },
      ],
    },
    options: getChartOptions(),
  });

  // Register as Advertiser Home Page Chart
  // const advertiserChart = initChart("advertiserChart", {
  //   type: "line",
  //   data: {
  //     labels: ["0", "1", "2", "3", "4", "5", "6", "7"],
  //     datasets: [
  //       {
  //         label: "Total Coupons",
  //         data: [600, 400, 590, 650, 800, 400, 160, 570],
  //         borderColor: "#5182E3",
  //         borderWidth: 2,
  //         tension: 0,
  //         yAxisID: "yLeft",
  //         pointRadius: 3,
  //         pointBackgroundColor: "#FFFFFF",
  //         pointBorderColor: "#5182E3",
  //         pointHoverRadius: 5,
  //         pointHoverBackgroundColor: "#FFFFFF",
  //         pointHoverBorderColor: "#5182E3",
  //       },
  //       {
  //         label: "Total Redemptions",
  //         data: [600, 700, 300, 250, 200, 600, 180, 700],
  //         borderColor: "#FF6F61",
  //         borderWidth: 2,
  //         tension: 0,
  //         yAxisID: "yRight",
  //         pointRadius: 3,
  //         pointBackgroundColor: "#FFFFFF",
  //         pointBorderColor: "#FF6F61",
  //         pointHoverRadius: 5,
  //         pointHoverBackgroundColor: "#FFFFFF",
  //         pointHoverBorderColor: "#FF6F61",
  //       },
  //       {
  //         label: "Active Coupons",
  //         data: [0, 580, 170, 560, 410, 401, 70, 160],
  //         borderColor: "#3AAFA9",
  //         borderWidth: 2,
  //         tension: 0,
  //         yAxisID: "yRight",
  //         pointRadius: 3,
  //         pointBackgroundColor: "#FFFFFF",
  //         pointBorderColor: "#3AAFA9",
  //         pointHoverRadius: 5,
  //         pointHoverBackgroundColor: "#FFFFFF",
  //         pointHoverBorderColor: "#3AAFA9",
  //       },
  //     ],
  //   },
  //   options: getChartOptions(),
  // });

  //Register as NGO Owner Home Page Chart
  // const ngoChart = initChart("ngoChart", {
  //   type: "line",
  //   data: {
  //     labels: ["0", "1", "2", "3", "4", "5", "6", "7"],
  //     datasets: [
  //       {
  //         label: "Total Post",
  //         data: [600, 400, 590, 650, 800, 400, 160, 570],
  //         borderColor: "#6B79F5",
  //         borderWidth: 2,
  //         tension: 0,
  //         yAxisID: "yLeft",
  //         pointRadius: 3,
  //         pointBackgroundColor: "#FFFFFF",
  //         pointBorderColor: "#6B79F5",
  //         pointHoverRadius: 5,
  //         pointHoverBackgroundColor: "#FFFFFF",
  //         pointHoverBorderColor: "#6B79F5",
  //       },
  //       {
  //         label: "Total Views",
  //         data: [600, 700, 300, 250, 200, 600, 180, 700],
  //         borderColor: "#6B79F5",
  //         borderWidth: 2,
  //         tension: 0,
  //         yAxisID: "yRight",
  //         pointRadius: 3,
  //         pointBackgroundColor: "#FFFFFF",
  //         pointBorderColor: "#6B79F5",
  //         pointHoverRadius: 5,
  //         pointHoverBackgroundColor: "#FFFFFF",
  //         pointHoverBorderColor: "#6B79F5",
  //       },
  //       {
  //         label: "Target Donation",
  //         data: [0, 580, 170, 560, 410, 401, 70, 160],
  //         borderColor: "#6B79F5",
  //         borderWidth: 2,
  //         tension: 0,
  //         yAxisID: "yRight",
  //         pointRadius: 3,
  //         pointBackgroundColor: "#FFFFFF",
  //         pointBorderColor: "#6B79F5",
  //         pointHoverRadius: 5,
  //         pointHoverBackgroundColor: "#FFFFFF",
  //         pointHoverBorderColor: "#6B79F5",
  //       },
  //       {
  //         label: "Donation Received",
  //         data: [400, 500, 800, 290, 700, 200, 580, 300],
  //         borderColor: "#3AAFA9",
  //         borderWidth: 2,
  //         tension: 0,
  //         yAxisID: "yRight",
  //         pointRadius: 3,
  //         pointBackgroundColor: "#FFFFFF",
  //         pointBorderColor: "#3AAFA9",
  //         pointHoverRadius: 5,
  //         pointHoverBackgroundColor: "#FFFFFF",
  //         pointHoverBorderColor: "#3AAFA9",
  //       },
  //     ],
  //   },
  //   options: getChartOptions(),
  // });

  //Custom Legend Working Code
  const charts = [
    {
      chart: pharmacyChart,
      legendId: "#pharmacyCustomLegend",
      tabsId: "#pharmacytimeRangeTabs",
    },
    {
      chart: customersChart,
      legendId: "#endcustomersCustomLegend",
      tabsId: "#endcustomerstimeRangeTabs",
    },
    // {
    //   chart: advertiserChart,
    //   legendId: "#advertiserCustomLegend",
    //   tabsId: "#advertisertimeRangeTabs",
    // },
    // {
    //   chart: ngoChart,
    //   legendId: "#ngoCustomLegend",
    //   tabsId: "#ngotimeRangeTabs",
    // },
  ];
  charts.forEach(({ chart, legendId, tabsId }) => {
    $(`${legendId} .legend-checkbox`).on("change", function () {
      const datasetIndex = $(this).data("index");
      const visible = $(this).is(":checked");
      chart.setDatasetVisibility(datasetIndex, visible);
      chart.update();
    });

    // Time Range Tabs
    $("[data-active-class] p").click(function () {
      const $section = $(this).closest("[data-active-class]");
      const activeClass = $section.data("active-class");

      $section.find("p").removeClass(activeClass);
      $(this).addClass(activeClass);
    });
  });

  // Calendar [Pharmacy,Register as Advertiser,Register as NGO Owner Sections]
  $(".calendar-container").each(function () {
    const $root = $(this);
    const highlightColor = $root.data("color");

    const $label = $root.find("#monthYearLabel");
    const $dropdown = $root.find("#dropdownContent");
    const $calendarDays = $root.find("#calendarDays");
    const $prevBtn = $root.find("#prevMonth");
    const $nextBtn = $root.find("#nextMonth");
    const $dropdownToggle = $root.find("#monthYearDropdown");

    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    function updateMonthYearLabel() {
      $label.text(`${monthNames[currentMonth]} ${currentYear}`);
    }

    function generateMonthYearDropdown() {
      let options = "";
      for (let y = currentYear - 20; y <= currentYear + 10; y++) {
        for (let m = 0; m < 12; m++) {
          options += `<div class="px-3 py-2 hover:bg-gray-200 cursor-pointer" data-month="${m}" data-year="${y}">
          ${monthNames[m]} ${y}
        </div>`;
        }
      }
      $dropdown.html(options);
    }

    function getEventsForDate(dateStr) {
      // Use the global calendar events from backend instead of hardcoded data
      if (window.calendarEvents && window.calendarEvents[dateStr]) {
        return window.calendarEvents[dateStr];
      }
      return [];
    }

    function renderCalendar() {
      $calendarDays.empty();
      dayNames.forEach((day) => {
        $calendarDays.append(
          `<div class="font-semibold text-sm text-gray-700 mt-auto">${day}</div>`
        );
      });
      $calendarDays.append(
        `<div class="col-span-7"><hr class="border-t border-gray-300 my-2" /></div>`
      );

      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const startDay = firstDay === 0 ? 6 : firstDay - 1;
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      for (let i = 0; i < startDay; i++) {
        $calendarDays.append("<div></div>");
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const isToday =
          day === today.getDate() &&
          currentMonth === today.getMonth() &&
          currentYear === today.getFullYear();

        const baseClasses = `aspect-square w-full h-10 flex flex-col gap-1 pl-2  items-start rounded-lg text-sm font-medium border border-gray-300 cursor-pointer transition`;

        const dateClass = isToday
          ? `bg-${highlightColor} text-white`
          : `hover:bg-${highlightColor} hover:text-white`;

        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
          2,
          "0"
        )}-${String(day).padStart(2, "0")}`;
        const events = getEventsForDate(dateStr);
        let eventsHtml = "";

        // Show event indicators for each event with their individual colors
        events.forEach((event) => {
          const eventColor = event.color || `bg-${highlightColor}`;
          console.log('Event:', event.name, 'Color:', eventColor); // Debug log
          eventsHtml += `
          <div class="h-2 w-2 rounded-full ${eventColor}" style="background-color: ${getColorValue(eventColor)};"></div>          
        `;
        });

        $calendarDays.append(`
        <div class="${baseClasses} ${dateClass}" data-date="${dateStr}">
          ${day}
          ${eventsHtml}
        </div>
      `);
      }

      updateMonthYearLabel();
    }

    $root
      .find(".bg-light-sea-green")
      .removeClass("bg-light-sea-green")
      .addClass(`bg-${highlightColor}`);

    $calendarDays.on("click", "div[data-date]", function (e) {
      e.stopPropagation(); // Prevent document click from firing immediately

      // Remove any existing event display first
      $('.event-display').remove();

      const dateStr = $(this).data("date");
      const events = getEventsForDate(dateStr);

      if (events.length > 0) {
        // Position the popup relative to the clicked date cell
        let eventsHtml = '<div class="event-display absolute z-10 mt-2 p-2 bg-white border border-gray-300 rounded shadow-lg">';
        
        events.forEach(event => {
          eventsHtml += `<div class="text-sm text-gray-700 whitespace-nowrap">• ${event.name} at ${event.time}</div>`;
        });
        
        eventsHtml += '</div>';

        $(this).append(eventsHtml);
      }
    });

    $dropdownToggle.on("click", function (e) {
      e.stopPropagation();
      $dropdown.toggle();
    });

    $dropdown.on("click", "div", function () {
      currentMonth = +$(this).data("month");
      currentYear = +$(this).data("year");
      $dropdown.hide();
      renderCalendar();
    });

    $prevBtn.on("click", function () {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    });

    $nextBtn.on("click", function () {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
    });

    $(document).on("click", function (e) {
      if (
        !$dropdownToggle.is(e.target) &&
        $dropdownToggle.has(e.target).length === 0
      ) {
        $dropdown.hide();
      }

      // Close event display on outside click
      if (!$(e.target).closest('.event-display').length && !$(e.target).closest('div[data-date]').length) {
        $('.event-display').remove();
      }
    });

    generateMonthYearDropdown();
    renderCalendar();
  });

  //   //Enquirers Map on Pharmacy Home Page
  //   function initMap(){
  //   const map = L.map("map").setView([28.6139, 77.209], 10);
  //   L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  //     attribution:
  //       '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  //   }).addTo(map);
  //   if (navigator.geolocation) {
  //     navigator.geolocation.getCurrentPosition(
  //       function (position) {
  //         const lat = position.coords.latitude;
  //         const lng = position.coords.longitude;
  //         map.setView([lat, lng], 13);
  //         L.marker([lat, lng]).addTo(map).bindPopup("You are here").openPopup();
  //       },
  //       function () {
  //         toastr.error('Geolocation permission denied. Showing default location.');
  //       }
  //     );
  //   } else {
  //     toastr.error('Geolocation not supported by your browser.');
  //   }
  //   const enquirerData = [
  //     { lat: 18.5308, lng: 73.8476, count: 5 },
  //     { lat: 18.509, lng: 73.8077, count: 15 },
  //     { lat: 18.5913, lng: 73.7386, count: 25 },
  //     { lat: 18.5989, lng: 73.7705, count: 8 },
  //     { lat: 18.4966, lng: 73.9489, count: 20 },

  //     { lat: 19.1197, lng: 72.8468, count: 5 },
  //     { lat: 19.0184, lng: 72.8436, count: 15 },
  //     { lat: 19.2183, lng: 72.9781, count: 25 },
  //   ];
  //   enquirerData.forEach((data) => {
  //     const color = "#3AAFA9";
  //     L.circleMarker([data.lat, data.lng], {
  //       radius: data.count * 0.8,
  //       color: color,
  //       fillColor: color,
  //       fillOpacity: 0.5,
  //     }).addTo(map);
  //     L.marker([data.lat, data.lng], {
  //       icon: L.divIcon({
  //         className: "custom-label",
  //         html: `<div style="color: black; font-weight: bold; font-size: 12px; text-align:center;">${data.count}</div>`,
  //         iconSize: [20, 20],
  //         iconAnchor: [10, 10],
  //       }),
  //       interactive: false,
  //     }).addTo(map);
  //   });

  //   }
  //   if (document.getElementById("map")) {
  //   initMap();
  // }

  //Date and Location of User on  Home Page of All Sections
  const now = new Date();
  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  $("#date").text(`${formattedDate}`);
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const apiKey = "0ea1953645414eb789b5329c020bc214";
        const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`;

        $.get(apiUrl, function (data) {
          if (data.results.length > 0) {
            const components = data.results[0].components;
            const city =
              components.city ||
              components.town ||
              components.village ||
              "New Delhi";
            const state = components.state || "";
            const country = components.country || "";

            $("#location-text").text(` ${city},  ${country}`);
          } else {
            $("#location").text("Location not found.");
          }
        }).fail(function () {
          $("#location").text("Failed to fetch city name.");
        });
      },
      function () {
        // $("#location").text("Unable to retrieve location.");
        $("#location").text("");
      }
    );
  } else {
    $("#location").text("Geolocation is not supported.");
  }

  //End-customers Calendar
  function initCustomerCalendar() {
    let today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    function generateMonthYearDropdown() {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      let options = "";
      for (let y = currentYear - 50; y <= currentYear + 10; y++) {
        for (let m = 0; m < 12; m++) {
          options += `<div class="px-3 py-2 hover:bg-gray-200 cursor-pointer" data-month="${m}" data-year="${y}">
                    ${monthNames[m]} ${y}
                </div>`;
        }
      }
      $("#dropdownContent").html(options);
      updateMonthYearLabel();
    }

    function updateMonthYearLabel() {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      $("#monthYearLabel").text(`${monthNames[currentMonth]} ${currentYear}`);
    }

    function renderCalendar(month, year) {
      $("#calendarDays").empty();
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        const dateStr = `${year}-${month + 1}-${day}`;
        const isToday =
          day === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear();

        let classNames = `calendar-date cursor-pointer p-2 rounded-full font-semibold h-10 w-10 bg-lightest-gray 
          ${
            isToday
              ? "bg-vivid-orange text-white today"
              : "hover:bg-vivid-orange hover:text-white"
          }`;

        $("#calendarDays").append(`
            <div class="calendar-day flex flex-col items-center justify-center gap-1" data-date="${dateStr}">
              <div class="${classNames} day-circle">${day}</div>
              <div>${dayNames[dayOfWeek]}</div>
            </div>
            `);
        $(document).on("click", ".calendar-day", function () {
          $(".calendar-day .day-circle").removeClass(
            "bg-vivid-orange text-white"
          );
          $(this).find(".day-circle").addClass("bg-vivid-orange text-white");
        });
      }

      updateMonthYearLabel();
    }

    $("#monthYearDropdown").click(() => $("#dropdownContent").toggle());

    $(document).on("click", "#dropdownContent div", function () {
      currentMonth = $(this).data("month");
      currentYear = $(this).data("year");
      $("#dropdownContent").hide();
      renderCalendar(currentMonth, currentYear);
    });

    $(document).click(function (e) {
      if (!$(e.target).closest("#monthYearDropdown").length) {
        $("#dropdownContent").hide();
      }
    });

    generateMonthYearDropdown();
    renderCalendar(currentMonth, currentYear);
  }
  if (document.getElementById("customer-calendar")) {
    initCustomerCalendar();
  }

  //Client company dashboard calendar
  function initClientCalendar() {
    $(".client-calendar-container").each(function () {
      const $root = $(this);
      const highlightColor = $root.data("color");

      const $label = $root.find("#monthYearLabel");
      const $dropdown = $root.find("#dropdownContent");
      const $calendarDays = $root.find("#calendarDays");
      const $prevBtn = $root.find("#prevMonth");
      const $nextBtn = $root.find("#nextMonth");
      const $dropdownToggle = $root.find("#monthYearDropdown");

      const today = new Date();
      let currentMonth = today.getMonth();
      let currentYear = today.getFullYear();

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

      // Example event data
      const calendarEvents = [
        { date: "2025-06-01", text: "PF Deposit", color: "bg-slate-blue" },
        { date: "2025-06-15", text: "ESI", color: "bg-green" },
        { date: "2025-06-21", text: "GST", color: "bg-strong-red" },
        { date: "2025-06-29", text: "INCOME TAX", color: "bg-vivid-orange" },
        { date: "2025-06-06", text: "PF Deposit", color: "bg-slate-blue" },
        { date: "2025-06-12", text: "ESI", color: "bg-green" },
        { date: "2025-06-27", text: "GST", color: "bg-strong-red" },
        { date: "2025-06-31", text: "INCOME TAX", color: "bg-vivid-orange" },
        { date: "2025-06-03", text: "PF Deposit", color: "bg-slate-blue" },
        { date: "2025-06-05", text: "ESI", color: "bg-green" },
        { date: "2025-06-09", text: "GST", color: "bg-strong-red" },
        { date: "2025-06-23", text: "INCOME TAX", color: "bg-vivid-orange" },
      ];

      function updateMonthYearLabel() {
        $label.text(`${monthNames[currentMonth]} ${currentYear}`);
      }

      function generateMonthYearDropdown() {
        let options = "";
        for (let y = currentYear - 20; y <= currentYear + 10; y++) {
          for (let m = 0; m < 12; m++) {
            options += `<div class="px-3 py-2 hover:bg-gray-200 cursor-pointer" data-month="${m}" data-year="${y}">
          ${monthNames[m]} ${y}
        </div>`;
          }
        }
        $dropdown.html(options);
      }

      function getEventsForDate(dateStr) {
        return calendarEvents.filter((event) => event.date === dateStr);
      }

      function renderCalendar() {
        $calendarDays.empty();
        dayNames.forEach((day) => {
          $calendarDays.append(
            `<div class="font-semibold text-sm text-gray-700">${day}</div>`
          );
        });
        $calendarDays.append(
          `<div class="col-span-7"><hr class="border-t border-gray-300 my-2" /></div>`
        );

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const startDay = firstDay === 0 ? 6 : firstDay - 1;
        const daysInMonth = new Date(
          currentYear,
          currentMonth + 1,
          0
        ).getDate();

        for (let i = 0; i < startDay; i++) {
          $calendarDays.append("<div></div>");
        }

        for (let day = 1; day <= daysInMonth; day++) {
          const isToday =
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();

          const baseClasses = `aspect-square w-full h-10 flex flex-col gap-1 pl-0.5 items-start rounded-lg text-sm font-medium border border-gray-300 cursor-pointer transition`;

          const dateClass = isToday
            ? `bg-${highlightColor} text-white`
            : `hover:bg-${highlightColor} hover:text-white`;

          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
            2,
            "0"
          )}-${String(day).padStart(2, "0")}`;
          const events = getEventsForDate(dateStr);
          let eventsHtml = "";

          events.forEach((event) => {
            eventsHtml += `
          <div class="flex items-center gap-1">
            <div class="h-2 w-2 rounded-full ${event.color}"></div>
            <span class="text-[8px] text-left">${event.text}</span>
          </div>
        `;
          });

          $calendarDays.append(`
        <div class="${baseClasses} ${dateClass}" data-date="${dateStr}">
          ${day}
          ${eventsHtml}
        </div>
      `);
        }

        updateMonthYearLabel();
      }

      $root
        .find(".bg-light-sea-green")
        .removeClass("bg-light-sea-green")
        .addClass(`bg-${highlightColor}`);

      $dropdownToggle.on("click", function (e) {
        e.stopPropagation();
        $dropdown.toggle();
      });

      $dropdown.on("click", "div", function () {
        currentMonth = +$(this).data("month");
        currentYear = +$(this).data("year");
        $dropdown.hide();
        renderCalendar();
      });

      $prevBtn.on("click", function () {
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        renderCalendar();
      });

      $nextBtn.on("click", function () {
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        renderCalendar();
      });

      $(document).on("click", function (e) {
        if (
          !$dropdownToggle.is(e.target) &&
          $dropdownToggle.has(e.target).length === 0
        ) {
          $dropdown.hide();
        }
      });

      generateMonthYearDropdown();
      renderCalendar();
    });
  }
  if (document.getElementById("client-calendar")) {
    initClientCalendar();
  }

  //Select Patient Dropdown on End Customers Home Page
  $(".dropdown-btn").on("click", function () {
    $(this).siblings(".dropdown-option").toggleClass("hidden");
  });
  $(".dropdown-option .option-item").on("click", function () {
    const selectedOption = $(this).text();
    $(this)
      .closest(".dropdown")
      .find(".dropdown-btn span.block")
      .text(selectedOption);
    $(this).closest(".dropdown-option").addClass("hidden");
  });
  $(document).on("click", function (e) {
    if (!$(e.target).closest(".dropdown").length) {
      $(".dropdown-option").addClass("hidden");
    }
  });

  $(".add-event-btn").on("click", function () {
    $(".event-calendar").removeClass("hidden");
  });

  function initEventCalendar() {
    $(".event-calendar-container").each(function () {
      const $root = $(this);
      const highlightColor = $root.data("color");

      const $label = $root.find("#monthYearLabel");
      const $dropdown = $root.find("#dropdownContent");
      const $calendarDays = $root.find("#calendarDays");
      const $prevBtn = $root.find("#prevMonth");
      const $nextBtn = $root.find("#nextMonth");
      const $dropdownToggle = $root.find("#monthYearDropdown");

      const today = new Date();
      let currentMonth = today.getMonth();
      let currentYear = today.getFullYear();

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

      // Example event data

      function updateMonthYearLabel() {
        $label.text(`${monthNames[currentMonth]} ${currentYear}`);
      }

      function generateMonthYearDropdown() {
        let options = "";
        for (let y = currentYear - 20; y <= currentYear + 10; y++) {
          for (let m = 0; m < 12; m++) {
            options += `<div class="px-3 py-2 hover:bg-gray-200 cursor-pointer" data-month="${m}" data-year="${y}">
          ${monthNames[m]} ${y}
        </div>`;
          }
        }
        $dropdown.html(options);
      }

      function renderCalendar() {
        $calendarDays.empty();
        dayNames.forEach((day) => {
          $calendarDays.append(
            `<div class="font-semibold text-sm text-smoke-gray">${day}</div>`
          );
        });

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const startDay = firstDay === 0 ? 6 : firstDay - 1;
        const daysInMonth = new Date(
          currentYear,
          currentMonth + 1,
          0
        ).getDate();

        for (let i = 0; i < startDay; i++) {
          $calendarDays.append("<div></div>");
        }

        for (let day = 1; day <= daysInMonth; day++) {
          const isToday =
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();

          const baseClasses = `cursor-pointer foNT-normal text-xl text-jet-black relative p-0.5`;

          const dateClass = isToday
            ? `text-${highlightColor}`
            : isToday
            ? `text-${highlightColor}`
            : `hover:text-${highlightColor}`;

          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
            2,
            "0"
          )}-${String(day).padStart(2, "0")}`;

          // Check if there are events for this date
          const eventsForDate = getEventsForDate(dateStr);
          const hasEvents = eventsForDate.length > 0;
          
          // Add event indicators for each event with their individual colors
          let eventIndicators = '';
          if (hasEvents) {
            eventsForDate.forEach((event) => {
              const eventColor = event.color || `bg-${highlightColor}`;
              console.log('Popup Event:', event.name, 'Color:', eventColor); // Debug log
              eventIndicators += `<div class="w-2 h-2 ${eventColor} rounded-full mx-auto mt-1 has-tooltip" style="background-color: ${getColorValue(eventColor)};"></div>
                                  <div class="absolute py-1 px-1.5 text-start text-xs tooltip mt-1 z-50 bg-white border rounded-md border-living-coral font-normal">
                                    ${event.name} at ${event.time}
                                  </div>`;
            });
          }

          $calendarDays.append(`
        <div class="${baseClasses} ${dateClass}" data-date="${dateStr}">
          ${day}
          ${eventIndicators}
        </div>
      `);
        }
        $calendarDays.append(
          `<div class="col-span-7"><hr class="border-t border-gray-300 my-2" /></div>`
        );
        updateMonthYearLabel();
      }
      $calendarDays.on("click", "div[data-date]", function () {
        // Remove highlight from all
        $calendarDays
          .find("div[data-date]")
          .removeClass(`text-${highlightColor}`);

        // Highlight selected one
        $(this).addClass(`text-${highlightColor}`);

        // Store selected date
        selectedDate = $(this).data("date");
        
        // Show events for this date if any
        // const eventsForDate = getEventsForDate(selectedDate);
        // if (eventsForDate.length > 0) {
        //   let eventsHtml = '<div class="event-display mt-2 p-2 bg-gray-100 rounded">';
        //   eventsForDate.forEach(event => {
        //     eventsHtml += `<div class="text-sm text-gray-700">• ${event.name} at ${event.time}</div>`;
        //   });
        //   eventsHtml += '</div>';
          
        //   // Remove any existing event display
        //   $calendarDays.find('.event-display').remove();
        //   // Add new event display
        //   $(this).append(eventsHtml);
        // }
      });

      $root
        .find(".bg-light-sea-green")
        .removeClass("bg-light-sea-green")
        .addClass(`bg-${highlightColor}`);

      $dropdownToggle.on("click", function (e) {
        e.stopPropagation();
        $dropdown.toggle();
      });

      $dropdown.on("click", "div", function () {
        currentMonth = +$(this).data("month");
        currentYear = +$(this).data("year");
        $dropdown.hide();
        renderCalendar();
      });

      $prevBtn.on("click", function () {
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        renderCalendar();
      });

      $nextBtn.on("click", function () {
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        renderCalendar();
      });

      $(document).on("click", function (e) {
        if (
          !$dropdownToggle.is(e.target) &&
          $dropdownToggle.has(e.target).length === 0
        ) {
          $dropdown.hide();
        }
        
        // Clear event display when clicking outside calendar days
        if (!$(e.target).closest('div[data-date]').length) {
          $calendarDays.find('.event-display').remove();
        }
      });

      generateMonthYearDropdown();
      renderCalendar();
    });
  }
  if (document.getElementById("eventCal")) {
    initEventCalendar();
  }

  function initClientCompanyChart() {
    Chart.register(ChartDataLabels);

    const ctx = document.getElementById("dataTrendsChart")?.getContext("2d");
    if (!ctx) return; // Safeguard if chart container is missing

    const dataTrendsChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
        datasets: [
          {
            label: "Monthly Data",
            data: [120, 200, 150, 80, 70, 110, 130, 130, 50, 65, 95, 110],
            backgroundColor: "#3586FC",
            borderRadius: { topLeft: 6, topRight: 6 },
            barThickness: window.innerWidth < 640 ? 10 : 30,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: {
            anchor: "end",
            align: "end",
            color: "#A1A9BC",
            font: { weight: "normal" },
            formatter: (value) => value,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Months",
              font: { size: 14, weight: "bold", color: "#1F1F1F" },
            },
            grid: { display: false },
          },
          y: {
            title: {
              display: true,
              text: "Reports Downloaded",
              font: { size: 14, weight: "bold", color: "#1F1F1F" },
            },
            beginAtZero: true,
            grid: { display: true, drawBorder: false },
          },
        },
      },
      plugins: [ChartDataLabels],
    });

    // Handle resize
    window.addEventListener("resize", () => {
      dataTrendsChart.resize();
    });
  }
  if (document.getElementById("dataTrendsChart")) {
    initClientCompanyChart();
  }
  $(".meridian-btn").on("click", function () {
    $(".meridian-btn")
      .removeClass("bg-white text-black shadow-md active")
      .addClass("text-jet-black hover:bg-gray-200");
    $(this)
      .removeClass("text-jet-black hover:bg-gray-200")
      .addClass("bg-white text-black shadow-md active");
  });

  $(".cancelEvent-btn").on("click", function () {
    $(".event-calendar").addClass("hidden");
  });

  // Global variable to store selected date
  let selectedDate = null;

  // Function to save event
  function saveEvent(){
    const eventName = document.getElementById('event-name').value.trim();
    const eventTime = document.getElementById('start-time').value;
    
    if (!eventName) {
      toastr.error('Please enter an event name');
      return;
    }
    
    if (!selectedDate) {
      toastr.error('Please select a date');
      return;
    }
    
    if (!eventTime) {
      toastr.error('Please select a time');
      return;
    }

    // Prepare data for AJAX request
    const eventData = {
      name: eventName,
      date: selectedDate,
      time: eventTime
    };

    // Send AJAX request to save event
    $.ajax({
      url: '/dashboard/save-event/',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(eventData),
      headers: {
        'X-CSRFToken': $('[name=csrfmiddlewaretoken]').val() || $('meta[name=csrf-token]').attr('content')
      },
      success: function(response) {
        if (response.success) {
          toastr.success('Event saved successfully!');
          // Clear form
          document.getElementById('event-name').value = '';
          document.getElementById('start-time').value = '09:00';
          selectedDate = null;
          // Hide popup
          $(".event-calendar").addClass("hidden");
          // Refresh calendar to show new event
          loadEvents();
          loadUpcomingEvents(); // Refresh upcoming events list
        } else {
          alert('Error saving event: ' + (response.error || 'Unknown error'));
        }
      },
      error: function(xhr, status, error) {
        console.error('Error:', error);
        alert('Error saving event. Please try again.');
      }
    });
  }

  // Function to refresh all calendars
  function refreshAllCalendars() {
    // Re-render main calendar by re-initializing it
    $(".calendar-container").each(function() {
      const $root = $(this);
      // Force a re-render by temporarily changing the month and changing it back
      const $prevBtn = $root.find("#prevMonth");
      const $nextBtn = $root.find("#nextMonth");
      if ($prevBtn.length > 0 && $nextBtn.length > 0) {
        // Trigger a month change to force re-render
        $prevBtn.trigger('click');
        setTimeout(() => {
          $nextBtn.trigger('click');
        }, 100);
      }
    });
    
    // Re-render event calendar
    if (document.getElementById("eventCal")) {
      initEventCalendar();
    }
  }

  // Function to load events from backend
  function loadEvents() {
    $.ajax({
      url: '/dashboard/get-events/',
      method: 'GET',
      success: function(response) {
        if (response.events) {
          // Store events globally for use in calendar rendering
          window.calendarEvents = response.events;
          
          // Refresh all calendars
          refreshAllCalendars();
        }
      },
      // error: function(xhr, status, error) {
      //   console.error('Error loading events:', error);
      // }
      error: function(xhr, status, error) {

    console.log(xhr.responseText);

    const container = $('#upcoming-events-container');

    if (!container.length) {
        return;
    }

    console.error('Error loading events:', error);
}
    });
  }

  // Function to get events for a specific date
  function getEventsForDate(dateStr) {
    if (window.calendarEvents && window.calendarEvents[dateStr]) {
      return window.calendarEvents[dateStr];
    }
    return [];
  }

  // Function to convert CSS class names to actual color values
  function getColorValue(colorClass) {
    const colorMap = {
      'bg-slate-blue': '#64748b',
      'bg-strong-red': '#dc2626',
      'bg-green': '#16a34a',
      'bg-vivid-orange': '#ea580c',
      'bg-purple': '#9333ea',
      'bg-pink': '#ec4899',
      'bg-teal': '#0d9488',
      'bg-dark-blue': '#1e40af',
      'bg-dark-green': '#15803d',
      'bg-dark-purple': '#7c3aed',
      'bg-yellow': '#eab308',
      'bg-indigo': '#6366f1',
      'bg-cyan': '#0891b2'
    };
    return colorMap[colorClass] || '#64748b'; // Default to slate-blue if not found
  }

  // Function to load and display upcoming events
  function loadUpcomingEvents() {
    $.ajax({
      url: '/dashboard/get-upcoming-events/',
      method: 'GET',
      success: function(response) {
        const container = $('#upcoming-events-container');
        if (container.length === 0) {
          return;
        }
        const title = container.find('h4').first(); // Keep the title
        if (!container.length) {
          return;
        }
        
        // Clear existing content except title
        container.find('*').not('h4').remove();
        
        if (response.upcoming_events && response.upcoming_events.length > 0) {
          // Add events
          response.upcoming_events.forEach(function(event) {
            const eventElement = $(`
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full" style="background-color: ${event.color_hex};"></span>
                <span class="text-gray-700">${event.name}</span>
              </div>
            `);
            container.append(eventElement);
          });
        } else {
          // Show no events message
          const noEventsElement = $(`
            <div class="flex items-center gap-2">
              <span class="text-gray-500">No upcoming events</span>
            </div>
          `);
          container.append(noEventsElement);
        }
      },
      error: function(xhr, status, error) {
        const container = $('#upcoming-events-container');
        if (!container.length) {
          return;
}
        const title = container.find('h4').first();
        container.find('*').not('h4').remove();
        
        const errorElement = $(`
          <div class="flex items-center gap-2">
            <span class="text-red-500">Error loading events</span>
          </div>
        `);
        container.append(errorElement);
      }
    });
  }

  // Load events when page loads
  $(document).ready(function() {
    // Load events first, then initialize calendars
    loadEvents();
    loadUpcomingEvents();
    
    // Also refresh calendars after a short delay to ensure events are loaded
    setTimeout(function() {
      refreshAllCalendars();
    }, 500);
  });

  // Make saveEvent function globally available
  window.saveEvent = saveEvent;

  $('.material-symbols-outlined:contains("bookmark")').on("click", function () {
    $(this).toggleClass("material-filled text-dark-blue");
  });
});

// Register as Advertiser Home Page Chart
// document.addEventListener("DOMContentLoaded", function () {
//   fetch(getChartData)  // Use the URL pattern name
//     .then((response) => response.json())
//     .then((data) => {
//       const ctx = document.getElementById("advertiserChart").getContext("2d");

//       const chart = new Chart(ctx, {
//         type: "line",
//         data: {
//           labels: data.labels,
//           datasets: [
//             {
//               label: "Total Coupons",
//               data: data.total_coupons,
//               borderColor: "#5182E3",
//               borderWidth: 2,
//               tension: 0,
//               pointRadius: 3,
//               pointBackgroundColor: "#FFFFFF",
//               pointBorderColor: "#5182E3",
//               pointHoverRadius: 5,
//               pointHoverBackgroundColor: "#FFFFFF",
//               pointHoverBorderColor: "#5182E3",
//             },
//             {
//               label: "Total Redemptions",
//               data: data.total_redemptions,
//               borderColor: "#FF6F61",
//               borderWidth: 2,
//               tension: 0,
//               pointRadius: 3,
//               pointBackgroundColor: "#FFFFFF",
//               pointBorderColor: "#FF6F61",
//               pointHoverRadius: 5,
//               pointHoverBackgroundColor: "#FFFFFF",
//               pointHoverBorderColor: "#FF6F61",
//             },
//             {
//               label: "Active Coupons",
//               data: data.active_coupons,
//               borderColor: "#3AAFA9",
//               borderWidth: 2,
//               tension: 0,
//               pointRadius: 3,
//               pointBackgroundColor: "#FFFFFF",
//               pointBorderColor: "#3AAFA9",
//               pointHoverRadius: 5,
//               pointHoverBackgroundColor: "#FFFFFF",
//               pointHoverBorderColor: "#3AAFA9",
//             },
//           ],
//         },
//         options: {
//           responsive: true,
//           plugins: {
//             legend: {
//               position: "top",
//             },
//             title: {
//               display: true,
//               text: "Coupon Performance",
//             },
//           },
//           scales: {
//             y: {
//               beginAtZero: true,
//             },
//           },
//         },
//       });
//     });
// });

document.addEventListener("DOMContentLoaded", function () {
  const chartElement = document.getElementById("advertiserChart");

  // Only run if the canvas exists
  if (chartElement) {
    fetch(getChartData) // Use the URL pattern name
      .then((response) => response.json())
      .then((data) => {
        const ctx = chartElement.getContext("2d");

        const chart = new Chart(ctx, {
          type: "line",
          data: {
            labels: data.labels,
            datasets: [
              {
                label: "Total Coupons",
                data: data.total_coupons,
                borderColor: "#5182E3",
                borderWidth: 2,
                tension: 0,
                pointRadius: 3,
                pointBackgroundColor: "#FFFFFF",
                pointBorderColor: "#5182E3",
                pointHoverRadius: 5,
                pointHoverBackgroundColor: "#FFFFFF",
                pointHoverBorderColor: "#5182E3",
              },
              {
                label: "Total Redemptions",
                data: data.total_redemptions,
                borderColor: "#FF6F61",
                borderWidth: 2,
                tension: 0,
                pointRadius: 3,
                pointBackgroundColor: "#FFFFFF",
                pointBorderColor: "#FF6F61",
                pointHoverRadius: 5,
                pointHoverBackgroundColor: "#FFFFFF",
                pointHoverBorderColor: "#FF6F61",
              },
              {
                label: "Active Coupons",
                data: data.active_coupons,
                borderColor: "#3AAFA9",
                borderWidth: 2,
                tension: 0,
                pointRadius: 3,
                pointBackgroundColor: "#FFFFFF",
                pointBorderColor: "#3AAFA9",
                pointHoverRadius: 5,
                pointHoverBackgroundColor: "#FFFFFF",
                pointHoverBorderColor: "#3AAFA9",
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: "top",
              },
              title: {
                display: true,
                text: "Coupon Performance",
              },
            },
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        });
      })
      .catch((error) => {
        console.error("Chart data fetch error:", error);
      });
  }
});

// checkbox
document.addEventListener("DOMContentLoaded", function () {
  const checkboxes = document.querySelectorAll("#ngoCustomLegend .chkGrph");

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      if (this.checked) {
        checkboxes.forEach((cb) => {
          if (cb !== this) cb.checked = false;
        });
      }
    });
  });
});


//ngo chart and filters : via checkbox , custom date filter and week-month-year wise 
let originalChartData = null;
let ngoChartInstance = null;

async function fetchChartData(startDate = null, endDate = null) {
  let url = '/dashboard/ngo-graph-data/';
  if (startDate && endDate) {
    url += `?start_date=${startDate}&end_date=${endDate}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();

    const labels = data.labels;
    const datasets = [];

    const colors = {
      "Total Post": "#6B79F5",
      "Total Views": "#FF0000",
      "Target Donation": "#FF7F50",
      "Donation Received": "#3AAFA9"
    };

    const axisMap = {
      "Total Post": "yLeft",
      "Total Views": "yRight",
      "Target Donation": "yRight",
      "Donation Received": "yRight"
    };

    Object.entries(data.datasets).forEach(([label, values]) => {
      datasets.push({
        label,
        data: values.map(Number),
        borderColor: colors[label],
        borderWidth: 2,
        tension: 0.3,
        yAxisID: axisMap[label],
        pointRadius: 3,
        pointBackgroundColor: "#fff",
        pointBorderColor: colors[label],
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: colors[label],
      });
    });

    return { labels, datasets };
  } catch (error) {
    console.error("Chart data fetch failed:", error);
    return { labels: [], datasets: [] };
  }
}

async function initDynamicNGOChart(startDate = null, endDate = null) {
  const ctx = document.getElementById("ngoChart")?.getContext("2d");
  if (!ctx) {
    // console.error("Chart canvas not found!");
    return;
  }

  const data = await fetchChartData(startDate, endDate);
  originalChartData = data;

  if (ngoChartInstance) {
    ngoChartInstance.destroy();
  }

  ngoChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: data.datasets,
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      stacked: false,
      plugins: {
        legend: { display: true }
      },
      scales: {
        yLeft: { type: 'linear', position: 'left' },
        yRight: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false }
        }
      }
    }
  });

  attachCheckboxListeners();
}

function attachCheckboxListeners() {
  const checkboxes = document.querySelectorAll(".chkGrph");
  checkboxes.forEach((chk) => {
    chk.addEventListener("change", () => {
      const selectedLabels = Array.from(checkboxes)
        .filter(c => c.checked)
        .map(c => c.dataset.label);

      let filteredDatasets = selectedLabels.length === 0
        ? originalChartData.datasets
        : originalChartData.datasets.filter(ds => selectedLabels.includes(ds.label));

      ngoChartInstance.data.datasets = filteredDatasets;
      ngoChartInstance.update();
    });
  });
}

$(document).ready(function () {
  // 1. Initialize chart
  initDynamicNGOChart();

  // 2. Initialize jQuery UI datepicker
  $('.ngo-custom-date').datepicker({
    dateFormat: 'yy-mm-dd',
    onSelect: function (dateText) {
      console.log("Selected date:", dateText);
      initDynamicNGOChart(dateText, dateText); // Use same date as start and end
    }
  });

  // 3. Toggle filter dropdown
  $('.ngo-filterToggle').click(function (e) {
    e.stopPropagation();
    const $container = $(this).closest('.ngo-dropdown');
    const $dropdown = $container.find('.ngo-filterDropdown');
    $('.ngo-filterDropdown').not($dropdown).hide();
    $('.ngo-datepicker-container').hide();
    $dropdown.toggle();
  });

  // 4. Show calendar on calendar icon click
  $('.ngo-calendar-icon').click(function (e) {
    e.stopPropagation();
    const $container = $(this).closest('.ngo-dropdown');
    const $datepicker = $container.find('.ngo-datepicker-container');
    $('.ngo-datepicker-container').not($datepicker).hide();
    $datepicker.toggle();
  });

  // 5. Filter by day range (1 week, 1 month, etc.)  
  $('[data-filter]').click(function () {
    const days = parseInt($(this).data('filter'));
    if (days === 0) {
      // ✅ RESET clicked
      initDynamicNGOChart(); // load full data with no date filters
      $('.ngo-datepicker-container').hide(); // hide calendar if open
    } else {
      // Load based on date range
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days + 1);

      // const format = date => date.toISOString().split('T')[0];
      const format = (date) => {

        if (!(date instanceof Date) || isNaN(date.getTime())) {

            console.log("Invalid Date:", date);

            return "";
        }

       return date.toISOString().split('T')[0];

   };
      initDynamicNGOChart(format(start), format(end));
    }

    // Hide filter dropdown after click
    $('.ngo-filterDropdown').hide();
  });

  // 6. Hide all dropdowns on outside click
  $(document).on('click', function (e) {
    const $target = $(e.target);
    if (!$target.closest('.ngo-dropdown, .ngo-datepicker-container').length) {
      $('.ngo-filterDropdown').hide();
      $('.ngo-datepicker-container').hide();
    }
  });
});
$(document).ready(function () {

    // $(".view-appointment").click(function (e) {

    //     e.stopPropagation();

    //     $(".appointmentRequestDetail").removeClass("hidden");

    //     $("body").addClass("overflow-hidden");
    // });
    $(document).on("click",".view-appointment",function(){

    const appointmentId = $(this).data("id");

    $.ajax({
        url: `/appointment/appointment-details/${appointmentId}/`,
        type: "GET",

        success:function(response){

            const a = response.appointment;

            $("#popup-name").text(a.patient_name);
            $("#popup-gender").text(a.gender);
            $("#popup-age").text(a.age);
            $("#popup-phone").text(a.phone);
            $("#popup-address").text(a.address);
            $("#popup-date").text(a.appointment_date);
            $("#popup-service").text(a.visit_type);

            $(".appointmentRequestDetail")
                .removeClass("hidden");

        }
    });

});
    $(".accept-button").click(function () {

    $(".enquiredDetail").addClass("hidden");

    $(".acceptedDetail").removeClass("hidden");

  });

    $(".close-popup").click(function () {

        $(".appointmentRequestDetail").addClass("hidden");

        $("body").removeClass("overflow-hidden");
    });

});
$(document).on("click", ".accept-button", function () {
    toastr.success("Accepted Successfully");
    $(".enquiredDetail").addClass("hidden");
    $(".acceptedDetail").removeClass("hidden");

    Swal.fire({
        icon: "success",
        title: "Appointment Accepted",
        text: "Appointment accepted successfully",
        showConfirmButton: false,
        timer: 2000
    });

});
$(document).on("click", ".cancel-appointment", function () {
    alert("Cancel Click Working");
});
$(document).on("click", ".complete-button", function () {
    alert("Complete Working");
});

$(document).on("click", ".cancel-appointment", function () {
    alert("Cancel Working");
});
// Appointment Request Popup

$(document).on("click", ".accept-button", function () {

    $(".enquiredDetail").addClass("hidden");
    $(".acceptedDetail").removeClass("hidden");

});

// $(document).on("click", ".reject-button", function () {

//     $(".appointmentRequestDetail").addClass("hidden");

// });
$(document).on("click", ".reject-button", function () {

    toastr.success("Cancelled Successfully");

    $(".appointmentRequestDetail").addClass("hidden");

});
// Complete Appointment

$(document).on("click", ".complete-btn", function () {
    toastr.success("Completed Successfully");

    console.log("Complete Button Clicked");

    $(".acceptedDetail").addClass("hidden");

    $(".completedDetail").removeClass("hidden");

});


// Cancel Appointment

$(document).on("click", "[data-popup='cancelAppointmentPopup']", function () {

    console.log("Cancel Appointment Clicked");

    $(".cancelAppointmentPopup").removeClass("hidden");

});
$(document).on("click", ".cancelAppointmentBtn", function () {

    console.log("Final Cancel Clicked");
    toastr.success("Cancelled Successfully");

    $(".cancelAppointmentPopup").addClass("hidden");

    $(".acceptedDetail").addClass("hidden");

    $(".cancelDetails").removeClass("hidden");

});
$(document).on("click", ".complete-appointment-btn", function () {

    const appointmentId = $(this).data("id");

    $.ajax({
        url: "/history/lab/complete/",
        type: "POST",
        data: {
            id: appointmentId,
            csrfmiddlewaretoken: $("input[name=csrfmiddlewaretoken]").val()
        },
        success: function () {
            location.reload();
        }
    });

});
// =============================
// OPEN ORDER DETAILS POPUP
// =============================
$(".order-card").on("click", async function () {

    const popupId = $(this).data("popup");
    const orderId = $(this).data("order-id");

    console.log("Order Clicked:", orderId);

    if (!orderId) {
        console.error("Missing data-order-id");
        return;
    }

    try {

        const response = await fetch(
            `/dashboard/pharmacy/order/${orderId}/`
        );

        if (!response.ok) {
            throw new Error(
                `HTTP Error: ${response.status}`
            );
        }

        const data = await response.json();

        console.log("Order Data:", data);

        populateOrderPopup(data);

        $("." + popupId)
            .removeClass("hidden")
            .addClass("flex");

    } catch (err) {

        console.error(
            "Failed to load order details:",
            err
        );

    }

});


// =============================
// CLOSE POPUP
// =============================
$(".close-popup").on("click", function () {

    const popupId = $(this).data("popup");

    $("." + popupId)
        .addClass("hidden")
        .removeClass("flex");

});


// =============================
// POPULATE ORDER DETAILS
// =============================
function populateOrderPopup(data) {

    // Patient Name
    const patientName =
        document.getElementById("patientName");

    if (patientName) {
        patientName.innerText =
            data.patient_name || "N/A";
    }

    // Order Number
    const orderNumber =
        document.getElementById("orderNumber");

    if (orderNumber) {
        orderNumber.innerText =
            "#" + data.id;
    }

    // Phone Number
    const phoneNumber =
        document.getElementById("phoneNumber");

    if (phoneNumber) {
        phoneNumber.innerText =
            data.phone || "N/A";
    }
    document.getElementById("gender").innerText =
    data.gender || "N/A";

    document.getElementById("age").innerText =
        data.age || "N/A";
    
    document.getElementById("addressText").innerText =
        [
            data.address?.address,
            data.address?.city,
            data.address?.state,
            data.address?.pincode,
            data.address?.country
        ]
        .filter(Boolean)
        .join(", ");

    const profileImage = document.getElementById("profileImage");

    profileImage.src =
        data.profile_photo
            ? data.profile_photo
            : "/static/images/dolly-paris1.svg";

    profileImage.onerror = function () {
        this.src = "/static/images/dolly-paris1.svg";
    };

    // Total Amount
    const orderTotal =
        document.getElementById("orderTotal");

    if (orderTotal) {
        orderTotal.innerText =
            "₹" + data.total;
    }

    // Medicine List
    const container =
        document.getElementById("medicineContainer");

    if (!container) {
        console.error(
            "medicineContainer not found"
        );
        return;
    }

    container.innerHTML = "";

    if (
        !data.medicines ||
        !data.medicines.length
    ) {

        container.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                No medicines found
            </div>
        `;

        return;
    }

    data.medicines.forEach((med) => {

        container.innerHTML += `
            <div class="flex items-start gap-3 border-b border-grayish-gray pb-3">

                <div class="rounded-lg bg-off-white flex items-center justify-center overflow-hidden">
                    <img
                        src="/static/images/medicine.svg"
                        alt="medicine"
                        class="h-[92px] w-[92px]"
                    />
                </div>

                <div class="flex-1">

                    <p class="text-ebony font-semibold text-sm mb-1">
                        ${med.name || "Medicine"}
                    </p>

                    <div class="flex items-center gap-2 mb-2">

                        <span class="text-sm text-blue-gray">
                            ${med.qty || 0} unit
                        </span>

                        <span
                            class="px-2 py-0.5 rounded-md text-white text-[8px]
                            ${
                                med.requires_prescription
                                    ? "bg-dark-crimson-red"
                                    : "bg-ocean-green"
                            }">

                            ${
                                med.requires_prescription
                                    ? "Prescription Needed"
                                    : "Prescription Received"
                            }

                        </span>

                    </div>

                    <div class="flex items-center gap-2">

                        <span class="text-ebony text-sm">
                            ₹${med.price || 0}
                        </span>

                        <span class="text-arctic-gray text-sm line-through">
                            ₹${med.mrp || 0}
                        </span>

                    </div>

                </div>

            </div>
        `;

    });

}

// Open Share Popup
$(document).on("click", ".pharmacy-open-share", function (e) {
    e.preventDefault();
    e.stopPropagation();

    $(".pharmacy-share-modal")
        .removeClass("hidden")
        .addClass("flex");
});

// Close Share Popup
$(document).on("click", ".pharmacy-close-share", function () {

    $(".pharmacy-share-modal")
        .addClass("hidden")
        .removeClass("flex");
});

  $(".popup-btn").on("click", function () {
    let popupId = $(this).data("popup");
    $("." + popupId)
      .removeClass("hidden")
      .addClass("flex");
  });

  // Close popup
  $(".close-popup").on("click", function () {
    let popupId = $(this).data("popup");
    $(this)
      .closest("." + popupId)
      .addClass("hidden")
      .removeClass("flex");
  });

$(document).on("click", ".place-bid-btn", function () {

    const appointmentId = $(this).data("id");
    const row = $(this).closest(".appointment-row");

    $.ajax({
        url: "/appointment/place-bid/",
        type: "POST",

        data: {
            appointment_id: appointmentId,
            csrfmiddlewaretoken: $('meta[name="csrf-token"]').attr('content')
        },

        success: function(resp){

            if(resp.success){

                toastr.success(
                    resp.message || "Bid placed successfully"
                );

                row.fadeOut(300, function(){
                    $(this).remove();
                });

            } else {

                toastr.error(
                    resp.message || "Unable to place bid"
                );
            }
        },

        error: function(xhr){

            toastr.error(
                xhr.responseJSON?.message ||
                "Something went wrong"
            );
        }
    });

});

$(document).on("click", ".appointment-detail-btn", function () {

    const appointmentId = $(this).data("id");

    $.ajax({
        url: `/appointment/appointment-details/${appointmentId}/`,
        type: "GET",

        success: function (response) {

            if (!response.success) return;

            const a = response.appointment;

            $("#popup-patient-name").text(a.patient_name);
            $("#popup-gender").text(a.gender || "-");
            $("#popup-age").text(a.age || "-");
            $("#popup-phone").text(a.phone || "-");
            $("#popup-address").text(a.address || "-");

            $("#popup-visit-type").text(a.visit_type);
            $("#popup-date").text(a.appointment_date);

            $("#popup-medical-requirement").text(
                a.medical_requirement
            );

            $("#popup-details").text(
                a.details
            );

            $("#popup-order-id").text(
                a.order_id
            );

            $("#popup-budget").text(
                "₹" + a.budget
            );

            $(".appointmentRequestDetail")
              .attr("data-appointment-id", appointmentId)
              .removeClass("hidden")
              .addClass("flex");
        }
    });
});

$(document).on("click", ".hospital-accept-button", function () {

    const appointmentId = $(".appointmentRequestDetail")
        .attr("data-appointment-id");

    $.ajax({
        url: "/appointment/place-bid/",
        type: "POST",
        data: {
            appointment_id: appointmentId,
            csrfmiddlewaretoken: $('meta[name="csrf-token"]').attr('content')
        },

        success: function (resp) {

            if (resp.success) {

                toastr.success(
                    resp.message || "Bid placed successfully"
                );

                $(".appointmentRequestDetail")
                    .addClass("hidden")
                    .removeClass("flex");

                location.reload();

            } else {

                toastr.error(
                    resp.message || "Unable to place bid"
                );
            }
        },

        error: function (xhr) {

            toastr.error(
                xhr.responseJSON?.message ||
                "Something went wrong"
            );
        }
    });

});

$(document).on("click", ".doctor-appointment-detail-btn", function () {

    const appointmentId = $(this).data("id");

    $.ajax({
        url: `/appointment/doctor-appointment-details/${appointmentId}/`,
        type: "GET",

        success: function (response) {

            if (!response.success) {
                toastr.error(response.message);
                return;
            }

            const a = response.appointment;

            $("#popup-patient-name").text(a.patient_name);
            $("#popup-gender").text(a.gender || "-");
            $("#popup-age").text(a.age || "-");
            $("#popup-phone").text(a.phone || "-");
            $("#popup-address").text(a.address || "-");

            $("#popup-visit-type").text(
                a.consultation_type || "-"
            );

            $("#popup-date").text(
                a.appointment_date || "-"
            );

            $("#popup-medical-requirement").text(
                a.consultation_type || "-"
            );

            $("#popup-details").text(
                a.details || "-"
            );

            $("#popup-order-id").text(
                a.order_id || "-"
            );

            $("#popup-budget").text(
                "₹" + (a.budget || 0)
            );

            $(".appointmentRequestDetail")
                .attr("data-appointment-id", appointmentId)
                .removeClass("hidden")
                .addClass("flex");
        },

        error: function () {

            toastr.error(
                "Unable to load appointment details"
            );
        }
    });

});

$(document).on("click", ".doctor-place-bid-btn", function () {

    const appointmentId = $(this).data("id");

    $.ajax({
        url: "/appointment/doctor-place-bid/",
        type: "POST",

        data: {
            appointment_id: appointmentId,
            csrfmiddlewaretoken: $('meta[name="csrf-token"]').attr('content')
        },

        success: function (resp) {

            if (resp.success) {

                toastr.success(
                    resp.message || "Bid placed successfully"
                );

                setTimeout(function () {
                    location.reload();
                }, 1000);

            } else {

                toastr.error(
                    resp.message || "Unable to place bid"
                );
            }
        },

        error: function (xhr) {

            toastr.error(
                xhr.responseJSON?.message ||
                "Something went wrong"
            );
        }
    });

});

$(document).on("click", ".doctor-accept-button", function () {

    const appointmentId = $(".appointmentRequestDetail")
        .attr("data-appointment-id");

    if (!appointmentId) {
        toastr.error("Appointment ID not found");
        return;
    }

    $.ajax({
        url: "/appointment/doctor-place-bid/",
        type: "POST",

        data: {
            appointment_id: appointmentId,
            csrfmiddlewaretoken: $('meta[name="csrf-token"]').attr("content")
        },

        success: function (resp) {

            if (resp.success) {

                toastr.success(
                    resp.message || "Bid placed successfully"
                );

                $(".appointmentRequestDetail")
                    .addClass("hidden")
                    .removeClass("flex");

                setTimeout(function () {
                    location.reload();
                }, 1000);

            } else {

                toastr.error(
                    resp.message || "Unable to place bid"
                );
            }
        },

        error: function (xhr) {

            let message = "Something went wrong";

            if (
                xhr.responseJSON &&
                xhr.responseJSON.message
            ) {
                message = xhr.responseJSON.message;
            }

            toastr.error(message);
        }
    });

});
$(document).on("click",".view-appointment",function(){

    const appointmentId = $(this).data("id");

    console.log("Viewing:",appointmentId);

});
$(document).on("click",".accept-button",function(){

    toastr.success("Accepted Successfully");

});
$(document).on("click",".reject-button",function(){

    toastr.success("Cancelled Successfully");

});
$(document).on("click",".accept-button",function(){

    const id = $(this).data("id");

    $.ajax({
        url:"/dashboard/appointment/accept/",
        type:"POST",
        data:{
            id:id,
            csrfmiddlewaretoken:$("input[name=csrfmiddlewaretoken]").val()
        },

        success:function(resp){

            toastr.success("Accepted Successfully");

            location.reload();
        }
    });

});
$(document).on("click",".reject-button",function(){

    const id = $(this).data("id");

    $.ajax({
        url:"/dashboard/appointment/reject/",
        type:"POST",
        data:{
            id:id,
            csrfmiddlewaretoken:$("input[name=csrfmiddlewaretoken]").val()
        },

        success:function(resp){

            toastr.success("Cancelled Successfully");

            location.reload();
        }
    });

});