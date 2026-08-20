    $(document).ready(function() {
        let currentStep = 1;
        const totalSteps = 3;

        // Initialize stepper styling on load
        updateStepTab(1, 'active');
        updateStepTab(2, 'locked');
        updateStepTab(3, 'locked');
        updateStepTab(4, 'locked');

        // Custom Country Code Dropdown toggle
        $('#country-dropdown-btn').on('click', function(e) {
            e.stopPropagation();
            $('#country-dropdown-list').toggleClass('hidden');
        });

        // Close dropdown when clicking outside
        $(document).on('click', function() {
            $('#country-dropdown-list').addClass('hidden');
        });

        // Select country option
        $('.country-option').on('click', function() {
            const code = $(this).data('code');
            $('#selected-code').text(code);
            $('#phone_country_code').val(code);
            $('#country-dropdown-list').addClass('hidden');
        });

        // Numeric constraint for phone input field
        $('#phone').on('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        // Custom Country Code Dropdown toggle for Facility (Step 3)
        $('#facility-country-dropdown-btn').on('click', function(e) {
            e.stopPropagation();
            $('#facility-country-dropdown-list').toggleClass('hidden');
        });

        // Select country option for Facility
        $('.facility-country-option').on('click', function() {
            const code = $(this).data('code');
            $('#facility-selected-code').text(code);
            $('#facility_phone_country_code').val(code);
            $('#facility-country-dropdown-list').addClass('hidden');
        });

        // Numeric constraint for Facility phone input field
        $('#facility_phone').on('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        // Document Type Selection Handler for Step 2
        $('.doc-selector-card').on('click', function() {
            const card = $(this);
            const docType = card.data('doc');
            
            // Check the radio input
            card.find('input[type="radio"]').prop('checked', true);

            // Reset styling on all cards
            $('.doc-selector-card').removeClass('border-{{ border }}').addClass('border-slate-200');
            $('.doc-selector-card').find('.w-12').removeClass('bg-{{ border }} text-white').addClass('bg-slate-100 text-slate-400');
            $('.doc-selector-card').find('.doc-radio-indicator').removeClass('border-{{ border }}').addClass('border-slate-300');
            $('.doc-selector-card').find('.doc-radio-indicator div').removeClass('bg-{{ border }}').addClass('bg-transparent');

            // Apply active styles to selected card
            card.removeClass('border-slate-200').addClass('border-{{ border }}');
            card.find('.w-12').removeClass('bg-slate-100 text-slate-400').addClass('bg-{{ border }} text-white');
            card.find('.doc-radio-indicator').removeClass('border-slate-300').addClass('border-{{ border }}');
            card.find('.doc-radio-indicator div').removeClass('bg-transparent').addClass('bg-{{ border }}');

            // Dynamic translations based on selected doc type
            let docLabel = '';
            let inlineDocName = '';
            let capitalizeDocName = '';
            let showBackSide = true;

            if (docType === 'aadhaar') {
                docLabel = 'Upload Aadhaar Card';
                inlineDocName = 'Aadhaar';
                capitalizeDocName = 'Aadhar';
            } else if (docType === 'pan') {
                docLabel = 'Upload PAN Card';
                inlineDocName = 'PAN Card';
                capitalizeDocName = 'PAN';
                showBackSide = false;
            } else if (docType === 'license') {
                docLabel = 'Upload Driving Licence';
                inlineDocName = 'Driving Licence';
                capitalizeDocName = 'Licence';
            } else if (docType === 'passport') {
                docLabel = 'Upload Passport';
                inlineDocName = 'Passport';
                capitalizeDocName = 'Passport';
            }

            // Update DOM texts
            $('#upload-section-title').text(docLabel);
            $('.doc-name-inline').text(inlineDocName);
            $('.doc-name-capitalize').text(capitalizeDocName);

            // Update input labels
            $('label[for="id_full_name"]').html(`Full Name (as per <span class="doc-name-capitalize">${capitalizeDocName}</span>)`);
            $('label[for="id_doc_number"]').html(`<span class="doc-name-capitalize">${capitalizeDocName}</span> Number`);
            
            // Adjust input placeholders
            $('#id_full_name').attr('placeholder', `Enter full name as per ${inlineDocName}`);
            $('#id_doc_number').attr('placeholder', `Enter ${inlineDocName} number`);

            // Toggle back side upload section visibility
            if (showBackSide) {
                $('#back-side-upload-wrapper').removeClass('hidden');
            } else {
                $('#back-side-upload-wrapper').addClass('hidden');
            }
        });

        // File Upload feedback animation
        $('input[type="file"]').on('change', function() {
            const input = $(this);
            const parent = input.parent();
            const fileName = this.files.length > 0 ? this.files[0].name : '';
            
            if (fileName) {
                // Change style to selected state
                parent.removeClass('border-dashed border-slate-200 border-blue-400')
                      .addClass('border-solid border-green-500 bg-green-50/10');
                parent.find('.material-symbols-outlined')
                      .text('task')
                      .removeClass('text-slate-400 text-{{ border }}')
                      .addClass('text-green-600');
                parent.find('.text-slate-700, .font-bold')
                      .text('File selected successfully!')
                      .removeClass('text-slate-700')
                      .addClass('text-green-800');
                parent.find('.text-slate-400, .text-[10px]')
                      .text(fileName)
                      .removeClass('text-slate-400')
                      .addClass('text-green-600 font-semibold');
            }
        });

        // Step 4 File Upload Handlers & Modal Preview Integration
        let activeFileInput = null;

        $('.step4-file-input').on('change', function() {
            const input = $(this);
            const targetBox = $(input.data('target'));
            const badgeSelector = input.data('badge');
            const fileName = this.files.length > 0 ? this.files[0].name : '';

            if (fileName) {
                // Update file indicator box text
                targetBox.text(fileName);
                targetBox.removeClass('border-blue-400 text-blue-500').addClass('border-green-500 text-green-600 bg-green-50/10');
                
                // If there was a Blurry badge, turn it into a green Virus Scan badge!
                if (badgeSelector) {
                    const badge = $(badgeSelector);
                    badge.removeClass('bg-red-50 text-red-600 border-red-200')
                         .addClass('bg-green-50 text-green-600 border-green-200');
                    badge.find('.material-symbols-outlined').text('check');
                    badge.find('span:last-child').text('Virus scan');
                }

                // If the modal is open for this active input, update its preview image live
                if (activeFileInput === this && this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        $('#preview-image-element').attr('src', e.target.result).removeClass('hidden');
                        $('#preview-placeholder').addClass('hidden');
                    };
                    reader.readAsDataURL(this.files[0]);
                }
            }
        });

        // Step 4 Eye Icon Click handler (Inline preview display)
        $('.step4-view-btn').on('click', function() {
            const btn = $(this);
            const docTitle = btn.data('title');
            const selector = btn.data('input');
            const fileInput = $(selector)[0];
            
            activeFileInput = fileInput; // Cache input element reference

            $('#preview-modal-title').text(docTitle);

            if (fileInput && fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    $('#preview-image-element').attr('src', e.target.result).removeClass('hidden');
                    $('#preview-placeholder').addClass('hidden');
                };
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                // If no file uploaded, show placeholder warning view
                $('#preview-image-element').addClass('hidden').attr('src', '');
                $('#preview-placeholder').removeClass('hidden');
            }

            // Hide Step 4 list & rejection explanation, show preview div
            $('#step4-main-content').addClass('hidden');
            $('#step4-preview-content').removeClass('hidden');
        });

        // Close preview panel resets preview elements and shows Step 4 list back
        $('#close-preview-btn, #preview-save-btn').on('click', function() {
            activeFileInput = null;
            $('#preview-modal-title').text('Select a Document to View');
            $('#preview-image-element').addClass('hidden').attr('src', '');
            $('#preview-placeholder').removeClass('hidden');

            // Hide preview, show Step 4 list & rejection explanation
            $('#step4-preview-content').addClass('hidden');
            $('#step4-main-content').removeClass('hidden');
        });

        // Replace button click triggers corresponding file input click
        $('#preview-replace-btn').on('click', function() {
            if (activeFileInput) {
                $(activeFileInput).click();
            }
        });

        // Next button click handler (navigates steps or submits)
        $('#next-step-btn').on('click', function() {
            // Basic form validation for the current visible panel
            const currentPanel = $(`#step-panel-${currentStep}`);
            let isValid = true;
            
            // Validate required inputs in current step
            currentPanel.find('input[required]').each(function() {
                if (!$(this).val()) {
                    isValid = false;
                    $(this).addClass('border-red-400 focus:border-red-400 focus:ring-red-400');
                    toastr.warning('Please fill out all required fields.');
                } else {
                    $(this).removeClass('border-red-400 focus:border-red-400 focus:ring-red-400');
                }
            });

            if (!isValid) return;

            if (currentStep < totalSteps) {
                // Update current step tab indicator to COMPLETED state (green checkmark)
                updateStepTab(currentStep, 'completed');
                
                // Hide current panel and show next panel with entry animation
                $(`#step-panel-${currentStep}`).addClass('hidden');
                currentStep++;
                $(`#step-panel-${currentStep}`)
                    .removeClass('hidden')
                    .addClass('step-fade-enter');
                
                setTimeout(() => {
                    $(`#step-panel-${currentStep}`)
                        .removeClass('step-fade-enter')
                        .addClass('step-fade-active');
                }, 50);

                // Update tab indicator to ACTIVE state
                updateStepTab(currentStep, 'active');

                // Update progress percentage
                updateProgress(currentStep);

                if (currentStep === totalSteps) {
                    $('#next-btn-text').text('Submit Verification');
                }
            } else {
                // final submit - redirect to profile review page
                window.location.href = "{% url 'lab_profile_review' %}";
            }
        });

        // Previous button click handler
        $('#prev-step-btn').on('click', function() {
            if (currentStep > 1) {
                // Revert current step tab back to LOCKED/INACTIVE state
                updateStepTab(currentStep, 'locked');
                
                $(`#step-panel-${currentStep}`).addClass('hidden');
                currentStep--;
                
                $(`#step-panel-${currentStep}`)
                    .removeClass('hidden')
                    .addClass('step-fade-enter');
                
                setTimeout(() => {
                    $(`#step-panel-${currentStep}`)
                        .removeClass('step-fade-enter')
                        .addClass('step-fade-active');
                }, 50);

                // Revert active tab to ACTIVE state
                updateStepTab(currentStep, 'active');

                // Update progress
                updateProgress(currentStep);

                $('#next-btn-text').text('Save & Continue');
            } else {
                // Redirect back to new_kyc page when clicking Back on Step 1
                window.location.href = "{% url 'lab_kyc' %}";
            }
        });

        // Helper to update progress status display
        function updateProgress(step) {
            let percentage = 25 * step;
            if (step === totalSteps) percentage = 95; // Leave room for submission
            
            $('#status-percentage').text(percentage + '%');
            $('#status-bar-fill').css('width', percentage + '%');
            
            // Stepper connecting line width
            let lineWidth = 33.33 * (step - 1);
            $('#stepper-connecting-line').css('width', lineWidth + '%');
        }

        // Helper to toggle stepper icon and circle borders/colors dynamically
        function updateStepTab(stepNum, state) {
            const tab = $(`#step-tab-${stepNum}`);
            const circle = tab.find('.step-kyc-circle');
            const label = tab.find('.step-label');
            const icon = tab.find('.step-kyc-icon');

            // Clear all state classes first to prevent style conflicts
            circle.removeClass('border-kyc-icon bg-kyc-blue text-kyc-icon bg-kyc-green text-white font-bold border-slate-200 bg-slate-50 text-slate-400 font-semibold');
            label.removeClass('text-slate-400 text-green-600 text-slate-800 text-blue-charcoal font-semibold font-bold');

            if (state === 'active') {
                // Active Brand Theme Border & Icon
                circle.addClass('border-kyc-icon bg-kyc-blue text-kyc-icon');
                label.addClass('text-blue-charcoal font-bold');
                
                // Set appropriate icon
                if (stepNum === 1) icon.text('person');
                else if (stepNum === 2) icon.text('badge');
                else if (stepNum === 3) icon.text('{% if user.user_type == "hospital" %}local_hospital{% elif user.user_type == "pharmacy" %}local_pharmacy{% else %}storefront{% endif %}');
                else icon.text('description');

            } else if (state === 'completed') {
                // Completed Green Checkmark
                circle.addClass('bg-kyc-green text-white font-bold');
                label.addClass('text-green-600 font-bold');
                icon.text('check');

            } else if (state === 'locked') {
                // Locked Gray Style
                circle.addClass('border-slate-200 bg-slate-50 text-slate-400 font-semibold');
                label.addClass('text-slate-400 font-semibold');
                icon.text('lock');
            }
        }
    });