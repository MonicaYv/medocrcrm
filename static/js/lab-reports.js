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
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
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
    options: {
      responsive: true,
      plugins: { legend: { position: "top" } },
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
    options: {
      responsive: true,
      plugins: { legend: { position: "top" } },
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
        updateHeatmap(filterType);

        updateBidWinLoss(filterType);

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
            $(".bg-mint-leaf").eq(0).css("width", "81%");
            $(".bg-bright-red").eq(0).css("width", "19%");

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
loadDashboardData("today");
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

$(".filterDropdown div").click(function () {

    // let filterText = $(this)
    //     .text()
    //     .trim()
    //     .toLowerCase();
    let filterText = $(this)
        .clone()
        .children()
        .remove()
        .end()
        .text()
        .trim()
        .toLowerCase();

    // REMOVE CHECK ICONS
    $(".filterDropdown span:first-child")
        .removeClass("text-dodger-blue")
        .addClass("text-light-gray");

    // ACTIVE ICON
    $(this)
        .find("span:first")
        .removeClass("text-light-gray")
        .addClass("text-dodger-blue");

    // LOAD DATA
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

    let value = $(this).text();

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
        value === "Day" ||
        value === "Week" ||
        value === "Month" ||
        value === "Year"
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


function updateHeatmap(timeRange) {

    const heatmap = $("#heatmap");

    heatmap.empty();

    let colors = [];

    if (timeRange === "8-9 AM") {

        colors = [20,30,40,50,60];

    } 
    
    else if (timeRange === "10-12 AM") {

        colors = [40,50,60,70,80];

    } 
    
    else if (timeRange === "5-6 PM") {

        colors = [70,80,90,60,50];

    } 
    
    else {

        colors = [90,80,70,60,50];

    }

    for (let i = 0; i < 25; i++) {

        const value = colors[i % colors.length];

        heatmap.append(`
            <div 
                style="
                    width:60px;
                    height:40px;
                    background:rgba(59,130,246,${value / 100});
                    border-radius:6px;
                    margin:4px;
                    display:inline-block;
                ">
            </div>
        `);

    }

}
// =====================================
// BID WIN LOSS
// =====================================

function updateBidWinLoss(filterType) {

    let data = {

        today: {
            values: [81, 19, 85, 15, 60, 40],
            dates: ["Today", "Morning", "Evening"]
        },

        week: {
            values: [70, 30, 75, 25, 55, 45],
            dates: ["Mon-Tue", "Wed-Thu", "Fri-Sat"]
        },

        month: {
            values: [90, 10, 88, 12, 78, 22],
            dates: ["Week 1", "Week 2", "Week 3"]
        },

        custom: {
            values: [95, 5, 92, 8, 85, 15],
            dates: ["Custom 1", "Custom 2", "Custom 3"]
        }

    };

    let values = data[filterType].values;
    let dates = data[filterType].dates;

    // ROW 1
    $("#winBar1").css("width", values[0] + "%");
    $("#lossBar1").css("width", values[1] + "%");

    $("#winText1").text(values[0] + "%");
    $("#lossText1").text(values[1] + "%");

    $("#date1").text(dates[0]);

    // ROW 2
    $("#winBar2").css("width", values[2] + "%");
    $("#lossBar2").css("width", values[3] + "%");

    $("#winText2").text(values[2] + "%");
    $("#lossText2").text(values[3] + "%");

    $("#date2").text(dates[1]);

    // ROW 3
    $("#winBar3").css("width", values[4] + "%");
    $("#lossBar3").css("width", values[5] + "%");

    $("#winText3").text(values[4] + "%");
    $("#lossText3").text(values[5] + "%");

    $("#date3").text(dates[2]);

}

function updateBidTrend(type) {

    let labels = [];
    let cbc = [];
    let rtpcr = [];

    if (type === "Day") {

        labels = ["9AM","12PM","3PM","6PM"];

        cbc = [120,150,180,140];

        rtpcr = [200,240,210,260];

    }

    else if (type === "Week") {

        labels = ["Week1","Week2","Week3","Week4"];

        cbc = [320,340,310,360];

        rtpcr = [420,380,460,400];

    }

    else if (type === "Month") {

        labels = ["Jan","Feb","Mar","Apr"];

        cbc = [500,600,450,700];

        rtpcr = [750,680,800,720];

    }

    else {

        labels = ["2022","2023","2024","2025"];

        cbc = [4000,5200,6100,7200];

        rtpcr = [5000,6400,7600,8300];

    }

    lineChart.data.labels = labels;

    lineChart.data.datasets[0].data = cbc;

    lineChart.data.datasets[1].data = rtpcr;

    lineChart.update();

}


// =====================================
// PDF DOWNLOAD
// =====================================

$(".download-btn").click(function () {

    let targetId = $(this).data("target");

    let target = document.getElementById(targetId);

    html2canvas(target, {

        scale: 2,
        useCORS: true

    }).then(canvas => {

        const imgData =
            canvas.toDataURL("image/png");

        const pdf =
            new jspdf.jsPDF("p", "mm", "a4");

        const imgWidth = 190;

        const pageHeight = 295;

        const imgHeight =
            (canvas.height * imgWidth) /
            canvas.width;

        pdf.addImage(
            imgData,
            "PNG",
            10,
            10,
            imgWidth,
            imgHeight
        );

        pdf.save(targetId + ".pdf");

    });

});

