$(document).ready(function () {
 
  // Edit icon
  $(".editIcon").on("click", function () {
    $(".edit-details").removeClass("hidden");
    $(".account-detail").hide();
    $(".tabs").hide();
    $(".edit-toggle").hide();
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
  });

  // Form submit for edit details
  $("#editForm").on("submit", function (e) {
    e.preventDefault();

    // Clear previous errors
    $(".error").text("").addClass("hidden");

    let hasError = false;

    // Get field values
    const pharmacyName = $("#pharmacyName").val().trim();
    const adminName = $("#adminName").val().trim();
    const email = $("#email").val().trim();
    const phone = $("#phone").val().trim();
    const address = $("#address").val().trim();
    const license = $("#license").val().trim();
    const countryCode = $("#countryCodes option:selected").text().trim();

    // Validation
    if (pharmacyName === "") {
      $(".pharmacyNameError")
        .text("Please enter Pharmacy Name")
        .removeClass("hidden");
      hasError = true;
    }

    if (adminName === "") {
      $(".adminNameError")
        .text("Please enter Admin/Owner Name")
        .removeClass("hidden");
      hasError = true;
    }

    if (email === "") {
      $(".emailError").text("Please enter Email Address").removeClass("hidden");
      hasError = true;
    }

    if (phone === "") {
      $(".phoneError").text("Please enter Phone Number").removeClass("hidden");
      hasError = true;
    }

    if (address === "") {
      $(".addressError").text("Please enter Address").removeClass("hidden");
      hasError = true;
    }

    if (license === "") {
      $(".licenseError")
        .text("Please enter License Number")
        .removeClass("hidden");
      hasError = true;
    }

    if (hasError) return; // Stop form if validation fails

    // Update display
    const grayTexts = $("#account-details").find("p.text-medium-gray");
    grayTexts.eq(0).text(pharmacyName);
    grayTexts.eq(1).text(adminName);
    grayTexts.eq(2).text(email);
    grayTexts.eq(3).text(countryCode);
    grayTexts.eq(4).text(phone);
    grayTexts.eq(5).text(address);
    grayTexts.eq(6).text(license);

    // Hide form
    $(".edit-details").addClass("hidden");
    $(".account-detail").show();
    $(".tabs").show();
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
    $(`.toggle-section[data-section="${target}"]`).removeClass("hidden");
  });

  // Form submit for password change
  $("#editChangePassword").on("submit", function (e) {
    e.preventDefault();

    // Clear previous errors
    $(this).find(".error").text("").addClass("hidden");

    let hasError = false;

    // Get field values
    const currentPassword = $(this).find("input:eq(0)").val().trim();
    const newPassword = $(this).find("input:eq(1)").val().trim();
    const confirmPassword = $(this).find("input:eq(2)").val().trim();

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
    /*
    $.ajax({
      url: '/change-password',
      method: 'POST',
      data: {
        currentPassword: currentPassword,
        newPassword: newPassword
      },
      success: function(response) {
        // Hide form after successful submission
        $(".toggle-section").addClass("hidden");
        $(".account-detail").show();
        $(".tabs").show();
        
        // Show success message
        alert("Password changed successfully");
      },
      error: function(xhr) {
        // Show error message
        alert("Error changing password: " + xhr.responseText);
      }
    });
    */

    // For demo purposes, we'll just hide the form
    $(".toggle-section").addClass("hidden");
    $(".account-detail").show();
    $(".tabs").show();

    // Show success message
    window.showToaster('success', 'Password changed successfully!');
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
    $('#deleteAccountPopup').addClass('hidden');
    $('#successPopup').removeClass('hidden');
  })


  const $bellIcon = $("#bell-icon");
  const $popup = $("#popup");
  const $closePopup = $("#close-popup");
  // const $viewDetailsDropdown = $("#viewDetailsDropdown");
  // const $openViewDetails = $(".openViewDetails");
  // const $closeViewDetailsDropdown = $(".closeViewDetailsDropdown");
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
  document.getElementById(id).classList.add("hidden");
  document.body.style.overflow = "auto";
}

function clearSearchHistory() {
  // Perform action here
  window.showToaster('success', 'Search history cleared!');
  closePopup("searchHistoryPopup");
}

function clearSavedData() {
  // Perform action here
  window.showToaster('success', 'Saved data cleared!');
  closePopup("savedDataPopup");
}

function deleteAccount() {
  // Perform action here
  window.showToaster('success', 'Account deleted!');
  closePopup("deleteAccountPopup");
}
