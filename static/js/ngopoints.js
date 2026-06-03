
window.referralChart = null;
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}
const chartLabelsElement = document.getElementById('chartLabelsData');
const chartDataElement = document.getElementById('chartDataData');
const chartLabels = chartLabelsElement ? JSON.parse(chartLabelsElement.textContent) : [];
const chartData = chartDataElement ? JSON.parse(chartDataElement.textContent) : {};

const colors = ["#5182E3", "#28A745", "#3AAFA9", "#FF6F61", "#1E4D92"];
const datasets = Object.keys(chartData).map((actionType, i) => ({
  label: actionType,
  data: chartData[actionType],
  borderColor: colors[i] || "#000000",
  borderWidth: 2,
  tension: 0,
  pointRadius: 3,
  pointBackgroundColor: '#FFFFFF',
  pointBorderColor: colors[i] || "#000000",
  pointHoverRadius: 5,
  pointHoverBackgroundColor: '#FFFFFF',
  pointHoverBorderColor: colors[i] || "#000000",
}));

const allValues = Object.values(chartData).flat();
const maxValue = Math.max(...allValues, 0);
let roundedMax = Math.ceil(maxValue / 5) * 5;

// Force minimum max of 20 so we get ticks like 0,5,10,15,20
if (roundedMax < 20) {
  roundedMax=20;
}
function initReferralChart() {
  const canvas = document.getElementById("referralChart");
  if (!canvas || !chartLabels.length) return;

  const ctx = canvas.getContext("2d");

  // destroy if already exists
  if (window.referralChart instanceof Chart) {
    window.referralChart.destroy();
  }

  window.referralChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {          // ✅ CORRECT
        y: {
          beginAtZero: true,
          min: 0,
          suggestedMax: roundedMax,
          ticks: {
            stepSize: 5,
            precision: 0
          }
        }
      }
    }
  });
}
document.addEventListener("DOMContentLoaded", initReferralChart);
console.log("labels:", chartLabels, chartLabels.length);
console.log("datasets:", chartData);

Object.keys(chartData).forEach(k => {
  console.log(k, chartData[k].length);
});
// Create checkboxes dynamically
const checkboxContainer = document.getElementById("referralCustomLegend");
datasets.forEach((dataset, index) => {
  const label = document.createElement("label");
  label.style.marginRight = "10px";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = true;
  checkbox.dataset.index = index;

  checkbox.addEventListener("change", function () {
    const i = this.dataset.index;
    if (window.referralChart instanceof Chart) {
      window.referralChart.data.datasets[i].hidden = !this.checked;
      window.referralChart.update();
    }
  });

  // label.appendChild(checkbox);
  // label.appendChild(document.createTextNode(dataset.label));
  // checkboxContainer.appendChild(label);
});


function applyDateFilter(filterType) {
  const filterInput = document.getElementById('dateFilterInput');
  filterInput.value = filterType;

  if (filterType === 'custom') {
    // Show date inputs
    document.getElementById('startDateInput').classList.remove('hidden');
    document.getElementById('endDateInput').classList.remove('hidden');
  } else {
    // Hide custom date inputs if not custom
    document.getElementById('startDateInput').classList.add('hidden');
    document.getElementById('endDateInput').classList.add('hidden');

    // Submit form immediately for non-custom filters
    document.getElementById('filterForm').submit();
  }
}


document.querySelectorAll('.badge-description').forEach(function(descElem) {
  const text = descElem.textContent;
  const listElem = descElem.nextElementSibling;

  // Split by period and trim
  const lines = text.split('.').map(line => line.trim()).filter(line => line.length > 0);

  // Add each line to the list
  lines.forEach(line => {
    const li = document.createElement('li');
    li.textContent = line;
    listElem.appendChild(li);
  });

  // Optionally hide original text
  descElem.style.display = 'none';
});



(function () {
  let currentPage = 1;
  const limit = 3;

function allrewards(search = '', dateRange = '', page = 1) {
  $.ajax({
    url: '/points/get-cards/',
    data: {
      search: search,
      daterange: dateRange,
      page: page,
      limit: limit
    },
    method: 'GET',
    success: function (response) {
      $('#featured-rewards').html(response.html);
      setupPagination(response.pagination.num_pages, response.pagination.page);
    },
    error: function () {
      toastr.error("Failed to load rewards.");
    }
  });
}
function setupPagination(totalPages, currentPage) {
  let paginationHtml = '';

  // function pageBtn(i) {
  //   return `<button 
  //           class="px-3 py-2 rounded-lg cursor-pointer font-normal text-xs ${i === currentPage ? 'bg-living-coral text-white' : 'bg-pagination'}" 
  //           data-page="${i}">
  //           ${i}
  //       </button>`;
  // }
  function pageBtn(i) {
    return `<button
          class="coupons-page-btn px-3 py-2 rounded-lg cursor-pointer font-normal text-xs ${i === currentPage ? 'bg-dodger-blue text-white' : 'bg-pagination'}"
          data-page="${i}">
          ${i}
      </button>`;
  }

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      paginationHtml += pageBtn(i);
    }
  } else {
    // Always show first page
    paginationHtml += pageBtn(1);

    // Near start
    if (currentPage <= 3) {
      for (let i = 2; i <= 4; i++) {
        paginationHtml += pageBtn(i);
      }
      paginationHtml += `<span class="px-2">...</span>`;
      paginationHtml += pageBtn(totalPages);
    }
    // Middle
    else if (currentPage > 3 && currentPage < totalPages - 2) {
      paginationHtml += `<span class="px-2">...</span>`;
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        paginationHtml += pageBtn(i);
      }
      paginationHtml += `<span class="px-2">...</span>`;
      paginationHtml += pageBtn(totalPages);
    }
    // Near end
    else {
      paginationHtml += `<span class="px-2">...</span>`;
      for (let i = totalPages - 3; i <= totalPages; i++) {
        paginationHtml += pageBtn(i);
      }
    }
  } 

  $('#pagination-numbers1').html(paginationHtml);

  $('#prevPage1').prop('disabled', currentPage === 1);
  $('#nextPage1').prop('disabled', currentPage === totalPages);
}

$(document).on('click', '.coupons-page-btn', function () {
  const page = parseInt($(this).data('page'));
  currentPage = page;
  allrewards($('#allrewardssearch').val(), $('#dateRange').val(), page); // Adjust to your search/date filter inputs
});

$('#prevPage1').on('click', function () {
  if (currentPage > 1) {
    currentPage--;
    allrewards($('#allrewardssearch').val(), $('#dateRange').val(), currentPage);
  }
});

$('#nextPage1').on('click', function () {
  currentPage++;
  allrewards($('#allrewardssearch').val(), $('#dateRange').val(), currentPage);
});


function truncateDescriptions() {
  document.querySelectorAll('*').forEach(element => {
    if (element.textContent && element.children.length === 0) {
      const text = element.textContent.trim();
      
      // Check for very long text (more than 100 characters) or repeating patterns
      if (text.length > 100 || /(.{4,})\1{3,}/.test(text)) {
        const words = text.split(' ');
        if (words.length > 15) {
          element.textContent = words.slice(0, 15).join(' ') + '...';
        } else {
          element.textContent = text.substring(0, 80) + '...';
        }
        console.log('Truncated long text');
      }
    }
  });
}

// Call after coupons are loaded
$(document).ready(function() {
  truncateDescriptions();
});

  // Listen for button click with data-tab="all-rewards"
  $('[data-tab="all-rewards"]').on('click', function () {
    allrewards();
    popular_coupons();
  });

  let currentPopularPage = 1;
  const popularLimit = 8;

  function popular_coupons(search = '', dateRange = '', page = 1) {
    $.ajax({
      url: '/points/get-popular-coupons/',
      data: {
        search: search,
        daterange: dateRange,
        page: page,
        limit: popularLimit
      },
      method: 'GET',
      success: function(response) {
        $('#popular-coupons').html(response.html);
        truncateDescriptions();
        console.log("Truncated descriptions");
        currentPopularPage = page;
        console.log(response, response.pagination);
        if (response.pagination) {
          setupPopularPagination(response.pagination.num_pages, response.pagination.page);
        }
      },
      error: function() {
        $('#popular-coupons').html('<p>Error loading coupons.</p>');
      }
    });
  }

 function setupPopularPagination(totalPages, currentPage) {
    let paginationHtml = '';

    // function pageBtn(i) {
    //   return `<button 
    //         class="px-3 py-2 rounded-lg cursor-pointer font-normal text-xs popular-page-btn ${i === currentPage ? 'bg-living-coral text-white' : 'bg-pagination'}" 
    //         data-page="${i}">
    //         ${i}
    //     </button>`;
    // }
    function pageBtn(i) {
      return `<button
          class="coupons-page-btn px-3 py-2 rounded-lg cursor-pointer font-normal text-xs ${i === currentPage ? 'bg-dodger-blue text-white' : 'bg-pagination'}"
          data-page="${i}">
          ${i}
      </button>`;
    }

    if (totalPages <= 5) {
      // Show all pages if 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        paginationHtml += pageBtn(i);
      }
    } else {
      // Always show first page
      paginationHtml += pageBtn(1);

      if (currentPage <= 3) {
        // Near start
        for (let i = 2; i <= 4; i++) {
          paginationHtml += pageBtn(i);
        }
        paginationHtml += `<span class="px-2">...</span>`;
        paginationHtml += pageBtn(totalPages);
      }
      else if (currentPage > 3 && currentPage < totalPages - 2) {
        // In the middle
        paginationHtml += `<span class="px-2">...</span>`;
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          paginationHtml += pageBtn(i);
        }
        paginationHtml += `<span class="px-2">...</span>`;
        paginationHtml += pageBtn(totalPages);
      }
      else {
        // Near the end
        paginationHtml += `<span class="px-2">...</span>`;
        for (let i = totalPages - 3; i <= totalPages; i++) {
          paginationHtml += pageBtn(i);
        }
      }
    }

    
    $('#pagination-numbers2').html(paginationHtml);

    $('#prevPage2').prop('disabled', currentPage === 1);
    $('#nextPage2').prop('disabled', currentPage === totalPages);
  }


  // Pagination button click events
  $(document).on('click', '.popular-page-btn', function () {
    const page = parseInt($(this).data('page'));
    currentPopularPage = page;
    popular_coupons($('#allrewardssearch').val(), $('#dateRange').val(), page);
  });

  $('#prevPage2').on('click', function () {
    if (currentPopularPage > 1) {
      currentPopularPage--;
      popular_coupons($('#allrewardssearch').val(), $('#dateRange').val(), currentPopularPage);
    }
  });

  $('#nextPage2').on('click', function () {
    currentPopularPage++;
    popular_coupons($('#allrewardssearch').val(), $('#dateRange').val(), currentPopularPage);
  });


  $(document).on('input change', '#allrewardssearch', function() {
      const search = $(this).val().trim();
      allrewards(search);
      popular_coupons(search);
  });  
  
  $(document).on("click", ".allRewardsCoupons .dateFilter", function() {
    allrewards($('#allrewardssearch').val().trim() || '', $(this).data('range') || '');
    popular_coupons($('#allrewardssearch').val().trim() || '', $(this).data('range') || '');
  });

  function fetchFilteredData(page = 1) {
    const search = $("input[name='search']").val();
    const startDate = $("#startDateInput").val();
    const endDate = $("#endDateInput").val();

      $.ajax({
        url: "/points/history/",
        data: {
          search: search,
          start_date: startDate,
          end_date: endDate,
          page: page
        },
        success: function(data) {
          $("#pointsTable").html(data); // This now includes both table AND pagination
        }
      });
    }

  $("input[name='search']").on("input", function () {
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(fetchFilteredData, 400); // debounce
  });

  $("#startDateInput, #endDateInput").on("change", function () {
    fetchFilteredData();
  });

function applyDateFilter(type) {
  const today = new Date();
  let start = "", end = "";

  // Remove font-bold class from all filter options first
  $('.filter-dropdown-option div').removeClass('font-bold');
  
  if (type === "last_week") {
    start = new Date(today.setDate(today.getDate() - 7));
    end = new Date();
    // Add font-bold to the clicked option
    $('[onclick="applyDateFilter(\'last_week\')"]').addClass('font-bold');
  } else if (type === "last_month") {
    start = new Date(today.setMonth(today.getMonth() - 1));
    end = new Date();
    $('[onclick="applyDateFilter(\'last_month\')"]').addClass('font-bold');
  } else if (type === "last_year") {
    start = new Date(today.setFullYear(today.getFullYear() - 1));
    end = new Date();
    $('[onclick="applyDateFilter(\'last_year\')"]').addClass('font-bold');
  } else if (type === "custom") {
    $("#startDateInput").removeClass("hidden").show();
    $("#endDateInput").removeClass("hidden").show();
    $('[onclick="applyDateFilter(\'custom\')"]').addClass('font-bold');
    return;
  }

  if (start && end) {
    $("#startDateInput").val(start.toISOString().split('T')[0]);
    $("#endDateInput").val(end.toISOString().split('T')[0]);
    fetchFilteredData();
  }
}
  $('[data-tab="points-history"]').on('click', function () {
    fetchFilteredData();
  });
  $(document).on('click', '.pagination-btn', function (e) {
    e.preventDefault();
    let page = $(this).data('page');
    fetchFilteredData(page);
  });



$(document).on("click", ".claim-btn", function () {
    const $button = $(this);
    const couponId = $button.data('coupon-id');
    const code = $button.data('code');

    $.ajax({
        url: '/points/claim-coupon/',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ coupon_id: couponId }),
        headers: {
            'X-CSRFToken': getCSRFToken()
        },
        success: function (response) {
            if (response.status === 'success') {
                toastr.success('Coupon claimed! Code copied: ' + code);
                navigator.clipboard.writeText(code);

                // Disable the input and update classes
                // const $input = $button.closest('.coupon-box').find('button');
                // $button.prop('disabled', true);
                $button.removeClass('bg-violet-sky text-white').addClass('bg-pagination text-gray');

                // Optionally disable the button too
                $button.prop('disabled', true);
            } else if (response.status === 'already_claimed') {
                toastr.error('You have already claimed this coupon.');
            } else {
                toastr.error('Something went wrong.');
            }
        },
        error: function (xhr, status, error) {
            toastr.error('Server error.');
        }
    });
});


  $('[data-tab="rewards-claimed"]').on('click', function () {
    rewardClaimed();
  });

  const rewardClaimed = (search = '', startDate = '', endDate = '', page = 1, daterange = '') => {
              'start_date:', startDate,
              'end_date:', endDate,
              'page:', page,
              'date_range:', daterange;
    daterange = (daterange || $('.rewardsClaimedActive').data('range')) || '';


    $.ajax({
      url: "/points/claimed-coupons/ajax/",
      method: "GET",
      beforeSend: function () {
        $("#claimedCouponsBody").html('<tr><td colspan="4" class="text-center py-4">Loading...</td></tr>');
      },
      data: {
        search: search,
        start_date: startDate,
        end_date: endDate,
        page: page,
        date_range: daterange
      },
      success: function (response) {
        // setTimeout(() => {
          $("#claimedCouponsBody").html(response.html);
          $("#claimed-pagination-container").html(response.pagination);
        // }, 5000);
      },
      error: function () {
        toastr.error("Failed to load claimed coupons.");
      }
    });
  };


  // Trigger pagination click
  $(document).on("click", ".claimed-pagination-btn", function () {
    const page = $(this).data("page");
    const dateRange = $('.rewardsClaimedActive').data('range');
    rewardClaimed($('#rewards-claimed-search').val().trim(), $('#startDateInput').val().trim() || '', $('#endDateInput').val().trim() || '', page, dateRange);
  });



  $(document).on("click", ".rewardsClaimed .dateFilter", function() {
    $(".rewardsClaimed .dateFilter").removeClass('rewardsClaimedActive font-bold');
    $(this).addClass('rewardsClaimedActive').addClass('font-bold');
    rewardClaimed($('#rewards-claimed-search').val().trim() || '', '', '', 1, $(this).data('range').trim());
  });

  $(document).on('input change', '#rewards-claimed-search', function() {
      rewardClaimed($(this).val().trim() || '', '', '', 1);
  });  
 

  $('.dropdown-btn').on('click', function (e) {
      e.stopPropagation();
      // $(this).siblings('.dropdown-option').toggle();
      $(this).siblings('.dropdown-option').toggle('hidden');
  });

// $(document).ready(function () {
//   observeCards('featured-rewards', 'reward-card', function () {
//       setupPagination({
//         containerId: 'featured-rewards',
//         cardClass: 'reward-card',
//         prevBtnId: 'prevPage1',
//         nextBtnId: 'nextPage1',
//         paginationContainerId: 'pagination-numbers1',
//         cardsPerPage: 3
//       });
//     });

//     observeCards('popular-coupons', 'coupon-card', function () {
//       setupPagination({
//         containerId: 'popular-coupons',
//         cardClass: 'coupon-card',
//         prevBtnId: 'prevPage2',
//         nextBtnId: 'nextPage2',
//         paginationContainerId: 'pagination-numbers2',
//         cardsPerPage: 3
//       });
//     });
// });



  // function setupPagination({containerId, cardClass, prevBtnId, nextBtnId, paginationContainerId, cardsPerPage = 3}) {
  //   let currentPage = 1;

  //   function showPage(page) {
  //     const $cards = $(`#${containerId} .${cardClass}`);
  //     const totalPages = Math.ceil($cards.length / cardsPerPage);

  //     $cards.hide();
  //     const start = (page - 1) * cardsPerPage;
  //     const end = start + cardsPerPage;
  //     $cards.slice(start, end).show();

  //     $(`#${prevBtnId}`).prop("disabled", page === 1);
  //     $(`#${nextBtnId}`).prop("disabled", page === totalPages);

  //     updatePaginationNumbers(totalPages, page);
  //   }

  //   function updatePaginationNumbers(totalPages, activePage) {
  //     const $container = $(`#${paginationContainerId}`);
  //     $container.empty();

  //     for (let i = 1; i <= totalPages; i++) {
  //       $("<button></button>")
  //         .text(i)
  //         .addClass("px-3 py-2 rounded-lg cursor-pointer font-normal text-xs")
  //         .addClass(
  //           i === activePage
  //             ? `bg-${selectedColor} text-white`
  //             : "bg-pagination text-jet-black"
  //         )
  //         .on("click", function () {
  //           currentPage = i;
  //           showPage(currentPage);
  //         })
  //         .appendTo($container);
  //     }
  //   }

  //   $(`#${prevBtnId}`).on("click", function () {
  //     if (currentPage > 1) {
  //       currentPage--;
  //       showPage(currentPage);
  //     }
  //   });

  //   $(`#${nextBtnId}`).on("click", function () {
  //     const totalPages = Math.ceil(
  //       $(`#${containerId} .${cardClass}`).length / cardsPerPage
  //     );
  //     if (currentPage < totalPages) {
  //       currentPage++;
  //       showPage(currentPage);
  //     }
  //   });

  //   showPage(currentPage);
  // }

  // Theme color mapping
    const themeColors = {
        customers: 'vivid-orange',
        Advertiser: 'living-coral',
        points: 'violet-sky'
    };

    const path = window.location.pathname;

    // Default values
    let selectedColor = 'vivid-orange';
    let bgColor = '#F79E1B'; 

    // Assign based on path
    $.each(themeColors, function (keyword, color) {
        if (path.includes(keyword)) {
            selectedColor = color;
            bgColor = selectedColor === "vivid-orange"
                ? "#F79E1B"
                : selectedColor === "living-coral"
                    ? "#FF6F61"
                    : "#6B79F5";
            return false;
        }
    });

function observeCards(containerId, cardClass, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const observer = new MutationObserver(() => {
    if ($(`#${containerId} .${cardClass}`).length > 0) {
      observer.disconnect(); // stop observing once found
      callback();
    }
  });

  observer.observe(container, { childList: true, subtree: true });
}
})();
