const colorHexMap = {
  "living-coral": "#FF6F61",
  "dark-blue": "#123456",
  "violet-sky": "#6B79F5",
  "light-sea-green": "#3AAFA9",
  "dodger-blue": "#007BFF",
  "light-dodger-blue": "#EEF6FF",
//   "dodger-blue": "#1A7A5E",
  "light-dodger-blue": "#DDEBE7",
};

let selectedColor = colorHexMap[window.colorData.primary_bg];
let bgColor = colorHexMap[window.colorData.text];

/******Initializes map, geolocation, icons, and utility functions for fetching and displaying healthcare amenities.******/

// Declare global variables for map, location coordinates, markers, and places
let map;
let currentLat, currentLon;
let savedPlaces = [];
let searchHistory = [];
let activeMarkers = [];
let allFetchedPlaces = [];
let routeLines = [];
let lastLat, lastLon, lastPlace;
let routingControl;
let searchAbortController;
let debounceTimer;
let currentMode = "auto";
let geoWatchId = null;

const locationDiv = document.getElementById("user-location");

const profileCity = locationDiv?.dataset.city || "";
const profileState = locationDiv?.dataset.state || "";
const profileAddress = locationDiv?.dataset.address || "";
const profilePincode = locationDiv?.dataset.pincode || "";


// Define tags to query different types of healthcare amenities
const amenityTags = {
    hospital: 'hospital',
    doctor: 'doctors',
    pharmacy: 'pharmacy',
    // lab: 'laboratory'
    lab: 'laboratory|clinic|diagnostic'
};

// Define custom Leaflet icons for different amenity types
const icons = {
hospital: L.icon({
    iconUrl: '/static/images/hospital-marker.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
}),
doctor: L.icon({
    iconUrl: '/static/images/doctor-marker.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
}),
pharmacy: L.icon({
    iconUrl: '/static/images/pharmacy-marker.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
}),
lab: L.icon({
    iconUrl: '/static/images/lab-marker.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
})
};

$(document).ready(function () {
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        showLocation, showError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 20000,
        });
} else {
    toastr.error('Geolocation not supported by your browser.');
}

// tile_url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
tile_url = "http://192.168.1.107:3090/styles/light-mode-nopoi/256/{z}/{x}/{y}.png"

// Initialize map with user's location
function showLocation(position) {
    currentLat = position.coords.latitude;
    currentLon = position.coords.longitude;
    let accuracy = position.coords.accuracy || 5000;

    map = L.map("map").setView([currentLat, currentLon], 15);
    L.tileLayer(tile_url, {
        crossOrigin: true,
        maxZoom: 19,
        minZoom: 7,
    }).addTo(map);

    // Draw a circle around the current location to show accuracy
    if (accuracy < 5000) {
        localStorage.setItem("best_location", JSON.stringify({
            lat: currentLat,
            lon: currentLon,
            accuracy: accuracy,
            timestamp: Date.now()
        }));
        L.circle([currentLat, currentLon], {
            radius: accuracy,
            color: '#6B79F5',
            fillColor: '#6B79F5',
            fillOpacity: 0.15,
            weight: 1
        }).addTo(map);
    }

    // If accuracy is poor, use warning marker + reverse geocode
    if (accuracy > 5000) {
        toastr.info("Your location may be inaccurate. Falling back to default location.");
        const cached = JSON.parse(localStorage.getItem("best_location") || "null");

        if (cached && cached.lat && cached.lon) {
            console.log("Using fallback from localStorage:", cached);
            currentLat = cached.lat;
            currentLon = cached.lon;

            L.marker([currentLat, currentLon])
            .addTo(map)
            .bindPopup(`<strong>Cached Location Used</strong><br>
                        May not be accurate.<br>`)
            .openPopup();
        }
        else {
            fetch("reverse_geocode/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            body: JSON.stringify({ 
                lat: currentLat,
                lng: currentLon,
                profile_city: profileCity,
                profile_state: profileState,
                profile_address: profileAddress,
                profile_pincode: profilePincode})
            })
            .then(res => res.json())
            .then(data => {
            const currentLat = data.latitude;
            const currentLon = data.longitude;
            console.log("Current Lat:", currentLat, "Current Lon:", currentLon);
            const locationName = data.name || `${profileCity}, ${profileState}`;
            L.marker([currentLat, currentLon])
            .addTo(map)
            .bindPopup(`
                <strong>You Location</strong><br>
                ${locationName}<br>
                <span class="text-xs text-red-500">Results may not be accurate</span>
            `)
            .openPopup();
            })
            .catch(err => {
                toastr.error("Could not determine location.");
                console.error("Reverse geocode fail:", err);
            });
        }
    } else {
        // Good accuracy, show regular marker
        console.log("Current Lat:", currentLat, "Current Lon:", currentLon);
        L.marker([currentLat, currentLon])
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();
    }
    console.log("Map initialized at:", currentLat, currentLon);
}

function showError(error) {
    toastr.error("Error getting location: " + error.message);
}

function clearMarkers() {
    activeMarkers.forEach(marker => map.removeLayer(marker));
    activeMarkers = [];
}

// Returns the value of a cookie by name, or null if not found
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
            }
        }
    }
    return cookieValue;
}

    // Toggles map and list views with fade animation.
    $(".map-view").fadeIn(300);
    $(".listview").hide();
    
    $('.view-toggle').change(function () {
        const isChecked = $(this).is(":checked");
        $('.view-toggle').prop('checked', isChecked);

        if (isChecked) {
        $(".listview").fadeOut(200, function () {
            $(".map-view").fadeIn(300);
        });
        } else {
        $(".map-view").fadeOut(200, function () {
            $(".listview").fadeIn(300);
        });
        }
    });


    /****** Handles fetching, displaying, and paginating nearby places by type in either map or list view  ******/

    // Fetch and display nearby places by type on map or list view.
function fetchPlaces(type, buttonElement, mode = "map") {
    $(".map-search-btn, .list-search-btn").removeClass(function(index, className) {
    return (className.match(/(^|\s)bg-\S+/g) || []).join(' ');
    });
    $(".map-search-btn, .list-search-btn").removeAttr("style");
    $(buttonElement).css('background-color', bgColor);
    $(buttonElement).css('color', 'white');

    if (!currentLat || !currentLon) {
    toastr.error("Location not yet available");
    return;
    }

    clearMarkers();
    allFetchedPlaces = [];

    fetch("get_places/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
            lat: currentLat,
            lng: currentLon,
            type: type,
            range: 15000  // you can increase to 5000 if needed
        }),
    })
    .then((res) => res.json())
    .then((data) => {
        $(".cards, #pagination").removeClass('hidden');
        if (data?.amenities?.length > 0) {
        data.amenities.forEach((place) => {
            const lat = place.latitude;
            const lon = place.longitude;
            
            const formattedPlace = {
                mongo_id: place.mongo_id,
                title: place.title,
                type: type,
                lat: place.latitude,
                lon: place.longitude,
                address: place.address,
                phone: place.phone_number,
                rating: place.rating || 0,
                reviews: place.reviews || 0,
                website: place.website,
                tags: place.tags || {}
            };

            allFetchedPlaces.push(formattedPlace);

            if (mode === "map" && typeof lat === "number" && typeof lon === "number") {
                const marker = L.marker([lat, lon], {
                    icon: icons[type],
                }).addTo(map).bindPopup(() => {
                    const popupContent = document.createElement('div');
                    popupContent.innerHTML = `
                        <div>
                            <strong>${place.title}</strong><br>
                            ${place.address ? place.address + "<br>" : ""}
                            Phone: ${place.phone_number || ""}<br>
                            <button class="show-details-btn mt-2 text-sm text-white px-2 py-1 bg-${selectedColor} rounded" data-id="${place.mongo_id}">
                                Show Details
                            </button>
                        </div>
                    `;
                    // Defer adding click listener after popup renders
                    setTimeout(() => {
                        popupContent.querySelector(".show-details-btn").addEventListener("click", function (e) {
                            e.stopPropagation();
                            showOverview(place);
                        });
                    }, 10);

                    return popupContent;
                });
            activeMarkers.push(marker);
            }
        });

        if (mode === "list") {
                    renderListView(allFetchedPlaces);
                }
        } else {
        const typeLabels = {
            hospital: "hospitals",
            doctor: "doctors",
            pharmacy: "pharmacies",
            lab: "labs"
        };
        // toastr.error(`No ${type}s found nearby.`);
        toastr.error(`No ${typeLabels[type]} found nearby.`);
        }
    })
    .catch((err) => {
        console.error("Fetch error:", err);
        toastr.error(`Failed to load nearby ${type}s.`);
        $(".cards, #pagination").addClass('hidden');
        $(".placeholder").removeClass('hidden').text(`No ${type}s found nearby.`);
    });
}

// Handles pagination logic and UI for displaying a limited number of place cards per page
function setupPagination() {
    const cardsPerPage = 6;
    const cards = $(".places-card");
    const totalCards = cards.length;
    const totalPages = Math.ceil(totalCards / cardsPerPage);
    let currentPage = 1;

    if (totalPages <= 1) {
        $("#pagination").html(""); // clear pagination
        cards.show(); // show all cards
        return;
    }

    function renderPagination() {
        let paginationHTML = `
        <div class="flex items-center gap-4">
            <p class="bg-white px-3 py-1 rounded text-light-gray1 text-sm cursor-pointer" id="prev">Previous</p>
    `;
        
        paginationHTML += pageButton(1);

        if (currentPage <= 3) {
            for (let i = 2; i <= Math.min(4, totalPages - 1); i++) {
                paginationHTML += pageButton(i);
            }
            if (totalPages > 5) {
                paginationHTML += `<span>...</span>`;
                paginationHTML += pageButton(totalPages);
            }
        } 
        else if (currentPage > 3 && currentPage < totalPages - 2) {
            paginationHTML += `<span>...</span>`;
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                paginationHTML += pageButton(i);
            }
            paginationHTML += `<span>...</span>`;
            paginationHTML += pageButton(totalPages);
        }
        else {
            paginationHTML += `<span>...</span>`;
            for (let i = totalPages - 3; i < totalPages; i++) {
                paginationHTML += pageButton(i);
            }
            paginationHTML += pageButton(totalPages);
        }

        paginationHTML += `<p class="bg-white px-3 py-1 rounded text-light-gray1 text-sm cursor-pointer" id="next">Next</p></div>`;
        $("#pagination").html(paginationHTML);

        $(`#pagination button[data-page='${currentPage}']`)
            .addClass("font-semibold")
            .css({ "background-color": bgColor, "color": "white" });
    }

    function pageButton(page) {
        return `<button 
            data-page="${page}" 
            class="px-3 py-1.5 rounded-lg text-sm bg-pagination text-jet-black"
        >${page}</button>`;
    }

    function showPage(page) {
        cards.hide();
        const start = (page - 1) * cardsPerPage;
        const end = start + cardsPerPage;
        cards.slice(start, end).show();
        renderPagination();
    }

    // Events
    $("#pagination").on("click", "button", function () {
        currentPage = $(this).data("page");
        showPage(currentPage);
    });

    $("#pagination").on("click", "#prev", function () {
        if (currentPage > 1) {
            currentPage--;
            showPage(currentPage);
        }
    });

    $("#pagination").on("click", "#next", function () {
        if (currentPage < totalPages) {
            currentPage++;
            showPage(currentPage);
        }
    });

    showPage(currentPage);
}

    // Generate star rating HTML with half stars and review count
function generateStars(rating, reviews) {
    rating = parseFloat(rating);
    if (isNaN(rating)) {
        $('#rating-stars').html('<span class="text-red-500">Invalid rating</span>');
        return;
    }

    const fullStar = '<span class="material-symbols-outlined material-filled text-star-yellow">star</span>';
    const halfStar = '<span class="material-symbols-outlined material-filled text-star-yellow">star_half</span>';
    const emptyStar = '<span class="material-symbols-outlined text-star-yellow">star</span>';

    let html = `${rating.toFixed(1)} `;

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    html += fullStar.repeat(fullStars);
    if (hasHalfStar) html += halfStar;
    html += emptyStar.repeat(emptyStars);

    html += ` <span class="text-dark-gray text-14-nr">(${reviews})</span>`;
    return html;
}

    let bookmarkedPlaceIds = new Set();
    // Renders a list of place cards dynamically into the view with relevant info and actions
    function renderListView(places) {
        const listContainer = $(".cards");
        listContainer.empty();
        $("#pagination").removeClass('hidden');

        places.forEach(place => {
            const isBookmarked = bookmarkedPlaceIds.has(place.mongo_id);
            const card = `
                <div class="places-card">
                    <div>
                        <img class="rounded-t-[10px]" src="/static/images/Hospital.svg" alt="${place.title}" loading="lazy" />
                    </div>
                    <div class="px-4 py-5 space-y-3">
                        <div class="flex items-center justify-between">
                            <h1 class="text-24-fs truncate">${place.title}</h1>
                            <span class="material-symbols-outlined bookmark-fill cursor-pointer ${isBookmarked ? 'material-filled text-' + selectedColor : ''}" data-id="${place.mongo_id}" data-type="${place.type}">
                                bookmark
                            </span>
                        </div>
                        <p class="flex items-center gap-1 text-dark-gray text-14-nr">
                            ${generateStars(place.rating, place.reviews)}
                        </p>
                        <p class="text-dark-gray text-16-nr">${place.type}</p>
                        <div class="flex flex-col gap-1">
                            <p class="text-medium-gray text-16-nr line-clamp-2" style="display: -webkit-box;-webkit-line-clamp: 2;-webkit-box-orient: vertical;overflow: hidden;">${place.address || "No address provided"}</p>
                            <p class="text-medium-gray text-16-nr">${place.phone || "No phone"}</p>
                        </div>
                        <div class="flex items-center justify-around gap-5">
                            <button class="flex flex-col items-center text-dark-gray text-16-nr">
                                <span class="material-symbols-outlined material-filled">directions</span>
                                Direction
                            </button>
                            <button class="flex flex-col items-center text-dark-gray text-16-nr" onclick="window.location.href='tel:${place.phone}'">
                                <span class="material-symbols-outlined material-filled">call</span>
                                Call
                            </button>
                            <button class="flex flex-col items-center text-dark-gray text-16-nr">
                                <span class="material-symbols-outlined material-filled">share</span>
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            `;
            listContainer.append(card);
        });

        $('.placeholder').addClass('hidden');
        $('.cards').removeClass('hidden');

        setupPagination();
        
    }

    // Attach click handlers to map buttons to fetch and display places by category.
    $(".map-search-btn:contains('Hospital')").on("click", function () {
        fetchPlaces("hospital", this, "map");
    });
    $(".map-search-btn:contains('Doctor')").on("click", function () {
        fetchPlaces("doctor", this, "map");
    });
    $(".map-search-btn:contains('Pharmacy')").on("click", function () {
        fetchPlaces("pharmacy", this, "map");
    });
    $(".map-search-btn:contains('Lab')").on("click", function () {
        fetchPlaces("lab", this, "map");
    });

    // Handles filtering of places by type on button click and updates the UI accordingly
    $('.cards').addClass('hidden');
    $('.list-search-btn').on('click', function () {
        $(".list-search-btn").removeClass(function(index, className) {
        return (className.match(/(^|\s)bg-\S+/g) || []).join(' ');
        });
        $(".list-search-btn, .list-saved-btn").removeAttr("style");
        $(this).css('background-color', bgColor);
        $(this).css('color', 'white');
        $('.placeholder').addClass('hidden');
        const type = $(this).data('type');
        fetchPlaces(type, this, "list");   
    });

    // Highlight clicked saved list button and reset styles on other buttons.
    $('.list-saved-btn').on('click', function () {
        $(".list-search-btn, .list-saved-btn").removeAttr("style");
        $(this).css('background-color', bgColor);
        $(this).css('color', 'white');
    });

    /****** Handles the full map interaction: searching places, showing suggestions and overviews, displaying route directions with step details, switching transport modes, and filtering results using dropdowns.********/

    // Handles rendering and displaying place suggestions in the search dropdown.
    const $searchBox = $(".map-view input[type='text']");
    const $suggestionBox = $("<div class='mt-14 overflow-y-auto scroll' style='max-height:73vh;'></div>").hide();
    $(".suggestion").append($suggestionBox);

    function renderSuggestions(places) {
        $suggestionBox.empty();
        places.forEach(place => {
            const $item = createPlaceItem(place);
            $suggestionBox.append($item);
        });
        $suggestionBox.show();
    }

// Renders step-by-step route instructions with time and distance in a styled layout.
    function renderSteps(steps) {
        const container = document.querySelector(".route-steps");
        if (!container) {
            console.warn("renderSteps: .route-steps not found in DOM.");
            return;
        }

        const html = steps.map(s => `
            <div class="flex items-start justify-between gap-2">
                <div class="border-l-2 pl-1 border-${selectedColor}">
                    <span class="material-symbols-outlined text-${selectedColor}">two_wheeler</span>
                </div>
                <div class="flex flex-col">
                    <span class="font-medium text-sm">${s.instruction}</span>
                    <div class="text-xs">Fastest route. The usual traffic</div>
                </div>
                <div class="flex flex-col text-right">
                    <span class="text-${selectedColor} font-semibold text-nowrap">${Math.ceil(s.time / 60)} min</span>
                    <div class="text-xs text-nowrap">${s.length.toFixed(1)} km</div>
                </div>
            </div>
        `).join("");

        container.innerHTML = html;
    }

    // Returns dynamic CSS classes for transport mode buttons based on the current selection.
    let currentMode = "auto";
    function getModeButtonClass(mode) {
        return `tab-button mode-btn cursor-pointer text-sm px-4 py-2 focus:outline-none hover:text-${selectedColor} flex flex-col ${currentMode === mode ? `active text-${selectedColor}` : ''}`;
    }

    // Fetches and shows routes with mode toggle and interactive map directions.
    function showDirections(lat, lon, place = null) {
    fetch("search_history/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ mongo_id: place.mongo_id, type: place.type })
    })
    .catch(err => {
            console.error("Searching History error:", err);
            toastr.error(err.message || "Searching History failed.");
        });

    lastLat = lat; lastLon = lon; lastPlace = place;

    // Clear old routes
    if (window.routeLines && window.routeLines.length) {
        window.routeLines.forEach(l => map.removeLayer(l));
    }
    window.routeLines = [];

        const startLat = currentLat;
        const startLng = currentLon;
        console.log("Fetching routes from:", startLat, startLng, "to:", lat, lon);

        const payload = {
        start_lat: startLat,
        start_lng: startLng,
        end_lat: lat,
        end_lng: lon,
        mode: currentMode,
        alternatives: { target_count: 3 }
        };

        fetch("get_routes/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if (!res.ok) throw new Error("Server returned error status: " + res.status);
            return res.json();
        })
        .then(data => {
            const routes = data.routes;
            if (!routes.length) {
                toastr.info("No routes found.");
                return;
            }
            console.log("Routes fetched:", routes);

            routes.forEach((r, idx) => {
                const coords = r.coordinates.map(c => [c[0], c[1]]);
                    const line = L.polyline(coords, {
                        color: idx === 0 ? bgColor : "#aaa",
                        weight: idx === 0 ? 6 : 4,
                        opacity: idx === 0 ? 0.8 : 0.4
                    }).addTo(map);
                    window.routeLines.push(line);
                });

            map.fitBounds(window.routeLines[0].getBounds());

            // Remove old destination marker if exists
            if (window.destinationMarker) {
                map.removeLayer(window.destinationMarker);
            }

            // Add default Leaflet destination marker
            window.destinationMarker = L.marker([lat, lon]).addTo(map);

            const isBookmarked = bookmarkedPlaceIds.has(place.mongo_id);
            // Directions HTML
            const directionsHtml = `
                <div class="px-4 py-3 suggestion-detail">
                <div class="h-32 w-full bg-cover bg-center"
                    style="background-image: url('${place?.imageUrl || "/static/images/hospital.svg"}')"></div>
                <div class="flex flex-col gap-2 mt-2">
                    <div class="flex justify-between">
                    <p class="text-xl font-bold">${place?.title}</p>
                    <span class="material-symbols-outlined bookmark-fill cursor-pointer ${isBookmarked ? 'material-filled text-' + selectedColor : ''}"
                        data-id="${place?.mongo_id}" data-type="${place?.type?.toLowerCase()}">
                        ${place?.isBookmarked ? "bookmark" : "bookmark_add"}
                    </span>
                    </div>
                    <p class="text-sm">${place?.address || ""}</p>
                    <p class="text-sm">${place?.phone || ""}</p>
                    <p class="flex gap-2 items-center">
                        <span class="text-xl text-star-orange">
                            ${'★'.repeat(Math.floor(place?.rating || 0))}${'☆'.repeat(5 - Math.floor(place?.rating || 0))}
                        </span>
                        <span class="text-sm">(${place?.rating?.toFixed(1) || "0.0"}) • ${place?.reviews || 0} reviews</span>
                    </p>
                </div>

                <!-- Tabs -->
                    <div class="flex my-5 justify-between">
                        <button class="${getModeButtonClass('auto')}" data-tab="car" data-mode="auto">
                            <span class="material-symbols-outlined !font-semibold">directions_car</span>Car
                        </button>
                        <button class="${getModeButtonClass('bicycle')}" data-tab="bike" data-mode="bicycle">
                            <span class="material-symbols-outlined !font-semibold">two_wheeler</span>Bike
                        </button>
                        <button class="${getModeButtonClass('pedestrian')}" data-tab="walk" data-mode="pedestrian">
                            <span class="material-symbols-outlined !font-semibold">directions_walk</span>Walking
                        </button>
                    </div>

                <!-- Tab content -->
                <div class="tab-content" id="best">
                    <div class="flex items-center justify-between">
                        <div class="flex flex-col items-center justify-center">
                        <div class="w-4 h-4 rounded-full border-4"></div>
                        <hr class="h-6 border border-dashed w-0"/>
                        <span class="material-symbols-outlined text-${selectedColor}">location_on</span>
                        </div>
                        <div class="flex flex-col items-center gap-3">
                        <input type="text" placeholder="Your Location" class="${selectedColor === 'dark-blue' ? 'text-white placeholder:text-white' : ''} backdrop-blur-[20px] shadow-[4px_4px_10px_2px_#00000026] text-sm px-3 py-1.5 rounded-md w-full border-none focus:outline-none focus:ring-0" style="background-color: ${bgColor}A6;"/>
                        <input type="text" placeholder="Zenith Hospital" class="${selectedColor === 'dark-blue' ? 'text-white placeholder:text-white' : ''} backdrop-blur-[20px] shadow-[4px_4px_10px_2px_#00000026] text-sm px-3 py-1.5 rounded-md w-full border-none focus:outline-none focus:ring-0" style="background-color: ${bgColor}A6;" />
                        </div>
                        <span class="material-symbols-outlined">swap_vert</span>
                    </div>

                    <div class="flex gap-2 items-center justify-center py-5">
                        <span class="material-symbols-outlined !text-lg">share</span>Share directions
                    </div>

                    <div class="flex flex-col gap-4 route-steps">
                                ${routes.map(r => `
                                    <div class="flex items-start justify-between">
                                        <span class="material-symbols-outlined pl-1">two_wheeler</span>
                                        <div class="flex flex-col">
                                            <span class="font-medium">Via String Rd</span>
                                            <div class="text-xs">Fastest route. the usual traffic</div>
                                        </div>
                                        <div class="flex flex-col">
                                            <span class="text-${selectedColor} font-semibold">${Math.ceil(r.duration/60)} min</span>
                                            <div class="text-xs text-light-gray">${(r.distance).toFixed(1)} km</div>
                                        </div>
                                    </div>
                                `).join('')}
                    </div>

                    <p class="text-center text-sm py-4">
                        Congratulation! You will earn <span class="text-${selectedColor} font-bold">2.8</span> Credit points on the ride completion.
                    </p>
                    <button class="w-full py-2 rounded-md bg-[#d9d9d9] text-[#a1a1a1] text-sm font-medium cursor-not-allowed">
                        Start
                    </button>
                    </div>
                </div>
            `;
            
            // Update DOM and THEN call renderSteps
            $suggestionBox.fadeOut(100, () => {
                $suggestionBox.html(directionsHtml).fadeIn(150, () => {
                        renderSteps(routes[0].steps);
                    });
            });

            // Set route option buttons
                const altHtml = routes.map((r, i) => `
                    <div class="route-option ${i === 0 ? 'selected' : ''}" data-idx="${i}">
                        <span>${(r.distance).toFixed(1)} km</span>
                        <span>${Math.ceil(r.duration/60)} min</span>
                    </div>
                `).join("");
            $(".route-options").html(altHtml);

            // On route option click
            $(document).on("click", ".route-option", function() {
                const i = $(this).data("idx");
                window.routeLines.forEach((ln, j) => {
                        ln.setStyle({ color: j === i ? bgColor : "#aaa", weight: j === i ? 6 : 4, opacity: j === i ? 0.8 : 0.4 });
                        $(".route-option").eq(j).toggleClass("selected", j === i);
                    });
                map.fitBounds(window.routeLines[i].getBounds());
                renderSteps(routes[i].steps);
            });

        })
        .catch(err => {
            console.error("Routing error:", err);
            toastr.error(err.message || "Routing failed.");
        });
    

    }

        $(document).off("click", ".mode-btn").on("click", ".mode-btn", function () {
            currentMode = $(this).data("mode");
            $(".mode-btn").removeClass("active");
            $(this).addClass("active");
            showDirections(lastLat, lastLon, lastPlace);
        });

// Handles search input for places and shows suggestions based on user input
    function createPlaceItem(place) {
        const lat = place.latitude;
        const lon = place.longitude;
        const rating = typeof place.rating === 'number' ? place.rating : parseFloat(place.rating) || 0;
        const reviews = typeof place.reviews === 'number' ? place.reviews : parseInt(place.reviews) || 0;
        const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

        const $item = $(`
            <div class="px-4 py-3 border-b border-${selectedColor} last:border-b-0 cursor-pointer transition-all hover:bg-opacity-10">
                <div class="flex flex-col gap-2">
                <p class="text-lg font-semibold">${place.title}</p>
                <p class="flex gap-2 items-center">
                    <span class="text-xl text-star-orange">${stars}</span>
                    <span class="text-sm">(${rating.toFixed(1)}) • ${reviews} reviews</span>
                </p>
                <p>${place.type}</p>
                <p class="text-sm">${place.address}</p>
                <p class="text-sm">${place.phone_number}</p>
                <p class="text-sm">${place.email}</p>
                </div>
                <div class="ml-4 flex justify-between mt-2">
                <button class="flex flex-col gap-2 text-xs cursor-pointer" data-lat="${lat}" data-lon="${lon}">
                    <span class='material-symbols-outlined material-filled !text-xl !font-semibold'>directions</span><span>Directions</span>
                </button>
                <a href="tel:${place.phone_number}" title="Call" class="flex flex-col gap-2 text-xs cursor-pointer">
                    <span class='material-symbols-outlined material-filled !text-xl !font-semibold'>call</span><span>Call</span>
                    </a>
                <button class="flex flex-col gap-2 text-xs cursor-pointer" data-name="${encodeURIComponent(place.title)}">
                    <span class='material-symbols-outlined material-filled !text-xl !font-semibold'>share</span><span>Share</span>
                </button>
                </div>
            </div>
        `);

        $item.find("button:contains('Directions')").on("click", function (e) {
            e.stopPropagation();
            showDirections(lat, lon, place);
            });

            $item.on("click", function () {
                showOverview(place);
        });

        return $item;
    }

    // Displays detailed place overview with tabs and map focus.
    function showOverview(place) {
        const lat = place.latitude;
        const lon = place.longitude;
        const name = place.title || place.name;
        const rating = typeof place.rating === 'number' ? place.rating : parseFloat(place.rating) || 0;
        const reviews = typeof place.reviews === 'number' ? place.reviews : parseInt(place.reviews) || 0;
        const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
        const isBookmarked = bookmarkedPlaceIds.has(place.mongo_id);

            const overviewHtml = `
                <div class="px-4 py-3 suggestion-detail">
                <div class="h-32 w-full bg-cover bg-center" style="background-image: url('${place.imageUrl || "/static/images/hospital.svg"}')"></div>
                <div class="flex flex-col gap-2 mt-2">
                    <div class="flex justify-between">
                    <p class="text-xl font-bold">${place.title}</p>
                    <span class="material-symbols-outlined bookmark-fill cursor-pointer ${isBookmarked ? 'material-filled text-' + selectedColor : ''}" data-id="${place.mongo_id}" data-type="${place.type}">bookmark</span>
                    </div>
                    ${place.address ? `<p class="text-sm">${place.address}</p>` : ""}
                    ${place.phone_number ? `<p class="text-sm">${place.phone_number}</p>` : ""}
                    <p class="flex gap-2 items-center">
                        <span class="text-xl text-star-orange">${stars}</span>
                        <span class="text-sm">(${rating.toFixed(1)}) • ${reviews} reviews</span>
                    </p>
                </div>
                <!-- Tabs -->
                <div class="flex mb-3">
                    <button class="tab-button cursor-pointer text-sm px-4 py-2 focus:outline-none border-b-2 border-transparent hover:!border-${selectedColor}" style="border-color: ${bgColor}; color: ${bgColor};" data-tab="overview">Overview</button>
                    <button class="tab-button cursor-pointer text-sm px-4 py-2 focus:outline-none border-b-2 border-transparent hover:!border-${selectedColor}" data-tab="timings">Timings</button>
                </div>
                <div class="tab-content" id="overview">
                    <div class="ml-4 flex justify-between mt-2">
                    <button class="flex flex-col gap-2 text-xs cursor-pointer overviewDirections" data-lat="${lat}" data-lon="${lon}">
                            <span class='material-symbols-outlined material-filled !text-xl !font-semibold'>directions</span><span>Directions</span>
                    </button>
                    <a href="tel:${place.phone_number}" title="Call" class="flex flex-col gap-2 text-xs cursor-pointer">
                        <span class='material-symbols-outlined material-filled !text-xl !font-semibold'>call</span><span>Call</span></a>
                    <button class="flex flex-col gap-2 text-xs cursor-pointer" data-name="${encodeURIComponent(place.title)}">
                        <span class='material-symbols-outlined material-filled !text-xl !font-semibold'>share</span><span>Share</span>
                    </button>
                    </div>
                    <div class="flex flex-col gap-2 text-sm mt-4">
                    <p class="flex gap-2"><span class="material-symbols-outlined text-${selectedColor}">location_on</span>${place.address || "N/A"}</p>
                        <p class="flex gap-2"><span class="material-symbols-outlined text-${selectedColor}">call</span>${place.phone_number || "N/A"}</p>
                        <p class="flex gap-2"><span class="material-symbols-outlined text-${selectedColor}">mail</span>${place.email || "N/A"}</p>
                        <p class="text-base font-semibold">Services</p>
                        ${(place.services || ['Ambulance Service', 'General']).map(service => `<p>${service}</p>`).join('')}
                    </div>
                </div>
                <div class="tab-content hidden" id="timings">
                    <p class="font-semibold">Open Now</p>
                    <ul class="text-sm flex flex-col gap-2 mt-2">
                        ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                            .map(day => `<li class="flex justify-between">${day} <span>Open 24 hours</span></li>`).join('')}
                    </ul>
                </div>
                </div>
            `;

            $searchBox.val(name);
            $suggestionBox.fadeOut(100, () => {
            $suggestionBox.html(overviewHtml).fadeIn(150);
        });

        map.setView([lat, lon], 17);
        L.popup().setLatLng([lat, lon]).setContent(`<strong>${name}</strong><br>${place.address || ""}`).openOn(map);

        // Tab handler
        $suggestionBox.off('click', '.tab-button').on('click', '.tab-button', function () {
            const tab = $(this).data('tab');
            $suggestionBox.find('.tab-button').removeAttr("style");
                $(this).css({ 'border-color': bgColor, 'color': bgColor });
                $suggestionBox.find('.tab-content').addClass('hidden');
                $suggestionBox.find(`#${tab}`).removeClass('hidden');
            });

            $suggestionBox.off("click", ".overviewDirections").on("click", ".overviewDirections", function (e) {
                e.stopPropagation();
                showDirections(lat, lon, place);
            });

        }

            // Adds a filter dropdown UI with nested sorting and service options and handles their toggling.
    function addFilterDropdown() {
        const dropdownHTML = `
            <div class="flex justify-between p-2 border-b border-${selectedColor}">
                <span class="font-semibold">Suggestions</span>
                <div class="relative">
                    <span class="material-symbols-outlined cursor-pointer filterToggle">swap_vert</span>
                    <div class="filterDropdown absolute right-0 mt-2 w-28 rounded-lg shadow-lg hidden z-50 bg-snow-gray p-2">
                        <!-- Sort By -->
                        <div class="relative">
                            <p class="text-base font-normal cursor-pointer hover:bg-white p-2 filterItem" data-target="#sort">Sort by</p>
                            <div id="sort" class="absolute right-full top-0 mr-2 w-40 rounded-lg shadow-lg bg-white p-2 hidden z-50">
                                <p class="text-sm p-2 cursor-pointer flex items-center gap-2">
                                    <span class="material-symbols-outlined">check</span> Open
                                </p>
                                <p class="text-sm p-2 cursor-pointer flex items-center gap-2">
                                    <span class="material-symbols-outlined">check</span> Closed
                                </p>
                                <p class="text-sm p-2 cursor-pointer flex items-center gap-2">
                                    <span class="material-symbols-outlined">check</span> Directions
                                </p>
                            </div>
                        </div>
                        <!-- Services -->
                        <div class="relative mt-1">
                            <p class="text-base font-normal cursor-pointer hover:bg-white p-2 filterItem" data-target="#service">Services</p>
                            <div id="service" class="absolute right-full top-0 mr-2 w-40 rounded-lg shadow-lg bg-white p-2 hidden z-50">
                                <p class="text-sm p-2 cursor-pointer flex items-center gap-2">
                                    <span class="material-symbols-outlined">check</span> Ambulance
                                </p>
                                <p class="text-sm p-2 cursor-pointer flex items-center gap-2">
                                    <span class="material-symbols-outlined">check</span> Dental
                                </p>
                                <p class="text-sm p-2 cursor-pointer flex items-center gap-2">
                                    <span class="material-symbols-outlined">check</span> Emergency
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $suggestionBox.prepend(dropdownHTML);

        // Toggle dropdown visibility
        $suggestionBox.on('click', '.filterToggle', function () {
            $(this).siblings('.filterDropdown').toggleClass('hidden');
        });

        // Show/hide nested dropdowns
        $suggestionBox.on('click', '.filterItem', function (e) {
            e.stopPropagation();
            const target = $(this).data('target');
            $(target).toggleClass('hidden');
        });

        // Close dropdown on click outside
        $(document).on('click', function (e) {
            if (!$(e.target).closest('.filterDropdown, .filterToggle').length) {
                $('.filterDropdown').addClass('hidden');
                $('#sort, #service').addClass('hidden');
            }
        });
    } 

    // Global variables for map and routing
    const $bookmarkIcon = $(".bookmark-icon");
    const $historyIcon = $(".history-icon");
    const $closeIcon = $(".close-icon");

    // Search input handler: fetch and show suggestions
    $searchBox.on("input", function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = $(this).val().toLowerCase();
            $suggestionBox.empty();

            if (!query) {
                $bookmarkIcon.removeClass("!hidden");
                $historyIcon.removeClass("!hidden");
                $closeIcon.addClass("!hidden");
                $(".map-search").removeAttr("style");
                $(".map-search,.search,.close-icon").removeClass("text-white");
                $(".map-search").removeClass("placeholder:text-white");
                $suggestionBox.hide();
                return;
            }

            // Cancel previous request
            if (searchAbortController) {
                searchAbortController.abort();
            }
            searchAbortController = new AbortController();

            $bookmarkIcon.addClass("!hidden");
            $historyIcon.addClass("!hidden");
            $closeIcon.removeClass("!hidden");
            $(".map-search").addClass("placeholder:text-white");
            $(".map-search,.search,.close-icon").addClass("text-white");
            $(".map-search").css('background-color', bgColor);

            fetch("search/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
                signal: searchAbortController.signal,
                body: JSON.stringify({
                    q: query,
                    lat: currentLat,
                    lng: currentLon
                })
            })
            .then(res => res.json())
            .then(data => {
                $suggestionBox.empty();
                const matches = data.results || [];
                const places = data.places || [];

                if (!matches.length && !places.length) {
                    $suggestionBox.html("<p class='p-2'>No Suggestion Found...</p>").show();
                    return;
                }

                renderSuggestions(matches);
                addFilterDropdown();
            })
            .catch(err => {
                if (err.name === "AbortError") return; // Ignore aborted
                console.error("Search error:", err);
                toastr.error("Failed to fetch search results.");
            });
        }, 300); // adjust debounce delay as needed
    });


    // Clear search input and hide suggestions on close icon click    
    $closeIcon.on("click", function () {
        $searchBox.val("").trigger("input");
        $suggestionBox.hide();
    });

    // Toggle main filter dropdown, hiding others
    $(document).on('click', '.filterToggle', function (e) {
        e.stopPropagation();
        const $dropdown = $(this).siblings('.filterDropdown');
        $('.filterDropdown').not($dropdown).hide();
        $dropdown.toggle();
        $dropdown.find('.absolute').hide(); 
    });

    // Toggle nested filter menus, hiding others
    $(document).on('click', '.filterItem', function (e) {
        e.stopPropagation();
        const target = $($(this).data('target'));
        $('.filterDropdown .absolute').not(target).hide(); 
        target.toggle();
    });

    // Hide suggestion box when clicking outside map view
    $(document).on("click", function (e) {
        if (!$(e.target).closest(".map-view").length) {
            $suggestionBox.hide();
        }
    });

/****** Manage fetching, displaying, and updating saved locations and search history with interactive UI.******/

    // Display filtered place suggestions with remove option and interaction handlers.
function showFilteredSuggestions(title, filterFn) {
    const filteredPlaces = allFetchedPlaces.filter(filterFn);
    $suggestionBox.empty();
        $(".map-search").css('background-color', bgColor);
    $bookmarkIcon.addClass("!hidden");
    $historyIcon.addClass("!hidden");
    $closeIcon.removeClass("!hidden");
    $(".map-search,.search,.close-icon").addClass("text-white");
    $(".map-search").addClass("placeholder:text-white");

    $suggestionBox.append(`
        <div class='flex justify-between p-2 border-b border-${selectedColor}'>
        <span>${title}</span>
        <span class="material-symbols-outlined">swap_vert</span>
        <div class="flex gap-2 items-center">
            See All<span class="material-symbols-outlined">keyboard_arrow_right</span>
        </div>
        </div>
    `);

    filteredPlaces.forEach(place => {
        const avgRating = place.rating;
        const stars = avgRating
        ? '★'.repeat(Math.floor(avgRating)) + '☆'.repeat(5 - Math.floor(avgRating))
        : '★★★☆☆';
        const $item = $(`<div class="px-4 py-3 border-b border-${selectedColor} cursor-pointer transition-all hover:bg-opacity-10">
        <div class="flex flex-col gap-2">
            <p class="text-lg font-semibold">${place.title}</p>
            <p class="flex gap-2 items-center"><span class="text-xl text-star-orange">${stars + ` (${avgRating})`}</span></p>
            <p class="text-sm">${place.address || "Unknown address"}</p>
        </div>
        <span class="material-symbols-outlined text-red-500 cursor-pointer remove-icon" title="Remove">delete</span>
        </div>`);
        $item.on("click", function () {
        $searchBox.val(place.name);
            showOverview(place);
        });
        $item.find(".remove-icon").on("click", function (e) {
            e.stopPropagation();
            const payload = {
                mongo_id: place.mongo_id,
                amenity_type: place.type
            };
            const endpoint = place.isHistory ? "remove_search_history/" : "remove_saved_location/";
            fetch(endpoint, {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
                },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                toastr.success(data.message || "Removed successfully.");
                $item.remove(); // Remove from UI
            })
            .catch(err => {
                console.error("Removal error:", err);
                toastr.error("Could not remove the item.");
            });
        });
        $suggestionBox.append($item);
    });
    $suggestionBox.show();
}

// Fetch saved locations on bookmark icon click, update global state, and render based on current view.


$(".bookmark-icon").on("click", function (e) {
    e.stopPropagation();
    fetch("save_location/", {
        method: "GET",
        headers: { "X-CSRFToken": getCookie("csrftoken") }
    })
    .then(res => res.json())
    .then(data => {
        const saved = data.saved || [];
        const places = saved.map(p => ({
            mongo_id: p.mongo_id,
            title: p.title,
            lat: p.latitude,
            lon: p.longitude,
            address: p.address,
            phone: p.phone_number,
            reviews: p.reviews || 0,
            rating: p.rating || 0,
            type: p.type,
            isBookmarked: true
        }));
        
        // Store it globally
        savedPlaces = places;
        bookmarkedPlaceIds = new Set(places.map(p => p.mongo_id));
            allFetchedPlaces = [...places];        
            const view = $(this).data("view") || "map";
            if (view === "list") {
                renderListView(places); 
            }
            else {
                showFilteredSuggestions("Saved Locations", place =>
                    places.find(p => p.lat === place.lat && p.lon === place.lon)
                );
            }
    })
    .catch(err => {
        console.error("Error fetching saved:", err);
        toastr.error("Could not fetch saved locations.");
    });
});

// Fetch and display recent search history on click.
$(".history-icon").on("click", function (e) {
    e.stopPropagation();
    fetch("search_history/", {
        method: "GET",
        headers: { "X-CSRFToken": getCookie("csrftoken") }
    })
    .then(res => res.json())
    .then(data => {
        const history = data.clicked_results || [];
        const places = history.map(p => ({
            mongo_id: p.mongo_id,
            title: p.title,
            lat: p.latitude,
            lon: p.longitude,
            address: p.address,
            phone: p.phone_number,
            reviews: p.reviews || 0,
            rating: p.rating || 0,
            type: p.type,
            isHistory: true
        }));

        // Store it globally
        searchHistory = places;
        allFetchedPlaces = [...places];        
        const view = $(this).data("view") || "map";
        if (view === "list") {
            renderListView(places); 
        }
        else {
            showFilteredSuggestions("Recent Locations", place =>
                places.find(p => p.lat === place.lat && p.lon === place.lon)
            );
        }
    })
    .catch(err => {
        console.error("Error fetching history:", err);
        toastr.error("Could not fetch recent searches.");
    });
});

    // Handle bookmark toggle: save location on click and update UI with feedback.
    $(document).on("click", ".bookmark-fill", function () {
        const $btn = $(this);
        const mongo_id = $btn.data("id");
        const type = $btn.data("type");
        if (!mongo_id || !type) return;
        fetch("save_location/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            body: JSON.stringify({ mongo_id, type })
            })
            .then(res => res.json())
            .then(data => {
            if (data.created) {
                $btn.html("bookmark");
                $btn.addClass(`material-filled text-${selectedColor}`);
                bookmarkedPlaceIds.add(mongo_id);
                toastr.error("Saved to bookmarks!");
            } else {
                bookmarkedPlaceIds.delete(mongo_id);
                toastr.info("Already bookmarked.");
            }
        })
        .catch(err => {
            console.error("Bookmarking error", err);
            toastr.error("Could not save bookmark.");
        });
        $(this).addClass(`material-filled text-${selectedColor}`);
    });
});