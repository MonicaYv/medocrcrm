document.addEventListener("DOMContentLoaded", function () {

    // Donation Popup Functions
    window.openPopup = function (event) {
        if (event) event.preventDefault();
        const popup = document.querySelector(".donation-popup");
        if (popup) {
            popup.classList.remove("hidden", "pointer-events-none");
            popup.classList.add("flex");
        }
    };

    window.closePopup = function () {
        const popup = document.querySelector(".donation-popup");
        if (popup) {
            popup.classList.remove("flex");
            popup.classList.add("hidden", "pointer-events-none");
        }
    };

    window.goToDonatePage = function () {
        window.location.href = "donate.html";
    };

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closePopup();
        }
    });

    const popup = document.querySelector(".donation-popup");
    if (popup) {
        popup.addEventListener("click", function (e) {
            if (e.target === popup) {
                closePopup();
            }
        });
    }

})


// Show popup on upload icon click
document.querySelector('.pan-upload-trigger').addEventListener('click', function () {
  document.querySelector('.pan-file-access-popup').classList.remove('hidden');
});

// Hide popup on Deny click
document.querySelector('.pan-deny-access-btn').addEventListener('click', function () {
  document.querySelector('.pan-file-access-popup').classList.add('hidden');
});

// Allow file access and trigger file input
document.querySelector('.pan-allow-access-btn').addEventListener('click', function () {
  document.querySelector('.pan-file-access-popup').classList.add('hidden');
  document.querySelector('.pan-upload-input').click();
});

// On file selection, update virus scan status
document.querySelector('.pan-upload-input').addEventListener('change', function () {
  const checkbox = document.querySelector('.scan-toggle');
  const statusText = document.querySelector('.status-text');

  if (this.files && this.files.length > 0) {
    checkbox.checked = true;
    checkbox.classList.remove('border-dark-gray');
    checkbox.classList.add('border-green');
    statusText.textContent = 'Virus Scan';
    statusText.className = 'status-text text-green text-16-nr';
  }
});

