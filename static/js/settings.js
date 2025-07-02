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
    const modalImg    = viewModal.querySelector("#modalContent img");
    const modalEmbed  = viewModal.querySelector("#modalContent embed");
    const virusCheck  = viewModal.querySelector("input[type=checkbox]");
    const replaceBtn  = document.getElementById("replaceBtn");
    const saveBtn     = document.getElementById("saveBtn");
    const fileInput   = document.getElementById("replaceInput");
    const userType    = document.getElementById("userTypeHolder")?.dataset.userType;

    let currentDocType = null;
    let newFile        = null;

    const docFolder = {
        ngo: "ngo_docs",
        advertiser: "advertiser_docs",
        client: "client_docs",
        provider: "provider_docs",
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
        storefront_image:      "Storefront Image"
    };

    // 1) View icons open the modal
    document.querySelectorAll(".view-icon").forEach(icon => {
        icon.addEventListener("click", () => {
        currentDocType = icon.dataset.docType;
        const path     = icon.dataset.docPath || "";
        const ext      = path.split(".").pop().toLowerCase();

        const subdirMap = {
            ngo_registration_doc: 'registration',
            incorporation_doc:     'registration',
            gst_doc:               'gst',
            pan_doc:               'pan',
            tan_doc:               'tan',
            section8_doc:          'section8',
            doc_12a:               'doc_12a',
            brand_image:           'brand_image',
            medical_license_doc:   'medical_license',
            storefront_image:      'storefront_image',
        };

        const baseFolder = docFolder[userType];   
        console.log("Basefolder:", baseFolder)           // e.g. "ngo_docs"
        const subfolder  = subdirMap[currentDocType];  
        console.log("docType =", currentDocType, "subfolder =", subfolder);      // e.g. "pan"
        const fullPath   = `${baseFolder}/${subfolder}/${path}`;  // e.g. "ngo_docs/pan/abc.pdf"
        const previewURL = `/document/${fullPath}`; 

        // Set title
        modalTitle.innerHTML = `<span class="material-symbols-outlined">document_scanner</span> ${titleMap[currentDocType] || "Document Preview"}`;

        // Reset previews
        [modalImg, modalEmbed].forEach(el => el.classList.add("hidden"));

        // Show correct preview
        if (["jpg","jpeg","png","webp"].includes(ext)) {
            modalImg.src    = previewURL;
            modalImg.classList.remove("hidden");
        }
        else if (ext === "pdf") {
            modalEmbed.src    = previewURL;
            modalEmbed.classList.remove("hidden");
        }
        
        // Virus scan status
        const approved = !!icon.closest("div").querySelector("span.material-filled.text-bright-green");
        virusCheck.checked = approved;

        // Reset replace/save
        newFile = null;
        replaceBtn && (replaceBtn.disabled = false);
        saveBtn    && (saveBtn.disabled    = true);

        viewModal.classList.remove("hidden");
        });
    });

    // 2) Close modal
    viewModal.querySelector("#closeModal")
        .addEventListener("click", () => viewModal.classList.add("hidden"));

    // 3) Replace → file picker
    replaceBtn && replaceBtn.addEventListener("click", () => {
        fileInput.click();
    });
    fileInput && fileInput.addEventListener("change", () => {
        newFile = fileInput.files[0];
        saveBtn.disabled = !newFile;
    });
    // 4) Save → upload via AJAX
    saveBtn && saveBtn.addEventListener("click", () => {
        if (!newFile || !currentDocType) return;

        const fd = new FormData();
        fd.append("doc_type", currentDocType);
        fd.append("document", newFile);

        const csrftoken = getCookie("csrftoken");
        fetch("update-document/", {
        method: "POST",
        headers: { "X-CSRFToken": csrftoken },
        body: fd
        })
        .then(r => r.json())
        .then(json => {
        if (json.success) {
            location.reload();
        } else {
            alert(json.error || JSON.stringify(json.errors));
        }
        })
        .catch(e => {
        console.error(e);
        alert("Upload failed.");
        });
    });
});
document.querySelectorAll('[data-field]').forEach(input => {
    const csrftoken = getCookie("csrftoken");
    input.addEventListener('change', () => {
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
        })
        .catch(err => console.error("Error:", err));
    });
});
