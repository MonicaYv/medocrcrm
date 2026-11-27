/**
 * pharmacy_settings.js
 * Handles all Pharmacy Settings tabs, sub-view navigation, modals, toggles,
 * form edit/save, team filtering, search, and state persistence.
 */

(function () {
  'use strict';

  /* ─── Field validation ─────────────────────────────────────────────── */
  function applyFieldValidation(el) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;

    if (el.dataset.validate === 'name') {
      el.value = el.value.replace(/[0-9]/g, '');
    } else if (el.dataset.validate === 'phone') {
      el.value = el.value.replace(/[^0-9+\-\s]/g, '').replace(/(?!^)\+/g, '');
      const digits = el.value.replace(/\D/g, '').length;
      el.setCustomValidity(el.value && (digits < 7 || digits > 15 || !/^\+?[0-9][0-9\s-]*$/.test(el.value))
        ? 'Enter a valid phone number with 7 to 15 digits.' : '');
    } else if (el.dataset.validate === 'pin') {
      el.value = el.value.replace(/[^0-9]/g, '').slice(0, 6);
      el.setCustomValidity(el.value && el.value.length !== 6 ? 'Enter a 6-digit PIN.' : '');
    } else if (el.dataset.validate === 'numeric') {
      const maxLength = Number(el.maxLength);
      const digits = el.value.replace(/[^0-9]/g, '');
      el.value = maxLength > 0 ? digits.slice(0, maxLength) : digits;
    } else if (el.dataset.validate === 'decimal') {
      const value = el.value.replace(/[^0-9.]/g, '');
      const dotIndex = value.indexOf('.');
      el.value = dotIndex < 0
        ? value
        : value.slice(0, dotIndex + 1) + value.slice(dotIndex + 1).replace(/\./g, '').slice(0, 2);
    }
  }

  function setupGlobalFieldValidation() {
    document.addEventListener('input', e => applyFieldValidation(e.target));
    document.addEventListener('change', e => applyFieldValidation(e.target));
    document.addEventListener('paste', e => {
      setTimeout(() => applyFieldValidation(e.target), 0);
    });
  }

  function validateContainer(container) {
    if (!container) return true;
    const invalid = [...container.querySelectorAll('input, select, textarea')]
      .find(el => !el.disabled && !el.checkValidity());
    if (!invalid) return true;
    invalid.reportValidity();
    return false;
  }

  /* ─── Persistence ─────────────────────────────────────────────────── */
  const persistenceKey =
    'pharmacy-settings:' +
    (document.querySelector('[data-settings-user]')?.dataset.settingsUser || 'guest');

  function getSaved() {
    try { return JSON.parse(localStorage.getItem(persistenceKey) || '{}'); }
    catch (_) { return {}; }
  }

  function controlKey(el, idx) {
    if (el.name) return 'name:' + el.name;
    if (el.id)   return 'id:'   + el.id;
    if (!el.dataset.pkey) el.dataset.pkey = 'ctrl-' + idx;
    return el.dataset.pkey;
  }

  function persistPanel(panel) {
    if (!panel) return;
    const saved = getSaved();
    const data  = {};
    panel.querySelectorAll('input, select, textarea').forEach((el, i) => {
      data[controlKey(el, i)] =
        (el.type === 'checkbox' || el.type === 'radio') ? el.checked : el.value;
    });
    saved[panel.dataset.tabPanel] = data;
    localStorage.setItem(persistenceKey, JSON.stringify(saved));
  }

  function restoreAll() {
    const saved = getSaved();
    document.querySelectorAll('.settings-tab-panel').forEach(panel => {
      const data = saved[panel.dataset.tabPanel];
      if (!data) return;
      panel.querySelectorAll('input, select, textarea').forEach((el, i) => {
        const v = data[controlKey(el, i)];
        if (v === undefined) return;
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = Boolean(v);
        else el.value = v;
      });
    });
  }

  /* ─── Toast ────────────────────────────────────────────────────────── */
  function toast(msg, type = 'info') {
    if (window.toastr) {
      toastr.options = { closeButton: true, progressBar: true,
        positionClass: 'toast-top-right', timeOut: '3200' };
      const fn = { success: 'success', warning: 'warning', error: 'error' }[type] || 'info';
      toastr[fn](msg);
    } else {
      console.log('[' + type.toUpperCase() + ']', msg);
    }
  }

  /* ─── Modals ───────────────────────────────────────────────────────── */
  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('hidden');
    el.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('flex');
    el.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function closeAllModals() {
    document.querySelectorAll('.settings-modal-overlay.flex').forEach(m => {
      m.classList.remove('flex');
      m.classList.add('hidden');
    });
    document.body.style.overflow = '';
  }

  /* ─── Tab switching ────────────────────────────────────────────────── */
  const TAB_BTNS   = '[data-tab]';
  const TAB_PANELS = '.settings-tab-panel';

  function activateTab(tabKey) {
    document.querySelectorAll(TAB_BTNS).forEach(btn => {
      const active = btn.dataset.tab === tabKey;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll(TAB_PANELS).forEach(panel => {
      const show = panel.dataset.tabPanel === tabKey;
      panel.classList.toggle('hidden', !show);
      if (show) {
        // reset to main sub-view when switching to a tab
        showSubView(panel, 'main');
      }
    });
  }

  /* ─── Sub-view navigation ──────────────────────────────────────────── */
  function showSubView(panel, viewName) {
    panel.querySelectorAll('.sub-view-screen').forEach(sv => {
      sv.classList.toggle('hidden', sv.dataset.viewName !== viewName);
    });
  }

  function getPanel(tabKey) {
    return document.querySelector(`.settings-tab-panel[data-tab-panel="${tabKey}"]`);
  }

  /* ─── Team inner tabs (Team / Roles) ───────────────────────────────── */
  function activateTeamTab(teamKey) {
    document.querySelectorAll('[data-team-tab]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.teamTab === teamKey);
    });
    document.querySelectorAll('[data-team-panel]').forEach(panel => {
      panel.classList.toggle('hidden', panel.dataset.teamPanel !== teamKey);
    });

    // Show / hide the correct header action button
    const inviteBtn = document.querySelector('[data-team-action="team"]');
    const addRoleBtn = document.querySelector('[data-team-action="roles"]');
    if (inviteBtn) inviteBtn.classList.toggle('hidden', teamKey !== 'team');
    if (addRoleBtn) addRoleBtn.classList.toggle('hidden', teamKey !== 'roles');
  }

  /* ─── Team search & filter ─────────────────────────────────────────── */
  function setupTeamFilter(panelEl) {
    if (!panelEl) return;
    const searchInput   = panelEl.querySelector('[data-team-search]');
    const filterToggle  = panelEl.querySelector('[data-filter-toggle]');
    const filterPanel   = panelEl.querySelector('[data-filter-panel]');
    const filterRole    = panelEl.querySelector('[data-filter-role]');
    const filterStatus  = panelEl.querySelector('[data-filter-status]');
    const resetBtn      = panelEl.querySelector('[data-reset-filters]');
    const filterCount   = panelEl.querySelector('[data-filter-count]');
    const emptyMsg      = panelEl.querySelector('[data-team-empty]');
    const rows          = [...panelEl.querySelectorAll('[data-member-row],[data-role-row]')];

    if (!rows.length) return;

    function applyFilter() {
      const q      = searchInput  ? searchInput.value.toLowerCase() : '';
      const role   = filterRole   ? filterRole.value   : '';
      const status = filterStatus ? filterStatus.value : '';
      let visible  = 0;

      rows.forEach(row => {
        const name  = (row.querySelector('[data-member-name],[data-role-member]')?.textContent || '').toLowerCase();
        const email = (row.querySelector('[data-member-email],[data-role-email]')?.textContent || '').toLowerCase();
        const rRole = row.dataset.role   || '';
        const rStat = row.dataset.status || '';

        const matchQ = !q || name.includes(q) || email.includes(q);
        const matchR = !role   || rRole === role;
        const matchS = !status || rStat === status;
        const show   = matchQ && matchR && matchS;

        row.classList.toggle('hidden', !show);
        if (show) visible++;
      });

      if (emptyMsg) emptyMsg.classList.toggle('hidden', visible > 0);

      // Update active filter count badge
      const active = [role, status].filter(Boolean).length;
      if (filterCount) {
        filterCount.textContent = active;
        filterCount.classList.toggle('hidden', active === 0);
      }
    }

    if (filterToggle && filterPanel) {
      filterToggle.addEventListener('click', () => {
        const open = filterPanel.classList.toggle('hidden');
        filterToggle.setAttribute('aria-expanded', !open ? 'true' : 'false');
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (filterRole)   filterRole.value   = '';
        if (filterStatus) filterStatus.value = '';
        if (searchInput)  searchInput.value  = '';
        applyFilter();
      });
    }

    [searchInput, filterRole, filterStatus].forEach(el => {
      if (el) el.addEventListener('input', applyFilter);
    });
  }

  /* ─── Edit-card toggle ─────────────────────────────────────────────── */
  function setupEditCards() {
    document.querySelectorAll('[data-edit-card]').forEach(card => {
      const cardKey = card.dataset.editCard;
      const toggle  = card.querySelector(`[data-edit-toggle="${cardKey}"]`);
      if (!toggle) return;
      const fields  = card.querySelectorAll('.settings-field');
      let editing   = false;

      toggle.addEventListener('click', () => {
        if (editing && !validateContainer(card)) return;
        editing = !editing;
        fields.forEach(f => { f.disabled = !editing; });
        const lbl = toggle.querySelector('[data-edit-label]') || toggle;
        if (lbl) lbl.textContent = editing ? 'Save Changes' : 'Edit Details';
        if (!editing) {
          persistPanel(card.closest('.settings-tab-panel'));
          toast('Changes saved.', 'success');
        }
      });
    });
  }

  /* ─── Save / discard buttons ───────────────────────────────────────── */
  function setupSaveDiscard() {
    document.querySelectorAll('.action-save-settings').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.closest('.settings-tab-panel');
        if (!validateContainer(panel)) return;
        if (panel) persistPanel(panel);
        toast('Settings saved successfully.', 'success');
      });
    });

    const discard = document.getElementById('btn-discard-profile');
    if (discard) {
      discard.addEventListener('click', () => {
        const saved = getSaved();
        delete saved['ph_profile'];
        localStorage.setItem(persistenceKey, JSON.stringify(saved));
        toast('Changes discarded.', 'warning');
        location.reload();
      });
    }
  }

  /* ─── Description char counter ─────────────────────────────────────── */
  function setupCounters() {
    document.querySelectorAll('textarea[maxlength]').forEach(ta => {
      const id  = ta.id + '-counter';
      const max = Number(ta.maxlength);
      const el  = document.getElementById(id);
      if (!el || !max) return;
      const update = () => { el.textContent = ta.value.length + '/' + max; };
      ta.addEventListener('input', update);
      update();
    });
  }

  /* ─── Deactivate access ─────────────────────────────────────────────── */
  function setupDeactivate() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.action-open-deactivate');
      if (!btn) return;
      const name = btn.dataset.member || 'This member';
      const el   = document.getElementById('deactivate-name');
      if (el) el.textContent = name;
      openModal('modal-deactivate');
    });

    const confirmBtn = document.getElementById('btn-confirm-deactivate');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        closeModal('modal-deactivate');
        toast('Access deactivated.', 'success');
      });
    }
  }

  /* ─── Assign role modal prefill ─────────────────────────────────────── */
  function setupAssignRole() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-open-modal="modal-assign-role"]');
      if (!btn) return;
      const name  = btn.dataset.member || '';
      const email = btn.dataset.email  || '';
      const nameEl  = document.getElementById('assign_name');
      const emailEl = document.getElementById('assign_email');
      if (nameEl)  nameEl.value  = name;
      if (emailEl) emailEl.value = email;
    });

    const btn = document.getElementById('btn-assign-role');
    if (btn) {
      btn.addEventListener('click', () => {
        closeModal('modal-assign-role');
        toast('Role assigned successfully.', 'success');
      });
    }
  }

  /* ─── Invite member ──────────────────────────────────────────────────── */
  function setupInviteMember() {
    const btn = document.getElementById('btn-send-invite');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const nameEl  = document.getElementById('invite_name');
      const emailEl = document.getElementById('invite_email');
      const name    = nameEl?.value.trim() || '';
      const email   = emailEl?.value.trim() || '';
      if (!validateContainer(document.getElementById('modal-invite-member'))) return;
      if (!name)  { toast('Please enter a full name.', 'error'); return; }
      if (!email || !/\S+@\S+\.\S+/.test(email)) { toast('Please enter a valid email.', 'error'); return; }
      closeModal('modal-invite-member');
      toast('Invitation sent to ' + email, 'success');
      if (nameEl)  nameEl.value  = '';
      if (emailEl) emailEl.value = '';
    });
  }

  /* ─── Add role (modal) ───────────────────────────────────────────────── */
  function setupAddRole() {
    const btn = document.getElementById('btn-add-role');
    if (!btn) return;
    btn.addEventListener('click', () => {
      closeModal('modal-add-role');
      toast('Role added successfully.', 'success');
    });
  }

  /* ─── Save branch (modal) ────────────────────────────────────────────── */
  function setupAddBranch() {
    const btn = document.getElementById('btn-save-branch');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!validateContainer(document.getElementById('modal-add-branch'))) return;
      closeModal('modal-add-branch');
      toast('Branch saved successfully.', 'success');
    });

    // Day-of-week toggles in branch modal
    document.querySelectorAll('.ph-day-btn').forEach(d => {
      d.addEventListener('click', () => d.classList.toggle('active'));
    });
  }

  /* ─── Document actions ───────────────────────────────────────────────── */
  function setupDocumentActions() {
    // File picker display
    const docInput  = document.getElementById('doc-file-input');
    const docName   = document.getElementById('doc-file-name');
    const docError  = document.getElementById('doc-error');
    if (docInput) {
      docInput.addEventListener('change', () => {
        const file = docInput.files[0];
        if (!file) return;
        if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024) {
          if (docError) {
            docError.textContent = file.size > 2 * 1024 * 1024
              ? 'File exceeds 2 MB limit.'
              : 'Choose a PNG or JPG image.';
            docError.classList.remove('hidden');
          }
          if (docName)  docName.classList.add('hidden');
          docInput.value = '';
          return;
        }
        if (docError) docError.classList.add('hidden');
        if (docName)  { docName.textContent = file.name; docName.classList.remove('hidden'); }
      });
    }

    /* ─── Pharmacy logo upload / removal ──────────────────────────────── */
    function setupLogoActions() {
      const input = document.getElementById('pharmacy-logo-input');
      const name = document.getElementById('pharmacy-logo-file-name');
      const error = document.getElementById('pharmacy-logo-error');
      const modalPreview = document.getElementById('pharmacy-logo-modal-preview');
      const mainPreview = document.getElementById('pharmacy-logo-preview');
      const identityAvatar = document.getElementById('pharmacy-identity-avatar');
      const publicLogo = document.getElementById('pharmacy-public-logo');
      let pendingLogoUrl = null;

      const updatePreview = (element, src, alt) => {
        if (!element) return;
        const image = document.createElement('img');
        image.src = src;
        image.alt = alt;
        image.className = 'w-full h-full object-cover rounded-full';
        element.replaceChildren(image);
      };

      input?.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) return;
        if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024) {
          pendingLogoUrl = null;
          input.value = '';
          if (error) {
            error.textContent = file.size > 2 * 1024 * 1024
              ? 'The selected image must be 2 MB or smaller.'
              : 'Choose a PNG or JPG image.';
            error.classList.remove('hidden');
          }
          if (name) name.textContent = 'No file selected';
          return;
        }

        if (error) error.classList.add('hidden');
        if (name) name.textContent = file.name;
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          if (typeof reader.result !== 'string') {
            pendingLogoUrl = null;
            if (error) {
              error.textContent = 'The selected image could not be read. Please choose another file.';
              error.classList.remove('hidden');
            }
            return;
          }
          pendingLogoUrl = reader.result;
          updatePreview(modalPreview, pendingLogoUrl, 'Selected pharmacy logo');
        });
        reader.addEventListener('error', () => {
          pendingLogoUrl = null;
          if (error) {
            error.textContent = 'The selected image could not be read. Please choose another file.';
            error.classList.remove('hidden');
          }
        });
        reader.readAsDataURL(file);
      });

      document.getElementById('confirm-pharmacy-logo')?.addEventListener('click', () => {
        if (!pendingLogoUrl) {
          toast('Please select a PNG or JPG file first.', 'warning');
          return;
        }
        updatePreview(mainPreview, pendingLogoUrl, 'Pharmacy logo');
        updatePreview(identityAvatar, pendingLogoUrl, 'Pharmacy logo');
        updatePreview(publicLogo, pendingLogoUrl, 'Pharmacy logo');
        closeModal('modal-upload-logo');
        toast('Pharmacy logo updated.', 'success');
      });

      document.getElementById('confirm-remove-pharmacy-logo')?.addEventListener('click', () => {
        pendingLogoUrl = null;
        if (input) input.value = '';
        if (name) name.textContent = 'No file selected';
        if (error) error.classList.add('hidden');
        [mainPreview, identityAvatar, publicLogo, modalPreview].forEach(element => {
          if (element) element.textContent = 'MP';
        });
        closeModal('modal-remove-logo');
        toast('Pharmacy logo removed.', 'info');
      });
    }

    const sendBtn = document.getElementById('btn-send-document');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        if (!docInput?.files?.[0]) {
          if (docError) {
            docError.textContent = 'Please select a PNG or JPG file before uploading.';
            docError.classList.remove('hidden');
          }
          toast('Please select a PNG or JPG file before uploading.', 'warning');
          return;
        }
        closeModal('modal-add-document');
        toast('Document uploaded for review.', 'success');
      });
    }

    const replaceBtn = document.getElementById('btn-confirm-replace');
    if (replaceBtn) {
      replaceBtn.addEventListener('click', () => {
        closeModal('modal-replace-document');
        toast('Replacement uploaded. Status set to Pending.', 'warning');
      });
    }
    setupLogoActions();
  }

  /* ─── Active sessions sign-out / confirm buttons ─────────────────────── */
  function setupSessionModals() {
    const signoutConfirm = document.getElementById('btn-confirm-signout');
    if (signoutConfirm) {
      signoutConfirm.addEventListener('click', () => {
        closeModal('modal-signout');
        toast('Signed out successfully.', 'info');
      });
    }

    const deleteConfirm = document.getElementById('btn-confirm-delete-request');
    if (deleteConfirm) {
      deleteConfirm.addEventListener('click', () => {
        closeModal('modal-delete-account');
        toast('Account deletion request submitted.', 'warning');
      });
    }
  }

  /* ─── Settings search ────────────────────────────────────────────────── */
  function setupSettingsSearch() {
    const input = document.getElementById('settings-search-input');
    if (!input) return;
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      if (!q) {
        document.querySelectorAll('.st-card, .st-row').forEach(el => el.style.opacity = '');
        return;
      }
      document.querySelectorAll('.st-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.opacity = text.includes(q) ? '1' : '0.35';
      });
    });
  }

  /* ─── 24×7 toggle disables time inputs ──────────────────────────────── */
  function setup24x7Toggle() {
    const toggle    = document.getElementById('ph_open_24x7');
    const openTime  = document.getElementById('ph_open_time');
    const closeTime = document.getElementById('ph_close_time');
    if (!toggle) return;
    const update = () => {
      const is24 = toggle.checked;
      if (openTime)  openTime.disabled  = is24;
      if (closeTime) closeTime.disabled = is24;
    };
    toggle.addEventListener('change', update);
    update();
  }

  /* ─── Global delegated click router ─────────────────────────────────── */
  function setupDelegated() {
    document.addEventListener('click', e => {
      /* Tab buttons */
      const tabBtn = e.target.closest('[data-tab]');
      if (tabBtn && tabBtn.classList.contains('settings-tab-btn')) {
        activateTab(tabBtn.dataset.tab);
        return;
      }

      /* Team inner tabs */
      const teamTab = e.target.closest('[data-team-tab]');
      if (teamTab) { activateTeamTab(teamTab.dataset.teamTab); return; }

      /* data-nav-tab = navigate tab + subview */
      const navBtn = e.target.closest('[data-nav-tab]');
      if (navBtn) {
        const { navTab, navSubview, roleFrom } = navBtn.dataset;
        // If the button also closes a modal, close it first
        const closeId = navBtn.dataset.closeModal;
        if (closeId) closeModal(closeId);
        activateTab(navTab);
        const p = getPanel(navTab);
        if (p && navSubview) showSubView(p, navSubview);
        // Prefill role name in edit_role subview if requested
        if (roleFrom && navSubview === 'edit_role') {
          const srcEl = document.querySelector(roleFrom);
          const tgtEl = document.getElementById('edit-role-name');
          if (srcEl && tgtEl) tgtEl.value = srcEl.value;
        }
        return;
      }

      /* data-back-tab = back navigation */
      const backBtn = e.target.closest('[data-back-tab]');
      if (backBtn) {
        const { backTab, backSubview } = backBtn.dataset;
        activateTab(backTab);
        const p = getPanel(backTab);
        if (p && backSubview) showSubView(p, backSubview);
        return;
      }

      /* Open modal */
      const openBtn = e.target.closest('[data-open-modal]');
      if (openBtn) { openModal(openBtn.dataset.openModal); return; }

      /* Close modal */
      const closeBtn = e.target.closest('[data-close-modal]');
      if (closeBtn) { closeModal(closeBtn.dataset.closeModal); return; }

      /* Overlay backdrop click */
      if (e.target.classList.contains('settings-modal-overlay')) {
        closeAllModals();
        return;
      }
    });

    /* Escape key closes topmost modal */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAllModals();
    });
  }

  /* ─── Identity strip sync ────────────────────────────────────────────── */
  function setupIdentitySync() {
    const nameInput = document.getElementById('ph_store_name');
    const nameEl    = document.getElementById('identity-name');
    if (nameInput && nameEl) {
      nameInput.addEventListener('input', () => {
        if (nameInput.value.trim()) nameEl.textContent = nameInput.value.trim();
      });
    }
  }

  /* ─── Init ───────────────────────────────────────────────────────────── */
  function init() {
    // Start on first tab
    activateTab('ph_profile');
    activateTeamTab('team');

    // Setup team filter for both sub-panels
    document.querySelectorAll('[data-team-panel]').forEach(p => setupTeamFilter(p));

    setupDelegated();
    setupEditCards();
    setupSaveDiscard();
    setupCounters();
    setupDeactivate();
    setupAssignRole();
    setupInviteMember();
    setupAddRole();
    setupAddBranch();
    setupDocumentActions();
    setupSessionModals();
    setupSettingsSearch();
    setup24x7Toggle();
    setupIdentitySync();
    setupGlobalFieldValidation();
    restoreAll();
    document.querySelectorAll('[data-validate]').forEach(applyFieldValidation);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
