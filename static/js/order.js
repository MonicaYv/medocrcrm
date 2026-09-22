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
$(document).on("click", ".view-invoice-btn", function () {
    const orderId = $(this).data("order-id");
    // The invoice popup is rendered right after the order details popup in the
    // order card markup, so scope the lookup to the correct popup instance.
    const $invoicePopup = $(this).closest(".popup-overlay").next(".subscriptionTaxPopupInvoice");

    if (!orderId || !$invoicePopup.length) {
        console.error("Invoice popup not found for order", orderId);
        return;
    }

    const field = (sel) => $invoicePopup.find(sel);

    // Reset stale data from a previously viewed order
    field("#invoice_no").text("-");
    field("#invoice_date").text("-");
    field("#client_name").text("-");
    field("#client_gstin").text("-");
    field("#client_address").text("-");
    field("#client_contact").text("-");
    field("#client_email").text("-");
    field("#invoice_items").empty();
    field(".invoice-subtotal").text("-");
    field(".invoice-gst").text("-");
    field(".invoice-total").text("-");
    field("#payment_mode").text("-");
    field("#txn_id").text("-");
    field("#amount_words").text("-");

    $.get(`invoice/${orderId}/`, function (data) {
        if (data.error) {
            if (window.toastr) toastr.error(data.error);
            return;
        }

        // Invoice context (this popup now shows an order invoice)
        field("#invoice_subtitle").text("Medicine Order");
        field("#invoice_no").text(data.invoice_no || "-");
        field("#invoice_date").text(data.invoice_date || "-");

        // Client details
        field("#client_name").text(data.client.name || "-");
        field("#client_gstin").text(data.client.gstin || "-");
        field("#client_address").text(data.client.address || "-");
        field("#client_contact").text(data.client.contact || "-");
        field("#client_email").text(data.client.email || "-");

        // Supplier details
        field("#supplier_gstin").text(data.supplier.gstin || "-");
        field("#supplier_name").text(data.supplier.name || "-");
        field("#supplier_address").text(data.supplier.address || "-");
        field("#supplier_contact").text(data.supplier.contact || "-");
        field("#supplier_email").text(data.supplier.email || "-");
        field("#signature_supplier_name").text(data.supplier.name || "-");

        // Invoice items
        field("#invoice_items").empty();
        (data.items || []).forEach(function (item) {
            field("#invoice_items").append(`
                <tr>
                    <td class="border border-gray-400 px-2 py-1">${item.description}</td>
                    <td class="border border-gray-400 px-2 py-1">${item.hsn}</td>
                    <td class="border border-gray-400 px-2 py-1">${item.quantity}</td>
                    <td class="border border-gray-400 px-2 py-1">₹${Number(item.rate).toFixed(2)}</td>
                    <td class="border border-gray-400 px-2 py-1">${item.gst_percent}%</td>
                    <td class="border border-gray-400 px-2 py-1">₹${Number(item.amount).toFixed(2)}</td>
                </tr>
            `);
        });

        // Discount / delivery rows (only when applicable)
        if (Number(data.discount) > 0) {
            field("#invoice_discount_text").text(`₹${Number(data.discount).toFixed(2)}`);
            field("#invoice_discount_row").removeClass("hidden");
        } else {
            field("#invoice_discount_row").addClass("hidden");
        }
        if (Number(data.delivery_fee) > 0) {
            field("#invoice_delivery_text").text(`₹${Number(data.delivery_fee).toFixed(2)}`);
            field("#invoice_delivery_row").removeClass("hidden");
        } else {
            field("#invoice_delivery_row").addClass("hidden");
        }

        // Amounts
        field("#invoice_gst_label").text(`Add: GST (${data.gst_percent} %)`);
        field(".invoice-subtotal").text(`₹${Number(data.subtotal).toFixed(2)}`);
        field(".invoice-gst").text(`₹${Number(data.gst_amount).toFixed(2)}`);
        field(".invoice-total").text(`₹${Number(data.total).toFixed(2)}`);

        // Payment
        field("#payment_mode").text(data.payment_method || "-");
        field("#txn_id").text(data.txn_id || "-");

        // Amount in words
        field("#amount_words").text(
            `INR ${amountToWords(parseFloat(data.total))} Only`
        );

        // Notes
        field("#invoice_notes_list").html(
            `<li>This is a tax invoice for medicine order #${data.order_id}.</li>` +
            `<li>Medicines are subject to applicable GST as per law.</li>` +
            `<li>For support: ${data.supplier.email || "support@aibuzz.net"}</li>`
        );

        // Show the popup
        $invoicePopup.removeClass("hidden").addClass("flex");
    }).fail(function () {
        if (window.toastr) toastr.error("Failed to load invoice. Please try again.");
    });
});

$(document).on("click", ".close-popup-invoice", function () {
    $(".subscriptionTaxPopupInvoice")
        .addClass("hidden")
        .removeClass("flex");
});

$(document).on("click", ".complete-order-submit", function () {
    localStorage.setItem(
        "order_success_toast",
        "Order has been completed successfully."
    );
});

$(document).ready(function () {
    const msg = localStorage.getItem("order_success_toast");

    if (msg) {
        window.showToaster("success", msg);
        localStorage.removeItem("order_success_toast");
    }
});
$(document).on("click", ".accept-order-submit", function () {
    localStorage.setItem(
        "order_success_toast",
        "Order has been accepted successfully."
    );
});

// Order search and filter - submit form on change
$('#orderStatusFilter').on('change', function () {
    $('#orderFilterForm').submit();
});

// Invoice Download
// =====================================
// INVOICE DOWNLOAD
// =====================================
$(document).on("click", ".invoice-download-btn", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const invoice = document.querySelector(
        ".subscriptionTaxPopupInvoice:not(.hidden) > div"
    );

    if (!invoice) {
        console.error("Invoice element not found");
        return;
    }

    if (typeof html2pdf === "undefined") {
        console.error("html2pdf is not loaded");
        return;
    }

    html2pdf()
        .set({
            margin: 0.5,
            filename: "invoice.pdf",
            image: {
                type: "jpeg",
                quality: 1
            },
            html2canvas: {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",

                // Fix Tailwind oklch colors
                onclone: function (clonedDoc) {
                    const originalInvoice = document.querySelector(
                        ".subscriptionTaxPopupInvoice:not(.hidden) > div"
                    );

                    const clonedInvoice = clonedDoc.querySelector(
                        ".subscriptionTaxPopupInvoice:not(.hidden) > div"
                    );

                    if (!originalInvoice || !clonedInvoice) return;

                    const originalElements = [
                        originalInvoice,
                        ...originalInvoice.querySelectorAll("*")
                    ];

                    const clonedElements = [
                        clonedInvoice,
                        ...clonedInvoice.querySelectorAll("*")
                    ];

                    originalElements.forEach(function (originalEl, index) {
                        const clonedEl = clonedElements[index];

                        if (!clonedEl) return;

                        const computedStyle =
                            window.getComputedStyle(originalEl);

                        for (let i = 0; i < computedStyle.length; i++) {
                            const property = computedStyle[i];
                            const value = computedStyle.getPropertyValue(property);

                            if (value && !value.includes("oklch")) {
                                clonedEl.style.setProperty(
                                    property,
                                    value
                                );
                            }
                        }
                      });

                      // Remove external stylesheets from cloned document.
                      // This prevents html2canvas from parsing Tailwind's oklch().
                      clonedDoc
                          .querySelectorAll("link[rel='stylesheet'], style")
                          .forEach(function (styleEl) {
                              styleEl.remove();
                          });
                  }
            },
            jsPDF: {
                unit: "in",
                format: "a4",
                orientation: "portrait"
            }
        })
        .from(invoice)
        .save()
        .catch(function (error) {
            console.error("Invoice download failed:", error);
        });
});

// =====================================
// Amount in words (used by order invoice)
// =====================================
function amountToWords(amount) {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
                   "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

    function getWords(num) {
        let result = "";

        const crore = Math.floor(num / 10000000);
        num = num % 10000000;
        const lakh = Math.floor(num / 100000);
        num = num % 100000;
        const thousand = Math.floor(num / 1000);
        num = num % 1000;
        const hundred = Math.floor(num / 100);
        const rest = num % 100;

        if (crore > 0) result += `${getTwoDigits(crore)} Crore `;
        if (lakh > 0) result += `${getTwoDigits(lakh)} Lakh `;
        if (thousand > 0) result += `${getTwoDigits(thousand)} Thousand `;
        if (hundred > 0) result += `${ones[hundred]} Hundred `;
        if (rest > 0) result += `and ${getTwoDigits(rest)} `;

        return result.trim();
    }

    function getTwoDigits(num) {
        if (num < 10) return ones[num];
        else if (num >= 10 && num < 20) return teens[num - 10];
        else return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    }

    const parts = amount.toFixed(2).split('.');
    const rupees = parseInt(parts[0]);
    const paise = parseInt(parts[1]);

    const rupeesWords = rupees === 0 ? "Zero Rupees" : getWords(rupees) + " Rupees";
    const paiseWords = paise === 0 ? "" : ` and ${getTwoDigits(paise)} Paise`;

    return rupeesWords + paiseWords;
}

// =====================================
// INVOICE SHARE
// =====================================

$(document).on("click", ".invoice-share-btn", function (e) {
    e.preventDefault();
    e.stopPropagation();

    $("#invoiceShareModal")
        .removeClass("hidden")
        .addClass("flex");
});

$(document).on("click", ".invoice-close-share-modal", function (e) {
    e.preventDefault();
    e.stopPropagation();

    $("#invoiceShareModal")
        .addClass("hidden")
        .removeClass("flex");
});

// Invoice Share Apps
$(document).on("click", ".invoice-share-app", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const app = $(this).data("app");
    const link = $("#invoice-share-link").val();
    let url = "";

    switch (app) {
        case "whatsapp":
            url = `https://wa.me/?text=${encodeURIComponent(link)}`;
            break;

        case "telegram":
            url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=Check this out!`;
            break;

        case "facebook":
            url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
            break;

        case "sms":
            url = `sms:?body=${encodeURIComponent(link)}`;
            break;

        case "gmail":
            url = `mailto:?subject=Check this out&body=${encodeURIComponent(link)}`;
            break;
    }

    if (url) {
        window.open(url, "_blank");
    }
});

// Invoice Copy
$(document).on("click", ".invoice-copy-btn", async function (e) {
    e.preventDefault();
    e.stopPropagation();

    const targetSelector = $(this).data("target");
    const $target = $(targetSelector);

    if (!$target.length) {
        console.error("Invoice share link not found");
        return;
    }

    const textToCopy = $target.val();

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(textToCopy);
        } else {
            const $temp = $("<textarea>");
            $("body").append($temp);
            $temp.val(textToCopy).select();
            document.execCommand("copy");
            $temp.remove();
        }

        const $btn = $(this);
        const originalText = $btn.text();

        $btn.text("Copied");

        setTimeout(() => {
            $btn.text(originalText);
        }, 2000);

    } catch (err) {
        console.error("Failed to copy invoice share link:", err);
    }
});