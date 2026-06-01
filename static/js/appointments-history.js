// Open modal when any card is clicked
//All Accepted
  document.querySelectorAll(".card-all-accepted").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelector(".modal-all-accepted").classList.remove("hidden");
    });
  });

  // Close modal when close button is clicked
  document.querySelector(".modal-close-all-accepted").addEventListener("click", () => {
    document.querySelector(".modal-all-accepted").classList.add("hidden");
  });

//All Competed
  document.querySelectorAll(".card-all-completed").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelector(".modal-all-completed").classList.remove("hidden");
    });
  });

  // Close modal when close button is clicked
  document.querySelector(".modal-close-all-completed").addEventListener("click", () => {
    document.querySelector(".modal-all-completed").classList.add("hidden");
  });

  


  // For "missed" modal
document.querySelectorAll(".card-missed").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelector(".modal-missed").classList.remove("hidden");
  });
});

// Close "missed" modal
document.querySelector(".modal-close-missed").addEventListener("click", () => {
  document.querySelector(".modal-missed").classList.add("hidden");
});

// For "canceled" modal
document.querySelectorAll(".card-canceled").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelector(".modal-canceled").classList.remove("hidden");
  });
});

// Close "canceled" modal
document.querySelector(".modal-close-canceled").addEventListener("click", () => {
  document.querySelector(".modal-canceled").classList.add("hidden");
});


// For "pending" modal
document.querySelectorAll(".card-pending").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelector(".modal-pending").classList.remove("hidden");
  });
});

// Close "pending" modal
document.querySelector(".modal-close-pending").addEventListener("click", () => {
  document.querySelector(".modal-pending").classList.add("hidden");
});


// Image Attachment Preview (for all)
document.querySelectorAll(".view-attachment").forEach(button => {
  button.addEventListener("click", () => {
    const attachmentModal = document.querySelector(".attachment-modal");
    attachmentModal.classList.remove("hidden");
  });
});

const attachmentModal = document.querySelector(".attachment-modal");
const closeAttachmentModal = document.querySelector(".close-attachment-modal");

closeAttachmentModal.addEventListener("click", () => {
  attachmentModal.classList.add("hidden");
});

// Close modal if background clicked
attachmentModal.addEventListener("click", (e) => {
  if (e.target === attachmentModal) {
    attachmentModal.classList.add("hidden");
  }
});

//Equipment
// Handle all status buttons dynamically
// Toggle dropdown visibility
  document.addEventListener('click', function (e) {
    const clickedButton = e.target.closest('.status-btn');
    const allDropdowns = document.querySelectorAll('.status-dropdown');

    // If clicked inside a status button
    if (clickedButton) {
      const dropdown = clickedButton.nextElementSibling;
      // Close all other dropdowns
      allDropdowns.forEach(d => {
        if (d !== dropdown) d.classList.add('hidden');
      });
      // Toggle current dropdown
      dropdown.classList.toggle('hidden');
      return;
    }

    // If clicked on a dropdown item
    if (e.target.classList.contains('dropdown-item')) {
      const parent = e.target.closest('.relative');
      parent.querySelector('.status-text').textContent = e.target.textContent;
      parent.querySelector('.status-dropdown').classList.add('hidden');
      return;
    }

    // If clicked outside dropdowns, close all
    allDropdowns.forEach(d => d.classList.add('hidden'));
  });
$(document).on("click", ".complete-appointment-btn", function () {

    const appointmentId = $(this).data("id");

    $.ajax({
        url: "/history/lab/complete/",
        type: "POST",
        data: {
            id: appointmentId,
            csrfmiddlewaretoken: $('[name=csrfmiddlewaretoken]').val()
        },

        success: function (response) {

            Swal.fire({
                icon: "success",
                title: "Appointment Completed",
                timer: 2000,
                showConfirmButton: false
            });

            location.reload();
        }
    });
});
$(document).on("click", ".cancel-appointment-btn", function () {

    const appointmentId = $(this).data("id");

    $.ajax({
        url: "/history/lab/cancel/",
        type: "POST",
        data: {
            id: appointmentId,
            csrfmiddlewaretoken: $('[name=csrfmiddlewaretoken]').val()
        },

        success: function (response) {

            Swal.fire({
                icon: "success",
                title: "Appointment Cancelled",
                timer: 2000,
                showConfirmButton: false
            });

            location.reload();
        }
    });
});
// $(document).on("click", "#shareBtn", function () {

//     if (navigator.share) {

//         navigator.share({
//             title: "Appointment Details",
//             text: "Appointment Information",
//             url: window.location.href
//         });

//     } else {

//         window.open(
//             "https://wa.me/?text=" + encodeURIComponent(window.location.href),
//             "_blank"
//         );

//     }
// });

$(document).on("click", ".patient-share-btn", function () {

    $("#patientSharePopup")
        .removeClass("hidden")
        .addClass("flex");

});
$(document).on("click", ".close-patient-share-popup", function () {

    $("#patientSharePopup")
        .addClass("hidden")
        .removeClass("flex");

});
$(document).on("click", ".patient-share-app", function () {

    const app = $(this).data("app");
    const link = $("#patient-share-link").val();

    let url = "";

    switch (app) {

        case "whatsapp":
            url = `https://wa.me/?text=${encodeURIComponent(link)}`;
            break;

        case "telegram":
            url = `https://t.me/share/url?url=${encodeURIComponent(link)}`;
            break;

        case "facebook":
            url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
            break;

        case "gmail":
            url = `mailto:?subject=Patient Information&body=${encodeURIComponent(link)}`;
            break;

        case "sms":
            url = `sms:?body=${encodeURIComponent(link)}`;
            break;
    }

    if (url) {
        window.open(url, "_blank");
    }
});
$(document).on("click", ".patient-share-btn", function () {

    console.log("SHARE CLICKED");

    $("#patientSharePopup")
        .removeClass("hidden")
        .addClass("flex");
});