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

$(document).ready(function () {
  // Define all doctors data
  let allDoctors = [];

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

  // Pagination functionality
  let currentPage = 1;
  let totalPages = 1;
  const itemsPerPage = 8;

  function renderDoctors(page) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const doctorsToShow = allDoctors.slice(startIndex, endIndex);

    const doctorCards = doctorsToShow
      .map(
        (doctor) => `
          <div class="border border-cool-slate-gray rounded-lg py-4 shadow-appointments relative flex flex-col items-center gap-4 cursor-pointer doctorCard">
            <img 
              src="${doctor.image || '/static/images/coolen-Smith.jpg'}"
              onerror="this.onerror=null; this.src='/static/images/coolen-Smith.jpg';"
              alt="Doctor Image"
              class="w-[104px] h-[104px] rounded-full object-cover shadow-doctor">
            <div class="flex flex-col">
              <span class="font-semibold text-sm">${doctor.name}</span>
              <span class="font-normal text-sm text-spanish-gray">${doctor.phone || 'No phone number'}</span>
            </div>
            <span class="font-semibold text-sm text-primary-blue">${doctor.specialty}</span>
            
            <div class="bg-soft-peach-cream rounded-tr-full rounded-br-full absolute left-0 top-8 flex items-center gap-1.5 justify-center p-2.5">
              <span class="material-symbols-outlined material-filled text-warm-apricot-orange">star</span>
              <span class="text-warm-apricot-orange font-semibold text-sm">${doctor.rating}</span>
            </div>
          </div>
        `
      )
      .join("");

    $("#doctorGrid").html(doctorCards);
  }

  function renderPagination() {
    totalPages = Math.ceil(allDoctors.length / itemsPerPage) || 1;
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
  $.getJSON("/staff/hospital/doctors/list/", function (res) {
    if (res.success) {
      allDoctors = res.doctors;
      currentPage = 1;

      renderDoctors(currentPage);
      renderPagination();
    }
  });
}

  // Initial render
  loadHospitalDoctors();


 $(".popup-btn").on("click", function () {
  let popupId = $(this).data("popup");

  // if (popupId === "addDoctorPopup") {
  //   clearAddDoctorForm();
  // }

  $("." + popupId)
    .removeClass("hidden")
    .addClass("flex");
});

  // Close popup
  $(".close-popup").on("click", function () {
    let popupId = $(this).data("popup");
    $(this)
      .closest("." + popupId)
      .addClass("hidden")
      .removeClass("flex");
  });

  $(".doctorCard").on("click", function () {
    $(".docInfoPopup").removeClass("hidden");
  });

  $(".closeInfoPopup").on("click", function () {
    $(".docInfoPopup").addClass("hidden");
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
        // Display the image with remove and reupload buttons
        $(".upload-image").html(`
                    <div class="relative w-full h-full">
                        <img src="${event.target.result}" alt="Uploaded" class="w-full h-full object-cover rounded-lg">
                        <div class="absolute -top-4 right-0 flex gap-1">
                            <button class="btn-reupload  text-primary-blue cursor-pointer">
                                <span class="material-symbols-outlined !text-sm">refresh</span>
                            </button>
                             <button class="btn-remove  text-strong-red cursor-pointer">
                                <span class="material-symbols-outlined !text-sm">close</span>
                            </button>
                        </div>
                    </div>
                `);

        // Prevent click event from bubbling to parent
        $(".btn-remove, .btn-reupload").on("click", function (e) {
          e.stopPropagation();
        });

        // Handle remove button
        $(".btn-remove").on("click", function () {
          resetUploadDiv();
        });

        // Handle reupload button
        $(".btn-reupload").on("click", function () {
          fileInput.click();
        });
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
      '.material-symbols-outlined:contains("timer")'
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
      '.material-symbols-outlined:contains("check")'
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
    const timeSelectorHTML = `
            <div class="time-selector absolute right-0 top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 w-[300px]">
                <div class="flex flex-col gap-3">
                    <div class="flex items-center gap-2">
                        <label class="text-sm w-[50px]">From:</label>
                        <input type="time" class="time-from border border-gray-300 rounded px-2 py-1 flex-1" value="09:00">
                    </div>
                    <div class="flex items-center gap-2">
                        <label class="text-sm w-[50px]">To:</label>
                        <input type="time" class="time-to border border-gray-300 rounded px-2 py-1 flex-1" value="13:00">
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
        '.time-selector, .material-symbols-outlined:contains("timer")'
      ).length
    ) {
      $(".time-selector").remove();
    }
  });

// Handle Register button click with validation
$(".registerDocBtn").on("click", function (e) {
  e.preventDefault();
  // if (!validateAddDoctorForm()) return;

  const $popup = $(".addDoctorPopup");

  const name = $popup.find('input[type="text"]').eq(0).val().trim();
  const phone = $popup.find('input[type="number"]').eq(0).val().trim();
  const gender = $popup.find('input[type="text"]').eq(1).val().trim();
  const age = $popup.find('input[type="number"]').eq(1).val().trim();
  const specialty = $popup.find(".dropdown-text").eq(0).text().trim();
  const education = $popup.find(".dropdown-text").eq(1).text().trim();
  const experience = parseInt($popup.find(".increaseBtn").siblings("span").text()) || 0;

  const availability = [];

  $popup.find(".bg-white.border.border-blue-haze.p-4 > .flex.items-center.justify-between").each(function () {
    const $row = $(this);
    const day = $row.find("span.font-normal.text-sm").eq(0).text().trim();
    const statusText = $row.find(".flex.items-center.gap-10 span.font-normal.text-sm").text().trim();

    if (statusText && statusText !== "Not Available") {
      const parts = statusText.split(" - ");
      availability.push({
        day: day,
        start_time: parts[0] || "",
        end_time: parts[1] || ""
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
  formData.append("availability", JSON.stringify(availability));

  const photoFile = fileInput[0].files[0];
  if (photoFile) {
    formData.append("photo", photoFile);
  }

  $.ajax({
    url: "/staff/hospital/doctors/save/",
    method: "POST",
    headers: {
      "X-CSRFToken": getCookie("csrftoken")
    },
    data: formData,
    processData: false,
    contentType: false,

    success: function (res) {
      if (res.success) {
        toastr.success("Doctor registered successfully!");
        loadHospitalDoctors();

        $(".addDoctorPopup").addClass("hidden").removeClass("flex");
        clearAddDoctorForm();
      } else {
        toastr.error(res.error || "Failed to register doctor");
      }
    },

    error: function (xhr) {
      toastr.error(xhr.responseJSON?.error || "Something went wrong");
    }
  });
});
});
