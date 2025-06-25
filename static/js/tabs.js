$(document).ready(function () {
  $(".tab-btn").click(function () {
    var target = $(this).data("tab");
    $(".tab-btn").removeClass(
      "border-b-2 text-light-sea-green px-4 text-18-fs"
    );
    $(this).addClass("border-b-2 text-light-sea-green px-4 text-18-fs");
    $(".tab-content").addClass("hidden");
    $("#" + target).removeClass("hidden");
  });

  $(".tab-btn-customer").click(function () {
    var target = $(this).data("tab");

    $(".tab-btn-customer").removeClass("active-tab");
    $(this).addClass("active-tab");

    $(".tab-content").addClass("hidden");
    $("." + target).removeClass("hidden");
    if (target === "points") {
      $(".diamond-user").show();
    } else {
      $(".diamond-user").hide();
    }
  });

  // $('.tab-btn-client').click(function () {
  //     var target = $(this).data('tab');

  //     $('.tab-btn-client').removeClass('active-tab-client');
  //     $(this).addClass('active-tab-client');

  //     $('.tab-content').addClass('hidden');
  //     $('.' + target).removeClass('hidden');
  // });

  $(".tab-btn-advertiser").click(function () {
    var target = $(this).data("tab");

    $(".tab-btn-advertiser").removeClass("active-tab-advertiser");
    $(this).addClass("active-tab-advertiser");

    $(".tab-content").addClass("hidden");
    $("." + target).removeClass("hidden");
    if (target === "points") {
      $(".diamond-user").show();
    } else {
      $(".diamond-user").hide();
    }
  });

  $(".tab-btn-pharmacy").click(function () {
    var target = $(this).data("tab");

    $(".tab-btn-pharmacy").removeClass("active-tab-pharmacy");
    $(this).addClass("active-tab-pharmacy");

    $(".tab-content").addClass("hidden");
    $("." + target).removeClass("hidden");
    if (target === "points") {
      $(".diamond-user").show();
    } else {
      $(".diamond-user").hide();
    }
    if ($('.active-tab-pharmacy').data('tab') === 'enquiry') {
      $('.chat-profile[data-id="1"]').removeClass('hidden');
    }else{
          $('.chat-profile[data-id="2"]').removeClass('hidden');
    }
  });

  $(".tab-btn-ngo").click(function () {
    var target = $(this).data("tab");

    $(".tab-btn-ngo").removeClass("active-tab1-ngo");
    $(this).addClass("active-tab1-ngo");

    $(".tab-content").addClass("hidden");
    $("." + target).removeClass("hidden");
    if (target === "points") {
      $(".referral").removeClass("hidden");
    } else {
      $(".referral").addClass("hidden");
    }
    if (target === "points") {
      $(".diamond-user").show();
    } else {
      $(".diamond-user").hide();
    }
  });

  $(".tab-btn-client").click(function () {
    var target = $(this).data("tab");

    $(".tab-btn-client").removeClass("active-tab-client");
    $(this).addClass("active-tab-client");

    $(".tab-content").addClass("hidden");
    $("." + target).removeClass("hidden");
    if (target === "points") {
      $(".diamond-user").show();
    } else {
      $(".diamond-user").hide();
    }
    
  });
});
