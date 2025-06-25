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
    $("#forgot-password-action").html(`
      <span class="text-xs text-black font-medium">
        *Reset link sent to your registered email
      </span>
    `);
  });

  let selectedRole = null;

$('.role-option').on('click', function () {
  // Reset all options
  $('.role-option')
    .removeClass('bg-primary-color text-white')
    .find('span')
    .removeClass('text-white/80');

  // Highlight selected
  $(this)
    .addClass('bg-primary-color text-white')
    .find('span')
    .addClass('text-white/80');

  selectedRole = $(this).data('role');

  const redirects = {
    customer: '/src/auth/register_user.html',
    medicalProvider: '/src/auth/medical-provider-register.html',
    client: '/src/auth/client-register.html',
    advertiser: '/src/auth/advertiser_register.html',
    ngoOwner: '/src/auth/ngo_register.html',
  };

  // Auto-redirect on mobile (less than 640px width)
  if (window.innerWidth < 640) {
    window.location.href = redirects[selectedRole] || '/';
  }
});

$('.continueBtn').on('click', function () {
  if (!selectedRole) {
    window.showToaster('error', 'Please select a role before continuing.');
    return;
  }

  const redirects = {
    customer: '/src/auth/register_user.html',
    medicalProvider: '/src/auth/medical-provider-register.html',
    client: '/src/auth/client-register.html',
    advertiser: '/src/auth/advertiser_register.html',
    ngoOwner: '/src/auth/ngo_register.html',
  };

  window.location.href = redirects[selectedRole] || '/';
});

// Set placeholder dynamically based on screen size
function setPlaceholder() {
    if ($(window).width() < 640) {
      $("#Password").attr("placeholder", "Password");
      $("#userName").attr('placeholder',"User Name")
      $('input').addClass('shadow-lg bg-indigo-blue').removeClass('shadow-none');
      $("#NewPassword").attr("placeholder", "New Password");
      $("#ConfirmPassword").attr("placeholder", "Confirm Password");
    } else {
      $("#Password").attr("placeholder", "********");
      $("#userName").attr('placeholder',"Rachel Saket")
      $('input').removeClass('shadow-lg bg-indigo-blue').addClass('shadow-none');
      $("#NewPassword").attr("placeholder", "************");
      $("#ConfirmPassword").attr("placeholder", "*********");
    }
  }
setPlaceholder(); // Set on load
    $(window).on("resize", setPlaceholder); 
});
