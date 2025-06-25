$(document).ready(function () {
    // Theme color mapping
    const themeColors = {
        customers: 'vivid-orange',
        Advertiser: 'living-coral',
        NGO: 'violet-sky'
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

    // Common chart options function
  function getChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          yAlign: "bottom",
          backgroundColor: "#3AAFA9",
          displayColors: true,
          callbacks: {
            title: () => "",
            label: function (tooltipItem) {
              return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
            },
          },
        },
      },
      scales: {
        x: { title: { display: false } },
        yLeft: {
          type: "linear",
          position: "left",
          beginAtZero: true,
          min: 0,
          max: 800,
          ticks: { stepSize: 200 },
        },
        yRight: {
          type: "linear",
          position: "right",
          beginAtZero: true,
          min: 0,
          max: 800,
          ticks: { display: false },
          grid: { drawOnChartArea: false },
        },
      },
    };
  }

  // Initialize chart helper
  function initChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      return new Chart(canvas.getContext("2d"), config);
    }
    return null;
  }
    // Chart rendering
    
    const purchaseChart = initChart("purchaseChart" ,{
        type: 'line',
        data: {
            labels: ['0', '1', '2', '3', '4', '5', '6', '7'],
            datasets: [
                {
                    label: 'Referral',
                    data: [600, 400, 590, 650, 800, 400, 160, 570],
                    borderColor: '#5182E3',
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yLeft',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#5182E3',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#5182E3',
                },
                {
                    label: 'Map',
                    data: [600, 700, 300, 250, 200, 600, 180, 700],
                    borderColor: '#28A745',
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#28A745',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#28A745',
                },
                {
                    label: 'Coupon',
                    data: [0, 580, 170, 560, 410, 401, 70, 160],
                    borderColor: '#3AAFA9',
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#3AAFA9',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#3AAFA9',
                },
                {
                    label: 'Donation',
                    data: [10, 480, 270, 460, 310, 501, 170, 260],
                    borderColor: bgColor, // <-- Dynamic theme color
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: bgColor, // <-- Dynamic theme color
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: bgColor, // <-- Dynamic theme color
                }
            ]
        },
        options: getChartOptions(),
    });

    
    const referralChart =initChart("referralChart", {
        type: 'line',
        data: {
            labels: ['0', '1', '2', '3', '4', '5', '6', '7'],
            datasets: [
                {
                    label: 'Referral',
                    data: [600, 400, 590, 650, 800, 400, 160, 570],
                    borderColor: '#5182E3',
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yLeft',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#5182E3',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#5182E3',
                },
                {
                    label: 'Map',
                    data: [600, 700, 300, 250, 200, 600, 180, 700],
                    borderColor: '#28A745',
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#28A745',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#28A745',
                },
                {
                    label: 'Post',
                    data: [0, 580, 170, 560, 410, 401, 70, 160],
                    borderColor: '#3AAFA9',
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#3AAFA9',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#3AAFA9',
                }
                
            ]
        },
        options: getChartOptions(),
    });

     const endcustomersChart =initChart("endCustomersChart", {
        type: 'line',
        data: {
            labels: ['0', '1', '2', '3', '4', '5', '6', '7'],
            datasets: [
                {
                    label: 'Referral',
                    data: [600, 400, 590, 650, 800, 400, 160, 570],
                    borderColor: '#5182E3',
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yLeft',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#5182E3',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#5182E3',
                },
                {
                    label: 'Map',
                    data: [600, 700, 300, 250, 200, 600, 180, 700],
                    borderColor: '#28A745',
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#28A745',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#28A745',
                },
                {
                    label: 'Purchase',
                    data: [0, 580, 170, 560, 410, 401, 70, 160],
                    borderColor: '#3AAFA9',
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#3AAFA9',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#3AAFA9',
                },
                 {
                    label: 'share',
                    data: [100, 45, 170, 400, 510, 801, 470, 360],
                    borderColor: "#1E4D92", 
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: "#1E4D92",
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor:"#1E4D92",
                },
                 {
                    label: 'Donation',
                    data: [10, 480, 270, 460, 310, 501, 170, 260],
                    borderColor: bgColor, // <-- Dynamic theme color
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: bgColor, // <-- Dynamic theme color
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: bgColor, // <-- Dynamic theme color
                }
                
            ]
        },
        options: getChartOptions(),
    });

       const pharmacyChart =initChart("pharmacyChart", {
        type: 'line',
        data: {
            labels: ['0', '1', '2', '3', '4', '5', '6', '7'],
            datasets: [
                {
                    label: 'Referral',
                    data: [600, 400, 590, 650, 800, 400, 160, 570],
                    borderColor: '#5182E3',
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yLeft',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#5182E3',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#5182E3',
                },
                {
                    label: 'Map',
                    data: [600, 700, 300, 250, 200, 600, 180, 700],
                    borderColor: '#28A745',
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#28A745',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#28A745',
                },
                {
                    label: 'Orders',
                    data: [0, 580, 170, 560, 410, 401, 70, 160],
                    borderColor: '#3AAFA9',
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#3AAFA9',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#3AAFA9',
                },
                 {
                    label: 'share',
                    data: [100, 45, 170, 400, 510, 801, 470, 360],
                    borderColor: "#1E4D92", 
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: "#1E4D92",
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor:"#1E4D92",
                },
                 {
                    label: 'Donation',
                    data: [10, 480, 270, 460, 310, 501, 170, 260],
                    borderColor: bgColor, // <-- Dynamic theme color
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: bgColor, // <-- Dynamic theme color
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: bgColor, // <-- Dynamic theme color
                }
                
            ]
        },
        options: getChartOptions(),
    });

     const clientChart =initChart("clientChart", {
        type: 'line',
        data: {
            labels: ['0', '1', '2', '3', '4', '5', '6', '7'],
            datasets: [
                {
                    label: 'Referral',
                    data: [600, 400, 590, 650, 800, 400, 160, 570],
                    borderColor: '#5182E3',
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yLeft',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#5182E3',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#5182E3',
                },
                {
                    label: 'Map',
                    data: [600, 700, 300, 250, 200, 600, 180, 700],
                    borderColor: '#28A745',
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#28A745',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#28A745',
                },
                {
                    label: 'Subscription',
                    data: [0, 580, 170, 560, 410, 401, 70, 160],
                    borderColor: '#3AAFA9',
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#3AAFA9',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor: '#3AAFA9',
                },
                 {
                    label: 'Donation',
                    data: [100, 45, 170, 400, 510, 801, 470, 360],
                    borderColor: "#1E4D92", 
                    borderWidth: 2,
                    tension: 0,
                    yAxisID: 'yRight',
                    pointRadius: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: "#1E4D92",
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#FFFFFF',
                    pointHoverBorderColor:"#1E4D92",
                }
                 
                
            ]
        },
        options: getChartOptions(),
    });

    // Legend toggle
    const charts = [
    { chart: purchaseChart, legendId: "#purchaseCustomLegend"},
    { chart: referralChart, legendId: "#referralCustomLegend"},
    { chart: endcustomersChart, legendId: "#endcustomersCustomLegend"},
    { chart:pharmacyChart, legendId: "#pharmacyCustomLegend"},
    { chart:clientChart, legendId: "#clientCustomLegend"},
    
  ];
  charts.forEach(({ chart, legendId, tabsId }) => {
    $(`${legendId} .legend-checkbox`).on("change", function () {
      const datasetIndex = $(this).data("index");
      const visible = $(this).is(":checked");
      chart.setDatasetVisibility(datasetIndex, visible);
      chart.update();
    });
});
    // Dropdown handling
    $('.dropdown-btn').on('click', function (e) {
        e.stopPropagation();
        $(this).siblings('.dropdown-option').toggle();
    });

    $(document).on('click', function () {
        $('.dropdown-option').hide();
    });

    $('.dropdown-option div').on('click', function () {
        const selected = $(this).text().trim();
        console.log('Selected:', selected);
        $('.dropdown-option').hide();
    });

    $(".open-share-modal").on("click", function () {
    $("#shareModal").removeClass("hidden").addClass("flex");
  });
  $(".close-share-modal").on("click", function () {
    $("#shareModal").addClass("hidden").removeClass("flex");
  });
  $("#shareModal").on("click", function (e) {
    if ($(e.target).is("#shareModal")) {
      $("#shareModal").addClass("hidden").removeClass("flex");
    }
  });

   $(document).on('keypress', 'input.only-text', function (e) {
  const char = String.fromCharCode(e.which);
  if (!/^[a-zA-Z\s]$/.test(char)) {
    e.preventDefault();
  }
  });
setupPagination({
    containerId: 'featured-rewards',
    cardClass: 'reward-card',
    prevBtnId: 'prevPage1',
    nextBtnId: 'nextPage1',
    paginationContainerId: 'pagination-numbers1',
    cardsPerPage: 3
  });

  setupPagination({
    containerId: 'popular-coupons',
    cardClass: 'coupon-card',
    prevBtnId: 'prevPage2',
    nextBtnId: 'nextPage2',
    paginationContainerId: 'pagination-numbers2',
    cardsPerPage: 3
  });
});
function setupPagination({ containerId, cardClass, prevBtnId, nextBtnId, paginationContainerId, cardsPerPage = 3 }) {
  let currentPage = 1;

  function showPage(page) {
    const $cards = $(`#${containerId} .${cardClass}`);
    const totalPages = Math.ceil($cards.length / cardsPerPage);

    // Hide all cards and show only current page's
    $cards.hide();
    const start = (page - 1) * cardsPerPage;
    const end = start + cardsPerPage;
    $cards.slice(start, end).show();

    // Update prev/next buttons
    $(`#${prevBtnId}`).prop("disabled", page === 1);
    $(`#${nextBtnId}`).prop("disabled", page === totalPages);

    updatePaginationNumbers(totalPages, page);
  }

  function updatePaginationNumbers(totalPages, activePage) {
    const $container = $(`#${paginationContainerId}`);
    $container.empty();

    for (let i = 1; i <= totalPages; i++) {
      $("<button></button>")
        .text(i)
        .addClass("px-3 py-2 rounded-lg cursor-pointer")
        .addClass(
          i === activePage
            ? "bg-light-sea-green text-white font-normal text-xs"
            : "bg-pagination text-jet-black font-normal text-xs"
        )
        .on("click", function () {
          currentPage = i;
          showPage(currentPage);
        })
        .appendTo($container);
    }
  }

  // Event bindings
  $(`#${prevBtnId}`).on("click", function () {
    if (currentPage > 1) {
      currentPage--;
      showPage(currentPage);
    }
  });

  $(`#${nextBtnId}`).on("click", function () {
    const totalPages = Math.ceil($(`#${containerId} .${cardClass}`).length / cardsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      showPage(currentPage);
    }
  });

  // Initialize
  showPage(currentPage);
}
