$(document).ready(function () {

    // Country code js
    const $dropdown = $('.code-dropdown');
    const $btn = $dropdown.find('.code-btn');
    const $options = $dropdown.find('.code-option');
    const $selectedCode = $btn.find('.selected-code');

    $.ajax({
        url: "https://restcountries.com/v3.1/all",
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

    $btn.on('click', function () {
        $options.toggleClass("hidden");
    });

    $options.on('click', 'div', function () {
        const code = $(this).data('code');
        $selectedCode.text(code);
        $options.addClass('hidden');
    });
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.code-dropdown').length) {
            $options.addClass('hidden');
        }
    });
    // dropdown js
    $('.dropdown-btn').on('click', function (e) {
        e.stopPropagation(); 
        const $dropdown = $(this).closest('.dropdown');
        $('.dropdown-option').not($dropdown.find('.dropdown-option')).hide(); 
        $dropdown.find('.dropdown-option').toggle(); 
        $(this).find(".dropdown-arrow").toggleClass("rotate-180");
    });    
    
    $('.dropdown-option div').on('click', function() {
        const selectedText = $(this).text();
        $(this).closest('.dropdown').find('.dropdown-btn .selected-value').text(selectedText);
        $(this).closest('.dropdown').find('.select-dropdown').val(selectedText);
        $('.dropdown-option').hide();
        $(".dropdown-arrow").removeClass("rotate-180");
    });
    $(document).on('click', function () {
        $('.dropdown-option').hide();
        $(".dropdown-arrow").removeClass("rotate-180");
    });
    
    // password hide/unhide
    $('.togglePassword').on('click', function () {
        const targetId = $(this).data('target');
        const passwordField = $('#' + targetId);
        if (passwordField.length) {
          const type = passwordField.attr('type') === 'password' ? 'text' : 'password';
          passwordField.attr('type', type);     
          $(this).text(type === 'password' ? 'visibility' : 'visibility_off');
        }
      }); 
    // resend
    $('.resend').on('click', function () {
        const $btn = $(this);
        let timeLeft = 30;
        $btn.off('click');
        const timer = setInterval(function () {
            const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
            const seconds = String(timeLeft % 60).padStart(2, '0');
            $btn.html(`Resend in ${minutes}:${seconds}`);
            timeLeft--;
            if (timeLeft < 0) {
                clearInterval(timer);
                $(".otp").html("Code resent").addClass("!text-bright-green");
                setTimeout(function () {
                    $(".otp").html("Try again in 60 seconds").addClass("!text-dark-red");
                    $btn.on('click', arguments.callee);
                }, 2000);
            }
        }, 1000);
    });
    //otp message
    $(".send-otp").click(function(){
        $(this).addClass("!bg-Dark-Cornflower-Blue");
        $(this).closest('.otp-div').find('.otp-message').html(`
            <div class="flex items-center gap-2 text-bright-green cursor-pointer">
                <div class="h-4 w-4 flex items-center justify-center bg-bright-green rounded">
                    <span class="material-symbols-outlined text-white !text-sm">check</span>
                </div>
              <p>Verified</p>
            </div>
          `);
    })
    //Permission Access
    $('.uploadTrigger').on('click', function () {
        if (confirm("This site wants to access your files to upload an image. Do you allow?")) {
          $(this).closest('.upload-section').find('.uploadInput').trigger('click');
        }
      });
});
