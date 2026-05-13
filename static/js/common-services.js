/* -------- TABS HANDLER -------- */
$('.tabs').each(function () {
    const $tabsWrapper = $(this);
    const $buttons = $tabsWrapper.find('.tab-btn, .tab-btn-lab');
    const $indicator = $tabsWrapper.find('.tab-indicator');

    function moveIndicator($btn) {
        if (!$btn || !$btn.length) return;   // 🛑 safety

        const pos = $btn.position();
        if (!pos) return;                    // 🛑 safety

        $indicator.css({
            left: pos.left + 'px',
            width: $btn.outerWidth() + 'px',
            height: $btn.outerHeight() + 'px'
        });
    }

    // Init
    const $activeBtn = $buttons.filter('.active').first();

    if ($activeBtn.length) {
        moveIndicator($activeBtn);
        showTabContent($activeBtn.data('type'), $tabsWrapper);
    }


    $tabsWrapper.on('click', '.tab-btn, .tab-btn-lab', function () {
        const $btn = $(this);
        const type = $btn.data('type');

        $buttons.removeClass('active');
        $btn.addClass('active');

        moveIndicator($btn);
        showTabContent(type, $tabsWrapper);
    });

    $(window).on('resize', function () {
        moveIndicator($buttons.filter('.active'));
    });
});

// Scoped content handler
function showTabContent(type, $tabsWrapper) {
  const group = $tabsWrapper.hasClass("tabs-home")
    ? ".tabs-home-content"
    : ".tabs-inner-content";

  $(group).addClass("hidden");
  $(group).filter(`[data-type="${type}"]`).removeClass("hidden");
}

/* -------- DROPDOWN HANDLER -------- */

// Toggle dropdown
$(document).on('click', '.dropdown-trigger button', function (e) {
    e.stopPropagation();
    $('.dropdown-menu').not($(this).next()).addClass('hidden');
    $(this).next('.dropdown-menu').toggleClass('hidden');
});

// Select item
$(document).on('click', '.dropdown-item', function () {
    const value = $(this).text();
    const dropdown = $(this).closest('.custom-dropdown');

    dropdown.find('.selected-text').text(value.trim()).attr('data-value', value.trim());
    dropdown.find('.dropdown-menu').addClass('hidden');
});

// Close on outside click
$(document).on('click', function () {
    $('.dropdown-menu').addClass('hidden');
});

/* -------- STEPS HANDLER -------- */

$(document).ready(function () {
    goToStep(1);
});


function goToStep(stepNumber) {

    // Hide all step content
    $('.step-content').addClass('hidden');
    const $currentStep = $('#step-' + stepNumber).removeClass('hidden');

    const $container = $('.main-section');

    setTimeout(() => {
        $container.animate({ scrollTop: 0 }, 300);
    }, 50);

    // Reset all
    $('.step-circle').removeClass('active-step');
    $('.step-label').removeClass('active-heading');
    $('.step-line').removeClass('active-line');

    // Activate current + previous steps
    $('.step-circle').each(function () {
        if ($(this).data('step') <= stepNumber) {
            $(this).addClass('active-step');
        }
    });

    $('.step-label').each(function () {
        if ($(this).data('step') <= stepNumber) {
            $(this).addClass('active-heading');
        }
    });

    // Activate completed lines
    $('.step-line').each(function () {
        if ($(this).data('step') < stepNumber) {
            $(this).addClass('active-line');
        }
    });
}

$(document).on('click', '.step-btn', function () {
    if ($(this).hasClass('pharmacy-summary-next')) {
        return;
    }
    const targetStep = $(this).data('target');
    goToStep(targetStep);
});

$(document).on('click', '.home-add-service', function () {
    $('.services-section').removeClass('hidden');
    $('.home-section').addClass('hidden')
    goToStep(1);
});

$(document).on('click', '#cancel-steps', function () {
    $('.services-section').addClass('hidden');
    $('.home-section').removeClass('hidden')
});

/* -------- MORE BUTTON HANDLER -------- */
$(document).on('click', '.more-btn', function (e) {
    e.stopPropagation();

    const card = $(this).closest('.service-card');

    // Close other open dropdowns
    $('.more-dropdown').not(card.find('.more-dropdown')).addClass('hidden');

    // Toggle current dropdown
    card.find('.more-dropdown').toggleClass('hidden');
});

$(document).on('click', function () {
    $('.more-dropdown').addClass('hidden');
});

$(document).on('click', '.delete-btn', function () {
    const card = $(this).closest('.service-card');
    card.remove();
});
document.addEventListener("click", function (e) {
    if (e.target.classList.contains("dropdown-item") && e.target.dataset.category) {

        const category = e.target.dataset.category;
        const medicines = MEDICINE_MAP[category] || [];

        const card = e.target.closest(".service-card");
        const menu = card.querySelector(".medicine-menu");

        menu.innerHTML = "";

        medicines.forEach(name => {
            menu.innerHTML += `
              <li class="dropdown-item px-3 py-2 hover:bg-premium-light-blue cursor-pointer">
                  ${name}
              </li>
            `;
        });
    }
});

/* -------- PHARMACY MEDICINE SERVICES -------- */

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}

function resetMedicineCard($card) {
    $card.find('.selected-text').each(function () {
        const label = $(this).closest('.custom-dropdown').find('label').text().trim();
        $(this).text(label).removeAttr('data-value');
    });
    $card.find('.medicine-menu').empty();
    $card.find('input').val('');
}

$(document).on('click', '.add-service', function () {
    const $list = $(this).closest('.step-content').find('.services-list');
    if (!$list.length) return;

    const $card = $list.find('.service-card').first().clone();
    resetMedicineCard($card);
    $list.append($card);
});

$(document).on('click', '.remove-service', function () {
    const $list = $(this).closest('.services-list');
    if ($list.find('.service-card').length === 1) {
        resetMedicineCard($(this).closest('.service-card'));
        return;
    }
    $(this).closest('.service-card').remove();
});

function collectPharmacyMedicineRows() {
    const rows = [];

    $('.services-section #step-1 .service-card').each(function () {
        const $card = $(this);
        const dropdowns = $card.find('.custom-dropdown');
        const category = dropdowns.eq(0).find('.selected-text').attr('data-value') || dropdowns.eq(0).find('.selected-text').text().trim();
        const name = dropdowns.eq(1).find('.selected-text').attr('data-value') || dropdowns.eq(1).find('.selected-text').text().trim();
        const type = dropdowns.eq(2).find('.selected-text').attr('data-value') || dropdowns.eq(2).find('.selected-text').text().trim();
        const quantity = $card.find('.medicine-quantity').val().trim();
        const price = $card.find('.medicine-price').val().trim();

        const placeholderValues = ['Select Category', 'Select Medicine Name', 'Select Medicine Type', 'Select Options'];
        if (!placeholderValues.includes(category) && !placeholderValues.includes(name) && !placeholderValues.includes(type) && quantity && price) {
            rows.push({ category, name, type, quantity, price });
        }
    });

    return rows;
}

function renderPharmacySummary(rows) {
    const $grid = $('.pharmacy-summary-grid');
    $grid.empty();

    if (!rows.length) {
        $grid.append('<p class="text-center text-gray-400 lg:col-span-2 py-6">No medicines selected.</p>');
        return;
    }

    rows.forEach((row) => {
        $grid.append(`
            <div class="service-card bg-white border border-frost-white rounded-md shadow-12 min-h-[85px] w-full flex flex-col items-start px-4 py-3 relative gap-2">
                <div class="flex items-start justify-between w-full gap-3">
                    <div class="flex items-center gap-3 min-w-0">
                        <img src="/static/images/medicines-icon.svg" alt="medicines">
                        <div class="min-w-0">
                            <h3 class="text-sm sm:text-base font-semibold text-black truncate">${row.name}</h3>
                            <p class="text-xs text-foggy-silver">${row.quantity} | ${row.type} | ${row.category}</p>
                        </div>
                    </div>
                </div>
                <div class="flex items-center w-full">
                    <span class="text-base sm:text-lg text-dodger-blue font-bold">₹${row.price}</span>
                </div>
            </div>
        `);
    });
}

$(document).on('click', '.pharmacy-summary-next', function () {
    const rows = collectPharmacyMedicineRows();
    if (!rows.length) {
        alert('Please add at least one complete medicine row.');
        return;
    }

    renderPharmacySummary(rows);
    goToStep(2);
});

$(document).on('click', '.save-pharmacy-medicines', function () {
    const rows = collectPharmacyMedicineRows();
    if (!rows.length) {
        alert('Please add at least one complete medicine row.');
        goToStep(1);
        return;
    }

    const $btn = $(this);
    $btn.prop('disabled', true).addClass('opacity-60');

    fetch('/services/pharmacy/medicines/save/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ services: rows })
    })
        .then((res) => res.json())
        .then((data) => {
            if (!data.success) {
                throw new Error(data.error || 'Unable to save medicines');
            }
            window.location.reload();
        })
        .catch((error) => {
            alert(error.message);
            $btn.prop('disabled', false).removeClass('opacity-60');
        });
});

$(document).on('click', '.delete-pharmacy-medicine', function (e) {
    e.stopPropagation();
    const id = $(this).data('id');
    if (!id) return;

    fetch(`/services/pharmacy/medicines/${id}/delete/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
        .then((res) => res.json())
        .then((data) => {
            if (!data.success) {
                throw new Error(data.error || 'Unable to delete medicine');
            }
            $(`.pharmacy-medicine-card[data-id="${id}"]`).remove();
            if (!$('.pharmacy-medicine-card').length) {
                window.location.reload();
            }
        })
        .catch((error) => alert(error.message));
});
