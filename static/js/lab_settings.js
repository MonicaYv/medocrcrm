/**
 * lab_settings.js
 * Handles all Lab Settings tabs, sub-view navigation, popups/modals,
 * working switches/toggles, branch management, team filtering, notifications,
 * report preview, field-level validations, and localStorage persistence.
 */

(function () {
  'use strict';

  /* ─── Field-Level Validations ──────────────────────────────────────── */
  function applyFieldValidation(el) {
    if (!el) return;

    // Names: Disallow numbers
    if (el.dataset.validate === 'name' || el.name === 'lb_display_name' || el.name === 'lb_legal_name' ||
        el.id === 'inv_name' || el.id === 'asg_name' || el.id === 'br_name' || el.name === 'rpt_display_name') {
      const sanitized = el.value.replace(/[0-9]/g, '');
      if (el.value !== sanitized) el.value = sanitized;
    }

    // Phones: Allow only digits, +, -, and spaces (no letters or other characters)
    if (el.dataset.validate === 'phone' || el.name === 'lb_public_phone' || el.id === 'sec_new_phone' ||
        el.id === 'br_phone' || el.name === 'rpt_public_contact') {
      const sanitized = el.value.replace(/[^0-9+\-\s]/g, '');
      if (el.value !== sanitized) el.value = sanitized;
    }

    // PIN code: max 6 digits
    if (el.dataset.validate === 'pin' || el.name === 'lb_pin' || el.id === 'br_pin') {
      const sanitized = el.value.replace(/[^0-9]/g, '').slice(0, 6);
      if (el.value !== sanitized) el.value = sanitized;
    }

    // Year / generic numeric: digits only
    if (el.dataset.validate === 'numeric' || el.name === 'lb_year_est') {
      const sanitized = el.value.replace(/[^0-9]/g, '').slice(0, 4);
      if (el.value !== sanitized) el.value = sanitized;
    }
  }

  function setupGlobalFieldValidation() {
    document.addEventListener('input', e => {
      applyFieldValidation(e.target);
    });

    document.addEventListener('paste', e => {
      setTimeout(() => applyFieldValidation(e.target), 0);
    });
  }

  /* ─── Persistence ─────────────────────────────────────────────────── */
  const persistenceKey =
    'lab-settings:' +
    (document.querySelector('[data-settings-user]')?.dataset.settingsUser || 'guest');

  function getSaved() {
    try { return JSON.parse(localStorage.getItem(persistenceKey) || '{}'); }
    catch (_) { return {}; }
  }

  function controlKey(el, idx) {
    if (el.name) return 'name:' + el.name + (el.type === 'radio' ? ':' + el.value : '');
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
      toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: 'toast-top-right',
        timeOut: '3200',
      };
      const fn = { success: 'success', warning: 'warning', error: 'error' }[type] || 'info';
      toastr[fn](msg);
    } else {
      console.log('[' + type.toUpperCase() + ']', msg);
    }
  }

  /* ─── Modals / Popups (Content-based widths) ────────────────────────── */
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

  /* ─── Team inner tabs (Team / Roles) ───────────────────────────────── */
  function activateTeamTab(teamKey) {
    const isRoles = teamKey === 'lb_team_roles';
    document.querySelectorAll('[data-team-tab]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.teamTab === teamKey);
    });
    document.querySelectorAll('[data-team-panel]').forEach(panel => {
      panel.classList.toggle('hidden', panel.dataset.teamPanel !== teamKey);
    });
    const teamBtn = document.querySelector('[data-team-action="team"]');
    const roleBtn = document.querySelector('[data-team-action="roles"]');
    if (teamBtn) teamBtn.classList.toggle('hidden', isRoles);
    if (roleBtn) {
      roleBtn.classList.toggle('hidden', !isRoles);
      roleBtn.classList.toggle('inline-flex', isRoles);
    }
  }

  /* ─── Team Search & Filter ─────────────────────────────────────────── */
  function setupTeamFilter(panelEl) {
    if (!panelEl) return;
    const searchInput = panelEl.querySelector('[data-team-search]');
    const filterToggle = panelEl.querySelector('[data-filter-toggle]');
    const filterPanel  = panelEl.querySelector('[data-filter-panel]');
    const roleSelect   = panelEl.querySelector('[data-filter-role]');
    const statusSelect = panelEl.querySelector('[data-filter-status]');
    const resetBtn     = panelEl.querySelector('[data-reset-filters]');
    const countEl      = panelEl.querySelector('[data-filter-count]');

    function applyFilter() {
      const q = (searchInput?.value || '').trim().toLowerCase();
      const r = roleSelect?.value || 'all';
      const s = statusSelect?.value || 'all';
      let visible = 0;
      let total = 0;

      panelEl.querySelectorAll('[data-member-row], [data-role-row]').forEach(row => {
        total++;
        const text   = row.textContent.toLowerCase();
        const rowRole   = row.dataset.role || '';
        const rowStatus = row.dataset.status || '';
        const matchQ = !q || text.includes(q);
        const matchR = r === 'all' || rowRole === r;
        const matchS = s === 'all' || rowStatus === s;
        const show   = matchQ && matchR && matchS;
        row.classList.toggle('hidden', !show);
        if (show) visible++;
      });

      if (countEl) countEl.textContent = `${visible} of ${total} shown`;
    }

    searchInput?.addEventListener('input', applyFilter);
    roleSelect?.addEventListener('change', applyFilter);
    statusSelect?.addEventListener('change', applyFilter);
    filterToggle?.addEventListener('click', () => filterPanel?.classList.toggle('hidden'));
    resetBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (roleSelect) roleSelect.value = 'all';
      if (statusSelect) statusSelect.value = 'all';
      applyFilter();
    });
    applyFilter();
  }

  /* ─── Edit Card Toggle ─────────────────────────────────────────────── */
  function setupEditCards() {
    document.querySelectorAll('[data-edit-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key  = btn.dataset.editToggle;
        const card = document.querySelector(`[data-edit-card="${key}"]`);
        if (!card) return;
        const fields = card.querySelectorAll('.settings-field');
        const editing = btn.dataset.editing === 'true';

        fields.forEach(f => { f.disabled = editing; });
        btn.dataset.editing = editing ? 'false' : 'true';
        const label = key === 'address' ? 'Edit Location' : 'Edit Details';
        const span  = btn.querySelector('span:last-child');
        if (span && btn.querySelector('.material-symbols-outlined')) {
          span.textContent = editing ? label : 'Done';
        } else {
          btn.textContent = editing ? label : 'Done';
        }

        if (editing) {
          persistPanel(card.closest('.settings-tab-panel'));
          toast('Section updated.', 'success');
        }
      });
    });
  }

  /* ─── Save / Discard ───────────────────────────────────────────────── */
  function setupSaveDiscard() {
    document.querySelectorAll('.action-save-settings').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.closest('.settings-tab-panel') || document.querySelector('.settings-tab-panel:not(.hidden)');
        persistPanel(panel);
        toast('Settings saved successfully.', 'success');
      });
    });

    document.querySelectorAll('.action-discard-settings').forEach(btn => {
      btn.addEventListener('click', () => {
        restoreAll();
        updateCounters();
        updateWorkspacePreviews();
        toast('Unsaved changes discarded.', 'info');
      });
    });
  }

  /* ─── Character Counters ───────────────────────────────────────────── */
  function updateCounters() {
    document.querySelectorAll('[data-counter]').forEach(el => {
      const target = document.getElementById(el.dataset.counter);
      if (target) target.textContent = String(el.value.length);
    });
  }

  function setupCounters() {
    document.querySelectorAll('[data-counter]').forEach(el => {
      el.addEventListener('input', updateCounters);
    });
    updateCounters();
  }

  /* ─── Identity Sync & Logo Upload ──────────────────────────────────── */
  function setupIdentityAndLogo() {
    const nameInput = document.getElementById('lb_display_name');
    const descInput = document.getElementById('lb_short_desc');
    const idName    = document.getElementById('identity-name');
    const prevName  = document.getElementById('preview-lab-name');
    const prevDesc  = document.getElementById('preview-lab-desc');

    nameInput?.addEventListener('input', () => {
      const val = nameInput.value.trim() || 'Sunrise Diagnostics';
      if (idName) idName.textContent = val;
      if (prevName) prevName.textContent = val;
    });

    descInput?.addEventListener('input', () => {
      if (prevDesc) prevDesc.textContent = descInput.value.trim();
    });

    const logoInput    = document.getElementById('upload-logo-input');
    const logoFileName = document.getElementById('modal-logo-file-name');
    const modalCircle  = document.getElementById('modal-logo-preview-circle');
    const mainPreview  = document.getElementById('lab-logo-preview');
    const idAvatar     = document.getElementById('identity-avatar-badge');
    let pendingLogoUrl = null;

    logoInput?.addEventListener('change', () => {
      const file = logoInput.files?.[0];
      if (!file) return;
      if (logoFileName) logoFileName.textContent = file.name;
      const reader = new FileReader();
      reader.onload = e => {
        pendingLogoUrl = e.target?.result || null;
        if (modalCircle && pendingLogoUrl) {
          modalCircle.innerHTML = `<img src="${pendingLogoUrl}" alt="Logo" class="w-full h-full object-cover rounded-full" />`;
        }
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('confirm-upload-logo')?.addEventListener('click', () => {
      if (!pendingLogoUrl) {
        toast('Please select a PNG or JPG file first.', 'warning');
        return;
      }
      const imgHtml = `<img src="${pendingLogoUrl}" alt="Lab Logo" class="w-full h-full object-cover rounded-full" />`;
      if (mainPreview) mainPreview.innerHTML = imgHtml;
      if (idAvatar) idAvatar.innerHTML = imgHtml;
      closeModal('modal-upload-logo');
      toast('Lab logo updated.', 'success');
    });

    document.getElementById('confirm-remove-logo')?.addEventListener('click', () => {
      pendingLogoUrl = null;
      if (mainPreview) mainPreview.textContent = 'SD';
      if (idAvatar) idAvatar.textContent = 'SD';
      if (modalCircle) modalCircle.textContent = 'SD';
      if (logoFileName) logoFileName.textContent = 'No file selected';
      closeModal('modal-remove-logo');
      toast('Lab logo removed.', 'info');
    });

    document.getElementById('confirm-pin-location')?.addEventListener('click', () => {
      closeModal('modal-pin-location');
      toast('Map pin location updated.', 'success');
    });

    document.getElementById('confirm-delete-account')?.addEventListener('click', () => {
      const inp = document.getElementById('delete-account-confirm-input');
      if ((inp?.value || '').trim().toUpperCase() !== 'DELETE') {
        toast('Please type DELETE to confirm.', 'warning');
        return;
      }
      if (inp) inp.value = '';
      closeModal('modal-delete-account');
      toast('Account deletion request submitted.', 'info');
    });
  }

  /* ─── Verification Documents ───────────────────────────────────────── */
  function setupDocumentActions() {
    let activeDocName = '';

    document.addEventListener('click', e => {
      const viewBtn = e.target.closest('[data-view-doc]');
      if (viewBtn) {
        document.getElementById('doc-preview-title').textContent = viewBtn.dataset.viewDoc;
        document.getElementById('doc-preview-filename').textContent = viewBtn.dataset.docFile || 'document.pdf';
        openModal('modal-document-preview');
        return;
      }
      const repBtn = e.target.closest('[data-replace-doc]');
      if (repBtn) {
        activeDocName = repBtn.dataset.replaceDoc;
        openModal('modal-replace-document');
        return;
      }
      const addBtn = e.target.closest('[data-add-doc]');
      if (addBtn) {
        activeDocName = addBtn.dataset.addDoc;
        document.getElementById('add-doc-title').textContent = 'Add ' + activeDocName;
        openModal('modal-add-document');
      }
    });

    const docFileInput = document.getElementById('add-doc-file-input');
    docFileInput?.addEventListener('change', () => {
      const f = docFileInput.files?.[0];
      const lbl = document.getElementById('add-doc-file-label');
      if (f && lbl) lbl.textContent = f.name;
    });

    document.getElementById('confirm-replace-doc')?.addEventListener('click', () => {
      closeModal('modal-replace-document');
      document.getElementById('add-doc-title').textContent = 'Replace ' + activeDocName;
      openModal('modal-add-document');
    });

    document.getElementById('confirm-add-doc')?.addEventListener('click', () => {
      const row = document.querySelector(`[data-doc-row="${activeDocName}"]`);
      if (row) {
        const dateEl = row.querySelector('[data-doc-date]');
        const stEl   = row.querySelector('[data-doc-status]');
        if (dateEl) dateEl.textContent = 'Just now';
        if (stEl) {
          stEl.className = 'st-pill amber';
          stEl.textContent = 'Pending Review';
        }
      }
      closeModal('modal-add-document');
      toast(`${activeDocName} uploaded for verification.`, 'success');
    });
  }

  /* ─── Operating Hours & Toggles ────────────────────────────────────── */
  function setupOperatingHoursToggles() {
    // Weekday toggles (Mon-Sat)
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
      const toggle = document.querySelector(`[data-day-toggle="${day}"]`);
      if (!toggle) return;

      toggle.addEventListener('change', () => {
        const inputs = document.querySelectorAll(`[data-day-input="${day}"]`);
        inputs.forEach(inp => {
          inp.disabled = !toggle.checked;
          inp.classList.toggle('opacity-50', !toggle.checked);
        });
        toast(`${day} ${toggle.checked ? 'opened' : 'closed'}.`, 'info');
      });
    });

    // Sunday toggle
    const sunToggle = document.querySelector('[data-day-toggle="Sunday"]');
    if (sunToggle) {
      sunToggle.addEventListener('change', () => {
        const statusTxt = document.querySelector('[data-day-status="Sunday"]');
        const sunInputs = document.querySelector('[data-day-inputs-sun]');
        if (sunToggle.checked) {
          if (statusTxt) statusTxt.classList.add('hidden');
          if (sunInputs) {
            sunInputs.classList.remove('hidden');
            sunInputs.classList.add('flex');
          }
          toast('Sunday opened.', 'info');
        } else {
          if (statusTxt) statusTxt.classList.remove('hidden');
          if (sunInputs) {
            sunInputs.classList.remove('flex');
            sunInputs.classList.add('hidden');
          }
          toast('Sunday closed.', 'info');
        }
      });
    }

    document.addEventListener('click', e => {
      const addBreakBtn = e.target.closest('.action-add-break');
      if (addBreakBtn) {
        toast(`Break slot added for ${addBreakBtn.dataset.day}.`, 'info');
      }
    });
  }

  /* ─── Branches Management (Add / Edit Popup) ───────────────────────── */
  function setupBranches() {
    let editingBranchCard = null;

    document.addEventListener('click', e => {
      const editBtn = e.target.closest('[data-edit-branch]');
      if (editBtn) {
        const branchName = editBtn.dataset.editBranch || '';
        editingBranchCard = editBtn.closest('[data-branch-card]');

        document.getElementById('branch-modal-title').textContent = 'Edit Branch — ' + branchName;
        document.getElementById('br_name').value = branchName;

        const addrEl = editingBranchCard?.querySelector('[data-branch-addr-val]');
        if (addrEl && document.getElementById('br_address')) {
          document.getElementById('br_address').value = addrEl.textContent.trim();
        }

        const typeEl = editingBranchCard?.querySelector('[data-branch-type-val]');
        if (typeEl && document.getElementById('br_type')) {
          document.getElementById('br_type').value = typeEl.textContent.trim();
        }

        openModal('modal-add-branch');
        return;
      }
    });

    document.querySelector('[data-open-modal="modal-add-branch"]')?.addEventListener('click', () => {
      editingBranchCard = null;
      document.getElementById('branch-modal-title').textContent = 'Add Branch';
      document.getElementById('add-branch-form')?.reset();
    });

    document.getElementById('add-branch-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('br_name').value.trim();
      const type = document.getElementById('br_type').value;
      const addr = document.getElementById('br_address').value.trim();
      const city = document.getElementById('br_city')?.value.trim() || 'Mumbai';
      const pin  = document.getElementById('br_pin')?.value.trim() || '';
      const fullAddr = `${addr}${city ? ', ' + city : ''}${pin ? ' ' + pin : ''}`;
      const wd   = document.getElementById('br_hours_weekday')?.value.trim() || '7:00 AM – 8:00 PM';
      const sun  = document.getElementById('br_hours_sunday')?.value.trim() || '8:00 AM – 1:00 PM';
      const col  = document.getElementById('br_collection')?.value || 'On-time & Home';

      if (!name || !addr) {
        toast('Please enter a valid branch name and address.', 'warning');
        return;
      }

      if (editingBranchCard) {
        const nameEl = editingBranchCard.querySelector('[data-branch-name-val]');
        const addrEl = editingBranchCard.querySelector('[data-branch-addr-val]');
        const typeEl = editingBranchCard.querySelector('[data-branch-type-val]');
        const hoursEl = editingBranchCard.querySelector('[data-branch-hours-val]');
        if (nameEl) nameEl.textContent = name;
        if (addrEl) addrEl.textContent = fullAddr;
        if (typeEl) {
          typeEl.textContent = type;
          typeEl.className = `st-pill ${type === 'Main' ? 'blue' : 'gray'}`;
        }
        if (hoursEl) hoursEl.textContent = wd;
        toast(`Branch "${name}" updated.`, 'success');
      } else {
        const list = document.getElementById('lab-branches-list');
        if (list) {
          const pillCls = type === 'Main' ? 'blue' : 'gray';
          const card = document.createElement('div');
          card.className = 'border border-slate-200 rounded-xl p-4 flex flex-col gap-3';
          card.dataset.branchCard = '';
          card.dataset.branchId = name;
          card.innerHTML = `
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-full bg-blue-50 text-[#007bff] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="text-[15px] font-bold text-slate-800" data-branch-name-val></h4>
                    <span class="st-pill ${pillCls}" data-branch-type-val>${type}</span>
                  </div>
                  <p class="text-[13px] text-slate-500 mt-0.5" data-branch-addr-val></p>
                </div>
              </div>
              <button type="button" data-edit-branch="${name}" class="text-slate-400 hover:text-[#007bff]" title="Edit Branch">
                <span class="material-symbols-outlined text-[20px]">edit_square</span>
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-[13px]">
              <div><span class="text-slate-400 block text-[11px] uppercase font-semibold">Mon–Sat</span><span class="font-semibold text-slate-700" data-branch-hours-val>${wd}</span></div>
              <div><span class="text-slate-400 block text-[11px] uppercase font-semibold">Sunday</span><span class="font-semibold text-slate-700">${sun}</span></div>
              <div><span class="text-slate-400 block text-[11px] uppercase font-semibold">Collection</span><span class="font-semibold text-emerald-600">${col}</span></div>
            </div>`;
          card.querySelector('[data-branch-name-val]').textContent = name;
          card.querySelector('[data-branch-addr-val]').textContent = fullAddr;
          list.appendChild(card);
        }
        toast(`Branch "${name}" added.`, 'success');
      }
      closeModal('modal-add-branch');
    });
  }

  /* ─── Team & Roles Actions ─────────────────────────────────────────── */
  function setupTeamActions() {
    let targetDeactivateRow = null;

    document.addEventListener('click', e => {
      const assignBtn = e.target.closest('.action-open-assign-role');
      if (assignBtn) {
        const name  = assignBtn.dataset.member || 'Team Member';
        const email = assignBtn.dataset.email || '';
        const role  = assignBtn.dataset.role || 'Lab Manager';
        document.getElementById('asg_name').value  = name;
        document.getElementById('asg_email').value = email;
        document.getElementById('asg_role').value  = role;
        openModal('modal-assign-role');
        return;
      }

      const deactBtn = e.target.closest('.action-open-deactivate');
      if (deactBtn) {
        targetDeactivateRow = deactBtn.closest('tr');
        document.getElementById('deactivate-member-name').textContent =
          deactBtn.dataset.member || 'This member';
        openModal('modal-deactivate');
        return;
      }

      const editRoleBtn = e.target.closest('[data-edit-role-name]');
      if (editRoleBtn) {
        const sel = document.getElementById('edit-role-select');
        if (sel) sel.value = editRoleBtn.dataset.editRoleName;
      }
    });

    document.getElementById('confirm-deactivate')?.addEventListener('click', () => {
      if (targetDeactivateRow) {
        const stCell = targetDeactivateRow.querySelector('[data-member-status-cell]') ||
                       targetDeactivateRow.cells?.[4];
        if (stCell) stCell.innerHTML = '<span class="st-pill gray">Inactive</span>';
        targetDeactivateRow.dataset.status = 'Inactive';
      }
      closeModal('modal-deactivate');
      toast('Access deactivated.', 'info');
    });

    document.getElementById('invite-member-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const name   = document.getElementById('inv_name').value.trim();
      const email  = document.getElementById('inv_email').value.trim();
      const role   = document.getElementById('inv_role').value;
      const branch = document.querySelector('input[name="inv_branch"]:checked')?.value || 'All branches';
      if (!name || !email) return;

      const initials = name.split(/\s+/).map(p => p[0] || '').join('').slice(0, 2).toUpperCase();
      const tbody = document.getElementById('team-members-tbody');
      if (tbody) {
        const tr = document.createElement('tr');
        tr.dataset.memberRow = '';
        tr.dataset.role   = role;
        tr.dataset.status = 'Invited';
        tr.innerHTML = `
          <td><div class="st-member"><span class="st-avatar b">${initials}</span><span class="font-semibold text-slate-800" data-member-name></span></div></td>
          <td data-member-email></td>
          <td data-member-role-cell><span class="st-pill blue"></span></td>
          <td></td>
          <td data-member-status-cell><span class="st-pill amber">Invited</span></td>
          <td>Invited</td>
          <td data-member-actions>
            <button type="button" class="st-act-danger action-open-deactivate" title="Revoke Invitation">
              <span class="material-symbols-outlined text-[19px]">block</span>
            </button>
          </td>`;
        tr.querySelector('[data-member-name]').textContent = name;
        tr.querySelector('[data-member-email]').textContent = email;
        tr.querySelector('[data-member-role-cell] .st-pill').textContent = role;
        tr.cells[3].textContent = branch;
        tr.querySelector('.action-open-deactivate').dataset.member = name;
        tbody.appendChild(tr);
      }
      e.target.reset();
      closeModal('modal-invite-member');
      toast(`Invitation sent to ${email}.`, 'success');
    });

    document.getElementById('assign-role-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('asg_name').value.trim();
      const role = document.getElementById('asg_role').value;
      closeModal('modal-assign-role');
      toast(`Role "${role}" assigned to ${name}.`, 'success');
    });

    document.getElementById('add-role-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const role = document.getElementById('new_role_name').value;
      closeModal('modal-add-role');
      toast(`Role "${role}" added.`, 'success');
    });
  }

  /* ─── Notifications: Recipients & Quiet Hours ──────────────────────── */
  function setupNotifications() {
    document.getElementById('clear-shared-email-btn')?.addEventListener('click', () => {
      const inp = document.getElementById('shared-lab-email-input');
      if (inp) inp.value = '';
    });

    const quietToggle = document.getElementById('quiet-hours-toggle');
    const quietInputs = document.getElementById('quiet-hours-inputs');
    quietToggle?.addEventListener('change', () => {
      const active = quietToggle.checked;
      quietInputs?.querySelectorAll('input').forEach(inp => {
        inp.disabled = !active;
        inp.classList.toggle('opacity-50', !active);
      });
      toast(`Quiet hours ${active ? 'enabled' : 'disabled'}.`, 'info');
    });

    document.getElementById('add-recipient-btn')?.addEventListener('click', () => {
      const inp  = document.getElementById('new-recipient-email');
      const list = document.getElementById('recipients-list');
      const val  = (inp?.value || '').trim();
      if (!val || !val.includes('@')) {
        toast('Please enter a valid email address.', 'warning');
        return;
      }
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50';
      row.dataset.recipientRow = '';
      row.innerHTML = `
        <div class="flex items-center gap-2 min-w-0">
          <span class="material-symbols-outlined text-[18px] text-slate-400">mail</span>
          <span class="text-[13px] font-medium text-slate-700 truncate"></span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="st-pill amber">Pending</span>
          <button type="button" class="text-red-400 hover:text-red-600 action-remove-recipient">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>`;
      row.querySelector('.truncate').textContent = val;
      list?.appendChild(row);
      inp.value = '';
      toast('Recipient added.', 'success');
    });

    document.addEventListener('click', e => {
      const rmBtn = e.target.closest('.action-remove-recipient');
      if (rmBtn) {
        rmBtn.closest('[data-recipient-row]')?.remove();
      }
    });
  }

  /* ─── Report Preferences, Toggles & Preview ────────────────────────── */
  function setupReportPrefs() {
    const prefixInp = document.getElementById('rpt_prefix');
    const prefixEx  = document.getElementById('rpt-prefix-example');

    prefixInp?.addEventListener('input', () => {
      const p = prefixInp.value.trim() || 'RPT-L';
      if (prefixEx) prefixEx.textContent = `${p}-20260930-0184`;
    });

    // Reviewer approval toggle
    const approvalToggle = document.getElementById('rpt_require_approval');
    const reviewerFields = document.getElementById('review-workflow-fields');
    approvalToggle?.addEventListener('change', () => {
      const req = approvalToggle.checked;
      reviewerFields?.querySelectorAll('select').forEach(sel => {
        sel.disabled = !req;
        sel.classList.toggle('opacity-50', !req);
      });
      toast(`Reviewer approval ${req ? 'required' : 'disabled'}.`, 'info');
    });

    document.querySelector('[data-open-modal="modal-report-preview"]')?.addEventListener('click', () => {
      const useLogo = document.getElementById('rpt_use_logo')?.checked ?? true;
      const logoEl  = document.getElementById('rpt-prev-logo');
      if (logoEl) logoEl.classList.toggle('hidden', !useLogo);
      document.getElementById('rpt-prev-name').textContent =
        document.getElementById('rpt_display_name')?.value || 'Sunrise Diagnostics & Pathology';
      document.getElementById('rpt-prev-addr').textContent =
        document.getElementById('rpt_header_addr')?.value || '';
      document.getElementById('rpt-prev-contact').textContent =
        document.getElementById('rpt_public_contact')?.value || '';
      document.getElementById('rpt-prev-footer').textContent =
        document.getElementById('rpt_footer_note')?.value || '';
      document.getElementById('rpt-prev-id').textContent =
        (prefixInp?.value.trim() || 'RPT-L') + '-20260930-0184';
    });
  }

  /* ─── Security Modals ──────────────────────────────────────────────── */
  function setupSecurityModals() {
    let targetDeviceRow = null;

    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-signout-device]');
      if (btn) {
        targetDeviceRow = btn.closest('tr');
        document.getElementById('signout-device-name').textContent = btn.dataset.signoutDevice;
        openModal('modal-signout-device');
      }
    });

    document.getElementById('confirm-signout-device')?.addEventListener('click', () => {
      targetDeviceRow?.remove();
      closeModal('modal-signout-device');
      toast('Device signed out.', 'info');
    });

    document.getElementById('confirm-signout-all-devices')?.addEventListener('click', () => {
      document.querySelectorAll('#active-sessions-tbody [data-session-row]').forEach(r => r.remove());
      closeModal('modal-signout-all-devices');
      toast('All other devices signed out.', 'info');
    });

    document.getElementById('change-email-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const newEmail = document.getElementById('sec_new_email').value.trim();
      if (!newEmail || !newEmail.includes('@')) {
        toast('Please enter a valid email address.', 'warning');
        return;
      }
      document.getElementById('security-email-display').textContent = newEmail;
      document.getElementById('modal-current-email').textContent = newEmail;
      e.target.reset();
      closeModal('modal-change-email');
      toast('Verification code sent to ' + newEmail, 'success');
    });

    document.getElementById('change-phone-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const newPhone = document.getElementById('sec_new_phone').value.trim();
      if (!newPhone) {
        toast('Please enter a valid phone number.', 'warning');
        return;
      }
      document.getElementById('security-phone-display').textContent = newPhone;
      document.getElementById('modal-current-phone').textContent = newPhone;
      e.target.reset();
      closeModal('modal-change-phone');
      toast('Verification code sent to ' + newPhone, 'success');
    });

    const newPwd = document.getElementById('sec_new_pwd');
    const bar    = document.getElementById('pwd-strength-bar');
    newPwd?.addEventListener('input', () => {
      if (!bar) return;
      const len = newPwd.value.length;
      if (len >= 12) { bar.className = 'h-full w-full bg-emerald-500 transition-all'; }
      else if (len >= 8) { bar.className = 'h-full w-2/3 bg-amber-400 transition-all'; }
      else { bar.className = 'h-full w-1/4 bg-red-400 transition-all'; }
    });

    document.getElementById('change-password-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const p1 = document.getElementById('sec_new_pwd').value;
      const p2 = document.getElementById('sec_confirm_pwd').value;
      if (p1.length < 8) {
        toast('Password must be at least 8 characters.', 'error');
        return;
      }
      if (p1 !== p2) {
        toast('Passwords do not match.', 'error');
        return;
      }
      e.target.reset();
      closeModal('modal-change-password');
      toast('Password updated successfully.', 'success');
    });

    let twofaEnabled = true;
    document.getElementById('toggle-twofa-btn')?.addEventListener('click', e => {
      twofaEnabled = !twofaEnabled;
      document.getElementById('twofa-status-text').textContent =
        twofaEnabled ? 'Enabled via Authenticator App' : 'Disabled';
      e.target.textContent = twofaEnabled ? 'Disable' : 'Enable';
      toast('Two-step verification ' + (twofaEnabled ? 'enabled.' : 'disabled.'), 'info');
    });

    document.getElementById('copy-recovery-codes')?.addEventListener('click', () => {
      const codes = Array.from(document.querySelectorAll('#recovery-codes-grid > div'))
        .map(d => d.textContent.trim()).join('\n');
      navigator.clipboard?.writeText(codes);
      toast('Recovery codes copied to clipboard.', 'success');
    });

    document.getElementById('download-recovery-codes')?.addEventListener('click', () => {
      const codes = Array.from(document.querySelectorAll('#recovery-codes-grid > div'))
        .map(d => d.textContent.trim()).join('\n');
      const blob = new Blob([codes], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'sunrise-diagnostics-recovery-codes.txt';
      a.click();
      URL.revokeObjectURL(url);
      toast('Recovery codes downloaded.', 'success');
    });
  }

  /* ─── Workspace Preferences ────────────────────────────────────────── */
  function updateWorkspacePreviews() {
    const fmt = document.querySelector('input[name="ws_export_format"]:checked')?.value || 'pdf';
    const incDate = document.getElementById('ws_include_date')?.checked ?? true;
    const fnEl = document.getElementById('ws-filename-preview');
    if (fnEl) {
      fnEl.textContent = incDate ? `earnings-report-2026-09-30.${fmt}` : `earnings-report.${fmt}`;
    }

    const timeFmt = document.querySelector('input[name="ws_time_format"]:checked')?.value || '12-hour';
    const regEl   = document.getElementById('ws-regional-preview');
    if (regEl) {
      regEl.textContent = timeFmt === '24-hour'
        ? '30 Sep 2026 · 10:00 · ₹1,499'
        : '30 Sep 2026 · 10:00 AM · ₹1,499';
    }
  }

  function setupWorkspacePrefs() {
    document.querySelectorAll('input[name="ws_export_format"], input[name="ws_time_format"], #ws_include_date')
      .forEach(el => el.addEventListener('change', updateWorkspacePreviews));

    document.getElementById('restore-workspace-defaults-btn')?.addEventListener('click', () => {
      document.getElementById('ws_language').value = 'English';
      document.getElementById('ws_timezone').value = 'Asia/Kolkata — IST';
      document.getElementById('ws_date_format').value = 'DD/MM/YYYY';
      document.getElementById('ws_landing_page').value = 'Home';
      document.querySelector('input[name="ws_time_format"][value="12-hour"]').checked = true;
      document.querySelector('input[name="ws_table_density"][value="Comfortable"]').checked = true;
      document.querySelector('input[name="ws_rows_per_page"][value="10"]').checked = true;
      document.querySelector('input[name="ws_sidebar"][value="Expanded"]').checked = true;
      document.querySelector('input[name="ws_reduce_motion"]').checked = false;
      document.querySelector('input[name="ws_export_format"][value="pdf"]').checked = true;
      document.getElementById('ws_include_date').checked = true;
      updateWorkspacePreviews();
      toast('Workspace defaults restored.', 'info');
    });

    updateWorkspacePreviews();
  }

  /* ─── Settings Global Search ───────────────────────────────────────── */
  function setupSettingsSearch() {
    const input = document.getElementById('settings-search-input');
    if (!input) return;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      const activePanel = document.querySelector('.settings-tab-panel:not(.hidden)');
      if (!activePanel) return;

      activePanel.querySelectorAll('.st-card').forEach(card => {
        if (!q) { card.classList.remove('hidden'); return; }
        card.classList.toggle('hidden', !card.textContent.toLowerCase().includes(q));
      });
    });
  }

  /* ─── Global Delegated Clicks ──────────────────────────────────────── */
  document.addEventListener('click', e => {
    const tabBtn = e.target.closest(TAB_BTNS);
    if (tabBtn) { activateTab(tabBtn.dataset.tab); return; }

    const teamTabBtn = e.target.closest('[data-team-tab]');
    if (teamTabBtn) { activateTeamTab(teamTabBtn.dataset.teamTab); return; }

    const navBtn = e.target.closest('[data-nav-tab]');
    if (navBtn) {
      activateTab(navBtn.dataset.navTab);
      const panel = document.querySelector(`.settings-tab-panel[data-tab-panel="${navBtn.dataset.navTab}"]`);
      if (panel && navBtn.dataset.navSubview) showSubView(panel, navBtn.dataset.navSubview);
      return;
    }

    const backBtn = e.target.closest('[data-back-tab]');
    if (backBtn) {
      activateTab(backBtn.dataset.backTab);
      const panel = document.querySelector(`.settings-tab-panel[data-tab-panel="${backBtn.dataset.backTab}"]`);
      if (panel) showSubView(panel, backBtn.dataset.backSubview || 'main');
      return;
    }

    const openBtn = e.target.closest('[data-open-modal]');
    if (openBtn) { openModal(openBtn.dataset.openModal); return; }

    const closeBtn = e.target.closest('[data-close-modal]');
    if (closeBtn) { closeModal(closeBtn.dataset.closeModal); return; }

    if (e.target.classList.contains('settings-modal-overlay')) {
      closeAllModals();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllModals();
  });

  /* ─── Init ─────────────────────────────────────────────────────────── */
  function init() {
    setupGlobalFieldValidation();
    restoreAll();
    setupEditCards();
    setupSaveDiscard();
    setupCounters();
    setupIdentityAndLogo();
    setupDocumentActions();
    setupOperatingHoursToggles();
    setupBranches();
    setupTeamFilter(document.querySelector('[data-tab-panel="lb_team"]'));
    setupTeamActions();
    setupNotifications();
    setupReportPrefs();
    setupSecurityModals();
    setupWorkspacePrefs();
    setupSettingsSearch();
    activateTab('lb_profile');
    activateTeamTab('lb_team_members');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
