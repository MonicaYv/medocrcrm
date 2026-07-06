let barChart;
let pieChart;
let lineChart;
let patientJourneyChart;

$(document).ready(function () {
  // --------- 1. BAR CHART INITIALIZATION ----------
  const barCtx = document.getElementById("barChart");
  if (barCtx) {
    barChart = new Chart(barCtx.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "July", "Aug", "Sept", "Oct", "Nov", "Dec"],
        datasets: [{
          label: "Requests",
          data: [120, 160, 70, 150, 100, 50, 80, 100, 59, 90, 150, 200],
          backgroundColor: ["#3b82f6", "#EF4444", "#FFB95A", "#84CC16", "#22C55E", "#1BC0C4", "#083684", "#8B5CF6", "#A855F7", "#6366F1", "#EC4899", "#3B82F6"]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  }

  // --------- 2. PIE CHART INITIALIZATION ----------
  const pieCtx = document.getElementById("pieChart");
  if (pieCtx) {
    pieChart = new Chart(pieCtx.getContext("2d"), {
      type: "pie",
      data: {
        labels: ["Direct (15%)", "NGO Referrals (35%)", "Ads (50%)"],
        datasets: [{
          data: [15, 35, 50],
          backgroundColor: ["#EF4444", "#155DFC", "#FFB95A"]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "top" } }
      }
    });
  }

  // --------- LINE CHART (LOAD ANALYTICS) ----------
  const lineCtx = document.getElementById("lineChart");
  if (lineCtx) {
    lineChart = new Chart(lineCtx.getContext("2d"), {
      type: "line",
      data: {
        labels: ["10:00", "10:30", "11:00", "11:30"],
        datasets: [{
          label: "CBC",
          data: [320, 340, 310, 360],
          borderColor: "#3b82f6",
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // CRITICAL: Allows container sizing control
        plugins: { legend: { position: "top" } }
      }
    });
  }

  // --------- HORIZONTAL BAR CHART (Patient Journey) ----------
  const horizontalCtx = document.getElementById("horizontalBarChart");
  if (horizontalCtx) {
    patientJourneyChart = new Chart(horizontalCtx.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Loading"],
        datasets: [{
          axis: "y",
          data: [0],
          fill: false,
          backgroundColor: ["#3B82F6", "#EF4444", "#FABA23", "#84CC16", "#EC4899"]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // CRITICAL: Disables infinite stretching loops
        plugins: { legend: false },
        indexAxis: "y"
      }
    });
  }
  // --------- 5. RATINGS FEEDBACK RENDERING ----------
  const ratingData = [
    { stars: 5, percent: 74 },
    { stars: 4, percent: 54 },
    { stars: 3, percent: 38 },
    { stars: 2, percent: 18 },
    { stars: 1, percent: 3 }
  ];
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

  // --------- 6. INTERACTIVE DROPDOWN HANDLERS ----------
  $(".filterToggle").on("click", function (e) {
    e.stopPropagation();
    $(".filterDropdown").toggleClass("hidden");
  });

  $(".calendar-icon").on("click", function (e) {
    e.stopPropagation();
    $(".datepicker-container").addClass("hidden");
    $(this).closest(".dropdown").find(".datepicker-container").toggleClass("hidden");
  });

  $(document).on("click", function () {
    $(".filterDropdown").addClass("hidden");
    $(".datepicker-container").addClass("hidden");
    $(".dropdown-menu").addClass("hidden");
  });

  $(document).on("click", ".dropdown-btn", function (e) {
    e.stopPropagation();
    const $dropdown = $(this).closest(".dropdown");
    $(".dropdown-menu").not($dropdown.find(".dropdown-menu")).addClass("hidden");
    $dropdown.find(".dropdown-menu").toggleClass("hidden");
  });

  $(document).on("click", ".dropdown-menu li", function (e) {
    e.stopPropagation();
    const $dropdown = $(this).closest(".dropdown");
    $dropdown.find(".dropdown-value").text($(this).text());
    $dropdown.find(".dropdown-menu").addClass("hidden");
  });

  // --------- 7. DOWNLOAD CONTEXT TO PDF ----------
  $(".download-btn").on("click", function (e) {
    e.stopPropagation();
    const targetId = $(this).data("target");
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    html2canvas(targetElement, {
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        scale: 2,
        logging: false
    }).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "mm", "a4");
        pdf.addImage(imgData, "PNG", 10, 10, 190, (canvas.height * 190) / canvas.width);
        pdf.save(`${targetId}.pdf`);
    });
  });

  // --------- 8. amCharts INDIA HEATMAP INITIALIZATION ----------
  if (typeof am4core !== "undefined") {
    am4core.useTheme(am4themes_animated);
    window.heatmapChart = am4core.create("heatmap", am4maps.MapChart);
    heatmapChart.geodata = am4geodata_india2019High;
    heatmapChart.homeZoomLevel = 1;
    heatmapChart.homeGeoPoint = { longitude: 78.9629, latitude: 22.5937 };

    window.polygonSeries = heatmapChart.series.push(new am4maps.MapPolygonSeries());
    polygonSeries.heatRules.push({
      property: "fill",
      target: polygonSeries.mapPolygons.template,
      min: heatmapChart.colors.getIndex(1).brighten(1),
      max: heatmapChart.colors.getIndex(1).brighten(-0.3)
    });
    polygonSeries.useGeodata = true;
    polygonSeries.geodata = am4geodata_india2019High;
    polygonSeries.calculateVisualCenter = true;
    polygonSeries.exclude = ["AQ"];
    polygonSeries.dataFields.value = "value";
    polygonSeries.dataFields.id = "id";
    polygonSeries.mapPolygons.template.propertyFields.fill = "fill";
    polygonSeries.mapPolygons.template.applyOnClones = true;
    polygonSeries.data = [];

    var polygonTemplate = polygonSeries.mapPolygons.template;
    polygonTemplate.fill = am4core.color("#DCEBFF");
    polygonTemplate.tooltipText = "{name}: {value}";
    polygonTemplate.nonScalingStroke = true;
    polygonTemplate.strokeWidth = 0.5;

    var hs = polygonTemplate.states.create("hover");
    hs.properties.fill = am4core.color("#3c5bdc");

    // FIXED: Only logs ready state. Does not make a premature AJAX call that clears initial data.
    heatmapChart.events.on("ready", function() {
        console.log("SUCCESS: Map engine layout bound completely.");
    });
  }

  // --------- 9. ASYNCHRONOUS TAB FILTER LISTENERS ----------
  $("#visitTypeFilter").on("change", function () {
    let activeType = $(".report-filter.active").data("type") || "month";
    loadDashboardData(activeType);
  });

  $(".report-filter").on("click", function () {
    $(".report-filter").removeClass("active");
    $(this).addClass("active");

    let type = $(this).data("type");
    loadDashboardData(type);

    $(".report-filter span").removeClass("text-dodger-blue").addClass("text-light-gray");
    $(this).find("span").removeClass("text-light-gray").addClass("text-dodger-blue");

    if (type === "custom") {
        $(".datepicker-container").removeClass("hidden");
    }
  });

  // --------- 10. SAFE DASHBOARD MODULE SEARCH ENGINE ----------
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", function () {
      let value = this.value.toLowerCase();
      const sections = {
        "departmentRevenueSection": ["department", "revenue", "opd"],
        "packageSection": ["package", "booking", "lead"],
        "conversionSection": ["conversion", "patient", "deal"],
        "loadAnalyticsSection": ["load", "analytics", "cbc"],
        "heatmapSection": ["heatmap", "map", "state"],
        "patientJourneySection": ["journey", "feedback", "visited"]
      };

      Object.keys(sections).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.display = (value === "" || sections[id].some(keyword => value.includes(keyword))) ? "" : "none";
        }
      });
    });
  }

  // FIXED: Removed automated loadDashboardData("month") from here to protect Django initial values!
});

// =========================================================================
// CENTRAL HOOK DEFINITION: PULL DATA VIA AJAX FOR MANUAL USER FILTER CLICKS
// =========================================================================
function loadDashboardData(filterType) {
    $.ajax({
        url: "hospital-report-data/", 
        type: "GET",
        data: {
            filter: filterType,
            visit_type: $("#visitTypeFilter").val()
        },
        success: function(response) {
            console.log("LIVE PIPELINE RESPONSE RE-HYDRATED:", response);

            // Sync Card Value Text
            $("#totalRevenue").text(response.stats.revenue);
            $("#highestRevenue").text(response.stats.highest_revenue);
            $("#quarterGrowth").text(response.stats.growth);
            $("#avgRevenue").text(response.stats.avg_revenue);

            // Refresh Visual Chart Objects
            if (response.most_requested_test && barChart) {
                barChart.data.labels = response.most_requested_test.labels;
                barChart.data.datasets[0].data = response.most_requested_test.data;
                barChart.update();
            }

            if (response.revenue_by_test && pieChart) {
                pieChart.data.labels = response.revenue_by_test.labels;
                pieChart.data.datasets[0].data = response.revenue_by_test.data;
                pieChart.update();
            }

            if (response.bid_trend && lineChart) {
                lineChart.data.labels = response.bid_trend.labels;
                lineChart.data.datasets[0].data = response.bid_trend.cbc || response.bid_trend.data;
                lineChart.update();
            }

            if (response.patient_journey && patientJourneyChart) {
                patientJourneyChart.data.labels = response.patient_journey.labels;
                patientJourneyChart.data.datasets[0].data = response.patient_journey.data;
                patientJourneyChart.update();
            }

            // Sync Conversion Table Rows
            let conversionRows = "";
            const colors = ["bg-azure-radiance", "bg-light-green", "bg-sunrise-yellow", "bg-violet", "bg-red"];
            if (response.patient_journey && response.patient_journey.labels) {
                response.patient_journey.labels.forEach((label, index) => {
                    conversionRows += `
                        <div class="flex items-center justify-between px-4 border-b border-blue-haze py-2">
                            <div class="flex items-center gap-1">
                                <div class="w-1 h-1 rounded-full ${colors[index] || 'bg-gray-400'}"></div>
                                <p class="font-normal text-xs">${label}</p>
                            </div>
                            <div class="flex items-center gap-[130px]">
                                <p class="font-normal text-xs">${response.patient_journey.data[index]}</p>
                                <p class="font-normal text-xs">${response.patient_journey.conversion[index]}</p>
                            </div>
                        </div>`;
                });
                $("#conversionTableBody").html(conversionRows);
            }

            // Sync Package Demand Booking Rows
            let packageRows = "";
            if (response.package_table) {
                response.package_table.forEach((item, index) => {
                    let colorClass = index === 1 ? "bg-light-green" : (index === 2 ? "bg-sunrise-yellow" : "bg-azure-radiance");
                    packageRows += `
                        <div class="flex items-center justify-between px-4 border-b border-blue-haze py-2">
                            <div class="flex items-center gap-1">
                                <div class="w-1 h-1 rounded-full ${colorClass}"></div>
                                <p class="font-normal text-xs">${item.package}</p>
                            </div>
                            <div class="flex items-center gap-[130px]">
                                <p class="font-normal text-xs">${item.bookings}</p>
                                <p class="font-normal text-xs">${item.conversion}</p>
                            </div>
                        </div>`;
                });
                $("#packageTableBody").html(packageRows);
            }

            // Sync Regional Map Heat Indicators
            if (response.heatmap && window.polygonSeries) {
                const stateMap = {
                    "Maharashtra": "IN-MH", "Delhi": "IN-DL", "Karnataka": "IN-KA",
                    "Tamil Nadu": "IN-TN", "Gujarat": "IN-GJ", "Rajasthan": "IN-RJ",
                    "Uttar Pradesh": "IN-UP", "Madhya Pradesh": "IN-MP", "West Bengal": "IN-WB"
                };

                let heatmapData = [];
                response.heatmap.labels.forEach((state, index) => {
                    const mapId = stateMap[state.trim()];
                    if (mapId) {
                        heatmapData.push({ 
                            id: mapId, 
                            value: parseInt(response.heatmap.data[index]) || 0 
                        });
                    }
                });

                window.polygonSeries.data = heatmapData.length ? heatmapData : [{ id: "IN-MH", value: 0 }];
                
                if (window.heatmapChart) {
                    window.polygonSeries.invalidateRawData();
                    window.heatmapChart.validateData();
                }
            }
        },
        error: function(error) {
            console.error("AJAX Error: UI synchronization failed:", error);
        }
    });
}