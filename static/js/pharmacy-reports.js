$(document).ready(function () {
  const root = document.getElementById("pharmacy-report-root");
  const reportUrl = root ? root.dataset.reportUrl : "/reports/pharmacy-report-data/";
  const initialEl = document.getElementById("pharmacy-report-data");
  const initialData = initialEl ? JSON.parse(initialEl.textContent || "{}") : {};
  const chartColors = ["#3b82f6", "#f97316", "#22c55e", "#ef4444", "#eab308", "#8b5cf6"];
  const charts = {};
  let heatmapSeries = null;

  function emptySeries(label) {
    return { labels: [label], values: [0] };
  }

  function currentParams(extraParams = {}) {
    const params = new URLSearchParams(window.location.search);
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    return params;
  }

  function notifyIncompleteRange() {
    const message = "Please select an end date.";
    if (window.toastr) {
      toastr.warning(message);
    } else if (window.showToaster) {
      window.showToaster("error", message);
    }
  }

  function setText(selector, value) {
    $(selector).text(value == null || value === "" ? "0" : value);
  }

  function renderTopProducts(rows) {
    const $top = $("#topProductsList").empty();
    const $revenue = $("#revenueProductsList").empty();

    if (!rows || !rows.length) {
      $top.append('<p class="text-medium-gray text-center">No product sales found for this range.</p>');
      $revenue.append('<p class="text-medium-gray text-center">No revenue split available.</p>');
      return;
    }

    rows.forEach((row) => {
      $top.append(`
        <div class="flex justify-between gap-3">
          <span class="truncate">${row.name}</span>
          <span class="text-dodger-blue whitespace-nowrap">${row.units || 0} units</span>
        </div>
      `);
      $revenue.append(`
        <div class="flex justify-between gap-3">
          <span class="truncate">${row.name}</span>
          <span class="font-semibold whitespace-nowrap">&#8377;${row.revenue || 0}</span>
        </div>
      `);
    });
  }

  function renderStockAlerts(rows) {
    const $list = $("#stockAlertsList").empty();
    if (!rows || !rows.length) {
      $list.append('<p class="text-medium-gray">No active stock items added.</p>');
      return;
    }

    rows.forEach((row) => {
      $list.append(`
        <div class="flex justify-between gap-3">
          <span class="truncate">${row.name}</span>
          <span class="text-strong-red whitespace-nowrap">${row.quantity}</span>
        </div>
      `);
    });
  }

  function renderWinLossRows(rows) {
    const $list = $("#winLossRows").empty();
    if (!rows || !rows.length) {
      $list.append('<p class="text-sm text-medium-gray">No bid activity found.</p>');
      return;
    }

    rows.forEach((row) => {
      $list.append(`
        <div class="flex items-center justify-between gap-4">
          <div class="flex-1 h-5 rounded-full overflow-hidden">
            <div class="flex h-full">
              <div class="bg-mint-leaf text-white text-xs font-semibold flex items-center justify-center" style="width: ${row.won_percent || 0}%;">
                ${row.won || 0}
              </div>
              <div class="bg-bright-red text-white text-xs font-semibold flex items-center justify-center" style="width: ${row.lost_percent || 0}%;">
                ${row.lost || 0}
              </div>
            </div>
          </div>
          <span class="text-xs">${row.label}</span>
        </div>
      `);
    });
  }

  function renderRatings(rows) {
    const $ratings = $("#ratings").empty();
    (rows || []).forEach((row) => {
      $ratings.append(`
        <div class="flex items-center justify-between">
          <span class="text-dodger-blue">${row.stars} star</span>
          <div class="w-3/4 bg-[#D3D3D3] rounded-full h-2">
            <div class="bg-[#FFCC48] h-2 rounded-full" style="width:${row.percent || 0}%;"></div>
          </div>
          <span>${row.percent || 0}%</span>
        </div>
      `);
    });
  }

  function upsertChart(id, config) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    if (charts[id]) {
      charts[id].data = config.data;
      charts[id].options = config.options;
      charts[id].update();
      return;
    }
    charts[id] = new Chart(canvas.getContext("2d"), config);
  }

  function renderCharts(data) {
    const topProducts = data.topProducts || {};
    const bidTrend = data.bidTrend || {};
    const winLoss = data.winLoss || {};
    const productLabels = topProducts.labels && topProducts.labels.length ? topProducts.labels : emptySeries("No sales yet").labels;
    const productUnits = topProducts.units && topProducts.units.length ? topProducts.units : emptySeries("No sales yet").values;
    const revenueLabels = topProducts.revenueLabels && topProducts.revenueLabels.length ? topProducts.revenueLabels : emptySeries("No revenue yet").labels;
    // Change revenue values collection to use raw float numbers
  const revenueValues = topProducts.revenue && topProducts.revenue.length 
    ? topProducts.revenue.map(val => parseFloat(String(val).replace(/,/g, ''))) 
    : emptySeries("No revenue yet").values;

    upsertChart("barChartPharmacy", {
      type: "bar",
      data: {
        labels: productLabels,
        datasets: [{ label: "Units sold", data: productUnits, backgroundColor: chartColors }],
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    });

    upsertChart("pieChart", {
      type: "pie",
      data: {
        labels: revenueLabels,
        datasets: [{ data: revenueValues, backgroundColor: chartColors }],
      },
      options: { responsive: true, plugins: { legend: { position: "top" } } },
    });

    upsertChart("lineChart", {
      type: "line",
      data: {
        labels: bidTrend.labels || [],
        datasets: [{
          label: "Avg bid",
          data: bidTrend.values || [],
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.12)",
          tension: 0.35,
          fill: true,
        }],
      },
      options: { responsive: true, plugins: { legend: { position: "top" } }, scales: { y: { beginAtZero: true } } },
    });

    upsertChart("bidWinLossChart", {
      type: "bar",
      data: {
        labels: winLoss.labels || [],
        datasets: [
          { label: "Bids won", data: winLoss.won || [], backgroundColor: "#10b981" },
          { label: "Bids lost", data: winLoss.lost || [], backgroundColor: "#ef4444" },
        ],
      },
      options: { responsive: true, plugins: { legend: { position: "top" } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } },
    });

    renderHeatmap(data.heatmap || []);
    renderRatings(data.ratings || []);
  }

  function renderHeatmap(rows) {
    if (!document.getElementById("heatmap") || !window.am4core || !window.am4maps) return;

    if (heatmapSeries) {
      heatmapSeries.data = rows;
      return;
    }

    am4core.useTheme(am4themes_animated);
    const chart = am4core.create("heatmap", am4maps.MapChart);
    chart.geodata = am4geodata_india2019High;

    heatmapSeries = chart.series.push(new am4maps.MapPolygonSeries());
    heatmapSeries.heatRules.push({
      property: "fill",
      target: heatmapSeries.mapPolygons.template,
      min: chart.colors.getIndex(1).brighten(1),
      max: chart.colors.getIndex(1).brighten(-0.3),
    });
    heatmapSeries.useGeodata = true;
    heatmapSeries.data = rows;

    const polygonTemplate = heatmapSeries.mapPolygons.template;
    polygonTemplate.tooltipText = "{name}: {value}";
    polygonTemplate.nonScalingStroke = true;
    polygonTemplate.strokeWidth = 0.5;
    polygonTemplate.states.create("hover").properties.fill = am4core.color("#3c5bdc");
  }

  function applyReportResponse(response) {
    const stats = response.stats || {};
    const chartsData = response.charts || initialData;

    setText("#reportRangeLabel", response.range_label);
    $(".report-range-text").text(response.range_label || "");
    setText("#totalRevenueStat", stats.total_revenue);
    setText("#bidWonStat", stats.won_bids);
    setText("#totalOrdersStat", stats.total_orders);
    setText("#avgBidStat", stats.avg_bid);

    renderTopProducts(response.top_products || []);
    renderStockAlerts(response.stock_alerts || []);
    renderWinLossRows(response.win_loss_rows || []);
    renderCharts(chartsData);
  }

  function loadReport(extraParams = {}) {
    const params = currentParams(extraParams);
    return $.getJSON(`${reportUrl}?${params.toString()}`).done(applyReportResponse);
  }

  loadReport();
  // The shared dropdown script uses inline show/hide styles. Those styles
  // conflict with this page's Tailwind `hidden` classes, so pharmacy reports
  // owns these controls completely.
  $(".filterToggle, .calendar-icon").off("click");

  const initialParams = new URLSearchParams(window.location.search);
  let selectedStartDate = initialParams.get("period") === "custom"
    ? (initialParams.get("start") || "")
    : "";
  let selectedEndDate = initialParams.get("period") === "custom"
    ? (initialParams.get("end") || "")
    : "";
  updateSelectedPeriod(initialParams.get("period") || "month");

  function showOnlyDatepicker($calendar) {
    $(".filterDropdown").addClass("hidden").css("display", "");
    $(".datepicker-container").not($calendar).addClass("hidden").css("display", "");
    $calendar.removeClass("hidden").css("display", "");
  }

  // Initialize all inline calendars.
  $(".datepicker-inline").each(function () {
    const $calendar = $(this);

    if ($calendar.hasClass("hasDatepicker")) {
        $calendar.datepicker("destroy");
    }

    $calendar.datepicker({
        dateFormat: "yy-mm-dd",
        changeMonth: true,
        changeYear: true,

        onSelect: function (dateText) {
            console.log("Calendar date selected:", dateText);

            if (!selectedStartDate || selectedEndDate) {
                selectedStartDate = dateText;
                selectedEndDate = "";
                notifyIncompleteRange();
                return;
            }

            selectedEndDate = dateText;

            let start = selectedStartDate;
            let end = selectedEndDate;

            if (start > end) {
                [start, end] = [end, start];
            }

            const url = new URL(window.location.href);
            url.searchParams.set("period", "custom");
            url.searchParams.set("start", start);
            url.searchParams.set("end", end);

            window.history.replaceState({}, "", url.toString());

            updateSelectedPeriod("custom");

            $(".filterDropdown, .datepicker-container").addClass("hidden").css("display", "");

            loadReport({
                period: "custom",
                start: start,
                end: end
            })
            .fail(function (xhr) {
                const message = xhr.responseJSON?.error || "Unable to load the selected report range.";
                if (window.toastr) toastr.error(message);
            });
        }
    });
});

  $(document).on("click", ".filterToggle", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const $dropdown = $(this).closest(".dropdown").find(".filterDropdown").first();
    const shouldOpen = $dropdown.hasClass("hidden");
    $(".filterDropdown, .datepicker-container").addClass("hidden").css("display", "");
    if (shouldOpen) $dropdown.removeClass("hidden");
  });

  // Open a date range calendar from any chart calendar icon.
  $(document).on("click", ".calendar-icon", function (e) {

    // Main Custom menu is handled separately
    if ($(this).closest(".filterDropdown").length) {
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    const $calendar = $(this)
        .closest(".dropdown")
        .find(".datepicker-container")
        .first();

    if ($calendar.hasClass("hidden")) {
      showOnlyDatepicker($calendar);
    } else {
      $calendar.addClass("hidden").css("display", "");
    }
  });


// Prevent clicks inside calendars from closing them
$(document).on(
    "click",
    ".filterDropdown, .datepicker-container, .ui-datepicker",
    function (e) {
        e.stopPropagation();
    }
);


// Close calendars when clicking outside
$(document).on("click", function (e) {

    if (
        !$(e.target).closest(
            ".dropdown, .datepicker-container, .ui-datepicker"
        ).length
    ) {
        $(".filterDropdown, .datepicker-container").addClass("hidden").css("display", "");
    }
});
  // $(".filterDropdown > div").on("click", function () {
  //   const label = $(this).text().trim().toLowerCase();
  //   const period = label.includes("today") ? "today" : label.includes("week") ? "week" : label.includes("month") ? "month" : "custom";
  //   const url = new URL(window.location.href);
  //   url.searchParams.set("period", period);
  //   window.history.replaceState({}, "", url.toString());
  //   loadReport({ period });
  // });

//   $(".filterDropdown > div").on("click", function () {
//     const period = $(this).data("period") || "month";
//     const url = new URL(window.location.href);
//     url.searchParams.set("period", period);
//     window.history.replaceState({}, "", url.toString());
//     loadReport({ period });
// });
// Today / Week / Month filters
// $(".filterDropdown > div[data-period='today'], .filterDropdown > div[data-period='week'], .filterDropdown > div[data-period='month']")
// Update the blue tick for the selected filter
function updateSelectedPeriod(period) {
    $(".filterDropdown > div[data-period]").each(function () {
        const itemPeriod = $(this).data("period");
        const $tick = $(this).find(".material-symbols-outlined").first();

        if (itemPeriod === period) {
            $tick.removeClass("text-light-gray").addClass("text-dodger-blue");
        } else {
            $tick.removeClass("text-dodger-blue").addClass("text-light-gray");
        }
    });
}

// Today, Week and Month filters
$(document).on(
    "click",
    ".filterDropdown > div[data-period='today'], .filterDropdown > div[data-period='week'], .filterDropdown > div[data-period='month']",
    function (e) {
        e.preventDefault();
        e.stopPropagation();

        const period = $(this).data("period");

        selectedStartDate = "";
        selectedEndDate = "";

        updateSelectedPeriod(period);

        const url = new URL(window.location.href);
        url.searchParams.set("period", period);
        url.searchParams.delete("start");
        url.searchParams.delete("end");

        window.history.replaceState({}, "", url.toString());

        $(".filterDropdown, .datepicker-container").addClass("hidden").css("display", "");

        loadReport({
            period: period,
            start: "",
            end: ""
        });
    }
);

// Custom filter opens the calendar
$(document).on(
    "click",
    ".filterDropdown > div[data-period='custom']",
    function (e) {
        e.preventDefault();
        e.stopPropagation();

        updateSelectedPeriod("custom");

        const $calendar = $(this)
            .closest(".dropdown")
            .find(".datepicker-container")
            .first();

        showOnlyDatepicker($calendar);
    }
);

  // Search by name/type updates the same report data without discarding the
  // currently selected date filter.
  $("#pharmacy-report-root form[method='get']").on("submit", function (e) {
    e.preventDefault();
    const query = $(this).find("[name='q']").val().trim();
    const url = new URL(window.location.href);
    if (query) {
      url.searchParams.set("q", query);
    } else {
      url.searchParams.delete("q");
    }
    window.history.replaceState({}, "", url.toString());
    loadReport({ q: query }).fail(function () {
      if (window.toastr) toastr.error("Unable to search report data.");
    });
  });
    // .on("click", function (e) {
    //     e.stopPropagation();

    //     const period = $(this).data("period");

    //     selectedStartDate = "";
    //     selectedEndDate = "";

    //     const url = new URL(window.location.href);

    //     url.searchParams.set("period", period);
    //     url.searchParams.delete("start");
    //     url.searchParams.delete("end");

    //     window.history.replaceState({}, "", url.toString());

    //     $(".filterDropdown").addClass("hidden");
    //     $(".datepicker-container").addClass("hidden");

    //     loadReport({
    //         period: period,
    //         start: "",
    //         end: ""
    //     });
    // });

// // Custom filter opens the main calendar
// $(".filterDropdown > div[data-period='custom']").on("click", function (e) {
//     e.stopPropagation();

//     const $calendar = $(this)
//         .closest(".dropdown")
//         .find(".datepicker-container")
//         .first();

//     $(".filterDropdown").addClass("hidden");
//     $(".datepicker-container").not($calendar).addClass("hidden");

//     $calendar.removeClass("hidden");
// });

  $(".download-btn").on("click", function () {
    const targetId = $(this).data("target");
    const target = document.getElementById(targetId);
    if (!target || !window.jspdf) return;
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    pdf.html(target, {
      callback: function (doc) {
        doc.save(`${targetId}.pdf`);
      },
      x: 10,
      y: 10,
    });
  });

  $(document).on("click", ".dropdown-btn", function (e) {
    e.stopPropagation();
    const $dropdown = $(this).closest(".dropdown");
    $(".dropdown-menu").not($dropdown.find(".dropdown-menu")).addClass("hidden");
    $dropdown.find(".dropdown-menu").toggleClass("hidden");
  });

  $(document).on("click", ".dropdown-menu li", function () {
    const $dropdown = $(this).closest(".dropdown");
    const value = $(this).text();
    $dropdown.find(".dropdown-value").text(value);
    $dropdown.find(".dropdown-menu").addClass("hidden");
  });

  $(document).click(function () {
    $(".dropdown-menu").addClass("hidden");
  });
});
