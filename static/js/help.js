// Function to check if the form is valid
function checkFormValidity() {
    const issueType = $('.issue-type').val().trim();
    const issueDesc = $('.issue-description').val().trim();
    const issueImage = $('.issue-image')[0].files.length > 0;

    if (issueType && issueDesc && issueImage) {
        $('.issue-submit-btn')
            .prop('disabled', false)
            .removeClass('text-medium-gray bg-light-gray cursor-not-allowed')
            .addClass('bg-light-sea-green text-white cursor-pointer');
    } else {
        $('.issue-submit-btn')
            .prop('disabled', true)
            .removeClass('bg-light-sea-green text-white cursor-pointer')
            .addClass('text-medium-gray bg-light-gray cursor-not-allowed');
    }
}

// Event listeners for input changes to validate the form
$(function () {
    $('.issue-type, .issue-description').on('input', checkFormValidity);
    $('#issue-image').on('change', checkFormValidity);
});

// Toggle functionality for various sections with accordion-style behavior

$('.toggle-subscription').click(function () {
    var content = $(this).closest('.account-subscription').find('.subscription-content');
    var icon = $(this).find('.chevron-icon');

    content.toggleClass('hidden');
    icon.toggleClass('rotate-180');
});

$('.toggle-avatar').click(function () {
    var content = $(this).closest('.avatar-creation').find('.avatar-content');
    var icon = $(this).find('.chevron-icon');

    content.toggleClass('hidden');
    icon.toggleClass('rotate-180');
});

$('.toggle-troubleshooting').click(function () {
    var content = $(this).closest('.troubleshooting-section').find('.troubleshooting-content');
    var icon = $(this).find('.chevron-icon');

    content.toggleClass('hidden');
    icon.toggleClass('rotate-180');
});

$('.toggle-billing-payments').click(function () {
    var content = $(this).closest('.billing-payments-section').find('.billing-payments-content');
    var icon = $(this).find('.chevron-icon');

    content.toggleClass('hidden');
    icon.toggleClass('rotate-180');
});

$('.toggle-support-contact').click(function () {
    var content = $(this).closest('.support-contact-section').find('.support-contact-content');
    var icon = $(this).find('.chevron-icon');

    content.toggleClass('hidden');
    icon.toggleClass('rotate-180');
});

$('.toggle-support-contact1').click(function () {
    var content = $(this).closest('.support-contact-section1').find('.support-contact-content1');
    var icon = $(this).find('.chevron-icon');

    content.toggleClass('hidden');
    icon.toggleClass('rotate-180');
});

// Function to toggle the visibility of the chat popup
function toggleChat() {
    // Toggle the 'hidden' class on all elements with the 'chat-popup' class
    document.querySelectorAll('.chat-popup').forEach(function(popup) {
        popup.classList.toggle('hidden');
    });
}

function sendEmailSupport() {
    // You can add form validation or sending logic here
    window.showToaster('success', 'Message sent!');
    document.querySelector('.emailPopup').classList.add('hidden');
  }

  const issueMap = {
  type1: ["Unable to log in or reset password", "Profile update not saving", "Mobile number or email verification failed", "App crashing or freezing on startup"],
  type2: ["Bid request not showing in history", "No response from pharmacies on my bid", "My accepted bid disappeared", "Can't upload or attach prescription"],
  type3: ["Not receiving order or bid notifications", "Chat with pharmacy not working", "In-app notifications are delayed"],
  type4: ["App interface glitches (e.g., buttons not working)", "Location detection issue", "Images or attachments not uploading", "Reporting fake or spam pharmacy listing"]
};

// Toggle dropdowns
$('.issue-type-wrapper .issue-type-input, .issue-type-wrapper .material-symbols-outlined').on('click', function () {
  $('.issue-type-dropdown').toggleClass('hidden');
});
$('.select-issue-wrapper .select-issue-input, .select-issue-wrapper .material-symbols-outlined').on('click', function () {
  $('.select-issue-dropdown').toggleClass('hidden');
});

// Handle issue type checkbox selection
$('.issue-checkbox').on('click', function (e) {
  e.stopPropagation();
  $('.issue-checkbox').not(this).prop('checked', false);

  const isChecked = $(this).is(':checked');
  const selectedType = $(this).data('type');
  const selectedText = $(this).closest('li').find('span').text().trim();
  const options = issueMap[selectedType] || [];

  const $typeWrapper = $(this).closest('.issue-type-wrapper');
  const $selectWrapper = $('.select-issue-wrapper');
  const $issueInput = $typeWrapper.find('.issue-type-input');
  const $selectInput = $selectWrapper.find('.select-issue-input');
  const $selectDropdown = $selectWrapper.find('.select-issue-dropdown');

  // Get custom color classes from the wrapper's data-* attributes
  const hoverClass = $selectWrapper.data('hover-class') || '';
  const checkboxColor = $selectWrapper.data('checkbox-color') || '';
  const ringColor = $selectWrapper.data('ring-color') || '';

  if (isChecked) {
    $issueInput.val(selectedText);
    $('.issue-type-dropdown').addClass('hidden');

    $selectInput.val('');
    $selectDropdown.empty();

    options.forEach(option => {
      const $li = $('<li>').addClass('dropdown-option px-3 py-2 flex justify-between items-center');

      const $span = $('<span>')
        .addClass(`text-dark-gray ${hoverClass}`)
        .text(option);

      const $checkbox = $('<input>')
        .attr({
          type: 'checkbox',
          name: 'selectIssueOption',
          'data-option': option
        })
        .addClass(`select-issue-checkbox form-checkbox cursor-pointer rounded-sm ${checkboxColor} ${ringColor}`);

      $li.append($span, $checkbox);
      $selectDropdown.append($li);
    });
  } else {
    $issueInput.val('');
    $selectInput.val('');
    $selectDropdown.empty();
  }

  checkFormValidity();
});

// Handle select issue checkbox click
$('.select-issue-dropdown').off('click', '.select-issue-checkbox').on('click', '.select-issue-checkbox', function (e) {
  e.stopPropagation();
  $('.select-issue-checkbox').not(this).prop('checked', false);

  const isChecked = $(this).is(':checked');
  const selectedOption = $(this).data('option');
  const $selectInput = $('.select-issue-input');

  if (isChecked) {
    $selectInput.val(selectedOption);
    $('.select-issue-dropdown').addClass('hidden');
  } else {
    $selectInput.val('');
  }

  checkFormValidity();
});



// Close dropdowns when clicking outside
$(document).on('click', function (e) {
  if (!$(e.target).closest('.issue-type-wrapper').length) {
    $('.issue-type-dropdown').addClass('hidden');
  }
  if (!$(e.target).closest('.select-issue-wrapper').length) {
    $('.select-issue-dropdown').addClass('hidden');
  }
});
 function openModal() {
            document.querySelector('.view-modal').classList.remove('hidden');
        }

        function closeModal() {
            document.querySelector('.view-modal').classList.add('hidden');
        }

// Modal close on overlay click (using class selectors)
$(document).ready(function () {
    
    $(document).on('click', '.view-modal', function (e) {
       
        if (e.target === this) {
            $(this).addClass('hidden');
        }
    });
    // ESC key closes any open modal
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            $('.view-modal').addClass('hidden');
        }
    });
});

// You can still use openModal() and closeModal() as before
function openModal() {
    document.querySelector('.view-modal').classList.remove('hidden');
}

function closeModal() {
    document.querySelector('.view-modal').classList.add('hidden');
}

function openModalProgress() {
    document.querySelector('.view-modal-progress').classList.remove('hidden');
}

function closeModalProgress() {
    document.querySelector('.view-modal-progress').classList.add('hidden');
}

$('.custom-dropdown-btn').on('click', function (e) {
  e.stopPropagation();
  const $dropdown = $(this).closest('.custom-dropdown');
  $('.custom-dropdown-option').not($dropdown.find('.custom-dropdown-option')).hide();
  $dropdown.find('.custom-dropdown-option').toggle();
});

$(document).on('click', function () {
  $('.custom-dropdown-option').hide();
});


// File input change event of
document.addEventListener('DOMContentLoaded', function () {
  // End customer upload section
  const issueImage = document.getElementById('issue-image');
  if (issueImage) {
    issueImage.addEventListener('change', function (e) {
      const fileInput = e.target;
      const fileNameSpan = document.getElementById('file-name');
      const submitBtn = document.getElementById('submit-btn');
      const virusScanStatus = document.getElementById('virus-scan-status');

      if (
        fileInput.files &&
        fileInput.files.length > 0 &&
        fileNameSpan &&
        submitBtn &&
        virusScanStatus
      ) {
        fileNameSpan.textContent = fileInput.files[0].name;
        submitBtn.classList.remove('bg-gray-300');
        submitBtn.classList.add('bg-vivid-orange');
        virusScanStatus.classList.remove('hidden');
      } else if (fileNameSpan && submitBtn && virusScanStatus) {
        fileNameSpan.textContent = 'Upload image of the issue';
        submitBtn.classList.remove('bg-vivid-orange');
        submitBtn.classList.add('bg-gray-300');
        virusScanStatus.classList.add('hidden');
      }
    });
  }

  
 //Advertiser 
 const advertiserIssueImage = document.getElementById('advertiser-issue-image');
const advertiserSelectedFiles = [];

if (advertiserIssueImage) {
  advertiserIssueImage.addEventListener('change', function (e) {
    const fileInput = e.target;
    const fileContainer = document.querySelector('.advertiser-file-container');
    const submitBtn = document.getElementById('advertiser-issue-submit-btn');

    if (fileInput.files && fileInput.files.length > 0 && fileContainer && submitBtn) {
      for (let i = 0; i < fileInput.files.length; i++) {
        const file = fileInput.files[i];
        if (!advertiserSelectedFiles.some(f => f.name === file.name && f.size === file.size)) {
          advertiserSelectedFiles.push(file);
        }
      }

      updateAdvertiserFileDisplay(fileContainer, submitBtn);
      fileInput.value = '';
    } else if (fileContainer && submitBtn && advertiserSelectedFiles.length === 0) {
      resetAdvertiserFileDisplay(fileContainer, submitBtn);
    }
  });
}

function updateAdvertiserFileDisplay(container, submitBtn) {
  container.innerHTML = '';

  if (advertiserSelectedFiles.length === 0) {
    container.innerHTML = '<span class="advertiser-file-name font-normal text-sm">Upload image of the issue</span>';
    resetAdvertiserSubmitButton(submitBtn);
    return;
  }

  const filesWrapper = document.createElement('div');
  filesWrapper.className = 'flex items-center gap-2 overflow-x-auto max-w-full py-1';

  advertiserSelectedFiles.forEach((file, index) => {
    const fileElement = document.createElement('div');
    fileElement.className = 'flex items-center gap-1 bg-gray-100 px-2 py-1 rounded mr-1';

    const fileName = document.createElement('span');
    fileName.className = 'text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]';
    fileName.textContent = file.name;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'material-symbols-outlined text-red-500 cursor-pointer text-sm';
    removeBtn.textContent = 'close';
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

  submitBtn.classList.remove('bg-light-gray', 'text-medium-gray', 'cursor-not-allowed');
  submitBtn.classList.add('bg-living-coral', 'text-white', 'cursor-pointer');
  submitBtn.disabled = false;
}

function removeAdvertiserFile(index, container, submitBtn) {
  advertiserSelectedFiles.splice(index, 1);
  updateAdvertiserFileDisplay(container, submitBtn);
}

function resetAdvertiserFileDisplay(container, submitBtn) {
  container.innerHTML = '<span class="advertiser-file-name font-normal text-sm">Upload image of the issue</span>';
  resetAdvertiserSubmitButton(submitBtn);
}

function resetAdvertiserSubmitButton(submitBtn) {
  submitBtn.classList.remove('bg-living-coral', 'text-white', 'cursor-pointer');
  submitBtn.classList.add('bg-light-gray', 'text-medium-gray', 'cursor-not-allowed');
  submitBtn.disabled = true;
}


//Client upload section

 const clientIssueImage = document.getElementById('client-issue-image');
const clientSelectedFiles = [];

if (clientIssueImage) {
  clientIssueImage.addEventListener('change', function (e) {
    const fileInput = e.target;
    const fileContainer = document.querySelector('.client-file-container');
    const submitBtn = document.getElementById('client-issue-submit-btn');

    if (fileInput.files && fileInput.files.length > 0 && fileContainer && submitBtn) {
      for (let i = 0; i < fileInput.files.length; i++) {
        const file = fileInput.files[i];
        if (!clientSelectedFiles.some(f => f.name === file.name && f.size === file.size)) {
          clientSelectedFiles.push(file);
        }
      }

      updateClientFileDisplay(fileContainer, submitBtn);
      fileInput.value = '';
    } else if (fileContainer && submitBtn && clientSelectedFiles.length === 0) {
      resetClientFileDisplay(fileContainer, submitBtn);
    }
  });
}

function updateClientFileDisplay(container, submitBtn) {
  container.innerHTML = '';

  if (clientSelectedFiles.length === 0) {
    container.innerHTML = '<span class="client-file-name font-normal text-sm">Upload image of the issue</span>';
    resetClientSubmitButton(submitBtn);
    return;
  }

  const filesWrapper = document.createElement('div');
  filesWrapper.className = 'flex items-center gap-2 overflow-x-auto max-w-full py-1';

  clientSelectedFiles.forEach((file, index) => {
    const fileElement = document.createElement('div');
    fileElement.className = 'flex items-center gap-1 bg-gray-100 px-2 py-1 rounded mr-1';

    const fileName = document.createElement('span');
    fileName.className = 'text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]';
    fileName.textContent = file.name;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'material-symbols-outlined text-red-500 cursor-pointer text-sm';
    removeBtn.textContent = 'close';
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

  submitBtn.classList.remove('bg-light-gray', 'text-medium-gray', 'cursor-not-allowed');
  submitBtn.classList.add('bg-dark-blue', 'text-white', 'cursor-pointer');
  submitBtn.disabled = false;
}

function removeClientFile(index, container, submitBtn) {
  clientSelectedFiles.splice(index, 1);
  updateClientFileDisplay(container, submitBtn);
}

function resetClientFileDisplay(container, submitBtn) {
  container.innerHTML = '<span class="client-file-name font-normal text-sm">Upload image of the issue</span>';
  resetClientSubmitButton(submitBtn);
}

function resetClientSubmitButton(submitBtn) {
  submitBtn.classList.remove('bg-dark-blue', 'text-white', 'cursor-pointer');
  submitBtn.classList.add('bg-light-gray', 'text-medium-gray', 'cursor-not-allowed');
  submitBtn.disabled = true;
}



  // Pharmacy upload section

 
const pharmacyIssueImage = document.getElementById('pharmacy-issue-image');
const pharmacySelectedFiles = [];

if (pharmacyIssueImage) {
  pharmacyIssueImage.addEventListener('change', function (e) {
    const fileInput = e.target;
    const fileContainer = document.querySelector('.pharmacy-file-container');
    const submitBtn = document.getElementById('pharmacy-issue-submit-btn');

    if (fileInput.files && fileInput.files.length > 0 && fileContainer && submitBtn) {
      // Add files without duplicates
      for (let i = 0; i < fileInput.files.length; i++) {
        const file = fileInput.files[i];
        if (!pharmacySelectedFiles.some(f => f.name === file.name && f.size === file.size)) {
          pharmacySelectedFiles.push(file);
        }
      }

      updatePharmacyFileDisplay(fileContainer, submitBtn);
      fileInput.value = ''; // Reset file input
    } else if (fileContainer && submitBtn && pharmacySelectedFiles.length === 0) {
      resetPharmacyFileDisplay(fileContainer, submitBtn);
    }
  });
}

function updatePharmacyFileDisplay(container, submitBtn) {
  container.innerHTML = '';

  if (pharmacySelectedFiles.length === 0) {
    container.innerHTML = '<span class="pharmacy-file-name font-normal text-sm">Upload image of the issue</span>';
    resetPharmacySubmitButton(submitBtn);
    return;
  }

  const filesWrapper = document.createElement('div');
  filesWrapper.className = 'flex items-center gap-2 overflow-x-auto max-w-full py-1';

  pharmacySelectedFiles.forEach((file, index) => {
    const fileElement = document.createElement('div');
    fileElement.className = 'flex items-center gap-1 bg-gray-100 px-2 py-1 rounded mr-1';

    const fileName = document.createElement('span');
    fileName.className = 'text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]';
    fileName.textContent = file.name;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'material-symbols-outlined text-red-500 cursor-pointer text-sm';
    removeBtn.textContent = 'close';
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
  submitBtn.classList.remove('bg-light-gray', 'text-medium-gray', 'cursor-not-allowed');
  submitBtn.classList.add('bg-light-sea-green', 'text-white', 'cursor-pointer');
  submitBtn.disabled = false;
}

function removePharmacyFile(index, container, submitBtn) {
  pharmacySelectedFiles.splice(index, 1);
  updatePharmacyFileDisplay(container, submitBtn);
}

function resetPharmacyFileDisplay(container, submitBtn) {
  container.innerHTML = '<span class="pharmacy-file-name font-normal text-sm">Upload image of the issue</span>';
  resetPharmacySubmitButton(submitBtn);
}

function resetPharmacySubmitButton(submitBtn) {
  submitBtn.classList.remove('bg-light-sea-green', 'text-white', 'cursor-pointer');
  submitBtn.classList.add('bg-light-gray', 'text-medium-gray', 'cursor-not-allowed');
  submitBtn.disabled = true;
}



  // NGO Upload section
  
const ngoIssueImage = document.getElementById('ngo-issue-image');
const ngoSelectedFiles = [];

if (ngoIssueImage) {
  ngoIssueImage.addEventListener('change', function (e) {
    const fileInput = e.target;
    const fileContainer = document.querySelector('.ngo-file-container');
    const submitBtn = document.getElementById('ngo-issue-submit-btn');

    if (fileInput.files && fileInput.files.length > 0 && fileContainer && submitBtn) {
      for (let i = 0; i < fileInput.files.length; i++) {
        const file = fileInput.files[i];
        if (!ngoSelectedFiles.some(f => f.name === file.name && f.size === file.size)) {
          ngoSelectedFiles.push(file);
        }
      }

      updateNgoFileDisplay(fileContainer, submitBtn);
      fileInput.value = '';
    } else if (fileContainer && submitBtn && ngoSelectedFiles.length === 0) {
      resetNgoFileDisplay(fileContainer, submitBtn);
    }
  });
}

function updateNgoFileDisplay(container, submitBtn) {
  container.innerHTML = '';

  if (ngoSelectedFiles.length === 0) {
    container.innerHTML = '<span class="ngo-file-name font-normal text-sm">Upload image of the issue</span>';
    resetNgoSubmitButton(submitBtn);
    return;
  }

  const filesWrapper = document.createElement('div');
  filesWrapper.className = 'flex items-center gap-2 overflow-x-auto max-w-full py-1';

  ngoSelectedFiles.forEach((file, index) => {
    const fileElement = document.createElement('div');
    fileElement.className = 'flex items-center gap-1 bg-gray-100 px-2 py-1 rounded mr-1';

    const fileName = document.createElement('span');
    fileName.className = 'text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]';
    fileName.textContent = file.name;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'material-symbols-outlined text-red-500 cursor-pointer text-sm';
    removeBtn.textContent = 'close';
    removeBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeNgoFile(index, container, submitBtn);
    };

    fileElement.appendChild(fileName);
    fileElement.appendChild(removeBtn);
    filesWrapper.appendChild(fileElement);
  });

  container.appendChild(filesWrapper);

  submitBtn.classList.remove('bg-light-gray', 'text-medium-gray', 'cursor-not-allowed');
  submitBtn.classList.add('bg-violet-sky', 'text-white', 'cursor-pointer');
  submitBtn.disabled = false;
}

function removeNgoFile(index, container, submitBtn) {
  ngoSelectedFiles.splice(index, 1);
  updateNgoFileDisplay(container, submitBtn);
}

function resetNgoFileDisplay(container, submitBtn) {
  container.innerHTML = '<span class="ngo-file-name font-normal text-sm">Upload image of the issue</span>';
  resetNgoSubmitButton(submitBtn);
}

function resetNgoSubmitButton(submitBtn) {
  submitBtn.classList.remove('bg-violet-sky', 'text-white', 'cursor-pointer');
  submitBtn.classList.add('bg-light-gray', 'text-medium-gray', 'cursor-not-allowed');
  submitBtn.disabled = true;
}
});



const addedStatuses = new Set();

function addStatus(container, statusText, timestamp) {
  if (addedStatuses.has(statusText)) {
    return;
  }
  addedStatuses.add(statusText);

  const $container = $(container);
  const $dots = $container.find('.status-dots');
  const $labels = $container.find('.status-labels');
  const $times = $container.find('.status-times');

  let dotsCount = $dots.children('div').length;
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