let barChart;
let pieChart;
let lineChart;
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

function loadDashboardData(filterType = "today") {

    $.ajax({

        url: "/reports/lab-report-data/",
        type: "GET",

        data: {
            filter: filterType
        },

        success: function (response) {
           console.log(response);
            $("#reportRange").text(
                "Data shown: " + response.range_label
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

        error: function (xhr) {

            console.log("ERROR:", xhr.responseText);

        }

    });

}

// DEFAULT LOAD
// loadDashboardData("today");
loadDashboardData("all");
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
$(document).off("click", ".filterDropdown div");
$(".filterDropdown div").on("click", function () {

    let filterText = $(this)
        .attr("data-filter")
        .trim();

    console.log("FILTER:", filterText);

    // RESET CHECK ICONS
    $(".filterDropdown span:first-child")
        .removeClass("text-dodger-blue")
        .addClass("text-light-gray");

    // ACTIVE CHECK
    $(this)
        .find("span:first")
        .removeClass("text-light-gray")
        .addClass("text-dodger-blue");

    // LOAD API
    loadDashboardData(filterText);

    // CLOSE DROPDOWN
    $(".filterDropdown").addClass("hidden");

});
// =====================================
// FILTER DROPDOWN TOGGLE
// =====================================

$(".filterToggle").click(function (e) {

    e.stopPropagation();

    $(".filterDropdown").toggleClass("hidden");

});

$(document).click(function () {

    $(".filterDropdown").addClass("hidden");

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