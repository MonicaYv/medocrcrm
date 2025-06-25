$(document).ready(function(){
    let today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    function generateMonthYearDropdown() {
        let monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        let startYear = currentYear - 50;
        let endYear = currentYear + 10;
        let options = "";

        for (let y = startYear; y <= endYear; y++) {
            for (let m = 0; m < 12; m++) {
                options += `<div class="px-3 py-2 hover:bg-gray-200 cursor-pointer" data-month="${m}" data-year="${y}">
                    ${monthNames[m]} ${y}
                </div>`;
            }
        }

        $('#dropdownContent').html(options);
        updateMonthYearLabel();
    }

    function updateMonthYearLabel() {
        let monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        $('#monthYearLabel').text(`${monthNames[currentMonth]} ${currentYear}`);
    }

    function renderCalendar(month, year) {
    $('#calendarDays').empty();

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let firstDay = new Date(year, month, 1).getDay();
    let daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        let date = new Date(year, month, day);
        let dayOfWeek = date.getDay();
        let dateStr = `${year}-${month + 1}-${day}`;
        let isToday = (day === today.getDate() && month === today.getMonth() && year === today.getFullYear());

        let classNames = `cursor-pointer p-2 rounded-full font-semibold h-10 w-10 bg-lightest-gray
            ${isToday ? '!bg-primary-color text-white' : 'hover:bg-primary-color hover:text-white'}`;

        $('#calendarDays').append(`
            <div class="flex flex-col items-center justify-center gap-1" data-date="${dateStr}">
                <div class="${classNames}">${day}</div>
                <div>${dayNames[dayOfWeek]}</div>
            </div>
        `);
    }

    updateMonthYearLabel();
    }

    $('#monthYearDropdown').click(function () {
        $('#dropdownContent').toggle();
    });

    $(document).on('click', '#dropdownContent div', function () {
        currentMonth = $(this).data('month');
        currentYear = $(this).data('year');
        $('#dropdownContent').hide();
        renderCalendar(currentMonth, currentYear);
    });

    $(document).click(function (e) {
        if (!$(e.target).closest('#monthYearDropdown').length) {
            $('#dropdownContent').hide();
        }
    });

    generateMonthYearDropdown();
    renderCalendar(currentMonth, currentYear);
    // Weather widget
    const apiKey = "644e87819e44a15ecfaed2d10aa30fa2";

    function fetchWeatherByCoords(lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    $.get(apiUrl, function (data) {
    const city = data.name;
    const country = data.sys.country;
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const weatherType = data.weather[0].main;

    const now = new Date();
    const hour = now.getHours();
    const isDay = hour >= 6 && hour < 18;
    const time = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

    const date = now.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });


    const sunIcon = `<img 
        src="/public/images/sun.svg" 
        alt="Sun Decoration" 
        class="md:ml-10" 
        loading="lazy" 
        />`;



    const moonIcon = `
    <div class="w-14 h-14 rounded-full bg-gray-300 shadow-inner relative">
        <div class="w-10 h-10 bg-black rounded-full absolute top-2 left-2"></div>
    </div>
    `;




    const html = `
    <div class="flex justify-between items-start w-full">
    <div class="flex flex-col items-start">
        <p class="text-lg text-white font-normal">${weatherType}</p>
        <p class="text-4xl font-bold text-white">${temp}°C</p>
    </div>
    <div class="text-right flex flex-col items-end">
    <p class="text-lg text-white font-normal">Humidity</p>
    <p class="text-4xl text-white font-bold">${humidity}%</p>
    </div>

    </div>

    <div class="mt-20 flex justify-between items-end w-full">
    <!-- Bottom Left: Sun + SVG -->
    <div class="relative flex flex-col items-start">
        ${ sunIcon}
        
        <!-- SVG aligned slightly above and right of the sun -->
        <span class="material-symbols-outlined absolute -top-9 -right-5 text-white !text-5xl"> sunny </span>
    </div>

    <!-- Bottom Right: Time, Date, Location -->
    <div class="text-right">
        <p class="text-lg font-normal  text-white">${time}</p>
        <p class="text-lg font-normal  text-white">${date}</p>
        <p class="text-lg font-normal text-white">${city}, ${country}</p>
    </div>
    </div>
    `;

    $("#weather-details").html(html);
    }).fail(function () {
    $("#weather-details").html("❌ Failed to fetch weather data.");
    });
    }

    $(document).ready(function () {
    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function (position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherByCoords(lat, lon);
        },
        function () {
        $("#weather-details").html("❌ Location access denied.");
        }
    );
    } else {
    $("#weather-details").html("❌ Geolocation not supported.");
    }
    });

    //New Ticket Section
   
    $(".file-upload-btn").click(function () {
        event.preventDefault();
        $(".successModal").removeClass("hidden").addClass("flex");;
    });
    
    $(".modal-close").click(function () {
        $(".successModal").removeClass("flex").addClass("hidden");
    }); 


    $('.issueToggle').click(function (e) {
        e.stopPropagation();
        $('.issueDropdown').toggle();
        $('.issueDropdown .absolute').hide(); 
      });
  
      $('.option').on('click', function () {
        var selected = $(this).text();
        $('#issue').val(selected);
        $('.issueDropdown').addClass('hidden');
      });
  
      $(document).click(function () {
        $('.issueDropdown').hide();
        $('.issueDropdown .absolute').hide();
      });



      //Success Popup
      $('.createTicket-btn').click(function() {
        $('#popup-modal').removeClass('hidden').addClass('opacity-0'); 
        setTimeout(function() {
          $('#popup-modal').removeClass('opacity-0').addClass('opacity-100'); 
        }, 50);  
      });
      $('[data-modal-hide="popup-modal"]').click(function() {
        $('#popup-modal').removeClass('opacity-100').addClass('opacity-0');
        setTimeout(function() {
          $('#popup-modal').addClass('hidden'); 
        }, 500);  
      });

      $('.assign-btn').click( function () {
        const container = $(this).closest('.action-container');
        container.find('.assign-input').removeClass('hidden');
        container.find('.assign-btn, .delete-btn, .view-btn').addClass('hidden');
      });
  
      $('.cancel-assign').on('click', function () {
        const container = $(this).closest('.action-container');
        container.find('.assign-input').addClass('hidden');
        container.find('.assign-btn, .delete-btn, .view-btn').removeClass('hidden');
      });


      $('.issue-item').on('click', function () {
        const chatId = $(this).data('chat-id');
  
        // 1. Show the correct chat-profile and hide others
        $('.chat-profile').addClass('hidden');
        $('.chat-profile[data-id="' + chatId + '"]').removeClass('hidden');
  
        // 2. Highlight selected issue-item
        $('.issue-item').removeClass('bg-snow-gray');
        $(this).addClass('bg-snow-gray');
      });
      $(document).on('click', function (event) {
        const $target = $(event.target);
      
        if (
          !$target.closest('.ticket-menu').length && 
          !$target.closest('.ticket-list').length
        ) {
          $('.ticket-list').addClass('hidden');
        }
      });
      
      $('.ticket-menu').on('click', function (e) {
        e.stopPropagation();
        $('.ticket-list').toggleClass('hidden');
      });
})