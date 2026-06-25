/**
 * Appointment Module
 * ------------------
 * - AJAX-based appointment loading
 * - Pagination + tab filtering
 * - Single dynamic modal
 * - Status-based enquiry UI
 */


let currentStatus = "all";

function loadAppointments(status = "all", page = 1) {

    currentStatus = status;

    $("#cards-container").html(
      `<p class="text-center mt-10 text-spanish-gray">
          Loading...
       </p>`
    );

    $.ajax({
      url: "/appointment/ajax/appointments/",
      type: "GET",
      data: { status, page },

      success: function (res) {
        $("#cards-container").html(res.html);
      },

      error: function () {
        $("#cards-container").html(
          `<p class="text-center text-red-500 mt-10">
             Failed to load appointments
           </p>`
        );
      }
    });
}

// $(document).ready(function () {

//   /* ------------------------------
//    * Load Appointments (AJAX)
//    * ------------------------------ */
//   function loadAppointments(status = "all", page = 1) {
//     currentStatus = status;

//     $("#cards-container").html(
//       `<p class="text-center mt-10 text-spanish-gray">Loading...</p>`
//     );

//     $.ajax({
//       url: "/appointment/ajax/appointments/",
//       type: "GET",
//       data: { status, page },
//       success: function (res) {
//         $("#cards-container").html(res.html);
//       },
//       error: function () {
//         $("#cards-container").html(
//           `<p class="text-center text-red-500 mt-10">Failed to load appointments</p>`
//         );
//       }
//     });
//   }

//   loadAppointments("all", 1);
$(document).ready(function () {

loadAppointments("all", 1);

  /* ------------------------------
   * Tabs
   * ------------------------------ */
  $(".tab-btn-hospital").on("click", function () {
    $(".tab-btn-hospital").removeClass("active-tab-hospital");
    $(this).addClass("active-tab-hospital");

    const tab = $(this).data("tab");

    if (tab === "equipment") {
      $("#tab-content-area > div").addClass("hidden");
      $("#equipment-container").removeClass("hidden");
    } else {
      $("#tab-content-area > div").addClass("hidden");
      $("#appointments-container").removeClass("hidden");
      loadAppointments(tab, 1);
    }
  });

  /* ------------------------------
   * Pagination
   * ------------------------------ */
  $("#cards-container").on("click", ".pagination-btn", function () {
    loadAppointments(currentStatus, $(this).data("page"));
  });

  /* ------------------------------
   * Open Appointment Modal
   * ------------------------------ */
  $("#cards-container").on(
    "click",
    ".card-all-pending, .card-all-accepted, .card-all-completed, .card-all-cancelled, .card-all-missed",
    function () {

      const card = $(this);
      const status = (card.data("status") || "").toLowerCase();
      window.currentStatusModal = status;
      const orderId = card.data("order-id") || "-";
      const appointmentId = card.data("id");
      window.currentAppointmentId = appointmentId;
      $(".modal-pending").attr("data-appointment-id", appointmentId);
      console.log("APPOINTMENT ID =", appointmentId);
      const budget = card.data("budget");

      // Basic details
      $("#modal-name").text(card.data("name") || "-");
      $("#modal-gender").text(card.data("gender") || "-");
      $("#modal-age").text(card.data("age") || "-");
      $("#modal-phone").text(card.data("phone") || "-");
      $("#modal-visit-type").text(card.data("visit-type") || "Visit");
      $("#modal-date").text(card.data("date") || "-");
      $("#modal-address").text(card.data("address") || "-");
      $("#modal-service-type").text(card.data("service-type") || "-");
      $("#modal-details").text(card.data("details") || "-");
    //   const attachmentUrl = card.data("attachment") || "";

    //   $(".view-attachment").attr(
    //     "data-file",
    //     attachmentUrl
    //   );
    //   const attachmentUrl = card.data("attachment") || "";

    //   $(".attachment-name").text(
    //     attachmentUrl
    //      ? attachmentUrl.split("/").pop()
    //      : "No Attachment"
    //   );

    //   $(".view-attachment").attr(
    //     "data-file",
    //     attachmentUrl
    //  );
    const attachmentUrl = card.data("attachment") || "";
    console.log("Attachment URL:", attachmentUrl);
    console.log(card);

    $(".attachment-name").text(
      attachmentUrl
       ? attachmentUrl.split("/").pop()
       : "No Attachment"
      );

      $(".view-attachment").attr(
        "data-file",
        attachmentUrl
      );

      $("#modal-order-id").text("Order #" + orderId);
      $("#modal-budget").text(budget ? "₹" + budget : "-");

      /* ------------------------------
       * Status-based enquiry section
       * ------------------------------ */
      if (status === "cancelled") {
        $("#modal-enquiry-detail").html(
          ENQUIRY_TEMPLATES.cancelled(orderId, "Doctor")
        );
      } 
      else if (status === "missed") {
        $("#modal-enquiry-detail").html(
          ENQUIRY_TEMPLATES.missed(orderId)
        );
      } 
      else {
        // pending / accepted / completed
        $("#modal-enquiry-detail").html(
          ENQUIRY_TEMPLATES.pending(orderId, budget)
        );
      }

      $(".modal-pending").removeClass("hidden");
    }
  );

/* ------------------------------
 * Close Modal
 * ------------------------------ */
$(document).on("click", ".modal-close-pending", function () {
  $(".modal-pending").addClass("hidden");
});

$(document).on("click", ".modal-pending", function (e) {
  if ($(e.target).is(this)) {
    $(this).addClass("hidden");
  }
});


const ENQUIRY_TEMPLATES = {

  pending: (orderId, budget) => `
    <div class="enquiredDetail">
      <div class="flex flex-col mt-4 py-4 gap-4">
        <div class="flex justify-center items-center gap-1">
          <div class="w-2 h-2 bg-dodger-blue rounded-full"></div>
          <div class="w-[138px] h-0.5 flex">
            <div class="w-1/2 h-full bg-dodger-blue"></div>
            <div class="w-1/2 h-full bg-blue-haze"></div>
          </div>
          <div class="w-2 h-2 bg-blue-haze rounded-full"></div>
          <div class="w-[138px] h-0.5 bg-blue-haze"></div>
          <div class="w-2 h-2 bg-blue-haze rounded-full"></div>
          <div class="w-[138px] h-0.5 bg-blue-haze"></div>
          <div class="w-2 h-2 bg-blue-haze rounded-full"></div>
        </div>

        <div class="flex items-center justify-between mx-10">
          <p class="pl-6 text-sm">Enquiry</p>
          <p class="pl-2 text-spanish-gray text-sm">Appointment</p>
          <p class="text-spanish-gray text-sm">Completed</p>
          <p class="text-spanish-gray text-sm">Cancel/Expired</p>
        </div>
      </div>

      <div class="pt-4 flex flex-col gap-2">
        <div class="flex justify-between">
          <p class="text-sm">Order ID</p>
          <p class="text-sm">Budget</p>
        </div>
        <div class="flex justify-between">
          <p class="text-blue-gray text-sm">Order #${orderId}</p>
          <p class="text-dodger-blue text-sm">₹${budget || "-"}</p>
        </div>
      </div>

    <div class="pt-4 flex justify-center gap-2 mb-2">
        <button class="accept-appointment bg-dodger-blue text-white rounded-lg w-[180px] h-10">
            Accept
        </button>

      </div>
    </div>
  `,

  cancelled: (orderId, cancelledBy = "Doctor") => `
    <div class="enquiredDetail">
      <div class="flex flex-col mt-4 py-4 gap-4">
        <div class="flex justify-center gap-1">
          <div class="w-2 h-2 bg-dodger-blue rounded-full"></div>
          <div class="w-[192px] h-0.5 bg-dodger-blue"></div>
          <div class="w-2 h-2 bg-dodger-blue rounded-full"></div>
          <div class="w-[192px] h-0.5 bg-dodger-blue"></div>
          <div class="w-2 h-2 bg-dodger-blue rounded-full"></div>
        </div>

        <div class="flex justify-between mx-20">
          <p class="text-sm">Enquiry</p>
          <p class="text-sm">Appointment</p>
          <p class="text-sm">Canceled</p>
        </div>
      </div>

      <div class="pt-4 flex flex-col gap-2">
        <div class="flex justify-between">
          <p class="text-sm">Order ID</p>
          <p class="text-sm">Canceled by</p>
        </div>
        <div class="flex justify-between">
          <p class="text-blue-gray text-sm">Order #${orderId}</p>
          <p class="text-strong-red text-sm">${cancelledBy}</p>
        </div>
      </div>
    </div>
  `,

  missed: (orderId, reason = "Patient didn’t show up") => `
    <div class="enquiredDetail">
      <div class="flex flex-col mt-4 py-4 gap-4">
        <div class="flex justify-center gap-1">
          <div class="w-2 h-2 bg-dodger-blue rounded-full"></div>
          <div class="w-[192px] h-0.5 bg-dodger-blue"></div>
          <div class="w-2 h-2 bg-dodger-blue rounded-full"></div>
          <div class="w-[192px] h-0.5 bg-dodger-blue"></div>
          <div class="w-2 h-2 bg-dodger-blue rounded-full"></div>
        </div>

        <div class="flex justify-between mx-20">
          <p class="text-sm">Enquiry</p>
          <p class="text-sm">Appointment</p>
          <p class="text-sm">No Show</p>
        </div>
      </div>

      <div class="pt-4 flex flex-col gap-2">
        <div class="flex justify-between">
          <p class="text-sm">Order ID</p>
          <p class="text-sm">Missing Reason</p>
        </div>
        <div class="flex justify-between">
          <p class="text-blue-gray text-sm">Order #${orderId}</p>
          <p class="text-strong-red text-sm">${reason}</p>
        </div>
      </div>
    </div>
  `
};


function getCookie(name) {

    let cookieValue = null;

    if (document.cookie && document.cookie !== "") {

        const cookies = document.cookie.split(";");

        for (let i = 0; i < cookies.length; i++) {

            const cookie = cookies[i].trim();

            if (
                cookie.substring(0, name.length + 1) ===
                (name + "=")
            ) {

                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );

                break;

            }

        }

    }

    return cookieValue;

}
function showToast(message, type = "success") {

    const toast = document.createElement("div");

    toast.className = `
        fixed top-5 right-5 z-[9999]
        px-5 py-3 rounded-lg text-white font-medium shadow-lg
        transition-all duration-300
        ${type === "success" ? "bg-green-500" : "bg-red-500"}
    `;

    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => {

        toast.style.opacity = "0";
        toast.style.transform = "translateY(-20px)";

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 2000);
}
/* ------------------------------
 * VIEW ATTACHMENT
 * ------------------------------ */

// $(document).on("click", ".view-attachment", function () {

//     const fileUrl = $(this).attr("data-file");

//     if (!fileUrl) {

//         showToast("No attachment found", "error");

//         return;

//     }

//     window.open(fileUrl, "_blank");

// });
/* ------------------------------
 * VIEW ATTACHMENT
 * ------------------------------ */


$(document).on("click", ".view-attachment", function (e) {

    e.stopPropagation();

    const fileUrl = $(this).attr("data-file");
    console.log("FILE URL =>", fileUrl);

    if (!fileUrl) {

        showToast("No attachment found", "error");

        return;
    }

    // Set uploaded image inside modal
    $(".attachment-modal img").attr("src", fileUrl);
    const previewContainer = $(".attachment-modal .mt-4");

previewContainer.html("");

if (fileUrl.toLowerCase().endsWith(".pdf")) {

    previewContainer.html(`
        <iframe
            src="${fileUrl}"
            class="w-full h-[500px] rounded-md"
        ></iframe>
    `);

} else {

    previewContainer.html(`
        <img
            src="${fileUrl}"
            class="rounded-md w-full h-auto max-h-[420px] object-contain"
        />
    `);

}

    // Open modal
    // $(".attachment-modal").removeClass("hidden");
    $(".attachment-modal")
      .css("z-index", "9999")
      .removeClass("hidden");

});


/* ------------------------------
 * CLOSE ATTACHMENT MODAL
 * ------------------------------ */

$(document).on("click", ".close-attachment-modal", function () {

    $(".attachment-modal").addClass("hidden");

});


/* ------------------------------
 * CLOSE ON OUTSIDE CLICK
 * ------------------------------ */

$(document).on("click", ".attachment-modal", function (e) {

    if ($(e.target).is(".attachment-modal")) {

        $(".attachment-modal").addClass("hidden");

    }

});

/* ------------------------------
 * SHARE APPOINTMENT
 * ------------------------------ */

$(document).on("click", ".share-btn", function () {

    const patientName = $("#modal-name").text();

    const phone = $("#modal-phone").text();

    const date = $("#modal-date").text();

    const shareText =
`Appointment Details

Patient: ${patientName}
Phone: ${phone}
Date: ${date}`;

    if (navigator.share) {

        navigator.share({

            title: "Appointment Details",

            text: shareText

        });

    } else {

        navigator.clipboard.writeText(shareText);

        showToast("Appointment copied to clipboard", "success");

    }

});
});

$(document).on("click", ".patient-share-btn", function () {
    $("#patientSharePopup")
        .removeClass("hidden")
        .addClass("flex");
});

$(document).on("click", ".close-patient-share-popup", function () {
    $("#patientSharePopup")
        .addClass("hidden")
        .removeClass("flex");
});

$(document).on("click", "#copy-patient-link", function () {

    const link = $("#patient-share-link").val();

    navigator.clipboard.writeText(link);

    alert("Link copied");
});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return '';
}


$(document).on("click", ".patient-share-app", function () {

    const app = $(this).data("app");
    const link = $("#patient-share-link").val();

    let url = "";

    switch (app) {
        case "whatsapp":
            url = `https://wa.me/?text=${encodeURIComponent(link)}`;
            break;

        case "telegram":
            url = `https://t.me/share/url?url=${encodeURIComponent(link)}`;
            break;

        case "facebook":
            url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
            break;

        case "sms":
            url = `sms:?body=${encodeURIComponent(link)}`;
            break;

        case "gmail":
            url = `mailto:?subject=Patient Information&body=${encodeURIComponent(link)}`;
            break;
    }

    if (url) {
        window.open(url, "_blank");
    }
});

$(document).on("click", "#copy-patient-link", function () {

    const link = $("#patient-share-link").val();

    navigator.clipboard.writeText(link);

    alert("Link copied");
});
// ============================================================
// UNIFIED APPOINTMENT HANDLERS
// ============================================================

// ── View appointment details (eye icon) ─────────────────────
$(document).on("click", ".appointment-detail-btn, .view-appointment", function () {

    const appointmentId = $(this).data("id");
    if (!appointmentId) return;

    $.ajax({
        url: `/appointment/appointment-details/${appointmentId}/`,
        type: "GET",

        success: function (response) {

            if (!response.success) {
                toastr.error(response.message || "Unable to load details");
                return;
            }

            const a = response.appointment;

            // Common fields (all user types)
            $("#popup-patient-name, #modal-name").text(a.patient_name || "-");
            $("#popup-gender,    #modal-gender").text(a.gender          || "-");
            $("#popup-age,       #modal-age").text(a.age                || "-");
            $("#popup-phone,     #modal-phone").text(a.phone            || "-");
            $("#popup-address,   #modal-address").text(a.address        || "-");
            $("#popup-date,      #modal-date").text(a.appointment_date  || "-");
            $("#popup-order-id").text(a.order_id || "-");

            // Lab-specific
            $("#popup-service,   #modal-service-type").text(
                a.service_type || "-"
            );

            // Doctor/Hospital-specific
            $("#popup-visit-type,  #modal-visit-type").text(
                a.visit_type || a.consultation_type || "-"
            );
            $("#popup-medical-requirement").text(
                a.medical_requirement || a.consultation_type || "-"
            );
            $("#popup-details, #modal-details").text(a.details || "-");
            $("#popup-budget").text(a.budget ? "₹" + a.budget : "-");

            // Store appointment ID on both popup containers
            $(".appointmentRequestDetail, .modal-pending")
                .attr("data-appointment-id", appointmentId);

            // Show popup (whichever is present on this page)
            $(".appointmentRequestDetail")
                .removeClass("hidden")
                .addClass("flex");

            $(".modal-pending")
                .removeClass("hidden")
                .addClass("flex");
        },

        error: function () {
            toastr.error("Unable to load appointment details");
        }
    });
});


// ── Place bid (check_circle icon on list row) ────────────────
$(document).on("click", ".place-bid-btn", function () {

    const appointmentId = $(this).data("id");
    if (!appointmentId) return;

    _placeBid(appointmentId, $(this).closest(".appointment-row, tr"));
});


// ── Accept button inside popup ───────────────────────────────
$(document).on("click", ".accept-button, .hospital-accept-button, .accept-appointment", function () {

    const appointmentId = $(".appointmentRequestDetail, .modal-pending")
        .filter(":visible")
        .attr("data-appointment-id");

    if (!appointmentId) {
        toastr.error("Appointment ID not found");
        return;
    }

    _placeBid(appointmentId, null);
});


// ── Shared place-bid AJAX ────────────────────────────────────
function _placeBid(appointmentId, $row) {

    $.ajax({
        url: "/appointment/place-bid/",
        type: "POST",

        data: {
            appointment_id: appointmentId,
            csrfmiddlewaretoken: $('meta[name="csrf-token"]').attr("content")
        },

        success: function (resp) {

            if (resp.success) {

                toastr.success(resp.message || "Bid placed successfully");

                // Close any open popup
                $(".appointmentRequestDetail, .modal-pending")
                    .addClass("hidden")
                    .removeClass("flex");

                // Remove the row from list if passed
                if ($row && $row.length) {
                    $row.fadeOut(300, function () { $(this).remove(); });
                } else {
                    setTimeout(function () { location.reload(); }, 1000);
                }

            } else {
                toastr.error(resp.message || "Unable to place bid");
            }
        },

        error: function (xhr) {
            toastr.error(
                xhr.responseJSON?.message || "Something went wrong"
            );
        }
    });
}


// ── Cancel bid ───────────────────────────────────────────────
$(document).on("click", ".cancel-bid-btn", function () {

    const bidId = $(this).data("bid-id");
    if (!bidId) return;

    $.ajax({
        url: "/appointment/cancel-bid/",
        type: "POST",

        data: {
            bid_id: bidId,
            csrfmiddlewaretoken: $('meta[name="csrf-token"]').attr("content")
        },

        success: function (resp) {

            if (resp.success) {
                toastr.success("Bid cancelled successfully");
                setTimeout(function () { location.reload(); }, 1000);
            } else {
                toastr.error(resp.message || "Unable to cancel bid");
            }
        },

        error: function (xhr) {
            toastr.error(
                xhr.responseJSON?.message || "Something went wrong"
            );
        }
    });
});


// ── Complete appointment ─────────────────────────────────────
$(document).on("click", ".complete-btn, .complete-appointment-btn", function () {

    const appointmentId = $(this).data("id") ||
        $(".appointmentRequestDetail, .modal-pending")
            .filter(":visible")
            .attr("data-appointment-id");

    // For lab: also grab bid_id if present
    const bidId = $(this).data("bid-id") || null;

    if (!appointmentId && !bidId) {
        toastr.error("Appointment not found");
        return;
    }

    $.ajax({
        url: "/appointment/complete-appointment/",
        type: "POST",

        data: {
            appointment_id: appointmentId || "",
            bid_id: bidId || "",
            csrfmiddlewaretoken: $('meta[name="csrf-token"]').attr("content")
        },

        success: function (resp) {

            if (resp.success) {

                toastr.success(resp.message || "Completed successfully");

                $(".acceptedDetail").addClass("hidden");
                $(".completedDetail").removeClass("hidden");

                setTimeout(function () { location.reload(); }, 1500);

            } else {
                toastr.error(resp.message || "Unable to complete");
            }
        },

        error: function (xhr) {
            toastr.error(
                xhr.responseJSON?.message || "Something went wrong"
            );
        }
    });
});


// ── No-show ──────────────────────────────────────────────────
$(document).on("click", ".no-show-btn", function () {

    const appointmentId = $(this).data("id") ||
        $(".appointmentRequestDetail, .modal-pending")
            .filter(":visible")
            .attr("data-appointment-id");

    const bidId = $(this).data("bid-id") || null;

    $.ajax({
        url: "/appointment/no-show-appointment/",
        type: "POST",

        data: {
            appointment_id: appointmentId || "",
            bid_id: bidId || "",
            csrfmiddlewaretoken: $('meta[name="csrf-token"]').attr("content")
        },

        success: function (resp) {

            if (resp.success) {
                toastr.success(resp.message || "Marked as no-show");
                setTimeout(function () { location.reload(); }, 1500);
            } else {
                toastr.error(resp.message || "Unable to mark no-show");
            }
        },

        error: function (xhr) {
            toastr.error(
                xhr.responseJSON?.message || "Something went wrong"
            );
        }
    });
});


// ── Cancel appointment (popup confirm flow) ──────────────────
$(document).on("click", ".cancelAppointmentBtn", function () {

    const bidId = $(this).data("bid-id") || null;

    $.ajax({
        url: "/appointment/cancel-bid/",
        type: "POST",

        data: {
            bid_id: bidId || "",
            csrfmiddlewaretoken: $('meta[name="csrf-token"]').attr("content")
        },

        success: function (resp) {

            toastr.success("Cancelled successfully");

            $(".cancelAppointmentPopup").addClass("hidden");
            $(".acceptedDetail").addClass("hidden");
            $(".cancelDetails").removeClass("hidden");

            setTimeout(function () { location.reload(); }, 1500);
        },

        error: function (xhr) {
            toastr.error(
                xhr.responseJSON?.message || "Something went wrong"
            );
        }
    });
});


// ── Close popups ─────────────────────────────────────────────
$(document).on("click", ".close-popup, .modal-close-pending", function () {

    const popupId = $(this).data("popup");

    if (popupId) {
        $("." + popupId).addClass("hidden").removeClass("flex");
    } else {
        // Generic close for modals without data-popup
        $(this).closest(
            ".appointmentRequestDetail, .modal-pending, .cancelAppointmentPopup"
        ).addClass("hidden")
    }
});


// ── Reject/cancel from popup (no API, UI only) ───────────────
$(document).on("click", ".reject-button", function () {

    $(".appointmentRequestDetail, .modal-pending")
        .addClass("hidden")
        .removeClass("flex");

    toastr.info("Dismissed");
});
// ===============================
// SEARCH APPOINTMENT BY NAME
// ===============================

$(document).on("keyup", "#appointmentSearch", function () {

    let value = $(this).val().toLowerCase().trim();

    $(".card-all-pending,.card-all-accepted,.card-all-completed,.card-all-cancelled,.card-all-missed").each(function () {

        let patientName = ($(this).data("name") || "").toLowerCase();

        let serviceType = (($(this).data("service-type") || "") + "")
            .replace(/_/g, " ")
            .toLowerCase();

        let visitType = (($(this).data("visit-type") || "") + "")
            .replace(/_/g, " ")
            .toLowerCase();

        $(this).toggle(
            patientName.includes(value) ||
            serviceType.includes(value) ||
            visitType.includes(value)
        );

    });

});