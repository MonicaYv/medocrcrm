// Function to check if the form is valid
// function checkFormValidity() {
//   const issueType = $(".issue-type").val().trim();
//   const issueDesc = $(".issue-description").val().trim();
//   const issueImage = $(".issue-image")[0].files.length > 0;

//   if (issueType && issueDesc && issueImage) {
//     $(".issue-submit-btn")
//       .prop("disabled", false)
//       .removeClass("text-medium-gray bg-light-gray cursor-not-allowed")
//       .addClass("bg-light-sea-green text-white cursor-pointer");
//   } else {
//     $(".issue-submit-btn")
//       .prop("disabled", true)
//       .removeClass("bg-light-sea-green text-white cursor-pointer")
//       .addClass("text-medium-gray bg-light-gray cursor-not-allowed");
//   }
// }

// Event listeners for input changes to validate the form
// $(function () {
//   $(".issue-type, .issue-description").on("input", checkFormValidity);
//   $("#issue-image").on("change", checkFormValidity);
// });

// Toggle functionality for various sections with accordion-style behavior

// $(".toggle-subscription").click(function () {
//   var content = $(this)
//     .closest(".account-subscription")
//     .find(".subscription-content");
//   var icon = $(this).find(".chevron-icon");

//   content.toggleClass("hidden");
//   icon.toggleClass("rotate-180");
// });

$(".toggle-avatar").click(function () {
  var content = $(this).closest(".avatar-creation").find(".avatar-content");
  var icon = $(this).find(".chevron-icon");

  content.toggleClass("hidden");
  icon.toggleClass("rotate-180");
});

$(".toggle-troubleshooting").click(function () {
  var content = $(this)
    .closest(".troubleshooting-section")
    .find(".troubleshooting-content");
  var icon = $(this).find(".chevron-icon");

  content.toggleClass("hidden");
  icon.toggleClass("rotate-180");
});

$(".toggle-billing-payments").click(function () {
  var content = $(this)
    .closest(".billing-payments-section")
    .find(".billing-payments-content");
  var icon = $(this).find(".chevron-icon");

  content.toggleClass("hidden");
  icon.toggleClass("rotate-180");
});

$(".toggle-support-contact").click(function () {
  var content = $(this)
    .closest(".support-contact-section")
    .find(".support-contact-content");
  var icon = $(this).find(".chevron-icon");

  content.toggleClass("hidden");
  icon.toggleClass("rotate-180");
});

$(".toggle-support-contact1").click(function () {
  var content = $(this)
    .closest(".support-contact-section1")
    .find(".support-contact-content1");
  var icon = $(this).find(".chevron-icon");

  content.toggleClass("hidden");
  icon.toggleClass("rotate-180");
});

// Function to toggle the visibility of the chat popup
function toggleChat() {
  // Toggle the 'hidden' class on all elements with the 'chat-popup' class
  document.querySelectorAll(".chat-popup").forEach(function (popup) {
    popup.classList.toggle("hidden");
  });
}

function sendEmailSupport() {
  // You can add form validation or sending logic here
  toastr.success("Message sent!");
  document.querySelector(".emailPopup").classList.add("hidden");
}

// const issueMap = {
//   type1: [
//     "Unable to log in or reset password",
//     "Profile update not saving",
//     "Mobile number or email verification failed",
//     "App crashing or freezing on startup",
//   ],
//   type2: [
//     "Bid request not showing in history",
//     "No response from pharmacies on my bid",
//     "My accepted bid disappeared",
//     "Can't upload or attach prescription",
//   ],
//   type3: [
//     "Not receiving order or bid notifications",
//     "Chat with pharmacy not working",
//     "In-app notifications are delayed",
//   ],
//   type4: [
//     "App interface glitches (e.g., buttons not working)",
//     "Location detection issue",
//     "Images or attachments not uploading",
//     "Reporting fake or spam pharmacy listing",
//   ],
// };

// Toggle dropdowns
$(
  ".issue-type-wrapper .issue-type-input, .issue-type-wrapper .material-symbols-outlined"
).on("click", function () {
  $(".issue-type-dropdown").toggleClass("hidden");
});
$(
  ".select-issue-wrapper .select-issue-input, .select-issue-wrapper .material-symbols-outlined"
).on("click", function () {
  $(".select-issue-dropdown").toggleClass("hidden");
});

// Handle issue type checkbox selection
// $(".issue-checkbox").on("click", function (e) {
//   e.stopPropagation();
//   $(".issue-checkbox").not(this).prop("checked", false);

//   const isChecked = $(this).is(":checked");
//   const selectedType = $(this).data("type");
//   const selectedText = $(this).closest("li").find("span").text().trim();
//   const options = issueMap[selectedType] || [];

//   const $typeWrapper = $(this).closest(".issue-type-wrapper");
//   const $selectWrapper = $(".select-issue-wrapper");
//   const $issueInput = $typeWrapper.find(".issue-type-input");
//   const $selectInput = $selectWrapper.find(".select-issue-input");
//   const $selectDropdown = $selectWrapper.find(".select-issue-dropdown");

//   // Get custom color classes from the wrapper's data-* attributes
//   const hoverClass = $selectWrapper.data("hover-class") || "";
//   const checkboxColor = $selectWrapper.data("checkbox-color") || "";
//   const ringColor = $selectWrapper.data("ring-color") || "";

//   if (isChecked) {
//     $issueInput.val(selectedText);
//     $(".issue-type-dropdown").addClass("hidden");

//     $selectInput.val("");
//     $selectDropdown.empty();

//     options.forEach((option) => {
//       const hoverClass = $selectWrapper.data("hover-class") || "";
// const $li = $("<li>").addClass(
//   `px-2 py-2 mb-2 flex justify-between items-center ${hoverClass}`
// );

//       const textColor = $selectWrapper.data("text-color") || "";

//       const $span = $("<span>").addClass(`text-base ${textColor}`).text(option);

//       const $checkbox = $("<input>")
//         .attr({
//           type: "checkbox",
//           name: "selectIssueOption",
//           "data-option": option,
//         })
//         .addClass(
//           `select-issue-checkbox form-checkbox  w-5 h-5 cursor-pointer rounded-sm mr-2 ${checkboxColor} ${ringColor}`
//         );

//       $li.append($span, $checkbox);
//       $selectDropdown.append($li);
//     });
//   } else {
//     $issueInput.val("");
//     $selectInput.val("");
//     $selectDropdown.empty();
//   }

//   checkFormValidity();
// });

// Handle select issue checkbox click
// $(".select-issue-dropdown")
//   .off("click", ".select-issue-checkbox")
//   .on("click", ".select-issue-checkbox", function (e) {
//     e.stopPropagation();
//     $(".select-issue-checkbox").not(this).prop("checked", false);

//     const isChecked = $(this).is(":checked");
//     const selectedOption = $(this).data("option");
//     const $selectInput = $(".select-issue-input");

//     if (isChecked) {
//       $selectInput.val(selectedOption);
//       $(".select-issue-dropdown").addClass("hidden");
//     } else {
//       $selectInput.val("");
//     }

//     checkFormValidity();
//   });

// Close dropdowns when clicking outside
$(document).on("click", function (e) {
  if (!$(e.target).closest(".issue-type-wrapper").length) {
    $(".issue-type-dropdown").addClass("hidden");
  }
  if (!$(e.target).closest(".select-issue-wrapper").length) {
    $(".select-issue-dropdown").addClass("hidden");
  }
});
function openModal() {
  document.querySelector(".view-modal").classList.remove("hidden");
}

function closeModal() {
  document.querySelector(".view-modal").classList.add("hidden");
}

// Modal close on overlay click (using class selectors)
$(document).ready(function () {
  $(document).on("click", ".view-modal", function (e) {
    if (e.target === this) {
      $(this).addClass("hidden");
    }
  });
  // ESC key closes any open modal
  $(document).on("keydown", function (e) {
    if (e.key === "Escape") {
      $(".view-modal").addClass("hidden");
    }
  });
});

// new code by Sidhanta
// $(function () {
//   $("#issue_type").on("change", function () {
//     var issueTypeId = $(this).val();
//     if (issueTypeId) {
//       $.ajax({
//         url: "/help/api/issue-options/",
//         data: {
//           issue_type_id: issueTypeId,
//         },
//         success: function (data) {
//           var $selectIssue = $("#select_issue");
//           $selectIssue.empty();
//           $selectIssue.append('<option value="">Select an option</option>');
//           $.each(data.options, function (i, option) {
//             $selectIssue.append(
//               '<option value="' + option.id + '">' + option.name + "</option>"
//             );
//           });
//         },
//       });
//     } else {
//       // Reset if no issue type is selected
//       $("#select_issue")
//         .empty()
//         .append('<option value="">Select an option</option>');
//     }
//   });
// });

// You can still use openModal() and closeModal() as before
function openModal() {
  document.querySelector(".view-modal").classList.remove("hidden");
}

function closeModal() {
  document.querySelector(".view-modal").classList.add("hidden");
}

function openModalProgress() {
  document.querySelector(".view-modal-progress").classList.remove("hidden");
}

function closeModalProgress() {
  document.querySelector(".view-modal-progress").classList.add("hidden");
}

// $(".custom-dropdown-btn").on("click", function (e) {
//   e.stopPropagation();
//   const $dropdown = $(this).closest(".custom-dropdown");
//   $(".custom-dropdown-option")
//     .not($dropdown.find(".custom-dropdown-option"))
//     .hide();
//   $dropdown.find(".custom-dropdown-option").toggle();
// });

// $(document).on("click", function () {
//   $(".custom-dropdown-option").hide();
// });

// File input change event of
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".theme-btn").forEach(btn => {
    applyThemeButton(btn);
  });
  // End customer upload section
  const issueImage = document.getElementById("issue-image");
  if (issueImage) {
    issueImage.addEventListener("change", function (e) {
      const fileInput = e.target;
      const fileNameSpan = document.getElementById("file-name");
      const submitBtn = document.getElementById("submit-btn");
      const virusScanStatus = document.getElementById("virus-scan-status");

      if (
        fileInput.files &&
        fileInput.files.length > 0 &&
        fileNameSpan &&
        submitBtn &&
        virusScanStatus
      ) {
        fileNameSpan.textContent = fileInput.files[0].name;
        submitBtn.classList.remove("bg-gray-300");
        submitBtn.classList.add("bg-vivid-orange");
        virusScanStatus.classList.remove("hidden");
      } else if (fileNameSpan && submitBtn && virusScanStatus) {
        fileNameSpan.textContent = "Upload image of the issue";
        submitBtn.classList.remove("bg-vivid-orange");
        submitBtn.classList.add("bg-gray-300");
        virusScanStatus.classList.add("hidden");
      }
    });
  }

  //Advertiser
  const advertiserIssueImage = document.getElementById(
    "advertiser-issue-image"
  );
  const advertiserSelectedFiles = [];

  if (advertiserIssueImage) {
    advertiserIssueImage.addEventListener("change", function (e) {
      const fileInput = e.target;
      const fileContainer = document.querySelector(
        ".advertiser-file-container"
      );
      const submitBtn = document.getElementById("advertiser-issue-submit-btn");

      if (
        fileInput.files &&
        fileInput.files.length > 0 &&
        fileContainer &&
        submitBtn
      ) {
        for (let i = 0; i < fileInput.files.length; i++) {
          const file = fileInput.files[i];
          if (
            !advertiserSelectedFiles.some(
              (f) => f.name === file.name && f.size === file.size
            )
          ) {
            advertiserSelectedFiles.push(file);
          }
        }

        updateAdvertiserFileDisplay(fileContainer, submitBtn);
        fileInput.value = "";
      } else if (
        fileContainer &&
        submitBtn &&
        advertiserSelectedFiles.length === 0
      ) {
        resetAdvertiserFileDisplay(fileContainer, submitBtn);
      }
    });
  }

  function updateAdvertiserFileDisplay(container, submitBtn) {
    container.innerHTML = "";

    if (advertiserSelectedFiles.length === 0) {
      container.innerHTML =
        '<span class="advertiser-file-name font-normal text-sm">Upload image of the issue</span>';
      resetAdvertiserSubmitButton(submitBtn);
      return;
    }

    const filesWrapper = document.createElement("div");
    filesWrapper.className =
      "flex items-center gap-2 overflow-x-auto max-w-full py-1";

    advertiserSelectedFiles.forEach((file, index) => {
      const fileElement = document.createElement("div");
      fileElement.className =
        "flex items-center gap-1 bg-gray-100 px-2 py-1 rounded mr-1";

      const fileName = document.createElement("span");
      fileName.className =
        "text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]";
      fileName.textContent = file.name;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className =
        "material-symbols-outlined text-red-500 cursor-pointer text-sm";
      removeBtn.textContent = "close";
      removeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeAdvertiserFile(index, container, submitBtn);
      };

      fileElement.appendChild(fileName);
      fileElement.appendChild(removeBtn);
      filesWrapper.appendChild(fileElement);
    });

    container.appendChild(filesWrapper);

    submitBtn.classList.remove(
      "bg-light-gray",
      "text-medium-gray",
      "cursor-not-allowed"
    );
    submitBtn.classList.add("bg-living-coral", "text-white", "cursor-pointer");
    submitBtn.disabled = false;
  }

  function removeAdvertiserFile(index, container, submitBtn) {
    advertiserSelectedFiles.splice(index, 1);
    updateAdvertiserFileDisplay(container, submitBtn);
  }

  function resetAdvertiserFileDisplay(container, submitBtn) {
    container.innerHTML =
      '<span class="advertiser-file-name font-normal text-sm">Upload image of the issue</span>';
    resetAdvertiserSubmitButton(submitBtn);
  }

  function resetAdvertiserSubmitButton(submitBtn) {
    submitBtn.classList.remove(
      "bg-living-coral",
      "text-white",
      "cursor-pointer"
    );
    submitBtn.classList.add(
      "bg-light-gray",
      "text-medium-gray",
      "cursor-not-allowed"
    );
    submitBtn.disabled = true;
  }

  //Client upload section

  const clientIssueImage = document.getElementById("client-issue-image");
  const clientSelectedFiles = [];

  if (clientIssueImage) {
    clientIssueImage.addEventListener("change", function (e) {
      const fileInput = e.target;
      const fileContainer = document.querySelector(".client-file-container");
      const submitBtn = document.getElementById("client-issue-submit-btn");

      if (
        fileInput.files &&
        fileInput.files.length > 0 &&
        fileContainer &&
        submitBtn
      ) {
        for (let i = 0; i < fileInput.files.length; i++) {
          const file = fileInput.files[i];
          if (
            !clientSelectedFiles.some(
              (f) => f.name === file.name && f.size === file.size
            )
          ) {
            clientSelectedFiles.push(file);
          }
        }

        updateClientFileDisplay(fileContainer, submitBtn);
        fileInput.value = "";
      } else if (
        fileContainer &&
        submitBtn &&
        clientSelectedFiles.length === 0
      ) {
        resetClientFileDisplay(fileContainer, submitBtn);
      }
    });
  }

  function updateClientFileDisplay(container, submitBtn) {
    container.innerHTML = "";

    if (clientSelectedFiles.length === 0) {
      container.innerHTML =
        '<span class="client-file-name font-normal text-sm">Upload image of the issue</span>';
      resetClientSubmitButton(submitBtn);
      return;
    }

    const filesWrapper = document.createElement("div");
    filesWrapper.className =
      "flex items-center gap-2 overflow-x-auto max-w-full py-1";

    clientSelectedFiles.forEach((file, index) => {
      const fileElement = document.createElement("div");
      fileElement.className =
        "flex items-center gap-1 bg-gray-100 px-2 py-1 rounded mr-1";

      const fileName = document.createElement("span");
      fileName.className =
        "text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]";
      fileName.textContent = file.name;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className =
        "material-symbols-outlined text-red-500 cursor-pointer text-sm";
      removeBtn.textContent = "close";
      removeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeClientFile(index, container, submitBtn);
      };

      fileElement.appendChild(fileName);
      fileElement.appendChild(removeBtn);
      filesWrapper.appendChild(fileElement);
    });

    container.appendChild(filesWrapper);

    submitBtn.classList.remove(
      "bg-light-gray",
      "text-medium-gray",
      "cursor-not-allowed"
    );
    submitBtn.classList.add("bg-dark-blue", "text-white", "cursor-pointer");
    submitBtn.disabled = false;
  }

  function removeClientFile(index, container, submitBtn) {
    clientSelectedFiles.splice(index, 1);
    updateClientFileDisplay(container, submitBtn);
  }

  function resetClientFileDisplay(container, submitBtn) {
    container.innerHTML =
      '<span class="client-file-name font-normal text-sm">Upload image of the issue</span>';
    resetClientSubmitButton(submitBtn);
  }

  function resetClientSubmitButton(submitBtn) {
    submitBtn.classList.remove("bg-dark-blue", "text-white", "cursor-pointer");
    submitBtn.classList.add(
      "bg-light-gray",
      "text-medium-gray",
      "cursor-not-allowed"
    );
    submitBtn.disabled = true;
  }

  // Pharmacy upload section

  const pharmacyIssueImage = document.getElementById("pharmacy-issue-image");
  const pharmacySelectedFiles = [];

  if (pharmacyIssueImage) {
    pharmacyIssueImage.addEventListener("change", function (e) {
      const fileInput = e.target;
      const fileContainer = document.querySelector(".pharmacy-file-container");
      const submitBtn = document.getElementById("pharmacy-issue-submit-btn");

      if (
        fileInput.files &&
        fileInput.files.length > 0 &&
        fileContainer &&
        submitBtn
      ) {
        // Add files without duplicates
        for (let i = 0; i < fileInput.files.length; i++) {
          const file = fileInput.files[i];
          if (
            !pharmacySelectedFiles.some(
              (f) => f.name === file.name && f.size === file.size
            )
          ) {
            pharmacySelectedFiles.push(file);
          }
        }

        updatePharmacyFileDisplay(fileContainer, submitBtn);
        fileInput.value = ""; // Reset file input
      } else if (
        fileContainer &&
        submitBtn &&
        pharmacySelectedFiles.length === 0
      ) {
        resetPharmacyFileDisplay(fileContainer, submitBtn);
      }
    });
  }

  function updatePharmacyFileDisplay(container, submitBtn) {
    container.innerHTML = "";

    if (pharmacySelectedFiles.length === 0) {
      container.innerHTML =
        '<span class="pharmacy-file-name font-normal text-sm">Upload image of the issue</span>';
      resetPharmacySubmitButton(submitBtn);
      return;
    }

    const filesWrapper = document.createElement("div");
    filesWrapper.className =
      "flex items-center gap-2 overflow-x-auto max-w-full py-1";

    pharmacySelectedFiles.forEach((file, index) => {
      const fileElement = document.createElement("div");
      fileElement.className =
        "flex items-center gap-1 bg-gray-100 px-2 py-1 rounded mr-1";

      const fileName = document.createElement("span");
      fileName.className =
        "text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]";
      fileName.textContent = file.name;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className =
        "material-symbols-outlined text-red-500 cursor-pointer text-sm";
      removeBtn.textContent = "close";
      removeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        removePharmacyFile(index, container, submitBtn);
      };

      fileElement.appendChild(fileName);
      fileElement.appendChild(removeBtn);
      filesWrapper.appendChild(fileElement);
    });

    container.appendChild(filesWrapper);

    // Enable and style the submit button
    submitBtn.classList.remove(
      "bg-light-gray",
      "text-medium-gray",
      "cursor-not-allowed"
    );
    submitBtn.classList.add(
      "bg-light-sea-green",
      "text-white",
      "cursor-pointer"
    );
    submitBtn.disabled = false;
  }

  function removePharmacyFile(index, container, submitBtn) {
    pharmacySelectedFiles.splice(index, 1);
    updatePharmacyFileDisplay(container, submitBtn);
  }

  function resetPharmacyFileDisplay(container, submitBtn) {
    container.innerHTML =
      '<span class="pharmacy-file-name font-normal text-sm">Upload image of the issue</span>';
    resetPharmacySubmitButton(submitBtn);
  }

  function resetPharmacySubmitButton(submitBtn) {
    submitBtn.classList.remove(
      "bg-light-sea-green",
      "text-white",
      "cursor-pointer"
    );
    submitBtn.classList.add(
      "bg-light-gray",
      "text-medium-gray",
      "cursor-not-allowed"
    );
    submitBtn.disabled = true;
  }

  // NGO Upload section

  // const ngoIssueImage = document.getElementById("ngo-issue-image");
  // const ngoSelectedFiles = [];

  // if (ngoIssueImage) {
  //   ngoIssueImage.addEventListener("change", function (e) {
  //     const fileInput = e.target;
  //     const fileContainer = document.querySelector(".ngo-file-container");
  //     const submitBtn = document.getElementById("ngo-issue-submit-btn");

  //     if (
  //       fileInput.files &&
  //       fileInput.files.length > 0 &&
  //       fileContainer &&
  //       submitBtn
  //     ) {
  //       for (let i = 0; i < fileInput.files.length; i++) {
  //         const file = fileInput.files[i];
  //         if (
  //           !ngoSelectedFiles.some(
  //             (f) => f.name === file.name && f.size === file.size
  //           )
  //         ) {
  //           ngoSelectedFiles.push(file);
  //         }
  //       }

  //       updateNgoFileDisplay(fileContainer, submitBtn);
  //       fileInput.value = "";
  //     } else if (fileContainer && submitBtn && ngoSelectedFiles.length === 0) {
  //       resetNgoFileDisplay(fileContainer, submitBtn);
  //     }
  //   });
  // }

  // function updateNgoFileDisplay(container, submitBtn) {
  //   container.innerHTML = "";

  //   if (ngoSelectedFiles.length === 0) {
  //     container.innerHTML =
  //       '<span class="ngo-file-name font-normal text-sm">Upload image of the issue</span>';
  //     resetNgoSubmitButton(submitBtn);
  //     return;
  //   }

  //   const filesWrapper = document.createElement("div");
  //   filesWrapper.className =
  //     "flex items-center gap-2 overflow-x-auto max-w-full py-1";

  //   ngoSelectedFiles.forEach((file, index) => {
  //     const fileElement = document.createElement("div");
  //     fileElement.className =
  //       "flex items-center gap-1 bg-gray-100 px-2 py-1 rounded mr-1";

  //     const fileName = document.createElement("span");
  //     fileName.className =
  //       "text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]";
  //     fileName.textContent = file.name;

  //     const removeBtn = document.createElement("button");
  //     removeBtn.type = "button";
  //     removeBtn.className =
  //       "material-symbols-outlined text-red-500 cursor-pointer text-sm";
  //     removeBtn.textContent = "close";
  //     removeBtn.onclick = (e) => {
  //       e.preventDefault();
  //       e.stopPropagation();
  //       removeNgoFile(index, container, submitBtn);
  //     };

  //     fileElement.appendChild(fileName);
  //     fileElement.appendChild(removeBtn);
  //     filesWrapper.appendChild(fileElement);
  //   });

  //   container.appendChild(filesWrapper);

  //   submitBtn.classList.remove(
  //     "bg-light-gray",
  //     "text-medium-gray",
  //     "cursor-not-allowed"
  //   );
  //   submitBtn.classList.add("bg-violet-sky", "text-white", "cursor-pointer");
  //   submitBtn.disabled = false;
  // }

  // function removeNgoFile(index, container, submitBtn) {
  //   ngoSelectedFiles.splice(index, 1);
  //   updateNgoFileDisplay(container, submitBtn);
  // }

  // function resetNgoFileDisplay(container, submitBtn) {
  //   container.innerHTML =
  //     '<span class="ngo-file-name font-normal text-sm">Upload image of the issue</span>';
  //   resetNgoSubmitButton(submitBtn);
  // }

  // function resetNgoSubmitButton(submitBtn) {
  //   submitBtn.classList.remove("bg-violet-sky", "text-white", "cursor-pointer");
  //   submitBtn.classList.add(
  //     "bg-light-gray",
  //     "text-medium-gray",
  //     "cursor-not-allowed"
  //   );
  //   submitBtn.disabled = true;
  // }
});

const addedStatuses = new Set();

function addStatus(container, statusText, timestamp) {
  if (addedStatuses.has(statusText)) {
    return;
  }
  addedStatuses.add(statusText);

  const $container = $(container);
  const $dots = $container.find(".status-dots");
  const $labels = $container.find(".status-labels");
  const $times = $container.find(".status-times");

  let dotsCount = $dots.children("div").length;
  if (dotsCount > 0) {
    $dots.append(`
      <hr class="text-light-sea-green h-6 w-0 ml-1.5 border-2">
    `);
  }

  $dots.append(`
    <div class="bg-light-sea-green rounded-full h-4 w-4"></div>
  `);

  $labels.append(`
    <p class="font-normal text-base">${statusText}</p>
  `);

  $times.append(`
    <p class="font-semibold text-base">${timestamp}</p>
  `);
}

//----------------------- new code by laxmi -------------------------------------------
//get issue option in the dropdown
document.getElementById("issue_type").addEventListener("change", function () {
  const issueTypeId = this.value;
  if (issueTypeId) {
    fetch(`${getIssueOptionLists}?issue_type_id=${issueTypeId}`)
      .then((response) => response.json())
      .then((data) => {
        const issueSelect = document.getElementById("select_issue");
        issueSelect.innerHTML = '<option value="">Select Issue Option</option>';

        data.options.forEach((option) => {
          const opt = document.createElement("option");
          opt.value = option.id;
          opt.textContent = option.name;
          issueSelect.appendChild(opt);
        });
      })
      .catch((error) => {
        console.error("Error fetching issue options:", error);
      });
  }
});

//store data in db
const form = document.querySelector(".support-form");
const submitBtn = document.querySelector(".ngo-issue-submit-btn");
const fileInput = document.getElementById("ngo-issue-image");
const fileContainerElementNgo = document.getElementById("ngo-file-container");
const ngoSelectedFiles = [];

const itemsPerPage = 5;
let allTickets = [];
let currentPage = 1;

function getPaginationThemeColor() {
  const type = (window.USER_TYPE || "").toLowerCase();

  if (["doctor", "lab", "hospital"].includes(type)) return "dodger-blue";
  if (type === "pharmacy") return "dodger-blue";
  if (type === "advertiser") return "living-coral";
  if (type === "client") return "dark-blue";
  if (type === "ngo") return "violet-sky";
  if (type === "user") return "light-sea-green";

  return "dodger-blue";
}

fileInput.addEventListener("change", function () {

  const activeColor = getPaginationThemeColor(); // 🔥 dynamic color
  const activeBgClass = `bg-${activeColor}`;

  if (fileInput.files.length > 0) {
    for (let i = 0; i < fileInput.files.length; i++) {
      const file = fileInput.files[i];
      if (
        !ngoSelectedFiles.some(
          (f) => f.name === file.name && f.size === file.size
        )
      ) {
        ngoSelectedFiles.push(file);
      }
    }

    updateNgoFileDisplay();

    submitBtn.disabled = false;

    // remove disabled styles
    submitBtn.classList.remove(
      "cursor-not-allowed",
      "bg-light-gray",
      "text-medium-gray"
    );

    // add active styles (dynamic)
    submitBtn.classList.add(
      "cursor-pointer",
      activeBgClass,
      "text-white"
    );

  } else {
    submitBtn.disabled = true;

    // remove active styles
    submitBtn.classList.remove(
      "cursor-pointer",
      "text-white",
      ...Array.from(submitBtn.classList).filter(c => c.startsWith("bg-"))
    );

    // add disabled styles
    submitBtn.classList.add(
      "cursor-not-allowed",
      "bg-light-gray",
      "text-medium-gray"
    );
  }
});

function applyThemeButton(btn) {
  if (!btn) return;

  const color = getPaginationThemeColor();
  const bgClass = `bg-${color}`;

  // remove any existing bg-* classes
  btn.classList.remove(
    ...Array.from(btn.classList).filter(c => c.startsWith("bg-"))
  );

  btn.classList.add(bgClass, "text-white");
}

function updateNgoFileDisplay(submitBtn) {
  fileContainerElementNgo.innerHTML = "";

  if (ngoSelectedFiles.length === 0) {
    console.log("No files selected");
    fileContainerElementNgo.innerHTML =
      '<span class="ngo-file-name font-normal text-sm">Upload image of the issue</span>';
    return;
  }

  const filesWrapper = document.createElement("div");
  filesWrapper.className = "flex items-center gap-2 h-full flex-nowrap";

  ngoSelectedFiles.forEach((file, index) => {
    const fileElement = document.createElement("div");
    fileElement.className =
      "flex items-center gap-1 bg-gray-100 px-2 py-1 rounded flex-shrink-0 h-8";

    const fileName = document.createElement("span");
    fileName.className =
      "text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] sm:max-w-[150px]";
    fileName.textContent = file.name;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className =
      "material-symbols-outlined text-red-500 cursor-pointer text-sm flex-shrink-0";
    removeBtn.textContent = "close";
    removeBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeNgoFile(index, submitBtn);
    };

    fileElement.appendChild(fileName);
    fileElement.appendChild(removeBtn);
    filesWrapper.appendChild(fileElement);
  });

  fileContainerElementNgo.appendChild(filesWrapper);
}

function removeNgoFile(index, submitBtn) {
  ngoSelectedFiles.splice(index, 1);
  updateNgoFileDisplay(submitBtn);
}

// submit btn
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const issueType = document.getElementById("issue_type").value;
  const issueOption = document.getElementById("select_issue").value;

  if (!issueType || issueType === "" || !issueOption || issueOption === "") {
    toastr.error("Please select both Issue Type and Issue Option.", "Error");
    return; // stop form submission
  }

  const formData = new FormData(form);

  // Append all selected images
  for (const file of fileInput.files) {
    formData.append("image", file); // append multiple if needed later
  }

  try {
    const response = await fetch(saveTickets, {
      method: "POST",
      body: formData,
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
      },
    });

    const result = await response.json();

    if (result.success) {
      toastr.success(result.message || "Ticket created successfully...", "Success");

      // Reload the page but preserve the currently active main tab. Without
      // this, refreshing a Settings page (where the Support form lives as a
      // tab) would fall back to the default "Settings" section and navigate
      // the user away from the Support tab they just submitted on.
      const activeMainTab = document.querySelector(
        ".tabs-menu [data-tab].active-tab-main"
      );
      if (activeMainTab && activeMainTab.dataset && activeMainTab.dataset.tab) {
        const reloadUrl = new URL(window.location.href);
        reloadUrl.searchParams.set("tab", activeMainTab.dataset.tab);
        window.location.href = reloadUrl.toString();
      } else {
        location.reload();
      }

      // reset file input styles
      submitBtn.disabled = true;
      submitBtn.classList.remove("cursor-pointer", "bg-violet-sky", "text-white");
      submitBtn.classList.add("cursor-not-allowed", "bg-light-gray", "text-medium-gray");

      // Wait for latest data from server
      await fetchTickets();
      currentPage = 1;
      renderTickets();
      renderSupportPagination();
    } else {
      toastr.error(result.message || "Something went wrong.", "Error");
    }
  } catch (error) {
    toastr.error("Something went wrong while submitting your issue.", "Error");
  }
});

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

// Fetch all support tickets
async function fetchTickets() {
  try {
    const res = await fetch(getTicketLists);
    allTickets = await res.json();
    currentPage = 1; // reset to first page
    renderTickets();
    renderSupportPagination();
  } catch (err) {
    console.error("Error loading tickets:", err);
  }
}

//list of support data
function renderTickets(data = allTickets) {
  const tbody = document.getElementById("ticket-history-body");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No tickets found.</td></tr>`;
    return;
  }

  const start = (currentPage - 1) * itemsPerPage;
  const paginatedItems = data.slice(start, start + itemsPerPage);

  paginatedItems.forEach((ticket) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="px-4 py-2.5 text-center">${ticket.date_time}</td>
      <td class="px-4 py-2.5 text-center">${ticket.ticket_id}</td>
      <td class="px-4 py-2.5 text-center">${ticket.issue_type}</td>
      <td class="px-6 py-4.5 flex items-center justify-center">
        <div class="w-full max-w-[120px] ${ticket.status_class} py-2 rounded-md border-none px-3 flex items-center justify-center gap-2">
          ${ticket.status}
        </div>
      </td>
      <td class="px-4 py-2.5 text-center">
        <span
          title="View Ticket Details"
          class="material-symbols-outlined text-dark-gray cursor-pointer hover:bg-transparent-violet-sky rounded-full p-2 transition-all mr-2"
          onclick="openModalProgress('${ticket.ticket_id}')"
        >
          visibility
        </span>
      </td>`;
    tbody.appendChild(row);
  });
}

// Render pagination buttons
// Render pagination buttons (THEME AWARE)
function renderSupportPagination(data = allTickets) {
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginationBtns = document.querySelector(".paginationBtns");
  const prevBtn = document.querySelector(".prevPage");
  const nextBtn = document.querySelector(".nextPage");

  const activeColor = getPaginationThemeColor();   // 🔥 dynamic
  const activeBg = `bg-${activeColor}`;

  paginationBtns.innerHTML = "";

  const createPageBtn = (page) => {
    const btn = document.createElement("button");

    // base classes
    btn.className = "page-btn px-3 py-1.5 rounded-lg text-sm";

    if (page === currentPage) {
      btn.classList.add(activeBg, "text-white");
    } else {
      btn.classList.add("bg-pagination", "text-dark-gray");
    }

    btn.textContent = page;

    btn.addEventListener("click", () => {
      currentPage = page;
      renderTickets(data);
      renderSupportPagination(data);
    });

    return btn;
  };

  // show first 3 pages
  for (let i = 1; i <= Math.min(3, totalPages); i++) {
    paginationBtns.appendChild(createPageBtn(i));
  }

  // ellipsis + last page
  if (totalPages > 4) {
    const ellipsis = document.createElement("span");
    ellipsis.textContent = "...";
    ellipsis.className = "text-gray-500 px-2";
    paginationBtns.appendChild(ellipsis);
    paginationBtns.appendChild(createPageBtn(totalPages));
  }

  // Prev / Next state
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;

  prevBtn.classList.toggle("opacity-50", currentPage === 1);
  nextBtn.classList.toggle("opacity-50", currentPage === totalPages);

  // Prev click
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderTickets(data);
      renderSupportPagination(data);
    }
  };

  // Next click
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTickets(data);
      renderSupportPagination(data);
    }
  };
}


//previous pagination
document.querySelector(".prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTickets();
    renderSupportPagination();
  }
});

//next pagination
document.querySelector(".nextPage").addEventListener("click", () => {
  const totalPages = Math.ceil(allTickets.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTickets();
    renderSupportPagination();
  }
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", fetchTickets);

// Search functionality
document
  .getElementById("ticket-search")
  .addEventListener("input", function (e) {
    const query = e.target.value.toLowerCase();

    const filtered = allTickets.filter((ticket) => {
      return (
        ticket.issue_type.toLowerCase().includes(query) ||
        ticket.ticket_id.toLowerCase().includes(query)
      );
    });

    currentPage = 1;
    renderTickets(filtered); // Pass filtered results
    renderSupportPagination(filtered); // Adjust pagination accordingly
  });

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Replace listener:
document.getElementById("ticket-search").addEventListener(
  "input",
  debounce(function (e) {
    const query = e.target.value.toLowerCase();
    const filtered = allTickets.filter((ticket) => {
      return (
        ticket.issue_type.toLowerCase().includes(query) ||
        ticket.ticket_id.toLowerCase().includes(query)
      );
    });
    currentPage = 1;
    renderTickets(filtered);
    renderSupportPagination(filtered);
  }, 300)
);

//show data in modal
function openModalProgress(ticketId) {
  fetch(ticketDetailsIdWise, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify({ ticket_id: ticketId }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
        return;
      }

      // Show modal
      document.querySelector(".view-modal-progress").classList.remove("hidden");

      // Fill modal fields
      document.querySelector(".help-ticket-id").textContent = data.ticket_id;
      document.querySelector(".help-email-short").textContent = data.email
        .charAt(0)
        .toUpperCase();
      document.querySelector(".help-email").textContent = data.email;
      document.querySelector(".help-usertype").textContent =
        "(" + data.usertype + ")";
      document.querySelector(".help-created-date").textContent =
        data.created_at;
      document.querySelector(".help-updated-date").textContent =
        data.updated_at;
      document.querySelector(".help-description").textContent =
        data.description;
      // document.querySelector(".help-status").textContent = data.status;
      document.querySelectorAll(".help-status").forEach((el) => {
        el.textContent = data.status;
      });
      document.querySelector(".help-updated-date-status").textContent =
        data.updated_at;
      const imgElement = document.querySelector(".help-img");

      if (data.img && data.img.trim() !== "") {
        imgElement.src = data.img;
        imgElement.classList.remove("hidden");
      } else {
        imgElement.src = "";
        imgElement.classList.add("hidden");
      }
      console.log("IMAGE URL:", data.img);
      console.log("Highlighting status:", data.status);
      highlightCurrentStatus(data.status);
      // highlightCurrentStatus(data.status);
    })
    .catch((error) => {
      console.error("Fetch error:", error);
      alert("Something went wrong while loading ticket details.");
    });
}

//highlight status dots
function highlightCurrentStatus(currentStatus) {
  const steps = document.querySelectorAll(".status-step");
  let statusReached = false;

  steps.forEach((step) => {
    const status = step.getAttribute("data-status").trim().toLowerCase();
    const dot = step.querySelector(".dot");
    const line = step.querySelector(".line");

    // Highlight up to the current status
    if (!statusReached) {
      dot.classList.remove("bg-violet-sky");
      dot.classList.add("bg-light-sea-green");

      if (line) {
        line.classList.remove("bg-violet-sky");
        line.classList.add("bg-light-sea-green");
      }
    }

    // If this is the current status, stop highlighting further
    if (status === currentStatus.trim().toLowerCase()) {
      statusReached = true;
    }
  });
}

//filter date and custome date wise
document.querySelectorAll(".help-filter-option").forEach((el) => {
  el.addEventListener("click", function () {
    const filter = this.getAttribute("data-filter");

    if (filter === "custom") {
      document
        .querySelector(".datepicker-container")
        .classList.remove("hidden");
      return; // Stop further processing
    }

    const today = new Date();
    let fromDate = new Date(today);

    switch (filter) {
      case "1week":
        fromDate.setDate(today.getDate() - 7); // 7 days ago
        break;
      case "1month":
        fromDate.setMonth(today.getMonth() - 1); // 1 month ago
        break;
      case "1year":
        fromDate.setFullYear(today.getFullYear() - 1); // 1 year ago
        break;
    }

    const formattedFromDate = fromDate.toISOString().split("T")[0]; // "2024-07-14"
    const formattedToDate = today.toISOString().split("T")[0]; // "2025-07-14"

    filterTickets(formattedFromDate, formattedToDate);
  });
});

//date picker
document.addEventListener("DOMContentLoaded", function () {
  const datepickerElement = document.querySelector("[inline-datepicker]");

  if (datepickerElement) {
    datepickerElement.addEventListener("changeDate", function (e) {
      // If using a timestamp directly:
      const timestamp = e.detail.date; // e.g. 1749234600000
      const selectedDate = new Date(timestamp); // Convert to Date object

      // const formattedDate = selectedDate.toISOString().split("T")[0]; // "YYYY-MM-DD"
      const formattedDate =
        selectedDate.getFullYear() +
        "-" +
        String(selectedDate.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(selectedDate.getDate()).padStart(2, "0");

      // console.log("Selected Date:", formattedDate); // Debug log
      filterTickets(formattedDate, formattedDate); // Filter by selected date only
    });
  }
});

function filterTickets(fromDate, toDate) {
  fetch(ticketDetailsDateWise, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify({ from_date: fromDate, to_date: toDate }),
  })
    .then((res) => res.json())
    .then((data) => {
      allTickets = data.tickets; // Update the global variable
      currentPage = 1; // Reset to page 1
      renderTickets(allTickets); // Render from filtered data
      renderSupportPagination(allTickets.length);
      // renderTickets(data.tickets); // Use your existing renderTickets()
    })
    .catch((err) => {
      console.error("Filter fetch error:", err);
    });
}

function goToPage(pageNum) {
  currentPage = pageNum;
  renderTickets(allTickets); // Always render based on current `allTickets`
}

// faq code start ------------------------------------------
// tab
$(document).ready(function () {
  let faqLoaded = false;

  $(".ngo-sprt-tab-btn").click(function () {
    const target = $(this).data("tab");

    // Reset active class using context-driven class
    $(".ngo-sprt-tab-btn").removeClass("{{ active_tab_class }}");
    $(this).addClass("{{ active_tab_class }}");

    // Show target content
    $(".tab-content").addClass("hidden");
    $("." + target).removeClass("hidden");

    if (target === "contact-support" && !faqLoaded) {
      fetchFaqs();
      faqLoaded = true;
      setTimeout(() => $("#faq-search-input").focus(), 100);
    }
  });
});

  // Reusable FAQ fetcher
  function fetchFaqs(query = "") {
    $.ajax({
      url: faqLists,
      type: "GET",
      data: { search: query },
      success: function (response) {
        $("#faq-list-container").html(response);
      },
      error: function () {
        $("#faq-list-container").html(
          '<p class="text-red-500">Failed to load FAQs.</p>'
        );
      },
    });
  }

  // Debounce function
  function debounce(fn, delay) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, arguments), delay);
    };
  }

  // Live search handler
  $(document).on(
    "input",
    "#faq-search-input",
    debounce(function () {
      const query = $(this).val().trim();
      fetchFaqs(query); // If empty, all FAQs will load
    }, 300)
  );


//accordian open in faq
$(document).on("click", ".toggle-subscription", function () {
  var content = $(this)
    .closest(".account-subscription")
    .find(".subscription-content");
  var icon = $(this).find(".chevron-icon");

  content.toggleClass("hidden");
  icon.toggleClass("rotate-180");
});

//mail code start--------------------------------------------
//send email
function sendEmailSupport() {
  const email = $("#email").val().trim();
  const description = $("#description").val().trim();

  if (!email || !description) {
    alert("Please fill out both fields.");
    return;
  }

  $.ajax({
    url: sendMail,
    method: "POST",
    headers: {
      "X-CSRFToken": "{{ csrf_token }}",
    },
    data: {
      email: email,
      description: description,
    },
    success: function (response) {
      alert("Message sent successfully!");
      $("#email").val("");
      $("#description").val("");
    },
    error: function (xhr) {
      alert("Failed to send message. Please try again.");
    },
  });
}
