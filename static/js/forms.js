$(document).ready(function () {
 
  // Edit icon
  $(".editIcon").on("click", function () {
    $(".edit-details").removeClass("hidden");
    $(".account-detail").hide();
    $(".tabs").hide();
    $(".edit-toggle").hide();
    $(".tcBox").hide();
    
  });

  // Cancel button
  $(".cancel-btn").on("click", function (e) {
    e.preventDefault();
    $(".edit-details").addClass("hidden");
    $(".toggle-section").addClass("hidden");
    $(".account-detail").show();
    $(".tabs").show();
    $(".setting-header").show();
    $(".edit-toggle").show();
    $('.tcBox').show();
  });

  // Form submit for edit details
$("#editForm .save-btn").on("click", function (e) {
    e.preventDefault();

    const $form = $("#editForm");
    const actionUrl = $form.attr("action");
    const method = $form.attr("method").toUpperCase();
    const formData = $form.serialize();

    // Clear previous errors
    $(".error").text("").addClass("hidden");

    // Basic client-side validation
    let hasError = false;
    const requiredFields = {
      email: "Email is required.",
      phone: "Phone is required.",
      address: "Address is required.",
      city: "City is required.",
      state: "State is required.",
      country: "Country is required.",
      pincode: "Pincode is required."
    };

    for (let field in requiredFields) {
      const value = $form.find(`[name="${field}"]`).val() || '';
      if (!value) {
        console.log(`.${field}Error`);
        $(`.${field}Error`).text(requiredFields[field] || `${field} is required`).removeClass("hidden");
        hasError = true;
      }
    }
      console.log(hasError);
    if (hasError) return;

    // AJAX submit
    $.ajax({
      url: actionUrl,
      type: method,
      data: formData,
      beforeSend:function(){
        $('.save-btn').text('Saving....').attr('disabled', true);
      },
      headers: {
        "X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val()
      },
      success: function (response) {
        if(response.success == true){
          toastr.success(response.message || "Updated successfully.");
          location.reload();
        } else {
          toastr.success(response.message || "Error Occurs, Please Try Again.");
        }
        $('.save-btn').text('Saved').attr('disabled', false);
      },
      error: function (xhr) {
        if (xhr.status === 422 || xhr.status === 400) {
          const errors = xhr.responseJSON.errors;
          console.log("errors", errors);
          $.each(errors, function (field, messages) {
            $(`.${field}Error`).text(messages).removeClass("hidden");
          });
        } else {
          toastr.error("An unexpected error occurred.");
        }
        $('.save-btn').text('Save Changes').attr('disabled', false);
      }
    });
  });

  // Input validation clearing for edit form
  $("#pharmacyName").on("input", function () {
    if ($(this).val().trim() !== "") {
      $(".pharmacyNameError").text("").addClass("hidden");
    }
  });

  $("#adminName").on("input", function () {
    if ($(this).val().trim() !== "") {
      $(".adminNameError").text("").addClass("hidden");
    }
  });

  $("#email").on("input", function () {
    if ($(this).val().trim() !== "") {
      $(".emailError").text("").addClass("hidden");
    }
  });

  $("#phone").on("input", function () {
    if ($(this).val().trim() !== "") {
      $(".phoneError").text("").addClass("hidden");
    }
  });

  $("#address").on("input", function () {
    if ($(this).val().trim() !== "") {
      $(".addressError").text("").addClass("hidden");
    }
  });

  $("#license").on("input", function () {
    if ($(this).val().trim() !== "") {
      $(".licenseError").text("").addClass("hidden");
    }
  });

 function handleTabSwitch(tabTarget) {
  $(".tab-content").addClass("hidden");
  $(".tab-btn").removeClass(
    "border-b-2 text-light-sea-green text-vivid-orange text-dark-blue text-living-coral text-violet-sky"
  );
  $("#" + tabTarget).removeClass("hidden");
  let activeClass = "border-b-2 text-light-sea-green"; 

  if ($(".tabs").hasClass("vivid-orange-tabs")) {
    activeClass = "border-b-2 text-vivid-orange";
  } else if ($(".tabs").hasClass("dark-blue-tabs")) {
    activeClass = "border-b-2 text-dark-blue";
  }else if ($(".tabs").hasClass("living-coral-tabs")) {
    activeClass = "border-b-2 text-living-coral";
  }
  else if ($(".tabs").hasClass("violet-sky-tabs")) {
    activeClass = "border-b-2 text-violet-sky";
  }
  $(`.tab-btn[data-tab="${tabTarget}"]`).addClass(activeClass);
 if (tabTarget === "account-details") {
  $(".edit-toggle").removeClass("hidden");
  $(".lastEditMsg").show();
  $(".editIcon").show();
   $(".docInfo").addClass('hidden');
} else if (tabTarget === "documents") {
  $(".edit-toggle").removeClass("hidden");
  $(".lastEditMsg").show();
  $(".editIcon").hide();
  $(".docInfo").removeClass('hidden');
} else {
  $(".edit-toggle").addClass("hidden");
 
}

}

// Event binding
$(".tab-btn").on("click", function () {
  const tabTarget = $(this).data("tab");
  handleTabSwitch(tabTarget);
});


  // Change Password toggle
  $(".toggle-trigger").on("click", function () {
    const target = $(this).data("target");

    $(".edit-toggle").hide();
    $(".editIcon").addClass("hidden");
    $(".edit-details").addClass("hidden");
    $(".toggle-section").addClass("hidden");
    $(".setting-header").hide(); // Hide the settings header
    $(".account-detail").hide();
    $(".tabs").hide();
    $('.tcBox').hide();
    $(`.toggle-section[data-section="${target}"]`).removeClass("hidden");
  });

  // Form submit for password change
  // $("#editChangePassword").on("submit", function (e) {
  $(document).off("submit").on("submit", "#editChangePassword", function (e) {
    e.preventDefault();

    // Clear previous errors
    $(this).find(".error").text("").addClass("hidden");

    let hasError = false;

    // Get field values
    const currentPassword = $(this).find("input:eq(1)").val().trim();
    const newPassword = $(this).find("input:eq(2)").val().trim();
    const confirmPassword = $(this).find("input:eq(3)").val().trim();
    

    // Validation
    if (currentPassword === "") {
      $(this)
        .find(".error:eq(0)")
        .text("Please enter current password")
        .removeClass("hidden");
      hasError = true;
    }

    if (newPassword === "") {
      $(this)
        .find(".error:eq(1)")
        .text("Please enter new password")
        .removeClass("hidden");
      hasError = true;
    } else if (newPassword.length < 8) {
      $(this)
        .find(".error:eq(1)")
        .text("Password must be at least 8 characters")
        .removeClass("hidden");
      hasError = true;
    }

    if (confirmPassword === "") {
      $(this)
        .find(".error:eq(2)")
        .text("Please confirm new password")
        .removeClass("hidden");
      hasError = true;
    } else if (confirmPassword !== newPassword) {
      $(this)
        .find(".error:eq(2)")
        .text("Passwords don't match")
        .removeClass("hidden");
      hasError = true;
    }

    if (hasError) return;

    // Here you would typically make an AJAX call to update the password
    // Example:
    
    const csrftoken = getCookie('csrftoken');

$.ajax({
    url: '/settings/change-password/',
    method: 'POST',
    headers: {
        'X-CSRFToken': csrftoken
    },
    data: {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
        otp: $("#emailOtp").val(),
        token: $("#otpToken").val(),
    },
    success: function(response) {
        console.log("SUCCESS RESPONSE", response);

        if(response.success){
            $(".toggle-section").addClass("hidden");
            $(".account-detail").show();
            $(".tabs").show();
            toastr.success(response.message);
        } else {
            toastr.error(response.message);
        }
    },
    error: function(xhr) {
        console.log("AJAX ERROR", xhr);
        console.log(xhr.responseText);
        toastr.error("Error changing password");
    }
});  // make sure getCookie is defined
    $.ajax({
      url: '/settings/change-password/',
      method: 'POST',
      headers: {
            'X-CSRFToken': csrftoken
        },
      data: {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password:confirmPassword,
        otp: $("#emailOtp").val(),
        token: $("#otpToken").val(),
      },
      success: function(response) {
        if(response.success == true){
          // Hide form after successful submission
          $(".toggle-section").addClass("hidden");
          $(".account-detail").show();
          $(".tabs").show();
          toastr.success(response.message);
        } else {
          toastr.error(response.message);
        }
      },
      error: function(xhr) {
        console.log(xhr.responseText);
        // Show error message
        toastr.error("Error changing password: " + xhr.responseText);
      }
    });
  });

  // Input validation clearing for password fields
  $("#editChangePassword input").on("input", function () {
    const index = $(this).index();
    $(this).siblings(".error").eq(index).text("").addClass("hidden");
  });

  // Initialize with account details tab
  handleTabSwitch("account-details");


  $(".toggleDropdown").on("click", function (e) {
    e.stopPropagation();
    const $container = $(this).closest(".dropdown-container");
    // Hide other dropdown menus except this one
    $(".dropdown-menu").not($container.find(".dropdown-menu")).hide();
    // Toggle this dropdown menu
    $container.find(".dropdown-menu").toggle();
  });

  $(".dropdown-option").on("click", function () {
    const selectedText = $(this).text().trim();
    const $container = $(this).closest(".dropdown-container");
    const $input = $container.find(".dropdown-input");

    if (selectedText.toLowerCase().startsWith("custom")) {
      $input.val("");
    } else {
      $input.val(selectedText);
    }
    $container.find(".dropdown-menu").hide();
    $input.focus();
  });

  // Clicking outside closes dropdowns
  $(document).on("click", function () {
    $(".dropdown-menu").hide();
  });



   $(".view-icon").on("click", function () {
    // Show modal
    $("#viewModal").removeClass("hidden");
    $(".all-content").hide();
  });

  // Close modal when clicking the close button
  $("#closeModal").on("click", function () {
    $("#viewModal").addClass("hidden");
     $(".all-content").show();
  });

  // Also close modal when clicking outside modal content
  $("#viewModal").on("click", function (e) {
    if (e.target.id === "viewModal") {
      $("#viewModal").addClass("hidden");
        $(".all-content").show();
    }
  });

  $('.submitBtn').on("click",function(){
    // $('#deleteAccountPopup').addClass('hidden');
    // $('#successPopup').removeClass('hidden');
    $('.reasonDiv').addClass('hidden');
    $('.confirmationDeleteAccountPopup').removeClass('hidden');
  })


  const $bellIcon = $("#bell-icon");
  const $popup = $("#popup");
  const $closePopup = $("#close-popup");
  const $viewDetailsDropdown = $("#viewDetailsDropdown");
  const $openViewDetails = $(".openViewDetails");
  const $closeViewDetailsDropdown = $(".closeViewDetailsDropdown");
  $bellIcon.on("click", function (e) {
    e.stopPropagation();
    $popup.toggleClass("hidden");
    $viewDetailsDropdown.addClass("hidden");
  });
  $closePopup.on("click", function () {
    $popup.addClass("hidden");
  });
  $openViewDetails.on("click", function (e) {
    e.stopPropagation();
    $popup.addClass("hidden");
    $viewDetailsDropdown.removeClass("hidden");
  });
  $closeViewDetailsDropdown.on("click", function () {
    $viewDetailsDropdown.addClass("hidden");
    $popup.removeClass("hidden");
  });
  $(document).on("click", function (e) {
    const $target = $(e.target);

    if (!$target.closest("#popup").length && !$target.is("#bell-icon")) {
      $popup.addClass("hidden");
    }

    if (
      !$target.closest("#viewDetailsDropdown").length &&
      !$target.closest(".openViewDetails").length
    ) {
      $viewDetailsDropdown.addClass("hidden");
    }
  });
});
function openPopup(id) {
  document.getElementById(id).classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closePopup(id) {
  $("#" + id).addClass("hidden");
  $("body").css("overflow", "auto");
}


function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

function deleteAccount() {
    const selectedReason = document.querySelector('input[name="address"]:checked');
    const otherReasonInput = document.querySelector('input[placeholder^="Specify Your Reason"]');
    let reason = "";

    if (selectedReason) {
        reason = selectedReason.parentElement.previousElementSibling.innerText.trim();
    }
    if (otherReasonInput && otherReasonInput.value.trim()) {
        reason = otherReasonInput.value.trim();
    }

    const csrftoken = getCookie('csrftoken');  // make sure getCookie is defined

    fetch('delete-account/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({ reason })
    })
    .then(res => {
        if (res.ok) {
          toastr.success('Account deleted!');
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else {
          toastr.error("Failed to delete account");
        }
    });
    closePopup("deleteAccountPopup");
}

function clearSearchHistory() {
  // Perform action here
  const csrftoken = getCookie('csrftoken');  // make sure getCookie is defined

    fetch('clear-search-history/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        // body: JSON.stringify({ reason })
    })
    .then(res => {
        if (res.ok) {
            toastr.success("Search history cleared successfully");
        } else {
            toastr.error("Failed to delete history.");
        }
    });
  closePopup("searchHistoryPopup");
}

function clearSavedData() {
  // Perform action here
  const csrftoken = getCookie('csrftoken');  // make sure getCookie is defined

    fetch('clear-saved-data/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        // body: JSON.stringify({ reason })
    })
    .then(res => {
        if (res.ok) {
            toastr.success("Saved data cleared successfully");
        } else {
            toastr.error("Failed to delete saved data.");
        }
    });
  // toastr.success('Saved data cleared!');
  closePopup("savedDataPopup");
}
$(".main-tab").on("click", function () {
  const mainTab = $(this).data("tab");

  // Activate main tab
  $(".main-tab").removeClass("active-tab-main");
  $(this).addClass("active-tab-main");

  // Show main content
  $(".mainTab-content").addClass("hidden");
  $("#" + mainTab).removeClass("hidden");

  // 🔥 AUTO ACTIVATE FIRST SUB TAB (same logic as pharmacy)
  const firstSubTab = $(`[data-parent="${mainTab}"]`).first();

  if (firstSubTab.length) {
    firstSubTab.trigger("click");
  }
});



$(".main-tab-pharmacy").on("click", function () {
  const mainTab = $(this).data("tab");

  // Activate main tab
  $(".main-tab-pharmacy").removeClass("active-tab-main-pharmacy");
  $(this).addClass("active-tab-main-pharmacy");

  // Show main content
  $(".mainTab-content").addClass("hidden");
  $("#" + mainTab).removeClass("hidden");

  // 🔥 AUTO ACTIVATE FIRST SUB TAB
  const firstSubTab = $(`[data-parent="${mainTab}"]`).first();

  if (firstSubTab.length) {
    firstSubTab.trigger("click");
  }
});
$('[data-tab="points"][data-parent="rewards"]').on('click', function () {
  setTimeout(() => {
    if (window.referralChart) {
      window.referralChart.resize();
      window.referralChart.update();
    } else {
      initReferralChart();
    }
  }, 150);
});

let otpToken = "";

$("#sendEmailOtpBtn, #resendOtp").on("click", function () {

    const csrftoken = getCookie("csrftoken");

    $.ajax({
        url: "/settings/send-change-password-otp/",
        method: "POST",
        headers: {
            "X-CSRFToken": csrftoken
        },

        success: function (response) {

            if (response.success) {

                otpToken = response.token;

                $("#otpToken").val(response.token);

                $("#otpVerified").val("0");

                $("#verifyStatus").addClass("hidden");

                toastr.success(response.message);

            } else {

                toastr.error(response.message);

            }

        },

        error: function (xhr) {

            toastr.error(xhr.responseJSON?.message || "Unable to send OTP");

        }

    });

});

$("#emailOtp").on("keyup", function () {

    if ($(this).val().length !== 6)
        return;

    $.ajax({

        url: "/user/otp/verify",

        method: "POST",

        data: {

            email: $("#email").val(),

            otp: $("#emailOtp").val(),

            token: $("#otpToken").val(),

            csrfmiddlewaretoken: getCookie("csrftoken")

        },

        success: function () {

            $("#otpVerified").val("1");

            $("#verifyStatus").removeClass("hidden");

            toastr.success("OTP Verified");

        },

        error: function (xhr) {

            $("#otpVerified").val("0");

            toastr.error(xhr.responseJSON.message);

        }

    });

});
