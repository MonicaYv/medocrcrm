$(document).ready(function () {
  // Toggle the related filter dropdown
  $('.filterToggle').click(function (e) {
    e.stopPropagation();
    const $container = $(this).closest('.dropdown');
    const $dropdown = $container.find('.filterDropdown');

    // Hide other dropdowns
    $('.filterDropdown').not($dropdown).hide();
    $('.filterDropdown .absolute').hide();

    // Toggle only the current one
    $dropdown.toggle();
  });

  // Show specific sub-filter inside dropdown
  $('.filterItem').click(function (e) {
    e.stopPropagation();
    const targetSelector = $(this).data('target');
    const $target = $(targetSelector);

    // Hide other absolute sub-sections
    $('.filterDropdown .absolute').not($target).hide();
    $target.toggle();
  });

  // Set priority and close dropdown
  $('.priority-option').on('click', function () {
    var selected = $(this).text();
    $('#priority').val(selected);
    $('.filterDropdown').hide();
  });

  // Close on outside click
  $(document).click(function () {
    $('.filterDropdown').hide();
    $('.filterDropdown .absolute').hide();
  });
});
