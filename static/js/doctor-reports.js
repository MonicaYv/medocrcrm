(function () {
    const exportButton = document.getElementById("openExportReport");
    const exportOverlay = document.getElementById("exportReportDialog");

    if (exportButton && exportOverlay) {
      const exportDialog = exportOverlay.querySelector('[role="dialog"]');
      const closeButtons = exportOverlay.querySelectorAll("[data-close-export]");
      const reportTypeButtons = exportOverlay.querySelectorAll("[data-report-type]");
      const formatButtons = exportOverlay.querySelectorAll(".doctor-report-format-option");

      function closeExportDialog() {
        exportOverlay.hidden = true;
        exportButton.setAttribute("aria-expanded", "false");
        exportButton.focus();
      }

      exportButton.addEventListener("click", function () {
        exportOverlay.hidden = false;
        exportButton.setAttribute("aria-expanded", "true");
        const closeButton = exportOverlay.querySelector(".doctor-report-export-close");
        if (closeButton) closeButton.focus();
      });

      closeButtons.forEach(function (button) {
        button.addEventListener("click", closeExportDialog);
      });

      exportOverlay.addEventListener("click", function (event) {
        if (event.target === exportOverlay) closeExportDialog();
      });

      reportTypeButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          reportTypeButtons.forEach(function (option) {
            option.setAttribute("aria-pressed", String(option === button));
          });
        });
      });

      formatButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          formatButtons.forEach(function (option) {
            const isSelected = option === button;
            option.setAttribute("aria-pressed", String(isSelected));
            option.classList.toggle("doctor-report-format-option--selected", isSelected);
          });
        });
      });

      document.addEventListener("keydown", function (event) {
        if (exportOverlay.hidden) return;

        if (event.key === "Escape") {
          closeExportDialog();
          return;
        }

        if (event.key !== "Tab" || !exportDialog) return;
        const focusableElements = exportDialog.querySelectorAll(
          'button:not([disabled]), input:not([disabled])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      });
    }

    if (typeof Chart === "undefined") return;

    Chart.defaults.font.family = '"MyFont", sans-serif';
    Chart.defaults.color = "#8391a7";

    new Chart(document.getElementById("consultationVolumeChart"), {
      type: "line",
      data: {
        labels: ["Jul 1", "Jul 4", "Jul 8", "Jul 11", "Jul 15", "Jul 18", "Jul 22"],
        datasets: [
          { data: [14, 17, 15, 20, 17, 21, 18], borderColor: "#18c85c", borderWidth: 2, pointRadius: 0, tension: .25 },
          { data: [10, 12, 10, 14, 11, 16, 12], borderColor: "#06a99e", borderWidth: 2, pointRadius: 0, tension: .25 },
          { data: [6, 8, 5, 9, 6, 11, null], borderColor: "#d72fdf", borderWidth: 2, pointRadius: 0, tension: .25 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 4, maxRotation: 0, font: { size: 10 } } },
          y: { min: 0, max: 25, ticks: { stepSize: 10, font: { size: 10 } }, grid: { color: "#edf1f6" }, border: { display: false } }
        }
      }
    });

    new Chart(document.getElementById("consultationTypeChart"), {
      type: "doughnut",
      data: {
        labels: ["Clinic Visit", "Home Visit", "Video Call", "Voice Call"],
        datasets: [{ data: [145, 89, 77, 51], backgroundColor: ["#329579", "#ff922b", "#22c55e", "#d72fdf"], borderWidth: 0, hoverOffset: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: "72%", plugins: { legend: { display: false }, tooltip: { enabled: false } } }
    });

    new Chart(document.getElementById("monthlyEarningsChart"), {
      type: "bar",
      data: {
        labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        datasets: [{ data: [92, 108, 98, 121, 144, 167], backgroundColor: ["#e3e9f1", "#e3e9f1", "#e3e9f1", "#e3e9f1", "#e3e9f1", "#0785f9"], borderRadius: 5, barPercentage: .63 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { display: false, beginAtZero: true, max: 190, grid: { display: false }, border: { display: false } }
        }
      }
    });

    new Chart(document.getElementById("patientDemographicsChart"), {
      type: "doughnut",
      data: { labels: ["Male", "Female"], datasets: [{ data: [58, 42], backgroundColor: ["#329579", "#eff3f7"], borderWidth: 0, hoverOffset: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: "70%", rotation: 20, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
    });
  })();
