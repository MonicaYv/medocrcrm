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



  $('.closehistoryBtn').on("click", function () {
    window.history.back();
  })
  $('.closeadvance-btn').on("click", function () {
    window.history.back();
  })
  $('.cancelBtn').on("click", function () {
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

  // 1 variable with multiple theme colors
  const themeColors = {
    customers: 'vivid-orange',
    Advertiser: 'living-coral',
    NGO: 'violet-sky',
    pharmacy: 'light-sea-green',
    client: 'dark-blue'
  };

  // Get the current path
  const path = window.location.pathname;

  // Default color
  let selectedColor = '#F79E1B';
  let bgColor;

  // Loop and match theme by keyword in path
  $.each(themeColors, function (keyword, color) {
    if (path.includes(keyword)) {
      selectedColor = color;
      bgColor = selectedColor == "vivid-orange"
        ? "#F79E1B"
        : selectedColor == "living-coral"
          ? "#FF6F61"
          : selectedColor == "light-sea-green"
            ? "#3AAFA9"
            : selectedColor == "dark-blue"
              ? "#123456"
              : "#6B79F5";
      return false;
    }
  });
  console.log(bgColor);
  document.documentElement.style.setProperty('--radio-border-color', bgColor);
  document.documentElement.style.setProperty('--radio-fill-color', bgColor);
});

$(".tab-btn-rewards").on("click", function () {
  $(".tab-btn-rewards").removeClass("active-tab-rewards text-dark-gray border-b-2 border-dodger-blue")
    .addClass("text-light-gray1");
  $(this).addClass("active-tab-rewards text-dark-gray border-b-2 border-dodger-blue")
    .removeClass("text-light-gray1");
  $(".tab-content").addClass("hidden");
  let tab = $(this).data("tab");
  $("." + tab).removeClass("hidden");
});


// Inject CSS for Material Symbols fill directly into the page
$("<style>")
  .prop("type", "text/css")
  .html(`
        .material-symbols-outlined.filled {
            font-variation-settings:
                'FILL' 1,
                'wght' 400,
                'GRAD' 0,
                'opsz' 24;
        }
        .material-symbols-outlined {
            font-variation-settings:
                'FILL' 0,
                'wght' 400,
                'GRAD' 0,
                'opsz' 24;
        }
    `)
  .appendTo("head");


// ⭐ Star rating click function
$(".star").on("click", function () {
  let index = $(this).index();

  $(".star").each(function (i) {
    if (i <= index) {
      $(this)
        .text("star")                     // Filled star
        .addClass("filled text-yellow-400")
        .removeClass("text-muted-blue");
    } else {
      $(this)
        .text("star_outline")             // Outline star
        .removeClass("filled text-yellow-400")
        .addClass("text-muted-blue");
    }
  });
});

// share button
$(document).on("click", "#shareBtn", function () {
  const shareText =
    "Order Details:\nCustomer: Ahmad R\nOrder ID: 512345\nTotal: ₹800";

  // ✅ Modern browsers (mobile + desktop)
  if (navigator.share) {
    navigator
      .share({
        title: "Order Details",
        text: shareText,
        url: window.location.href,
      })
      .catch(function () {
        console.log("Share cancelled");
      });
  }
  // ✅ WhatsApp fallback
  else {
    const whatsappUrl =
      "https://wa.me/?text=" + encodeURIComponent(shareText);
    window.open(whatsappUrl, "_blank");
  }
});


//sample qr

$(document).on("click", ".qr-toggle", function () {
  const $section = $(this).closest(".qr-section");
  const $qrContent = $section.find(".qr-content");
  const $icon = $section.find(".qr-icon");

  $qrContent.slideToggle(200);

  // rotate icon
  $icon.toggleClass("rotate-180");
});

// Close BOTH popups when cancel is confirmed
$("#confirmCancelOrder").on("click", function () {
  $(".popup-overlay").addClass("hidden").removeClass("flex");
});

//order summary expansion
$(".order-summary-toggle").on("click", function () {
    const container = $(this).closest(".order-summary");
    const content = container.find(".order-summary-content");
    const icon = $(this).find(".toggle-icon");

    content.slideToggle(200);

    icon.text(icon.text() === "expand_more" ? "expand_less" : "expand_more");
});

//review summary expansion
$(".review-summary-toggle").on("click", function () {
    const parent = $(this).closest(".review-summary");
    const content = parent.find(".review-summary-content");
    const icon = $(this).find(".review-toggle-icon");

    content.slideToggle(200);
    icon.text(icon.text() === "expand_more" ? "expand_less" : "expand_more");
});

//open the map
$(document).on("click", ".open-order-map, #openMap", function () {
    const address = $(this).data("address") || "Saket Enclave, Chhijarpur, New Delhi";
    if (!address) return;
    const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}`;
    window.open(mapUrl, "_blank");
});

$(document).on("click", ".pharmacy-open-share", function (e) {
    e.stopPropagation();
    $(this).siblings(".pharmacy-share-modal").removeClass("hidden").addClass("flex");
});

$(document).on("click", ".pharmacy-close-share", function () {
    $(this).closest(".pharmacy-share-modal").addClass("hidden").removeClass("flex");
});

$(document).on("click", ".pharmacy-copy-btn", function () {
    const $input = $(this).siblings(".pharmacy-share-link");
    navigator.clipboard.writeText($input.val());
});

document.addEventListener("DOMContentLoaded", () => {

    // OPEN POPUP
    document.querySelectorAll(".open-popup").forEach(btn => {
        btn.addEventListener("click", () => {
            const popupId = btn.dataset.popup;
            const popup = document.getElementById(popupId);

            if (popup) {
                popup.classList.remove("hidden");
                popup.classList.add("flex");
                document.body.style.overflow = "hidden"; // prevent background scroll
            }
        });
    });

    // CLOSE POPUP
    document.querySelectorAll(".close-popup").forEach(btn => {
        btn.addEventListener("click", () => {
            const popupId = btn.dataset.popup;
            const popup = document.getElementById(popupId);

            if (popup) {
                popup.classList.add("hidden");
                popup.classList.remove("flex");
                document.body.style.overflow = "";
            }
        });
    });

});
document.querySelectorAll(".popup-overlay").forEach(popup => {
    popup.addEventListener("click", (e) => {
        if (e.target === popup) {
            popup.classList.add("hidden");
            popup.classList.remove("flex");
            document.body.style.overflow = "";
        }
    });
});
