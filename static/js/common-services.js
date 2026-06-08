/* -------- TABS HANDLER -------- */
$(document).ready(function () {
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

function showPharmacyValidation(message, type = 'error') {
    const $message = $('.pharmacy-validation-message');
    if (!$message.length) return;

    const typeClass = type === 'success'
        ? 'border-green text-green bg-mint-cream'
        : 'border-strong-red text-strong-red bg-soft-pink';

    $message
        .removeClass('hidden border-green text-green bg-mint-cream border-strong-red text-strong-red bg-soft-pink')
        .addClass(typeClass)
        .text(message);
}

function clearPharmacyValidation() {
    $('.pharmacy-validation-message')
        .addClass('hidden')
        .removeClass('border-green text-green bg-mint-cream border-strong-red text-strong-red bg-soft-pink')
        .text('');
}

function setMedicineCardValue($card, index, value) {
    const cleanValue = String(value || '').trim();
    $card.find('.custom-dropdown').eq(index).find('.selected-text')
        .text(cleanValue)
        .attr('data-value', cleanValue);
}

function parseCsvLine(line) {
    const values = [];
    let value = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === '"' && inQuotes && nextChar === '"') {
            value += '"';
            index += 1;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(value.trim());
            value = '';
        } else {
            value += char;
        }
    }

    values.push(value.trim());
    return values;
}

function parseMedicineCsv(csvText) {
    const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (!lines.length) return [];

    let headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().replace(/\s+/g, '_'));
    const hasHeader = ['category', 'name', 'type', 'quantity', 'price'].some((key) => headers.includes(key));
    const dataLines = hasHeader ? lines.slice(1) : lines;

    if (!hasHeader) {
        headers = ['category', 'name', 'type', 'quantity', 'price'];
    }

    return dataLines.map((line) => {
        const columns = parseCsvLine(line);
        return headers.reduce((row, header, index) => {
            row[header] = columns[index] || '';
            return row;
        }, {});
    }).map((row) => ({
        category: row.category || '',
        name: row.name || row.medicine || row.medicine_name || '',
        type: row.type || row.medicine_type || '',
        quantity: String(row.quantity || '').replace(/\D/g, ''),
        price: row.price || '',
    })).filter((row) => row.category && row.name && row.type && row.quantity && row.price);
}

function populateMedicineRows(rows) {
    const $list = $('.services-section #step-1 .services-list');
    const $template = $list.find('.service-card').first();

    if (!$list.length || !$template.length) return;

    $list.empty();

    rows.forEach((row) => {
        const $card = $template.clone();
        resetMedicineCard($card);
        setMedicineCardValue($card, 0, row.category);
        setMedicineCardValue($card, 1, row.name);
        setMedicineCardValue($card, 2, row.type);
        $card.find('.medicine-quantity').val(row.quantity);
        $card.find('.medicine-price').val(row.price);
        $list.append($card);
    });
}

$(document).on('click', '.upload-btn, .upload-box', function (e) {
    e.stopPropagation();
    $(this).closest('.file-upload-wrapper').find('.file-input').trigger('click');
});

$(document).on('change', '.file-input', function () {
    const wrapper = $(this).closest('.file-upload-wrapper');
    const file = this.files[0];
    clearPharmacyValidation();

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
        showPharmacyValidation('Please upload a CSV file.');
        $(this).val('');
        return;
    }

    wrapper.find('.file-name').text(file.name);
    wrapper.find('.remove-file').removeClass('hidden');
    wrapper.find('.submit-btn')
        .prop('disabled', false)
        .removeClass('bg-light-gray cursor-not-allowed')
        .addClass('bg-dodger-blue text-white');
});

$(document).on('click', '.remove-file', function (e) {
    e.stopPropagation();

    const wrapper = $(this).closest('.file-upload-wrapper');
    clearPharmacyValidation();
    wrapper.find('.file-input').val('');
    wrapper.find('.file-name').text('Upload CSV File');
    $(this).addClass('hidden');
    wrapper.find('.submit-btn')
        .prop('disabled', true)
        .removeClass('bg-dodger-blue text-white')
        .addClass('bg-light-gray cursor-not-allowed');
});

$(document).on('click', '.submit-btn', function () {
    const wrapper = $(this).closest('.file-upload-wrapper');
    const file = wrapper.find('.file-input')[0]?.files?.[0];
    clearPharmacyValidation();

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
        const rows = parseMedicineCsv(event.target.result || '');

        if (!rows.length) {
            showPharmacyValidation('No valid medicine rows found in the CSV.');
            return;
        }

        populateMedicineRows(rows);
        showPharmacyValidation('Medicine CSV uploaded successfully.', 'success');
    };

    reader.readAsText(file);
});

$(document).on('click', '.add-service', function () {
    const $list = $(this).closest('.step-content').find('.services-list');
    if (!$list.length) return;

    clearPharmacyValidation();
    const $card = $list.find('.service-card').first().clone();
    resetMedicineCard($card);
    $list.append($card);
});

$(document).on('click', '.remove-service', function () {
    const $list = $(this).closest('.services-list');
    clearPharmacyValidation();
    if ($list.find('.service-card').length === 1) {
        resetMedicineCard($(this).closest('.service-card'));
        return;
    }
    $(this).closest('.service-card').remove();
});

$(document).on('input', '.medicine-quantity', function () {
    this.value = this.value.replace(/\D/g, '');
    clearPharmacyValidation();
});

function collectPharmacyMedicineRows(showValidation = false) {
    const rows = [];
    let hasInvalidQuantity = false;

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
            if (!/^\d+$/.test(quantity)) {
                hasInvalidQuantity = true;
                return;
            }
            rows.push({ category, name, type, quantity, price });
        }
    });

    if (hasInvalidQuantity) {
        if (showValidation) {
            showPharmacyValidation('Quantity should contain numbers only.');
        }
        return [];
    }

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
    clearPharmacyValidation();
    const rows = collectPharmacyMedicineRows(true);
    if (!rows.length) {
        if ($('.pharmacy-validation-message').hasClass('hidden')) {
            showPharmacyValidation('Please add at least one complete medicine row.');
        }
        return;
    }

    renderPharmacySummary(rows);
    goToStep(2);
});

$(document).on('click', '.save-pharmacy-medicines', function () {
    clearPharmacyValidation();
    const rows = collectPharmacyMedicineRows(true);
    if (!rows.length) {
        if ($('.pharmacy-validation-message').hasClass('hidden')) {
            showPharmacyValidation('Please add at least one complete medicine row.');
        }
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
            showPharmacyValidation(error.message);
            goToStep(1);
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
        .catch((error) => showPharmacyValidation(error.message));
});
