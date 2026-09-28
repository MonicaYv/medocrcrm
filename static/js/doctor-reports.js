//doctor reports.js
let heatmapChart;
let polygonSeries;

$(document).ready(function () {
  // --------- 1. INTERACTIVE FILTER DROPDOWN TOGGLES ----------
  $("#filterToggle").on("click", function (e) {
    e.stopPropagation();
    $("#filterDropdown").toggleClass("hidden");
  });

  // Handle dropdown internal submenus navigation
  $(document).on("click", "[data-open]", function (e) {
    e.stopPropagation();
    const targetMenu = $(this).data("open");
    $("#mainMenu").addClass("hidden");
    if (targetMenu === "date") $("#dateMenu").removeClass("hidden");
    if (targetMenu === "visit") $("#visitMenu").removeClass("hidden");
  });

  $(document).on("click", "[data-back]", function (e) {
    e.stopPropagation();
    $("#dateMenu, #visitMenu").addClass("hidden");
    $("#mainMenu").removeClass("hidden");
  });

  // Global closure scripts for clicking outside dropdowns
  $(document).on("click", function () {
    $("#filterDropdown").addClass("hidden");
    $(".datepicker-container").addClass("hidden");
    $(".dropdown-menu").addClass("hidden");
    $(".calendarPopup, .heatmapCalendarPopup, .consolidationCalendarPopup").addClass("hidden");
  });

  // Individual card calendar popup triggers
  $(".calendarToggle, .heatmapCalendarToggle, .consolidationCalendarToggle").on("click", function (e) {
    e.stopPropagation();
    $(this).next("div").toggleClass("hidden");
  });

  // Standard select input fields handler adjustments
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

  // --------- 2. amCharts VECTOR HEATMAP INITIALIZATION ----------
  if (typeof am4core !== "undefined") {
    am4core.useTheme(am4themes_animated);
    heatmapChart = am4core.create("heatmap", am4maps.MapChart);
    heatmapChart.geodata = am4geodata_india2019High;
    heatmapChart.homeZoomLevel = 1;
    heatmapChart.homeGeoPoint = { longitude: 78.9629, latitude: 22.5937 };

    polygonSeries = heatmapChart.series.push(new am4maps.MapPolygonSeries());
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

    // Once map structure initializes, pull default month dataset layout fields
    heatmapChart.events.on("ready", function() {
        console.log("Doctor Map Engine operational.");
        loadDoctorDashboardData("month");
    });
  }

  // --------- 3. ASYNCHRONOUS SUBMENU TABS ACTION EVENTS ----------
  $(document).on("click", "#filterDropdown .option", function (e) {
    e.stopPropagation();
    const kind = String($(this).data("type") || "date").toLowerCase();
    const value = String($(this).data("value") || "").toLowerCase();
    $("#filterDropdown").addClass("hidden");
    if (kind === "visit") {
      // Visit submenu: Home / Clinic - keep the active date filter intact.
      window.doctorReportVisitType = value;
      $("#visitMenu .option").removeClass("active");
      $(this).addClass("active");
      loadDoctorDashboardData(currentDoctorReportFilter());
    } else {
      $("#dateMenu .option").removeClass("active");
      $(this).addClass("active");
      loadDoctorDashboardData(value);
    }
  });

  // Sync secondary action listeners
  $(document).on("click", ".calendar-option, .heatmap-cal-option, .consolidation-cal-option", function (e) {
    e.stopPropagation();
    const value = $(this).data("value");
    $(this).parent().addClass("hidden");
    $(this).closest(".relative").find(".calendar-date-text").text($(this).text().trim().replace("check", ""));
    loadDoctorDashboardData(value.toLowerCase());
  });

  // Default fallback load invocation if map engine is bypassed
  if (typeof am4core === "undefined") {
      loadDoctorDashboardData("month");
  }
});

function currentDoctorReportFilter() {
    const $active = $("#filterDropdown .option.active");
    if ($active.length) {
        return String($active.data("value") || "month").toLowerCase();
    }
    return window.doctorReportFilter || "month";
}

function currentDoctorVisitType() {
    const fromDropdown = $("#visitMenu .option.active").data("value");
    if (fromDropdown) {
        return String(fromDropdown).toLowerCase();
    }
    return window.doctorReportVisitType || "";
}

// =========================================================================
// CENTRAL WORKFLOW ENGINE: DISPATCH AJAX AND INJECT INTO DOM ELEMENTS
// =========================================================================
let doctorReportRequest = null;
let doctorReportSearchTimer = null;
function loadDoctorDashboardData(filterType) {
    if (filterType) {
        window.doctorReportFilter = String(filterType).toLowerCase();
    }
    const activeFilter = window.doctorReportFilter || filterType || "month";
    const searchValue = ($("#reportSearch").val() || "").trim();
    if (doctorReportRequest) {
        doctorReportRequest.abort();
    }
    doctorReportRequest = $.ajax({
        url: "/reports/doctor-report-data/", // Update to point to your routing path url configuration
        type: "GET",
        data: { filter: activeFilter, visit_type: currentDoctorVisitType(), search: searchValue },
        success: function (response) {
            console.log("DOCTOR LIVE PIPELINE DISPATCH MATRIX RECIEVED:", response);

            // 1. Hydrate Overview Stats Cards selectors text values
            $("#totalPatients").text(response.stats.total_patients);
            $("#birdsReceived").text(response.stats.birds_received);
            $("#quarterGrowth").text(response.stats.quarter_growth);
            $("#avgRevenue").text(response.stats.avg_revenue);

            // 2. Hydrate Custom HTML Vector Bars (Bid Win/Loss Chart Layout Matrix)
            let chartContainer = $("#bidChartContainer");
            if (chartContainer.length) {
                chartContainer.empty();
                response.bid_chart.forEach((row) => {
                    let wonVal = row.won || 0;
                    let lostVal = row.lost || 0;
                    
                    chartContainer.append(`
                        <div class="flex flex-col items-center flex-1 group">
                          <div class="w-full flex justify-center gap-1 sm:gap-2 h-32 items-end border-b border-gray-200 pb-1">
                            <div class="w-3 sm:w-4 bg-mint-emerald rounded-t" style="height: ${wonVal}%;" title="Won: ${wonVal}%"></div>
                            <div class="w-3 sm:w-4 bg-bright-red rounded-t" style="height: ${lostVal}%;" title="Lost: ${lostVal}%"></div>
                          </div>
                          <span class="text-[10px] text-gray-500 mt-2">${row.day}</span>
                        </div>
                    `);
                });
            }

            // 3. Hydrate Appointments & Fee Earnings Table body context elements
            let tableBody = $(".consultation-table-body");
            if (tableBody.length) {
                tableBody.empty();
                let cumAppts = 0;
                let cumEarnings = 0;
                const bulletColors = ["bg-azure-radiance", "bg-light-green", "bg-golden-gold", "bg-safety-orange", "bg-dark-yellow", "bg-dodger-blue", "bg-crimson-red"];

                response.consultation_data.forEach((row, i) => {
                    cumAppts += row.appointments || 0;
                    cumEarnings += row.earnings || 0;
                    let colorClass = bulletColors[i % bulletColors.length];

                    tableBody.append(`
                        <tr class="border-b border-gray-100">
                          <td class="px-4 py-2.5 flex items-center gap-2 text-sm text-jungle-navy font-medium">
                            <span class="w-2 h-2 rounded-full ${colorClass}"></span> ${row.day}
                          </td>
                          <td class="text-right px-4 py-2.5 text-deep-blue text-sm font-medium">${row.appointments}</td>
                          <td class="text-right px-4 py-2.5 text-deep-blue text-sm">₹${row.avg_fee.toLocaleString()}</td>
                          <td class="text-right px-4 py-2.5 text-deep-blue text-sm font-semibold">₹${row.earnings.toLocaleString()}</td>
                        </tr>
                    `);
                });

                // Add cumulative total summarizing calculation row inside footer block boundary
                tableBody.append(`
                    <tr class="bg-gray-50/50 font-semibold" data-total-row="1">
                      <td class="px-4 py-3 text-sm font-bold text-jungle-navy">Total</td>
                      <td class="text-right px-4 py-3 text-sm text-deep-blue font-bold">${cumAppts}</td>
                      <td class="text-right px-4 py-3 text-sm text-gray-400 font-normal">-</td>
                      <td class="text-right px-4 py-3 text-sm text-dodger-blue font-bold">₹${cumEarnings.toLocaleString()}</td>
                    </tr>
                `);
            }

            // 4. Hydrate Vector Maps Matrix Shading Values
            if (polygonSeries && response.heatmap_data) {
                polygonSeries.data = response.heatmap_data.length
                    ? response.heatmap_data
                    : [{ id: "IN-MH", value: 0 }];
                polygonSeries.invalidateRawData();
                if (heatmapChart) heatmapChart.validateData();
            }

            // 5. Keep any in-progress name search applied to freshly rendered rows.
            // Backend already filtered by `search`; this is a display-level pass only.
            applyDoctorReportSearch($("#reportSearch").val(), true);
        },
        error: function (err) {
            console.log("[ERROR]: Interface failed to parse dynamic doctor metrics dataset stream:", err);
        }
    });
}

// =====================================
// PDF DOWNLOAD
// =====================================

$(".download-btn").on("click", function (e) {
    e.stopPropagation();

    const targetId = $(this).data("target");
    const target = document.getElementById(targetId);

    if (!target) {
        alert("Target not found");
        return;
    }

    html2canvas(target, {
        scale: 2,
        useCORS: true
    }).then((canvas) => {

        const imageData = canvas.toDataURL("image/png");

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "mm", "a4");

        const pdfWidth = 190;
        const pdfHeight =
            (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(
            imageData,
            "PNG",
            10,
            10,
            pdfWidth,
            pdfHeight
        );

        pdf.save(targetId + ".pdf");
    });
});

// =========================================================================
// REPORT SEARCH (name / category)
//
// Backend (`doctor_report_data`) filters by `search` across patient first /
// last name, consultation type, service type and status. This is a
// display-level pass over the freshly rendered rows/cards only — it must
// never hide an entire card, otherwise typing any patient name blanks the
// whole Reports page (the reported bug).
// =========================================================================
function applyDoctorReportSearch(query, skipReload) {
    const value = (query || "").trim().toLowerCase();
    const hasQuery = value.length > 0;

    // Day-wise rows of the "Consultation fee and appointments" table. Only
    // narrow them when the query actually matches at least one row, so a
    // search targeting another section doesn't blank out the table.
    // Skip the Total row (data-total-row) so aggregates stay visible.
    const $rows = $(".consultation-table-body tr").not("[data-total-row]");
    const $totalRow = $(".consultation-table-body tr[data-total-row]");
    const $matchingRows = $rows.filter(function () {
        return $(this).text().toLowerCase().indexOf(value) > -1;
    });

    if (!hasQuery || !$matchingRows.length) {
        $rows.add($totalRow).show().removeClass("hidden");
    } else {
        $rows.hide().addClass("hidden");
        $matchingRows.show().removeClass("hidden");
        $totalRow.show().removeClass("hidden");
    }

    if (!skipReload && hasQuery) {
        // Debounced backend reload so stats/charts/table reflect the name.
        clearTimeout(doctorReportSearchTimer);
        doctorReportSearchTimer = setTimeout(function () {
            loadDoctorDashboardData(currentDoctorReportFilter());
        }, 350);
    }
}

$(document).on("keyup", "#reportSearch", function () {
    clearTimeout(doctorReportSearchTimer);
    const value = $(this).val();
    if (!(value || "").trim()) {
        // Cleared: reload unfiltered data, then reset display filtering.
        loadDoctorDashboardData(currentDoctorReportFilter());
        return;
    }
    applyDoctorReportSearch(value);
});

$(document).on("search", "#reportSearch", function () {
    // Native clear (x) button in some browsers.
    if (!($(this).val() || "").trim()) {
        loadDoctorDashboardData(currentDoctorReportFilter());
    }
});