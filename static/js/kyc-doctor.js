// GLOBAL VARIABLES
let currentStep = 1;
const totalSteps = 3;

//page load
$(document).ready(function () {
  const countryId = $("#doc_country").val();
  if (countryId) {
    loadStates(countryId, "Maharashtra");
  }

  const countryIdAdmin = $("#doc_personal_country").val();
  if (countryIdAdmin) {
    loadStatesAdmin(countryIdAdmin, "Maharashtra");
  }

  // Initialize stepper styling on load
  updateStepTab(1, "active");
  updateStepTab(2, "locked");
  updateStepTab(3, "locked");

  // Custom Country Code Dropdown toggle
  $("#doc-country-dropdown-btn").on("click", function (e) {
    e.stopPropagation();
    $("#doc_country_dropdown_list").toggleClass("hidden");
  });

  // Close dropdown when clicking outside
  $(document).on("click", function () {
    $("#doc_country_dropdown_list").addClass("hidden");
  });

  // Select country option
  $(".doc_country_option").on("click", function () {
    const code = $(this).data("code");
    $("#selected-code").text(code);
    $("#doc_phone_country_code").val(code);
    $("#doc_country_dropdown_list").addClass("hidden");
  });

  // Numeric constraint for phone input field
  $("#doc_phone").on("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "");
  });

  // Custom Country Code Dropdown toggle for Facility (Step 3)
  $("#doc_country_code").on("click", function (e) {
    e.stopPropagation();
    $("#doc_country_code_list").toggleClass("hidden");
  });

  // Select country option for Facility
  $(".doc_country_option").on("click", function () {
    const code = $(this).data("code");
    $("#facility-selected-code").text(code);
    $("#doc_country_code_val").val(code);
    $("#doc_country_code_list").addClass("hidden");
  });

  // Numeric constraint for Facility phone input field
  $("#facility_phone").on("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "");
  });

  // Toggle custom dropdowns
  $(document).on("click", ".custom-dropdown-btn", function (e) {
    e.stopPropagation();
    const container = $(this).closest(".custom-dropdown-container");

    // Close other open dropdowns
    $(".custom-dropdown-container")
      .not(container)
      .find(".custom-dropdown-list")
      .addClass("hidden");
    $(".custom-dropdown-container")
      .not(container)
      .find(".material-symbols-outlined")
      .removeClass("rotate-180");

    container.find(".custom-dropdown-list").toggleClass("hidden");
    $(this).find(".material-symbols-outlined").toggleClass("rotate-180");
  });

  // Select option item
  $(document).on("click", ".dropdown-option-item", function () {
    const option = $(this);
    const value = option.data("value");
    const text = option.text();
    const container = option.closest(".custom-dropdown-container");
    const btn = container.find(".custom-dropdown-btn");
    const input = container.find(".custom-dropdown-input");

    input.val(value);
    btn.find(".selected-value-text").text(text);
    btn
      .removeClass("text-kyc-light-gray")
      .addClass("text-blue-charcoal font-medium");

    container.find(".custom-dropdown-list").addClass("hidden");
    btn.find(".material-symbols-outlined").removeClass("rotate-180");
  });

  // Close dropdowns on clicking outside
  $(document).on("click", function () {
    $(".custom-dropdown-list").addClass("hidden");
    $(".custom-dropdown-btn .material-symbols-outlined").removeClass(
      "rotate-180",
    );
  });
  // Document Type Selection Handler for Step 2
  $(".doc-selector-card").on("click", function () {
    const card = $(this);
    const docType = card.data("doc");

    // Check the radio input
    card.find('input[type="radio"]').prop("checked", true);

    // Reset styling on all cards
    $(".doc-selector-card")
      .removeClass("border-{{ border }}")
      .addClass("border-slate-200");
    $(".doc-selector-card")
      .find(".w-12")
      .removeClass("bg-{{ border }} text-white")
      .addClass("bg-slate-100 text-slate-400");
    $(".doc-selector-card")
      .find(".doc-radio-indicator")
      .removeClass("border-{{ border }}")
      .addClass("border-slate-300");
    $(".doc-selector-card")
      .find(".doc-radio-indicator div")
      .removeClass("bg-{{ border }}")
      .addClass("bg-transparent");

    // Apply active styles to selected card
    card.removeClass("border-slate-200").addClass("border-{{ border }}");
    card
      .find(".w-12")
      .removeClass("bg-slate-100 text-slate-400")
      .addClass("bg-{{ border }} text-white");
    card
      .find(".doc-radio-indicator")
      .removeClass("border-slate-300")
      .addClass("border-{{ border }}");
    card
      .find(".doc-radio-indicator div")
      .removeClass("bg-transparent")
      .addClass("bg-{{ border }}");

    // Dynamic translations based on selected doc type
    let docLabel = "";
    let inlineDocName = "";
    let capitalizeDocName = "";
    let showBackSide = true;

    if (docType === "aadhaar") {
      docLabel = "Upload Aadhaar Card";
      inlineDocName = "Aadhaar";
      capitalizeDocName = "Aadhar";
    } else if (docType === "pan") {
      docLabel = "Upload PAN Card";
      inlineDocName = "PAN Card";
      capitalizeDocName = "PAN";
      showBackSide = false;
    } else if (docType === "license") {
      docLabel = "Upload Driving Licence";
      inlineDocName = "Driving Licence";
      capitalizeDocName = "Licence";
    } else if (docType === "passport") {
      docLabel = "Upload Passport";
      inlineDocName = "Passport";
      capitalizeDocName = "Passport";
    }

    // Update DOM texts
    $("#upload-section-title").text(docLabel);
    $(".doc-name-inline").text(inlineDocName);
    $(".doc-name-capitalize").text(capitalizeDocName);

    // Update input labels
    $('label[for="id_full_name"]').html(
      `Full Name (as per <span class="doc-name-capitalize">${capitalizeDocName}</span>)`,
    );
    $('label[for="id_doc_number"]').html(
      `<span class="doc-name-capitalize">${capitalizeDocName}</span> Number`,
    );

    // Adjust input placeholders
    $("#id_full_name").attr(
      "placeholder",
      `Enter full name as per ${inlineDocName}`,
    );
    $("#id_doc_number").attr("placeholder", `Enter ${inlineDocName} number`);

    // Toggle back side upload section visibility
    if (showBackSide) {
      $("#back-side-upload-wrapper").removeClass("hidden");
    } else {
      $("#back-side-upload-wrapper").addClass("hidden");
    }
  });

  // File Upload feedback animation
  $('input[type="file"]').on("change", function () {
    const input = $(this);
    const parent = input.parent();
    const fileName = this.files.length > 0 ? this.files[0].name : "";

    if (fileName) {
      // Change style to selected state
      parent
        .removeClass("border-dashed border-slate-200 border-blue-400")
        .addClass("border-solid border-green-500 bg-green-50/10");
      parent
        .find(".material-symbols-outlined")
        .text("task")
        .removeClass("text-slate-400 text-{{ border }}")
        .addClass("text-green-600");
      parent
        .find(".text-slate-700, .font-bold")
        .text("File selected successfully!")
        .removeClass("text-slate-700")
        .addClass("text-green-800");
      parent
        .find(".text-slate-400, .text-[10px]")
        .text(fileName)
        .removeClass("text-slate-400")
        .addClass("text-green-600 font-semibold");
    }
  });

  // Step 4 File Upload & Preview -------------------------
  let activeFileInput = null;
  let activePdfUrl = null;

  // Preview Document
  // Supports JPG / JPEG / PNG / PDF
  function previewDocument(file) {
    // Remove previous PDF object URL
    if (activePdfUrl) {
      URL.revokeObjectURL(activePdfUrl);
      activePdfUrl = null;
    }

    // Reset preview
    $("#preview-image-element").addClass("hidden").attr("src", "");

    $("#preview-pdf-element").addClass("hidden").attr("src", "");

    $("#preview-placeholder").addClass("hidden");

    // No file
    if (!file) {
      $("#preview-placeholder").removeClass("hidden");

      return;
    }

    // IMAGE PREVIEW
    if (
      file.type === "image/jpeg" ||
      file.type === "image/jpg" ||
      file.type === "image/png"
    ) {
      const reader = new FileReader();

      reader.onload = function (e) {
        $("#preview-image-element")
          .attr("src", e.target.result)
          .removeClass("hidden");
      };

      reader.readAsDataURL(file);

      return;
    }

    // PDF PREVIEW
    if (file.type === "application/pdf") {
      activePdfUrl = URL.createObjectURL(file);

      $("#preview-pdf-element").attr("src", activePdfUrl).removeClass("hidden");

      return;
    }

    // Unsupported File
    $("#preview-placeholder").removeClass("hidden");

    toastr.error("Only JPG, JPEG, PNG and PDF files are supported.");
  }

  // File Upload Handler
  $(
    ".doc_lic_upload, " +
      ".doc_aadhar_upload, " +
      ".doc_pan_upload, " +
      ".doc_logo_upload, " +
      ".doc_image_upload",
  ).on("change", function () {
    const input = $(this);

    const file = this.files && this.files.length > 0 ? this.files[0] : null;

    // No file
    if (!file) {
      return;
    }

    // Allowed File Types
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      toastr.error("Only JPG, JPEG, PNG and PDF files are allowed.");
      this.value = "";
      return;
    }

    // File Size - 5 MB
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      toastr.error("File size must not exceed 5 MB.");
      this.value = "";
      return;
    }

    // Update File Name Box
    const targetSelector = input.attr("data-target");

    if (targetSelector) {
      const targetBox = $(targetSelector);

      if (targetBox.length) {
        targetBox
          .text(file.name)
          .removeClass("border-blue-400 " + "text-blue-500 " + "bg-blue-50/10")
          .addClass("border-green-500 " + "text-green-600 " + "bg-green-50/10");
      }
    }

    // Update Virus Scan Badge
    const badgeSelector = input.attr("data-badge");

    if (badgeSelector) {
      const badge = $(badgeSelector);

      if (badge.length) {
        badge
          .removeClass("bg-red-50 " + "text-red-600 " + "border-red-200")
          .addClass("bg-green-50 " + "text-green-600 " + "border-green-200");

        badge.find(".material-symbols-outlined").text("check");

        badge.find("span:last-child").text("Virus scan");
      }
    }

    // Update Upload Button
    const uploadButton = input.closest("button");

    if (uploadButton.length) {
      uploadButton
        .removeClass("border-slate-200 " + "text-slate-500 " + "text-slate-400")
        .addClass("border-green-500 " + "text-green-600");

      uploadButton
        .find(".material-symbols-outlined")
        .text("task")
        .removeClass("text-slate-500 " + "text-slate-400")
        .addClass("text-green-600");
    }

    // Update Preview If This Input Is Active
    if (activeFileInput === this) {
      previewDocument(file);
    }
  });

  // Eye / View Button
  $(
    ".doc_lic_view, " +
      ".doc_aadhar_view, " +
      ".doc_pan_view, " +
      ".doc_logo_view, " +
      ".doc_image_view",
  ).on("click", function () {
    const btn = $(this);

    // Get title
    const docTitle = btn.attr("data-title");

    // Get input selector
    const selector = btn.attr("data-input");

    // Find corresponding file input
    const fileInput = selector ? $(selector)[0] : null;

    // Safety check
    if (!fileInput) {
      console.error("File input not found:", selector);
      toastr.error("Unable to find the selected document input.");
      return;
    }

    // Store active input
    activeFileInput = fileInput;

    // Set preview title
    $("#doc-preview-modal-title").text(docTitle || "Document Preview");

    // Check File
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];

      previewDocument(file);
    } else {
      // No uploaded file
      previewDocument(null);
    }

    // Show Preview Panel
    $("#step4-main-content").addClass("hidden");

    $("#step4-preview-content").removeClass("hidden");
  });

  // Close / Save Preview
  $("#close-preview-btn, #preview-save-btn").on("click", function () {
    // Clear active input
    activeFileInput = null;

    // Remove PDF object URL
    if (activePdfUrl) {
      URL.revokeObjectURL(activePdfUrl);

      activePdfUrl = null;
    }

    // Reset title
    $("#doc-preview-modal-title").text("Select a Document to View");

    // Reset image
    $("#preview-image-element").addClass("hidden").attr("src", "");

    // Reset PDF
    $("#preview-pdf-element").addClass("hidden").attr("src", "");

    // Show placeholder
    $("#preview-placeholder").removeClass("hidden");

    // Hide preview
    $("#step4-preview-content").addClass("hidden");

    // Show document list
    $("#step4-main-content").removeClass("hidden");
  });

  // Replace Button
  $("#preview-replace-btn").on("click", function () {
    if (!activeFileInput) {
      toastr.error("Please select a document first.");

      return;
    }

    $(activeFileInput).trigger("click");
  });

  // Next button click handler (navigates steps or submits)
  $("#doc-next-step-btn").on("click", function () {
    const currentPanel = $(`#step-panel-${currentStep}`);

    let isValid = true;

    currentPanel.find("input[required]").each(function () {
      if (!$(this).val()) {
        isValid = false;

        $(this).addClass(
          "border-red-400 focus:border-red-400 focus:ring-red-400",
        );
      } else {
        $(this).removeClass(
          "border-red-400 focus:border-red-400 focus:ring-red-400",
        );
      }
    });

    if (!isValid) {
      toastr.warning("Please fill out all required fields.");

      return;
    }

    // STEP 1
    if (currentStep === 1) {
      saveDataStep1();
      return;
    }

    // STEP 2
    if (currentStep === 2) {
      saveDataStep2();
      return;
    }

    // STEP 3 - FINAL SUBMIT
    if (currentStep === 3) {
      saveDataStep3();
      return;
    }
  });

  // Previous button click handler
  $("#doc_prev_step_btn").on("click", function () {
    if (currentStep > 1) {
      // Revert current step tab back to LOCKED/INACTIVE state
      updateStepTab(currentStep, "locked");

      $(`#step-panel-${currentStep}`).addClass("hidden");
      currentStep--;

      $(`#step-panel-${currentStep}`)
        .removeClass("hidden")
        .addClass("step-fade-enter");

      setTimeout(() => {
        $(`#step-panel-${currentStep}`)
          .removeClass("step-fade-enter")
          .addClass("step-fade-active");
      }, 50);

      // Revert active tab to ACTIVE state
      updateStepTab(currentStep, "active");

      // Update progress
      updateProgress(currentStep);

      $("#doc-next-btn-text").text("Save & Continue");
    } else {
      // Redirect back to new_kyc page when clicking Back on Step 1
      window.history.back();
    }
  });
});

// Helper to update progress status display
function updateProgress(step) {
  let percentage = Math.round(((step - 1) / (totalSteps - 1)) * 100);

  if (step === totalSteps) {
    percentage = 95;
  }

  $("#status-percentage").text(percentage + "%");
  $("#status-bar-fill").css("width", percentage + "%");

  let lineWidth = 50 * (step - 1);
  $("#stepper-connecting-line").css("width", lineWidth + "%");
}

// Helper to toggle stepper icon and circle borders/colors dynamically
function updateStepTab(stepNum, state) {
  const tab = $(`#step-tab-${stepNum}`);
  const circle = tab.find(".step-kyc-circle");
  const label = tab.find(".step-label");
  const icon = tab.find(".step-kyc-icon");

  // Clear all state classes first to prevent style conflicts
  circle.removeClass(
    "border-kyc-icon bg-kyc-blue text-kyc-icon bg-kyc-green text-white font-bold border-slate-200 bg-slate-50 text-slate-400 font-semibold",
  );
  label.removeClass(
    "text-slate-400 text-green-600 text-slate-800 text-blue-charcoal font-semibold font-bold",
  );

  if (state === "active") {
    // Active Brand Theme Border & Icon
    circle.addClass("border-kyc-icon bg-kyc-blue text-kyc-icon");
    label.addClass("text-blue-charcoal font-bold");

    // Set appropriate icon
    if (stepNum === 1) icon.text("person");
    else if (stepNum === 2) icon.text("badge");
    else if (stepNum === 3) icon.text("local_hospital");
    else icon.text("description");
  } else if (state === "completed") {
    // Completed Green Checkmark
    circle.addClass("bg-kyc-green text-white font-bold");
    label.addClass("text-green-600 font-bold");
    icon.text("check");
  } else if (state === "locked") {
    // Locked Gray Style
    circle.addClass(
      "border-slate-200 bg-slate-50 text-slate-400 font-semibold",
    );
    label.addClass("text-slate-400 font-semibold");
    icon.text("lock");
  }
}

//step 1 ---------------------------------------------
// get state on click country
// Country changed
$("#doc_country").on("change", function () {
  const countryId = $(this).val();

  loadStates(countryId);
});

// State changed
$("#doc_state").on("change", function () {
  const stateId = $(this).val();

  loadCities(stateId);
});

function loadStates(countryId, preferredStateName = "Maharashtra") {
  if (!countryId) {
    $("#doc_state").html("");
    $("#doc_city").html("");
    return;
  }

  $.ajax({
    url: "/user/doctor-profile-verification/get-states/",
    type: "GET",
    data: {
      country_id: countryId,
    },

    success: function (response) {
      if (response.success) {
        let options = "";
        let selectedStateId = null;

        $.each(response.states, function (index, state) {
          let selected = "";

          // Select Maharashtra if available
          if (
            preferredStateName &&
            state.name.trim().toLowerCase() ===
              preferredStateName.trim().toLowerCase()
          ) {
            selected = "selected";
            selectedStateId = state.id;
          }

          options += `
                        <option value="${state.id}" ${selected}>
                            ${state.name}
                        </option>
                    `;
        });

        $("#doc_state").html(options);

        // Automatically load cities of selected state
        if (selectedStateId) {
          loadCities(selectedStateId, "Mumbai");
        } else {
          // If Maharashtra not found,
          // load cities for the first state
          const firstStateId = $("#doc_state option:first").val();

          if (firstStateId) {
            loadCities(firstStateId);
          }
        }
      } else {
        $("#doc_state").html("");
        $("#doc_city").html("");
      }
    },

    error: function (xhr) {
      console.log("State AJAX Error:", xhr.responseText);

      $("#doc_state").html("");
      $("#doc_city").html("");
    },
  });
}

function loadCities(stateId, preferredCityName = null) {
  if (!stateId) {
    $("#doc_city").html("");
    return;
  }

  $.ajax({
    url: "/user/doctor-profile-verification/get-cities/",
    type: "GET",
    data: {
      state_id: stateId,
    },

    success: function (response) {
      let options = "";
      let selectedCityFound = false;

      if (response.success) {
        $.each(response.cities, function (index, city) {
          let selected = "";

          if (
            preferredCityName &&
            city.name.trim().toLowerCase() ===
              preferredCityName.trim().toLowerCase()
          ) {
            selected = "selected";
            selectedCityFound = true;
          }

          options += `
                        <option value="${city.id}" ${selected}>
                            ${city.name}
                        </option>
                    `;
        });
      }

      $("#doc_city").html(options);
    },

    error: function (xhr) {
      console.log("City AJAX Error:", xhr.responseText);

      $("#doc_city").html("");
    },
  });
}

//verify otp
$("#doc_otp").on("input", function () {
  let otp = $(this).val().replace(/\D/g, "");

  // Allow only 6 digits
  otp = otp.substring(0, 6);

  $(this).val(otp);

  // Always hide both first
  $("#doc_verified").addClass("hidden").removeClass("flex");

  $("#doc_not_verified").addClass("hidden").removeClass("flex");

  // Reset verification
  $("#phone_otp_verified").val("0");

  // If empty, keep both hidden
  if (otp.length === 0) {
    return;
  }

  // Correct OTP
  if (otp === "123456") {
    $("#doc_verified").removeClass("hidden").addClass("flex");

    $("#phone_otp_verified").val("1");
  }
  // Any other entered OTP
  else {
    $("#doc_not_verified").removeClass("hidden").addClass("flex");

    $("#phone_otp_verified").val("0");
  }
});

//resend
$(".doc_resend_otp").on("click", function (e) {
  e.preventDefault();

  // Reset OTP verification
  $("#doc_otp").val("");
  $("#phone_otp_verified").val("0");

  $("#doc_verified").addClass("hidden").removeClass("flex");

  $("#doc_not_verified").addClass("hidden").removeClass("flex");

  // Show toast
  toastr.success("OTP sent successfully");
});

//alternative phn
$("#doc_alt_phn").on("input", function () {
  this.value = this.value.replace(/\D/g, "").substring(0, 10);
});

//pincode
$("#doc_pincode").on("input", function () {
  this.value = this.value.replace(/\D/g, "").substring(0, 6);
});

//name
$("#doc_name").on("input", function () {
  this.value = this.value.replace(/[^A-Za-z ]/g, "");
});

//doc_owner_name
$("#doc_owner_name").on("input", function () {
  this.value = this.value.replace(/[^A-Za-z ]/g, "");
});

//save step-1
function saveDataStep1() {
  const doctorName = $("#doc_name").val().trim();
  const ownerName = $("#doc_owner_name").val().trim();
  const clinicName = $("#doc_clinic").val().trim();
  const email = $("#doc_email").val().trim();
  const address = $("#doc_address").val().trim();
  const pincode = $("#doc_pincode").val().trim();
  const alt_no = $("#doc_alt_phn").val().trim();

  $(
    "#doc_name, #doc_owner_name, #doc_clinic, #doc_email, #doc_address, #doc_pincode, #doc_alt_phn",
  ).removeClass("border-red-400 focus:border-red-400 focus:ring-red-400");

  // validations
  if (!doctorName) {
    $("#doc_name").addClass("border-red-400");
    toastr.warning("Hospital name is required.");
    $("#doc_name").focus();
    return;
  }

  if (!ownerName) {
    $("#doc_owner_name").addClass("border-red-400");
    toastr.warning("Owner name is required.");
    $("#doc_owner_name").focus();
    return;
  }

  const doctorNameRegex = /^[A-Za-z ]+$/;

  if (!doctorNameRegex.test(doctorName)) {
    $("#doc_name").addClass("border-red-400");
    toastr.warning("Hospital name should contain alphabets only.");
    $("#doc_name").focus();
    return;
  }

  const ownerNameRegex = /^[A-Za-z ]+$/;

  if (!ownerNameRegex.test(ownerName)) {
    $("#doc_owner_name").addClass("border-red-400");
    toastr.warning("Owner name should contain alphabets only.");
    $("#doc_owner_name").focus();
    return;
  }

  if (!email) {
    $("#doc_email").addClass("border-red-400");
    toastr.warning("Email address is required.");
    $("#doc_email").focus();
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    $("#doc_email").addClass("border-red-400");
    toastr.warning("Please enter a valid email address.");
    $("#doc_email").focus();
    return;
  }

  if (!address) {
    $("#doc_address").addClass("border-red-400");
    toastr.warning("Address is required.");
    $("#doc_address").focus();
    return;
  }

  if (!pincode) {
    $("#doc_pincode").addClass("border-red-400");
    toastr.warning("Pincode is required.");
    $("#doc_pincode").focus();
    return;
  }

  const pincodeRegex = /^\d{6}$/;

  if (!pincodeRegex.test(pincode)) {
    $("#doc_pincode").addClass("border-red-400");
    toastr.warning("Pincode must be exactly 6 digits.");
    $("#doc_pincode").focus();
    return;
  }

  const altPhonRegex = /^\d{10}$/;

  if (!altPhonRegex.test(alt_no)) {
    $("#doc_alt_phn").addClass("border-red-400");
    toastr.warning("Contact no must be exactly 10 digits.");
    $("#doc_alt_phn").focus();
    return;
  }

  // FormData
  const formData = new FormData();

  formData.append("step", "1");

  formData.append("doc_name", doctorName);
  formData.append("doc_owner_name", ownerName);
  formData.append("doc_email", email);
  formData.append("doc_country_code_val", $("#doc_country_code_val").val());
  formData.append("doc_phn", $("#doc_phn").val());
  formData.append("doc_address", address);
  formData.append("doc_country", $("#doc_country").val());
  formData.append("doc_state", $("#doc_state").val());
  formData.append("doc_city", $("#doc_city").val());
  formData.append("doc_pincode", pincode);
  formData.append("doc_alt_phn", alt_no);
  formData.append("doc_gender_value", $("#doc_gender_value").val());
  formData.append("doc_clinic", $("#doc_clinic").val());
  formData.append("doc_age", $("#doc_age").val());
  formData.append("doc_speciality_value", $("#doc_speciality_value").val());
  formData.append("doc_education_value", $("#doc_education_value").val());
  formData.append("doc_experience_value", $("#doc_experience_value").val());
  formData.append("doc_home_visit_value", $("#doc_home_visit_value").val());
  formData.append("doc_referral_code", $("#doc_referral_code").val());
  formData.append("clinic_timing_from", $("#clinic_timing_from").val());
  formData.append("clinic_timing_to", $("#clinic_timing_to").val());
  formData.append("doc_otp", $("#doc_otp").val());

  // CSRF
  formData.append(
    "csrfmiddlewaretoken",
    $("input[name='csrfmiddlewaretoken']").val(),
  );

  // AJAX
  $.ajax({
    url: "/user/doctor-profile-verification/save/",
    type: "POST",
    data: formData,
    processData: false,
    contentType: false,

    beforeSend: function () {
      $("#doc-next-step-btn").prop("disabled", true);
    },

    success: function (response) {
      console.log("Step 1 response:", response);

      if (response.success === true) {
        toastr.success(
          response.message || "Hospital details saved successfully.",
        );

        // Hide Step 1
        $("#step-panel-1").addClass("hidden");

        // Move to Step 2
        currentStep = 2;

        // Show Step 2
        $("#step-panel-2").removeClass("hidden").addClass("step-fade-enter");

        setTimeout(function () {
          $("#step-panel-2")
            .removeClass("step-fade-enter")
            .addClass("step-fade-active");
        }, 50);

        updateStepTab(1, "completed");
        updateStepTab(2, "active");
        updateProgress(2);

        $("#doc-next-btn-text").text("Save & Continue");

        console.log("Step 2 loaded");
      } else {
        toastr.error(response.message || "Unable to save hospital details.");
      }
    },

    error: function (xhr) {
      console.log("Save Step 1 Error:", xhr.responseText);

      let message = "Something went wrong while saving hospital details.";

      if (xhr.responseJSON && xhr.responseJSON.message) {
        message = xhr.responseJSON.message;
      }

      toastr.error(message);
    },

    complete: function () {
      $("#doc-next-step-btn").prop("disabled", false);

      if (currentStep !== totalSteps) {
        $("#doc-next-btn-text").text("Save & Continue");
      }
    },
  });
}

//step - 2 -------------------------------------------
$("#doc_personal_country").on("change", function () {
  const countryIdAdmin = $(this).val();

  loadStatesAdmin(countryIdAdmin);
});

$("#doc_personal_state").on("change", function () {
  const stateId = $(this).val();

  loadCitiesAdmin(stateId);
});

function loadStatesAdmin(countryIdAdmin, preferredStateName = "Maharashtra") {
  if (!countryIdAdmin) {
    $("#doc_personal_state").html("");
    $("#doc_personal_city").html("");
    return;
  }

  $.ajax({
    url: "/user/doctor-profile-verification/get-states/",
    type: "GET",
    data: {
      country_id: countryIdAdmin,
    },

    success: function (response) {
      if (response.success) {
        let options = "";
        let selectedStateId = null;

        $.each(response.states, function (index, state) {
          let selected = "";

          // Select Maharashtra if available
          if (
            preferredStateName &&
            state.name.trim().toLowerCase() ===
              preferredStateName.trim().toLowerCase()
          ) {
            selected = "selected";
            selectedStateId = state.id;
          }

          options += `
                        <option value="${state.id}" ${selected}>
                            ${state.name}
                        </option>
                    `;
        });

        $("#doc_personal_state").html(options);

        // Automatically load cities of selected state
        if (selectedStateId) {
          loadCitiesAdmin(selectedStateId, "Mumbai");
        } else {
          // If Maharashtra not found,
          // load cities for the first state
          const firstStateId = $("#doc_personal_state option:first").val();

          if (firstStateId) {
            loadCitiesAdmin(firstStateId);
          }
        }
      } else {
        $("#doc_personal_state").html("");
        $("#doc_personal_city").html("");
      }
    },

    error: function (xhr) {
      console.log("State AJAX Error:", xhr.responseText);

      $("#doc_personal_state").html("");
      $("#doc_personal_city").html("");
    },
  });
}

function loadCitiesAdmin(stateId, preferredCityName = null) {
  if (!stateId) {
    $("#doc_personal_city").html("");
    return;
  }

  $.ajax({
    url: "/user/doctor-profile-verification/get-cities/",
    type: "GET",
    data: {
      state_id: stateId,
    },

    success: function (response) {
      let options = "";
      let selectedCityFound = false;

      if (response.success) {
        $.each(response.cities, function (index, city) {
          let selected = "";

          if (
            preferredCityName &&
            city.name.trim().toLowerCase() ===
              preferredCityName.trim().toLowerCase()
          ) {
            selected = "selected";
            selectedCityFound = true;
          }

          options += `
                        <option value="${city.id}" ${selected}>
                            ${city.name}
                        </option>
                    `;
        });
      }

      $("#doc_personal_city").html(options);
    },

    error: function (xhr) {
      console.log("City AJAX Error:", xhr.responseText);

      $("#doc_personal_city").html("");
    },
  });
}

//verify otp personal
$("#doc_personal_otp").on("input", function () {
  let otp = $(this).val().replace(/\D/g, "");

  otp = otp.substring(0, 6);

  $(this).val(otp);

  $("#doc_personal_verified").addClass("hidden").removeClass("flex");

  $("#doc_personal_not_verified").addClass("hidden").removeClass("flex");

  $("#doc_personal_otp_verified").val("0");

  if (otp.length === 0) {
    return;
  }

  if (otp === "123456") {
    $("#doc_personal_verified").removeClass("hidden").addClass("flex");

    $("#doc_personal_otp_verified").val("1");
  } else {
    $("#doc_personal_not_verified").removeClass("hidden").addClass("flex");

    $("#doc_personal_otp_verified").val("0");
  }
});

//resend personal
$(".doc_personal_resend_otp").on("click", function (e) {
  e.preventDefault();

  $("#doc_personal_otp").val("");
  $("#doc_personal_otp_verified").val("0");

  $("#doc_personal_verified").addClass("hidden").removeClass("flex");

  $("#doc_personal_not_verified").addClass("hidden").removeClass("flex");

  toastr.success("OTP sent successfully");
});

//personal phn
$("#doc_phone").on("input", function () {
  this.value = this.value.replace(/\D/g, "").substring(0, 10);
});

//doc_personal_pincode
$("#doc_personal_pincode").on("input", function () {
  this.value = this.value.replace(/\D/g, "").substring(0, 6);
});

//admin name
$("#doc_adm_name").on("input", function () {
  this.value = this.value.replace(/[^A-Za-z ]/g, "");
});

// Country changed
$("#contact_country").on("change", function () {
  const countryId = $(this).val();

  loadStates(countryId);
});

// State changed
$("#contact_state").on("change", function () {
  const stateId = $(this).val();

  loadCities(stateId);
});

//saveDataStep2
function saveDataStep2() {
  const adminName = $("#doc_adm_name").val().trim();
  const email = $("#doc_adm_email").val().trim();
  const pincode = $("#doc_personal_pincode").val().trim();
  const alt_no = $("#doc_phone").val().trim();

  $(
    "#doc_adm_name, #doc_adm_email, #doc_personal_pincode, #doc_phone",
  ).removeClass("border-red-400 focus:border-red-400 focus:ring-red-400");

  // validations
  if (!adminName) {
    $("#doc_adm_name").addClass("border-red-400");
    toastr.warning("Admin name is required.");
    $("#doc_adm_name").focus();
    return;
  }

  const adminNameRegex = /^[A-Za-z ]+$/;

  if (!adminNameRegex.test(adminName)) {
    $("#doc_adm_name").addClass("border-red-400");
    toastr.warning("Admin name should contain alphabets only.");
    $("#doc_adm_name").focus();
    return;
  }

  if (!email) {
    $("#doc_adm_email").addClass("border-red-400");
    toastr.warning("Email address is required.");
    $("#doc_adm_email").focus();
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    $("#doc_adm_email").addClass("border-red-400");
    toastr.warning("Please enter a valid email address.");
    $("#doc_adm_email").focus();
    return;
  }

  if (!pincode) {
    $("#doc_personal_pincode").addClass("border-red-400");
    toastr.warning("Pincode is required.");
    $("#doc_personal_pincode").focus();
    return;
  }

  const pincodeRegex = /^\d{6}$/;

  if (!pincodeRegex.test(pincode)) {
    $("#doc_personal_pincode").addClass("border-red-400");
    toastr.warning("Pincode must be exactly 6 digits.");
    $("#doc_personal_pincode").focus();
    return;
  }

  const altPhonRegex = /^\d{10}$/;

  if (!altPhonRegex.test(alt_no)) {
    $("#doc_phone").addClass("border-red-400");
    toastr.warning("Contact no must be exactly 10 digits.");
    $("#doc_phone").focus();
    return;
  }

  //form submition
  const formData = new FormData();

  formData.append("step", "2");

  formData.append("doc_adm_name", adminName);
  formData.append("doc_adm_email", email);
  formData.append("doc_phone_country_code", $("#doc_phone_country_code").val());
  formData.append("doc_phone", alt_no);
  formData.append("doc_personal_otp", $("#doc_personal_otp").val());
  formData.append(
    "doc_personal_otp_verified",
    $("#doc_personal_otp_verified").val(),
  );
  formData.append("doc_personal_role", $("#doc_personal_role").val());
  formData.append("doc_personal_referral", $("#doc_personal_referral").val());

  formData.append("doc_personal_country", $("#doc_personal_country").val());
  formData.append("doc_personal_state", $("#doc_personal_state").val());
  formData.append("doc_personal_city", $("#doc_personal_city").val());
  formData.append("doc_personal_pincode", pincode);

  formData.append(
    "csrfmiddlewaretoken",
    $("input[name='csrfmiddlewaretoken']").val(),
  );

  $.ajax({
    url: "/user/doctor-profile-verification/save/",
    type: "POST",
    data: formData,
    processData: false,
    contentType: false,

    beforeSend: function () {
      $("#doc-next-step-btn").prop("disabled", true);
    },

    success: function (response) {
      console.log("Step 2 response:", response);

      if (response.success === true) {
        toastr.success(
          response.message || "Personal details saved successfully.",
        );

        // ============================
        // MOVE STEP 2 -> STEP 3
        // ============================

        updateStepTab(2, "completed");

        $("#step-panel-2").addClass("hidden");

        currentStep = 3;

        $("#step-panel-3").removeClass("hidden").addClass("step-fade-enter");

        setTimeout(function () {
          $("#step-panel-3")
            .removeClass("step-fade-enter")
            .addClass("step-fade-active");
        }, 50);

        updateStepTab(3, "active");

        updateProgress(3);

        $("#doc-next-btn-text").text("Submit Verification");
      } else {
        toastr.error(response.message || "Unable to save personal details.");
      }
    },

    error: function (xhr) {
      console.log("Save Step 2 Error:", xhr.responseText);

      let message = "Something went wrong while saving personal details.";

      if (xhr.responseJSON && xhr.responseJSON.message) {
        message = xhr.responseJSON.message;
      }

      toastr.error(message);
    },

    complete: function () {
      $("#doc-next-step-btn").prop("disabled", false);
    },
  });
}

//saveDataStep3
function saveDataStep3() {
  // ============================================
  // Get file inputs
  // ============================================

  const registrationFile = $(".doc_lic_upload")[0]?.files[0] || null;

  const aadharFile = $(".doc_aadhar_upload")[0]?.files[0] || null;

  const panFile = $(".doc_pan_upload")[0]?.files[0] || null;

  const logoFile = $(".doc_logo_upload")[0]?.files[0] || null;

  const photoFile = $(".doc_image_upload")[0]?.files[0] || null;

  // ============================================
  // Get document numbers
  // ============================================

  const registrationNo = $("#doc_registration_no").val()?.trim() || "";

  const aadharNo = $("#doc_aadhar_no").val()?.trim() || "";

  const panNo = $("#doc_pan_no").val()?.trim() || "";

  // ============================================
  // Validation
  // ============================================

  if (!registrationFile) {
    toastr.warning("Please upload the registration certificate.");
    return;
  }

  if (!aadharFile) {
    toastr.warning("Please upload the Aadhaar card.");
    return;
  }

  if (!panFile) {
    toastr.warning("Please upload the PAN card.");
    return;
  }

  if (!logoFile) {
    toastr.warning("Please upload the hospital logo.");
    return;
  }

  if (!photoFile) {
    toastr.warning("Please upload the hospital photo.");
    return;
  }

  // ============================================
  // Create FormData
  // ============================================

  const formData = new FormData();

  formData.append("step", "3");

  // ============================================
  // Document numbers
  // ============================================

  formData.append("registration_no", registrationNo);
  formData.append("aadhar_card_no", aadharNo);
  formData.append("pan_card_no", panNo);

  // ============================================
  // Documents
  // ============================================

  formData.append("registration_certificate", registrationFile);

  formData.append("aadhar_document", aadharFile);

  formData.append("pan_document", panFile);

  formData.append("logo", logoFile);

  formData.append("photo", photoFile);

  // ============================================
  // CSRF
  // ============================================

  formData.append(
    "csrfmiddlewaretoken",
    $("input[name='csrfmiddlewaretoken']").val(),
  );

  // ============================================
  // Debug - check what is being sent
  // ============================================

  console.log("========== STEP 3 DATA ==========");

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(key, "=>", value.name, value.type, value.size);
    } else {
      console.log(key, "=>", value);
    }
  }

  // ============================================
  // AJAX
  // ============================================

  $.ajax({
    url: "/user/doctor-profile-verification/save/",
    type: "POST",
    data: formData,
    processData: false,
    contentType: false,

    beforeSend: function () {
      $("#doc-next-step-btn").prop("disabled", true);
      $("#doc-next-btn-text").text("Saving...");
    },

    success: function (response) {
      console.log("Step 3 response:", response);

      if (response.success === true) {
        toastr.success(
          response.message || "Hospital documents saved successfully.",
        );

        // ========================================
        // Step 3 completed
        // ========================================

        updateStepTab(3, "completed");
        updateProgress(3);

        $("#doc-next-step-btn").prop("disabled", true);

        $("#doc-next-btn-text").text("Verification Submitted");

        // ========================================
        // Redirect
        // ========================================

        if (response.redirect_url) {
          setTimeout(function () {
            window.location.href = response.redirect_url;
          }, 1000);
        }
      } else {
        toastr.error(response.message || "Unable to save hospital documents.");
      }
    },

    error: function (xhr) {
      console.log("Save Step 3 Error:", xhr.responseText);

      let message = "Something went wrong while saving hospital documents.";

      if (xhr.responseJSON && xhr.responseJSON.message) {
        message = xhr.responseJSON.message;
      }

      toastr.error(message);
    },

    complete: function () {
      if (currentStep === totalSteps) {
        $("#doc-next-btn-text").text("Submit Verification");
      }

      // Don't enable it again if successfully submitted
      // and redirect is going to happen.
      if (!$("#doc-next-step-btn").data("submitted")) {
        $("#doc-next-step-btn").prop("disabled", false);
      }
    },
  });
}
