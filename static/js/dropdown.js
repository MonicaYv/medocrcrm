$(document).ready(function () {
  // Initialize the datepicker
  let customStartDate = null;
  let customEndDate = null;

  if ($.fn.datepicker) {
  $('.datepicker-inline').datepicker();

  const $hospitalDatepicker = $('.filterDropdown [data-filter="custom"]')
    .closest('.dropdown')
    .find('.datepicker-inline');

  if ($hospitalDatepicker.length) {
    $hospitalDatepicker.datepicker('option', 'dateFormat', 'yy-mm-dd');

    $hospitalDatepicker.datepicker('option', 'onSelect', function (dateText) {

      if (!customStartDate || customEndDate) {
        customStartDate = dateText;
        customEndDate = null;

        console.log("Custom Start Date:", customStartDate);

      } else {
        customEndDate = dateText;

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

    if (!$target.closest('.dropdown, .datepicker-container, .statusDropdown').length) {
      $('.filterDropdown').hide();
      $('.filterDropdown .absolute').hide();
      $('.datepicker-container').hide();
      $('.statusOptions').hide();
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
