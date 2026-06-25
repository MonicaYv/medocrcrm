let barChart;
let pieChart;
let lineChart;
let patientJourneyChart;
$(document).ready(function () {
  // --------- BAR CHART (Most Requested Test) ----------
  const barCtx = document.getElementById("barChart").getContext("2d");
  // new Chart(barCtx, {
  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "July",
        "Aug",
        "Sept",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Requests",
          data: [120, 160, 70, 150, 100, 50, 80, 100, 59, 90, 150, 200],
          backgroundColor: [
            "#3b82f6",
            "#EF4444",
            "#FFB95A",
            "#84CC16",
            "#22C55E",
            "#1BC0C4",
            "#083684",
            "#8B5CF6",
            "#A855F7",
            "#6366F1",
            "#EC4899",
            "#3B82F6",
          ],
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
      labels: ["Direct (15%)", "NGO Referrals (35%)", "Ads (50%)"],
      datasets: [
        {
          data: [15, 35, 50],
          backgroundColor: ["#EF4444", "#155DFC", "#FFB95A"],
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
      labels: ["10:00", "10:30", "11:00", "11:30"],
      datasets: [
        {
          label: "CBC",
          data: [320, 340, 310, 360],
          borderColor: "#3b82f6",
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "top" } },
    },
  });

  const horizontalCtx = document
    .getElementById("horizontalBarChart")
    .getContext("2d");
  patientJourneyChart = new Chart(horizontalCtx, {

    type: "bar",

    data: {

        labels: ["Loading"],

        datasets: [

            {

                axis: "y",

                data: [0],

                fill: false,

                backgroundColor: [

                    "#3B82F6",

                    "#EF4444",

                    "#FABA23",

                    "#84CC16",

                    "#EC4899",

                ],

            },

        ],

    },

    options: {

        responsive: true,

        plugins: {

            legend: false

        },

        indexAxis: "y",

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

  // --------- DOWNLOAD AS PDF ----------
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

  // ================================
// FILTER DROPDOWN
// ================================

// FILTER TOGGLE
$(".filterToggle").on("click", function (e) {

    e.stopPropagation();

    $(".filterDropdown").toggleClass("hidden");

});


// CUSTOM CALENDAR OPEN
$(".calendar-icon").on("click", function (e) {

    e.stopPropagation();

    $(".datepicker-container").addClass("hidden");

    $(this)
      .closest(".dropdown")
      .find(".datepicker-container")
      .toggleClass("hidden");

});

// $(".filterToggle").on("click", function (e) {

// // CUSTOM CALENDAR OPEN
// $(".calendar-icon").on("click", function (e) {

//     e.stopPropagation();

//     $(".datepicker-container").addClass("hidden");

//     $(this)
//       .closest(".dropdown")
//       .find(".datepicker-container")
//       .toggleClass("hidden");

// });

//     e.stopPropagation();

//     $(".filterDropdown").toggleClass("hidden");

// });

// Close dropdown outside click
$(document).on("click", function () {

    $(".filterDropdown").addClass("hidden");
    $(".datepicker-container").addClass("hidden");

});

$(".download-btn").on("click", function () {

    const targetId = $(this).data("target");

    const targetElement = document.getElementById(targetId);

    if (!targetElement) {
        console.error("Target element not found");
        return;
    }

    html2canvas(targetElement, {
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        scale: 2,
        logging: false
    }).then(canvas => {

        const imgData = canvas.toDataURL("image/png");

        

        if (!window.jspdf) {
            alert("jsPDF library not loaded");
            return;  
          }

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF("p", "mm", "a4");

        const imgWidth = 190;

        const pageHeight = 295;

        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;

        let position = 10;

        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);

        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`${targetId}.pdf`);
    });

});

  // --------- HEATMAP ----------
  // Wait for DOM to be ready using jQuery

  am4core.useTheme(am4themes_animated);

  // Create map instance
 
  
  
  window.heatmapChart = am4core.create("heatmap", am4maps.MapChart);

  // Set map definition
  
  heatmapChart.geodata =
    am4geodata_india2019High;

  heatmapChart.homeZoomLevel = 1;

  heatmapChart.homeGeoPoint = {
      longitude: 78.9629,
      latitude: 22.5937
  };

  // Create map polygon series

  window.polygonSeries = heatmapChart.series.push(new am4maps.MapPolygonSeries());

  // Set min/max fill color for each area
  polygonSeries.heatRules.push({
    property: "fill",
    target: polygonSeries.mapPolygons.template,
    min: heatmapChart.colors.getIndex(1).brighten(1),
    max: heatmapChart.colors.getIndex(1).brighten(-0.3),
  });

  // Make map load polygon data (state shapes and names) from GeoJSON
  polygonSeries.useGeodata = true;
  polygonSeries.geodata = am4geodata_india2019High;
  polygonSeries.calculateVisualCenter = true;
  
   polygonSeries.exclude = ["AQ"];
   

  

  polygonSeries.dataFields.value = "value";

  polygonSeries.dataFields.id = "id";
  polygonSeries.mapPolygons.template.propertyFields.fill =
    "fill";
  polygonSeries.mapPolygons.template.applyOnClones = true;

  // Set heatmap values for each state
  polygonSeries.data = [];
  heatmapChart.zoomControl =
    new am4maps.ZoomControl();


  // Configure series tooltip
  var polygonTemplate = polygonSeries.mapPolygons.template;
  polygonTemplate.fill =
    am4core.color("#DCEBFF");
  polygonTemplate.tooltipText = "{name}: {value}";
  polygonTemplate.nonScalingStroke = true;
  polygonTemplate.strokeWidth = 0.5;

  // Create hover state and set alternative fill color
  var hs = polygonTemplate.states.create("hover");
  hs.properties.fill = am4core.color("#3c5bdc");

  // Toggle dropdown visibility
  $(document).on("click", ".dropdown-btn", function (e) {
    e.stopPropagation();
    const $dropdown = $(this).closest(".dropdown");
    $(".dropdown-menu")
      .not($dropdown.find(".dropdown-menu"))
      .addClass("hidden");
    $dropdown.find(".dropdown-menu").toggleClass("hidden");
  });

  // Handle selection
  $(document).on("click", ".dropdown-menu li", function (e) {
    const $dropdown = $(this).closest(".dropdown");
    const value = $(this).text();
    $dropdown.find(".dropdown-value").text(value);
    $dropdown.find(".dropdown-menu").addClass("hidden");
  });

  // Close dropdown when clicking outside
  $(document).click(function () {
    $(".dropdown-menu").addClass("hidden");
  });


});


// // ================================
// // REPORT FILTER
// // ================================

// function filterReports(type) {

//     console.log("Selected Filter:", type);

//     let revenue = "";
//     let highest = "";
//     let growth = "";
//     let avg = "";

//     if (type === "today") {

//         revenue = "₹15,000";
//         highest = "₹8,000";
//         growth = "+2%";
//         avg = "₹500";

//     }

//     else if (type === "week") {

//         revenue = "₹1.2 L";
//         highest = "₹68K";
//         growth = "+8%";
//         avg = "₹1,500";

//     }

//     else if (type === "month") {

//         revenue = "₹4.5 L";
//         highest = "₹1.5 L";
//         growth = "+15%";
//         avg = "₹3,150";

//     }

//     // Update cards
//     document.getElementById("totalRevenue").innerText = revenue;

//     document.getElementById("highestRevenue").innerText = highest;

//     document.getElementById("quarterGrowth").innerText = growth;

//     document.getElementById("avgRevenue").innerText = avg;

// }


function loadDashboardData(filterType) {

    $.ajax({
        url: "/reports/hospital-report-data/",
        type: "GET",
        data: {
            filter: filterType,
            visit_type: $("#visitTypeFilter").val()
        },

        success: function(response) {

            // CARDS
            $("#totalRevenue").text(
              response.stats.revenue
            );

            $("#highestRevenue").text(
               response.stats.highest_revenue
            );

            $("#quarterGrowth").text(
               response.stats.growth
           );

            $("#avgRevenue").text(
               response.stats.avg_revenue
            );
            // $("#ratingsValue").text(response.stats.ratings);
            // $("#bookingsValue").text(response.stats.bookings);
            // $("#avgBidValue").text(response.stats.avg_bid);

            // BAR CHART UPDATE
            barChart.data.labels =
                response.most_requested_test.labels;

            barChart.data.datasets[0].data =
                response.most_requested_test.data;

            barChart.update();

            // PIE CHART UPDATE
            pieChart.data.labels =
                response.revenue_by_test.labels;

            pieChart.data.datasets[0].data =
                response.revenue_by_test.data;

            pieChart.update();

            // LINE CHART UPDATE
            lineChart.data.labels =
                response.bid_trend.labels;

            lineChart.data.datasets[0].data =
                response.bid_trend.cbc;
                

            lineChart.update();


              // ==========================
               // // PATIENT JOURNEY UPDATE
              // ==========================

             patientJourneyChart.data.labels =
               response.patient_journey.labels;

             patientJourneyChart.data.datasets[0].data =
                response.patient_journey.data;

             patientJourneyChart.update();



             // ==========================================
            // CONVERSION INSIGHTS DYNAMIC
             // ==========================================

            // ==========================================
          // CONVERSION INSIGHTS DYNAMIC
           // ==========================================

          let conversionRows = "";

          const colors = [

              "bg-azure-radiance",
              "bg-light-green",
              "bg-sunrise-yellow",
              "bg-violet",
              "bg-red"

           ];

          response.patient_journey.labels.forEach(
             (label, index) => {

               conversionRows += `

             <div class="flex items-center justify-between px-4 border-b border-blue-haze py-2">

                <div class="flex items-center gap-1">

                <div class="w-1 h-1 rounded-full ${colors[index]}"></div>

                <p class="font-normal text-xs">
                    ${label}
                </p>

            </div>

            <div class="flex items-center gap-[130px]">

                <p class="font-normal text-xs">
                    ${response.patient_journey.data[index]}
                </p>

                <p class="font-normal text-xs">
                    ${response.patient_journey.conversion[index]}
                </p>

            </div>

        </div>

        `;

    }
);

$("#conversionTableBody").html(
    conversionRows
);
   // ==========================================
   // PACKAGE TABLE DYNAMIC
   // ==========================================

    let packageRows = "";

   response.package_table.forEach((item, index) => {

        let colorClass = "bg-azure-radiance";

        if (index === 1) {
           colorClass = "bg-light-green";
        }

        else if (index === 2) {
           colorClass = "bg-sunrise-yellow";
        }

       packageRows += `

       <div class="flex items-center justify-between px-4 border-b border-blue-haze">

           <div class="flex items-center gap-1">

               <div class="w-1 h-1 rounded-full ${colorClass}"></div>

               <p class="font-normal text-xs">
                   ${item.package}
               </p>

          </div>

          <div class="flex items-center gap-[130px]">

            <p class="font-normal text-xs">
                ${item.bookings}
            </p>

            <p class="font-normal text-xs">
                ${item.conversion}
            </p>

         </div>

      </div>

     `;

});

  $("#packageTableBody").html(
       packageRows
  );


             // ==========================
             // HEATMAP UPDATE
             // ==========================

             const stateMap = {

                "Maharashtra": "IN-MH",
                "Delhi": "IN-DL",
                "Karnataka": "IN-KA",
                "Tamil Nadu": "IN-TN",
                "Gujarat": "IN-GJ",
                "Rajasthan": "IN-RJ",
                "Uttar Pradesh": "IN-UP",
                "Madhya Pradesh": "IN-MP",
                "West Bengal": "IN-WB",
                "Bihar": "IN-BR",
                "Punjab": "IN-PB",
                "Haryana": "IN-HR",
                "Kerala": "IN-KL",
                "Telangana": "IN-TG",
                "Andhra Pradesh": "IN-AP"

              };

let heatmapData = [];

response.heatmap.labels.forEach((state, index) => {

    const cleanedState = state.trim();

    const mapId = stateMap[cleanedState];

    if (mapId) {

        heatmapData.push({

            id: mapId,

            value: response.heatmap.data[index]

        });

    }

});

if (heatmapData.length === 0) {

    heatmapData = [
        {
            id: "IN-MH",
            value: 0
        }
    ];

}


polygonSeries.data = heatmapData;
polygonSeries.invalidateRawData();

heatmapChart.invalidateRawData();

heatmapChart.reinit();

heatmapChart.invalidateSize();

heatmapChart.validateData();



        },

        error: function(error) {

            console.log("API Error:", error);

        }

    });

}
        

// ================================
// REPORT FILTER
// ================================

// $(".report-filter").click(function () {
// $("#visitTypeFilter").change(function () {

//     let visitType = $(this).val();

//     loadDashboardData(
//         $(".report-filter.active").data("type"),
//         visitType
//     );

// });
$("#visitTypeFilter").change(function () {

    let activeType =
        $(".report-filter.active").data("type") || "today";

    loadDashboardData(activeType);

});
$(".report-filter").click(function () {

    $(".report-filter").removeClass("active");
    $(this).addClass("active");

    let type = $(this).data("type");
    console.log("Filter Clicked:", type);

    loadDashboardData(type);

    $(".report-filter span")
        .removeClass("text-dodger-blue")
        .addClass("text-light-gray");

    $(this).find("span")
        .removeClass("text-light-gray")
        .addClass("text-dodger-blue");

    if (type === "custom") {
        $(".datepicker-container").removeClass("hidden");
    }

});
   
// ================================
// SEARCH FUNCTIONALITY
// ================================

document.getElementById("searchInput")
.addEventListener("keyup", function () {

    let value = this.value.toLowerCase();

    const departmentSection =
    document.getElementById("departmentRevenueSection");

    const packageSection =
    document.getElementById("packageSection");

    const conversionSection =
    document.getElementById("conversionSection");
    
    const loadAnalyticsSection =
    document.getElementById("loadAnalyticsSection");

    const heatmapSection =
    document.getElementById("heatmapSection");

    const patientJourneySection =
    document.getElementById("patientJourneySection");

    // SHOW ALL IF EMPTY
    if (value === "") {

        departmentSection.style.display = "";
        packageSection.style.display = "";
        conversionSection.style.display = "";

        loadAnalyticsSection.style.display = "";
        heatmapSection.style.display = "";
        patientJourneySection.style.display = "";

        return;
    }

    // HIDE ALL FIRST
    departmentSection.style.display = "none";
    packageSection.style.display = "none";
    conversionSection.style.display = "none";


    loadAnalyticsSection.style.display = "none";
    heatmapSection.style.display = "none";
    patientJourneySection.style.display = "none";

    // DEPARTMENT SEARCH
    if (
        value.includes("department") ||
        value.includes("revenue") ||
        value.includes("opd")
    ) {

        departmentSection.style.display = "";

    }

    // PACKAGE SEARCH
    if (
        value.includes("package") ||
        value.includes("booking") ||
        value.includes("lead")
    ) {

        packageSection.style.display = "";

    }

    // CONVERSION SEARCH
    if (
        value.includes("conversion") ||
        value.includes("patient") ||
        value.includes("deal")
    ) {

        conversionSection.style.display = "";

    }

    // LOAD ANALYTICS SEARCH
   if (
       value.includes("load") ||
       value.includes("analytics") ||
        value.includes("cbc")
   ) {
       loadAnalyticsSection.style.display = "";
   }

  // HEATMAP SEARCH
  if (
    value.includes("heatmap") ||
    value.includes("map") ||
    value.includes("state")
  ) {
    heatmapSection.style.display = "";
  }

// PATIENT JOURNEY SEARCH
  if (
    value.includes("journey") ||
    value.includes("feedback") ||
    value.includes("visited")
 ) {
    patientJourneySection.style.display = "";
  }

   
$('.report-filter[data-type="today"]')
    .addClass("active");

// DEFAULT LOAD
loadDashboardData("today");


});



    
