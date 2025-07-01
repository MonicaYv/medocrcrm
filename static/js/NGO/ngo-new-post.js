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
        $wrapper.find('.dropdown-input').val(selectedText);
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
        if (file && file.type.startsWith('image/')) {
            const fileInput = $(this).find('input[type="file"]')[0];
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            $(fileInput).trigger('change');
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
        const area = $(this).closest('.upload-area');
        const preview = area.find('.upload-preview');
        const placeholder = area.find('.upload-placeholder');

        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                preview.find('.uploaded-img').attr('src', e.target.result);
                placeholder.addClass('hidden');
                preview.removeClass('hidden').addClass("flex");
            };
            reader.readAsDataURL(file);
        }
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
        preview.addClass('hidden').removeClass("flex");
        placeholder.removeClass('hidden');
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
            icon: "bookmark",
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
                    window.showToaster('error', 'Only 8 tags can be selected.');
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
    $('#new-post-form').on('submit', function (e) {
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
                    window.showToaster('error', 'Please fill all required fields');
                    response.missing_fields.forEach(function(field) {
                        var inputName = fieldNameMap[field] || field.toLowerCase().replace(/ /g, '_');
                        var $input = $('[name="' + inputName + '"]');
                        var $errorTarget = $input;

                        // Debug logging
                        console.log('Missing field:', field, 'Mapped input name:', inputName, 'Input found:', $input.length);

                        if ($input.length) {
                            if ($input.closest('.dropdown-wrapper').length) {
                                // For dropdowns, always append after the closest .space-y-2 container
                                var $container = $input.closest('.space-y-2');
                                if ($container.length) {
                                    $errorTarget = $container;
                                } else {
                                    $errorTarget = $input.closest('.dropdown-wrapper');
                                }
                            } else if ($input.closest('.calendar-wrapper').length) {
                                $errorTarget = $input.closest('.calendar-wrapper');
                            } else if (inputName === 'creatives') {
                                $errorTarget = $('.upload-area');
                            }
                        } else {
                            // Fallback: try to find the .space-y-2 by label text
                            var $label = $("h1:contains('" + field + "')");
                            if ($label.length) {
                                $errorTarget = $label.closest('.space-y-2');
                            }
                        }
                        if ($errorTarget && $errorTarget.length) {
                            $errorTarget.after('<div class="field-error text-red-600 text-sm mt-1">' + field + ' is required.</div>');
                        }
                    });
                    // Optionally scroll to first error
                    var $firstError = $('.field-error').first();
                    if ($firstError.length) {
                        $('html, body').animate({ scrollTop: $firstError.offset().top - 100 }, 300);
                    }
                } else if (response.success) {
                    window.showToaster('success', 'Post Submitted');
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
                // Show the popup
                $('.preview-popup').removeClass('hidden').addClass('flex');
            },
            error: function() {
                window.showToaster('error', 'Could not load post details.');
            }
        });
    });
});
