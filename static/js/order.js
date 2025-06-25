$(document).ready(function () {
  
  // Handle chat item click: highlight selected, show related chat, hide ticket list on small screens
  $(".issue-item").on("click", function () {
    const chatId = $(this).data("chat-id");
    $(".issue-item").removeClass("bg-teal-veil");
      $(this).addClass("bg-teal-veil");
      $(this).find("title").addClass("text-teal-veil");
    
    $(".chat-profile").addClass("hidden");
    $('.chat-profile[data-id="' + chatId + '"]').removeClass("hidden");
    if (window.innerWidth < 1024) {
      $(".ticket-list").addClass("hidden");
    }
  });

  // Toggle ticket menu visibility
  $(".ticket-menu").on("click", function (e) {
    e.stopPropagation(); 
    $(".ticket-list").toggle();
  });

  // Hide ticket list when clicking outside menu or list
  $(document).on("click", function (event) {
    const $target = $(event.target);
    if (
      !$target.closest(".ticket-menu").length &&
      !$target.closest(".ticket-list").length
    ) {
      $(".ticket-list").addClass("hidden");
    }
  });
  
  // Order tracking: add new status with visual indicators if not already added
  const addedStatuses = new Set();

  function addStatus(statusText, timestamp) {
    if (addedStatuses.has(statusText)) {
      return;
    }
    addedStatuses.add(statusText);
    let dotsCount = $('#statusDots div').length;
    if (dotsCount > 0) {
      $('#statusDots').append(`
        <hr class="text-light-sea-green h-6 w-0 ml-1.5 border-2">
      `);
    }
    $('#statusDots').append(`
      <div class="bg-light-sea-green rounded-full h-4 w-4"></div>
    `);
    $('#statusLabels').append(`
      <p class="font-normal text-base">${statusText}</p>
    `);
    $('#statusTimes').append(`
      <p class="font-semibold text-base">${timestamp}</p>
    `);
  }

  // Show tracking popup with selected status
  $(".order-tracking-btn").on("click", function () {
    let status = $(this).data("status");
    let color = $(this).data("color");
    addStatus(status, "02/05/2025, 16:30");
    $(".order-current-status").html(status).addClass(`text-${color}`);
    $(".trackingPopup")
      .removeClass("hidden")
      .addClass("flex");
  });

  // Show specific popup
  $(".popup-btn").on("click", function () {
    let popupId = $(this).data("popup");
    $("." + popupId)
      .removeClass("hidden")
      .addClass("flex");
  });

  // Close popup
  $(".close-popup").on("click", function () {
    let popupId = $(this).data("popup");
    $(this).closest("." + popupId).addClass("hidden").removeClass("flex");
  });

  // Toggle status dropdown
  $('.status-btn').on('click', function () {
      $('.status-dropdown').toggle();
  });

  // Hide status dropdown when clicking outside
  $(document).on('click', function (e) {
      if (!$(e.target).closest('.status-btn, .status-dropdown').length) {
          $('.status-dropdown').hide();
      }
  });

  // Image upload: preview up to 4 images, allow removal
  let maxImages = 4;

  $('#image-upload').on('change', function (e) {
    let files = Array.from(e.target.files);
    let currentImages = $('#preview img').length;
    if ((files.length + currentImages) > maxImages) {
      window.showToaster('error', 'You can only upload up to 4 images.');
      return;
    }
    files.forEach(file => {
      let reader = new FileReader();
      reader.onload = function (e) {
        const previewHtml = `
          <div class="image-thumb relative mb-4">
            <img src="${e.target.result}" class="w-16 h-16 object-cover rounded" />
            <span class="remove-btn material-symbols-outlined cursor-pointer material-filled text-jet-black absolute right-0 top-0 -mt-2 -mr-3">cancel</span>
          </div>
        `;
        $('#preview').append(previewHtml);
      };
      reader.readAsDataURL(file);
    });
    $(this).val('');
  });

  // Remove selected image from preview
  $(document).on('click', '.remove-btn', function () {
    $(this).closest('.image-thumb').remove();
  });

  // Star rating: highlight stars up to the one clicked
  $("#starRating span").click(function () {
    const index = $(this).index();
    $("#starRating span").removeClass("material-filled text-star-yellow");
    $("#starRating span").each(function (i) {
      if (i <= index) $(this).addClass("material-filled text-star-yellow");
    });
  });

  //Notification Dropdown
   const $bellIcon = $("#bell-icon");
  const $popup = $("#popup");
  const $closePopup = $("#close-popup");
  const $viewDetailsDropdown = $("#viewDetailsDropdown");
  const $openViewDetails = $(".openViewDetails");
  const $closeViewDetailsDropdown = $(".closeViewDetailsDropdown");
  $bellIcon.on("click", function (e) {
    e.stopPropagation();
    $popup.toggleClass("hidden");
    $viewDetailsDropdown.addClass("hidden");
  });
  $closePopup.on("click", function () {
    $popup.addClass("hidden");
  });
  $openViewDetails.on("click", function (e) {
    e.stopPropagation();
    $popup.addClass("hidden");
    $viewDetailsDropdown.removeClass("hidden");
  });
  $closeViewDetailsDropdown.on("click", function () {
    $viewDetailsDropdown.addClass("hidden");
    $popup.removeClass("hidden");
  });
  $(document).on("click", function (e) {
    const $target = $(e.target);

    if (!$target.closest("#popup").length && !$target.is("#bell-icon")) {
      $popup.addClass("hidden");
    }

    if (
      !$target.closest("#viewDetailsDropdown").length &&
      !$target.closest(".openViewDetails").length
    ) {
      $viewDetailsDropdown.addClass("hidden");
    }
  });
$('.amount-btn').on('click', function () {
  // Extract number from button text (e.g., ₹500 → 500)
  const amount = $(this).text().replace(/[^\d]/g, '');
  $('#amountInput').val(amount);
});

//receipt popup
 $(".view-receipt").on("click", function () {
    $(".viewModal").removeClass("hidden");
   });
  $(".closeModal").on("click", function () {
    $(".viewModal").addClass("hidden");
   
  });

  //View Button Popup
   $(".view-file").on("click", function () {
    $(".fileModal").removeClass("hidden"); 
  });
  $(".closeModal").on("click", function () {
    $(".fileModal").addClass("hidden");
   });


   
   $('.closehistoryBtn').on("click",function(){
    window.history.back();
   })
   $('.closeadvance-btn').on("click",function(){
    window.history.back();
   })
    $('.cancelBtn').on("click",function(){
    window.history.back();
   })


   //viewDetails Popup
    $(".view-detailsBtn").on("click", function (e) {
    e.preventDefault();
    $(".summaryPopup").removeClass("hidden");
  });

  $(".closeSummaryPopup").on("click", function () {
    $(".summaryPopup").addClass("hidden");
  });
  $(document).on("click", function (e) {
    if (
      !$(e.target).closest(".summaryPopup > div").length &&
      !$(e.target).is(".view-detailsBtn")
    ) {
      $(".summaryPopup").addClass("hidden");
    }
  });

  $(".recharge-btn").on("click", function () {
    $(".viewModal").removeClass("hidden");
   });
  $(".closeModal").on("click", function () {
    $(".viewModal").addClass("hidden");
  });

  $(".bookmark-fill").click(function () {
    $(this).addClass(`material-filled text-light-sea-green`);
  });
});