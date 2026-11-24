/**
 * hospital-settings.js
 * Behaviour for the Hospital Settings page: 9 tabs, sub-views, modals,
 * profile editing, logo + document uploads, branches & hours (per-branch
 * profile form, hours and documents), team & permissions
 * (invite / assign role / assign member / deactivate / roles / filters),
 * notification quiet hours, security session / verification popups,
 * header logout / delete icons (all tabs except the first; identity strip only on the first),
 * validation, toasts.
 *
 * Type scale of generated markup matches the Beds & Facilities page
 * (toast 17px, table icons 22-24px, pills/notes 15px via CSS classes).
 * Place at: static/js/hospital-settings.js
 */
(function () {
    'use strict';

    /* ------------------------------------------------------------------ *
     * Helpers
     * ------------------------------------------------------------------ */
    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

    var root = $('.settings-scope');
    if (!root) { return; }

    var userId = root.getAttribute('data-settings-user') || 'anon';
    var STORAGE_KEY = 'settings:lastTab:' + userId;
    var MAX_FILE_BYTES = 2 * 1024 * 1024;
    var ALLOWED_TYPES = ['image/png', 'image/jpeg'];

    function safeGet(key) { try { return window.sessionStorage.getItem(key); } catch (e) { return null; } }
    function safeSet(key, val) { try { window.sessionStorage.setItem(key, val); } catch (e) { /* ignore */ } }

    function esc(str) {
        return String(str).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

    function initialsOf(name) {
        var parts = String(name).replace(/^Dr\.?\s+/i, '').trim().split(/\s+/);
        return ((parts[0] || '').charAt(0) + (parts[1] ? parts[1].charAt(0) : '')).toUpperCase() || 'NA';
    }

    function logoInitials(name) {
        var words = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (!words.length) { return 'AC'; }
        if (words.length === 1) { return words[0].slice(0, 2).toUpperCase(); }
        return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }

    var AVATAR_CLASSES = ['a', 'b', 'c', 'd', 'e'];
    var avatarIndex = 0;
    function nextAvatarClass() { var c = AVATAR_CLASSES[avatarIndex % AVATAR_CLASSES.length]; avatarIndex += 1; return c; }

    /* Make sure a <select> has an option for `value`, then select it. */
    function ensureOption(select, value, select_it) {
        if (!select || !value) { return; }
        var found = false;
        $$('option', select).forEach(function (o) { if (o.value === value || o.textContent === value) { found = true; } });
        if (!found) {
            var opt = document.createElement('option');
            opt.textContent = value;
            select.appendChild(opt);
        }
        if (select_it) { select.value = value; }
    }

    /* ------------------------------------------------------------------ *
     * Toast
     * ------------------------------------------------------------------ */
    var toastTimer = null;
    function toast(message, type) {
        var el = $('#settings-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'settings-toast';
            el.setAttribute('role', 'status');
            el.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] max-w-[90vw] px-[18px] py-2.5 rounded-[10px] shadow-lg text-[17px] font-medium text-white transition-all duration-300';
            document.body.appendChild(el);
        }
        el.style.fontFamily = "'Nunito', sans-serif";
        el.classList.remove('bg-emerald-600', 'bg-rose-600', 'bg-slate-800');
        el.classList.add(type === 'error' ? 'bg-rose-600' : type === 'info' ? 'bg-slate-800' : 'bg-emerald-600');
        el.textContent = message;
        el.style.opacity = '1';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.style.opacity = '0'; }, 2600);
    }

    /* ------------------------------------------------------------------ *
     * Tabs + sub-views
     * ------------------------------------------------------------------ */
    var tabButtons = $$('.settings-tab-btn');
    var tabPanels = $$('.settings-tab-panel');

    function panelFor(tab) { return $('.settings-tab-panel[data-tab-panel="' + tab + '"]'); }

    function showSubview(tab, view) {
        var panel = panelFor(tab);
        if (!panel) { return; }
        var found = false;
        $$('.sub-view-screen', panel).forEach(function (screen) {
            var match = screen.getAttribute('data-view-name') === view;
            screen.classList.toggle('hidden', !match);
            if (match) { found = true; }
        });
        if (!found) {
            var main = $('.sub-view-screen[data-view-name="main"]', panel);
            if (main) { main.classList.remove('hidden'); }
        }
    }

    /* Keep the active tab visible by scrolling ONLY the tab strip horizontally. */
    function revealActiveTab(btn) {
        var strip = btn && btn.parentNode;
        if (!strip) { return; }
        var left = btn.offsetLeft;
        var right = left + btn.offsetWidth;
        if (left < strip.scrollLeft) {
            strip.scrollLeft = Math.max(0, left - 16);
        } else if (right > strip.scrollLeft + strip.clientWidth) {
            strip.scrollLeft = right - strip.clientWidth + 16;
        }
    }

    function showTab(tab, view) {
        if (!panelFor(tab)) { return; }
        tabButtons.forEach(function (btn) {
            var active = btn.getAttribute('data-tab') === tab;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
            if (active) { revealActiveTab(btn); }
        });
        tabPanels.forEach(function (panel) {
            panel.classList.toggle('hidden', panel.getAttribute('data-tab-panel') !== tab);
        });
        showSubview(tab, view || 'main');
        // The hospital name + "Verified" strip belongs to the first tab only
        var strip = $('#identity-strip');
        if (strip) { strip.classList.toggle('hidden', tab !== 'profile'); }
        // ...and the logout / delete header icons belong to every tab except the first
        var headIcons = $('#header-icons');
        if (headIcons) { headIcons.classList.toggle('hidden', tab === 'profile'); }
        safeSet(STORAGE_KEY, tab);
    }

    /* ------------------------------------------------------------------ *
     * Modals
     * ------------------------------------------------------------------ */
    function openModal(id) {
        var modal = document.getElementById(id);
        if (!modal) { return; }
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
    }

    function closeModal(id) {
        var modal = document.getElementById(id);
        if (!modal) { return; }
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        if (!$('.settings-modal-overlay.flex')) { document.body.classList.remove('overflow-hidden'); }
    }

    function openModals() { return $$('.settings-modal-overlay.flex'); }

    function afterModalClosed(id) {
        if (id === 'modal-upload-logo') { resetLogoModal(); }
        if (id === 'modal-add-document') { resetDocModal(); }
        if (id === 'modal-invite-member') { resetInviteModal(); }
        if (id === 'modal-assign-member') { resetAssignMemberModal(); }
    }

    /* ------------------------------------------------------------------ *
     * Validation
     * ------------------------------------------------------------------ */
    var RULES = {
        name: { test: function (v) { return /^[A-Za-z][A-Za-z\s.&'\-]*$/.test(v.trim()); }, msg: 'Use alphabets and spaces only.' },
        email: { test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, msg: 'Enter a valid email address.' },
        phone: { test: function (v) { return /^\+?[0-9][0-9\s-]{8,14}$/.test(v.trim()); }, msg: 'Enter a valid phone number.' }
    };

    function setError(input, message) {
        var holder = input.parentNode.classList.contains('relative') ? input.parentNode.parentNode : input.parentNode;
        var err = $('[data-error-for="' + (input.id || '') + '"]', holder);
        if (message) {
            input.classList.add('has-error');
            if (!err) {
                err = document.createElement('p');
                err.className = 'text-[15px] font-semibold text-rose-600 mt-1';
                err.setAttribute('data-error-for', input.id || '');
                holder.appendChild(err);
            }
            err.textContent = message;
        } else {
            input.classList.remove('has-error');
            if (err) { err.parentNode.removeChild(err); }
        }
    }

    function validateWithin(scope) {
        var firstBad = null;
        $$('[data-validate]', scope).forEach(function (input) {
            var rule = RULES[input.getAttribute('data-validate')];
            if (!rule) { return; }
            var value = input.value || '';
            var ok = value.trim() !== '' && rule.test(value);
            setError(input, ok ? '' : (value.trim() === '' ? 'This field is required.' : rule.msg));
            if (!ok && !firstBad) { firstBad = input; }
        });
        return firstBad;
    }

    /* ------------------------------------------------------------------ *
     * Profile tab: edit mode, sync, counter, discard
     * ------------------------------------------------------------------ */
    var profilePanel = panelFor('profile');
    var initialValues = {};

    function profileFields() { return profilePanel ? $$('.settings-field', profilePanel) : []; }
    function snapshotProfile() { profileFields().forEach(function (f) { initialValues[f.id] = f.value; }); }

    function setCardEditing(card, editing) {
        if (!card) { return; }
        $$('.settings-field', card).forEach(function (f) {
            if (f.hasAttribute('data-locked')) { return; }
            f.disabled = !editing;
        });
        var toggle = $('[data-edit-toggle]', card);
        if (toggle) {
            var label = $('[data-edit-label]', toggle) || toggle;
            var isAddress = card.getAttribute('data-edit-card') === 'address';
            label.textContent = editing ? 'Done' : (isAddress ? 'Edit Location' : 'Edit Details');
            toggle.classList.toggle('st-btn-primary', editing);
        }
        card.setAttribute('data-editing', editing ? 'true' : 'false');
        if (editing) {
            var first = $('.settings-field:not([data-locked])', card);
            if (first) { first.focus(); }
        }
    }

    function lockAllCards() {
        $$('[data-edit-card]', profilePanel).forEach(function (card) { setCardEditing(card, false); });
    }

    function updateCounter() {
        var area = $('#hospital_description');
        var counter = $('#description-counter');
        if (area && counter) { counter.textContent = area.value.length + '/' + (area.maxLength > 0 ? area.maxLength : 300); }
    }

    function updateBranchCounter() {
        var area = $('#br_description');
        var counter = $('#br-description-counter');
        if (area && counter) { counter.textContent = area.value.length + '/' + (area.maxLength > 0 ? area.maxLength : 300); }
    }

    function syncDisplayName(source) {
        var key = source.getAttribute('data-sync');
        $$('[data-sync="' + key + '"]').forEach(function (other) {
            if (other !== source) { other.value = source.value; }
        });
    }

    function applyNameToUi() {
        var name = ($('#hospital_public_name') || {}).value || '';
        if (!name.trim()) { return; }
        var identity = $('#identity-name');
        var preview = $('#preview-name');
        if (identity) { identity.textContent = name; }
        if (preview) { preview.textContent = name; }
    }

    /* ------------------------------------------------------------------ *
     * Logo upload / remove (shared by Hospital Profile + Add Branch)
     * logoTarget = 'profile' | 'branch'
     * ------------------------------------------------------------------ */
    var pendingLogo = null;
    var currentLogo = null;
    var logoTarget = 'profile';

    function nameForTarget(target) {
        return target === 'branch'
            ? (($('#br_display_name') || {}).value || '')
            : (($('#hospital_public_name') || {}).value || 'Apollo City');
    }

    function logoFor(target) { return target === 'branch' ? formState.logo : currentLogo; }

    function paintAvatar(el, dataUrl, name) {
        if (!el) { return; }
        el.innerHTML = '';
        if (dataUrl) {
            var img = document.createElement('img');
            img.src = dataUrl;
            img.alt = 'Logo';
            img.className = 'w-full h-full object-cover';
            el.appendChild(img);
        } else {
            el.textContent = logoInitials(name);
        }
    }

    function avatarElFor(target) { return target === 'branch' ? $('#br-logo-avatar') : $('#logo-avatar'); }

    function showFileError(elId, message) {
        var el = document.getElementById(elId);
        if (!el) { return; }
        el.textContent = message || '';
        el.classList.toggle('hidden', !message);
    }

    function validateFile(file) {
        if (!file) { return 'Please choose a file.'; }
        if (ALLOWED_TYPES.indexOf(file.type) === -1) { return 'Only PNG or JPG files are allowed.'; }
        if (file.size > MAX_FILE_BYTES) { return 'File is larger than 2 MB.'; }
        return '';
    }

    function readAsDataUrl(file, cb) {
        var reader = new FileReader();
        reader.onload = function () { cb(reader.result); };
        reader.onerror = function () { cb(null); };
        reader.readAsDataURL(file);
    }

    function bindDropzone(zone, input, onFile) {
        if (!zone || !input) { return; }
        input.addEventListener('change', function () { if (input.files && input.files[0]) { onFile(input.files[0]); } });
        ['dragenter', 'dragover'].forEach(function (evt) {
            zone.addEventListener(evt, function (e) { e.preventDefault(); zone.style.borderColor = '#007bff'; });
        });
        ['dragleave', 'drop'].forEach(function (evt) {
            zone.addEventListener(evt, function (e) { e.preventDefault(); zone.style.borderColor = ''; });
        });
        zone.addEventListener('drop', function (e) {
            var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) { onFile(file); }
        });
    }

    function resetLogoModal() {
        pendingLogo = null;
        showFileError('logo-error', '');
        var input = $('#logo-file-input');
        if (input) { input.value = ''; }
        paintAvatar($('#logo-crop-preview'), logoFor(logoTarget), nameForTarget(logoTarget));
    }

    /* ------------------------------------------------------------------ *
     * Verification documents (add / replace) - profile rows + branch rows
     * ------------------------------------------------------------------ */
    var docTarget = null;
    var docMode = 'add';
    var pendingDoc = null;

    function docRow(key) { return $('[data-doc-row="' + key + '"]'); }

    function todayLabel() {
        var d = new Date();
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return ('0' + d.getDate()).slice(-2) + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    function resetDocModal() {
        pendingDoc = null;
        showFileError('doc-error', '');
        var name = $('#doc-file-name');
        if (name) { name.textContent = ''; name.classList.add('hidden'); }
        var input = $('#doc-file-input');
        if (input) { input.value = ''; }
    }

    function docActionsHtml(key) {
        return '<div class="flex items-center justify-center gap-3">' +
            '<button type="button" data-open-modal="modal-document-preview" aria-label="View document" class="text-[#007bff] cursor-pointer"><span class="material-symbols-outlined text-[22px]">visibility</span></button>' +
            '<button type="button" data-open-modal="modal-replace-document" data-doc-target="' + esc(key) + '" aria-label="Replace document" class="text-orange-500 cursor-pointer"><span class="material-symbols-outlined text-[22px]">sync</span></button>' +
            '</div>';
    }

    function markDocPending(key) {
        // Branch documents live in formState.docs and are re-rendered.
        if (key && key.indexOf('br_') === 0) {
            formState.docs[key] = { date: todayLabel(), status: 'pending' };
            renderBranchDocs();
            return;
        }
        var row = docRow(key);
        if (!row) { return; }
        var date = $('[data-doc-date]', row);
        date.textContent = todayLabel();
        date.style.color = '';
        $('[data-doc-status]', row).innerHTML = '<span class="st-pill amber">Pending Review</span>';
        $('[data-doc-actions]', row).innerHTML = docActionsHtml(key);
    }

    var BRANCH_DOCS = [
        { key: 'br_business_reg', label: 'Business Registration' },
        { key: 'br_hospital_reg', label: 'Hospital Registration' },
        { key: 'br_medical_cert', label: 'Medicinal Certificate' }
    ];

    function renderBranchDocs() {
        var body = $('#br-docs-body');
        if (!body) { return; }
        var html = '<tr class="st-mini-head"><td>Document</td><td>Uploaded</td><td>Status</td><td>Actions</td></tr>';
        BRANCH_DOCS.forEach(function (d) {
            var doc = formState.docs[d.key];
            var pill, date, actions;
            if (!doc) {
                pill = '<span class="st-pill gray">Not Added</span>';
                date = '<span style="color:#94a3b8;">—</span>';
                actions = '<button type="button" data-open-modal="modal-add-document" data-doc-target="' + d.key + '" class="st-btn st-btn-ghost">+ Add Document</button>';
            } else {
                pill = doc.status === 'verified' ? '<span class="st-pill green">Verified</span>' : '<span class="st-pill amber">Pending Review</span>';
                date = esc(doc.date);
                actions = docActionsHtml(d.key);
            }
            html += '<tr><td style="font-weight:700;color:#0F172A;">' + esc(d.label) + '</td><td>' + date + '</td><td>' + pill + '</td><td>' + actions + '</td></tr>';
        });
        body.innerHTML = html;
    }

    /* ------------------------------------------------------------------ *
     * Operating hours (generic editor)
     * ------------------------------------------------------------------ */
    var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    function defaultHours(sundayShort) {
        return DAYS.map(function (d) {
            return (sundayShort && d === 'Sunday')
                ? { day: d, open: true, from: '08:00 AM', to: '01:00 PM' }
                : { day: d, open: true, from: '07:00 AM', to: '08:00 PM' };
        });
    }

    function timeOptions(selected) {
        var out = [];
        for (var h = 0; h < 24; h++) {
            var suffix = h < 12 ? 'AM' : 'PM';
            var hr = h % 12 === 0 ? 12 : h % 12;
            var label = ('0' + hr).slice(-2) + ':00 ' + suffix;
            out.push('<option' + (label === selected ? ' selected' : '') + '>' + label + '</option>');
        }
        return out.join('');
    }

    function renderHours(box, hours) {
        if (!box) { return; }
        box.innerHTML = hours.map(function (h, i) {
            return '<div class="st-hours-row" data-hours-index="' + i + '">' +
                '<div class="st-hours-day"><label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" class="sr-only peer hours-toggle" aria-label="' + esc(h.day) + ' open"' + (h.open ? ' checked' : '') + '><div class="st-switch"></div></label><span>' + esc(h.day) + '</span></div>' +
                (h.open
                    ? '<select class="st-select hours-from" aria-label="' + esc(h.day) + ' opening time">' + timeOptions(h.from) + '</select><select class="st-select hours-to" aria-label="' + esc(h.day) + ' closing time">' + timeOptions(h.to) + '</select>'
                    : '<div class="st-hours-closed">Closed</div>') +
                '</div>';
        }).join('');
    }

    function readHours(box, hours) {
        if (!box) { return; }
        $$('[data-hours-index]', box).forEach(function (row) {
            var i = parseInt(row.getAttribute('data-hours-index'), 10);
            var toggle = $('.hours-toggle', row);
            var from = $('.hours-from', row);
            var to = $('.hours-to', row);
            if (!hours[i]) { return; }
            if (toggle) { hours[i].open = toggle.checked; }
            if (from) { hours[i].from = from.value; }
            if (to) { hours[i].to = to.value; }
        });
    }

    function hoursModelFor(box) {
        if (!box) { return null; }
        if (box.id === 'br-hours-editor') { return formState.hours; }
        if (box.id === 'hours-editor') { return hoursDraft; }
        return null;
    }

    function branchHoursSummary(hours) {
        function short(label) { return label.replace(/^0/, ''); }
        var mon = hours[0], sun = hours[6];
        var m = mon.open ? short(mon.from) + ' – ' + short(mon.to) : 'Closed';
        var s = sun.open ? short(sun.from) + ' – ' + short(sun.to) : 'Closed';
        return 'Mon: ' + m + ' · Sun: ' + s;
    }

    /* ------------------------------------------------------------------ *
     * Branches (data model + list + add/edit form + hours screen)
     * ------------------------------------------------------------------ */
    var BR_FIELDS = {
        displayName: 'br_display_name', description: 'br_description', legalName: 'br_legal_name',
        email: 'br_email', phone: 'br_phone', website: 'br_website', year: 'br_year', shortDesc: 'br_short_desc',
        addr1: 'br_addr1', addr2: 'br_addr2', area: 'br_area', city: 'br_city', state: 'br_state', pin: 'br_pin'
    };

    var BRANCHES = [{
        id: 'b1',
        displayName: 'Andheri East',
        description: 'Diagnostics and preventive health packages with lab visits and home sample collection.',
        legalName: 'Apollo City Hospital Pvt Ltd',
        email: 'contact@apollocityhospital.example',
        phone: '+91 90000 06831',
        website: 'https://www.apollocityhospital.example',
        year: '2011',
        shortDesc: '',
        addr1: 'Unit 204, Sunrise Business Centre',
        addr2: 'Central Avenue',
        area: 'Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pin: '400069',
        logo: null,
        hours: defaultHours(true),
        docs: {
            br_business_reg: { date: '15 Mar 2024', status: 'verified' },
            br_hospital_reg: { date: '20 Jan 2024', status: 'verified' }
        }
    }];

    var branchSeq = 1;
    var formState = { id: null, logo: null, hours: defaultHours(false), docs: {} };
    var hoursDraft = defaultHours(false);
    var hoursBranchId = null;

    function branchById(id) {
        for (var i = 0; i < BRANCHES.length; i++) { if (BRANCHES[i].id === id) { return BRANCHES[i]; } }
        return null;
    }

    function renderBranchList() {
        var list = $('#branch-list');
        if (!list) { return; }
        list.innerHTML = BRANCHES.map(function (b) {
            return '<div class="st-branch" data-branch-id="' + esc(b.id) + '">' +
                '<h4>' + esc(b.displayName) + '</h4>' +
                '<div class="st-branch-hours" data-branch-hours>' + esc(branchHoursSummary(b.hours)) + '</div>' +
                '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
                '<button type="button" data-branch-action="edit" data-branch-id="' + esc(b.id) + '" class="st-btn st-btn-block">Edit details</button>' +
                '<button type="button" data-branch-action="hours" data-branch-id="' + esc(b.id) + '" class="st-btn st-btn-block">Operating hours</button>' +
                '</div></div>';
        }).join('');
    }

    function fillBranchForm(branch) {
        Object.keys(BR_FIELDS).forEach(function (key) {
            var el = document.getElementById(BR_FIELDS[key]);
            if (!el) { return; }
            var fallback = key === 'city' ? 'Mumbai' : key === 'state' ? 'Maharashtra' : '';
            el.value = branch ? (branch[key] || '') : fallback;
            setError(el, '');
        });
        formState.id = branch ? branch.id : null;
        formState.logo = branch ? branch.logo : null;
        formState.hours = clone(branch ? branch.hours : defaultHours(false));
        formState.docs = clone(branch ? branch.docs : {});

        paintAvatar($('#br-logo-avatar'), formState.logo, nameForTarget('branch'));
        renderHours($('#br-hours-editor'), formState.hours);
        renderBranchDocs();
        updateBranchCounter();

        var title = $('#branch-form-title');
        var sub = $('#branch-form-sub');
        if (title) { title.textContent = branch ? 'Edit Branch' : 'Add Branch'; }
        if (sub) { sub.textContent = branch
            ? 'Update this branch\'s profile, address, hours and documents.'
            : 'Add a new hospital location with its profile, address, hours and documents.'; }
    }

    function openBranchForm(id) {
        var branch = id ? branchById(id) : null;
        fillBranchForm(branch);
        showTab('branches', 'add_branch');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function openBranchHours(id) {
        var branch = branchById(id);
        if (!branch) { return; }
        hoursBranchId = id;
        hoursDraft = clone(branch.hours);
        renderHours($('#hours-editor'), hoursDraft);
        var sub = $('#op-hours-sub');
        if (sub) { sub.textContent = 'Set weekly public hours for ' + branch.displayName + '.'; }
        showTab('branches', 'operating_hours');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function collectBranchForm() {
        var data = {};
        Object.keys(BR_FIELDS).forEach(function (key) {
            var el = document.getElementById(BR_FIELDS[key]);
            data[key] = el ? el.value.trim() : '';
        });
        return data;
    }

    function saveBranch() {
        var form = $('#branch-form');
        var bad = form ? validateWithin(form) : null;
        if (bad) { bad.focus(); toast('Please fix the highlighted fields.', 'error'); return; }

        readHours($('#br-hours-editor'), formState.hours);
        var data = collectBranchForm();
        var editing = !!formState.id;

        if (editing) {
            var branch = branchById(formState.id);
            Object.keys(data).forEach(function (k) { branch[k] = data[k]; });
            branch.logo = formState.logo;
            branch.hours = clone(formState.hours);
            branch.docs = clone(formState.docs);
        } else {
            branchSeq += 1;
            data.id = 'b' + branchSeq;
            data.logo = formState.logo;
            data.hours = clone(formState.hours);
            data.docs = clone(formState.docs);
            BRANCHES.push(data);
        }

        renderBranchList();
        showTab('branches', 'main');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast(editing ? 'Branch updated.' : 'Branch added.');
    }

    function saveBranchHours() {
        readHours($('#hours-editor'), hoursDraft);
        var branch = branchById(hoursBranchId);
        if (branch) { branch.hours = clone(hoursDraft); }
        renderBranchList();
    }

    /* ------------------------------------------------------------------ *
     * Team & permissions
     * ------------------------------------------------------------------ */
    var pendingDeactivateName = '';
    var pendingAssignRoleRow = null;
    var pendingAssignMemberRow = null;

    function normName(n) { return String(n || '').replace(/^Dr\.?\s+/i, '').trim().toLowerCase(); }

    function teamPanelOf(el) {
        var p = el && el.closest ? el.closest('[data-team-panel]') : null;
        return p ? p.getAttribute('data-team-panel') : '';
    }

    function setTeamTab(name) {
        $$('[data-team-tab]').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-team-tab') === name); });
        $$('[data-team-panel]').forEach(function (p) { p.classList.toggle('hidden', p.getAttribute('data-team-panel') !== name); });
        $$('[data-team-action]').forEach(function (b) { b.classList.toggle('hidden', b.getAttribute('data-team-action') !== name); });
        applyTeamFilters(name);
    }

    function applyTeamFilters(name) {
        var panels = name ? [$('[data-team-panel="' + name + '"]')] : $$('[data-team-panel]');
        panels.forEach(function (panel) {
            if (!panel) { return; }
            var q = (($('[data-team-search]', panel) || {}).value || '').trim().toLowerCase();
            var role = ($('[data-filter-role]', panel) || {}).value || '';
            var status = ($('[data-filter-status]', panel) || {}).value || '';
            var visible = 0;
            $$('[data-member-row], [data-role-row]', panel).forEach(function (row) {
                var okQ = !q || row.textContent.toLowerCase().indexOf(q) !== -1;
                var okRole = !role || row.getAttribute('data-role') === role;
                var okStatus = !status || row.getAttribute('data-status') === status;
                var show = okQ && okRole && okStatus;
                row.style.display = show ? '' : 'none';
                if (show) { visible += 1; }
            });
            var empty = $('[data-team-empty]', panel);
            if (empty) { empty.classList.toggle('hidden', visible > 0); }
            var count = (role ? 1 : 0) + (status ? 1 : 0);
            var badge = $('[data-filter-count]', panel);
            if (badge) { badge.textContent = String(count); badge.classList.toggle('hidden', count === 0); }
        });
    }

    function ensureFilterRole(role) {
        $$('[data-filter-role]').forEach(function (sel) {
            var has = false;
            $$('option', sel).forEach(function (o) { if (o.value === role || o.textContent === role) { has = true; } });
            if (!has) {
                var opt = document.createElement('option');
                opt.textContent = role;
                sel.appendChild(opt);
            }
        });
    }

    function resetInviteModal() {
        ['invite_name', 'invite_email'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) { el.value = ''; setError(el, ''); }
        });
    }

    function resetAssignMemberModal() {
        ['am_name', 'am_email'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) { el.value = ''; setError(el, ''); }
        });
        pendingAssignMemberRow = null;
    }

    function deactivateBtnHtml(name) {
        return '<button type="button" class="action-open-deactivate st-act-danger" data-member="' + esc(name) + '" aria-label="Deactivate access"><span class="material-symbols-outlined text-[24px]">block</span></button>';
    }

    function roleActionsHtml(role, memberName) {
        return '<div class="flex items-center justify-center gap-3">' +
            '<button type="button" class="st-act-edit" data-nav-tab="team" data-nav-subview="edit_role" data-role-name="' + esc(role) + '" aria-label="Edit role"><span class="material-symbols-outlined text-[24px]">edit_square</span></button>' +
            (memberName ? deactivateBtnHtml(memberName) : '') +
            '</div>';
    }

    function unassignedCellHtml() {
        return '<div class="st-unassigned"><span class="st-unassigned-label">Assign Member</span>' +
            '<button type="button" class="st-pill lime" data-open-modal="modal-assign-member">Assign Member<span class="material-symbols-outlined">add</span></button></div>';
    }

    function addTeamRow(name, email, role, branch) {
        var tbody = $('#team-table tbody');
        if (!tbody) { return; }
        var tr = document.createElement('tr');
        tr.setAttribute('data-member-row', '');
        tr.setAttribute('data-role', role);
        tr.setAttribute('data-status', 'Invited');
        tr.innerHTML =
            '<td><div class="st-member"><span class="st-avatar ' + nextAvatarClass() + '">' + esc(initialsOf(name)) + '</span><span data-member-name>' + esc(name) + '</span></div></td>' +
            '<td data-member-email>' + esc(email) + '</td>' +
            '<td data-member-role-cell><span class="st-pill blue">' + esc(role) + '</span></td>' +
            '<td>' + esc(branch) + '</td>' +
            '<td data-member-status-cell><span class="st-pill amber">Invited</span></td>' +
            '<td>Invited</td>' +
            '<td data-member-actions>' + deactivateBtnHtml(name) + '</td>';
        tbody.appendChild(tr);
        ensureFilterRole(role);
        applyTeamFilters('team');
    }

    function deactivateMember(name) {
        var target = normName(name);
        $$('[data-member-row]').forEach(function (row) {
            var n = normName(($('[data-member-name]', row) || {}).textContent);
            if (n === target) {
                row.setAttribute('data-status', 'Deactivated');
                $('[data-member-status-cell]', row).innerHTML = '<span class="st-pill gray">Deactivated</span>';
                var actions = $('[data-member-actions]', row);
                if (actions) { actions.innerHTML = '<span style="color:#94a3b8;">Access removed</span>'; }
            }
        });
        $$('[data-role-row]').forEach(function (row) {
            var n = normName(($('[data-role-member]', row) || {}).textContent);
            if (n && n === target) {
                row.setAttribute('data-status', 'Deactivated');
                var st = $('[data-role-status-cell]', row);
                if (st) { st.innerHTML = '<span class="st-pill gray">Deactivated</span>'; }
                var btn = $('.action-open-deactivate', row);
                if (btn && btn.parentNode) { btn.parentNode.removeChild(btn); }
            }
        });
        applyTeamFilters();
    }

    function addRoleRow(role, branch) {
        var tbody = $('#roles-table tbody');
        if (!tbody) { return; }
        var tr = document.createElement('tr');
        tr.setAttribute('data-role-row', '');
        tr.setAttribute('data-role', role);
        tr.setAttribute('data-status', 'Unassigned');
        tr.innerHTML =
            '<td class="st-role-name">' + esc(role) + '</td>' +
            '<td data-role-member-cell>' + unassignedCellHtml() + '</td>' +
            '<td data-role-email>—</td>' +
            '<td data-role-branch>' + esc(branch) + '</td>' +
            '<td data-role-status-cell><span class="st-pill gray">Not assigned</span></td>' +
            '<td data-role-active>—</td>' +
            '<td data-role-actions>' + roleActionsHtml(role, '') + '</td>';
        tbody.appendChild(tr);
        ensureFilterRole(role);
        applyTeamFilters('roles');
    }

    function assignMemberToRoleRow(row, name, email, branch) {
        var role = row.getAttribute('data-role');
        $('[data-role-member-cell]', row).innerHTML =
            '<div class="st-member"><span class="st-avatar ' + nextAvatarClass() + '">' + esc(initialsOf(name)) + '</span><span data-role-member>' + esc(name) + '</span></div>';
        $('[data-role-email]', row).textContent = email;
        $('[data-role-branch]', row).textContent = branch;
        $('[data-role-status-cell]', row).innerHTML = '<span class="st-pill amber">Invited</span>';
        $('[data-role-active]', row).textContent = 'Invited';
        $('[data-role-actions]', row).innerHTML = roleActionsHtml(role, name);
        row.setAttribute('data-status', 'Invited');
    }

    /* ------------------------------------------------------------------ *
     * Notifications: quiet hours
     * ------------------------------------------------------------------ */
    function syncQuietHours() {
        var toggle = $('#quiet_enabled');
        var fields = $('#quiet-time-fields');
        if (!toggle || !fields) { return; }
        $$('input', fields).forEach(function (input) { input.disabled = !toggle.checked; });
        fields.style.opacity = toggle.checked ? '' : '.6';
    }

    /* ------------------------------------------------------------------ *
     * Security: sessions list + session detail popup
     * ------------------------------------------------------------------ */
    function refreshSessionCount() {
        var count = $$('.session-item').length;
        var el = $('#session-count');
        if (el) { el.textContent = String(count); }
        return count;
    }

    function fillSessionDetail(opener) {
        var title = $('#session-detail-title');
        var meta = $('#session-detail-meta');
        var last = $('#session-detail-last');
        var name = opener.getAttribute('data-session-name') || 'Current session';
        if (title) { title.textContent = name === 'This Device' ? 'Current session' : name; }
        if (meta) { meta.textContent = opener.getAttribute('data-session-meta') || ''; }
        if (last) { last.textContent = opener.getAttribute('data-session-last') || ''; }
    }

    /* ------------------------------------------------------------------ *
     * Search (dims tabs that do not match; jumps to first match)
     * ------------------------------------------------------------------ */
    function runSearch(query) {
        var q = query.trim().toLowerCase();
        var firstMatch = null;
        tabButtons.forEach(function (btn) {
            var tab = btn.getAttribute('data-tab');
            var panel = panelFor(tab);
            var hay = (btn.textContent + ' ' + (panel ? panel.textContent : '')).toLowerCase();
            var match = !q || hay.indexOf(q) !== -1;
            btn.style.opacity = match ? '' : '0.4';
            if (match && q && !firstMatch) { firstMatch = tab; }
        });
        if (firstMatch) {
            var activeBtn = $('.settings-tab-btn.is-active');
            var activeMatches = activeBtn && activeBtn.style.opacity !== '0.4';
            if (!activeMatches) { showTab(firstMatch); }
        }
    }

    /* ------------------------------------------------------------------ *
     * Global click delegation
     * ------------------------------------------------------------------ */
    document.addEventListener('click', function (e) {
        var t = e.target;

        // --- modal close (button or backdrop)
        var closer = t.closest('[data-close-modal]');
        if (closer) {
            var closeId = closer.getAttribute('data-close-modal');
            closeModal(closeId);
            afterModalClosed(closeId);
            if (!closer.hasAttribute('data-nav-tab')) { return; }
        } else if (t.classList && t.classList.contains('settings-modal-overlay')) {
            closeModal(t.id);
            afterModalClosed(t.id);
            return;
        }

        // --- deactivate access (opens confirmation)
        var deact = t.closest('.action-open-deactivate');
        if (deact) {
            pendingDeactivateName = deact.getAttribute('data-member') || 'This member';
            var dn = $('#deactivate-name');
            if (dn) { dn.textContent = pendingDeactivateName.replace(/^Dr\.?\s+/i, ''); }
            openModal('modal-deactivate');
            return;
        }
        if (t.closest('#btn-confirm-deactivate')) {
            deactivateMember(pendingDeactivateName);
            closeModal('modal-deactivate');
            toast('Access deactivated for ' + pendingDeactivateName.replace(/^Dr\.?\s+/i, '') + '.', 'info');
            return;
        }

        // --- modal open
        var opener = t.closest('[data-open-modal]');
        if (opener) {
            var modalId = opener.getAttribute('data-open-modal');
            if (opener.hasAttribute('data-logo-target')) { logoTarget = opener.getAttribute('data-logo-target'); }
            if (opener.hasAttribute('data-doc-target')) {
                docTarget = opener.getAttribute('data-doc-target');
                docMode = modalId === 'modal-replace-document' ? 'replace' : 'add';
                if (modalId === 'modal-add-document') {
                    resetDocModal();
                    var title = $('#add-document-title');
                    if (title) { title.textContent = 'Add Document'; }
                }
            }
            if (modalId === 'modal-assign-role' && opener.hasAttribute('data-member')) {
                var an = $('#assign_name'); var ae = $('#assign_email'); var ar = $('#assign_role');
                pendingAssignRoleRow = opener.closest('[data-member-row]');
                if (an) { an.value = opener.getAttribute('data-member'); }
                if (ae) { ae.value = opener.getAttribute('data-email') || ''; }
                if (ar && pendingAssignRoleRow) { ensureOption(ar, pendingAssignRoleRow.getAttribute('data-role'), true); }
            }
            if (modalId === 'modal-assign-member') {
                pendingAssignMemberRow = opener.closest('[data-role-row]');
                resetAssignMemberModal();
                pendingAssignMemberRow = opener.closest('[data-role-row]');
                var amRole = $('#am_role');
                if (amRole && pendingAssignMemberRow) { ensureOption(amRole, pendingAssignMemberRow.getAttribute('data-role'), true); }
            }
            if (modalId === 'modal-current-session') { fillSessionDetail(opener); }
            if (modalId === 'modal-upload-logo') { resetLogoModal(); }
            openModal(modalId);
            return;
        }

        // --- branches: add / edit / hours
        var branchBtn = t.closest('[data-branch-action]');
        if (branchBtn) {
            var branchAction = branchBtn.getAttribute('data-branch-action');
            var branchId = branchBtn.getAttribute('data-branch-id');
            if (branchAction === 'add') { openBranchForm(null); }
            if (branchAction === 'edit') { openBranchForm(branchId); }
            if (branchAction === 'hours') { openBranchHours(branchId); }
            return;
        }
        if (t.closest('#btn-save-branch')) { saveBranch(); return; }

        // --- sub-view navigation
        var nav = t.closest('[data-nav-tab][data-nav-subview]');
        if (nav) {
            var roleName = nav.getAttribute('data-role-name');
            var roleFrom = nav.getAttribute('data-role-from');
            if (!roleName && roleFrom) { roleName = ($(roleFrom) || {}).value; }
            if (roleName) {
                var roleInput = $('#edit-role-name');
                ensureOption(roleInput, roleName, true);
            }
            showTab(nav.getAttribute('data-nav-tab'), nav.getAttribute('data-nav-subview'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        var back = t.closest('[data-back-tab]');
        if (back) {
            showTab(back.getAttribute('data-back-tab'), back.getAttribute('data-back-subview') || 'main');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // --- tabs
        var tabBtn = t.closest('.settings-tab-btn');
        if (tabBtn) { showTab(tabBtn.getAttribute('data-tab')); return; }

        // --- team inner tabs + filter panel
        var teamTab = t.closest('[data-team-tab]');
        if (teamTab) { setTeamTab(teamTab.getAttribute('data-team-tab')); return; }

        var filterToggle = t.closest('[data-filter-toggle]');
        if (filterToggle) {
            var fPanel = filterToggle.closest('[data-team-panel]');
            var fBox = fPanel ? $('[data-filter-panel]', fPanel) : null;
            if (fBox) {
                var nowHidden = fBox.classList.toggle('hidden');
                filterToggle.setAttribute('aria-expanded', nowHidden ? 'false' : 'true');
                filterToggle.classList.toggle('is-open', !nowHidden);
            }
            return;
        }
        var resetBtn = t.closest('[data-reset-filters]');
        if (resetBtn) {
            var rPanel = resetBtn.closest('[data-team-panel]');
            if (rPanel) {
                var s = $('[data-team-search]', rPanel); var fr = $('[data-filter-role]', rPanel); var fs = $('[data-filter-status]', rPanel);
                if (s) { s.value = ''; } if (fr) { fr.value = ''; } if (fs) { fs.value = ''; }
                applyTeamFilters(rPanel.getAttribute('data-team-panel'));
            }
            return;
        }

        // --- invite / assign role / assign member / add role
        if (t.closest('#btn-send-invite')) {
            var scope = $('#modal-invite-member');
            var badInvite = validateWithin(scope);
            if (badInvite) { badInvite.focus(); return; }
            var branchEl = $('input[name="invite_branch"]:checked', scope);
            addTeamRow($('#invite_name').value.trim(), $('#invite_email').value.trim(), $('#invite_role').value, branchEl ? branchEl.value : 'All branches');
            closeModal('modal-invite-member');
            resetInviteModal();
            setTeamTab('team');
            toast('Invitation sent.');
            return;
        }
        if (t.closest('#btn-assign-role')) {
            var newRole = ($('#assign_role') || {}).value;
            if (pendingAssignRoleRow && newRole) {
                pendingAssignRoleRow.setAttribute('data-role', newRole);
                var rc = $('[data-member-role-cell]', pendingAssignRoleRow);
                if (rc) { rc.innerHTML = '<span class="st-pill blue">' + esc(newRole) + '</span>'; }
                ensureFilterRole(newRole);
                applyTeamFilters('team');
            }
            closeModal('modal-assign-role');
            toast('Role assigned to ' + (($('#assign_name') || {}).value || '').replace(/^Dr\.?\s+/i, '') + '.');
            pendingAssignRoleRow = null;
            return;
        }
        if (t.closest('#btn-send-member')) {
            var amScope = $('#modal-assign-member');
            var badMember = validateWithin(amScope);
            if (badMember) { badMember.focus(); return; }
            var amName = $('#am_name').value.trim();
            var amEmail = $('#am_email').value.trim();
            var amBranchEl = $('input[name="am_branch"]:checked', amScope);
            var amBranch = amBranchEl ? amBranchEl.value : 'All branches';
            var amRoleVal = ($('#am_role') || {}).value;
            if (pendingAssignMemberRow) { assignMemberToRoleRow(pendingAssignMemberRow, amName, amEmail, amBranch); }
            addTeamRow(amName, amEmail, amRoleVal, amBranch);
            closeModal('modal-assign-member');
            resetAssignMemberModal();
            applyTeamFilters();
            toast('Invitation sent to ' + amName + '.');
            return;
        }
        if (t.closest('#btn-add-role')) {
            var br = $('input[name="add_role_branch"]:checked');
            addRoleRow($('#add_role_name').value, br ? br.value : 'Andheri East');
            closeModal('modal-add-role');
            setTeamTab('roles');
            toast('Role added.');
            return;
        }

        // --- profile edit toggle
        var editBtn = t.closest('[data-edit-toggle]');
        if (editBtn) {
            var card = editBtn.closest('[data-edit-card]');
            var isEditing = card.getAttribute('data-editing') === 'true';
            if (isEditing) {
                var bad = validateWithin(card);
                if (bad) { bad.focus(); toast('Please fix the highlighted fields.', 'error'); return; }
            }
            setCardEditing(card, !isEditing);
            return;
        }

        // --- discard profile changes
        if (t.closest('#btn-discard-profile')) {
            profileFields().forEach(function (f) {
                if (initialValues.hasOwnProperty(f.id)) { f.value = initialValues[f.id]; }
                setError(f, '');
            });
            lockAllCards();
            updateCounter();
            toast('Changes discarded.', 'info');
            return;
        }

        // --- logo
        if (t.closest('#btn-save-logo')) {
            if (!pendingLogo) { showFileError('logo-error', 'Choose an image first.'); return; }
            if (logoTarget === 'branch') { formState.logo = pendingLogo; } else { currentLogo = pendingLogo; }
            paintAvatar(avatarElFor(logoTarget), pendingLogo, nameForTarget(logoTarget));
            closeModal('modal-upload-logo');
            pendingLogo = null;
            toast('Logo updated.');
            return;
        }
        if (t.closest('#btn-confirm-remove-logo')) {
            if (logoTarget === 'branch') { formState.logo = null; } else { currentLogo = null; }
            paintAvatar(avatarElFor(logoTarget), null, nameForTarget(logoTarget));
            closeModal('modal-remove-logo');
            toast('Logo removed.', 'info');
            return;
        }

        // --- documents
        if (t.closest('#btn-confirm-replace')) {
            closeModal('modal-replace-document');
            resetDocModal();
            var addTitle = $('#add-document-title');
            if (addTitle) { addTitle.textContent = 'Replace Document'; }
            openModal('modal-add-document');
            return;
        }
        if (t.closest('#btn-send-document')) {
            if (!pendingDoc) { showFileError('doc-error', 'Choose a file to upload.'); return; }
            markDocPending(docTarget);
            closeModal('modal-add-document');
            resetDocModal();
            toast(docMode === 'replace' ? 'Replacement sent. Status: Pending Review.' : 'Document sent for review.');
            return;
        }

        // --- sign out (header icon)
        if (t.closest('#btn-confirm-signout')) {
            closeModal('modal-signout');
            toast('Sign-out is a preview action here; no session was changed.', 'info');
            return;
        }

        // --- account deletion request
        if (t.closest('#btn-confirm-delete-request')) {
            closeModal('modal-delete-account');
            toast('Deletion request sent for administrator review.', 'info');
            return;
        }

        // --- misc actions
        var action = t.closest('[data-action]');
        if (action) {
            var actionName = action.getAttribute('data-action');
            if (actionName === 'share-profile') {
                var url = window.location.href;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(function () { toast('Profile link copied.'); },
                        function () { toast('Could not copy the link.', 'error'); });
                } else { toast('Copying is not supported in this browser.', 'error'); }
            }
            return;
        }

        // --- save
        var saveBtn = t.closest('.action-save-settings');
        if (saveBtn) {
            var panel = saveBtn.closest('.settings-tab-panel');
            // Validate only the screen the button lives on, so hidden forms
            // in the same tab never block a save.
            var screen = saveBtn.closest('.sub-view-screen') || panel;
            var invalid = screen ? validateWithin(screen) : null;
            if (invalid) {
                invalid.focus();
                toast('Please fix the highlighted fields.', 'error');
                return;
            }
            var tabName = panel ? panel.getAttribute('data-tab-panel') : '';
            if (tabName === 'profile') {
                snapshotProfile();
                lockAllCards();
                applyNameToUi();
            }
            if (tabName === 'branches' && screen && screen.getAttribute('data-view-name') === 'operating_hours') {
                saveBranchHours();
            }
            toast('Settings saved successfully.');
        }
    });

    /* ------------------------------------------------------------------ *
     * Input / change listeners
     * ------------------------------------------------------------------ */
    document.addEventListener('input', function (e) {
        var el = e.target;
        if (el.matches && el.matches('[data-sync]')) { syncDisplayName(el); }
        if (el.id === 'hospital_description') { updateCounter(); }
        if (el.id === 'br_description') { updateBranchCounter(); }
        if (el.id === 'br_display_name' && !formState.logo) {
            paintAvatar($('#br-logo-avatar'), null, el.value);
        }
        if (el.matches && el.matches('[data-validate]') && el.classList.contains('has-error')) {
            var rule = RULES[el.getAttribute('data-validate')];
            if (rule && el.value.trim() !== '' && rule.test(el.value)) { setError(el, ''); }
        }
        if (el.id === 'settings-search-input') { runSearch(el.value); }
        if (el.matches && el.matches('[data-team-search]')) { applyTeamFilters(teamPanelOf(el)); }
    });

    document.addEventListener('change', function (e) {
        var el = e.target;
        if (el.matches && el.matches('[data-filter-role], [data-filter-status]')) { applyTeamFilters(teamPanelOf(el)); }
        if (el.id === 'quiet_enabled') { syncQuietHours(); }
        // opening-hours: toggling a day re-renders its row (open <-> closed)
        if (el.classList && el.classList.contains('hours-toggle')) {
            var box = el.closest('[data-hours-box]');
            var model = hoursModelFor(box);
            var row = el.closest('[data-hours-index]');
            if (box && model && row) {
                var i = parseInt(row.getAttribute('data-hours-index'), 10);
                var from = $('.hours-from', row), to = $('.hours-to', row);
                if (from) { model[i].from = from.value; }
                if (to) { model[i].to = to.value; }
                model[i].open = el.checked;
                readHours(box, model);          // keep other rows' edits
                model[i].open = el.checked;     // toggled row wins
                renderHours(box, model);
            }
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            var open = openModals();
            if (open.length) {
                var top = open[open.length - 1];
                closeModal(top.id);
                afterModalClosed(top.id);
            }
        }
    });

    /* ------------------------------------------------------------------ *
     * Init
     * ------------------------------------------------------------------ */
    bindDropzone($('#logo-dropzone'), $('#logo-file-input'), function (file) {
        var err = validateFile(file);
        showFileError('logo-error', err);
        if (err) { return; }
        readAsDataUrl(file, function (url) {
            if (!url) { showFileError('logo-error', 'Could not read the file.'); return; }
            pendingLogo = url;
            paintAvatar($('#logo-crop-preview'), url, nameForTarget(logoTarget));
        });
    });

    var docZone = $('#doc-file-input') ? $('#doc-file-input').closest('label') : null;
    bindDropzone(docZone, $('#doc-file-input'), function (file) {
        var err = validateFile(file);
        showFileError('doc-error', err);
        var nameEl = $('#doc-file-name');
        if (err) { pendingDoc = null; if (nameEl) { nameEl.classList.add('hidden'); } return; }
        pendingDoc = file;
        if (nameEl) { nameEl.textContent = file.name; nameEl.classList.remove('hidden'); }
    });

    snapshotProfile();
    updateCounter();
    renderBranchList();
    fillBranchForm(null);
    refreshSessionCount();
    syncQuietHours();
    setTeamTab('team');

    var saved = safeGet(STORAGE_KEY);
    showTab(saved && panelFor(saved) ? saved : 'profile');
})();