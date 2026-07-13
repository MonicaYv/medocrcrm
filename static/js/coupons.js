$(document).ready(function () {
//   $(".createCouponBtn").on("click", function (e) {
//     e.preventDefault();

//     console.log("Create Coupon Button Clicked");

//     $(".myCoupons").addClass("hidden");
//     $(".createCouponSection").removeClass("hidden");
//  });
$(".createCouponBtn").on("click", function (e) {
    e.preventDefault();

    $(".myCoupons").addClass("hidden");

    $(".createCouponSection")
        .removeClass("hidden")
        .css("display", "block");

    $("html, body").animate({
        scrollTop: $(".createCouponSection").offset().top
    }, 200);
});

  $("#expiryDate").datepicker({
    dateFormat: "dd/mm/yy",
    minDate: 0,
    onSelect: function (dateText) {
      $("#expiryDateError").addClass("hidden");
    },
  });
  $("#calendarIcon").on("click", function () {
    $("#expiryDate").datepicker("show");
  });
  $("#percentageCheck").on("change", function () {
    if ($(this).is(":checked")) {
      $("#fixedAmountCheck").prop("checked", false);
      $("#percentIcon").show();
    }
  });

  $("#fixedAmountCheck").on("change", function () {
    if ($(this).is(":checked")) {
      $("#percentageCheck").prop("checked", false);
      $("#percentIcon").hide();
    }
  });

  $("#couponName").on("input blur", function () {
    const value = $(this).val().trim();
    if (!value) {
      $("#couponNameError").removeClass("hidden");
    } else {
      $("#couponNameError").addClass("hidden");
    }
  });

  $("#couponCode").on("input blur", function () {
    const value = $(this).val().trim();
    if (!value) {
      $("#couponCodeError").removeClass("hidden");
    } else {
      $("#couponCodeError").addClass("hidden");
    }
  });

  $("#discountValue").on("input blur", function () {
    const value = $(this).val().trim();
    if (!value) {
      $("#discountValueError").removeClass("hidden");
    } else {
      $("#discountValueError").addClass("hidden");
    }
  });

  $("#expiryDate").on("change blur", function () {
    const value = $(this).val().trim();
    if (!value) {
      $("#expiryDateError").removeClass("hidden");
    } else {
      $("#expiryDateError").addClass("hidden");
    }
  });

  $("#usagesLimit").on("input blur", function () {
    const value = $(this).val().trim();
    if (!value) {
      $("#usagesLimitError").removeClass("hidden");
    } else {
      $("#usagesLimitError").addClass("hidden");
    }
  });

  // $(".createCouponForm").on("submit", function (e) {
  //   e.preventDefault();
  //   $(".error-message").addClass("hidden");

  //   let isValid = true;
  //   const couponName = $("#couponName").val().trim();
  //   if (!couponName) {
  //     $("#couponNameError").removeClass("hidden");
  //     isValid = false;
  //   }
  //   const couponCode = $("#couponCode").val().trim();
  //   if (!couponCode) {
  //     $("#couponCodeError").removeClass("hidden");
  //     isValid = false;
  //   }
  //   const discountValue = $("#discountValue").val().trim();
  //   if (!discountValue) {
  //     $("#discountValueError").removeClass("hidden");
  //     isValid = false;
  //   }
  //   const expiryDate = $("#expiryDate").val().trim();
  //   if (!expiryDate) {
  //     $("#expiryDateError").removeClass("hidden");
  //     isValid = false;
  //   }
  //   const usagesLimit = $("#usagesLimit").val().trim();
  //   if (!usagesLimit) {
  //     $("#usagesLimitError").removeClass("hidden");
  //     isValid = false;
  //   }

  //   if (isValid) {
  //     const discountType = $("#percentageCheck").is(":checked")
  //       ? "Percentage"
  //       : "Fixed Amount";
  //     $("#successMessage").removeClass("hidden");
  //     $(".createCouponForm")[0].reset();
  //     $("#percentageCheck").prop("checked", true);
  //     setTimeout(function () {
  //       $("#successMessage").addClass("hidden");
  //     }, 3000);
  //   }
  // });

  // Cancel button functionality
  $("#cancelBtn").on("click", function () {
    $(".createCouponForm")[0].reset();
    $("#percentageCheck").prop("checked", true);
    $(".error-message").addClass("hidden");
    $("#successMessage").addClass("hidden");
    // $(".myCoupons").removeClass("hidden");
    // $(".createCouponSection").addClass("hidden");
    $(".myCoupons").show();
    $(".createCouponSection").hide().addClass("hidden");
  });

  setupPagination({
    containerId: "featured-rewards",
    cardClass: "reward-card",
    prevBtnId: "prevPage1",
    nextBtnId: "nextPage1",
    paginationContainerId: "pagination-numbers1",
    cardsPerPage: 3,
  });

  setupPagination({
    containerId: "popular-coupons",
    cardClass: "coupon-card",
    prevBtnId: "prevPage2",
    nextBtnId: "nextPage2",
    paginationContainerId: "pagination-numbers2",
    cardsPerPage: 3,
  });

  setupPagination({
    containerId: "created-coupons",
    cardClass: "created-coupon",
    prevBtnId: "prevPage3",
    nextBtnId: "nextPage3",
    paginationContainerId: "pagination-numbers3",
    cardsPerPage: 5,
  });
  
  function setupPagination({
    containerId,
    cardClass,
    prevBtnId,
    nextBtnId,
    paginationContainerId,
    cardsPerPage = 3,
  }) {
    let currentPage = 1;

    function showPage(page) {
      const $cards = $(`#${containerId} .${cardClass}`);
      const totalPages = Math.ceil($cards.length / cardsPerPage);

      $cards.hide();
      const start = (page - 1) * cardsPerPage;
      const end = start + cardsPerPage;
      $cards.slice(start, end).show();

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
          .addClass("px-3 py-2 rounded-lg cursor-pointer font-normal text-xs")
          .addClass(
            i === activePage
              ? `bg-dodger-blue text-white`
              : "bg-pagination text-jet-black"
          )
          .on("click", function () {
            currentPage = i;
            showPage(currentPage);
          })
          .appendTo($container);
      }
    }

    $(`#${prevBtnId}`).on("click", function () {
      if (currentPage > 1) {
        currentPage--;
        showPage(currentPage);
      }
    });

    $(`#${nextBtnId}`).on("click", function () {
      const totalPages = Math.ceil(
        $(`#${containerId} .${cardClass}`).length / cardsPerPage
      );
      if (currentPage < totalPages) {
        currentPage++;
        showPage(currentPage);
      }
    });

    showPage(currentPage);
  }
});
$(".createCouponForm").on("submit", function (e) {
  e.preventDefault();
  $(".error-message").addClass("hidden");

  const payload = {
    coupon_name: $("#couponName").val().trim(),
    coupon_code: $("#couponCode").val().trim(),
    discount_type: $("#percentageCheck").is(":checked") ? "percentage" : "fixed",
    discount_value: $("#discountValue").val().trim(),
    expiry_date: $("#expiryDate").val().trim(),
    usage_limit: $("#usagesLimit").val().trim(),
    csrfmiddlewaretoken: $("input[name=csrfmiddlewaretoken]").val(),
  };
  console.log(payload);
  console.log("Expiry date:", $("#expiryDate").val());
  $.ajax({
    url: "/coupons/seller/create/",
    method: "POST",
    data: payload,


    
    success: function (data) {
      if (data.success) {
        toastr.success("Coupon Creation Successful");

        $(".createCouponForm")[0].reset();
        $("#percentageCheck").prop("checked", true);
        $("#percentIcon").show();

        // setTimeout(function () {
        //   $(".myCoupons").show();
        //   $(".createCouponSection").addClass("hidden");
        // }, 1500);
        setTimeout(function () {

            loadCreatedCoupons(1);

            $(".myCoupons").removeClass("hidden");
            $(".createCouponSection").addClass("hidden");

        }, 1500);
      } else {
        toastr.error(data.error || "Coupon Creation failed");
      }
    },

    error: function (xhr) {
      const res = xhr.responseJSON;

      if (res && res.errors) {
        if (res.errors.coupon_name) $("#couponNameError").removeClass("hidden");
        if (res.errors.coupon_code) $("#couponCodeError").removeClass("hidden");
        if (res.errors.discount_value) $("#discountValueError").removeClass("hidden");
        if (res.errors.expiry_date) $("#expiryDateError").removeClass("hidden");
        if (res.errors.usage_limit) $("#usagesLimitError").removeClass("hidden");

        toastr.error("Please fix the highlighted errors");
      } else {
        toastr.error("Coupon Creation failed");
      }
    },
  });
});

let currentPage = 1;

function loadCreatedCoupons(page = 1) {
    $.ajax({
        url: "/coupons/ajax/get-created-coupons/",
        type: "GET",
        data: { page: page },
        beforeSend: function () {
            $("#created-coupons").html("<p>Loading...</p>");
        },
        success: function (res) {
            if (res.success) {
                $("#created-coupons").html(res.html);
                currentPage = res.current_page;
                renderPagination(res.total_pages);
            } else {
                $("#created-coupons").html("<p>Error loading coupons</p>");
            }
        },
        error: function () {
            $("#created-coupons").html("<p>Server error</p>");
        }
    });
}
function renderPagination(totalPages) {
    let html = "";

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <button class="page-btn px-3 py-1 border rounded
                ${i === currentPage ? 'bg-dodger-blue text-white' : ''}"
                data-page="${i}">
                ${i}
            </button>
        `;
    }

    $("#pagination-numbers3").html(html);

    $("#prevPage3").prop("disabled", currentPage === 1);
    $("#nextPage3").prop("disabled", currentPage === totalPages);
}
$(document).on("click", ".page-btn", function () {
    const page = $(this).data("page");
    loadCreatedCoupons(page);
});

$("#prevPage3").on("click", function () {
    if (currentPage > 1) loadCreatedCoupons(currentPage - 1);
});

$("#nextPage3").on("click", function () {
    loadCreatedCoupons(currentPage + 1);
});

$(document).on("click", "[data-tab='created-coupons']", function () {
    loadCreatedCoupons(1);
});

$(document).on("click", ".copy-coupon", function () {
    const code = $(this).data("code");

    navigator.clipboard.writeText(code).then(() => {
        // Optional visual feedback
        $(this).text("Redeemed!").append(` <span class="material-symbols-outlined">check_circle</span>`);
        let btn = $(this);
        setTimeout(() => {
            btn.html(code + ` <span class="material-symbols-outlined">content_copy</span>`);
        }, 1200);
    });
});
