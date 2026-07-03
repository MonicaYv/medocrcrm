$(document).ready(function () {

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

    // Country code js
   $('.code-dropdown').each(function() {
        const $dropdown = $(this);
        const $btn = $dropdown.find('.code-btn');
        const $options = $dropdown.find('.code-option');
        const $selectedCode = $btn.find('.selected-code');

        $.ajax({
            url: "https://restcountries.com/v3.1/all?fields=name,idd", 
            method: "GET",
            success: function (data) {
                const countryList = data
                    .filter(c => c.idd && c.idd.root)
                    .map(c => {
                        const name = c.name.common;
                        const code = c.idd.root + (c.idd.suffixes ? c.idd.suffixes[0] : "");
                        return { name, code };
                    })
                    .sort((a, b) => a.name.localeCompare(b.name));

                countryList.forEach(({ name, code }) => {
                    const isIndia = name === "India";
                    const optionHtml = `<div class="px-4 py-2 hover:bg-gray-100 cursor-pointer" data-code="${code}">${name} (${code})</div>`;
                    $options.append(optionHtml);

                    if (isIndia) {
                        $selectedCode.text(code);
                    }
                });
            },
            error: function () {
                $options.append(`<div class="px-4 py-2 text-red-500">Failed to load country codes</div>`);
            }
        });

        $options.on('click', 'div', function () {
            const code = $(this).data('code');
            $selectedCode.text(code);
            $options.addClass('hidden');
        });
    });
    // dropdown js
    // $('.dropdown-btn').on('click', function (e) {
    //     e.stopPropagation(); 
    //     const $dropdown = $(this).closest('.dropdown');
    //     $('.dropdown-option').not($dropdown.find('.dropdown-option')).hide(); 
    //     $dropdown.find('.dropdown-option').toggle(); 
    //     $(this).find(".dropdown-arrow").toggleClass("rotate-180");
    // });    
    
    // $('.dropdown-option div').on('click', function() {
    //     const selectedText = $(this).text();
    //     $(this).closest('.dropdown').find('.dropdown-btn .selected-value').text(selectedText);
    //     $(this).closest('.dropdown').find('.select-dropdown').val(selectedText);
    //     $('.dropdown-option').hide();
    //     $(".dropdown-arrow").removeClass("rotate-180");
    // });
    // $(document).on('click', function () {
    //     $('.dropdown-option').hide();
    //     $(".dropdown-arrow").removeClass("rotate-180");
    // });
    function storeOtpToken(token) {
        let $tokenInput = $('input[name="otp_token"]');
        if ($tokenInput.length === 0) {
            $tokenInput = $('<input type="hidden" name="otp_token" id="otp_token" class="otp-input">');
            $("form").append($tokenInput);
        }
        $tokenInput.attr("id", "otp_token").val(token);
    }

    function startResendTimer($btn) {
        let timeLeft = 30;
        $btn.addClass("disabled");
        const timer = setInterval(function () {
            const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
            const seconds = String(timeLeft % 60).padStart(2, '0');
            $btn.html(`Resend in ${minutes}:${seconds}`);
            timeLeft--;
            if (timeLeft < 0) {
                clearInterval(timer);
                $btn.removeClass("disabled").html("Resend");
            }
        }, 1000);
    }

    function sendOtp($btn, successMessage) {
        if ($btn.hasClass("disabled")) return;
        let email = $('input[name="email"]').val();
        if (!email) {
            toastr.error("Please enter your email address.");
            return;
        }
        $.ajax({
            url: "/user/otp/send",
            type: "POST",
            headers: { 'X-CSRFToken': csrftoken },
            data: { "email": email },
            beforeSend: function(){
                $btn.addClass("!bg-Dark-Cornflower-Blue disabled");
            },
            success: function (response) {
                toastr.success(successMessage || response.message);
                storeOtpToken(response.token);
                $('input[name="email"]').prop("readonly", true);
                $(".otp").removeClass("hidden");
            },
            error: function (response) {
                console.error("Failed to send OTP:", response);
                if (response.responseJSON && response.responseJSON.message) {
                    toastr.error(response.responseJSON.message);
                } else {
                    toastr.error("Something went wrong while sending OTP.");
                }
                $btn.removeClass("!bg-Dark-Cornflower-Blue disabled");
            }
        });
    }

    // resend
    $('.resend').on('click', function () {
        const $btn = $(this);
        if ($btn.hasClass("disabled")) return;
        sendOtp($btn, "OTP resent on mail");
        startResendTimer($btn);
    });
    // Send OTP
    // $(".send-otp").click(function () {
    //     sendOtp($(this));
    // Email OTP
    $(".send-otp-email").on("click", function () {
       sendOtp($(this));
    });

//    // Contact Person OTP
//     $(".send-otp-contact").on("click", function () {
//         toastr.info("Contact person OTP is not implemented yet.");
//     });


// $(".send-otp-contact").on("click", function () {

//     // Hospital email same hai
//     const email = $('input[name="email"]').val().trim();

//     if (!email) {
//         toastr.error("Please enter Hospital Email first.");
//         return;
//     }

//     // Hospital OTP already generated
//     if ($("input[name='otp_token']").val()) {

//         // Same OTP contact field me bhi use hoga
//         $("input[name='otp2']").val($("input[name='otp1']").val());

//         toastr.success("OTP has already been sent to the registered email.");

//         return;
//     }

//     // First time
//     $(".send-otp-email").trigger("click");
// });
// $(".send-otp-contact-pharmacy").click(function () {

//     let phone = $("input[name='contact_person_phone']").val();

//     if (!phone) {
//         toastr.error("Please enter Contact Person phone.");
//         return;
//     }

//     $.ajax({

//         url: "/user/send-contact-person-otp/",

//         type: "POST",

//         headers: {
//             "X-CSRFToken": csrftoken
//         },

//         data: {
//             phone: phone
//         },

//         success: function (response) {

//             $("#contact_otp_token").val(response.otp_token);

//             toastr.success(response.message);

//         },

//         error: function (xhr) {

//             toastr.error(xhr.responseJSON.message);

//         }

//     });

// });
// $(".send-otp-contact").on("click", function () {

//     let email = $("input[name='email']").val();

//     if (!email) {
//         toastr.error("Please enter Hospital Email.");
//         return;
//     }

//     $.ajax({

//         url: "/user/otp/send",

//         type: "POST",

//         headers: {
//             "X-CSRFToken": csrftoken
//         },

//         data: {
//             email: email
//         },

//         success: function(response){

//             $("input[name='contact_otp_token']").val(response.token);

//             toastr.success("Contact Person OTP sent.");

//         },

//         error:function(xhr){

//             toastr.error(xhr.responseJSON.message);

//         }

//     });

// });
let contactOtpSending = false;

// $(".send-otp-contact-pharmacy").off("click").on("click", function () {

$(".send-otp-contact-pharmacy").off("click").on("click", function () {
    console.log("Hospital Contact OTP Button Clicked");

    // let phone = $("input[name='contact_person_phone']").val();
    
    let phone = $("input[name='contact_person_phone']").val().trim();
    console.log("Phone =", phone);

    if (!phone) {
        toastr.error("Please enter Contact Person Phone.");
        return;
    }

    $.ajax({

        url: "/user/send-contact-person-otp/",

        type: "POST",

        headers: {
            "X-CSRFToken": csrftoken
        },

        data: {
            phone: phone
        },

        success: function(response){

            $("input[name='contact_otp_token']").val(response.otp_token);

            toastr.success(response.message);

        },

        error:function(xhr){

            toastr.error(xhr.responseJSON.message);

        }

    });

});
$(".send-otp-contact").off("click").on("click", function () {

    let phone = $("input[name='contact_phone']").val().trim();

    if (!phone) {
        toastr.error("Please enter Contact Person Phone.");
        return;
    }

    $.ajax({
        url: "/user/send-contact-person-otp/",
        type: "POST",
        headers: {
            "X-CSRFToken": csrftoken
        },
        data: {
            phone: phone
        },
        success: function (response) {

            $("input[name='contact_otp_token']").val(response.otp_token);

            toastr.success(response.message);

        },
        error: function (xhr) {

            toastr.error(xhr.responseJSON?.message || "Server error. Try again.");

        }
    });

});


    // Contact Person OTP
    // $(".send-otp-contact").on("click", function () {
    //     sendOtp($(this), "Contact person OTP sent successfully.");
    // });

//         const $btn = $(this);
//         if ($btn.hasClass("disabled")) return;
//         let email = $('input[name="email"]').val();
//         console.log(email)
//         if (!email) {
//             toastr.error("Please enter your email address.");
//             console.log(email.type)
//             return;
//         }
//         $.ajax({
//             url: "/user/otp/send",
//             type: "POST",
//             headers: { 'X-CSRFToken': csrftoken },
//             data: { "email": email },
//             beforeSend: function(){
//                 $btn.addClass("!bg-Dark-Cornflower-Blue disabled");
//             },
//             success: function (response) {
//                 console.log("Success")
//                 toastr.success(response.message);
//                 // Store token in hidden field
//                 if ($("#otp_token").length === 0) {
//                     $("form").append('<input type="hidden" id="otp_token" value="' + response.token + '">');
//                 } else {
//                     $("#otp_token").val(response.token);
//                 }
//                 // ✅ Make email readonly immediately after OTP is sent
//                 $('input[name="email"]').prop("readonly", true);

//                 $(".otp").removeClass("hidden");
//             },
//             error: function (response) {
//                 console.error("Failed to send OTP:", response);
//                 if (response.responseJSON && response.responseJSON.message) {
//                     toastr.error(response.responseJSON.message);
//                 } else {
//                     toastr.error("Something went wrong while sending OTP.");
//                 }
//             }
//         });
    // });
    // Verify OTP button
    $(".verify-otp").click(function () {
        let otp = $('input[name="otp1"]').val();
        let token = $("#otp_token").val();
        let email = $('input[name="email"]').val();

        if (!otp) {
            toastr.error("Please enter the OTP.");
            return;
        }

        if (!token) {
            toastr.error("OTP token missing. Please request OTP again.");
            return;
        }

        $.ajax({
            url: "/user/otp/verify",
            type: "POST",
            headers: { 'X-CSRFToken': csrftoken },
            data: {
                "otp": otp,
                "token": token,
                "email": email
            },
            success: function (response) {
                toastr.success(response.message);

                // Disable verify button to avoid re-clicks
                $(".verify-otp").prop("disabled", true).addClass("opacity-50 cursor-not-allowed");
            },
            error: function (response) {
                console.error("OTP verification failed:", response);
                if (response.responseJSON && response.responseJSON.message) {
                    toastr.error(response.responseJSON.message);
                } else {
                    toastr.error("Something went wrong while verifying OTP.");
                }
            }
        });
    });
    // //Permission Access
    // // Show popup on upload trigger click
    // let lastClickedTrigger = null;
    // let uploadConfirmShown = false;

    // // Show popup on upload trigger click
    // document.querySelectorAll(".uploadTrigger").forEach((trigger) => {
    //     trigger.addEventListener("click", function () {
    //     lastClickedTrigger = this; // store the clicked trigger
    //     if (!uploadConfirmShown) {
    //         // Show popup only once
    //         document.querySelector(".file-access-popup").classList.remove("hidden");
    //     } else {
    //         // Directly trigger input if already allowed
    //         const uploadSection = lastClickedTrigger.closest(".upload-section");
    //         const input = uploadSection.querySelector(".uploadInput");
    //         input.click();
    //         lastClickedTrigger = null;
    //     }
    //     });
    // });

    // // Hide popup on "No" click
    // document.querySelector(".deny-access").addEventListener("click", function () {
    //     document.querySelector(".file-access-popup").classList.add("hidden");
    //     lastClickedTrigger = null; // reset
    // });

    // // Allow file access and trigger file input on "Yes" click
    // document.querySelector(".allow-access").addEventListener("click", function () {
    //     document.querySelector(".file-access-popup").classList.add("hidden");
    //     uploadConfirmShown = true;

    //     if (lastClickedTrigger) {
    //         const uploadSection = lastClickedTrigger.closest(".upload-section");
    //         const input = uploadSection.querySelector(".uploadInput");
    //         input.click();
    //         lastClickedTrigger = null;
    //     }
    //     });

    // $('.uploadInput').on('change', function () {
    //     const file = this.files[0];
    //     if (!file) return;

    //     const $section = $(this).closest('.upload-section');
    //     const $display = $section.find('.upload-label-main');
    //     const $trigger = $section.find('.uploadTrigger');
    //     const $label = $trigger.find('.upload-label');
    //     const $icon = $trigger.find('.upload-icon');
            
    //     if (file.name) {
    //         // Show a success toaster when file is chosen
    //         toastr.success(`File uploaded successfully.`);
    //     } else {
    //         // Optional: show error toaster if no file selected
    //         toastr.error('No file selected.');
    //     }
    //     $label.text(file.name);
    //     $display.text(file.name)

    //     $icon.text('imagesmode').removeClass('text-primary-color').addClass('text-bright-green');
        
    //     $section.find('.remove-file-btn').removeClass('hidden');
    //     $('.remove-file-btn').on('click', function () {
    //         const $wrapper = $(this).closest('.upload-section');
    //         const $fileInput = $wrapper.find('.uploadInput');

            
    //         $fileInput.val('');

            
    //         $wrapper.find('.upload-label').text('');
    //         $wrapper.find('.upload-icon')
    //             .text('upload')
    //             .removeClass('text-green-600')
    //             .addClass('text-primary-color');

    //         $(this).addClass('hidden');
    //     });
    // });

// ===================== PERMISSION ACCESS =====================
let lastClickedTrigger = null;
let uploadConfirmShown = false;

document.querySelectorAll(".uploadTrigger").forEach((trigger) => {
    trigger.addEventListener("click", function () {
        lastClickedTrigger = this;
        const popup = document.querySelector(".file-access-popup");
        if (!popup) return; // safety check for pages without popup

        if (!uploadConfirmShown) {
            popup.classList.remove("hidden");
        } else {
            const uploadSection = lastClickedTrigger.closest(".upload-section");
            const input = uploadSection.querySelector(".uploadInput");
            input.click();
            lastClickedTrigger = null;
        }
    });
});

const denyBtn = document.querySelector(".deny-access");
const allowBtn = document.querySelector(".allow-access");

if (denyBtn) {
    denyBtn.addEventListener("click", function () {
        document.querySelector(".file-access-popup").classList.add("hidden");
        lastClickedTrigger = null;
    });
}

if (allowBtn) {
    allowBtn.addEventListener("click", function () {
        document.querySelector(".file-access-popup").classList.add("hidden");
        uploadConfirmShown = true;

        if (lastClickedTrigger) {
            const uploadSection = lastClickedTrigger.closest(".upload-section");
            const input = uploadSection.querySelector(".uploadInput");
            input.click();
            lastClickedTrigger = null;
        }
    });
}

// ===================== FILE UPLOAD + VIRUS SCAN =====================
$('.uploadInput').on('change', function () {
    const file = this.files[0];
    if (!file) return;

    const $input = $(this);
    const $section = $input.closest('.upload-section');
    const $display = $section.find('.upload-label-main');
    const $trigger = $section.find('.uploadTrigger');
    const $label = $trigger.find('.upload-label');
    const $icon = $trigger.find('.upload-icon');
    const $statusText = $section.nextAll('.flex').first().find('.status-text');
    const $checkbox = $section.nextAll('.flex').first().find('.scan-toggle');

    // File type check
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        toastr.error('Only JPG, PNG, or PDF files are allowed.');
        $input.val('');
        $statusText.text('❌ Invalid file type').removeClass().addClass('text-strong-red text-16-nr');
        $checkbox.prop('checked', false).prop('indeterminate', false);
        return;
    }

    // Show scanning state immediately
    $statusText.text('Scanning...').removeClass().addClass('text-primary-color text-16-nr');
    $checkbox.prop('indeterminate', true);

    // Virus scan API call
    const formData = new FormData();
    formData.append('file', file);

    $.ajax({
        url: '/user/file-scan/',
        type: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        data: formData,
        processData: false,
        contentType: false,
        success: function (response) {
            if (response.safe) {
                // ✅ Safe — update UI
                $statusText.text('✅ ' + (response.message || 'File is safe'))
                    .removeClass().addClass('status-text text-green text-16-nr');
                $checkbox.prop('indeterminate', false).prop('checked', true);

                // Show filename + icon
                if ($label.length) {
                    $label.text(file.name);
                }

                if ($display.length) {
                    if ($display.is("input")) {
                        $display.val(file.name);
                    } else {
                        $display.text(file.name);
                    }
                }
                $icon.text('imagesmode').removeClass('text-primary-color').addClass('text-bright-green');
                $section.find('.remove-file-btn').removeClass('hidden');

                toastr.success('File uploaded successfully.');
            } else {
                // ❌ Unsafe — reject file
                $statusText.text('❌ ' + (response.message || 'File may be unsafe'))
                    .removeClass().addClass('status-text text-strong-red text-16-nr');
                $checkbox.prop('indeterminate', false).prop('checked', false);
                $input.val('');
                toastr.error(response.message || 'File failed virus scan.');
            }
        },
        error: function () {
            $statusText.text('⚠️ Scan failed. Try again.')
                .removeClass().addClass('text-strong-red text-16-nr');
            $checkbox.prop('indeterminate', true);
            $input.val('');
            toastr.error('Virus scan service unavailable.');
        }
    });
});

// Remove file button
$(document).on('click', '.remove-file-btn', function () {
    const $wrapper = $(this).closest('.upload-section');
    const $fileInput = $wrapper.find('.uploadInput');
    const $statusText = $wrapper.nextAll('.flex').first().find('.status-text');
    const $checkbox = $wrapper.nextAll('.flex').first().find('.scan-toggle');

    // Clear file
    $fileInput.val('');

    // Clear displayed filename
    $wrapper.find('.upload-label').text('');
    $wrapper.find('.upload-label-main').val('');

    // Reset icon
    $wrapper.find('.upload-icon')
        .text('upload')
        .removeClass('text-bright-green')
        .addClass('text-primary-color');

    // Reset virus scan status
    $statusText
        .removeClass()
        .addClass('status-text text-primary-color text-16-nr')
        .text('Virus scan');

    // Reset checkbox
    $checkbox
        .prop('checked', false)
        .prop('indeterminate', false);

    // Hide remove button
    $(this).addClass('hidden');
});
// $(document).on('click', '.remove-file-btn', function () {

//     const $wrapper = $(this).closest('.upload-section');

//     console.log("Wrapper:", $wrapper);

//     console.log(
//         "Next flex:",
//         $wrapper.nextAll('.flex').first()
//     );

//     const $statusText =
//         $wrapper.nextAll('.flex').first().find('.status-text');

//     const $checkbox =
//         $wrapper.nextAll('.flex').first().find('.scan-toggle');

//     console.log("Status found:", $statusText.length);
//     console.log("Checkbox found:", $checkbox.length);

// });

// Prevent manual toggling of scan checkboxes
$(document).on('click', '.scan-toggle', function (e) {
    e.preventDefault();
});
    // Toggle dropdown time trigger visibility
//Dropdowns code
  const dropdownConfig = {
  singleSelect: ["Timing", "Opening Time", "Closing Time", "Opening Days", "Type of Medical Provider", "Home Visit", "Experience", "Gender", "Specialization","Advertiser Type"],
  multiSelect: ["Services", "Facilities"],
};
function isSingleSelect($dropdown) {
  const labelText = $dropdown.find("> label").text();
  return dropdownConfig.singleSelect.some((keyword) =>
    labelText.includes(keyword)
  );
}
function getPlaceholderText($dropdown) {
  const labelText = $dropdown.find("> label").text();
  if (labelText.includes("Timing") || labelText.includes("Time")) {
    return "Select Time";
  }
  if (labelText.includes("Services") || labelText.includes("Service")) {
    return "Select Service";
  }
  if (labelText.includes("Facilities") || labelText.includes("Facility")) {
    return "Select Facility";
  }
  return "Select Option";
}
$(".dropdown-btn").on("click", function (e) {
  e.stopPropagation();
  const $dropdown = $(this).closest(".dropdown");
  const $currentOption = $dropdown.find(".dropdown-option");
  $(".dropdown-option").not($currentOption).hide();
  $(".dropdown-arrow")
    .not($(this).find(".dropdown-arrow"))
    .removeClass("rotate-180");
  $currentOption.toggle();
  $(this).find(".dropdown-arrow").toggleClass("rotate-180");
});

// Handle checkbox selection
$(document).on("change", ".dropdown-option input[type='checkbox']", function (e) {
  e.stopPropagation();
  const $dropdown = $(this).closest(".dropdown");
  if (isSingleSelect($dropdown)) {
    $dropdown.find("input[type='checkbox']").not(this).prop("checked", false);
  }

  updateSelectedText($dropdown);
});


$(".dropdown-option").on("click", function (e) {
  e.stopPropagation();
});
$(document).on("click", ".dropdown-option label", function (e) {
  e.stopPropagation();
  if ($(this).text().trim() === "Type...") {
    showCustomInput($(this).closest(".dropdown"));
    return;
  }
  let checkbox = $(this).prev('input[type="checkbox"]');
  if (checkbox.length === 0) {
    checkbox = $(this).next('input[type="checkbox"]');
  }
  if (checkbox.length) {
    checkbox.prop("checked", !checkbox.prop("checked")).trigger("change");
  }
});
function showCustomInput($dropdown) {
  const $typeOption = $dropdown.find("label:contains('Type...')").parent();
  if ($typeOption.find("input[type='text']").length > 0) {
    $typeOption.find("input[type='text']").focus();
    return;
  }
  const $input = $(
    '<input type="text" class="custom-input flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-Royal-indigo" placeholder="Enter custom service...">'
  );

  $typeOption.html("").append($input);
  $input.focus();
  $input.on("blur keypress", function (e) {
    if (e.type === "blur" || (e.type === "keypress" && e.which === 13)) {
      const value = $(this).val().trim();

      if (value) {
        const customId = "custom_" + Date.now();
        const $newOption = $(`
          <div class="px-4 py-2 flex items-center hover:bg-gray-100 cursor-pointer custom-service">
            <input type="checkbox" id="${customId}" class="mr-2 accent-Royal-indigo" checked>
            <label for="${customId}" class="flex-1">${value}</label>
            <span class="material-symbols-outlined text-sm text-red-500 remove-custom cursor-pointer">close</span>
          </div>
        `);
        $typeOption.before($newOption);
        $typeOption.html('<label class="flex-1">Type...</label>');
        attachCustomOptionHandlers($newOption, $dropdown);
        updateSelectedText($dropdown);
      } else {
        $typeOption.html('<label class="flex-1">Type...</label>');
      }
    }
  });

  // Prevent input click from closing dropdown
  $input.on("click", function (e) {
    e.stopPropagation();
  });
}

// Attach handlers to custom options
function attachCustomOptionHandlers($option, $dropdown) {
  $option.find("input[type='checkbox']").on("change", function (e) {
    e.stopPropagation();
    if (isSingleSelect($dropdown)) {
      $dropdown
        .find("input[type='checkbox']")
        .not(this)
        .prop("checked", false);
    }

    updateSelectedText($dropdown);
  });

  // Handle label click
  $option.find("label").on("click", function (e) {
    e.stopPropagation();
    let checkbox = $(this).prev('input[type="checkbox"]');
    if (checkbox.length === 0) {
      checkbox = $(this).next('input[type="checkbox"]');
    }
    if (checkbox.length) {
      checkbox.prop("checked", !checkbox.prop("checked")).trigger("change");
    }
  });

  // Handle remove button
  $option.find(".remove-custom").on("click", function (e) {
    e.stopPropagation();
    $option.remove();
    updateSelectedText($dropdown);
  });
}

// Update selected text based on checked items
function updateSelectedText($dropdown) {
  const $checkedBoxes = $dropdown.find(
    ".dropdown-option input[type='checkbox']:checked"
  );
  const $selectedValue = $dropdown.find(".dropdown-btn .selected-value");

  if ($checkedBoxes.length === 0) {
    $selectedValue.text(getPlaceholderText($dropdown));
  } else if ($checkedBoxes.length === 1) {
    let labelText = $checkedBoxes.first().prev("label").text().trim();
    if (!labelText) {
      labelText = $checkedBoxes.first().next("label").text().trim();
    }
    $selectedValue.text(labelText);
  } else {
    $selectedValue.text($checkedBoxes.length + " selected");
  }
}

// Handle simple dropdown (non-checkbox) selection
$('.dropdown-option div:not(:has(input[type="checkbox"]))').on('click', function(e) {
  e.stopPropagation();
  const selectedText = $(this).text().trim();
  const $dropdown = $(this).closest('.dropdown');
  $dropdown.find('.dropdown-btn .selected-value').text(selectedText);
  $dropdown.find('.select-dropdown').val(selectedText);
  $dropdown.find('.dropdown-option').hide();
  $dropdown.find(".dropdown-arrow").removeClass("rotate-180");
});

// Close dropdowns when clicking outside
$(document).on("click", function () {
  $(".dropdown-option").hide();
  $(".dropdown-arrow").removeClass("rotate-180");
});

    // Time picker trigger
    document.querySelectorAll(".trigger-time").forEach(function (trigger) {
        trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        const targetId = this.getAttribute("data-target");
        const timeInput = document.getElementById(targetId);
        if (timeInput) {
            timeInput.showPicker();
        }
        });
    });

    // Update dropdown display when time is selected (using input event for immediate update)
    document.querySelectorAll('input[type="time"]').forEach(function (timeInput) {
        console.log('Setting up time input listener for:', timeInput.id, timeInput.value);
        
        timeInput.addEventListener("input", function () {
        updateTimeDisplay(this);
        console.log('Time input changed:', this.id, this.value);
        });

        // Also handle change event for browser compatibility
        timeInput.addEventListener("change", function () {
        updateTimeDisplay(this);
        console.log('Time input changed:', this.id, this.value);
        });
    });

    function updateTimeDisplay(timeInput) {
        const dropdown = timeInput.closest(".dropdown");
        if (dropdown) {
        const selectedValue = dropdown.querySelector(".selected-value");
        if (selectedValue && timeInput.value) {
            // Format the time for display (e.g., "09:00 AM")
            const timeParts = timeInput.value.split(":");
            let hours = parseInt(timeParts[0]);
            const minutes = timeParts[1];
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12;
            hours = hours ? hours : 12; // Convert 0 to 12
            const formattedTime = hours + ":" + minutes + " " + ampm;

            selectedValue.textContent = formattedTime;
        }
        }
  }

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
        if (!e.target.closest(".dropdown")) {
        document.querySelectorAll(".dropdown-option").forEach(function (option) {
            option.classList.add("hidden");
        });
        }
    });

    // Close dropdown when time is selected (optional)
    document.querySelectorAll('input[type="time"]').forEach(function (timeInput) {
        timeInput.addEventListener("change", function () {
        const dropdownOption = this.closest(".dropdown-option");
        if (dropdownOption) {
            setTimeout(() => {
            dropdownOption.classList.add("hidden");
            }, 200); // Small delay to ensure time is displayed
        }
        });
    });

// ------------------ OPEN POPUP ------------------
$('#selfie-icon').on('click', function () {
    $('#camera-popup').removeClass('hidden');
    startCamera();
    $('#capture-btn').next("p").text('Capture');
});

// ------------------ CLOSE POPUP ------------------
$('#close-popup').on('click', function () {
    $('#camera-popup').addClass('hidden');
    stopCamera();
    resetCapture();
});

// ------------------ UPLOAD BUTTON → Open File Input ------------------
$('#upload-btn').on('click', function () {
    $('#selfie-input').click();
});

// ------------------ HANDLE FILE UPLOAD ------------------
$('#selfie-input').on('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            $('#captured-photo').attr('src', e.target.result);
            $('#uploaded-photo').removeClass('hidden');
            $('#save-btn').removeClass('hidden');
            $(".capture-polygon").hide();

            stopCamera();
            $('#video').hide();

            $('#capture-btn').next("p").text('Camera');
        };
        reader.readAsDataURL(file);
    }
});

// ------------------ CAPTURE PHOTO FROM CAMERA ------------------
$('#capture-btn').on('click', function () {
    let mode = $(this).next("p").text();

    if (mode === 'Capture') {
        const video = document.getElementById('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (!blob) return;

            const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });

            // IMPORTANT: Attach file to hidden input for backend
            let dt = new DataTransfer();
            dt.items.add(file);
            document.getElementById("selfie-input").files = dt.files;

            // Preview the captured image
            $('#captured-photo').attr('src', URL.createObjectURL(file));
            $('#uploaded-photo').removeClass('hidden');
            $('#save-btn').removeClass('hidden');

            stopCamera();
            $('#video').hide();
            $(".capture-polygon").hide();

            $('#capture-btn').next("p").text('Retake');
        }, "image/jpeg");

    } else { 
        // RETAKE
        resetCapture();
        startCamera();
    }
});

// ------------------ SAVE BUTTON ------------------
$('#save-btn').on('click', function () {
    const fileInput = document.getElementById("selfie-input");
    const fileName = fileInput.files[0]?.name || "Captured Photo";

    $('#selfie-label').text(fileName).addClass("!text-green-400");

    $('#camera-popup').addClass('hidden');
    stopCamera();
});

// ------------------ CAMERA CONTROL ------------------
function startCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                let video = document.getElementById('video');
                video.srcObject = stream;
                video.play();
            })
            .catch(err => {
                console.log('Camera error:', err);
                alert("Unable to access camera.");
            });
    }
}

function stopCamera() {
    const video = document.getElementById('video');
    const stream = video.srcObject;
    const tracks = stream?.getTracks();

    tracks?.forEach(track => track.stop());
    video.srcObject = null;
}

// ------------------ RESET ------------------
function resetCapture() {
    $('#captured-photo').attr('src', '');
    $('#uploaded-photo').addClass('hidden');
    $('#save-btn').addClass('hidden');
    $('#capture-btn').next("p").text('Capture');
    $(".capture-polygon").show();
    $('#video').show();

    // Clear file input
    document.getElementById("selfie-input").value = "";
}
});
