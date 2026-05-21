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
    const saveBtns = document.querySelectorAll(".save-btn-doc");
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
        storefront_image: "Storefront Image",
        hospital_license: "Hospital License",
        admin_identity_proof: "Admin Identity Proof",
        pan_doc: "Hospital PAN",
        hospital_photo: "Hospital Image",
        lab_certificate: "Lab Registration Certificate",
        identity_proof_aadhar: "Aadhar Card",
        identity_proof_pan: "PAN Card",
        gov_license: "Government License",
        lab_photo: "Lab Photo",
    };

    // 1) View icons open the modal
    document.querySelectorAll(".view-icon").forEach(icon => {
        icon.addEventListener("click", () => {
        currentDocType = icon.dataset.docType;
        console.log("DOC TYPE:", currentDocType);
        const path     = icon.dataset.docPath || "";
        const ext      = path.split(".").pop().toLowerCase();

        const subdirMap = {
            ngo_registration_doc: 'registration',
            incorporation_doc:     'incorporation',
            gst_doc:               'gst',
            pan_doc:               'pan',
            tan_doc:               'tan',
            section8_doc:          'section8',
            doc_12a:               'doc_12a',
            brand_image:           'brand_image',
            medical_license_doc:   'medical_license',
            storefront_image:      'store_front',


            hospital_license: "registration",
            admin_identity_proof: "aadhar",
            pan_doc: "pan",
            hospital_photo: "hospital_photo",

            lab_certificate: 'lab_certificate',
            identity_proof_aadhar: 'aadhar',
            identity_proof_pan: 'pan',
            gov_license: 'gov_license',
            lab_photo: 'lab_photo',
        };

        const baseFolder = docFolder[userType];   
        console.log("Basefolder:", baseFolder)           // e.g. "ngo_docs"
        const subfolder  = subdirMap[currentDocType];  
        console.log("docType =", currentDocType, "subfolder =", subfolder);      // e.g. "pan"
        // const fullPath   = `${baseFolder}/${subfolder}/${path}`;  // e.g. "ngo_docs/pan/abc.pdf"
        // // const previewURL = `/document/${fullPath}`; 
        // const fullPath = path.replace("/media/", "");
        // const previewURL = `/document/${fullPath}`;
        const previewURL = path;
        // if (!path || path === "/media/" || path.trim() === "") {

        //     toastr.error("Document not found");

        //     return;
        // }
        console.log("PREVIEW URL:", previewURL);
        console.log("PATH:", path);
        // console.log("FULLPATH:", fullPath);

        // Set title
        modalTitle.innerHTML = `<span class="material-symbols-outlined">document_scanner</span> ${titleMap[currentDocType] || "Document Preview"}`;

        // Reset previews
        [modalImg, modalEmbed].forEach(el => el.classList.add("hidden"));

        // Show correct preview
        if (["jpg","jpeg","png","webp"].includes(ext)) {
            // modalImg.src    = previewURL;
        if (previewURL && previewURL !== "/media/") {

            modalImg.src = previewURL;

            modalImg.classList.remove("hidden");
        }
     
       
        }
        else if (ext === "pdf") {
            modalEmbed.src    = previewURL;
            modalEmbed.classList.remove("hidden");
        }
        
        // Virus scan status
        const approved = !!icon.closest("div").querySelector("span.material-filled.text-bright-green");
        virusCheck.checked = approved;

        // Reset replace/save
        // newFile = null;
        // replaceBtn && (replaceBtn.disabled = false);
        // saveBtn    && (saveBtn.disabled    = true);
        // Reset replace/save
          replaceBtn && (replaceBtn.disabled = false);
        //   saveBtn && (saveBtn.disabled = false);

        viewModal.classList.remove("hidden");
        // modalImg.src = path;
        // if (path && path !== "/media/") {
        //     modalImg.src = path;
        // }

        // modalImg.classList.remove("hidden");
        });
    });

    // 2) Close modal
    viewModal.querySelector("#closeModal")
        .addEventListener("click", () => viewModal.classList.add("hidden"));

    // 3) Replace → file picker

replaceBtn && replaceBtn.addEventListener("click", () => {

    const currentInput = document.querySelector(
        `.file-input[data-doc="${currentDocType}"]`
    );

    if(currentInput){

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

    const reader = new FileReader();

    reader.onload = (e) => {

        modalImg.src = e.target.result;

        modalImg.classList.remove("hidden");

        if(modalEmbed){
            modalEmbed.classList.add("hidden");
        }
    };

    reader.readAsDataURL(file);
};

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

                toastr.success("Document updated successfully");

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

// Toggle dropdowns
$(
  ".issue-type-wrapper .issue-type-input, .issue-type-wrapper .material-symbols-outlined"
).on("click", function () {
    console.log("clicked");
  $(".issue-type-dropdown").toggleClass("hidden");
});
$(
  ".select-issue-wrapper .select-issue-input, .select-issue-wrapper .material-symbols-outlined"
).on("click", function () {
  $(".select-issue-dropdown").toggleClass("hidden");
});
// Close dropdowns when clicking outside
$(document).on("click", function (e) {
  if (!$(e.target).closest(".issue-type-wrapper").length) {
    $(".issue-type-dropdown").addClass("hidden");
  }
  if (!$(e.target).closest(".select-issue-wrapper").length) {
    $(".select-issue-dropdown").addClass("hidden");
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

$(document).on("click",".issue-type-wrapper" ,function (e) {
    console.log("initialized")
    e.stopPropagation();
    $(".issue-type-dropdown").not($(this).find(".issue-type-dropdown")).hide();
    $(this).find(".issue-type-dropdown").toggle();
  });

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
        return $(this).closest("li").find("span").text();
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

  // Close on outside click
  $(document).on("click", function () {
    $(".issue-type-dropdown").hide();
  });