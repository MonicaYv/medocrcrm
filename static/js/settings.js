function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

// settings.js
document.addEventListener("DOMContentLoaded", () => {
    // Grab modal elements
    const viewModal   = document.getElementById("viewModal");
    const modalTitle  = viewModal.querySelector("p.font-semibold");
    // const modalImg    = viewModal.querySelector("#modalContent img");
    // const modalEmbed  = viewModal.querySelector("#modalContent embed");
    const modalImg = document.getElementById("modalImg");
    const modalEmbed = document.getElementById("modalEmbed");
    const virusCheck  = viewModal.querySelector("input[type=checkbox]");
    const replaceBtn  = document.getElementById("replaceBtn");
    // const saveBtn     = document.getElementById("saveBtn");
    const saveBtns = document.querySelectorAll("#saveBtn, .save-btn-doc");
    // const fileInput   = document.getElementById("replaceInput");
    // console.log(fileInput.files)
    let fileInput = null;
    const userType    = document.getElementById("userTypeHolder")?.dataset.userType;

    let currentDocType = null;
    let newFile        = null;

    const docFolder = {
        ngo: "ngo_docs",
        advertiser: "advertiser_docs",
        client: "client_docs",
        pharmacy: "pharmacy_docs",
        lab: "lab_docs",
        hospital: "hospital_docs",
    };
    // Mapping doc_type → human title
        // Mapping doc_type -> human title
    const titleMap = {
        ngo_registration_doc: "NGO Registration Document",
        incorporation_doc:     "Incorporation Certificate",
        gst_doc:               "GST Certificate",
        pan_doc:               "PAN Document",
        tan_doc:               "TAN Document",
        section8_doc:          "Section 8 Certificate",
        doc_12a:               "12A Certificate",
        brand_image:           "Brand Image",
        medical_license_doc:   "Medical License",
        storefront_image:      "Storefront Image",
        hospital_license:      "Hospital License",
        admin_identity_proof:  "Admin Identity Proof",
        hospital_pan:          "Hospital PAN",
        hospital_photo:        "Hospital Image",
        lab_certificate:       "Lab Registration Certificate",
        identity_proof_aadhar: "Aadhar Card",
        identity_proof_pan:    "PAN Card",
        gov_license:           "Government License",
        lab_photo:             "Lab Photo",
    };

    // 1) View icons open the modal
    document.querySelectorAll(".view-icon").forEach(icon => {
        icon.addEventListener("click", () => {
            currentDocType = icon.dataset.docType;
            console.log("DOC TYPE:", currentDocType);
            const path = (icon.dataset.docPath || "").trim();

            // No path stored => document not yet uploaded
            if (!path || path === "/media/" || path.endsWith("/")) {
                toastr.error("No document uploaded yet for this field.");
                return;
            }

            // Normalise to a /document/... URL
            let previewURL = path.replace(/\\/g, "/");
            if (!previewURL.startsWith("/document/") && !previewURL.startsWith("http://") && !previewURL.startsWith("https://")) {
                if (previewURL.startsWith("document/")) {
                    previewURL = "/" + previewURL;
                } else if (!previewURL.startsWith("/")) {
                    previewURL = "/document/" + previewURL;
                }
            }

            const cleanURL = previewURL.split("?")[0].split("#")[0];
            const ext = cleanURL.split(".").pop().toLowerCase();

            console.log("PREVIEW URL:", previewURL);
            console.log("EXT:", ext);

            // Set modal title
            const displayTitle = (userType === "hospital" && currentDocType === "pan_doc")
                ? "Hospital PAN"
                : (titleMap[currentDocType] || "Document Preview");
            modalTitle.innerHTML = `<span class="material-symbols-outlined">document_scanner</span> ${displayTitle}`;

            // Reset both preview elements
            [modalImg, modalEmbed].forEach(el => {
                if (el) { el.classList.add("hidden"); el.removeAttribute("src"); }
            });

            const formatHint = document.getElementById("modalFormatHint");
            const modalContent = document.getElementById("modalContent");

            // Remove any previously injected "file not found" message
            const prevMsg = modalContent && modalContent.querySelector(".doc-not-found-msg");
            if (prevMsg) prevMsg.remove();

            const isImage = ["jpg","jpeg","png","webp","gif","bmp","svg"].includes(ext);
            const isPdf   = ext === "pdf";

            function showNotFound() {
                [modalImg, modalEmbed].forEach(el => {
                    if (el) { el.classList.add("hidden"); el.removeAttribute("src"); }
                });
                const existing = modalContent && modalContent.querySelector(".doc-not-found-msg");
                if (existing) existing.remove();
                const msg = document.createElement("div");
                msg.className = "doc-not-found-msg flex flex-col items-center justify-center gap-2 p-6 text-medium-gray";
                msg.innerHTML = `
                    <span class="material-symbols-outlined text-4xl">description</span>
                    <p class="text-sm font-medium">Document not available on server.</p>
                    <p class="text-xs">The file may not have been uploaded yet, or it may have been moved.</p>`;
                if (modalContent) modalContent.appendChild(msg);
                if (formatHint) formatHint.textContent = "";
            }

            if (isImage) {
                if (modalImg) {
                    modalImg.onload = () => {
                        modalImg.classList.remove("hidden");
                        const m = modalContent && modalContent.querySelector(".doc-not-found-msg");
                        if (m) m.remove();
                        if (formatHint) formatHint.textContent = "Image (JPG, PNG). Maximum file size: 5MB.";
                    };
                    modalImg.onerror = () => {
                        modalImg.classList.add("hidden");
                        showNotFound();
                    };
                    modalImg.src = previewURL;
                }
            } else if (isPdf) {
                if (modalEmbed) {
                    modalEmbed.src = previewURL;
                    modalEmbed.classList.remove("hidden");
                    if (formatHint) formatHint.textContent = "PDF Document. Maximum file size: 5MB.";
                }
            } else {
                if (modalEmbed) {
                    modalEmbed.src = previewURL;
                    modalEmbed.classList.remove("hidden");
                    if (formatHint) formatHint.textContent = "Document file. Maximum file size: 5MB.";
                }
            }

            // Virus scan status
            const approved = !!icon.closest("div")?.querySelector("span.material-filled.text-bright-green");
            if (virusCheck) virusCheck.checked = approved;

            // Enable Replace button and open modal immediately
            replaceBtn && (replaceBtn.disabled = false);
            viewModal.classList.remove("hidden");
        });
    });
    // 2) Close modal
    const closeModalHandler = () => {
        viewModal.classList.add("hidden");
        if (modalImg) {
            modalImg.src = "";
            modalImg.classList.add("hidden");
        }
        if (modalEmbed) {
            modalEmbed.src = "";
            modalEmbed.classList.add("hidden");
        }
    };

    viewModal.querySelector("#closeModal")
        ?.addEventListener("click", closeModalHandler);

    viewModal.addEventListener("click", (e) => {
        if (e.target === viewModal) {
            closeModalHandler();
        }
    });

    // 3) Replace → file picker

replaceBtn && replaceBtn.addEventListener("click", () => {

    const currentInput = document.querySelector(
        `.file-input[data-doc="${currentDocType}"]`
    );

    if(currentInput){
        currentInput.value = "";
        currentInput.click();

        currentInput.onchange = (e) => {

            newFile = e.target.files[0];

            console.log("SELECTED FILE:", newFile);

            if(newFile){

                toastr.success("File selected");

                saveBtns.forEach(btn => {
                   btn.disabled = false;
               });

                // saveBtn.disabled = false;

                previewImage(newFile);
            }
        };
    }
});
// replaceBtn && replaceBtn.addEventListener("click", () => {

//     const currentInput = document.querySelector(
//         `.file-input[data-doc="${currentDocType}"]`
//     );

//     if(currentInput){
//         currentInput.click();
//     }
// });

// document.querySelectorAll(".upload-trigger").forEach(trigger => {

//     trigger.addEventListener("click", function () {

//         const wrapper = this.closest(".relative.inline-block");

//         const input = wrapper.querySelector(".file-input");

//         if (input) {

//             input.click();

//             input.onchange = function (e) {

//                 newFile = e.target.files[0];

//                 console.log("SELECTED FILE:", newFile);

//                 if (newFile) {

//                     toastr.success("File selected");

//                     saveBtn.disabled = false;

//                     previewImage(newFile);
//                 }
//             };
//         }
//     });

// });

// replaceBtn && replaceBtn.addEventListener("click", () => {

//     const activeInput = document.querySelector(
//         `.file-input[data-doc="${currentDocType}"]`
//     );

//     if(activeInput){

//         activeInput.click();

//         activeInput.onchange = (e) => {

//             newFile = e.target.files[0];

//             console.log("SELECTED FILE:", newFile);

//             if(newFile){

//                 saveBtn.disabled = false;

//                 previewImage(newFile);
//             }
//         };
//     }
// });

// document.querySelectorAll(".file-input").forEach(input => {

//     input.addEventListener("change", (e) => {

//         newFile = e.target.files[0];

//         console.log("SELECTED FILE:", newFile);

//         if(newFile){

//             saveBtn.disabled = false;

//             previewImage(newFile);
//         }
//     });

// });
//     replaceBtn && replaceBtn.addEventListener("click", () => {
//         fileInput.click();
//     });
//     fileInput && fileInput.addEventListener("change", (e) => {

//         newFile = e.target.files[0];

//         console.log("SELECTED FILE:", newFile);

//         if(newFile){
//            saveBtn.disabled = false;
//            previewImage(newFile);
//        }
//    });
    // fileInput && fileInput.addEventListener("change", () => {
    //     newFile = fileInput.files[0];
    //     saveBtn.disabled = !newFile;
    //     previewImage(newFile);
    // });
const previewImage = (file) => {
    if (!file) return;
    [modalImg, modalEmbed].forEach(el => {
        if (el) {
            el.classList.add("hidden");
            el.src = "";
        }
    });

    const modalContent = document.getElementById("modalContent");
    const prevMsg = modalContent && modalContent.querySelector(".doc-not-found-msg");
    if (prevMsg) prevMsg.remove();

    const formatHint = document.getElementById("modalFormatHint");
    const displayTitle = (userType === "hospital" && currentDocType === "pan_doc")
        ? "Hospital PAN"
        : (titleMap[currentDocType] || "Document Preview");
    if (modalTitle) {
        modalTitle.innerHTML = `<span class="material-symbols-outlined">document_scanner</span> ${displayTitle}`;
    }

    const fileName = (file.name || "").toLowerCase();
    const fileType = (file.type || "").toLowerCase();
    const isPdf = fileType === "application/pdf" || fileName.endsWith(".pdf");

    if (isPdf) {
        if (modalEmbed) {
            modalEmbed.src = URL.createObjectURL(file);
            modalEmbed.classList.remove("hidden");
        }
        if (formatHint) {
            formatHint.textContent = "PDF Document. Maximum file size: 5MB.";
        }
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        if (modalImg) {
            modalImg.src = e.target.result;
            modalImg.classList.remove("hidden");
        }
        if (formatHint) {
            formatHint.textContent = "Image (JPG, PNG). Maximum file size: 5MB.";
        }
    };
    reader.readAsDataURL(file);
};

    // The upload icons on the Documents tab use their adjacent hidden input.
    // Keep this separate from the modal's Replace action so both entry points
    // select the correct document type before the shared Save action uploads it.
    document.querySelectorAll(".upload-trigger").forEach(trigger => {
        trigger.addEventListener("click", () => {
            const input = trigger.parentElement.querySelector(".file-input");
            if (!input) return;

            currentDocType = input.dataset.doc;
            input.value = "";
            input.click();
        });
    });

    document.querySelectorAll(".file-input").forEach(input => {
        input.addEventListener("change", event => {
            const selectedFile = event.target.files[0];
            if (!selectedFile) return;

            currentDocType = input.dataset.doc;
            newFile = selectedFile;
            saveBtns.forEach(btn => {
                btn.disabled = false;
            });
            previewImage(newFile);
            viewModal.classList.remove("hidden");
        });
    });

saveBtns.forEach(saveBtn => {

    saveBtn.addEventListener("click", async () => {

        console.log("SAVE BUTTON CLICKED");

        console.log("newFile =", newFile);

        console.log("currentDocType =", currentDocType);

        if (!newFile || !currentDocType) {

            toastr.error("Please select a file");

            return;
        }

        const fd = new FormData();

        fd.append("doc_type", currentDocType);

        fd.append("document", newFile);

        const csrftoken = getCookie("csrftoken");

        try {

            const response = await fetch("/settings/update-document/", {

                method: "POST",

                headers: {
                    "X-CSRFToken": csrftoken
                },

                body: fd
            });

            const data = await response.json();

            console.log("UPLOAD RESPONSE:", data);

            if (data.success) {

                if (data.number) {
                    toastr.success(`Document updated. Number detected: ${data.number}`);
                } else {
                    toastr.success("Document updated. No number was detected, so the saved number was kept.");
                }
                sessionStorage.setItem("settings.documentUploadReturnTab", "documents");

                setTimeout(() => {

                    location.reload();

                }, 1500);

            } else {

                toastr.error(data.error || data.message || "Upload failed");
            }

        } catch (error) {

            console.error("UPLOAD ERROR:", error);

            toastr.error("Upload failed");
        }
    });

    if (sessionStorage.getItem("settings.documentUploadReturnTab") === "documents") {
        sessionStorage.removeItem("settings.documentUploadReturnTab");
        document.querySelector('[data-tab="documents"]')?.click();
    }
});
    // const previewImage = (file) => {
    // $("#modalImg").empty();
    // const reader = new FileReader();
    // reader.onload = (e) => {
    //   $("#modalImg").attr('src', e.target.result);
    // };
    // reader.readAsDataURL(file);
    // };
    // 4) Save → upload via AJAX
//     saveBtn && saveBtn.addEventListener("click", async () => {
//     console.log("SAVE BUTTON CLICKED");

//     console.log("newFile =", newFile);
//     console.log("currentDocType =", currentDocType);
//     // console.log(fileInput.files)
//     console.log("newFile =", newFile)
//     console.log("currentDocType =", currentDocType)
//     console.log("CURRENT FILE:", newFile);
//     console.log("CURRENT DOC:", currentDocType);

//     if (!newFile || !currentDocType) {
//         toastr.error("Please select a file");
//         return;
//     }

//     const fd = new FormData();

//     fd.append("doc_type", currentDocType);
//     // console.log("SENDING:", backendDocType);
//     console.log("SENDING:", currentDocType);
    
//     fd.append("document", newFile);

//     const csrftoken = getCookie("csrftoken");

//     try {

//         const response = await fetch("/settings/update-document/", {
//             method: "POST",
//             headers: {
//                 "X-CSRFToken": csrftoken
//             },
//             body: fd
//         });

//         const data = await response.json();

//         console.log("UPLOAD RESPONSE:", data);

//         if (data.success) {

//             toastr.success("Document updated successfully");

//             setTimeout(() => {
//                 location.reload();
//             }, 1500);

//         } else {

//             toastr.error(data.error || data.message || "Upload failed");

//             console.log(data);
//         }

//     } catch (error) {

//         console.error("UPLOAD ERROR:", error);

//         toastr.error("Upload failed");
//     }
// });
});
        // .then(r => r.json())
        // .then(json => {
        // if (json.success) {
        //     location.reload();
        //     toastr.success("Document updated successfully");
        // } else {
        //     alert(json.error || JSON.stringify(json.errors));
        // }
        // })
        // .catch(e => {
        // console.error(e);
        // alert("Upload failed.");
        // });
document.querySelectorAll('[data-field]').forEach(input => {
    const csrftoken = getCookie("csrftoken");

    // input.addEventListener('change', () => {
    input.addEventListener('input', () => {
        const field = input.dataset.field;
        let value;

        if (input.type === "checkbox") {
            value = input.checked;
        } else {
            value = input.value;
        }

        fetch("update-notification-field/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken
            },
            body: JSON.stringify({ field, value })
        })
        .then(res => {
            if (!res.ok) throw new Error("Failed to update");
            toastr.success("Updated notification settings");  // ✅ success toast
        })
        .catch(err => {
            console.error("Error:", err);
            toastr.error("Failed to update notification settings");  // ❌ error toast only on failure
        });
    });
});

$(document).on(
    "click",
    ".issue-type-wrapper .issue-type-input, .issue-type-wrapper > .material-symbols-outlined",
    function (e) {
        e.preventDefault();
        e.stopPropagation();
        const $wrapper = $(this).closest(".issue-type-wrapper");
        const $dropdown = $wrapper.find(
            ".dropdown-menu, .issue-type-dropdown"
        ).first();
        if (!$dropdown.length) return;
        const isOpen = !$dropdown.hasClass("hidden") &&
                       $dropdown.is(":visible");
        $(".issue-type-wrapper")
            .not($wrapper)
            .find(".dropdown-menu, .issue-type-dropdown")
            .addClass("hidden")
            .hide();
        if (isOpen) {
            $dropdown.addClass("hidden").hide();
        } else {
            $dropdown.removeClass("hidden").show();
        }
    }
);
$(document).on(
    "change",
    ".issue-type-wrapper .dropdown-menu input[type='checkbox']",
    function (e) {
        e.stopPropagation();
        const $wrapper = $(this).closest(".issue-type-wrapper");
        const $input = $wrapper.find(".issue-type-input");
        const selectedValues = $wrapper
            .find(".dropdown-menu input[type='checkbox']:checked")
            .map(function () {
                return $(this).closest("li").find("span").first().text().trim();
            })
            .get();
        if (selectedValues.length > 0) {
            $input.val(selectedValues.join(", "));
        } else {
            $input.val("");
        }
    }
);
$(document).on(
    "change",
    ".issue-type-wrapper .issue-type-dropdown input[type='radio']",
    function (e) {
        e.stopPropagation();
        const $wrapper = $(this).closest(".issue-type-wrapper");
        const $input = $wrapper.find(".issue-type-input");
        const selected = $(this)
            .closest("li")
            .find("span.text-base")
            .first()
            .text()
            .trim();
        $input.val(selected);
        $wrapper
            .find(".issue-type-dropdown")
            .addClass("hidden")
            .hide();
    }
);
$(document).on("click", function (e) {

    if (!$(e.target).closest(".issue-type-wrapper").length) {

        $(".issue-type-wrapper")
            .find(".dropdown-menu, .issue-type-dropdown")
            .addClass("hidden")
            .hide();
    }
});

function clearSavedData() {
    const csrftoken = getCookie("csrftoken");

    fetch("clear-saved-data/", {
        method: "POST",
        headers: {
            "X-CSRFToken": csrftoken,
            "Content-Type": "application/json"
        }
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to clear data");
        return res.json();
    })
    .then(data => {
        toastr.success(data.status);  // ✅ success message
        closePopup('savedDataPopup'); // close popup
    })
    .catch(err => {
        console.error(err);
        toastr.error("Something went wrong while clearing saved data");
    });
}

  // Single-select logic
  $(document).on("change",".issue-checkbox", function () {
    const $wrapper = $(this).closest(".issue-type-wrapper");
    const $input = $wrapper.find(".issue-type-input");

    // Uncheck other checkboxes in this dropdown
    if ($(this).is(":checked")) {
      $wrapper.find(".issue-checkbox").not(this).prop("checked", false);
    }

    // Get the selected label
    const selected = $wrapper
      .find(".issue-checkbox:checked")
      .map(function () {
        return $(this).closest("li").find("span").first().text().trim();
      })
      .get()
      .join(", ");

    $input.val(selected);
  });

  // Custom input typing logic (if you're using "Type..." input)
  $(document).on("click", ".custom-type-input",function () {
    const $wrapper = $(this).closest(".issue-type-wrapper");
    const $input = $wrapper.find(".issue-type-input");

    // 1. Uncheck all checkboxes
    $wrapper.find(".issue-checkbox").prop("checked", false);

    // 2. Clear the input value
    $input.val("");

    // 3. Make input editable and focus it
    $input.prop("readonly", false).focus();

    // 4. Optional: make it readonly again on blur
    $input.on("blur", function () {
      $(this).prop("readonly", true);
    });
  });

$(document).ready(function () {
    $(document).on(
        "click",
        "#editForm .save-btn, .save-btn[form='editForm']",
        function (e) {
            e.preventDefault();
            const form = document.getElementById("editForm");
            // Require successful OTP verification before saving pharmacy profile
            if (form && form.querySelector('select[name="countryCodes"]')) {
                const verifiedStatus = form.querySelector(".otp-verification-status");

                if (!verifiedStatus || verifiedStatus.classList.contains("hidden")) {
                    e.preventDefault();
                    toastr.error("Please verify your pharmacy phone number with OTP before saving.");
                    return;
                }
            }
            if (!form) {
                toastr.error("Lab profile form not found");
                return;
            }
            const formData = new FormData(form);
            const csrfInput = form.querySelector(
                "[name=csrfmiddlewaretoken]"
            );
            const csrfToken = csrfInput
                ? csrfInput.value
                : getCookie("csrftoken");
            const submitBtn = $(this);
            const originalText = submitBtn.text();
            submitBtn.prop("disabled", true).text("Saving...");
            fetch(form.action, {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken,
                    "X-Requested-With": "XMLHttpRequest"
                },
                body: formData
            })
            .then(async response => {
                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message ||
                        JSON.stringify(data.errors) ||
                        "Failed to update profile"
                    );
                }
                return data;
            })
            .then(data => {
                toastr.success(
                    data.message || "Lab profile updated successfully"
                );
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            })
            .catch(error => {
                toastr.error(error.message);
                submitBtn.prop("disabled", false).text(originalText);
            });
        }
    );
});

// City autocomplete functionality
let citiesCache = {};
let currentCitySuggestions = [];

function showCitySuggestions(cities, inputElement) {
    // Remove existing suggestions
    $('.city-suggestions').remove();
    
    if (!cities || cities.length === 0) return;
    
    currentCitySuggestions = cities;
    
    // Create suggestions dropdown
    const suggestionsDiv = $('<div class="city-suggestions absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"></div>');
    
    cities.slice(0, 10).forEach(city => {
        const suggestionItem = $(`<div class="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm city-suggestion-item" data-city="${city}">${city}</div>`);
        suggestionsDiv.append(suggestionItem);
    });
    
    // Position the dropdown
    inputElement.auto = inputElement.position();
    inputElement.parent().css('position', 'relative');
    suggestionsDiv.css({
        'top': (inputElement.outerHeight() + inputElement.position().top - inputElement.auto.top) + 'px',
        'left': inputElement.position().left + 'px'
    });
    
    inputElement.parent().append(suggestionsDiv);
    
    // Handle click on suggestion
    suggestionsDiv.on('click', '.city-suggestion-item', function() {
        const selectedCity = $(this).data('city');
        inputElement.val(selectedCity);
        suggestionsDiv.remove();
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Fetch cities based on state
function fetchCities(stateName) {
    if (!stateName) {
        citiesCache = {};
        return Promise.resolve([]);
    }
    
    // Check cache first
    if (citiesCache[stateName.toLowerCase()]) {
        return Promise.resolve(citiesCache[stateName.toLowerCase()]);
    }
    
    // Fetch from API
    return fetch('/settings/api/cities/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie("csrftoken")
        },
        body: JSON.stringify({ state: stateName })
    })
    .then(res => res.json())
    .then(data => {
        const cities = data.cities || [];
        citiesCache[stateName.toLowerCase()] = cities;
        return cities;
    })
    .catch(err => {
        console.error('Error fetching cities:', err);
        return [];
    });
}

// Setup city autocomplete for all forms
$(document).on('focus', 'input[name="city"]', function() {
    const $cityInput = $(this);
    const $form = $cityInput.closest('form');
    const stateName = $form.find('input[name="state"]').val();
    
    if (stateName) {
        fetchCities(stateName).then(cities => {
            if (cities.length > 0) {
                showCitySuggestions(cities, $cityInput);
            }
        });
    }
});

// Handle city input typing
$(document).on('input', 'input[name="city"]', function() {
    const $cityInput = $(this);
    const $form = $cityInput.closest('form');
    const stateName = $form.find('input[name="state"]').val();
    const query = $(this).val().toLowerCase();
    
    if (!stateName) {
        toastr.warning('Please select a state first');
        return;
    }
    
    // Fetch cities if not cached
    fetchCities(stateName).then(cities => {
        if (cities.length > 0 && query) {
            // Filter cities based on query
            const filteredCities = cities.filter(city => 
                city.toLowerCase().includes(query)
            );
            showCitySuggestions(filteredCities, $cityInput);
        }
    });
});

// Close suggestions when clicking outside
$(document).on('click', function(e) {
    if (!$(e.target).closest('.city-suggestions, input[name="city"]').length) {
        $('.city-suggestions').remove();
    }
});

// Remove suggestions on escape key
$(document).on('keydown', 'input[name="city"]', function(e) {
    if (e.key === 'Escape') {
        $('.city-suggestions').remove();
    }
});
// Automatically highlight Send OTP buttons when the phone number has 10 digits
document.addEventListener("DOMContentLoaded", function () {

    function updateOtpButtonColors(form) {
        if (!form) return;

        const phoneInputs = form.querySelectorAll(
            'input[name="phone"], input[name="contact_phone_number"]'
        );

        const otpButtons = form.querySelectorAll(".send-otp-btn");

        otpButtons.forEach((button, index) => {
            const phoneInput = phoneInputs[index];

            if (!phoneInput) return;

            const digits = phoneInput.value.replace(/\D/g, "");
            const isValid = digits.length === 10;

            if (isValid) {
                button.style.opacity = "1";
                button.style.filter = "brightness(0.60)";
            } else {
                button.style.opacity = "0.5";
                button.style.filter = "none";
            }
        });
    }

    // Update the button colour while typing
    document.addEventListener("input", function (event) {
        if (
            event.target.matches(
                'input[name="phone"], input[name="contact_phone_number"]'
            )
        ) {
            updateOtpButtonColors(event.target.closest("form"));
        }
    });

    // Set the correct colour when the page loads
    document.querySelectorAll("form").forEach(function (form) {
        updateOtpButtonColors(form);
    });

});

// Pharmacy phone OTP only
document.addEventListener("click", async function (event) {
    const sendButton = event.target.closest(".send-pharmacy-otp-btn");
    const verifyButton = event.target.closest(".verify-otp-btn");

    if (!sendButton && !verifyButton) return;

    const form = event.target.closest("form") || document.querySelector("#editForm");
    if (!form) return;

    const phoneInput = form.querySelector('input[name="phone"]');
    const countryInput = form.querySelector('select[name="countryCodes"]');
    const otpInput = form.querySelector('input[name="otp1"]');
    const errorBox = form.querySelector(".phone-otp-error");
    const statusBox = form.querySelector(".otp-verification-status");
    const verifyBtn = form.querySelector(".verify-otp-btn");

    if (!phoneInput || !countryInput || !otpInput || !verifyBtn) return;

    const phone = phoneInput.value.trim();
    const countryCode = countryInput.value.trim();

    function showError(message) {
        if (errorBox) {
            errorBox.textContent = message;
            errorBox.classList.remove("hidden");
        }
    }

    function clearError() {
        if (errorBox) {
            errorBox.textContent = "";
            errorBox.classList.add("hidden");
        }
    }

    function resetVerification() {
        verifyBtn.disabled = true;
        if (statusBox) statusBox.classList.add("hidden");
    }

    clearError();

    if (!phone || !countryCode) {
        showError("Please enter your phone number and country code.");
        return;
    }

    // Send OTP
    if (sendButton) {
        resetVerification();
        otpInput.value = "";
        sendButton.disabled = true;

        try {
            const response = await fetch("/settings/send-phone-otp/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": form.querySelector(
                        '[name="csrfmiddlewaretoken"]'
                    )?.value || ""
                },
                body: JSON.stringify({
                    phone: phone,
                    country_code: countryCode
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                showError(data.message || "Could not send OTP.");
                return;
            }

            // The test OTP in your current backend is 123456.
           verifyBtn.disabled = false;
            clearError();

            alert("OTP sent successfully");
        } catch (error) {
            showError("Unable to send OTP. Please try again.");
            console.error("Send OTP error:", error);
        } finally {
            sendButton.disabled = false;
        }

        return;
    }

    // Verify OTP
    if (verifyButton) {
        const otp = otpInput.value.trim();

        if (!/^\d{6}$/.test(otp)) {
            showError("Please enter the 6-digit OTP.");
            return;
        }

        verifyButton.disabled = true;

        try {
            const response = await fetch("/settings/verify-phone-otp/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": form.querySelector(
                        '[name="csrfmiddlewaretoken"]'
                    )?.value || ""
                },
                body: JSON.stringify({
                    phone: phone,
                    country_code: countryCode,
                    otp: otp
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                showError(data.message || "OTP verification failed.");
                return;
            }

            if (statusBox) {
                statusBox.classList.remove("hidden");
                statusBox.classList.add("flex");
            }

            verifyButton.textContent = "Verified";
            verifyButton.classList.remove("bg-gray-400");
            verifyButton.classList.add("bg-[#16A34A]");
            verifyButton.disabled = true;
        } catch (error) {
            showError("Unable to verify OTP. Please try again.");
            console.error("Verify OTP error:", error);
        } finally {
            // Allow retry if verification failed.
            if (!statusBox || statusBox.classList.contains("hidden")) {
                verifyButton.disabled = false;
            }
        }
    }
});

// If the phone number or country code changes, it must be verified again.
document.addEventListener("input", function (event) {
    if (!event.target.matches('#editForm input[name="phone"]')) return;

    const form = event.target.closest("form");
    const statusBox = form?.querySelector(".otp-verification-status");
    const verifyButton = form?.querySelector(".verify-otp-btn");

    if (statusBox) statusBox.classList.add("hidden");

    if (verifyButton) {
        verifyButton.disabled = true;
        verifyButton.textContent = "Verify OTP";
    }
});

document.addEventListener("change", function (event) {
    if (event.target.matches('#editForm select[name="countryCodes"]')) {
        const form = event.target.closest("form");
        form?.querySelector(".otp-verification-status")?.classList.add("hidden");
        const verifyButton = form?.querySelector(".verify-otp-btn");
        if (verifyButton) {
            verifyButton.disabled = true;
            verifyButton.textContent = "Verify OTP";
        }
    }
});