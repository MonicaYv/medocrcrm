let barChart;
let pieChart;
let lineChart;
let patientJourneyChart;

const hospitalReportUserId = document.getElementById("hospitalReportsPage")?.dataset.userId || "unknown";
const hospitalChartDateStorageKey = `hospital-report-chart-dates:${hospitalReportUserId}`;
let individualChartDates = {};
try {
  individualChartDates = JSON.parse(localStorage.getItem(hospitalChartDateStorageKey) || "{}");
} catch (error) {
  console.warn("Could not restore saved hospital report chart dates.", error);
  individualChartDates = {};
}

function persistIndividualChartDates() {
  try {
    localStorage.setItem(hospitalChartDateStorageKey, JSON.stringify(individualChartDates));
  } catch (error) {
    console.warn("Could not save hospital report chart dates.", error);
  }
}

$(document).ready(function () {
  // --------- 1. BAR CHART INITIALIZATION ----------
  const barCtx = document.getElementById("barChart");
  if (barCtx) {
    barChart = new Chart(barCtx.getContext("2d"), {
      type: "bar",
      data: {
        labels: [],
        datasets: [{
          label: "Requests",
          data: [],
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
        labels: [],
        datasets: [{
          data: [],
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
        labels: [],
        datasets: [{
          label: "Appointments",
          data: [],
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
  // --------- 6. INTERACTIVE DROPDOWN HANDLERS ----------
  // $(".calendar-icon").on("click", function (e) {
  //   e.stopPropagation();
  //   $(".datepicker-container").addClass("hidden");
  //   $(this).closest(".dropdown").find(".datepicker-container").toggleClass("hidden");
  // });

  // $(document).on("click", function () {
  //   $(".filterDropdown").addClass("hidden");
  //   $(".datepicker-container").addClass("hidden");
  //   $(".dropdown-menu").addClass("hidden");
  // });

  $(document).on("click", ".dropdown-btn", function (e) {
    e.stopPropagation();
    const $dropdown = $(this).closest(".dropdown");
    $(".dropdown-menu").not($dropdown.find(".dropdown-menu")).addClass("hidden");
    $dropdown.find(".dropdown-menu").toggleClass("hidden");
  });

  $(document).on("click", ".dropdown-menu li", function (e) {
    e.stopPropagation();
    const selected = $(this).text().trim();
    const $dropdown = $(this).closest(".dropdown");
    $dropdown.find(".dropdown-value").text(selected);
    $dropdown.find(".dropdown-menu").addClass("hidden");
    if ($dropdown.closest("#departmentRevenueSection").length && barChart) {
      const source = window.lastHospitalReportData?.most_requested_test;
      if (!source) return;
      const index = source.labels.indexOf(selected);
      const showAll = selected.toLowerCase() === "all departments";
      barChart.data.labels = showAll ? source.labels : (index >= 0 ? [source.labels[index]] : []);
      barChart.data.datasets[0].data = showAll ? source.data : (index >= 0 ? [source.data[index]] : []);
      barChart.update();
    }
  });

  // --------- 7. DOWNLOAD CONTEXT TO PDF (ROBUST MULTI-TARGET REPORT ENGINE) ----------
  function getJsPdfClass() {
    if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
    if (window.jsPDF) return window.jsPDF;
    return null;
  }

  function getCanvasWithWhiteBg(canvas, bgColor) {
    bgColor = bgColor || "#ffffff";
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width || 800;
    tempCanvas.height = canvas.height || 400;
    const ctx = tempCanvas.getContext("2d");
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    try {
      ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
    } catch (e) {
      console.warn("Could not draw canvas to tempCanvas:", e);
    }
    return tempCanvas.toDataURL("image/png");
  }

  async function captureHeatmapImage() {
    // 1. Try amCharts exporting plugin if available
    if (window.heatmapChart && window.heatmapChart.exporting && typeof window.heatmapChart.exporting.getImage === "function") {
      try {
        const img = await window.heatmapChart.exporting.getImage("png");
        if (img && img.startsWith("data:image")) return img;
      } catch (err) {
        console.warn("amCharts exporting.getImage failed, trying SVG serializer", err);
      }
    }

    // 2. Try SVG element serialization to canvas
    const svgEl = document.querySelector("#heatmap svg");
    if (svgEl) {
      try {
        const svgString = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const URLObj = window.URL || window.webkitURL || window;
        const blobUrl = URLObj.createObjectURL(svgBlob);
        const img = new Image();
        const w = svgEl.clientWidth || svgEl.getBoundingClientRect().width || 700;
        const h = svgEl.clientHeight || svgEl.getBoundingClientRect().height || 350;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(w * 2, 800);
        canvas.height = Math.max(h * 2, 400);

        const dataUrl = await new Promise((resolve, reject) => {
          img.onload = function () {
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URLObj.revokeObjectURL(blobUrl);
            resolve(canvas.toDataURL("image/png"));
          };
          img.onerror = function (e) {
            URLObj.revokeObjectURL(blobUrl);
            reject(e);
          };
          img.src = blobUrl;
        });
        if (dataUrl) return dataUrl;
      } catch (err) {
        console.warn("SVG serializer failed, trying html2canvas fallback", err);
      }
    }

    // 3. Fallback to html2canvas
    if (typeof html2canvas === "function") {
      const el = document.getElementById("heatmap");
      if (el) {
        try {
          const canvas = await html2canvas(el, {
            backgroundColor: "#ffffff",
            useCORS: true,
            allowTaint: true,
            scale: 2,
            logging: false
          });
          return canvas.toDataURL("image/png");
        } catch (err) {
          console.warn("html2canvas heatmap capture failed", err);
        }
      }
    }
    return null;
  }

  function drawReportHeader(pdf, reportTitle, subtitle, dateRangeText) {
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Top Brand Accent Stripe
    pdf.setFillColor(21, 93, 252); // dodger blue
    pdf.rect(0, 0, pageWidth, 5, "F");

    // Header Background Box
    pdf.setFillColor(241, 245, 249); // light slate gray
    pdf.rect(14, 10, pageWidth - 28, 26, "F");
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(14, 10, pageWidth - 28, 26, "S");

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42); // slate 900
    pdf.text(reportTitle.toUpperCase(), 18, 18);

    // Subtitle
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105); // slate 600
    pdf.text(subtitle, 18, 24);

    // Metadata line
    const now = new Date();
    const generatedOn = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }) + " " + now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    const metaText = `Period: ${dateRangeText || "All Available Dates"}   |   Generated: ${generatedOn}   |   Status: Verified Report`;
    pdf.text(metaText, 18, 31);
  }

  function drawReportFooter(pdf) {
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
      pdf.text("MedOCR CRM Hospital Management System  -  Confidential Administrative Report", 14, pageHeight - 7);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 7);
    }
  }

  function drawReportTable(pdf, headers, rows, startY, colWidths) {
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

      if (rowIndex % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(14, currentY, 182, rowHeight, "F");
      }

      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, currentY + rowHeight, 196, currentY + rowHeight);

      pdf.setTextColor(51, 65, 85);
      let cellX = 16;
      row.forEach((cell, colIndex) => {
        pdf.text(String(cell !== undefined && cell !== null ? cell : "-"), cellX, currentY + 4.5);
        cellX += colWidths[colIndex];
      });

      currentY += rowHeight;
    });

    return currentY;
  }

  $(document).on("click", ".download-btn", async function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $btn = $(this);
    if ($btn.prop("disabled")) return;

    const targetId = $btn.data("target");
    const targetElement = document.getElementById(targetId);

    if (!targetElement && targetId !== "lineChart" && targetId !== "heatmap" && targetId !== "horizontalBarChart") {
      const msg = "Report target element not found on page.";
      console.error(msg, targetId);
      if (typeof toastr !== "undefined") toastr.error(msg);
      else alert(msg);
      return;
    }

    const jsPdfClass = getJsPdfClass();
    if (!jsPdfClass) {
      const msg = "PDF download generator library is still loading. Please try again in a few moments.";
      console.error(msg);
      if (typeof toastr !== "undefined") toastr.warning(msg);
      else alert(msg);
      return;
    }

    // Disable button and show interactive loading state
    const originalHtml = $btn.html();
    $btn.prop("disabled", true).addClass("opacity-75 cursor-wait");
    $btn.html('<span class="inline-flex items-center justify-center gap-2"><svg class="animate-spin h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Generating PDF...</span>');

    try {
      const pdf = new jsPdfClass("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      let filename = `Hospital_Report_${targetId}.pdf`;

      // =========================================================
      // CASE 1: LOAD ANALYTICS (lineChart)
      // =========================================================
      if (targetId === "lineChart") {
        filename = "Hospital_Load_Analytics_Report.pdf";
        const dateRange = $("#loadAnalyticsSection .chart-date-label").text().trim() || "Today";
        drawReportHeader(pdf, "Hospital Load Analytics Report", "Appointment counts by hour", dateRange);

        // Chart Visual
        let chartDataUrl = null;
        if (typeof lineChart !== "undefined" && lineChart) {
          chartDataUrl = getCanvasWithWhiteBg(lineChart.canvas, "#ffffff");
        } else {
          const cvs = document.getElementById("lineChart");
          if (cvs) chartDataUrl = getCanvasWithWhiteBg(cvs, "#ffffff");
        }

        let startTableY = 40;
        if (chartDataUrl) {
          try {
            pdf.addImage(chartDataUrl, "PNG", 14, 38, 182, 70);
            startTableY = 113;
          } catch (imgErr) {
            console.warn("Failed to attach lineChart image to PDF:", imgErr);
            startTableY = 42;
          }
        }

        // Section Title for Table
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(15, 23, 42);
        pdf.text("HOURLY DATA BREAKDOWN", 14, startTableY);

        // Table Data
        const labels = (typeof lineChart !== "undefined" && lineChart && lineChart.data && lineChart.data.labels)
          ? lineChart.data.labels
          : (window.lastHospitalReportData?.bid_trend?.labels || []);
        const values = (typeof lineChart !== "undefined" && lineChart && lineChart.data && lineChart.data.datasets && lineChart.data.datasets[0])
          ? lineChart.data.datasets[0].data
          : (window.lastHospitalReportData?.bid_trend?.cbc || []);

        const tableHeaders = ["#", "Time Slot / Hour", "Metric", "Appointments"];
        const colWidths = [15, 60, 60, 50];
        const tableRows = labels.map((label, idx) => {
          const val = Number(values[idx] || 0);
          const status = "";
          return [idx + 1, label, "Appointments", val];
        });

        const totalVol = values.reduce((acc, v) => acc + (Number(v) || 0), 0);
        const peakVol = values.length ? Math.max(...values.map(Number)) : 0;
        const avgVol = values.length ? Math.round(totalVol / values.length) : 0;
        tableRows.push(["-", "Summary Total", "All Hours Tracked", totalVol]);

        drawReportTable(pdf, tableHeaders, tableRows, startTableY + 4, colWidths);
      }

      // =========================================================
      // CASE 2: HEATMAP (heatmap)
      // =========================================================
      else if (targetId === "heatmap") {
        filename = "Hospital_Regional_Heatmap_Report.pdf";
        const dateRange = $("#heatmapSection .chart-date-label").text().trim() || "All Dates";
        drawReportHeader(pdf, "Hospital Regional Patient Heatmap Report", "Geographic Patient Origin & State Density Analysis", dateRange);

        // Map Visual
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

        // Section Title for Table
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(15, 23, 42);
        pdf.text("REGIONAL PATIENT VOLUME & SHARE SUMMARY", 14, startTableY);

        // Extract State Data
        let statesList = [];
        if (window.lastHospitalReportData?.heatmap?.labels) {
          statesList = window.lastHospitalReportData.heatmap.labels.map((label, index) => ({
            id: window.lastHospitalReportData.heatmap.ids?.[index] || label,
            name: label,
            value: window.lastHospitalReportData.heatmap.data[index] || 0
          }));
        } else if (window.polygonSeries && window.polygonSeries.data && window.polygonSeries.data.length) {
          statesList = window.polygonSeries.data;
        }

        const stateNameMap = {
          "IN-MH": "Maharashtra", "IN-DL": "Delhi", "IN-KA": "Karnataka",
          "IN-TN": "Tamil Nadu", "IN-GJ": "Gujarat", "IN-RJ": "Rajasthan",
          "IN-UP": "Uttar Pradesh", "IN-MP": "Madhya Pradesh", "IN-WB": "West Bengal"
        };

        const totalPatients = statesList.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
        const tableHeaders = ["#", "Geographic Region / State", "Region Code", "Patient Count", "Regional Share %"];
        const colWidths = [12, 60, 35, 40, 35];
        const tableRows = statesList.map((item, idx) => {
          const rawId = item.id || "—";
          const stateName = item.name || stateNameMap[rawId] || rawId.replace("IN-", "");
          const val = Number(item.value) || 0;
          const share = (totalPatients ? Math.round((val / totalPatients) * 100) : 0) + "%";
          return [idx + 1, stateName, rawId, val, share];
        });

        tableRows.push(["-", "All Regions Combined", "Hospital Total", totalPatients, totalPatients ? "100%" : "0%"]);
        drawReportTable(pdf, tableHeaders, tableRows, startTableY + 4, colWidths);
      }

      // =========================================================
      // CASE 3: PATIENT JOURNEY INSIGHTS (horizontalBarChart)
      // =========================================================
      else if (targetId === "horizontalBarChart") {
        filename = "Hospital_Patient_Journey_Report.pdf";
        const dateRange = $("#patientJourneySection .chart-date-label").text().trim() || "Today";
        drawReportHeader(pdf, "Hospital Patient Journey Insights Report", "Funnel Pipeline Progression & Conversion Rate Breakdown", dateRange);

        let chartDataUrl = null;
        if (typeof patientJourneyChart !== "undefined" && patientJourneyChart) {
          chartDataUrl = getCanvasWithWhiteBg(patientJourneyChart.canvas, "#083684");
        } else {
          const cvs = document.getElementById("horizontalBarChart");
          if (cvs) chartDataUrl = getCanvasWithWhiteBg(cvs, "#083684");
        }

        let startTableY = 40;
        if (chartDataUrl) {
          try {
            pdf.addImage(chartDataUrl, "PNG", 14, 38, 182, 70);
            startTableY = 113;
          } catch (imgErr) {
            console.warn("Failed to attach patientJourneyChart image to PDF:", imgErr);
            startTableY = 42;
          }
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(15, 23, 42);
        pdf.text("PATIENT JOURNEY FUNNEL BREAKDOWN", 14, startTableY);

        const labels = (typeof patientJourneyChart !== "undefined" && patientJourneyChart?.data?.labels)
          ? patientJourneyChart.data.labels
          : ["Leads Generated", "Qualified Leads", "Opportunities Created", "Proposals Sent", "Deals Closed"];
        const values = (typeof patientJourneyChart !== "undefined" && patientJourneyChart?.data?.datasets?.[0]?.data)
          ? patientJourneyChart.data.datasets[0].data
          : [10, 7, 4, 2, 1];

        const convRates = window.lastHospitalReportData?.patient_journey?.conversion || ["100%", "70%", "40%", "20%", "10%"];

        const tableHeaders = ["#", "Funnel Progression Stage", "Patient Count", "Conversion Rate", "Stage Status"];
        const colWidths = [12, 65, 35, 35, 35];
        const tableRows = labels.map((lbl, idx) => {
          const val = values[idx] !== undefined ? values[idx] : 0;
          const rate = convRates[idx] || "-";
          const status = idx === labels.length - 1 ? "Deals Converted" : "In Progress";
          return [idx + 1, lbl, val, rate, status];
        });

        drawReportTable(pdf, tableHeaders, tableRows, startTableY + 4, colWidths);
      }

      // =========================================================
      // CASE 4: DEPARTMENT REVENUE (departmentRevenueSection)
      // =========================================================
      else if (targetId === "departmentRevenueSection") {
        filename = "Hospital_Department_Revenue_Report.pdf";
        const dateRange = $("#departmentRevenueSection .chart-date-label").text().trim() || "All Dates";
        drawReportHeader(pdf, "Hospital Department Revenue Report", "Departmental Revenue Inflow & Service Analytics", dateRange);

        let chartDataUrl = null;
        if (typeof barChart !== "undefined" && barChart) {
          chartDataUrl = getCanvasWithWhiteBg(barChart.canvas, "#ffffff");
        } else {
          const cvs = document.getElementById("barChart");
          if (cvs) chartDataUrl = getCanvasWithWhiteBg(cvs, "#ffffff");
        }

        let startTableY = 40;
        if (chartDataUrl) {
          try {
            pdf.addImage(chartDataUrl, "PNG", 14, 38, 182, 70);
            startTableY = 113;
          } catch (imgErr) {
            console.warn("Failed to attach barChart image to PDF:", imgErr);
            startTableY = 42;
          }
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(15, 23, 42);
        pdf.text("DEPARTMENT REVENUE BREAKDOWN", 14, startTableY);

        const labels = (typeof barChart !== "undefined" && barChart?.data?.labels)
          ? barChart.data.labels
          : (window.lastHospitalReportData?.most_requested_test?.labels || []);
        const values = (typeof barChart !== "undefined" && barChart?.data?.datasets?.[0]?.data)
          ? barChart.data.datasets[0].data
          : (window.lastHospitalReportData?.most_requested_test?.data || []);

        const tableHeaders = ["#", "Department Name", "Revenue Amount (INR)", "Record Status"];
        const colWidths = [15, 65, 55, 47];
        const tableRows = labels.map((lbl, idx) => {
          const val = Number(values[idx]) || 0;
          return [idx + 1, lbl, "₹" + val.toLocaleString("en-IN"), "Accepted/completed"];
        });

        drawReportTable(pdf, tableHeaders, tableRows, startTableY + 4, colWidths);
      }

      // =========================================================
      // CASE 5: FULL HOSPITAL DASHBOARD
      // =========================================================
      else if (targetId === "hospitalReportsPage") {
        filename = "Hospital_Bookings_Report.pdf";
        const dashboardCanvas = await html2canvas(targetElement, {
          backgroundColor: "#f7f9fc",
          useCORS: true,
          scale: 1.5,
          logging: false
        });
        const margin = 10;
        const printableWidth = pageWidth - margin * 2;
        const printableHeight = pdf.internal.pageSize.getHeight() - margin * 2;
        const sourcePageHeight = Math.floor(dashboardCanvas.width * printableHeight / printableWidth);

        for (let sourceY = 0; sourceY < dashboardCanvas.height; sourceY += sourcePageHeight) {
          if (sourceY > 0) pdf.addPage();
          const sliceHeight = Math.min(sourcePageHeight, dashboardCanvas.height - sourceY);
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = dashboardCanvas.width;
          pageCanvas.height = sliceHeight;
          pageCanvas.getContext("2d").drawImage(
            dashboardCanvas,
            0, sourceY, dashboardCanvas.width, sliceHeight,
            0, 0, dashboardCanvas.width, sliceHeight
          );
          const imageData = pageCanvas.toDataURL("image/jpeg", 0.9);
          const renderedHeight = sliceHeight * printableWidth / dashboardCanvas.width;
          pdf.addImage(imageData, "JPEG", margin, margin, printableWidth, renderedHeight);
        }
      }

      // =========================================================
      // CASE 6: FALLBACK FOR OTHER DIV ELEMENTS
      // =========================================================
      else {
        if (typeof html2canvas === "function") {
          const canvas = await html2canvas(targetElement, {
            backgroundColor: "#ffffff",
            useCORS: true,
            allowTaint: true,
            scale: 2,
            logging: false
          });
          const imgData = canvas.toDataURL("image/jpeg", 0.9);
          pdf.addImage(imgData, "JPEG", 10, 10, 190, (canvas.height * 190) / canvas.width);
        } else {
          throw new Error("Unable to capture component visual without html2canvas.");
        }
      }

      // Draw footer across all pages
      drawReportFooter(pdf);

      // Trigger download
      pdf.save(filename);

      if (typeof toastr !== "undefined") {
        toastr.success("Report downloaded successfully.");
      }
    } catch (err) {
      console.error("Report download failed:", err);
      const errMsg = "Unable to generate report download. Please try again.";
      if (typeof toastr !== "undefined") {
        toastr.error(errMsg);
      } else {
        alert(errMsg);
      }
    } finally {
      $btn.prop("disabled", false).removeClass("opacity-75 cursor-wait").html(originalHtml);
    }
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
    let activeType = $(".report-filter.active").data("type") || "today";
    loadDashboardData(activeType);
  });

  $(".report-filter").on("click", function (event) {
    event.stopPropagation();
    $(".report-filter").removeClass("active");
    $(this).addClass("active");

    let type = $(this).data("type");

    $(".report-filter span").removeClass("text-dodger-blue").addClass("text-light-gray");
    $(this).find("span").removeClass("text-light-gray").addClass("text-dodger-blue");

    if (type === "custom") {
      $(this).closest(".dropdown").find(".datepicker-container").removeClass("hidden");
      return;
    }

    window.hospitalReportStartDate = "";
    window.hospitalReportEndDate = "";
    $(this).closest(".dropdown").find(".filterDropdown").addClass("hidden");
    loadDashboardData(type);
  });

  $(".report-date-picker").datepicker({
    dateFormat: "yy-mm-dd",
    onSelect: function (dateText) {
      window.hospitalReportStartDate = dateText;
      window.hospitalReportEndDate = dateText;
      $(this).closest(".datepicker-container").addClass("hidden");
      $(".filterDropdown").addClass("hidden");
      $(".report-filter").removeClass("active");
      $(".report-filter[data-type='custom']").addClass("active");
      loadDashboardData("custom");
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

$(document).ready(function () {
    const reportParams = new URLSearchParams(window.location.search);

    let selectedFilter = reportParams.get("filter") || "week";
    let selectedVisitType = reportParams.get("visit_type") || "";
    let startDate = reportParams.get("start_date") || "";
    let endDate = reportParams.get("end_date") || "";
    let selectingStartDate = true;
    let reportRequest = null;
    const $dropdown = $(".filterDropdown"), $calendar = $(".datepicker-container"), $datePicker = $(".report-date-picker");
    const $dateLabel = $(".filterToggle").closest(".dropdown").parent().find("p.text-dodger-blue").first();
    $(".filterToggle").on("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        $dropdown.toggleClass("hidden");
        if ($dropdown.hasClass("hidden")) $calendar.addClass("hidden");
    });
    $dropdown.add($calendar).on("click", function (e) { e.stopPropagation(); });
    $(document).on("click", function (e) {
        if (!$(e.target).closest(".dropdown, .datepicker-container, .ui-datepicker").length) {
            $dropdown.addClass("hidden"); $calendar.addClass("hidden");
        }
    });
    $datePicker.datepicker("destroy").datepicker({
        dateFormat: "yy-mm-dd", changeMonth: true, changeYear: true, maxDate: null, numberOfMonths: 1,
        onSelect: function (dateText) {
            if (selectingStartDate) {
                startDate = dateText; endDate = ""; selectingStartDate = false; selectedFilter = "custom";
                updateActiveFilter("custom");
                $dateLabel.text("Start date: " + startDate + " - Select end date");
            } else {
                endDate = dateText;
                if (startDate > endDate) [startDate, endDate] = [endDate, startDate];
                selectingStartDate = true;
                $dateLabel.text("Data shown: " + formatDate(startDate) + " – " + formatDate(endDate));
                $calendar.addClass("hidden"); loadDashboardData();
            }
        }
    });
    // $(".calendar-icon").on("click", function (e) {
    //     e.preventDefault(); e.stopPropagation();
    //     selectedFilter = "custom"; startDate = ""; endDate = ""; selectingStartDate = true;
    //     updateActiveFilter("custom"); $dropdown.removeClass("hidden"); $calendar.removeClass("hidden");
    //     $datePicker.datepicker("refresh");
    // });
    // MAIN FILTER CALENDAR
    $(".filterDropdown .report-filter[data-type='custom'] .calendar-icon")
      .off("click.reportCalendar")
      .on("click.reportCalendar", function (e) {

        e.preventDefault();
        e.stopPropagation();

        selectedFilter = "custom";
        startDate = "";
        endDate = "";
        selectingStartDate = true;

        updateActiveFilter("custom");

        $dropdown.removeClass("hidden");

        const $mainCalendar = $(".report-date-picker")
            .closest(".datepicker-container");

        $(".datepicker-container").addClass("hidden");
        $mainCalendar.removeClass("hidden");

        $dateLabel.text("Select start date");

        $datePicker.datepicker("refresh");
    });


    
  // // INDIVIDUAL CHART CALENDARS
  // const individualChartDates = {};

  // $(".calendar-icon")
  //   .not(".filterDropdown .report-filter .calendar-icon")
  //   .off("click.chartCalendar")
  //   .on("click.chartCalendar", function (e) {
  //     e.preventDefault();
  //     e.stopPropagation();

  //     const $chart = $(this).closest("[id$='Section']");
  //     const $pickerContainer = $chart.find(".datepicker-container").first();
  //     const $inline = $pickerContainer.find(".datepicker-inline").first();

  //     if (!$pickerContainer.length || !$inline.length) {
  //       console.warn("Calendar container not found for:", $chart.attr("id"));
  //       return;
  //     }

  //     $(".datepicker-container").addClass("hidden");
  //     $dropdown.addClass("hidden");
  //     $pickerContainer.removeClass("hidden");

  //     const chartId = $chart.attr("id");

  //     if ($inline.hasClass("hasDatepicker")) {
  //       $inline.datepicker("destroy");
  //     }

  //     $inline.empty().datepicker({
  //       dateFormat: "yy-mm-dd",
  //       changeMonth: true,
  //       changeYear: true,
  //       onSelect: function (dateText) {
  //         const state = individualChartDates[chartId] || {
  //           start: "",
  //           end: ""
  //         };

  //         if (!state.start || state.end) {
  //           state.start = dateText;
  //           state.end = "";
  //           individualChartDates[chartId] = state;

  //           $inline.datepicker("option", "minDate", dateText);
  //           console.log("Individual graph start date:", chartId, dateText);
  //           return;
  //         }

  //         state.end = dateText;

  //         if (state.start > state.end) {
  //           [state.start, state.end] = [state.end, state.start];
  //         }

  //         individualChartDates[chartId] = state;

  //         console.log("Individual graph date range:", {
  //           chart: chartId,
  //           start_date: state.start,
  //           end_date: state.end
  //         });

  //         $pickerContainer.addClass("hidden");
  //         $inline.datepicker("option", "minDate", null);

  //         $.ajax({
  //           url: "/reports/hospital-report-data/",
  //           type: "GET",
  //           dataType: "json",
  //           data: {
  //             filter: "custom",
  //             visit_type: $("#visitTypeFilter").val() || "",
  //             start_date: state.start,
  //             end_date: state.end
  //           },
  //           success: function (response) {
  //             console.log("Individual graph response:", chartId, response);

  //             // Update only the selected graph.
  //             if (chartId === "departmentRevenueSection" &&
  //                 response.most_requested_test) {
  //               barChart.data.labels = response.most_requested_test.labels;
  //               barChart.data.datasets[0].data = response.most_requested_test.data;
  //               barChart.update();
  //             } else if (chartId === "packageSection" &&
  //                        response.revenue_by_test) {
  //               pieChart.data.labels = response.revenue_by_test.labels;
  //               pieChart.data.datasets[0].data = response.revenue_by_test.data;
  //               pieChart.update();
  //             } else if (chartId === "loadAnalyticsSection" &&
  //                        response.bid_trend) {
  //               lineChart.data.labels = response.bid_trend.labels;
  //               lineChart.data.datasets[0].data = response.bid_trend.cbc;
  //               lineChart.update();
  //             } else if (chartId === "patientJourneySection" &&
  //                        response.patient_journey) {
  //               patientJourneyChart.data.labels = response.patient_journey.labels;
  //               patientJourneyChart.data.datasets[0].data = response.patient_journey.data;
  //               patientJourneyChart.update();
  //             }
  //           },
  //           error: function (xhr) {
  //             console.error(
  //               "Individual graph date filter failed:",
  //               xhr.status,
  //               xhr.responseText
  //             );
  //           }
  //         });
  //       }
  //     });
  //   });
  // INDIVIDUAL CHART CALENDARS
  // INDIVIDUAL CHART CALENDARS
// INDIVIDUAL CHART CALENDARS
$(".calendar-icon")
  .not(".filterDropdown .report-filter .calendar-icon")
  .off("click.chartCalendar")
  .on("click.chartCalendar", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $chart = $(this).closest("[id$='Section']");
    const $pickerContainer = $chart.find(".datepicker-container").first();
    const $inline = $pickerContainer.find(".datepicker-inline").first();

    if (!$pickerContainer.length || !$inline.length) {
      console.warn(
        "Calendar container not found:",
        $chart.attr("id")
      );
      return;
    }

    $(".datepicker-container").addClass("hidden");
    $dropdown.addClass("hidden");
    $pickerContainer.removeClass("hidden");

    const chartId = $chart.attr("id");

    const savedRange = individualChartDates[chartId];
    const params = new URLSearchParams(window.location.search);
    const queryStart = params.get(`${chartId}_start_date`);
    const queryEnd = params.get(`${chartId}_end_date`);
    if (queryStart && queryEnd) {
      individualChartDates[chartId] = { start: queryStart, end: queryEnd };
    }
    const restoredRange = individualChartDates[chartId] || savedRange;
    if ($inline.hasClass("hasDatepicker")) {
      $inline.datepicker("destroy");
    }

    $inline.empty().datepicker({
      dateFormat: "yy-mm-dd",
      changeMonth: true,
      changeYear: true,
      defaultDate: restoredRange?.start || new Date(),
      beforeShowDay: function (date) {
        const range = individualChartDates[chartId];
        if (!range?.start || !range?.end) return [true, ""];
        const value = $.datepicker.formatDate("yy-mm-dd", date);
        return [true, value >= range.start && value <= range.end ? "ui-state-range" : ""];
      },

      onSelect: function (dateText) {
        const state = individualChartDates[chartId] || {
          start: "",
          end: ""
        };

        // First date: Start date
        if (!state.start || state.end) {
          state.start = dateText;
          state.end = "";

          individualChartDates[chartId] = state;

          $inline.datepicker("option", "minDate", dateText);

          console.log("Individual graph start date:", {
            chart: chartId,
            start_date: dateText
          });

          return;
        }

        // Second date: End date
        state.end = dateText;

        // Ensure chronological order
        if (state.start > state.end) {
          [state.start, state.end] = [
            state.end,
            state.start
          ];
        }

        individualChartDates[chartId] = state;
        persistIndividualChartDates();

        console.log("Individual graph date range:", {
          chart: chartId,
          start_date: state.start,
          end_date: state.end
        });

        $pickerContainer.addClass("hidden");
        $inline.datepicker("option", "minDate", null);

        // Preserve existing query parameters
        const params = new URLSearchParams(
          window.location.search
        );

        params.set("filter", "custom");
        params.set(
          "visit_type",
          $("#visitTypeFilter").val() || ""
        );

        // Store date range separately for this chart
        params.set(`${chartId}_start_date`, state.start);
        params.set(`${chartId}_end_date`, state.end);

        // Remove old generic date parameters
        params.delete("start_date");
        params.delete("end_date");
        params.delete("chart");

        // Reload reports page
        window.location.href =
          window.location.pathname + "?" + params.toString();
      }
    });
    if (restoredRange?.start) {
      $inline.datepicker("setDate", restoredRange.start);
      $inline.datepicker("refresh");
    }
  });

    $(".report-filter").on("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        const type = $(this).data("type");
        selectedFilter = type; updateActiveFilter(type);
        if (type === "custom") {
            startDate = ""; endDate = ""; selectingStartDate = true;
            $calendar.removeClass("hidden"); $dateLabel.text("Select start date");
            return;
        }
        startDate = ""; endDate = ""; selectingStartDate = true;
        $calendar.addClass("hidden");
        $dateLabel.text({
            today: "Data shown: Today",
            week: "Data shown: This week",
            "30days": "Data shown: Last 30 days",
            month: "Data shown: This month",
            all: "Data shown: All dates"
        }[type] || "Data shown: --");
        loadDashboardData();
    });
    $("#visitTypeFilter").on("change", function () {
        selectedVisitType = $(this).val(); loadDashboardData();
    });
    function updateActiveFilter(type) {
        $(".report-filter").each(function () {
            const $icon = $(this).find(".material-symbols-outlined").first();
            $icon.toggleClass("text-dodger-blue", $(this).data("type") === type)
                 .toggleClass("text-light-gray", $(this).data("type") !== type);
        });
    }
    function formatDate(value) {
        const [y, m, d] = value.split("-").map(Number);
        return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
        });
    }
    function loadDashboardData() {
        if (selectedFilter === "custom" && (!startDate || !endDate)) return;
        if (reportRequest) reportRequest.abort();
        reportRequest = $.ajax({
            url: "/reports/hospital-report-data/", type: "GET",
            data: {
                filter: selectedFilter,
                visit_type: selectedVisitType,
                service_type: $("#serviceTypeFilter").val() || "",
                start_date: startDate,
                end_date: endDate
            },
            success: function (response) {
                window.lastHospitalReportData = response;
                const departmentMenu = document.querySelector("#departmentRevenueSection .dropdown-menu");
                if (departmentMenu && response.most_requested_test) {
                    departmentMenu.replaceChildren();
                    ["All departments", ...response.most_requested_test.labels].forEach((label) => {
                        const option = document.createElement("li");
                        option.className = "px-4 py-2 hover:bg-blue-haze cursor-pointer";
                        option.textContent = label;
                        departmentMenu.appendChild(option);
                    });
                    $("#departmentRevenueSection .dropdown-value").text("All departments");
                }
                console.log("Filtered data:", response);
                const stats = response.stats || {};
                $("#totalRevenue").text(stats.revenue || "₹0");
                $("#highestRevenue").text(stats.highest_revenue || "₹0");
                $("#quarterGrowth").text(stats.growth || "0%");
                $("#avgRevenue").text(stats.avg_revenue || "₹0");
                $("#totalAppointments").text(stats.total_appointments ?? 0);
                if (typeof barChart !== "undefined" && barChart) {
                    barChart.data.labels = response.most_requested_test.labels;
                    barChart.data.datasets[0].data = response.most_requested_test.data;
                    barChart.update();
                }
                if (typeof pieChart !== "undefined" && pieChart) {
                    pieChart.data.labels = response.revenue_by_test.labels;
                    pieChart.data.datasets[0].data = response.revenue_by_test.data;
                    pieChart.update();
                }
                if (typeof lineChart !== "undefined" && lineChart) {
                    lineChart.data.labels = response.bid_trend.labels;
                    lineChart.data.datasets[0].data = response.bid_trend.cbc;
                    lineChart.update();
                }
                if (typeof updateHospitalHeatmap === "function") updateHospitalHeatmap(response.heatmap);
            },
            error: function (xhr, status) {
                if (status !== "abort") console.error("Filter request failed:", xhr.status, xhr.responseText);
            }
        });
    }
    updateActiveFilter(selectedFilter);
    $dateLabel.text({
        today: "Data shown: Today",
        week: "Data shown: This week",
        "30days": "Data shown: Last 30 days",
        month: "Data shown: This month",
        all: "Data shown: All dates",
        custom: startDate && endDate
            ? `Data shown: ${formatDate(startDate)} – ${formatDate(endDate)}`
            : "Data shown: Select date range"
    }[selectedFilter] || "Data shown: All dates");
    loadDashboardData();
});

  // FIXED: Removed automated loadDashboardData("month") from here to protect Django initial values!
});

// =========================================================================
// CENTRAL HOOK DEFINITION: PULL DATA VIA AJAX FOR MANUAL USER FILTER CLICKS
// =========================================================================
function loadDashboardData(filterType) {
    $.ajax({
        url: "/reports/hospital-report-data/",
        type: "GET",
        data: {
            filter: filterType,
            visit_type: $("#visitTypeFilter").val(),
            service_type: $("#serviceTypeFilter").val() || "",
            start_date: window.hospitalReportStartDate || "",
            end_date: window.hospitalReportEndDate || ""
        },
        success: function(response) {
            window.lastHospitalReportData = response;
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
                    const mapId = response.heatmap.ids?.[index] || stateMap[state.trim()];
                    if (mapId) {
                        heatmapData.push({ 
                            id: mapId, 
                            value: parseInt(response.heatmap.data[index]) || 0 
                        });
                    }
                });

                window.polygonSeries.data = heatmapData;
                
                if (window.heatmapChart) {
                    window.polygonSeries.invalidateRawData();
                    window.heatmapChart.validateData();
                }
            }
        },
        error: function(xhr) {
            const message = xhr.responseJSON && xhr.responseJSON.error
                ? xhr.responseJSON.error
                : "Unable to load filtered report data.";
            console.error("AJAX Error: UI synchronization failed:", xhr.responseText);
            if (typeof toastr !== "undefined") {
                toastr.error(message);
            }
        }
    });
}


// INDIVIDUAL CHART DATE LABELS
$(document).ready(function () {
    const params = new URLSearchParams(window.location.search);

    function formatChartDate(dateString) {
        const [year, month, day] = dateString.split("-");
        return `${day}/${month}/${year.slice(-2)}`;
    }

    // Restore dates for every chart after page reload
    [
        "departmentRevenueSection",
        "packageSection",
        "conversionSection",
        "loadAnalyticsSection",
        "heatmapSection",
        "patientJourneySection"
    ].forEach(function (chartId) {
        const start = params.get(`${chartId}_start_date`);
        const end = params.get(`${chartId}_end_date`);

        if (start && end) {
            individualChartDates[chartId] = { start, end };
            persistIndividualChartDates();
            $("#" + chartId)
                .find(".chart-date-label")
                .first()
                .text(
                    `${formatChartDate(start)} – ${formatChartDate(end)}`
                );
      } else {
            const savedRange = individualChartDates[chartId];
            const today = new Date();
            const todayString = $.datepicker.formatDate("yy-mm-dd", today);
            $("#" + chartId)
                .find(".chart-date-label")
                .first()
                .text(savedRange?.start && savedRange?.end
                    ? `${formatChartDate(savedRange.start)} – ${formatChartDate(savedRange.end)}`
                    : formatChartDate(todayString));
        }
    });

    $(document).ready(function () {
        const trendCanvas = document.getElementById("bookingsTrendChart");
        const statusCanvas = document.getElementById("bookingStatusChart");
        const offersCanvas = document.getElementById("offersPerformanceChart");
        const bidsConversionCanvas = document.getElementById("bidsConversionChart");
        const bidsTurnaroundCanvas = document.getElementById("bidsTurnaroundChart");
        const revenueCanvas = document.getElementById("hospitalRevenueChart");
        let bookingsTrendChart = null;
        let bookingStatusChart = null;
        let bidsConversionChart = null;
        let bidsTurnaroundChart = null;
        let hospitalRevenueChart = null;

        if (trendCanvas) {
            bookingsTrendChart = new Chart(trendCanvas, {
                type: "line",
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: "Total Bookings",
                            data: [],
                            borderColor: "#1d70e8",
                            backgroundColor: "rgba(29, 112, 232, 0.1)",
                            fill: true,
                            tension: 0.35,
                            pointRadius: 3
                        },
                        {
                            label: "Completed",
                            data: [],
                            borderColor: "#35c7a1",
                            backgroundColor: "rgba(53, 199, 161, 0.08)",
                            fill: true,
                            tension: 0.35,
                            pointRadius: 3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#edf1f6" } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        if (statusCanvas) {
            bookingStatusChart = new Chart(statusCanvas, {
                type: "doughnut",
                data: {
                    labels: ["Completed", "Upcoming", "In Progress", "Cancelled / No-show"],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: ["#35c7a1", "#ffb84d", "#6c8cf5", "#f27878"],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "68%",
                    plugins: { legend: { display: false } }
                }
            });
        }

        if (offersCanvas) {
            new Chart(offersCanvas, {
                type: "bar",
                data: {
                    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
                    datasets: [
                        { label: "Offers", data: [24, 31, 28, 45], backgroundColor: "#dce9ff", borderRadius: 5 },
                        { label: "Accepted", data: [16, 21, 19, 30], backgroundColor: "#3983ed", borderRadius: 5 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#edf1f6" } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        const bidChartOptions = function (maxValue, tickSuffix) {
            return {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                interaction: { intersect: false, mode: "index" },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: maxValue,
                        ticks: {
                            stepSize: maxValue === 75 ? 25 : 10,
                            color: "#98a1b1",
                            font: { size: 9 },
                            callback: function (value) { return value + tickSuffix; }
                        },
                        grid: { color: "#edf1f6" }
                    },
                    x: {
                        ticks: { color: "#667085", font: { size: 9 } },
                        grid: { display: false }
                    }
                }
            };
        };
        if (bidsConversionCanvas) {
            bidsConversionChart = new Chart(bidsConversionCanvas, {
                type: "line",
                data: {
                    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
                    datasets: [
                        {
                            label: "Current Period",
                            data: [39, 43, 47, 50],
                            borderColor: "#1683ff",
                            backgroundColor: "#1683ff",
                            borderWidth: 1.5,
                            pointRadius: 2,
                            tension: 0.25
                        },
                        {
                            label: "Previous Period",
                            data: [32, 36, 40, 44],
                            borderColor: "#22c995",
                            backgroundColor: "#22c995",
                            borderWidth: 1.5,
                            pointRadius: 2,
                            tension: 0.25
                        }
                    ]
                },
                options: bidChartOptions(75, "%")
            });
        }
        if (bidsTurnaroundCanvas) {
            bidsTurnaroundChart = new Chart(bidsTurnaroundCanvas, {
                type: "line",
                data: {
                    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
                    datasets: [
                        {
                            label: "Current Period",
                            data: [24, 27, 22, 30],
                            borderColor: "#1683ff",
                            backgroundColor: "#1683ff",
                            borderWidth: 1.5,
                            pointRadius: 2,
                            tension: 0.45
                        },
                        {
                            label: "Previous Period",
                            data: [15, 18, 14, 20],
                            borderColor: "#64748b",
                            backgroundColor: "#64748b",
                            borderWidth: 1.2,
                            borderDash: [3, 3],
                            pointRadius: 0,
                            tension: 0.4
                        }
                    ]
                },
                options: bidChartOptions(40, "")
            });
        }
        if (revenueCanvas) {
            hospitalRevenueChart = new Chart(revenueCanvas, {
                type: "bar",
                data: {
                    labels: [],
                    datasets: [{
                        label: "Revenue",
                        data: [],
                        backgroundColor: "#3983ed",
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: "#edf1f6" } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        function setBookingText(id, value) {
            const element = document.getElementById(id);
            if (element) element.textContent = String(value ?? 0);
        }

        function setHospitalReportView(view) {
            const isBooking = view === "booking";
            const isBids = view === "bids";
            const isRevenue = view === "revenue";
            $("#bookingViewContent").toggleClass("hidden", !isBooking);
            $("#bidsViewContent").toggleClass("hidden", !isBids).toggleClass("grid", isBids);
            $("#revenueViewContent").toggleClass("hidden", !isRevenue).toggleClass("flex", isRevenue);
            const labels = { booking: "Booking View", bids: "Bids View", revenue: "Revenue View" };
            setBookingText("selectedHospitalReportView", labels[view] || labels.booking);
            requestAnimationFrame(function () {
                if (isBids) {
                    if (bidsConversionChart) bidsConversionChart.resize();
                    if (bidsTurnaroundChart) bidsTurnaroundChart.resize();
                }
                if (isRevenue && hospitalRevenueChart) hospitalRevenueChart.resize();
            });
        }

        function updateBookingServices(rows) {
            const container = document.getElementById("bookingsByService");
            if (!container) return;
            container.replaceChildren();

            if (!Array.isArray(rows) || rows.length === 0) {
                const empty = document.createElement("p");
                empty.className = "text-sm text-gray-400";
                empty.textContent = "No service bookings for this period.";
                container.appendChild(empty);
                return;
            }

            const maxBookings = Math.max.apply(null, rows.map(function (row) {
                return Number(row.bookings) || 0;
            })) || 1;
            rows.slice(0, 5).forEach(function (row) {
                const item = document.createElement("div");
                item.className = "space-y-2";
                const heading = document.createElement("div");
                heading.className = "flex items-center justify-between gap-3 text-sm";
                const name = document.createElement("span");
                name.className = "truncate text-[#344054]";
                name.textContent = row.package || "Other service";
                const count = document.createElement("strong");
                count.className = "shrink-0 font-medium text-[#172b4d]";
                count.textContent = String(row.bookings || 0);
                heading.append(name, count);
                const track = document.createElement("div");
                track.className = "h-2 overflow-hidden rounded-full bg-[#edf1f6]";
                const bar = document.createElement("div");
                bar.className = "h-full rounded-full bg-[#3983ed]";
                bar.style.width = Math.max((Number(row.bookings) || 0) / maxBookings * 100, 2) + "%";
                track.appendChild(bar);
                item.append(heading, track);
                container.appendChild(item);
            });
        }

        function updateBookingDashboard(response) {
            if (!response || !response.stats) return;
            const status = response.booking_status || {};
            setBookingText("totalBookings", response.stats.total_appointments);
            setBookingText("completedBookings", status.completed ?? response.stats.completed_bookings);
            setBookingText("upcomingBookings", status.upcoming ?? response.stats.upcoming_bookings);
            setBookingText("cancelledBookings", status.cancelled ?? response.stats.cancelled_bookings);
            setBookingText("statusCompleted", status.completed);
            setBookingText("statusUpcoming", status.upcoming);
            setBookingText("statusInProgress", status.in_progress);
            setBookingText("statusCancelled", status.cancelled);
            setBookingText("revenueViewTotal", response.stats.revenue || "₹0");
            setBookingText("revenueViewAverage", response.stats.avg_revenue || "₹0");
            setBookingText("revenueViewDepartment", response.stats.highest_revenue || "—");
            setBookingText("revenueViewGrowth", response.stats.growth || "—");

            if (bookingsTrendChart && Array.isArray(response.booking_trend)) {
                bookingsTrendChart.data.labels = response.booking_trend.map(function (row) {
                    return new Date(row.date + "T00:00:00").toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short"
                    });
                });
                bookingsTrendChart.data.datasets[0].data = response.booking_trend.map(function (row) { return row.total; });
                bookingsTrendChart.data.datasets[1].data = response.booking_trend.map(function (row) { return row.completed; });
                bookingsTrendChart.update();
            }

            if (bookingStatusChart) {
                bookingStatusChart.data.datasets[0].data = [
                    Number(status.completed) || 0,
                    Number(status.upcoming) || 0,
                    Number(status.in_progress) || 0,
                    Number(status.cancelled) || 0
                ];
                bookingStatusChart.update();
            }
            if (hospitalRevenueChart && response.most_requested_test) {
                hospitalRevenueChart.data.labels = response.most_requested_test.labels || [];
                hospitalRevenueChart.data.datasets[0].data = response.most_requested_test.data || [];
                hospitalRevenueChart.update();
            }

            const serviceSelect = document.getElementById("serviceTypeFilter");
            if (serviceSelect && Array.isArray(response.service_options)) {
                const selectedService = serviceSelect.value;
                const options = document.createDocumentFragment();
                const serviceMenu = document.getElementById("serviceTypeMenu");
                if (serviceMenu) serviceMenu.replaceChildren();
                const allServices = document.createElement("option");
                allServices.value = "";
                allServices.textContent = "All Services";
                options.appendChild(allServices);
                if (serviceMenu) {
                    const allServicesOption = document.createElement("button");
                    allServicesOption.type = "button";
                    allServicesOption.className = "hospital-select-option block w-full rounded px-3 py-2 text-left text-[14px] text-[#344054] hover:bg-[#f3f7fb]";
                    allServicesOption.dataset.select = "serviceTypeFilter";
                    allServicesOption.dataset.value = "";
                    allServicesOption.textContent = "All Services";
                    serviceMenu.appendChild(allServicesOption);
                }
                response.service_options.forEach(function (service) {
                    const option = document.createElement("option");
                    option.value = String(service.id);
                    option.textContent = service.name;
                    options.appendChild(option);
                    if (serviceMenu) {
                        const menuOption = document.createElement("button");
                        menuOption.type = "button";
                        menuOption.className = "hospital-select-option block w-full rounded px-3 py-2 text-left text-[14px] text-[#344054] hover:bg-[#f3f7fb]";
                        menuOption.dataset.select = "serviceTypeFilter";
                        menuOption.dataset.value = String(service.id);
                        menuOption.textContent = service.name;
                        serviceMenu.appendChild(menuOption);
                    }
                });
                serviceSelect.replaceChildren(options);
                if (Array.from(serviceSelect.options).some(function (option) { return option.value === selectedService; })) {
                    serviceSelect.value = selectedService;
                }
                const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
                setBookingText("selectedServiceType", selectedOption ? selectedOption.textContent : "All Services");
            }
            updateBookingServices(response.package_table);
        }

        const reportParams = new URLSearchParams(window.location.search);
        const initialVisitType = reportParams.get("visit_type") || "";
        $("#visitTypeFilter").val(initialVisitType);
        const initialVisitOption = document.getElementById("visitTypeFilter").selectedOptions[0];
        setBookingText("selectedVisitType", initialVisitOption ? initialVisitOption.textContent : "All Visit Types");

        let activeDatePreset = reportParams.get("filter") || "week";
        function setDateHeader(preset, customRange) {
            const presetLabels = {
                today: "Today",
                week: "Last 7 days",
                "30days": "Last 30 days",
                month: "This Month",
                custom: "Custom range",
                all: "All dates"
            };
            const presetElement = document.getElementById("reportDatePreset");
            const rangeElement = document.getElementById("reportRangeShort");
            if (!presetElement || !rangeElement) return;
            presetElement.textContent = presetLabels[preset] || presetLabels.all;

            if (preset === "custom") {
                rangeElement.textContent = customRange ? "· " + customRange : "· Select dates";
                return;
            }
            if (preset === "all") {
                rangeElement.textContent = "";
                return;
            }

            const end = new Date();
            end.setHours(0, 0, 0, 0);
            const start = new Date(end);
            if (preset === "week") start.setDate(start.getDate() - 6);
            else if (preset === "30days") start.setDate(start.getDate() - 29);
            else if (preset === "month") start.setDate(1);

            const monthYear = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });
            let range;
            if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
                range = start.getDate() + "–" + end.getDate() + " " + monthYear.format(end);
            } else {
                const fullDate = new Intl.DateTimeFormat("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                });
                range = fullDate.format(start) + " – " + fullDate.format(end);
            }
            rangeElement.textContent = "· " + range;
        }

        setDateHeader(activeDatePreset);
        $(document).on("click", ".report-filter", function () {
            activeDatePreset = $(this).data("type");
            setDateHeader(activeDatePreset);
        });

        $(document).on("click", ".report-select-toggle", function (event) {
            event.preventDefault();
            event.stopPropagation();
            const menu = $(this).parent().find(".report-select-menu").first();
            const shouldOpen = menu.hasClass("hidden");
            $(".report-select-menu").addClass("hidden");
            if (shouldOpen) menu.removeClass("hidden");
        });
        $(document).on("click", ".hospital-select-option", function (event) {
            event.preventDefault();
            event.stopPropagation();
            const select = document.getElementById(this.dataset.select);
            if (!select) return;
            select.value = this.dataset.value;
            setBookingText(
                select.id === "serviceTypeFilter" ? "selectedServiceType" : "selectedVisitType",
                select.options[select.selectedIndex]?.textContent || ""
            );
            $(select).trigger("change");
            $(this).closest(".report-select-menu").addClass("hidden");
        });
        $(document).on("click", "#bookingViewMenu button[data-view]", function (event) {
            event.preventDefault();
            setHospitalReportView(this.dataset.view);
            $("#bookingViewMenu").addClass("hidden");
        });
        $(document).on("click", function (event) {
            if (!$(event.target).closest(".report-select-toggle, .report-select-menu").length) {
                $(".report-select-menu").addClass("hidden");
            }
        });
        setHospitalReportView("booking");

        const exportModal = document.getElementById("hospitalExportModal");
        function closeHospitalExport() {
            if (!exportModal) return;
            exportModal.classList.add("hidden");
            exportModal.classList.remove("flex");
            document.body.classList.remove("overflow-hidden");
        }
        $("#openHospitalExport").on("click", function () {
            if (!exportModal) return;
            exportModal.classList.remove("hidden");
            exportModal.classList.add("flex");
            document.body.classList.add("overflow-hidden");
            $("#closeHospitalExport").trigger("focus");
        });
        $("#closeHospitalExport, #cancelHospitalExport").on("click", closeHospitalExport);
        $("#hospitalExportModal").on("click", function (event) {
            if (event.target === this) closeHospitalExport();
        });
        $(document).on("keydown.hospitalExport", function (event) {
            if (event.key === "Escape" && exportModal && !exportModal.classList.contains("hidden")) {
                closeHospitalExport();
            }
        });
        $(".hospital-export-type").on("click", function () {
            $(".hospital-export-type")
                .removeClass("ring-1 ring-[#0789f5]")
                .attr("aria-pressed", "false");
            $(this).addClass("ring-1 ring-[#0789f5]").attr("aria-pressed", "true");
        });
        $("#generateHospitalExport").on("click", closeHospitalExport);

        $("#serviceTypeFilter").on("change", function () {
            $("#visitTypeFilter").trigger("change");
        });
        $(document).on("ajaxComplete", function (event, xhr, settings) {
            if (!settings.url || settings.url.indexOf("/reports/hospital-report-data/") === -1) return;
            if (activeDatePreset === "custom") {
                const hiddenLabel = $("#hospitalReportDateRange").text().replace(/^Data shown:\s*/, "").trim();
                if (hiddenLabel && hiddenLabel.indexOf("Select") === -1 && hiddenLabel.indexOf("Start date:") !== 0) {
                    setDateHeader("custom", hiddenLabel);
                }
            }
            if (xhr.responseJSON) updateBookingDashboard(xhr.responseJSON);
        });
        if (window.lastHospitalReportData) updateBookingDashboard(window.lastHospitalReportData);
    });

    // Support the currently selected chart's existing URL parameters
    const chartId = params.get("chart");
    const start = params.get("start_date");
    const end = params.get("end_date");

    if (chartId && start && end) {
        params.set(`${chartId}_start_date`, start);
        params.set(`${chartId}_end_date`, end);

        $("#" + chartId)
            .find(".chart-date-label")
            .first()
            .text(
                `${formatChartDate(start)} – ${formatChartDate(end)}`
            );

        // Keep the individual chart dates in the URL
        params.delete("start_date");
        params.delete("end_date");
        params.delete("chart");

        history.replaceState(
            null,
            "",
            window.location.pathname + "?" + params.toString()
        );
    }
});
