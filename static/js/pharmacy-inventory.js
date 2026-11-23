(function () {
    var pageDataElement = document.getElementById('pharmacy-page-data');
    if (!pageDataElement) throw new Error('Pharmacy inventory page data is missing.');
    var pageData = JSON.parse(pageDataElement.textContent);
    window.MEDICINE_MAP = pageData.medicine_map;
    window.PHARMACY_MEDICINES = pageData.pharmacy_medicines;
})();

/* =============================================
   INVENTORY PAGE — TABS, FILTER, SEARCH & PAGINATION
   ============================================= */
(function () {
    /* ---- Helpers ---- */
    function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
    function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

    var importModal = qs('#import-csv-modal');
    var importOpenButton = qs('#open-import-csv');
    var importCloseButton = qs('#close-import-csv');
    var importFileInput = qs('#import-csv-file');
    var importFilename = qs('#import-csv-filename-text');
    var importDropzone = qs('#import-csv-dropzone');
    var previousFocus = null;

    function closeImportModal() {
        importModal.classList.add('hidden');
        importModal.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
        qsa('.import-csv-menu', importModal).forEach(function(menu) { menu.classList.add('hidden'); });
        qsa('.import-csv-select-button', importModal).forEach(function(button) {
            button.setAttribute('aria-expanded', 'false');
        });
        if (previousFocus) previousFocus.focus();
    }

    importOpenButton.addEventListener('click', function() {
        previousFocus = document.activeElement;
        importModal.classList.remove('hidden');
        importModal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
        importCloseButton.focus();
    });
    importCloseButton.addEventListener('click', closeImportModal);
    qs('#cancel-import-csv').addEventListener('click', closeImportModal);
    importModal.addEventListener('click', function(event) {
        if (event.target === importModal) closeImportModal();
    });
    importModal.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            var openMenu = qs('.import-csv-menu:not(.hidden)', importModal);
            if (openMenu) {
                openMenu.classList.add('hidden');
                var expandedButton = qs('.import-csv-select-button[aria-expanded="true"]', importModal);
                expandedButton.setAttribute('aria-expanded', 'false');
                expandedButton.focus();
            } else {
                closeImportModal();
            }
        }
    });

    qsa('.import-csv-select-button', importModal).forEach(function(button) {
        button.addEventListener('click', function() {
            var menu = qs('.import-csv-menu[data-menu="' + this.dataset.dropdown + '"]', importModal);
            var willOpen = menu.classList.contains('hidden');
            qsa('.import-csv-menu', importModal).forEach(function(otherMenu) { otherMenu.classList.add('hidden'); });
            qsa('.import-csv-select-button', importModal).forEach(function(otherButton) {
                otherButton.setAttribute('aria-expanded', 'false');
            });
            menu.classList.toggle('hidden', !willOpen);
            this.setAttribute('aria-expanded', String(willOpen));
            if (willOpen) qs('button[role="option"][aria-selected="true"]', menu).focus();
        });
    });

    qsa('.import-csv-menu', importModal).forEach(function(menu) {
        menu.addEventListener('click', function(event) {
            var option = event.target.closest('[role="option"]');
            if (!option) return;
            qsa('[role="option"]', menu).forEach(function(item) {
                item.setAttribute('aria-selected', String(item === option));
            });
            var dropdown = this.dataset.menu;
            qs('#import-csv-' + dropdown + '-value').textContent = option.textContent;
            menu.classList.add('hidden');
            qs('.import-csv-select-button[data-dropdown="' + dropdown + '"]', importModal).setAttribute('aria-expanded', 'false');
            qs('.import-csv-select-button[data-dropdown="' + dropdown + '"]', importModal).focus();
        });
    });

    importFileInput.addEventListener('change', function() {
        if (this.files.length) importFilename.textContent = this.files[0].name;
    });
    ['dragenter', 'dragover'].forEach(function(eventName) {
        importDropzone.addEventListener(eventName, function(event) {
            event.preventDefault();
            importDropzone.classList.add('rounded-lg', 'bg-light-dodger-blue');
        });
    });
    ['dragleave', 'drop'].forEach(function(eventName) {
        importDropzone.addEventListener(eventName, function(event) {
            event.preventDefault();
            importDropzone.classList.remove('rounded-lg', 'bg-light-dodger-blue');
        });
    });
    importDropzone.addEventListener('drop', function(event) {
        var files = event.dataTransfer.files;
        if (files.length && /\.csv$/i.test(files[0].name)) {
            importFileInput.files = files;
            importFilename.textContent = files[0].name;
        }
    });
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.import-csv-select')) {
            qsa('.import-csv-menu', importModal).forEach(function(menu) { menu.classList.add('hidden'); });
            qsa('.import-csv-select-button', importModal).forEach(function(button) {
                button.setAttribute('aria-expanded', 'false');
            });
        }
    });

    var exportModal = qs('#export-csv-modal');
    var exportOpenButton = qs('#open-export-csv');
    var exportCloseButton = qs('#close-export-csv');
    var exportFileInput = qs('#export-csv-file');
    var exportFilename = qs('#export-csv-filename');
    var exportDropzone = qs('#export-csv-dropzone');
    var exportPreviousFocus = null;

    function closeExportModal() {
        exportModal.classList.add('hidden');
        exportModal.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
        qsa('.export-csv-menu', exportModal).forEach(function(menu) { menu.classList.add('hidden'); });
        qsa('.export-csv-select-button', exportModal).forEach(function(button) {
            button.setAttribute('aria-expanded', 'false');
        });
        if (exportPreviousFocus) exportPreviousFocus.focus();
    }

    exportOpenButton.addEventListener('click', function() {
        exportPreviousFocus = document.activeElement;
        exportModal.classList.remove('hidden');
        exportModal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
        exportCloseButton.focus();
    });
    exportCloseButton.addEventListener('click', closeExportModal);
    qs('#cancel-export-csv').addEventListener('click', closeExportModal);
    exportModal.addEventListener('click', function(event) {
        if (event.target === exportModal) closeExportModal();
    });
    exportModal.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            var openMenu = qs('.export-csv-menu:not(.hidden)', exportModal);
            if (openMenu) {
                openMenu.classList.add('hidden');
                var expandedButton = qs('.export-csv-select-button[aria-expanded="true"]', exportModal);
                expandedButton.setAttribute('aria-expanded', 'false');
                expandedButton.focus();
            } else {
                closeExportModal();
            }
        }
    });

    qsa('.export-csv-select-button', exportModal).forEach(function(button) {
        button.addEventListener('click', function() {
            var menu = qs('.export-csv-menu[data-menu="' + this.dataset.dropdown + '"]', exportModal);
            var willOpen = menu.classList.contains('hidden');
            qsa('.export-csv-menu', exportModal).forEach(function(otherMenu) { otherMenu.classList.add('hidden'); });
            qsa('.export-csv-select-button', exportModal).forEach(function(otherButton) {
                otherButton.setAttribute('aria-expanded', 'false');
            });
            menu.classList.toggle('hidden', !willOpen);
            this.setAttribute('aria-expanded', String(willOpen));
            if (willOpen) qs('button[role="option"][aria-selected="true"]', menu).focus();
        });
    });

    qsa('.export-csv-menu', exportModal).forEach(function(menu) {
        menu.addEventListener('click', function(event) {
            var option = event.target.closest('[role="option"]');
            if (!option) return;
            qsa('[role="option"]', menu).forEach(function(item) {
                item.setAttribute('aria-selected', String(item === option));
            });
            var dropdown = this.dataset.menu;
            qs('#export-csv-' + dropdown + '-value').textContent = option.textContent;
            menu.classList.add('hidden');
            qs('.export-csv-select-button[data-dropdown="' + dropdown + '"]', exportModal).setAttribute('aria-expanded', 'false');
            qs('.export-csv-select-button[data-dropdown="' + dropdown + '"]', exportModal).focus();
        });
    });

    exportFileInput.addEventListener('change', function() {
        if (this.files.length) exportFilename.textContent = this.files[0].name;
    });
    ['dragenter', 'dragover'].forEach(function(eventName) {
        exportDropzone.addEventListener(eventName, function(event) {
            event.preventDefault();
            exportDropzone.classList.add('rounded-lg', 'bg-light-dodger-blue');
        });
    });
    ['dragleave', 'drop'].forEach(function(eventName) {
        exportDropzone.addEventListener(eventName, function(event) {
            event.preventDefault();
            exportDropzone.classList.remove('rounded-lg', 'bg-light-dodger-blue');
        });
    });
    exportDropzone.addEventListener('drop', function(event) {
        var files = event.dataTransfer.files;
        if (files.length && /\.csv$/i.test(files[0].name)) {
            exportFileInput.files = files;
            exportFilename.textContent = files[0].name;
        }
    });
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.export-csv-select')) {
            qsa('.export-csv-menu', exportModal).forEach(function(menu) { menu.classList.add('hidden'); });
            qsa('.export-csv-select-button', exportModal).forEach(function(button) {
                button.setAttribute('aria-expanded', 'false');
            });
        }
    });

    var addProductModal = qs('#add-product-modal');
    var addProductForm = qs('#add-product-form');
    var addProductOpenButtons = qsa('.open-add-product-modal');
    var addProductCloseButton = qs('#close-add-product');
    var addProductBackButton = qs('#add-product-back');
    var addProductContinueButton = qs('#add-product-continue');
    var addProductStepActions = qs('#add-product-step-actions');
    var addProductReviewActions = qs('#add-product-review-actions');
    var addOpeningStockToggle = qs('#add-opening-stock-toggle');
    var addOpeningStockField = qs('#add-opening-stock-field');
    var openingStockInput = addProductForm.querySelector('[name="opening_stock"]');
    var addProductCancelButton = qs('#add-product-cancel');
    var activeProductStep = 1;
    var addProductPreviousFocus = null;
    var addProductReturnsToDetails = false;

    function updateProductReview() {
        qsa('[data-review]', addProductModal).forEach(function(item) {
            var name = item.dataset.review;
            var input = addProductForm.querySelector('[name="' + name + '"]');
            if (name === 'prescription') {
                input = addProductForm.querySelector('[name="prescription"]:checked');
            } else if (name === 'current_stock') {
                item.textContent = addOpeningStockToggle.checked ? (openingStockInput.value || '0') : '0';
                return;
            } else if (name === 'auto_reorder') {
                var reorderLevel = addProductForm.querySelector('[name="reorder_level"]').value;
                item.textContent = Number(reorderLevel) > 0 ? 'Yes (Order at ' + reorderLevel + ' units)' : 'No';
                return;
            } else if (name === 'selling_price') {
                item.textContent = input.value ? '₹' + input.value : '—';
                return;
            }
            item.textContent = input && input.value ? input.value : '—';
        });
    }

    function syncOpeningStockField() {
        var enabled = addOpeningStockToggle.checked;
        addOpeningStockField.classList.toggle('hidden', !enabled);
        openingStockInput.required = enabled;
        if (!enabled) openingStockInput.value = '';
    }

    function populateProductFormFromMedicine(row) {
        var productParagraphs = row.cells[0].querySelectorAll('p');
        var productName = productParagraphs[0] ? productParagraphs[0].textContent.trim() : '';
        var packParagraphs = row.cells[1].querySelectorAll('p');
        var metadataSpans = row.cells[0].querySelectorAll('.mt-1 span');
        var strengthMatch = productName.match(/(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu)(?:\/\s*\d+(?:\.\d+)?\s*(?:ml|g))?)/i);
        var sellingPrice = parseFloat(row.cells[2].textContent.replace(/[^\d.]/g, ''));
        var fields = {
            product_name: productName,
            strength: strengthMatch ? strengthMatch[1].trim() : '',
            dosage_form: packParagraphs[1] ? packParagraphs[1].textContent.trim() : '',
            category: row.dataset.category || '',
            manufacturer: productParagraphs[2] ? productParagraphs[2].textContent.trim() : '',
            stock_unit: packParagraphs[1] ? packParagraphs[1].textContent.trim() : '',
            pack_size: packParagraphs[0] ? packParagraphs[0].textContent.trim() : '',
            salt_composition: productParagraphs[1] ? productParagraphs[1].textContent.trim() : '',
            selling_price: Number.isFinite(sellingPrice) ? sellingPrice : '',
        };
        Object.keys(fields).forEach(function(name) {
            var input = addProductForm.querySelector('[name="' + name + '"]');
            if (input) input.value = fields[name];
        });
        var prescription = metadataSpans[1] ? metadataSpans[1].textContent.trim() : 'Not Set';
        var prescriptionInput = addProductForm.querySelector('input[name="prescription"][value="' + prescription + '"]');
        if (prescriptionInput) prescriptionInput.checked = true;
    }

    function showAddProductStep(step) {
        activeProductStep = step;
        qsa('.add-product-step', addProductModal).forEach(function(button) {
            var isActive = Number(button.dataset.step) === step;
            button.setAttribute('aria-selected', String(isActive));
            button.classList.toggle('bg-report-0088ff', isActive);
            button.classList.toggle('text-white', isActive);
            button.classList.toggle('border-report-0088ff', isActive);
            button.classList.toggle('font-semibold', isActive);
            button.classList.toggle('bg-white', !isActive);
            button.classList.toggle('text-dark-gray', !isActive);
            button.classList.toggle('border-kyc-medium-gray', !isActive);
            button.classList.toggle('font-medium', !isActive);
        });
        qsa('.add-product-panel', addProductModal).forEach(function(panel) {
            var isActive = Number(panel.dataset.stepPanel) === step;
            panel.classList.toggle('hidden', !isActive);
            panel.setAttribute('aria-hidden', String(!isActive));
        });
        addProductStepActions.classList.toggle('hidden', step === 3);
        addProductReviewActions.classList.toggle('hidden', step !== 3);
        if (step === 3) updateProductReview();
    }

    function closeAddProductModal() {
        addProductModal.classList.add('hidden');
        addProductModal.classList.remove('flex');
        addProductForm.reset();
        syncOpeningStockField();
        showAddProductStep(1);
        qs('#add-product-title', addProductModal).textContent = 'Add Product';
        addProductCloseButton.setAttribute('aria-label', 'Close Add Product dialog');
        if (addProductReturnsToDetails && activeMedicineRow) {
            medicineDetailsModal.classList.remove('hidden');
            medicineDetailsModal.classList.add('flex');
            document.body.classList.add('overflow-hidden');
            qs('#medicine-details-edit', medicineDetailsModal).focus();
        } else {
            document.body.classList.remove('overflow-hidden');
            if (addProductPreviousFocus) addProductPreviousFocus.focus();
        }
        addProductReturnsToDetails = false;
    }

    addProductOpenButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            addProductPreviousFocus = document.activeElement;
            addProductReturnsToDetails = false;
            addProductForm.reset();
            syncOpeningStockField();
            showAddProductStep(1);
            qs('#add-product-title', addProductModal).textContent = 'Add Product';
            addProductCloseButton.setAttribute('aria-label', 'Close Add Product dialog');
            addProductModal.classList.remove('hidden');
            addProductModal.classList.add('flex');
            document.body.classList.add('overflow-hidden');
            qs('#add-product-tab-1', addProductModal).focus();
        });
    });
    addProductCloseButton.addEventListener('click', closeAddProductModal);
    addProductCancelButton.addEventListener('click', closeAddProductModal);
    addOpeningStockToggle.addEventListener('change', syncOpeningStockField);
    addProductForm.addEventListener('submit', function(event) {
        event.preventDefault();
    });
    addProductModal.addEventListener('click', function(event) {
        if (event.target === addProductModal) closeAddProductModal();
    });
    addProductModal.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') closeAddProductModal();
    });
    qsa('.add-product-step', addProductModal).forEach(function(button) {
        button.addEventListener('click', function() {
            showAddProductStep(Number(this.dataset.step));
        });
    });
    addProductBackButton.addEventListener('click', function() {
        if (activeProductStep > 1) showAddProductStep(activeProductStep - 1);
    });
    addProductContinueButton.addEventListener('click', function() {
        if (activeProductStep < 3) {
            var currentPanel = qs('[data-step-panel="' + activeProductStep + '"]', addProductModal);
            var invalidField = qsa('input[required]', currentPanel).find(function(input) {
                return !input.checkValidity();
            });
            if (invalidField) {
                invalidField.reportValidity();
                return;
            }
            showAddProductStep(activeProductStep + 1);
        }
    });

    /* ============================================================
       1. TAB SWITCHING
       ============================================================ */
    var tabBtns  = qsa('.inv-tab');
    var tabPanels = qsa('.inv-tab-panel');

    tabBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var target = this.dataset.tab;
            // Deactivate all
            tabBtns.forEach(function(b) {
                b.classList.remove('active-inv-tab', 'text-dodger-blue', 'border-dodger-blue');
                b.classList.add('text-medium-gray', 'border-transparent');
            });
            tabPanels.forEach(function(p) { p.classList.add('hidden'); });
            // Activate selected
            this.classList.add('active-inv-tab', 'text-dodger-blue', 'border-dodger-blue');
            this.classList.remove('text-medium-gray', 'border-transparent');
            var panel = qs('#inv-tab-' + target);
            if (panel) panel.classList.remove('hidden');
        });
    });

    /* ============================================================
       2. INVENTORY PAGINATION + FILTER + SEARCH
       ============================================================ */
    var allRows      = qsa('.inv-row');
    var tbody        = qs('#inv-tbody');
    var searchInput  = qs('#inv-search');
    var pageSizeEl   = qs('#inv-page-size');
    var prevBtn      = qs('#inv-prev-btn');
    var nextBtn      = qs('#inv-next-btn');
    var pageInfo     = qs('#inv-pagination-info');
    var pageIndicator= qs('#inv-page-indicator');

    var currentPage     = 1;
    var pageSize        = 5;
    var activeFilter    = 'all';
    var searchQuery     = '';
    var filteredRows    = allRows.slice();
    var medicineDetailsModal = qs('#medicine-details-modal');
    var medicineDetailsOpener = null;
    var activeMedicineRow = null;
    var adjustStockModal = qs('#adjust-stock-modal');
    var adjustStockForm = qs('#adjust-stock-form');
    var stockActionMode = 'adjust';
    var purchaseOrderModal = qs('#create-po-modal');
    var purchaseOrderForm = qs('#create-po-form');
    var purchaseOrderItems = qs('#po-items');
    var purchaseOrderOpener = null;
    var purchaseOrderReturnsToDetails = false;
    var purchaseOrderInitialState = null;
    var discardPurchaseOrderModal = qs('#discard-po-modal');

    function setMedicineDetail(name, value) {
        var element = qs('[data-medicine-detail="' + name + '"]', medicineDetailsModal);
        if (element) element.textContent = value || '—';
    }

    function setMedicineStock(name, value) {
        var element = qs('[data-stock-summary="' + name + '"]', medicineDetailsModal);
        if (element) element.textContent = value || '—';
    }

    function closeAdjustStockDropdowns() {
        qsa('.adjust-stock-menu', adjustStockModal).forEach(function(menu) {
            menu.classList.add('hidden');
            var button = qs('.adjust-stock-select-button[data-dropdown="' + menu.dataset.menu + '"]', adjustStockModal);
            button.setAttribute('aria-expanded', 'false');
        });
    }

    function closeInventoryFilterMenus() {
        qsa('.inventory-filter-menu').forEach(function(menu) {
            menu.classList.add('hidden');
            menu.closest('.inventory-filter-wrapper').querySelector('.inventory-filter-toggle').setAttribute('aria-expanded', 'false');
        });
    }

    function resetAdjustStockDropdowns() {
        qsa('.adjust-stock-menu', adjustStockModal).forEach(function(menu) {
            var dropdown = menu.dataset.menu;
            var defaultOption = qs('[data-default-selected="true"]', menu);
            qsa('[role="option"]', menu).forEach(function(option) {
                option.setAttribute('aria-selected', String(option === defaultOption));
                option.tabIndex = option === defaultOption ? 0 : -1;
            });
            qs('#adjust-stock-' + dropdown + '-value', adjustStockModal).textContent = defaultOption.textContent.trim();
            qs('#adjust-stock-' + dropdown, adjustStockModal).value = defaultOption.dataset.value;
            menu.classList.add('hidden');
            qs('.adjust-stock-select-button[data-dropdown="' + dropdown + '"]', adjustStockModal).setAttribute('aria-expanded', 'false');
        });
    }

    function getMedicineSearchTerms(row, productName, medicineCode) {
        var terms = [row.dataset.name, productName, medicineCode]
            .filter(Boolean)
            .map(function(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); });
        if (row.dataset.id === '1') terms.push('crocin 500mg');
        return terms.filter(Boolean);
    }

    function rowMatchesMedicine(searchText, terms) {
        var normalizedSearch = searchText.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        return terms.some(function(term) {
            return normalizedSearch.length > 3 &&
                (normalizedSearch.indexOf(term) !== -1 || term.indexOf(normalizedSearch) !== -1);
        });
    }

    function populateMedicineBatches(terms) {
        var batchBody = qs('#medicine-details-batches');
        batchBody.textContent = '';
        var batchRows = qsa('.batch-row').filter(function(batchRow) {
            return rowMatchesMedicine((batchRow.dataset.search || '') + ' ' + batchRow.cells[0].textContent, terms);
        });

        if (!batchRows.length) {
            var emptyRow = document.createElement('tr');
            var emptyCell = document.createElement('td');
            emptyCell.colSpan = 4;
            emptyCell.className = 'border-t border-white2 px-2 py-4 text-center text-cloud-burst-1';
            emptyCell.textContent = 'No batch information available';
            emptyRow.appendChild(emptyCell);
            batchBody.appendChild(emptyRow);
            return [];
        }

        batchRows.forEach(function(batchRow) {
            var values = [
                batchRow.cells[1].textContent.trim(),
                batchRow.cells[2].textContent.trim(),
                batchRow.cells[7].textContent.trim(),
                batchRow.cells[9].textContent.trim(),
            ];
            var tableRow = document.createElement('tr');
            values.forEach(function(value) {
                var cell = document.createElement('td');
                cell.className = 'border-t border-white2 px-2 py-3 text-center';
                cell.textContent = value || '—';
                tableRow.appendChild(cell);
            });
            batchBody.appendChild(tableRow);
        });
        return batchRows;
    }

    function populateMedicineMovements(terms) {
        var movementSection = qs('#medicine-details-movements');
        movementSection.textContent = '';
        var movementRows = qsa('.movement-row').filter(function(movementRow) {
            return rowMatchesMedicine(movementRow.cells[1].textContent, terms);
        });

        if (!movementRows.length) {
            var emptyMessage = document.createElement('p');
            emptyMessage.className = 'py-2.5 text-xs text-cloud-burst-1';
            emptyMessage.textContent = 'No movement history available';
            movementSection.appendChild(emptyMessage);
            return;
        }

        movementRows.forEach(function(movementRow) {
            var movement = document.createElement('div');
            movement.className = 'flex items-center justify-between gap-3 py-2.5 text-[10px]';
            var description = document.createElement('span');
            description.className = 'min-w-0 text-cloud-burst-1';
            description.textContent = movementRow.cells[3].textContent.trim() + ' ' +
                movementRow.cells[6].textContent.trim() + ' · ' +
                movementRow.cells[0].textContent.trim();
            var quantity = document.createElement('span');
            quantity.className = 'shrink-0 font-semibold text-dark-black';
            quantity.textContent = movementRow.cells[4].textContent.trim() + ' ' +
                movementRow.cells[5].textContent.trim();
            movement.appendChild(description);
            movement.appendChild(quantity);
            movementSection.appendChild(movement);
        });
    }

    function closeMedicineDetails() {
        medicineDetailsModal.classList.add('hidden');
        medicineDetailsModal.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
        if (medicineDetailsOpener) medicineDetailsOpener.focus();
        medicineDetailsOpener = null;
        activeMedicineRow = null;
    }

    function openStockActionModal(mode) {
        if (!activeMedicineRow) return;
        stockActionMode = mode === 'receive' ? 'receive' : 'adjust';
        var productName = qs('#medicine-details-title', medicineDetailsModal).textContent.trim();
        var available = qs('[data-stock-summary="available"]', medicineDetailsModal).textContent.trim();
        var unit = qs('[data-stock-summary="unit"]', medicineDetailsModal).textContent.trim();
        var quantity = Number(available);
        var availableLabel = available + (unit && unit !== '—' ? ' ' + unit + (quantity === 1 ? '' : 's') : '');

        qs('#adjust-stock-title', adjustStockModal).textContent = stockActionMode === 'receive' ? 'Inventory action' : 'Adjust Stock';
        qs('#save-adjust-stock', adjustStockModal).textContent = stockActionMode === 'receive' ? 'Save Product' : 'Save Adjustment';
        qs('#adjust-stock-medicine-name', adjustStockModal).textContent = productName;
        qs('#adjust-stock-current-available', adjustStockModal).textContent = availableLabel;
        adjustStockForm.reset();
        var feedback = qs('#adjust-stock-feedback', adjustStockModal);
        feedback.textContent = '';
        feedback.classList.add('hidden');
        resetAdjustStockDropdowns();

        medicineDetailsModal.classList.add('hidden');
        medicineDetailsModal.classList.remove('flex');
        adjustStockModal.classList.remove('hidden');
        adjustStockModal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
        qs('#adjust-stock-type', adjustStockModal).focus();
    }

    function closeStockActionModal() {
        closeAdjustStockDropdowns();
        adjustStockModal.classList.add('hidden');
        adjustStockModal.classList.remove('flex');
        if (activeMedicineRow) {
            medicineDetailsModal.classList.remove('hidden');
            medicineDetailsModal.classList.add('flex');
            document.body.classList.add('overflow-hidden');
            qs('#medicine-details-adjust', medicineDetailsModal).focus();
        } else {
            document.body.classList.remove('overflow-hidden');
        }
    }

    function formatPurchaseOrderAmount(amount) {
        return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    }

    function updatePurchaseOrderTotals() {
        var total = 0;
        qsa('.purchase-order-item', purchaseOrderItems).forEach(function(item) {
            var quantity = Number(qs('[data-po-field="quantity"]', item).value);
            var unitPrice = Number(qs('[data-po-field="unit-price"]', item).value);
            var lineTotal = Number.isFinite(quantity) && Number.isFinite(unitPrice) && quantity > 0 && unitPrice >= 0
                ? quantity * unitPrice
                : 0;
            total += lineTotal;
            qs('[data-po-line-total]', item).textContent = formatPurchaseOrderAmount(lineTotal);
        });
        qs('#po-total', purchaseOrderModal).textContent = formatPurchaseOrderAmount(total);
        var items = qsa('.purchase-order-item', purchaseOrderItems);
        items.forEach(function(item) {
            var removeButton = qs('[data-po-remove]', item);
            removeButton.classList.toggle('hidden', items.length === 1);
            removeButton.classList.toggle('flex', items.length > 1);
        });
    }

    function addPurchaseOrderItem(productName, quantity, unitPrice) {
        var template = qs('#po-item-template', purchaseOrderModal);
        var item = template.content.firstElementChild.cloneNode(true);
        qs('[data-po-field="product"]', item).value = productName || '';
        qs('[data-po-field="quantity"]', item).value = quantity || '';
        qs('[data-po-field="unit-price"]', item).value = unitPrice || '';
        purchaseOrderItems.appendChild(item);
        updatePurchaseOrderTotals();
    }

    function resetPurchaseOrderSupplier() {
        var menu = qs('#po-supplier-menu', purchaseOrderModal);
        var defaultOption = qs('[data-default-selected="true"]', menu);
        qsa('[role="option"]', menu).forEach(function(option) {
            option.setAttribute('aria-selected', String(option === defaultOption));
            option.tabIndex = option === defaultOption ? 0 : -1;
        });
        qs('#po-supplier-value', purchaseOrderModal).textContent = defaultOption.textContent.trim();
        qs('#po-supplier', purchaseOrderModal).value = defaultOption.dataset.value;
        menu.classList.add('hidden');
        qs('#po-supplier-button', purchaseOrderModal).setAttribute('aria-expanded', 'false');
    }

    function getPurchaseOrderState() {
        return JSON.stringify({
            supplier: qs('#po-supplier', purchaseOrderModal).value,
            expectedDelivery: qs('#po-expected-delivery', purchaseOrderModal).value,
            noStockImpact: qs('#po-no-stock-impact', purchaseOrderModal).checked,
            items: qsa('.purchase-order-item', purchaseOrderItems).map(function(item) {
                return {
                    product: qs('[data-po-field="product"]', item).value,
                    quantity: qs('[data-po-field="quantity"]', item).value,
                    unitPrice: qs('[data-po-field="unit-price"]', item).value,
                };
            }),
        });
    }

    function getPurchaseOrderDefaults(row) {
        if (!row) return { productName: '', unitPrice: 70 };
        var productName = row.cells[0].querySelector('p');
        var codeSpans = row.cells[0].querySelectorAll('.mt-1 span');
        var medicineCode = codeSpans[0] ? codeSpans[0].textContent.trim() : '';
        var searchTerms = getMedicineSearchTerms(row, productName ? productName.textContent.trim() : '', medicineCode);
        var batch = qsa('.batch-row').find(function(batchRow) {
            return rowMatchesMedicine((batchRow.dataset.search || '') + ' ' + batchRow.cells[0].textContent, searchTerms);
        });
        var purchaseCost = batch ? parseFloat(batch.cells[8].textContent.replace(/[^\d.]/g, '')) : NaN;
        return {
            productName: productName ? productName.textContent.trim() : '',
            unitPrice: Number.isFinite(purchaseCost) ? purchaseCost : 70,
        };
    }

    function openPurchaseOrderModal(fromDetails) {
        var sourceRow = fromDetails ? activeMedicineRow : allRows[0];
        purchaseOrderReturnsToDetails = Boolean(fromDetails && activeMedicineRow);
        purchaseOrderOpener = document.activeElement;
        purchaseOrderForm.reset();
        qs('#create-po-feedback', purchaseOrderModal).textContent = '';
        qs('#create-po-feedback', purchaseOrderModal).classList.add('hidden');
        resetPurchaseOrderSupplier();
        purchaseOrderItems.textContent = '';

        var defaults = getPurchaseOrderDefaults(sourceRow);
        addPurchaseOrderItem(defaults.productName, 100, defaults.unitPrice);
        purchaseOrderInitialState = getPurchaseOrderState();

        if (purchaseOrderReturnsToDetails) {
            medicineDetailsModal.classList.add('hidden');
            medicineDetailsModal.classList.remove('flex');
        }
        purchaseOrderModal.classList.remove('hidden');
        purchaseOrderModal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
        qs('#close-create-po', purchaseOrderModal).focus();
    }

    function finishClosePurchaseOrderModal() {
        qs('#po-supplier-menu', purchaseOrderModal).classList.add('hidden');
        qs('#po-supplier-button', purchaseOrderModal).setAttribute('aria-expanded', 'false');
        discardPurchaseOrderModal.classList.add('hidden');
        discardPurchaseOrderModal.classList.remove('flex');
        purchaseOrderModal.classList.add('hidden');
        purchaseOrderModal.classList.remove('flex');
        if (purchaseOrderReturnsToDetails && activeMedicineRow) {
            medicineDetailsModal.classList.remove('hidden');
            medicineDetailsModal.classList.add('flex');
            document.body.classList.add('overflow-hidden');
            qs('#medicine-details-create-po', medicineDetailsModal).focus();
        } else {
            document.body.classList.remove('overflow-hidden');
            if (purchaseOrderOpener) purchaseOrderOpener.focus();
        }
        purchaseOrderReturnsToDetails = false;
        purchaseOrderOpener = null;
        purchaseOrderInitialState = null;
    }

    function requestClosePurchaseOrderModal() {
        if (purchaseOrderInitialState !== null && getPurchaseOrderState() !== purchaseOrderInitialState) {
            purchaseOrderModal.classList.add('hidden');
            purchaseOrderModal.classList.remove('flex');
            discardPurchaseOrderModal.classList.remove('hidden');
            discardPurchaseOrderModal.classList.add('flex');
            qs('#keep-editing-po', discardPurchaseOrderModal).focus();
            return;
        }
        finishClosePurchaseOrderModal();
    }

    function keepEditingPurchaseOrder() {
        discardPurchaseOrderModal.classList.add('hidden');
        discardPurchaseOrderModal.classList.remove('flex');
        purchaseOrderModal.classList.remove('hidden');
        purchaseOrderModal.classList.add('flex');
        qs('#cancel-create-po', purchaseOrderModal).focus();
    }

    function openMedicineDetails(row, opener) {
        activeMedicineRow = row;
        medicineDetailsOpener = opener;
        var productCell = row.cells[0];
        var productParagraphs = productCell.querySelectorAll('p');
        var productName = productParagraphs[0] ? productParagraphs[0].textContent.trim() : 'Medicine details';
        var metadataSpans = productCell.querySelectorAll('.mt-1 span');
        var medicineCode = metadataSpans[0] ? metadataSpans[0].textContent.trim() : '—';
        var prescription = metadataSpans.length > 1 ? metadataSpans[metadataSpans.length - 1].textContent.trim() : '—';
        var packParagraphs = row.cells[1].querySelectorAll('p');
        var stockUnit = row.cells[3].querySelector('p');
        var status = row.cells[7].textContent.trim();

        qs('#medicine-details-title', medicineDetailsModal).textContent = productName;
        qs('#medicine-details-code', medicineDetailsModal).textContent = medicineCode;
        var statusBadge = qs('#medicine-details-status', medicineDetailsModal);
        statusBadge.textContent = status || '—';
        statusBadge.className = 'rounded-full px-2 py-1 ' +
            (row.dataset.filterStatus === 'healthy' ? 'bg-[#E8F5E9] text-[#27AE60]' :
                row.dataset.filterStatus === 'low' ? 'bg-[#FFF3E0] text-[#E67E22]' :
                    'bg-[#FFE4E4] text-[#C0392B]');

        setMedicineDetail('composition', productParagraphs[1] ? productParagraphs[1].textContent.trim() : '');
        setMedicineDetail('dosage', stockUnit ? stockUnit.textContent.trim() : '');
        setMedicineDetail('manufacturer', productParagraphs[2] ? productParagraphs[2].textContent.trim() : '');
        setMedicineDetail('category', (row.dataset.category || '').replace(/\b\w/g, function(character) { return character.toUpperCase(); }));
        setMedicineDetail('pack-size', packParagraphs[0] ? packParagraphs[0].textContent.trim() : '');
        setMedicineDetail('prescription', prescription);
        setMedicineDetail('price', row.cells[2].textContent.trim());

        var onHand = row.cells[3].querySelector('span');
        var reserved = row.cells[4].textContent.trim();
        var blocked = row.cells[5].textContent.trim();
        var available = row.cells[6].textContent.trim();
        setMedicineStock('on-hand', onHand ? onHand.textContent.trim() : '');
        setMedicineStock('reserved', reserved);
        setMedicineStock('blocked', blocked);
        setMedicineStock('available', available);
        qsa('[data-stock-summary="unit"]', medicineDetailsModal).forEach(function(element) {
            element.textContent = stockUnit ? stockUnit.textContent.trim() : '—';
        });

        var searchTerms = getMedicineSearchTerms(row, productName, medicineCode);
        var medicineBatches = populateMedicineBatches(searchTerms);
        setMedicineDetail('location', medicineBatches.length ? medicineBatches[0].cells[9].textContent.trim() : '—');
        populateMedicineMovements(searchTerms);
        medicineDetailsModal.classList.remove('hidden');
        medicineDetailsModal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
        qs('#close-medicine-details', medicineDetailsModal).focus();
    }

    allRows.forEach(function(row) {
        var viewButton = row.querySelector('td:last-child button');
        var productName = row.cells[0].querySelector('p');
        if (viewButton) {
            viewButton.type = 'button';
            viewButton.classList.add('view-pharmacy-medicine');
            viewButton.setAttribute('aria-label', 'View ' + (productName ? productName.textContent.trim() : 'medicine') + ' details');
        }
    });

    allRows.forEach(function(row) {
        var viewButton = row.querySelector('.view-pharmacy-medicine');
        if (viewButton) {
            viewButton.addEventListener('click', function() {
                openMedicineDetails(row, viewButton);
            });
        }
    });

    qs('#close-medicine-details', medicineDetailsModal).addEventListener('click', closeMedicineDetails);
    qs('#medicine-details-adjust', medicineDetailsModal).addEventListener('click', function() {
        openStockActionModal('adjust');
    });
    qs('#medicine-details-receive', medicineDetailsModal).addEventListener('click', function() {
        openStockActionModal('receive');
    });
    medicineDetailsModal.addEventListener('click', function(event) {
        if (event.target === medicineDetailsModal) closeMedicineDetails();
    });
    qs('#close-adjust-stock', adjustStockModal).addEventListener('click', closeStockActionModal);
    qs('#cancel-adjust-stock', adjustStockModal).addEventListener('click', closeStockActionModal);
    adjustStockModal.addEventListener('click', function(event) {
        if (event.target === adjustStockModal) closeStockActionModal();
    });
    qsa('.inventory-filter-toggle').forEach(function(button) {
        button.addEventListener('click', function() {
            var wrapper = this.closest('.inventory-filter-wrapper');
            var menu = qs('.inventory-filter-menu', wrapper);
            var willOpen = menu.classList.contains('hidden');
            closeInventoryFilterMenus();
            menu.classList.toggle('hidden', !willOpen);
            this.setAttribute('aria-expanded', String(willOpen));
            if (willOpen) {
                var selectedOption = qs('[role="option"][aria-selected="true"]', menu) || qs('[role="option"]', menu);
                selectedOption.focus();
            }
        });
    });
    qsa('.inventory-filter-menu').forEach(function(menu) {
        menu.addEventListener('click', function(event) {
            var option = event.target.closest('[role="option"]');
            if (!option || !menu.contains(option)) return;
            qsa('[role="option"]', menu).forEach(function(item) {
                item.setAttribute('aria-selected', String(item === option));
            });
            var toggle = menu.closest('.inventory-filter-wrapper').querySelector('.inventory-filter-toggle');
            toggle.dataset.selectedFilter = option.dataset.filterOption;
            menu.classList.add('hidden');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.focus();
        });
        menu.addEventListener('keydown', function(event) {
            var options = qsa('[role="option"]', menu);
            var currentIndex = options.indexOf(document.activeElement);
            var nextIndex = currentIndex;
            if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % options.length;
            else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + options.length) % options.length;
            else if (event.key === 'Home') nextIndex = 0;
            else if (event.key === 'End') nextIndex = options.length - 1;
            else return;
            event.preventDefault();
            options[nextIndex].focus();
        });
    });
    qs('#medicine-details-create-po', medicineDetailsModal).addEventListener('click', function() {
        openPurchaseOrderModal(true);
    });
    qs('#open-purchase-order').addEventListener('click', function() {
        openPurchaseOrderModal(false);
    });
    qs('#close-create-po', purchaseOrderModal).addEventListener('click', requestClosePurchaseOrderModal);
    qs('#cancel-create-po', purchaseOrderModal).addEventListener('click', requestClosePurchaseOrderModal);
    purchaseOrderModal.addEventListener('click', function(event) {
        if (event.target === purchaseOrderModal) requestClosePurchaseOrderModal();
    });
    qs('#close-discard-po', discardPurchaseOrderModal).addEventListener('click', keepEditingPurchaseOrder);
    qs('#keep-editing-po', discardPurchaseOrderModal).addEventListener('click', keepEditingPurchaseOrder);
    qs('#confirm-discard-po', discardPurchaseOrderModal).addEventListener('click', finishClosePurchaseOrderModal);
    discardPurchaseOrderModal.addEventListener('click', function(event) {
        if (event.target === discardPurchaseOrderModal) keepEditingPurchaseOrder();
    });
    qs('#po-add-product', purchaseOrderModal).addEventListener('click', function() {
        addPurchaseOrderItem('', 1, '');
    });
    purchaseOrderItems.addEventListener('input', function(event) {
        if (event.target.matches('[data-po-field="quantity"], [data-po-field="unit-price"]')) {
            updatePurchaseOrderTotals();
        }
    });
    purchaseOrderItems.addEventListener('click', function(event) {
        var removeButton = event.target.closest('[data-po-remove]');
        if (removeButton && qsa('.purchase-order-item', purchaseOrderItems).length > 1) {
            removeButton.closest('.purchase-order-item').remove();
            updatePurchaseOrderTotals();
        }
    });
    purchaseOrderForm.addEventListener('submit', function(event) {
        event.preventDefault();
        var feedback = qs('#create-po-feedback', purchaseOrderModal);
        feedback.textContent = 'Purchase order draft is a UI preview; no draft was saved.';
        feedback.classList.remove('hidden');
    });
    qs('#po-supplier-button', purchaseOrderModal).addEventListener('click', function() {
        var menu = qs('#po-supplier-menu', purchaseOrderModal);
        var willOpen = menu.classList.contains('hidden');
        menu.classList.toggle('hidden', !willOpen);
        this.setAttribute('aria-expanded', String(willOpen));
        if (willOpen) qs('[role="option"][aria-selected="true"]', menu).focus();
    });
    qs('#po-supplier-menu', purchaseOrderModal).addEventListener('click', function(event) {
        var option = event.target.closest('[role="option"]');
        if (!option) return;
        qsa('[role="option"]', this).forEach(function(item) {
            item.setAttribute('aria-selected', String(item === option));
            item.tabIndex = item === option ? 0 : -1;
        });
        qs('#po-supplier-value', purchaseOrderModal).textContent = option.textContent.trim();
        qs('#po-supplier', purchaseOrderModal).value = option.dataset.value;
        this.classList.add('hidden');
        qs('#po-supplier-button', purchaseOrderModal).setAttribute('aria-expanded', 'false');
        qs('#po-supplier-button', purchaseOrderModal).focus();
    });
    qs('#po-supplier-menu', purchaseOrderModal).addEventListener('keydown', function(event) {
        var options = qsa('[role="option"]', this);
        var currentIndex = options.indexOf(document.activeElement);
        var nextIndex = currentIndex;
        if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % options.length;
        else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + options.length) % options.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = options.length - 1;
        else return;
        event.preventDefault();
        options[nextIndex].focus();
    });
    purchaseOrderModal.addEventListener('keydown', function(event) {
        var menu = qs('#po-supplier-menu', purchaseOrderModal);
        if (event.key === 'Escape' && !menu.classList.contains('hidden')) {
            event.preventDefault();
            event.stopPropagation();
            menu.classList.add('hidden');
            qs('#po-supplier-button', purchaseOrderModal).setAttribute('aria-expanded', 'false');
            qs('#po-supplier-button', purchaseOrderModal).focus();
        }
    });
    qsa('.adjust-stock-select-button', adjustStockModal).forEach(function(button) {
        button.addEventListener('click', function() {
            var menu = qs('.adjust-stock-menu[data-menu="' + this.dataset.dropdown + '"]', adjustStockModal);
            var willOpen = menu.classList.contains('hidden');
            closeAdjustStockDropdowns();
            menu.classList.toggle('hidden', !willOpen);
            this.setAttribute('aria-expanded', String(willOpen));
            if (willOpen) qs('[role="option"][aria-selected="true"]', menu).focus();
        });
    });
    qsa('.adjust-stock-menu', adjustStockModal).forEach(function(menu) {
        menu.addEventListener('click', function(event) {
            var option = event.target.closest('[role="option"]');
            if (!option || !menu.contains(option)) return;
            qsa('[role="option"]', menu).forEach(function(item) {
                item.setAttribute('aria-selected', String(item === option));
                item.tabIndex = item === option ? 0 : -1;
            });
            var dropdown = menu.dataset.menu;
            qs('#adjust-stock-' + dropdown + '-value', adjustStockModal).textContent = option.textContent.trim();
            qs('#adjust-stock-' + dropdown, adjustStockModal).value = option.dataset.value;
            menu.classList.add('hidden');
            var button = qs('.adjust-stock-select-button[data-dropdown="' + dropdown + '"]', adjustStockModal);
            button.setAttribute('aria-expanded', 'false');
            button.focus();
        });
        menu.addEventListener('keydown', function(event) {
            var options = qsa('[role="option"]', menu);
            var currentIndex = options.indexOf(document.activeElement);
            var nextIndex = currentIndex;
            if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % options.length;
            else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + options.length) % options.length;
            else if (event.key === 'Home') nextIndex = 0;
            else if (event.key === 'End') nextIndex = options.length - 1;
            else return;
            event.preventDefault();
            options[nextIndex].focus();
        });
    });
    adjustStockModal.addEventListener('keydown', function(event) {
        var openMenu = qs('.adjust-stock-menu:not(.hidden)', adjustStockModal);
        if (!openMenu) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            var dropdown = openMenu.dataset.menu;
            openMenu.classList.add('hidden');
            var button = qs('.adjust-stock-select-button[data-dropdown="' + dropdown + '"]', adjustStockModal);
            button.setAttribute('aria-expanded', 'false');
            button.focus();
        } else if (event.key === 'Tab') {
            closeAdjustStockDropdowns();
        }
    });
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.inventory-filter-wrapper')) {
            closeInventoryFilterMenus();
        }
        if (!event.target.closest('.po-supplier-select')) {
            qs('#po-supplier-menu', purchaseOrderModal).classList.add('hidden');
            qs('#po-supplier-button', purchaseOrderModal).setAttribute('aria-expanded', 'false');
        }
        if (!event.target.closest('.adjust-stock-select')) {
            closeAdjustStockDropdowns();
        }
    });
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            var openInventoryFilterMenu = qs('.inventory-filter-menu:not(.hidden)');
            if (openInventoryFilterMenu) {
                var filterToggle = openInventoryFilterMenu.closest('.inventory-filter-wrapper').querySelector('.inventory-filter-toggle');
                closeInventoryFilterMenus();
                filterToggle.focus();
            } else if (!discardPurchaseOrderModal.classList.contains('hidden')) {
                keepEditingPurchaseOrder();
            } else if (!purchaseOrderModal.classList.contains('hidden')) {
                requestClosePurchaseOrderModal();
            } else if (!adjustStockModal.classList.contains('hidden')) {
                closeStockActionModal();
            } else if (!medicineDetailsModal.classList.contains('hidden')) {
                closeMedicineDetails();
            }
        }
    });
    adjustStockForm.addEventListener('submit', function(event) {
        event.preventDefault();
        var feedback = qs('#adjust-stock-feedback', adjustStockModal);
        feedback.textContent = stockActionMode === 'receive'
            ? 'This receive-stock form is a UI preview; no stock changes were saved.'
            : 'This adjustment form is a UI preview; no stock changes were saved.';
        feedback.classList.remove('hidden');
    });
    qs('#medicine-details-edit', medicineDetailsModal).addEventListener('click', function() {
        if (!activeMedicineRow) return;
        addProductPreviousFocus = document.activeElement;
        addProductReturnsToDetails = true;
        addProductForm.reset();
        syncOpeningStockField();
        populateProductFormFromMedicine(activeMedicineRow);
        showAddProductStep(1);
        qs('#add-product-title', addProductModal).textContent = 'Edit Product';
        addProductCloseButton.setAttribute('aria-label', 'Close Edit Product dialog');
        medicineDetailsModal.classList.add('hidden');
        medicineDetailsModal.classList.remove('flex');
        addProductModal.classList.remove('hidden');
        addProductModal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
        qs('#add-product-tab-1', addProductModal).focus();
    });

    /* Auto-compute status from qty for each row & update badges/cells */
    function getStatusFromQty(qty) {
        var n = parseInt(qty, 10);
        if (isNaN(n) || qty === '' || n === 0) return 'out_of_stock';
        if (n <= 5)  return 'critical';
        if (n <= 20) return 'low';
        return 'healthy';
    }

    var statusConfig = {
        out_of_stock: { label: 'Out of Stock', badgeCls: 'bg-[#FFE4E4] text-[#C0392B]',   timeCls: 'text-[#C0392B]' },
        critical:     { label: 'Critical',      badgeCls: 'bg-[#FFE4E4] text-[#C0392B]',   timeCls: 'text-[#C0392B]' },
        low:          { label: 'Low',           badgeCls: 'bg-[#FFF3E0] text-[#E67E22]',   timeCls: 'text-[#E67E22]' },
        healthy:      { label: 'Healthy',       badgeCls: 'bg-[#E8F5E9] text-[#27AE60]',   timeCls: 'text-charcoal-black' },
    };

    allRows.forEach(function(r) {
        var qty = r.dataset.qty || '0';
        var status = r.dataset.filterStatus || getStatusFromQty(qty);
        r.dataset.filterStatus = status;

        var cfg = statusConfig[status];
        // Update status badge
        var badge = r.querySelector('.inv-status-badge');
        if (badge) {
            badge.className = 'inv-status-badge inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold ' + cfg.badgeCls;
            badge.textContent = cfg.label;
        }
        // Update time cell color
        var timeCell = r.querySelector('.inv-time-cell');
        if (timeCell) {
            timeCell.className = 'inv-time-cell text-sm font-semibold ' + cfg.timeCls;
        }
    });

    /* Compute status counts */
    var counts = { all: allRows.length, healthy: 0, low: 0, critical: 0, out_of_stock: 0, archived: 0 };
    allRows.forEach(function(r) {
        var s = r.dataset.filterStatus || 'healthy';
        if (counts[s] !== undefined) counts[s]++;
    });
    // Update badge numbers
    var filterIdMap = { all: 'filter-all-count', healthy: 'filter-healthy-count', low: 'filter-low-count', critical: 'filter-critical-count', out_of_stock: 'filter-out-count', archived: 'filter-archived-count' };
    Object.keys(filterIdMap).forEach(function(key) {
        var el = qs('#' + filterIdMap[key]);
        if (el) el.textContent = counts[key] || 0;
    });
    // Update summary cards
    var lowCritEl = qs('#low-critical-count');
    if (lowCritEl) lowCritEl.textContent = (counts.low || 0) + (counts.critical || 0);
    var outEl = qs('#out-of-stock-count');
    if (outEl) outEl.textContent = counts.out_of_stock || 0;

    /* Replenishment alert */
    var alertEl  = qs('#replenishment-alert');
    var alertMsg = qs('#replenishment-msg');
    var needsAlert = (counts.low + counts.critical + counts.out_of_stock);
    if (alertEl) {
        if (!needsAlert) {
            alertEl.classList.add('hidden');
        } else if (alertMsg) {
            alertMsg.textContent = needsAlert + ' Products need replenishment';
        }
    }

    /* Stock date */
    var dateEl = qs('#inv-date-text');
    if (dateEl) {
        var now = new Date();
        dateEl.textContent = now.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) +
            ' ' + now.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', hour12:true}).toUpperCase();
    }

    function applyFiltersAndSearch() {
        var q = searchQuery.toLowerCase().trim();
        filteredRows = allRows.filter(function(r) {
            var matchFilter = activeFilter === 'all' || r.dataset.filterStatus === activeFilter;
            var matchSearch = !q ||
                (r.dataset.name  && r.dataset.name.includes(q)) ||
                (r.dataset.category && r.dataset.category.includes(q));
            return matchFilter && matchSearch;
        });
        currentPage = 1;
        renderPage();
    }

    function renderPage() {
        var total     = filteredRows.length;
        var totalPages = Math.max(1, Math.ceil(total / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;

        var start = (currentPage - 1) * pageSize;
        var end   = Math.min(start + pageSize, total);

        // Hide all rows, show only current page slice
        allRows.forEach(function(r) { r.classList.add('hidden'); });
        filteredRows.forEach(function(r, i) {
            if (i >= start && i < end) r.classList.remove('hidden');
        });

        if (pageInfo) pageInfo.textContent = total === 0
            ? 'No results'
            : 'Showing ' + (start + 1) + '\u2013' + end + ' of ' + total;
        if (pageIndicator) pageIndicator.textContent = currentPage + '/' + totalPages;
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    }

    /* Filter button clicks */
    qsa('.inv-filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            qsa('.inv-filter-btn').forEach(function(b) {
                b.classList.remove('active-inv-filter', 'bg-report-0088ff', 'text-white');
                b.classList.add('border', 'border-kyc-medium-gray', 'text-dark-gray');
            });
            this.classList.add('active-inv-filter', 'bg-report-0088ff', 'text-white');
            this.classList.remove('border', 'border-kyc-medium-gray', 'text-dark-gray');
            activeFilter = this.dataset.filter;
            applyFiltersAndSearch();
        });
    });

    /* External filter trigger (from alert buttons) */
    window.filterInventoryByStatus = function(status) {
        var map = { low: 'low', expiry: 'all' };
        var target = map[status] || 'all';
        var btn = qs('.inv-filter-btn[data-filter="' + target + '"]');
        if (btn) btn.click();
    };

    /* Search */
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchQuery = this.value;
            applyFiltersAndSearch();
        });
    }

    /* Page size */
    if (pageSizeEl) {
        pageSizeEl.addEventListener('change', function() {
            pageSize = parseInt(this.value, 10) || 5;
            currentPage = 1;
            renderPage();
        });
    }

    /* Pagination buttons */
    if (prevBtn) prevBtn.addEventListener('click', function() { if (currentPage > 1) { currentPage--; renderPage(); } });
    if (nextBtn) nextBtn.addEventListener('click', function() {
        var total = filteredRows.length;
        var totalPages = Math.ceil(total / pageSize);
        if (currentPage < totalPages) { currentPage++; renderPage(); }
    });

    /* ============================================================
       3. MORE DROPDOWN (per row)
       ============================================================ */
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.inv-more-btn');
        if (btn) {
            var wrap = btn.closest('.inv-more-wrapper');
            var dropdown = wrap && wrap.querySelector('.inv-more-dropdown');
            // Close all others
            qsa('.inv-more-dropdown').forEach(function(d) {
                if (d !== dropdown) d.classList.add('hidden');
            });
            if (dropdown) dropdown.classList.toggle('hidden');
            e.stopPropagation();
            return;
        }
        // Click outside → close all
        qsa('.inv-more-dropdown').forEach(function(d) { d.classList.add('hidden'); });
    });

    /* Initial render */
    renderPage();

    var batchRows = qsa('.batch-row');
    var batchSearch = qs('#batch-search');
    var batchEmptyState = qs('#batch-empty-state');
    var activeBatchFilter = 'all';

    function applyBatchFilters() {
        var query = batchSearch ? batchSearch.value.toLowerCase().trim() : '';
        var visibleCount = 0;

        batchRows.forEach(function(row) {
            var statuses = (row.dataset.batchStatus || '').split(' ');
            var matchesFilter = activeBatchFilter === 'all' || statuses.indexOf(activeBatchFilter) !== -1;
            var matchesSearch = !query || (row.dataset.search || '').toLowerCase().includes(query);
            var isVisible = matchesFilter && matchesSearch;
            row.classList.toggle('hidden', !isVisible);
            if (isVisible) visibleCount++;
        });

        if (batchEmptyState) batchEmptyState.classList.toggle('hidden', visibleCount > 0);
    }

    qsa('.batch-filter-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            qsa('.batch-filter-btn').forEach(function(filterButton) {
                filterButton.classList.remove('bg-report-0088ff', 'text-white');
                filterButton.classList.add('border', 'border-[#E2E8F0]', 'text-dark-gray');
                filterButton.setAttribute('aria-pressed', 'false');
            });

            this.classList.add('bg-report-0088ff', 'text-white');
            this.classList.remove('border', 'border-[#E2E8F0]', 'text-dark-gray');
            this.setAttribute('aria-pressed', 'true');
            activeBatchFilter = this.dataset.filter;
            applyBatchFilters();
        });
    });

    if (batchSearch) batchSearch.addEventListener('input', applyBatchFilters);
    applyBatchFilters();

    var movementRows = qsa('.movement-row');
    var movementTypeFilter = qs('#movement-type-filter');
    var movementStartDate = qs('#movement-start-date');
    var movementEndDate = qs('#movement-end-date');
    var movementEmptyState = qs('#movement-empty-state');

    function filterMovements() {
        var type = movementTypeFilter ? movementTypeFilter.value : 'all';
        var startDate = movementStartDate ? movementStartDate.value : '';
        var endDate = movementEndDate ? movementEndDate.value : '';
        var visibleCount = 0;

        movementRows.forEach(function(row) {
            var date = row.dataset.date || '';
            var matchesType = type === 'all' || row.dataset.type === type;
            var matchesDate = (!startDate || date >= startDate) && (!endDate || date <= endDate);
            var isVisible = matchesType && matchesDate;
            row.classList.toggle('hidden', !isVisible);
            if (isVisible) visibleCount++;
        });

        if (movementEmptyState) movementEmptyState.classList.toggle('hidden', visibleCount > 0);
    }

    if (movementTypeFilter) movementTypeFilter.addEventListener('change', filterMovements);
    if (movementStartDate) movementStartDate.addEventListener('change', filterMovements);
    if (movementEndDate) movementEndDate.addEventListener('change', filterMovements);

    var movementExportButton = qs('#movement-export-btn');
    if (movementExportButton) movementExportButton.addEventListener('click', function() {
        var movementTable = qs('#movement-tbody');
        var headings = movementTable ? movementTable.closest('table').querySelectorAll('thead th') : [];
        var csvRows = [Array.from(headings).map(function(cell) {
            return '"' + cell.textContent.trim().replace(/"/g, '""') + '"';
        }).join(',')];

        movementRows.forEach(function(row) {
            if (row.classList.contains('hidden')) return;
            csvRows.push(Array.from(row.cells).map(function(cell) {
                return '"' + cell.textContent.trim().replace(/"/g, '""') + '"';
            }).join(','));
        });

        var blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        var downloadUrl = URL.createObjectURL(blob);
        var downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = 'stock-movements.csv';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        URL.revokeObjectURL(downloadUrl);
    });

    filterMovements();

    var supplierRows = qsa('.supplier-row');
    var supplierSearch = qs('#supplier-search');
    var supplierStatusFilter = qs('#supplier-status-filter');
    var supplierEmptyState = qs('#supplier-empty-state');

    function filterSuppliers() {
        var query = supplierSearch ? supplierSearch.value.toLowerCase().trim() : '';
        var status = supplierStatusFilter ? supplierStatusFilter.value : 'all';
        var visibleCount = 0;

        supplierRows.forEach(function(row) {
            var matchesSearch = !query || (row.dataset.search || '').toLowerCase().includes(query);
            var matchesStatus = status === 'all' || row.dataset.status === status;
            var isVisible = matchesSearch && matchesStatus;
            row.classList.toggle('hidden', !isVisible);
            if (isVisible) visibleCount++;
        });

        if (supplierEmptyState) supplierEmptyState.classList.toggle('hidden', visibleCount > 0);
    }

    if (supplierSearch) supplierSearch.addEventListener('input', filterSuppliers);
    if (supplierStatusFilter) supplierStatusFilter.addEventListener('change', filterSuppliers);
    filterSuppliers();

    var settingsPanel = qs('#inv-tab-settings');
    var storageLocations = qs('#storage-locations');
    var storageLocationTemplate = qs('#storage-location-template');
    var storageLocationForm = qs('#storage-location-form');
    var newStorageLocation = qs('#new-storage-location');
    var storageLocationError = qs('#storage-location-error');
    var settingsSaveStatus = qs('#settings-save-status');

    function setNotificationState(button, enabled) {
        var knob = button.querySelector('span');
        button.setAttribute('aria-checked', String(enabled));
        button.classList.toggle('bg-report-0088ff', enabled);
        button.classList.toggle('bg-[#CBD5E1]', !enabled);
        if (knob) {
            knob.classList.toggle('right-0.5', enabled);
            knob.classList.toggle('left-0.5', !enabled);
        }
    }

    function setLocationDisabled(row, disabled) {
        row.dataset.disabled = String(disabled);
        row.classList.toggle('opacity-50', disabled);
        var button = row.querySelector('.location-disable');
        if (button) {
            button.setAttribute('aria-pressed', String(disabled));
            button.setAttribute('aria-label', (disabled ? 'Enable ' : 'Disable ') + row.querySelector('.location-name').textContent);
        }
    }

    function getSettingsSnapshot() {
        return {
            reorder: qs('#setting-reorder-level').value,
            critical: qs('#setting-critical-level').value,
            target: qs('#setting-target-stock').value,
            expiryDays: qs('.settings-expiry-option[aria-pressed="true"]').dataset.days,
            notifications: qsa('.settings-toggle').map(function(button) {
                return button.getAttribute('aria-checked') === 'true';
            }),
            locations: qsa('.storage-location-row', storageLocations).map(function(row) {
                return {
                    name: row.querySelector('.location-name').textContent,
                    disabled: row.dataset.disabled === 'true'
                };
            })
        };
    }

    function renderStorageLocations(locations) {
        storageLocations.textContent = '';
        locations.forEach(function(location) {
            var row = storageLocationTemplate.content.firstElementChild.cloneNode(true);
            var name = row.querySelector('.location-name');
            name.textContent = location.name;
            row.querySelector('.location-edit-input').setAttribute('aria-label', 'Edit ' + location.name);
            row.querySelector('.location-edit').setAttribute('aria-label', 'Edit ' + location.name);
            row.querySelector('.location-save').setAttribute('aria-label', 'Save ' + location.name);
            storageLocations.appendChild(row);
            setLocationDisabled(row, location.disabled);
        });
    }

    function restoreSettings(settings) {
        qs('#setting-reorder-level').value = settings.reorder;
        qs('#setting-critical-level').value = settings.critical;
        qs('#setting-target-stock').value = settings.target;
        settingsPanel.querySelectorAll('.settings-expiry-option').forEach(function(button) {
            var selected = button.dataset.days === settings.expiryDays;
            button.setAttribute('aria-pressed', String(selected));
            button.classList.toggle('bg-[#E8F3FF]', selected);
            button.classList.toggle('text-dodger-blue', selected);
            button.classList.toggle('bg-[#F1F5F9]', !selected);
            button.classList.toggle('text-dark-gray', !selected);
        });
        settingsPanel.querySelectorAll('.settings-toggle').forEach(function(button, index) {
            setNotificationState(button, settings.notifications[index]);
        });
        renderStorageLocations(settings.locations);
    }

    settingsPanel.querySelectorAll('.settings-expiry-option').forEach(function(button) {
        button.addEventListener('click', function() {
            settingsPanel.querySelectorAll('.settings-expiry-option').forEach(function(option) {
                var selected = option === button;
                option.setAttribute('aria-pressed', String(selected));
                option.classList.toggle('bg-[#E8F3FF]', selected);
                option.classList.toggle('text-dodger-blue', selected);
                option.classList.toggle('bg-[#F1F5F9]', !selected);
                option.classList.toggle('text-dark-gray', !selected);
            });
        });
    });

    settingsPanel.querySelectorAll('.settings-toggle').forEach(function(button) {
        button.addEventListener('click', function() {
            setNotificationState(this, this.getAttribute('aria-checked') !== 'true');
        });
    });

    storageLocations.addEventListener('click', function(event) {
        var button = event.target.closest('button');
        if (!button) return;

        var row = button.closest('.storage-location-row');
        if (!row) return;

        if (button.classList.contains('location-edit')) {
            var editor = row.querySelector('.location-editor');
            var input = row.querySelector('.location-edit-input');
            input.value = row.querySelector('.location-name').textContent;
            row.querySelector('.location-name').classList.add('hidden');
            editor.classList.remove('hidden');
            button.classList.add('hidden');
            row.querySelector('.location-save').classList.remove('hidden');
            input.focus();
        } else if (button.classList.contains('location-save')) {
            var locationInput = row.querySelector('.location-edit-input');
            var updatedName = locationInput.value.trim();
            if (!updatedName) {
                locationInput.focus();
                return;
            }
            var duplicate = qsa('.storage-location-row', storageLocations).some(function(otherRow) {
                return otherRow !== row && otherRow.querySelector('.location-name').textContent.toLowerCase() === updatedName.toLowerCase();
            });
            if (duplicate) {
                storageLocationError.classList.remove('hidden');
                locationInput.focus();
                return;
            }
            storageLocationError.classList.add('hidden');
            row.querySelector('.location-name').textContent = updatedName;
            row.querySelector('.location-name').classList.remove('hidden');
            row.querySelector('.location-editor').classList.add('hidden');
            row.querySelector('.location-edit').classList.remove('hidden');
            button.classList.add('hidden');
            row.querySelector('.location-edit').setAttribute('aria-label', 'Edit ' + updatedName);
            row.querySelector('.location-disable').setAttribute('aria-label', 'Disable ' + updatedName);
        } else if (button.classList.contains('location-disable')) {
            setLocationDisabled(row, row.dataset.disabled !== 'true');
        }
    });

    qs('#add-storage-location').addEventListener('click', function() {
        storageLocationForm.classList.remove('hidden');
        this.classList.add('hidden');
        newStorageLocation.focus();
    });

    qs('#cancel-storage-location').addEventListener('click', function() {
        storageLocationForm.reset();
        storageLocationForm.classList.add('hidden');
        qs('#add-storage-location').classList.remove('hidden');
        storageLocationError.classList.add('hidden');
    });

    storageLocationForm.addEventListener('submit', function(event) {
        event.preventDefault();
        var locationName = newStorageLocation.value.trim();
        var exists = qsa('.storage-location-row', storageLocations).some(function(row) {
            return row.querySelector('.location-name').textContent.toLowerCase() === locationName.toLowerCase();
        });
        if (!locationName || exists) {
            storageLocationError.classList.toggle('hidden', !exists);
            newStorageLocation.focus();
            return;
        }

        storageLocationError.classList.add('hidden');
        var row = storageLocationTemplate.content.firstElementChild.cloneNode(true);
        row.querySelector('.location-name').textContent = locationName;
        row.querySelector('.location-edit-input').setAttribute('aria-label', 'Edit ' + locationName);
        row.querySelector('.location-edit').setAttribute('aria-label', 'Edit ' + locationName);
        row.querySelector('.location-save').setAttribute('aria-label', 'Save ' + locationName);
        row.querySelector('.location-disable').setAttribute('aria-label', 'Disable ' + locationName);
        storageLocations.appendChild(row);
        this.reset();
        this.classList.add('hidden');
        qs('#add-storage-location').classList.remove('hidden');
    });

    var savedSettings = getSettingsSnapshot();
    qs('#save-inventory-settings').addEventListener('click', function() {
        var numericInputs = [
            qs('#setting-reorder-level'),
            qs('#setting-critical-level'),
            qs('#setting-target-stock')
        ];
        var invalidInput = numericInputs.find(function(input) {
            return !input.checkValidity();
        });
        if (invalidInput) {
            invalidInput.reportValidity();
            return;
        }
        savedSettings = getSettingsSnapshot();
        settingsSaveStatus.textContent = 'Settings saved.';
    });
    qs('#discard-inventory-settings').addEventListener('click', function() {
        restoreSettings(savedSettings);
        settingsSaveStatus.textContent = 'Changes discarded.';
    });
})();
