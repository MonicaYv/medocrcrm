// 1 variable with multiple theme colors
const themeColors = {
  customers: 'vivid-orange',
  Advertiser: 'living-coral',
  NGO:'violet-sky',
  pharmacy:'light-sea-green',
  client:'dark-blue'
};

// Get the current path
const path = window.location.pathname;

// Default color
let selectedColor = '#F79E1B';
let bgColor;

// Loop and match theme by keyword in path
$.each(themeColors, function(keyword, color) {
  if (path.includes(keyword)) {
    selectedColor = color;
    bgColor = selectedColor == "vivid-orange" 
    ? "#F79E1B" 
    : selectedColor == "living-coral" 
    ? "#FF6F61" 
    : selectedColor == "light-sea-green"
    ? "#3AAFA9"
    : selectedColor == "dark-blue"
    ? "#123456"
    : "#6B79F5";
    return false;
  }
});

// Declare global variables for map, location coordinates, markers, and places
let map;
let currentLat, currentLon;
let activeMarkers = [];
let allFetchedPlaces = [];

// Define tags to query different types of healthcare amenities
const amenityTags = {
  hospital: 'hospital',
  doctor: 'doctors',
  pharmacy: 'pharmacy',
  lab: 'laboratory'
};

// Define custom Leaflet icons for different amenity types
const icons = {
  hospital: L.icon({
    iconUrl: '/public/images/hospital-marker.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  }),
  doctor: L.icon({
    iconUrl: '/public/images/doctor-marker.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  }),
  pharmacy: L.icon({
    iconUrl: '/public/images/pharmacy-marker.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  }),
  lab: L.icon({
    iconUrl: '/public/images/lab-marker.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  })
};

$(document).ready(function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showLocation, showError);
  } else {
    window.showToaster('error', 'Geolocation not supported by your browser.');
  }

  // Initialize map with user's location
  function showLocation(position) {
    currentLat = position.coords.latitude;
    currentLon = position.coords.longitude;

    map = L.map("map").setView([currentLat, currentLon], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    L.marker([currentLat, currentLon])
      .addTo(map)
      .bindPopup("You are here")
      .openPopup();
  }

  function showError(error) {
    window.showToaster('error', "Error getting location: " + error.message);
  }

  function clearMarkers() {
    activeMarkers.forEach(marker => map.removeLayer(marker));
    activeMarkers = [];
  }

  // Fetch healthcare places from Overpass API
  function fetchPlaces(type, buttonElement) {
    $(".map-search-btn").removeClass(function(index, className) {
      return (className.match(/(^|\s)bg-\S+/g) || []).join(' ');
    });
    $(".map-search-btn").removeAttr("style");
    $(buttonElement).css('background-color', bgColor);
    $(buttonElement).css('color', 'white');

    if (!currentLat || !currentLon) {
      window.showToaster('error', "Location not yet available");
      return;
    }

    clearMarkers();
    allFetchedPlaces = [];

    const amenity = amenityTags[type];
    const overpassUrl = `
      https://overpass-api.de/api/interpreter?data=[out:json];
      node[amenity=${amenity}](around:5000,${currentLat},${currentLon});
      out body;
    `;

    // Make a request to Overpass API
    $.getJSON(overpassUrl.trim(), function (data) {
      if (data?.elements?.length > 0) {
        data.elements.forEach((element) => {
          if (element.lat && element.lon) {
            const tags = element.tags || {};
            const name = tags.name || `Unnamed ${type}`;
            const address = `${tags["addr:street"] || ""} ${tags["addr:housenumber"] || ""}`.trim();
            const phone = tags["contact:phone"] || tags.phone || "";
            const place = {
              name,
              type,
              lat: element.lat,
              lon: element.lon,
              address,
              phone,
              reviews: []
            };
            allFetchedPlaces.push(place);

            const popupContent = `
              <strong>${name}</strong><br>
              ${address ? address + "<br>" : ""}
              Phone: ${phone}
            `;

            const marker = L.marker([element.lat, element.lon], { icon: icons[type] })
              .addTo(map)
              .bindPopup(popupContent);
            activeMarkers.push(marker);
          }
        });
      } else {
        window.showToaster('error', `No ${type}s found nearby.`);
      }
    }).fail(() => {
      window.showToaster('error', `Failed to load nearby ${type}s.`);
    });
  }

  // Event handlers for amenity buttons
  $(".map-search-btn:contains('Hospital')").on("click", function () {
    fetchPlaces("hospital", this);
  });
  $(".map-search-btn:contains('Doctor')").on("click", function () {
    fetchPlaces("doctor", this);
  });
  $(".map-search-btn:contains('Pharmacy')").on("click", function () {
    fetchPlaces("pharmacy", this);
  });
  $(".map-search-btn:contains('Lab')").on("click", function () {
    fetchPlaces("lab", this);
  });

  // Handle view toggling between map and list
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

  // Handle text search input
  const $searchBox = $(".map-view input[type='text']");
  const $suggestionBox = $("<div class='mt-14 max-h-56 xl:max-h-96 overflow-y-auto scroll'></div>").hide();
  $(".suggestion").append($suggestionBox);

  const $bookmarkIcon = $(".bookmark-icon");
  const $historyIcon = $(".history-icon");
  const $closeIcon = $(".close-icon");

  let routingControl;

  $searchBox.on("input", function () {
    $(".map-search").css('background-color', bgColor);
    const query = $(this).val().toLowerCase();
    $suggestionBox.empty();

    if (query) {
      $bookmarkIcon.addClass("!hidden");
      $historyIcon.addClass("!hidden");
      $closeIcon.removeClass("!hidden");
      $(".map-search").addClass("placeholder:text-white");
      $(".map-search,.search,.close-icon").addClass("text-white");
    } else {
      $bookmarkIcon.removeClass("!hidden");
      $historyIcon.removeClass("!hidden");
      $closeIcon.addClass("!hidden");
      $(".map-search").removeAttr("style");
      $(".map-search,.search,.close-icon").removeClass("text-white");
      $(".map-search").removeClass("placeholder:text-white");
      $suggestionBox.hide();
      return;
    }
    const matches = allFetchedPlaces.filter(place =>
      place.name.toLowerCase().includes(query)
    );

    // Render each suggestion result
    if (matches.length > 0) {
      matches.forEach(place => {
        const avgRating = place.reviews.length
          ? (place.reviews.reduce((sum, r) => sum + r.rating, 0) / place.reviews.length).toFixed(1)
          : null;

        const stars = avgRating
          ? '★'.repeat(Math.floor(avgRating)) + '☆'.repeat(5 - Math.floor(avgRating))
          : '★★★☆☆';

        const $item = $(`
          <div class="px-4 py-3 border-b border-${selectedColor} last:border-b-0 cursor-pointer transition-all hover:bg-opacity-10">
            <div class="flex flex-col gap-2">
              <p class="text-lg font-semibold">${place.name}</p>
              <p class="flex gap-2 items-center"> 4.3 <span class="text-xl text-${selectedColor}">${avgRating ? stars + ` (${avgRating})` : stars}</span> (3,734)</p>
              <p>Hospital</p>
              <p class="text-sm">${place.address || "Flat No. 7, 11th Floor, Chembur, Mumbai"}</p>
              <p class="text-sm">${place.phone ||"+91 9234398042"}</p>
              <p class="text-sm">${place.email || "monika@ocrpharma.net"}</p>
            </div>
            <div class="ml-4 flex justify-between mt-2">
              <button class="flex flex-col gap-2 text-xs cursor-pointer" data-lat="${place.lat}" data-lon="${place.lon}">
                <span class='material-symbols-outlined !text-xl'>directions</span><span>Directions</span>
              </button>
              <a href="tel:${place.phone}" title="Call" class="flex flex-col gap-2 text-xs cursor-pointer">
                <span class='material-symbols-outlined !text-xl'>call</span><span>Call</span></a>
              <button class="flex flex-col gap-2 text-xs cursor-pointer" data-name="${encodeURIComponent(place.name)}">
                <span class='material-symbols-outlined !text-xl'>share</span><span>Share</span>
              </button>
            </div>
          </div>
        `);

        // Directions button
        $item.find("button:contains('Directions')").on("click", function (e) {
          e.stopPropagation();
          const lat = $(this).data("lat");
          const lon = $(this).data("lon");

          if (routingControl) {
            map.removeControl(routingControl);
          }

          navigator.geolocation.getCurrentPosition(function (position) {
            const userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);
            const destinationLatLng = L.latLng(lat, lon);

            if (routingControl) {
              map.removeControl(routingControl);
            }

            for (let i in map._layers) {
              const layer = map._layers[i];
              if (layer instanceof L.Marker && !layer._icon.classList.contains('leaflet-routing-icon')) {
                map.removeLayer(layer);
              }
            }

            routingControl = L.Routing.control({
              waypoints: [userLatLng, destinationLatLng],
              lineOptions: {
                styles: [{ color: bgColor, weight: 6, opacity: 0.8 }]
              },
              show: false,
              addWaypoints: false,
              routeWhileDragging: false,
              draggableWaypoints: false,
              fitSelectedRoutes: true,
              createMarker: function(i, waypoint) {
                return L.marker(waypoint.latLng);
              }
            }).addTo(map);

            const directionsHtml = `
              <div class="px-4 py-3 suggestion-detail">
                <div class="h-32 w-full bg-cover bg-center" 
                    style="background-image: url('${place.imageUrl || "/public/images/hospital.svg"}')">
                </div>
                <div class="flex flex-col gap-2 mt-2">
                  <div class="flex justify-between">
                    <p class="text-xl font-bold">${place.name}</p>
                    <span class="material-symbols-outlined bookmark-fill cursor-pointer">bookmark</span>
                  </div>
                  ${place.address ? `<p class="text-sm">${place.address}</p>` : ""}
                  ${place.phone ? `<p class="text-sm">${place.phone}</p>` : ""}
                  <p class="flex gap-2 items-center"> 4.3 <span class="text-xl text-${selectedColor}">${avgRating ? stars + ` (${avgRating})` : stars}</span></p>
                  <p>General Hospital</p>
                </div>
                <!-- Tabs -->
                <div class="flex my-5 justify-between">
                  <button class="tab-button cursor-pointer text-sm px-4 py-2 focus:outline-none hover:text-${selectedColor} flex flex-col" style="border-color: ${bgColor}; color: ${bgColor};" data-tab="best">
                    <span class="material-symbols-outlined">directions</span>Best
                  </button>
                  <button class="tab-button cursor-pointer text-sm px-4 py-2 focus:outline-none hover:text-${selectedColor} flex flex-col" data-tab="car">
                    <span class="material-symbols-outlined">directions_car</span>Car
                  </button>
                  <button class="tab-button cursor-pointer text-sm px-4 py-2 focus:outline-none hover:text-${selectedColor} flex flex-col" data-tab="bike">
                    <span class="material-symbols-outlined">two_wheeler</span>Bike
                  </button>
                  <button class="tab-button cursor-pointer text-sm px-4 py-2 focus:outline-none hover:text-${selectedColor} flex flex-col" data-tab="walk">
                    <span class="material-symbols-outlined">directions_walk</span>Waliking
                  </button>
                </div>
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

                  <div class="flex flex-col gap-4">
                    <div class="flex items-start justify-between">
                      <div class="border-l-2 pl-1 border-${selectedColor}">
                        <span class="material-symbols-outlined text-${selectedColor}">two_wheeler</span>
                      </div>
                      <div class="flex flex-col">
                        <span class="font-medium">Via String Rd</span>
                        <div class="text-xs">Fastest route. the usual traffic</div>
                      </div>
                      <div class="flex flex-col">
                          <span class="text-${selectedColor} font-semibold">4 min</span>
                          <div class="text-xs text-light-gray">1.3km</div>
                      </div>
                    </div>
                    <div class="flex items-start justify-between">
                      <span class="material-symbols-outlined pl-1">two_wheeler</span>
                      <div class="flex flex-col">
                        <span class="font-medium">Via String Rd</span>
                        <div class="text-xs">Fastest route. the usual traffic</div>
                      </div>
                      <div class="flex flex-col">
                          <span class="text-${selectedColor} font-semibold">4 min</span>
                          <div class="text-xs text-light-gray">1.3km</div>
                      </div>
                    </div>
                    <div class="flex items-start justify-between">
                      <span class="material-symbols-outlined pl-1">two_wheeler</span>
                      <div class="flex flex-col">
                        <span class="font-medium">Via String Rd</span>
                        <div class="text-xs">Fastest route. the usual traffic</div>
                      </div>
                      <div class="flex flex-col">
                          <span class="text-${selectedColor} font-semibold">4 min</span>
                          <div class="text-xs text-light-gray">1.3km</div>
                      </div>
                    </div>
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

            $suggestionBox.fadeOut(100, () => {
              $suggestionBox.html(directionsHtml).fadeIn(150);
            });
          });
        });

        // Click on a result shows overview
        $item.on("click", function () {
          $searchBox.val(place.name);

          const overviewHtml = `
            <div class="px-4 py-3 suggestion-detail">
              <div class="h-32 w-full bg-cover bg-center" 
                  style="background-image: url('${place.imageUrl || "/public/images/hospital.svg"}')">
              </div>
              <div class="flex flex-col gap-2 mt-2">
                <div class="flex justify-between">
                  <p class="text-xl font-bold">${place.name}</p>
                  <span class="material-symbols-outlined bookmark-fill cursor-pointer">bookmark</span>
                </div>
                ${place.address ? `<p class="text-sm">${place.address}</p>` : ""}
                ${place.phone ? `<p class="text-sm">${place.phone}</p>` : ""}
                <p class="flex gap-2 items-center"> 4.3 <span class="text-xl text-${selectedColor}">${avgRating ? stars + ` (${avgRating})` : stars}</span></p>
                <p>General Hospital</p>
              </div>
              <!-- Tabs -->
              <div class="flex mb-3">
                <button class="tab-button cursor-pointer text-sm px-4 py-2 focus:outline-none border-b-2 border-transparent hover:!border-${selectedColor}" style="border-color: ${bgColor}; color: ${bgColor};" data-tab="overview">Overview</button>
                <button class="tab-button cursor-pointer text-sm px-4 py-2 focus:outline-none border-b-2 border-transparent hover:!border-${selectedColor}" data-tab="timings">Timings</button>
              </div>
              <div class="tab-content" id="overview">
                <div class="ml-4 flex justify-between mt-2">
                  <button class="flex flex-col gap-2 text-xs cursor-pointer" data-lat="${place.lat}" data-lon="${place.lon}">
                    <span class='material-symbols-outlined !text-xl'>directions</span><span>Directions</span>
                  </button>
                  <a href="tel:${place.phone}" title="Call" class="flex flex-col gap-2 text-xs cursor-pointer">
                    <span class='material-symbols-outlined !text-xl'>call</span><span>Call</span></a>
                  <button class="flex flex-col gap-2 text-xs cursor-pointer" data-name="${encodeURIComponent(place.name)}">
                    <span class='material-symbols-outlined !text-xl'>share</span><span>Share</span>
                  </button>
                </div>
                <div class="flex flex-col gap-2 text-sm mt-4">
                  <p class="flex gap-2">                  
                    <span class="material-symbols-outlined text-${selectedColor}">location_on</span>
                    flat no.7, 11th floor, Chembur, Mumbai.
                  </p>
                  <p class="flex gap-2">                  
                    <span class="material-symbols-outlined text-${selectedColor}">call</span>
                    +91 9234398042
                  </p>
                  <p class="flex gap-2">                  
                    <span class="material-symbols-outlined text-${selectedColor}">mail</span>
                    monika@ocrpharma.net
                  </p>
                  <p class="text-base">Services</p>
                  <p>Ambulance Service</p>
                  <p>Anaesthesiology</p>
                  <p>Cancer</p>
                  <p>Dental Services</p>
                  <p>Emergency Care</p>
                </div>
              </div>
              <div class="tab-content hidden" id="timings">
                <p>Open Now</p>
                <ul class="text-sm flex flex-col gap-2 mt-2">
                  <li class="flex justify-between">Monday <span>Open 24 hours</span></li>
                  <li class="flex justify-between">Tuesday <span>Open 24 hours</span></li>
                  <li class="flex justify-between">Wednesday <span>Open 24 hours</span></li>
                  <li class="flex justify-between">Thursday <span>Open 24 hours</span></li>
                  <li class="flex justify-between">Friday <span>Open 24 hours</span></li>
                  <li class="flex justify-between">Saturday <span>Open 24 hours</span></li>
                  <li class="flex justify-between">Sunday <span>Open 24 hours</span></li>
                </ul>
              </div>
            </div>
          `;

          $suggestionBox.on('click', '.tab-button', function () {
            const tab = $(this).data('tab');

            $suggestionBox.find('.tab-button').removeAttr("style");
            $(this).css({'border-color': bgColor, 'color':bgColor});
            $suggestionBox.find('.tab-content').addClass('hidden');
            $suggestionBox.find(`#${tab}`).removeClass('hidden');
          });


          $suggestionBox.fadeOut(100, () => {
            $suggestionBox.html(overviewHtml).fadeIn(150);
          });

          map.setView([place.lat, place.lon], 17);
          L.popup()
            .setLatLng([place.lat, place.lon])
            .setContent(`<strong>${place.name}</strong>${place.address ? `<br>${place.address}` : ""}`)
            .openOn(map);

          $suggestionBox.on("click", "#backToSuggestions", () => {
            $searchBox.trigger("input");
          });

          $suggestionBox.on("click", "#overviewDirections", function () {
            const lat = $(this).data("lat");
            const lon = $(this).data("lon");

            if (routingControl) map.removeControl(routingControl);

            navigator.geolocation.getCurrentPosition(function (position) {
              const userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);
              const destinationLatLng = L.latLng(lat, lon);

              routingControl = L.Routing.control({
                waypoints: [userLatLng, destinationLatLng],
                lineOptions: { styles: [{ color: '#f26522', weight: 6 }] },
                show: false, addWaypoints: false, routeWhileDragging: false,
                draggableWaypoints: false, fitSelectedRoutes: true,
                createMarker: function (i, waypoint) {
                  return L.marker(waypoint.latLng, {
                    icon: L.icon({
                      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                    }),
                  });
                }
              }).addTo(map);
            });
          });

          $suggestionBox.on("click", "#overviewShare", function () {
            const url = `${window.location.origin}?place=${$(this).data("name")}`;
            navigator.clipboard.writeText(url);
            window.showToaster('error', "Place link copied to clipboard!");
          });
        });

        $suggestionBox.append($item);
      });

      // Add filter dropdown
      $suggestionBox.prepend(`<div class='flex justify-between p-2 border-b border-${selectedColor}'>
        <span>Suggestion</span>
        <div class="relative">
          <span class="material-symbols-outlined cursor-pointer filterToggle">swap_vert</span>
          <div class="filterDropdown absolute right-0 mt-2 w-28 rounded-lg shadow-lg hidden z-50 bg-snow-gray p-2">
            <div class="relative">
              <p class="text-base font-normal cursor-pointer hover:bg-white p-2 filterItem" data-target="#sort">
                Sort by
              </p>
              <div id="sort" class="absolute right-full top-0 mr-2 w-38 rounded-lg shadow-lg bg-white p-2 hidden z-50">
                <p class="text-base font-normal p-2 cursor-pointer flex items-center gap-2">
                  <span class="material-symbols-outlined">check</span>
                  Open
                </p>
                <p class="text-base font-normal p-2 cursor-pointer flex items-center gap-2">
                  <span class="material-symbols-outlined">check</span>
                  Closed
                </p>
                <p class="text-base font-normal p-2 cursor-pointer flex items-center gap-2">
                  <span class="material-symbols-outlined">check</span>
                  Directions
                </p>
              </div>
            </div>
            <div class="relative">
              <p class="text-base font-normal cursor-pointer hover:bg-white p-2 filterItem" data-target="#service">
                Services
              </p>
              <div id="service" class="absolute right-full top-0 mr-2 w-38 rounded-lg shadow-lg bg-white p-2 hidden z-50">
                <p class="text-base font-normal p-2 cursor-pointer flex items-center gap-2">
                  <span class="material-symbols-outlined">check</span>
                  Open
                </p>
                <p class="text-base font-normal p-2 cursor-pointer flex items-center gap-2">
                  <span class="material-symbols-outlined">check</span>
                  Closed
                </p>
                <p class="text-base font-normal p-2 cursor-pointer flex items-center gap-2">
                  <span class="material-symbols-outlined">check</span>
                  Directions
                </p>
              </div>
            </div>          
          </div>
        </div>
      </div>`);
      $suggestionBox.show();
    } else {
      $suggestionBox.show();
      $suggestionBox.html("<p class='p-2'>No Suggestion Found...</p>");
    }
  });
  $closeIcon.on("click", function () {
    $searchBox.val("").trigger("input");
    $suggestionBox.hide();
  });

  // Filter dropdown toggle behavior
  $(document).on('click', '.filterToggle', function (e) {
    e.stopPropagation();
    const $dropdown = $(this).siblings('.filterDropdown');
    $('.filterDropdown').not($dropdown).hide();
    $dropdown.toggle();
    $dropdown.find('.absolute').hide(); 
  });

  $(document).on('click', '.filterItem', function (e) {
    e.stopPropagation();
    const target = $($(this).data('target'));
    $('.filterDropdown .absolute').not(target).hide(); 
    target.toggle();
  });

  $(document).on("click", function (e) {
    if (!$(e.target).closest(".map-view").length) {
      $suggestionBox.hide();
    }
  });

  // Handle Bookmark Click
  $(".bookmark-icon").on("click", function (e) {
    e.stopPropagation();
    showFilteredSuggestions("Saved Locations", place => place.isBookmarked);
  });

  // Handle History Click
  $(".history-icon").on("click", function (e) {
    e.stopPropagation();
    showFilteredSuggestions("Recent Locations", place => place.isHistory);
  });

  // Reusable function for rendering filtered suggestions
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
        const avgRating = place.reviews.length
          ? (place.reviews.reduce((sum, r) => sum + r.rating, 0) / place.reviews.length).toFixed(1)
          : null;

        const stars = avgRating
          ? '★'.repeat(Math.floor(avgRating)) + '☆'.repeat(5 - Math.floor(avgRating))
          : '★★★☆☆';

        const $item = $(`<div class="px-4 py-3 border-b border-${selectedColor} cursor-pointer transition-all hover:bg-opacity-10">
          <div class="flex flex-col gap-2">
            <p class="text-lg font-semibold">${place.name}</p>
            <p class="flex gap-2 items-center"><span class="text-xl text-${selectedColor}">${avgRating ? stars + ` (${avgRating})` : stars}</span></p>
            <p class="text-sm text-light-gray">${place.address || "Unknown address"}</p>
          </div>
        </div>`);

        $item.on("click", function () {
          $searchBox.val(place.name);
        });

        $suggestionBox.append($item);
      });

      $suggestionBox.show();
  }

  // List view behavior
  $('.cards').addClass('hidden');
  $('.list-search-btn').on('click', function () {
    $(".list-search-btn").removeClass(function(index, className) {
      return (className.match(/(^|\s)bg-\S+/g) || []).join(' ');
    });
    $(".list-search-btn").removeAttr("style");
    $(this).css('background-color', bgColor);
    $(this).css('color', 'white');
    $('.placeholder').addClass('hidden');
    $('.cards').removeClass('hidden');
  });

  // Pagination logic for list view
  const cardsPerPage = 3;
  const cards = $(".places-card");
  const totalCards = cards.length;
  const totalPages = Math.ceil(totalCards / cardsPerPage);

  function showPage(page) {
    cards.hide();
    const start = (page - 1) * cardsPerPage;
    const end = start + cardsPerPage;
    cards.slice(start, end).show();

    $("#pagination button").removeClass("font-semibold").removeAttr("style");
    $(`#pagination button[data-page='${page}']`).addClass("font-semibold").css({"background-color":bgColor, "color":"white"});
  }

  let paginationHTML = `
    <div class="flex items-center gap-4">
      <p class="text-dark-gray cursor-pointer" id="prev">Previous</p>
  `;

  for (let i = 1; i <= totalPages; i++) {
    paginationHTML += `
      <button 
        data-page="${i}" 
        class="px-4 py-2 rounded-lg cursor-pointer bg-pagination text-jet-black hover:!bg-${selectedColor} hover:transition"
      >
        ${i}
      </button>
    `;
  }

  paginationHTML += `
      <p class="text-dark-gray cursor-pointer" id="next">Next</p>
    </div>
  `;

  $("#pagination").html(paginationHTML);

  $("#pagination").on("click", "button", function () {
    const page = $(this).data("page");
    currentPage = page;
    showPage(page);
  });

  let currentPage = 1;

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
  $(document).on("click", ".bookmark-fill", function () {
    $(this).addClass(`material-filled text-${selectedColor}`);
  });
});