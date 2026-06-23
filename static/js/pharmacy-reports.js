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

  // $(".filterDropdown > div").on("click", function () {
  //   const label = $(this).text().trim().toLowerCase();
  //   const period = label.includes("today") ? "today" : label.includes("week") ? "week" : label.includes("month") ? "month" : "custom";
  //   const url = new URL(window.location.href);
  //   url.searchParams.set("period", period);
  //   window.history.replaceState({}, "", url.toString());
  //   loadReport({ period });
  // });

  $(".filterDropdown > div").on("click", function () {
    const period = $(this).data("period") || "month";
    const url = new URL(window.location.href);
    url.searchParams.set("period", period);
    window.history.replaceState({}, "", url.toString());
    loadReport({ period });
});

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
