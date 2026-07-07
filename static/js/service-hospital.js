let HOSPITAL_CATEGORIES = [];
let HOSPITAL_SERVICES = [];
let HOSPITAL_BED_ROOMS = [];

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(";").shift();
    }
    return "";
}

function showStep(step) {
    $(".step-content").addClass("hidden");
    $(`#step-${step}`).removeClass("hidden");

    $(".step-circle").removeClass("active-step");
    $(".step-label").removeClass("active-heading");
    $(".step-line").removeClass("active-line");

    $(".step-circle").each(function () {
        if (Number($(this).data("step")) <= Number(step)) {
            $(this).addClass("active-step");
        }
    });

    $(".step-label").each(function () {
        if (Number($(this).data("step")) <= Number(step)) {
            $(this).addClass("active-heading");
        }
    });

    $(".step-line").each(function () {
        if (Number($(this).data("step")) < Number(step)) {
            $(this).addClass("active-line");
        }
    });
}

function renderServiceOptions() {
    return HOSPITAL_SERVICES.map((service) => `
        <li class="dropdown-item px-3 py-2 cursor-pointer hover:bg-premium-light-blue"
            data-id="${service.id}">
            ${service.description}
        </li>
    `).join("");
}

function renderRoomOptions() {
    return HOSPITAL_BED_ROOMS.map((room) => `
        <li class="dropdown-item px-3 py-2 cursor-pointer hover:bg-premium-light-blue"
            data-id="${room.id}">
            ${room.name}
        </li>
    `).join("");
}

function resetServiceCard($card) {
    $card.find(".category-id, .service-id").val("");
    $card.find(".category-dropdown-btn .selected-text").text("Select Category");
    $card.find(".service-dropdown-btn .selected-text").text("Select Service");
    $card.find(".service-options").html(renderServiceOptions());
    $card.find(".price-input").val("");
}

function resetRoomCard($card) {
    $card.find(".bed-room-id").val("");
    $card.find(".bed-room-dropdown-btn .selected-text").text("Select Bed & Room");
    $card.find(".room-options").html(renderRoomOptions());
    $card.find(".days-input").val("1");
    $card.find(".room-price-input").val("");
    $card.find(".ac-input").prop("checked", false);
}

// function collectServices() {
//     const services = [];

//     $(".services-list .service-card").each(function () {
//         const $card = $(this);
//         const categoryId = $card.find(".category-id").val();
//         const serviceId = $card.find(".service-id").val();
//         const price = $card.find(".price-input").val().trim();

//         if (categoryId && serviceId && price) {
//             services.push({
//                 category_id: categoryId,
//                 service_id: serviceId,
//                 price: price
//             });
//         }
//     });

//     return services;
// }

// function collectRooms() {
//     const rooms = [];

//     $(".bed-services-list .bed-service-card").each(function () {
//         const $card = $(this);
//         const bedRoomId = $card.find(".bed-room-id").val();
//         const days = $card.find(".days-input").val().trim();
//         const price = $card.find(".room-price-input").val().trim();
//         const ac = $card.find(".ac-input").is(":checked");

//         if (bedRoomId && days && price) {
//             rooms.push({
//                 bed_room_id: bedRoomId,
//                 days: Number(days),
//                 price: price,
//                 ac: ac
//             });
//         }
//     });

//     return rooms;
// }

function collectRooms() {

    const rooms = [];

    $(".bed-services-list .bed-service-card").each(function () {

        const $card = $(this);

        const bedRoomId = $card.find(".bed-room-id").val();
        const days = $card.find(".days-input").val();
        const price = $card.find(".room-price-input").val();
        const ac = $card.find(".ac-input").is(":checked");

        console.log(
            "ROOM ID =", bedRoomId,
            "DAYS =", days,
            "PRICE =", price,
            "AC =", ac
        );

        if (bedRoomId && days && price) {

            rooms.push({
                bed_room_id: bedRoomId,
                days: Number(days),
                price: price,
                ac: ac
            });
        }
    });

    console.log("FINAL ROOMS =", rooms);

    return rooms;
}

function collectServices() {

    const services = [];

    $(".services-list .service-card").each(function () {

        const $card = $(this);

        const categoryId = $card.find(".category-id").val();
        const serviceId = $card.find(".service-id").val();
        const price = $card.find(".price-input").val().trim();

        console.log(
            "CATEGORY =", categoryId,
            "SERVICE =", serviceId,
            "PRICE =", price
        );

        if (categoryId && serviceId && price) {

            services.push({
                category_id: categoryId,
                service_id: serviceId,
                price: price
            });
        }
    });

    console.log("FINAL SERVICES =", services);

    return services;
}
function renderSummary() {
    const services = collectServices();
    const rooms = collectRooms();
    

    const $servicesGrid = $(".hospital-summary-services");
    const $roomsGrid = $(".hospital-summary-rooms");
    $servicesGrid.empty();
    $roomsGrid.empty();

    if (services.length) {
        services.forEach((service) => {
            const serviceMeta = HOSPITAL_SERVICES.find((row) => String(row.id) === String(service.service_id));
            $servicesGrid.append(`
                <div class="service-card bg-white border border-frost-white rounded-md shadow-12 min-h-[85px] w-full flex flex-col items-start px-4 py-3 relative gap-2">
                    <div class="flex items-start justify-between w-full">
                        <h3 class="text-sm sm:text-base font-semibold text-black">${serviceMeta ? serviceMeta.description : "Service"}</h3>
                    </div>
                    <div class="flex items-center w-full">
                        <span class="text-base sm:text-lg text-dodger-blue font-bold">&#8377;${service.price}</span>
                    </div>
                </div>
            `);
        });
    } else {
        $servicesGrid.append('<p class="text-gray-400 lg:col-span-2">No services selected.</p>');
    }

    if (rooms.length) {
        rooms.forEach((room) => {
            const roomMeta = HOSPITAL_BED_ROOMS.find((row) => String(row.id) === String(room.bed_room_id));
            $roomsGrid.append(`
                <div class="service-card bg-white border border-frost-white rounded-md shadow-12 min-h-[81px] w-full flex flex-col items-start justify-center gap-2 px-4 py-2">
                    <div class="flex items-center justify-between w-full">
                        <h3 class="text-sm sm:text-base font-semibold text-black">${roomMeta ? roomMeta.name : "Bed & Room"}</h3>
                    </div>
                    <div class="flex items-center justify-between w-full">
                        <p class="text-sm sm:text-base font-semibold text-black">${room.days} Days${room.ac ? " | AC" : ""}</p>
                        <span class="text-base sm:text-lg font-bold text-dodger-blue">&#8377;${room.price}</span>
                    </div>
                </div>
            `);
        });
    } else {
        $roomsGrid.append('<p class="text-gray-400 lg:col-span-2">No rooms selected.</p>');
    }
}

$(document).ready(function () {

    HOSPITAL_CATEGORIES = JSON.parse(
        document.getElementById("hospital-categories-data").textContent
    );

    HOSPITAL_SERVICES = JSON.parse(
        document.getElementById("hospital-services-data").textContent
    );

    HOSPITAL_BED_ROOMS = JSON.parse(
        document.getElementById("hospital-bed-rooms-data").textContent
    );

    $(".services-list .service-card").each(function () {
        resetServiceCard($(this));
    });

    $(".bed-services-list .bed-service-card").each(function () {
        resetRoomCard($(this));
    });

  // --- INITIALIZATION ON PAGE LOAD ---
    // Note: The loop for services is removed because 1 card is already provided by your HTML.
    // This loop generates exactly 1 initial room card dynamically on startup.
    for (let i = 0; i < 1; i++) {
        const template = document.getElementById("bed-room-card-template");
        if (template) {
            const $card = $(template.content.firstElementChild.cloneNode(true));
            resetRoomCard($card);
            $(".bed-services-list").append($card);
        }
    }

    showStep(1);
});

// =========================================================================
// --- DROPDOWN ENGINE: TOGGLE OPEN/CLOSE VISIBILITY FOR ALL CARDS ---
// =========================================================================
$(document).off("click", ".category-dropdown-btn, .service-dropdown-btn, .bed-room-dropdown-btn")
           .on("click", ".category-dropdown-btn, .service-dropdown-btn, .bed-room-dropdown-btn", function (e) {
    e.stopPropagation();
    e.preventDefault();
    
    // Target the specific menu sibling under this dropdown button container
    const $currentMenu = $(this).next(".dropdown-menu");
    
    // Force populate data items array if cloner didn't catch it
    if ($currentMenu.hasClass("category-options") && $currentMenu.children().length === 0) {
        if (window.HOSPITAL_CATEGORIES && HOSPITAL_CATEGORIES.length) {
            const listItems = HOSPITAL_CATEGORIES.map(cat => `
                <li class="dropdown-item px-3 py-2 cursor-pointer hover:bg-premium-light-blue" data-id="${cat.id}">
                    ${cat.name}
                </li>
            `).join("");
            $currentMenu.html(listItems);
        }
    }

    // Automatically dismiss any other open dropdowns on screen
    $(".dropdown-menu").not($currentMenu).addClass("hidden").css("display", "none");
    
    // Toggle the targeted card dropdown visibility status safely
    if ($currentMenu.hasClass("hidden")) {
        $currentMenu.removeClass("hidden").css({
            "display": "block",
            "visibility": "visible",
            "opacity": "1"
        });
    } else {
        $currentMenu.addClass("hidden").css("display", "none");
    }
});

// =========================================================================
// --- SELECTION HANDLERS: ASSIGN VALUES WHEN AN OPTION IS CLICKED ---
// =========================================================================

// Handle Category Option Selection
$(document).on("click", ".category-options .dropdown-item", function (e) {
    e.stopPropagation();
    const $item = $(this);
    const $card = $item.closest(".service-card");
    
    $card.find(".category-id").val($item.data("id"));
    $card.find(".category-dropdown-btn .selected-text").text($item.text().trim());
    
    // Reset service sub-selections to force user re-validation
    $card.find(".service-id").val("");
    $card.find(".service-dropdown-btn .selected-text").text("Select Service");
    
    // Hide the menu wrapper
    $item.closest(".dropdown-menu").addClass("hidden").css("display", "none");
});

// Global Click Dismiss: Hide menus if a user clicks anywhere else on the screen
$(document).on("click", function (e) {
    if (!$(e.target).closest(".dropdown-trigger, .more-dropdown, .more-btn").length) {
        $(".dropdown-menu").addClass("hidden").css("display", "none");
        $(".more-dropdown").addClass("hidden");
    }
});
// $(document).on("click", ".home-add-service", function () {
//     $(".home-section").addClass("hidden");
//     $(".services-section").removeClass("hidden");
//     showStep(1);
// });
// $(document).on("click", ".home-add-service", function () {

//     console.log("PLUS BUTTON CLICKED");

//     $(".home-section").addClass("hidden");
//     $(".services-section").removeClass("hidden");

//     showStep(1);
// });
$(document).on("click", ".home-add-service", function () {

    $(".home-section").addClass("hidden");

    $(".services-section").removeClass("hidden");

    showStep(1);
});


$(document).on("click", "#cancel-steps", function () {
    $(".services-section").addClass("hidden");
    $(".home-section").removeClass("hidden");
});

$(document).on("click", ".step-btn[data-target]", function () {
    const target = Number($(this).data("target"));
    if (target === 2) {
        const services = collectServices();
        if (!services.length) {
            alert("Please add at least one complete service.");
            return;
        }
    }
    if (target === 3) {
        renderSummary();
    }
    showStep(target);
});


$(document).on("click", ".add-service-bed", function () {
    console.log("ADD ROOM CLICKED");
    const template = document.getElementById("bed-room-card-template");
    const $card = $(template.content.firstElementChild.cloneNode(true));
    resetRoomCard($card);
    $(".bed-services-list").append($card);
    console.log("APPENDED");
});

// --- FIXED REMOVE SERVICE HANDLER ---
$(document).on("click", ".remove-service", function () {
    // Let the card remove itself completely from the DOM, even if it's the last one
    $(this).closest(".service-card").remove();
});

// --- FIXED REMOVE ROOM HANDLER ---
$(document).on("click", ".remove-service-bed", function () {
    // Let the room remove itself completely from the DOM, even if it's the last one
    $(this).closest(".bed-service-card").remove();
});

// --- GUARANTEED ADD SERVICE TEMPLATE CLONER ---
// Added .off("click") to explicitly prevent any double-binding behavior
$(document).off("click", ".add-service").on("click", ".add-service", function (e) {
    e.preventDefault();
    const template = document.getElementById("service-card-template");
    
    if (!template) {
        console.error("service-card-template not found in DOM");
        return; 
    } // Fixed the syntax error here!

    // Clone cleanly from the global abstract <template> fragment blueprint
    const clone = template.content.cloneNode(true);
    
    // Convert fragment to a jQuery selector instance to reset its input bindings cleanly
    const $card = $(clone.firstElementChild || clone.querySelector(".service-card"));
    resetServiceCard($card);
    
    $(".services-list").append($card);
});

$(document).on("click", ".category-options .dropdown-item", function () {
    const $item = $(this);
    const $card = $item.closest(".service-card");
    $card.find(".category-id").val($item.data("id"));
    $card.find(".category-dropdown-btn .selected-text").text($item.text().trim());
    $card.find(".service-id").val("");
    $card.find(".service-dropdown-btn .selected-text").text("Select Service");
    $item.closest(".dropdown-menu").addClass("hidden");
});

$(document).on("click", ".service-options .dropdown-item", function () {
    const $item = $(this);
    const $card = $item.closest(".service-card");
    $card.find(".service-id").val($item.data("id"));
    $card.find(".service-dropdown-btn .selected-text").text($item.text().trim());
    $item.closest(".dropdown-menu").addClass("hidden");
});

$(document).on("click", ".room-options .dropdown-item", function () {
    const $item = $(this);
    const $card = $item.closest(".bed-service-card");
    $card.find(".bed-room-id").val($item.data("id"));
    $card.find(".bed-room-dropdown-btn .selected-text").text($item.text().trim());
    $item.closest(".dropdown-menu").addClass("hidden");
});

$(document).on("click", ".more-btn", function (e) {
    e.stopPropagation();
    const $dropdown = $(this).siblings(".more-dropdown");
    $(".more-dropdown").not($dropdown).addClass("hidden");
    $dropdown.toggleClass("hidden");
});

$(document).on("click", ".save-services-btn", function () {
    console.log("SAVE BUTTON CLICKED");
    const services = collectServices();
    const rooms = collectRooms();

    if (!services.length && !rooms.length) {
        alert("Please add at least one service or room.");
        return;
    }

    const $btn = $(this);
    $btn.prop("disabled", true);
    $btn.text("Saving...");

    fetch("/services/hospital/services/save/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ services, rooms })
    })
    .then((response) => {
        if (!response.ok) throw new Error("Failed to save hospital services");
        return response.json();
    })
    .then((data) => {
        if (!data.success) throw new Error(data.error || "Unable to save hospital services");
        showToast("Services saved successfully");
        setTimeout(() => { window.location.reload(); }, 1500);
    })
    .catch((error) => {
        console.error(error);
        alert(error.message);
        $btn.prop("disabled", false);
        $btn.text("Save");
    });
});

$(document).on("click", ".delete-hospital-service", function () {
    const $btn = $(this);
    const rateId = $btn.data("rate-id");

    fetch(`/services/hospital/services/${rateId}/delete/`, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        }
    })
    .then(async response => {
       const text = await response.text();
       try {
          return JSON.parse(text);
       } catch (e) {
           throw new Error("Server returned HTML instead of JSON");
       }
   })
    .then(data => {
        if (data.success) {
            showToast("Service deleted successfully");
            $btn.closest(".service-card").remove();
        } else {
            alert(data.error || "Delete failed");
        }
    })
    .catch(error => {
        alert(error.message);
    });
});

$(document).on("click", ".delete-hospital-room", function () {
    const rateId = $(this).data("rate-id");
    fetch(`/services/hospital/rooms/${rateId}/delete/`, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        }
    })
    .then((response) => response.json())
    .then((data) => {
        if (!data.success) throw new Error(data.error || "Unable to delete room");
    })
    .catch((error) => alert(error.message));
});

$(document).on("click", ".close-icon", function () {
    $(".add-service").addClass("hidden").removeClass("flex");
});

function showToast(message) {
    const toast = document.createElement("div");
    toast.innerHTML = message;
    toast.className = "fixed top-5 right-5 bg-green-500 text-white px-5 py-3 rounded-lg z-[99999]";
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2000);
}
// Cleaned up extra brackets! Now scripts below compile and run flawlessly.