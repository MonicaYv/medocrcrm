$(document).ready(function(){
  let rowToDelete = null;

$(document).ready(function () {

// Navbar User Dropdown
    $('.profile-btn').on('click', function () {
        $('.profile-dropdown').toggle();
    });

    // Hide dropdown when clicking outside
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.profile-btn, .profile-dropdown').length) {
            $('.profile-dropdown').hide();
        }
    });


// Table row Delete Icon Modal Functionality
    $(".material-symbols-outlined.delete-icon").click(function () {
        rowToDelete = $(this).closest("tr");
        $(".deleteModal").removeClass("hidden").addClass("flex");;
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


    //Code For copying referral code to clipboard
    $('.copy-btn').on('click',function(){
        const code=$("#referral-code").text().trim();
        navigator.clipboard.writeText(code).then(function(){
            console.log("Copied to Clipboard" + code)
        }).catch(function(err){
            console.log("Failed to copy",err)
        })
    })

    // Copy Code Functionlity
 $('.copy-btn').click(async function (e) {
  e.preventDefault();

  const targetSelector = $(this).data('target');
  const $target = $(targetSelector);

  if ($target.length === 0) {
    console.log('Target not found!');
    return;
  }

  let textToCopy = '';
  if ($target.is('input') || $target.is('textarea')) {
    textToCopy = $target.val();
  } else {
    textToCopy = $target.text();
  }

  try {
    await navigator.clipboard.writeText(textToCopy);
    console.log('Copied: ' + textToCopy);
  } catch (err) {
    console.error('Failed to copy: ', err);
   
  }
});

    // Scan Virus Functionality
    const checkbox = $('.scan-toggle');
    const statusText = $('.status-text');


    checkbox.on('change', function () {
        if (checkbox.is(':checked')) {
            checkbox.prop('indeterminate', false);
            statusText.text('Safe to upload').removeClass().addClass('text-green text-16-nr');
        } else if (!checkbox.is(':checked') && checkbox.prop('indeterminate') !== true) {
            checkbox.prop('indeterminate', true);
            statusText.text('This file may contain viruses').removeClass().addClass('text-strong-red text-16-nr');
        }
    });
    
    $('.closecart-btn').on("click",function(){
        window.history.back();
    })

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
 
  $('.close-avatar-btn').on('click',function(){
    $('.avatar').hide();
  })
});


// Scan Virus Functionality
const checkbox = $('.scan-toggle-donate');
const statusText = $('.status-text-donate');

checkbox.on('change', function () {
    if (checkbox.is(':checked')) {
        checkbox.prop('indeterminate', false);
        statusText.text('Virus Scan').removeClass().addClass('text-green text-16-nr');
    } else if (!checkbox.is(':checked') && checkbox.prop('indeterminate') !== true) {
        checkbox.prop('indeterminate', true);
        statusText.text('This file may contain viruses').removeClass().addClass('text-strong-red text-16-nr');
    }
});



 $('.calendar-icon').on('click', function (e) {
    e.stopPropagation();
    const $filterDropdown = $(this).closest('.filterDropdown');
    const $container = $filterDropdown.closest('.dropdown');
    $filterDropdown.addClass('hidden');
    $container.find('.datepicker-container').removeClass('hidden');
  });

  
  $(document).on('click', '.datepicker-container [data-date]', function () {    
    const selectedDate = $(this).attr('data-date');
    console.log("Selected Date:", selectedDate);   
    $('.datepicker-container').addClass('hidden');
  }); 
  $(document).on('click', function (e) {
    if (!$(e.target).closest('.datepicker-container, .calendar-icon').length) {
      $('.datepicker-container').addClass('hidden');
      $('.filterDropdown').addClass('hidden');
    }
  });
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

$('#register-form').on('submit', function(e) {
    e.preventDefault();
    // Clear all previous errors and error classes
    $('.error-message').text('').removeClass('text-xs text-dark-red');
    $('.border-dark-red').removeClass('border-dark-red');
    $('.placeholder\\:text-semi-transparent-red').removeClass('placeholder:text-semi-transparent-red');
    $('label.text-dark-red').removeClass('text-dark-red');

    var pwd = $('[name="password"]').val();
    var cpwd = $('[name="confirm_password"]').val();
    if (pwd !== cpwd) {
        var $field = $('[name="confirm_password"]');
        $('[data-error-for="confirm_password"]')
            .text('Passwords do not match.')
            .addClass('text-xs text-dark-red');
        $field
            .addClass('border-dark-red placeholder:text-semi-transparent-red')
            .removeClass('border-primary-color placeholder:text-blue-teal');
        $field.prev('label').addClass('text-dark-red');
        toastr.error('Passwords do not match.');
        return;
    }
    if (!$('[name="terms"]').is(':checked')) {
        $('[data-error-for="terms"]')
            .text('You must agree to the terms.')
            .addClass('text-xs text-dark-red');
        toastr.error('You must agree to the terms.');
        return;
    }

    var formType = $(this).data('type');
    var formData = new FormData(this);
    $.ajax({
        url: '/register/save/' + formType + '/',
        type: 'POST',
        headers: { 'X-CSRFToken': csrftoken },
        data: formData,
        processData: false,
        contentType: false,
        success: function(resp) {
            if (resp.success) {
                toastr.success(resp.message || 'Registration successful!');
                setTimeout(function() {
                    window.location.href = "/register/";
                }, 1200);
            } else if (resp.errors) {
                // Loop through errors, apply classes/styles just like jQuery Validate
                $.each(resp.errors, function(field, message) {
                    var $input = $('[name="' + field + '"]');
                    $('[data-error-for="' + field + '"]')
                        .text(message)
                        .addClass('text-xs text-dark-red');
                    $input
                        .addClass('border-dark-red placeholder:text-semi-transparent-red')
                        .removeClass('border-primary-color placeholder:text-blue-teal');
                    $input.prev('label').addClass('text-dark-red');
                });
                toastr.error("Please correct the highlighted errors.");
            } else {
                toastr.error(resp.error || "Registration failed.");
            }
        },
        error: function(xhr) {
            if (xhr.responseJSON && xhr.responseJSON.errors) {
                $.each(xhr.responseJSON.errors, function(field, message) {
                    var $input = $('[name="' + field + '"]');
                    $('[data-error-for="' + field + '"]')
                        .text(message)
                        .addClass('text-xs text-dark-red');
                    $input
                        .addClass('border-dark-red placeholder:text-semi-transparent-red')
                        .removeClass('border-primary-color placeholder:text-blue-teal');
                    $input.prev('label').addClass('text-dark-red');
                });
                toastr.error("Please correct the highlighted errors.");
            } else {
                toastr.error("Server error. Try again.");
            }
        }
    });
});

$('#login-form').on('submit', function(e) {
    e.preventDefault();
    $('#email-error').text('');
    $('#password-error').text('');
    var email = $('#email').val().trim();
    var password = $('#password').val().trim();
    if (!email) {
        $('#email-error').text('Email is required.');
        toastr.error('Email is required.');
        return;
    }
    if (!password) {
        $('#password-error').text('Password is required.');
        toastr.error('Password is required.');
        return;
    }
    $.ajax({
        url: "{% url 'login_auth' %}",
        type: 'POST',
        headers: { 'X-CSRFToken': csrftoken },
        data: { email: email, password: password },
        success: function(resp) {
            if (resp.success) {
                toastr.success('Login successful!');
                setTimeout(function() {
                    window.location.href = resp.redirect || '/dashboard/';
                }, 1000);
            } else {
                if (resp.errors) {
                    if (resp.errors.email) $('#email-error').text(resp.errors.email);
                    if (resp.errors.password) $('#password-error').text(resp.errors.password);
                    toastr.error('Please correct the errors.');
                } else {
                    toastr.error(resp.error || "Login failed.");
                }
            }
        },
        error: function(xhr) {
            toastr.error("Server error. Try again.");
        }
    });
});



    
})
