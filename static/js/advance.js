/* =========================================================
   GLOBAL STATE
========================================================= */
let currentPage = 1;
let currentFilter = "";
let currentSearch = "";
let currentAdvanceReceipt = null;

/* Toast helper - toastr is loaded on the dashboard layout, alert as fallback. */
function showToast(type, message) {
  if (typeof toastr !== "undefined" && toastr[type]) {
    toastr[type](message);
  } else if (type === "error") {
    alert(message);
  } else {
    console.info(message);
  }
}

/* =========================================================
   DOCUMENT READY — SINGLE ENTRY POINT
========================================================= */
$(document).ready(function () {

  /* ================================
     ADVANCE HISTORY INIT
  ================================ */
  if ($("#advanceHistoryBody").length) {
    loadAdvanceHistory(1);
  }

  /* ================================
     ADVANCE SUMMARY INIT
  ================================ */
  if ($("#summaryCurrentBalance").length) {
    loadAdvanceSummary();
  }

  /* ================================
     SEARCH (by transaction ID)
  ================================ */
  $(document).on("input", "#advanceHistorySearch", function () {
    currentSearch = $(this).val();
    loadAdvanceHistory(1);
  });

  /* ================================
     FILTER
  ================================ */
  $(document).on("click", ".filterDropdown div", function () {
    const text = $(this).text().toLowerCase();

    currentFilter =
      text.includes("week") ? "week" :
      text.includes("month") ? "month" :
      text.includes("year") ? "year" : "";

    loadAdvanceHistory(1);
  });

  $(document).on('click', '.download-btn', function (event) {
    event.preventDefault();
    event.stopPropagation();

    // The html2pdf library is served from a CDN; guard against it failing to load.
    if (typeof html2pdf === 'undefined') {
      showToast('error', 'PDF library could not be loaded. Check your internet connection and refresh the page.');
      return;
    }

    // Prefer a download container inside the modal that owns the button,
    // otherwise fall back to the advance receipt container.
    const $modal = $(this).closest('.viewModal, .fileModal, .platformBill');
    let $container = $modal.find('.download-container').first();

    if ($container.length === 0) {
      $container = $('.viewModal .download-container').first();
    }

    if ($container.length === 0) {
      showToast('error', 'Nothing to download.');
      return;
    }

    // Clone the element so the live modal is untouched while html2canvas renders.
    const clone = $container[0].cloneNode(true);
    clone.style.position = 'static';
    clone.style.visibility = 'visible';
    clone.style.display = 'block';
    clone.style.height = 'auto';
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';
    clone.id = 'download-container-clone';
    document.body.appendChild(clone);

    const opt = {
      margin:       0,
      filename:     'advance-receipt.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0, scrollX: 0 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(clone).save()
      .then(() => {
        if (clone.parentNode) document.body.removeChild(clone);
        showToast('success', 'Receipt downloaded successfully.');
      })
      .catch(err => {
        console.error('[ERROR] PDF generation failed:', err);
        if (clone.parentNode) document.body.removeChild(clone);
        showToast('error', 'PDF generation failed. Please try again.');
      });
});
  /* ================================
     PAGINATION CLICK
  ================================ */
  $(document).on("click", ".pagination-btn", function () {
    const page = $(this).data("page");
    loadAdvanceHistory(page);
  });

  /* ================================
     VIEW RECEIPT
  ================================ */
$(document).on("click", ".view-receipt", function () {
  const id = $(this).data("id");
  if (!id) {
    showToast("error", "Invalid advance record.");
    return;
  }
  openAdvanceReceipt(id);
});


$(document).on("click", ".view-file", function () {
  $(".fileModal").removeClass("hidden");
  loadFileModalTable(); 
});


  /* ================================
     CLOSE MODALS
  ================================ */
  $(document).on("click", ".closeModal", function () {
    $(".viewModal, .fileModal").addClass("hidden");
  });

  /* ================================
     BACK BUTTONS
  ================================ */
  $(document).on("click", ".closehistoryBtn, .closeadvance-btn, .cancelBtn", function () {
    window.history.back();
  });

  /* ================================
     ADVANCE INPUT
  ================================ */
  $(document).on("input", "#amountInput", function () {
    updateAdvanceTotal($(this).val());
  });

  $(document).on("click", ".amount-btn", function () {
    const amount = $(this).text().replace(/[^\d]/g, "");
    $("#amountInput").val(amount);
    updateAdvanceTotal(amount);
  });

  /* ================================
     ADVANCE RECHARGE
  ================================ */
  $(document).on("click", ".recharge-btn", function () {

    const amount = parseFloat($("#amountInput").val());
    const payment_method = $("input[name='payment_method']:checked").val();

    if (!amount || amount < 100) {
      toastr.error("Minimum amount is ₹100");
      return;
    }

    if (!payment_method) {
      toastr.error("Please select a payment method");
      return;
    }

    $.ajax({
      url: "/dashboard/advance/add/",
      type: "POST",
      data: {
        amount: amount,
        payment_method: payment_method,
        csrfmiddlewaretoken: $("input[name='csrfmiddlewaretoken']").val(),
      },

      beforeSend: function () {
        $(".recharge-btn").prop("disabled", true).text("Processing...");
      },

      success: function (res) {
        $(".recharge-btn").prop("disabled", false).text("Recharge");

        if (!res.success) {
          toastr.error(res.message);
          return;
        }

        toastr.success(res.message);

        $("#prevBalance").text("₹" + res.previous_balance);
        $("#addedAmount").text("₹" + res.added_amount);
        $("#currentBalance").text("₹" + res.current_balance);
        $("#earnedPoints").text(res.points);
        $("#walletBalance").text("₹" + res.current_balance);
        $("#walletLastUpdated").text("Last updated on " + formatDate(new Date()));

        $(".viewModal").removeClass("hidden");
      },

      error: function () {
        $(".recharge-btn").prop("disabled", false).text("Recharge");
        toastr.error("Server Error");
      }
    });
  });

});

/* =========================================================
   ADVANCE HISTORY AJAX
========================================================= */
function loadAdvanceHistory(page = 1) {

  $.ajax({
    url: "/dashboard/advance/history/ajax/",
    data: {
      page: page,
      filter: currentFilter,
      search: currentSearch
    },

    success: function (res) {
      if (!res.success) return;

      let html = "";

      if (!res.data || res.data.length === 0) {
        html = `
          <tr>
            <td colspan="7" class="py-6 text-center text-gray-400">
              No advance history found
            </td>
          </tr>`;
      } else {
        res.data.forEach(tx => {
          html += `
            <tr class="text-center">
              <td>${tx.date}</td>
              <td>${tx.tranx_id}</td>
              <td>${tx.type}</td>
              <td>${tx.description}</td>
              <td>${tx.amount}</td>
              <td>
                <div class="bg-mint-cream text-green py-2 rounded-md">
                  ${tx.status}
                </div>
              </td>
              <td>
                <span
                  class="material-symbols-outlined cursor-pointer view-receipt"
                  data-id="${tx.id}">
                  visibility
                </span>
              </td>
            </tr>`;
        });
      }

      $("#advanceHistoryBody").html(html);
      renderPagination(res.pagination);
    },

    error: function () {
      $("#advanceHistoryBody").html(`
        <tr>
          <td colspan="7" class="py-6 text-center text-red-500">
            Failed to load history
          </td>
        </tr>
      `);
    }
  });
}

/* =========================================================
   PAGINATION UI
========================================================= */
function getPaginationColorClass() {
  const type = (window.USER_TYPE || "").toLowerCase();

  if (["doctor", "lab", "hospital"].includes(type)) {
    return "bg-dodger-blue";
  }

  if (type === "pharmacy") {
    return "bg-dodger-blue";
  }

  if (type === "advertiser") {
    return "bg-living-coral";
  }

  // fallback
  return "bg-dodger-blue";
}


function renderPagination(p) {
  if (!p) return;
  const colorClass = getPaginationColorClass();
  let html = "";

  html += `
    <button
      class="pagination-btn font-medium ${p.has_prev ? "text-black" : "text-gray-400 cursor-not-allowed"}"
      data-page="${p.current - 1}"
      ${!p.has_prev ? "disabled" : ""}
    >
      Previous
    </button>
  `;

  html += `
    <span class="${colorClass} text-white w-8 h-8 flex items-center justify-center rounded-lg font-semibold">
      ${p.current}
    </span>
  `;

  html += `
    <button
      class="pagination-btn font-medium ${p.has_next ? "text-black" : "text-gray-400 cursor-not-allowed"}"
      data-page="${p.current + 1}"
      ${!p.has_next ? "disabled" : ""}
    >
      Next
    </button>
  `;

  $("#pagination").html(html);
}

/* =========================================================
   SUMMARY AJAX
========================================================= */
function loadAdvanceSummary() {
  $.ajax({
    url: "/dashboard/advance/summary/ajax/",
    data: { filter: currentFilter || "week" },

    success: function (res) {
      if (!res.success) return;

      $("#summaryCurrentBalance").text("₹" + res.current_balance);
      $("#summaryTotalCredit").text("₹" + res.total_credit);
      $("#summaryTotalDebit").text("₹" + res.total_debit);

      $(".summary-label").text(res.label);
      $(".summary-date-range").text(
        `(${res.from_date} to ${res.to_date})`
      );
    }
  });
}


/* =========================================================
   HELPERS
========================================================= */
function updateAdvanceTotal(amount) {
  $("#advanceTotal").text((parseFloat(amount) || 0).toFixed(0));
}

function formatDate(dateObj) {
  const day = dateObj.getDate();
  const month = dateObj.toLocaleString("en-IN", { month: "long" });
  const year = dateObj.getFullYear();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" :
    day % 10 === 2 && day !== 12 ? "nd" :
    day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${day}${suffix} ${month} ${year}`;
}

function loadFileModalTable() {
  $.ajax({
    url: "/dashboard/advance/history/ajax/",
    data: {
      page: 1,                       // always start from first page
      filter: currentFilter,
      search: currentSearch
    },

    success: function (res) {
      if (!res.success) return;

      let html = "";

      if (!res.data || res.data.length === 0) {
        html = `
          <tr>
            <td colspan="6" class="py-6 text-center text-gray-400">
              No records found
            </td>
          </tr>`;
      } else {
        res.data.forEach(tx => {
          html += `
            <tr class="text-center">
              <td class="p-2">${tx.date}</td>
              <td class="p-2">${tx.tranx_id}</td>
              <td class="p-2">${tx.type}</td>
              <td class="p-2">${tx.description}</td>
              <td class="p-2">${tx.amount}</td>
              <td class="p-2">${tx.status}</td>
            </tr>`;
        });
      }

      $("#fileModalTableBody").html(html);
    },

    error: function () {
      $("#fileModalTableBody").html(`
        <tr>
          <td colspan="6" class="py-6 text-center text-red-500">
            Failed to load data
          </td>
        </tr>
      `);
    }
  });
}
function numberToWords(num) {
  const a = [
    "", "One", "Two", "Three", "Four", "Five",
    "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen",
    "Fifteen", "Sixteen", "Seventeen", "Eighteen",
    "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (num === 0) return "Zero";

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred " + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand " + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh " + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + " Crore " + inWords(n % 10000000);
  }

  return inWords(Math.floor(num)).trim();
}

function openAdvanceReceipt(advanceId) {
  if (!advanceId) {
    showToast("error", "Invalid advance record.");
    return;
  }

  fetch(`/dashboard/advance/receipt/${advanceId}/`)
    .then(res => {
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (data.error) throw new Error(data.error);

      const setText = function (id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value == null ? "" : value;
      };

      // header
      setText("r_receipt_no", data.receipt_no);
      setText("r_date", data.payment_date);

      // platform
      setText("r_platform_name", data.platform_name);
      setText("r_gstin", data.gstin);
      setText("r_platform_address", data.platform_address);
      setText("r_platform_contact", data.platform_contact);

      // customer
      setText("r_customer_name", data.customer_name);
      setText("r_customer_address", data.customer_address);
      setText("r_customer_email", data.customer_email);

      // purpose
      setText("r_purpose", data.purpose);
      setText("r_description", data.description);

      // calculation
      const amount = Number(data.amount) || 0;
      const gstPercent = Number(data.gst_percent) || 0;
      const gstAmount = gstPercent ? (amount * gstPercent) / 100 : 0;
      const total = data.total_amount != null ? Number(data.total_amount) : amount;

      setText("r_amount", `₹${amount.toFixed(2)}`);
      setText("r_gst", `${gstPercent}%`);
      setText("r_total", `₹${total.toFixed(2)}`);
      setText("r_gst_amount", `₹${gstAmount.toFixed(2)}`);
      setText("r_total_amount", `₹${total.toFixed(2)}`);
      setText("r_amount_words", `${numberToWords(total)} Only`);
      setText(
        "r_payment_mode",
        `${data.payment_mode || ""}${data.transaction_id ? ` (${data.transaction_id})` : ""}`
      );

      currentAdvanceReceipt = data;

      // show the receipt modal
      $(".viewModal").removeClass("hidden");
    })
    .catch(err => {
      console.error("Receipt load failed:", err);
      showToast("error", "Failed to load receipt. Please try again.");
    });
}

$(document).on("click", ".share-advance-receipt", async function (event) {
  event.preventDefault();
  event.stopPropagation();

  if (!currentAdvanceReceipt) {
    showToast("error", "Please open an advance receipt first.");
    return;
  }

  const receipt = currentAdvanceReceipt;
  const text =
    `Advance receipt ${receipt.receipt_no || ""}\n` +
    `Date: ${receipt.payment_date || ""}\n` +
    `Amount: ₹${Number(receipt.total_amount || 0).toFixed(2)}\n` +
    `Transaction: ${receipt.transaction_id || "-"}`;

  // 1) Native Web Share API (available in secure contexts on mobile/desktop)
  if (navigator.share && window.isSecureContext !== false) {
    try {
      await navigator.share({ title: "Advance Receipt", text });
      return;
    } catch (error) {
      if (error && error.name === "AbortError") return; // user cancelled
      console.warn("[Share] Web Share API failed:", error);
    }
  }

  // 2) Copy the details to the clipboard
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      showToast("success", "Receipt details copied to clipboard");
      return;
    }
  } catch (error) {
    console.warn("[Share] Clipboard failed:", error);
  }

  // 3) Final fallback - let the user copy manually
  window.prompt("Copy receipt details", text);
});
