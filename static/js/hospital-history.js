  let currentStatus = "accepted";

  function loadHospitalHistory(status = "accepted", page = 1) {
  const isDoctorPage = $("#doctor-cards-container").length > 0;

  const container = isDoctorPage
    ? "#doctor-cards-container"
    : "#hospital-cards-container";

  const ajaxUrl = isDoctorPage
    ? "/history/doctor/history/ajax/"
    : "/history/hospital/history/ajax/";

  currentStatus = status;

  $(container).html(
    `<p class="text-center mt-10 text-spanish-gray">Loading...</p>`
  );

  $.ajax({
    url: ajaxUrl,
    type: "GET",
    data: { status: status, page: page },
    success: function (res) {
      $(container).html(res.html);
    },
    error: function () {
      $(container).html(
        `<p class="text-center text-red-500 mt-10">Failed to load history</p>`
      );
    }
  });
}
$(document).ready(function () {


  $(document).on("click", ".page-btn, .prev-btn, .next-btn", function () {
    let page = $(this).data("page");

    if ($(this).hasClass("prev-btn")) {
      page = $(this).data("prev");
    }

    if ($(this).hasClass("next-btn")) {
      page = $(this).data("next");
    }

    loadHospitalHistory(currentStatus, page);
  });

  loadHospitalHistory("accepted", 1);
  const itemsPerPage = 5;

  // Toggle disease dropdown
  $(document).on(
    "click",
    ".disease-input-container, .disease-input-container input, .disease-input-container span",
    function (e) {
      e.stopPropagation();
      $(".disease-dropdown").toggleClass("hidden");
    }
  );

  // Select disease from dropdown
  $(document).on("click", ".disease-option", function () {
    const selectedDisease = $(this).text().trim();
    $('.assignPopup input[placeholder="Select Disease"]').val(selectedDisease);
    $(".disease-dropdown").addClass("hidden");
  });

  // Close disease dropdown when clicking outside
  $(document).on("click", function (e) {
    if (
      !$(e.target).closest(".disease-input-container").length &&
      !$(e.target).closest(".disease-dropdown").length
    ) {
      $(".disease-dropdown").addClass("hidden");
    }
  });

  // Initialize pagination for each tab
  function initializePagination() {
    const tabs = ["accepted", "pending", "canceled", "missed", "equipment"];

    tabs.forEach((tab) => {
      const container = $(`.${tab} #cards-container`);
      const cards = container.children();
      const totalPages = Math.ceil(cards.length / itemsPerPage);

      // Hide all cards initially
      cards.hide();

      // Create pagination HTML
      const paginationHTML = `
        <div class="pagination-${tab} flex justify-center items-center gap-3 mt-6">
          <button class="prev-btn text-spanish-gray font-normal text-xs px-4 py-2 rounded-lg  transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
          <div class="page-numbers flex gap-2"></div>
          <button class="next-btn text-spanish-gray font-normal text-xs px-4 py-2 rounded-lg  transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
        </div>
      `;

      // Append pagination after cards container
      if ($(`.pagination-${tab}`).length === 0) {
        container.after(paginationHTML);
      }

      // Show first page
      showPage(tab, 1, cards, totalPages);
    });
  }

  // Show specific page
  function showPage(tab, page, cards, totalPages) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    // Hide all cards and show only current page cards
    cards.hide();
    cards.slice(start, end).show();

    // Update pagination buttons
    updatePaginationButtons(tab, page, totalPages);
  }

  // Update pagination buttons
  function updatePaginationButtons(tab, currentPage, totalPages) {
    const paginationContainer = $(`.pagination-${tab}`);
    const pageNumbersContainer = paginationContainer.find(".page-numbers");
    const prevBtn = paginationContainer.find(".prev-btn");
    const nextBtn = paginationContainer.find(".next-btn");

    // Clear existing page numbers
    pageNumbersContainer.empty();

    // Generate page number buttons
    for (let i = 1; i <= totalPages; i++) {
      const isActive = i === currentPage;
      const pageBtn = $(`
        <button class="page-btn w-8 h-8 rounded-lg font-normal text-xs transition cursor-pointer ${
          isActive
            ? "bg-dodger-blue text-white"
            : "bg-light-gray text-dark-gray  "
        }" data-page="${i}">
          ${i}
        </button>
      `);
      pageNumbersContainer.append(pageBtn);
    }

    // Enable/disable prev and next buttons
    prevBtn.prop("disabled", currentPage === 1);
    nextBtn.prop("disabled", currentPage === totalPages);

    // Store current page
    paginationContainer.data("current-page", currentPage);
    paginationContainer.data("total-pages", totalPages);
  }

  // Handle pagination clicks
  // $(document).on("click", ".prev-btn, .next-btn, .page-btn", function () {
  //   const button = $(this);
  //   const paginationContainer = button.closest('[class*="pagination-"]');
  //   const tab = paginationContainer.attr("class").match(/pagination-(\w+)/)[1];
  //   const container = $(`.${tab} #cards-container`);
  //   const cards = container.children();
  //   const totalPages = paginationContainer.data("total-pages");
  //   let currentPage = paginationContainer.data("current-page");

  //   if (button.hasClass("prev-btn")) {
  //     currentPage = Math.max(1, currentPage - 1);
  //   } else if (button.hasClass("next-btn")) {
  //     currentPage = Math.min(totalPages, currentPage + 1);
  //   } else if (button.hasClass("page-btn")) {
  //     currentPage = parseInt(button.data("page"));
  //   }

  //   showPage(tab, currentPage, cards, totalPages);
  // });

  // Initialize on page load
  // initializePagination();

  // Open modal when any card is clicked
  // All Accepted
  // $(document).on("click", ".card-all-accepted", function () {
  //   $(".modal-all-accepted").removeClass("hidden");
  // });

  // Close modal when close button is clicked
  $(".modal-close-all-accepted").on("click", function () {
    $(".modal-all-accepted").addClass("hidden");
  });

  // All Completed
  // $(document).on("click", ".card-all-completed", function () {
  //   $(".modal-all-completed").removeClass("hidden");
  // });

  // Close modal when close button is clicked
  $(".modal-close-all-completed").on("click", function () {
    $(".modal-all-completed").addClass("hidden");
  });

  // For "missed" modal
  // $(document).on("click", ".card-missed", function () {
  //   $(".modal-missed").removeClass("hidden");
  // });

  // Close "missed" modal
  $(".modal-close-missed").on("click", function () {
    $(".modal-missed").addClass("hidden");
  });

  // For "canceled" modal
  // $(document).on("click", ".card-canceled", function () {
  //   $(".modal-canceled").removeClass("hidden");
  // });

  // Close "canceled" modal
  // $(".modal-close-canceled").on("click", function () {
  //   $(".modal-canceled").addClass("hidden");
  // });

  // For "pending" modal
  // $(document).on("click", ".card-pending", function () {
  //   $(".modal-pending").removeClass("hidden");
  // });

  // Close "pending" modal
  $(".modal-close-pending").on("click", function () {
    $(".modal-pending").addClass("hidden");
  });

  $(".modal-close-cancelled").on("click", function () {
    $(".modal-cancelled").addClass("hidden");
  });

    $(".modal-close-accepted").on("click", function () {
    $(".modal-accepted").addClass("hidden");
  });

  // Image Attachment Preview (for all)
$(document).on("click", ".view-attachment", function () {


    console.log($("#attachment-preview-image").length);
    console.log($(".attachment-modal").length);

    $("#attachment-preview-image").attr(
        "src",
        window.currentAttachment || "/static/images/attachment.png"
    );

    $(".attachment-modal").removeClass("hidden");
});

  // Close attachment modal
  $(".close-attachment-modal").on("click", function () {
    $(".attachment-modal").addClass("hidden");
  });

  // Close modal if background clicked
  $(".attachment-modal").on("click", function (e) {
    if ($(e.target).is(".attachment-modal")) {
      $(this).addClass("hidden");
    }
  });

  // Equipment - Handle all status buttons dynamically
  // Toggle dropdown visibility
  $(document).on("click", function (e) {
    const $clickedButton = $(e.target).closest(".status-btn");
    const $allDropdowns = $(".status-dropdown");

    // If clicked inside a status button
    if ($clickedButton.length) {
      const $dropdown = $clickedButton.next(".status-dropdown");
      // Close all other dropdowns
      $allDropdowns.not($dropdown).addClass("hidden");
      // Toggle current dropdown
      $dropdown.toggleClass("hidden");
      return;
    }

    // If clicked on a dropdown item
    if ($(e.target).hasClass("dropdown-item")) {
      const $parent = $(e.target).closest(".relative");
      $parent.find(".status-text").text($(e.target).text());
      $parent.find(".status-dropdown").addClass("hidden");
      return;
    }

    // If clicked outside dropdowns, close all
    $allDropdowns.addClass("hidden");
  });

 $(".tab-btn-hospital").on("click", function () {
  const targetTab = $(this).data("tab");

  if (targetTab === "equipment") {
    $(".tab-content").addClass("hidden");
    $(".equipment").removeClass("hidden");
  } else {
    $(".tab-content").addClass("hidden");
    $(".accepted").removeClass("hidden");
    loadHospitalHistory(targetTab, 1);
  }

  $(".tab-btn-hospital")
    .removeClass("active-tab-hospital font-semibold")
    .addClass("font-medium");

  $(this)
    .addClass("active-tab-hospital font-semibold")
    .removeClass("font-medium");
});

  // 1. Toggle Main Dropdown
  $(".filterToggle").on("click", function (e) {
    e.stopPropagation();
    const isHidden = $(".filterDropdown").hasClass("hidden");
    $(".filterDropdown, .submenu").addClass("hidden"); // Reset all
    if (isHidden) $(".filterDropdown").removeClass("hidden");
  });

  // 2. Open Date Submenu (Keep main open)
  $(".trigger-date").on("click", function (e) {
    e.stopPropagation();
    $(".submenu").not("#dateSubmenu").addClass("hidden"); // Close other submenus except date
    $("#calendarContainer").addClass("hidden"); // Close calendar if open
    $("#dateSubmenu").removeClass("hidden").css("top", $(this).position().top);
  });

  // Initialize the jQuery UI Datepicker inline
  $(".datepicker-inline").datepicker({
    onSelect: function (dateText) {
      console.log("Selected date: " + dateText);

      // Mark Custom option as selected
      $("#dateSubmenu .trigger-custom .material-symbols-outlined")
        .first()
        .removeClass("text-light-gray")
        .addClass("!text-dodger-blue");

      // Close everything after date selection
      $(".filterDropdown, .submenu").addClass("hidden");
      $("#calendarContainer").addClass("hidden");
    },
  });

  // 3. Open Calendar when clicking "Custom"
  $(".trigger-custom").on("click", function (e) {
    e.stopPropagation();

    // Position the calendar relative to the Custom menu item
    const topPos = $(this).position().top;

    // Show the calendar
    $("#calendarContainer").removeClass("hidden").css("top", topPos);
  });

  // 4. Status & Visit Submenus
  $(".trigger-status").on("click", function (e) {
    e.stopPropagation();
    $(".submenu").addClass("hidden");
    $("#calendarContainer").addClass("hidden"); // Close calendar if open
    $("#statusSubmenu")
      .removeClass("hidden")
      .css("top", $(this).position().top);
  });

  $(".trigger-visit").on("click", function (e) {
    e.stopPropagation();
    $(".submenu").addClass("hidden");
    $("#calendarContainer").addClass("hidden"); // Close calendar if open
    $("#visitSubmenu").removeClass("hidden").css("top", $(this).position().top);
  });

  // 5. Handle option selection in Date submenu (Week/Month only, not Custom)
  $("#dateSubmenu > div:not(.trigger-custom)").on("click", function (e) {
    e.stopPropagation();

    // Remove active state from all options in date submenu
    $("#dateSubmenu .material-symbols-outlined")
      .removeClass("!text-dodger-blue")
      .addClass("text-light-gray");

    // Add active state to clicked option
    $(this)
      .find(".material-symbols-outlined")
      .removeClass("text-light-gray")
      .addClass("!text-dodger-blue");

    // Close all dropdowns
    $(".filterDropdown, .submenu").addClass("hidden");
  });

  // 6. Handle option selection in Status and Visit submenus
  $("#statusSubmenu > div, #visitSubmenu > div").on("click", function (e) {
    e.stopPropagation();

    // Get the parent submenu
    const $submenu = $(this).closest(".submenu");

    // Remove active state from all options in this submenu
    $submenu
      .find(".material-symbols-outlined")
      .removeClass("!text-dodger-blue")
      .addClass("text-light-gray");

    // Add active state to clicked option
    $(this)
      .find(".material-symbols-outlined")
      .removeClass("text-light-gray")
      .addClass("!text-dodger-blue");

    // Close all dropdowns
    $(".filterDropdown, .submenu").addClass("hidden");
  });

  // 7. Global Close
  $(document).on("click", function () {
    $(".filterDropdown, .submenu").addClass("hidden");
    $("#calendarContainer").addClass("hidden");
  });

  // Prevent menu from closing when clicking inside
  $(".filterDropdown, .submenu, #calendarContainer").on("click", function (e) {
    e.stopPropagation();
  });

  // Variable to store the current assign button being clicked
  let currentAssignBtn = null;

  // Open assign popup and store reference to clicked button
  $(document).on("click", ".assign-btn", function () {
    currentAssignBtn = $(this);
    $(".assignPopup").removeClass("hidden");
  });

  // Close assign popup
  $(".closeAssignPopup").on("click", function () {
    $(".assignPopup").addClass("hidden");
    currentAssignBtn = null;
    // Clear input fields
    $('.assignPopup input[type="text"]').val("");
  });

  // Save button click handler
  $(".saveBtn").on("click", function () {
    // Get the entered patient name
    const patientName = $(
      '.assignPopup input[placeholder="Enter Patient Name"]'
    )
      .val()
      .trim();
    const selectedDisease = $(
      '.assignPopup input[placeholder="Select Disease"]'
    )
      .val()
      .trim();

    // Validate inputs
    if (!patientName) {
      // alert("Please enter patient name");
      return;
    }

    if (!selectedDisease) {
      // alert("Please select a disease");
      return;
    }

    // Update the assign button text with patient name
    if (currentAssignBtn) {
      currentAssignBtn.find(".status-text").text(patientName);

      // Update the card to show patient info instead of "Assign to" button
      const $card = currentAssignBtn.closest(".card-equipment");
      const $patientInfoDiv = $card.find(".flex.items-center.gap-3").first();

      // Replace the assign button container with patient info
      const $assignContainer = currentAssignBtn.closest(".relative");
      $assignContainer.replaceWith(`
            <div class="flex items-center gap-3">
                <div class="flex flex-col">
                    <p class="font-semibold text-sm text-jet-black">${patientName}</p>
                    <span class="text-xs text-spanish-gray">${selectedDisease}</span>
                </div>
            </div>
        `);
    }

    // Close popup and clear fields
    $(".assignPopup").addClass("hidden");
    $('.assignPopup input[type="text"]').val("");
    currentAssignBtn = null;
  });

  // Close popup when clicking outside
  $(".assignPopup").on("click", function (e) {
    if ($(e.target).is(".assignPopup")) {
      $(this).addClass("hidden");
      currentAssignBtn = null;
      $('.assignPopup input[type="text"]').val("");
    }
  });
  /* Open modal on hospital history card click */
$("#hospital-cards-container, #doctor-cards-container").on(
  "click",
  ".card-all-pending, .card-all-accepted, .card-all-completed, .card-all-cancelled, .card-all-canceled, .card-all-missed",
  function () {
    const card = $(this);
    const status = (card.data("status") || "").toLowerCase();

    let modal;

    switch (status) {
        case "accepted":
            modal = $(".modal-accepted");
            break;

        case "pending":
            modal = $(".modal-pending");
            break;

        case "cancelled":
        case "canceled":
            modal = $(".modal-cancelled");
            break;

        case "missed":
            modal = $(".modal-missed");
            break;

        default:
            modal = $(".modal-pending");
    }
    const attachment = card.data("attachment");
    window.currentAttachment = attachment;

    const bill = card.data("bill");
    window.currentBill = bill;
    const appointmentId = card.data("id");
    const bidId = card.data("bid-id");
    window.currentBidId = bidId;
    window.currentAppointmentId = appointmentId;
    console.log("APPOINTMENT ID =", appointmentId);
    console.log("BID ID =", bidId);
    console.log("CARD =", card);
    const isDoctorPage = $("#doctor-cards-container").length > 0;

    modal.find("#modal-name").text(card.data("name") || "-");
    modal.find("#modal-gender").text(card.data("gender") || "-");
    modal.find("#modal-age").text(card.data("age") || "-");

    let phone = String(card.data("phone") || "-");
    if (phone !== "-" && !phone.startsWith("+91")) {
      phone = "+91 " + phone;
    }
    modal.find("#modal-phone").text(phone);

    const visitType = card.data("visit-type") || "Visit";

    const formattedVisitType =
      visitType.replaceAll("_", " ").toLowerCase() === "hospital"
        ? "Hospital Visit"
        : visitType.replaceAll("_", " ").toLowerCase() === "home collection"
          ? "Home Visit"
          : visitType
              .replaceAll("_", " ")
              .replace(/\b\w/g, c => c.toUpperCase());

    modal.find("#modal-visit-type").text(formattedVisitType);

    modal.find("#modal-date").text(card.data("date") || "-");

    let address = String(card.data("address") || "-");
    if (address === "string -" || address === "string" || address.trim() === "") {
      address = "-";
    }
    modal.find("#modal-address").text(address);
    if (isDoctorPage) {
      $("#modal-requirement-label").text("Medical Requirement");
    } else {
      $("#modal-requirement-label").text("Test Requirement");
    }
    modal.find("#modal-service-type").text(card.data("service-type") || "-");
    modal.find("#modal-details").text(card.data("details") || "-");

    const isCancelled = status === "cancelled" || status === "canceled";

    let step1 = "bg-blue-haze";
    let step2 = "bg-blue-haze";
    let step3 = "bg-blue-haze";
    let step4 = "bg-blue-haze";

    if (status === "pending") {
      step1 = "bg-dodger-blue";
    }

    if (status === "accepted") {
      step1 = "bg-dodger-blue";
      step2 = "bg-dodger-blue";
    }

    if (status === "completed") {
      step1 = "bg-dodger-blue";
      step2 = "bg-dodger-blue";
      step3 = "bg-dodger-blue";
    }

    if (status === "cancelled" || status === "canceled") {
      step1 = "bg-dodger-blue";
      step4 = "bg-dodger-blue";
    }

    const orderId = card.data("order-id") || "-";
    const budget = card.data("budget")
    ? "₹" + String(card.data("budget")).replace(".00", "")
    : "-";

    let rightTitle = "Budget";
    let rightValue = budget;
    let buttons = "";

    if (status === "pending") {
      rightTitle = "Budget";
      rightValue = budget;

      buttons = `
        <div class="pt-4 flex justify-center items-center gap-3">
          <button class="border border-red-500 text-red-500 rounded-lg w-[180px] h-10 cancel-bid">Cancel Bid</button>
        </div>
      `;
    }

    if (status === "accepted") {
      rightTitle = card.data("distance") || "6 km";
      rightValue = card.data("time") || "20 mins away";

      buttons = `
        <div class="pt-4 flex justify-center items-center gap-3">
          <button class="complete-appointment bg-dodger-blue text-white rounded-lg w-[180px] h-10 complete-appointment">Complete</button>
          <button class="cancel-appointment border border-red-500 text-red-500 rounded-lg w-[180px] h-10 cancel-bid">Cancel Appointment</button>
        </div>
      `;
    }

    if (status === "cancelled" || status === "canceled") {
      rightTitle = "Canceled by";
      const cancelledBy = card.data("cancelled-by") || "Doctor";

      rightTitle = "";
      rightValue = `Canceled by ${cancelledBy}`;

      buttons = "";
    }

    if (status === "missed") {
      rightTitle = "Missing Reason";
      rightValue = "Doctor didn’t show up";

      buttons = "";
    }

    if (status === "pending") {
      buttons = `
        <div class="pt-4 flex justify-center items-center gap-3">
          <button class="border border-red-500 text-red-500 rounded-lg w-[180px] h-10 cancel-bid">Cancel Bid</button>
        </div>
      `;
    }

    if (status === "cancelled" || status === "canceled") {
      rightTitle = "";
      rightValue = "Canceled by Doctor";
    }

    if (status === "missed") {
      rightTitle = "Reason";
      rightValue = "Doctor didn’t show up";
    }
    const timelineHtml = isCancelled
    ? `
      <div class="flex flex-col py-4 gap-4">
        <div class="flex justify-center items-center gap-1">
          <div class="w-2 h-2 bg-dodger-blue rounded-full"></div>
          <div class="w-[192px] h-0.5 bg-dodger-blue"></div>
          <div class="w-2 h-2 bg-dodger-blue rounded-full"></div>
          <div class="w-[192px] h-0.5 bg-dodger-blue"></div>
          <div class="w-2 h-2 bg-dodger-blue rounded-full"></div>
        </div>

        <div class="flex items-center justify-between mx-20 text-sm">
          <p>Enquiry</p>
          <p>Appointment</p>
          <p>Canceled</p>
        </div>
      </div>
    `
    : `
      <div class="flex flex-col py-4 gap-4">
        <div class="flex justify-center items-center gap-1">
          <div class="w-2 h-2 ${step1} rounded-full"></div>
          <div class="w-[138px] h-0.5 ${step2}"></div>

          <div class="w-2 h-2 ${step2} rounded-full"></div>
          <div class="w-[138px] h-0.5 ${step3}"></div>

          <div class="w-2 h-2 ${step3} rounded-full"></div>
          <div class="w-[138px] h-0.5 ${step4}"></div>

          <div class="w-2 h-2 ${step4} rounded-full"></div>
        </div>

        <div class="flex items-center justify-between px-10 text-sm">
          <p>Enquiry</p>
          <p>Appointment</p>
          <p>Completed</p>
          <p>Cancel/Expired</p>
        </div>
      </div>
    `;
    modal.find(".modal-enquiry-detail").html(`
    ${timelineHtml}

  <div class="mt-6">
    <div class="flex justify-between">
      <p class="font-normal text-sm">Order ID</p>
      ${rightTitle ? `<p class="font-normal text-sm">${rightTitle}</p>` : `<p></p>`}
    </div>

    <div class="flex justify-between mt-1">
      <p class="font-normal text-sm text-blue-gray">Order #${orderId}</p>
      <p class="font-normal text-sm ${
        status === "cancelled" || status === "canceled"
          ? "text-strong-red"
          : rightTitle === "Budget"
            ? "text-dodger-blue"
            : ""
      }">
        ${rightValue}
      </p>
    </div>

    ${status === "accepted" ? `
      <div class="flex justify-between items-center mt-3">
        <label class="flex items-center gap-2">
          <span class="font-normal text-sm">No Show</span>
          <input type="checkbox" id="no-show-checkbox" class="w-4 h-4 accent-dodger-blue">
        </label>
        <p class="font-normal text-sm text-blue-gray">Patient didn’t show up</p>
      </div>
    ` : ""}
    ${status === "accepted" ? `
    <div class="flex justify-between items-center mt-4">
      <div class="flex items-center gap-2">
        <span class="font-normal text-sm">${formattedVisitType}</span>
        <span class="text-dodger-blue font-medium text-sm">${budget}</span>
      </div>

      <div class="proforma-bill-btn border border-dodger-blue text-jet-black rounded-lg px-3 py-1 flex items-center gap-2 cursor-pointer">
        <p class="font-normal text-sm">Proforma Bill</p>
        <span class="material-symbols-outlined !text-lg">visibility</span>
      </div>
    </div>
  ` : ""}

    ${buttons}
  </div>
`);

$(".modal-pending, .modal-accepted, .modal-completed, .modal-cancelled")
    .addClass("hidden");

switch (status) {

    case "pending":
        $(".modal-pending").removeClass("hidden");
        break;

    case "accepted":
        $(".modal-accepted").removeClass("hidden");
        break;

    case "completed":
        $(".modal-completed").removeClass("hidden");
        break;

    case "cancelled":
    case "canceled":
        $(".modal-cancelled").removeClass("hidden");
        break;

    case "missed":
        $(".modal-missed").removeClass("hidden"); // or modal-missed if you create one
        break;
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

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return '';
}

// const csrftoken = getCookie("csrftoken");

$(document).on("click", ".cancel-bid", function () {
    console.log("Sending bid_id:", window.currentBidId);

    $.ajax({
        url: "/history/cancel-bid/",
        type: "POST",
        headers: {
            "X-CSRFToken": csrftoken
        },
        data: {
            bid_id: window.currentBidId
        },

        success: function (response) {

          if (response.success) {

              toastr.success(response.message || "Bid cancelled successfully");

              $(".modal-pending, .modal-accepted, .modal-cancelled, .modal-missed")
                  .addClass("hidden");

              loadHospitalHistory(currentStatus, 1);

          } else {

              toastr.error(response.message || "Unable to cancel bid");

          }

        },
        error: function () {
            toastr.error("Something went wrong");
        }

    });

});

$(document).on("click", ".complete-appointment", function () {

    $.ajax({

        url: "/history/complete-appointment/",
        type: "POST",

        headers: {
            "X-CSRFToken": csrftoken
        },

        data: {

            appointment_id: window.currentAppointmentId,
            bid_id: window.currentBidId

        },

        success: function (response) {

            if (response.success) {

                toastr.success(response.message || "Appointment completed successfully");

                $(".modal-pending, .modal-accepted, .modal-completed")
                    .addClass("hidden");

                loadHospitalHistory(currentStatus, 1);

            } else {

                toastr.error(response.message);

            }

        },
        error: function () {
            toastr.error("Something went wrong");
        }

    });

});

$(document).on("change", "#no-show-checkbox", function () {

    if (!this.checked)
        return;

    $.ajax({

        url: "/history/no-show-appointment/",

        type: "POST",

        headers: {
            "X-CSRFToken": csrftoken
        },

        data: {

            appointment_id: window.currentAppointmentId,
            bid_id: window.currentBidId

        },

        success: function (response) {

            if (response.success) {

                toastr.success(response.message || "Appointment marked as no show");

                $(".modal-accepted").addClass("hidden");

                loadHospitalHistory(currentStatus, 1);

            } else {

                toastr.error(response.message);

            }

        },
        error: function () {
            toastr.error("Something went wrong");
        }

    });

});

// $(document).on("click", ".proforma-bill-btn", function () {

//     if (window.currentBill) {

//         $("#attachment-preview-image")
//             .attr("src", window.currentBill)
//             .removeClass("hidden");

//         $("#no-proforma-bill-message").addClass("hidden");

//     } else {

//         $("#attachment-preview-image").addClass("hidden");

//         $("#no-proforma-bill-message").removeClass("hidden");
//     }

//     $(".attachment-modal").removeClass("hidden");
// });
$(document).on("click", ".proforma-bill-btn", function () {
    $(".proformaBillPopup").removeClass("hidden");
});

$(document).on("click", ".close-proforma", function () {
    $(".proformaBillPopup").addClass("hidden");
});
$(document).on("click", ".doctor-accept-button", function () {

    const appointmentId = $(".appointmentRequestDetail")
        .attr("data-appointment-id");

    if (!appointmentId) {
        toastr.error("Appointment ID not found");
        return;
    }

    $.ajax({
        url: "/appointment/doctor-place-bid/",
        type: "POST",

        data: {
            appointment_id: appointmentId,
            csrfmiddlewaretoken: $('meta[name="csrf-token"]').attr("content")
        },

        success: function (resp) {

            if (resp.success) {

                toastr.success(
                    resp.message || "Bid placed successfully"
                );

                $(".appointmentRequestDetail")
                    .addClass("hidden")
                    .removeClass("flex");

                setTimeout(function () {
                    location.reload();
                }, 1000);

            } else {

                toastr.error(
                    resp.message || "Unable to place bid"
                );
            }
        },

        error: function (xhr) {

            let message = "Something went wrong";

            if (
                xhr.responseJSON &&
                xhr.responseJSON.message
            ) {
                message = xhr.responseJSON.message;
            }

            toastr.error(message);
        }
    });

});
$(document).on("click", ".dropdown-item", function () {

    const text = $(this).text().trim();

    $(this)
        .closest(".dropdown-trigger")
        .find(".selected-text")
        .text(text);

});