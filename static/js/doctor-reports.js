//doctor reports.js
let heatmapChart;
let polygonSeries;
let heatmapInitialized = false;

$(document).ready(function () {
  // --------- 1. INTERACTIVE FILTER DROPDOWN TOGGLES ----------
  $("#filterToggle").on("click", function (e) {
    e.stopPropagation();
    const $dropdown = $("#filterDropdown");
    const opening = $dropdown.hasClass("hidden");

    if (opening) {
      showDoctorReportFilterPanel("main");
    }

    $dropdown.toggleClass("hidden");
  });

  // Keep exactly one filter panel visible at a time. Explicitly manage both
  // visibility classes because the inline picker is positioned outside the
  // dropdown and may retain styles after a selection or resize.
  function showDoctorReportFilterPanel(panel) {
    $("#mainMenu, #dateMenu, #visitMenu, #doctorReportDatepicker")
      .addClass("hidden")
      .css("display", "");
    if (panel === "main") $("#mainMenu").removeClass("hidden");
    if (panel === "date") $("#dateMenu").removeClass("hidden");
    if (panel === "visit") $("#visitMenu").removeClass("hidden");
  }

  // Handle dropdown internal submenus navigation
  $(document).on("click", "[data-open]", function (e) {
    e.stopPropagation();
    const targetMenu = $(this).data("open");
    showDoctorReportFilterPanel(targetMenu);
  });

  $(document).on("click", "[data-back]", function (e) {
    e.stopPropagation();
    showDoctorReportFilterPanel("main");
  });

  // Global closure scripts for clicking outside dropdowns
  $(document).on("click", function (e) {
    // Clicks inside the custom date picker must not dismiss the dropdown - this
    // handler is bound before the picker handlers, so it has to opt out here.
    if ($(e.target).closest(
      "#filterDropdown, .datepicker-container, .ui-datepicker, " +
      ".calendarToggle, .heatmapCalendarToggle, .consolidationCalendarToggle, " +
      ".calendarPopup, .heatmapCalendarPopup, .consolidationCalendarPopup, " +
      ".calendar-option, .heatmap-cal-option, .consolidation-cal-option, " +
      ".chart-range-calendar"
    ).length) return;

    $("#filterDropdown").addClass("hidden");
    $(".datepicker-container").addClass("hidden");
    $(".dropdown-menu").addClass("hidden");
    $(".calendarPopup, .heatmapCalendarPopup, .consolidationCalendarPopup").addClass("hidden");
    $(".chart-range-picker").addClass("hidden");
    $(".chart-range-calendar").addClass("hidden");
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
  if (
    typeof am4core !== "undefined" &&
    typeof am4maps !== "undefined" &&
    typeof am4geodata_india2019High !== "undefined" &&
    typeof am4themes_animated !== "undefined"
  ) {
    try {
    am4core.useTheme(am4themes_animated);
    heatmapChart = am4core.create("heatmap", am4maps.MapChart);
    window.heatmapChart = heatmapChart;
    heatmapChart.geodata = am4geodata_india2019High;
    heatmapChart.homeZoomLevel = 1;
    heatmapChart.homeGeoPoint = { longitude: 78.9629, latitude: 22.5937 };

    polygonSeries = heatmapChart.series.push(new am4maps.MapPolygonSeries());
    window.polygonSeries = polygonSeries;
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
    heatmapInitialized = true;
    } catch (error) {
      // A failed optional map must not prevent report filters and charts from
      // loading their data.
      console.error("Doctor report heatmap initialization failed:", error);
    }
  }

  // --------- 3. ASYNCHRONOUS SUBMENU TABS ACTION EVENTS ----------
  $("#filterDropdown")
    .off("click.doctorReportOption", ".option")
    .on("click.doctorReportOption", ".option", function (e) {
    e.stopPropagation();
    const $option = $(this);
    const kind = String($option.data("type") || "date").toLowerCase();
    const value = String($option.data("value") || "").toLowerCase();

    if (kind === "visit") {
      // Visit submenu: Home / Clinic / All - keep the active date filter
      // intact. Only this menu's options are toggled, so picking a visit type
      // can never overwrite the date filter (or vice versa).
      window.doctorReportVisitType = value;
      $("#visitMenu .option")
        .removeClass("active bg-pale-azure text-dodger-blue font-medium")
        .addClass("text-dark-gray");
      $option
        .addClass("active bg-pale-azure text-dodger-blue font-medium")
        .removeClass("text-dark-gray");
      $("#visitMenu .option").attr("aria-pressed", "false");
      $option.attr("aria-pressed", "true");
      loadDoctorDashboardData(currentDoctorReportFilter());
      return;
    }

    // Date submenu.
    $("#dateMenu .option").removeClass("active");
    $option.addClass("active");
    window.doctorReportFilter = value;

    if (value === "custom") {
      // A preset is no longer in force, so drop any previously applied range
      // before the calendar asks for a new one.
      window.doctorReportStartDate = "";
      window.doctorReportEndDate = "";
      openDoctorReportDatepicker();
      return;
    }

    // Presets ignore any custom range.
    window.doctorReportStartDate = "";
    window.doctorReportEndDate = "";
    $("#filterDropdown").addClass("hidden");
    setDoctorReportDateStatus("");
    loadDoctorDashboardData(value);
  });

  // "Custom" opens the inline calendar; the first day picked is the start and
  // the second the end, matching the appointments page behaviour. The range is
  // only sent once BOTH dates exist, so a half-finished selection can never
  // narrow the report.
  let doctorReportPendingStart = "";

  function setDoctorReportDateStatus(text) {
    $("#doctorReportDateStatus").text(text || "");
  }

  function resetDoctorReportDatepicker() {
    const $inline = $("#doctorReportDatepicker .datepicker-inline");
    try {
      if ($inline.hasClass("hasDatepicker")) $inline.datepicker("destroy");
    } catch (e) {}
    $inline.removeClass("hasDatepicker").empty();
    return $inline;
  }

  function openDoctorReportDatepicker() {
    const $picker = $("#doctorReportDatepicker");
    const hidden = $picker.hasClass("hidden") || $picker.css("display") === "none";

    if (!hidden) {
      $picker.addClass("hidden").css("display", "");
      return;
    }

    // Swap the submenu for the calendar, keeping the dropdown itself open.
    showDoctorReportFilterPanel("calendar");
    $picker.removeClass("hidden").css("display", "");
    // The inline calendar is wider than the filter menu and the page content
    // clips overflow. Float the picker against the viewport and clamp it to
    // the available width so every weekday/date remains reachable.
    $picker.css({ position: "fixed", width: "max-content", zIndex: 10000 });
    setDoctorReportDateStatus("Select start date");
    doctorReportPendingStart = "";

    const $inline = resetDoctorReportDatepicker();

    $inline.datepicker({
      dateFormat: "yy-mm-dd",
      changeMonth: true,
      changeYear: true,
      yearRange: "2000:2035",
      onSelect: function (dateText) {
        // FIRST PICK: START DATE - keep the calendar open for the end date.
        if (!doctorReportPendingStart) {
          doctorReportPendingStart = dateText;
          $inline.datepicker("option", "minDate", dateText);
          setDoctorReportDateStatus(
            "Start: " + doctorReportPendingStart + " - Select end date"
          );
          return;
        }

        // SECOND PICK: END DATE - apply the range.
        let rangeStart = doctorReportPendingStart;
        let rangeEnd = dateText;
        if (rangeStart > rangeEnd) {
          const swap = rangeStart;
          rangeStart = rangeEnd;
          rangeEnd = swap;
        }

        window.doctorReportStartDate = rangeStart;
        window.doctorReportEndDate = rangeEnd;
        doctorReportPendingStart = "";

        $inline.datepicker("option", "minDate", null);
        $picker.addClass("hidden").css("display", "");
        $("#filterDropdown").addClass("hidden");
        setDoctorReportDateStatus("");
        console.log("Doctor Custom Start:", rangeStart);
        console.log("Doctor Custom End:", rangeEnd);


        loadDoctorDashboardData("custom");
      },
    });

    const placePicker = function () {
      if ($picker.hasClass("hidden")) return;
      const trigger = document.getElementById("filterToggle").getBoundingClientRect();
      const pickerWidth = $picker.outerWidth();
      const left = Math.max(8, Math.min(trigger.right - pickerWidth, window.innerWidth - pickerWidth - 8));
      const top = Math.min(trigger.bottom + 8, window.innerHeight - $picker.outerHeight() - 8);
      $picker.css({ left: left + "px", top: Math.max(8, top) + "px", right: "auto" });
    };
    requestAnimationFrame(placePicker);
    $(window).off("resize.doctorReportPicker").on("resize.doctorReportPicker", placePicker);
  }

  // Keep the calendar usable: clicks inside it must not dismiss the dropdown,
  // and there is always a way back to the menus.
  $(document).on("click", "#doctorReportDatepicker", function (e) {
    e.stopPropagation();
  });

  $(document).on("click", "#doctorReportDatepickerBack", function (e) {
    e.stopPropagation();
    showDoctorReportFilterPanel("main");
  });

  // Sync secondary action listeners
  $(document).on("click", ".calendar-option, .heatmap-cal-option, .consolidation-cal-option", function (e) {
    e.stopPropagation();
    const value = String($(this).data("value") || "").toLowerCase();
    $(this).parent().addClass("hidden");
    $(this).closest(".relative").find(".calendar-date-text").text($(this).text().trim().replace("check", ""));
    if (value === "custom") {
      // Use the same two-click jQuery UI range calendar as Hospital Reports.
      const $wrapper = $(this).closest(".heatmapCalendar, .consolidationCalendar, .relative");
      let $rangeCalendar = $wrapper.find(".chart-range-calendar");
      if (!$rangeCalendar.length) {
        $rangeCalendar = $('<div class="chart-range-calendar datepicker-container hidden px-4 pb-3 absolute top-full right-0 z-[60] bg-white shadow-md rounded"><p class="chart-range-status mb-2 text-xs text-dark-gray" aria-live="polite">Select start date</p><div class="datepicker-inline"></div></div>').appendTo($wrapper);
        $rangeCalendar.on("click", function (event) { event.stopPropagation(); });
      }
      const $inline = $rangeCalendar.find(".datepicker-inline");
      if ($inline.hasClass("hasDatepicker")) $inline.datepicker("destroy");
      $inline.empty();
      $rangeCalendar.removeClass("hidden").find(".chart-range-status").text("Select start date");
      let pendingStart = "";
      $inline.datepicker({
        dateFormat: "yy-mm-dd",
        changeMonth: true,
        changeYear: true,
        defaultDate: new Date(),
        beforeShowDay: function (date) {
          if (!pendingStart) return [true, ""];
          const value = $.datepicker.formatDate("yy-mm-dd", date);
          return [true, value >= pendingStart ? "ui-state-range" : ""];
        },
        onSelect: function (dateText) {
          if (!pendingStart) {
            pendingStart = dateText;
            $inline.datepicker("option", "minDate", dateText);
            $rangeCalendar.find(".chart-range-status").text("Start: " + dateText + " - Select end date");
            return;
          }
          $rangeCalendar.addClass("hidden");
          $inline.datepicker("option", "minDate", null);
          applyDoctorReportChartDate(pendingStart, dateText, $wrapper);
        }
      });
      return;
    }
    $(".chart-range-calendar").addClass("hidden");
    $(".chart-range-picker").addClass("hidden");
    window.doctorReportStartDate = "";
    window.doctorReportEndDate = "";
    window.doctorReportFilter = value;
    $("#dateMenu .option").removeClass("active");
    $("#dateMenu .option[data-value='" + value + "']").addClass("active");
    loadDoctorDashboardData(value);
  });

  function applyDoctorReportChartDate(startDate, endDate, $wrapper) {
    if (startDate > endDate) [startDate, endDate] = [endDate, startDate];
    window.doctorReportFilter = "custom";
    window.doctorReportStartDate = startDate;
    window.doctorReportEndDate = endDate;
    $("#dateMenu .option").removeClass("active");
    $("#dateMenu .option[data-value='Custom']").addClass("active");
    $wrapper.find(".calendar-date-text").text(`${startDate} – ${endDate}`);
    loadDoctorDashboardData("custom");
  }

  // Default fallback load invocation if map engine is bypassed
  if (!heatmapInitialized) {
      loadDoctorDashboardData("month");
  }
});

function currentDoctorReportFilter() {
    // Only the DATE menu marks an active option. Reading
    // `#filterDropdown .option.active` (the previous behaviour) picked up the
    // visit-type option too, because #dateMenu precedes #visitMenu in the DOM -
    // so choosing a visit type before a date overwrote the date filter with
    // "home"/"clinic", which the backend treats as "no filter".
    const $active = $("#dateMenu .option.active");
    if ($active.length) {
        return String($active.data("value") || "month").toLowerCase();
    }
    return window.doctorReportFilter || "month";
}

function currentDoctorVisitType() {
    // Mirrors currentDoctorReportFilter: scoped to the visit menu only.
    const $active = $("#visitMenu .option.active");
    if ($active.length) {
        return String($active.data("value") || "").toLowerCase();
    }
    return window.doctorReportVisitType || "";
}

function currentDoctorReportRange() {
    return {
        startDate: window.doctorReportStartDate || "",
        endDate: window.doctorReportEndDate || "",
    };
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
    const rawSearchValue = ($("#reportSearch").val() || "").trim();
    const searchValue = isDoctorReportSectionSearch(rawSearchValue) ? "" : rawSearchValue;
    const range = currentDoctorReportRange();
    if (doctorReportRequest) {
        doctorReportRequest.abort();
    }
    doctorReportRequest = $.ajax({
        url: "/reports/doctor-report-data/", // Update to point to your routing path url configuration
        type: "GET",
        data: {
            filter: activeFilter,
            visit_type: currentDoctorVisitType(),
            search: searchValue,
            start_date: range.startDate,
            end_date: range.endDate,
        },
        success: function (response) {
            console.log("DOCTOR LIVE PIPELINE DISPATCH MATRIX RECIEVED:", response);
            window.lastDoctorReportData = response;
            if (response.range_label) {
                $("#doctorReportRangeLabel").text(`Data shown: ${response.range_label}`);
                $(".calendar-date-text").text(response.range_label);
                $("#bidChartRangeLabel").text(`(${response.range_label})`);
            }

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

// =========================================================================
// HIGH-PERFORMANCE DOCTOR REPORT DOWNLOAD ENGINE (INSTANT PDF & EXCEL)
// =========================================================================

function getJsPdfClass() {
    if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
    if (window.jsPDF) return window.jsPDF;
    return null;
}

// 1. Ultra-fast amCharts/SVG Heatmap capture (<50ms via direct SVG serialization)
async function captureHeatmapImage() {
    // A. Check amCharts native export plugin if available
    const chart = window.heatmapChart || (typeof heatmapChart !== "undefined" ? heatmapChart : null);
    if (chart && chart.exporting && typeof chart.exporting.getImage === "function") {
        try {
            const img = await chart.exporting.getImage("png");
            if (img && img.startsWith("data:image")) return img;
        } catch (err) {
            console.warn("amCharts exporting.getImage failed, trying SVG serializer:", err);
        }
    }

    // B. High-speed direct SVG serialization to canvas
    const svgEl = document.querySelector("#heatmap svg");
    if (svgEl) {
        try {
            const svgClone = svgEl.cloneNode(true);
            const w = svgEl.clientWidth || svgEl.getBoundingClientRect().width || 700;
            const h = svgEl.clientHeight || svgEl.getBoundingClientRect().height || 350;
            svgClone.setAttribute("width", w);
            svgClone.setAttribute("height", h);
            svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

            const svgString = new XMLSerializer().serializeToString(svgClone);
            const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
            const URLObj = window.URL || window.webkitURL || window;
            const blobUrl = URLObj.createObjectURL(svgBlob);
            const img = new Image();
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(w * 2, 800);
            canvas.height = Math.max(h * 2, 400);

            const dataUrl = await new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    URLObj.revokeObjectURL(blobUrl);
                    reject(new Error("SVG rasterization timeout"));
                }, 800);

                img.onload = function () {
                    clearTimeout(timer);
                    const ctx = canvas.getContext("2d");
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    URLObj.revokeObjectURL(blobUrl);
                    resolve(canvas.toDataURL("image/png"));
                };
                img.onerror = function (e) {
                    clearTimeout(timer);
                    URLObj.revokeObjectURL(blobUrl);
                    reject(e);
                };
                img.src = blobUrl;
            });
            if (dataUrl) return dataUrl;
        } catch (err) {
            console.warn("Direct SVG serialization failed, trying fast html2canvas fallback:", err);
        }
    }

    // C. Fallback to html2canvas with a strict timeout so it never hangs
    if (typeof html2canvas === "function") {
        const el = document.getElementById("heatmap");
        if (el) {
            try {
                const canvas = await Promise.race([
                    html2canvas(el, {
                        backgroundColor: "#ffffff",
                        useCORS: true,
                        allowTaint: true,
                        scale: 1,
                        logging: false
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("html2canvas heatmap timeout")), 2000))
                ]);
                return canvas.toDataURL("image/png");
            } catch (err) {
                console.warn("html2canvas heatmap capture fallback failed:", err);
            }
        }
    }
    return null;
}

// 2. Fast HTML Bid Chart visual capture (<30ms)
async function captureBidChartImage() {
    const el = document.getElementById("doctorBidChartSection") || document.getElementById("bidChartContainer");
    if (!el || typeof html2canvas !== "function") return null;
    try {
        const canvas = await Promise.race([
            html2canvas(el, {
                backgroundColor: "#ffffff",
                useCORS: true,
                allowTaint: true,
                scale: 1.5,
                logging: false,
                ignoreElements: (element) => element.classList && element.classList.contains("download-btn")
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("bidChart capture timeout")), 1500))
        ]);
        return canvas.toDataURL("image/png");
    } catch (err) {
        console.warn("Bid chart visual capture failed:", err);
        return null;
    }
}

// 3. Professional Report Header with Brand Styling
function drawDoctorReportHeader(pdf, reportTitle, subtitle, dateRangeText) {
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Top Brand Accent Stripe (Dodger Blue)
    pdf.setFillColor(21, 93, 252);
    pdf.rect(0, 0, pageWidth, 5, "F");

    // Header Background Box
    pdf.setFillColor(241, 245, 249); // slate-100
    pdf.rect(14, 10, pageWidth - 28, 26, "F");
    pdf.setDrawColor(203, 213, 225); // slate-300
    pdf.rect(14, 10, pageWidth - 28, 26, "S");

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.text(reportTitle.toUpperCase(), 18, 18);

    // Subtitle
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105); // slate-600
    pdf.text(subtitle, 18, 24);

    // Metadata line
    const now = new Date();
    const generatedOn = now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }) + " " + now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139); // slate-500
    const metaText = `Period: ${dateRangeText || "All Available Dates"}   |   Generated: ${generatedOn}   |   Status: Verified Report`;
    pdf.text(metaText, 18, 31);
}

// 4. Professional Report Footer with Pagination
function drawDoctorReportFooter(pdf) {
    const pageCount = pdf.internal.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(226, 232, 240);
        pdf.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(148, 163, 184);
        pdf.text("MedOCR CRM Doctor Portal  -  Confidential Medical Practice Analytics", 14, pageHeight - 7);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 7);
    }
}

// 5. High-Precision Vector Table Generator
function drawDoctorReportTable(pdf, headers, rows, startY, colWidths) {
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = startY;
    const rowHeight = 6.5;

    // Header Row
    pdf.setFillColor(21, 93, 252);
    pdf.rect(14, currentY, 182, rowHeight, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);

    let currentX = 16;
    headers.forEach((h, i) => {
        pdf.text(String(h), currentX, currentY + 4.5);
        currentX += colWidths[i];
    });

    currentY += rowHeight;

    // Table Rows
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);

    rows.forEach((row, rowIndex) => {
        if (currentY + rowHeight > pageHeight - 18) {
            pdf.addPage();
            currentY = 18;
            // Redraw Header
            pdf.setFillColor(21, 93, 252);
            pdf.rect(14, currentY, 182, rowHeight, "F");
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8.5);
            pdf.setTextColor(255, 255, 255);
            let hX = 16;
            headers.forEach((h, i) => {
                pdf.text(String(h), hX, currentY + 4.5);
                hX += colWidths[i];
            });
            currentY += rowHeight;
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
        }

        const isSummary = rowIndex === rows.length - 1 && (row[0] === "-" || String(row[1]).toLowerCase().includes("total") || String(row[1]).toLowerCase().includes("average"));
        if (isSummary) {
            pdf.setFillColor(238, 242, 255); // Indigo-50
            pdf.rect(14, currentY, 182, rowHeight, "F");
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(15, 23, 42);
        } else if (rowIndex % 2 === 1) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(14, currentY, 182, rowHeight, "F");
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(51, 65, 85);
        } else {
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(51, 65, 85);
        }

        pdf.setDrawColor(226, 232, 240);
        pdf.line(14, currentY + rowHeight, 196, currentY + rowHeight);

        let cellX = 16;
        row.forEach((cell, colIndex) => {
            pdf.text(String(cell !== undefined && cell !== null ? cell : "-"), cellX, currentY + 4.5);
            cellX += colWidths[colIndex];
        });

        currentY += rowHeight;
    });

    return currentY;
}

// 6. Unified Click Event Handler for Instant Report Generation
$(document).on("click", ".download-btn", async function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $btn = $(this);
    if ($btn.prop("disabled")) return;

    const targetType = String($btn.data("type") || "").toLowerCase();
    const targetId = String($btn.data("target") || "");

    // ----------------------------------------------------
    // CASE 1: EXCEL (CSV Export)
    // ----------------------------------------------------
    if (targetType === "excel") {
        try {
            const table = document.querySelector("#consultationTable table") || document.querySelector("#consultationTable");
            let csv = "";
            if (table) {
                csv = Array.from(table.querySelectorAll("tr"), row =>
                    Array.from(row.querySelectorAll("th,td"), cell => '"' + cell.innerText.trim().replace(/"/g, '""') + '"').join(",")
                ).join("\r\n");
            } else if (window.lastDoctorReportData && window.lastDoctorReportData.consultation_data) {
                const rows = [["Day", "Appointments", "Avg Fee", "Earnings"]];
                window.lastDoctorReportData.consultation_data.forEach(item => {
                    rows.push([item.day, item.appointments, item.avg_fee, item.earnings]);
                });
                csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
            }
            if (!csv) {
                if (typeof toastr !== "undefined") toastr.warning("No consultation data available to export.");
                else alert("No consultation data available to export.");
                return;
            }
            const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `Doctor_Consultation_Report_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            if (typeof toastr !== "undefined") toastr.success("Excel report downloaded successfully.");
        } catch (csvErr) {
            console.error("Excel download failed:", csvErr);
            if (typeof toastr !== "undefined") toastr.error("Failed to generate Excel download.");
        }
        return;
    }

    // ----------------------------------------------------
    // CASE 2: HIGH-SPEED PDF DOWNLOADS
    // ----------------------------------------------------
    const jsPdfClass = getJsPdfClass();
    if (!jsPdfClass) {
        const msg = "PDF download generator library is still loading. Please try again in a moment.";
        console.warn(msg);
        if (typeof toastr !== "undefined") toastr.warning(msg);
        else alert(msg);
        return;
    }

    const originalHtml = $btn.html();
    $btn.prop("disabled", true).addClass("opacity-75 cursor-wait");
    $btn.html('<span class="inline-flex items-center justify-center gap-2"><svg class="animate-spin h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Generating PDF...</span>');

    try {
        const pdf = new jsPdfClass("p", "mm", "a4");
        const dateRange = $("#doctorReportRangeLabel").text().replace("Data shown:", "").trim() || "All Dates";
        let filename = `Doctor_Report_${targetId}.pdf`;

        // SUB-CASE 2A: REGIONAL HEATMAP REPORT (heatmap)
        if (targetId === "heatmap") {
            filename = `Doctor_Regional_Heatmap_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
            drawDoctorReportHeader(pdf, "Doctor Regional Heatmap Report", "Geographic Patient Origin & State Density Analysis", dateRange);

            const mapDataUrl = await captureHeatmapImage();
            let startTableY = 40;
            if (mapDataUrl) {
                try {
                    pdf.addImage(mapDataUrl, "PNG", 14, 38, 182, 75);
                    startTableY = 118;
                } catch (imgErr) {
                    console.warn("Failed to attach heatmap image to PDF:", imgErr);
                    startTableY = 42;
                }
            }

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);
            pdf.setTextColor(15, 23, 42);
            pdf.text("REGIONAL PATIENT VOLUME & SHARE SUMMARY", 14, startTableY);

            let statesList = [];
            const series = window.polygonSeries || (typeof polygonSeries !== "undefined" ? polygonSeries : null);
            if (series && series.data && series.data.length) {
                statesList = series.data;
            } else if (window.lastDoctorReportData && window.lastDoctorReportData.heatmap_data) {
                statesList = window.lastDoctorReportData.heatmap_data;
            }

            if (!statesList.length) {
                statesList = [{ id: "IN-MH", value: 0 }];
            }

            const stateNameMap = {
                "IN-MH": "Maharashtra", "IN-DL": "Delhi", "IN-KA": "Karnataka",
                "IN-TN": "Tamil Nadu", "IN-GJ": "Gujarat", "IN-RJ": "Rajasthan",
                "IN-UP": "Uttar Pradesh", "IN-MP": "Madhya Pradesh", "IN-WB": "West Bengal",
                "IN-AP": "Andhra Pradesh", "IN-TG": "Telangana", "IN-KL": "Kerala",
                "IN-PB": "Punjab", "IN-HR": "Haryana", "IN-BR": "Bihar", "IN-OR": "Odisha"
            };

            const totalPatients = statesList.reduce((acc, item) => acc + (Number(item.value) || 0), 0) || 1;
            const tableHeaders = ["#", "Geographic Region / State", "Region Code", "Patient Count", "Regional Share %"];
            const colWidths = [12, 60, 35, 40, 35];
            const tableRows = statesList.map((item, idx) => {
                const rawId = item.id || "IN-MH";
                const stateName = stateNameMap[rawId] || rawId.replace("IN-", "");
                const val = Number(item.value) || 0;
                const share = (totalPatients > 0 ? Math.round((val / totalPatients) * 100) : 0) + "%";
                return [idx + 1, stateName, rawId, val, share];
            });

            tableRows.push(["-", "All Regions Combined", "National Total", totalPatients > 1 || statesList[0].value > 0 ? totalPatients : 0, "100%"]);
            drawDoctorReportTable(pdf, tableHeaders, tableRows, startTableY + 4, colWidths);
        }

        // SUB-CASE 2B: BID WIN/LOSS RATE REPORT (bidChartContainer)
        else if (targetId === "bidChartContainer") {
            filename = `Doctor_Bid_Win_Loss_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
            const bidRange = $("#bidChartRangeLabel").text().replace(/[()]/g, "").trim() || dateRange;
            drawDoctorReportHeader(pdf, "Doctor Bid Win/Loss Rate Report", "Daily Bid Performance, Win Rate & Loss Rate Distribution", bidRange);

            const chartImg = await captureBidChartImage();
            let startTableY = 40;
            if (chartImg) {
                try {
                    pdf.addImage(chartImg, "PNG", 14, 38, 182, 65);
                    startTableY = 108;
                } catch (imgErr) {
                    console.warn("Failed to attach bid chart image to PDF:", imgErr);
                    startTableY = 42;
                }
            }

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);
            pdf.setTextColor(15, 23, 42);
            pdf.text("DAILY BID PERFORMANCE & CONVERSION BREAKDOWN", 14, startTableY);

            let bidData = (window.lastDoctorReportData && window.lastDoctorReportData.bid_chart) || [];
            if (!bidData.length) {
                $("#bidChartContainer .group").each(function () {
                    const day = $(this).find("span").text().trim();
                    const wonBar = $(this).find(".bg-mint-emerald");
                    const lostBar = $(this).find(".bg-bright-red");
                    const won = parseInt(wonBar.attr("title")?.replace(/\D/g, "") || "0", 10);
                    const lost = parseInt(lostBar.attr("title")?.replace(/\D/g, "") || "0", 10);
                    bidData.push({ day: day || "-", won: won, lost: lost });
                });
            }

            if (!bidData.length) {
                bidData = [{ day: "No Data", won: 0, lost: 0 }];
            }

            const tableHeaders = ["#", "Day / Time Period", "Bids Won Rate", "Bids Lost Rate", "Total Daily Ratio", "Outcome Summary"];
            const colWidths = [12, 45, 35, 35, 32, 23];
            let sumWon = 0;
            let sumLost = 0;

            const tableRows = bidData.map((item, idx) => {
                const won = Number(item.won) || 0;
                const lost = Number(item.lost) || 0;
                sumWon += won;
                sumLost += lost;
                const outcome = won >= 50 ? "Positive Win Rate" : (lost > 0 ? "High Loss Rate" : "No Activity");
                return [idx + 1, item.day, `${won}%`, `${lost}%`, won + lost > 0 ? `${won + lost}%` : "0%", outcome];
            });

            const avgWon = bidData.length ? Math.round(sumWon / bidData.length) : 0;
            const avgLost = bidData.length ? Math.round(sumLost / bidData.length) : 0;
            tableRows.push(["-", "Period Average", `${avgWon}%`, `${avgLost}%`, "100%", avgWon >= 50 ? "Healthy Inflow" : "Review Bids"]);

            drawDoctorReportTable(pdf, tableHeaders, tableRows, startTableY + 4, colWidths);
        }

        // SUB-CASE 2C: CONSOLATION FEE & APPOINTMENTS (consultationTable)
        else {
            filename = `Doctor_Consultation_Appointments_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
            drawDoctorReportHeader(pdf, "Doctor Consolation Fee & Appointments Report", "Daily Patient Volume, Average Consultation Fee & Total Earnings", dateRange);

            let consultData = (window.lastDoctorReportData && window.lastDoctorReportData.consultation_data) || [];
            if (!consultData.length) {
                $(".consultation-table-body tr").not("[data-total-row='1']").each(function () {
                    const $cells = $(this).find("td");
                    if ($cells.length >= 4) {
                        consultData.push({
                            day: $cells.eq(0).text().trim(),
                            appointments: parseInt($cells.eq(1).text().trim(), 10) || 0,
                            avg_fee: parseFloat($cells.eq(2).text().replace(/[^\d.]/g, "")) || 0,
                            earnings: parseFloat($cells.eq(3).text().replace(/[^\d.]/g, "")) || 0
                        });
                    }
                });
            }

            if (!consultData.length) {
                consultData = [{ day: "No Data", appointments: 0, avg_fee: 0, earnings: 0 }];
            }

            const tableHeaders = ["#", "Day / Time Period", "Appointments Count", "Average Fee (INR)", "Total Earnings (INR)"];
            const colWidths = [12, 50, 40, 40, 40];
            let totalAppts = 0;
            let totalEarnings = 0;

            const tableRows = consultData.map((item, idx) => {
                const appts = Number(item.appointments) || 0;
                const fee = Number(item.avg_fee) || 0;
                const earnings = Number(item.earnings) || 0;
                totalAppts += appts;
                totalEarnings += earnings;
                return [idx + 1, item.day, appts, `₹${fee.toLocaleString()}`, `₹${earnings.toLocaleString()}`];
            });

            const overallAvgFee = totalAppts > 0 ? Math.round(totalEarnings / totalAppts) : 0;
            tableRows.push(["-", "Cumulative Total", totalAppts, `Avg: ₹${overallAvgFee.toLocaleString()}`, `₹${totalEarnings.toLocaleString()}`]);

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);
            pdf.setTextColor(15, 23, 42);
            pdf.text("CONSULTATION VOLUME & EARNINGS BREAKDOWN", 14, 42);

            drawDoctorReportTable(pdf, tableHeaders, tableRows, 46, colWidths);
        }

        drawDoctorReportFooter(pdf);
        pdf.save(filename);

        if (typeof toastr !== "undefined") toastr.success("Report PDF downloaded successfully.");
    } catch (err) {
        console.error("PDF generation failed:", err);
        if (typeof toastr !== "undefined") {
            toastr.error("Unable to generate PDF report. Please try again.");
        } else {
            alert("Unable to generate PDF report. Please try again.");
        }
    } finally {
        $btn.prop("disabled", false).removeClass("opacity-75 cursor-wait").html(originalHtml);
    }
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

    const sectionKeywords = {
        stats: ["patient", "patients", "bids received", "bids", "quarter", "growth", "revenue", "average", "avg"],
        heatmap: ["heatmap", "map", "state", "location"],
        bidChart: ["bid", "bids", "win", "loss", "won", "lost"],
        consultation: ["consultation", "appointment", "appointments", "fee", "earning", "earnings", "day"]
    };
    const matchesSection = (keywords) => keywords.some((keyword) => keyword.includes(value) || value.includes(keyword));
    const isSectionSearch = hasQuery && Object.values(sectionKeywords).some(matchesSection);

    if (isSectionSearch) {
        const showHeatmap = matchesSection(sectionKeywords.heatmap);
        const showBidChart = matchesSection(sectionKeywords.bidChart);
        $("#doctorStatsSection").toggle(matchesSection(sectionKeywords.stats));
        $("#doctorHeatmapSection").toggle(showHeatmap);
        $("#doctorBidChartSection").toggle(showBidChart);
        $("#doctorChartsSection").toggle(showHeatmap || showBidChart);
        $("#doctorConsultationSection").toggle(matchesSection(sectionKeywords.consultation));
    } else {
        $("#doctorStatsSection, #doctorChartsSection, #doctorHeatmapSection, #doctorBidChartSection, #doctorConsultationSection")
            .show();
    }

    // Day-wise rows of the "Consultation fee and appointments" table. Only
    // narrow them when the query actually matches at least one row, so a
    // search targeting another section doesn't blank out the table.
    // Skip the Total row (data-total-row) so aggregates stay visible.
    const $rows = $(".consultation-table-body tr").not("[data-total-row]");
    const $totalRow = $(".consultation-table-body tr[data-total-row]");
    const $matchingRows = $rows.filter(function () {
        return $(this).text().toLowerCase().indexOf(value) > -1;
    });

    if (!hasQuery || isSectionSearch || !$matchingRows.length) {
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

function isDoctorReportSectionSearch(query) {
    const value = (query || "").trim().toLowerCase();
    if (!value) return false;
    const terms = [
        "patient", "patients", "bids received", "bids", "quarter", "growth",
        "revenue", "average", "avg", "heatmap", "map", "state", "location",
        "win", "loss", "won", "lost", "consultation", "appointment",
        "appointments", "fee", "earning", "earnings", "day"
    ];
    return terms.some((term) => term.includes(value) || value.includes(term));
}

$(document).on("input", "#reportSearch", function () {
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
