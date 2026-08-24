// ============================================================
// LAB KYC - EXACTLY 3 STEPS
// ============================================================

let currentStep = 1;
const totalSteps = 3;

const LAB_SAVE_URL = "/user/lab-profile-verification/save/";
const LAB_KYC_URL = "/user/lab-kyc/";
const LAB_REVIEW_URL = "/user/lab-profile-review/";


// ============================================================
// DOCUMENT READY
// ============================================================

$(document).ready(function () {

    console.log("=================================");
    console.log("LAB KYC JS INITIALIZED");
    console.log("3 STEP FLOW");
    console.log("=================================");

    // --------------------------------------------------------
    // INITIAL STEPPER
    // --------------------------------------------------------

    showStep(1);

    updateStepTab(1, "active");
    updateStepTab(2, "locked");
    updateStepTab(3, "locked");

    updateProgress(1);

    // --------------------------------------------------------
    // LOAD LAB DROPDOWNS
    // --------------------------------------------------------

    initializeLabDropdowns();

    // --------------------------------------------------------
    // LOCATION
    // --------------------------------------------------------

    initializeLabLocation();

    // Country changed
    $(document).on(
        "change",
        '[name="lab_country"]',
        function () {

            const countryId = $(this).val();

            loadLabStates(countryId);
        }
    );

    // State changed
    $(document).on(
        "change",
        '[name="lab_state"]',
        function () {

            const stateId = $(this).val();

            loadLabCities(stateId);
        }
    );

    // --------------------------------------------------------
    // PHONE
    // --------------------------------------------------------

    $(document).on(
        "input",
        '[name="lab_phone"]',
        function () {

            this.value = this.value
                .replace(/\D/g, "")
                .substring(0, 10);
        }
    );

    $(document).on(
        "input",
        '[name="alt_phone"]',
        function () {

            this.value = this.value
                .replace(/\D/g, "")
                .substring(0, 10);
        }
    );

    // --------------------------------------------------------
    // PINCODE
    // --------------------------------------------------------

    $(document).on(
        "input",
        '[name="lab_pincode"]',
        function () {

            this.value = this.value
                .replace(/\D/g, "")
                .substring(0, 6);
        }
    );

    // --------------------------------------------------------
    // NAME VALIDATION
    // --------------------------------------------------------

    $(document).on(
        "input",
        '[name="lab_name"]',
        function () {

            this.value = this.value
                .replace(/[^A-Za-z0-9 .&()'-]/g, "");
        }
    );

    $(document).on(
        "input",
        '[name="owner_name"], [name="contact_name"]',
        function () {

            this.value = this.value
                .replace(/[^A-Za-z .'-]/g, "");
        }
    );

    // --------------------------------------------------------
    // STEP 2 OTP
    // --------------------------------------------------------

    $(document).on(
        "input",
        '[name="contact_otp"]',
        function () {

            let otp = $(this)
                .val()
                .replace(/\D/g, "")
                .substring(0, 6);

            $(this).val(otp);

            $("#contact_verified")
                .addClass("hidden")
                .removeClass("flex");

            $("#contact_not_verified")
                .addClass("hidden")
                .removeClass("flex");

            $("#contact_otp_verified").val("0");

            if (!otp) {
                return;
            }

            // Existing development OTP
            if (otp === "123456") {

                $("#contact_verified")
                    .removeClass("hidden")
                    .addClass("flex");

                $("#contact_otp_verified").val("1");

            } else {

                $("#contact_not_verified")
                    .removeClass("hidden")
                    .addClass("flex");
            }
        }
    );

    // --------------------------------------------------------
    // RESEND CONTACT OTP
    // --------------------------------------------------------

    $(document).on(
        "click",
        ".contact_resend_otp",
        function (e) {

            e.preventDefault();

            $('[name="contact_otp"]').val("");

            $("#contact_otp_verified").val("0");

            $("#contact_verified")
                .addClass("hidden")
                .removeClass("flex");

            $("#contact_not_verified")
                .addClass("hidden")
                .removeClass("flex");

            showSuccess("OTP sent successfully");
        }
    );

    // ========================================================
    // NEXT BUTTON
    // ========================================================

    $(document).on(
        "click",
        "#next-step-btn",
        function (e) {

            e.preventDefault();

            if ($(this).prop("disabled")) {
                return;
            }

            console.log(
                "NEXT CLICKED - CURRENT STEP:",
                currentStep
            );

            // ------------------------------------------------
            // STEP 1
            // ------------------------------------------------

            if (currentStep === 1) {

                saveLabStep1();

                return;
            }

            // ------------------------------------------------
            // STEP 2
            // ------------------------------------------------

            if (currentStep === 2) {

                saveLabStep2();

                return;
            }

            // ------------------------------------------------
            // STEP 3
            // ------------------------------------------------

            if (currentStep === 3) {

                saveLabStep3();

                return;
            }
        }
    );

    // ========================================================
    // PREVIOUS BUTTON
    // ========================================================

    $(document).on(
        "click",
        "#prev-step-btn",
        function (e) {

            e.preventDefault();

            if (currentStep > 1) {

                const oldStep = currentStep;

                updateStepTab(
                    oldStep,
                    "locked"
                );

                $(`#step-panel-${oldStep}`)
                    .addClass("hidden");

                currentStep--;

                $(`#step-panel-${currentStep}`)
                    .removeClass("hidden")
                    .addClass("step-fade-enter");

                setTimeout(function () {

                    $(`#step-panel-${currentStep}`)
                        .removeClass("step-fade-enter")
                        .addClass("step-fade-active");

                }, 50);

                updateStepTab(
                    currentStep,
                    "active"
                );

                updateProgress(
                    currentStep
                );

                setNextButtonText();

            } else {

                window.location.href =
                    LAB_KYC_URL;
            }
        }
    );


    //verify otp 
    $("#facility_otp").on("input", function () {
    let otp = $(this).val().replace(/\D/g, "");

    // Allow only 6 digits
    otp = otp.substring(0, 6);

    $(this).val(otp);

    // Always hide both first
    $("#lab_verified").addClass("hidden").removeClass("flex");

    $("#lab_not_verified").addClass("hidden").removeClass("flex");

    // Reset verification
    $("#phone_otp_verified").val("0");

    // If empty, keep both hidden
    if (otp.length === 0) {
        return;
    }

    // Correct OTP
    if (otp === "123456") {
        $("#lab_verified").removeClass("hidden").addClass("flex");

        $("#phone_otp_verified").val("1");
    }
    // Any other entered OTP
    else {
        $("#lab_not_verified").removeClass("hidden").addClass("flex");

        $("#phone_otp_verified").val("0");
    }
    });

});

//resend
$(".lab_resend_otp").on("click", function (e) {
  e.preventDefault();

  // Reset OTP verification
  $("#facility_otp").val("");
  $("#phone_otp_verified").val("0");

  $("#lab_verified").addClass("hidden").removeClass("flex");

  $("#lab_not_verified").addClass("hidden").removeClass("flex");

  // Show toast
  toastr.success("OTP sent successfully");
});

// ============================================================
// FILE INPUT - SHOW SELECTED FILE NAME
// ============================================================

// ============================================================
// LAB KYC DOCUMENT UPLOAD + VIRUS SCAN
// ============================================================

$(document).on(
    "change",
    ".step4-file-input",
    function () {

        const input = this;
        const $input = $(input);

        const fileNameSelector =
            $input.data("target");

        const scanStatusSelector =
            $input.data("scan-status");

        const $fileName =
            $(fileNameSelector);

        const $scanStatus =
            $(scanStatusSelector);

        // --------------------------------------------------------
        // NO FILE
        // --------------------------------------------------------

        if (!input.files || !input.files.length) {

            $fileName
                .text("No file")
                .attr("title", "");

            setScanStatus(
                $scanStatus,
                "pending"
            );

            return;
        }

        const file =
            input.files[0];

        // --------------------------------------------------------
        // FILE SIZE
        // --------------------------------------------------------

        const MAX_FILE_SIZE =
            5 * 1024 * 1024;

        if (file.size > MAX_FILE_SIZE) {

            toastr.error(
                "File must be under 5MB."
            );

            input.value = "";

            $fileName
                .text("No file")
                .attr("title", "");

            setScanStatus(
                $scanStatus,
                "error",
                "File too large"
            );

            return;
        }

        // --------------------------------------------------------
        // FILE TYPE
        // --------------------------------------------------------

        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png"
        ];

        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();

        const allowedExtensions = [
            "pdf",
            "jpg",
            "jpeg",
            "png"
        ];

        if (
            !allowedTypes.includes(file.type) &&
            !allowedExtensions.includes(extension)
        ) {

            toastr.error(
                "Only PDF, JPG, JPEG or PNG files are allowed."
            );

            input.value = "";

            $fileName
                .text("No file")
                .attr("title", "");

            setScanStatus(
                $scanStatus,
                "error",
                "Invalid file type"
            );

            return;
        }

        // --------------------------------------------------------
        // SHOW FILE NAME
        // --------------------------------------------------------

        $fileName
            .text(file.name)
            .attr("title", file.name)
            .removeClass(
                "border-blue-400 text-blue-500 bg-blue-50/10"
            )
            .addClass(
                "border-green-500 text-green-600 bg-green-50"
            );

        // --------------------------------------------------------
        // SCANNING STATE
        // --------------------------------------------------------

        setScanStatus(
            $scanStatus,
            "scanning"
        );

        console.log(
            "Virus scanning:",
            input.name,
            file.name
        );

        // --------------------------------------------------------
        // SEND FILE TO VIRUS SCANNER
        // --------------------------------------------------------

        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );

        formData.append(
            "csrfmiddlewaretoken",
            $("input[name='csrfmiddlewaretoken']").val()
        );

        $.ajax({

            url: "/user/file-scan/",

            type: "POST",

            data: formData,

            processData: false,

            contentType: false,

            success: function (response) {

                console.log(
                    "Virus scan response:",
                    response
                );

                if (
                    response &&
                    response.safe === true
                ) {
                    $(input).data(
                        "virus-scanned",
                        true
                    );
                    // ------------------------------------------------
                    // SAFE
                    // ------------------------------------------------

                    setScanStatus(
                        $scanStatus,
                        "safe",
                        response.message ||
                        "Virus scan passed"
                    );

                    toastr.success(
                        file.name +
                        " passed virus scan."
                    );

                    console.log(
                        "FILE SAFE:",
                        file.name
                    );

                } else {

                    // ------------------------------------------------
                    // INFECTED / UNSAFE
                    // ------------------------------------------------

                    console.error(
                        "FILE REJECTED:",
                        file.name,
                        response
                    );

                    input.value = "";

                    $fileName
                        .text("No file")
                        .attr("title", "")
                        .removeClass(
                            "border-green-500 text-green-600 bg-green-50"
                        )
                        .addClass(
                            "border-blue-400 text-blue-500 bg-blue-50/10"
                        );

                    setScanStatus(
                        $scanStatus,
                        "infected",
                        response.message ||
                        "File failed virus scan"
                    );

                    toastr.error(
                        response.message ||
                        "File failed virus scan."
                    );
                }
            },

            error: function (xhr) {

                console.error(
                    "Virus scan request failed:",
                    xhr.responseText
                );

                // IMPORTANT:
                // Scanner unavailable = file rejected.

                input.value = "";

                $fileName
                    .text("No file")
                    .attr("title", "")
                    .removeClass(
                        "border-green-500 text-green-600 bg-green-50"
                    )
                    .addClass(
                        "border-blue-400 text-blue-500 bg-blue-50/10"
                    );

                let message =
                    "Virus scanner unavailable. Please try again.";

                if (
                    xhr.responseJSON &&
                    xhr.responseJSON.message
                ) {
                    message =
                        xhr.responseJSON.message;
                }

                setScanStatus(
                    $scanStatus,
                    "error",
                    "Scan failed"
                );

                toastr.error(message);
            }
        });
    }
);

// ============================================================
// VIRUS SCAN STATUS UI
// ============================================================

function setScanStatus(
    $status,
    state,
    message = ""
) {

    if (!$status || !$status.length) {
        return;
    }

    const $icon =
        $status.find(
            ".material-symbols-outlined"
        );

    const $text =
        $status.find(
            ".scan-status-text"
        );

    // Remove all previous states
    $status.removeClass(
        [
            "bg-slate-50",
            "text-slate-500",
            "border-slate-200",

            "bg-blue-50",
            "text-blue-600",
            "border-blue-200",

            "bg-green-50",
            "text-green-600",
            "border-green-200",

            "bg-red-50",
            "text-red-600",
            "border-red-200"
        ].join(" ")
    );

    $icon.removeClass(
        [
            "bg-slate-400",
            "bg-blue-500",
            "bg-green-600",
            "bg-red-600"
        ].join(" ")
    );

    // --------------------------------------------------------
    // PENDING
    // --------------------------------------------------------

    if (state === "pending") {

        $status.addClass(
            "bg-slate-50 text-slate-500 border-slate-200"
        );

        $icon
            .addClass("bg-slate-400")
            .text("shield");

        $text.text(
            message || "Virus scan pending"
        );

        return;
    }

    // --------------------------------------------------------
    // SCANNING
    // --------------------------------------------------------

    if (state === "scanning") {

        $status.addClass(
            "bg-blue-50 text-blue-600 border-blue-200"
        );

        $icon
            .addClass("bg-blue-500")
            .text("progress_activity");

        $text.text(
            "Scanning..."
        );

        return;
    }

    // --------------------------------------------------------
    // SAFE
    // --------------------------------------------------------

    if (state === "safe") {

        $status.addClass(
            "bg-green-50 text-green-600 border-green-200"
        );

        $icon
            .addClass("bg-green-600")
            .text("check");

        $text.text(
            message || "Virus scan passed"
        );

        return;
    }

    // --------------------------------------------------------
    // INFECTED
    // --------------------------------------------------------

    if (state === "infected") {

        $status.addClass(
            "bg-red-50 text-red-600 border-red-200"
        );

        $icon
            .addClass("bg-red-600")
            .text("dangerous");

        $text.text(
            message || "Virus detected"
        );

        return;
    }

    // --------------------------------------------------------
    // ERROR
    // --------------------------------------------------------

    if (state === "error") {

        $status.addClass(
            "bg-red-50 text-red-600 border-red-200"
        );

        $icon
            .addClass("bg-red-600")
            .text("error");

        $text.text(
            message || "Scan failed"
        );
    }
}
// ============================================================
// CHECK ALL LAB DOCUMENTS HAVE PASSED VIRUS SCAN
// ============================================================

function allLabDocumentsScanned() {

    const requiredDocuments = [
        "lab_certificate",
        "identity_proof_aadhar",
        "identity_proof_pan",
        "gov_license",
        "lab_photo"
    ];

    for (const name of requiredDocuments) {

        const input =
            $(`[name="${name}"]`)[0];

        if (
            !input ||
            !input.files ||
            !input.files.length
        ) {
            return false;
        }

        const scanSelector =
            $(input).data("scan-status");

        const status =
            $(scanSelector)
                .find(".scan-status-text")
                .text()
                .trim();

        if (
            status !== "Virus scan passed" &&
            status !== "File scanned successfully."
        ) {
            return false;
        }
    }

    return true;
}
// ============================================================
// LAB DROPDOWNS
// ============================================================

function initializeLabDropdowns() {

    console.log("Initializing lab dropdowns...");

    /*
     * These dropdowns MUST be rendered from:
     *
     * LabService
     * LabFacility
     * LabTiming
     *
     * The Django view already sends:
     *
     * lab_services
     * lab_facilities
     * lab_times
     *
     * to kyc_lab_profile.html.
     *
     * JS does not create hospital values.
     */

    initializeDropdown(
        '[name="lab_service"]',
        "Lab Service"
    );

    initializeDropdown(
        '[name="lab_facility"]',
        "Lab Facility"
    );

    initializeDropdown(
        '[name="lab_timing"]',
        "Working Hours"
    );
}


// ============================================================
// GENERIC DROPDOWN CHECK
// ============================================================

function initializeDropdown(
    selector,
    label
) {

    const dropdown = $(selector);

    if (!dropdown.length) {

        console.warn(
            `${label} dropdown not found:`,
            selector
        );

        return;
    }

    console.log(
        `${label} dropdown found:`,
        dropdown.find("option").length,
        "options"
    );

    /*
     * Remove accidental hospital options if they exist.
     *
     * We intentionally DO NOT add hardcoded hospital values.
     */

    dropdown.find("option").each(function () {

        const text =
            $(this)
                .text()
                .trim()
                .toLowerCase();

        if (
            text === "general medicine" ||
            text === "cardiology" ||
            text === "orthopedics" ||
            text === "pediatrics" ||
            text === "emergency 24/7" ||
            text === "icu" ||
            text === "operation theater" ||
            text === "opd consultation"
        ) {

            console.warn(
                `Removing hospital option from ${label}:`,
                $(this).text()
            );

            $(this).remove();
        }
    });
}


// ============================================================
// LOCATION INITIALIZATION
// ============================================================

function initializeLabLocation() {

    const country =
        $('[name="lab_country"]');

    const state =
        $('[name="lab_state"]');

    const city =
        $('[name="lab_city"]');

    if (!country.length) {
        return;
    }

    const countryId =
        country.val();

    if (!countryId) {
        return;
    }

    const existingStateId =
        state.val();

    const existingCityId =
        city.val();

    loadLabStates(
        countryId,
        existingStateId,
        existingCityId
    );
}


// ============================================================
// LOAD STATES
// ============================================================

function loadLabStates(
    countryId,
    preferredStateId = null,
    preferredCityId = null
) {

    const state =
        $('[name="lab_state"]');

    const city =
        $('[name="lab_city"]');

    if (!state.length) {
        return;
    }

    if (!countryId) {

        state.html(
            '<option value="">Select State</option>'
        );

        city.html(
            '<option value="">Select City</option>'
        );

        return;
    }

    $.ajax({

        url:
            "/user/lab-profile-verification/get-states/",

        type: "GET",

        data: {
            country_id: countryId
        },

        success: function (response) {

            state.empty();

            city.empty();

            state.append(
                '<option value="">Select State</option>'
            );

            city.append(
                '<option value="">Select City</option>'
            );

            if (
                !response.success ||
                !Array.isArray(response.states)
            ) {

                console.error(
                    "No lab states returned:",
                    response
                );

                return;
            }

            $.each(
                response.states,
                function (index, item) {

                    const selected =
                        String(item.id) ===
                        String(preferredStateId)
                            ? "selected"
                            : "";

                    state.append(`
                        <option
                            value="${item.id}"
                            ${selected}
                        >
                            ${escapeHtml(item.name)}
                        </option>
                    `);
                }
            );

            const finalStateId =
                state.val();

            if (finalStateId) {

                loadLabCities(
                    finalStateId,
                    preferredCityId
                );
            }
        },

        error: function (xhr) {

            console.error(
                "Lab states error:",
                xhr.responseText
            );

            state.html(
                '<option value="">Select State</option>'
            );

            city.html(
                '<option value="">Select City</option>'
            );
        }
    });
}


// ============================================================
// LOAD CITIES
// ============================================================

function loadLabCities(
    stateId,
    preferredCityId = null
) {

    const city =
        $('[name="lab_city"]');

    if (!city.length) {
        return;
    }

    if (!stateId) {

        city.html(
            '<option value="">Select City</option>'
        );

        return;
    }

    $.ajax({

        url:
            "/user/lab-profile-verification/get-cities/",

        type: "GET",

        data: {
            state_id: stateId
        },

        success: function (response) {

            city.empty();

            city.append(
                '<option value="">Select City</option>'
            );

            if (
                !response.success ||
                !Array.isArray(response.cities)
            ) {

                console.error(
                    "No lab cities returned:",
                    response
                );

                return;
            }

            $.each(
                response.cities,
                function (index, item) {

                    const selected =
                        String(item.id) ===
                        String(preferredCityId)
                            ? "selected"
                            : "";

                    city.append(`
                        <option
                            value="${item.id}"
                            ${selected}
                        >
                            ${escapeHtml(item.name)}
                        </option>
                    `);
                }
            );
        },

        error: function (xhr) {

            console.error(
                "Lab cities error:",
                xhr.responseText
            );

            city.html(
                '<option value="">Select City</option>'
            );
        }
    });
}


// ============================================================
// STEP 1 - SAVE LAB DETAILS
// ============================================================

function saveLabStep1() {

    clearLabErrors();

    // --------------------------------------------------------
    // READ VALUES
    // --------------------------------------------------------

    const labName =
        getValue(
            '[name="lab_name"], #lab_name'
        );

    const email =
        getValue(
            '[name="lab_email"], #lab_email'
        );
    
    // const ownerName =
    //     getValue(
    //         '[name="owner_name"], #owner_name'
    // )

    const labRegistrationNumber =
        getValue(
            '[name="lab_registration_number"], #lab_registration_number'
    )
    const phone =
        getValue(
            '[name="lab_phone"], #lab_phone'
        );

    const address =
        getValue(
            '[name="lab_address"], #lab_address'
        );

    const country =
        getValue(
            '[name="lab_country"], #lab_country'
        );

    const state =
        getValue(
            '[name="lab_state"], #lab_state'
        );

    const city =
        getValue(
            '[name="lab_city"], #lab_city'
        );

    const pincode =
        getValue(
            '[name="lab_pincode"], #lab_pincode'
        );

    const timing =
        getValue(
            '[name="lab_timing"], #lab_timing'
        );

    const altPhone =
        getValue(
            '[name="alt_phone"], #alt_phone'
        );

    const ownerName =
        getValue(
            '[name="owner_name"], #owner_name'
        );

    const referral =
        getValue(
            '[name="referral_code"], #referral_code'
        );

    const countryCode =
        getValue(
            '[name="lab_country_code"], #lab_country_code'
        ) || "+91";


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!labName) {

        showLabError(
            '[name="lab_name"], #lab_name',
            "Lab name is required."
        );

        return;
    }


    if (!email) {

        showLabError(
            '[name="lab_email"], #lab_email',
            "Email address is required."
        );

        return;
    }


    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {

        showLabError(
            '[name="lab_email"], #lab_email',
            "Please enter a valid email address."
        );

        return;
    }


    if (!phone) {

        showLabError(
            '[name="lab_phone"], #lab_phone',
            "Phone number is required."
        );

        return;
    }


    if (!/^\d{10}$/.test(phone)) {

        showLabError(
            '[name="lab_phone"], #lab_phone',
            "Phone number must be exactly 10 digits."
        );

        return;
    }


    if (!address) {

        showLabError(
            '[name="lab_address"], #lab_address',
            "Address is required."
        );

        return;
    }


    if (!pincode) {

        showLabError(
            '[name="lab_pincode"], #lab_pincode',
            "Pincode is required."
        );

        return;
    }


    if (!/^\d{6}$/.test(pincode)) {

        showLabError(
            '[name="lab_pincode"], #lab_pincode',
            "Pincode must be exactly 6 digits."
        );

        return;
    }


    // --------------------------------------------------------
    // FORM DATA
    // --------------------------------------------------------

    const formData =
        new FormData();

    formData.append(
        "step",
        "1"
    );

    formData.append(
        "lab_name",
        labName
    );

    formData.append(
        "owner_name",
        ownerName
    );

    formData.append(
        "lab_email",
        email
    );

    formData.append(
        "lab_registration_number",
        labRegistrationNumber
    );

    formData.append(
        "lab_country_code",
        countryCode
    );

    formData.append(
        "lab_phone",
        phone
    );

    formData.append(
        "alt_phone",
        altPhone
    );

    formData.append(
        "lab_address",
        address
    );

    formData.append(
        "lab_country",
        country
    );

    formData.append(
        "lab_state",
        state
    );

    formData.append(
        "lab_city",
        city
    );

    formData.append(
        "lab_pincode",
        pincode
    );

    formData.append(
        "lab_timing",
        timing
    );

    formData.append(
        "referral_code",
        referral
    );

    formData.append(
        "csrfmiddlewaretoken",
        $("input[name='csrfmiddlewaretoken']").val()
    );


    // --------------------------------------------------------
    // DEBUG
    // --------------------------------------------------------

    console.log(
        "========== LAB STEP 1 =========="
    );

    for (
        const [key, value]
        of formData.entries()
    ) {

        console.log(
            key,
            "=>",
            value
        );
    }


    // --------------------------------------------------------
    // AJAX
    // --------------------------------------------------------

    $.ajax({

        url: LAB_SAVE_URL,

        type: "POST",

        data: formData,

        processData: false,

        contentType: false,

        beforeSend: function () {

            setNextButtonState(
                true,
                "Saving..."
            );
        },

        success: function (response) {

            console.log(
                "LAB STEP 1 RESPONSE:",
                response
            );

            if (
                response &&
                response.success === true
            ) {

                showSuccess(
                    response.message ||
                    "Lab details saved successfully."
                );

                goToStep(2);

            } else {

                showError(
                    response.message ||
                    "Unable to save lab details."
                );
            }
        },

        error: function (xhr) {

            console.error(
                "LAB STEP 1 ERROR:",
                xhr.responseText
            );

            showAjaxError(
                xhr,
                "Something went wrong while saving lab details."
            );
        },

        complete: function () {

            setNextButtonState(
                false,
                currentStep === totalSteps
                    ? "Submit Verification"
                    : "Save & Continue"
            );
        }
    });
}


// ============================================================
// STEP 2 - PERSONAL DETAILS
// ============================================================

function saveLabStep2() {

    clearLabErrors();

    const name =
        getValue(
            '[name="contact_name"]'
        );

    const email =
        getValue(
            '[name="contact_email"]'
        );

    const phone =
        getValue(
            '[name="contact_phone"]'
        );

    const role =
        getValue(
            '[name="contact_role"]'
        );

    const otp =
        getValue(
            '[name="contact_otp"]'
        );

    const country =
        getValue(
            '[name="contact_country"]'
        );

    const state =
        getValue(
            '[name="contact_state"]'
        );

    const city =
        getValue(
            '[name="contact_city"]'
        );

    const pincode =
        getValue(
            '[name="contact_pincode"]'
        );

    const referral =
        getValue(
            '[name="referral_code"]'
        );


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!name) {

        showLabError(
            '[name="contact_name"]',
            "Contact person name is required."
        );

        return;
    }


    if (!email) {

        showLabError(
            '[name="contact_email"]',
            "Email address is required."
        );

        return;
    }


    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {

        showLabError(
            '[name="contact_email"]',
            "Please enter a valid email address."
        );

        return;
    }


    if (!phone) {

        showLabError(
            '[name="contact_phone"]',
            "Contact phone is required."
        );

        return;
    }


    if (!/^\d{10}$/.test(phone)) {

        showLabError(
            '[name="contact_phone"]',
            "Contact phone must be exactly 10 digits."
        );

        return;
    }


    if (!role) {

        showLabError(
            '[name="contact_role"]',
            "Role is required."
        );

        return;
    }


    // --------------------------------------------------------
    // FORM DATA
    // --------------------------------------------------------

    const formData =
        new FormData();

    formData.append(
        "step",
        "2"
    );

    formData.append(
        "contact_name",
        name
    );

    formData.append(
        "contact_email",
        email
    );

    formData.append(
        "contact_country_code",
        getValue(
            '[name="contact_country_code"]'
        ) || "+91"
    );

    formData.append(
        "contact_phone",
        phone
    );

    formData.append(
        "contact_role",
        role
    );

    formData.append(
        "contact_otp",
        otp
    );

    formData.append(
        "contact_country",
        country
    );

    formData.append(
        "contact_state",
        state
    );

    formData.append(
        "contact_city",
        city
    );

    formData.append(
        "contact_pincode",
        pincode
    );

    formData.append(
        "referral_code",
        referral
    );

    formData.append(
        "csrfmiddlewaretoken",
        $("input[name='csrfmiddlewaretoken']").val()
    );


    // --------------------------------------------------------
    // AJAX
    // --------------------------------------------------------

    $.ajax({

        url: LAB_SAVE_URL,

        type: "POST",

        data: formData,

        processData: false,

        contentType: false,

        beforeSend: function () {

            setNextButtonState(
                true,
                "Saving..."
            );
        },

        success: function (response) {

            console.log(
                "LAB STEP 2 RESPONSE:",
                response
            );

            if (
                response &&
                response.success === true
            ) {

                showSuccess(
                    response.message ||
                    "Personal details saved successfully."
                );

                goToStep(3);

            } else {

                showError(
                    response.message ||
                    "Unable to save personal details."
                );
            }
        },

        error: function (xhr) {

            console.error(
                "LAB STEP 2 ERROR:",
                xhr.responseText
            );

            showAjaxError(
                xhr,
                "Something went wrong while saving personal details."
            );
        },

        complete: function () {

            setNextButtonState(
                false,
                currentStep === totalSteps
                    ? "Submit Verification"
                    : "Save & Continue"
            );
        }
    });
}


// ============================================================
// STEP 3 - DOCUMENTS
// ============================================================

function saveLabStep3() {

    // --------------------------------------------------------
    // DOCUMENT NUMBERS
    // --------------------------------------------------------

    const labCertificateNumber =
        getValue(
            '[name="lab_certificate_number"]'
        );

    const aadhaarNumber =
        getValue(
            '[name="aadhaar_number"], [name="identity_proof_aadhar_number"]'
        );

    const panNumber =
        getValue(
            '[name="pan_number"], [name="identity_proof_pan_number"]'
        );

    const govLicenseNumber =
        getValue(
            '[name="gov_license_number"]'
        );


    // --------------------------------------------------------
    // FILES
    // --------------------------------------------------------

    // Lab Certificate
    const labCertificateFile =
        $('[name="lab_certificate"]')[0]?.files?.[0] || null;

    const aadhaarFile =
        $('[name="identity_proof_aadhar"]')[0]?.files?.[0] || null;

    const panFile =
        $('[name="identity_proof_pan"]')[0]?.files?.[0] || null;

    const govLicenseFile =
        $('[name="gov_license"]')[0]?.files?.[0] || null;

    const labPhotoFile =
        $('[name="lab_photo"]')[0]?.files?.[0] || null;


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!labCertificateFile) {
        toastr.warning("Please upload the lab certificate.");
        return;
    }

    if (!aadhaarFile) {
        toastr.warning("Please upload the Aadhaar document.");
        return;
    }

    if (!panFile) {
        toastr.warning("Please upload the PAN document.");
        return;
    }

    if (!govLicenseFile) {
        toastr.warning("Please upload the government license.");
        return;
    }

    if (!labPhotoFile) {
        toastr.warning("Please upload the lab photo.");
        return;
    }

    // --------------------------------------------------------
    // VIRUS SCAN VALIDATION
    // --------------------------------------------------------

    if (!allLabDocumentsScanned()) {

        toastr.warning(
            "Please wait for all documents to pass the virus scan."
        );

        return;
    }
    // --------------------------------------------------------
    // FORM DATA
    // --------------------------------------------------------

    const formData =
        new FormData();

    formData.append(
        "step",
        "3"
    );

    formData.append(
        "lab_certificate_number",
        labCertificateNumber
    );

    formData.append(
        "aadhaar_number",
        aadhaarNumber
    );

    formData.append(
        "pan_number",
        panNumber
    );

    formData.append(
        "gov_license_number",
        govLicenseNumber
    );

    formData.append(
        "lab_certificate",
        labCertificateFile
    );

    formData.append(
        "aadhar_doc",
        aadhaarFile
    );

    formData.append(
        "pan_doc",
        panFile
    );

    formData.append(
        "gov_license",
        govLicenseFile
    );

    formData.append(
        "lab_photo",
        labPhotoFile
    );

    formData.append(
        "csrfmiddlewaretoken",
        $("input[name='csrfmiddlewaretoken']").val()
    );


    // --------------------------------------------------------
    // AJAX
    // --------------------------------------------------------

    $.ajax({

        url: LAB_SAVE_URL,

        type: "POST",

        data: formData,

        processData: false,

        contentType: false,

        beforeSend: function () {

            setNextButtonState(
                true,
                "Saving..."
            );
        },

        success: function (response) {

            console.log(
                "LAB STEP 3 RESPONSE:",
                response
            );

            if (
                response &&
                response.success === true
            ) {

                updateStepTab(
                    3,
                    "completed"
                );

                updateProgress(3);

                $("#next-step-btn")
                    .prop("disabled", true)
                    .data("submitted", true);

                $("#next-btn-text")
                    .text("Verification Submitted");

                showSuccess(
                    response.message ||
                    "Lab verification submitted successfully."
                );

                setTimeout(
                    function () {

                        if (
                            response.redirect_url
                        ) {

                            window.location.href =
                                response.redirect_url;

                        } else {

                            window.location.href =
                                LAB_REVIEW_URL;
                        }

                    },
                    1000
                );

            } else {

                showError(
                    response.message ||
                    "Unable to save lab documents."
                );
            }
        },

        error: function (xhr) {

            console.error(
                "LAB STEP 3 ERROR:",
                xhr.responseText
            );

            showAjaxError(
                xhr,
                "Something went wrong while saving lab documents."
            );
        },

        complete: function () {

            if (
                !$("#next-step-btn")
                    .data("submitted")
            ) {

                setNextButtonState(
                    false,
                    "Submit Verification"
                );
            }
        }
    });
}
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

// ============================================================
// STEP NAVIGATION
// ============================================================

function showStep(step) {

    $(".step-panel")
        .addClass("hidden");

    $(`#step-panel-${step}`)
        .removeClass("hidden")
        .addClass("step-fade-active");
}


// ============================================================
// GO TO STEP
// ============================================================

function goToStep(nextStep) {

    if (
        nextStep < 1 ||
        nextStep > totalSteps
    ) {
        return;
    }

    const oldStep =
        currentStep;

    if (oldStep !== nextStep) {

        updateStepTab(
            oldStep,
            "completed"
        );
    }

    $(`#step-panel-${oldStep}`)
        .addClass("hidden");

    currentStep =
        nextStep;

    $(`#step-panel-${currentStep}`)
        .removeClass("hidden")
        .addClass("step-fade-enter");

    setTimeout(
        function () {

            $(`#step-panel-${currentStep}`)
                .removeClass("step-fade-enter")
                .addClass("step-fade-active");

        },
        50
    );

    updateStepTab(
        currentStep,
        "active"
    );

    updateProgress(
        currentStep
    );

    setNextButtonText();
}


// ============================================================
// BUTTON TEXT
// ============================================================

function setNextButtonText() {

    if (currentStep === totalSteps) {

        $("#next-btn-text")
            .text("Submit Verification");

    } else {

        $("#next-btn-text")
            .text("Save & Continue");
    }
}


// ============================================================
// PROGRESS
// ============================================================

function updateProgress(step) {

    let percentage =
        Math.round(
            ((step - 1) /
                (totalSteps - 1)) *
            100
        );

    /*
     * Step 1 = 0%
     * Step 2 = 50%
     * Step 3 = 95%
     *
     * 100% is only reached after final submission.
     */

    if (step === totalSteps) {
        percentage = 95;
    }

    $("#status-percentage")
        .text(
            percentage + "%"
        );

    $("#status-bar-fill")
        .css(
            "width",
            percentage + "%"
        );

    const lineWidth =
        50 * (step - 1);

    $("#stepper-connecting-line")
        .css(
            "width",
            lineWidth + "%"
        );
}


// ============================================================
// STEPPER STATE
// ============================================================

function updateStepTab(
    stepNum,
    state
) {

    const tab =
        $(`#step-tab-${stepNum}`);

    if (!tab.length) {
        return;
    }

    const circle =
        tab.find(".step-kyc-circle");

    const label =
        tab.find(".step-label");

    const icon =
        tab.find(".step-kyc-icon");


    // --------------------------------------------------------
    // RESET
    // --------------------------------------------------------

    circle.removeClass(
        "border-kyc-icon " +
        "bg-kyc-blue " +
        "text-kyc-icon " +
        "bg-kyc-green " +
        "text-white " +
        "font-bold " +
        "border-slate-200 " +
        "bg-slate-50 " +
        "text-slate-400 " +
        "font-semibold"
    );

    label.removeClass(
        "text-slate-400 " +
        "text-green-600 " +
        "text-slate-800 " +
        "text-blue-charcoal " +
        "font-semibold " +
        "font-bold"
    );


    // --------------------------------------------------------
    // ACTIVE
    // --------------------------------------------------------

    if (state === "active") {

        circle.addClass(
            "border-kyc-icon " +
            "bg-kyc-blue " +
            "text-kyc-icon"
        );

        label.addClass(
            "text-blue-charcoal font-bold"
        );

        if (stepNum === 1) {

            icon.text("science");

        } else if (stepNum === 2) {

            icon.text("person");

        } else if (stepNum === 3) {

            icon.text("description");
        }

        return;
    }


    // --------------------------------------------------------
    // COMPLETED
    // --------------------------------------------------------

    if (state === "completed") {

        circle.addClass(
            "bg-kyc-green " +
            "text-white " +
            "font-bold"
        );

        label.addClass(
            "text-green-600 font-bold"
        );

        icon.text("check");

        return;
    }


    // --------------------------------------------------------
    // LOCKED
    // --------------------------------------------------------

    if (state === "locked") {

        circle.addClass(
            "border-slate-200 " +
            "bg-slate-50 " +
            "text-slate-400 " +
            "font-semibold"
        );

        label.addClass(
            "text-slate-400 font-semibold"
        );

        icon.text("lock");
    }
}


// ============================================================
// CLEAR ERRORS
// ============================================================

function clearLabErrors() {

    $(
        "#step-panel-1 input, " +
        "#step-panel-1 select, " +
        "#step-panel-2 input, " +
        "#step-panel-2 select, " +
        "#step-panel-3 input"
    ).removeClass(
        "border-red-400 " +
        "focus:border-red-400 " +
        "focus:ring-red-400"
    );
}


// ============================================================
// SHOW FIELD ERROR
// ============================================================

function showLabError(
    selector,
    message
) {

    const field =
        $(selector).first();

    field.addClass(
        "border-red-400 " +
        "focus:border-red-400 " +
        "focus:ring-red-400"
    );

    field.focus();

    showWarning(message);
}


// ============================================================
// BUTTON STATE
// ============================================================

function setNextButtonState(
    disabled,
    text
) {

    $("#next-step-btn")
        .prop(
            "disabled",
            disabled
        );

    $("#next-btn-text")
        .text(text);
}


// ============================================================
// SAFE VALUE
// ============================================================

function getValue(selector) {

    const field =
        $(selector).first();

    if (!field.length) {
        return "";
    }

    const value =
        field.val();

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}


// ============================================================
// FILE
// ============================================================

function getFile(selector) {

    const input =
        $(selector).first()[0];

    if (
        !input ||
        !input.files ||
        !input.files.length
    ) {
        return null;
    }

    return input.files[0];
}


// ============================================================
// AJAX ERROR
// ============================================================

function showAjaxError(
    xhr,
    fallbackMessage
) {

    let message =
        fallbackMessage;

    if (
        xhr.responseJSON &&
        xhr.responseJSON.message
    ) {

        message =
            xhr.responseJSON.message;
    }

    if (
        xhr.responseJSON &&
        xhr.responseJSON.errors
    ) {

        const errors =
            xhr.responseJSON.errors;

        const firstError =
            Object.values(errors)[0];

        if (firstError) {

            if (Array.isArray(firstError)) {

                message =
                    firstError[0];

            } else {

                message =
                    firstError;
            }
        }
    }

    showError(message);
}


// ============================================================
// TOAST HELPERS
// ============================================================

function showSuccess(message) {

    if (
        typeof toastr !== "undefined"
    ) {

        toastr.success(message);
    } else {

        console.log(
            "SUCCESS:",
            message
        );
    }
}


function showError(message) {

    if (
        typeof toastr !== "undefined"
    ) {

        toastr.error(message);
    } else {

        console.error(
            "ERROR:",
            message
        );
    }
}


function showWarning(message) {

    if (
        typeof toastr !== "undefined"
    ) {

        toastr.warning(message);
    } else {

        console.warn(
            "WARNING:",
            message
        );
    }
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}