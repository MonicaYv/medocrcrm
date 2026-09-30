/* =========================
   CSRF TOKEN (Django Safe)
========================= */
function getCSRFToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith('csrftoken=')) {
                cookieValue = decodeURIComponent(
                    cookie.substring('csrftoken='.length)
                );
                break;
            }
        }
    }
    return cookieValue;
}

/* =========================
   POPUP HANDLERS
========================= */
$(document).on("click", ".popup-btn", function () {
    const popupId = $(this).data("popup");
    $("." + popupId).removeClass("hidden").addClass("flex");
});

$(document).on("click", ".close-popup", function () {
    const popupId = $(this).data("popup");
    $(this).closest("." + popupId).addClass("hidden").removeClass("flex");
});

$(document).on("click", ".close-payment-success-popup", function () {
    $(".paymentSuccessPopup").addClass("hidden");
});

$(document).on("click", ".close-insufficient-balance-popup", function () {
    $(".insufficientBalancePopup").addClass("hidden");
});

$(document).on("click", ".close-payment-failed-popup", function () {
    $(".paymentFailedPopup").addClass("hidden");
});

$(document).on("click", ".try-again-btn", function () {
    $(".paymentFailedPopup").addClass("hidden");
    $(".paymentDetailsPopup").removeClass("hidden");
});

/* =========================
   INFO TOOLTIP
========================= */
function setupInfoTooltip() {
    if ($(window).width() > 768) {
        $('.info-container').hover(
            function () {
                $(this).find('.info-section').removeClass('hidden');
            },
            function () {
                $(this).find('.info-section').addClass('hidden');
            }
        );
    } else {
        $('.info-icon-subscription').on('click', function (e) {
            e.stopPropagation();
            $(this).siblings('.info-section').toggleClass('hidden');
        });

        $(document).on('click', function (e) {
            if (!$(e.target).closest('.info-container').length) {
                $('.info-section').addClass('hidden');
            }
        });
    }
}

$(window).on('resize', function () {
    $('.info-section').addClass('hidden');
});

/* =========================
   SUBSCRIPTION STATUS
========================= */
function formatINR(value) {
    const num = Number(value);
    if (!isFinite(num)) return "₹0";
    return "₹" + num.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

// Keep the Payment Details popup's balance in sync with the Advance wallet.
function renderAdvanceBalance(value) {
    $("#advance-balance").text(formatINR(value));
}

// The plan is paid from the Advance balance. Mark "Pay Now" as unaffordable
// instead of natively disabling it, so a click can still explain why and offer
// the "Submit Advance" shortcut.
function updatePayNowAvailability(available) {
    $(".pay-now-btn")
        .toggleClass("opacity-50", !available)
        .attr("data-can-pay", available ? "1" : "0");
}

$(document).ready(function () {
    setupInfoTooltip();

    $.ajax({
        url: "/settings/subscription/status/",
        method: "GET",
        success: function (res) {
            if (res.advance_balance !== undefined) {
                renderAdvanceBalance(res.advance_balance);
                updatePayNowAvailability(
                    !res.has_subscription && Number(res.advance_balance) >= Number(res.total)
                );
            }

            if (!res.has_subscription) {
                $(".free-plan-section").removeClass("hidden");
                $(".premium-plan-section").addClass("hidden");
            } else {
                $(".free-plan-section").addClass("hidden");
                $(".premium-plan-section").removeClass("hidden");

                $(".premium-plan-section p:contains('Active Plan')")
                    .text("Active Plan : " + res.plan);

                $(".premium-plan-section p:contains('Expiry Date')")
                    .html(`Expiry Date : ${res.expiry_date}
                        <span class="text-strong-red">
                            (${res.days_left} days left to go)
                        </span>`);

                $(".premium-plan-section .font-bold.text-base")
                    .html("&#8377;" + res.price);
            }
        },
        error: function () {
            console.error("Failed to fetch subscription status");
        }
    });
});

/* =========================
   PAY NOW (SUBSCRIBE)
========================= */
$(document).on("click", ".pay-now-btn", function () {
    const $btn = $(this);

    // Known up-front shortfall: explain and point at the Advance screen.
    if ($btn.attr("data-can-pay") === "0") {
        $(".paymentDetailsPopup").addClass("hidden");
        $(".insufficientBalancePopup").removeClass("hidden");
        return;
    }

    // Guard against double submits while the request is in flight.
    if ($btn.data("inFlight")) return;
    $btn.data("inFlight", true);

    $.ajax({
        url: "/settings/subscription/subscribe/",
        type: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        },
        success: function (res) {
            // Reflect the debited balance immediately so the section updates
            // without a full page reload.
            if (res.advance_balance !== undefined) {
                renderAdvanceBalance(res.advance_balance);
            }
            updatePayNowAvailability(false);
            if (res.points_earned !== undefined) {
                $(".subscription-points-earned").text(res.points_earned);
            }
            $(".paymentDetailsPopup").addClass("hidden");
            $(".free-plan-section").addClass("hidden");
            $(".premium-plan-section").removeClass("hidden");
            $(".paymentSuccessPopup").removeClass("hidden");
        },
        error: function (xhr) {
            const res = xhr.responseJSON || {};
            $btn.data("inFlight", false);

            if (res.insufficient) {
                $(".paymentDetailsPopup").addClass("hidden");
                $(".insufficientBalancePopup").removeClass("hidden");
                if (res.advance_balance !== undefined) {
                    renderAdvanceBalance(res.advance_balance);
                }
                updatePayNowAvailability(false);
                return;
            }

            // Genuine failure - allow a retry.
            $btn.removeClass("opacity-50").attr("data-can-pay", "1");
            $(".paymentFailedPopup").removeClass("hidden");
        }
    });
});

/* =========================
   CANCEL SUBSCRIPTION
========================= */
$(document).on("click", ".end-subs-btn", function () {
    $.ajax({
        url: "/settings/subscription/cancel/",
        type: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        },
        success: function () {
            $(".cancelSubscriptionPopup").addClass("hidden");
            location.reload();
        },
        error: function () {
            toastr.error("Failed to cancel subscription");
        }
    });
});
