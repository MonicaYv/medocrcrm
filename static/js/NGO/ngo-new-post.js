$(document).ready(function () {
    // Toggle dropdown on input click
    $(document).on('click', '.dropdown-input', function (e) {
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
        const selectedId = $(this).text();
        $wrapper.find('.dropdown-input').val(selectedText);
        $wrapper.find('.dropdown-hidden-input').val(selectedId);
        $wrapper.find('.dropdown-list').hide();
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
                format: 'YYYY-MM-DD',
                cancelLabel: 'Clear'
            }
        });

        // Open the picker safely
        $input.trigger('click');

        // Clean and re-bind
        $input.off('apply.daterangepicker cancel.daterangepicker');

        $input.on('apply.daterangepicker', function (e, picker) {
            const formattedDate = picker.startDate.format('YYYY-MM-DD');
            selectedDate = formattedDate;
            $input.val(formattedDate);
            $wrapper.find('.selected-date').text(formattedDate);
            console.log("Selected Date:", selectedDate); 
        });

        $input.on('cancel.daterangepicker', function (e, picker) {
            selectedDate = null;
            $wrapper.find('.selected-date').text('YYYY-MM-DD');
        });
    });

    $(document).ready(function () {
        // 1. Upload area click to trigger file input
        $('.upload-area').on('click', function (e) {
            const previewVisible = $(this).find('.upload-preview').is(':visible');
            if (
            !$(e.target).is('input[type="file"]') &&
            !$(e.target).hasClass('cancel-upload') &&
            !$(e.target).closest('.uploaded-img-wrapper').length
            ) {
            $(this).find('input[type="file"]').trigger('click');
            }
        });

        // 2. Drag and drop
        $('.upload-area').on('dragover dragleave drop', function (e) {
            e.preventDefault();
        });

        $('.upload-area').on('drop', function (e) {
            const files = e.originalEvent.dataTransfer.files;
            handleFileSelection($(this), files);
        });

        // 3. Change image
        $('.upload-area').on('click', '.change-image-btn', function (e) {
            e.stopPropagation();
            const area = $(this).closest('.upload-area');
            area.find('input[type="file"]').trigger('click');
        });

        // 4. On file input change
        $('.upload-input').on('change', function () {
            const files = this.files;
            const area = $(this).closest('.upload-area');
            handleFileSelection(area, files);
        });

        // 5. Cancel all uploads
        $('.upload-area').on('click', '.cancel-upload', function (e) {
            e.stopPropagation();
            const area = $(this).closest('.upload-area');
            const input = area.find('input[type="file"]');
            const preview = area.find('.upload-preview');
            const placeholder = area.find('.upload-placeholder');

            input.val('');
            preview.html('').addClass('hidden');
            placeholder.removeClass('hidden');
        });

        // 🔁 Helper: File handler
        function handleFileSelection(area, files) {
            const preview = area.find('.upload-preview');
            const placeholder = area.find('.upload-placeholder');
            const input = area.find('input[type="file"]');

            if (files.length > 2) {
                toastr.error("You can upload only 2 images. Please select again.");
                input.val('');
                preview.html('').addClass('hidden');
                placeholder.removeClass('hidden');
                return;
            }

            // Clear previous
            preview.html('');

            Array.from(files).forEach((file, index) => {
                if (file.type.startsWith("image/")) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const imgWrapper = $(`
                            <div class="uploaded-img-wrapper relative w-1/2 h-full flex items-center justify-center p-2">
                            <img src="${e.target.result}" class="uploaded-img object-contain max-h-60 w-full" alt="Preview" />
                            </div>
                        `);
                        preview.append(imgWrapper);
                    };
                    reader.readAsDataURL(file);
                }
            });
            $('.creativesVirusScan').removeClass('');
            placeholder.addClass('hidden');
            preview.removeClass('hidden').addClass('flex');
            preview.append(`
            <button type="button" class="cancel-upload absolute -top-8 sm:-top-2 right-2 z-10">
                <span class="material-symbols-outlined cursor-pointer">close</span>
            </button>
            `);
        }
        });


    // Title and Description Change

    const tabData = {
        "new-post": {
            icon: "upload",
            title: "New Post",
            description: "Post Your Cause—Reach Generous Donors Today!"
        },
        "post-history": {
            icon: "upload",
            title: "New Post",
            description: "Post Your Cause—Reach Generous Donors Today!"
        },
        "saved-post": {
            icon: "upload",
            title: "New Post",
            description: "Post Your Cause—Reach Generous Donors Today!"
        }
    };

    // Click event for tabs
    $('.tab-btn-ngo').click(function () {

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
        $('.preview-popup, .download-popup').addClass('hidden').removeClass("flex");

        if (popupType === 'preview') {
            $('.preview-popup').removeClass('hidden').addClass('flex');
        } else if (popupType === 'download') {
            $('.download-popup').removeClass('hidden').addClass('flex');
        }
    });

    // Close popup on close button click
    $(document).on('click', '.close-popup', function () {
        $(this).closest('.popup').addClass('hidden').removeClass("flex");
    });

    // Close popup on outside click
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.preview-popup, .download-popup, [data-popup]').length) {
            $('.preview-popup, .download-popup').addClass('hidden').removeClass("flex");
        }
    });

    // Tag Input
    let tags = [];
    const maxTags = 8;

    function renderTags() {
        $('#tag-container').empty();
        tags.forEach((tag, index) => {
            $('#tag-container').append(`
          <div class="flex items-center bg-input-tag text-jet-black px-3 py-0.5 rounded-[6px] text-base font-normal">
            ${tag}
            <button class="ml-2 text-2xl text-jet-black" data-index="${index}">&times;</button>
          </div>
        `);
        });
    }

    $('#tag-input').on('keypress', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            let newTag = $(this).val().trim();
            if (newTag && !tags.includes(newTag)) {
                if (tags.length < maxTags) {
                    tags.push(newTag);
                    renderTags();
                    $(this).val('');
                } else {
                    toastr.error('Only 8 tags can be selected.');
                }
            }
        }
    });
    

    $('#tag-container').on('click', 'button', function () {
        let index = $(this).data('index');
        tags.splice(index, 1);
        renderTags();
    });

    // AJAX validation for missing fields on NGO post form
    $('#new-post-forms').on('submit', function (e) {
        e.preventDefault();
        var form = this;
        var formData = new FormData(form);
        // Add a flag to indicate AJAX validation
        formData.append('ajax_validate', '1');

        // Remove previous field errors
        $('.field-error').remove();

        var fieldNameMap = {
            "Header": "header",
            "Description": "description",
            "Tags": "tags",
            "Post Type": "post_type",
            "Donation Frequency": "donation_frequency",
            "Target Donation": "target_donation",
            "Country": "country",
            "State": "state",
            "City": "city",
            "Pincode": "pincode",
            "Age": "age",
            "Gender": "gender",
            "Spending power": "spending_power",
            "Start Date": "start-date",
            "End Date": "end-date",
            "Creative Upload": "creatives"
        };

        $.ajax({
            url: $(form).attr('action'),
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            },
            success: function (response) {
                $('.field-error').remove();
                if (response.missing_fields && response.missing_fields.length) {
                    toastr.error('Please fill all required fields');
                    response.missing_fields.forEach(function(field) {
                        var inputName = fieldNameMap[field] || field.toLowerCase().replace(/ /g, '_');
                        var $input = $('[name="' + inputName + '"]');
                        var $errorTarget = $input;

                        if (inputName === 'creatives') {
                            $errorTarget = $('.upload-area');
                            // Extra validation: show error if no file selected
                            if (!$('[name="creatives[]"]')[0].files.length) {
                                $errorTarget.after('<div class="field-error text-red-600 text-sm mt-1">Creative Upload is required.</div>');
                            }
                            return; // Skip rest for this field
                        }

                        if ($input.length) {
                            if ($input.closest('.dropdown-wrapper').length) {
                                var $container = $input.closest('.space-y-2');
                                $errorTarget = $container.length ? $container : $input.closest('.dropdown-wrapper');
                            } else if ($input.closest('.calendar-wrapper').length) {
                                $errorTarget = $input.closest('.calendar-wrapper');
                            } else if (inputName === 'creatives[]') {
                                $errorTarget = $('input[name="creatives[]"]').closest('.upload-area');
                            }
                        } else {
                            var $label = $("h1:contains('" + field + "')");
                            if ($label.length) {
                                $errorTarget = $label.closest('.space-y-2');
                            }
                        }

                    });
                    // Optionally scroll to first error
                    var $firstError = $('.field-error').first();
                    if ($firstError.length) {
                        $('html, body').animate({ scrollTop: $firstError.offset().top - 100 }, 300);
                    }
                } else if (response.success) {
                    toastr.success('Post Submitted');
                    // Reset the form
                    $('#new-post-form')[0].reset();
                    // Clear image previews
                    $('.upload-preview').addClass('hidden');
                    $('.upload-placeholder').removeClass('hidden');
                    // Clear tags UI
                    $('#tag-container').empty();
                    // Reset date pickers (set value and UI to default)
                    $('.custom-date-range').val('');
                    $('.calendar-wrapper .selected-date').each(function(i, el) {
                        if (i === 0) {
                            $(el).text('YYYY-MM-DD');
                        } else {
                            $(el).text('DD/MM/YY');
                        }
                    });
                }
            },
            error: function (xhr) {
                // Fallback error
                var errorHtml = '<div id="form-errors" class="mb-4 p-3 bg-red-100 text-red-700 rounded">An error occurred. Please try again.</div>';
                $(form).prepend(errorHtml);
            }
        });
    });

    $('#new-post-form').on('submit', function (e) {
        e.preventDefault();

        let form = $(this);
        let isValid = true;

        // Clear previous error messages
        form.find('.error-text').remove();

        // Check required inputs, textareas, and selects
        form.find('input[required], select[required], textarea[required]').each(function () {
            let input = $(this);
            let value = input.val().trim();

            // Skip hidden inputs except .upload-input
            if (input.is(':hidden') && !input.hasClass('upload-input')) return;

            if (!value || value === 'Select') {
                isValid = false;

                // Append error message
                if (input.next('.error-text').length === 0) {
                    input.after(`<small class="error-text text-danger">This field is required.</small>`);
                }
            }
        });

        // Validate pincode - must be exactly 6 digits when provided
        let pinInput = form.find('input[name="pincode"]');
        let pincode = $.trim(pinInput.val() || '');
        if (pincode && !/^\d{6}$/.test(pincode)) {
            isValid = false;
            if (pinInput.next('.error-text').length === 0) {
                pinInput.after(`<small class="error-text text-danger">Pincode must be exactly 6 digits.</small>`);
            }
        }

        // Check if creatives[] files are uploaded
        let creativeInput = form.find('input.upload-input')[0];
        if (creativeInput && creativeInput.files.length === 0) {
            isValid = false;

            // Append error message
            if ($(creativeInput).next('.error-text').length === 0) {
                $(creativeInput).after(`<small class="error-text text-danger">Please upload at least one file.</small>`);
            }
        }

        if (!isValid) {
            return;
        }

        // Submit via AJAX
        let formData = new FormData(this);

        $.ajax({
            url: 'post_save/',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (res) {
                if (res.success) {
                    toastr.success("Post created successfully!" + res.message);
                    window.location.href = "/posts/";
                } else {
                    toastr.error("Unexpected error." + res.message || '');
                }
            },
            error: function (xhr) {
                console.error("Error:", xhr.responseJSON);
                toastr.error("Error: " + (xhr.responseJSON?.error || "Unknown error"));
            }
        });
    });

    $(document).on("click", '#clear-new-form', function(){
        const form = $('#new-post-form');

        // Reset standard inputs, textareas, selects
        form.find('input:not([type=button],[type=submit],[type=reset]), textarea, select').val('');

        // Uncheck checkboxes & radio buttons
        form.find('input[type=checkbox], input[type=radio]').prop('checked', false);

        // Reset file inputs manually (and clear preview if present)
        form.find('input[type=file]').each(function () {
            $(this).val('');
            $(this).siblings('.upload-preview').empty(); // if you use preview containers
        });

        // Reset select to default (if applicable)
        form.find('select').prop('selectedIndex', 0);

        // Remove any error text
        form.find('.error-text').remove();
    });




    $(document).on("click", ".bookmark-fill", function () {
        $(this).toggleClass(`material-filled text-violet-sky`);
    })

    // Status Dropdown
    $('.statusDropdown').each(function () {
        const $dropdown = $(this);
        const $selected = $dropdown.find('.selectedStatus');
        const $options = $dropdown.find('.statusOptions');
        const $label = $dropdown.find('.status-label');

        // Toggle dropdown on click
        $selected.on('click', function () {
            // Hide all others first
            $('.statusOptions').not($options).hide();
            $options.toggle();
        });

        // Handle option selection
        $options.find('div').on('click', function () {
            const selectedText = $(this).text();
            const bgClass = $(this).attr('class').match(/bg-[^\s]+/)[0];
            const textClass = $(this).attr('class').match(/text-[^\s]+/)[0];

            // Update text and classes for this dropdown only
            $label.text(selectedText);
            $selected
                .removeClass(function (i, className) {
                    return (className.match(/(bg|text)-[^\s]+/g) || []).join(' ');
                })
                .addClass(`${bgClass} ${textClass}`);

            $options.hide();
        });
    });

    $(document).on('click', '.bookmark-toggle', function() {
        console.log('Bookmark clicked!');
        var $icon = $(this);
        var postId = $icon.data('post-id');
        var isSaved = $icon.data('saved') === true || $icon.data('saved') === 'true';
        var action = isSaved ? 'unsave' : 'save';
    
        $.ajax({
            url: '/posts/toggle-saved/',
            type: 'POST',
            data: {
                post_id: postId,
                action: action,
                csrfmiddlewaretoken: $('[name=csrfmiddlewaretoken]').val()
            },
            success: function(response) {
                if (response.success) {
                    $icon.data('saved', response.saved);
                    if (response.saved) {
                        $icon.addClass('material-filled text-violet-sky');
                    } else {
                        $icon.removeClass('material-filled text-violet-sky');
                        // If in Saved Post table, remove the row
                        if ($icon.closest('.saved-post').length || $icon.closest('table').closest('.saved-post').length) {
                            $icon.closest('tr').remove();
                        }
                    }
                    toastr.success(response.saved ? 'Post saved!' : 'Post unsaved!');
                } else {
                    toastr.error(response.error || 'Could not update saved status.');
                }
            },
            error: function() {
                toastr.error('Could not update saved status.');
            }
        });
    });

    $(document).on('click', '.statusOptions div', function() {
        var $option = $(this);
        var $dropdown = $option.closest('.statusDropdown');
        var $row = $dropdown.closest('tr');
        var postId = $row.find('.bookmark-toggle, .bookmark-fill').data('post-id');
        var newStatus = $option.text().trim();
    
        $.ajax({
            url: '/posts/update-status/',
            type: 'POST',
            data: {
                post_id: postId,
                status: newStatus,
                csrfmiddlewaretoken: $('[name=csrfmiddlewaretoken]').val()
            },
            success: function(response) {
                if (response.success) {
                    toastr.success('Status updated to ' + response.status);
                } else {
                    toastr.error(response.error || 'Could not update status.');
                }
            },
            error: function() {
                toastr.error('Could not update status.');
            }
        });
    });
    

    // Hide any open dropdowns if clicking outside
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.statusDropdown').length) {
            $('.statusOptions').hide();
        }
    });

    // Preview popup logic
    $(document).on('click', '.preview-btn', function() {
        var postId = $(this).data('post-id');
        $.ajax({
            url: '/posts/' + postId + '/detail/',
            type: 'GET',
            success: function(data) {
                // Fill popup fields
                $('#preview-header').text(data.header);
                $('#preview-description').text(data.description);
                $('#preview-tags').text(data.tags);
                $('#preview-post-type').text(data.post_type);
                $('#preview-donation-frequency').text(data.donation_frequency);
                $('#preview-target-donation').text(data.target_donation);
                $('#preview-country').text(data.country);
                $('#preview-state').text(data.state);
                $('#preview-city').text(data.city);
                $('#preview-pincode').text(data.pincode);
                $('#preview-age-group').text(data.age_group);
                $('#preview-gender').text(data.gender);
                $('#preview-date-time').text(data.date_time || '-');
                $('#preview-views').text(data.views || '-');
                $('#preview-donation-received').text(data.donation_received || '-');
                $('#preview-status').text(data.status || '-');
                $('#preview-spending-power').text(data.spending_power);
                $('#preview-start-date').text(data.start_date);
                $('#preview-end-date').text(data.end_date);
                $('#preview-post-reference-id').text(data.post_reference_id || '-');
                $('#preview-uploaded-by').text(data.uploaded_by || '-');
                if (data.creative1) {
                    $('#preview-creative1').attr('src', data.creative1).show();
                } else {
                    $('#preview-creative1').hide();
                }
                if (data.creative2) {
                    $('#preview-creative2').attr('src', data.creative2).show();
                } else {
                    $('#preview-creative2').hide();
                }
                // Fill donation table
                var $tbody = $('#preview-donation-table tbody');
                $tbody.empty();
                if (data.donations && data.donations.length > 0) {
                    data.donations.forEach(function(donation) {
                        $tbody.append(
                            '<tr>' +
                                '<td class="px-4 py-2.5 text-center">' + donation.payment_date + '</td>' +
                                '<td class="px-4 py-2.5 text-center">' + donation.name + '</td>' +
                                '<td class="px-4 py-2.5 text-center">' + donation.city + '</td>' +
                                '<td class="px-4 py-2.5 text-center">₹' + donation.amount + '</td>' +
                            '</tr>'
                        );
                    });
                } else {
                    $tbody.append('<tr><td colspan="4" class="text-center py-4">No donations yet.</td></tr>');
                }
                // Show the popup
                $('.preview-popup').removeClass('hidden').addClass('flex');
            },
            error: function() {
                toastr.error('Could not load post details.');
            }
        });
    });
    $(document).on('click', '.post-download-btn', function() {
        console.log('Download clicked!');
        console.log('Post ID:', $(this).data('post-id'));
        var postId = $(this).data('post-id');
        $.ajax({
            url: '/posts/' + postId + '/detail/',
            type: 'GET',
            success: function(data) {
                // Fill popup fields
                $('#download-header').text(data.header);
                $('#download-description').text(data.description);
                $('#download-tags').text(data.tags);
                $('#download-post-type').text(data.post_type);
                $('#download-donation-frequency').text(data.donation_frequency);
                $('#download-target-donation').text(data.target_donation);
                $('#download-country').text(data.country);
                $('#download-state').text(data.state);
                $('#download-city').text(data.city);
                $('#download-pincode').text(data.pincode);
                $('#download-age-group').text(data.age_group);
                $('#download-gender').text(data.gender);
                $('#download-date-time').text(data.date_time || '-');
                $('#download-views').text(data.views || '-');
                $('#download-donation-received').text(data.donation_received || '-');
                $('#download-status').text(data.status || '-');
                $('#download-spending-power').text(data.spending_power);
                $('#download-start-date').text(data.start_date);
                $('#download-end-date').text(data.end_date);
                $('#download-post-reference-id').text(data.post_reference_id || '-');
                $('#download-uploaded-by').text(data.uploaded_by || '-');
                if (data.creative1) {
                    $('#download-creative1').attr('src', data.creative1).show();
                } else {
                    $('#download-creative1').hide();
                }
                if (data.creative2) {
                    $('#download-creative2').attr('src', data.creative2).show();
                } else {
                    $('#download-creative2').hide();
                }
                // Fill donation table
                var $tbody = $('#download-donation-table tbody');
                $tbody.empty();
                if (data.donations && data.donations.length > 0) {
                    data.donations.forEach(function(donation) {
                        $tbody.append(
                            '<tr>' +
                                '<td class="px-4 py-2.5 text-center">' + donation.payment_date + '</td>' +
                                '<td class="px-4 py-2.5 text-center">' + donation.name + '</td>' +
                                '<td class="px-4 py-2.5 text-center">' + donation.city + '</td>' +
                                '<td class="px-4 py-2.5 text-center">₹' + donation.amount + '</td>' +
                            '</tr>'
                        );
                    });
                } else {
                    $tbody.append('<tr><td colspan="4" class="text-center py-4">No donations yet.</td></tr>');
                }
                // Show the popup
                $('.download-popup').removeClass('hidden').addClass('flex');
            },
            error: function() {
                toastr.error('Could not load post details.');
            }
        });
    });

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
            filename:     'post-details.pdf',
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
    // for exporting post history
    $('.view-post-history-btn').on('click', function () {
        $('.view-post-history-popup').addClass('flex').removeClass('hidden');
        $('.loading-spinner').show();
        $.ajax({
            url: "/posts/post-history/export/",
            type: "GET",
            success: function (response) {
                $('#postHistoryTableExport').html(response.html);
            },
            error: function (xhr, status, error) {
                alert("Failed to load post history.");
            },
            complete: function () {
            $('.loading-spinner').hide();  // hide after success/error
            }
        });
    });

    $('.close-post-history-popup').on('click', function () {
        $('.view-post-history-popup').removeClass('flex').addClass('hidden');
    });

    // for exporting saved post history
    $('.view-saved-post-history-btn').on('click', function () {
        console.log('View Saved Post History clicked!');
        $('.view-saved-post-history-popup').addClass('flex').removeClass('hidden');
        $('.loading-spinner').show();
        $.ajax({
            url: "/posts/saved-post-history/export/",
            type: "GET",
            success: function (response) {
                $('#savedpostHistoryTableExport').html(response.html);
            },
            error: function () {
                alert("Failed to load saved history.");
            },
            complete: function () {
            $('.loading-spinner').hide();  // hide after success/error
            }
        });
    });
    $('.close-saved-post-history-popup').on('click', function () {
        $('.view-saved-post-history-popup').removeClass('flex').addClass('hidden');
    });

    function loadPostHistory(page = 1, $container = $('#postHistory')) {
    const query = $container.find('input[name="post_history_query"]').val();  // fixed name
    const startDate = $container.data("start-date") || "";
    const endDate = $container.data("end-date") || "";
    const saved = $container.attr('id') === 'postSaved' ? 'true' : 'false';

    $.ajax({
        url: "/posts/post-history/",
        type: "GET",
        data: {
            query: query,
            page: page,
            start_date: startDate,
            end_date: endDate,
            saved_only: saved,
        },
        success: function (response) {
            $container.find('tbody').html(response.html);
            renderPagination(response.current_page, response.total_pages, $container);
        },
        error: function () {
            toastr.error("Failed to load post history.");
        }
    });
}

function renderPagination(current, total, $container) {
    let html = '';

     // Prev button
    html += `<button class="pagination-btn bg-white px-3 py-1 rounded text-light-gray1 text-sm" data-page="${current - 1}" ${current === 1 ? 'disabled' : ''}>Previous</button>`;

    function pageBtn(i) {
        return `<button class="pagination-btn px-3 py-1.5 rounded-lg text-sm ${i === current ? 'bg-violet-sky text-white' : 'bg-pagination'}" data-page="${i}">${i}</button>`;
    }

    if (total <= 5) {
        // Show all pages if 5 or fewer
        for (let i = 1; i <= total; i++) {
            html += pageBtn(i);
        }
    } else {
        // Always show first page
        html += pageBtn(1);

        if (current <= 3) {
            // Near start
            for (let i = 2; i <= 4; i++) {
                html += pageBtn(i);
            }
            html += `<span class="px-2">...</span>`;
            html += pageBtn(total);
        }
        else if (current > 3 && current < total - 2) {
            // Middle
            html += `<span class="px-2">...</span>`;
            for (let i = current - 1; i <= current + 1; i++) {
                html += pageBtn(i);
            }
            html += `<span class="px-2">...</span>`;
            html += pageBtn(total);
        }
        else {
            // Near end
            html += `<span class="px-2">...</span>`;
            for (let i = total - 3; i <= total; i++) {
                html += pageBtn(i);
            }
        }
    }

    html += `<button class="pagination-btn bg-white px-3 py-1 rounded text-light-gray1 text-sm" data-page="${current + 1}" ${current === total ? 'disabled' : ''}>Next</button>`;

    $container.find('#pagination-container').html(html);
}

// Initial tab click to load data
$('[data-tab="post-history"], [data-tab="saved-post"]').on('click', function () {
    const tab = $(this).data('tab');
    const $container = tab === 'post-history' ? $('#postHistory') : $('#postSaved');
    loadPostHistory(1, $container);
});

// Trigger on typing into search
$(document).on('input', 'input[name="post_history_query"]', function () {
    const $container = $(this).closest('.postDiv');
    loadPostHistory(1, $container);
});

// Pagination button click
$(document).on('click', '.pagination-btn', function () {
    const page = $(this).data('page');
    const $container = $(this).closest('.postDiv');
    loadPostHistory(page, $container);
});

// Custom date range click (correct class name)
$(document).on("click", ".postdaterange", function () {
    // Highlight selected range
    $(".postdaterange").removeClass("font-bold");
    $(this).addClass("font-bold");
    
    // Get selected range
    const rangeLabel = $(this).data("range");
    const { start, end } = calculateDateRange(rangeLabel);
    
    // Find the nearest tab container
    const $tabDiv = $(this).closest(".postDiv");

    $tabDiv.data("start-date", start);
    $tabDiv.data("end-date", end);

    loadPostHistory(1, $tabDiv);
});

function calculateDateRange(rangeLabel) {
    const endDate = new Date();
    let startDate = new Date();

    switch (rangeLabel) {
        case "1 Week":
            startDate.setDate(endDate.getDate() - 7);
            break;
        case "1 Month":
            startDate.setMonth(endDate.getMonth() - 1);
            break;
        case "1 Year":
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        default:
            return { start: "", end: "" };
    }

    const formatDate = (d) => d.toISOString().split("T")[0];
    return {
        start: formatDate(startDate),
        end: formatDate(endDate),
    };
}

});
