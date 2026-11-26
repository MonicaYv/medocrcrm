$(document).ready(function () {
  const root = document.getElementById("pharmacy-report-root");
  const reportUrl = root ? root.dataset.reportUrl : "/reports/pharmacy-report-data/";
  const initialEl = document.getElementById("pharmacy-report-data");
  const initialData = initialEl ? JSON.parse(initialEl.textContent || "{}") : {};
  const chartColors = ["#3b82f6", "#f97316", "#22c55e", "#ef4444", "#eab308", "#8b5cf6"];
  const charts = {};
  const orderCharts = {};
  const bidsCharts = {};
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
    const winLoss = data.winLoss || {};
    const productLabels = topProducts.labels && topProducts.labels.length ? topProducts.labels : emptySeries("No sales yet").labels;
    const productUnits = topProducts.units && topProducts.units.length ? topProducts.units : emptySeries("No sales yet").values;

    upsertChart("barChartPharmacy", {
      type: "bar",
      data: {
        labels: productLabels,
        datasets: [{ label: "Units sold", data: productUnits, backgroundColor: chartColors }],
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    });

    upsertChart("pieChart", {
      type: "doughnut",
      data: {
        labels: ["UPI", "Card", "Net Banking"],
        datasets: [{
          data: [52, 34, 14],
          backgroundColor: ["#1683ff", "#635bff", "#2bc35a"],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "76%",
        plugins: { legend: { display: false } },
      },
      plugins: [{
        id: "paymentTotalCenter",
        afterDraw(chart) {
          const { ctx, chartArea } = chart;
          if (!chartArea) return;
          const centerX = (chartArea.left + chartArea.right) / 2;
          const centerY = (chartArea.top + chartArea.bottom) / 2;
          ctx.save();
          ctx.textAlign = "center";
          ctx.fillStyle = "#182230";
          ctx.font = "600 11px Inter, Arial, sans-serif";
          ctx.fillText("₹4,52,500", centerX, centerY - 1);
          ctx.fillStyle = "#98a1b1";
          ctx.font = "9px Inter, Arial, sans-serif";
          ctx.fillText("Total", centerX, centerY + 13);
          ctx.restore();
        },
      }],
    });

    upsertChart("lineChart", {
      type: "line",
      data: {
        labels: ["01 Jul", "05 Jul", "11 Jul", "14 Jul", "18 Jul", "19 Jul", "22 Jul"],
        datasets: [{
          label: "Revenue",
          data: [310000, 330000, 360000, 380000, 400000, 420000, 450000],
          borderColor: "#1683ff",
          backgroundColor: "rgba(22, 131, 255, .09)",
          pointBackgroundColor: "#1683ff",
          pointBorderColor: "#1683ff",
          pointRadius: 2.5,
          pointHoverRadius: 4,
          borderWidth: 2,
          tension: 0.25,
          fill: true,
        }, {
          label: "Previous Period (Last 7 days)",
          data: [250000, 260000, 300000, 300000, 320000, 330000, 340000],
          borderColor: "#635bff",
          backgroundColor: "#635bff",
          pointRadius: 1.5,
          pointHoverRadius: 3,
          borderWidth: 1.5,
          borderDash: [4, 4],
          tension: 0.15,
          fill: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ₹${(context.parsed.y / 100000).toFixed(1)}L` } },
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8391a5", font: { size: 8 } } },
          y: {
            min: 0,
            max: 500000,
            grid: { color: "#e9eef4" },
            border: { display: false },
            ticks: { stepSize: 100000, color: "#8391a5", font: { size: 8 }, callback: (value) => value ? `₹${value / 100000}L` : "₹0" },
          },
        },
      },
      plugins: [{
        id: "revenuePointLabels",
        afterDatasetsDraw(chart) {
          const dataset = chart.data.datasets[0];
          const meta = chart.getDatasetMeta(0);
          const { ctx } = chart;
          ctx.save();
          ctx.fillStyle = "#344054";
          ctx.font = "600 8px Inter, Arial, sans-serif";
          ctx.textAlign = "center";
          meta.data.forEach((point, index) => {
            ctx.fillText(`₹${(dataset.data[index] / 100000).toFixed(1)}L`, point.x, point.y - 8);
          });
          ctx.restore();
        },
      }],
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

  function orderCenterLabelPlugin(value, subtitle = "Total") {
    return {
      id: `center-label-${value}`,
      afterDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;
        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "#182230";
        ctx.font = "600 12px Inter, Arial, sans-serif";
        ctx.fillText(value, centerX, centerY - 1);
        ctx.fillStyle = "#98a1b1";
        ctx.font = "9px Inter, Arial, sans-serif";
        ctx.fillText(subtitle, centerX, centerY + 13);
        ctx.restore();
      },
    };
  }

  function renderOrderCharts() {
    if (!orderCharts.trend) {
      orderCharts.trend = new Chart(document.getElementById("orderTrendChart").getContext("2d"), {
        type: "line",
        data: {
          labels: ["Jul 1", "Jul 5", "Jul 8", "Jul 11", "Jul 15", "Jul 18", "Jul 22"],
          datasets: [
            { label: "Total Orders", data: [700, 850, 1020, 840, 1110, 980, 1248], borderColor: "#1683ff", backgroundColor: "transparent", pointBackgroundColor: "#1683ff", pointRadius: 2, borderWidth: 2, tension: 0.15 },
            { label: "Successful Orders", data: [520, 610, 770, 590, 850, 790, 1020], borderColor: "#10b981", backgroundColor: "transparent", pointBackgroundColor: "#10b981", pointRadius: 2, borderWidth: 2, tension: 0.15 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8391a5", font: { size: 8 } } },
            y: { min: 0, max: 1500, grid: { color: "#e9eef4" }, border: { display: false }, ticks: { stepSize: 500, color: "#8391a5", font: { size: 8 }, callback: (value) => value === 0 ? "0" : `${value / 1000}K` } },
          },
        },
      });
    }

    function renderBidsCharts() {
      if (!bidsCharts.trend) {
        bidsCharts.trend = new Chart(document.getElementById("bidTrendViewChart").getContext("2d"), {
          type: "bar",
          data: {
            labels: ["01 Jul", "04 Jul", "09 Jul", "14 Jul", "18 Jul", "22 Jul"],
            datasets: [{ data: [62, 78, 84, 98, 108, 121], backgroundColor: "#3b82f6", borderRadius: 4, maxBarThickness: 22 }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8391a5", font: { size: 10 } } },
              y: { beginAtZero: true, max: 150, grid: { color: "#e9eef4" }, border: { display: false }, ticks: { stepSize: 50, color: "#8391a5", font: { size: 10 } } },
            },
          },
        });
      }

      const doughnutOptions = { responsive: true, maintainAspectRatio: false, cutout: "70%", plugins: { legend: { display: false } } };
      if (!bidsCharts.status) {
        bidsCharts.status = new Chart(document.getElementById("bidStatusViewChart").getContext("2d"), {
          type: "doughnut",
          data: {
            labels: ["Accepted", "Rejected", "Expired", "Withdrawn"],
            datasets: [{ data: [66.7, 33.3, 11.1, 5.6], backgroundColor: ["#1683ff", "#ef4444", "#f59e0b", "#10b981"], borderWidth: 0 }],
          },
          options: doughnutOptions,
          plugins: [orderCenterLabelPlugin("72", "Total Bids")],
        });
      }
      if (!bidsCharts.offers) {
        bidsCharts.offers = new Chart(document.getElementById("bidOffersViewChart").getContext("2d"), {
          type: "bar",
          data: {
            labels: ["Prescription", "OTC", "Surgical", "Wellness", "Devices"],
            datasets: [
              { label: "Won", data: [72, 48, 39, 24, 51], backgroundColor: "#10b981", borderRadius: 2, barThickness: 7 },
              { label: "Lost", data: [42, 30, 35, 18, 12], backgroundColor: "#f43f5e", borderRadius: 2, barThickness: 7 },
            ],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8391a5", font: { size: 8 } } },
              y: { beginAtZero: true, max: 100, grid: { color: "#e9eef4" }, border: { display: false }, ticks: { stepSize: 50, color: "#8391a5", font: { size: 8 } } },
            },
          },
        });
      }

      const lineOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8391a5", font: { size: 9 } } },
          y: { min: 0, max: 50, grid: { color: "#e9eef4" }, border: { display: false }, ticks: { stepSize: 10, color: "#8391a5", font: { size: 9 }, callback: (value) => `${value}%` } },
        },
      };
      if (!bidsCharts.conversion) {
        bidsCharts.conversion = new Chart(document.getElementById("bidConversionViewChart").getContext("2d"), {
          type: "line",
          data: {
            labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
            datasets: [
              { label: "Current Period", data: [29, 32, 36, 38], borderColor: "#1683ff", pointRadius: 2, borderWidth: 2, tension: 0.15 },
              { label: "Previous Period", data: [24, 27, 30, 33], borderColor: "#10b981", pointRadius: 2, borderWidth: 1.5, tension: 0.15 },
            ],
          },
          options: lineOptions,
        });
      }
      if (!bidsCharts.turnaround) {
        bidsCharts.turnaround = new Chart(document.getElementById("bidTurnaroundViewChart").getContext("2d"), {
          type: "line",
          data: {
            labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
            datasets: [
              { label: "Current Period", data: [20, 24, 27, 30], borderColor: "#1683ff", pointRadius: 2, borderWidth: 2, tension: 0.15 },
              { label: "Previous Period", data: [13, 16, 18, 21], borderColor: "#94a3b8", pointRadius: 2, borderWidth: 1.5, borderDash: [3, 3], tension: 0.15 },
            ],
          },
          options: {
            ...lineOptions,
            scales: {
              ...lineOptions.scales,
              y: { min: 0, max: 50, grid: { color: "#e9eef4" }, border: { display: false }, ticks: { stepSize: 10, color: "#8391a5", font: { size: 9 } } },
            },
          },
        });
      }
    }

    const doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: { legend: { display: false } },
    };
    if (!orderCharts.category) {
      orderCharts.category = new Chart(document.getElementById("orderCategoryChart").getContext("2d"), {
        type: "doughnut",
        data: {
          labels: ["OTC Medicines", "Health Supplements", "Personal Care", "Wellness Products"],
          datasets: [{ data: [38.4, 32.1, 18.7, 10.8], backgroundColor: ["#1683ff", "#10b981", "#f59e0b", "#a855f7"], borderWidth: 0 }],
        },
        options: doughnutOptions,
        plugins: [orderCenterLabelPlugin("1,248")],
      });
    }
    if (!orderCharts.status) {
      orderCharts.status = new Chart(document.getElementById("orderStatusChart").getContext("2d"), {
        type: "doughnut",
        data: {
          labels: ["Delivered", "Processing", "Shipped", "Returned"],
          datasets: [{ data: [88.3, 6.2, 3.8, 1.7], backgroundColor: ["#2868ed", "#10b981", "#f59e0b", "#a855f7"], borderWidth: 0 }],
        },
        options: doughnutOptions,
        plugins: [orderCenterLabelPlugin("1,248")],
      });
    }
  }

  $(document).on("click", ".order-trend-period", function () {
    const period = $(this).data("period");
    const periodSeries = {
      daily: {
        labels: ["9 AM", "11 AM", "1 PM", "3 PM", "5 PM", "7 PM", "9 PM"],
        orders: [120, 185, 240, 190, 215, 170, 128],
        completed: [98, 152, 202, 158, 177, 139, 105],
      },
      weekly: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        orders: [720, 810, 950, 880, 1080, 1180, 1248],
        completed: [590, 670, 790, 730, 900, 980, 1020],
      },
      monthly: {
        labels: ["Jul 1", "Jul 5", "Jul 8", "Jul 11", "Jul 15", "Jul 18", "Jul 22"],
        orders: [700, 850, 1020, 840, 1110, 980, 1248],
        completed: [520, 610, 770, 590, 850, 790, 1020],
      },
    };
    $(".order-trend-period").removeClass("bg-[#2563eb] text-white").addClass("text-[#64748b]");
    $(this).addClass("bg-[#2563eb] text-white").removeClass("text-[#64748b]");
    if (!orderCharts.trend) renderOrderCharts();
    const series = periodSeries[period] || periodSeries.monthly;
    orderCharts.trend.data.labels = series.labels;
    orderCharts.trend.data.datasets[0].data = series.orders;
    orderCharts.trend.data.datasets[1].data = series.completed;
    orderCharts.trend.update();
  });

  function renderHeatmap(rows) {
    if (!document.getElementById("heatmap") || !window.am4core || !window.am4maps || !window.am4geodata_india2019High) return;

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
    heatmapSeries.dataFields.id = "id";
    heatmapSeries.dataFields.value = "value";
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
    $("#reportRangeShort").text(formatRangeForDisplay(response.range_label));
    setText("#totalRevenueStat", stats.total_revenue && stats.total_revenue !== "0" ? stats.total_revenue : "13,800");
    setText("#bidWonStat", stats.won_bids && stats.won_bids !== "0" ? stats.won_bids : "48");
    setText("#totalOrdersStat", stats.total_orders && stats.total_orders !== "0" ? stats.total_orders : "320");
    setText("#avgBidStat", stats.avg_bid && stats.avg_bid !== "0" ? stats.avg_bid : "500");
    setText("#bidAccepted", stats.won_bids && stats.won_bids !== "0" ? stats.won_bids : "48");
    setText("#bidRejected", stats.lost_bids && stats.lost_bids !== "0" ? stats.lost_bids : "24");

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
  $(document).on("change", "#comparePreviousPeriod", function () {
    if (!charts.lineChart) return;
    charts.lineChart.setDatasetVisibility(1, this.checked);
    charts.lineChart.update();
  });
  $(document).on("click", ".report-select-toggle", function (e) {
    e.preventDefault();
    const $menu = $(this).siblings(".report-select-menu");
    const shouldOpen = $menu.hasClass("hidden");
    $(".report-select-menu").addClass("hidden");
    $("#reportDatePopover").addClass("hidden");
    if (shouldOpen) $menu.removeClass("hidden");
  });
  $(document).on("click", ".report-select-option", function (e) {
    e.preventDefault();
    const target = $(this).data("target");
    const selectedValue = $(this).text().trim();
    $("#" + target).text(selectedValue);
    $(".report-select-menu").addClass("hidden");

    if (target === "selectedReportView") {
      const isOrderView = selectedValue === "Order View";
      const isBidsView = selectedValue === "Bids View";
      $("#orderViewContent").toggleClass("hidden", !isOrderView);
      $("#bidsViewContent").toggleClass("hidden", !isBidsView);
      $("#revenueViewContent").toggleClass("hidden", isOrderView || isBidsView);
      if (isOrderView) {
        renderOrderCharts();
        Object.values(orderCharts).forEach((chart) => chart.resize());
      } else if (isBidsView) {
        renderBidsCharts();
        Object.values(bidsCharts).forEach((chart) => chart.resize());
      }
    }
  });
  $(document).on("click", function (e) {
    if (!$(e.target).closest(".report-select-toggle, .report-select-menu").length) {
      $(".report-select-menu").addClass("hidden");
    }
  });
  // The shared dropdown script uses inline show/hide styles. Those styles
  // conflict with this page's Tailwind `hidden` classes, so pharmacy reports
  // owns these controls completely.
  $(".filterToggle, .calendar-icon").off("click");
  // This page has one report-wide date filter. Remove duplicate chart-level
  // calendars and their unused interval selectors so every panel follows it.
  $(".grid .calendar-icon").each(function () {
    const $control = $(this).closest(".flex.items-center.gap-2");
    $control.find(".calendar-icon").remove();
    $control.find(".report-range-text").remove();
  });
  $(".grid .datepicker-container").remove();
  $("#heatmap, #lineChart").each(function () {
    $(this).closest(".lab-report-shadow").find(".dropdown-btn").closest(".dropdown").remove();
  });

  const initialParams = new URLSearchParams(window.location.search);
  const activePeriod = initialParams.get("period") || "month";
  $("#reportDatePreset").text(
    activePeriod === "today" ? "Today"
      : activePeriod === "week" ? "Last 7 days"
        : activePeriod === "custom" ? "Custom range"
          : "Last 30 days"
  );
  let selectedStartDate = initialParams.get("period") === "custom"
    ? (initialParams.get("start") || "")
    : "";
  let selectedEndDate = initialParams.get("period") === "custom"
    ? (initialParams.get("end") || "")
    : "";
  updateSelectedPeriod(initialParams.get("period") || "month");

  const reportDatePopover = $("#reportDatePopover");
  const reportStartDate = $("#reportStartDate");
  const reportEndDate = $("#reportEndDate");
  const todayIso = new Date().toISOString().slice(0, 10);

  reportStartDate.attr("max", todayIso);
  reportEndDate.attr("max", todayIso);
  reportStartDate.val(initialParams.get("start") || "");
  reportEndDate.val(initialParams.get("end") || "");

  function formatDateForDisplay(dateIso) {
    if (!dateIso) return "";
    const parts = dateIso.split("-");
    if (parts.length !== 3) return dateIso;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  function formatRangeForDisplay(rangeLabel) {
    const dates = (rangeLabel || "").match(/^([A-Za-z]+)\s+(\d+),\s+(\d{4})\s+-\s+([A-Za-z]+)\s+(\d+),\s+(\d{4})$/);
    if (!dates) return (rangeLabel || "1 Jul - 22 Jul 2026").replace(/, \d{4}/, "");
    return `${Number(dates[2])} ${dates[1]} - ${Number(dates[5])} ${dates[4]} ${dates[6]}`;
  }

  $(document).on("click", "#reportDateToggle", function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(".filterDropdown, .datepicker-container").addClass("hidden").css("display", "");
    reportDatePopover.toggleClass("hidden");
  });

  $(document).on("click", ".reportDateOption", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const period = $(this).data("period");

    if (period === "custom") {
      $("#reportDatePreset").text("Custom range");
      if (!reportStartDate.val()) {
        reportStartDate.val(initialParams.get("start") || todayIso);
      }
      if (!reportEndDate.val()) {
        reportEndDate.val(initialParams.get("end") || todayIso);
      }
      reportStartDate.trigger("focus");
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("period", period);
    url.searchParams.delete("start");
    url.searchParams.delete("end");
    window.history.replaceState({}, "", url.toString());

    selectedStartDate = "";
    selectedEndDate = "";
    updateSelectedPeriod(period);
    $("#reportDatePreset").text(period === "today" ? "Today" : period === "week" ? "Last 7 days" : "Last 30 days");
    reportDatePopover.addClass("hidden");
    loadReport({ period, start: "", end: "" });
  });

  $(document).on("click", "#reportDateCancel", function (e) {
    e.preventDefault();
    e.stopPropagation();
    reportDatePopover.addClass("hidden");
  });

  $(document).on("click", "#reportDateApply", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const start = reportStartDate.val();
    const end = reportEndDate.val();

    if (!start || !end) {
      if (window.toastr) toastr.warning("Please select both start and end dates.");
      return;
    }
    if (start > end) {
      if (window.toastr) toastr.warning("Start date cannot be after end date.");
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("period", "custom");
    url.searchParams.set("start", start);
    url.searchParams.set("end", end);
    window.history.replaceState({}, "", url.toString());

    selectedStartDate = start;
    selectedEndDate = end;
    updateSelectedPeriod("custom");
    $("#reportDatePreset").text("Custom range");
    const endDate = new Date(`${end}T00:00:00`);
    $("#reportRangeShort").text(`${formatDateForDisplay(start)} - ${formatDateForDisplay(end)} ${endDate.getFullYear()}`);
    reportDatePopover.addClass("hidden");
    loadReport({ period: "custom", start, end });
  });

  $(document).on("click", function (e) {
    if (!$(e.target).closest("#reportDateToggle, #reportDatePopover").length) {
      reportDatePopover.addClass("hidden");
    }
  });

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
    if (this.id === "reportDateToggle") return;
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
  // jQuery UI replaces the clicked arrow while changing months. Capture the
  // event before that replacement so the outside-click handler still knows it
  // originated inside the calendar.
  const datepickerNavigationClicks = new WeakSet();
  document.addEventListener("click", function (event) {
    if (event.target.closest(".ui-datepicker-prev, .ui-datepicker-next")) {
      datepickerNavigationClicks.add(event);
    }
  }, true);

$(document).on(
    "click",
    ".filterDropdown, .datepicker-container, .ui-datepicker",
    function (e) {
        e.stopPropagation();
    }
);


// Close calendars when clicking outside
$(document).on("click", function (e) {
    if (datepickerNavigationClicks.has(e.originalEvent)) return;

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

  const $allMedicinesModal = $("#allMedicinesModal");
  const $medicineDetailsModal = $("#medicineDetailsModal");
  let medicineSalesChart = null;
  let medicineDetailsOpenedFromAll = false;

  function showReportModal($modal) {
    $modal.removeClass("hidden").css("display", "flex");
  }

  function hideReportModal($modal) {
    $modal.addClass("hidden").css("display", "");
  }

  $("#topMedicinesTable tbody td:last-child span")
    .addClass("medicine-view-action")
    .attr({ role: "button", tabindex: "0", "aria-label": "View medicine details" });

  $("#openAllMedicines").on("click", function () {
    const $rows = $("#allMedicinesTableBody").empty();
    $("#topMedicinesTable tbody tr").each(function (index) {
      const $row = $(this).clone();
      $row.prepend($("<td>").addClass("px-2 py-2 text-center text-[#697386]").text(index + 1));
      $row.children("td").removeClass("px-12 px-3 py-3").addClass("px-2 py-2");
      $row.addClass("border-b border-[#edf0f4]");
      $rows.append($row);
    });
    showReportModal($allMedicinesModal);
  });

  $(".closeAllMedicines").on("click", function () {
    hideReportModal($allMedicinesModal);
    hideReportModal($medicineDetailsModal);
  });

  $allMedicinesModal.on("click", function (event) {
    if (event.target === this) hideReportModal($allMedicinesModal);
  });

  function closeMedicineDetails() {
    hideReportModal($medicineDetailsModal);
    if (!medicineDetailsOpenedFromAll) hideReportModal($allMedicinesModal);
  }

  $(".closeMedicineDetails").on("click", closeMedicineDetails);
  $medicineDetailsModal.on("click", function (event) {
    if (event.target === this) closeMedicineDetails();
  });

  function openMedicineDetails($row, fromAllMedicines) {
    const cells = $row.children("td");
    const offset = fromAllMedicines ? 1 : 0;
    const name = cells.eq(offset).text().trim();
    const quantity = cells.eq(offset + 1).text().trim();
    const completedOrders = cells.eq(offset + 2).text().trim();
    const sales = cells.eq(offset + 3).text().trim();
    const stock = cells.eq(offset + 4).text().trim();

    medicineDetailsOpenedFromAll = fromAllMedicines;
    $("#medicineDetailsName, #medicineSummaryName").text(name);
    $("#medicineDetailsCategory").text("Medicine summary · " + name);
    $("#medicineQtySold").text(quantity);
    $("#medicineCompletedOrders").text(completedOrders);
    $("#medicineNetSales").text(sales);
    $("#medicineAvailableStock").text(stock);

    const unitsSold = Number.parseInt(quantity, 10) || 0;
    const trendValues = [
      Math.round(unitsSold * 0.55),
      Math.round(unitsSold * 0.72),
      Math.round(unitsSold * 1.0),
      Math.round(unitsSold * 0.70),
      Math.round(unitsSold * 0.95),
      Math.round(unitsSold * 0.83),
      unitsSold,
    ];
    showReportModal($medicineDetailsModal);

    if (medicineSalesChart) {
      medicineSalesChart.data.datasets[0].data = trendValues;
      medicineSalesChart.options.scales.y.max = Math.max(60, Math.ceil(unitsSold / 10) * 10);
      medicineSalesChart.update();
      return;
    }

    medicineSalesChart = new Chart(document.getElementById("medicineSalesChart").getContext("2d"), {
      type: "line",
      data: {
        labels: ["Jul 16", "Jul 17", "Jul 18", "Jul 19", "Jul 20", "Jul 21", "Jul 22"],
        datasets: [{
          label: "Qty Sold",
          data: trendValues,
          borderColor: "#1683ff",
          backgroundColor: "rgba(22, 131, 255, .12)",
          pointBackgroundColor: "#1683ff",
          pointRadius: 2,
          borderWidth: 2,
          tension: 0.2,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: "#8391a5", font: { size: 9 } } },
          y: { beginAtZero: true, max: Math.max(60, Math.ceil(unitsSold / 10) * 10), grid: { color: "#e9eef4" }, border: { display: false }, ticks: { color: "#8391a5", font: { size: 9 } } },
        },
      },
    });
  }

  $(document).on("click", ".medicine-view-action", function () {
    openMedicineDetails($(this).closest("tr"), $(this).closest("#allMedicinesTableBody").length > 0);
  });
  $(document).on("keydown", ".medicine-view-action", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      $(this).trigger("click");
    }
  });

  $("#allMedicinesExport").on("click", function () {
    hideReportModal($allMedicinesModal);
    $("#openReportExport").trigger("click");
  });

  $(document).on("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (!$medicineDetailsModal.hasClass("hidden")) closeMedicineDetails();
    else if (!$allMedicinesModal.hasClass("hidden")) hideReportModal($allMedicinesModal);
  });

  const $reportExportModal = $("#reportExportModal");

  function closeReportExportModal() {
    $reportExportModal.addClass("hidden").css("display", "");
    $("#reportExportScopeMenu").addClass("hidden");
  }

  $("#openReportExport").on("click", function () {
    $("#exportDateRange").val($("#reportRangeShort").text().trim());
    $reportExportModal.removeClass("hidden").css("display", "flex");
    $("#reportExportScopeLabel").text("Current Tab");
  });

  $("#closeReportExport, #cancelReportExport").on("click", closeReportExportModal);
  $reportExportModal.on("click", function (event) {
    if (event.target === this) closeReportExportModal();
  });
  $(document).on("keydown", function (event) {
    if (event.key === "Escape" && !$reportExportModal.hasClass("hidden")) {
      closeReportExportModal();
    }
  });

  $("#reportExportScope").on("click", function () {
    $("#reportExportScopeMenu").toggleClass("hidden");
  });
  $(".reportExportScopeOption").on("click", function () {
    $("#reportExportScopeLabel").text($(this).text().trim());
    $("#reportExportScopeMenu").addClass("hidden");
  });

  $("#generateReportExport").on("click", async function () {
    const target = document.getElementById("pharmacy-report-root");
    const button = this;
    if (!target) {
      if (window.toastr) toastr.error("The report could not be found.");
      return;
    }
    if (!window.jspdf || !window.html2canvas) {
      if (window.toastr) toastr.error("Export libraries are unavailable. Please try again later.");
      console.error("Pharmacy report export failed: jsPDF or html2canvas is unavailable.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const includeCharts = $("#exportIncludeCharts").is(":checked");
    const includeComparison = $("#exportIncludeComparison").is(":checked");
    const chartsToHide = includeCharts ? [] : Array.from(target.querySelectorAll("#lineChart, #pieChart"));
    const previousComparisonVisible = charts.lineChart
      ? charts.lineChart.isDatasetVisible(1)
      : false;
    button.disabled = true;
    chartsToHide.forEach((canvas) => { canvas.style.visibility = "hidden"; });
    if (!includeComparison && charts.lineChart) {
      charts.lineChart.setDatasetVisibility(1, false);
      charts.lineChart.update("none");
    }

    try {
      const canvas = await html2canvas(target, {
        backgroundColor: "#f7f9fb",
        scale: 2,
        useCORS: true,
      });
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const scale = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const width = canvas.width * scale;
      const height = canvas.height * scale;
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        (pageWidth - width) / 2,
        (pageHeight - height) / 2,
        width,
        height
      );
      pdf.save("pharmacy-report.pdf");
      closeReportExportModal();
    } catch (error) {
      if (window.toastr) toastr.error("Unable to export this report.");
      console.error("Pharmacy report export failed", error);
    } finally {
      chartsToHide.forEach((canvas) => { canvas.style.visibility = ""; });
      if (charts.lineChart) {
        charts.lineChart.setDatasetVisibility(1, previousComparisonVisible);
        charts.lineChart.update("none");
      }
      button.disabled = false;
    }
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
