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

    //Order View Popup Functionality

    const orderViewBtn = $(".order-view-btn");
    const orderCloseBtn = $('.order-view-close');

    orderViewBtn.on("click", function () {
        $('.order-view-modal').removeClass('hidden').addClass('flex');
    })

    orderCloseBtn.on('click', function () {
        $('.order-view-modal').removeClass('flex').addClass('hidden');
    })

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

    //Donation View Popup Functionality

    const donationViewBtn = $(".donation-view-btn");
    const donationCloseBtn = $('.donation-view-close');

    donationViewBtn.on("click", function () {
        $('.donation-view-modal').removeClass('hidden').addClass('flex');
    })

    donationCloseBtn.on('click', function () {
        $('.donation-view-modal').removeClass('flex').addClass('hidden');
    })
});
    