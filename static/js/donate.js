function setupCardListeners() {
  const cards = document.querySelectorAll(".donation-card");
  const closeBtn = document.querySelector(".close-expanded");
  const tabsSection = document.querySelector(".tabs-section");
  const searchFilterSection = document.querySelector(".search-filter-section");
  const paginationSections = document.querySelectorAll(".pagination-section");

  // Handle card expand functionality
  cards.forEach((card) => {
    const triggers = card.querySelectorAll(".toggle-expand");
    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        // Hide other cards
        cards.forEach((other) => {
          if (other !== card) other.style.display = "none";
        });

        const cardContainer = document.querySelector(".card-container");

        // Remove grid layout when expanding
        cardContainer.classList.remove(
          "grid",
          "grid-cols-1",
          "md:grid-cols-2",
          "gap-4",
          "justify-items-center"
        );

        // Elements to modify
        const defaultHeading = card.querySelector(".default-heading");
        const expandedHeading = card.querySelector(".expanded-heading");
        const expandedPara = card.querySelector(".expanded-para");
        const donateWrapper = card.querySelector(".donate-button-wrapper");
        const topSection = card.querySelector(".top-section");
        const locationLine = card.querySelector(".location-line");

        // Get the specific elements we need to hide and show
        const donationAmount = card.querySelector(".donation-amount");
        const donateBtnContainer = card.querySelector(".donate-btn-container");
        const expandedButtons = card.querySelector(".expanded-buttons");

        // Show expanded content
        defaultHeading.classList.add("hidden");
        expandedHeading.classList.remove("hidden");
        expandedPara.classList.remove("hidden");
        closeBtn.classList.remove("hidden");

        // Hide donation amount and donate button
        donationAmount.classList.add("hidden");
        donateBtnContainer.classList.add("hidden");

        // Show visit website and pay buttons
        expandedButtons.classList.remove("hidden");

        // Adjust layout for expanded view
        topSection.classList.remove("flex");
        topSection.classList.add("block");

        donateWrapper.classList.remove(
          "ml-4",
          "mt-0",
          "flex-col",
          "items-center"
        );
        donateWrapper.classList.add("mt-4", "w-full", "flex", "justify-end");

        locationLine.classList.remove("mt-2");
        locationLine.classList.add("mt-4");

        // // Make card fullscreen for expanded view
        // card.classList.add(
        //   "fixed",
        //   "inset-0",
        //   "z-50",
        //   "h-screen",
        //   "w-screen",
        //   "overflow-y-auto",
        //   "rounded-none"
        // );
        card.classList.remove("m-4", "rounded-lg");

        // Hide UI sections
        tabsSection?.classList.add("hidden");
        searchFilterSection?.classList.add("hidden");
        paginationSections.forEach((pagination) =>
          pagination.classList.add("hidden")
        );
      });
    });

    // Handle "Read More"
    const readMoreBtn = card.querySelector(".read-more-btn");
    const expandedPara = card.querySelector(".expanded-para");

    readMoreBtn?.addEventListener("click", function(e) {
      e.preventDefault();
      expandedPara?.classList.remove("hidden");
      readMoreBtn?.classList.add("hidden");

      // Get the specific elements we need to hide and show
      const donationAmount = card.querySelector(".donation-amount");
      const donateBtnContainer = card.querySelector(".donate-btn-container");
      const expandedButtons = card.querySelector(".expanded-buttons");
      const donateWrapper = card.querySelector(".donate-button-wrapper");
      const donateLine = card.querySelector(".donation-line");

      // Hide donation amount and donate button
      donationAmount.classList.add("hidden");
      donateBtnContainer.classList.add("hidden");
      donateLine.classList.remove("md:block");

      // Show visit website and pay buttons
      expandedButtons.classList.remove("hidden");

      // Adjust donation wrapper layout
      donateWrapper.classList.remove("ml-4", "mt-0", "flex-col", "items-center");
      donateWrapper.classList.add("mt-4", "w-full", "flex", "justify-end");

      tabsSection?.classList.add("hidden");
      searchFilterSection?.classList.add("hidden");
      paginationSections.forEach((pagination) =>
        pagination.classList.add("hidden")
      );
    });
  });
}
 
function openAssignmentPopup() {
  document.querySelector(".assignmentPopup").classList.remove("hidden");
}

function closeAssignmentPopup() {
  document.querySelector(".assignmentPopup").classList.add("hidden");
}

function openPopupDonation() {
  document.querySelector(".donationPopup").classList.remove("hidden");
}

function closePopupDonation() {
  document.querySelector(".donationPopup").classList.add("hidden");
}
console.log("Popup");

$(".filter-toggle-btn").on("click", function (e) {
  e.stopPropagation();
  $(".filter-popup").not($(this).siblings(".filter-popup")).addClass("hidden");
  $(this).siblings(".filter-popup").toggleClass("hidden");
});

$(document).on("click", function () {
  $(".filter-popup").addClass("hidden");
});

// Open the nested share popup
$(".openSharePopup").click(function () {
  $(".sharePopup").removeClass("hidden");
});

// Close the nested share popup
$(".closeSharePopup").click(function () {
  $(".sharePopup").addClass("hidden");
});


function openPostDetail(el) {
    document.getElementById('modalNgoName').textContent = el.getAttribute('data-ngo-name');
    document.getElementById('modalHeader').textContent = el.getAttribute('data-header');
    document.getElementById('modalDescription').textContent = el.getAttribute('data-description');
    var website = el.getAttribute('data-website-url');
    var websiteLink = document.getElementById('modalWebsite');
    if (website) {
      websiteLink.textContent = website;
      websiteLink.href = website.startsWith('http') ? website : 'https://' + website;
      websiteLink.style.display = 'block';
    } else {
      websiteLink.style.display = 'none';
    }
    document.getElementById('postDetailModal').classList.remove('hidden');
  }
  function closePostDetail() {
    document.getElementById('postDetailModal').classList.add('hidden');
  }
  function toggleExpand(btn) {
    const card = btn.closest('.donation-card');
    const para = card.querySelector('.expanded-para');
    const buttons = card.querySelector('.expanded-buttons');
    if (para && buttons) {
      para.classList.toggle('hidden');
      buttons.classList.toggle('hidden');
      btn.textContent = para.classList.contains('hidden') ? 'Read More' : 'Read Less';
    }
  }

// for exporting donation history
    $('.view-donation-history-btn').on('click', function () {
      console.log("View donation history button clicked");
        $('.view-donation-history-popup').addClass('flex').removeClass('hidden');
        console.log("Loading donation history...");
        $.ajax({
            url: "/donate/export-donation-history/",
            type: "GET",
            success: function (response) {
                console.log("Donation history loaded successfully.");
                $('#donateHistoryTableExport').html(response.html);
            },
            error: function () {
                console.error("Failed to load donation history.");
                alert("Failed to load donation history.");
            }
        });
    });
    $('.close-donation-history-popup').on('click', function () {
        $('.view-donation-history-popup').removeClass('flex').addClass('hidden');
    });

    $(document).on('click', '.download-btn', function (event) {
        event.stopPropagation();
        // Find the next sibling with class 'download-container'
        const $container = $(this).closest('.popup').find('.download-container');

        if ($container.length === 0) {
            console.error('[ERROR] download-container not found');
            return;
        }

        // Clone the element properly
        const clone = $container[0].cloneNode(true);
        clone.style.position = 'static';
        clone.style.visibility = 'visible';
        clone.style.display = 'block';
        clone.style.zIndex = '1';
        clone.id = 'download-container-clone';
        document.body.appendChild(clone);
    
        const opt = {
            margin:       0,
            filename:     'donation-details.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0, scrollX: 0 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
    
        html2pdf().set(opt).from(clone).save()
            .then(() => {
                document.body.removeChild(clone);
            })
            .catch(err => {
                console.error('[ERROR] PDF generation failed:', err);
                document.body.removeChild(clone);
            });
    });
function loadDonationHistory(page = 1, $container = $('#donationHistory')) {
    const query = $container.find('input[name="donation_history_query"]').val();
    const startDate = $container.data("start-date") || "";
    const endDate = $container.data("end-date") || "";
    const dateRange = $container.data("range-label") || ""; // NEW: store daterange
    const saved = $container.attr('id') === 'donationSaved' ? 'true' : 'false';
    console.log("Your query: ", query);
    $.ajax({
        url: "/donate/donation-history/",
        type: "GET",
        data: {
            query: query,
            page: page,
            start_date: startDate,
            end_date: endDate,
            daterange: dateRange, // match Django param
            saved_only: saved,
        },
        success: function (response) {
            $container.find('tbody').html(response.html);
            renderPagination(response.current_page, response.total_pages, $container);
        },
        error: function () {
            toastr.error("Failed to load donation history.");
        }
    });
}

function renderPagination(current, total, $container) {
    let html = '';
    const activeColor = getPaginationThemeColor(); // 🔥 dynamic color

    html += `
      <button
        onclick="changePage(${current - 1})"
        class="bg-white px-3 py-1 rounded text-light-gray1 text-sm"
        ${current === 1 ? "disabled" : ""}
      >
        Previous
      </button>
    `;

    function pageBtn(i) {
      const btnClass =
        i === current
          ? `bg-${activeColor} text-white`
          : "bg-pagination";

      return `
        <button
          onclick="changePage(${i})"
          class="px-3 py-1.5 rounded-lg text-sm ${btnClass}"
        >
          ${i}
        </button>
      `;
    }

    if (total <= 5) {
      for (let i = 1; i <= total; i++) {
        html += pageBtn(i);
      }
    } else {
      html += pageBtn(1);

      if (current <= 3) {
        for (let i = 2; i <= 4; i++) html += pageBtn(i);
        html += `<span class="px-2">...</span>`;
        html += pageBtn(total);
      }
      else if (current > 3 && current < total - 2) {
        html += `<span class="px-2">...</span>`;
        for (let i = current - 1; i <= current + 1; i++) html += pageBtn(i);
        html += `<span class="px-2">...</span>`;
        html += pageBtn(total);
      }
      else {
        html += `<span class="px-2">...</span>`;
        for (let i = total - 3; i <= total; i++) html += pageBtn(i);
      }
    }

    html += `
      <button
        onclick="changePage(${current + 1})"
        class="bg-white px-3 py-1 rounded text-light-gray1 text-sm"
        ${current === total ? "disabled" : ""}
      >
        Next
      </button>
    `;

    $container.find('#pagination-container').html(html);
}


// Initial tab click to load data
$('[data-tab="donation-history"]').on('click', function () {
    loadDonationHistory(1, $('#donationHistory'));
});

// Search typing
$(document).on('input', 'input[name="donation_history_query"]', function () {
    const $container = $(this).closest('.postDiv');
    loadDonationHistory(1, $container);
});

// Pagination click
$(document).on('click', '.pagination-btn', function () {
    const page = $(this).data('page');
    const $container = $(this).closest('.postDiv');
    loadDonationHistory(page, $container); // fixed typo
});

// Date range selection
$(document).on("click", ".donationdaterange", function () {
    $(".donationdaterange").removeClass("font-bold");
    $(this).addClass("font-bold");
    
    const rangeLabel = $(this).data("range");
    const { start, end } = calculateDateRange(rangeLabel);
    
    const $tabDiv = $(this).closest(".postDiv");
    $tabDiv.data("start-date", start);
    $tabDiv.data("end-date", end);
    $tabDiv.data("range-label", rangeLabel.toLowerCase()); // store for backend

    loadDonationHistory(1, $tabDiv);
});

function calculateDateRange(rangeLabel) {
    const endDate = new Date();
    let startDate = new Date();

    switch (rangeLabel) {
        case "1 Week":
            startDate.setDate(endDate.getDate() - 7);
            break;
        case "1 Month":
            startDate.setMonth(endDate.getMonth() - 1);
            break;
        case "1 Year":
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        default:
            return { start: "", end: "" };
    }

    const formatDate = (d) => d.toISOString().split("T")[0];
    return {
        start: formatDate(startDate),
        end: formatDate(endDate),
    };
}

//open donate popup
function openDonatePopup(donationId) {
  fetch(`/donate/get-donate-bill/${donationId}/`)
    .then(response => response.json())
    .then(data => {
      document.getElementById("receiptNo").innerText = data.receipt_no;
      document.getElementById("paymentDate").innerText = data.payment_date;
      document.getElementById("ngoName").innerText = data.ngo_name;
      document.getElementById("sign").innerText = data.ngo_name;
      document.getElementById("panNumber").innerText = data.pan;
      document.getElementById("address").innerText = data.address;
      document.getElementById("name").innerText = data.name;
      document.getElementById("email").innerText = data.email;
      document.getElementById("amount").innerText = data.amount;
      document.getElementById("payMode").innerText = data.pay_mode;
      
      document.getElementById("donateReceiptModal").style.display = 'flex'; 
    })
    .catch(err => {
      console.error("Error loading receipt:", err);
      alert("Unable to load receipt.");
    });
}

//close donate popup
function closeDonatePopup() {
  const modal = document.querySelector(".donateReceiptPopup");
  modal.classList.add("hidden");
  modal.style.display = "none"; // This ensures it hides regardless of inline flex
}

//download donate pdf 
function downloadDonatePDF() {
  const element = document.getElementById('donateReceiptContent');
  const opt = {
    margin:       0.5,
    filename:     'donate-receipt.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}




////////////
// open platform popup
function openPlatformPopup(donationId) {
    console.log("Opening platform popup for donation ID:", donationId);

    fetch(`/donate/get-platform-bill/${donationId}/`)
        .then(response => {
            console.log("Fetch completed. Status:", response.status);
            return response.text();
        })
        .then(text => {
            console.log("Raw fetch response:", text);

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("JSON parse error:", e);
                return;
            }

            // ✅ Fill modal content
            document.getElementById("receiptNoPlatform").textContent = data.receipt_no || "";
            document.getElementById("paymentDatePlatform").textContent = data.payment_date || "";
            document.getElementById("ngoNamePlatform").textContent = data.ngo_name || "";
            document.getElementById("addressPlatform").textContent = data.address || "";
            document.getElementById("namePlatform").textContent = data.name || "";
            document.getElementById("emailPlatform").textContent = data.email || "";
            document.getElementById("amountPlatform").textContent = data.amount || "";
            document.getElementById("subTotalPlatform").textContent = data.amount || "";
            document.getElementById("gstPlatform").textContent = data.gst || "";
            document.getElementById("finalTotalPlatform").textContent = data.finalTotal || "";
            document.getElementById("actualAmountPlatform").textContent = data.amount || "";
            document.getElementById("signPlatform").textContent = data.ngo_name || "";

            // ✅ Open modal
            const modal = document.getElementById("platformReceiptModal");
            console.log("Modal found:", !!modal);

            if (!modal) {
                console.error("Modal not found in DOM!");
                return;
            }

            modal.classList.remove("hidden");
            modal.style.display = "flex";  // Force visible
            modal.style.visibility = "visible";

            console.log("Modal visibility class removed.");
            console.log("Modal computed display:", window.getComputedStyle(modal).display);
            console.log("Modal computed visibility:", window.getComputedStyle(modal).visibility);
        })
        .catch(err => {
            console.error("Error loading receipt:", err);
        });
}

// close platform popup
function closePlatformPopup() {
    const modal = document.querySelector(".platformReceiptPopup");
    modal.classList.add("hidden");
    modal.style.display = "none"; // ensures it hides regardless of inline flex
}


//download platform pdf 
function downloadPlatformPDF() {
  const element = document.getElementById('platformReceiptContent');
  const opt = {
    margin:       0.5,
    filename:     'platform-bill.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}

// CSRF helper
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

$(document).on('click', '.donate-bookmark-toggle', function() {
        console.log('Bookmark clicked!');
        var $icon = $(this);
        var textClass = $icon.data('text-class');
        var donationId = $icon.data('donation-id');
        var isSaved = $icon.data('saved') === true || $icon.data('saved') === 'true';
        var action = isSaved ? 'unsave' : 'save';

        $.ajax({
            url: '/donate/toggle-saved/',
            type: 'POST',
            data: {
                donation_id: donationId,
                action: action,
                csrfmiddlewaretoken: getCookie('csrftoken')
            },
            success: function(response) {
                if (response.success) {
                    $icon.data('saved', response.saved);
                    if (response.saved) {
                        $icon.addClass('material-filled text-' + response.text_class);
                        // $icon.removeClass('text-living-coral');
                    } else {
                        $icon.removeClass('material-filled text-' + response.text_class);
                        // If in Saved Donation table, remove the row
                        if ($icon.closest('.saved-donation').length || $icon.closest('table').closest('.saved-donation').length) {
                            $icon.closest('tr').remove();
                        }
                    }
                    // Use toastr if available, otherwise show alert
                    if (typeof toastr !== 'undefined') {
                        toastr.success(response.saved ? 'Donation saved!' : 'Donation unsaved!');
                        console.log("Applied class:", textClass);
                    } else {
                        alert(response.saved ? 'Donation saved!' : 'Donation unsaved!');
                    }
                } else {
                    if (typeof toastr !== 'undefined') {
                        toastr.error(response.error || 'Could not update saved status.');
                    } else {
                        alert(response.error || 'Could not update saved status.');
                    }
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', xhr.responseText);
                if (typeof toastr !== 'undefined') {
                    toastr.error('Could not update saved status.');
                } else {
                    alert('Could not update saved status.');
                }
            }
        });
    });

function loadOrganizations(page = 1, $container = $('#organizationSectionId')) {
    const query = $('input[name="organization_query"]').val() || "";
    const startDate = $container.data("start-date") || "";
    const endDate = $container.data("end-date") || "";
    const dateRange = $container.data("range-label") || "";

    $.ajax({
        url: "/donate/get-organization-posts/",
        type: "GET",
        data: {
            query: query,
            page: page,
            start_date: startDate,
            end_date: endDate,
            daterange: dateRange,
        },
        success: function (response) {
            $container.html(response.html);
            renderOrganizationPagination(response.current_page, response.total_pages);
            setupCardListeners();
        },
        error: function () {
            toastr.error("Failed to load organizations.");
        }
    });
}

function getPaginationThemeColor() {
  const type = (window.USER_TYPE || "").toLowerCase();

  if (["doctor", "lab", "hospital"].includes(type)) return "dodger-blue";
  if (type === "pharmacy") return "dodger-blue";
  if (type === "advertiser") return "living-coral";
  if (type === "client") return "dark-blue";
  if (type === "ngo") return "violet-sky";
  if (type === "user") return "light-sea-green";

  return "dodger-blue"; // default fallback
}

function renderOrganizationPagination(current, total) {
  let html = '';
  const activeColor = getPaginationThemeColor(); // e.g. dodger-blue, living-coral

  html += `
    <button
      onclick="changePage(${current - 1})"
      class="bg-white px-3 py-1 rounded text-light-gray1 text-sm"
      ${current === 1 ? "disabled" : ""}
    >
      Previous
    </button>
  `;

  function pageBtn(i) {
    const btnClass =
      i === current
        ? `bg-${activeColor} text-white`
        : "bg-pagination";

    return `
      <button
        onclick="changePage(${i})"
        class="px-3 py-1.5 rounded-lg text-sm ${btnClass}"
      >
        ${i}
      </button>
    `;
  }

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      html += pageBtn(i);
    }
  } else {
    html += pageBtn(1);

    if (current <= 3) {
      for (let i = 2; i <= 4; i++) html += pageBtn(i);
      html += `<span class="px-2">...</span>`;
      html += pageBtn(total);
    }
    else if (current > 3 && current < total - 2) {
      html += `<span class="px-2">...</span>`;
      for (let i = current - 1; i <= current + 1; i++) html += pageBtn(i);
      html += `<span class="px-2">...</span>`;
      html += pageBtn(total);
    }
    else {
      html += `<span class="px-2">...</span>`;
      for (let i = total - 3; i <= total; i++) html += pageBtn(i);
    }
  }

  html += `
    <button
      onclick="changePage(${current + 1})"
      class="bg-white px-3 py-1 rounded text-light-gray1 text-sm"
      ${current === total ? "disabled" : ""}
    >
      Next
    </button>
  `;

  $('#pagination-container').html(html);
}



// Initial load
$(document).on("click", '[data-tab="organization"]', function () {
    const $tabDiv = $('#organizationSectionId'); 
    loadOrganizations(1, $tabDiv);
});

// Search input
$(document).on('input', 'input[name="organization_query"]', function () {
    const $tabDiv = $('#organizationSectionId');
    loadOrganizations(1, $tabDiv);
});
// ----------------------------
// Pagination buttons
// ----------------------------
$(document).on('click', '.pagination-btn', function () {
    const page = $(this).data('page');
    const $container = $(this).closest('.postDiv');
    loadOrganizations(page, $container);
});

// ----------------------------
// Date range filter buttons
// ----------------------------
$(document).on("click", ".organization-daterange", function () {
    $(".organization-daterange").removeClass("font-bold");
    $(this).addClass("font-bold");

    const rangeLabel = $(this).data("range");
    const $tabDiv = $('#organizationSectionId');

    const { start, end } = calculateDateRange(rangeLabel);

    // ✅ Store range on container
    $tabDiv.data("start-date", start);
    $tabDiv.data("end-date", end);
    $tabDiv.data("range-label", rangeLabel);

    // ✅ Pass the same container back (not hardcoded)
    loadOrganizations(1, $tabDiv);

    console.log("Loading organizations with range:", rangeLabel, start, end);
});

function changePage(page) {
    const $container = $("#organizationSectionId"); // scope to your section
    loadOrganizations(page, $container);
}

// ----------------------------
// Helper: calculate start & end dates
// ----------------------------
function calculateDateRange(rangeLabel) {
    const today = new Date();
    let start = "";
    let end = today.toISOString().split("T")[0]; // yyyy-mm-dd

    if (rangeLabel === "1 week") {
        const past = new Date();
        past.setDate(today.getDate() - 7);
        start = past.toISOString().split("T")[0];
    } else if (rangeLabel === "1 month") {
        const past = new Date();
        past.setMonth(today.getMonth() - 1);
        start = past.toISOString().split("T")[0];
    } else if (rangeLabel === "1 year") {
        const past = new Date();
        past.setFullYear(today.getFullYear() - 1);
        start = past.toISOString().split("T")[0];
    } else if (rangeLabel === "custom") {
        start = $("#customStartDate").val();
        end = $("#customEndDate").val();
    }

    return { start, end };
}


// Expanded view
function loadExpandedView(postId) {
  fetch(`/expanded/${postId}/`)
    .then(response => response.text())
    .then(html => {
      document.getElementById("expandedViewContent").innerHTML = html;
      document.getElementById("expandedViewModal").classList.remove("hidden");
    });
}

function closeExpandedView() {
  document.getElementById("expandedViewModal").classList.add("hidden");
  document.getElementById("expandedViewContent").innerHTML = "";
}