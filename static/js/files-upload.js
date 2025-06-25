$(document).ready(function () {
    $('.upload-tabs-button').click(function () {
        const target = $(this).data('tab');

        // Hide all content
        $('.tab-content').addClass('hidden').removeClass('block');

        // Show selected content
        $('.' + target).removeClass('hidden').addClass('block');

        // Style active tab
        $('.upload-tabs-button').removeClass('bg-light-sea-green text-white shadow-md');
        $(this).addClass('bg-light-sea-green text-white shadow-md');
    });

    // Set default active tab
    $('.upload-tabs-button[data-tab="prescription"]').click();

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

    // Handle drag styling
    $('.upload-area').on('dragover', function (e) {
        e.preventDefault();
    });

    $('.upload-area').on('dragleave', function (e) {
        e.preventDefault();
    });

    // Handle file drop
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

    // Handle "Change image" button click
    $('.upload-area').on('click', '.change-image-btn', function (e) {
        e.stopPropagation(); // Prevent triggering upload-area click
        const area = $(this).closest('.upload-area');
        area.find('input[type="file"]').trigger('click');
    });

    let hasUploaded = false;

    // Function to check if any image is uploaded
    function checkUploads() {
        let uploaded = false;
        $('.upload-input').each(function () {
            if (this.files.length > 0) {
                uploaded = true;
                return false; // break loop
            }
        });

        if (uploaded) {
            $('.medicine .fetch-btn').removeClass('hidden'); // Show fetch button
            hasUploaded = true;
        } else {
            $('.medicine .fetch-btn').addClass('hidden');
            hasUploaded = false;
        }
    }

    // Show uploaded image
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
                preview.removeClass('hidden');
                checkUploads();
            };
            reader.readAsDataURL(file);
        }
    });

    // Cancel upload
    $('.upload-area').on('click', '.cancel-upload', function (e) {
        e.stopPropagation(); // Prevent triggering upload
        const area = $(this).closest('.upload-area');
        const input = area.find('input[type="file"]');
        const preview = area.find('.upload-preview');
        const placeholder = area.find('.upload-placeholder');

        // Reset
        input.val('');
        preview.addClass('hidden');
        placeholder.removeClass('hidden');

        checkUploads();

        // If no uploads left, hide medicine form and reset fetch button
        if (!hasUploaded) {
            $('.medicine-form-section').addClass('hidden').removeClass('block');
            $('.medicine .fetch-btn').addClass('hidden').removeClass('bg-gray-300 text-gray-600 cursor-not-allowed');
        }
    });

    // Fetch button click to show form and disable itself
    $('.medicine .fetch-btn').on('click', function () {
        if (hasUploaded) {
            $('.medicine-form-section').removeClass('hidden').addClass('block');
            $(this).addClass('bg-gray-300 text-gray-600 cursor-not-allowed');
        }
    });

    $('.upload-cancel').click(function () {
        $('.medicine-form-section').addClass('hidden').removeClass('block');
    })

    // Upload File Modal Functionality
    $(".file-upload-btn").click(function () {
        $(".successModal").removeClass("hidden").addClass("flex");;
    });

    $(".modal-close").click(function () {
        $(".successModal").removeClass("flex").addClass("hidden");
    }); 

    $('.file-upload-form').submit(function (e) {
        e.preventDefault();
    });
});