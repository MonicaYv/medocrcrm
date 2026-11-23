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
    "processing-orders",
    "delivered-orders",
    "pending-requests",
    "total-stock",
    "available-stock",
    "low-stock",
    "revenue",
    "prescription-revenue",
    "otc-revenue",
  ].forEach((metric) => {
    const $value = $(`#pharmacy-overview-${metric}`);
    if ($value.length && $value.text().trim() !== "") {
      $value.text(formatNumber($value.text().trim()));
    }
  });

  function setActiveButton($btn) {
    $overview
      .find(".filterOption")
      .removeClass("bg-[#1A73E8] text-white")
      .addClass("border border-[#E8EEF2] bg-white text-slate-600");
    if ($btn && $btn.length) {
      $btn
        .removeClass("border border-[#E8EEF2] bg-white text-slate-600")
        .addClass("bg-[#1A73E8] text-white");
    }
  }

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
        $("#pharmacy-overview-processing-orders").text(
          formatNumber(data.processing_orders !== undefined ? data.processing_orders : data.confirmed_orders)
        );
        $("#pharmacy-overview-delivered-orders").text(
          formatNumber(data.delivered_orders !== undefined ? data.delivered_orders : 0)
        );
        $("#pharmacy-overview-pending-requests").text(
          formatNumber(data.pending_requests !== undefined ? data.pending_requests : data.pending_orders)
        );

        if (data.customer_rating) {
          $("#pharmacy-overview-customer-rating").text(data.customer_rating);
        }
        if (data.review_count) {
          $("#pharmacy-overview-review-count").text(data.review_count);
        }

        if (data.today_orders_count !== undefined) {
          $("#pharmacy-today-orders-count").text(formatNumber(data.today_orders_count));
          $("#pharmacy-today-orders-subtext").text(
            `${formatNumber(data.today_pending_count || 0)} Pending · ${formatNumber(data.today_processing_count || 0)} Processing`
          );
        }
        if (data.ongoing_orders_count !== undefined) {
          $("#pharmacy-out-for-delivery-count").text(formatNumber(data.ongoing_orders_count));
        }

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

        setActiveButton(null);
        $("#pharmacy-overview-period").text(`${startDate} - ${endDate}`);
        $("#pharmacy-overview-orders-label").text(`${startDate} - ${endDate}`);
        updateOverview("custom", startDate, endDate);
      },
    });
  }

  $overview.find(".filterOption").on("click", function () {
    const rawValue = String($(this).data("value") || "").trim();
    const filter = rawValue.toLowerCase();

    if (filter === "custom") {
      openCustomDatepicker();
      return;
    }

    setActiveButton($(this));
    $calendar.addClass("hidden").hide();

    let periodLabel = rawValue;
    if (filter === "today") periodLabel = "Today";
    else if (filter === "week") periodLabel = "This Week";
    else if (filter === "month") periodLabel = "This Month";

    $("#pharmacy-overview-period").text(periodLabel);
    $("#pharmacy-overview-orders-label").text(periodLabel);

    updateOverview(filter);
  });

  $overview.find(".calendar-icon").on("click", function (e) {
    e.stopPropagation();
    if ($calendar.is(":visible")) {
      $calendar.addClass("hidden").hide();
    } else {
      openCustomDatepicker();
    }
  });

  $(document).on("click", function (event) {
    const $target = $(event.target);
    if (
      !$target.closest(".datepicker-container").length &&
      !$target.closest(".calendar-icon").length &&
      !$target.closest(".ui-datepicker").length
    ) {
      if ($calendar.is(":visible")) {
        $calendar.addClass("hidden").hide();
      }
    }
  });
});
