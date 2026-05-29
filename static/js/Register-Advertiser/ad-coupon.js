$(document).ready(function () {
    // Toggle dropdown on input click
    $(document).on('click', '.dropdown-input, .material-symbols-outlined:contains("keyboard_arrow_down")', function (e) {
        e.stopPropagation(); // Prevent triggering document click
        const $wrapper = $(this).closest('.dropdown-wrapper');
        $('.dropdown-list').not($wrapper.find('.dropdown-list')).hide(); // Hide other dropdowns
        $wrapper.find('.dropdown-list').toggle();
    });

    // Select option
    $(document).on('click', '.dropdown-list div', function (e) {
        e.stopPropagation();
        const $wrapper = $(this).closest('.dropdown-wrapper');
        const selectedText = $(this).text();
        const selectedID = $(this).attr('data-value');
        if (selectedID === "custom") {
        // Custom option
        $wrapper.find('.dropdown-input').val('').focus();
        } else {
            $wrapper.find('.dropdown-input').val(selectedText);
        }
        $wrapper.find('.dropdown-input-hidden').val(selectedID);
        $wrapper.find('.dropdown-list').hide();
        console.log('Selected:', selectedID);
    });

    // Hide dropdown on outside click
    $(document).on('click', function () {
        $('.dropdown-list').hide();
    });


    // Calendar
    let selectedDate = null;

    $('.custom-date-trigger').on('click', function () {
        var $wrapper = $(this).closest('.calendar-wrapper');
        var $input = $wrapper.find('.custom-date-range');

        // Destroy any previous instance
        if ($input.data('daterangepicker')) {
            $input.data('daterangepicker').remove();
        }

        // Initialize daterangepicker correctly inside the wrapper
        $input.daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            autoUpdateInput: false,
            parentEl: $wrapper,  
            drops: 'up',
            opens: 'center',
            locale: {
                format: 'DD/MM/YYYY',
                cancelLabel: 'Clear'
            }
        });

        // Open the picker safely
        $input.trigger('click');

        // Clean and re-bind
        $input.off('apply.daterangepicker cancel.daterangepicker');

        $input.on('apply.daterangepicker', function (e, picker) {
            const formattedDate = picker.startDate.format('DD/MM/YYYY');
            selectedDate = formattedDate;
            $wrapper.find('.selected-date').text(formattedDate);
            // Set the value in the validity input
            $('input[name="validity"]').val(formattedDate);
            console.log('DEBUG: Validity set to', formattedDate);
        });

        $input.on('cancel.daterangepicker', function (e, picker) {
            selectedDate = null;
            $wrapper.find('.selected-date').text('DD/MM/YY');
            $('input[name="validity"]').val('');
            console.log('DEBUG: Validity cleared');
        });
    });

    // 1. Upload area click to trigger file input
    $('.upload-area').on('click', function (e) {
        const previewVisible = $(this).find('.upload-preview').is(':visible');
        if (
            !previewVisible &&
            !$(e.target).is('input[type="file"]') &&
            !$(e.target).hasClass('cancel-upload')
        ) {
            $(this).find('input[type="file"]').trigger('click');
        }
    });

    function showCouponUploadPreview(input, file) {
        const area = $(input).closest('.upload-area');
        const preview = area.find('.upload-preview');
        const placeholder = area.find('.upload-placeholder');
        const imagePreview = preview.find('.uploaded-img');
        const videoPreview = preview.find('.uploaded-video');
        const fileName = preview.find('.uploaded-file-name');
        const fileUrl = URL.createObjectURL(file);

        imagePreview.addClass('hidden').attr('src', '');
        videoPreview.addClass('hidden').attr('src', '');
        fileName.text(file.name);

        if (file.type.startsWith('image/')) {
            imagePreview.attr('src', fileUrl).removeClass('hidden');
        } else if (file.type === 'video/mp4') {
            videoPreview.attr('src', fileUrl).removeClass('hidden');
        } else {
            toastr.error('Please upload a JPG, PNG, or MP4 file.');
            $(input).val('');
            return;
        }

        placeholder.addClass('hidden');
        preview.removeClass('hidden').addClass("flex flex-col items-center justify-center");
    }

    function setPopupMedia($popup, mediaUrl) {
        const isVideo = mediaUrl && mediaUrl.toLowerCase().split('?')[0].endsWith('.mp4');
        const $image = $popup.find('.popup-image');
        const $video = $popup.find('.popup-video');

        if (isVideo) {
            $image.addClass('hidden').attr('src', '');
            $video.removeClass('hidden').attr('src', mediaUrl);
        } else {
            $video.addClass('hidden').attr('src', '');
            $image.removeClass('hidden').attr('src', mediaUrl || '');
        }
    }

    // 2. Drag and drop handling
    $('.upload-area').on('dragover', function (e) {
        e.preventDefault();
    });

    $('.upload-area').on('dragleave', function (e) {
        e.preventDefault();
    });

    $('.upload-area').on('drop', function (e) {
        e.preventDefault();
        const file = e.originalEvent.dataTransfer.files[0];
        if (file && (file.type.startsWith('image/') || file.type === 'video/mp4')) {
            const fileInput = $(this).find('input[type="file"]')[0];
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            $(fileInput).trigger('change');
        } else if (file) {
            toastr.error('Please upload a JPG, PNG, or MP4 file.');
        }
    });

    // 3. Change image
    $('.upload-area').on('click', '.change-image-btn', function (e) {
        e.stopPropagation();
        const area = $(this).closest('.upload-area');
        area.find('input[type="file"]').trigger('click');
    });

    // 4. File input change handler
    $('.upload-input').on('change', function () {
        const file = this.files[0];
        if (!file) return;
        showCouponUploadPreview(this, file);
    });

    // 5. Cancel upload
    $('.upload-area').on('click', '.cancel-upload', function (e) {
        e.stopPropagation(); // Prevent triggering upload
        const area = $(this).closest('.upload-area');
        const input = area.find('input[type="file"]');
        const preview = area.find('.upload-preview');
        const placeholder = area.find('.upload-placeholder');

        // Reset
        input.val('');
        preview.find('.uploaded-img').attr('src', '').removeClass('hidden');
        preview.find('.uploaded-video').attr('src', '').addClass('hidden');
        preview.find('.uploaded-file-name').text('');
        preview.addClass('hidden').removeClass("flex");
        placeholder.removeClass('hidden');
    });

    // Title and Description Change

    const tabData = {
        "new-coupon": {
            icon: "upload",
            title: "Coupons",
            description: "Boost Your Sales—Post New Coupons for Users!"
        },
        "coupon-history": {
            icon: "upload",
            title: "Coupons",
            description: "Boost Your Sales—Post New Coupons for Users!"
        },
        "saved-coupon-history": {
            icon: "upload",
            title: "Coupons",
            description: "Boost Your Sales—Post New Coupons for Users!"
        }
    };

    // Click event for tabs
    $('.tab-btn-adv').click(function () {

        // Get data-tab
        const tabKey = $(this).data('tab');

        // Update icon, title, description
        if (tabData[tabKey]) {
            $('.tab-icon').text(tabData[tabKey].icon);
            $('.tab-title').text(tabData[tabKey].title);
            $('.tab-description').text(tabData[tabKey].description);
        }
    });

    // Open popup on icon click
    $(document).on('click', '[data-popup]', function (e) {
    e.stopPropagation();
    var popupType = $(this).data('popup');

    // Always hide all popups first
    $('.download-popup').addClass('hidden').removeClass("flex");
    $('.preview-popup').addClass('hidden').removeClass("flex");

    if (popupType === 'preview') {
        var couponId = $(this).data('coupon-id');
        if (couponId) {
            $.get('/coupons/coupon_detail/' + couponId + '/', function(data) {
                // Populate preview popup
                $('.preview-popup .popup-id').text(data.id);
                $('.preview-popup .popup-issued-by').text(data.uploaded_by);
                $('.preview-popup .popup-uploaded-on').text(data.uploaded_on);
                $('.preview-popup .popup-title').text(data.title);
                setPopupMedia($('.preview-popup'), data.image_url);
                $('.preview-popup .popup-age').text(data.age_group);
                $('.preview-popup .popup-gender').text(data.gender);
                $('.preview-popup .popup-city').text(data.city);
                $('.preview-popup .popup-spending').text(data.spending_power);
                $('.preview-popup .popup-category').text(data.category);
                $('.preview-popup .popup-brand').text(data.brand_name);
                $('.preview-popup .popup-offer-type').text(data.offer_type);
                $('.preview-popup .popup-issued').text(data.max_redemptions);
                $('.preview-popup .popup-redeemed').text(data.redeemed_count);
                $('.preview-popup .popup-validity').text(data.validity);
                $('.preview-popup .popup-status').text(data.status);
                $('.preview-popup .popup-description').text(data.description);

                // Show the preview popup
                $('.preview-popup').removeClass('hidden').addClass('flex');
            });
        }
    } else if (popupType === 'download') {
        var couponId = $(this).data('coupon-id');
        if (couponId) {
            $.get('/coupons/coupon_detail/' + couponId + '/', function(data) {
                // Populate download popup
                $('.download-popup .popup-id').text(data.id);
                $('.download-popup .popup-issued-by').text(data.uploaded_by);
                $('.download-popup .popup-uploaded-on').text(data.uploaded_on);
                $('.download-popup .popup-title').text(data.title);
                setPopupMedia($('.download-popup'), data.image_url);
                $('.download-popup .popup-age').text(data.age_group);
                $('.download-popup .popup-gender').text(data.gender);
                $('.download-popup .popup-city').text(data.city);
                $('.download-popup .popup-spending').text(data.spending_power);
                $('.download-popup .popup-category').text(data.category);
                $('.download-popup .popup-brand').text(data.brand_name);
                $('.download-popup .popup-offer-type').text(data.offer_type);
                $('.download-popup .popup-issued').text(data.max_redemptions);
                $('.download-popup .popup-redeemed').text(data.redeemed_count);
                $('.download-popup .popup-validity').text(data.validity);
                $('.download-popup .popup-status').text(data.status);
                $('.download-popup .popup-description').text(data.description);

                // Show the download popup
                $('.download-popup').removeClass('hidden').addClass('flex');
            });
        }
    }
    });

    // Close popup on close button click
    $(document).on('click', '.close-popup', function () {
        $(this).closest('.popup').addClass('hidden').removeClass("flex");
    });

    // Close popup on outside click
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.download-popup, [data-popup]').length) {
            $('.download-popup').addClass('hidden').removeClass("flex");
        }
    });

    const exportBtn = $('.export-btn');

    exportBtn.on('click', function () {
        $('.preview-popup').removeClass('hidden').addClass('flex');
    })

    $(document).on('click', '.download-btn', function (event) {
        event.stopPropagation();
        // Find the next sibling with class 'download-container'
        const $container = $(this).closest('.popup').find('.download-container');

        if ($container.length === 0) {
            console.error('[ERROR] download-container not found');
            return;
        }

        // Clone the element properly
        const clone = $container[0].cloneNode(true);
        clone.style.position = 'static';
        clone.style.visibility = 'visible';
        clone.style.display = 'block';
        clone.style.zIndex = '1';
        clone.id = 'download-container-clone';
        document.body.appendChild(clone);
    
        const opt = {
            margin:       0,
            filename:     'coupon-details.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0, scrollX: 0 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
    
        html2pdf().set(opt).from(clone).save()
            .then(() => {
                document.body.removeChild(clone);
            })
            .catch(err => {
                console.error('[ERROR] PDF generation failed:', err);
                document.body.removeChild(clone);
            });
    });

    $(document).on('click', '.saved-icon', function () {
        const $icon = $(this);
        const couponId = $icon.data('coupon-id');
        const isSaved = $icon.attr('data-saved') === 'true';
        const action = isSaved ? 'unsave' : 'save';

        // Optimistic UI toggle
        if (isSaved) {
            $icon.removeClass('material-filled text-living-coral').addClass('text-dark-blue');
            $icon.attr('data-saved', 'false');
        } else {
            $icon.addClass('material-filled text-living-coral').removeClass('text-dark-blue');
            $icon.attr('data-saved', 'true');
        }

        $.ajax({
            url: '/coupons/coupon-history/',
            type: 'POST',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: {
                coupon_id: couponId,
                action: action,
            },
            success: function (response) {
                if (response.success) {
                    const message = response.saved ? 'Post saved!' : 'Post unsaved!';
                    toastr.success(message);
                    // Optional: refresh table
                    // loadCouponHistory(); 
                } else {
                    toastr.error(response.error || 'Could not update saved status.');
                }
            },
            error: function () {
                // Rollback UI on error
                if (action === 'save') {
                    $icon.removeClass('material-filled text-living-coral').addClass('text-dark-blue');
                    $icon.attr('data-saved', 'false');
                } else {
                    $icon.addClass('material-filled text-living-coral').removeClass('text-dark-blue');
                    $icon.attr('data-saved', 'true');
                }
                toastr.error('Could not update saved status.');
            }
        });
    });



    // CSRF helper
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function amountToWords(amount) {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", 
                   "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

    function getWords(num) {
        let result = "";

        const crore = Math.floor(num / 10000000);
        num = num % 10000000;
        const lakh = Math.floor(num / 100000);
        num = num % 100000;
        const thousand = Math.floor(num / 1000);
        num = num % 1000;
        const hundred = Math.floor(num / 100);
        const rest = num % 100;

        if (crore > 0) result += `${getTwoDigits(crore)} Crore `;
        if (lakh > 0) result += `${getTwoDigits(lakh)} Lakh `;
        if (thousand > 0) result += `${getTwoDigits(thousand)} Thousand `;
        if (hundred > 0) result += `${ones[hundred]} Hundred `;
        if (rest > 0) result += `and ${getTwoDigits(rest)} `;

        return result.trim();
    }

    function getTwoDigits(num) {
        if (num < 10) return ones[num];
        else if (num >= 10 && num < 20) return teens[num - 10];
        else return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    }

    const parts = amount.toFixed(2).split('.');
    const rupees = parseInt(parts[0]);
    const paise = parseInt(parts[1]);

    const rupeesWords = rupees === 0 ? "Zero Rupees" : getWords(rupees) + " Rupees";
    const paiseWords = paise === 0 ? "" : ` and ${getTwoDigits(paise)} Paise`;

    return rupeesWords + paiseWords;
}

    //Platform bill Popup
    $(document).on('click', '.platform-bill-view', function () {
        const couponId = $(this).data('id');

        $.ajax({
            url: `platform-bill/${couponId}`,
            type: 'GET',
            success: function(data){
                // Inject data into modal
                const quantity = Number(data.quantity);
                const rate = Number(data.rate_per_display);
                const subtotal = quantity * rate * 10;
                $('#invoice-id').text(data.id);
                $('#invoice-name').text(data.company_name);
                $('#invoice-address').text(data.company_address);
                $('#invoice-phone').text(data.phone_number);
                $('#invoice-email').text(data.uploaded_by);
                $('#invoice-date').text(data.uploaded_on);
                $('#invoice-quantity').text(data.quantity);
                $('#invoice-title').text(data.title);
                $('#invoice-rate').text(`₹${Number(data.rate_per_display).toFixed(2)}`);
                $('#invoice-amount').text(`₹${Number(data.rate_per_display).toFixed(2)}`);
                $('#invoice-subtotal').text(`₹${subtotal.toFixed(2)}`);
                $('#invoice-gst').text(`₹${Number(data.gst_amount).toFixed(2)}`);
                $('#invoice-total').text(`₹${Number(data.final_paid_amount).toFixed(2)}`);
                
                //Platform Company Details
                $('#platform-name').text(data.company);
                $('#platform-address').text(data.address);
                $('#platform-gstin').text(data.gstin);
                $('#platform-signature').text(data.company);
                // You can add conversion to amount in words too
                $('#invoice-words').text(`INR ${amountToWords(Number(data.final_paid_amount))} Only`);

                $('.platform-bill-modal').removeClass('hidden').addClass('flex');
            },
            error: function (xhr) {
                alert("Error loading invoice: " + xhr.responseJSON?.error || "Unknown error");
            }
        });
    });

    $('.close-platform-bill').on('click', function () {
        $('.platform-bill-modal').removeClass('flex').addClass('hidden');
    });

    // for exporting coupon history
    $('.view-history-btn').on('click', function () {
        $('.view-history-popup').addClass('flex').removeClass('hidden');
        $.ajax({
            url: "/coupons/export-coupon-history/",
            type: "GET",
            success: function (response) {
                $('#couponHistoryTableExport').html(response.html);
            },
            error: function () {
                alert("Failed to load coupon history.");
            }
        });
    });
    $('.close-history-popup').on('click', function () {
        $('.view-history-popup').removeClass('flex').addClass('hidden');
    });

    // for exporting saved coupon
    $('.view-saved-history-btn').on('click', function () {
        $('.view-saved-history-popup').addClass('flex').removeClass('hidden');
        $.ajax({
            url: "/coupons/export-saved-coupon-history/",
            type: "GET",
            success: function (response) {
                $('#savedcouponHistoryTableExport').html(response.html);
            },
            error: function () {
                alert("Failed to load coupon history.");
            }
        });
    });
    $('.close-saved-history-popup').on('click', function () {
        $('.view-saved-history-popup').removeClass('flex').addClass('hidden');
    });
    /**** Add new coupon funcationality with step form*****/

    // Validates form, previews image, sets redemptions, and updates summary.
    $('.pay-btn').click(function(e) {
        e.preventDefault();

        let valid = true;

        $('.required-field').removeClass('error');
        
        $('.required-field').each(function () {
            const $this = $(this);
            const isDropdown = $this.hasClass('dropdown-input');

            if (isDropdown) {
                const $wrapper = $this.closest('.dropdown-wrapper');
                const selectedID = $wrapper.find('.dropdown-input-hidden').val().trim();
                const val = $this.val().trim();

                if (selectedID === 'custom') {
                    if (val === '') {
                        valid = false;
                        $this.addClass('error');
                        toastr.error('You selected "Custom". Please type a value.');
                        return false;
                    }
                } else {
                    if (!selectedID) {
                        valid = false;
                        $this.addClass('error');
                        toastr.error('Please Type a Valid value');
                        return false;
                    }
                }
            } else {
                if ($this.val().trim() === '') {
                    valid = false;
                    $this.addClass('error');
                    toastr.error('Please fill all required fields.');
                    return false;
                }
            }
        });

        const imageFile = $('.upload-input')[0]?.files[0];
        if (!imageFile) {
            valid = false;
            $('.upload-area').addClass('error');
            toastr.error('Please upload an image.');
            return;
        } else {
            $('.upload-area').removeClass('error');
        }

        if (!valid) return;

        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                if (imageFile.type === 'video/mp4') {
                    $('#pay-preview-img').addClass('hidden').attr('src', '');
                    $('#pay-preview-video').removeClass('hidden').attr('src', e.target.result);
                } else {
                    $('#pay-preview-video').addClass('hidden').attr('src', '');
                    $('#pay-preview-img').removeClass('hidden').attr('src', e.target.result);
                }
            };
            reader.readAsDataURL(imageFile);
        }
        
        $('#pay-title').html($('input[name="title"]').val());
        $('#pay-description').html($('textarea[name="description"]').val()); 
        $('#pay-category').html($('input[name="category"]').val());
        $('#pay-code').html($('input[name="code"]').val());
        $('#pay-brand').html($('input[name="brand_name"]').val());

        const maxRedemptions = $('input[name="max_redemptions"]').val();
        $('#couponInput').val(maxRedemptions);

        if (typeof updateSummary === 'function') updateSummary();
        else if (window.updateSummary) window.updateSummary();
    });

    // Validates step 1, then shows step 2 if valid.
    $('#next-step').click(function(e) {
        e.preventDefault();

        let valid = true;

        $('#step-1 .required-field').each(function() {
            const val = $(this).val().trim();
            if (!val || val === 'Select' || val === 'custom') {   // ⬅️ added "custom"
                valid = false;
                $(this).addClass('error').addClass('border-dark-red').next('p').addClass('text-dark-red');
            } else {
                $(this).removeClass('error').removeClass('border-dark-red').next('p').removeClass('text-dark-red');
            }
        });

        if (!valid) {
            return;
        }

        $('#step-1').addClass('hidden');
        $('#step-2').removeClass('hidden');
    });

    // Hides step 2 and shows step 1 on previous button click.
    $('#prev-step').click(function(e) {
        e.preventDefault();
        $('#step-2').addClass('hidden');
        $('#step-1').removeClass('hidden');
    });

    // Calculates and displays coupon summary with GST and net payable on input.
    const CONFIG = {
        displaysPerCoupon: 10,
        ratePerDisplay: 100.00,
        gstRate: 0.18,
        advanceReceived: 0.00,
        minimumCoupons: 5
    };

    const couponInput = document.getElementById('couponInput');
    if (couponInput) {
        const couponsCountSpan = document.getElementById('coupons-count');
        const displaysPerCouponSpan = document.getElementById('displays-per-coupon');
        const ratePerDisplaySpan = document.getElementById('rate-per-display');
        const totalBeforeGstSpan = document.getElementById('total-before-gst');
        const gstAmountSpan = document.getElementById('gst-amount');
        const grossAmountSpan = document.getElementById('gross-amount');
        const advanceReceivedSpan = document.getElementById('advance-received');
        const netPayableSpan = document.getElementById('net-payable');

        function formatCurrency(amount) {
            return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        function updateSummary() {
            const numberOfCoupons = parseInt(couponInput.value) || 0;
            if (numberOfCoupons < CONFIG.minimumCoupons) {
                couponInput.value = CONFIG.minimumCoupons;
                return updateSummary();
            }
            const totalDisplays = numberOfCoupons * CONFIG.displaysPerCoupon;
            const totalBeforeGst = totalDisplays * CONFIG.ratePerDisplay;
            const gstAmount = totalBeforeGst * CONFIG.gstRate;
            const grossAmount = totalBeforeGst + gstAmount;
            const netPayable = grossAmount - CONFIG.advanceReceived;
            couponsCountSpan.textContent = numberOfCoupons;
            displaysPerCouponSpan.textContent = CONFIG.displaysPerCoupon;
            ratePerDisplaySpan.textContent = formatCurrency(CONFIG.ratePerDisplay);
            totalBeforeGstSpan.textContent = formatCurrency(totalBeforeGst);
            gstAmountSpan.textContent = formatCurrency(gstAmount);
            grossAmountSpan.textContent = formatCurrency(grossAmount);
            advanceReceivedSpan.textContent = formatCurrency(CONFIG.advanceReceived);
            netPayableSpan.textContent = formatCurrency(netPayable);
            netPayableSpan.classList.add('animate-pulse');
            setTimeout(() => {
                netPayableSpan.classList.remove('animate-pulse');
            }, 300);
            document.getElementById('purchased_count_field').value = numberOfCoupons;
            document.getElementById('displays_per_coupon_field').value = CONFIG.displaysPerCoupon;
            document.getElementById('rate_per_display_field').value = CONFIG.ratePerDisplay;
            document.getElementById('advance_received_field').value = CONFIG.advanceReceived;
            document.getElementById('gst_amount_field').value = gstAmount.toFixed(2);
            document.getElementById('final_paid_amount_field').value = netPayable.toFixed(2);
        }
        couponInput.addEventListener('input', updateSummary);
        couponInput.addEventListener('change', updateSummary);
        couponInput.addEventListener('keydown', function(e) {
            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
            }
        });
        updateSummary();
    }

    // Validates form, prepares data, and submits via AJAX for coupon creation.
    $('#main-coupon-form').on('submit', function (e) {
        e.preventDefault();

        const csrftoken = $('[name="csrfmiddlewaretoken"]').val();

        const couponCount = parseInt($('#couponInput').val());
        const imageFile = $('.upload-input')[0].files[0];
        const offerType = $('input[name="offer_type"]').val();
        const spendingPower = $('input[name="spending_power"]').val();
        const maxRedemptions = $('input[name="max_redemptions"]').val();
        const validity = $('input[name="validity"]').val();
        const country = $('input[name="country"]').val();
        const state = $('input[name="state"]').val();
        const city = $('input[name="city"]').val();
        const pincode = $('input[name="pincode"]').val();

        if (!couponCount || couponCount < 5) {
            toastr.error("Please enter at least 5 coupons.");
            return;
        }


        if (!imageFile) {
            toastr.error("Please upload a coupon image.");
            return;
        }

        if (!offerType || offerType === 'custom') {
            toastr.error("Please select an Offer Type.");
            return;
        }

        if (!spendingPower || spendingPower === 'custom') {
            toastr.error("Please select Spending Power.");
            return;
        }

        if (!country || country === 'custom') {
            toastr.error("Please select Country.");
            return;
        }

        if (!state || state === 'custom') {
            toastr.error("Please select State.");
            return;
        }

        if (!city || city === 'custom') {
            toastr.error("Please select City.");
            return;
        }

        if (!pincode || pincode === 'custom') {
            toastr.error("Please select Pincode.");
            return;
        }

        if (!maxRedemptions || parseInt(maxRedemptions) < 5) {
            toastr.error("Maximum redemptions should be at least 5.");
            return;
        }

        if (!validity || validity === 'DD/MM/YY') {
            toastr.error("Please select coupon validity date.");
            return;
        }

        const formUrl = $(this).attr('action');
        const formType = $(this).attr('method');
        const formData = new FormData(this);

        formData.set('purchased_count', couponCount);
        formData.set('displays_per_coupon', 10);
        formData.set('rate_per_display', 100.00);
        formData.set('advance_received', 0.00);
        const totalBeforeGst = couponCount * 10 * 100.00;
        const gstAmount = totalBeforeGst * 0.18;
        const finalAmount = totalBeforeGst + gstAmount;
        formData.set('gst_amount', gstAmount.toFixed(2));
        formData.set('final_paid_amount', finalAmount.toFixed(2));

        $.ajax({
            url: formUrl,
            type: formType,
            headers: { 'X-CSRFToken': csrftoken },
            data: formData,
            processData: false,
            contentType: false,
            success: function (resp) {
                if (resp.success) {
                    toastr.success(resp.message);
                    setTimeout(() => {
                        window.location.href = resp.redirect;
                    }, 1000);
                } else {
                    toastr.error(resp.message || "Validation failed on server.");
                }
            },
            error: function () {
                toastr.error("Server error. Try again.");
            }
        });
    });
    function loadCouponHistory(page = 1, range = '') {
        const query = $('input[name=coupon_history_query]').val();
        const limit = $('#filter-limit').val() || 5;
        const startDate = $('#filter-start-date').val();
        const endDate = $('#filter-end-date').val();
        const daterange = range || "";

        $.ajax({
            url: "/coupons/coupon-history/",
            type: "GET",
            data: {
                query: query,
                limit: limit,
                page: page,
                daterange: daterange,
            },
            success: function (response) {
                $('.couponHistoryTable tbody').html(response.html);
                renderCouponPagination(response.current_page, response.total_pages);
            },
            error: function () {
                alert("Failed to load coupon history.");
            }
        });
    }

    function renderCouponPagination(current, total, $container = $('.coupon-history')) {
        let html = '';

        // Previous button
        if (current >= 1) {
            html += `<button class="coupon-pagination-btn bg-white px-3 py-1 rounded text-light-gray1 text-sm" data-page="${current - 1}">Previous</button>`;
        }

        // Number buttons
        if (total <= 5) {
            for (let i = 1; i <= total; i++) {
                html += pageBtn(i, current);
            }
        } else {
            // Always show first page
            html += pageBtn(1, current);

            // Near start
            if (current <= 3) {
                for (let i = 2; i <= 4; i++) {
                    html += pageBtn(i, current);
                }
                html += `<span class="px-2">...</span>`;
                html += pageBtn(total, current);
            }
            // In middle
            else if (current > 3 && current < total - 2) {
                html += `<span class="px-2">...</span>`;
                for (let i = current - 1; i <= current + 1; i++) {
                    html += pageBtn(i, current);
                }
                html += `<span class="px-2">...</span>`;
                html += pageBtn(total, current);
            }
            // Near end
            else {
                html += `<span class="px-2">...</span>`;
                for (let i = total - 3; i <= total - 1; i++) {
                    html += pageBtn(i, current);
                }
                html += pageBtn(total, current);
            }
        }

        // Next button
        if (current <= total) {
            html += `<button class="coupon-pagination-btn bg-white px-3 py-1 rounded text-light-gray1 text-sm" data-page="${current + 1}">Next</button>`;
        }
        $container.find('#coupon-pagination-container').html(html);

        function pageBtn(i, current) {
            return `<button 
            class="coupon-pagination-btn px-3 py-1.5 rounded-lg text-sm ${i === current ? 'bg-violet-sky text-white' : 'bg-pagination'}" 
            data-page="${i}">
            ${i}
        </button>`;
        }
    }

    function loadSavedCouponHistory(page = 1, range = '') {
        const query = $('input[name=saved_coupon_history_query]').val();
        const limit = $('#filter-limit').val() || 5;
        const startDate = $('#filter-start-date').val();
        const endDate = $('#filter-end-date').val();
        const daterange = range || "";

        $.ajax({
            url: "/coupons/saved-coupons/",
            type: "GET",
            data: {
                query: query,
                limit: limit,
                page: page,
                daterange: daterange,
            },
            success: function (response) {
                $('.couponSavedHistoryTable tbody').html(response.html);
                renderSavedCouponPagination(response.current_page, response.total_pages);
            },
            error: function () {
                alert("Failed to load saved coupon history.");
            }
        });
    }

    function renderSavedCouponPagination(current, total, $container = $('.saved-coupon-history')) {
        let html = '';
        if (current >= 1) {
            html += `<button class="saved-coupon-pagination-btn bg-white px-3 py-1 rounded text-light-gray1 text-sm" data-page="${current - 1}">Previous</button>`;
        }

        // Number buttons
        if (total <= 5) {
            for (let i = 1; i <= total; i++) {
                html += pageBtn(i, current);
            }
        } else {
            // Always show first page
            html += pageBtn(1, current);

            // Near start
            if (current <= 3) {
                for (let i = 2; i <= 4; i++) {
                    html += pageBtn(i, current);
                }
                html += `<span class="px-2">...</span>`;
                html += pageBtn(total, current);
            }
            // In middle
            else if (current > 3 && current < total - 2) {
                html += `<span class="px-2">...</span>`;
                for (let i = current - 1; i <= current + 1; i++) {
                    html += pageBtn(i, current);
                }
                html += `<span class="px-2">...</span>`;
                html += pageBtn(total, current);
            }
            // Near end
            else {
                html += `<span class="px-2">...</span>`;
                for (let i = total - 3; i <= total - 1; i++) {
                    html += pageBtn(i, current);
                }
                html += pageBtn(total, current);
            }
        }

        // Next button
        if (current <= total) {
            html += `<button class="saved-coupon-pagination-btn bg-white px-3 py-1 rounded text-light-gray1 text-sm" data-page="${current + 1}">Next</button>`;
        }
        $container.find('#saved-coupon-pagination-container').html(html);

        function pageBtn(i, current) {
            return `<button 
            class="saved-coupon-pagination-btn px-3 py-1.5 rounded-lg text-sm ${i === current ? 'bg-violet-sky text-white' : 'bg-pagination'}"
            data-page="${i}">
            ${i}
        </button>`;
        }
    }

    $('[data-tab="coupon-history"]').on('click', function () {
        loadCouponHistory();
    });

    $('[data-tab="saved-coupon-history"]').on('click', function () {
        loadSavedCouponHistory();
    });

    $(document).on('click', '.coupondaterange', function () {
        $('.coupondaterange').removeClass('font-bold');
        $(this).addClass('font-bold');
        loadCouponHistory(1, $(this).data('range'));
    });

    $(document).on('click', '.savedcoupondaterange', function () {
        $('.savedcoupondaterange').removeClass('font-bold');
        $(this).addClass('font-bold');
        loadSavedCouponHistory(1, $(this).data('range'));
    });

    $(document).on('input change', '#coupon_history_query, #filter-limit, #filter-start-date, #filter-end-date', function () {
        loadCouponHistory(1);
    });

    $(document).on('input change', '#saved_coupon_history_query, #filter-limit, #filter-start-date, #filter-end-date', function () {
        loadSavedCouponHistory(1);
    });

    $(document).on('click', '.coupon-pagination-btn', function () {
        const page = $(this).data('page');
        loadCouponHistory(page);
    });

    $(document).on('click', '.saved-coupon-pagination-btn', function () {
        const page = $(this).data('page');
        loadSavedCouponHistory(page);
    });

    $('.history_filter').on('submit', function (e) {
        e.preventDefault();
        loadCouponHistory(1);
    });

    $('.saved-history_filter').on('submit', function (e) {
        e.preventDefault();
        loadSavedCouponHistory(1);
    });
    loadSavedCouponHistory(1, '');
});
$(document).ready(function () {
  $(".dropdown-wrapper").each(function () {
    const $wrapper = $(this);
    const $input = $wrapper.find(".dropdown-input");
    const $hiddenInput = $wrapper.find(".dropdown-input-hidden");
    const $dropdown = $wrapper.find(".dropdown-list");
    const $toggle = $wrapper.find(".material-symbols-outlined");

    // Toggle dropdown open/close
    $toggle.on("click", function () {
      $dropdown.toggleClass("hidden");
    });

    // Handle option click
    $dropdown.find("div").on("click", function () {
      const value = $(this).data("value");

      if (value === "custom") {
        // Custom option → allow typing
        $input.prop("readonly", false).val("").focus();
        $hiddenInput.val("");
      } else {
        // Normal option
        $input.prop("readonly", true).val($(this).text().trim());
        $hiddenInput.val(value);
      }

      $dropdown.addClass("hidden");
    });

    // Sync custom typed value into hidden field
    $input.on("input", function () {
      if (!$input.prop("readonly")) {
        $hiddenInput.val($input.val().trim());
      }
    });

    // Reset to placeholder if custom left empty
    $input.on("blur", function () {
      if (!$input.prop("readonly") && $input.val().trim() === "") {
        $input.val("").prop("readonly", true); // lock back
        $hiddenInput.val(""); // clear hidden too
        $input.attr("placeholder", "Select..."); // show placeholder
      }
    });
  });

  // Optional: Close dropdowns when clicking outside
  $(document).on("click", function (e) {
    if (!$(e.target).closest(".dropdown-wrapper").length) {
      $(".dropdown-list").addClass("hidden");
    }
  });
});
