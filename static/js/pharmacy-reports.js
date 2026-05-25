$(document).ready(function () {
  const reportEl = document.getElementById("pharmacy-report-data");
  const reportData = reportEl ? JSON.parse(reportEl.textContent || "{}") : {};
  const topProducts = reportData.topProducts || {};
  const bidTrend = reportData.bidTrend || {};
  const winLoss = reportData.winLoss || {};
  const heatmapData = reportData.heatmap || [];
  const ratingData = reportData.ratings || [];
  const chartColors = ["#3b82f6", "#f97316", "#22c55e", "#ef4444", "#eab308"];

  const barCanvas = document.getElementById("barChartPharmacy");
  if (barCanvas) {
    new Chart(barCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: topProducts.labels || ["No sales yet"],
        datasets: [
          {
            label: "Units sold",
            data: topProducts.units || [0],
            backgroundColor: chartColors,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
      },
    });
  }

  const pieCanvas = document.getElementById("pieChart");
  if (pieCanvas) {
    new Chart(pieCanvas.getContext("2d"), {
      type: "pie",
      data: {
        labels: topProducts.revenueLabels || ["No revenue yet"],
        datasets: [
          {
            data: topProducts.revenue || [0],
            backgroundColor: chartColors,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "top" } },
      },
    });
  }

  const lineCanvas = document.getElementById("lineChart");
  if (lineCanvas) {
    new Chart(lineCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels: bidTrend.labels || [],
        datasets: [
          {
            label: "Avg bid",
            data: bidTrend.values || [],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.12)",
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "top" } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  const winLossCanvas = document.getElementById("bidWinLossChart");
  if (winLossCanvas) {
    new Chart(winLossCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: winLoss.labels || [],
        datasets: [
          {
            label: "Bids won",
            data: winLoss.won || [],
            backgroundColor: "#10b981",
          },
          {
            label: "Bids lost",
            data: winLoss.lost || [],
            backgroundColor: "#ef4444",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "top" } },
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
      },
    });
  }

  $("#ratings").empty();
  ratingData.forEach((r) => {
    $("#ratings").append(`
      <div class="flex items-center justify-between">
        <span class="text-dodger-blue">${r.stars} star</span>
        <div class="w-3/4 bg-[#D3D3D3] rounded-full h-2">
          <div class="bg-[#FFCC48] h-2 rounded-full" style="width:${r.percent}%;"></div>
        </div>
        <span>${r.percent}%</span>
      </div>
    `);
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

  if (document.getElementById("heatmap") && window.am4core && window.am4maps) {
    am4core.useTheme(am4themes_animated);

    const chart = am4core.create("heatmap", am4maps.MapChart);
    chart.geodata = am4geodata_india2019High;

    const polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
    polygonSeries.heatRules.push({
      property: "fill",
      target: polygonSeries.mapPolygons.template,
      min: chart.colors.getIndex(1).brighten(1),
      max: chart.colors.getIndex(1).brighten(-0.3),
    });

    polygonSeries.useGeodata = true;
    polygonSeries.data = heatmapData;

    const polygonTemplate = polygonSeries.mapPolygons.template;
    polygonTemplate.tooltipText = "{name}: {value}";
    polygonTemplate.nonScalingStroke = true;
    polygonTemplate.strokeWidth = 0.5;

    const hs = polygonTemplate.states.create("hover");
    hs.properties.fill = am4core.color("#3c5bdc");
  }

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
