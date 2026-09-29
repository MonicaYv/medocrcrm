/* =========================================================
   CSRF
========================================================= */
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie) {
    document.cookie.split(';').forEach(cookie => {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
      }
    });
  }
  return cookieValue;
}

/* =========================================================
   DROPDOWN UTILS
========================================================= */
function populateDropdown(dropdown, items) {
  const menu = dropdown.find('.dropdown-menu');
  menu.empty();

  items.forEach(item => {
    menu.append(`
      <li class="dropdown-item px-3 py-2 hover:bg-premium-light-blue cursor-pointer"
          data-id="${item.id}">
        ${item.name}
      </li>
    `);
  });
}

/* =========================================================
   CARD INITIALIZERS
========================================================= */
function initDoctorServiceCard(card) {
  const categoryDropdown = card.find('.custom-dropdown').eq(0);
  const serviceDropdown  = card.find('.custom-dropdown').eq(1);

  populateDropdown(categoryDropdown, window.DOCTOR_DATA.categories);
  populateDropdown(serviceDropdown, window.DOCTOR_DATA.services);

  categoryDropdown.find('.selected-text')
    .text('Select Category')
    .removeAttr('data-id');

  serviceDropdown.find('.selected-text')
    .text('Select Service')
    .removeAttr('data-id');
}

function initDoctorVisitCard(card) {
  const dropdown = card.find('.custom-dropdown');

  populateDropdown(dropdown, window.DOCTOR_DATA.visit_types);

  dropdown.find('.selected-text')
    .text('Select Visit Type')
    .removeAttr('data-id');
}

/* =========================================================
   PAGE LOAD
========================================================= */
$(document).ready(function () {
  $('.services-list .service-card').each(function () {
    initDoctorServiceCard($(this));
  });

  $('.visit-services-list .service-card').each(function () {
    initDoctorVisitCard($(this));
  });
});

// Keep the currency marker visible while keeping the submitted value numeric.
$(document).on('focus', '.doctor-price-input', function () {
  this.value = this.value.replace(/[₹,\s]/g, '');
  this.select();
});
$(document).on('blur', '.doctor-price-input', function () {
  const value = this.value.replace(/[^0-9.]/g, '');
  this.value = `₹ ${value === '' ? '0.00' : value}`;
});

$(document).on("click", ".more-btn", function (e) {
  e.stopPropagation();

  $(".more-dropdown").addClass("hidden");

  $(this)
    .siblings(".more-dropdown")
    .toggleClass("hidden");
});

$(document).on("click", function () {
  $(".more-dropdown").addClass("hidden");
});
/* =========================================================
   CARD TEMPLATES
   ========================================================= */
const serviceCardTemplate = () => `
  <div class="service-card rounded-lg px-4 py-6 relative bg-[#F9FAFB]">
    <button class="remove-service absolute top-3 right-3 text-ebony hover:text-red-500">✕</button>

    <!-- Category Dropdown -->
    <div class="mb-4 custom-dropdown">
      <label class="text-base sm:text-lg text-jet-black font-semibold">Select Category</label>

      <div class="dropdown-trigger mt-2">
        <button type="button" class="w-full border border-slate-gray rounded-md px-3 py-3 text-left flex justify-between items-center">
          <span class="selected-text text-sm sm:text-base font-normal text-dark-gray">Select Category</span>
          <span class="material-symbols-outlined">keyboard_arrow_down</span>
        </button>

        <ul class="dropdown-menu hidden absolute z-20 mt-1 w-1/2 bg-white border border-dodger-blue rounded shadow text-sm sm:text-base text-dark-gray font-normal h-40 overflow-y-auto scroll"></ul>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="custom-dropdown">
        <label class="text-base sm:text-lg text-jet-black font-semibold">Select Service</label>

        <div class="dropdown-trigger mt-2">
          <button type="button" class="w-full border border-slate-gray rounded-md px-3 py-3 text-left flex justify-between items-center">
            <span class="selected-text text-sm sm:text-base font-normal text-dark-gray">Select Service</span>
            <span class="material-symbols-outlined">keyboard_arrow_down</span>
          </button>

          <ul class="dropdown-menu hidden absolute z-20 mt-1 w-1/2 bg-white border border-dodger-blue rounded shadow text-sm sm:text-base text-dark-gray font-normal h-40 overflow-y-auto scroll"></ul>
        </div>
      </div>

      <!-- Price -->
      <div>
        <label class="text-base sm:text-lg text-jet-black font-semibold">Price</label>
        <input type="text"
          class="doctor-price-input w-full border border-slate-gray rounded-md px-3 py-3 mt-2 focus:outline-none"
          value="₹ 0.00">
      </div>
    </div>
  </div>
`;

const visitServiceCardTemplate = () => `
  <div class="service-card rounded-lg px-4 py-3 relative bg-[#F9FAFB]">
    <button class="remove-service-visit absolute top-3 right-3 text-ebony hover:text-red-500">✕</button>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="custom-dropdown">
        <label class="text-base sm:text-lg text-jet-black font-semibold">Visit Type</label>

        <div class="dropdown-trigger mt-2">
          <button type="button" class="w-full border border-slate-gray rounded-md px-3 py-3 text-left flex justify-between items-center">
            <span class="selected-text text-sm sm:text-base font-normal text-dark-gray">Select Visit Type</span>
            <span class="material-symbols-outlined">keyboard_arrow_down</span>
          </button>

          <ul class="dropdown-menu hidden absolute z-20 mt-1 w-1/2 bg-white border border-dodger-blue rounded shadow text-sm sm:text-base text-dark-gray font-normal h-40 overflow-y-auto scroll"></ul>
        </div>
      </div>

      <!-- Price -->
      <div>
        <label class="text-base sm:text-lg text-jet-black font-semibold">Price</label>
        <input type="text"
          class="doctor-price-input w-full border border-slate-gray rounded-md px-3 py-3 mt-2 focus:outline-none"
          value="₹ 0.00">
      </div>
    </div>
  </div>
`;

/* =========================================================
   ADD / REMOVE CARDS
========================================================= */
$(document).on('click', '.add-service', function () {
  const card = $(serviceCardTemplate());
  $('.services-list').append(card);
  initDoctorServiceCard(card);
});

$(document).on('click', '.add-service-visit', function () {
  const card = $(visitServiceCardTemplate());
  $('.visit-services-list').append(card);
  initDoctorVisitCard(card);
});

$(document).on('click', '.remove-service, .remove-service-visit', function () {
  $(this).closest('.service-card').remove();
});

/* =========================================================
   CATEGORY → SERVICE FILTER
========================================================= */
$(document).on('mousedown', '.dropdown-item', function (e) {
  e.preventDefault();
  e.stopPropagation();

  const item = $(this);
  const dropdown = item.closest('.custom-dropdown');
  const card = item.closest('.service-card');

  const selectedId = item.data('id');
  const selectedText = item.text().trim();

  // set selected value
  dropdown.find('.selected-text')
    .text(selectedText)
    .attr('data-id', selectedId);

  dropdown.find('.dropdown-menu').addClass('hidden');

  // 🔥 IF CATEGORY DROPDOWN → FILTER SERVICES
  if (dropdown.is(card.find('.custom-dropdown').eq(0))) {

    const filteredServices = window.DOCTOR_DATA.services.filter(
      s => String(s.category_id) === String(selectedId)
    );

    const serviceDropdown = card.find('.custom-dropdown').eq(1);

    populateDropdown(serviceDropdown, filteredServices);

    serviceDropdown.find('.selected-text')
      .text('Select Service')
      .removeAttr('data-id');
  }
});


/* =========================================================
   FILE UPLOAD UI
========================================================= */
$(document).on('click', '.upload-btn, .upload-box', function (e) {
  e.stopPropagation();
  $(this).closest('.file-upload-wrapper')
         .find('.file-input')
         .trigger('click');
});

$(document).on('change', '.file-input', function () {
  const wrapper = $(this).closest('.file-upload-wrapper');
  const file = this.files[0];
  if (!file) return;

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

  wrapper.find('.file-input').val('');
  wrapper.find('.file-name').text('Upload CSV File');
  $(this).addClass('hidden');

  wrapper.find('.submit-btn')
    .prop('disabled', true)
    .removeClass('bg-dodger-blue text-white')
    .addClass('bg-light-gray cursor-not-allowed');
});

/* =========================================================
   CSV UPLOAD (SERVICES + VISIT CHARGES)
   ========================================================= */
function doctorNormaliseHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// `fallbackHeaders` defines the column order assumed when the CSV has no
// header row, so service and visit uploads can differ.
function doctorParseCsv(csvText, fallbackHeaders) {
  const rows = [];
  let headers = null;

  String(csvText || '')
    .split(/\r?\n/)
    .forEach((line) => {
      if (!line.trim()) return;

      const values = parseCsvLine(line).map((value) => value.trim());

      if (!headers) {
        const candidate = values.map(doctorNormaliseHeader);

        // A header row is detected when it names known columns and holds no
        // numeric price values.
        const looksLikeHeader = candidate.some((key) =>
          ['category', 'service', 'service_name', 'price', 'amount',
            'visit_type', 'visit', 'charge'].includes(key)
        ) && !values.some((value) => /^\d+(\.\d+)?$/.test(value));

        headers = looksLikeHeader ? candidate : fallbackHeaders.slice();
        if (looksLikeHeader) return;
      }

      rows.push(headers.reduce((row, header, index) => {
        row[header] = values[index] || '';
        return row;
      }, {}));
    });

  return rows;
}

// Maps a CSV row onto the matching category/service pair from DOCTOR_DATA.
function parseDoctorServiceCsv(csvText) {
  return doctorParseCsv(csvText, ['category', 'service', 'price']).map((row) => {
    const categoryName = row.category || row.category_name || '';
    const serviceName = row.service || row.service_name || row.service_description || '';
    const price = String(row.price || row.amount || row.charge || '').replace(/[^0-9.]/g, '');

    const category = (window.DOCTOR_DATA.categories || []).find(
      (item) => item.name.trim().toLowerCase() === categoryName.trim().toLowerCase()
    );

    const service = (window.DOCTOR_DATA.services || []).find((item) => {
      if (item.name.trim().toLowerCase() !== serviceName.trim().toLowerCase()) return false;
      return category ? String(item.category_id) === String(category.id) : true;
    });

    if (!category || !service || !price) return null;

    return { category, service, price };
  }).filter(Boolean);
}

function parseDoctorVisitCsv(csvText) {
  return doctorParseCsv(csvText, ['visit_type', 'price']).map((row) => {
    const visitName = row.visit_type || row.visit || row.type || row.name || '';
    const price = String(row.price || row.amount || row.charge || '').replace(/[^0-9.]/g, '');

    const visitType = (window.DOCTOR_DATA.visit_types || []).find(
      (item) => item.name.trim().toLowerCase() === visitName.trim().toLowerCase()
    );

    if (!visitType || !price) return null;

    return { visitType, price };
  }).filter(Boolean);
}

function populateDoctorServiceCards(rows) {
  const $list = $('.services-section #step-1 .services-list');
  if (!$list.length) return;

  $list.empty();

  rows.forEach((row) => {
    const $card = $(serviceCardTemplate());
    initDoctorServiceCard($card);

    const $category = $card.find('.custom-dropdown').eq(0);
    $category.find('.selected-text')
      .text(row.category.name)
      .attr('data-id', row.category.id);

    const $service = $card.find('.custom-dropdown').eq(1);
    populateDropdown(
      $service,
      (window.DOCTOR_DATA.services || []).filter(
        (item) => String(item.category_id) === String(row.category.id)
      )
    );
    $service.find('.selected-text')
      .text(row.service.name)
      .attr('data-id', row.service.id);

    $card.find('.doctor-price-input').val(`₹ ${row.price}`);

    $list.append($card);
  });
}

function populateDoctorVisitCards(rows) {
  const $list = $('.services-section #step-2 .visit-services-list');
  if (!$list.length) return;

  $list.empty();

  rows.forEach((row) => {
    const $card = $(visitServiceCardTemplate());
    initDoctorVisitCard($card);

    $card.find('.custom-dropdown').eq(0).find('.selected-text')
      .text(row.visitType.name)
      .attr('data-id', row.visitType.id);

    $card.find('.doctor-price-input').val(`₹ ${row.price}`);

    $list.append($card);
  });
}

$(document).on('click', '.submit-btn', function () {
  const $wrapper = $(this).closest('.file-upload-wrapper');
  const csvType = $wrapper.data('csvType');

  // Not a doctor CSV upload - let the page specific handler take over.
  if (!csvType) return;

  const file = $wrapper.find('.file-input')[0]?.files?.[0];

  if (!file) {
    toastr.error('Please select a CSV file first.');
    return;
  }

  if (!file.name.toLowerCase().endsWith('.csv')) {
    toastr.error('Please upload a CSV file.');
    $wrapper.find('.file-input').val('');
    return;
  }

  const reader = new FileReader();

  reader.onload = function (event) {
    const csvText = event.target.result || '';
    const isVisit = csvType === 'visit';

    const rows = isVisit ? parseDoctorVisitCsv(csvText) : parseDoctorServiceCsv(csvText);

    if (!rows.length) {
      toastr.error(
        isVisit
          ? 'No valid visit rows found. CSV format: Visit Type, Price'
          : 'No valid service rows found. CSV format: Category, Service, Price'
      );
      return;
    }

    if (isVisit) {
      populateDoctorVisitCards(rows);
    } else {
      populateDoctorServiceCards(rows);
    }

    toastr.success(
      `${rows.length} ${isVisit ? 'visit charge' : 'service'}${rows.length > 1 ? 's' : ''} imported successfully.`
    );
  };

  reader.onerror = function () {
    toastr.error('Unable to read the selected file.');
  };

  reader.readAsText(file);
});

/* =========================================================
   COLLECT DATA
========================================================= */
function collectDoctorServices() {
  const services = [];

  $('.services-list .service-card').each(function () {
    const card = $(this);

    const categoryId = card.find('.custom-dropdown').eq(0)
                           .find('.selected-text').data('id');
    const serviceId  = card.find('.custom-dropdown').eq(1)
                           .find('.selected-text').data('id');

    let price = card.find('input').val() || "0";
    price = price.replace(/[₹,]/g, '').trim();

    if (!categoryId || !serviceId) return;

    services.push({
      category_id: categoryId,
      service_id: serviceId,
      price: price || "0"
    });
  });

  return services;
}

function collectVisitCharges() {
  const visits = [];

  $('.visit-services-list .service-card').each(function () {
    const card = $(this);

    const visitTypeId = card.find('.selected-text').data('id');
    let price = card.find('input').val() || "0";
    price = price.replace(/[₹,]/g, '').trim();

    if (!visitTypeId) return;

    visits.push({
      visit_type_id: visitTypeId,
      price: price || "0"
    });
  });

  return visits;
}

/* =========================================================
   STEP 2 → STEP 3 (SUMMARY)
========================================================= */
$(document).on('click', '#step-2 .step-btn[data-target="3"]', function () {
  const services = collectDoctorServices();
  const visits   = collectVisitCharges();

  if (!services.length) {
    toastr.error("Please add at least one service");
    return;
  }

  renderDoctorSummary(services, visits);

  $('#step-1, #step-2').addClass('hidden');
  $('#step-3').removeClass('hidden');
});

/* =========================================================
   SUMMARY RENDER
========================================================= */
function renderDoctorSummary(services, visits) {
  const serviceBox = $('.summary-services').empty();
  const visitBox   = $('.summary-visits').empty();

  services.forEach(s => {
    serviceBox.append(`
      <div class="service-card bg-white border rounded-md p-4">
        <h3 class="font-semibold">${s.service_id}</h3>
        <span class="font-bold text-blue-600">₹${s.price}</span>
      </div>
    `);
  });

  visits.forEach(v => {
    visitBox.append(`
      <div class="service-card bg-white border rounded-md p-4">
        <h3 class="font-semibold">${v.visit_type_id}</h3>
        <span class="font-bold text-blue-600">₹${v.price}</span>
      </div>
    `);
  });
}

/* =========================================================
   SAVE (SINGLE SUBMIT)
========================================================= */
$(document).on('click', '#save-doctor-services', function () {
  const services = collectDoctorServices();
  const visits   = collectVisitCharges();

  if (!services.length) {
    toastr.error("Please add at least one service");
    return;
  }

  $.ajax({
    url: "/services/services/add-doctor-services/",
    method: "POST",
    headers: { "X-CSRFToken": getCookie("csrftoken") },
    contentType: "application/json",
    data: JSON.stringify({ services, visits }),
    success(res) {
      if (res.success) {
        toastr.success("Doctor services saved successfully");
        window.location.href = "/services/";
      } else {
        toastr.error("Failed to save services");
      }
    },
    error() {
      toastr.error("Something went wrong");
    }
  });
});

$(document).ready(function () {
  fetchDoctorSavedServices();
});

function fetchDoctorSavedServices() {
  $.getJSON("/services/doctor-services/", function (res) {
    if (!res.success) return;

    const hasData =
      (res.services && res.services.length) ||
      (res.visits && res.visits.length);

    if (!hasData) return;

    $('.home-section').addClass('hidden');
    $('.services-section').addClass('hidden');

    $('.premium-section').removeClass('hidden');
    $('.services-without-subscription').addClass('hidden');

    renderDoctorServiceCards(res.services || []);
    renderDoctorVisitCards(res.visits || []);
    // default services tab open
    const activeBtn = $('.tabs-inner .tab-btn[data-type="services"]');

    $('.tabs-inner .tab-btn').removeClass('active');
    activeBtn.addClass('active');

    $('.tabs-inner-content').addClass('hidden');
    $('.tabs-inner-content[data-type="services"]').removeClass('hidden');

    // move indicator
    const indicator = $('.tabs-inner .tab-indicator');

    indicator.css({
      width: activeBtn.outerWidth(),
      height: activeBtn.outerHeight(),
      left: activeBtn.position().left,
      top: activeBtn.position().top,
      borderRadius: '6px',
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
      border: '1px solid #BFDBFE'
    });
  });
}

function doctorMenuHtml() {
  return `
    <div class="absolute right-4 top-3 z-[9999]">
      <span class="material-symbols-outlined cursor-pointer more-btn">more_vert</span>

      <div class="more-dropdown hidden absolute right-0 top-7 bg-white rounded-[12px] w-[150px] z-[99999] px-3 py-2 shadow-lg">
        <button type="button"
          class="doctor-edit-btn w-full text-left py-2.5 text-[#1F2937] text-sm font-normal flex items-center gap-3 border-b border-[#E5E7EB] cursor-pointer">
          <img src="/static/images/edit-icon.svg" alt="edit" class="w-5 h-5">
          Edit
        </button>

        <button type="button"
          class="delete-btn w-full text-left py-2.5 text-[#1F2937] text-sm font-normal flex items-center gap-3 cursor-pointer">
          <img src="/static/images/delete-icon.svg" alt="delete" class="w-5 h-5">
          Delete
        </button>
      </div>
    </div>
  `;
}

function doctorCardHtml(title, price, id, type) {
  return `
    <div class="service-card bg-white border border-frost-white rounded-md shadow-12 h-[85px] w-full flex flex-col items-start px-4 py-3 relative overflow-visible gap-2"
         data-id="${id}"
         data-type="${type}">
      <div class="flex items-start justify-between w-full">
        <h3 class="text-sm sm:text-base font-semibold text-black">${title}</h3>
        ${doctorMenuHtml()}
      </div>
      <div class="flex items-center w-full">
        <span class="text-base sm:text-lg text-dodger-blue font-bold">₹${price}</span>
      </div>
    </div>
  `;
}

function renderDoctorServiceCards(services) {
  const premiumGrid = $('.premium-section [data-type="services"] .grid');
  const nonPremiumGrid = $('.services-without-subscription [data-type="services"] .grid');

  premiumGrid.empty();
  nonPremiumGrid.empty();

  services.forEach(s => {
    const card = doctorCardHtml(
  s.service,
  s.price,
  s.id,
  "service"
);
    premiumGrid.append(card);
    nonPremiumGrid.append(card);
  });
}

function renderDoctorVisitCards(visits) {
  const premiumGrid = $('.premium-section [data-type="visit-charges"] .grid');
  const nonPremiumGrid = $('.services-without-subscription [data-type="visit-charges"] .grid');

  premiumGrid.empty();
  nonPremiumGrid.empty();

  visits.forEach(v => {
    const card = doctorCardHtml(
  v.visit_type,
  v.price,
  v.id,
  "visit"
);
    premiumGrid.append(card);
    nonPremiumGrid.append(card);
  });
}

$(document).on('click', '.home-add-service', function () {
  $('.home-section').addClass('hidden');
  $('.premium-section').addClass('hidden');
  $('.services-without-subscription').addClass('hidden');

  $('.services-section').removeClass('hidden');

  $('#step-1').removeClass('hidden');
  $('#step-2, #step-3').addClass('hidden');
});

$(document).on("click", ".more-btn", function (e) {
  e.preventDefault();
  e.stopPropagation();

  const dropdown = $(this).siblings(".more-dropdown");

  $(".more-dropdown").not(dropdown).addClass("hidden");
  dropdown.toggleClass("hidden");
});

$(document).on("click", function (e) {
  if (!$(e.target).closest(".more-btn, .more-dropdown").length) {
    $(".more-dropdown").addClass("hidden");
  }
});

$(document).on("click", ".doctor-edit-btn", function (e) {
  e.preventDefault();
  e.stopPropagation();

  $(".more-dropdown").addClass("hidden");

  const card = $(this).closest(".service-card");
  const id = card.data("id");
  const type = card.data("type");

  console.log("EDIT DOCTOR CARD:", id, type);

  $(".premium-section").addClass("hidden");
  $(".services-without-subscription").addClass("hidden");
  $(".home-section").addClass("hidden");

  $(".services-section").removeClass("hidden");

  $("#step-1").removeClass("hidden");
  $("#step-2, #step-3").addClass("hidden");

  $(".services-section")
    .attr("data-edit-id", id)
    .attr("data-edit-type", type);
});

$(document).on('click', '.delete-btn', function (e) {
  e.preventDefault();
  e.stopPropagation();

  const card = $(this).closest('.service-card');
  const serviceId = card.data('id');
  const serviceType = card.data('type');

  if (!serviceId || !serviceType) {
    toastr.error("Service ID not found");
    return;
  }

  if (!confirm("Are you sure you want to delete this?")) return;

  $.ajax({
    url: `/services/doctor-service/${serviceType}/${serviceId}/delete/`,
    method: "POST",
    headers: { "X-CSRFToken": getCookie("csrftoken") },
    success(res) {
      if (res.success) {
        toastr.success("Deleted successfully");
        fetchDoctorSavedServices();
      } else {
        toastr.error("Delete failed");
      }
    },
    error() {
      toastr.error("Something went wrong");
    }
  });
});
