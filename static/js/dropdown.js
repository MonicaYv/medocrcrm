$(document).ready(function () {
  // Initialize the datepicker
  let customStartDate = null;
  let customEndDate = null;
  let hospitalDateRangeToast = null;

  function clearHospitalDateRangeToast() {
    if (hospitalDateRangeToast && window.toastr) {
      window.toastr.clear(hospitalDateRangeToast);
      hospitalDateRangeToast = null;
    }
  }

  // Appointment pages own their date picker/filter through appointment.js
  // (AJAX + inline calendar). Skip the global/shared initialisation there so
  // the two handlers don't fight over .datepicker-container visibility and
  // onSelect behaviour.
  const isAppointmentPage = $('.appointment-page').length > 0;

  if ($.fn.datepicker && !isAppointmentPage) {
  $('.datepicker-inline').datepicker();

  const $hospitalDatepicker = $('.filterDropdown [data-filter="custom"]')
    .not('.points-chart-custom')
    .not('.help-filter-option')
    .not('[data-support-filter]')
    .closest('.dropdown')
    .find('.datepicker-inline');

  if ($hospitalDatepicker.length) {
    $hospitalDatepicker.datepicker('option', 'dateFormat', 'yy-mm-dd');
    $hospitalDatepicker.datepicker('option', 'changeMonth', true);
    $hospitalDatepicker.datepicker('option', 'changeYear', true);
    $hospitalDatepicker.datepicker('option', 'yearRange', '2000:2035');
    const isHospitalHomeDatepicker = $hospitalDatepicker
      .closest('.dropdown')
      .find('.hospital-home-filter').length > 0;

    $('.doctor-home-filter [data-filter="custom"]').on('click', function () {
      customStartDate = null;
      customEndDate = null;
    });

    $('.hospital-home-filter [data-filter="custom"]').on('click', function () {
      customStartDate = null;
      customEndDate = null;
      clearHospitalDateRangeToast();
    });

    $hospitalDatepicker.datepicker('option', 'onSelect', function (dateText) {

      if (!customStartDate || customEndDate) {
        customStartDate = dateText;
        customEndDate = null;

        console.log("Custom Start Date:", customStartDate);
        if (isHospitalHomeDatepicker && window.toastr) {
          clearHospitalDateRangeToast();
          hospitalDateRangeToast = window.toastr.info(
            "Please select an end date."
          );
        }
        if (
          $(this).closest(".dropdown").find(".doctor-home-filter").length &&
          typeof toastr !== "undefined"
        ) {
          toastr.info("Please select an end date.");
        }

      } else {
        customEndDate = dateText;
        if (isHospitalHomeDatepicker) {
          clearHospitalDateRangeToast();
        }

        // Rewards owns its date filtering through AJAX; don't reload the
        // settings page with date query parameters from this shared handler.
        if ($(this).closest('#rewards').length) {
          customStartDate = null;
          customEndDate = null;
          return;
        }

        if (customStartDate > customEndDate) {
          [customStartDate, customEndDate] = [
            customEndDate,
            customStartDate
          ];
        }

        console.log("Custom Start Date:", customStartDate);
        console.log("Custom End Date:", customEndDate);

        const url = new URL(window.location.href);

        url.searchParams.set("date_filter", "custom");
        url.searchParams.set("start_date", customStartDate);
        url.searchParams.set("end_date", customEndDate);

        window.location.href = url.toString();
      }
    });
  }
  }

  // Toggle filter dropdown
  $('.filterToggle').click(function (e) {
    // Lab dashboard filters use the class-based handler in home.js.
    if ($(this).closest('.dropdown').find('.lab-home-filter').length) return;
    // Hospital history owns its filter menus with class-based visibility.
    if ($('#historySearch').length) return;
    // Appointment pages manage their own filter dropdown visibility in
    // appointment.js (class-based). Skip the shared show/hide here so inline
    // styles don't permanently hide the picker.
    if ($(this).closest('.appointment-page').length) return;
    e.stopPropagation();
    const $container = $(this).closest('.dropdown');
    const $dropdown = $container.find('.filterDropdown');

    $('.filterDropdown').not($dropdown).hide();
    $('.filterDropdown .absolute').hide();
    $('.datepicker-container').hide(); // Also hide datepickers
    $dropdown.toggle();
  });

  // Toggle datepicker (calendar icon click) – this MUST come BEFORE document click!
  $('.calendar-icon').click(function (e) {
    // Appointment pages manage their own picker in appointment.js.
    if ($(this).closest('.appointment-page').length) return;
    // Lab reports manage a guided two-date inline picker in lab-reports.js.
    if ($(this).closest('.lab-report-filter').length) return;
    // The lab dashboard handles its custom range in home.js, including
    // opening the picker and resetting the selected range.
    if ($(this).closest('.lab-home-filter').length) return;
    // Hospital Overview also opens its custom picker from the filter row.
    if ($(this).closest('.hospital-home-filter').length) return;
    // Date-filter options are owned by their page-specific delegated handlers.
    if ($(this).closest('[data-date-filter]').length) return;
    if ($(this).closest('.organization-daterange').length) return;
    if ($(this).closest('.allRewardsCoupons').length ||
        $(this).closest('#rewards').length) {
        return;
    }
    e.stopPropagation();
    const $container = $(this).closest('.dropdown');
    const $datepicker = $container.find('.datepicker-container');

    $('.datepicker-container').not($datepicker).hide();
    $datepicker.toggle();
  });

  // Status dropdown logic
  $('.statusDropdown').each(function () {
    const $dropdown = $(this);
    const $selected = $dropdown.find('.selectedStatus');
    const $options = $dropdown.find('.statusOptions');
    const $label = $dropdown.find('.status-label');

    $selected.on('click', function () {
      $('.statusOptions').not($options).hide();
      $options.toggle();
    });

    $options.find('div').on('click', function () {
      const selectedText = $(this).text();
      const bgClass = $(this).attr('class').match(/bg-[^\s]+/)[0];
      const textClass = $(this).attr('class').match(/text-[^\s]+/)[0];

      $label.text(selectedText);
      $selected.removeClass(function (i, className) {
        return (className.match(/(bg|text)-[^\s]+/g) || []).join(' ');
      }).addClass(`${bgClass} ${textClass}`);

      $options.hide();
    });
  });

  // Hide all dropdowns when clicking outside 
  $(document).on('click', function (e) {
    const $target = $(e.target);
    const eventPath = e.originalEvent?.composedPath?.() || [];
    const clickedMonthNavigation = eventPath.some((node) =>
      node instanceof Element && node.matches('.ui-datepicker-prev, .ui-datepicker-next')
    );

    // jQuery UI redraws the clicked arrow before this document handler runs,
    // detaching it from the picker. Use the original click path to keep it open.
    if (clickedMonthNavigation) return;

    // Hospital history closes its own menus; inline display styles here would
    // prevent its class-based filter from reopening after an outside click.
    if ($('#historySearch').length) return;

    if (!$target.closest('.dropdown, .datepicker-container, .ui-datepicker, .statusDropdown').length) {
      // Appointment pages use class-based visibility; don't inject inline
      // display:none that appointment.js can't clear.
      $('.filterDropdown').not('.appointment-page .filterDropdown').hide();
      $('.filterDropdown .absolute').hide();
      $('.datepicker-container').not('.appointment-page .datepicker-container').hide();
      $('.statusOptions').hide();
      $('.appointment-page .filterDropdown, .appointment-page .datepicker-container').addClass('hidden');
    }
  });
// $('td[data-handler="selectDay"]').off('click').on('click', function() {
//       var clickedTd = $(this);
//       var clickedA = clickedTd.find('a');
//       var day = clickedA.text().toString().padStart(2, '0');
//       var month = clickedTd.data('month');
//       var year = clickedTd.data('year');
//       month = (month + 1).toString().padStart(2, '0');
//       var fullDate = year + '-' + month + '-' + day;
//       $('td[data-handler="selectDay"] a').removeClass('ui-state-active');
//       clickedA.addClass('ui-state-active');
//   });
});
