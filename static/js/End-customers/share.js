// 1. Tab switching logic
$('.share-tabs-button-end-customer').click(function () {
    const target = $(this).data('tab');

    // Show/hide tab content and style
    $('.tab-sub-content').addClass('hidden').removeClass('block');
    $('.' + target).removeClass('hidden').addClass('block');

    $('.share-tabs-button-end-customer').removeClass('bg-vivid-orange text-white shadow-md');
    $('.tab-selection').addClass("hidden")
    $(this).addClass('bg-vivid-orange text-white shadow-md');
});

// 2. Upload area click to trigger file input
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

// 3. Drag and drop handling
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

// 4. Change image
$('.upload-area').on('click', '.change-image-btn', function (e) {
    e.stopPropagation();
    const area = $(this).closest('.upload-area');
    area.find('input[type="file"]').trigger('click');
});

// 5. File input change handler
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

            if (area.closest('.medicine').length > 0) {
                $('.medicine .get-btn').removeClass('hidden');
            } else if (area.closest('.prescription').length > 0) {
                $('.prescription .prescription-form-section').removeClass('hidden');
            } else if (area.closest('.bills').length > 0) {
                $('.bills .bill-form-section').removeClass('hidden');
            }
        };
        reader.readAsDataURL(file);
    }
});

// 6. Cancel upload
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

    if (area.closest('.medicine').length > 0) {
        const medicineUploads = $('.medicine .upload-input').filter(function () {
            return this.files.length > 0;
        }).length;
        if (medicineUploads === 0) {
            $('.medicine-form-section').addClass('hidden').removeClass('block');
            $('.medicine .get-btn').addClass('hidden').removeClass('bg-gray-300 text-gray-600 cursor-not-allowed');
        }
    } else if (area.closest('.prescription').length > 0) {
        $('.prescription .prescription-form-section').addClass('hidden');
    } else if (area.closest('.bills').length > 0) {
        $('.bills .bill-form-section').addClass('hidden');
    }
});

// Fetch button click to show form and disable itself (Medicine Section)
$('.medicine .get-btn').on('click', function () {
    $('.medicine-form-section').removeClass('hidden').addClass('block');
    $(this).addClass('bg-gray-300 text-gray-600 cursor-not-allowed');
});;

$('.upload-cancel').click(function () {
    $('.medicine-form-section').addClass('hidden').removeClass('block');
    $('.medicine .get-btn').removeClass('bg-gray-300 text-gray-600 cursor-not-allowed').addClass('bg-vivid-orange text-white');
});

// Upload File Modal Functionality
$(".file-share-btn").click(function () {
    $(".share-success-modal").removeClass("hidden").addClass("flex");;
});

$(".modal-close").click(function () {
    $(".share-success-modal").removeClass("flex").addClass("hidden");
});

$('.file-share-form, .prescription-share-form, .bill-share-form').submit(function (e) {
    e.preventDefault();
});


// Prescription

$('.prescription-share-cancel').click(function () {
    $('.prescription-form-section').addClass('hidden').removeClass('block');
});

// Bills

$('.bill-share-cancel').click(function () {
    $('.bill-form-section').addClass('hidden').removeClass('block');
});

$(".bill-share-btn").click(function () {
    $(".bill-success-modal").removeClass("hidden").addClass("flex");;
});

$(".bill-modal-close").click(function () {
    $(".bill-success-modal").removeClass("flex").addClass("hidden");
});
