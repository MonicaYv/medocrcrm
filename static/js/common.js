$(document).ready(function () {
  let rowToDelete = null;

  $(document).ready(function () {
    // Navbar User Dropdown
    $(".profile-btn").on("click", function () {
      $(".profile-dropdown").toggle();
    });

    // Hide dropdown when clicking outside
    $(document).on("click", function (e) {
      if (!$(e.target).closest(".profile-btn, .profile-dropdown").length) {
        $(".profile-dropdown").hide();
      }
    });

    // Table row Delete Icon Modal Functionality
    $(".material-symbols-outlined.delete-icon").click(function () {
      rowToDelete = $(this).closest("tr");
      $(".deleteModal").removeClass("hidden").addClass("flex");
    });

    $("#cancelDelete").click(function () {
      rowToDelete = null;
      $(".deleteModal").removeClass("flex").addClass("hidden");
    });

    $("#confirmDelete").click(function () {
      if (rowToDelete) {
        rowToDelete.remove();
      }
      $(".deleteModal").removeClass("flex").addClass("hidden");
    });

    // Copy Code Functionality
    // $('.copy-btn').click(async function (e) {
    //   e.preventDefault();

    //   const targetSelector = $(this).data('target');
    //   const $target = $(targetSelector);

    //   if ($target.length === 0) {
    //     console.log('Target not found!');
    //     return;
    //   }

    //   try {
    //     await navigator.clipboard.writeText($target.val());

    //     // Change button text for feedback
    //     const $btn = $(this);
    //     const originalText = $btn.text();

    //     $btn.text('Copied');
    //     toastr.success('Code copied!');
    //     setTimeout(() => {
    //       $btn.text(originalText);
    //     }, 2000);

    //   } catch (err) {
    //     console.error('Failed to copy text: ', err);
    //   }

    //   let textToCopy = '';
    //   if ($target.is('input') || $target.is('textarea')) {
    //     textToCopy = $target.val();
    //   } else {
    //     textToCopy = $target.text();
    //   }

    //   try {
    //     await navigator.clipboard.writeText(textToCopy);
    //     console.log('Copied: ' + textToCopy);
    //   } catch (err) {
    //     console.error('Failed to copy: ', err);

    //   }
    // });

    // Copy Code Functionality
    $(".copy-btn").click(async function (e) {
      e.preventDefault();

      const targetSelector = $(this).data("target");
      const $target = $(targetSelector);

      if ($target.length === 0) {
        console.log("Target not found!");
        return;
      }

      let textToCopy = "";
      if ($target.is("input") || $target.is("textarea")) {
        textToCopy = $target.val();
      } else {
        textToCopy = $target.text();
      }

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy);
          toastr.success("Code copied!");
        } else {
          // Fallback method
          const $temp = $("<textarea>");
          $("body").append($temp);
          $temp.val(textToCopy).select();
          document.execCommand("copy");
          $temp.remove();
          toastr.success("Copied using fallback method!");
        }

        // Feedback on button
        const $btn = $(this);
        const originalText = $btn.text();
        $btn.text("Copied");
        setTimeout(() => {
          $btn.text(originalText);
        }, 2000);
      } catch (err) {
        console.error("Failed to copy: ", err);
      }
    });

    $(".share-app").click(function () {
      const app = $(this).data("app");
      const link = $("#share-link").val();
      let url = "";

      switch (app) {
        case "whatsapp":
          url = `https://wa.me/?text=${encodeURIComponent(link)}`;
          break;
        case "telegram":
          url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=Check this out!`;
          break;
        case "facebook":
          url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
          break;
        case "sms":
          url = `sms:?body=${encodeURIComponent(link)}`;
          break;
        case "gmail":
          url = `mailto:?subject=Check this out&body=${encodeURIComponent(link)}`;
          break;
      }

      if (url) {
        window.open(url, "_blank"); // open in new tab / app
      }
    });
    let generatedPdfUrl = null; // Variable to hold the Blob URL of the generated PDF

    // Generate PDF on clicking the share button
    $(".share-btn").click(function () {
      console.log("share");
      const element = $(this).closest(".popup").find(".download-container");

      // Set up html2pdf options
      var opt = {
        margin: 1,
        filename: "share-pdf.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { dpi: 192, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      // Generate the PDF asynchronously
      html2pdf()
        .from(element[0])
        .set(opt)
        .toPdf()
        .get("pdf")
        .then(function (pdf) {
          // Convert the PDF into a Blob
          var pdfBlob = pdf.output("blob");

          // Create a Blob URL for sharing
          generatedPdfUrl = URL.createObjectURL(pdfBlob);

          // Show the share popup
          $("#sharePopup").removeClass("hidden").addClass("flex");
        });
    });

    // Close the share popup
    $(".close-share-popup").click(function () {
      $("#sharePopup").addClass("hidden").removeClass("flex");
    });

    // Share the generated PDF when the user clicks on a share button
    $(".share-pdf").click(function () {
      if (generatedPdfUrl) {
        const app = $(this).data("app");

        // Share via the appropriate app
        switch (app) {
          case "whatsapp":
            window.open(
              `https://wa.me/?text=${encodeURIComponent(generatedPdfUrl)}`,
              "_blank",
            );
            break;
          case "telegram":
            window.open(
              `https://t.me/share/url?url=${encodeURIComponent(generatedPdfUrl)}`,
              "_blank",
            );
            break;
          case "facebook":
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generatedPdfUrl)}`,
              "_blank",
            );
            break;
          case "sms":
            window.open(
              `sms:?body=${encodeURIComponent(generatedPdfUrl)}`,
              "_blank",
            );
            break;
          case "gmail":
            window.open(
              `https://mail.google.com/mail/?view=cm&fs=1&to=&su=Share%20Pdf&body=${encodeURIComponent(generatedPdfUrl)}`,
              "_blank",
            );
            break;
          default:
            break;
        }
      } else {
        alert("Please generate the PDF first by clicking the share button.");
      }
    });
    // Scan Virus Functionality
    const checkbox = $(".scan-toggle");
    const statusText = $(".status-text");

    checkbox.on("change", function () {
      if (checkbox.is(":checked")) {
        checkbox.prop("indeterminate", false);
        statusText
          .text("Safe to upload")
          .removeClass()
          .addClass("text-green text-16-nr");
      } else if (
        !checkbox.is(":checked") &&
        checkbox.prop("indeterminate") !== true
      ) {
        checkbox.prop("indeterminate", true);
        statusText
          .text("This file may contain viruses")
          .removeClass()
          .addClass("text-strong-red text-16-nr");
      }
    });

    $(".closecart-btn").on("click", function () {
      window.history.back();
    });

    //Notification Dropdown on  Home Page of All Sections
    $("#bell-icon").on("click", function (e) {
      e.stopPropagation();
      $("#notificationDropdown").toggleClass("hidden");
    });
    $(".close-notifications").on("click", function () {
      $("#notificationDropdown").toggleClass("hidden");
    });
    $(document).on("click", function (e) {
      if (
        !$(e.target).closest("#notificationDropdown").length &&
        !$(e.target).is("#bell-icon")
      ) {
        $("#notificationDropdown").addClass("hidden");
      }
    });

    //Share Popup on  Home Page of All Sections
    $(".open-share-modal").on("click", function () {
      $("#shareModal").removeClass("hidden").addClass("flex");
    });
    $(".close-share-modal").on("click", function () {
      $("#shareModal").addClass("hidden").removeClass("flex");
    });
    $("#shareModal").on("click", function (e) {
      if ($(e.target).is("#shareModal")) {
        $("#shareModal").addClass("hidden").removeClass("flex");
      }
    });

    $(".close-avatar-btn").on("click", function () {
      $(".avatar").hide();
    });
  });

  // Scan Virus Functionality
  const checkbox = $(".scan-toggle-donate");
  const statusText = $(".status-text-donate");

  checkbox.on("change", function () {
    if (checkbox.is(":checked")) {
      checkbox.prop("indeterminate", false);
      statusText
        .text("Virus Scan")
        .removeClass()
        .addClass("text-green text-16-nr");
    } else if (
      !checkbox.is(":checked") &&
      checkbox.prop("indeterminate") !== true
    ) {
      checkbox.prop("indeterminate", true);
      statusText
        .text("This file may contain viruses")
        .removeClass()
        .addClass("text-strong-red text-16-nr");
    }
  });

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
  const csrftoken = getCookie("csrftoken");

  $("#register-form").on("submit", function (e) {
    e.preventDefault();
    console.clear(); // cleaner debugging console
    console.log("===== 📤 SUBMITTING FORM =====");
    resetFormErrors();

    let pwd = $('[name="password"]').val();
    let cpwd = $('[name="confirm_password"]').val();
    console.log("Password Match:", pwd === cpwd);

    if (pwd !== cpwd) {
      showError($('[name="confirm_password"]'), "Passwords do not match.");
      toastr.error("Passwords do not match.");
      return;
    }

    let terms = $('[name="terms"]');
    if (terms.length && !terms.is(":checked")) {
      showError(terms, "You must agree to the terms.");
      toastr.error("You must agree to the terms.");
      return;
    }

    let formUrl = $(this).attr("action");
    console.log("➡️ URL:", formUrl);
    if (formUrl == "/user/save/advertiser") {
      let selectValue = $(".advertiser-type-selected").text().trim();
      $('input[name="advertiser_type"]').val(selectValue);

      let adServiceValue = $(".ad-service-selected").text().trim();
      $('input[name="ad_service_req"]').val(adServiceValue);
    } else if (formUrl == "/user/save/medical_pharmacy") {
      let selectService = $(".selected-services").text().trim();
      $('input[name="services_offered"]').val(selectService);

      let selectPharmacyType = $(".selected-pharmacy-type").text().trim();
      $('input[name="pharmacy_type"]').val(selectPharmacyType);

      let selectWorkingDays = $(".selected-working-days").text().trim();
      $('input[name="working_days"]').val(selectWorkingDays);
    } else if (formUrl == "/user/save/client") {
      let selectValue = $(".company-type-selected").text().trim();
      $('input[name="company_type"]').val(selectValue);

      let adServiceValue = $(".company-service-selected").text().trim();
      $('input[name="company_service"]').val(adServiceValue);
    } else if (formUrl == "/user/save/ngo") {
      let selectValue = $(".ngo-service-selected").text().trim();
      $('input[name="ngo_service"]').val(selectValue);
    }

    // LAB SPECIFIC TRANSFORMS
    else if (formUrl.includes("/save/lab")) {
      let selectedTiming = $("input[name='lab_timing']:checked").val();
      if (selectedTiming) {
        $("input[name='lab_timing']").val(selectedTiming);
      }

      $("input[name='services']").val(
        $("input[name='services']:checked")
          .map(function () {
            return this.value;
          })
          .get()
          .join(","),
      );

      $("input[name='facilities']").val(
        $("input[name='facilities']:checked")
          .map(function () {
            return this.value;
          })
          .get()
          .join(","),
      );
    }

    // PHARMACY SPECIFIC TRANSFORMS
    else if (formUrl.includes("/save/pharmacy")) {
      // Pharmacy Timing (dropdown → hidden input)
      let selectedTiming = $("input[name='pharmacy_timing']:checked").val();
      if (selectedTiming) {
        $("input[name='pharmacy_timing']").val(selectedTiming);
      }

      // Pharmacy Type (dropdown → hidden)
      let selectedType = $("input[name='pharmacy_type']:checked").val();
      if (selectedType) {
        $("input[name='pharmacy_type']").val(selectedType);
      }

      // Services Offered (dropdown → hidden)
      $("input[name='services_offered']").val(
        $("input[name='services_offered']:checked")
          .map(function () {
            return this.value;
          })
          .get()
          .join(","),
      );
    }

    // HOSPITAL SPECIFIC TRANSFORMS
    else if (formUrl.includes("/save/hospital")) {
      console.log("📌 Processing Hospital Fields");
      let selectedTiming = $("input[name='hospital_timing']:checked").val();
      console.log("Hospital Timing:", selectedTiming);
      if (selectedTiming) {
        $("input[name='hospital_timing']").val(selectedTiming);
      }

      // Home Visit → Boolean
      let homeVisit =
        $(".home-visit-option input:checked").attr("id") === "Available"
          ? "Available"
          : "Unavailable";
      console.log("Home Visit:", homeVisit);
      $("<input>")
        .attr({
          type: "hidden",
          name: "home_visit",
          value: homeVisit,
        })
        .appendTo("#register-form");
    }

    // DOCTOR SPECIFIC TRANSFORMS
    else if (formUrl.includes("/save/doctor")) {
      console.log("📌 Processing Doctor Fields");

      // -------- Gender (single option)
      let gender = $("input[name='gender']:checked").val();
      console.log("Gender:", gender);
      if (gender) {
        $("input[name='gender']").val(gender);
      }

      // -------- Specialization (single FK)
      let specialization = $("input[name='specialization']:checked").val();
      console.log("Specialization ID:", specialization);
      if (specialization) {
        $("<input>")
          .attr({
            type: "hidden",
            name: "specialization",
            value: specialization,
          })
          .appendTo("#register-form");
      }

      // -------- Qualification (single FK)
      let qualification = $("input[name='qualification']:checked").val();
      console.log("Qualification ID:", qualification);
      if (qualification) {
        $("<input>")
          .attr({
            type: "hidden",
            name: "qualification",
            value: qualification,
          })
          .appendTo("#register-form");
      }

      // -------- Experience (single FK)
      let experience = $("input[name='experience']:checked").val();
      console.log("Experience ID:", experience);
      if (experience) {
        $("<input>")
          .attr({
            type: "hidden",
            name: "experience",
            value: experience,
          })
          .appendTo("#register-form");
      }

      // -------- Home Visit (Available/Unavailable → Boolean)
      let homeVisitRaw = $(".home-visit-option input:checked").attr("id");
      let homeVisitBoolean = homeVisitRaw === "Available" ? "true" : "false";

      console.log("Home Visit:", homeVisitRaw, "→", homeVisitBoolean);

      $("<input>")
        .attr({
          type: "hidden",
          name: "home_visit_available",
          value: homeVisitBoolean,
        })
        .appendTo("#register-form");

      // -------- Opening Time Dropdown (text)
      let openTime = $(".opening-time-option input:checked").val();
      console.log("Opening Time:", openTime);
      if (openTime) {
        $("<input>")
          .attr({
            type: "hidden",
            name: "clinic_timing_from",
            value: openTime,
          })
          .appendTo("#register-form");
      }

      // -------- Closing Time Dropdown (text)
      let closeTime = $(".closing-time-option input:checked").val();
      console.log("Closing Time:", closeTime);
      if (closeTime) {
        $("<input>")
          .attr({
            type: "hidden",
            name: "clinic_timing_to",
            value: closeTime,
          })
          .appendTo("#register-form");
      }
    }

    let formData = new FormData(this);
    console.log("===== 🧾 FormData Preview =====");
    for (var pair of formData.entries()) {
      console.log(pair[0] + " ➜ " + pair[1]);
    }
    $.ajax({
      url: formUrl,
      type: "POST",
      headers: { "X-CSRFToken": csrftoken },
      data: formData,
      processData: false,
      contentType: false,
      success: function (resp) {
        console.log("🎯 SUCCESS RESPONSE:", resp);
        if (resp.success) {
          toastr.success(resp.message || "Registration successful!");
          setTimeout(() => (location.href = "/user/login"), 1200);
        } else if (resp.errors) {
          showErrors(resp.errors);
          toastr.error("Please correct highlighted errors.");
        } else {
          toastr.error("Registration failed.");
        }
      },
      error: function (xhr) {
        console.log("❌ ERROR RESPONSE RAW:", xhr);
        console.log("❌ ERROR RESPONSE JSON:", xhr.responseJSON);

        if (xhr.responseJSON?.errors) {
          showErrors(xhr.responseJSON.errors);
          toastr.error("Please correct highlighted errors.");
        } else {
          toastr.error("Server error. Try again.");
        }
      },
    });
  });

  function resetFormErrors() {
    $(".border-dark-red").removeClass("border-dark-red");
    $("label.text-dark-red").removeClass("text-dark-red");
    $(".placeholder\\:text-semi-transparent-red").removeClass(
      "placeholder:text-semi-transparent-red",
    );
    $("[data-error-for]").text("");
  }

  function showError($input, message) {
    if (!$input.length) {
      console.warn("⚠️ showError() input missing:", message);
      return;
    }
    let name = $input.attr("name");
    let $label = $input.closest(".relative").find("label").first();
    let $span = $(`[data-error-for="${name}"]`);

    if ($input.closest(".dropdown").length) {
      $input
        .closest(".dropdown")
        .find(".dropdown-btn")
        .addClass("border-dark-red")
        .removeClass("border-primary-color");
    } else {
      $input
        .addClass("border-dark-red placeholder:text-semi-transparent-red")
        .removeClass("border-primary-color placeholder:text-blue-teal");
    }

    $label.addClass("text-dark-red");
    $span.text(message).addClass("text-dark-red");
  }

  function showErrors(errors) {
    console.log("🛑 Backend Validation Errors:", errors);
    $.each(errors, (field, message) => {
      let $input = $(`[name="${field}"]`);
      if ($input.length) {
        showError($input, message);
      } else {
        console.warn("⚠️ Field not found in DOM:", field);
      }
    });

    let firstError = $(".text-dark-red").first();
    if (firstError.length) {
      $("html, body").animate(
        { scrollTop: firstError.offset().top - 150 },
        500,
      );
    }
  }

  $("#register-form input, #register-form textarea").on(
    "input change",
    function () {
      let $input = $(this);
      let name = $input.attr("name");
      let $label = $input.closest(".relative").find("label").first();
      let $span = $(`[data-error-for="${name}"]`);

      $input
        .removeClass("border-dark-red placeholder:text-semi-transparent-red")
        .addClass("border-primary-color placeholder:text-blue-teal");

      $label.removeClass("text-dark-red");
      $span.text("");
    },
  );

  // Dropdown change fix
  $(".dropdown input").on("change", function () {
    let $wrapper = $(this).closest(".dropdown");
    $wrapper
      .find(".dropdown-btn")
      .removeClass("border-dark-red")
      .addClass("border-primary-color");

    $(`[data-error-for="${this.name}"]`).text("");
  });

  $("#login-form").on("submit", function (e) {
    e.preventDefault();
    $("#email-error").text("");
    $("#password-error").text("");
    var email = $("#email").val().trim();
    var password = $("#password").val().trim();
    if (!email) {
      $("#email-error").text("Email is required.");
      toastr.error("Email is required.");
      return;
    }
    if (!password) {
      $("#password-error").text("Password is required.");
      toastr.error("Password is required.");
      return;
    }
    var formUrl = $(this).attr("action");

    $.ajax({
      url: formUrl,
      type: "POST",
      headers: { "X-CSRFToken": csrftoken },
      data: { email: email, password: password, remember_me: false },
      success: function (resp) {
        if (resp.success) {
          toastr.success("Login successful!");
          setTimeout(function () {
            window.location.href = resp.redirect;
          }, 1000);
        } else {
          if (resp.errors) {
            if (resp.errors.email) $("#email-error").text(resp.errors.email);
            if (resp.errors.password)
              $("#password-error").text(resp.errors.password);
            if (resp.errors.account) toastr.error(resp.errors.account);
            else toastr.error("Please correct the errors.");
          } else {
            toastr.error(resp.error || "Login failed.");
          }
        }
      },
      error: function (xhr) {
        toastr.error("Server error. Try again.");
      },
    });
  });

  $(".submit-form").on("submit", function (e) {
    e.preventDefault();
    var formUrl = $(this).attr("action");
    var formType = $(this).attr("method");
    var formData = new FormData(this);
    console.log("Form Data:", formData);
    console.log("Form URL:", formUrl);
    console.log("Form Type:", formType);
    $.ajax({
      url: formUrl,
      type: formType,
      headers: { "X-CSRFToken": csrftoken },
      data: formData,
      processData: false,
      contentType: false,
      success: function (resp) {
        if (resp.success) {
          toastr.success(resp.message);

          setTimeout(function () {
            window.location.href = resp.redirect;
          }, 1000);
        } else {
          if (resp.errors) {
            toastr.error(resp.message);
          } else {
            toastr.error(resp.message);
          }
        }
      },
      error: function (xhr) {
        toastr.error("Server error. Try again.");
      },
    });
  });
});

//closeShareModal
function closeShareModal() {
  const modal = document.querySelector(".shareModal");
  modal.classList.add("hidden");
}

//closeShareModal
function closeNotificationModal() {
  const modal = document.querySelector(".notificationDropdown");
  modal.classList.add("hidden");
}

$(".closeBtnLegal").on("click", function () {
  window.history.back();
});

$(".chatTrigger").on("click", function () {
  $(".chatTrigger").addClass("!hidden");
  $(".avatar").removeClass("hidden").css("display", "block");
});

$(".close-avatar-btn").on("click", function () {
  $(".avatar").addClass("hidden").css("display", "");
  $(".chatTrigger").removeClass("!hidden");
});

$(".talkBtn").on("click", function () {
  $(".avatar").addClass("hidden").css("display", "");
  $(".chatbot").removeClass("hidden");
});

$(".closeChatbot").on("click", function () {
  $(".avatar").removeClass("hidden").css("display", "block");
  $(".chatbot").addClass("hidden");
});

function sendMessage() {
  const input = $("#chat-input");

  if (!input.length) return;

  const text = (input.val() || "").trim();

  if (!text) return;

  const bubble = `
      <div class="flex justify-end">
        <div class="border border-muted-silver-gray bg-pale-aqua w-52.75 py-5 px-2.5 rounded-xl">
          <p class="font-medium text-base">${text}</p>
        </div>
      </div>`;

  $(".bg-dropdown").append(bubble);
  $(".bg-dropdown").scrollTop($(".bg-dropdown")[0].scrollHeight);
  $("#chat-input").val("").focus();
}

$(document).on("click", "#send-message-btn", function () {
  sendMessage();
});

$(document).on("keydown", 'input[type="text"]', function (e) {
  if (e.key === "Enter") sendMessage();
});