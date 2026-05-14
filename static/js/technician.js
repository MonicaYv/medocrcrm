console.log("🚀 JS LOADED");

function getCSRFToken() {
    let cookieValue = null;

    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();

            if (cookie.startsWith("csrftoken=")) {
                cookieValue = cookie.substring("csrftoken=".length);
                break;
            }
        }
    }

    return cookieValue;
}

// 👇 ADD HERE (TOP LEVEL)
function getCSRFToken() {
  let match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : "";
}


function resetUploadDiv() {
  $(".upload-image").html(`
    <span class="material-symbols-outlined text-primary-blue text-6xl">
      upload
    </span>
  `);

  $("#fileInput").val("");
}


$(document).ready(function () {
  loadTechnicians();


$("#searchTechnician").on("keyup", function () {

  let searchValue = $(this).val().toLowerCase();

  let filteredData = allTechnicians.filter(function (t) {

    return (
      t.full_name.toLowerCase().includes(searchValue) ||
      t.specialization.toLowerCase().includes(searchValue)
    );

  });

  renderTechnicians(filteredData);

});

function resetUploadDiv() {
    $("#uploadDiv").html("");   // adjust ID if different
    $("#uploadPreview").attr("src", "");
    $("#fileInput").val("");
}




// Define all doctors data
  // const allDoctors = [
  //   {
  //     name: "Mr. Rakesh Verma",
  //     phone: "+91 7568412234",
  //     specialty: "Lab Technician",
  //     rating: "4.2",
  //     image: "/static/images/coolen-Smith.jpg",
  //   },
  //   {
  //     name: "Mr. Coolen Smith",
  //     phone: "+91 7568412235",
  //     specialty: "Biochemistry Technician",
  //     rating: "4.5",
  //     image: "/static/images/doctor-2.jpg",
  //   },
  //   {
  //     name: "Mr. Coolen Smith",
  //     phone: "+91 7568412236",
  //     specialty: "Cytology Technician",
  //     rating: "4.3",
  //     image: "/static/images/doctor-3.jpg",
  //   },
  //   {
  //     name: "Mr. Emily Brown",
  //     phone: "+91 7568412237",
  //     specialty: "Pathology Technician",
  //     rating: "4.4",
  //     image: "/static/images/doctor-4.jpg",
  //   },
  //   {
  //     name: "Mr. James Wilson",
  //     phone: "+91 7568412238",
  //     specialty: "Lab Technician",
  //     rating: "4.1",
  //     image: "/static/images/doctor-5.jpg",
  //   },
  //   {
  //     name: "Mr. Lisa Anderson",
  //     phone: "+91 7568412239",
  //     specialty: "Lab Technician",
  //     rating: "4.6",
  //     image: "/static/images/doctor-6.jpg",
  //   },
  //   {
  //     name: "Mr. Robert Taylor",
  //     phone: "+91 7568412240",
  //     specialty: "Lab Technician",
  //     rating: "4.2",
  //     image: "/static/images/doctor-2.jpg",
  //   },
  //   {
  //     name: "Mr. Maria Garcia",
  //     phone: "+91 7568412241",
  //     specialty: "Lab Technician",
  //     rating: "4.7",
  //     image: "/static/images/doctor-7.jpg",
  //   },
  //   // Page 2
  //   {
  //     name: "Mr. David Martinez",
  //     phone: "+91 7568412242",
  //     specialty: "Lab Technician",
  //     rating: "4.3",
  //     image: "/static/images/doctor-8.jpg",
  //   },
  //   {
  //     name: "Mr. Jennifer Lee",
  //     phone: "+91 7568412243",
  //     specialty: "Lab Technician",
  //     rating: "4.4",
  //     image: "/static/images/coolen-Smith.jpg",
  //   },
  //   {
  //     name: "Mr. William Harris",
  //     phone: "+91 7568412244",
  //     specialty: "Lab Technician",
  //     rating: "4.5",
  //     image: "/static/images/doctor-2.jpg",
  //   },
  //   {
  //     name: "Mr. Amanda White",
  //     phone: "+91 7568412245",
  //     specialty: "Lab Technician",
  //     rating: "4.2",
  //     image: "/static/images/doctor-3.jpg",
  //   },
  //   {
  //     name: "Mr. Christopher Moore",
  //     phone: "+91 7568412246",
  //     specialty: "Lab Technician",
  //     rating: "4.6",
  //     image: "/static/images/doctor-4.jpg",
  //   },
  //   {
  //     name: "Mr. Patricia Clark",
  //     phone: "+91 7568412247",
  //     specialty: "Lab Technician",
  //     rating: "4.3",
  //     image: "/static/images/doctor-5.jpg",
  //   },
  //   {
  //     name: "Mr. Daniel Lewis",
  //     phone: "+91 7568412248",
  //     specialty: "Lab Technician",
  //     rating: "4.4",
  //     image: "/static/images/doctor-6.jpg",
  //   },
  //   {
  //     name: "Mr. Nancy Walker",
  //     phone: "+91 7568412249",
  //     specialty: "Lab Technician",
  //     rating: "4.5",
  //     image: "/static/images/doctor-2.jpg",
  //   },

  //   {
  //     name: "Mr. Daniel Lewis",
  //     phone: "+91 7568412248",
  //     specialty: "Lab Technician",
  //     rating: "4.4",
  //     image: "/static/images/doctor-6.jpg",
  //   },
  //   {
  //     name: "Mr. Nancy Walker",
  //     phone: "+91 7568412249",
  //     specialty: "Lab Technician",
  //     rating: "4.5",
  //     image: "/static/images/doctor-2.jpg",
  //   },
  // ];

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
  const totalPages = 3;
  const itemsPerPage = 8;

  function renderDoctors(page) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const doctorsToShow = allDoctors.slice(startIndex, endIndex);

    const doctorCards = doctorsToShow
      .map(
        (doctor) => `
          <div class="border border-cool-slate-gray rounded-lg py-4 shadow-appointments relative flex flex-col items-center gap-4 cursor-pointer doctorCard">
            <img src="${doctor.image}" alt="Doctor Image" class="w-[104px] h-[104px] rounded-full object-cover shadow-doctor">
            <div class="flex flex-col">
              <span class="font-semibold text-sm">${doctor.name}</span>
              <span class="font-normal text-sm text-spanish-gray">${doctor.phone}</span>
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
      // renderDoctors(currentPage);
      // renderPagination();
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

  // Initial render
  // renderDoctors(currentPage);
  // renderPagination();

  $(".popup-btn").on("click", function () {
    let popupId = $(this).data("popup");
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

        // // Handle remove button
        // $(".btn-remove").on("click", function () {
        //   // resetUploadDiv();
        // });

        // Handle reupload button
        $(".btn-reupload").on("click", function () {
          fileInput.click();
        });
      };

      reader.readAsDataURL(file);
    }
  });

 
 
  
  // // Function to reset upload div to original state
  // function resetUploadDiv() {
  //   $(".upload-image").html(`
  //           <span class="material-symbols-outlined text-primary-blue text-!6xl">upload</span>
  //       `);
  //   fileInput.val(""); // Clear the file input
  // }

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

 $(".increaseBtn").on("click", function () {
  let val = parseInt($("#expValue").text()) || 0;
  val++;
  $("#expValue").text(val);
  $("#experience").val(val); // ✅ sync hidden input
});

$(".decreaseBtn").on("click", function () {
  let val = parseInt($("#expValue").text()) || 0;
  if (val > 0) val--;
  $("#expValue").text(val);
  $("#experience").val(val); // ✅ sync hidden input
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
  // $(".registerDocBtn").on("click", function (e) {
  //   e.preventDefault();

  //   // Validate the form
  //   if (validateAddDoctorForm()) {
  //     // Show success toaster
  //     toastr.success("Doctor registered successfully!");

  //     // Close the popup
  //     $(".addDoctorPopup").addClass("hidden").removeClass("flex");

  //     // Clear all form fields after a short delay
  //     setTimeout(function () {
  //       clearAddDoctorForm();
  //     }, 300);
  //   }
  // });
// $(document).on("click", ".registerDocBtn", function () {
//   alert("CLICK WORKING");

// });
let allTechnicians = [];


// ✅ ADD THIS HERE
function renderTechnicians(data) {

  let html = "";

  data.forEach(function (t) {

    let imgSrc = "/static/images/dummy.jpg";

    if (t.image && t.image !== "/media/dummy.jpg") {
      imgSrc = t.image;
    }

    html += `
      <div class="border border-cool-slate-gray rounded-lg py-4 shadow-appointments flex flex-col items-center gap-3">

        <img src="${imgSrc}"
             class="w-[90px] h-[90px] rounded-full object-cover">

        <div class="text-center">

          <div class="font-semibold">
            ${t.full_name}
          </div>

          <div class="text-sm text-gray-500">
            ${t.phone_number}
          </div>

        </div>

        <div class="text-blue-600 text-sm font-medium">
          ${t.specialization}
        </div>

        <div class="text-orange-500 text-sm">
          ${t.experience_years} yrs exp
        </div>

      </div>
    `;
  });

  $("#doctorGrid").html(html);
}

// ✅ YOUR OLD FUNCTION
function loadTechnicians() {

  $.ajax({
    url: "/staff/get-technicians/",
    type: "GET",

    success: function (data) {

      allTechnicians = data;

      console.log("REAL DATA:", data);

      if (!Array.isArray(data)) {
        return;
      }

      // ✅ SHOW TECHNICIANS
      renderTechnicians(data);
    },

    error: function (err) {
      console.log("ERROR:", err);
    }

  });

}


// $(document).ready(function () {
//   // loadTechnicians();
// });

  $(document).on("click", ".registerDocBtn", function (e) {
    e.preventDefault();

    console.log("✅ BUTTON CLICKED");

    if (!validateAddDoctorForm()) return;

    // let formData = new FormData($("#technicianForm")[0]);
    let form = document.getElementById("technicianForm");
    if (!form) {
      toastr.error("Form not found");
      return;
    }
    let formData = new FormData(form);

    // ✅ ADD HERE
    let file = fileInput[0].files[0];
    if (file) {
       formData.append("profile_image", file);
    }

    formData.set("experience", $("#experience").val() || 0);
    let specialization = $("#specialization").val();
    let education = $("#education").val();

    console.log("specialization:", specialization);
    console.log("education:", education);

    if (!specialization) {
      toastr.error("Select specialization");
    return;
  }

   if (!education) {
    toastr.error("Select education");
    return;
  }

  
  formData.set("specialization", specialization);
  formData.set("education", education);

    $.ajax({
      url: ADD_TECHNICIAN_URL,
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      headers: {
        "X-CSRFToken": getCSRFToken()
      },

      success: function (resp) {
        console.log("✅ SUCCESS:", resp);

        if (resp.success) {
          toastr.success("Technician Registered Successfully");

          $(".addDoctorPopup").addClass("hidden").removeClass("flex");

           loadTechnicians();
        } else {
          toastr.error(resp.message || "Save failed");
        }
      },

      error: function (xhr) {
        console.log("❌ ERROR:", xhr.responseText);
        toastr.error("Server error");
      }
    });

  });

});

  // Handle Cancel button click
  $(".cancelBtn").on("click", function (e) {
    e.preventDefault();

    // Clear the form
    clearAddDoctorForm();

    // Close the popup
    $(".addDoctorPopup").addClass("hidden").removeClass("flex");
  });

  // Validation function
  function validateAddDoctorForm() {
  const name = $('input[name="full_name"]').val().trim();
  const phone = $('input[name="phone_number"]').val().trim();
  const gender = $('input[name="gender"]').val().trim();
  const age = $('input[name="age"]').val().trim();
  const specialty = $('select[name="specialization"]').val();
  const education = $('input[name="education"]').val();
  const experience = parseInt($("#experience").val());

  if (!name) {
    toastr.error("Enter name");
    return false;
  }

  if (!phone || phone.length !== 10) {
    toastr.error("Enter valid 10-digit phone");
    return false;
  }

  if (!gender) {
    toastr.error("Enter gender");
    return false;
  }

  if (!age || age < 18 || age > 100) {
    toastr.error("Enter valid age (18–100)");
    return false;
  }

  if (!specialty) {
    toastr.error("Select specialty");
    return false;
  }

  if (!education) {
    toastr.error("Enter education");
    return false;
  }

  if (experience < 0){
    toastr.error("Add experience");
    return false;
  }

  return true;
}
  // // Validation function
  // function validateAddDoctorForm() {
  //   const $popup = $(".addDoctorPopup");

  //   // Check if image is uploaded
  //   const hasImage = $popup.find(".upload-image img").length > 0;
  //   if (!hasImage) {
  //     toastr.error("Please upload a doctor photo");
  //     return false;
  //   }

  //   // Get all input values
  //   const name = $popup.find('input[type="text"]').eq(0).val().trim();
  //   const phone = $popup.find('input[type="number"]').eq(0).val().trim();
  //   const gender = $popup.find('input[type="text"]').eq(1).val().trim();
  //   const age = $popup.find('input[type="number"]').eq(1).val().trim();

  //   // Validate Name
  //   if (!name) {
  //     toastr.error("Please enter doctor name");
  //     $popup.find('input[type="text"]').eq(0).focus();
  //     return false;
  //   }

  //   // Validate Phone Number
  //   if (!phone) {
  //     toastr.error("Please enter phone number");
  //     $popup.find('input[type="number"]').eq(0).focus();
  //     return false;
  //   }

  //   // Validate phone number format (10 digits)
  //   if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
  //     toastr.error("Please enter a valid 10-digit phone number");
  //     $popup.find('input[type="number"]').eq(0).focus();
  //     return false;
  //   }

  //   // Validate Gender
  //   if (!gender) {
  //     toastr.error("Please enter gender");
  //     $popup.find('input[type="text"]').eq(1).focus();
  //     return false;
  //   }

  //   // Validate Age
  //   if (!age) {
  //     toastr.error("Please enter age");
  //     $popup.find('input[type="number"]').eq(1).focus();
  //     return false;
  //   }

  //   // Validate age range
  //   const ageNum = parseInt(age);
  //   if (ageNum < 18 || ageNum > 100) {
  //     toastr.error("Please enter a valid age between 18 and 100");
  //     $popup.find('input[type="number"]').eq(1).focus();
  //     return false;
  //   }

  //   // Validate Specialty dropdown
  //   const specialty = $popup.find(".dropdown-text").eq(0).text().trim();
  //   if (specialty === "Select") {
  //     toastr.error("Please select a specialty");
  //     return false;
  //   }

  //   // Validate Education dropdown
  //   const education = $popup.find(".dropdown-text").eq(1).text().trim();
  //   if (education === "Select") {
  //     toastr.error("Please select education qualification");
  //     return false;
  //   }

  //   // Validate Experience
  //   const experience = parseInt(
  //     $popup.find(".increaseBtn").siblings("span").text()
  //   );
  //   if (experience === 0) {
  //     toastr.error("Please add years of experience");
  //     return false;
  //   }

  //   // Validate Fees
  //   const homeVisitFee = $popup.find('input[type="number"]').eq(2).val().trim();
  //   const hospitalVisitFee = $popup
  //     .find('input[type="number"]')
  //     .eq(3)
  //     .val()
  //     .trim();

  //   if (!homeVisitFee || parseFloat(homeVisitFee) <= 0) {
  //     toastr.error("Please enter home visit fee");
  //     $popup.find('input[type="number"]').eq(2).focus();
  //     return false;
  //   }

  //   if (!hospitalVisitFee || parseFloat(hospitalVisitFee) <= 0) {
  //     toastr.error("Please enter hospital visit fee");
  //     $popup.find('input[type="number"]').eq(3).focus();
  //     return false;
  //   }

  //   // Validate Availability - at least one day must be selected with time
  //   let hasAvailability = false;
  //   let selectedDaysWithoutTime = [];

  //   $popup
  //     .find(
  //       ".bg-white.border.border-blue-haze.p-4 > .flex.items-center.justify-between"
  //     )
  //     .each(function () {
  //       const $row = $(this);
  //       const dayName = $row
  //         .find("span.font-normal.text-sm")
  //         .eq(0)
  //         .text()
  //         .trim();
  //       const $checkIcon = $row.find(
  //         '.material-symbols-outlined:contains("check")'
  //       );
  //       const $timerIcon = $row.find(
  //         '.material-symbols-oriented:contains("timer")'
  //       );
  //       const $statusText = $row
  //         .find(".flex.items-center.gap-10 span.font-normal.text-sm")
  //         .text()
  //         .trim();

  //       // Check if day is selected (check icon is blue)
  //       if ($checkIcon.hasClass("text-primary-blue")) {
  //         // Check if time is also set (status text is not "Not Available")
  //         if ($statusText !== "Not Available") {
  //           hasAvailability = true;
  //         } else {
  //           selectedDaysWithoutTime.push(dayName);
  //         }
  //       }
  //     });

  //   // Check if any day is selected but time not set
  //   if (selectedDaysWithoutTime.length > 0) {
  //     toastr.warning(
  //       `Please set time for: ${selectedDaysWithoutTime.join(", ")}`
  //     );
  //     return false;
  //   }

  //   // Check if at least one day with time is set
  //   if (!hasAvailability) {
  //     toastr.error("Please select at least one day and set availability time");
  //     return false;
  //   }

  //   // All validations passed
  //   return true;
  // }

  // Function to clear all form fields in Add Doctor popup
  function clearAddDoctorForm() {
    // Reset image upload
    // resetUploadDiv();

    // Clear all text inputs
    $('.addDoctorPopup input[type="text"]').val("");
    $('.addDoctorPopup input[type="number"]').val("");

    // Reset dropdowns
    $(".addDoctorPopup .dropdown-text").text("Select");
    $(".addDoctorPopup .dropdown").addClass("hidden");
    $(".addDoctorPopup .dropdown-btn").css("transform", "rotate(0deg)");

    // Reset experience counter
    $(".addDoctorPopup .increaseBtn").siblings("span").text("0");

    // Reset all check icons to gray
    $('.addDoctorPopup .material-symbols-outlined:contains("check")')
      .removeClass("text-primary-blue")
      .addClass("text-light-gray");

    // Reset all timer icons to gray
    $('.addDoctorPopup .material-symbols-outlined:contains("timer")')
      .removeClass("text-primary-blue")
      .addClass("text-light-gray");

    // Reset all availability text to "Not Available"
    $(".addDoctorPopup .flex.items-center.gap-10 span.font-normal.text-sm")
      .text("Not Available")
      .removeClass("text-primary-blue")
      .addClass("text-light-gray");

    // Remove any open time selectors
    $(".addDoctorPopup .time-selector").remove();
  }
$("#technicianForm").submit(function (e) {
    e.preventDefault(); // stop page reload

    let formData = new FormData(this);

    formData.append("full_name", full_name);
    formData.append("phone_number", phone_number);
    formData.append("gender", gender);
    formData.append("age", age);
    formData.append("education", education);
    formData.append("experience", experience);
    formData.append("specialization", specialization);

    formData.append(
       "profile_image",
      $("#profile_image")[0].files[0]
    );


    $.ajax({
    url: "/staff/add-technician/",
    type: "POST",
    data: formData,
    processData: false,
    contentType: false,

    headers: {
       "X-CSRFToken": getCSRFToken()
    },

    success: function(res){
        console.log(res);
    }
});

});