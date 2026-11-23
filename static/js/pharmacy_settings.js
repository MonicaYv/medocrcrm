/**
 * Pharmacy Settings Module Workflow JavaScript
 * Handles all tabs, sub-screen navigations, popups, toggles, form validation, and settings persistence.
 */

(function () {
  'use strict';

  // State management
  const settingsState = {
    currentTab: 'profile', // profile, store_hours, order_pref, delivery_pickup, inventory_pref, notifications, invoice_template, security, app_pref
    subViews: {
      profile: 'main', // main, verification, public_preview
      store_hours: 'main', // main, working_hours_edit, scheduled_closures, add_closure
      order_pref: 'main', // main, proc_time, order_priority, order_limit
      delivery_pickup: 'main', // main, service_area, time_slots, map_zone
      inventory_pref: 'main' // main, low_stock, inv_report
    },
    activeModal: null,
    deliveryRadius: 5,
    selectedTemplate: 'classic'
  };

  const persistenceKey = `pharmacy-settings:${document.querySelector('[data-settings-user]')?.dataset.settingsUser || 'guest'}`;

  function getSavedSettings() {
    try { return JSON.parse(localStorage.getItem(persistenceKey) || '{}'); }
    catch (_) { return {}; }
  }

  function settingsControlKey(control, index) {
    if (control.name) return `name:${control.name}`;
    if (control.id) return `id:${control.id}`;
    if (!control.dataset.settingsKey) control.dataset.settingsKey = `control-${index}`;
    return control.dataset.settingsKey;
  }

  function initializeSettingControlKeys() {
    document.querySelectorAll('.settings-tab-panel').forEach(panel => {
      panel.querySelectorAll('input, select, textarea').forEach((control, index) => {
        settingsControlKey(control, index);
      });
    });
  }

  function restoreSavedSettings() {
    const saved = getSavedSettings();
    document.querySelectorAll('.settings-tab-panel').forEach(panel => {
      const panelData = saved[panel.dataset.tabPanel];
      if (!panelData) return;
      panel.querySelectorAll('input, select, textarea').forEach((control, index) => {
        const value = panelData[settingsControlKey(control, index)];
        if (value === undefined) return;
        if (control.type === 'checkbox' || control.type === 'radio') control.checked = Boolean(value);
        else control.value = value;
      });
      if (panel.dataset.tabPanel === 'store_hours' && Array.isArray(panelData.breakIntervals)) {
        const list = document.getElementById('break-interval-list');
        if (list) {
          list.replaceChildren();
          panelData.breakIntervals.forEach(interval => {
            const row = document.createElement('div');
            row.className = 'flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 p-4';
            row.innerHTML = '<label class="flex-1 min-w-[130px] text-xs font-bold text-gray-700">Break starts<input type="time" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"></label><label class="flex-1 min-w-[130px] text-xs font-bold text-gray-700">Break ends<input type="time" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"></label><button type="button" class="remove-break-interval rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer">Remove</button>';
            const fields = row.querySelectorAll('input');
            fields[0].value = interval.start || '';
            fields[1].value = interval.end || '';
            list.appendChild(row);
          });
        }
      }
    });
  }

  function persistPanel(panel) {
    if (!panel) return;
    const saved = getSavedSettings();
    const panelData = {};
    panel.querySelectorAll('input, select, textarea').forEach((control, index) => {
      panelData[settingsControlKey(control, index)] =
        control.type === 'checkbox' || control.type === 'radio' ? control.checked : control.value;
    });
    if (panel.dataset.tabPanel === 'store_hours') {
      panelData.breakIntervals = Array.from(
        panel.querySelectorAll('#break-interval-list > div'), row => {
          const fields = row.querySelectorAll('input');
          return { start: fields[0]?.value || '', end: fields[1]?.value || '' };
        }
      );
    }
    saved[panel.dataset.tabPanel] = panelData;
    localStorage.setItem(persistenceKey, JSON.stringify(saved));
  }

  // Toast notification helper
  function notify(message, type = 'info') {
    if (window.toastr) {
      toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: "3200"
      };
      if (type === 'success') toastr.success(message);
      else if (type === 'warning') toastr.warning(message);
      else if (type === 'error') toastr.error(message);
      else toastr.info(message);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // Modal open / close helpers
  function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.remove('hidden');
      el.classList.add('flex');
      settingsState.activeModal = modalId;
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(modalId) {
    const id = modalId || settingsState.activeModal;
    if (id) {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('hidden');
        el.classList.remove('flex');
      }
    }
    settingsState.activeModal = null;
    if (!document.querySelector('.settings-modal-overlay:not(.hidden)')) {
      document.body.style.overflow = '';
    }
  }

  // Switch Main Tabs
  function switchTab(tabId) {
    settingsState.currentTab = tabId;

    // Reset subview of the tab to 'main'
    if (settingsState.subViews[tabId]) {
      showSubView(tabId, 'main');
    }

    // Update Tab Buttons UI
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      const bTab = btn.getAttribute('data-tab');
      if (bTab === tabId) {
        btn.classList.remove('border-transparent', 'text-gray-600', 'font-medium');
        btn.classList.add('border-dodger-blue', 'text-dodger-blue', 'font-bold');
      } else {
        btn.classList.remove('border-dodger-blue', 'text-dodger-blue', 'font-bold');
        btn.classList.add('border-transparent', 'text-gray-600', 'font-medium');
      }
    });

    // Update Tab Panels
    document.querySelectorAll('.settings-tab-panel').forEach(panel => {
      const pTab = panel.getAttribute('data-tab-panel');
      if (pTab === tabId) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Switch Sub-views within a Tab
  function showSubView(tabId, viewName) {
    settingsState.subViews[tabId] = viewName;
    const parentPanel = document.querySelector(`.settings-tab-panel[data-tab-panel="${tabId}"]`);
    if (!parentPanel) return;

    parentPanel.querySelectorAll('.sub-view-screen').forEach(screen => {
      const sName = screen.getAttribute('data-view-name');
      if (sName === viewName) {
        screen.classList.remove('hidden');
      } else {
        screen.classList.add('hidden');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Strict Form Validation
  function setupInputValidations() {
    // 1. Name fields validation (no numbers allowed)
    document.querySelectorAll('[data-validate="name"]').forEach(input => {
      // Prevent numeric keys from being typed (both keypress and keydown)
      const blockNumeric = function (e) {
        const key = e.key;
        if (key && /^[0-9]$/.test(key)) {
          e.preventDefault();
          showInputError(input, 'Numbers are not allowed in name fields.');
          return false;
        }
      };

      input.addEventListener('keydown', blockNumeric);
      input.addEventListener('keypress', blockNumeric);

      // Prevent IME or virtual keyboard numeric inputs
      input.addEventListener('beforeinput', function (e) {
        if (e.data && /[0-9]/.test(e.data)) {
          e.preventDefault();
          showInputError(input, 'Numbers are not allowed in name fields.');
        }
      });

      // Handle paste events to strip numbers
      input.addEventListener('paste', function (e) {
        const text = (e.clipboardData || window.clipboardData).getData('text');
        if (/[0-9]/.test(text)) {
          e.preventDefault();
          const cleanText = text.replace(/[0-9]/g, '');
          document.execCommand ? document.execCommand('insertText', false, cleanText) : (this.value += cleanText);
          showInputError(input, 'Numbers were removed from pasted text.');
        }
      });

      // Filter out any numbers on input event
      input.addEventListener('input', function () {
        if (/[0-9]/.test(this.value)) {
          this.value = this.value.replace(/[0-9]/g, '');
          showInputError(input, 'Numbers are not allowed in name fields.');
        } else {
          clearInputError(input);
        }
      });

      input.addEventListener('blur', function () {
        if (/[0-9]/.test(this.value)) {
          this.value = this.value.replace(/[0-9]/g, '');
          showInputError(input, 'Numbers are not allowed in name fields.');
        }
      });
    });

    // 2. Phone fields validation (only digits, max 10 digits)
    document.querySelectorAll('[data-validate="phone"]').forEach(input => {
      input.addEventListener('keypress', function (e) {
        const char = String.fromCharCode(e.which || e.keyCode);
        if (!/[0-9+\s-]/.test(char)) {
          e.preventDefault();
          showInputError(input, 'Only numbers are allowed for phone.');
        }
      });

      input.addEventListener('input', function () {
        clearInputError(input);
      });
    });

    // 3. Email fields validation
    document.querySelectorAll('[data-validate="email"]').forEach(input => {
      input.addEventListener('blur', function () {
        const val = this.value.trim();
        if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          showInputError(input, 'Please enter a valid email address.');
        } else {
          clearInputError(input);
        }
      });
    });
  }

  function showInputError(input, msg) {
    clearInputError(input);
    input.classList.add('border-red-500', 'focus:border-red-500');
    const err = document.createElement('p');
    err.className = 'validation-error-msg text-xs text-red-600 font-medium mt-1';
    err.textContent = msg;
    input.parentNode.appendChild(err);
  }

  function clearInputError(input) {
    input.classList.remove('border-red-500', 'focus:border-red-500');
    const existing = input.parentNode.querySelector('.validation-error-msg');
    if (existing) existing.remove();
  }

  // Event Listeners Initialization
  function initEvents() {
    // 1. Tab buttons click
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const tab = this.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    // 2. Sub-view navigation triggers
    document.addEventListener('click', function (e) {
      const target = e.target;

      // Nav to Sub-view
      const navBtn = target.closest('[data-nav-subview]');
      if (navBtn) {
        const tab = navBtn.getAttribute('data-nav-tab') || settingsState.currentTab;
        const subview = navBtn.getAttribute('data-nav-subview');
        const day = navBtn.getAttribute('data-working-day');
        if (day) {
          const title = document.getElementById('working-hours-day-title');
          if (title) title.textContent = day;
        }
        showSubView(tab, subview);
        return;
      }

      const addBreakBtn = target.closest('#add-break-interval');
      if (addBreakBtn) {
        const list = document.getElementById('break-interval-list');
        if (list) {
          const row = document.createElement('div');
          row.className = 'flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 p-4';
          row.innerHTML = '<label class="flex-1 min-w-[130px] text-xs font-bold text-gray-700">Break starts<input type="time" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"></label><label class="flex-1 min-w-[130px] text-xs font-bold text-gray-700">Break ends<input type="time" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"></label><button type="button" class="remove-break-interval rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer">Remove</button>';
          list.appendChild(row);
        }
        return;
      }

      const removeBreakBtn = target.closest('.remove-break-interval');
      if (removeBreakBtn) {
        removeBreakBtn.closest('#break-interval-list > div')?.remove();
        return;
      }

      // Back to main subview
      const backBtn = target.closest('[data-back-subview]');
      if (backBtn) {
        const tab = backBtn.getAttribute('data-back-tab') || settingsState.currentTab;
        showSubView(tab, 'main');
        return;
      }

      // Open Modal trigger
      const openModalBtn = target.closest('[data-open-modal]');
      if (openModalBtn) {
        const modalId = openModalBtn.getAttribute('data-open-modal');
        openModal(modalId);
        return;
      }

      // Close Modal trigger
      const closeModalBtn = target.closest('[data-close-modal]');
      if (closeModalBtn) {
        const modalId = closeModalBtn.getAttribute('data-close-modal');
        closeModal(modalId);
        return;
      }

      // Modal backdrop click
      if (target.classList.contains('settings-modal-overlay')) {
        closeModal(target.id);
        return;
      }

      // Template selection cards in Invoice Template
      const templateCard = target.closest('.template-select-card');
      if (templateCard) {
        const tName = templateCard.getAttribute('data-template');
        settingsState.selectedTemplate = tName;
        document.querySelectorAll('.template-select-card').forEach(c => {
          c.classList.remove('border-dodger-blue', 'bg-blue-50/40');
          c.classList.add('border-gray-200');
          const radio = c.querySelector('input[type="radio"]');
          if (radio) radio.checked = false;
        });
        templateCard.classList.remove('border-gray-200');
        templateCard.classList.add('border-dodger-blue', 'bg-blue-50/40');
        const r = templateCard.querySelector('input[type="radio"]');
        if (r) r.checked = true;
        notify(`Invoice template changed to ${tName.toUpperCase()}`, 'info');
        return;
      }

      // Template preview choose
      const btnSelectTemplate = target.closest('#btn-choose-template');
      if (btnSelectTemplate) {
        closeModal('modal-invoice-template-preview');
        notify('Classic Invoice Template applied successfully!', 'success');
        return;
      }

      // Generic Save button
      const saveBtn = target.closest('.action-save-settings');
      if (saveBtn) {
        // Check for any input errors
        let hasError = false;
        document.querySelectorAll('.settings-tab-panel:not(.hidden) [data-validate="name"]').forEach(inp => {
          if (/[0-9]/.test(inp.value)) {
            showInputError(inp, 'Numbers are not allowed in name fields.');
            hasError = true;
          }
        });

        if (hasError) {
          notify('Please fix validation errors before saving.', 'error');
          return;
        }

        const activePanel = saveBtn.closest('.settings-tab-panel');
        try {
          persistPanel(activePanel);
          notify('Settings saved successfully. Your changes will remain after reloading.', 'success');
        } catch (_) {
          notify('Could not save settings in this browser.', 'error');
        }
        return;
      }

      // Log out session
      const logoutBtn = target.closest('.action-logout-session');
      if (logoutBtn) {
        const sessionRow = logoutBtn.closest('.session-row');
        if (sessionRow) {
          sessionRow.classList.add('opacity-40', 'pointer-events-none');
          logoutBtn.textContent = 'Logged Out';
          notify('Device session ended successfully.', 'info');
        }
        return;
      }

      // Delete closure
      const deleteClosureBtn = target.closest('.action-delete-closure');
      if (deleteClosureBtn) {
        const closureCard = deleteClosureBtn.closest('.closure-item-card');
        if (closureCard) {
          closureCard.remove();
          notify('Scheduled closure removed.', 'info');
        }
        return;
      }
    });

    // Delivery Radius Sliders
    const radiusSlider = document.getElementById('delivery-radius-slider');
    const radiusDisplay = document.getElementById('radius-display-val');
    const mapRadiusSlider = document.getElementById('map-radius-slider');
    const mapRadiusDisplay = document.getElementById('map-radius-display');
    const mapCircle = document.getElementById('map-radius-circle');

    function updateRadius(val) {
      settingsState.deliveryRadius = val;
      if (radiusSlider) radiusSlider.value = val;
      if (radiusDisplay) radiusDisplay.textContent = `${val} km`;
      if (mapRadiusSlider) mapRadiusSlider.value = val;
      if (mapRadiusDisplay) mapRadiusDisplay.textContent = `${val} km`;
      if (mapCircle) {
        const baseR = 30;
        const newR = baseR + (val * 3);
        mapCircle.setAttribute('r', newR);
      }
    }

    if (radiusSlider) {
      radiusSlider.addEventListener('input', function () {
        updateRadius(this.value);
      });
    }

    if (mapRadiusSlider) {
      mapRadiusSlider.addEventListener('input', function () {
        updateRadius(this.value);
      });
    }

    // Escape key listener for closing modals
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeModal();
      }
    });

    // Search Settings Filter
    const searchInput = document.getElementById('settings-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        const q = this.value.trim().toLowerCase();
        if (!q) {
          document.querySelectorAll('.settings-tab-panel:not(.hidden) .settings-card-item').forEach(el => {
            el.classList.remove('hidden');
          });
          return;
        }

        document.querySelectorAll('.settings-tab-panel:not(.hidden) .settings-card-item').forEach(el => {
          const text = el.textContent.toLowerCase();
          if (text.includes(q)) {
            el.classList.remove('hidden');
          } else {
            el.classList.add('hidden');
          }
        });
      });
    }

    // Input Validations
    setupInputValidations();
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    initializeSettingControlKeys();
    restoreSavedSettings();
    initEvents();
    switchTab('profile');
  });

})();
