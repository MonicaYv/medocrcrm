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
    .addClass('bg-primary-blue text-white');
});

$(document).on('click', '.remove-file', function (e) {
  e.stopPropagation();
  const wrapper = $(this).closest('.file-upload-wrapper');

  wrapper.find('.file-input').val('');
  wrapper.find('.file-name').text('Upload CSV File');
  $(this).addClass('hidden');

  wrapper.find('.submit-btn')
    .prop('disabled', true)
    .removeClass('bg-primary-blue text-white')
    .addClass('bg-light-gray cursor-not-allowed');
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