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
            parentEl: $wrapper,  // Will now position inside this wrapper
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
            $wrapper.find('.selected-date').text(picker.startDate.format('DD/MM/YYYY'));
        });

        $input.on('cancel.daterangepicker', function (e, picker) {
            $wrapper.find('.selected-date').text('DD/MM/YY');
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
});
