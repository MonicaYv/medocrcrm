$(document).ready(function () {
  $("#requestSentModal").hide();

  // Upload functionality
  const maxSize = 20 * 1024 * 1024; // 20MB
  const $fileInput = $("#file-input");
  const $uploadArea = $("#upload-area");
  const $infoSpan = $("#file-info");
  const $fileName = $("#file-name");
  const $imagePreview = $("#image-preview");
  const $videoPreview = $("#video-preview");
  const $audioPreview = $("#audio-preview");
  const $closeBtn = $("#close-btn");
  $uploadArea.on("click", function (e) {
    e.stopPropagation();
    console.log("Upload area clicked");
    $fileInput[0].click();
  });
  $fileInput.on("change", function () {
    const file = this.files[0];
    hideAllPreviews();
    $fileName.text("");
    $closeBtn.addClass("hidden");
    $(".medicine-tables").addClass("hidden");

    if (!file) return;

    if (file.size > maxSize) {
      $infoSpan
        .text("File size exceeds 20MB.")
        .removeClass("text-xs text-gray-600")
        .addClass("text-red-600 font-semibold");
      return;
    }

    const fileType = file.type;
    const fileURL = URL.createObjectURL(file);

    $fileName.text("Selected: " + file.name);
    $infoSpan
      .text("Audio (MP3, WAV), Video (MP4, MOV), and Image (JPG, PNG, GIF). Maximum file size: 20MB.")
      .removeClass("text-red-600 font-semibold")
      .addClass("text-xs text-gray-600");

    if (fileType.startsWith("image/")) {
      $imagePreview.attr("src", fileURL).removeClass("hidden");
    } else if (fileType.startsWith("video/")) {
      $videoPreview.attr("src", fileURL).removeClass("hidden");
    } else if (fileType.startsWith("audio/")) {
      $audioPreview.attr("src", fileURL).removeClass("hidden");
    }

    $closeBtn.removeClass("hidden");
    $(".medicine-tables").removeClass("hidden");
  });
  $closeBtn.on("click", function () {
    console.log("Close button clicked");
   
    hideAllPreviews();
    $fileInput.val("");
    $fileName.text("");
    $closeBtn.addClass("hidden");
    $(".medicine-tables").addClass("hidden");
    $infoSpan
      .text("Audio (MP3, WAV), Video (MP4, MOV), and Image (JPG, PNG, GIF). Maximum file size: 20MB.")
      .removeClass("text-red-600 font-semibold")
      .addClass("text-xs text-gray-600");
  });

  function hideAllPreviews() {
    $imagePreview.addClass("hidden").attr("src", "");
    $videoPreview.addClass("hidden").attr("src", "");
    $audioPreview.addClass("hidden").attr("src", "");
  }

  // Add To Cart
    $("#add-to-cart-btn").on("click", function () {
    $("#cart-popup").removeClass("hidden");
  });
  $("#close-success-popup").on("click", function (e) {
    e.stopPropagation(); 
    $("#cart-popup").addClass("hidden");
  });
  $("#cart-popup").on("click", function (e) {
    if ($(e.target).is("#cart-popup")) {
      $("#cart-popup").addClass("hidden");
    }
  });

  // Sample bill
  $(".sample-bill-trigger").on("click", function () {
    $(".sample-bill-modal").removeClass("hidden");
  });

  $(".close-sample-bill").on("click", function () {
    $(".sample-bill-modal").addClass("hidden");
  });

  $(".openQrModal").click(function () {
    $(".qrModal").removeClass("hidden");
  });

  $(".closeQrModal").click(function () {
    $(".qrModal").addClass("hidden");
  });

  $(".qrModal").click(function (e) {
    if ($(e.target).is(".qrModal")) {
      $(this).addClass("hidden");
    }
  });

  // Star rating
  $("#starRating span").click(function () {
    const index = $(this).index();
    $("#starRating span").removeClass("filled");
    $("#starRating span").each(function (i) {
      if (i <= index) $(this).addClass("filled");
    });
  });

  // Toast
  $(".download-icon").click(function () {
    $("#toast").fadeIn(300).delay(2000).fadeOut(300);
  });

  // Counter
  $(".increase").click(function () {
    const input = $(this).siblings(".quantity");
    input.val(parseInt(input.val()) + 1);
  });

  $(".decrease").click(function () {
    const input = $(this).siblings(".quantity");
    const val = parseInt(input.val());
    if (val > 0) input.val(val - 1);
  });

  // Address modal
  $("#addAddress").click(function () {
    $("#addressModal").removeClass("hidden");
  });

  $("#closeModal, .cancel-btn").click(function () {
    $("#addressModal").addClass("hidden");
  });

  $("#addressModal").click(function (e) {
    if ($(e.target).is("#addressModal")) {
      $(this).addClass("hidden");
    }
  });

  // Request sent modal
  $("#sendrequest-btn").click(function () {
    $("#requestSentModal").removeClass("hidden").hide().fadeIn();
  });

  $("#closeModalBtn").click(function () {
    $("#requestSentModal").fadeOut(function () {
      $(this).addClass("hidden");
    });
  });





 

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

  $("#viewSummaryLink").on("click", function (e) {
    e.preventDefault();
    $("#summaryPopup").removeClass("hidden");
  });

  $("#closeSummaryPopup").on("click", function () {
    $("#summaryPopup").addClass("hidden");
  });
  $(document).on("click", function (e) {
    if (
      !$(e.target).closest("#summaryPopup > div").length &&
      !$(e.target).is("#viewSummaryLink")
    ) {
      $("#summaryPopup").addClass("hidden");
    }
  });

  $(".filterToggle").on("click", function (e) {
    e.stopPropagation();
    const $container = $(this).closest(".dropdown-container");
    $(".dropdown-menu").not($container.find(".dropdown-menu")).hide(); // Close others
    $container.find(".dropdown-menu").toggle();
  });

  // Select dropdown option
  $(".dropdown-option").on("click", function () {
    const selectedText = $(this).text().trim();
    const $container = $(this).closest(".dropdown-container");
    const $input = $container.find(".dropdown-input");
    if (selectedText.startsWith("Custom")) {
      $input.val("");
    } else {
      $input.val(selectedText);
    }
    $container.find(".dropdown-menu").hide();
    $input.focus();
  });

  // Close dropdown on outside click
  $(document).on("click", function () {
    $(".dropdown-menu").hide();
  });

  $(".order-tracking-btn").on("click", function () {
    let popupId = $(this).data("popup");
    $("#" + popupId)
      .removeClass("hidden")
      .addClass("flex");
  });

  $(".close-popup").on("click", function () {
    $(this).closest(".trackingPopup").addClass("hidden").removeClass("flex");
  });

  // Show correct chat-profile and highlight selected issue
$(".issue-item").on("click", function () {

  const chatId = $(this).data("chat-id");
  $(".issue-item").removeClass("bg-soft-peach");
    $(this).addClass("bg-soft-peach");
  
  $(".chat-profile").addClass("hidden");
  $('.chat-profile[data-id="' + chatId + '"]').removeClass("hidden");
  if (window.innerWidth < 1024) {
    $(".ticket-list").addClass("hidden");
  }
});



  $(".ticket-menu").on("click", function (e) {
    e.stopPropagation(); 
    $(".ticket-list").toggle();
  });
  $(document).on("click", function (event) {
    const $target = $(event.target);
    if (
      !$target.closest(".ticket-menu").length &&
      !$target.closest(".ticket-list").length
    ) {
      $(".ticket-list").addClass("hidden");
    }
  });
    $(document).on("click", function (e) {
    const $target = $(e.target);
    if (
      !$target.closest(".ticket-menu").length &&
      !$target.closest(".ticket-list").length
    ) {
      $(".ticket-list").addClass("hidden");
    }
  });

  $(".ticket-menu").on("click", function (e) {
    e.stopPropagation();
    $(".ticket-list").toggleClass("hidden");
  });

  //upload more button functionality
  let uploadedFiles = [];
  $(".uploadBtn").on("click", function () {
    $("#prescriptionUpload").click();
  });
  $("#prescriptionUpload").on("change", function () {
    const files = Array.from(this.files);

    files.forEach((file) => {
      const fileId = Date.now() + Math.random().toString(36).substring(7);
      uploadedFiles.push({ id: fileId, file: file });

      $(".fileList").append(`
        <div class="flex items-center justify-between" data-id="${fileId}">
          <span class="text-dark-gray text-sm truncate max-w-xs">${file.name}</span>
          <span class="material-symbols-outlined text-strong-red cursor-pointer remove-file">close</span>
        </div>
      `);
    });

    updateUploadMessage();
    $(this).val(""); 
  });
  $(document).on("click", ".remove-file", function () {
    const fileId = $(this).parent().data("id");
    uploadedFiles = uploadedFiles.filter((f) => f.id !== fileId);
    $(this).parent().remove();
    updateUploadMessage();
  });
  function updateUploadMessage() {
    if (uploadedFiles.length > 0) {
      $(".uploadMessage").html(`
        <span class="material-symbols-outlined bg-green rounded-full text-white p-1">check</span>
        <p class="font-semibold text-base text-jet-black inline">Medicine added, Prescription received</p>
        <span class="material-symbols-outlined rounded-full text-jet-black cursor-pointer p-1 view-files ml-2">visibility</span>
      `);
    } else {
      $(".uploadMessage").html(`
        <span class="material-symbols-outlined bg-strong-red rounded-full text-white p-1">close</span>
        <p class="font-semibold text-base text-jet-black">Medicine not added. Please upload prescription.</p>
      `);
    }
  }
  $(document).on("click", ".view-files", function () {
    if (uploadedFiles.length === 0) return;

    const previewList = uploadedFiles
      .map((entry) => {
        const file = entry.file;
        const url = URL.createObjectURL(file);
        const isImage = file.type.startsWith("image/");
        const isPDF = file.type === "application/pdf";

        if (isImage) {
          return `<li>
                  
                  <img src="${url}" alt="${file.name}" class="w-full h-auto rounded-md border border-gray-300 mt-1" />
                </li>`;
        } else if (isPDF) {
          return `<li>
                  
                  <iframe src="${url}" class="w-full h-60 mt-1 border border-gray-300 rounded-md"></iframe>
                </li>`;
        } else {
          return `<li>
                 
                  <a href="${url}" download="${file.name}" class="text-blue-600 underline mt-1 inline-block">Download File</a>
                </li>`;
        }
      })
      .join("");

    $("#fileListPreview").html(previewList);
    $("#filePreviewModal").removeClass("hidden");
  });
  $("#closePreview").on("click", function () {
    $("#filePreviewModal").addClass("hidden");
    $("#fileListPreview img, #fileListPreview iframe").each(function () {
      URL.revokeObjectURL(this.src);
    });
  });
  $("#filePreviewModal").on("click", function (e) {
  if ($(e.target).is("#filePreviewModal")) {
    $(this).addClass("hidden");
    $("#fileListPreview img, #fileListPreview iframe").each(function () {
      URL.revokeObjectURL(this.src);
    });
  }
});
  $(document).ready(function () {
    updateUploadMessage();
  });

  // Scan checkbox behavior
const checkbox = $('.scan-toggle');
const statusText = $('.status-text');
checkbox.on('change', function () {
  if (checkbox.is(':checked')) {
    checkbox.prop('indeterminate', false);
    statusText
      .text('Safe to upload')
      .removeClass()
      .addClass('status-text text-green text-16-nr');
  } else if (!checkbox.is(':checked') && checkbox.prop('indeterminate') !== true) {
    checkbox.prop('indeterminate', true);
    statusText
      .text('This file may contain viruses')
      .removeClass()
      .addClass('status-text text-strong-red text-16-nr');
  }
});

 // Initially hide the cards grid
    $(".medicine-grid").hide();
     $('.card-pagination').hide();
 // On Search button click
    $(".searchButton").on("click", function () {
    
     
      const searchValue = $("input[placeholder='Search by medicine name or categories']").val().trim();
  
      if (searchValue !== "") {
        $(".medicine-grid").show(); 
        $('.medicine-grid').empty();
        const proxyUrl = `http://localhost:3000/api/search-medicines?q=${encodeURIComponent(searchValue)}`;

        $.getJSON(proxyUrl, function (data) {
          if (data.length === 0) {
            $('.medicine-grid').append('<p class="text-center col-span-3 text-strong-red">No medicines found.</p>');
            $("card-pagination").hide();
            return;
          }

          data.forEach((medicine) => {
            const price = medicine.product_price ? `₹${medicine.product_price}` : 'Price not available';

            const cardHtml = `
              <div class="medicines-card">
                <span
                  class="material-symbols-outlined bookmark-fill cursor-pointer absolute right-3 sm:right-10"
                >
                  bookmark
                </span>
                <div class="w-full flex items-center justify-center">
                  <img
                    src="/public/images/medicine-img.svg"
                    alt="Medicine"
                    loading="lazy"
                  />
                </div>
                <div class="px-4 py-3 space-y-3.5">
                  <p class="text-14-fs text-medium-gray">
                    <span
                      class="text-vivid-orange uppercase tracking-[3px] font-semibold"
                    >
                      Pain Relief
                    </span>
                    (Prescription required)
                  </p>
                  <div class="space-y-1">
                    <h1 class="text-16-fs">${medicine.product_name}</h1>
                    <p class="text-14-nr text-light-gray1">
                      Mkt: ${medicine.manufacturer}
                    </p>
                  </div>
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-18-fs text-dark-gray">${price}</p>
                      <p class="text-xs font-semibold text-medium-gray">
                        MRP &#8377;${medicine.mrp}
                      </p>
                    </div>
                    <button
                      class="w-[130px] py-3 rounded-[10px] bg-vivid-orange text-18-nr text-white"
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              </div>
            `;
            $('.medicine-grid').append(cardHtml);
            $('.card-pagination').show();
          });
        });
        $('html, body').animate({
          scrollTop: $(".medicine-grid").offset().top
        }, 500);   
        $('.notice-container').hide();
      } else {
        $(".medicine-grid").hide();
      }
      });
    $("input[placeholder='Search by medicine name or categories']").on("input", function () {
  if ($(this).val().trim() === "") {
    $(".medicine-grid").hide();
     $('.notice-container').show();
  }
});

 const cardsPerPage = 6;
    const $cards = $('.medicines-card');
    const totalCards = $cards.length;
    const totalPages = Math.ceil(totalCards / cardsPerPage);
    let currentPage = 1;

    function showPage(page) {
      const start = (page - 1) * cardsPerPage;
      const end = start + cardsPerPage;

      $cards.hide().slice(start, end).show();
      currentPage = page;
      updatePaginationButtons();
    }

  function updatePaginationButtons() {
  const $paginationBtns = $('.card-paginationBtns');
  const $body = $('body');

  // Read data attributes from body
  const activeClass = $body.attr('data-btn-active');
  const inactiveClass = $body.attr('data-btn-inactive');
  const paginationTextClass = $body.attr('data-pagination-text');

  $paginationBtns.empty();

  for (let i = 1; i <= totalPages; i++) {
    const $btn = $(`<button class="px-3 py-1 rounded text-sm cursor-pointer">${i}</button>`);

    // Add correct classes
    if (i === currentPage) {
      $btn.addClass(activeClass);
    } else {
      $btn.addClass(inactiveClass);
    }

    // Optional: apply pagination text class
    if (paginationTextClass) {
      $btn.addClass(paginationTextClass);
    }

    $btn.on('click', function () {
      showPage(i);
    });

    $paginationBtns.append($btn);
  }

  $('.previous-cardPage').prop('disabled', currentPage === 1);
  $('.next-cardPage').prop('disabled', currentPage === totalPages);
}


    $('.previous-cardPage').on('click', function () {
      if (currentPage > 1) {
        showPage(currentPage - 1);
      }
    });

    $('.next-cardPage').on('click', function () {
      if (currentPage < totalPages) {
        showPage(currentPage + 1);
      }
    });

    // Initial display
    showPage(1);
  
     const $body = $('body');
  const activeClass = $body.data('btn-active');
  const inactiveClass = $body.data('btn-inactive');

  $('.activity-buttons').on('click', function () {
    // Remove active class, add inactive to all
    $('.activity-buttons')
      .removeClass(activeClass)
      
      .find('.material-symbols-outlined')
      .removeClass('text-white')
      .addClass('text-vivid-orange');

    // Add active class to selected
    $(this)
      .removeClass(inactiveClass)
      .addClass(activeClass)
      .find('.material-symbols-outlined')
      .removeClass('text-vivid-orange')
      .addClass('text-white');
  });
  // 1 variable with multiple theme colors
  const themeColors = {
    customers: 'vivid-orange',
    Advertiser: 'living-coral',
    NGO:'violet-sky',
    pharmacy:'light-sea-green',
    client:'dark-blue'
  };

  // Get the current path
  const path = window.location.pathname;

  // Default color
  let selectedColor = '#F79E1B';
  let bgColor;

  // Loop and match theme by keyword in path
  $.each(themeColors, function(keyword, color) {
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

  $(document).on("click", ".bookmark-fill", function () {
    $(this).addClass(`material-filled text-${selectedColor}`);
  })
  document.documentElement.style.setProperty('--radio-border-color', bgColor);
  document.documentElement.style.setProperty('--radio-fill-color', bgColor);

  $(document).on('keypress', 'input.only-text', function (e) {
  const char = String.fromCharCode(e.which);
  if (!/^[a-zA-Z\s]$/.test(char)) {
    e.preventDefault();
  }
  });
  

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

});


