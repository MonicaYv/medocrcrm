/* =========================================================
   LAB SERVICES – FULLY WORKING JS (NO UI CHANGES)
   ========================================================= */

/* ---------------- CSRF ---------------- */
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
function populateDropdown(dropdown, items) {
  const menu = dropdown.find('.dropdown-menu');
  menu.html('');

  items.forEach(i => {
    menu.append(`
      <li class="dropdown-item px-3 py-2 hover:bg-premium-light-blue cursor-pointer"
          data-id="${i.id}">
        ${i.name}
      </li>
    `);
  });
}
$(document).ready(function () {

  // STEP 1 - Test & Packages
  $('.services-list > .service-card').each(function () {
    const card = $(this);
    const dropdowns = card.find('.custom-dropdown');

    populateDropdown(dropdowns.eq(0), window.LAB_DATA.categories);
    populateDropdown(dropdowns.eq(1), window.LAB_DATA.packages);
    populateDropdown(dropdowns.eq(2), window.LAB_DATA.days);
  });

  // STEP 2 - Collection Mode
  $('.collection-services-list > .service-card').each(function () {
    const card = $(this);
    const dropdowns = card.find('.custom-dropdown');

    populateDropdown(dropdowns.eq(0), window.LAB_DATA.modes);
    populateDropdown(dropdowns.eq(1), window.LAB_DATA.regions);
  });

});


$(document).on('click', '.services-list .service-card .custom-dropdown:first-child .dropdown-item', function () {
  const categoryId = $(this).data('id');
  const card = $(this).closest('.service-card');

  const packageDropdown = card.find('.custom-dropdown').eq(1);

  const filtered = window.LAB_DATA.packages.filter(
    p => p.category_id == categoryId
  );

  populateDropdown(packageDropdown, filtered);
});

$(document).on('click', '.dropdown-item', function () {
  const text = $(this).text().trim();
  const id = $(this).data('id');

  const dropdown = $(this).closest('.custom-dropdown');
  dropdown.find('.selected-text')
    .text(text)
    .attr('data-id', id);

  dropdown.find('.dropdown-menu').addClass('hidden');
});

/* =========================================================
   SERVICE CARD HANDLER (STEP 1)
   ========================================================= */

const serviceCardTemplate = () => `
<div class="rounded-lg px-4 py-6 relative bg-[#F9FAFB] service-card animate-fade">
  <button class="remove-service absolute top-3 right-3 text-ebony hover:text-red-500">✕</button>

  <!-- Category -->
  <div class="mb-4 custom-dropdown">
    <label class="text-base sm:text-lg text-jet-black font-semibold">Select Category</label>
    <div class="dropdown-trigger mt-2">
      <button type="button"
        class="w-full border border-slate-gray rounded-md px-3 py-3 text-left flex justify-between items-center">
        <span class="selected-text text-sm sm:text-base font-normal text-dark-gray">Select Category</span>
        <span class="material-symbols-outlined">keyboard_arrow_down</span>
      </button>
      <ul class="dropdown-menu hidden absolute z-20 mt-1 w-1/2 bg-white border border-dodger-blue rounded shadow
                 text-sm sm:text-base text-dark-gray font-normal h-40 overflow-y-auto scroll"></ul>
    </div>
  </div>

  <!-- Package -->
  <div class="mb-4 custom-dropdown">
    <label class="text-base sm:text-lg text-jet-black font-semibold">Select Test / Packages</label>
    <div class="dropdown-trigger mt-2">
      <button type="button"
        class="w-full border border-slate-gray rounded-md px-3 py-3 text-left flex justify-between items-center">
        <span class="selected-text text-sm sm:text-base font-normal text-dark-gray">Select Test / Packages</span>
        <span class="material-symbols-outlined">keyboard_arrow_down</span>
      </button>
      <ul class="dropdown-menu hidden absolute z-20 mt-1 w-1/2 bg-white border border-dodger-blue rounded shadow
                 text-sm sm:text-base text-dark-gray font-normal h-40 overflow-y-auto scroll"></ul>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <!-- Days -->
    <div class="custom-dropdown">
      <label class="text-base sm:text-lg text-jet-black font-semibold">Days</label>
      <div class="dropdown-trigger mt-2">
        <button type="button"
          class="w-full border border-slate-gray rounded-md px-3 py-3 text-left flex justify-between items-center">
          <span class="selected-text text-sm sm:text-base font-normal text-dark-gray">Select Days</span>
          <span class="material-symbols-outlined">keyboard_arrow_down</span>
        </button>
        <ul class="dropdown-menu hidden absolute z-20 mt-1 w-1/2 bg-white border border-dodger-blue rounded shadow
                   text-sm sm:text-base text-dark-gray font-normal h-40 overflow-y-auto scroll">
        </ul>
      </div>
    </div>

    <!-- Price -->
    <div>
      <label class="text-base sm:text-lg text-jet-black font-semibold">Price</label>
      <input type="text"
        class="price-input w-full border border-slate-gray rounded-md px-3 py-3 mt-2 focus:outline-none"
        value="₹ 0.00">
    </div>
  </div>
</div>
`;


/* ---------- Add / Remove cards ---------- */
$(document).on('click', '.add-service', function () {
  const stepContent = $(this).closest('.step-content');
  const list = stepContent.find('.services-list');

  const html = serviceCardTemplate();
  list.append(html);

  const newCard = list.find('.service-card').last();
  const dropdowns = newCard.find('.custom-dropdown');

  populateDropdown(dropdowns.eq(0), window.LAB_DATA.categories);
  populateDropdown(dropdowns.eq(1), window.LAB_DATA.packages);
  populateDropdown(dropdowns.eq(2), window.LAB_DATA.days);
});


$(document).on('click', '.remove-service', function () {
  $(this).closest('.service-card').remove();
});

/* =========================================================
   COLLECTION MODE CARDS (STEP 2) – UNCHANGED LOGIC
   ========================================================= */

const collectionServiceCardTemplate = () => `
<div class="service-card rounded-lg px-4 py-3 relative bg-[#F9FAFB]">
  <button class="remove-service-collection absolute top-3 right-3 text-ebony hover:text-red-500">✕</button>

  <!-- Mode -->
  <div class="mb-4 custom-dropdown">
    <label class="text-base sm:text-lg text-jet-black font-semibold">Select Mode Type</label>
    <div class="dropdown-trigger mt-2">
      <button type="button"
        class="w-full border border-slate-gray rounded-md px-3 py-3 text-left flex justify-between items-center">
        <span class="selected-text text-sm sm:text-base font-normal text-dark-gray">Select Mode</span>
        <span class="material-symbols-outlined">keyboard_arrow_down</span>
      </button>

      <ul class="dropdown-menu hidden absolute z-20 mt-1 w-1/2 bg-white border border-dodger-blue rounded shadow
                 text-sm sm:text-base text-dark-gray font-normal h-40 overflow-y-auto scroll">
      </ul>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <!-- Region -->
    <div class="custom-dropdown">
      <label class="text-base sm:text-lg text-jet-black font-semibold">Region (optional)</label>
      <div class="dropdown-trigger mt-2">
        <button type="button"
          class="w-full border border-slate-gray rounded-md px-3 py-3 text-left flex justify-between items-center">
          <span class="selected-text text-sm sm:text-base font-normal text-dark-gray">Select Region</span>
          <span class="material-symbols-outlined">keyboard_arrow_down</span>
        </button>

        <ul class="dropdown-menu hidden absolute z-20 mt-1 w-1/2 bg-white border border-dodger-blue rounded shadow
                   text-sm sm:text-base text-dark-gray font-normal h-40 overflow-y-auto scroll">
        </ul>
      </div>
    </div>

    <!-- Price -->
    <div>
      <label class="text-base sm:text-lg text-jet-black font-semibold">Price</label>
      <input type="text"
        class="price-input w-full border border-slate-gray rounded-md px-3 py-3 mt-2 focus:outline-none"
        value="₹ 0.00">
    </div>
  </div>
</div>
`;
function populateCollectionDropdowns(card) {
  // MODE TYPES
  const modeMenu = card.find('.custom-dropdown').first().find('.dropdown-menu');
  modeMenu.empty();

  window.LAB_DATA.modes.forEach(m => {
    modeMenu.append(`
      <li class="dropdown-item px-3 py-2 hover:bg-premium-light-blue cursor-pointer"
          data-id="${m.id}">
        ${m.name}
      </li>
    `);
  });

  // REGIONS
  const regionMenu = card.find('.custom-dropdown').eq(1).find('.dropdown-menu');
  regionMenu.empty();

  window.LAB_DATA.regions.forEach(r => {
    regionMenu.append(`
      <li class="dropdown-item px-3 py-2 hover:bg-premium-light-blue cursor-pointer"
          data-id="${r.id}">
        ${r.name}
      </li>
    `);
  });
}


$(document).on('click', '.add-service-collection', function () {
  const stepContent = $(this).closest('.step-content');
  const list = stepContent.find('.collection-services-list');

  const html = collectionServiceCardTemplate();
  list.append(html);

  const newCard = list.find('.service-card').last();
  populateCollectionDropdowns(newCard);
});


$(document).on('click', '.remove-service-collection', function () {
  $(this).closest('.service-card').remove();
});

/* =========================================================
   FILE UPLOAD (UNCHANGED)
   ========================================================= */

$(document).on('click', '.upload-btn, .upload-box', function (e) {
  e.stopPropagation();
  $(this).closest('.file-upload-wrapper').find('.file-input').trigger('click');
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
   COLLECT SERVICES (STEP 1)
   ========================================================= */

function collectLabServices() {
  const services = [];

  $('.services-list > div').each(function () {
    const card = $(this);

    const category = card
      .find('.custom-dropdown').eq(0)
      .find('.selected-text').text().trim();

    const pkg = card
      .find('.custom-dropdown').eq(1)
      .find('.selected-text').text().trim();

    const daysId = card
    .find('.custom-dropdown').eq(2)
    .find('.selected-text').data('id');

    let price = card.find('input[type="text"]').last().val();
    price = price.replace(/[₹,]/g, '').trim();

    services.push({
    category_id: card.find('.custom-dropdown').eq(0).find('.selected-text').data('id'),
    package_id:  card.find('.custom-dropdown').eq(1).find('.selected-text').data('id'),
    days: daysId,
    price: price || "0"
    });

  });

  return services;
}
function collectCollections() {
  const collections = [];

  $('.collection-services-list > div').each(function () {
    const card = $(this);

    collections.push({
      mode_id: card.find('.custom-dropdown').eq(0)
                  .find('.selected-text').data('id'),

      region_id: card.find('.custom-dropdown').eq(1)
                    .find('.selected-text').data('id'),

      price: card.find('input[type="text"]').last()
                 .val().replace(/[₹,]/g, '').trim() || "0"
    });
  });

  return collections;
}
function getTextById(id) {
  return $(`.selected-text[data-id="${id}"]`).first().text() || '';
}

/* ===== RENDER SUMMARY FROM FORM (STEP 3 PREVIEW) ===== */
function renderSummaryFromForm(items) {
  const container = $('.summary-test-packages');
  container.html('');

  items.forEach(i => {
    const category = getTextById(i.category_id);
    const pkg      = getTextById(i.package_id);
    const days     = getTextById(i.days);

    container.append(`
      <div class="service-card bg-white border border-frost-white rounded-md shadow-12 h-[120px] w-full
          flex flex-col items-start px-4 py-3 relative">
        <div class="flex items-start justify-between w-full border-b border-[#E8E8E8] pb-3">
          <div class="flex flex-col gap-2">
            <h3 class="text-sm sm:text-base font-semibold text-black">${category}</h3>
            <p class="text-xs sm:text-sm font-normal text-black">${pkg}</p>
          </div>
        </div>
        <div class="flex items-center justify-between w-full py-2">
          <p class="text-xs sm:text-sm font-normal text-black">${days}</p>
          <span class="text-base sm:text-lg text-dodger-blue font-bold">₹${i.price}</span>
        </div>
      </div>
    `);
  });
}

function renderCollectionSummaryFromForm(items) {
  const container = $('.summary-collection-mode');
  container.html('');

  items.forEach(i => {
    const mode   = getTextById(i.mode_id);
    const region = i.region_id ? getTextById(i.region_id) : '-';

    container.append(`
      <div class="service-card bg-white border border-frost-white rounded-md shadow-12 h-[81px] w-full
          flex flex-col items-start justify-center gap-2 px-4 py-2 relative">
        <div class="flex items-center justify-between w-full">
          <h3 class="text-sm sm:text-base font-semibold text-black">${mode}</h3>
        </div>
        <div class="flex items-center justify-between w-full">
          <p class="text-sm sm:text-base font-semibold text-black">${region}</p>
          <span class="text-base sm:text-lg font-bold text-dodger-blue">₹${i.price}</span>
        </div>
      </div>
    `);
  });
}

$(document).on('click', '#step-2 .step-btn[data-target="3"]', function () {

  const services    = collectLabServices();
  const collections = collectCollections();

  if (!services.length) {
    toastr.error("Please add at least one Test/Package");
    return;
  }

  // ✅ PREVIEW SUMMARY
  renderSummaryFromForm(services);
  renderCollectionSummaryFromForm(collections);

  // move to step 3
  $('#step-1, #step-2').addClass('hidden');
  $('#step-3').removeClass('hidden');
});

/* =========================================================
   SUBMIT SERVICES (AJAX)
   ========================================================= */

$(document).on('click', '#step-3 .step-btn[data-target="3"]', function () {

  const services    = collectLabServices();
  const collections = collectCollections();

  if (!services.length) {
    alert("Please add at least one Test/Package");
    return;
  }

  $.ajax({
    url: "add-services",
    method: "POST",
    headers: {
      "X-CSRFToken": getCookie("csrftoken")
    },
    contentType: "application/json",
    data: JSON.stringify({
      services: services,
      collections: collections
    }),
    success: function (res) {
    if (res.success) {
        toastr.success("Services added successfully");

        window.location.href = "/services/";
    } else {
        toastr.error("Failed to save data");
    }
    },
    error: function () {
    toastr.error("Something went wrong while saving");
    }
  });
});


/* =========================================================
   RENDER SUMMARY (STEP 3)
   ========================================================= */

function renderSummary(items) {
  const container = $('.summary-test-packages');
  container.html('');

  items.forEach(i => {

    const category = i.category_name || i.category || '';
    const pkg      = i.package_name  || i.package  || '';
    const days     = i.days_name     || i.days     || '';

    container.append(`
      <div class="service-card bg-white border border-frost-white rounded-md shadow-12 h-[120px] w-full
                  flex flex-col items-start px-4 py-3 relative">
        <div class="flex items-start justify-between w-full border-b border-[#E8E8E8] pb-3">
          <div class="flex flex-col gap-2">
            <h3 class="text-sm sm:text-base font-semibold text-black">${category}</h3>
            <p class="text-xs sm:text-sm font-normal text-black">${pkg}</p>
          </div>
        </div>
        <div class="flex items-center justify-between w-full py-2">
          <p class="text-xs sm:text-sm font-normal text-black">${days}</p>
          <span class="text-base sm:text-lg text-dodger-blue font-bold">₹${i.price}</span>
        </div>
      </div>
    `);
  });
}

function renderCollectionSummary(items) {
  const container = $('.summary-collection-mode');
  container.html('');

  items.forEach(i => {

    const mode   = i.mode_name   || i.mode   || '';
    const region = i.region_name || i.region || '-';

    container.append(`
      <div class="service-card bg-white border border-frost-white rounded-md shadow-12 h-[81px] w-full
                  flex flex-col items-start justify-center gap-2 px-4 py-2 relative">
        <div class="flex items-center justify-between w-full">
          <h3 class="text-sm sm:text-base font-semibold text-black">${mode}</h3>
        </div>
        <div class="flex items-center justify-between w-full">
          <p class="text-sm sm:text-base font-semibold text-black">${region}</p>
          <span class="text-base sm:text-lg font-bold text-dodger-blue">₹${i.price}</span>
        </div>
      </div>
    `);
  });
}

$(document).ready(function () {
  fetchLabServices();
});

function fetchLabServices() {
  $.getJSON("/services/get-services/", function (res) {

    if (!res.success) return;
    controlServiceSections(res);
    // toggle sections
    if (res.has_premium) {
      $('.premium-section').removeClass('hidden');
      $('.services-without-subscription').addClass('hidden');
      renderPremiumServices(res);
    } else {
      $('.services-without-subscription').removeClass('hidden');
      $('.premium-section').addClass('hidden');
      renderNonPremiumServices(res);
    }
  });
}

function renderPremiumServices(res) {

  /* ---------------- Test & Packages ---------------- */
  const tpContainer = $('.premium-section [data-type="test-packages"] .grid');
  tpContainer.html('');

  res.test_packages.forEach(i => {
    tpContainer.append(`
      <div class="service-card bg-white border border-frost-white rounded-md shadow-12
        h-[120px] w-full flex flex-col items-start px-4 py-3 relative"
        data-id="${i.id || ''}"
        data-category-id="${i.category_id || ''}"
        data-package-id="${i.package_id || ''}"
        data-category-name="${i.category || ''}"
        data-package-name="${i.package || ''}"
        data-price="${i.price || ''}">

        <div class="flex items-start justify-between w-full border-b border-[#E8E8E8] pb-3">

          <div class="flex flex-col gap-2">
            <h3 class="text-sm sm:text-base font-semibold text-black">${i.category}</h3>
            <p class="text-xs sm:text-sm font-normal text-black">${i.package}</p>
          </div>

          <!-- 3 DOT MENU -->
          <div class="relative">
            <span class="material-symbols-outlined cursor-pointer more-btn">more_vert</span>

            <div class="more-dropdown hidden absolute right-0 top-6 bg-white rounded-2xl
                        w-40 z-20 px-4 shadow-12">
              <button
                class="open-popup w-full text-left py-2.5 text-ebony text-sm font-semibold
                      flex items-center gap-3 border-b border-[#E8E8E8] cursor-pointer"
                data-target="add-service">
                <img src="/static/images/edit-icon.svg" alt="edit" class="w-5 h-5">
                Edit
              </button>

              <button
                class="delete-btn w-full text-left py-2.5 text-sm text-ebony font-semibold
                      flex items-center gap-3 cursor-pointer">
                <img src="/static/images/delete-icon.svg" alt="delete" class="w-5 h-5">
                Delete
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between w-full py-2">
          <p class="text-xs sm:text-sm font-normal text-black">${i.days}</p>
          <span class="text-base sm:text-lg text-dodger-blue font-bold">₹${i.price}</span>
        </div>
      </div>
    `);
  });
  // tpContainer.append(`
  //   <div class="flex items-center justify-end col-span-full">
  //     <button
  //       class="add-service-btn w-14 h-14 bg-dodger-blue rounded-full
  //             flex items-center justify-center shadow-lg">
  //       <span class="material-symbols-outlined text-white text-3xl">add</span>
  //     </button>
  //   </div>
  // `);

  /* ---------------- Collection Modes ---------------- */
  const cmContainer = $('.premium-section [data-type="collection-mode"] .grid');
  cmContainer.html('');

  res.collection_modes.forEach(i => {
    cmContainer.append(`
      <div class="service-card bg-white border border-frost-white rounded-md shadow-12
        h-[120px] w-full flex flex-col items-start px-4 py-3 relative"
        data-id="${i.id || ''}"
        data-mode-id="${i.mode_id || ''}"
        data-region-id="${i.region_id || ''}"
        data-mode-name="${i.mode || ''}"
        data-region-name="${i.region || ''}"
        data-price="${i.price || ''}">

        <div class="flex items-start justify-between w-full border-b border-[#E8E8E8] pb-3">

          <div class="flex flex-col gap-2">
            <h3 class="text-sm sm:text-base font-semibold text-black">${i.mode}</h3>
            <p class="text-xs sm:text-sm font-normal text-black">${i.region || '-'}</p>
          </div>

          <!-- 3 DOT MENU -->
          <div class="relative">
            <span class="material-symbols-outlined cursor-pointer more-btn">more_vert</span>

            <div class="more-dropdown hidden absolute right-0 top-6 bg-white rounded-2xl
                        w-40 z-20 px-4 shadow-12">
              <button
                class="open-popup w-full text-left py-2.5 text-ebony text-sm font-semibold
                      flex items-center gap-3 border-b border-[#E8E8E8] cursor-pointer"
                data-target="add-service">
                <img src="/static/images/edit-icon.svg" alt="edit" class="w-5 h-5">
                Edit
              </button>

              <button
                class="delete-btn w-full text-left py-2.5 text-sm text-ebony font-semibold
                      flex items-center gap-3 cursor-pointer">
                <img src="/static/images/delete-icon.svg" alt="delete" class="w-5 h-5">
                Delete
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center w-full py-2">
          <span class="text-base sm:text-lg text-dodger-blue font-bold">₹${i.price}</span>
        </div>
      </div>
    `);

  });
  // cmContainer.append(`
  //   <div class="flex items-center justify-end col-span-full">
  //     <button
  //       class="add-service-btn w-14 h-14 bg-dodger-blue rounded-full
  //             flex items-center justify-center shadow-lg">
  //       <span class="material-symbols-outlined text-white text-3xl">add</span>
  //     </button>
  //   </div>
  // `);
}


function renderNonPremiumServices(res) {

  /* ---------------- Test & Packages ---------------- */
  const tpContainer = $('.services-without-subscription [data-type="test-packages"] .grid');
  tpContainer.html('');

  res.test_packages.forEach(i => {
    tpContainer.append(`
      <div class="service-card bg-white border border-frost-white rounded-md shadow-12
        h-[120px] w-full flex flex-col items-start px-4 py-3 relative"
        data-id="${i.id || ''}"
        data-category-id="${i.category_id || ''}"
        data-package-id="${i.package_id || ''}"
        data-category-name="${i.category || ''}"
        data-package-name="${i.package || ''}"
        data-price="${i.price || ''}">

        <div class="flex items-start justify-between w-full border-b border-[#E8E8E8] pb-3">

          <div class="flex flex-col gap-2">
            <h3 class="text-sm sm:text-base font-semibold text-black">${i.category}</h3>
            <p class="text-xs sm:text-sm font-normal text-black">${i.package}</p>
          </div>

          <!-- 3 DOT MENU -->
          <div class="relative">
            <span class="material-symbols-outlined cursor-pointer more-btn">more_vert</span>

            <div class="more-dropdown hidden absolute right-0 top-6 bg-white rounded-2xl
                        w-40 z-20 px-4 shadow-12">
              <button
                class="open-popup w-full text-left py-2.5 text-ebony text-sm font-semibold
                      flex items-center gap-3 border-b border-[#E8E8E8] cursor-pointer"
                data-target="add-service">
                <img src="/static/images/edit-icon.svg" alt="edit" class="w-5 h-5">
                Edit
              </button>

              <button
                class="delete-btn w-full text-left py-2.5 text-sm text-ebony font-semibold
                      flex items-center gap-3 cursor-pointer">
                <img src="/static/images/delete-icon.svg" alt="delete" class="w-5 h-5">
                Delete
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between w-full py-2">
          <p class="text-xs sm:text-sm font-normal text-black">${i.days}</p>
          <span class="text-base sm:text-lg text-dodger-blue font-bold">₹${i.price}</span>
        </div>
      </div>
    `);
  });
  // tpContainer.append(`
  //   <div class="flex items-center justify-end col-span-full">
  //     <button
  //       class="add-service-btn w-14 h-14 bg-dodger-blue rounded-full
  //             flex items-center justify-center shadow-lg">
  //       <span class="material-symbols-outlined text-white text-3xl">add</span>
  //     </button>
  //   </div>
  // `);

  /* ---------------- Collection Modes ---------------- */
  const cmContainer = $('.services-without-subscription [data-type="collection-mode"] .grid');
  cmContainer.html('');

  res.collection_modes.forEach(i => {
    cmContainer.append(`
      <div class="service-card bg-white border border-frost-white rounded-md shadow-12
        h-[120px] w-full flex flex-col items-start px-4 py-3 relative"
        data-id="${i.id || ''}"
        data-mode-id="${i.mode_id || ''}"
        data-region-id="${i.region_id || ''}"
        data-mode-name="${i.mode || ''}"
        data-region-name="${i.region || ''}"
        data-price="${i.price || ''}">

        <div class="flex items-start justify-between w-full border-b border-[#E8E8E8] pb-3">

          <div class="flex flex-col gap-2">
            <h3 class="text-sm sm:text-base font-semibold text-black">${i.mode}</h3>
            <p class="text-xs sm:text-sm font-normal text-black">${i.region || '-'}</p>
          </div>

          <!-- 3 DOT MENU -->
          <div class="relative">
            <span class="material-symbols-outlined cursor-pointer more-btn">more_vert</span>

            <div class="more-dropdown hidden absolute right-0 top-6 bg-white rounded-2xl
                        w-40 z-20 px-4 shadow-12">
              <button
                class="open-popup w-full text-left py-2.5 text-ebony text-sm font-semibold
                      flex items-center gap-3 border-b border-[#E8E8E8] cursor-pointer"
                data-target="add-service">
                <img src="/static/images/edit-icon.svg" alt="edit" class="w-5 h-5">
                Edit
              </button>

              <button
                class="delete-btn w-full text-left py-2.5 text-sm text-ebony font-semibold
                      flex items-center gap-3 cursor-pointer">
                <img src="/static/images/delete-icon.svg" alt="delete" class="w-5 h-5">
                Delete
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center w-full py-2">
          <span class="text-base sm:text-lg text-dodger-blue font-bold">₹${i.price}</span>
        </div>
      </div>
    `);

  });
  // cmContainer.append(`
  //   <div class="flex items-center justify-end col-span-full">
  //     <button
  //       class="add-service-btn w-14 h-14 bg-dodger-blue rounded-full
  //             flex items-center justify-center shadow-lg">
  //       <span class="material-symbols-outlined text-white text-3xl">add</span>
  //     </button>
  //   </div>
  // `);
}


function controlServiceSections(res) {

  const hasServices =
    (res.test_packages && res.test_packages.length > 0) ||
    (res.collection_modes && res.collection_modes.length > 0);

  const homeSection    = $('.home-section');
  const premiumSection = $('.premium-section');
  const nonPremiumSec  = $('.services-without-subscription');
  const fab            = $('.add-service-fab');

  // hide all
  homeSection.addClass('hidden');
  premiumSection.addClass('hidden');
  nonPremiumSec.addClass('hidden');
  fab.addClass('hidden');

  if (!hasServices) {
    homeSection.removeClass('hidden');
    return;
  }

  // services exist → show FAB always
  fab.removeClass('hidden');

  if (res.has_premium) {
    premiumSection.removeClass('hidden');
  } else {
    nonPremiumSec.removeClass('hidden');
  }
}

$(document).on('click', '.open-add-service', function () {
  $('.add-service').removeClass('hidden').addClass('flex');
});

// toggle 3-dot menu
$(document).on('click', '.more-btn', function (e) {
  e.preventDefault();
  e.stopPropagation();

  const menu = $(this).next('.more-dropdown');
  const isOpen = !menu.hasClass('hidden');

  $('.more-dropdown').addClass('hidden').removeAttr('style');

  if (!isOpen) {
    menu.removeClass('hidden').css({
      display: 'block',
      zIndex: 9999
    });
  }
});

// close menu when clicking outside
$(document).on('click', function (e) {
  if (!$(e.target).closest('.more-btn, .more-dropdown').length) {
    $('.more-dropdown').addClass('hidden').removeAttr('style');
  }
});

$(document).on('click', '.open-popup', function (e) {
  e.preventDefault();
  e.stopPropagation();

  $('.more-dropdown').addClass('hidden').removeAttr('style');

  const card = $(this).closest('.service-card');
  const activeTab = $(this).closest('.tabs-inner-content').data('type') || 'test-packages';
  const popup = $('.add-service');

  popup
    .attr('data-active-tab', activeTab)
    .attr('data-edit-id', card.data('id'))
    .attr('data-edit-type', activeTab === 'collection-mode' ? 'collection-mode' : 'test-package');

  popup.find('.selected-text').removeAttr('data-id');
  popup.find('input[type="text"]').val(card.data('price') || '₹ 0.00');

  const dropdowns = popup.find('.custom-dropdown');

  if (activeTab === 'test-packages') {
    dropdowns.eq(0).show().find('label').text('Select Category');
    dropdowns.eq(1).show().find('label').text('Select Service');

    populateDropdown(dropdowns.eq(0), window.LAB_DATA.categories);
    populateDropdown(dropdowns.eq(1), window.LAB_DATA.packages);

    dropdowns.eq(0).find('.selected-text')
      .text(card.data('category-name') || 'Select Category')
      .attr('data-id', card.data('category-id'));

    dropdowns.eq(1).find('.selected-text')
      .text(card.data('package-name') || 'Select Service')
      .attr('data-id', card.data('package-id'));
  }

  if (activeTab === 'collection-mode') {
    dropdowns.eq(0).show().find('label').text('Select Collection Mode');
    dropdowns.eq(1).show().find('label').text('Select Region');

    populateDropdown(dropdowns.eq(0), window.LAB_DATA.modes);
    populateDropdown(dropdowns.eq(1), window.LAB_DATA.regions);

    dropdowns.eq(0).find('.selected-text')
      .text(card.data('mode-name') || 'Select Collection Mode')
      .attr('data-id', card.data('mode-id'));

    dropdowns.eq(1).find('.selected-text')
      .text(card.data('region-name') || 'Select Region')
      .attr('data-id', card.data('region-id'));
  }

  popup.removeClass('hidden').addClass('flex');
});

$(document).on('click', '.close-icon', function () {
  $(this).closest('.popup-overlay').addClass('hidden').removeClass('flex');
});

$(document).on('click', '.add-service-btn', function () {
  const activeTab = $(this).closest('.tabs-inner-content').data('type') || 'test-packages';
  const popup = $('.add-service');
  popup.removeAttr('data-edit-id').removeAttr('data-edit-type');
  popup.attr('data-active-tab', activeTab);

  popup.find('.selected-text').removeAttr('data-id');
  popup.find('input[type="text"]').val('₹ 0.00');

  const dropdowns = popup.find('.custom-dropdown');

  if (activeTab === 'test-packages') {
    dropdowns.eq(0).show().find('label').text('Select Category');
    dropdowns.eq(1).show().find('label').text('Select Service');

    dropdowns.eq(0).find('.selected-text').text('Select Category');
    dropdowns.eq(1).find('.selected-text').text('Select Service');

    populateDropdown(dropdowns.eq(0), window.LAB_DATA.categories);
    populateDropdown(dropdowns.eq(1), window.LAB_DATA.packages);
  }

  if (activeTab === 'collection-mode') {
    dropdowns.eq(0).show().find('label').text('Select Collection Mode');
    dropdowns.eq(1).show().find('label').text('Select Region');

    dropdowns.eq(0).find('.selected-text').text('Select Collection Mode');
    dropdowns.eq(1).find('.selected-text').text('Select Region');

    populateDropdown(dropdowns.eq(0), window.LAB_DATA.modes);
    populateDropdown(dropdowns.eq(1), window.LAB_DATA.regions);
  }

  popup.removeClass('hidden').addClass('flex');
});

$(document).on('click', '#popup-save-service', function () {
  const popup = $('.add-service');
  const activeTab = popup.attr('data-active-tab') || 'test-packages';

  const editId = popup.attr('data-edit-id');
  const editType = popup.attr('data-edit-type');

  let price = popup.find('input[type="text"]').val() || "0";
  price = price.replace(/[₹,]/g, '').trim() || "0";

  let payload = {};

  if (activeTab === 'test-packages') {
    const categoryId = popup.find('.custom-dropdown').eq(0).find('.selected-text').data('id');
    const packageId = popup.find('.custom-dropdown').eq(1).find('.selected-text').data('id');

    if (!categoryId || !packageId) {
      toastr.error("Please select category and service");
      return;
    }

    payload = {
      category_id: categoryId,
      package_id: packageId,
      price: price
    };
  }

  if (activeTab === 'collection-mode') {
    const modeId = popup.find('.custom-dropdown').eq(0).find('.selected-text').data('id');
    const regionId = popup.find('.custom-dropdown').eq(1).find('.selected-text').data('id');

    if (!modeId || !regionId) {
      toastr.error("Please select mode and region");
      return;
    }

    payload = {
      mode_id: modeId,
      region_id: regionId,
      price: price
    };
  }

  let ajaxUrl = "";
  let ajaxData = {};

  // 🔥 MAIN LOGIC
  if (editId) {
    // 👉 EDIT MODE
    ajaxUrl = `/services/update-service/${editType}/${editId}/`;
    ajaxData = payload;
  } else {
    // 👉 ADD MODE
    ajaxUrl = "/services/add-services";

    ajaxData = activeTab === 'collection-mode'
      ? { services: [], collections: [payload] }
      : { services: [{ ...payload, days: null }], collections: [] };
  }

  $.ajax({
    url: ajaxUrl,
    method: "POST",
    headers: {
      "X-CSRFToken": getCookie("csrftoken")
    },
    contentType: "application/json",
    data: JSON.stringify(ajaxData),
    success: function (res) {
      if (res.success) {
        toastr.success(editId ? "Updated successfully" : "Added successfully");

        popup
          .addClass('hidden')
          .removeClass('flex')
          .removeAttr('data-edit-id')
          .removeAttr('data-edit-type');

        fetchLabServices();
      } else {
        toastr.error("Failed");
      }
    },
    error: function () {
      toastr.error("Error saving data");
    }
  });
});

$(document).on('click', '.delete-btn', function (e) {
  e.preventDefault();
  e.stopPropagation();

  const card = $(this).closest('.service-card');
  const serviceId = card.data('id');

  const activeTab = $(this).closest('.tabs-inner-content').data('type');

  const serviceType = activeTab === 'collection-mode'
    ? 'collection-mode'
    : 'test-package';

  if (!serviceId) {
    toastr.error("Service ID not found");
    return;
  }

  if (!confirm("Are you sure you want to delete this service?")) {
    return;
  }

  $.ajax({
    url: `/services/delete-service/${serviceType}/${serviceId}/`,
    method: "POST",
    headers: {
      "X-CSRFToken": getCookie("csrftoken")
    },
    success: function (res) {
      if (res.success) {
        toastr.success("Service deleted successfully");
        fetchLabServices();
      } else {
        toastr.error("Failed to delete service");
      }
    },
    error: function () {
      toastr.error("Something went wrong while deleting");
    }
  });
});

$(document).on("click", ".more-options", function (e) {
  e.stopPropagation(); 
  $(".more-dropdown").addClass("hidden"); // sab close
  $(this).siblings(".more-dropdown").toggleClass("hidden"); // current open/close
});

// 👉 click outside = close dropdown
$(document).on("click", function (e) {
  if (!$(e.target).closest(".more-options, .more-dropdown").length) {
    $(".more-dropdown").addClass("hidden");
  }
});