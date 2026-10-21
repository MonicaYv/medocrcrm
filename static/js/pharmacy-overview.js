$(function () {
  const $overview = $("#pharmacy-overview");
  if (!$overview.length) {
    return;
  }

  const endpoint = $overview.data("endpoint");
  const $calendar = $overview.find(".datepicker-container");
  const $datepicker = $calendar.find(".datepicker-inline");
  let pendingStartDate = "";
  let pendingDateRangeToast = null;
  let overviewRequest = null;

  function clearPendingDateRangeToast() {
    if (pendingDateRangeToast && window.toastr) {
      window.toastr.clear(pendingDateRangeToast);
      pendingDateRangeToast = null;
    }
  }

  function formatNumber(value) {
    return Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  }

  [
    "total-orders",
    "confirmed-orders",
    "pending-orders",
    "total-stock",
    "available-stock",
    "low-stock",
    "revenue",
    "prescription-revenue",
    "otc-revenue",
  ].forEach((metric) => {
    const $value = $(`#pharmacy-overview-${metric}`);
    $value.text(formatNumber($value.text().trim()));
  });

  function updateOverview(filter, startDate = "", endDate = "") {
    if (overviewRequest) {
      overviewRequest.abort();
    }

    overviewRequest = new AbortController();
    const params = new URLSearchParams({ filter });
    if (filter === "custom") {
      params.set("start_date", startDate);
      params.set("end_date", endDate);
    }

    fetch(`${endpoint}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: overviewRequest.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load the pharmacy overview.");
        }
        return data;
      })
      .then((data) => {
        $("#pharmacy-overview-total-orders").text(formatNumber(data.total_orders));
        $("#pharmacy-overview-confirmed-orders").text(formatNumber(data.confirmed_orders));
        $("#pharmacy-overview-pending-orders").text(formatNumber(data.pending_orders));
        $("#pharmacy-overview-total-stock").text(formatNumber(data.total_stock));
        $("#pharmacy-overview-available-stock").text(formatNumber(data.available_stock));
        $("#pharmacy-overview-low-stock").text(formatNumber(data.low_stock_medicines));
        $("#pharmacy-overview-revenue").text(formatNumber(data.revenue));
        $("#pharmacy-overview-prescription-revenue").text(
          formatNumber(data.prescription_revenue)
        );
        $("#pharmacy-overview-otc-revenue").text(formatNumber(data.otc_revenue));
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Failed to load pharmacy overview:", error);
          if (window.toastr) {
            window.toastr.error(error.message);
          }
        }
      });
  }

  function openCustomDatepicker() {
    clearPendingDateRangeToast();
    pendingStartDate = "";
    $calendar.removeClass("hidden").show();
    if ($datepicker.hasClass("hasDatepicker")) {
      $datepicker.datepicker("destroy");
    }

    $datepicker.datepicker({
      dateFormat: "yy-mm-dd",
      changeMonth: true,
      changeYear: true,
      onSelect(dateText) {
        if (!pendingStartDate) {
          pendingStartDate = dateText;
          $datepicker.datepicker("option", "minDate", dateText);
          $("#pharmacy-overview-period").text("Select end date");
          if (window.toastr) {
            pendingDateRangeToast = window.toastr.info(
              "Please select an end date."
            );
          }
          return;
        }

        const startDate = pendingStartDate;
        const endDate = dateText;
        clearPendingDateRangeToast();
        pendingStartDate = "";
        $datepicker.datepicker("option", "minDate", null);
        $calendar.addClass("hidden").hide();
        $("#pharmacy-overview-period").text(`${startDate} - ${endDate}`);
        updateOverview("custom", startDate, endDate);
      },
    });
  }

  $overview.find(".filterOption").on("click", function () {
    const filter = String($(this).data("value") || "").toLowerCase();

    if (filter === "custom") {
      openCustomDatepicker();
      return;
    }

    $calendar.addClass("hidden");
    updateOverview(filter);
  });

  $overview.find(".calendar-icon").on("click", openCustomDatepicker);
});
