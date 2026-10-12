function getCookie(name) {
  let cookieValue = null;

  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();

      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }

  return cookieValue;
}

let selectedDoctor = null;

$(document).ready(function () {
  // Define all doctors data
  let allDoctors = [];
  let filteredDoctors = [];
  let activeDateFilter = "";
  let activeCustomDate = null;
  let activeStatusFilter = "";
  const $doctorFilter = $(".doctor-filter");

  function closeDoctorFilters() {
    $doctorFilter
      .find(".filterDropdown, .submenu")
      .addClass("hidden")
      .css("display", "");
  }

  // 1. Toggle Main Dropdown
  $(".doctorFilterToggle").on("click", function (e) {
    e.stopPropagation();
    const $menu = $(this).closest(".doctor-filter").children(".filterDropdown");
    const shouldOpen = $menu.hasClass("hidden");

    closeDoctorFilters();
    if (shouldOpen) $menu.removeClass("hidden").css("display", "");
  });

  // 2. Open Date Submenu (Keep main open)
  $(".trigger-date").on("click", function (e) {
    e.stopPropagation();
    $doctorFilter.find(".submenu").not("#dateSubmenu").addClass("hidden").css("display", "");
    $("#calendarContainer").addClass("hidden").css("display", "");
    $("#dateSubmenu").removeClass("hidden").css({
      top: $(this).position().top,
      display: "",
    });
  });

  // Initialize the jQuery UI Datepicker inline
  const $doctorDatepicker = $doctorFilter.find(".datepicker-inline");
  if ($doctorDatepicker.hasClass("hasDatepicker")) {
    $doctorDatepicker.datepicker("destroy");
  }
  $doctorDatepicker.datepicker({
    dateFormat: "yy-mm-dd",
    onSelect: function (dateText) {
      activeCustomDate = $.datepicker.parseDate("yy-mm-dd", dateText);
      activeDateFilter = "";
      applyDoctorFilters();

      // Mark Custom option as selected
      $("#dateSubmenu .trigger-custom .material-symbols-outlined")
        .first()
        .removeClass("text-light-gray")
        .addClass("!text-dodger-blue");

      // Close everything after date selection
      closeDoctorFilters();
    },
  });

  // 3. Open Calendar when clicking "Custom"
  $(".trigger-custom").on("click", function (e) {
    e.stopPropagation();

    // Position the calendar relative to the Custom menu item
    const topPos = $(this).position().top;

    // Show the calendar
    $("#calendarContainer").removeClass("hidden").css({ top: topPos, display: "" });
  });

  // 4. Status submenu
  $(".trigger-status").on("click", function (e) {
    e.stopPropagation();
    $doctorFilter.find(".submenu").addClass("hidden").css("display", "");
    $("#calendarContainer").addClass("hidden").css("display", "");
    $("#statusSubmenu")
      .removeClass("hidden")
      .css({ top: $(this).position().top, display: "" });
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
    closeDoctorFilters();
  });

  // 6. Handle status selection
  $("#statusSubmenu > div").on("click", function (e) {
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

    activeStatusFilter = String($(this).data("status") || "").toLowerCase();
    applyDoctorFilters();

    // Close all dropdowns
    closeDoctorFilters();
  });

  // 7. Global Close
  $(document).on("click.doctorFilters", function (event) {
    if ($(event.target).closest(".doctor-filter").length) return;
    closeDoctorFilters();
  });

  // Prevent menu from closing when clicking inside
  $doctorFilter.find(".filterDropdown, .submenu").on("click", function (e) {
    e.stopPropagation();
  });

  // Pagination functionality
  let currentPage = 1;
  let totalPages = 1;
  const itemsPerPage = 8;

  function renderDoctors(page) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const doctorsToShow = filteredDoctors.slice(startIndex, endIndex);

    const doctorCards = doctorsToShow
      .map(
        (doctor) => `
          <div class="border border-cool-slate-gray rounded-lg py-4 shadow-appointments relative flex flex-col items-center gap-4 cursor-pointer doctorCard" data-id="${doctor.id}">
            <img 
              src="${doctor.image || "/static/images/coolen-Smith.jpg"}"
              onerror="this.onerror=null; this.src='/static/images/coolen-Smith.jpg';"
              alt="Doctor Image"
              class="w-[104px] h-[104px] rounded-full object-cover shadow-doctor">
            <div class="flex flex-col">
              <span class="font-semibold text-sm">${doctor.name}</span>
              <span class="font-normal text-sm text-spanish-gray">${doctor.phone || "No phone number"}</span>
            </div>
            <span class="font-semibold text-sm text-primary-blue">${doctor.specialty}</span>
            
            <div class="bg-soft-peach-cream rounded-tr-full rounded-br-full absolute left-0 top-8 flex items-center gap-1.5 justify-center p-2.5">
              <span class="material-symbols-outlined material-filled text-warm-apricot-orange">star</span>
              <span class="text-warm-apricot-orange font-semibold text-sm">${doctor.rating}</span>
            </div>
          </div>
        `,
      )
      .join("");

    $("#doctorGrid").html(doctorCards);
  }

  function renderPagination() {
    totalPages = Math.ceil(filteredDoctors.length / itemsPerPage) || 1;
    let pageButtons = "";
    for (let i = 1; i <= totalPages; i++) {
      const activeClass =
        i === currentPage ? "bg-primary-blue text-white " : "bg-gray-200 ";
      pageButtons += `<button class="w-8 h-8 cursor-pointer rounded-lg font-medium transition-all ${activeClass} page-btn" data-page="${i}">${i}</button>`;
    }
    $("#pageNumbers").html(pageButtons);

    // Update Previous/Next button states
    $("#prevBtn").prop("disabled", currentPage === 1);
    $("#nextBtn").prop("disabled", currentPage === totalPages);
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      renderDoctors(currentPage);
      renderPagination();
      $("html, body").animate({ scrollTop: 0 }, 300);
    }
  }

  // Event handlers
  $("#prevBtn").on("click", function () {
    goToPage(currentPage - 1);
  });

  $("#nextBtn").on("click", function () {
    goToPage(currentPage + 1);
  });

  $(document).on("click", ".page-btn", function () {
    const page = parseInt($(this).data("page"));
    goToPage(page);
  });

  function loadHospitalDoctors() {
    $.ajax({
      url: "/staff/hospital/doctors/list/",
      type: "GET",
      dataType: "json",

      success: function (res) {
        console.log("Doctors list response:", res);

        if (res.success) {
          allDoctors = Array.isArray(res.doctors) ? res.doctors : [];
          filteredDoctors = allDoctors.slice();

          console.log("Doctors loaded from database:", allDoctors);

          currentPage = 1;
          applyDoctorFilters();
        } else {
          console.error("Failed to load doctors:", res.error);
          toastr.error(res.error || "Failed to load doctors");
        }
      },

      error: function (xhr) {
        console.error("Doctor list API error:", xhr.status, xhr.responseText);
        toastr.error("Unable to load doctors");
      },
    });
  }

  // Initial render
  window.refreshHospitalDoctorsList = loadHospitalDoctors;
  loadHospitalDoctors();

  function applyDoctorFilters() {
    const query = $('input[placeholder="Search by name or categories"]')
      .val()
      .trim()
      .toLowerCase();
    const cutoff = activeDateFilter
      ? new Date(Date.now() - activeDateFilter * 86400000)
      : null;
    filteredDoctors = allDoctors.filter((doctor) => {
      const matchesQuery =
        !query ||
        doctor.name.toLowerCase().includes(query) ||
        (doctor.specialty || "").toLowerCase().includes(query);
      const createdAt = doctor.created_at ? new Date(doctor.created_at) : null;
      const matchesDate = activeCustomDate
        ? createdAt &&
          createdAt.getFullYear() === activeCustomDate.getFullYear() &&
          createdAt.getMonth() === activeCustomDate.getMonth() &&
          createdAt.getDate() === activeCustomDate.getDate()
        : !cutoff || !createdAt || createdAt >= cutoff;
      const matchesStatus =
        !activeStatusFilter ||
        (doctor.attendance_status || "").toLowerCase() === activeStatusFilter;
      return matchesQuery && matchesDate && matchesStatus;
    });
    currentPage = 1;
    renderDoctors(currentPage);
    renderPagination();
  }

  $('input[placeholder="Search by name or categories"]').on(
    "input",
    applyDoctorFilters,
  );
  $("#dateSubmenu > div")
    .not(".trigger-custom")
    .on("click", function () {
      activeCustomDate = null;
      const selectedFilter = $(this).text().trim();
      activeDateFilter = selectedFilter === "Week" ? 7 : selectedFilter === "Month" ? 30 : 365;
      applyDoctorFilters();
    });

  $(".popup-btn").on("click", function () {
    let popupId = $(this).data("popup");

    if ($(this).hasClass("addDoctorBtn")) {
      clearAddDoctorForm();
    }

    $("." + popupId)
      .removeClass("hidden")
      .addClass("flex");
  });

  // Cancel the add/edit form and discard any unsaved changes.
  $(document).on("click", ".cancelBtn", function () {
    $(".addDoctorPopup").addClass("hidden").removeClass("flex");
    clearAddDoctorForm();
  });

  // Close popup
  $(".close-popup").on("click", function () {
    let popupId = $(this).data("popup");
    $(this)
      .closest("." + popupId)
      .addClass("hidden")
      .removeClass("flex");
  });

  $(document).on("click", ".doctorCard", function () {
    $(".docInfoPopup").removeClass("hidden").addClass("flex");
  });

  $(document).on("click", ".closeInfoPopup", function () {
    $(".docInfoPopup").addClass("hidden").removeClass("flex");
  });

  $(".historyBtn").on("click", function () {
    $(".docInfoPopup").addClass("hidden");
    $(".attendancePopup").removeClass("hidden");
  });

  $(".closeAttendance").on("click", function () {
    $(".docInfoPopup").removeClass("hidden");
    $(".attendancePopup").addClass("hidden");
  });

  // Toggle dropdown
  $(".status-btn").on("click", function (e) {
    e.stopPropagation();
    const dropdown = $(this).siblings(".status-dropdown");
    const arrow = $(this).find(".material-symbols-outlined");

    dropdown.toggleClass("hidden");

    // Rotate arrow
    if (dropdown.hasClass("hidden")) {
      arrow.css("transform", "rotate(0deg)");
    } else {
      arrow.css("transform", "rotate(180deg)");
    }
  });

  // Handle dropdown item selection
  $(".dropdown-item").on("click", function () {
    const selectedText = $(this).text().trim();
    const button = $(this).closest(".relative").find(".status-btn");
    const statusText = button.find(".status-text");
    const arrow = button.find(".material-symbols-outlined");
    const dropdown = $(this).closest(".status-dropdown");

    // Update button text
    statusText.text(selectedText);

    // Apply styles based on selection using inline styles
    if (selectedText === "Present") {
      button.css({
        "background-color": "#EEF6FF",
        color: "#007BFF",
      });
      arrow.css("color", "#007BFF");
    } else if (selectedText === "Absent") {
      button.css({
        "background-color": "#FBE7E8",
        color: "#B00020",
      });
      arrow.css("color", "#B00020");
    }

    // Hide dropdown and reset arrow
    dropdown.addClass("hidden");
    arrow.css("transform", "rotate(0deg)");
  });

  // Close dropdown when clicking outside
  $(document).on("click", function (e) {
    if (!$(e.target).closest(".relative").length) {
      $(".status-dropdown").addClass("hidden");
      $(".material-symbols-outlined").css("transform", "rotate(0deg)");
    }
  });
  $(".material-symbols-outlined").css("transition", "transform 0.3s ease");

  // Create a hidden file input
  const fileInput = $("<input>", {
    type: "file",
    accept: "image/*",
    style: "display: none;",
  });

  // Append it to the body
  $("body").append(fileInput);

  function renderUploadPreview(src) {
    $(".upload-image").html(`
      <div class="relative w-full h-full">
        <img src="${src}" alt="Uploaded" class="w-full h-full object-cover rounded-lg">
        <div class="absolute -top-4 right-0 flex gap-1">
          <button type="button" class="btn-reupload text-primary-blue cursor-pointer">
            <span class="material-symbols-outlined !text-sm">refresh</span>
          </button>
          <button type="button" class="btn-remove text-strong-red cursor-pointer">
            <span class="material-symbols-outlined !text-sm">close</span>
          </button>
        </div>
      </div>
    `);

    $(".btn-remove, .btn-reupload").on("click", function (e) {
      e.stopPropagation();
    });
    $(".btn-remove").on("click", resetUploadDiv);
    $(".btn-reupload").on("click", function () {
      fileInput.click();
    });
  }

  window.showDoctorUploadPreview = renderUploadPreview;
  window.doctorFileInput = fileInput;

  // Handle click on upload div
  $(".upload-image").on("click", function () {
    fileInput.click();
  });

  // Handle file selection
  fileInput.on("change", function (e) {
    const file = e.target.files[0];

    if (file) {
      // Validate if it's an image
      if (!file.type.match("image.*")) {
        alert("Please select an image file");
        return;
      }

      // Create a FileReader to preview the image
      const reader = new FileReader();

      reader.onload = function (event) {
        renderUploadPreview(event.target.result);
      };

      reader.readAsDataURL(file);
    }
  });

  // Function to reset upload div to original state
  function resetUploadDiv() {
    $(".upload-image").html(`
            <span class="material-symbols-outlined text-primary-blue text-!6xl">upload</span>
        `);
    fileInput.val(""); // Clear the file input
  }

  window.resetDoctorUpload = resetUploadDiv;

  $(document).ready(function () {
    // Toggle dropdown on button click
    $(".dropdown-btn").on("click", function (e) {
      e.stopPropagation();

      const $dropdown = $(this).siblings(".dropdown");
      const $arrow = $(this);

      // Close other dropdowns
      $(".dropdown").not($dropdown).addClass("hidden");
      $(".dropdown-btn").not($arrow).css("transform", "rotate(0deg)");

      // Toggle current dropdown
      $dropdown.toggleClass("hidden");

      // Toggle arrow rotation
      if ($dropdown.hasClass("hidden")) {
        $arrow.css("transform", "rotate(0deg)");
      } else {
        $arrow.css("transform", "rotate(180deg)");
      }
    });

    // Handle dropdown item selection
    $(".dropdown-item").on("click", function () {
      const selectedText = $(this).text();
      const $dropdownContainer = $(this).closest(".relative");
      const $dropdownText = $dropdownContainer.find(".dropdown-text");
      const $dropdown = $(this).closest(".dropdown");
      const $arrow = $dropdownContainer.find(".dropdown-btn");

      // Update the dropdown text
      $dropdownText.text(selectedText);

      // Close dropdown
      $dropdown.addClass("hidden");
      $arrow.css("transform", "rotate(0deg)");

      // Optional: Log or handle the selection
      console.log("Selected:", selectedText);
    });

    // Close dropdown when clicking outside
    $(document).on("click", function (e) {
      if (!$(e.target).closest(".relative").length) {
        $(".dropdown").addClass("hidden");
        $(".dropdown-btn").css("transform", "rotate(0deg)");
      }
    });

    // Add transition to all dropdown buttons for smooth rotation
    $(".dropdown-btn").css("transition", "transform 0.3s ease");
  });

  // Initialize value
  let value = 0;

  // Handle increase button click
  $(".increaseBtn").on("click", function () {
    const $counter = $(this).siblings("span");
    value = parseInt($counter.text()) || 0;
    value++;
    $counter.text(value);
  });

  // Handle decrease button click
  $(".decreaseBtn").on("click", function () {
    const $counter = $(this).siblings("span");
    value = parseInt($counter.text()) || 0;

    // Prevent negative values
    if (value > 0) {
      value--;
      $counter.text(value);
    }
  });

  // Configure Toastr options
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: "3000",
  };

  // Handle check icon click
  $('.material-symbols-outlined:contains("check")').on("click", function () {
    const $checkIcon = $(this);
    const $row = $checkIcon.closest(".flex.items-center.justify-between");
    const $timerIcon = $row.find(
      '.material-symbols-outlined:contains("timer")',
    );
    const $statusText = $row.find("span.font-normal.text-sm").last();

    // Toggle selection
    if ($checkIcon.hasClass("text-primary-blue")) {
      // Deselect - change back to gray
      $checkIcon.removeClass("text-primary-blue").addClass("text-light-gray");

      // Reset timer icon and text
      $timerIcon.removeClass("text-primary-blue").addClass("text-light-gray");
      $statusText
        .text("Not Available")
        .removeClass("text-primary-blue")
        .addClass("text-light-gray");

      // Remove time picker if exists
      $row.find(".time-selector").remove();
    } else {
      // Select - change to blue (but keep text as "Not Available")
      $checkIcon.removeClass("text-light-gray").addClass("text-primary-blue");
    }
  });

  // Handle timer icon click
  $('.material-symbols-outlined:contains("timer")').on("click", function () {
    const $timerIcon = $(this);
    const $row = $timerIcon.closest(".flex.items-center.justify-between");
    const $checkIcon = $row.find(
      '.material-symbols-outlined:contains("check")',
    );
    const $statusText = $row.find("span.font-normal.text-sm").last();

    // Check if day is selected
    if (!$checkIcon.hasClass("text-primary-blue")) {
      toastr.error("Please select the day first by clicking the check icon");
      return;
    }

    // Check if time selector already exists
    if ($row.find(".time-selector").length > 0) {
      $row.find(".time-selector").remove();
      return;
    }

    // Create inline time selector
    const existingStart = $row.attr("data-start-time") || "09:00";
    const existingEnd = $row.attr("data-end-time") || "13:00";
    const timeSelectorHTML = `
            <div class="time-selector absolute right-0 top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 w-[300px]">
                <div class="flex flex-col gap-3">
                    <div class="flex items-center gap-2">
                        <label class="text-sm w-[50px]">From:</label>
                        <input type="time" class="time-from border border-gray-300 rounded px-2 py-1 flex-1" value="${existingStart}">
                    </div>
                    <div class="flex items-center gap-2">
                        <label class="text-sm w-[50px]">To:</label>
                        <input type="time" class="time-to border border-gray-300 rounded px-2 py-1 flex-1" value="${existingEnd}">
                    </div>
                    <button class="apply-time-btn bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm">Apply</button>
                </div>
            </div>
        `;

    // Make the parent container relative
    const $container = $row.find(".flex.items-center.gap-10");
    $container.css("position", "relative");
    $container.append(timeSelectorHTML);

    // Handle apply button
    $row.find(".apply-time-btn").on("click", function (e) {
      e.stopPropagation();

      const timeFrom = $row.find(".time-from").val();
      const timeTo = $row.find(".time-to").val();

      if (!timeFrom || !timeTo) {
        toastr.error("Please select both start and end times");
        return;
      }

      // Convert 24h to 12h format
      const formatTime = (time) => {
        const [hours, minutes] = time.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
      };

      const formattedFrom = formatTime(timeFrom);
      const formattedTo = formatTime(timeTo);

      $row.attr("data-start-time", timeFrom).attr("data-end-time", timeTo);

      // Update the status text with time
      $statusText
        .text(`${formattedFrom} - ${formattedTo}`)
        .removeClass("text-light-gray")
        .addClass("text-primary-blue");

      // Change timer icon color to blue
      $timerIcon.removeClass("text-light-gray").addClass("text-primary-blue");

      // Remove time selector
      $row.find(".time-selector").remove();
    });
  });

  // Close time selector when clicking outside
  $(document).on("click", function (e) {
    if (
      !$(e.target).closest(
        '.time-selector, .material-symbols-outlined:contains("timer")',
      ).length
    ) {
      $(".time-selector").remove();
    }
  });

  // Handle Register button click with validation
  $(".registerDocBtn").on("click", function (e) {
    e.preventDefault();

    // Validate form before sending AJAX request
    if (!validateAddDoctorForm()) {
      return false;
    }

    const $popup = $(".addDoctorPopup");

    const name = $popup.find('input[type="text"]').eq(0).val().trim();
    const phone = $popup.find('input[type="number"]').eq(0).val().trim();
    const gender = $popup.find('input[type="text"]').eq(1).val().trim();
    const age = $popup.find('input[type="number"]').eq(1).val().trim();
    const specialty = $popup.find(".dropdown-text").eq(0).text().trim();
    const education = $popup.find(".dropdown-text").eq(1).text().trim();
    const experience =
      parseInt($popup.find(".increaseBtn").siblings("span").text()) || 0;
    const homeVisitFee = $popup.find('[data-fee="home_visit"]').val().trim();
    const hospitalVisitFee = $popup
      .find('[data-fee="hospital_visit"]')
      .val()
      .trim();

    const availability = [];

    $popup
      .find(
        ".bg-white.border.border-blue-haze.p-4 > .flex.items-center.justify-between",
      )
      .each(function () {
        const $row = $(this);
        const day = $row.find("span.font-normal.text-sm").eq(0).text().trim();
        const statusText = $row
          .find(".flex.items-center.gap-10 span.font-normal.text-sm")
          .text()
          .trim();

        if (statusText && statusText !== "Not Available") {
          const parts = statusText.split(" - ");
          availability.push({
            day: day,
            start_time: parts[0] || "",
            end_time: parts[1] || "",
          });
        }
      });

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("gender", gender);
    formData.append("age", age);
    formData.append("specialty", specialty);
    formData.append("education", education);
    formData.append("experience", experience);
    formData.append("home_visit_fee", homeVisitFee);
    formData.append("hospital_visit_fee", hospitalVisitFee);
    formData.append("availability", JSON.stringify(availability));
    const doctorId = $popup.data("doctor-id");
    if (doctorId) formData.append("doctor_id", doctorId);

    const photoFile = fileInput[0].files[0];
    if (photoFile) {
      formData.append("photo", photoFile);
    }

    $.ajax({
      url: "/staff/hospital/doctors/save/",
      method: "POST",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
      },
      data: formData,
      processData: false,
      contentType: false,
      success: function (res) {
        if (res.success) {
          toastr.success(
            doctorId
              ? "Doctor updated successfully!"
              : "Doctor registered successfully!",
          );

          // Reload the canonical list so dates, attendance status and the
          // updated image are all reflected after both add and edit.
          loadHospitalDoctors();

          $(".addDoctorPopup").addClass("hidden").removeClass("flex");
          clearAddDoctorForm();
        } else {
          toastr.error(res.error || "Failed to register doctor");
        }
      },
      error: function (xhr) {
        toastr.error(xhr.responseJSON?.error || "Something went wrong");
      },
    });
  }); // Closes register button click cleanly
}); // THIS CLOSES THE MAIN $(document).ready(function () { CONTEXT CLEANLY

// ==========================================
// GLOBAL EVENT LISTENERS & HELPER FUNCTIONS
// (Keep these outside $(document).ready)
// ==========================================

function formatDoctorFee(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "₹—";
  }
  return `₹${value}`;
}

function getTodayAttendance(records) {
  const today = new Date();
  const isoDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  const record = (records || []).find((item) => item.date === isoDate);
  return record ? record.status : "";
}

function escapeDoctorHtml(value) {
  return $("<div>").text(value == null ? "" : String(value)).html();
}

function renderAttendanceHistory(records) {
  const $list = $("#attendance-history-list");
  if (!$list.length) return;

  const rows = (records || []).map((item) => {
    const status = String(item.status || "").toLowerCase();
    const statusClass = status === "absent" ? "text-strong-red" : "text-dodger-blue";
    const dateParts = String(item.date || "").split("-");
    const displayDate = dateParts.length === 3
      ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
      : item.date || "-";
    return `<div class="flex items-center justify-between">
      <span class="font-normal text-sm">${escapeDoctorHtml(displayDate)}</span>
      <span class="font-normal text-sm ${statusClass}">${escapeDoctorHtml(item.status)}</span>
    </div>`;
  }).join("");

  $list.html(rows || '<p class="text-sm text-spanish-gray">No attendance recorded.</p>');
}

$(document).on("click", ".status-dropdown .dropdown-item", function () {
  if (!selectedDoctor) return;

  const status = $(this).text().trim();
  const previousStatus = getTodayAttendance(selectedDoctor.attendance);

  $.ajax({
    url: "/staff/hospital/doctors/attendance/",
    type: "POST",
    headers: { "X-CSRFToken": getCookie("csrftoken") },
    data: { doctor_id: selectedDoctor.id, status: status },
    success: function (response) {
      if (!response.success) {
        toastr.error(response.error || "Unable to update attendance");
        $(".status-text").text(previousStatus || "Select");
        return;
      }
      selectedDoctor.attendance = response.attendance || [];
      $(".status-text").text(response.status);
      renderAttendanceHistory(selectedDoctor.attendance);
      if (window.refreshHospitalDoctorsList) window.refreshHospitalDoctorsList();
      toastr.success(`Marked ${response.status.toLowerCase()}`);
    },
    error: function (xhr) {
      $(".status-text").text(previousStatus || "Select");
      toastr.error(xhr.responseJSON?.error || "Unable to update attendance");
    },
  });
});

$(document).on("click", ".doctorCard", function () {
  const doctorId = $(this).data("id");

  $.ajax({
    url: `/staff/hospital/doctors/${doctorId}/`,
    type: "GET",
    success: function (response) {
      if (!response.success) {
        toastr.error(response.message);
        return;
      }

      const d = response.doctor;
      selectedDoctor = d;

      $("#doctor-image").attr(
        "src",
        d.image || "/static/images/coolen-Smith.jpg",
      );
      $("#doctor-name").text(d.name);
      $("#doctor-gender").text(d.gender || "-");
      $("#doctor-age").text(d.age || "-");
      $("#doctor-phone").text(d.phone || "-");
      $("#doctor-specialty").text(d.specialty || "-");
      $("#doctor-speciality").text(d.specialty || "-");
      $("#doctor-education").text(d.education || "-");
      $("#doctor-experience").text(`${d.experience || 0} Years`);
      $("#doctor-home-fee").text(formatDoctorFee(d.home_visit_fee));
      $("#doctor-hospital-fee").text(formatDoctorFee(d.hospital_visit_fee));
      $(".status-text").text(getTodayAttendance(d.attendance) || "Select");
      $("#attendance-doctor-name").text(d.name || "-");
      $("#attendance-doctor-specialty").text(d.specialty || "-");
      renderAttendanceHistory(d.attendance);

      let availabilityHtml = "";
      (d.availability || []).forEach((item) => {
        availabilityHtml += `
          <div class="flex items-center justify-between">
              <span class="font-normal text-sm">${item.day}</span>
              <span class="font-normal text-sm text-dodger-blue">
                  ${item.start_time} to ${item.end_time}
              </span>
          </div>
        `;
      });

      $("#doctor-availability").html(
        availabilityHtml || "<p>No availability configured</p>",
      );
      $("#doctor-id").text(d.id);
      $(".docInfoPopup").removeClass("hidden").addClass("flex");
    },
  });
});

$(document).on("click", ".share-doctor", async function () {
  if (!selectedDoctor) return;
  const d = selectedDoctor;
  const text = `${d.name}\nSpecialty: ${d.specialty || "-"}\nPhone: ${d.phone || "-"}`;
  try {
    if (navigator.share)
      await navigator.share({ title: "Doctor Information", text });
    else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      toastr.success("Doctor information copied to clipboard");
    } else window.prompt("Copy doctor information", text);
  } catch (error) {
    if (error.name !== "AbortError")
      toastr.error("Unable to share doctor information");
  }
});

$(document).on("click", ".edit-doctor", function () {
  if (!selectedDoctor) return;
  const d = selectedDoctor;
  const $popup = $(".addDoctorPopup");
  $popup.data("doctor-id", d.id);
  $popup
    .find('input[type="text"]')
    .eq(0)
    .val((d.name || "").replace(/^Dr\.\s*/, ""));
  $popup
    .find('input[type="number"]')
    .eq(0)
    .val((d.phone || "").replace(/\D/g, ""));
  $popup
    .find('input[type="text"]')
    .eq(1)
    .val(d.gender || "");
  $popup
    .find('input[type="number"]')
    .eq(1)
    .val(d.age || "");
  $popup
    .find(".dropdown-text")
    .eq(0)
    .text(d.specialty || "Select");
  $popup
    .find(".dropdown-text")
    .eq(1)
    .text(d.education || "Select");
  $popup
    .find(".increaseBtn")
    .siblings("span")
    .text(d.experience || 0);
  $popup.find('[data-fee="home_visit"]').val(d.home_visit_fee || "");
  $popup
    .find('[data-fee="hospital_visit"]')
    .val(d.hospital_visit_fee || "");
  if (window.doctorFileInput) window.doctorFileInput.val("");
  if (d.image && window.showDoctorUploadPreview) {
    window.showDoctorUploadPreview(d.image);
  } else if (window.resetDoctorUpload) {
    window.resetDoctorUpload();
  }
  restoreDoctorAvailability($popup, d.availability || []);
  $popup.removeClass("hidden").addClass("flex");
  $(".docInfoPopup").addClass("hidden").removeClass("flex");
});

function clearAddDoctorForm() {
  const $popup = $(".addDoctorPopup");
  $popup.removeData("doctor-id");

  // Clear all text and number inputs
  $popup.find('input[type="text"], input[type="number"]').val("");

  // Reset drop-downs to a default placeholder text
  $popup.find(".dropdown-text").text("Select...");

  // Reset experience counter text back to 0
  $popup.find(".increaseBtn").siblings("span").text("0");

  $popup.find('[data-fee="home_visit"], [data-fee="hospital_visit"]').val("");
  restoreDoctorAvailability($popup, []);

  // Reset file input preview if your custom framework relies on it
  if (window.resetDoctorUpload) {
    window.resetDoctorUpload();
  }
}

function restoreDoctorAvailability($popup, availability) {
  const availabilityByDay = {};
  (availability || []).forEach((item) => {
    availabilityByDay[String(item.day || "").toLowerCase()] = item;
  });

  const $rows = $popup
    .find(".bg-white.border.border-blue-haze.p-4")
    .first()
    .children(".flex.items-center.justify-between");
  $rows.each(function () {
    const $row = $(this);
    const day = $row.find("span.font-normal.text-sm").first().text().trim();
    const item = availabilityByDay[day.toLowerCase()];
    const $check = $row.find('.material-symbols-outlined:contains("check")');
    const $timer = $row.find('.material-symbols-outlined:contains("timer")');
    const $status = $row.find(".flex.items-center.gap-10 span.font-normal.text-sm");
    $row.find(".time-selector").remove();

    if (item) {
      $row.attr("data-start-time", normalizeDoctorTime(item.start_time, "09:00"));
      $row.attr("data-end-time", normalizeDoctorTime(item.end_time, "13:00"));
      $check.removeClass("text-light-gray").addClass("text-primary-blue");
      $timer.removeClass("text-light-gray").addClass("text-primary-blue");
      $status
        .text(`${item.start_time || ""} - ${item.end_time || ""}`)
        .removeClass("text-light-gray")
        .addClass("text-primary-blue");
    } else {
      $row.removeAttr("data-start-time data-end-time");
      $check.removeClass("text-primary-blue").addClass("text-light-gray");
      $timer.removeClass("text-primary-blue").addClass("text-light-gray");
      $status
        .text("Not Available")
        .removeClass("text-primary-blue")
        .addClass("text-light-gray");
    }
  });
}

function normalizeDoctorTime(value, fallback) {
  const raw = String(value || "").trim();
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return fallback;
  let hours = Number(match[1]);
  if (match[3].toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (match[3].toUpperCase() === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

// ==========================================
// ADD DOCTOR FORM VALIDATION
// ==========================================
function validateAddDoctorForm() {
  const $popup = $(".addDoctorPopup");

  // Get fields
  const $name = $popup.find('input[type="text"]').eq(0);
  const $phone = $popup.find('input[type="number"]').eq(0);
  const $gender = $popup.find('input[type="text"]').eq(1);
  const $age = $popup.find('input[type="number"]').eq(1);

  const $dropdowns = $popup.find(".dropdown-text");
  const $specialty = $dropdowns.eq(0);
  const $education = $dropdowns.eq(1);

  // Fees are text inputs with decimal input mode in the template.
  const $fees = $popup.find('input[inputmode="decimal"]');
  const $homeVisitFee = $fees.eq(0);
  const $hospitalVisitFee = $fees.eq(1);

  // Remove previous errors
  $popup.find(".validation-error").remove();

  // Remove previous error border
  $popup.find(".validation-error-field").removeClass("validation-error-field");

  // ==========================================
  // Helper function
  // ==========================================
  function showError($field, message) {
    $field.addClass("validation-error-field");

    const $error = $('<span class="validation-error"></span>');
    $error.text(message);

    $field.after($error);
  }

  // ==========================================
  // NAME
  // Alphabets + spaces only
  // ==========================================
  const name = $name.val().trim();

  if (name === "") {
    showError($name, "Name is required.");
    return false;
  } else if (!/^[A-Za-z\s]+$/.test(name)) {
    showError($name, "Name should contain alphabets only.");
    return false;
  } else if (name.length < 2) {
    showError($name, "Name must contain at least 2 characters.");
    return false;
  }

  // ==========================================
  // PHONE
  // Exactly 10 digits
  // ==========================================
  const phone = $phone.val().trim();

  if (phone === "") {
    showError($phone, "Phone number is required.");
    return false;
  } else if (!/^\d+$/.test(phone)) {
    showError($phone, "Phone number should contain digits only.");
    return false;
  } else if (phone.length !== 10) {
    showError($phone, "Phone number must contain exactly 10 digits.");
    return false;
  }

  // ==========================================
  // GENDER
  // Alphabets + spaces only
  // ==========================================
  const gender = $gender.val().trim();

  if (gender === "") {
    showError($gender, "Gender is required.");
    return false;
  } else if (!/^[A-Za-z\s]+$/.test(gender)) {
    showError($gender, "Gender should contain alphabets only.");
    return false;
  }

  // ==========================================
  // AGE
  // Digits only
  // Age between 18 and 100
  // ==========================================
  const age = $age.val().trim();

  if (age === "") {
    showError($age, "Age is required.");
    return false;
  } else if (!/^\d+$/.test(age)) {
    showError($age, "Age should contain digits only.");
    return false;
  } else if (parseInt(age) < 18 || parseInt(age) > 100) {
    showError($age, "Age must be between 18 and 100.");
    return false;
  }

  // ==========================================
  // SPECIALTY
  // ==========================================
  const specialty = $specialty.text().trim();

  if (specialty === "" || specialty === "Select" || specialty === "Select...") {
    showError($specialty, "Please select specialty.");
    return false;
  }

  // ==========================================
  // EDUCATION
  // ==========================================
  const education = $education.text().trim();

  if (education === "" || education === "Select" || education === "Select...") {
    showError($education, "Please select education.");
    return false;
  }

  // ==========================================
  // HOME VISIT FEE
  // ==========================================
  const homeFee = ($homeVisitFee.val() || "").trim();

  if (homeFee !== "") {
    if (!/^\d+(\.\d{1,2})?$/.test(homeFee)) {
      showError($homeVisitFee, "Enter a valid fee.");
      return false;
    }
  }

  // ==========================================
  // HOSPITAL VISIT FEE
  // ==========================================
  const hospitalFee = ($hospitalVisitFee.val() || "").trim();

  if (hospitalFee !== "") {
    if (!/^\d+(\.\d{1,2})?$/.test(hospitalFee)) {
      showError($hospitalVisitFee, "Enter a valid fee.");
      return false;
    }
  }

  return true;
}

// ==========================================
// LIVE INPUT VALIDATION
// ==========================================

$(document).on("input", ".addDoctorPopup input[type='text']", function () {
  const $input = $(this);

  // Name and Gender - alphabets + spaces only
  const index = $input.index(".addDoctorPopup input[type='text']");

  if (index === 0 || index === 1) {
    $input.val($input.val().replace(/[^A-Za-z\s]/g, ""));
  }
});

// Phone - digits only, maximum 10
$(document).on("input", ".addDoctorPopup input[type='number']", function () {
  const $popup = $(".addDoctorPopup");
  const $numberInputs = $popup.find('input[type="number"]');

  const index = $numberInputs.index(this);

  // Phone
  if (index === 0) {
    $(this).val($(this).val().replace(/\D/g, "").slice(0, 10));
  }

  // Age
  else if (index === 1) {
    $(this).val($(this).val().replace(/\D/g, "").slice(0, 3));
  }

  // Fees
  else if (index === 2 || index === 3) {
    let value = $(this).val();

    // Only numbers and decimal
    value = value.replace(/[^0-9.]/g, "");

    // Only one decimal point
    const parts = value.split(".");

    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }

    // Maximum 2 decimal places
    if (value.includes(".")) {
      const decimalParts = value.split(".");

      value = decimalParts[0] + "." + decimalParts[1].substring(0, 2);
    }

    $(this).val(value);
  }
});
