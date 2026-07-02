$(document).ready(function () {

    loadDoctorReportData();

    // Filter dropdown toggle
    $("#filterToggle").on("click", function (e) {
        e.stopPropagation();
        $("#filterDropdown").toggleClass("hidden");
        $("#mainMenu").removeClass("hidden");
        $("#dateMenu, #visitMenu").addClass("hidden");
    });

    // Prevent closing when clicking inside dropdown
    $("#filterDropdown").on("click", function (e) {
        e.stopPropagation();
    });

    // Close filter when clicking outside
    $(document).on("click", function () {
        $("#filterDropdown").addClass("hidden");
        $("#dateMenu, #visitMenu").addClass("hidden");
        $("#mainMenu").removeClass("hidden");
    });

    // Open submenu from main menu
    $("#filterDropdown [data-open]").on("click", function (e) {
        e.stopPropagation();
        const target = $(this).data("open") + "Menu";
        $("#mainMenu").addClass("hidden");
        $("#dateMenu, #visitMenu").addClass("hidden");
        $("#" + target).removeClass("hidden");
    });

    // Back button in submenu
    $("#filterDropdown [data-back]").on("click", function (e) {
        e.stopPropagation();
        $("#dateMenu, #visitMenu").addClass("hidden");
        $("#mainMenu").removeClass("hidden");
    });

    // Apply submenu option
    $("#filterDropdown .option").on("click", function (e) {
        e.stopPropagation();
        const filterType = $(this).data("type");
        const filterValue = $(this).data("value");

        if (filterType === "date" && filterValue) {
            loadDoctorReportData(filterValue.toLowerCase());
        }

        $("#filterDropdown").addClass("hidden");
        $("#dateMenu, #visitMenu").addClass("hidden");
        $("#mainMenu").removeClass("hidden");
    });

});



function loadDoctorReportData(filter = "month") {

    $.ajax({

        url: "/reports/doctor-report-data/",
        method: "GET",
        data: {
            filter: filter,
        },

        success: function (response) {
            // console.log(response);
            // console.log(response.consultation_data);

            updateStats(response.stats);

            loadBidChart(response.bid_chart);

            loadConsultationTable(response.consultation_data);
            loadHeatmap(response.heatmap_data);

        },

        error: function (error) {

            console.log("Doctor report API error", error);

        }

    });

}



function updateStats(stats) {

    $(".total-patient-count").text(stats.total_patients);

    $(".birds-received-count").text(stats.birds_received);

    $(".quarter-growth").text(stats.quarter_growth + "%");

    $(".avg-revenue").text("₹" + stats.avg_revenue);

}



function loadBidChart(chartData) {
    // console.log("CHART DATA:", chartData);

    $(".bid-chart-container").empty();

    chartData.forEach((item) => {
        // console.log(item);

        $(".bid-chart-container").append(`

            <div class="flex flex-col items-center gap-2">

                <div class="w-10 sm:w-[56px] h-36 sm:h-44 flex flex-col justify-end overflow-hidden gap-[2px]">

                    <div
                        class="bg-red-500 w-full"
                        style="height:${item.lost}%">
                    </div>

                    <div
                        class="bg-green-500 w-full"
                        style="height:${item.won}%">
                    </div>

                </div>

                <span class="text-xs text-gray-500">
                    ${item.day}
                </span>

            </div>

        `);

    });

}



function loadConsultationTable(data) {

    $(".consultation-table-body").empty();

    data.forEach((item) => {

        $(".consultation-table-body").append(`

            <tr>

                <td class="px-4 py-1 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-azure-radiance"></span>
                    ${item.day}
                </td>

                <td class="text-right px-4 py-1 text-deep-blue font-regular text-sm">
                    ${item.appointments}
                </td>

                <td class="text-right px-4 py-1 text-deep-blue font-regular text-sm">
                    ₹${item.avg_fee}
                </td>

                <td class="text-right px-4 py-1 text-deep-blue font-regular text-sm">
                    ₹${item.earnings}
                </td>

            </tr>

        `);

    });

}

function loadHeatmap(heatmapData) {

    am4core.useTheme(am4themes_animated);

    var chart = am4core.create("heatmap", am4maps.MapChart);

    chart.geodata = am4geodata_india2019High;
    var zoomControl = new am4maps.ZoomControl();

    chart.zoomControl = zoomControl;
    zoomControl.plusButton.background.cornerRadius(8,8,8,8);

    zoomControl.minusButton.background.cornerRadius(8,8,8,8);

    zoomControl.plusButton.width = 30;
    zoomControl.plusButton.height = 30;

    zoomControl.minusButton.width = 30;
    zoomControl.minusButton.height = 30;

    zoomControl.slider.height = 2;

    zoomControl.slider.background.fill = am4core.color("#ffffff");

    zoomControl.slider.startGrip.background.fill = am4core.color("#ffffff");

    zoomControl.slider.startGrip.width = 12;

    zoomControl.slider.startGrip.height = 12;

    zoomControl.valign = "bottom";

    zoomControl.align = "right";

    zoomControl.marginRight = 20;

    zoomControl.marginBottom = 20;

    chart.homeZoomLevel = 1;

    chart.homeGeoPoint = {
        longitude: 78.9629,
        latitude: 22.5937
    };

    var polygonSeries = chart.series.push(
        new am4maps.MapPolygonSeries()
    );

    polygonSeries.useGeodata = true;

    polygonSeries.heatRules.push({
        property: "fill",
        target: polygonSeries.mapPolygons.template,
        min: am4core.color("#FFD580"),
        max: am4core.color("#FF3B30")
    });

    polygonSeries.data = heatmapData;

    var polygonTemplate = polygonSeries.mapPolygons.template;

    polygonTemplate.tooltipText = "{name}: {value}";

    polygonTemplate.strokeWidth = 0.5;

    polygonTemplate.nonScalingStroke = true;

    var hs = polygonTemplate.states.create("hover");

    hs.properties.fill = am4core.color("#FF6B00");
}

$(".download-btn").on("click", function () {
    const targetId = $(this).data("target");
    const exportType = $(this).data("type");
    const target = document.getElementById(targetId);
    if (!target) return;

    if (exportType === "excel") {
      const rows = [];
      const headers = [];
      $(target).find("thead th").each(function () {
        headers.push($(this).text().trim());
      });
      rows.push(headers.join(","));
      $(target).find("tbody tr").each(function () {
        const cols = [];
        $(this).find("td").each(function () {
          cols.push($(this).text().trim());
        });
        if (cols.length) {
          rows.push(cols.join(","));
        }
      });
      const csvContent = rows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${targetId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    if (!window.jspdf) return;
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Use html2canvas to capture the element
    if (typeof html2canvas !== 'undefined') {
      html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const pageHeight = 297;
        const margin = 10;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = margin;

        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - margin * 2);

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
          heightLeft -= (pageHeight - margin * 2);
        }

        pdf.save(`${targetId}.pdf`);
      }).catch(err => {
        console.error('PDF generation failed:', err);
        alert('Failed to generate PDF. Please try again.');
      });
    } else {
      alert('PDF generation library not loaded. Please refresh the page.');
    }
  });
