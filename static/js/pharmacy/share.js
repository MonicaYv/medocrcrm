// 1. Tab switching logic
$('.share-tabs-button-pharmacy').click(function () {
    const target = $(this).data('tab');

    // Show/hide tab content and style
    $('.tab-sub-content').addClass('hidden').removeClass('block');
    $('.' + target).removeClass('hidden').addClass('block');

    $('.share-tabs-button-pharmacy').removeClass('bg-light-sea-green text-white shadow-md');
    $('.tab-selection').addClass("hidden")
    $(this).addClass('bg-light-sea-green text-white shadow-md');
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

            if (area.closest('.upload-database').length > 0) {
                $('.upload-database .get-btn').removeClass('hidden');
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

    if (area.closest('.upload-database').length > 0) {
        const medicineUploads = $('.upload-database .upload-input').filter(function () {
            return this.files.length > 0;
        }).length;
        if (medicineUploads === 0) {
            $('.upload-form-section').addClass('hidden').removeClass('block');
            $('.upload-database .get-btn').addClass('hidden').removeClass('bg-gray-300 text-gray-600 cursor-not-allowed');
        }
    } else if (area.closest('.prescription').length > 0) {
        $('.prescription .prescription-form-section').addClass('hidden');
    } else if (area.closest('.bills').length > 0) {
        $('.bills .bill-form-section').addClass('hidden');
    }
});

// Fetch button click to show form and disable itself (Medicine Section)
$('.upload-database .get-btn').on('click', function () {
    $('.upload-form-section').removeClass('hidden').addClass('block');
    $(this).addClass('bg-gray-300 text-gray-600 cursor-not-allowed');
});;

$('.upload-cancel').click(function () {
    $('.upload-form-section').addClass('hidden').removeClass('block');
    $('.upload-database .get-btn').removeClass('bg-gray-300 text-gray-600 cursor-not-allowed').addClass('bg-vivid-orange text-white');
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

function toggleSharePoints() {
    if ($('.tab-btn-pharmacy[data-tab="share"]').hasClass('active-tab-pharmacy')) {
        $('.share-points').removeClass('invisible').addClass('visible');
    } else {
        $('.share-points').removeClass('visible').addClass('invisible');
    }
}

toggleSharePoints();

$('.tab-btn-pharmacy').on('click', function () {
    $('.tab-btn-pharmacy').removeClass('active-tab-pharmacy');
    $(this).addClass('active-tab-pharmacy');

    toggleSharePoints();
});

$(document).on('click', '.dropdown-input', function (e) {
    e.stopPropagation();
    const $input = $(this);
    const $wrapper = $input.closest('.dropdown-wrapper');
    const $dropdown = $wrapper.find('.dropdown-list');

    // Don't toggle dropdown if input is editable (i.e., Custom is selected)
    if (!$input.prop('readonly')) return;

    // Hide other dropdowns and show current one
    $('.dropdown-list').not($dropdown).hide();
    $dropdown.toggle();
});

// Select option
$(document).on('click', '.dropdown-list div', function (e) {
    e.stopPropagation();
    const $item = $(this);
    const selectedText = $item.text().trim();
    const $wrapper = $item.closest('.dropdown-wrapper');
    const $input = $wrapper.find('.dropdown-input');
    const $dropdown = $wrapper.find('.dropdown-list');

    if (selectedText.startsWith('Custom')) {
        $input.val('').prop('readonly', false).focus(); // Allow typing
    } else {
        $input.val(selectedText).prop('readonly', true); // Make readonly again
    }

    $dropdown.hide();
});

// Hide dropdown on outside click
$(document).on('click', function () {
    $('.dropdown-list').hide();
});

//Post View of popup of share
$('.material-symbols-outlined:contains("visibility")').on('click', function () {
    $('.share-post-view-modal').removeClass('hidden').addClass('flex');
});

$('.share-post-view-close').on('click', function () {
    $('.share-post-view-modal').removeClass('flex').addClass('hidden');
});

const shareViewBtn = $(".share-view-btn");
const shareCloseBtn = $('.share-view-close');

shareViewBtn.on("click", function () {
    $('.share-view-modal').removeClass('hidden').addClass('flex');
})

shareCloseBtn.on('click', function () {
    $('.share-view-modal').removeClass('flex').addClass('hidden');
})
