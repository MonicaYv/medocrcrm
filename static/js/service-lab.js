/* =========================================================
   LAB TESTS PAGE  (matches Figma: Lab Seller – Tests & packages)
   Requires: jQuery + Tailwind CDN (loaded in services.html), toastr optional
   Type scale (matches Settings page):
   page title 32 · big numbers 32 · modal title 24 · card/section title 20
   inputs 18 · buttons/labels 17 · sub text 16 · pills/notes 15
   ========================================================= */

/* ---------------- API endpoints (change here if your URLs differ) ---------------- */
const TP_API = {
  list:   "/services/get-services/",
  create: "/services/add-services",
  update: (id) => `/services/update-service/test-package/${id}/`,
  import: "/services/import-tests/",          // NEW – CSV import (needs backend)
  template: "/services/download-template/"    // NEW – CSV template (needs backend)
};

/* ---------------- PREVIEW MODE ----------------
   true  -> shows the exact sample data from the Figma (7 rows, stats 30 / 23 / 3 / 4).
            Add / edit / pause / archive / duplicate work locally on that sample data.
   false -> loads your real data from the API (TP_API.list).
   Set this to false before going live. */
const TP_DEMO_MODE = true;

const TP_SAMPLE_STATS = { total: 30, tests: 24, packages: 6, active: 23, draft: 3, paused: 4 };

const TP_SAMPLE = [
  { id: 'demo-1', name: 'CBC', code: 'TST-1001', description: '24 parameters', category: 'Hematology', price: 450, lab_visit: true, home_collection: true, report_tat: '6 hrs', bookings: 186, status: 'active', updated: '28 Sep',
    markers: ['Haemoglobin', 'RBC count', 'WBC count', 'Platelet count'], sample_type: 'EDTA whole blood', preparation: 'No special preparation required.', availability: '40 bookings / day', parameters_count: 24, radius: '5 km', home_fee: 0 },
  { id: 'demo-2', name: 'Thyroid Profile', code: 'TST-1002', description: 'TSH, T3, T4', category: 'Thyroid', price: 900, lab_visit: true, home_collection: true, report_tat: '12 hrs', bookings: 124, status: 'active', updated: '27 Sep',
    markers: ['TSH', 'T3', 'T4'], sample_type: 'Serum', preparation: 'No special preparation required.', availability: '30 bookings / day', parameters_count: 3, radius: '5 km', home_fee: 0 },
  { id: 'demo-3', name: 'HbA1c', code: 'TST-1003', description: 'Glycated hemoglobin', category: 'Diabetes', price: 600, lab_visit: true, home_collection: true, report_tat: '8 hrs', bookings: 142, status: 'active', updated: '26 Sep',
    markers: ['HbA1c'], sample_type: 'EDTA whole blood', preparation: 'No special preparation required.', availability: '35 bookings / day', parameters_count: 1, radius: '5 km', home_fee: 0 },
  { id: 'demo-4', name: 'Lipid Profile', code: 'TST-1004', description: 'Cholesterol and triglycerides', category: 'Biochemistry', price: 800, lab_visit: true, home_collection: true, report_tat: '8 hrs', bookings: 98, status: 'active', updated: '25 Sep',
    markers: ['Total cholesterol', 'HDL', 'LDL', 'Triglycerides'], sample_type: 'Serum', prep_required: true, preparation: '10-12 hours fasting required.', availability: '30 bookings / day', parameters_count: 8, radius: '5 km', home_fee: 0 },
  { id: 'demo-5', name: 'Vitamin D', code: 'TST-1005', description: '25-hydroxy vitamin D', category: 'Vitamins', price: 1100, lab_visit: true, home_collection: true, report_tat: '24 hrs', bookings: 76, status: 'active', updated: '24 Sep',
    markers: ['25-OH Vitamin D'], sample_type: 'Serum', preparation: 'No special preparation required.', availability: '25 bookings / day', parameters_count: 1, radius: '5 km', home_fee: 0 },
  { id: 'demo-6', name: 'Fasting Blood Glucose', code: 'TST-1006', description: 'Fasting sample required', category: 'Biochemistry', price: 250, lab_visit: true, home_collection: true, report_tat: '4 hrs', bookings: 91, status: 'active', updated: '22 Sep',
    markers: ['Glucose (Fasting)'], sample_type: 'Fluoride plasma', prep_required: true, preparation: '8-10 hours fasting required.', availability: '50 bookings / day', parameters_count: 1, radius: '5 km', home_fee: 0 },
  { id: 'demo-7', name: 'Vitamin B12', code: 'TST-1007', description: 'Serum vitamin B12', category: 'Vitamins', price: 950, lab_visit: true, home_collection: false, report_tat: '24 hrs', bookings: 0, status: 'draft', updated: '21 Sep',
    markers: ['Vitamin B12'], sample_type: 'Serum', preparation: 'No special preparation required.', availability: '20 bookings / day', parameters_count: 1, radius: '5 km', home_fee: '' }
];

const TP_FALLBACK_CATEGORIES = ["Hematology", "Thyroid", "Diabetes", "Biochemistry", "Vitamins", "Preventive Health"];

/* ---------------- Tailwind class strings used by rendered markup ---------------- */
const TW = {
  ddBtn:  "tp-dd-btn flex w-full items-center justify-between gap-2 px-3 text-left bg-white border border-gray-200 rounded-[10px] cursor-pointer",
  ddMenu: "tp-dd-menu hidden absolute left-0 top-full mt-1 z-[60] min-w-full max-h-60 overflow-y-auto bg-white rounded-xl shadow-xl py-1.5",
  ddItem: "px-5 py-2.5 cursor-pointer whitespace-nowrap hover:bg-blue-50",   // font size added in ddInit (18 for form inputs, 17 for filters)
  pill:   "inline-block px-3 py-0.5 text-[15px] font-semibold border rounded-full",
  status: {
    active: "text-green-600 bg-green-50 border-green-200",
    draft:  "text-yellow-600 bg-yellow-50 border-yellow-200",
    paused: "text-gray-500 bg-gray-100 border-gray-300"
  },
  chip: "inline-flex items-center gap-1 mr-1.5 mb-1.5 px-3 py-0.5 text-[15px] text-tp-blue border border-tp-blue rounded-full",
  td: "px-3 py-4 text-[16px] text-center text-gray-800 border-b border-gray-100"
};

/* ---------------- Helpers ---------------- */
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    document.cookie.split(';').forEach(c => {
      c = c.trim();
      if (c.substring(0, name.length + 1) === (name + '=')) cookieValue = decodeURIComponent(c.substring(name.length + 1));
    });
  }
  return cookieValue;
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const rupee = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function notify(type, msg) {
  if (window.toastr && toastr[type]) toastr[type](msg); else alert(msg);
}
function postJSON(url, data) {
  return $.ajax({
    url, method: "POST",
    headers: { "X-CSRFToken": getCookie("csrftoken") },
    contentType: "application/json",
    data: JSON.stringify(data || {})
  });
}

/* ---------------- State ---------------- */
let tpTests = [];
let tpEditId = null;
let tpActionId = null;
let tpDirty = false;
let tpFilters = { q: '', category: '', collection: '', status: '' };
let tpMarkers = [];

function tpCategories() {
  const c = window.LAB_DATA && window.LAB_DATA.categories;
  if (TP_DEMO_MODE) return TP_FALLBACK_CATEGORIES.map(n => ({ id: n, name: n }));
  if (c && c.length) return c.map(x => ({ id: x.id, name: x.name }));
  const seen = {};
  tpTests.forEach(t => { if (t.category && !seen[t.category]) seen[t.category] = { id: t.category_id ?? t.category, name: t.category }; });
  const fromRows = Object.values(seen);
  return fromRows.length ? fromRows : TP_FALLBACK_CATEGORIES.map(n => ({ id: n, name: n }));
}

const tpShortDate = (d) => `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;

/* Derive Home / Lab availability from the lab's collection modes */
function tpModeFlags(modes) {
  const names = (modes || []).map(m => String(m.mode || '').toLowerCase());
  return {
    home: names.some(n => /home/.test(n)),
    lab: names.some(n => /lab|visit|centre|center/.test(n))
  };
}

function normalize(i, idx, flags) {
  flags = flags || { home: false, lab: false };
  const hasModes = flags.home || flags.lab;
  const lab = i.lab_visit !== undefined ? i.lab_visit : (hasModes ? flags.lab : undefined);
  const home = i.home_collection !== undefined ? i.home_collection : (hasModes ? flags.home : undefined);
  let collection = i.collection;
  if (!collection) {
    if (lab === undefined && home === undefined) collection = '-';
    else collection = (lab && home) ? 'Home + Lab' : home ? 'Home collection' : lab ? 'Lab visit' : '-';
  }

  let updated = i.updated || i.updated_at || '';
  if (/^\d{4}-\d{2}-\d{2}/.test(updated)) updated = tpShortDate(new Date(updated));
  if (!updated) updated = '-';

  return {
    id: i.id,
    type: String(i.type || 'test').toLowerCase(),
    name: i.name || i.package || '',
    code: i.code || i.test_code || ('TST-' + (1001 + idx)),
    sub: i.description || i.short_description || (i.days ? String(i.days) : ''),
    category: i.category || '',
    category_id: i.category_id,
    price: i.price ?? 0,
    compare_price: i.compare_price ?? '',
    collection,
    lab_visit: lab, home_collection: home,
    radius: i.radius || '5 km',
    home_fee: i.home_fee ?? '',
    tat: i.report_tat || i.tat || '-',
    bookings: i.bookings ?? 0,
    status: String(i.status || 'active').toLowerCase(),
    updated,
    markers: i.markers || [],
    prep_required: !!i.prep_required,
    sample: i.sample_type || '-',
    prep: i.preparation || '-',
    availability: i.availability || '-',
    params: i.parameters_count
  };
}

function tpRenderDate() {
  const d = new Date(), tz = { timeZone: 'Asia/Kolkata' };
  const wd = d.toLocaleDateString('en-US', { ...tz, weekday: 'long' });
  const rest = d.toLocaleDateString('en-GB', { ...tz, day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { ...tz, hour: '2-digit', minute: '2-digit', hour12: true });
  $('#tp-date').text(`${wd}, ${rest} · ${time} IST`);
}

/* =========================================================
   Custom dropdowns
   ========================================================= */
function ddInit($dd, items, placeholder, opts = {}) {
  // Filter dropdowns use the button/label size (17); form dropdowns use the input size (18)
  const sm = opts.small ? 'h-10 text-[17px] min-w-[170px]' : 'h-12 text-[18px]';
  const itemSize = opts.small ? 'text-[17px]' : 'text-[18px]';
  const itemCls = `${TW.ddItem} ${itemSize}`;
  const first = opts.allLabel ? `<li class="${itemCls}" data-id="" data-name="${esc(opts.allLabel)}">${esc(opts.allLabel)}</li>` : '';
  $dd.html(`
    <button type="button" class="${TW.ddBtn} ${sm}">
      <span class="tp-dd-text" data-id="">${esc(placeholder)}</span>
      <span class="material-symbols-outlined !text-[24px]">keyboard_arrow_down</span>
    </button>
    <ul class="${TW.ddMenu}">${first}${items.map(i => `<li class="${itemCls}" data-id="${esc(i.id)}" data-name="${esc(i.name)}">${esc(i.name)}</li>`).join('')}</ul>
  `);
}
const ddSet = ($dd, id, text) => $dd.find('.tp-dd-text').text(text).attr('data-id', id ?? '');
const ddGet = ($dd) => $dd.find('.tp-dd-text').attr('data-id') || '';

$(document).on('click', '.tp-dd-btn', function (e) {
  e.stopPropagation();
  const $menu = $(this).closest('.tp-dd').find('.tp-dd-menu');
  $('.tp-dd-menu').not($menu).addClass('hidden');
  $menu.toggleClass('hidden');
});
$(document).on('click', '.tp-dd-menu li', function (e) {
  e.stopPropagation();
  const $dd = $(this).closest('.tp-dd');
  const id = $(this).attr('data-id'), name = $(this).attr('data-name');
  ddSet($dd, id, name);
  $dd.find('.tp-dd-menu').addClass('hidden');
  $dd.trigger('tp:change', [id, name]);
});

$(document).on('click', function (e) {
  if (!$(e.target).closest('.tp-dd').length) $('.tp-dd-menu').addClass('hidden');
  if (!$(e.target).closest('#tp-import-menu, #tp-import-btn').length) $('#tp-import-menu').addClass('hidden');
  if (!$(e.target).closest('.tp-row-menu, .tp-more').length) $('.tp-row-menu').addClass('hidden');
});

/* =========================================================
   Load + render list
   ========================================================= */
function tpLoad() {
  if (TP_DEMO_MODE) {
    if (!tpTests.length) tpTests = TP_SAMPLE.map((i, idx) => normalize(i, idx));
    tpInitFilters(); tpRender();
    return;
  }
  $.getJSON(TP_API.list, function (res) {
    if (res && res.success !== false) {
      const flags = tpModeFlags(res.collection_modes);
      tpTests = (res.test_packages || []).map((i, idx) => normalize(i, idx, flags));
    }
    tpInitFilters();
    tpRender();
  }).fail(function () { tpTests = []; tpInitFilters(); tpRender(); });
}

function tpFiltered() {
  const q = tpFilters.q.toLowerCase();
  return tpTests.filter(t => {
    if (t.status === 'archived') return false;
    if (q && !(`${t.name} ${t.code} ${t.category} ${t.sub}`.toLowerCase().includes(q))) return false;
    if (tpFilters.category && t.category !== tpFilters.category) return false;
    if (tpFilters.status && t.status !== tpFilters.status.toLowerCase()) return false;
    if (tpFilters.collection) {
      const want = tpFilters.collection.toLowerCase().includes('home') ? 'home' : 'lab';
      if (!t.collection.toLowerCase().includes(want)) return false;
    }
    return true;
  });
}

function tpCounts(list) {
  const live = list.filter(t => t.status !== 'archived');
  const pk = live.filter(t => String(t.type).toLowerCase() === 'package').length;
  return {
    total: live.length, tests: live.length - pk, packages: pk,
    active: live.filter(t => t.status === 'active').length,
    draft: live.filter(t => t.status === 'draft').length,
    paused: live.filter(t => t.status === 'paused').length
  };
}

function tpRenderStats() {
  let c = tpCounts(tpTests);
  if (TP_DEMO_MODE) {
    // Figma totals (30 / 23 / 3 / 4) adjusted by whatever changed against the 7 sample rows
    const base = tpCounts(TP_SAMPLE.map(i => ({ status: i.status, type: i.type })));
    const st = TP_SAMPLE_STATS;
    c = {
      total: st.total + c.total - base.total, tests: st.tests + c.tests - base.tests, packages: st.packages + c.packages - base.packages,
      active: st.active + c.active - base.active, draft: st.draft + c.draft - base.draft, paused: st.paused + c.paused - base.paused
    };
  }
  $('#tp-stat-total').text(c.total);
  $('#tp-stat-total-sub').text(`${c.tests} tests · ${c.packages} packages`);
  $('#tp-stat-active').text(c.active);
  $('#tp-stat-draft').text(c.draft);
  $('#tp-stat-paused').text(c.paused);
}

function tpRender() {
  tpRenderStats();
  const rows = tpFiltered();
  const $tb = $('#tp-tbody').empty();

  if (!rows.length) { $('#tp-empty').removeClass('hidden').addClass('flex'); return; }
  $('#tp-empty').addClass('hidden').removeClass('flex');

  rows.forEach(t => {
    $tb.append(`
      <tr data-id="${esc(t.id)}">
        <td class="${TW.td}">
          <div class="tp-open-details text-[17px] font-bold text-tp-blue cursor-pointer hover:underline">${esc(t.name)}</div>
          <div class="text-[15px] text-tp-muted">${esc(t.code)}</div>
          <div class="text-[15px] italic text-gray-400">${esc(t.sub)}</div>
        </td>
        <td class="${TW.td}">${esc(t.category)}</td>
        <td class="${TW.td} text-[17px] font-semibold">${rupee(t.price)}</td>
        <td class="${TW.td}">${esc(t.collection)}</td>
        <td class="${TW.td}">${esc(t.tat)}</td>
        <td class="${TW.td} text-[17px] font-semibold">${esc(t.bookings)}</td>
        <td class="${TW.td}"><span class="${TW.pill} ${TW.status[t.status] || TW.status.draft}">${esc(cap(t.status))}</span></td>
        <td class="${TW.td}">${esc(t.updated)}</td>
        <td class="${TW.td}">
          <span class="inline-flex items-center gap-2">
            <span class="tp-open-details material-symbols-outlined !text-[24px] text-tp-blue cursor-pointer" title="View">visibility</span>
            <span class="relative inline-flex">
              <span class="tp-more material-symbols-outlined !text-[24px] text-tp-blue cursor-pointer" title="More">more_vert</span>
              <div class="tp-row-menu hidden absolute right-0 top-full mt-1 z-30 min-w-[170px] bg-white rounded-xl shadow-xl py-1.5 text-left">
                <button type="button" data-act="duplicate" class="block w-full text-left px-5 py-2.5 text-[17px] text-gray-900 hover:bg-gray-100 cursor-pointer">Duplicate</button>
                <button type="button" data-act="pause" class="block w-full text-left px-5 py-2.5 text-[17px] text-gray-900 hover:bg-gray-100 cursor-pointer">${t.status === 'paused' ? 'Resume' : 'Pause'}</button>
                <button type="button" data-act="archive" class="block w-full text-left px-5 py-2.5 text-[17px] text-tp-red hover:bg-gray-100 cursor-pointer">Archive</button>
              </div>
            </span>
          </span>
        </td>
      </tr>`);
  });
}

/* =========================================================
   Search / filters / import
   ========================================================= */
function tpInitFilters() {
  const cats = tpCategories().map(c => ({ id: c.name, name: c.name }));
  ddInit($('#tp-f-category'), cats, 'All Categories', { allLabel: 'All Categories', small: true });
  ddInit($('#tp-f-collection'), [{ id: 'Home Collection', name: 'Home Collection' }, { id: 'Lab Visit', name: 'Lab Visit' }], 'All Collection', { allLabel: 'All Collection', small: true });
  ddInit($('#tp-f-status'), ['Active', 'Draft', 'Paused'].map(s => ({ id: s, name: s })), 'All Status', { allLabel: 'All Status', small: true });
  // keep any active filter selection visible after a reload
  if (tpFilters.category) ddSet($('#tp-f-category'), tpFilters.category, tpFilters.category);
  if (tpFilters.collection) ddSet($('#tp-f-collection'), tpFilters.collection, tpFilters.collection);
  if (tpFilters.status) ddSet($('#tp-f-status'), tpFilters.status, tpFilters.status);
}

$(document).on('input', '#tp-search', function () { tpFilters.q = this.value.trim(); tpRender(); });
$(document).on('click', '#tp-filter-btn', () => $('#tp-filter-row').toggleClass('hidden flex'));
$(document).on('tp:change', '#tp-f-category', (e, id) => { tpFilters.category = id; tpRender(); });
$(document).on('tp:change', '#tp-f-collection', (e, id) => { tpFilters.collection = id; tpRender(); });
$(document).on('tp:change', '#tp-f-status', (e, id) => { tpFilters.status = id; tpRender(); });
$(document).on('click', '#tp-reset', function () {
  tpFilters = { q: '', category: '', collection: '', status: '' };
  $('#tp-search').val('');
  ['#tp-f-category', '#tp-f-collection', '#tp-f-status'].forEach(s => ddSet($(s), '', $(s).data('all')));
  tpRender();
});

$(document).on('click', '#tp-import-btn', function (e) { e.stopPropagation(); $('#tp-import-menu').toggleClass('hidden'); });
let tpImportKind = 'tests';
$(document).on('click', '#tp-import-menu button', function () {
  const kind = $(this).data('import');
  $('#tp-import-menu').addClass('hidden');
  if (kind === 'template') { window.location.href = TP_API.template; return; }
  tpImportKind = kind;
  $('#tp-import-file').val('').trigger('click');
});
$(document).on('change', '#tp-import-file', function () {
  const file = this.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file); fd.append('type', tpImportKind);
  $.ajax({
    url: TP_API.import, method: 'POST', data: fd, processData: false, contentType: false,
    headers: { "X-CSRFToken": getCookie("csrftoken") },
    success: (res) => { if (res.success) { notify('success', 'Import completed'); tpLoad(); } else notify('error', res.message || 'Import failed'); },
    error: () => notify('error', 'Import failed')
  });
});

/* =========================================================
   Modal helpers (Tailwind: hidden <-> flex)
   ========================================================= */
const openModal = (id) => $('#' + id).removeClass('hidden').addClass('flex');
const closeModal = (id) => $('#' + id).addClass('hidden').removeClass('flex');
$(document).on('click', '[data-close]', function () { closeModal($(this).data('close')); });
$(document).on('click', '.tp-overlay', function (e) {
  if (e.target !== this) return;
  if (this.id === 'tp-modal-form') tryCloseForm(); else closeModal(this.id);
});

/* =========================================================
   Add / Edit form
   ========================================================= */
function renderMarkers() {
  const $box = $('#f-markers');
  $box.find('.tp-chip').remove();
  tpMarkers.forEach((m, idx) => {
    $(`<span class="tp-chip ${TW.chip}"><b class="cursor-pointer font-semibold" data-rm="${idx}">✕</b> ${esc(m)}</span>`).insertBefore('#f-marker-input');
  });
}
$(document).on('keydown', '#f-marker-input', function (e) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const v = this.value.trim();
  if (v) { tpMarkers.push(v); this.value = ''; renderMarkers(); tpDirty = true; }
});
$(document).on('click', '#f-markers [data-rm]', function () {
  tpMarkers.splice(+$(this).data('rm'), 1); renderMarkers(); tpDirty = true;
});

function nextCode() {
  const nums = tpTests.map(t => parseInt(String(t.code).replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
  return 'TST-' + String((nums.length ? Math.max(...nums) : 1000) + 1).padStart(4, '0');
}
$(document).on('click', '#f-generate', function () { $('#f-code').val(nextCode()); tpDirty = true; });
$(document).on('input', '#f-desc', function () { $('#f-desc-count').text(this.value.length); });

const setStatusRadio = (val) => $(`input[name="f-status"][value="${val}"]`).prop('checked', true);

function resetForm() {
  const cats = tpCategories();
  ddInit($('#f-category'), cats, cats[0].name);
  ddSet($('#f-category'), cats[0].id, cats[0].name);
  $('#f-name, #f-code, #f-desc, #f-price, #f-compare, #f-homefee').val('');
  $('#f-desc-count').text('0');
  $('#f-radius').val('5 km');
  $('#f-prep').prop('checked', false);
  $('#f-lab, #f-home').prop('checked', true);
  tpMarkers = []; renderMarkers();
  setStatusRadio('draft');
  tpDirty = false;
}

function openForm(test) {
  resetForm();
  tpEditId = test ? test.id : null;
  $('#tp-form-title').text(test ? 'Edit Test' : 'Add New Test');
  if (test) {
    $('#f-name').val(test.name); $('#f-code').val(test.code);
    const cat = tpCategories().find(c => c.name === test.category || String(c.id) === String(test.category_id));
    if (cat) ddSet($('#f-category'), cat.id, cat.name);
    $('#f-desc').val(test.sub); $('#f-desc-count').text((test.sub || '').length);
    $('#f-price').val(test.price); $('#f-compare').val(test.compare_price);
    $('#f-lab').prop('checked', test.lab_visit !== false);
    $('#f-home').prop('checked', test.home_collection !== false);
    $('#f-radius').val(test.radius); $('#f-homefee').val(test.home_fee);
    $('#f-prep').prop('checked', test.prep_required);
    tpMarkers = (test.markers || []).slice(); renderMarkers();
    setStatusRadio(test.status === 'active' ? 'active' : 'draft');
  }
  tpDirty = false;
  $('#tp-form-body').scrollTop(0);
  openModal('tp-modal-form');
}

$(document).on('input change', '#tp-form-body input, #tp-form-body textarea', () => { tpDirty = true; });
$(document).on('tp:change', '#f-category', () => { tpDirty = true; });

function tryCloseForm() {
  if (tpDirty) openModal('tp-modal-discard'); else closeModal('tp-modal-form');
}
$(document).on('click', '[data-close-form]', tryCloseForm);
$(document).on('click', '#discard-continue', () => closeModal('tp-modal-discard'));
$(document).on('click', '#discard-confirm', function () {
  tpDirty = false; closeModal('tp-modal-discard'); closeModal('tp-modal-form');
});
$(document).on('click', '#tp-add-btn, #tp-empty-add', () => openForm(null));

function buildPayload(status) {
  return {
    name: $('#f-name').val().trim(),
    code: $('#f-code').val().trim(),
    category_id: ddGet($('#f-category')),
    category: $('#f-category .tp-dd-text').text(),
    description: $('#f-desc').val().trim(),
    markers: tpMarkers,
    prep_required: $('#f-prep').is(':checked'),
    price: $('#f-price').val() || "0",
    compare_price: $('#f-compare').val() || null,
    lab_visit: $('#f-lab').is(':checked'),
    home_collection: $('#f-home').is(':checked'),
    radius: $('#f-radius').val().trim(),
    home_fee: $('#f-homefee').val() || "0",
    status
  };
}

function saveForm(forcedStatus) {
  const status = forcedStatus || $('input[name="f-status"]:checked').val() || 'draft';
  const p = buildPayload(status);

  if (!p.name) return notify('error', 'Please enter the test name');
  if (!p.code) return notify('error', 'Please enter or generate a test code');
  if (p.price === '' || isNaN(+p.price)) return notify('error', 'Please enter the customer price');
  if (!p.lab_visit && !p.home_collection) return notify('error', 'Select at least one collection option');

  if (TP_DEMO_MODE) {
    if (tpEditId) {
      const i = tpTests.findIndex(t => String(t.id) === String(tpEditId));
      if (i > -1) tpTests[i] = { ...normalize({ ...p, id: tpEditId, updated: tpShortDate(new Date()), report_tat: tpTests[i].tat, bookings: tpTests[i].bookings }, i), local: true };
    } else {
      tpTests.unshift({ ...normalize({ ...p, id: 'demo-' + Date.now(), updated: tpShortDate(new Date()), report_tat: '-' }, tpTests.length), local: true });
    }
    notify('success', tpEditId ? 'Test updated successfully' : 'Test added successfully');
    tpDirty = false; closeModal('tp-modal-form'); tpInitFilters(); tpRender();
    return;
  }

  const req = tpEditId ? postJSON(TP_API.update(tpEditId), p) : postJSON(TP_API.create, { services: [p], collections: [] });
  req.done(function (res) {
    if (res.success) {
      notify('success', tpEditId ? 'Test updated successfully' : 'Test added successfully');
      tpDirty = false; closeModal('tp-modal-form'); tpLoad();
    } else notify('error', res.message || 'Failed to save');
  }).fail(() => notify('error', 'Something went wrong while saving'));
}
$(document).on('click', '#f-save', () => saveForm(null));
$(document).on('click', '#f-save-draft', () => saveForm('draft'));

/* =========================================================
   Details modal
   ========================================================= */
const byId = (id) => tpTests.find(t => String(t.id) === String(id));

function openDetails(t) {
  tpActionId = t.id;
  $('#d-title').text(t.name);
  $('#d-cat').text(t.category || '-');
  $('#d-status').attr('class', `${TW.pill} ${TW.status[t.status] || TW.status.draft}`).text(cap(t.status));
  $('#d-price').text(rupee(t.price));
  $('#d-code').text(`${t.code}${t.params ? ' · ' + t.params + ' parameters' : ''}`);
  $('#d-params').text((t.markers && t.markers.length) ? t.markers.join(' · ') : '-');
  $('#d-sample').text(t.sample);
  $('#d-prep').text(t.prep_required ? (t.prep !== '-' ? t.prep : 'Preparation required') : 'No special preparation required.');
  const coll = [t.collection !== '-' ? t.collection : null, t.radius ? `Radius ${t.radius}` : null, t.home_fee !== '' ? `Home fee ₹${t.home_fee}` : null].filter(Boolean).join(' · ');
  $('#d-collection').text(coll || '-');
  $('#d-tat').text(t.tat);
  $('#d-avail').text(t.availability);
  $('#d-bookings').text(t.bookings);
  $('#d-updated').text(t.updated);
  openModal('tp-modal-details');
}
$(document).on('click', '.tp-open-details', function () {
  const t = byId($(this).closest('tr').data('id'));
  if (t) openDetails(t);
});
$(document).on('click', '#d-edit', function () {
  const t = byId(tpActionId); if (!t) return;
  closeModal('tp-modal-details'); openForm(t);
});
$(document).on('click', '#d-duplicate', function () {
  const t = byId(tpActionId); if (!t) return;
  closeModal('tp-modal-details'); duplicateTest(t);
});

/* =========================================================
   Row 3-dot menu: Duplicate / Pause / Archive
   ========================================================= */
$(document).on('click', '.tp-more', function (e) {
  e.stopPropagation();
  const $menu = $(this).siblings('.tp-row-menu');
  $('.tp-row-menu').not($menu).addClass('hidden');
  $('.tp-dd-menu').addClass('hidden');
  tpActionId = $(this).closest('tr').data('id');
  $menu.toggleClass('hidden');
});

function duplicateTest(t) {
  const p = {
    name: t.name + ' (Copy)', code: nextCode(), category_id: t.category_id, category: t.category,
    description: t.sub, markers: t.markers, prep_required: t.prep_required, price: t.price,
    compare_price: t.compare_price || null, lab_visit: t.lab_visit !== false, home_collection: t.home_collection !== false,
    radius: t.radius, home_fee: t.home_fee || "0", status: 'draft'
  };
  if (TP_DEMO_MODE) {
    tpTests.unshift({ ...normalize({ ...p, id: 'demo-' + Date.now(), updated: tpShortDate(new Date()), report_tat: t.tat, bookings: 0, sample_type: t.sample, preparation: t.prep, availability: t.availability }, tpTests.length), local: true });
    notify('success', 'Test duplicated as draft'); tpRender();
    return;
  }
  postJSON(TP_API.create, { services: [p], collections: [] })
    .done(res => { if (res.success) { notify('success', 'Test duplicated as draft'); tpLoad(); } else notify('error', 'Failed to duplicate'); })
    .fail(() => notify('error', 'Failed to duplicate'));
}

$(document).on('click', '.tp-row-menu button', function () {
  const act = $(this).data('act');
  tpActionId = $(this).closest('tr').data('id');
  $('.tp-row-menu').addClass('hidden');
  const t = byId(tpActionId); if (!t) return;
  if (act === 'duplicate') duplicateTest(t);
  if (act === 'pause') {
    if (t.status === 'paused') setStatus(t.id, 'active', 'Test resumed'); else openModal('tp-modal-pause');
  }
  if (act === 'archive') openModal('tp-modal-archive');
});

function setStatus(id, status, msg) {
  if (TP_DEMO_MODE) {
    const t = byId(id);
    if (t) { t.status = status; t.updated = tpShortDate(new Date()); t.local = true; }
    notify('success', msg); tpRender();
    return;
  }
  postJSON(TP_API.update(id), { status })
    .done(res => { if (res.success) { notify('success', msg); tpLoad(); } else notify('error', 'Failed to update'); })
    .fail(() => notify('error', 'Something went wrong'));
}
$(document).on('click', '#pause-confirm', function () { closeModal('tp-modal-pause'); setStatus(tpActionId, 'paused', 'Test paused'); });
$(document).on('click', '#archive-confirm', function () { closeModal('tp-modal-archive'); setStatus(tpActionId, 'archived', 'Test archived'); });

/* =========================================================
   Init
   ========================================================= */
$(document).ready(function () {
  tpRenderDate();
  tpLoad();
});