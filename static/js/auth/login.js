$(document).ready(function () {
  $("#login-form").validate({
    rules: {
      "user-name": {
        required: true,
        minlength: 3,
      },
      Password: {
        required: true,
        minlength: 8,
      },
    },
    messages: {
      "user-name": {
        required: "Please enter your name",
        minlength: "Name must be at least 3 characters",
      },
      Password: {
        required: "*Wrong Password",
        minlength: "Password must be at least 8 characters long",
      },
    },
    errorPlacement: function (error, element) {
      const name = element.attr("name");
      $(`#${name}-error`).html(error);
    },
    highlight: function (element) {
      $(element)
        .addClass("border-dark-red placeholder:text-semi-transparent-red")
        .removeClass("border-primary-color placeholder:text-blue-teal");

      $(element).prev("label").addClass("text-dark-red");
    },
    unhighlight: function (element) {
      $(element)
        .removeClass("border-dark-red placeholder:text-semi-transparent-red")
        .addClass("border-primary-color placeholder:text-blue-teal");

      $(element).prev("label").removeClass("text-dark-red");
    },
  });

  // Toggle password
  $(".togglePassword").on("click", function () {
    const targetId = $(this).data("target");
    const passwordField = $("#" + targetId);

    if (passwordField.length) {
      const type =
        passwordField.attr("type") === "password" ? "text" : "password";
      passwordField.attr("type", type);
      
      $(this).text(type === "password" ? "visibility" : "visibility_off");
    }
  });

  //Welcome Page
  setTimeout(function () {
    $("#logo-screen").animate({ opacity: 0 }, 600, function () {
      $(this).hide();
      $("#roles-container")
        .css({ opacity: 0 })
        .removeClass("hidden")
        .animate({ opacity: 1 }, 600);
    });
  }, 1000);

  //forgot password
  $(document).on("click", "#forgotPassword-link", function (e) {
    e.preventDefault();
    window.location.href = "/user/forgot-password";
  });

  $("#forgot-password-form").on("submit", function (e) {
    e.preventDefault();

    const payload = {
      email: $("input[name=email]").val(),
      csrfmiddlewaretoken: $("input[name=csrfmiddlewaretoken]").val()
    };

    $.ajax({
      url: "/user/forgot-password",
      type: "POST",
      data: payload,
      success: function (response) {
        $("#forgot-password-action").html(`
          <span class="text-xs text-green-600 font-medium">
            Reset link sent to your registered email.
          </span>
        `);
      },
      error: function (xhr) {
        let msg = "Something went wrong. Try again.";
        if (xhr.responseJSON && xhr.responseJSON.errors) {
          msg = Object.values(xhr.responseJSON.errors).join("<br>");
        }
        $("#forgot-password-action").html(`
          <span class="text-xs text-red-600 font-medium">
            ${msg}
          </span>
        `);
      }
    });
  });

let selectedRole = null;
let isMedicalProviderSubRole = true;

// Check on page load if we need to show medical provider roles
$(document).ready(function() {
  const showMedicalProviderRoles = sessionStorage.getItem('showMedicalProviderRoles');
  
  if (showMedicalProviderRoles === 'true') {
    // Show medical provider sub-roles
    $(".mainRoles").hide();
    $(".medicalProviderRoles").removeClass("hidden");
    $(".bottomDesign").removeClass("-bottom-41").addClass("-bottom-62");
    $(".backBtn").removeClass("hidden");
    isMedicalProviderSubRole = true;
    
    // Clear the flag
    sessionStorage.removeItem('showMedicalProviderRoles');
  }
});

// Handle clicks on main roles
$(".mainRoles .role-option").on("click", function () {
  // Reset all options in main roles
  $(".mainRoles .role-option")
    .removeClass("bg-primary-color text-white")
    .find("span")
    .removeClass("text-white/80");

  // Highlight selected
  $(this)
    .addClass("bg-primary-color text-white")
    .find("span")
    .addClass("text-white/80");

  selectedRole = $(this).data("role");

  const redirects = {
    customer: "/user/register/customer",
    client: "/user/register/client",
    advertiser: "/user/register/advertiser",
    ngoOwner: "/user/register/ngoOwner",
    medicalProvider: null,
  };

  // Auto-redirect on mobile (less than 640px width) - except for medical provider
  if (window.innerWidth < 640 && selectedRole !== "medicalProvider") {
    window.location.href = redirects[selectedRole] || "/";
  }
});

// Handle clicks on medical provider sub-roles

// With this (handles dynamically shown elements):
$(document).on("click", ".medicalProviderRoles .role-option", function () {
  $(".medicalProviderRoles .role-option")
    .removeClass("bg-primary-color text-white")
    .find("span").removeClass("text-white/80");

  $(this)
    .addClass("bg-primary-color text-white")
    .find("span").addClass("text-white/80");

  selectedRole = $(this).data("role");
  console.log("Sub-role selected:", selectedRole); // debug

  if (window.innerWidth < 640) {
    sessionStorage.setItem('fromMedicalProviderRoles', 'true');
    const redirects = {
      doctor: "/user/register/doctor",
      Pharmacy: "/user/register/Pharmacy",
      hospital: "/user/register/hospital",
      lab: "/user/register/lab",
    };
    window.location.href = redirects[selectedRole] || "/user/register";
  }
});

$(".continueBtn").on("click", function () {
  if (!selectedRole) {
    toastr.error("error", "Please select a role before continuing.");
    return;
  }

  // If medical provider is selected and we're not in sub-role view yet
  if (selectedRole === "medicalProvider" && !isMedicalProviderSubRole) {
    // Hide main roles and show medical provider sub-roles
    $(".mainRoles").hide();
    $(".medicalProviderRoles").removeClass("hidden");
    $(".bottomDesign").removeClass("-bottom-41").addClass("-bottom-62");
    $(".backBtn").removeClass("hidden");
    isMedicalProviderSubRole = true;
    selectedRole = null; // Reset selection for sub-role
    return;
  }

  // Handle main roles
  const mainRoleRedirects = {
    customer: "/user/register/customer",
    client: "/user/register/client",
    advertiser: "/user/register/advertiser",
    ngoOwner: "/user/register/ngoOwner",
    medicalProvider: null,
  };

  // Handle medical provider sub-roles
  const medicalProviderRedirects = {
    doctor: "/user/register/doctor",
    Pharmacy: "/user/register/Pharmacy",
    hospital: "/user/register/hospital",
    lab: "/user/register/lab",
  };

  const redirectUrl = isMedicalProviderSubRole
    ? medicalProviderRedirects[selectedRole]
    : mainRoleRedirects[selectedRole];

  // Set flag before redirect if going to medical provider form
  if (isMedicalProviderSubRole) {
    sessionStorage.setItem('fromMedicalProviderRoles', 'true');
  }

  if (!redirectUrl) {
    toastr.error("Invalid role selected. Please try again.");
    console.error("No redirect for role:", selectedRole, "isMedicalProviderSubRole:", isMedicalProviderSubRole);
    return;
  }

  window.location.href = redirectUrl;
});

$(".backBtn").on("click", function () {
  $(".mainRoles").show();
  $(".medicalProviderRoles").addClass("hidden");
  $(".bottomDesign").removeClass("-bottom-62").addClass("-bottom-41");
  $(".backBtn").addClass("hidden");
  isMedicalProviderSubRole = false;
  
  // Clear the flag
  sessionStorage.removeItem('fromMedicalProviderRoles');
});  // Set placeholder dynamically based on screen size

// Set placeholder dynamically based on screen size
function setPlaceholder() {
    if ($(window).width() < 640) {
      $("#password").attr("placeholder", "Password");
      $("#userName").attr('placeholder',"User Name")
      $('input').addClass('shadow-lg bg-indigo-blue').removeClass('shadow-none');
      $("#NewPassword").attr("placeholder", "New Password");
      $("#ConfirmPassword").attr("placeholder", "Confirm Password");
    } else {
      $("#password").attr("placeholder", "********");
      $("#userName").attr('placeholder',"Rachel Saket")
      $('input').removeClass('shadow-lg bg-indigo-blue').addClass('shadow-none');
      $("#NewPassword").attr("placeholder", "************");
      $("#ConfirmPassword").attr("placeholder", "*********");
    }
  }
setPlaceholder(); // Set on load
    $(window).on("resize", setPlaceholder); 
});
