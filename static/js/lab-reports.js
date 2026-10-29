let barChart;
let pieChart;
let lineChart;

let labReportPendingStartDate = "";
let labReportRangeStartDate = "";
let labReportRangeEndDate = "";

let labReportRequest = null;

$(document).ready(function () {
  // --------- BAR CHART (Most Requested Test) ----------
  const barCtx = document.getElementById("barChart").getContext("2d");
  // new Chart(barCtx, {
  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: ["CBC", "RT-PCR", "Lipid", "Thyroid", "HBAC"],
      datasets: [
        {
          label: "Requests",
          data: [120, 160, 70, 150, 100],
          backgroundColor: ["#3b82f6", "#f97316", "#22c55e", "#8b5cf6", "#a855f7"],
        },
      ],
    },
    // options: {
    //   responsive: true,
    //   plugins: { legend: { display: false } },
    // },
    options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

          legend: {
             display: false
          }

    }     

},
  
});

  // --------- PIE CHART (Revenue by Test Type) ----------
  const pieCtx = document.getElementById("pieChart").getContext("2d");
  // new Chart(pieCtx, {
  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["CBC (30%)", "RT-PCR (25%)", "Lipid (18%)", "Thyroid (12%)", "Others (12%)"],
      datasets: [
        {
          data: [30, 25, 18, 12, 12],
          backgroundColor: ["#3b82f6", "#f97316", "#22c55e", "#ef4444", "#eab308"],
        },
      ],
    },
    // options: {
    //   responsive: true,
    //   plugins: { legend: { position: "top" } },
    // },
    options: {

      responsive: true,

      maintainAspectRatio: false,

      layout: {
           padding: {
               top:80,
               bottom:30
           }
       },

      plugins: {

        legend: {
          position: "top"
        }

    }

},



  });

  // --------- LINE CHART (Bid Trend Price) ----------
  const lineCtx = document.getElementById("lineChart").getContext("2d");
  // new Chart(lineCtx, {
  lineChart = new Chart(lineCtx, {
    type: "line",
    data: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      datasets: [
        {
          label: "CBC",
          data: [320, 340, 310, 360],
          borderColor: "#3b82f6",
          fill: false,
        },
        {
          label: "RT-PCR",
          data: [420, 380, 460, 400],
          borderColor: "#f97316",
          fill: false,
        },
      ],
    },
    // options: {
    //   responsive: true,
    //   plugins: { legend: { position: "top" } },
    // },

    options: {

      responsive: true,

      maintainAspectRatio: false,


      scales: {
        y: {
          beginAtZero: true
        }
    },

      plugins: {

        legend: {
          position: "top"
        }
    }

},
  });

  // --------- USER RATINGS ----------
  const ratingData = [
    { stars: 5, percent: 74 },
    { stars: 4, percent: 54 },
    { stars: 3, percent: 38 },
    { stars: 2, percent: 18 },
    { stars: 1, percent: 3 },
  ];

  ratingData.forEach((r) => {
    $("#ratings").append(`
      <div class="flex items-center justify-between">
        <span  class="text-dodger-blue">${r.stars} star</span>
        <div class="w-3/4 bg-[#D3D3D3] rounded-full h-2">
          <div class="bg-[#FFCC48] h-2 rounded-full" style="width:${r.percent}%;"></div>
        </div>
        <span>${r.percent}%</span>
      </div>
    `);
  });

  // // --------- DOWNLOAD AS PDF ----------
  // $(".download-btn").on("click", function () {
  //   const targetId = $(this).data("target");
  //   const { jsPDF } = window.jspdf;
  //   const pdf = new jsPDF();
  //   pdf.html(document.getElementById(targetId), {
  //     callback: function (doc) {
  //       doc.save(`${targetId}.pdf`);
  //     },
  //     x: 10,
  //     y: 10,
  //   });
  // });

    // // --------- HEATMAP ----------
    // // Wait for DOM to be ready using jQuery
  
    // am4core.useTheme(am4themes_animated);

    // // Create map instance
    // var chart = am4core.create("heatmap", am4maps.MapChart);

    // // Set map definition
    // chart.geodata = am4geodata_india2019High;

    // // Create map polygon series
    // var polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());

    // // Set min/max fill color for each area
    // polygonSeries.heatRules.push({
    //     property: "fill",
    //     target: polygonSeries.mapPolygons.template,
    //     min: chart.colors.getIndex(1).brighten(1),
    //     max: chart.colors.getIndex(1).brighten(-0.3)
    // });

    // // Make map load polygon data (state shapes and names) from GeoJSON
    // polygonSeries.useGeodata = true;

    // // Set heatmap values for each state
    // polygonSeries.data = [
    //     { id: "IN-JK", value: 0 },
    //     { id: "IN-MH", value: 6269321325 },
    //     { id: "IN-UP", value: 0 },
    //     { id: "US-AR", value: 0 },
    //     { id: "IN-RJ", value: 0 },
    //     { id: "IN-AP", value: 0 },
    //     { id: "IN-MP", value: 0 },
    //     { id: "IN-TN", value: 0 },
    //     { id: "IN-JH", value: 0 },
    //     { id: "IN-WB", value: 0 },
    //     { id: "IN-GJ", value: 0 },
    //     { id: "IN-BR", value: 0 },
    //     { id: "IN-TG", value: 0 },
    //     { id: "IN-GA", value: 0 },
    //     { id: "IN-DN", value: 0 },
    //     { id: "IN-DL", value: 0 },
    //     { id: "IN-DD", value: 0 },
    //     { id: "IN-CH", value: 0 },
    //     { id: "IN-CT", value: 0 },
    //     { id: "IN-AS", value: 0 },
    //     { id: "IN-AR", value: 0 },
    //     { id: "IN-AN", value: 0 },
    //     { id: "IN-KA", value: 0 },
    //     { id: "IN-KL", value: 0 },
    //     { id: "IN-OR", value: 0 },
    //     { id: "IN-SK", value: 0 },
    //     { id: "IN-HP", value: 0 },
    //     { id: "IN-PB", value: 0 },
    //     { id: "IN-HR", value: 0 },
    //     { id: "IN-UT", value: 0 },
    //     { id: "IN-LK", value: 0 },
    //     { id: "IN-MN", value: 0 },
    //     { id: "IN-TR", value: 0 },
    //     { id: "IN-MZ", value: 0 },
    //     { id: "IN-NL", value: 0 },
    //     { id: "IN-ML", value: 0 }
    // ];

    // // Configure series tooltip
    // var polygonTemplate = polygonSeries.mapPolygons.template;
    // polygonTemplate.tooltipText = "{name}: {value}";
    // polygonTemplate.nonScalingStroke = true;
    // polygonTemplate.strokeWidth = 0.5;

    // // Create hover state and set alternative fill color
    // var hs = polygonTemplate.states.create("hover");
    // hs.properties.fill = am4core.color("#3c5bdc");

    // Toggle dropdown visibility
    // REMOVE DUPLICATE EVENTS
    $(document).off("click", ".dropdown-btn");
    $(document).off("click", ".dropdown-menu li");
    $(document).on('click', '.dropdown-btn', function (e) {
      e.stopPropagation();
      const $dropdown = $(this).closest('.dropdown');
      $('.dropdown-menu').not($dropdown.find('.dropdown-menu')).addClass('hidden');
      $dropdown.find('.dropdown-menu').toggleClass('hidden');
    });

    // Handle selection
    $(document).on('click', '.dropdown-menu li', function (e) {
      const $dropdown = $(this).closest('.dropdown');
      const value = $(this).text();
      $dropdown.find('.dropdown-value').text(value);
      $dropdown.find('.dropdown-menu').addClass('hidden');
    });

    // Close dropdown when clicking outside
    $(document).click(function () {
      $('.dropdown-menu').addClass('hidden');
    });
});

// =====================================
// DYNAMIC REPORT DATA
// =====================================

// function loadDashboardData(filterType = "today") {
function loadDashboardData(filterType = "today", startDate = "", endDate = "") {
    if (labReportRequest) labReportRequest.abort();
    labReportRequest = $.ajax({

        url: "/reports/lab-report-data/",
        type: "GET",

        // data: {
        //     filter: filterType
        // },
        data: {
           filter: filterType,
           start: startDate,
           end: endDate
        },

        success: function (response) {
        //    console.log(response);
        //     $("#reportRange").text(
        //         "Data shown: " + response.range_label
        //     );
        //     $(".lab-report-range-label").text(response.range_label || "All dates");
        //     $("#mostRequestedTestCaption").text(`Requests for ${response.range_label || "all dates"}`);
        //     $("#revenueByTestCaption").text(`Revenue distribution for ${response.range_label || "all dates"}`);
        console.log(response);

        // Format YYYY-MM-DD as Oct 14, 2026
        function formatReportDate(dateString) {
           if (!dateString) return "";

           const parts = dateString.split("-");

            if (parts.length !== 3) return dateString;

            const date = new Date(
               Number(parts[0]),
               Number(parts[1]) - 1,
               Number(parts[2])
            );

            return $.datepicker.formatDate("M dd, yy", date);
        }

        // Use the dates selected by the user for custom filtering.
        let displayRange = response.range_label || "All dates";
  
        if (filterType === "custom" && startDate && endDate) {
            displayRange =
                `${formatReportDate(startDate)} – ${formatReportDate(endDate)}`;
        }

        // Update the date shown above the charts.
        $("#reportRange").text("Data shown: " + displayRange);

        $(".lab-report-range-label").text(displayRange);

        // Update chart captions.
        $("#mostRequestedTestCaption").text(
            `Requests for ${displayRange}`
        );

        $("#revenueByTestCaption").text(
           `Revenue distribution for ${displayRange}`
        );
           updateHeatmap(
              response.heatmap_data
           );

        updateBidWinLoss(
           response.bid_win_loss
        );
        // updateHeatmap(filterType);

        // updateBidWinLoss(filterType);

            // =========================
            // CARDS
            // =========================

            $(".grid .text-lg.font-semibold")
                .eq(0)
                .text(response.stats.revenue);

            $(".grid .text-lg.font-semibold")
                .eq(1)
                .text(response.stats.ratings);

            $(".grid .text-lg.font-semibold")
                .eq(2)
                .text(response.stats.bookings);

            $(".grid .text-lg.font-semibold")
                .eq(3)
                .text(response.stats.avg_bid);

            // =========================
            // BAR CHART
            // =========================

            barChart.data.labels =
                response.most_requested_test.labels;

            barChart.data.datasets[0].data =
                response.most_requested_test.data;

            barChart.update();

            // =========================
            // PIE CHART
            // =========================

            pieChart.data.labels =
                response.revenue_by_test.labels;

            pieChart.data.datasets[0].data =
                response.revenue_by_test.data;

            pieChart.update();

            // =========================
            // LINE CHART
            // =========================

            lineChart.data.labels =
                response.bid_trend.labels;

            lineChart.data.datasets[0].data =
                response.bid_trend.cbc;

            lineChart.data.datasets[1].data =
                response.bid_trend.rtpcr;

            lineChart.update();
            // UPDATE BID WIN LOSS
            // $(".bg-mint-leaf").eq(0).css("width", "81%");
            // $(".bg-bright-red").eq(0).css("width", "19%");

            // =========================
            // BID WIN LOSS DYNAMIC
            // =========================

            $("#winBar1")
               .css(
                "width",
                response.bid_win_loss.win + "%"
           )
            .text(
                response.bid_win_loss.completed
            );

            $("#lossBar1")
               .css(
                  "width",
                response.bid_win_loss.loss + "%"
               )
               .text(
                   response.bid_win_loss.cancelled
                );

            // =========================
            // RATINGS
            // =========================

            $("#ratings").html("");

            response.ratings_data.forEach((r) => {

                $("#ratings").append(`

                    <div class="flex items-center justify-between">

                        <span class="text-dodger-blue">
                            ${r.stars} star
                        </span>

                        <div class="w-3/4 bg-[#D3D3D3] rounded-full h-2">

                            <div
                                class="bg-[#FFCC48] h-2 rounded-full"
                                style="width:${r.percent}%;">
                            </div>

                        </div>

                        <span>${r.percent}%</span>

                    </div>

                `);

            });

        },
        error: function (xhr, status) {
            if (status !== "abort") {
                console.error("Lab report request failed:", xhr.responseText);
                if (window.toastr) toastr.error(xhr.responseJSON?.error || "Could not load lab report data.");
            }
        },

    });

}

// DEFAULT LOAD
// loadDashboardData("today");
// loadDashboardData("all");
// DEFAULT LOAD: URL se selected filter aur dates read karo
const urlParams = new URLSearchParams(window.location.search);

const requestedFilter = urlParams.get("date_filter") || "today";
const selectedFilter = ["today", "week", "month", "year", "all", "custom"].includes(requestedFilter)
    ? requestedFilter
    : "today";
const startDate = urlParams.get("start_date") || "";
const endDate = urlParams.get("end_date") || "";

function setLabReportActiveFilter(filter) {
    $(".filterDropdown [data-filter] span:first-child")
        .removeClass("text-dodger-blue")
        .addClass("text-light-gray");
    $(`.filterDropdown [data-filter='${filter}'] span:first-child`)
        .removeClass("text-light-gray")
        .addClass("text-dodger-blue");
}

function applyLabReportPreset(filter) {
    if (!["today", "week", "month", "year", "all"].includes(filter)) return;
    labReportPendingStartDate = "";
    setLabReportActiveFilter(filter);
    const url = new URL(window.location.href);
    url.searchParams.set("date_filter", filter);
    url.searchParams.delete("start_date");
    url.searchParams.delete("end_date");
    window.history.replaceState({}, "", url.toString());
    $(".datepicker-container, .filterDropdown").addClass("hidden").css("display", "");
    loadDashboardData(filter);
}

setLabReportActiveFilter(selectedFilter);

if (selectedFilter === "custom" && startDate && endDate) {
    loadDashboardData("custom", startDate, endDate);
} else if (selectedFilter === "custom") {
    setLabReportActiveFilter("today");
    loadDashboardData("today");
} else {
    loadDashboardData(selectedFilter);
}
// =====================================
// SEARCH
// =====================================

$("input[type='text']").on("keyup", function () {

    let value = $(this)
        .val()
        .toLowerCase();

    $(".lab-report-shadow").each(function () {

        let text = $(this)
            .text()
            .toLowerCase();

        if (text.indexOf(value) > -1) {

            $(this).show();

        } else {

            $(this).hide();

        }

    });

});

// // =====================================
// // SEARCH FUNCTIONALITY
// // =====================================

// $("input[type='text']").on("keyup", function () {

//     let value = $(this).val().toLowerCase();

//     $(".lab-report-shadow").each(function () {

//         let text = $(this).text().toLowerCase();

//         if (text.includes(value)) {

//             $(this).show();

//         } else {

//             $(this).hide();

//         }

//     });

// });

// =====================================
// FILTER FUNCTIONALITY
// =====================================

// =====================================
// FILTER FUNCTIONALITY

// =====================================

// =====================================
// FILTER FUNCTIONALITY
// =====================================
// $(document).off("click", ".filterDropdown div");
// $(".filterDropdown div").on("click", function () {

//     let filterText = $(this)
//         .attr("data-filter")
//         .trim();

//     console.log("FILTER:", filterText);

//     // RESET CHECK ICONS
//     $(".filterDropdown span:first-child")
//         .removeClass("text-dodger-blue")
//         .addClass("text-light-gray");

//     // ACTIVE CHECK
//     $(this)
//         .find("span:first")
//         .removeClass("text-light-gray")
//         .addClass("text-dodger-blue");

//     // LOAD API
//     loadDashboardData(filterText);

//     // CLOSE DROPDOWN
//     $(".filterDropdown").addClass("hidden");

// });


// // LAB REPORT FILTER
// $(document).off("click.labReportFilter");

// $(document).on(
//     "click.labReportFilter",
//     ".filterDropdown [data-filter]",
//     function (e) {
//         e.preventDefault();
//         e.stopPropagation();

//         const filterText = String(
//             $(this).attr("data-filter") || ""
//         ).trim().toLowerCase();

//         console.log("Selected filter:", filterText);
//         // Reset all filter tick colors
//         $(".filterDropdown [data-filter] span:first-child")
//             .removeClass("text-dodger-blue")
//             .addClass("text-light-gray");

//         // Set blue tick on selected filter
//         $(this)
//            .find("span:first-child")
//            .removeClass("text-light-gray")
//            .addClass("text-dodger-blue");

//         if (!["today", "week", "month", "all", "custom"].includes(filterText)) {
//             console.error("Invalid filter:", filterText);
//             return;
//         }

//         loadDashboardData(filterText);

//         $(".filterDropdown").addClass("hidden");
//     }
// );
// // LAB REPORT FILTER
// $(document).off("click.labReportFilter");

// $(document).on(
//     "click.labReportFilter",
//     ".filterDropdown [data-filter]",
//     function (e) {
//         e.preventDefault();
//         e.stopPropagation();

//         const filterText = String(
//             $(this).attr("data-filter") || ""
//         ).trim().toLowerCase();

//         console.log("Selected filter:", filterText);

//         $(".filterDropdown [data-filter] span:first-child")
//             .removeClass("text-dodger-blue")
//             .addClass("text-light-gray");

//         $(this)
//             .find("span:first-child")
//             .removeClass("text-light-gray")
//             .addClass("text-dodger-blue");

//         if (!["today", "week", "month", "all", "custom"].includes(filterText)) {
//             console.error("Invalid filter:", filterText);
//             return;
//         }

//         if (filterText === "custom") {
//             // Calendar se dates select karni hongi.
//             console.log("Custom filter selected; waiting for date selection.");
//             return;
//         }

//         loadDashboardData(filterText);

//         $(".filterDropdown").addClass("hidden");
//     }
// );
// function openLabReportDatepicker($dropdown, $trigger) {
//     const $picker = $dropdown.find(".datepicker-container").first();
//     const $inline = $picker.find(".datepicker-inline").first();
//     if (!$picker.length || !$inline.length || !$.fn.datepicker) return;

//     labReportPendingStartDate = "";
//     $dropdown.find(".filterDropdown").addClass("hidden").css("display", "");
//     $(".datepicker-container").not($picker).addClass("hidden").css("display", "");
//     $picker.removeClass("hidden").css({ display: "", position: "fixed", width: "max-content", zIndex: 10000 });
//     $("#labReportDateStatus").text("Select start date");

//     if ($inline.hasClass("hasDatepicker")) $inline.datepicker("destroy");
//     $inline.empty().removeClass("hasDatepicker");
//     // $inline.datepicker({
//     //     dateFormat: "yy-mm-dd",
//     //     changeMonth: true,
//     //     changeYear: true,
//     //     yearRange: "2000:2035",
//     //     onSelect: function (dateText) {
//     $inline.datepicker({
//     dateFormat: "yy-mm-dd",
//     changeMonth: true,
//     changeYear: true,
//     yearRange: "2000:2035",

//     // Highlight Start Date, End Date and dates between them
//     beforeShowDay: function (date) {

//         const year = date.getFullYear();
//         const month = String(date.getMonth() + 1).padStart(2, "0");
//         const day = String(date.getDate()).padStart(2, "0");

//         const currentDate = `${year}-${month}-${day}`;

//         const start = labReportRangeStartDate;
//         const end = labReportRangeEndDate;

//         if (!start) {
//             return [true, ""];
//         }

//         if (end && currentDate >= start && currentDate <= end) {

//             if (currentDate === start || currentDate === end) {
//                 return [true, "lab-date-range-endpoint"];
//             }

//             return [true, "lab-date-range"];
//         }

//         if (!end && currentDate === start) {
//             return [true, "lab-date-range-endpoint"];
//         }

//         return [true, ""];
//     },

//     // Keep your existing onSelect code below
//     onSelect: function (dateText) {

//            // FIRST CLICK: SELECT START DATE
//            if (!labReportPendingStartDate) {

//                 labReportPendingStartDate = dateText;

//                 labReportRangeStartDate = dateText;
//                 labReportRangeEndDate = "";

//                 const startDateObj = $.datepicker.parseDate(
//                   "yy-mm-dd",
//                    dateText
//                 );

//                 // Prevent selecting an earlier end date
//                 $inline.datepicker("option", "minDate", startDateObj);

//                 // Refresh calendar highlighting
//                 $inline.datepicker("refresh");

//                 $("#labReportDateStatus").text(
//                    `Start: ${dateText} — Select end date`
//                 );

//                 console.log("Start date:", dateText);

//                 return;
//             }

//             // SECOND CLICK: SELECT END DATE
//             let rangeStart = labReportPendingStartDate;
//             let rangeEnd = dateText;

//             // Keep dates in chronological order
//             if (rangeStart > rangeEnd) {
//                 [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
//             }

//             // Save selected range
//             labReportRangeStartDate = rangeStart;
//             labReportRangeEndDate = rangeEnd;

//             console.log("Selected range:", rangeStart, rangeEnd);

//             // Refresh calendar
//             $inline.datepicker("refresh");

//             // Format dates for the label
//             function formatDate(date) {
//                const parts = date.split("-");

//                 return $.datepicker.formatDate(
//                   "M dd, yy",
//                    new Date(
//                         Number(parts[0]),
//                         Number(parts[1]) - 1,
//                         Number(parts[2])
//                     )
//                 );
//             }

//             $dropdown.find(".lab-report-range-label").text(
//                 formatDate(rangeStart) + " – " + formatDate(rangeEnd)
//             );

//             $("#labReportDateStatus").text(
//                 `${rangeStart} to ${rangeEnd}`
//             );

//             // Reset pending selection
//             labReportPendingStartDate = "";

//             $inline.datepicker("option", "minDate", null);

//             // Update URL
//             const url = new URL(window.location.href);

//             url.searchParams.set("date_filter", "custom");
//             url.searchParams.set("start_date", rangeStart);
//             url.searchParams.set("end_date", rangeEnd);

//             window.history.replaceState({}, "", url.toString());

//             // Close calendar
//             // $picker.addClass("hidden").css("display", "");

//            // Refresh reports and graphs
//         //    setLabReportActiveFilter("custom");

//         //    loadDashboardData("custom", rangeStart, rangeEnd);

//            // Keep calendar open so the selected range remains visible
//            $picker.removeClass("hidden").css("display", "block");

//            // Refresh reports and graphs
//            setLabReportActiveFilter("custom");

//            loadDashboardData("custom", rangeStart, rangeEnd);

//        },
//        });
//     //     onSelect: function (dateText) {
//     //         if (!labReportPendingStartDate) {
//     //             labReportPendingStartDate = dateText;
//     //             $inline.datepicker("option", "minDate", dateText);
//     //             $("#labReportDateStatus").text(`Start: ${dateText} — Select end date`);
//     //             return;
//     //         }

//     //         let rangeStart = labReportPendingStartDate;
//     //         let rangeEnd = dateText;
//     //         if (rangeStart > rangeEnd) [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
//     //         labReportPendingStartDate = "";
//     //         $inline.datepicker("option", "minDate", null);
//     //         $("#labReportDateStatus").text(`${rangeStart} to ${rangeEnd}`);
//     //         $picker.addClass("hidden").css("display", "");
//     //         $dropdown.find(".filterDropdown").addClass("hidden").css("display", "");
//     //         const url = new URL(window.location.href);
//     //         url.searchParams.set("date_filter", "custom");
//     //         url.searchParams.set("start_date", rangeStart);
//     //         url.searchParams.set("end_date", rangeEnd);
//     //         window.history.replaceState({}, "", url.toString());
//     //         setLabReportActiveFilter("custom");
//     //         loadDashboardData("custom", rangeStart, rangeEnd);
//     //     },
//     // });

//     const placePicker = function () {
//         if ($picker.hasClass("hidden")) return;
//         const anchor = ($trigger && $trigger.length ? $trigger[0] : $dropdown.find(".filterToggle")[0]);
//         if (!anchor) return;
//         const rect = anchor.getBoundingClientRect();
//         const width = $picker.outerWidth();
//         const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
//         const top = Math.min(rect.bottom + 8, window.innerHeight - $picker.outerHeight() - 8);
//         $picker.css({ left: `${left}px`, top: `${Math.max(8, top)}px`, right: "auto" });
//     };
//     requestAnimationFrame(placePicker);
//     $(window).off("resize.labReportPicker").on("resize.labReportPicker", placePicker);
// }



function openLabReportDatepicker($dropdown, $trigger) {
    const $picker = $dropdown.find(".datepicker-container").first();
    const $inline = $picker.find(".datepicker-inline").first();

    if (!$picker.length || !$inline.length || !$.fn.datepicker) {
        console.error("Lab report datepicker not found.");
        return;
    }

    // Restore previously selected dates from URL.
    const dateParams = new URLSearchParams(window.location.search);
    const savedStartDate = dateParams.get("start_date") || "";
    const savedEndDate = dateParams.get("end_date") || "";

    if (savedStartDate && savedEndDate) {
        labReportRangeStartDate = savedStartDate;
        labReportRangeEndDate = savedEndDate;
    }

    // Reset only the pending click; retain the saved range.
    labReportPendingStartDate = "";

    // Hide other calendars.
    $(".datepicker-container")
        .not($picker)
        .addClass("hidden")
        .css("display", "");

    // Show this calendar.
    $picker.removeClass("hidden").css({
        display: "block",
        position: "fixed",
        width: "max-content",
        zIndex: 10000
    });

 // Create a visible Start Date / End Date status bar.
let $dateStatus = $picker.find(".labReportDateStatus");

if (!$dateStatus.length) {
    $dateStatus = $(`
        <div class="labReportDateStatus"
             style="
                 display:block;
                 width:100%;
                 box-sizing:border-box;
                 padding:10px;
                 font-size:13px;
                 color:#333;
                 background:#fff;
                 border-bottom:1px solid #ddd;
             ">
            Select start date
        </div>
    `);
}

// Keep the status bar at the top of the calendar.
$picker.prepend($dateStatus);

if (labReportRangeStartDate && labReportRangeEndDate) {
    $dateStatus.text(
        `Start Date: ${labReportRangeStartDate} | End Date: ${labReportRangeEndDate}`
    );
} else {
    $dateStatus.text("Select start date");
}

    if (labReportRangeStartDate && labReportRangeEndDate) {
        $dateStatus.text(
            `Start Date: ${labReportRangeStartDate} | End Date: ${labReportRangeEndDate}`
        );
    } else {
        $dateStatus.text("Select start date");
    }

    // Destroy the old datepicker before reinitializing it.
    if ($inline.hasClass("hasDatepicker")) {
        $inline.datepicker("destroy");
    }

    $inline.empty().removeClass("hasDatepicker");

    $inline.datepicker({
        dateFormat: "yy-mm-dd",
        changeMonth: true,
        changeYear: true,
        yearRange: "2000:2035",
        showOtherMonths: true,
        selectOtherMonths: true,
        navigationAsDateFormat: false,

        beforeShowDay: function (date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const currentDate = `${year}-${month}-${day}`;

            if (
                labReportRangeStartDate &&
                labReportRangeEndDate &&
                currentDate >= labReportRangeStartDate &&
                currentDate <= labReportRangeEndDate
            ) {
                const isEndpoint =
                    currentDate === labReportRangeStartDate ||
                    currentDate === labReportRangeEndDate;

                return [
                    true,
                    isEndpoint
                        ? "lab-date-range-endpoint"
                        : "lab-date-range",
                    "Selected date range"
                ];
            }

            return [true, "", ""];
        },

        onSelect: function (dateText) {
            console.log("Date clicked:", dateText);

            // FIRST CLICK: Select Start Date.
            if (!labReportPendingStartDate) {
                labReportPendingStartDate = dateText;
                labReportRangeStartDate = dateText;
                labReportRangeEndDate = "";

                $inline.datepicker(
                    "option",
                    "minDate",
                    $.datepicker.parseDate("yy-mm-dd", dateText)
                );

                $dateStatus.text(
                    `Start Date: ${dateText} | Now select End Date`
                );

                $inline.datepicker("refresh");

                console.log("Start Date selected:", dateText);
                return;
            }

            // SECOND CLICK: Select End Date.
            const rangeStart = labReportPendingStartDate;
            const rangeEnd = dateText;

            // Do not accept an end date before the start date.
            if (rangeEnd < rangeStart) {
                $dateStatus.text(
                    `Start Date: ${rangeStart} | Select an End Date on or after the Start Date`
                );

                console.warn("End Date cannot be earlier than Start Date.");
                return;
            }

            // Save the completed date range.
            labReportRangeStartDate = rangeStart;
            labReportRangeEndDate = rangeEnd;

            console.log("Selected date range:", rangeStart, rangeEnd);

            function formatDate(value) {
                const parts = value.split("-");

                return $.datepicker.formatDate(
                    "M dd, yy",
                    new Date(
                        Number(parts[0]),
                        Number(parts[1]) - 1,
                        Number(parts[2])
                    )
                );
            }

            const formattedRange =
                `${formatDate(rangeStart)} – ${formatDate(rangeEnd)}`;

            // Update date labels.
            $(".lab-report-range-label").text(formattedRange);
            $("#reportRange").text(`Data shown: ${formattedRange}`);

            $dateStatus.text(
                `Start Date: ${rangeStart} | End Date: ${rangeEnd}`
            );

            // Update URL parameters without reloading the page.
            const url = new URL(window.location.href);

            url.searchParams.set("date_filter", "custom");
            url.searchParams.set("start_date", rangeStart);
            url.searchParams.set("end_date", rangeEnd);

            window.history.replaceState({}, "", url.toString());

            // Reset pending selection and date restrictions.
            labReportPendingStartDate = "";

            $inline.datepicker("option", "minDate", null);
            $inline.datepicker("refresh");

            // Close the calendar once the complete range has been selected,
            // matching the Hospital Reports chart calendar behavior.
            $picker.addClass("hidden").css("display", "");
            $dropdown.find(".filterDropdown")
                .addClass("hidden")
                .css("display", "");


            // Apply custom filter to the complete Reports dashboard.
            setLabReportActiveFilter("custom");


            // Load graph data for the selected range.
            loadDashboardData("custom", rangeStart, rangeEnd);
        }
    });

    // Position calendar next to its trigger icon.
    function placePicker() {
        if ($picker.hasClass("hidden")) {
            return;
        }

        const anchor = (
            $trigger && $trigger.length
                ? $trigger[0]
                : $dropdown.find(".filterToggle")[0]
        );

        if (!anchor) {
            return;
        }

        const rect = anchor.getBoundingClientRect();
        const width = $picker.outerWidth();
        const height = $picker.outerHeight();

        const left = Math.max(
            8,
            Math.min(
                rect.right - width,
                window.innerWidth - width - 8
            )
        );

        const top = Math.max(
            8,
            Math.min(
                rect.bottom + 8,
                window.innerHeight - height - 8
            )
        );

        $picker.css({
            left: `${left}px`,
            top: `${top}px`,
            right: "auto"
        });
    }

    requestAnimationFrame(placePicker);

    $(window)
        .off("resize.labReportPicker")
        .on("resize.labReportPicker", placePicker);
}


$(document).off("click.labReportFilter");


$(document).on(
    "click.labReportFilter",
    ".filterDropdown [data-filter]",
    function (e) {
        e.preventDefault();
        e.stopPropagation();

        const filterText = String(
            $(this).attr("data-filter") || ""
        ).trim().toLowerCase();

        console.log("Selected filter:", filterText);

        if (!["today", "week", "month", "year", "all", "custom"].includes(filterText)) {
            console.error("Invalid filter:", filterText);
            return;
        }

        if (filterText === "custom") {
            setLabReportActiveFilter(filterText);
            openLabReportDatepicker($(this).closest(".dropdown"), $(".filterToggle"));
            return;
        }

        applyLabReportPreset(filterText);
    }
);

// $(document).on("click.labReportCalendarIcon", ".lab-report-chart-calendar", function (e) {
//     e.preventDefault();
//     e.stopPropagation();
//     openLabReportDatepicker($(this).closest(".dropdown"), $(this));
// });
// All graph calendar icons use the same dashboard date range.
$(document)
    .off("click.labReportCalendarIcon", ".lab-report-chart-calendar")
    .on(
        "click.labReportCalendarIcon",
        ".lab-report-chart-calendar",
        function (e) {
            e.preventDefault();
            e.stopPropagation();

            const $trigger = $(this);
            const $dropdown = $trigger.closest(".dropdown");

            // Open the calendar belonging to the clicked graph.
            openLabReportDatepicker($dropdown, $trigger);
        }
    );

$(document).on("click.labReportDatepickerBack", "#labReportDatepickerBack", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const $dropdown = $(this).closest(".dropdown");
    const $inline = $dropdown.find(".datepicker-inline").first();
    if ($inline.hasClass("hasDatepicker")) $inline.datepicker("option", "minDate", null);
    labReportPendingStartDate = "";
    $dropdown.find(".datepicker-container").addClass("hidden").css("display", "");
    $dropdown.find(".filterDropdown").removeClass("hidden").css("display", "");
});
// =====================================
// FILTER DROPDOWN TOGGLE
// =====================================

$(".filterToggle").off("click.labReportToggle").on("click.labReportToggle", function (e) {

    e.stopPropagation();

    $(".filterDropdown").toggleClass("hidden");

});

// $(document).off("click.labReportOutside").on("click.labReportOutside", function (e) {
//     if ($(e.target).closest(".lab-report-filter, .datepicker-container, .ui-datepicker").length) return;
//     $(".filterDropdown, .datepicker-container").addClass("hidden").css("display", "");
// });
// // Close calendar only when clicking outside.
// $(document)
//     .off("click.labReportOutside")
//     .on("click.labReportOutside", function (e) {

//         // Keep calendar open when clicking dates or month arrows.
//         if (
//             $(e.target).closest(
//                 ".datepicker-container, .ui-datepicker, .lab-report-chart-calendar"
//             ).length
//         ) {
//             return;
//         }

//         // Keep calendar open when interacting with its controls.
//         $(".datepicker-container").addClass("hidden").css("display", "");
//         $(".filterDropdown").addClass("hidden").css("display", "");
//     });

// // Prevent calendar interactions from bubbling to other handlers.
// $(document)
//     .off("click.labReportCalendarInside")
//     .on(
//         "click.labReportCalendarInside",
//         ".datepicker-container, .ui-datepicker",
//         function (e) {
//             e.stopPropagation();
//         }
//     );
// $(document).off("click.labReportPickerInside").on("click.labReportPickerInside", ".datepicker-container, .ui-datepicker", function (e) {
//     e.stopPropagation();
// });
// Keep the calendar open when clicking dates or month arrows.
$(document)
    .off("click.labReportOutside")
    .on("click.labReportOutside", function (e) {

        const $target = $(e.target);

        // Ignore clicks inside the calendar and its navigation arrows.
        if (
            $target.closest(
                ".datepicker-container, .ui-datepicker, " +
                ".ui-datepicker-header, .ui-datepicker-prev, " +
                ".ui-datepicker-next, .lab-report-chart-calendar"
            ).length
        ) {
            
            return;
        }

        // Close the calendar only when clicking outside.
        $(".datepicker-container")
            .addClass("hidden")
            .css("display", "");

        $(".filterDropdown")
            .addClass("hidden")
            .css("display", "");
    });

// Prevent calendar clicks from triggering outside-click handling.
// $(document)
//     .off("click.labReportCalendarInside")
//     .on(
//         "click.labReportCalendarInside",
//         ".datepicker-container, .ui-datepicker",
//         function (e) {
//             e.stopPropagation();
//         }
//     );

// Chart period selectors used to update only their own caption. Route their
// choice through the report loader so chart values and date captions refresh.
$(document).off("click.labReportChartPeriod", ".dropdown-menu li").on("click.labReportChartPeriod", ".dropdown-menu li", function (e) {
    const period = String($(this).text() || "").trim().toLowerCase();
    const filter = { day: "today", week: "week", month: "month", year: "year" }[period];
    if (!filter) return;
    e.preventDefault();
    e.stopPropagation();
    const $dropdown = $(this).closest(".dropdown");
    $dropdown.find(".dropdown-value").text($(this).text().trim());
    $dropdown.find(".dropdown-menu").addClass("hidden");
    applyLabReportPreset(filter);
});
// =====================================
// CUSTOM DROPDOWN
// =====================================

$(".dropdown-btn").click(function (e) {

    e.stopPropagation();

    $(this)
        .siblings(".dropdown-menu")
        .toggleClass("hidden");

});

$(".dropdown-menu li").click(function () {

    // let value = $(this).text();
    let value = $(this)
       .text()
       .trim()
       .toLowerCase();

    $(this)
        .closest(".dropdown")
        .find(".dropdown-value")
        .text(value);

    $(this)
        .parent()
        .addClass("hidden");


    if (
        value.includes("AM") ||
        value.includes("PM")
    ) {

        updateHeatmap(value);

     }



    // BID TREND DYNAMIC

    if (
        value === "day" ||
        value === "week" ||
        value === "month" ||
        value === "year"
    ) {

        updateBidTrend(value);

    }


});

$(document).click(function () {

    $(".dropdown-menu").addClass("hidden");

});

// =====================================
// HEATMAP DYNAMIC
// =====================================
function updateHeatmap(data) {
    $("#heatmap").empty();

    am4core.ready(function () {

        am4core.useTheme(am4themes_animated);

        $("#heatmap").html("");

        var chart = am4core.create(
            "heatmap",
            am4maps.MapChart
        );

        chart.geodata =
            am4geodata_india2019High;

        chart.projection =
            new am4maps.projections.Miller();

        var polygonSeries =
            chart.series.push(
                new am4maps.MapPolygonSeries()
            );

        polygonSeries.useGeodata = true;

        polygonSeries.heatRules.push({

            property: "fill",

            target:
            polygonSeries.mapPolygons.template,

            min:
            am4core.color("#DCEAFE"),

            max:
            am4core.color("#2563EB")

        });

        let mapData = [];

        data.forEach((item) => {

            let stateId = "";

            if (item.hour.includes("12")) {
                stateId = "IN-MH";
            }

            else if (item.hour.includes("11")) {
                stateId = "IN-DL";
            }

            else {
                stateId = "IN-KA";
            }

            mapData.push({

                id: stateId,

                value: item.count

            });

        });

        polygonSeries.data = mapData;

        let polygonTemplate =
            polygonSeries.mapPolygons.template;

        polygonTemplate.tooltipText =
            "{name}: {value}";

    });

}
// =====================================
// BID WIN LOSS
// =====================================

function updateBidWinLoss(data) {
    $("#bidWinChart").empty();

    const container =
        $("#bidWinLossContainer");

    container.empty();

    const rows = [

        {
            label: "Current",
            win: data.win,
            loss: data.loss
        },

        {
            label: "Jul 1-7",
            win: Math.max(data.win - 10, 0),
            loss: Math.min(data.loss + 10, 100)
        },

        {
            label: "Jun 24-30",
            win: Math.max(data.win - 20, 0),
            loss: Math.min(data.loss + 20, 100)
        }

    ];

    rows.forEach((row) => {

        container.append(`

            <div class="flex items-center gap-3">

                <div class="flex-1">

                    <div class="flex h-4 rounded-full overflow-hidden">

                        <div
                            class="bg-green-500 text-white text-[10px] flex items-center justify-center"
                            style="width:${row.win}%"
                        >
                            ${row.win}
                        </div>

                        <div
                            class="bg-red-500 text-white text-[10px] flex items-center justify-center"
                            style="width:${row.loss}%"
                        >
                            ${row.loss}
                        </div>

                    </div>

                </div>

                <span class="text-xs text-gray-500 w-16">
                    ${row.label}
                </span>

            </div>

        `);

    });

}


// =====================================
// PDF DOWNLOAD
// =====================================

// $(".download-btn").click(function () {

//     let targetId = $(this).data("target");

//     let target = document.getElementById(targetId);

//     html2canvas(target, {

//         scale: 2,
//         useCORS: true

//     }).then(canvas => {

//         const imgData =
//             canvas.toDataURL("image/png");

//         const pdf =
//             new jspdf.jsPDF("p", "mm", "a4");

//         const imgWidth = 190;

//         const pageHeight = 295;

//         const imgHeight =
//             (canvas.height * imgWidth) /
//             canvas.width;

//         pdf.addImage(
//             imgData,
//             "PNG",
//             10,
//             10,
//             imgWidth,
//             imgHeight
//         );

//         pdf.save(targetId + ".pdf");

//     });

// });

$(".download-btn").on("click", function () {

    const targetId =
        $(this).data("target");

    // ===== CHART DOWNLOAD =====

    if (
        targetId === "barChart" ||
        targetId === "pieChart" ||
        targetId === "lineChart"
    ) {

        let chartCanvas =
            document.getElementById(targetId);

        const imageData =
            chartCanvas.toDataURL("image/png");

        const { jsPDF } =
            window.jspdf;

        const pdf =
            new jsPDF("p", "mm", "a4");

        pdf.text("Lab Report", 20, 20);

        pdf.addImage(
            imageData,
            "PNG",
            10,
            30,
            180,
            100
        );

        pdf.save(targetId + ".pdf");

        return;
    }

    // ===== NORMAL DIV DOWNLOAD =====

    const target =
        document.getElementById(targetId);

    if (!target) {

        alert("Target not found");
        return;

    }

    html2canvas(target, {

        scale: 2,
        useCORS: true

    }).then((canvas) => {

        const imageData =
            canvas.toDataURL("image/png");

        const { jsPDF } =
            window.jspdf;

        const pdf =
            new jsPDF("p", "mm", "a4");

        const pdfWidth = 190;

        const pdfHeight =
            (canvas.height * pdfWidth) /
            canvas.width;

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



