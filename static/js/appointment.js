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
      const orderId = card.data("order-id") || "-";
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
        // <button class="bg-dodger-blue text-white rounded-lg w-[180px] h-10">Accept</button>
        // <button class="border border-strong-red text-strong-red rounded-lg w-[180px] h-10">Reject</button>
        <button
          class="accept-btn bg-dodger-blue text-white rounded-lg w-[180px] h-10"
          data-order="${orderId}">
          Accept
        </button>

        <button
          class="reject-btn border border-strong-red text-strong-red rounded-lg w-[180px] h-10"
          data-order="${orderId}">
          Reject
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
/* ------------------------------
 * ACCEPT APPOINTMENT
 * ------------------------------ */

// $(document).on("click", ".accept-btn", function () {

//     const orderId = $(this).data("order");

//     $.ajax({

//         url: "/appointment/update-status/",

//         type: "POST",

//         // data: {

//         //     order_id: orderId,

//         //     status: "Accepted",

//         //     csrfmiddlewaretoken:
//         //     $("input[name=csrfmiddlewaretoken]").val()

//         // },
//         data: {

//             order_id: orderId,

//             status: "Accepted"

//           },

//          headers: {

//             "X-CSRFToken": getCookie("csrftoken")

//          },

//         // success: function () {

          
//         //     showToast("Appointment Accepted Successfully", "success");

//         //     location.reload();

//         // }
//       success: function (response) {

//     if (response.success) {

//         showToast("Appointment Accepted Successfully", "success");

//         $(".modal-pending").addClass("hidden");

//         setTimeout(() => {

//             loadAppointments(currentStatus, 1);

//         }, 300);

//     } else {

//         showToast(response.message || "Something went wrong", "error");

//     }

// }

// });


/* ------------------------------
 * REJECT APPOINTMENT
 * ------------------------------ */

$(document).on("click", ".reject-btn", function () {

    const orderId = $(this).data("order");

    $.ajax({

        url: "/appointment/update-status/",
        type: "POST",

        data: {
            order_id: orderId,
            status: "Cancelled"
        },

        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        },

        success: function (response) {

            if (response.success) {

                showToast("Appointment Cancelled Successfully", "error");

                $(".modal-pending").addClass("hidden");

                setTimeout(() => {
                    loadAppointments(currentStatus, 1);
                }, 300);

            } else {

                showToast(response.message || "Something went wrong", "error");

            }

        },

        error: function (xhr) {

            console.log(xhr.responseText);

            alert("Error");
        }

    });

});


/* ------------------------------
 * ACCEPT APPOINTMENT
 * ------------------------------ */

$(document).on("click", ".accept-btn", function () {

    const orderId = $(this).data("order");

    $.ajax({

        url: "/appointment/update-status/",
        type: "POST",

        data: {
            order_id: orderId,
            status: "Accepted"
        },

        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        },

        success: function (response) {

            if (response.success) {

                showToast("Appointment Accepted Successfully", "success");

                $(".modal-pending").addClass("hidden");

                setTimeout(() => {
                    loadAppointments(currentStatus, 1);
                }, 300);

            } else {

                showToast(response.message || "Something went wrong", "error");

            }

        },

        error: function (xhr) {

            console.log(xhr.responseText);

            showToast("Error updating appointment", "error");
        }

    });

});

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
    $(".attachment-modal").removeClass("hidden");

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
