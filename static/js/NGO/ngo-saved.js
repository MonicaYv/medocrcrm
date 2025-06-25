$(document).ready(function () {
    const directionBtn = $(".direction-trigger");

    // Show the modal when trigger is clicked
    directionBtn.on('click', function (e) {
        $(".direction-modal").removeClass('hidden').addClass('flex');
    });

    // Hide the modal when clicking outside of it
    $(document).on('click', function (event) {
        const $modal = $(".direction-modal");
        const $popupBox = $modal.find("> div"); // direct child is the popup

        if (
            $modal.is(":visible") &&
            !$popupBox.is(event.target) &&
            $popupBox.has(event.target).length === 0 &&
            !$(event.target).closest(".direction-trigger").length
        ) {
            $modal.removeClass("flex").addClass("hidden");
        }
    });

    //Place View Popup Functionality

    const placeViewBtn = $(".place-view-btn");
    const placeCloseBtn = $('.place-view-close');

    placeViewBtn.on("click", function () {
        $('.place-view-modal').removeClass('hidden').addClass('flex');
    })

    placeCloseBtn.on('click', function () {
        $('.place-view-modal').removeClass('flex').addClass('hidden');
    })

    //Medicine View Popup Functionality

    const medicineViewBtn = $(".medicine-view-btn");
    const medicineCloseBtn = $('.medicine-view-close');

    medicineViewBtn.on("click", function () {
        $('.medicine-view-modal').removeClass('hidden').addClass('flex');
    })

    medicineCloseBtn.on('click', function () {
        $('.medicine-view-modal').removeClass('flex').addClass('hidden');
    })

    //Post View of popup of share
    $('.share-preview-btn').on('click', function () {
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

    //Saved View Popup Functionality

    const savedViewBtn = $(".saved-view-btn");
    const savedCloseBtn = $('.saved-view-close');

    savedViewBtn.on("click", function () {
        $('.saved-view-modal').removeClass('hidden').addClass('flex');
    })

    savedCloseBtn.on('click', function () {
        $('.saved-view-modal').removeClass('flex').addClass('hidden');
    })

    $('.preview-view').on('click', function () {
        $('.preview-popup').removeClass('hidden').addClass('flex');
    });

    $('.preview-close').on('click', function () {
        $('.preview-popup').removeClass('flex').addClass('hidden');
    });

});
